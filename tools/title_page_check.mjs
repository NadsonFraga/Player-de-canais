/**
 * Checks the title page (modules/titlePage.js) with a movie, a series and an anime:
 *   1. a movie opens in full screen with its details (facts, cast, recommendations), the address shows ?filme=ID
 *      and the site footer moves into the page
 *   2. Quero assistir, Assistido and Avaliar are saved and survive a reload of the title link
 *   3. Assistir opens the movie player over the page; Back closes the player, then the page (address cleared)
 *   4. a recommendation stacks a second title; Back returns to the first one; a cast member opens their list
 *   5. a series and an anime show their episodes (seasons list, episode cards); an episode opens the series player
 *      and Back returns to the page
 *   6. a tab switch while the page is open closes it and shows the tab
 *   7. phones: the page fits the width (no sideways scroll)
 *
 *   node tools/title_page_check.mjs [--browser=chrome|edge|firefox] [--shots=<folder>]   (chrome by default)
 *
 * Needs `python tools/local_server.py` on 127.0.0.1:8787 and internet (TMDB through /api/tmdb).
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
  const profile = mkdtempSync(join(tmpdir(), `tvz-title-${name}-`));
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
const DETAILS_READY = `(${PAGE_OPEN}) && document.querySelectorAll('#title-facts .title-fact').length >= 3`;
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

const b = await launch(browserName);
try {
  await b.viewport(1366, 800);
  await startApp(b);
  await b.evaluate("(localStorage.removeItem('tvzinha_library_v1'), true)");

  // 1. Movie page
  await b.evaluate("(window.TvzinhaActions.openTitle('movie', { id: 1022789, title: 'Divertida Mente 2' }), true)");
  const movieMs = await waitFor(b, DETAILS_READY, 20000);
  const movie = await b.evaluate(STATE);
  check("movie page opens with its details", movieMs !== null && movie.facts >= 3 && movie.meta.length > 0, JSON.stringify({ ms: movieMs, facts: movie.facts, meta: movie.meta }));
  check("address shows ?filme=ID", movie.url === "?filme=1022789", movie.url);
  check("cast and recommendations listed", movie.cast > 0 && movie.recs > 0, `cast ${movie.cast}, recs ${movie.recs}, trailers ${movie.trailers}`);
  check("site footer moved into the page", movie.footerInPage);
  await sleep(1500);
  await b.shot("title-movie-desktop.png");

  // 2. Library buttons
  await b.evaluate("(document.getElementById('btn-title-watchlist').click(), document.getElementById('btn-title-watched').click(), true)");
  await b.evaluate("(document.getElementById('btn-title-rate').click(), true)");
  const panelOpen = await b.evaluate(visible("title-rate-panel"));
  await b.evaluate("(document.querySelector('#title-rate-stars .title-rate-half[data-value=\"7\"]').click(), true)");
  const lib = await b.evaluate("JSON.parse(localStorage.getItem('tvzinha_library_v1') || '{}').items?.['movie:1022789'] || null");
  check("Quero assistir, Assistido and rating 3,5 saved", Boolean(lib && lib.watchlist?.on && lib.watched?.on && lib.rating?.value === 7 && panelOpen), JSON.stringify(lib && { w: lib.watchlist, s: lib.watched, r: lib.rating }));
  const rateLabel = await b.evaluate("document.getElementById('title-rate-value').textContent");
  check("rating shown on the button", rateLabel === "3,5", rateLabel);

  // Reload the title link: the page opens and keeps the buttons
  await startApp(b, "/?filme=1022789");
  const reloadMs = await waitFor(b, DETAILS_READY, 20000);
  const buttons = await b.evaluate("({ w: document.getElementById('btn-title-watchlist').classList.contains('is-on'), s: document.getElementById('btn-title-watched').classList.contains('is-on'), r: document.getElementById('title-rate-value').textContent, url: location.search })");
  check("title link opens the page after a reload", reloadMs !== null && buttons.url === "?filme=1022789", JSON.stringify(buttons));
  check("buttons keep their state after the reload", buttons.w && buttons.s && buttons.r === "3,5");

  // 3. Assistir: movie player over the page, Back closes the player, then the page
  await b.evaluate("(document.getElementById('btn-title-play').click(), true)");
  const playerMs = await waitFor(b, visible("movie-player-view"), 8000);
  check("Assistir opens the movie player", playerMs !== null);
  await sleep(1500);
  await b.shot("title-movie-player-desktop.png");
  await b.evaluate("(history.back(), true)");
  const afterBack1 = await waitFor(b, `!(${visible("movie-player-view")}) && (${PAGE_OPEN})`, 5000);
  check("Back closes the player and shows the page", afterBack1 !== null);
  await b.evaluate("(history.back(), true)");
  const afterBack2 = await waitFor(b, `!(${PAGE_OPEN}) && location.search === ''`, 5000);
  const footerBack = await b.evaluate("Boolean(document.querySelector('#site-footer')) && !document.querySelector('#title-footer-slot #site-footer')");
  check("Back again closes the page and clears the address", afterBack2 !== null);
  check("site footer back in its place", footerBack);

  // 4. Stacked titles and a person's list
  await b.evaluate("(window.TvzinhaActions.openTitle('movie', { id: 1022789, title: 'Divertida Mente 2' }), true)");
  await waitFor(b, DETAILS_READY, 20000);
  const firstName = await b.evaluate("document.getElementById('title-page-name').textContent");
  await b.evaluate("(document.querySelector('#title-recs .title-card').click(), true)");
  await sleep(600);
  const stacked = await waitFor(b, `${DETAILS_READY} && document.getElementById('title-page-name').textContent !== ${JSON.stringify(firstName)}`, 20000);
  const stackedUrl = await b.evaluate("location.search");
  check("a recommendation opens on the page", stacked !== null && stackedUrl.startsWith("?filme=") && stackedUrl !== "?filme=1022789", stackedUrl);
  await b.evaluate("(history.back(), true)");
  const backToFirst = await waitFor(b, `(${PAGE_OPEN}) && document.getElementById('title-page-name').textContent === ${JSON.stringify(firstName)} && location.search === '?filme=1022789'`, 8000);
  check("Back returns to the first title", backToFirst !== null);
  await b.evaluate("(document.querySelector('#title-cast .title-cast-card').click(), true)");
  const listMs = await waitFor(b, `${visible("title-list")} && document.querySelectorAll('#title-list-grid .title-card').length > 0`, 20000);
  const listName = await b.evaluate("document.getElementById('title-list-name').textContent");
  check("a cast member opens their titles", listMs !== null, listName);
  await b.evaluate("(history.back(), true)");
  const backFromList = await waitFor(b, `(${PAGE_OPEN}) && !(${visible("title-list")}) && ${visible("title-detail")}`, 8000);
  check("Back from the list returns to the title", backFromList !== null);
  await b.evaluate("(history.back(), true)");
  await waitFor(b, `!(${PAGE_OPEN})`, 5000);

  // 5. Series and anime: episodes on the page, an episode opens the player, Back returns to the page
  for (const show of [{ kind: "tv", id: 1668, name: "Friends" }, { kind: "anime", id: 31911, name: "Fullmetal Alchemist: Brotherhood" }]) {
    await b.evaluate(`(window.TvzinhaActions.openTitle('${show.kind}', { id: ${show.id}, name: ${JSON.stringify(show.name)} }), true)`);
    const ready = await waitFor(b, `${DETAILS_READY} && document.querySelectorAll('#series-episodes-grid .series-ep-card').length > 0`, 25000);
    const info = await b.evaluate(`({ ...${STATE}, seasons: document.querySelectorAll('#series-season-select option').length, eps: document.querySelectorAll('#series-episodes-grid .series-ep-card').length, anime: document.getElementById('title-page').classList.contains('theme-anime') })`);
    check(`${show.name}: page with episodes`, ready !== null && info.episodes && info.eps > 0, `seasons ${info.seasons}, episodes ${info.eps}, url ${info.url}`);
    check(`${show.name}: anime look only for animes`, info.anime === (show.kind === "anime"));
    await sleep(1000);
    await b.shot(`title-${show.kind}-desktop.png`);
    await b.evaluate("(document.querySelector('#series-episodes-grid .series-ep-card').click(), true)");
    const epMs = await waitFor(b, visible("series-player-view"), 15000);
    check(`${show.name}: an episode opens the player`, epMs !== null);
    await sleep(800);
    await b.evaluate("(history.back(), true)");
    const backMs = await waitFor(b, `!(${visible("series-player-view")}) && (${PAGE_OPEN})`, 6000);
    check(`${show.name}: Back returns to the page`, backMs !== null);
    await b.evaluate("(history.back(), true)");
    await waitFor(b, `!(${PAGE_OPEN})`, 5000);
  }

  // 6. A tab switch closes the page
  await b.evaluate("(window.TvzinhaActions.openTitle('movie', { id: 1022789, title: 'Divertida Mente 2' }), true)");
  await waitFor(b, PAGE_OPEN, 5000);
  await b.evaluate("(window.TvzinhaActions.switchView('series'), true)");
  const switched = await waitFor(b, `!(${PAGE_OPEN}) && document.body.getAttribute('data-app-view') === 'series' && location.search === ''`, 5000);
  const afterSwitch = await b.evaluate(`({ open: ${PAGE_OPEN}, view: document.body.getAttribute('data-app-view'), url: location.search, state: history.state })`);
  check("a tab switch closes the page and shows the tab", switched !== null, JSON.stringify(afterSwitch));

  // 7. Phones
  await b.viewport(390, 844, true);
  for (const t of [{ kind: "movie", id: 1022789, title: "Divertida Mente 2" }, { kind: "tv", id: 1668, name: "Friends" }]) {
    await b.evaluate(`(window.TvzinhaActions.openTitle('${t.kind}', ${JSON.stringify(t)}), true)`);
    await waitFor(b, DETAILS_READY, 20000);
    await sleep(1500);
    const phone = await b.evaluate(STATE);
    check(`phone ${t.kind}: no sideways scroll`, !phone.sideScroll);
    await b.shot(`title-${t.kind}-phone.png`);
    await b.evaluate("(history.back(), true)");
    await waitFor(b, `!(${PAGE_OPEN})`, 5000);
  }
} catch (e) {
  check("run without errors", false, e.message);
} finally {
  b.close();
}

const failed = results.filter(ok => !ok).length;
console.log(`\n${results.length - failed}/${results.length} passed (${browserName})`);
process.exit(failed ? 1 : 0);
