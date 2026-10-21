/**
 * Tvzinha Online - Cloudflare Pages Function: /api/account/* (accounts without e-mail).
 *
 *   POST register        { nickname, password }                 -> account, first profile, session, recovery code
 *   POST login           { nickname, password }                 -> account, profiles, session
 *   POST logout                                                   -> session removed
 *   GET  me                                                       -> account, profiles (401 when signed out)
 *   POST recover         { nickname, recoveryCode, newPassword } -> new recovery code, other sessions signed out
 *   POST password        { currentPassword, newPassword }        -> other sessions signed out
 *   POST recovery-code   { password }                            -> a new recovery code
 *   POST delete          { password }                            -> the account and everything in it removed
 *
 * The session lives in an HttpOnly cookie (scripts in the page cannot read it); the database keeps only a hash of it.
 * Writes must come from this same origin with the X-Tvzinha-Request header (other sites cannot post for the user).
 * Passwords and recovery codes are hashed with PBKDF2-SHA256 (and the ACCOUNTS_PEPPER secret when it is set).
 *
 * `handleAccount` takes a plain description of the request and returns a plain answer, so the same cases run here, in
 * tools/local_accounts.py (the local server's mirror; keep both identical) and in tools/accounts_api_check.mjs.
 * Database: the DB binding (D1), schema in tools/accounts_schema.sql.
 */

// Rounds of PBKDF2 for new passwords. Kept per account (password_iter), so it can change without breaking sign-ins.
export const PBKDF2_ITERATIONS = 100000;
export const SESSION_DAYS = 90;
// The cookie is sent again with a new expiry when it was last renewed this long ago
const SESSION_RENEW_MS = 24 * 3600 * 1000;
export const MAX_PROFILES = 5;
export const LIMITS = {
    nickname: { max: 5, windowMs: 15 * 60 * 1000 },   // wrong passwords or codes for one nickname
    device: { max: 30, windowMs: 60 * 60 * 1000 },    // wrong passwords or codes from one device (IP hash)
    register: { max: 10, windowMs: 60 * 60 * 1000 },  // accounts created from one device
};
export const COOKIE_NAME = 'tvz_session';
const RECOVERY_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';   // no 0/O, 1/I/L

const encoder = new TextEncoder();

// --- Rules (the page checks the same ones while the person types) ---

/** null when valid, else an error code. 3 to 20 letters, numbers, dot, dash or underscore. */
export function checkNickname(nickname) {
    if (typeof nickname !== 'string') return 'nickname_invalid';
    const value = nickname.trim();
    if (value.length < 3) return 'nickname_short';
    if (value.length > 20) return 'nickname_long';
    if (!/^[A-Za-z0-9._-]+$/.test(value)) return 'nickname_chars';
    return null;
}

/** null when valid, else an error code. At least 8 characters, a letter and a number, not the nickname. */
export function checkPassword(password, nickname = '') {
    if (typeof password !== 'string' || password.length < 8) return 'password_short';
    if (password.length > 200) return 'password_long';
    if (!/[A-Za-zÀ-ÿ]/.test(password)) return 'password_letter';
    if (!/[0-9]/.test(password)) return 'password_number';
    if (nickname && password.trim().toLowerCase() === String(nickname).trim().toLowerCase()) return 'password_is_nickname';
    return null;
}

/** "ABCD-EFGH-JKMN-PQRS": 16 characters people can copy by hand. */
export function newRecoveryCode() {
    const bytes = randomBytes(16);
    let code = '';
    for (let i = 0; i < 16; i++) {
        code += RECOVERY_ALPHABET[bytes[i] % RECOVERY_ALPHABET.length];
        if (i % 4 === 3 && i < 15) code += '-';
    }
    return code;
}

