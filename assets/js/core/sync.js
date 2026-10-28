/**
 * TVZINHA ONLINE - The account sync in the page: sends what changed on this device and brings what changed elsewhere.
 *
 * Per profile and device, `tvzinha_sync_v1:<profile>` keeps the last change number received (`rev`) and a fingerprint
 * of each record as the server last confirmed it. A sync builds the records from the profile's stores (read straight
 * from its keys, so a profile left behind can still be sent), sends the ones whose fingerprint differs (300 at most per
 * request) and merges the answer back with the same rules the server uses (core/syncMerge.js). Fingerprints move only
 * once the server confirms, so nothing is lost offline: it goes with the next sync.
 *
 * When: on opening the site, 30 s after a change, when the page is hidden (keepalive), on coming back after 5 minutes
 * away, when the profile changes (the one left behind first), when the connection returns, and from syncNow().
 * Guests never sync. Errors wait longer each time (30 s up to 10 min); the server's limits are respected (one request a
 * second per account, and its "wait N seconds").
 */
import { STREAM_ENGINE_API_BASE, LIBRARY_KEY, WATCH_PROGRESS_KEY, FAVORITES_STORAGE_KEY, FAVORITE_TEAM_KEY, PLAYER_PREFS_KEY } from './constants.js?v=20261028_1015';
import { activeProfileId, notifyProfileData, removeProfileData, readPersonalTimes, writePersonalTimes, PROFILE_EVENT } from './profileStore.js?v=20261028_1015';
import { getAccount, signOut, refreshAccount, deleteAccount, ACCOUNT_EVENT } from './account.js?v=20261028_1015';
import { sanitizeRecord, mergeRecord, stableStringify } from './syncMerge.js?v=20261028_1015';
import { LIBRARY_EVENT } from './library.js?v=20261028_1015';
import { PROGRESS_EVENT } from './watchProgress.js?v=20261028_1015';
import { PREFS_EVENT, PLAYER_PREF_DEFAULTS } from './playerPrefs.js?v=20261028_1015';
import { store } from './state.js?v=20261028_1015';
import { confirmDialog } from './confirmDialog.js?v=20261028_1015';

export const SYNC_EVENT = 'tvzinha:sync';
const SYNC_STATE_KEY = 'tvzinha_sync_v1';
const CHANGE_DELAY_MS = 30 * 1000;
const RETURN_AFTER_MS = 5 * 60 * 1000;
const BATCH = 300;
const RETRY_MS = [30e3, 60e3, 120e3, 240e3, 480e3, 600e3];
// A request sent while the page goes away must stay under the browser's keepalive limit (64 KB)
const KEEPALIVE_BYTES = 60 * 1024;
// The server takes one sync a second per account
const REQUEST_GAP_MS = 1100;
const LEAVE_WAIT_MS = 4000;

let chain = Promise.resolve(true);
const waiting = new Map();
let timer = null;
let timerAt = 0;
let failures = 0;
let applying = false;
let hiddenAt = 0;
let lastRequestAt = 0;
let lastProfileId = activeProfileId();
let status = { state: 'idle', lastSync: 0 };

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const dataKey = (base, id) => `${base}:${id}`;
const recordId = (kind, key) => `${kind}\t${key}`;

function readJson(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        const value = raw ? JSON.parse(raw) : null;
        return value == null ? fallback : value;
    } catch (e) {
        return fallback;
    }
}

function writeJson(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        // A full storage keeps the old copy; the next sync tries again
    }
}

/** Short fingerprint of a record (its length and an FNV-1a hash of the sorted JSON). */
function fingerprint(data) {
    const text = stableStringify(data);
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return `${text.length}.${hash.toString(36)}`;
}

function readSyncState(id) {
    const data = readJson(dataKey(SYNC_STATE_KEY, id), null);
    return {
        rev: data && Number.isInteger(data.rev) && data.rev >= 0 ? data.rev : 0,
        fp: data && data.fp && typeof data.fp === 'object' ? data.fp : {},
        lastSync: data ? Number(data.lastSync) || 0 : 0,
    };
}

function writeSyncState(id, state) {
    writeJson(dataKey(SYNC_STATE_KEY, id), state);
}

function removeSyncState(id) {
    try {
        localStorage.removeItem(dataKey(SYNC_STATE_KEY, id));
    } catch (e) {
        // Nothing to do
    }
}

/** Profiles this device has synced at some point (their data is on the server). */
function syncedProfileIds() {
    const ids = [];
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(`${SYNC_STATE_KEY}:`)) ids.push(key.slice(SYNC_STATE_KEY.length + 1));
        }
    } catch (e) {
        // No storage
    }
    return ids;
}

