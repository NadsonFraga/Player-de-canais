/**
 * TVZINHA ONLINE - The rules of the account sync: what a record may hold, and how two copies of it merge.
 *
 * Used by the page (core/sync.js) and by the Cloudflare function (functions/api/sync.js imports this file), so both
 * sides apply the same rules; tools/local_sync.py mirrors them and tools/sync_cases.json runs against both.
 * No imports, no DOM, no storage: plain data in, plain data out.
 *
 *   kind       key                       data
 *   library    movie:<id> | tv:<id>      { kind, id, title, poster_path, backdrop_path, year, watchlist, watched, rating }
 *   progress   <show id> | movie:<id>    the "Continuar assistindo" entry (core/watchProgress.js, series.js)
 *   favorite   <channel key>             { on, at }
 *   prefs      player                    { volume, muted, playbackRate, subtitle, quality, fit, at }
 *   prefs      team                      { team, at }
 *
 * Every change keeps the time it was made, so two devices merge field by field and the newest wins; a removal is a
 * field turned off with its time, so it travels too. Times later than "now" are cut to now: nobody can make a change
 * win forever.
 */

export const SYNC_KINDS = ['library', 'progress', 'favorite', 'prefs'];
export const MAX_RECORD_BYTES = 16 * 1024;
export const MAX_POSITIONS = 40;
const RESERVED_KEYS = ['__proto__', 'constructor', 'prototype'];

// --- Small checks ---

function time(value, now) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.min(Math.round(n), now);
}

