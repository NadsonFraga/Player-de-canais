/**
 * TVZINHA ONLINE - What the viewer is watching, for "Continuar assistindo" (and later the Coleção and the account sync).
 *
 * One store, `WATCH_PROGRESS_KEY`:
 *   series/anime  progress[showId]           { id, title, season, episode, positions{"S:E": {...}}, mediaType, timestamp }
 *   movies        progress["movie:<id>"]     { id, title, mediaType: 'movie', position, duration, finished, server, at, timestamp }
 * TMDB movie and TV ids overlap, so movies get their own prefix. `hidden` + `hiddenAt` take an entry off the rail
 * without erasing its times; watching it again (a newer `timestamp`) brings it back.
 */
import { WATCH_PROGRESS_KEY } from './constants.js?v=20261027_1713';
import { storageKey, PROFILE_EVENT } from './profileStore.js?v=20261027_1713';

// Fired whenever the store changes, so the rail redraws without the modules importing each other
export const PROGRESS_EVENT = 'tvzinha:progress';
// Another profile's progress: the screens redraw
if (typeof window !== 'undefined') window.addEventListener(PROFILE_EVENT, () => window.dispatchEvent(new CustomEvent(PROGRESS_EVENT)));

export function movieKey(id) {
    return `movie:${id}`;
}

export function readWatchProgress() {
    try {
        const raw = localStorage.getItem(storageKey(WATCH_PROGRESS_KEY));
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

/** Saves the whole store; `notify: false` skips the redraw event (the caller redraws, or nothing shows it). */
export function writeWatchProgress(progress, { notify = true } = {}) {
    try {
        localStorage.setItem(storageKey(WATCH_PROGRESS_KEY), JSON.stringify(progress));
        if (notify) window.dispatchEvent(new CustomEvent(PROGRESS_EVENT));
    } catch (e) {
        // Progress is optional
    }
}

/** Saved time of a movie ({ position, duration, finished, server }) or null. */
export function getMovieProgress(id) {
    const entry = readWatchProgress()[movieKey(id)];
    return entry && entry.position > 0 ? entry : null;
}

/** A movie was opened (any server): it enters the rail, keeping the time it already had. */
export function recordMovieOpened(movie) {
    if (!movie || !movie.id) return;
    const progress = readWatchProgress();
    const previous = progress[movieKey(movie.id)] || {};
    progress[movieKey(movie.id)] = {
        ...previous,
        id: movie.id,
        title: movie.title || previous.title || '',
        poster_path: movie.poster_path || previous.poster_path || null,
        backdrop_path: movie.backdrop_path || previous.backdrop_path || null,
        mediaType: 'movie',
        // Opening it again restarts a finished movie, so it is "being watched" again
        finished: false,
        hidden: false,
        timestamp: Date.now()
    };
    writeWatchProgress(progress);
}

/** Where the movie is, from the Player Principal (every ~10 s, on pause and before it closes). */
export function saveMovieProgress(movie, server, { position, duration, inEnding }) {
    if (!movie || !movie.id) return;
    const progress = readWatchProgress();
    const entry = progress[movieKey(movie.id)];
    if (!entry) return;
    entry.position = Math.round(position);
    entry.duration = Math.round(duration);
    // In the credits (or almost at the end): watched; it leaves the rail and starts from the beginning next time
    entry.finished = Boolean(inEnding) || (duration > 0 && position >= duration * 0.95);
    entry.server = server;
    entry.at = Date.now();
    progress[movieKey(movie.id)] = entry;
    writeWatchProgress(progress);
}

/** Takes an entry (a show id or "movie:<id>") off the rail; its times stay. */
export function hideFromContinueWatching(key) {
    const progress = readWatchProgress();
    const entry = progress[key];
    if (!entry) return;
    entry.hidden = true;
    entry.hiddenAt = Date.now();
    writeWatchProgress(progress);
}

/** Entries for the rail, newest first: not hidden, and movies not finished. */
export function continueWatchingEntries() {
    return Object.entries(readWatchProgress())
        .map(([key, entry]) => ({ key, ...entry }))
        .filter(entry => !entry.hidden && !(entry.mediaType === 'movie' && entry.finished))
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}