// --- The records of a profile, read from its keys ---

function buildRecords(id, now) {
    const records = new Map();
    const add = (kind, key, data) => {
        const clean = sanitizeRecord(kind, key, data, now);
        if (clean) records.set(recordId(kind, key), { kind, key, data: clean });
    };
    const library = readJson(dataKey(LIBRARY_KEY, id), {});
    Object.entries((library && library.items) || {}).forEach(([key, entry]) => add('library', key, entry));
    Object.entries(readJson(dataKey(WATCH_PROGRESS_KEY, id), {}) || {}).forEach(([key, entry]) => add('progress', key, entry));
    const times = readPersonalTimes(id);
    const list = readJson(dataKey(FAVORITES_STORAGE_KEY, id), []);
    const favorites = new Set(Array.isArray(list) ? list : []);
    for (const key of new Set([...favorites, ...Object.keys(times.favorites)])) {
        add('favorite', key, { on: favorites.has(key), at: (times.favorites[key] && times.favorites[key].at) || 0 });
    }
    const prefs = readJson(dataKey(PLAYER_PREFS_KEY, id), null);
    if (prefs && typeof prefs === 'object') add('prefs', 'player', { ...PLAYER_PREF_DEFAULTS, ...prefs, at: times.player });
    let team = null;
    try {
        team = localStorage.getItem(dataKey(FAVORITE_TEAM_KEY, id));
    } catch (e) {
        team = null;
    }
    if (team || times.team) add('prefs', 'team', { team: team || null, at: times.team });
    return records;
}

function pendingRecords(id, now = Date.now()) {
    const state = readSyncState(id);
    return [...buildRecords(id, now).entries()].filter(([rid, r]) => state.fp[rid] !== fingerprint(r.data)).map(([, r]) => r);
}

export function hasPendingChanges(id = activeProfileId()) {
    return Boolean(id) && pendingRecords(id).length > 0;
}

/** Merges what the server sent into the profile's keys. { changed, localNewer } */
function applyRecords(id, incoming, now) {
    if (!incoming.length) return { changed: false, localNewer: false };
    const local = buildRecords(id, now);
    const library = readJson(dataKey(LIBRARY_KEY, id), {});
    if (!library.items || typeof library.items !== 'object') library.items = {};
    const progress = readJson(dataKey(WATCH_PROGRESS_KEY, id), {}) || {};
    const times = readPersonalTimes(id);
    const list = readJson(dataKey(FAVORITES_STORAGE_KEY, id), []);
    const favorites = new Set(Array.isArray(list) ? list : []);
    const touched = new Set();
    let prefs = null;
    let team;
    let localNewer = false;

    for (const record of incoming) {
        const clean = sanitizeRecord(record.kind, record.key, record.data, now);
        if (!clean) continue;
        const mine = local.get(recordId(record.kind, record.key));
        const merged = mergeRecord(record.kind, mine ? mine.data : null, clean);
        // This device had something newer: it goes up in the next round
        if (stableStringify(merged) !== stableStringify(clean)) localNewer = true;
        if (mine && stableStringify(merged) === stableStringify(mine.data)) continue;
        if (record.kind === 'library') {
            library.items[record.key] = merged;
        } else if (record.kind === 'progress') {
            progress[record.key] = merged;
        } else if (record.kind === 'favorite') {
            if (merged.on) favorites.add(record.key);
            else favorites.delete(record.key);
            times.favorites[record.key] = { on: merged.on, at: merged.at };
        } else if (record.key === 'player') {
            const { at, ...values } = merged;
            prefs = values;
            times.player = at;
        } else {
            team = merged.team;
            times.team = merged.at;
        }
        touched.add(record.kind === 'prefs' ? record.key : record.kind);
    }

    if (touched.has('library')) writeJson(dataKey(LIBRARY_KEY, id), library);
    if (touched.has('progress')) writeJson(dataKey(WATCH_PROGRESS_KEY, id), progress);
    if (touched.has('favorite')) writeJson(dataKey(FAVORITES_STORAGE_KEY, id), [...favorites]);
    if (touched.has('player')) writeJson(dataKey(PLAYER_PREFS_KEY, id), prefs);
    if (touched.has('team')) {
        try {
            if (team) localStorage.setItem(dataKey(FAVORITE_TEAM_KEY, id), team);
            else localStorage.removeItem(dataKey(FAVORITE_TEAM_KEY, id));
        } catch (e) {
            // Kept as it was
        }
    }
    if (touched.size) writePersonalTimes(times, id);
    return { changed: touched.size > 0, localNewer };
}

