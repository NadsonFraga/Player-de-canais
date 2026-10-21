/**
 * Runs tools/accounts_cases.json against the Cloudflare function (functions/api/account/[[path]].js), with Node's
 * built-in SQLite standing in for D1. tools/test_accounts_api.py runs the same cases against the local server's mirror.
 *
 *   node tools/accounts_api_check.mjs
 */
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

const { handleAccount } = await import(new URL("../functions/api/account/[[path]].js", import.meta.url));
const cases = JSON.parse(readFileSync(new URL("./accounts_cases.json", import.meta.url), "utf8"));
const schema = readFileSync(new URL("./accounts_schema.sql", import.meta.url), "utf8");

const sqlite = new DatabaseSync(":memory:");
sqlite.exec(schema);
const db = {
  first: async (sql, params = []) => sqlite.prepare(sql).get(...params) ?? null,
  all: async (sql, params = []) => sqlite.prepare(sql).all(...params),
  run: async (sql, params = []) => sqlite.prepare(sql).run(...params),
};

const SITE = "https://tvzinha.example";
const cookies = {};
const saved = {};
let clock = Date.UTC(2026, 9, 21, 12, 0, 0);
let failed = 0;

/** "{code1}" -> the saved value; "{code1:loose}" -> lower case, no dashes (people type it that way). */
function fill(value) {
  if (typeof value === "string") {
    return value.replace(/\{(\w+)(:loose)?\}/g, (_, name, loose) => (loose ? String(saved[name]).toLowerCase().replace(/-/g, "") : saved[name]));
  }
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fill(v)]));
  return value;
}

function pick(json, dotted) {
  return dotted.split(".").reduce((value, part) => (value == null ? undefined : value[part]), json);
}

// Turnstile, faked: 'ok-<route>' passes, 'unavailable' is Cloudflare unreachable, anything else fails
const verifyCaptcha = async (token, action) => (token === `ok-${action}` ? "ok" : token === "unavailable" ? "unavailable" : "failed");
const CAPTCHA_ROUTES = { register: "register", recover: "recover", login: "login" };
function withCaptcha(step, body) {
  const action = CAPTCHA_ROUTES[step.path];
  if (!action || step.noCaptcha || !body || "turnstileToken" in body) return body;
  return { ...body, turnstileToken: `ok-${action}` };
}

for (const step of cases.steps) {
  clock += step.advance || 0;
  clock += 1000;
  const origin = step.origin === "other" ? "https://outro-site.example" : step.origin === "none" ? null : SITE;
  const result = await handleAccount({
    method: step.method || "POST",
    path: step.path,
    body: step.body ? withCaptcha(step, fill(step.body)) : null,
    cookie: cookies[step.device] ? `tvz_session=${cookies[step.device]}` : "",
    origin,
    requestOrigin: SITE,
    customHeader: step.header === false ? null : "1",
    ip: cases.devices[step.device],
    now: clock,
    secure: true,
    pepper: "",
  }, db, { verifyCaptcha });

  // The browser keeps or drops the cookie
  if (result.setCookie) {
    const value = /^tvz_session=([^;]*)/.exec(result.setCookie)[1];
    const maxAge = Number(/Max-Age=(\d+)/.exec(result.setCookie)[1]);
    cookies[step.device] = maxAge > 0 ? value : "";
  }

  const problems = [];
  const expect = step.expect;
  if (result.status !== expect.status) problems.push(`status ${result.status} (expected ${expect.status})`);
  if ("error" in expect && result.json.error !== expect.error) problems.push(`error ${result.json.error} (expected ${expect.error})`);
  for (const field of expect.has || []) if (result.json[field] == null) problems.push(`no ${field}`);
  for (const [path, value] of Object.entries(expect.json || {})) {
    const got = pick(result.json, path);
    if (got !== value) problems.push(`${path} = ${JSON.stringify(got)} (expected ${JSON.stringify(value)})`);
  }
  if (expect.cookie === "set" && !(result.setCookie && /Max-Age=[1-9]/.test(result.setCookie))) problems.push("no session cookie");
  if (expect.cookie === "cleared" && !(result.setCookie && /Max-Age=0/.test(result.setCookie))) problems.push("cookie not cleared");
  if (result.setCookie && !/HttpOnly/.test(result.setCookie)) problems.push("cookie without HttpOnly");
  // Nothing secret ever leaves the server
  if (/hash|salt|token/i.test(JSON.stringify(result.json))) problems.push("a secret field in the answer");
  for (const [name, field] of Object.entries(step.save || {})) saved[name] = pick(result.json, field);

  if (problems.length) failed++;
  console.log(`${problems.length ? "FAIL" : "OK  "} ${step.name}${problems.length ? " -> " + problems.join("; ") : ""}`);
}

console.log(`\n${cases.steps.length - failed}/${cases.steps.length} passed (JavaScript function)`);
process.exit(failed ? 1 : 0);
