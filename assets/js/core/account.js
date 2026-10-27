/**
 * TVZINHA ONLINE - The account in the browser: who is signed in, and the calls to /api/account/*.
 *
 * The session is an HttpOnly cookie the page cannot read, so a small copy of the account (nickname, profiles) is kept
 * in localStorage to draw the menu at once; /api/account/me confirms it in the background. Guests never call the
 * server (no cost): /me runs only when that copy says someone is signed in.
 * Profiles: the list comes with the account; which one is in use on this device lives in core/profileStore.js.
 */
import { STREAM_ENGINE_API_BASE } from './constants.js?v=20261027_1758';
import { activeProfileId, setActiveProfile } from './profileStore.js?v=20261027_1758';

const CACHE_KEY = 'tvzinha_account_v1';
export const ACCOUNT_EVENT = 'tvzinha:account';

let state = readCache();

function readCache() {
    try {
        const data = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        if (data && data.account && data.account.nickname) return { signedIn: true, account: data.account, profiles: data.profiles || [] };
    } catch (e) {
        // A broken copy reads as signed out
    }
    return { signedIn: false, account: null, profiles: [] };
}

function setState(next) {
    state = next;
    // Signed out: the site reads the guest data again
    if (!next.signedIn && activeProfileId()) setActiveProfile(null);
    try {
        if (next.signedIn) localStorage.setItem(CACHE_KEY, JSON.stringify({ account: next.account, profiles: next.profiles }));
        else localStorage.removeItem(CACHE_KEY);
    } catch (e) {
        // Kept for this page only
    }
    window.dispatchEvent(new CustomEvent(ACCOUNT_EVENT, { detail: { ...state } }));
}

/** { signedIn, account: { nickname, createdAt }, profiles: [{ id, name, avatar }] } */
export function getAccount() {
    return { ...state, profiles: [...state.profiles] };
}

/** The profile in use on this device ({ id, name, avatar }), or null (guest, or none picked yet). */
export function getActiveProfile() {
    const id = activeProfileId();
    return (state.signedIn && id && state.profiles.find(p => p.id === id)) || null;
}

