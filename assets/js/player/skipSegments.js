/**
 * TVZINHA ONLINE - Skip segments (opening, recap, ending) for the native player.
 *
 * Source: AniSkip (api.aniskip.com), keyed by the MyAnimeList entry and the episode number inside it, the same pair
 * /api/resolve returns in `aniskip` for the anime player. Called straight from the browser (open CORS), so it costs no
 * Cloudflare invocation. The data is crowd-sourced: `episodeLength` makes AniSkip drop timings recorded on a cut of a
 * different length than the video we are playing.
 */

const ANISKIP_API = 'https://api.aniskip.com/v2/skip-times';
const ANISKIP_TYPES = ['op', 'ed', 'mixed-op', 'mixed-ed', 'recap'];
const ANISKIP_TIMEOUT_MS = 6000;
// AniSkip type -> our type
const TYPE_MAP = { op: 'intro', 'mixed-op': 'intro', recap: 'recap', ed: 'outro', 'mixed-ed': 'outro' };
// Shorter ranges are noise (mis-clicks in the submission tool)
const MIN_SEGMENT_S = 5;
// Where each part can plausibly be. Submissions are not reviewed and some are simply wrong (an "ending" in the middle
// of the episode, right after the opening): anything outside these bounds is dropped.
// maxStart/minStart are shares of the video length; minLength/maxLength are seconds.
const PLAUSIBLE = {
    intro: { maxStart: 0.4, minLength: 20, maxLength: 240 },
    recap: { maxStart: 0.25, minLength: MIN_SEGMENT_S, maxLength: 180 },
    outro: { minStart: 0.6, minLength: 20, maxLength: 240 },
};

function isPlausible(seg, duration) {
    const rule = PLAUSIBLE[seg.type];
    const length = seg.end - seg.start;
    if (length < rule.minLength || length > rule.maxLength) return false;
    if (!Number.isFinite(duration)) return true;
    if (rule.maxStart !== undefined && seg.start > duration * rule.maxStart) return false;
    if (rule.minStart !== undefined && seg.start < duration * rule.minStart) return false;
    return true;
}

// A cut this close to our video is the same cut; up to the tolerance it is used, with approximate times
const EXACT_CUT_S = 10;
const ANY_CUT_TOLERANCE_S = 30;

const cache = new Map();

/**
 * Cleans a list of { type, start, end } for a video of `duration` seconds: clamps to the video, drops tiny ranges and
 * ranges in impossible places, keeps one range per type (the earliest) and removes overlaps. Sorted by start.
 */
export function normalizeSkipSegments(list, duration) {
    const limit = Number.isFinite(duration) && duration > 0 ? duration : Infinity;
    const byType = new Map();
    for (const item of Array.isArray(list) ? list : []) {
        const type = item && item.type;
        if (type !== 'intro' && type !== 'recap' && type !== 'outro') continue;
        const start = Math.max(0, Number(item.start));
        const end = Math.min(limit, Number(item.end));
        if (!Number.isFinite(start) || !Number.isFinite(end) || end - start < MIN_SEGMENT_S) continue;
        if (!isPlausible({ type, start, end }, limit)) continue;
        const kept = byType.get(type);
        if (!kept || start < kept.start) byType.set(type, { type, start, end, approx: Boolean(item.approx) });
    }
    const sorted = [...byType.values()].sort((a, b) => a.start - b.start);
    const result = [];
    for (const seg of sorted) {
        const prev = result[result.length - 1];
        if (prev && seg.start < prev.end) {
            // Overlap: the later range starts where the earlier one ends
            seg.start = prev.end;
            if (seg.end - seg.start < MIN_SEGMENT_S) continue;
        }
        result.push(seg);
    }
    return result;
}

/** AniSkip results for one episode; `length` 0 asks for the best-voted submissions of any cut. */
async function requestAniSkip(mal, ep, length) {
    const params = new URLSearchParams();
    ANISKIP_TYPES.forEach(t => params.append('types[]', t));
    params.set('episodeLength', String(length));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ANISKIP_TIMEOUT_MS);
    try {
        const res = await fetch(`${ANISKIP_API}/${mal}/${ep}?${params}`, { signal: controller.signal });
        // 404 is AniSkip's "no skip times found"
        if (!res.ok) return [];
        const data = await res.json();
        return data && Array.isArray(data.results) ? data.results : [];
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Picks one submission per part (opening, recap, ending) for a video of `duration` seconds.
 * `matched` came back for this exact length (AniSkip only returns cuts within a few seconds of it); `any` holds the
 * best-voted submissions of every cut. Dubbed or re-encoded videos are often 20-30 s off the cut people timed, so a
 * part missing from `matched` is taken from `any` when its cut is at most ANY_CUT_TOLERANCE_S away. Its times may
 * then be a few seconds off: such a range is flagged `approx` (no "Pular encerramento", only "Próximo episódio").
 */
export function pickAniSkipResults(matched, any, duration) {
    const chosen = new Map();
    for (const r of matched) {
        const type = TYPE_MAP[r.skipType];
        if (type && !chosen.has(type)) chosen.set(type, { r, approx: false });
    }
    const fallback = new Map();
    for (const r of any) {
        const type = TYPE_MAP[r.skipType];
        const diff = Math.abs(Number(r.episodeLength) - duration);
        if (!type || chosen.has(type) || !(diff <= ANY_CUT_TOLERANCE_S)) continue;
        const best = fallback.get(type);
        if (!best || diff < best.diff) fallback.set(type, { r, diff, approx: diff > EXACT_CUT_S });
    }
    fallback.forEach((value, type) => chosen.set(type, value));
    return [...chosen.entries()].map(([type, { r, approx }]) => ({
        type,
        start: r.interval && r.interval.startTime,
        end: r.interval && r.interval.endTime,
        approx,
    }));
}

/**
 * Opening/recap/ending of an anime episode, or [] when AniSkip has nothing that fits this video.
 * Never throws: a failure only means no markers.
 */
export async function fetchAniSkipSegments({ malId, episode, duration }) {
    const mal = parseInt(malId, 10);
    const ep = parseInt(episode, 10);
    if (!(mal > 0) || !(ep > 0) || !(duration > 0)) return [];
    const length = Math.round(duration);
    const key = `${mal}_${ep}_${length}`;
    if (cache.has(key)) return cache.get(key);

    const pending = (async () => {
        try {
            const [matched, any] = await Promise.all([requestAniSkip(mal, ep, length), requestAniSkip(mal, ep, 0)]);
            return normalizeSkipSegments(pickAniSkipResults(matched, any, duration), duration);
        } catch (e) {
            cache.delete(key);
            return [];
        }
    })();
    cache.set(key, pending);
    return pending;
}