/** What people type back: case and dashes or spaces do not matter. */
export function normalizeRecoveryCode(code) {
    return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// --- Crypto helpers (Web Crypto: the same in Workers and Node) ---

function randomBytes(n) {
    const bytes = new Uint8Array(n);
    crypto.getRandomValues(bytes);
    return bytes;
}

function toHex(bytes) {
    return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex) {
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
    return out;
}

function toBase64Url(bytes) {
    let text = '';
    for (const b of bytes) text += String.fromCharCode(b);
    return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function sha256Hex(text) {
    return toHex(await crypto.subtle.digest('SHA-256', encoder.encode(text)));
}

async function hmacHex(secret, text) {
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(text)));
}

/** PBKDF2-SHA256, 32 bytes, hex. With a pepper, the password first goes through HMAC with it. */
export async function hashSecret(secret, saltHex, iterations, pepper = '') {
    const input = pepper ? await hmacHex(pepper, secret) : secret;
    const key = await crypto.subtle.importKey('raw', encoder.encode(input), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations }, key, 256);
    return toHex(bits);
}

/** Same length strings compared without stopping at the first difference. */
function safeEqual(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}

// --- Attempt limits ---

/** Seconds to wait when `key` used up its tries in the window, else 0. */
async function blockedFor(db, key, rule, now) {
    const row = await db.first('SELECT count, window_start FROM attempts WHERE key = ?', [key]);
    if (!row || now - row.window_start > rule.windowMs || row.count < rule.max) return 0;
    return Math.ceil((row.window_start + rule.windowMs - now) / 1000);
}

async function addAttempt(db, key, rule, now) {
    const row = await db.first('SELECT count, window_start FROM attempts WHERE key = ?', [key]);
    if (!row || now - row.window_start > rule.windowMs) {
        await db.run('INSERT OR REPLACE INTO attempts (key, count, window_start) VALUES (?, 1, ?)', [key, now]);
    } else {
        await db.run('UPDATE attempts SET count = count + 1 WHERE key = ?', [key]);
    }
    // Old windows are kept no longer than a day
    await db.run('DELETE FROM attempts WHERE window_start < ?', [now - 24 * 3600 * 1000]);
}

// --- Sessions and the cookie ---

function cookieHeader(token, maxAgeSeconds, secure) {
    return `${COOKIE_NAME}=${token}; Path=/api; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure ? '; Secure' : ''}`;
}

export function readCookie(cookieText, name = COOKIE_NAME) {
    for (const part of String(cookieText || '').split(';')) {
        const [k, ...v] = part.trim().split('=');
        if (k === name) return v.join('=');
    }
    return '';
}

async function createSession(db, accountId, now) {
    const token = toBase64Url(randomBytes(32));
    const expires = now + SESSION_DAYS * 24 * 3600 * 1000;
    await db.run('INSERT INTO sessions (token_hash, account_id, created_at, last_seen_at, expires_at) VALUES (?, ?, ?, ?, ?)',
        [await sha256Hex(token), accountId, now, now, expires]);
    return token;
}

/** { account, tokenHash, renewed } for the cookie's session, or null. */
async function currentSession(db, cookieText, now) {
    const token = readCookie(cookieText);
    if (!token || token.length > 100) return null;
    const tokenHash = await sha256Hex(token);
    const session = await db.first('SELECT account_id, last_seen_at, expires_at FROM sessions WHERE token_hash = ?', [tokenHash]);
    if (!session) return null;
    if (session.expires_at <= now) {
        await db.run('DELETE FROM sessions WHERE token_hash = ?', [tokenHash]);
        return null;
    }
    const account = await db.first('SELECT * FROM accounts WHERE id = ?', [session.account_id]);
    if (!account) return null;
    let renewed = false;
    if (now - session.last_seen_at > SESSION_RENEW_MS) {
        await db.run('UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE token_hash = ?',
            [now, now + SESSION_DAYS * 24 * 3600 * 1000, tokenHash]);
        renewed = true;
    }
    return { account, token, tokenHash, renewed };
}

// --- Shapes sent to the page (never hashes, salts or ids of other accounts) ---

async function profilesOf(db, accountId) {
    const rows = await db.all('SELECT id, name, avatar, position FROM profiles WHERE account_id = ? AND deleted_at IS NULL ORDER BY position, created_at', [accountId]);
    return rows.map(p => ({ id: p.id, name: p.name, avatar: p.avatar }));
}

