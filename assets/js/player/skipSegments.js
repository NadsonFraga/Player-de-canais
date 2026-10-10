/**
 * TVZINHA ONLINE - Skip segments (opening, recap, ending) for the native player.
 *
 * Anime: AniSkip (below). Series, and the parts AniSkip lacks for an anime: TheIntroDB and SkipDB (further below).
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
    // Short openings exist (Breaking Bad's title card lasts ~17 s), so only the 5 s noise floor applies
    intro: { maxStart: 0.4, minLength: MIN_SEGMENT_S, maxLength: 240 },
    recap: { maxStart: 0.25, minLength: MIN_SEGMENT_S, maxLength: 180 },
    // Friends credits can be a 6 s card over the last scene
    outro: { minStart: 0.6, minLength: MIN_SEGMENT_S, maxLength: 240 },
};
// An ending this close to the end of the file "runs to the end"; such an ending may last up to OUTRO_TO_END_MAX_S
const OUTRO_TO_END_S = 10;
const OUTRO_TO_END_MAX_S = 300;

function isPlausible(seg, duration) {
    const rule = PLAUSIBLE[seg.type];
    const length = seg.end - seg.start;
    // Credits that run to the end of the file may be longer than those in the middle, up to OUTRO_TO_END_MAX_S.
    // Longer ones are dropped (Game of Thrones S8E3 lists 13 min from a scene with different sound): the episode is
    // then treated as having no ending data (countdown in the last 30 s)
    const maxLength = seg.type === 'outro' && Number.isFinite(duration) && duration - seg.end <= OUTRO_TO_END_S ? OUTRO_TO_END_MAX_S : rule.maxLength;
    if (length < rule.minLength || length > maxLength) return false;
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
        if (!kept || start < kept.start) byType.set(type, { type, start, end, approx: Boolean(item.approx), source: item.source || 'aniskip' });
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

/* ---------- Series: TheIntroDB + SkipDB ---------- */

// TheIntroDB is keyed by TMDB id, SkipDB by IMDb id; both allow calls from the browser (no Cloudflare cost)
const THEINTRODB_API = 'https://api.theintrodb.org/v3/media';
const SKIPDB_API = 'https://skipdb.tv/api/segments';
const TV_TIMEOUT_MS = 6000;
// SkipDB says whether its timing was recorded on a cut of our length; these labels mean it was
const SKIPDB_TRUSTED = new Set(['exact', 'shifted']);
// Two bases agreeing this closely on a start confirm each other
const CONFIRM_S = 5;
// When one base's range is shorter than this share of the other's, it is taken as a wrong submission (Game of
// Thrones S1E1: a 13 s "opening" against the real 100 s one) and the longer range is used
const MUCH_SHORTER = 0.5;
const TV_TYPES = ['intro', 'recap', 'outro'];

const tvCache = new Map();