// --- Requests ---

async function post(body, keepalive) {
    const gap = REQUEST_GAP_MS - (Date.now() - lastRequestAt);
    if (gap > 0 && !keepalive) await wait(gap);
    lastRequestAt = Date.now();
    try {
        const res = await fetch(`${STREAM_ENGINE_API_BASE}/api/sync`, {
            method: 'POST',
            credentials: 'same-origin',
            keepalive,
            headers: { 'Content-Type': 'application/json', 'X-Tvzinha-Request': '1' },
            body,
        });
        let json = {};
        try {
            json = await res.json();
        } catch (e) {
            json = {};
        }
        return { status: res.status, json };
    } catch (e) {
        return { status: 0, json: { error: 'network' } };
    }
}

function setStatus(state, lastSync) {
    status = { state, lastSync: lastSync === undefined ? status.lastSync : lastSync };
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { ...status } }));
}

function failed(result) {
    const error = result.json && result.json.error;
    if (result.status === 401 || result.status === 404) {
        // Signed out elsewhere, or the profile was removed: /me tells the rest
        refreshAccount();
        setStatus('error');
        return false;
    }
    if (result.status === 429) {
        schedule(Math.max(5, Number(result.json.retryAfter) || 30) * 1000);
        setStatus('error');
        return false;
    }
    schedule(RETRY_MS[Math.min(failures, RETRY_MS.length - 1)]);
    failures++;
    setStatus(result.status === 0 || error === 'network' ? 'offline' : 'error');
    return false;
}

/** One full sync of a profile: true when it ended with nothing left to send. */
async function runSync(id, { keepalive = false } = {}) {
    if (!canSync(id)) return false;
    if (id === activeProfileId()) setStatus('syncing');
    const state = readSyncState(id);
    // One extra round sends back what this device had newer than the server's copy
    let sentNewer = false;
    for (let round = 0; round < 25; round++) {
        const now = Date.now();
        const pending = pendingRecords(id, now);
        const sent = pending.slice(0, BATCH);
        const body = JSON.stringify({ profileId: id, since: state.rev, changes: sent });
        const result = await post(body, keepalive && body.length < KEEPALIVE_BYTES);
        if (result.status !== 200) return failed(result);
        // The server has what was sent; what it answers replaces those fingerprints where it differs
        sent.forEach(r => { state.fp[recordId(r.kind, r.key)] = fingerprint(r.data); });
        const answer = Array.isArray(result.json.changes) ? result.json.changes : [];
        let outcome = { changed: false, localNewer: false };
        if (canSync(id)) outcome = applyRecords(id, answer, now);
        answer.forEach(r => {
            const clean = sanitizeRecord(r.kind, r.key, r.data, now);
            if (clean) state.fp[recordId(r.kind, r.key)] = fingerprint(clean);
        });
        if (Number.isInteger(result.json.rev)) state.rev = result.json.rev;
        state.lastSync = Date.now();
        writeSyncState(id, state);
        if (outcome.changed && id === activeProfileId()) {
            // The stores read again and the screens redraw; that redraw is not a new change to send
            applying = true;
            try {
                notifyProfileData();
            } finally {
                applying = false;
            }
        }
        const again = result.json.more || pending.length > BATCH || (outcome.localNewer && !sentNewer);
        if (outcome.localNewer) sentNewer = true;
        if (!again) {
            failures = 0;
            if (id === activeProfileId()) setStatus('ok', state.lastSync);
            return true;
        }
    }
    return false;
}

function accountHas(id) {
    const { signedIn, profiles } = getAccount();
    return signedIn && profiles.some(p => p.id === id);
}

function canSync(id = activeProfileId()) {
    return Boolean(id) && accountHas(id);
}

/** Queues a sync of the profile (one at a time; the same profile is not queued twice). */
function syncProfile(id, options = {}) {
    if (waiting.has(id)) return waiting.get(id);
    const run = chain.then(() => {
        waiting.delete(id);
        return runSync(id, options);
    }).catch(() => false);
    waiting.set(id, run);
    chain = run;
    return run;
}

/** A sync of the profile in use, after `delay` (an earlier one already set stays). */
function schedule(delay) {
    if (!canSync()) return;
    const at = Date.now() + delay;
    if (timer && timerAt <= at) return;
    clearTimeout(timer);
    timerAt = at;
    timer = setTimeout(() => {
        timer = null;
        timerAt = 0;
        syncNow();
    }, delay);
}

/** Syncs the profile in use now ("Sincronizar agora"). Resolves true when everything went. */
export function syncNow() {
    const id = activeProfileId();
    if (!canSync(id)) return Promise.resolve(false);
    clearTimeout(timer);
    timer = null;
    timerAt = 0;
    return syncProfile(id);
}

