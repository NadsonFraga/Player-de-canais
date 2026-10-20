/**
 * Checks that HLS plays straight from the host when it allows it, with our proxy as the fallback (D11):
 *   1. a series episode (MGEB) plays with no /api/stream call after it starts
 *   2. with the host's own playlist address blocked, the same source falls back to the proxy and plays
 *   3. an anime (host that needs its Referer) keeps playing through the proxy
 *
 *   node tools/direct_hls_check.mjs [--browser=chrome|edge|firefox] [--only=1,3]   (chrome by default)
 *
 * Needs `python tools/local_server.py` on 127.0.0.1:8787 and internet (real sources). Requests are counted from the
 * page's resource timing; the block of scenario 2 uses CDP Fetch / WebDriver BiDi network intercepts.
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = "http://127.0.0.1:8787";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const FIREFOX = "C:\\Program Files\\Mozilla Firefox\\firefox.exe";
const browserName = (process.argv.find(a => a.startsWith("--browser=")) || "--browser=chrome").split("=")[1];
const ONLY = ((process.argv.find(a => a.startsWith("--only=")) || "").split("=")[1] || "").split(",").filter(Boolean);
const runs = (n) => !ONLY.length || ONLY.includes(String(n));
const VERSION = readFileSync(new URL("../index.html", import.meta.url), "utf8").match(/main\.js\?v=([^"]+)/)[1];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = "") => { results.push(ok); console.log(`${ok ? "OK  " : "FAIL"} ${name}${detail ? " " + detail : ""}`); };
let launchCount = 0;

// The host's own playlist address (not our proxy, whose address starts with http://127.0.0.1)
const isDirectPlaylist = (url) => /^https:\/\//i.test(url) && /\.m3u8/i.test(url);

async function connectWs(url) {
  for (let i = 0; i < 80; i++) {
    try { const ws = new WebSocket(url); await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; }); return ws; } catch { await sleep(250); }
  }
  throw new Error("no connection to " + url);
}

function rpc(ws, isBidi, onEvent) {
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      (isBidi ? msg.type === "error" : msg.error) ? rej(new Error(JSON.stringify(msg.error || msg.message))) : res(msg.result);
    } else if (msg.method) onEvent(msg.method, msg.params);
  };
  return (method, params = {}) => new Promise((res, rej) => { const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method, params })); });
}

/** Fresh muted browser; with `blockDirect`, the host's own playlist requests fail. { evaluate, navigate, logs, close } */
async function launch(name, blockDirect) {
  const profile = mkdtempSync(join(tmpdir(), `tvz-direct-${name}-`));
  const port = 9100 + (launchCount++ % 8) * 10 + Math.floor(Math.random() * 10);
  const logs = [];
  if (name === "firefox") {
    writeFileSync(join(profile, "user.js"), 'user_pref("media.volume_scale", "0.0");\nuser_pref("media.autoplay.default", 0);\n');
    const proc = spawn(FIREFOX, ["--headless", "--remote-debugging-port", String(port), "--profile", profile, "--no-remote", "--width=1280", "--height=800"], { stdio: "ignore" });
    const ws = await connectWs(`ws://127.0.0.1:${port}/session`);
    let send;
    const onEvent = (method, params) => {
      if (method === "log.entryAdded" && /PlayerEngine/.test(params.text || "")) logs.push(params.text);
      if (method !== "network.beforeRequestSent" || !params.isBlocked) return;
      const request = params.request.request;
      send(isDirectPlaylist(params.request.url) ? "network.failRequest" : "network.continueRequest", { request }).catch(() => {});
    };
    send = rpc(ws, true, onEvent);
    await send("session.new", { capabilities: {} });
    const context = (await send("browsingContext.getTree", {})).contexts[0].context;
    await send("session.subscribe", { events: ["log.entryAdded", ...(blockDirect ? ["network.beforeRequestSent"] : [])] });
    if (blockDirect) await send("network.addIntercept", { phases: ["beforeRequestSent"] });
    return {
      logs,
      navigate: (url) => send("browsingContext.navigate", { context, url, wait: "none" }),
      evaluate: async (expr) => {
        const r = await send("script.evaluate", { expression: `(async () => JSON.stringify(await (${expr})))()`, target: { context }, awaitPromise: true, resultOwnership: "none", userActivation: true });
        if (r.type === "exception") throw new Error(r.exceptionDetails.text);
        return JSON.parse(r.result.value ?? "null");
      },
      close: () => { try { ws.close(); } catch {} try { spawnSync("taskkill", ["/PID", String(proc.pid), "/T", "/F"], { stdio: "ignore" }); } catch {} },
    };
  }
  const proc = spawn(name === "edge" ? EDGE : CHROME, ["--headless=new", `--remote-debugging-port=${port}`, "--remote-allow-origins=*", `--user-data-dir=${profile}`,
    "--no-first-run", "--mute-audio", "--autoplay-policy=no-user-gesture-required", "--window-size=1280,800", "about:blank"], { stdio: "ignore" });
  let page;
  for (let i = 0; i < 80 && !page; i++) { try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === "page"); } catch {} if (!page) await sleep(250); }
  const ws = await connectWs(page.webSocketDebuggerUrl);
  let send;
  const onEvent = (method, params) => {
    if (method === "Runtime.consoleAPICalled") {
      const text = params.args.map(a => a.value ?? a.description ?? "").join(" ");
      if (text.includes("[PlayerEngine]")) logs.push(text);
    }
    if (method === "Fetch.requestPaused") {
      const requestId = params.requestId;
      if (isDirectPlaylist(params.request.url)) send("Fetch.failRequest", { requestId, errorReason: "BlockedByClient" }).catch(() => {});
      else send("Fetch.continueRequest", { requestId }).catch(() => {});
    }
  };
  send = rpc(ws, false, onEvent);
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Network.enable");
  await send("Network.setCacheDisabled", { cacheDisabled: true });
  if (blockDirect) await send("Fetch.enable", { patterns: [{ urlPattern: "https://*" }] });
  return {
    logs,
    navigate: (url) => send("Page.navigate", { url }),
    evaluate: async (expr) => {
      const r = await send("Runtime.evaluate", { expression: `(async () => JSON.stringify(await (${expr})))()`, awaitPromise: true, returnByValue: true, userGesture: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return JSON.parse(r.result.value ?? "null");
    },
    close: () => { try { ws.close(); } catch {} try { spawnSync("taskkill", ["/PID", String(proc.pid), "/T", "/F"], { stdio: "ignore" }); } catch {} },
  };
}

async function waitFor(b, expr, timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) { if (await b.evaluate(expr).catch(() => false)) return Date.now() - t0; await sleep(500); }
  return null;
}

