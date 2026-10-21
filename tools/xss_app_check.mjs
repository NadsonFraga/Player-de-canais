/**
 * XSS check of the real screens (not a copy of a card): malicious titles, names, posters and overviews are put where the
 * site really reads them (the TMDB catalogs it caches, the Coleção, Continuar assistindo, channel favorites), then the
 * Início, the three catalogs, every Coleção tab and a title page are drawn and hovered. Any script that runs is reported
 * with the field it came from. tools/test_xss_protection.mjs keeps the unit tests of the escaping helpers.
 *
 *   node tools/xss_app_check.mjs [--browser=chrome|edge|firefox] [--base=http://127.0.0.1:8787]
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Test browser profiles are removed when the run ends (left behind, they add up to gigabytes in %TEMP%)
const tempDirs = [];
function tempDir(prefix) {
  const dir = mkdtempSync(prefix);
  tempDirs.push(dir);
  return dir;
}
process.on("exit", () => {
  // A browser started from a launcher can outlive the process the test killed: stop whatever still uses our profiles
  if (tempDirs.length && process.platform === "win32") {
    const filter = tempDirs.map(d => `$_.CommandLine -like '*${d.split(/[\/]/).pop()}*'`).join(" -or ");
    try { spawnSync("powershell", ["-NoProfile", "-Command", `Get-CimInstance Win32_Process | Where-Object { ${filter} } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`], { stdio: "ignore", timeout: 20000 }); } catch {}
  }
  for (const dir of tempDirs) {
    try { rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); } catch {}
  }
});


const BASE = (process.argv.find(a => a.startsWith("--base=")) || "--base=http://127.0.0.1:8787").split("=")[1];
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const FIREFOX = "C:\\Program Files\\Mozilla Firefox\\firefox.exe";
const browserName = (process.argv.find(a => a.startsWith("--browser=")) || "--browser=chrome").split("=")[1];
const shotsDir = (process.argv.find(a => a.startsWith("--shots=")) || "").split("=")[1] || "";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = "") => { results.push(ok); console.log(`${ok ? "OK  " : "FAIL"} ${name}${detail ? " " + detail : ""}`); };

async function connectWs(url) {
  for (let i = 0; i < 80; i++) {
    try { const ws = new WebSocket(url); await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; }); return ws; } catch { await sleep(250); }
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
  return (method, params = {}) => new Promise((res, rej) => { const mid = ++id; pending.set(mid, { res, rej }); ws.send(JSON.stringify({ id: mid, method, params })); });
}

/** Fresh muted browser: { evaluate, navigate, viewport, shot, close }. */
async function launch(name) {
  const profile = tempDir(join(tmpdir(), `tvz-account-${name}-`));
  const port = 9200 + Math.floor(Math.random() * 40);
  if (name === "firefox") {
    writeFileSync(join(profile, "user.js"), 'user_pref("media.volume_scale", "0.0");\nuser_pref("media.autoplay.default", 0);\n');
    const proc = spawn(FIREFOX, ["--headless", "--remote-debugging-port", String(port), "--profile", profile, "--no-remote", "--width=1366", "--height=800"], { stdio: "ignore" });
    const ws = await connectWs(`ws://127.0.0.1:${port}/session`);
    const send = rpc(ws, true);
    await send("session.new", { capabilities: {} });
    const context = (await send("browsingContext.getTree", {})).contexts[0].context;
    return {
      navigate: (url) => send("browsingContext.navigate", { context, url, wait: "none" }),
      evaluate: async (expr) => {
        const r = await send("script.evaluate", { expression: `(async () => JSON.stringify(await (${expr})))()`, target: { context }, awaitPromise: true, resultOwnership: "none", userActivation: true });
        if (r.type === "exception") throw new Error(r.exceptionDetails.text);
        return JSON.parse(r.result.value ?? "null");
      },
      // Not every Firefox build supports it: the window size given at launch stays then
      viewport: (width, height) => send("browsingContext.setViewport", { context, viewport: { width, height } }).catch(() => null),
      shot: async () => null,
      // A real mouse press, held for holdMs
      press: (x, y, holdMs) => send("input.performActions", { context, actions: [{ type: "pointer", id: "mouse", actions: [
        { type: "pointerMove", x: Math.round(x), y: Math.round(y) }, { type: "pointerDown", button: 0 }, { type: "pause", duration: holdMs }, { type: "pointerUp", button: 0 }] }] }),
      close: () => { try { ws.close(); } catch {} try { spawnSync("taskkill", ["/PID", String(proc.pid), "/T", "/F"], { stdio: "ignore" }); } catch {} },
    };
  }
  const proc = spawn(name === "edge" ? EDGE : CHROME, ["--headless=new", `--remote-debugging-port=${port}`, "--remote-allow-origins=*", `--user-data-dir=${profile}`,
    "--no-first-run", "--mute-audio", "--autoplay-policy=no-user-gesture-required", "--window-size=1366,800", "about:blank"], { stdio: "ignore" });
  let page;
  for (let i = 0; i < 80 && !page; i++) { try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === "page"); } catch {} if (!page) await sleep(250); }
  const ws = await connectWs(page.webSocketDebuggerUrl);
  const send = rpc(ws, false);
  await send("Runtime.enable");
  await send("Page.enable");
  return {
    navigate: (url) => send("Page.navigate", { url }),
    evaluate: async (expr) => {
      const r = await send("Runtime.evaluate", { expression: `(async () => JSON.stringify(await (${expr})))()`, awaitPromise: true, returnByValue: true, userGesture: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return JSON.parse(r.result.value ?? "null");
    },
    viewport: (width, height, mobile = false) => send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile }),
    shot: async (file) => {
      if (!shotsDir) return;
      const r = await send("Page.captureScreenshot", { format: "png" });
      writeFileSync(join(shotsDir, file), Buffer.from(r.data, "base64"));
    },
    press: async (x, y, holdMs) => {
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
      await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
      await sleep(holdMs);
      await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
    },
    close: () => { try { ws.close(); } catch {} try { spawnSync("taskkill", ["/PID", String(proc.pid), "/T", "/F"], { stdio: "ignore" }); } catch {} },
  };
}

