/**
 * Tvzinha Online - Cloudflare Pages Function: POST /api/sync (the data of a profile, between devices).
 *
 *   { profileId, since, changes: [{ kind, key, data }] }  ->  { rev, changes: [{ kind, key, data }], more }
 *
 * Signed in only (the account session cookie), for a profile of that account. Each change is checked and cut to the
 * known fields (assets/js/core/syncMerge.js, the same rules the page uses), merged with the stored copy (newest field
 * wins) and, when it really changed, stored with the profile's next change number (`rev`). The answer carries every
 * record changed after `since` (at most 500; `more` asks for the rest) and the merged copy of any record the device
 * sent behind the stored one.
 *
 * Limits: per IP in memory (shared with the account routes), one sync a second and 120 an hour per account, 10 000
 * records written a day per account, 300 changes per request, 16 KB per record, 5 000 records per profile.
 * `handleSync` takes a plain request and returns a plain answer (tools/local_sync.py mirrors it; keep both identical).
 */
import { sanitizeRecord, mergeRecord, sameRecord, stableStringify } from '../../assets/js/core/syncMerge.js';
import { currentSession, ipBlockedFor, blockedFor, addAttempt, cookieHeader, d1Database, SESSION_DAYS } from './account/[[path]].js';

export const SYNC_LIMITS = {
    secondMs: 1000,                                         // one sync a second per account (memory)
    hour: { max: 120, windowMs: 60 * 60 * 1000 },           // syncs per account
    writes: { max: 10000, windowMs: 24 * 60 * 60 * 1000 },  // records written per account
    changes: 300,                                           // per request
    records: 5000,                                          // per profile
    answer: 500,                                            // records per answer
    bodyBytes: 256 * 1024,
};

const lastSyncAt = new Map();

function parse(text) {
    try {
        return JSON.parse(text);
    } catch (e) {
        return null;
    }
}

/** Seconds until `amount` more fits in the window of `key`, or 0 when it fits now. */
async function countWait(db, key, rule, now, amount) {
    const row = await db.first('SELECT count, window_start FROM attempts WHERE key = ?', [key]);
    if (!row || now - row.window_start > rule.windowMs || row.count + amount <= rule.max) return 0;
    return Math.ceil((row.window_start + rule.windowMs - now) / 1000);
}

async function addCount(db, key, rule, now, amount) {
    const row = await db.first('SELECT count, window_start FROM attempts WHERE key = ?', [key]);
    if (!row || now - row.window_start > rule.windowMs) {
        await db.run('INSERT OR REPLACE INTO attempts (key, count, window_start) VALUES (?, ?, ?)', [key, amount, now]);
    } else {
        await db.run('UPDATE attempts SET count = count + ? WHERE key = ?', [amount, key]);
    }
}

/**
 * `req`: { method, body, cookie, origin, requestOrigin, customHeader, ip, now, secure }
 * `db`:  { first, all, run, batch } (d1Database in the account function)
 */
