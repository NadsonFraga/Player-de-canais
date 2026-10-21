/**
 * Runs tools/sync_cases.json against the sync rules (assets/js/core/syncMerge.js) and the Cloudflare function
 * (functions/api/sync.js, with the account function for the sessions), Node's built-in SQLite standing in for D1.
 * tools/test_sync_api.py runs the same cases against the local server's mirror (tools/local_sync.py).
 *
 *   node tools/sync_api_check.mjs
 */
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

const { handleAccount } = await import(new URL("../functions/api/account/[[path]].js", import.meta.url));
const { handleSync } = await import(new URL("../functions/api/sync.js", import.meta.url));
const { sanitizeRecord, mergeRecord, stableStringify } = await import(new URL("../assets/js/core/syncMerge.js", import.meta.url));
const cases = JSON.parse(readFileSync(new URL("./sync_cases.json", import.meta.url), "utf8"));
const schema = readFileSync(new URL("./accounts_schema.sql", import.meta.url), "utf8");

const sqlite = new DatabaseSync(":memory:");
sqlite.exec(schema);
const db = {
  first: async (sql, params = []) => sqlite.prepare(sql).get(...params) ?? null,
  all: async (sql, params = []) => sqlite.prepare(sql).all(...params),
  run: async (sql, params = []) => sqlite.prepare(sql).run(...params),
  batch: async (statements) => {
    sqlite.exec("BEGIN");
    try {
      for (const s of statements) sqlite.prepare(s.sql).run(...s.params);
      sqlite.exec("COMMIT");
    } catch (e) {
      sqlite.exec("ROLLBACK");
      throw e;
    }
  },
};

const SITE = "https://tvzinha.example";
let total = 0;
let failed = 0;
const report = (name, problems) => {
  total++;
  if (problems.length) failed++;
  console.log(`${problems.length ? "FAIL" : "OK  "} ${name}${problems.length ? " -> " + problems.join("; ") : ""}`);
};

// 1. What a record may hold
for (const c of cases.sanitize) {
  const got = sanitizeRecord(c.kind, c.key, c.data, c.now);
  const same = stableStringify(got) === stableStringify(c.expect);
  report(`sanitize: ${c.name}`, same ? [] : [`got ${stableStringify(got)}`]);
}

// 2. How two copies merge (both cleaned first, as the server does)
for (const c of cases.merge) {
  const stored = sanitizeRecord(c.kind, c.key, c.stored, c.now);
  const incoming = sanitizeRecord(c.kind, c.key, c.incoming, c.now);
  const got = mergeRecord(c.kind, stored, incoming);
  const again = mergeRecord(c.kind, got, incoming);
  const problems = [];
  if (stableStringify(got) !== stableStringify(c.expect)) problems.push(`got ${stableStringify(got)}`);
  if (stableStringify(again) !== stableStringify(got)) problems.push("merging the same copy again changed it");
  if (stableStringify(mergeRecord(c.kind, incoming, stored)) !== stableStringify(got)) problems.push("the other order gives another answer");
  report(`merge: ${c.name}`, problems);
}

// 3. The route
const cookies = {};
const saved = {};
let clock = cases.now;

function fill(value, now) {
  if (typeof value === "string") {
    const many = /^\{many:(\d+)(?::(\d+))?\}$/.exec(value);
    if (many) return Array.from({ length: Number(many[1]) }, (_, i) => ({ kind: "favorite", key: `ch${Number(many[2] || 0) + i}`, data: { on: true, at: cases.now } }));
    const time = /^\{now(?:-(\d+))?\}$/.exec(value);
    if (time) return now - Number(time[1] || 0);
    const whole = /^\{(\w+)\}$/.exec(value);
    if (whole && whole[1] in saved) return saved[whole[1]];
    return value;
  }
  if (Array.isArray(value)) return value.map(v => fill(v, now));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fill(v, now)]));
  return value;
}

function pick(json, dotted) {
  const value = dotted.split(".").reduce((v, part) => (v == null ? undefined : v[part]), json);
  return value === undefined ? null : value;
}

for (const step of cases.steps) {
  clock += step.advance ?? 1100;
  const origin = step.origin === "other" ? "https://outro-site.example" : step.origin === "none" ? null : SITE;
  const req = {
    method: step.method || "POST",
    body: step.body ? fill(step.body, clock) : null,
    cookie: cookies[step.device] ? `tvz_session=${cookies[step.device]}` : "",
    origin,
    requestOrigin: SITE,
    customHeader: step.header === false ? null : "1",
    ip: cases.devices[step.device],
    now: clock,
    secure: true,
    pepper: "",
  };
  const accountPath = step.route.slice("account/".length);
  // Turnstile, faked (accounts_api_check.mjs has the cases): every sign-up and sign-in here passes it
  if (["register", "recover", "login"].includes(accountPath) && req.body) req.body = { turnstileToken: `ok-${accountPath}`, ...req.body };
  const result = step.route === "sync"
    ? await handleSync(req, db)
    : await handleAccount({ ...req, path: accountPath }, db, { verifyCaptcha: async (token, action) => (token === `ok-${action}` ? "ok" : "failed") });
  if (result.setCookie) {
    const value = /^tvz_session=([^;]*)/.exec(result.setCookie)[1];
    cookies[step.device] = Number(/Max-Age=(\d+)/.exec(result.setCookie)[1]) > 0 ? value : "";
  }

  const expect = fill(step.expect, clock);
  const problems = [];
  if (result.status !== expect.status) problems.push(`status ${result.status} (expected ${expect.status})`);
  if ("error" in expect && result.json.error !== expect.error) problems.push(`error ${result.json.error} (expected ${expect.error})`);
  for (const [path, value] of Object.entries(expect.json || {})) {
    const got = pick(result.json, path);
    if (got !== value) problems.push(`${path} = ${JSON.stringify(got)} (expected ${JSON.stringify(value)})`);
  }
  for (const r of expect.record || []) {
    const record = (result.json.changes || []).find(c => c.kind === r.kind && c.key === r.key);
    const got = record ? pick(record, r.path) : "(no record)";
    if (got !== r.value) problems.push(`${r.kind} ${r.key} ${r.path} = ${JSON.stringify(got)} (expected ${JSON.stringify(r.value)})`);
  }
  if (/hash|salt|token|password/i.test(JSON.stringify(result.json))) problems.push("a secret field in the answer");
  for (const [name, field] of Object.entries(step.save || {})) saved[name] = pick(result.json, field);
  report(step.name, problems);
}

console.log(`\n${total - failed}/${total} passed (JavaScript)`);
process.exit(failed ? 1 : 0);
