/**
 * Checks the catalog rows (carousels) of the Filmes, Séries and Animes tabs: every row full (20 cards), no title in
 * two rows of the same tab, and how many TMDB requests building them took.
 *
 *   node tools/feed_rows_check.mjs [--browser=chrome|edge|firefox]   (chrome by default)
 *
 * Needs `python tools/local_server.py` on 127.0.0.1:8787. Starts with empty browser storage, so the rows are built
 * from TMDB (not from the 12 h cache).
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = "http://127.0.0.1:8787";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const FIREFOX = "C:\\Program Files\\Mozilla Firefox\\firefox.exe";
const browserName = (process.argv.find(a => a.startsWith("--browser=")) || "--browser=chrome").split("=")[1];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = "") => { results.push(ok); console.log(`${ok ? "OK  " : "FAIL"} ${name}${detail ? " " + detail : ""}`); };

const TABS = {
  movies: ["track-trending", "track-releases", "track-animation", "track-national", "track-classics"],
  series: ["series-track-trending", "series-track-releases", "series-track-drama", "series-track-scifi", "series-track-comedy"],
  animes: ["animes-track-trending", "animes-track-shonen", "animes-track-isekai", "animes-track-classics", "animes-track-releases"],
};

async function connectWs(url) {
  for (let i = 0; i < 80; i++) {
    try {
      const ws = new WebSocket(url);
      await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
      return ws;
    } catch { await sleep(250); }
  }
  throw new Error("no connection to " + url);
}

function rpc(ws, isBidi) {
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      (isBidi ? msg.type === "error" : msg.error) ? rej(new Error(JSON.stringify(msg.error || msg.message))) : res(msg.result);
    }
  };
  return (method, params = {}) => new Promise((res, rej) => {
    const mid = ++id;
    pending.set(mid, { res, rej });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}

/** { evaluate(expr), navigate(url), close() } for headless Chrome/Edge (CDP) or Firefox (WebDriver BiDi), always muted. */
async function launch(name) {
  const profile = mkdtempSync(join(tmpdir(), `tvz-rows-${name}-`));
  const port = 9860 + Math.floor(Math.random() * 40);
  if (name === "firefox") {
    writeFileSync(join(profile, "user.js"), 'user_pref("media.volume_scale", "0.0");\n');
    const proc = spawn(FIREFOX, ["--headless", "--remote-debugging-port", String(port), "--profile", profile, "--no-remote", "--width=1280", "--height=800"], { stdio: "ignore" });
    const ws = await connectWs(`ws://127.0.0.1:${port}/session`);
    const send = rpc(ws, true);
    await send("session.new", { capabilities: {} });
    const context = (await send("browsingContext.getTree", {})).contexts[0].context;
    return {
      navigate: (url) => send("browsingContext.navigate", { context, url, wait: "complete" }),
      evaluate: async (expr) => {
        const r = await send("script.evaluate", { expression: `(async () => JSON.stringify(await (${expr})))()`, target: { context }, awaitPromise: true, resultOwnership: "none" });
        if (r.type === "exception") throw new Error(r.exceptionDetails.text);
        return JSON.parse(r.result.value ?? "null");
      },
      close: () => { try { ws.close(); } catch {} try { spawnSync("taskkill", ["/PID", String(proc.pid), "/T", "/F"], { stdio: "ignore" }); } catch {} },
    };
  }
  const proc = spawn(name === "edge" ? EDGE : CHROME, ["--headless=new", `--remote-debugging-port=${port}`, "--remote-allow-origins=*", `--user-data-dir=${profile}`,
    "--no-first-run", "--mute-audio", "--window-size=1280,800", "about:blank"], { stdio: "ignore" });
  let page;
  for (let i = 0; i < 80 && !page; i++) {
    try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === "page"); } catch {}
    if (!page) await sleep(250);
  }
  const ws = await connectWs(page.webSocketDebuggerUrl);
  const send = rpc(ws, false);
  await send("Runtime.enable");
  await send("Page.enable");
  return {
    navigate: async (url) => { await send("Page.navigate", { url }); await sleep(1500); },
    evaluate: async (expr) => {
      const r = await send("Runtime.evaluate", { expression: `(async () => JSON.stringify(await (${expr})))()`, awaitPromise: true, returnByValue: true, userGesture: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return JSON.parse(r.result.value ?? "null");
    },
    close: () => { try { ws.close(); } catch {} try { spawnSync("taskkill", ["/PID", String(proc.pid), "/T", "/F"], { stdio: "ignore" }); } catch {} },
  };
}

/** Cards of each row once the tab has drawn them (skeleton cards have no image). */
const readRows = (tracks) => `(async () => {
  const cards = id => [...(document.getElementById(id)?.children || [])].map(c => c.querySelector('img')).filter(Boolean).map(img => img.getAttribute('src') || img.alt);
  for (let i = 0; i < 80; i++) {
    if (${JSON.stringify(tracks)}.every(id => cards(id).length > 0)) break;
    await new Promise(r => setTimeout(r, 250));
  }
  await new Promise(r => setTimeout(r, 800));
  return Object.fromEntries(${JSON.stringify(tracks)}.map(id => [id, cards(id)]));
})()`;

// The page preloads catalogs while idle, so requests are told apart by address, not by when they happened.
// They go through our /api/tmdb route (D3), with the TMDB path in its query
const ROW_REQUESTS = {
  movies: "/\\/(discover\\/movie|trending\\/movie|movie\\/now_playing)/",
  series: "/\\/discover\\/tv\\?(?!.*with_original_language=ja)/",
  animes: "/\\/discover\\/tv\\?.*with_original_language=ja/",
};
const tmdbRowRequests = (view) => `performance.getEntriesByType('resource').map(e => decodeURIComponent(e.name)).filter(n => (n.includes('api.themoviedb.org') || n.includes('/api/tmdb')) && ${ROW_REQUESTS[view]}.test(n)).length`;

const b = await launch(browserName);
try {
  await b.navigate(BASE + "/");
  await b.evaluate("(localStorage.clear(), sessionStorage.clear(), true)");
  await b.navigate(BASE + "/");
  for (let i = 0; i < 120; i++) {
    if (await b.evaluate("Boolean(window.TvzinhaActions && window.TvzinhaActions.store)").catch(() => false)) break;
    await sleep(250);
  }
  await sleep(1500);
  await b.evaluate("(window.TvzinhaActions.closeAdblockModal && window.TvzinhaActions.closeAdblockModal(), true)").catch(() => {});

  for (const [view, tracks] of Object.entries(TABS)) {
    await b.evaluate(`(window.TvzinhaActions.switchView('${view}'), true)`);
    const rows = await b.evaluate(readRows(tracks));
    const requests = await b.evaluate(tmdbRowRequests(view));
    const sizes = tracks.map(id => `${id.replace(/^(series-|animes-)?track-/, "")}=${rows[id].length}`).join(" ");
    console.log(`== ${browserName}: ${view} | ${sizes} | ${requests} TMDB row requests`);
    check(`${view}: every row has 20 cards`, tracks.every(id => rows[id].length === 20), sizes);
    const all = tracks.flatMap(id => rows[id]);
    check(`${view}: no title in two rows`, new Set(all).size === all.length, `${all.length} cards, ${new Set(all).size} distinct`);
  }
} finally {
  b.close();
}

const failed = results.filter(ok => !ok).length;
console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