async function getJson(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TV_TIMEOUT_MS);
    try {
        const res = await fetch(url, { signal: controller.signal });
        // 404 is "no data for this episode"
        return res.ok ? await res.json() : null;
    } catch (e) {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

/** TheIntroDB answer -> { intro, recap, outro } in seconds (first range of each list); null edges mean the file edges. */
export function readTheIntroDb(data, duration) {
    const out = {};
    const pick = (list, type) => {
        const r = Array.isArray(list) ? list[0] : null;
        if (!r) return;
        const start = r.start_ms == null ? 0 : r.start_ms / 1000;
        const end = r.end_ms == null ? duration : r.end_ms / 1000;
        if (Number.isFinite(start) && Number.isFinite(end) && end > start) out[type] = { start, end };
    };
    if (data) {
        pick(data.intro, 'intro');
        pick(data.recap, 'recap');
        pick(data.credits, 'outro');
    }
    return out;
}

/**
 * SkipDB answer -> { intro, recap, outro } in seconds. `trusted`: recorded on a cut of our length (exact) or within a
 * few seconds of it (shifted). For a shifted cut SkipDB moves the times by the whole length difference, assuming the
 * extra seconds sit at the start of the file; checked frame by frame (Breaking Bad S1E1, The Office S2E3) they sat at
 * the end, so the times as submitted are used and the range is `approx`.
 */
export function readSkipDb(data, duration) {
    const out = {};
    const segs = data && data.segments ? data.segments : {};
    for (const type of TV_TYPES) {
        const r = segs[type];
        if (!r) continue;
        const undo = r.adjusted && Number.isFinite(r.offset_ms) ? r.offset_ms / 1000 : 0;
        const start = r.start_ms == null ? 0 : r.start_ms / 1000 - undo;
        const end = r.end_ms == null ? duration : r.end_ms / 1000 - undo;
        if (Number.isFinite(start) && Number.isFinite(end) && end > start) {
            out[type] = { start, end, trusted: SKIPDB_TRUSTED.has(r.match), approx: r.match !== 'exact' };
        }
    }
    return out;
}

/**
 * One source per part, never mixed: SkipDB when it confirms our cut, else TheIntroDB, else SkipDB for another cut.
 * A range not proven to belong to our cut is `approx` (an ending then offers only "Próximo episódio"), unless the
 * other base agrees on its start within CONFIRM_S.
 */
export function mergeTvSources(skipdb, theintrodb) {
    const list = [];
    for (const type of TV_TYPES) {
        const s = skipdb[type];
        const t = theintrodb[type];
        const length = r => r.end - r.start;
        if (s && t && Math.min(length(s), length(t)) < Math.max(length(s), length(t)) * MUCH_SHORTER) {
            const longer = length(s) > length(t) ? { ...s, source: 'skipdb' } : { ...t, source: 'theintrodb', trusted: false };
            const confirmed = Math.abs(s.start - t.start) <= CONFIRM_S;
            list.push({ type, start: longer.start, end: longer.end, approx: !((longer.trusted && !longer.approx) || confirmed), source: longer.source });
        } else if (s && s.trusted) {
            const confirmed = Boolean(t) && Math.abs(s.start - t.start) <= CONFIRM_S;
            list.push({ type, start: s.start, end: s.end, approx: Boolean(s.approx) && !confirmed, source: 'skipdb' });
        } else if (t) {
            const confirmed = Boolean(s) && Math.abs(s.start - t.start) <= CONFIRM_S;
            list.push({ type, start: t.start, end: t.end, approx: !confirmed, source: 'theintrodb' });
        } else if (s) {
            list.push({ type, start: s.start, end: s.end, approx: true, source: 'skipdb' });
        }
    }
    return list;
}

/**
 * Opening/recap/ending of a series episode from TheIntroDB and SkipDB, or [] when neither has it.
 * `season`/`episode` use TMDB's own numbering. Never throws.
 */
export async function fetchTvSkipSegments({ tmdbId, imdbId, season, episode, duration }) {
    const tmdb = parseInt(tmdbId, 10);
    const s = parseInt(season, 10);
    const e = parseInt(episode, 10);
    if (!(s >= 0) || !(e > 0) || !(duration > 0) || (!(tmdb > 0) && !imdbId)) return [];
    const length = Math.round(duration);
    const key = `${tmdb}_${imdbId}_${s}_${e}_${length}`;
    if (tvCache.has(key)) return tvCache.get(key);
    const pending = (async () => {
        const [tidb, skip] = await Promise.all([
            tmdb > 0 ? getJson(`${THEINTRODB_API}?tmdb_id=${tmdb}&season=${s}&episode=${e}&duration_ms=${length * 1000}`) : null,
            imdbId ? getJson(`${SKIPDB_API}?imdb_id=${encodeURIComponent(imdbId)}&season=${s}&episode=${e}&duration=${length}`) : null,
        ]);
        return normalizeSkipSegments(mergeTvSources(readSkipDb(skip, duration), readTheIntroDb(tidb, duration)), duration);
    })();
    tvCache.set(key, pending);
    return pending;
}

/**
 * Adds to `primary` (AniSkip) the parts it lacks, taken from `extra` (series bases), never overlapping a range
 * already there. One source per part, so the progress bar never shows two openings.
 */
export function complementSegments(primary, extra, duration) {
    const have = new Set(primary.map(seg => seg.type));
    const added = extra.filter(seg => !have.has(seg.type)
        && !primary.some(p => seg.start < p.end && p.start < seg.end));
    return normalizeSkipSegments([...primary, ...added], duration);
}