/** { status, json } of /api/account/<path>; a network failure answers status 0 with error 'network'. */
async function call(path, body = null) {
    const options = body === null
        ? { method: 'GET', credentials: 'same-origin' }
        : { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-Tvzinha-Request': '1' }, body: JSON.stringify(body) };
    try {
        const res = await fetch(`${STREAM_ENGINE_API_BASE}/api/account/${path}`, options);
        let json = {};
        try {
            json = await res.json();
        } catch (e) {
            json = { error: 'unexpected' };
        }
        return { status: res.status, json };
    } catch (e) {
        return { status: 0, json: { error: 'network' } };
    }
}

function signedInWith(json) {
    setState({ signedIn: true, account: json.account, profiles: json.profiles || [] });
}

// `turnstileToken`: the robot check (core/turnstile.js), sent when the form has one
export async function register(nickname, password, turnstileToken = '') {
    const result = await call('register', { nickname, password, ...(turnstileToken ? { turnstileToken } : {}) });
    if (result.status === 201) signedInWith(result.json);
    return result;
}

export async function signIn(nickname, password, turnstileToken = '') {
    const result = await call('login', { nickname, password, ...(turnstileToken ? { turnstileToken } : {}) });
    if (result.status === 200) signedInWith(result.json);
    return result;
}

export async function recoverAccount(nickname, recoveryCode, newPassword, turnstileToken = '') {
    const result = await call('recover', { nickname, recoveryCode, newPassword, ...(turnstileToken ? { turnstileToken } : {}) });
    if (result.status === 200) signedInWith(result.json);
    return result;
}

/** Signs out here; the account stays on the server. Done locally even when the server cannot be reached. */
export async function signOut() {
    await call('logout', {});
    setState({ signedIn: false, account: null, profiles: [] });
}

/** Confirms the copy with the server (only when it says someone is signed in). */
export async function refreshAccount() {
    if (!state.signedIn) return getAccount();
    const result = await call('me');
    if (result.status === 200) signedInWith(result.json);
    else if (result.status === 401) setState({ signedIn: false, account: null, profiles: [] });
    // Other failures (offline, server busy) keep the copy: the person stays signed in until the server says otherwise
    return getAccount();
}

// --- Configurações: password, recovery code, deleting the account ---

/** The other devices are signed out by the server; this one stays. */
export function changePassword(currentPassword, newPassword) {
    return call('password', { currentPassword, newPassword });
}

/** A new recovery code ({ recoveryCode }); the old one stops working. */
export function renewRecoveryCode(password) {
    return call('recovery-code', { password });
}

/** Deletes the account and everything in it on the server; signed out here when it worked. */
export async function deleteAccount(password) {
    const result = await call('delete', { password });
    if (result.status === 200) setState({ signedIn: false, account: null, profiles: [] });
    return result;
}

// --- Profiles (create, rename, avatar, remove); the answer is the full list ---

async function profilesCall(body) {
    const result = await call('profiles', body);
    if (result.status === 200 || result.status === 201) setState({ ...state, profiles: result.json.profiles || [] });
    else if (result.status === 401) setState({ signedIn: false, account: null, profiles: [] });
    return result;
}

export function createProfile(name, avatar) {
    return profilesCall({ action: 'create', name, avatar });
}

/** `changes`: { name?, avatar? } */
export function updateProfile(id, changes) {
    return profilesCall({ action: 'update', id, ...changes });
}

export function removeProfile(id) {
    return profilesCall({ action: 'remove', id });
}

/** null when valid, else the server's error code (same rule: 1 to 20 letters, numbers, spaces, . - _ '). */
export function profileNameProblem(name, profiles = [], exceptId = null) {
    const value = String(name || '').trim();
    if (!value) return 'profile_name_short';
    if ([...value].length > 20) return 'profile_name_long';
    if (!/^[\p{L}\p{N} ._'-]+$/u.test(value)) return 'profile_name_chars';
    if (profiles.some(p => p.id !== exceptId && p.name.toLowerCase() === value.toLowerCase())) return 'profile_name_taken';
    return null;
}

// --- The rules the server applies, checked while the person types (same as functions/api/account/[[path]].js) ---

export function nicknameProblem(nickname) {
    const value = String(nickname || '').trim();
    if (value.length < 3) return 'nickname_short';
    if (value.length > 20) return 'nickname_long';
    if (!/^[A-Za-z0-9._-]+$/.test(value)) return 'nickname_chars';
    return null;
}

/** { length, letter, number, notNickname } each true when met. */
export function passwordRules(password, nickname = '') {
    const value = String(password || '');
    return {
        length: value.length >= 8,
        letter: /[A-Za-zÀ-ÿ]/.test(value),
        number: /[0-9]/.test(value),
        notNickname: !nickname || value.trim().toLowerCase() !== String(nickname).trim().toLowerCase()
    };
}

/**
 * Strength from 0 to 6, computed here only (no request): length (8, 12, 16), upper and lower case, a number, a symbol,
 * minus one for easy runs ("1234", "abcd", "aaaa", "qwerty"). 0-2 fraca, 3-4 média, 5+ forte.
 */
export function passwordStrength(password) {
    const value = String(password || '');
    if (!value) return { score: 0, level: '' };
    let score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (value.length >= 16) score++;
    if (/[a-zà-ÿ]/.test(value) && /[A-ZÀ-Ý]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9À-ÿ]/.test(value)) score++;
    const lower = value.toLowerCase();
    if (/(.)\1\1/.test(lower) || /(0123|1234|2345|3456|4567|5678|6789|abcd|bcde|qwer|wert|asdf)/.test(lower)) score--;
    score = Math.max(0, score);
    return { score, level: score <= 2 ? 'fraca' : score <= 4 ? 'media' : 'forte' };
}