const PLAYING = "(() => { const v = document.querySelector('#series-artplayer-container video'); return Boolean(v && v.currentTime > 1 && !v.paused); })()";
// Requests made so far: through our proxy, and HLS fetched from other hosts (playlists and segments)
const COUNTS = `(() => { const e = performance.getEntriesByType('resource').map(r => r.name);
  return { proxy: e.filter(n => n.includes('/api/stream')).length, direct: e.filter(n => /^https:/.test(n) && /\\.m3u8|\\.ts(\\?|$)|\\/seg|\\.jpg|\\.png/.test(n) && !/image\\.tmdb|jsdelivr|fonts\\./.test(n)).length }; })()`;

async function openEpisode(b, show, view) {
  // A fresh browser sometimes misses the first navigation: one more try
  for (let attempt = 0; attempt < 2; attempt++) {
    await b.navigate(BASE + "/");
    const ready = await waitFor(b, `location.href.startsWith(${JSON.stringify(BASE)}) && Boolean(window.TvzinhaActions) && document.body.getAttribute('data-app-view') === 'home'`, 30000);
    if (ready !== null) break;
  }
  await b.evaluate("(window.TvzinhaActions.closeAdblockModal && window.TvzinhaActions.closeAdblockModal(), true)").catch(() => {});
  await b.evaluate(`(window.TvzinhaActions.switchView('${view}'), true)`);
  await sleep(600);
  await b.evaluate(`(window.TvzinhaActions.openTitle('${view === "animes" ? "anime" : "tv"}', ${JSON.stringify({ ...show, backdrop_path: null, poster_path: null })}, { episode: { season: 1, episode: 1 } }), true)`);
}