async function accountView(db, account) {
    return {
        account: { nickname: account.nickname, createdAt: account.created_at },
        profiles: await profilesOf(db, account.id),
    };
}

async function verifyPassword(account, password, pepper) {
    if (typeof password !== 'string' || !password) return false;
    const hash = await hashSecret(password, account.password_salt, account.password_iter, account.peppered ? pepper : '');
    return safeEqual(hash, account.password_hash);
}

async function newSecretHash(secret, pepper) {
    const salt = toHex(randomBytes(16));
    return { salt, hash: await hashSecret(secret, salt, PBKDF2_ITERATIONS, pepper), iterations: PBKDF2_ITERATIONS };
}

// --- The handler ---

/**
 * `req`: { method, path ('register', 'login'...), body (parsed JSON or null), cookie, origin, requestOrigin,
 *          customHeader (value of X-Tvzinha-Request), ip, now, secure, pepper }
 * `db`:  { first(sql, params), all(sql, params), run(sql, params) }
 * Returns { status, json, setCookie }.
 */
export async function handleAccount(req, db) {
    const now = req.now;
    const reply = (status, json, setCookie = null) => ({ status, json, setCookie });
    const fail = (status, error, extra = {}) => reply(status, { error, ...extra });

    const isWrite = req.method === 'POST';
    if (req.method !== 'GET' && req.method !== 'POST') return fail(405, 'method_not_allowed');
    if (req.path === 'me' ? req.method !== 'GET' : req.method !== 'POST') return fail(405, 'method_not_allowed');
    // Writes only from this site's own pages
    if (isWrite && (req.origin !== req.requestOrigin || req.customHeader !== '1')) return fail(403, 'origin_forbidden');

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const pepper = req.pepper || '';
    const deviceKey = `ip:${await sha256Hex(`${req.ip || 'unknown'}|${new Date(now).toISOString().slice(0, 10)}|${pepper}`)}`;
    const clearCookie = cookieHeader('', 0, req.secure);
    const sessionCookie = (token) => cookieHeader(token, SESSION_DAYS * 24 * 3600, req.secure);

    switch (req.path) {
        case 'register': {
            const nicknameError = checkNickname(body.nickname);
            if (nicknameError) return fail(400, nicknameError);
            const nickname = body.nickname.trim();
            const passwordError = checkPassword(body.password, nickname);
            if (passwordError) return fail(400, passwordError);
            const registerKey = `reg:${deviceKey}`;
            const wait = await blockedFor(db, registerKey, LIMITS.register, now);
            if (wait) return fail(429, 'too_many_attempts', { retryAfter: wait });
            const key = nickname.toLowerCase();
            if (await db.first('SELECT id FROM accounts WHERE nickname_key = ?', [key])) return fail(409, 'nickname_taken');

            const password = await newSecretHash(body.password, pepper);
            const recoveryCode = newRecoveryCode();
            const recovery = await newSecretHash(normalizeRecoveryCode(recoveryCode), pepper);
            const accountId = crypto.randomUUID();
            await db.run(`INSERT INTO accounts (id, nickname, nickname_key, password_hash, password_salt, password_iter, peppered,
                recovery_hash, recovery_salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [accountId, nickname, key, password.hash, password.salt, password.iterations, pepper ? 1 : 0, recovery.hash, recovery.salt, now, now]);
            await db.run('INSERT INTO profiles (id, account_id, name, avatar, position, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)',
                [crypto.randomUUID(), accountId, nickname, 'a01', now, now]);
            await addAttempt(db, registerKey, LIMITS.register, now);
            const token = await createSession(db, accountId, now);
            const account = await db.first('SELECT * FROM accounts WHERE id = ?', [accountId]);
            return reply(201, { ...(await accountView(db, account)), recoveryCode }, sessionCookie(token));
        }

        case 'login': {
            if (typeof body.nickname !== 'string' || typeof body.password !== 'string') return fail(400, 'missing_fields');
            const key = body.nickname.trim().toLowerCase();
            const nicknameKey = `nick:${key}`;
            const wait = Math.max(await blockedFor(db, nicknameKey, LIMITS.nickname, now), await blockedFor(db, deviceKey, LIMITS.device, now));
            if (wait) return fail(429, 'too_many_attempts', { retryAfter: wait });
            const account = await db.first('SELECT * FROM accounts WHERE nickname_key = ?', [key]);
            if (!account || !(await verifyPassword(account, body.password, pepper))) {
                await addAttempt(db, nicknameKey, LIMITS.nickname, now);
                await addAttempt(db, deviceKey, LIMITS.device, now);
                return fail(401, 'wrong_credentials');
            }
            await db.run('DELETE FROM attempts WHERE key = ?', [nicknameKey]);
            const token = await createSession(db, account.id, now);
            return reply(200, await accountView(db, account), sessionCookie(token));
        }

        case 'logout': {
            const token = readCookie(req.cookie);
            if (token) await db.run('DELETE FROM sessions WHERE token_hash = ?', [await sha256Hex(token)]);
            return reply(200, { ok: true }, clearCookie);
        }

        case 'me': {
            const session = await currentSession(db, req.cookie, now);
            if (!session) return reply(401, { error: 'not_signed_in' }, req.cookie && readCookie(req.cookie) ? clearCookie : null);
            return reply(200, await accountView(db, session.account), session.renewed ? sessionCookie(session.token) : null);
        }

        case 'recover': {
            if (typeof body.nickname !== 'string' || typeof body.recoveryCode !== 'string') return fail(400, 'missing_fields');
            const key = body.nickname.trim().toLowerCase();
            const nicknameKey = `nick:${key}`;
            const wait = Math.max(await blockedFor(db, nicknameKey, LIMITS.nickname, now), await blockedFor(db, deviceKey, LIMITS.device, now));
            if (wait) return fail(429, 'too_many_attempts', { retryAfter: wait });
            const account = await db.first('SELECT * FROM accounts WHERE nickname_key = ?', [key]);
            const code = normalizeRecoveryCode(body.recoveryCode);
            const valid = account && code.length === 16 &&
                safeEqual(await hashSecret(code, account.recovery_salt, account.password_iter, account.peppered ? pepper : ''), account.recovery_hash);
            if (!valid) {
                await addAttempt(db, nicknameKey, LIMITS.nickname, now);
                await addAttempt(db, deviceKey, LIMITS.device, now);
                return fail(401, 'wrong_recovery');
            }
            const passwordError = checkPassword(body.newPassword, account.nickname);
            if (passwordError) return fail(400, passwordError);
            const password = await newSecretHash(body.newPassword, pepper);
            const recoveryCode = newRecoveryCode();
            const recovery = await newSecretHash(normalizeRecoveryCode(recoveryCode), pepper);
            await db.run(`UPDATE accounts SET password_hash = ?, password_salt = ?, password_iter = ?, peppered = ?, recovery_hash = ?,
                recovery_salt = ?, updated_at = ? WHERE id = ?`,
                [password.hash, password.salt, password.iterations, pepper ? 1 : 0, recovery.hash, recovery.salt, now, account.id]);
            await db.run('DELETE FROM sessions WHERE account_id = ?', [account.id]);
            await db.run('DELETE FROM attempts WHERE key = ?', [nicknameKey]);
            const token = await createSession(db, account.id, now);
            const updated = await db.first('SELECT * FROM accounts WHERE id = ?', [account.id]);
            return reply(200, { ...(await accountView(db, updated)), recoveryCode }, sessionCookie(token));
        }

        case 'password':
        case 'recovery-code':
        case 'delete': {
            const session = await currentSession(db, req.cookie, now);
            if (!session) return fail(401, 'not_signed_in');
            const account = session.account;
            const nicknameKey = `nick:${account.nickname_key}`;
            const wait = await blockedFor(db, nicknameKey, LIMITS.nickname, now);
            if (wait) return fail(429, 'too_many_attempts', { retryAfter: wait });
            const given = req.path === 'password' ? body.currentPassword : body.password;
            if (!(await verifyPassword(account, given, pepper))) {
                await addAttempt(db, nicknameKey, LIMITS.nickname, now);
                return fail(401, 'wrong_password');
            }
            if (req.path === 'password') {
                const passwordError = checkPassword(body.newPassword, account.nickname);
                if (passwordError) return fail(400, passwordError);
                const password = await newSecretHash(body.newPassword, pepper);
                await db.run('UPDATE accounts SET password_hash = ?, password_salt = ?, password_iter = ?, peppered = ?, updated_at = ? WHERE id = ?',
                    [password.hash, password.salt, password.iterations, pepper ? 1 : 0, now, account.id]);
                // Other devices sign in again with the new password
                await db.run('DELETE FROM sessions WHERE account_id = ? AND token_hash <> ?', [account.id, session.tokenHash]);
                return reply(200, { ok: true });
            }
            if (req.path === 'recovery-code') {
                // Hashed like the account's password (same rounds and pepper), as the recovery check expects
                const recoveryCode = newRecoveryCode();
                const salt = toHex(randomBytes(16));
                const hash = await hashSecret(normalizeRecoveryCode(recoveryCode), salt, account.password_iter, account.peppered ? pepper : '');
                await db.run('UPDATE accounts SET recovery_hash = ?, recovery_salt = ?, updated_at = ? WHERE id = ?', [hash, salt, now, account.id]);
                return reply(200, { recoveryCode });
            }
            // delete: everything of the account, at once
            const profiles = await db.all('SELECT id FROM profiles WHERE account_id = ?', [account.id]);
            for (const profile of profiles) {
                await db.run('DELETE FROM records WHERE profile_id = ?', [profile.id]);
                await db.run('DELETE FROM counters WHERE profile_id = ?', [profile.id]);
            }
            await db.run('DELETE FROM profiles WHERE account_id = ?', [account.id]);
            await db.run('DELETE FROM sessions WHERE account_id = ?', [account.id]);
            await db.run('DELETE FROM attempts WHERE key = ?', [nicknameKey]);
            await db.run('DELETE FROM accounts WHERE id = ?', [account.id]);
            return reply(200, { ok: true }, clearCookie);
        }

        default:
            return fail(404, 'not_found');
    }
}

// --- Cloudflare glue ---

/** The D1 binding behind the small interface handleAccount uses. */
export function d1Database(d1) {
    return {
        first: (sql, params = []) => d1.prepare(sql).bind(...params).first(),
        all: async (sql, params = []) => (await d1.prepare(sql).bind(...params).all()).results || [],
        run: (sql, params = []) => d1.prepare(sql).bind(...params).run(),
    };
}

export async function onRequest(context) {
    const { request, env, params } = context;
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
    if (!env || !env.DB) return new Response(JSON.stringify({ error: 'accounts_unavailable' }), { status: 503, headers });
    const url = new URL(request.url);
    const path = Array.isArray(params.path) ? params.path.join('/') : String(params.path || '');
    let body = null;
    if (request.method === 'POST') {
        const text = await request.text();
        if (text.length > 4096) return new Response(JSON.stringify({ error: 'too_large' }), { status: 413, headers });
        try {
            body = text ? JSON.parse(text) : {};
        } catch (e) {
            return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers });
        }
    }
    const result = await handleAccount({
        method: request.method,
        path,
        body,
        cookie: request.headers.get('Cookie') || '',
        origin: request.headers.get('Origin'),
        requestOrigin: url.origin,
        customHeader: request.headers.get('X-Tvzinha-Request'),
        ip: request.headers.get('CF-Connecting-IP') || '',
        now: Date.now(),
        secure: url.protocol === 'https:',
        pepper: env.ACCOUNTS_PEPPER || '',
    }, d1Database(env.DB));
    if (result.setCookie) headers['Set-Cookie'] = result.setCookie;
    return new Response(JSON.stringify(result.json), { status: result.status, headers });
}