async function waitFor(b, expr, timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) { if (await b.evaluate(expr).catch(() => false)) return Date.now() - t0; await sleep(400); }
  return null;
}

const visible = (id) => `(() => { const el = document.getElementById('${id}'); return Boolean(el) && !el.classList.contains('hidden'); })()`;
const PAGE_OPEN = visible("title-page");
const DETAILS_READY = `(${PAGE_OPEN}) && document.querySelectorAll('#title-facts .title-fact').length >= 2 && !document.getElementById('title-detail').classList.contains('is-loading')`;
// Every card of a row on the same line (the rows scroll sideways)
const ONE_LINE = (id) => `(() => { const cards = [...document.getElementById('${id}').children]; return cards.length > 0 && new Set(cards.map(c => c.offsetTop)).size === 1; })()`;
const STATE = `({
  open: ${PAGE_OPEN},
  url: location.search,
  name: document.getElementById('title-page-name').textContent,
  facts: document.querySelectorAll('#title-facts .title-fact').length,
  meta: document.getElementById('title-meta').textContent.trim(),
  cast: document.querySelectorAll('#title-cast .title-cast-card').length,
  trailers: document.querySelectorAll('#title-trailers .title-trailer-card').length,
  recs: document.querySelectorAll('#title-recs .title-card').length,
  episodes: ${visible("title-episodes-section")},
  footerInPage: Boolean(document.querySelector('#title-footer-slot #site-footer')),
  sideScroll: document.getElementById('title-page').scrollWidth > document.getElementById('title-page').clientWidth + 1
})`;

async function startApp(b, path = "/") {
  for (let attempt = 0; attempt < 2; attempt++) {
    await b.navigate(BASE + path);
    if (await waitFor(b, `location.href.startsWith(${JSON.stringify(BASE)}) && Boolean(window.TvzinhaActions) && document.body.getAttribute('data-app-view') === 'home'`, 30000) !== null) break;
  }
  await b.evaluate("(window.TvzinhaActions.closeAdblockModal && window.TvzinhaActions.closeAdblockModal(), true)").catch(() => {});
}

// Each payload records which field ran it, so a failure names the screen and the field
const P = (tag) => `<img src=x onerror="(window.__xss=window.__xss||[]).push('${tag}')">`;
const QUOTE = (tag) => `" onmouseover="(window.__xss=window.__xss||[]).push('${tag}')" x="`;
// What ran, and (since the CSP alone would stop inline handlers) any element that got a handler from the data
const FIRED = "[...(window.__xss || []), ...[...document.querySelectorAll('[onerror],[onmouseover]')].map(el => 'injected <' + el.tagName.toLowerCase() + '>')]";