function text(value, max) {
    return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function int(value, min, max) {
    const n = Number(value);
    return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

function num(value, min, max) {
    const n = Number(value);
    return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

// TMDB image paths ("/abc123.jpg"); anything else is dropped
function imagePath(value) {
    return typeof value === 'string' && /^\/[A-Za-z0-9._-]{1,100}$/.test(value) ? value : null;
}

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/** null when the key cannot belong to the kind. */
export function validKey(kind, key) {
    if (typeof key !== 'string') return false;
    if (kind === 'library') return /^(movie|tv):\d{1,9}$/.test(key);
    if (kind === 'progress') return /^(movie:)?\d{1,9}$/.test(key);
    // Names that would reach an object's prototype when used as a property are never keys
    if (kind === 'favorite') return key.length >= 1 && key.length <= 120 && !/[\u0000-\u001f\u007f]/.test(key) && !RESERVED_KEYS.includes(key);
    if (kind === 'prefs') return key === 'player' || key === 'team';
    return false;
}

function flag(value, now) {
    if (!isObject(value)) return null;
    return { on: Boolean(value.on), at: time(value.at, now) };
}

function position(value, now) {
    if (!isObject(value)) return null;
    return {
        position: num(value.position, 0, 1e6) ?? 0,
        duration: num(value.duration, 0, 1e6) ?? 0,
        finished: Boolean(value.finished),
        server: text(value.server, 40),
        at: time(value.at, now)
    };
}

/**
 * The record as it may be stored: known fields only, checked and cut to size; null when it cannot be kept.
 * Used on what the page sends (server) and on what the server answers (page).
 */
export function sanitizeRecord(kind, key, data, now) {
    if (!SYNC_KINDS.includes(kind) || !validKey(kind, key) || !isObject(data)) return null;
    let clean = null;
    if (kind === 'library') {
        const id = Number(key.split(':')[1]);
        clean = {
            kind: ['movie', 'tv', 'anime'].includes(data.kind) ? data.kind : (key.startsWith('movie:') ? 'movie' : 'tv'),
            id,
            title: text(data.title, 200),
            poster_path: imagePath(data.poster_path),
            backdrop_path: imagePath(data.backdrop_path),
            year: /^\d{4}$/.test(String(data.year || '')) ? String(data.year) : ''
        };
        for (const field of ['watchlist', 'watched']) {
            const value = flag(data[field], now);
            if (value) clean[field] = value;
        }
        if (isObject(data.rating)) {
            clean.rating = { value: int(data.rating.value, 1, 10), at: time(data.rating.at, now) };
        }
    } else if (kind === 'progress') {
        const isMovie = key.startsWith('movie:');
        const id = Number(isMovie ? key.split(':')[1] : key);
        clean = {
            id,
            title: text(data.title, 200),
            poster_path: imagePath(data.poster_path),
            backdrop_path: imagePath(data.backdrop_path),
            mediaType: isMovie ? 'movie' : (data.mediaType === 'anime' ? 'anime' : 'tv'),
            timestamp: time(data.timestamp, now)
        };
        // Taken off the rail: kept only with its time (as the merge leaves it), so equal data looks equal
        const hiddenAt = time(data.hiddenAt, now);
        if (hiddenAt) {
            clean.hidden = Boolean(data.hidden);
            clean.hiddenAt = hiddenAt;
        }
        if (isMovie) {
            const saved = position(data, now);
            Object.assign(clean, { position: saved.position, duration: saved.duration, finished: saved.finished, server: saved.server, at: saved.at });
            if (data.subtitle_size !== undefined) clean.subtitle_size = int(data.subtitle_size, 50, 200) ?? 100;
        if (data.subtitle_color !== undefined) clean.subtitle_color = ['#ffffff', '#facc15', '#22d3ee', '#4ade80'].includes(data.subtitle_color) ? data.subtitle_color : '#ffffff';
        if (data.subtitle_bg !== undefined) clean.subtitle_bg = data.subtitle_bg === 'box' ? 'box' : 'shadow';
    } else {
            clean.season = int(data.season, 0, 1000) ?? 1;
            clean.episode = int(data.episode, 0, 100000) ?? 1;
            clean.episodeTitle = text(data.episodeTitle, 200);
            clean.absolute = int(data.absolute, 1, 100000);
            const positions = {};
            if (isObject(data.positions)) {
                for (const [episodeKey, value] of Object.entries(data.positions)) {
                    if (!/^\d{1,4}:\d{1,6}$/.test(episodeKey)) continue;
                    const saved = position(value, now);
                    if (saved) positions[episodeKey] = saved;
                }
            }
            clean.positions = capPositions(positions);
        }
    } else if (kind === 'favorite') {
        clean = { on: Boolean(data.on), at: time(data.at, now) };
    } else if (key === 'player') {
        clean = {
            volume: num(data.volume, 0, 1) ?? 0.9,
            muted: Boolean(data.muted),
            playbackRate: num(data.playbackRate, 0.25, 4) ?? 1,
            subtitle: data.subtitle == null ? null : text(String(data.subtitle), 10),
            quality: data.quality === 'auto' ? 'auto' : (int(data.quality, 100, 5000) ?? 'auto'),
            fit: data.fit === 'cover' ? 'cover' : 'contain',

            at: time(data.at, now)
        };
        if (data.subtitle_size !== undefined) {
            clean.subtitle_size = int(data.subtitle_size, 50, 200) ?? 100;
        }
        if (data.subtitle_color !== undefined) {
            clean.subtitle_color = ['#ffffff', '#facc15', '#22d3ee', '#4ade80'].includes(data.subtitle_color) ? data.subtitle_color : '#ffffff';
        }
        if (data.subtitle_bg !== undefined) {
            clean.subtitle_bg = data.subtitle_bg === 'box' ? 'box' : 'shadow';
        }
        if (data.subtitle_size !== undefined) clean.subtitle_size = int(data.subtitle_size, 50, 200) ?? 100;
        if (data.subtitle_color !== undefined) clean.subtitle_color = ['#ffffff', '#facc15', '#22d3ee', '#4ade80'].includes(data.subtitle_color) ? data.subtitle_color : '#ffffff';
        if (data.subtitle_bg !== undefined) clean.subtitle_bg = data.subtitle_bg === 'box' ? 'box' : 'shadow';
    } else {
        clean = { team: data.team == null ? null : text(String(data.team), 40) || null, at: time(data.at, now) };
    }
    return stableStringify(clean).length <= MAX_RECORD_BYTES ? clean : null;
}

function capPositions(positions) {
    const keys = Object.keys(positions).sort((a, b) => (positions[b].at - positions[a].at) || (a < b ? -1 : a > b ? 1 : 0));
    const kept = {};
    keys.slice(0, MAX_POSITIONS).forEach(k => { kept[k] = positions[k]; });
    return kept;
}

// --- Merge ---

/**
 * The newer of two copies by `time`. A tie is broken by the content (the larger JSON), never by which copy is whose:
 * merging A with B gives what B with A gives, so two devices always end up equal.
 */
function pick(a, b, time) {
    const ta = time(a);
    const tb = time(b);
    if (ta !== tb) return tb > ta ? b : a;
    return stableStringify(b) > stableStringify(a) ? b : a;
}

function newer(a, b) {
    if (!a) return b || null;
    if (!b) return a;
    return pick(a, b, v => v.at || 0);
}

function newestFieldTime(entry) {
    return Math.max(0, ...['watchlist', 'watched', 'rating'].map(f => (entry[f] && entry[f].at) || 0));
}

/**
 * Merges two clean copies of the same record (`stored` first, `incoming` second). Gives the same answer in either
 * order, and merging a copy with itself changes nothing.
 */
export function mergeRecord(kind, stored, incoming) {
    if (!stored) return incoming;
    if (!incoming) return stored;
    if (kind === 'library') {
        // The title data follows the copy changed last; the other one fills what it lacks
        const base = pick(stored, incoming, newestFieldTime);
        const other = base === incoming ? stored : incoming;
        const merged = {
            kind: base.kind,
            id: base.id,
            title: base.title || other.title || '',
            poster_path: base.poster_path || other.poster_path || null,
            backdrop_path: base.backdrop_path || other.backdrop_path || null,
            year: base.year || other.year || ''
        };
        for (const field of ['watchlist', 'watched', 'rating']) {
            const value = newer(stored[field], incoming[field]);
            if (value) merged[field] = value;
        }
        return merged;
    }
    if (kind === 'progress') {
        const head = pick(stored, incoming, v => v.timestamp || 0);
        const merged = { ...head };
        merged.timestamp = Math.max(stored.timestamp || 0, incoming.timestamp || 0);
        // Taken off the rail: the latest hide, which counts only when nothing was watched after it
        const hiddenAt = Math.max(stored.hiddenAt || 0, incoming.hiddenAt || 0);
        delete merged.hidden;
        delete merged.hiddenAt;
        if (hiddenAt) {
            merged.hiddenAt = hiddenAt;
            merged.hidden = hiddenAt >= merged.timestamp;
        }
        if (head.mediaType === 'movie') {
            const saved = newer(stored, incoming);
            merged.position = saved.position;
            merged.duration = saved.duration;
            merged.server = saved.server;
            merged.at = saved.at || 0;
            // Opening a finished movie again (a newer timestamp than its last saved time) starts it over
            merged.finished = Boolean(saved.finished) && (saved.at || 0) >= merged.timestamp;
            if (data.subtitle_size !== undefined) clean.subtitle_size = int(data.subtitle_size, 50, 200) ?? 100;
        if (data.subtitle_color !== undefined) clean.subtitle_color = ['#ffffff', '#facc15', '#22d3ee', '#4ade80'].includes(data.subtitle_color) ? data.subtitle_color : '#ffffff';
        if (data.subtitle_bg !== undefined) clean.subtitle_bg = data.subtitle_bg === 'box' ? 'box' : 'shadow';
    } else {
            const positions = { ...(stored.positions || {}) };
            for (const [k, value] of Object.entries(incoming.positions || {})) positions[k] = newer(positions[k], value);
            merged.positions = capPositions(positions);
        }
        return merged;
    }
    // favorite, prefs: the newest copy, whole
    return newer(stored, incoming);
}

// --- Comparing ---

/** JSON with sorted keys: equal data gives equal text on every device and in Python. */
export function stableStringify(value) {
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    if (isObject(value)) return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
    return JSON.stringify(value === undefined ? null : value);
}

export function sameRecord(a, b) {
    return stableStringify(a) === stableStringify(b);
}
