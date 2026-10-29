/**
 * TVZINHA ONLINE - Whose data this device reads: the guest's, or the active profile's.
 *
 * Every per-person store (library, watch progress, channel favorites, favorite team, player preferences) reads and
 * writes through `storageKey(base)`: the base key for guests, `base:<profileId>` for a signed-in profile. The guest data
 * is never touched by a profile (signing out shows it again). Device things (TMDB caches, the ad-block notice, the
 * sidebar width) keep their plain keys.
 *
 * Only constants.js is imported (no cycles): core/state.js builds the store from these keys at load time.
 * Switching fires PROFILE_EVENT on window; each store drops its memory copy and tells its screens.
 */
import { WATCH_PROGRESS_KEY, LIBRARY_KEY, FAVORITES_STORAGE_KEY, FAVORITE_TEAM_KEY, PLAYER_PREFS_KEY, PERSONAL_TIMES_KEY } from './constants.js?v=20261029_0156';

export const PROFILE_EVENT = 'tvzinha:profile';
// { profileId, lastSeen, asked: [profile ids already asked about the guest data] }
const ACTIVE_KEY = 'tvzinha_profile_v1';
export const PROFILE_DATA_KEYS = [LIBRARY_KEY, WATCH_PROGRESS_KEY, FAVORITES_STORAGE_KEY, FAVORITE_TEAM_KEY, PLAYER_PREFS_KEY, PERSONAL_TIMES_KEY];
// The last use is written at most this often (the 3-hour rule needs minutes, not seconds)
const TOUCH_EVERY_MS = 60 * 1000;

let active = readActive();

function readActive() {
    try {
        const data = JSON.parse(localStorage.getItem(ACTIVE_KEY) || 'null');
        if (data && typeof data === 'object') return { profileId: data.profileId || null, lastSeen: Number(data.lastSeen) || 0, asked: Array.isArray(data.asked) ? data.asked : [] };
    } catch (e) {
        // A broken record reads as no profile
    }
    return { profileId: null, lastSeen: 0, asked: [] };
}

function writeActive() {
    try {
        localStorage.setItem(ACTIVE_KEY, JSON.stringify(active));
    } catch (e) {
        // Kept for this page only
    }
}

export function activeProfileId() {
    return active.profileId;
}

/** The key a per-person store uses now. */
export function storageKey(base) {
    return active.profileId ? `${base}:${active.profileId}` : base;
}

/**
 * Makes `profileId` (or the guest, with null) the one whose data the site reads, and tells every store.
 * `force`: tell them even when it stays the same (its data was just replaced).
 */
export function setActiveProfile(profileId, { force = false } = {}) {
    const next = profileId || null;
    const changed = next !== active.profileId || force;
    active.profileId = next;
    active.lastSeen = Date.now();
    writeActive();
    if (changed) window.dispatchEvent(new CustomEvent(PROFILE_EVENT, { detail: { profileId: next } }));
}

/** The data of the profile in use was replaced (the sync brought changes): every store reads it again. */
export function notifyProfileData() {
    window.dispatchEvent(new CustomEvent(PROFILE_EVENT, { detail: { profileId: active.profileId, refresh: true } }));
}

// --- When favorites, the team and the player preferences changed (the library and progress keep their own times) ---

/** { favorites: { <channel key>: { on, at } }, team: <time>, player: <time> } of a profile (the one in use by default). */
export function readPersonalTimes(profileId = active.profileId) {
    try {
        const data = JSON.parse(localStorage.getItem(profileId ? `${PERSONAL_TIMES_KEY}:${profileId}` : PERSONAL_TIMES_KEY) || 'null');
        if (data && typeof data === 'object') return { favorites: data.favorites && typeof data.favorites === 'object' ? data.favorites : {}, team: Number(data.team) || 0, player: Number(data.player) || 0 };
    } catch (e) {
        // Starts over
    }
    return { favorites: {}, team: 0, player: 0 };
}

export function writePersonalTimes(times, profileId = active.profileId) {
    try {
        localStorage.setItem(profileId ? `${PERSONAL_TIMES_KEY}:${profileId}` : PERSONAL_TIMES_KEY, JSON.stringify(times));
    } catch (e) {
        // The change itself is saved; only its time is lost
    }
}

/** A channel turned into a favorite or out of it, now. */
export function stampFavorite(channelKey, on) {
    const times = readPersonalTimes();
    times.favorites[channelKey] = { on: Boolean(on), at: Date.now() };
    writePersonalTimes(times);
}

/** The team ('team') or the player preferences ('player') changed now. */
export function stampTime(field) {
    const times = readPersonalTimes();
    times[field] = Date.now();
    writePersonalTimes(times);
}

/** Milliseconds since the site was last used with the active profile (Infinity when never). */
export function timeSinceLastUse() {
    return active.lastSeen ? Date.now() - active.lastSeen : Infinity;
}

/** Marks the site as in use now (called on activity; written at most once a minute). */
export function touchProfile() {
    if (!active.profileId) return;
    const now = Date.now();
    if (now - active.lastSeen < TOUCH_EVERY_MS) return;
    active.lastSeen = now;
    writeActive();
}

function hasContent(key) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return false;
        const data = JSON.parse(raw);
        if (Array.isArray(data)) return data.length > 0;
        if (data && typeof data === 'object') return Object.keys(data.items || data).length > 0;
        return Boolean(data);
    } catch (e) {
        // A plain string (the favorite team)
        return true;
    }
}

/** True when this device has guest data worth bringing (Coleção, progress or channel favorites). */
export function hasGuestData() {
    return [LIBRARY_KEY, WATCH_PROGRESS_KEY, FAVORITES_STORAGE_KEY].some(hasContent);
}

/** True when the profile already has something saved on this device. */
export function profileHasData(profileId) {
    return PROFILE_DATA_KEYS.some(base => hasContent(`${base}:${profileId}`));
}

/** The guest data question: asked once per profile and device. */
export function shouldAskAboutGuestData(profileId) {
    return Boolean(profileId) && !active.asked.includes(profileId) && hasGuestData() && !profileHasData(profileId);
}

export function markGuestDataAsked(profileId) {
    if (!profileId || active.asked.includes(profileId)) return;
    active.asked.push(profileId);
    writeActive();
}

/** Copies the guest data into the profile (the guest keeps its own copy). */
export function copyGuestDataTo(profileId) {
    for (const base of PROFILE_DATA_KEYS) {
        try {
            const raw = localStorage.getItem(base);
            if (raw !== null) localStorage.setItem(`${base}:${profileId}`, raw);
        } catch (e) {
            // A full storage keeps what it could copy
        }
    }
}

/** Removes a profile's copies from this device (the profile was removed). */
export function removeProfileData(profileId) {
    for (const base of PROFILE_DATA_KEYS) {
        try {
            localStorage.removeItem(`${base}:${profileId}`);
        } catch (e) {
            // Nothing to do
        }
    }
    active.asked = active.asked.filter(id => id !== profileId);
    writeActive();
}