const REACHER = { id: 108978, name: "Reacher", original_name: "Reacher", first_air_date: "2022-02-04", genre_ids: [80, 18], original_language: "en" };
const DBZ = { id: 12971, name: "Dragon Ball Z", original_name: "ドラゴンボールZ", first_air_date: "1989-04-26", genre_ids: [16], original_language: "ja" };

console.log(`direct HLS with proxy fallback, ${browserName}, version ${VERSION}`);

if (runs(1)) {
  const b = await launch(browserName, false);
  try {
    await openEpisode(b, REACHER, "series");
    const started = await waitFor(b, PLAYING, 60000);
    const atStart = await b.evaluate(COUNTS);
    await sleep(45000);
    const after = await b.evaluate(COUNTS);
    check("series: plays", started !== null, `${started} ms`);
    // A source whose own address failed (e.g. its audio track on a host that wants its Referer) legitimately
    // plays through the proxy: then the check is that it fell back once, not that the proxy stayed unused
    const fellBack = b.logs.find(l => /sem o proxy falhou/.test(l));
    check("series: no /api/stream call after it starts (45 s), unless its source needed the proxy", after.proxy - atStart.proxy === 0 || Boolean(fellBack),
      `proxy ${atStart.proxy} -> ${after.proxy}${fellBack ? ` (${fellBack.replace(/.*\] /, "").slice(0, 80)})` : ""}`);
    check("series: HLS fetched straight from the host", after.direct > atStart.direct, `host requests ${atStart.direct} -> ${after.direct}`);
  } finally { b.close(); }
}

if (runs(2)) {
  const b = await launch(browserName, true);
  try {
    await openEpisode(b, REACHER, "series");
    const started = await waitFor(b, PLAYING, 90000);
    const counts = await b.evaluate(COUNTS);
    const fellBack = b.logs.find(l => /sem o proxy falhou/.test(l)) || "";
    // The first change must be the same source going to the proxy (another source may follow if that one fails too)
    const firstChange = b.logs.find(l => /sem o proxy falhou|Fonte \d+ falhou/.test(l)) || "";
    check("blocked host: the same source falls back to the proxy first", Boolean(fellBack) && firstChange === fellBack, fellBack.replace(/.*\[PlayerEngine\] /, "").slice(0, 110) || JSON.stringify(b.logs.slice(-3)));
    check("blocked host: plays through the proxy", started !== null && counts.proxy > 0, `${started} ms, proxy calls ${counts.proxy}`);
  } finally { b.close(); }
}

if (runs(3)) {
  const b = await launch(browserName, false);
  try {
    await openEpisode(b, DBZ, "animes");
    // The anime opens on the Player Principal first; the Player Animes (its own host) is what needs the proxy
    await waitFor(b, "Boolean(document.querySelector('[data-server=\"native_anime\"]'))", 20000);
    await b.evaluate("(document.querySelector('[data-server=\"native_anime\"]').click(), true)");
    const started = await waitFor(b, PLAYING, 60000);
    const atStart = await b.evaluate(COUNTS);
    await sleep(25000);
    const after = await b.evaluate(COUNTS);
    check("anime (Player Animes): plays", started !== null, `${started} ms`);
    check("anime: still through the proxy (its host needs its Referer)", after.proxy > atStart.proxy, `proxy ${atStart.proxy} -> ${after.proxy}`);
  } finally { b.close(); }
}

const failedCount = results.filter(ok => !ok).length;
console.log(`\n${results.length - failedCount}/${results.length} passed`);
process.exit(failedCount ? 1 : 0);
