/**
 * TVZINHA ONLINE - The viewer's library: "Quero assistir", "Assistido" and their rating, per title.
 *
 * One store, `LIBRARY_KEY`, shaped for the account sync that comes later:
 *   items["movie:<id>" | "tv:<id>"] = { kind, id, title, poster_path, backdrop_path, year,
 *                                       watchlist: { on, at }, watched: { on, at }, rating: { value, at } }
 * Each field keeps the time it changed, so two devices can be merged field by field (newest wins). Turning a field
 * off keeps it with `on: false` and its time instead of deleting it: a sync can then tell a removal apart from a
 * field that was never set.
 * `rating.value` is 1 to 10 (5 stars with halves, the Trakt and Letterboxd scale); null when removed.
 * Animes are TV titles (`tv:<id>`); `kind` keeps 'anime' only to show them in the right place.
 */
import { LIBRARY_KEY } from './constants.js?v=20261024_1234';
import { storageKey, PROFILE_EVENT } from './profileStore.js?v=20261024_1234';

// Fired whenever the library changes, so screens redraw without importing each other
export const LIBRARY_EVENT = 'tvzinha:library';
// Another profile's library: the screens redraw
if (typeof window !== 'undefined') window.addEventListener(PROFILE_EVENT, () => window.dispatchEvent(new CustomEvent(LIBRARY_EVENT)));

export function libraryKey(kind, id) {
    return `${kind === 'movie' ? 'movie' : 'tv'}:${id}`;
}

function readLibrary() {
    try {
        const raw = localStorage.getItem(storageKey(LIBRARY_KEY));
        const data = raw ? JSON.parse(raw) : null;
        return data && typeof data.items === 'object' && data.items ? data : { items: {} };
    } catch (e) {
        return { items: {} };
    }
}

function writeLibrary(data) {
    try {
        localStorage.setItem(storageKey(LIBRARY_KEY), JSON.stringify(data));
        window.dispatchEvent(new CustomEvent(LIBRARY_EVENT));
        return true;
    } catch (e) {
        return false;
    }
}

/** Every stored title (the Coleção reads it). */
export function libraryEntries() {
    return Object.values(readLibrary().items);
}

/** The stored entry of a title, or null. */
export function getLibraryEntry(kind, id) {
    return readLibrary().items[libraryKey(kind, id)] || null;
}

/** { watchlist, watched, rating } of a title, ready for the buttons (rating null when unset). */
export function getLibraryState(kind, id) {
    const entry = getLibraryEntry(kind, id);
    return {
        watchlist: Boolean(entry && entry.watchlist && entry.watchlist.on),
        watched: Boolean(entry && entry.watched && entry.watched.on),
        rating: entry && entry.rating && entry.rating.value ? entry.rating.value : null
    };
}

/** Writes one field of a title. `title` carries what the Coleção shows (title, poster, year). */
function setField(kind, title, field, value) {
    if (!title || title.id == null) return false;
    const data = readLibrary();
    const key = libraryKey(kind, title.id);
    const previous = data.items[key] || {};
    data.items[key] = {
        ...previous,
        kind,
        id: title.id,
        title: title.title || title.name || previous.title || '',
        poster_path: title.poster_path || previous.poster_path || null,
        backdrop_path: title.backdrop_path || previous.backdrop_path || null,
        year: String(title.release_date || title.first_air_date || '').substring(0, 4) || previous.year || '',
        [field]: value
    };
    return writeLibrary(data);
}

export function setWatchlist(kind, title, on) {
    return setField(kind, title, 'watchlist', { on: Boolean(on), at: Date.now() });
}

export function setWatched(kind, title, on) {
    return setField(kind, title, 'watched', { on: Boolean(on), at: Date.now() });
}

/** `value` 1 to 10, or null to remove the rating. */
export function setRating(kind, title, value) {
    const clean = value == null ? null : Math.min(10, Math.max(1, Math.round(Number(value))));
    return setField(kind, title, 'rating', { value: clean, at: Date.now() });
}
