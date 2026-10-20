/**
 * Checks that leaving a catalog tab resets it: search, filters and a studio collection are closed, so coming back
 * shows the tab's start page (hero and rows). Inside a tab, opening a title and closing it keeps the search, and the
 * browser Back button still works after the switches.
 *
 *   node tools/tab_reset_check.mjs [--browser=chrome|edge|firefox]   (chrome by default)
 *
 * Needs `python tools/local_server.py` on 127.0.0.1:8787 (catalog data from TMDB; no video is played).
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
const VERSION = readFileSync(new URL("../index.html", import.meta.url), "utf8").match(/main\.js\?v=([^"]+)/)[1];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = "") => { results.push(ok); console.log(`${ok ? "OK  " : "FAIL"} ${name}${detail ? " " + detail : ""}`); };
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
  const profile = mkdtempSync(join(tmpdir(), `tvz-tabs-${name}-`));
  const port = 9740 + Math.floor(Math.random() * 40);
  if (name === "firefox") {
    writeFileSync(join(profile, "user.js"), 'user_pref("media.volume_scale", "0.0");\nuser_pref("media.autoplay.default", 0);\n');
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
    "--no-first-run", "--mute-audio", "--autoplay-policy=no-user-gesture-required", "--window-size=1280,800", "about:blank"], { stdio: "ignore" });
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

const visible = id => `(() => { const el = document.getElementById(${JSON.stringify(id)}); return Boolean(el && !el.classList.contains('hidden')); })()`;
const value = id => `((document.getElementById(${JSON.stringify(id)}) || {}).value || '')`;
const switchTo = async (b, view) => { await b.evaluate(`(window.TvzinhaActions.switchView('${view}'), true)`); await sleep(1200); };
/** Opens a tab's explore view through its search box and types `query`. */
const search = async (b, tab, query) => {
  await b.evaluate(`(document.getElementById('${tab === 'movies' ? 'spotlight' : tab}-search-container').click(), true)`);
  await sleep(700);
  await b.evaluate(`(() => { const i = document.getElementById('${tab === 'movies' ? 'explore' : tab + '-explore'}-search-input'); i.value = ${JSON.stringify(query)}; i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
  await sleep(1800);
};

const b = await launch(browserName);
try {
  await b.navigate(BASE + "/");
  for (let i = 0; i < 160; i++) { if (await b.evaluate("Boolean(window.TvzinhaActions && window.TvzinhaActions.store)").catch(() => false)) break; await sleep(250); }
  await sleep(1500);
  await b.evaluate("(window.TvzinhaActions.closeAdblockModal && window.TvzinhaActions.closeAdblockModal(), true)").catch(() => {});

  // Séries: a search, then Animes, then back
  await switchTo(b, "series");
  await search(b, "series", "breaking");
  const seriesOpen = await b.evaluate(visible("series-explore-view"));
  await switchTo(b, "animes");
  await switchTo(b, "series");
  const series = await b.evaluate(`({ explore: ${visible("series-explore-view")}, feed: ${visible("series-discovery-feed")}, query: ${value("series-explore-search-input")} + ${value("series-search-input")} })`);
  check("Séries: the search was open before leaving", seriesOpen);
  check("Séries: coming back shows the start page, search cleared", !series.explore && series.feed && series.query === "", JSON.stringify(series));

  // Animes: a genre filter, then Filmes, then back
  await switchTo(b, "animes");
  await b.evaluate("(document.getElementById('animes-search-container').click(), true)");
  await sleep(700);
  await b.evaluate(`(() => { const chip = [...document.querySelectorAll('#animes-explore-genres-chips .explore-chip')].find(c => c.dataset.genre); chip.click(); return true; })()`);
  await sleep(1500);
  const animesFilter = await b.evaluate(`[...document.querySelectorAll('#animes-explore-genres-chips .explore-chip.active')].map(c => c.dataset.genre).join()`);
  await switchTo(b, "movies");
  await switchTo(b, "animes");
  const animes = await b.evaluate(`({ explore: ${visible("animes-explore-view")}, feed: ${visible("animes-discovery-feed")}, chip: [...document.querySelectorAll('#animes-explore-genres-chips .explore-chip.active')].map(c => c.dataset.genre).join() })`);
  check("Animes: a genre filter was on before leaving", animesFilter !== "", `genre ${animesFilter}`);
  check("Animes: coming back shows the start page, filter back to all", !animes.explore && animes.feed && animes.chip === "", JSON.stringify(animes));

  // Filmes: a studio collection, then Séries, then back; then a search, then Séries, then back
  await switchTo(b, "movies");
  await b.evaluate("(document.querySelector('#track-studios > *').click(), true)");
  await sleep(2500);
  const collectionOpen = await b.evaluate(visible("movies-collection-section"));
  await switchTo(b, "series");
  await switchTo(b, "movies");
  const movies1 = await b.evaluate(`({ collection: ${visible("movies-collection-section")}, feed: ${visible("movies-discovery-feed")} })`);
  check("Filmes: a studio collection was open before leaving", collectionOpen);
  check("Filmes: coming back closes the collection and shows the start page", !movies1.collection && movies1.feed, JSON.stringify(movies1));
  await search(b, "movies", "avatar");
  const moviesSearchOpen = await b.evaluate(visible("movies-explore-view"));
  await switchTo(b, "series");
  await switchTo(b, "movies");
  const movies2 = await b.evaluate(`({ explore: ${visible("movies-explore-view")}, feed: ${visible("movies-discovery-feed")}, query: ${value("explore-search-input")} + ${value("movies-search-input")} })`);
  check("Filmes: coming back after a search shows the start page, search cleared", moviesSearchOpen && !movies2.explore && movies2.feed && movies2.query === "", JSON.stringify(movies2));

  // Inside a tab nothing changes: open a title from the search and close it, the search stays
  await switchTo(b, "series");
  await search(b, "series", "friends");
  await b.evaluate(`import('/assets/js/modules/series.js?v=${VERSION}').then(m => { window.__s = m; return true; })`);
  await b.evaluate("(window.TvzinhaActions.openTitle('tv', { id: 1668, name: 'Friends' }), true)");
  await sleep(2500);
  await b.evaluate("(document.getElementById('btn-title-back').click(), true)");
  await sleep(1200);
  const inside = await b.evaluate(`({ explore: ${visible("series-explore-view")}, query: ${value("series-explore-search-input")} })`);
  check("inside a tab: opening a title from the search and closing it keeps the search", inside.explore && inside.query === "friends", JSON.stringify(inside));

  // Back button: from the search, Back closes the search; Back again goes to the home screen
  await b.evaluate("(history.back(), true)");
  await sleep(1500);
  const back1 = await b.evaluate(`({ view: window.TvzinhaActions.store.currentView, explore: ${visible("series-explore-view")} })`);
  await b.evaluate("(history.back(), true)");
  await sleep(1500);
  const back2 = await b.evaluate("window.TvzinhaActions.store.currentView");
  check("Back closes the search first, then goes home", back1.view === "series" && !back1.explore && back2 === "home", `${JSON.stringify(back1)} -> ${back2}`);
} finally {
  b.close();
}

const failed = results.filter(ok => !ok).length;
console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);