export async function handleSync(req, db) {
    const now = req.now;
    const reply = (status, json, setCookie = null) => ({ status, json, setCookie });
    const fail = (status, error, extra = {}) => reply(status, { error, ...extra });

    // Everything that needs no database first
    if (req.method !== 'POST') return fail(405, 'method_not_allowed');
    if (req.origin !== req.requestOrigin || req.customHeader !== '1') return fail(403, 'origin_forbidden');
    const ipWait = ipBlockedFor(req.ip, now);
    if (ipWait) return fail(429, 'too_many_attempts', { retryAfter: ipWait });
    const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
    const { profileId, since, changes } = body;
    if (typeof profileId !== 'string' || !profileId || profileId.length > 64 || !Number.isInteger(since) || since < 0 || !Array.isArray(changes)) {
        return fail(400, 'invalid_request');
    }
    if (changes.length > SYNC_LIMITS.changes) return fail(413, 'too_many_changes');

    const session = await currentSession(db, req.cookie, now);
    if (!session) return fail(401, 'not_signed_in');
    const accountId = session.account.id;
    if (now - (lastSyncAt.get(accountId) || 0) < SYNC_LIMITS.secondMs) return fail(429, 'too_many_attempts', { retryAfter: 1 });
    lastSyncAt.set(accountId, now);
    if (lastSyncAt.size > 5000) {
        for (const [k, at] of lastSyncAt) if (now - at > 60 * 1000) lastSyncAt.delete(k);
    }
    const hourKey = `sync-h:${accountId}`;
    const hourWait = await blockedFor(db, hourKey, SYNC_LIMITS.hour, now);
    if (hourWait) return fail(429, 'too_many_attempts', { retryAfter: hourWait });
    const profile = await db.first('SELECT id FROM profiles WHERE id = ? AND account_id = ? AND deleted_at IS NULL', [profileId, accountId]);
    if (!profile) return fail(404, 'not_found');
    await addAttempt(db, hourKey, SYNC_LIMITS.hour, now);

    // The changes, cleaned (anything unknown is dropped); the last copy of a record in one request wins
    const incoming = new Map();
    for (const change of changes) {
        if (!change || typeof change !== 'object') continue;
        const clean = sanitizeRecord(change.kind, change.key, change.data, now);
        if (clean) incoming.set(`${change.kind}\t${change.key}`, { kind: change.kind, key: change.key, data: clean });
    }
    const list = [...incoming.values()];

    // Their stored copies (D1 takes at most 100 bound values per query)
    const stored = new Map();
    for (let i = 0; i < list.length; i += 45) {
        const part = list.slice(i, i + 45);
        const where = part.map(() => '(kind = ? AND key = ?)').join(' OR ');
        const rows = await db.all(`SELECT kind, key, data FROM records WHERE profile_id = ? AND (${where})`, [profileId, ...part.flatMap(c => [c.kind, c.key])]);
        rows.forEach(row => stored.set(`${row.kind}\t${row.key}`, parse(row.data)));
    }

    const writes = [];
    const corrections = new Map();
    for (const change of list) {
        const id = `${change.kind}\t${change.key}`;
        const before = stored.get(id) || null;
        const merged = mergeRecord(change.kind, before, change.data);
        if (!before || !sameRecord(before, merged)) writes.push({ kind: change.kind, key: change.key, data: merged, isNew: !before });
        // The device's copy was behind (or was cleaned): it gets the merged one back
        if (!sameRecord(merged, change.data)) corrections.set(id, { kind: change.kind, key: change.key, data: merged });
    }

    if (writes.length) {
        const added = writes.filter(w => w.isNew).length;
        if (added) {
            const count = await db.first('SELECT COUNT(*) AS n FROM records WHERE profile_id = ?', [profileId]);
            if ((count ? count.n : 0) + added > SYNC_LIMITS.records) return fail(413, 'profile_full');
        }
        const writesKey = `sync-w:${accountId}`;
        const writesWait = await countWait(db, writesKey, SYNC_LIMITS.writes, now, writes.length);
        if (writesWait) return fail(429, 'too_many_attempts', { retryAfter: writesWait });
        // One transaction: the counter moves by the number of records, each record takes one number of that range
        const n = writes.length;
        const statements = [{
            sql: 'INSERT INTO counters (profile_id, rev) VALUES (?, ?) ON CONFLICT(profile_id) DO UPDATE SET rev = rev + ?',
            params: [profileId, n, n],
        }];
        writes.forEach((w, i) => statements.push({
            sql: 'INSERT OR REPLACE INTO records (profile_id, kind, key, data, updated_at, rev) VALUES (?, ?, ?, ?, ?, (SELECT rev FROM counters WHERE profile_id = ?) - ?)',
            params: [profileId, w.kind, w.key, stableStringify(w.data), now, profileId, n - 1 - i],
        }));
        await db.batch(statements);
        await addCount(db, writesKey, SYNC_LIMITS.writes, now, n);
    }

    // What changed since the device's last sync
    const rows = await db.all('SELECT kind, key, data, rev FROM records WHERE profile_id = ? AND rev > ? ORDER BY rev LIMIT ?', [profileId, since, SYNC_LIMITS.answer + 1]);
    const more = rows.length > SYNC_LIMITS.answer;
    const page = rows.slice(0, SYNC_LIMITS.answer);
    const counter = await db.first('SELECT rev FROM counters WHERE profile_id = ?', [profileId]);
    const rev = more ? page[page.length - 1].rev : Math.max(since, counter ? counter.rev : 0);
    const answer = new Map();
    for (const row of page) {
        const data = parse(row.data);
        if (data) answer.set(`${row.kind}\t${row.key}`, { kind: row.kind, key: row.key, data });
    }
    for (const [id, record] of corrections) if (!answer.has(id)) answer.set(id, record);

    const renew = session.renewed ? cookieHeader(session.token, SESSION_DAYS * 24 * 3600, req.secure) : null;
    return reply(200, { rev, changes: [...answer.values()], more }, renew);
}

export async function onRequest(context) {
    const { request, env } = context;
    const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
    if (!env || !env.DB) return new Response(JSON.stringify({ error: 'accounts_unavailable' }), { status: 503, headers });
    const url = new URL(request.url);
    let body = null;
    if (request.method === 'POST') {
        const text = await request.text();
        if (text.length > SYNC_LIMITS.bodyBytes) return new Response(JSON.stringify({ error: 'too_large' }), { status: 413, headers });
        try {
            body = text ? JSON.parse(text) : {};
        } catch (e) {
            return new Response(JSON.stringify({ error: 'invalid_json' }), { status: 400, headers });
        }
    }
    const result = await handleSync({
        method: request.method,
        body,
        cookie: request.headers.get('Cookie') || '',
        origin: request.headers.get('Origin'),
        requestOrigin: url.origin,
        customHeader: request.headers.get('X-Tvzinha-Request'),
        ip: request.headers.get('CF-Connecting-IP') || '',
        now: Date.now(),
        secure: url.protocol === 'https:',
    }, d1Database(env.DB));
    if (result.setCookie) headers['Set-Cookie'] = result.setCookie;
    return new Response(JSON.stringify(result.json), { status: result.status, headers });
}