/** { state: idle | syncing | ok | offline | error, lastSync } */
export function getSyncStatus() {
    const id = activeProfileId();
    const lastSync = status.lastSync || (id ? readSyncState(id).lastSync : 0);
    return { state: status.state, lastSync };
}

/** The line under the profile in the menu. */
export function syncStatusText() {
    const { state, lastSync } = getSyncStatus();
    if (state === 'syncing') return 'Sincronizando...';
    if (state === 'offline') return 'Sem conexão: as mudanças esperam';
    if (state === 'error' && !lastSync) return 'Não deu para sincronizar agora';
    if (!lastSync) return 'Ainda não sincronizado';
    const minutes = Math.floor((Date.now() - lastSync) / 60000);
    if (minutes < 1) return 'Sincronizado agora';
    if (minutes < 60) return `Sincronizado há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Sincronizado há ${hours} h`;
    return `Sincronizado em ${new Date(lastSync).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;
}

/**
 * Sair: sends what is pending (up to 4 s), asks before leaving unsent changes behind, signs out and removes the
 * account's copies from this device (the guest data stays). Resolves true when signed out.
 */
export async function leaveAccount() {
    const { profiles } = getAccount();
    let allSent = true;
    for (const profile of profiles) {
        if (!hasPendingChanges(profile.id)) continue;
        const sent = await Promise.race([syncProfile(profile.id), wait(LEAVE_WAIT_MS).then(() => false)]);
        if (!sent || hasPendingChanges(profile.id)) allSent = false;
    }
    if (!allSent) {
        const leave = await confirmDialog({
            title: 'Algumas mudanças ainda não foram enviadas',
            text: 'O servidor não respondeu agora. Se você sair, o que mudou neste aparelho desde a última sincronização se perde.',
            confirm: 'Sair mesmo assim',
            cancel: 'Cancelar',
            danger: true
        });
        if (!leave) return false;
    }
    await signOut();
    forgetProfiles(profiles);
    return true;
}

/** The account's copies leave this device (signed out or deleted); the guest data stays. */
function forgetProfiles(profiles) {
    clearTimeout(timer);
    timer = null;
    timerAt = 0;
    for (const profile of profiles) {
        removeProfileData(profile.id);
        removeSyncState(profile.id);
    }
    setStatus('idle', 0);
}

/** Apagar conta (Configurações): on the server, then its copies on this device. Resolves the server's answer. */
export async function deleteAccountHere(password) {
    const { profiles } = getAccount();
    const result = await deleteAccount(password);
    if (result.status === 200) forgetProfiles(profiles);
    return result;
}

export function setupSync() {
    const onLocalChange = () => {
        if (!applying) schedule(CHANGE_DELAY_MS);
    };
    [LIBRARY_EVENT, PROGRESS_EVENT, PREFS_EVENT].forEach(name => window.addEventListener(name, onLocalChange));
    store.addEventListener('favorites:change', onLocalChange);
    store.addEventListener('team:change', onLocalChange);

    window.addEventListener(PROFILE_EVENT, (e) => {
        if (applying) return;
        const id = (e.detail && e.detail.profileId) || null;
        if (id !== lastProfileId) {
            const previous = lastProfileId;
            lastProfileId = id;
            status = { state: 'idle', lastSync: 0 };
            // What the profile left behind goes first
            if (previous && canSync(previous)) syncProfile(previous);
            if (id) schedule(800);
        } else if (id) {
            // Its data was replaced here (the guest data brought in)
            schedule(2000);
        }
    });

    window.addEventListener(ACCOUNT_EVENT, () => {
        const { signedIn, profiles } = getAccount();
        if (!signedIn) return;
        // A profile removed on another device: its copies here go too (only ones already synced, so nothing is lost)
        const ids = new Set(profiles.map(p => p.id));
        syncedProfileIds().filter(id => !ids.has(id)).forEach(id => {
            removeProfileData(id);
            removeSyncState(id);
        });
    });

    const leaving = () => {
        hiddenAt = Date.now();
        const id = activeProfileId();
        if (canSync(id) && hasPendingChanges(id)) syncProfile(id, { keepalive: true });
    };
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            leaving();
        } else if (hiddenAt && Date.now() - hiddenAt > RETURN_AFTER_MS) {
            hiddenAt = 0;
            schedule(500);
        }
    });
    window.addEventListener('pagehide', leaving);
    window.addEventListener('online', () => schedule(1000));

    // Opening the site: what changed elsewhere since the last visit
    schedule(1500);
}
