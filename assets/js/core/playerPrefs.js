/**
 * TVZINHA ONLINE - Player preferences (this browser only).
 *
 * Kept in their own record, apart from the watch history, so a future login or settings tab can read and sync them
 * as one object. Every read and write survives a blocked or full storage (private windows): defaults are used then.
 */

const PREFS_KEY = 'tvzinha_player_prefs_v1';
// Older single-purpose key for the "Tela" choice, folded into the record on first read
const LEGACY_FIT_KEY = 'tvz-video-fit';

export const PLAYER_PREF_DEFAULTS = Object.freeze({
    volume: 0.9,          // 0..1
    muted: false,
    playbackRate: 1,
    subtitle: null,       // 'pt-BR' | 'pt' | 'en' | 'off' | null (null: Portuguese, else English)
    quality: 'auto',      // 'auto' or a height such as 1080
    fit: 'contain',       // 'contain' (Ajustar) | 'cover' (Preencher)
});

let cache = null;

function read() {
    if (cache) return cache;
    let stored = {};
    try {
        stored = JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') || {};
        if (stored.fit === undefined && localStorage.getItem(LEGACY_FIT_KEY) === 'cover') stored.fit = 'cover';
    } catch (e) {
        stored = {};
    }
    cache = { ...PLAYER_PREF_DEFAULTS, ...stored };
    return cache;
}

/** All preferences (a copy). */
export function getPlayerPrefs() {
    return { ...read() };
}

/** Saves one preference; unknown keys are ignored. */
export function setPlayerPref(key, value) {
    if (!(key in PLAYER_PREF_DEFAULTS)) return;
    const prefs = read();
    if (prefs[key] === value) return;
    prefs[key] = value;
    try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch (e) {
        // Kept for this page only
    }
}