const b = await launch(browserName);
try {
  await b.viewport(1366, 800);
  await startApp(b);

  // Third-party data (TMDB catalogs, as cached by the site) and the person's own data (Coleção, progress, favorites)
  await b.evaluate(`(() => { const now = Date.now();
    const item = (id, tag) => ({ id, title: ${JSON.stringify(P("TAG"))}.replace('TAG', tag + '-title'), name: ${JSON.stringify(P("TAG"))}.replace('TAG', tag + '-name'),
      original_title: ${JSON.stringify(QUOTE("TAG"))}.replace('TAG', tag + '-original'), release_date: '2020-01-01', first_air_date: '2020-01-01',
      vote_average: 7, poster_path: ${JSON.stringify(QUOTE("TAG"))}.replace('TAG', tag + '-poster'), backdrop_path: '/b.jpg', genre_ids: [28, 16], overview: ${JSON.stringify(P("TAG"))}.replace('TAG', tag + '-overview') });
    const rows = (tag) => ({ trending: [item(1, tag), item(2, tag)], releases: [item(3, tag)], animation: [item(4, tag)], national: [item(5, tag)], classics: [item(6, tag)], popular: [item(7, tag)], topRated: [item(8, tag)] });
    localStorage.setItem('tvzinha_movies_cache_v5', JSON.stringify({ timestamp: now, data: rows('movies') }));
    localStorage.setItem('tvzinha_series_cache_v5', JSON.stringify({ timestamp: now, data: rows('series') }));
    localStorage.setItem('tvzinha_animes_cache_v5', JSON.stringify({ timestamp: now, data: rows('animes') }));
    localStorage.setItem('tvzinha_library_v1', JSON.stringify({ items: { 'movie:603': { kind: 'movie', id: 603, title: ${JSON.stringify(P("library-title"))}, year: '1999', watchlist: { on: true, at: now }, watched: { on: true, at: now }, rating: { value: 8, at: now } } } }));
    localStorage.setItem('tvzinha_watch_progress_v1', JSON.stringify({ '1399': { id: 1399, title: ${JSON.stringify(P("progress-title"))}, season: 1, episode: 2, episodeTitle: ${JSON.stringify(P("episode-title"))}, mediaType: 'tv', timestamp: now, positions: {} }, 'movie:27205': { id: 27205, title: ${JSON.stringify(P("movie-progress"))}, mediaType: 'movie', position: 100, duration: 8000, timestamp: now } }));
    localStorage.setItem('tvzinha_favorites', JSON.stringify([${JSON.stringify(P("favorite-key"))}]));
    return true; })()`);
  await startApp(b);
  await sleep(2500);
  // Hover every card and button once (attribute payloads need an event)
  const hoverAll = `(() => { document.querySelectorAll('img, [title], .movie-poster-card, button').forEach(el => el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))); return true; })()`;
  await b.evaluate(hoverAll);
  const home = await b.evaluate(FIRED);
  check("Início (hero, rows, Continuar assistindo): no field runs script", home.length === 0, JSON.stringify(home));

  for (const view of ["movies", "series", "animes"]) {
    await b.evaluate(`(document.querySelector('.nav-capsule-item[data-view="${view}"]').click(), true)`);
    await sleep(1800);
    await b.evaluate(hoverAll);
  }
  const catalogs = await b.evaluate(FIRED);
  check("Filmes, Séries and Animes catalogs: no field runs script", catalogs.length === 0, JSON.stringify(catalogs));

  await b.evaluate("(window.TvzinhaActions.openCollection('watchlist'), true)");
  await sleep(600);
  for (const tab of ["watching", "watched", "rated", "channels", "watchlist"]) {
    await b.evaluate(`(document.querySelector('[data-collection-tab="${tab}"]')?.click(), true)`);
    await sleep(300);
    await b.evaluate(hoverAll);
  }
  const collection = await b.evaluate(FIRED);
  check("Coleção (every tab): no field runs script", collection.length === 0, JSON.stringify(collection));

  await b.evaluate(`(window.TvzinhaActions.openTitle('movie', { id: 1, title: ${JSON.stringify(P("title-page"))}, poster_path: ${JSON.stringify(QUOTE("title-page-poster"))} }), true)`);
  await sleep(2500);
  await b.evaluate(hoverAll);
  const titlePage = await b.evaluate(FIRED);
  check("title page opened from a malicious card: no field runs script", titlePage.length === 0, JSON.stringify(titlePage));
} catch (e) {
  check("run without errors", false, e.message);
} finally {
  b.close();
}

const failed = results.filter(ok => !ok).length;
console.log(`\n${results.length - failed}/${results.length} passed (${browserName})`);
process.exit(failed ? 1 : 0);
