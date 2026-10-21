/**
 * Checks the hover room of the card rows and the player/server groups:
 *   - hovering the first card of a row (Filmes, Home, Canais) never clips it, and the page gets no sideways scroll
 *   - the movie and anime selectors show "Players" (Player Principal, Player Animes) and "Servidores externos", no "BETA"
 *   - live TV shows "Player Principal" with its fontes ("Fonte 1 ...") and "Servidores externos"
 *
 *   node tools/server_groups_check.mjs [--browser=chrome|edge]   (chrome by default; the hover needs CDP mouse events)
 *
 * Needs `python tools/local_server.py` on 127.0.0.1:8787 (catalog data from TMDB).
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
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


const BASE = "http://127.0.0.1:8787";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browserName = (process.argv.find(a => a.startsWith("--browser=")) || "--browser=chrome").split("=")[1];
const VERSION = readFileSync(new URL("../index.html", import.meta.url), "utf8").match(/main\.js\?v=([^"]+)/)[1];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = "") => { results.push(ok); console.log(`${ok ? "OK  " : "FAIL"} ${name}${detail ? " " + detail : ""}`); };

const profile = tempDir(join(tmpdir(), "tvz-groups-"));
const port = 9400 + Math.floor(Math.random() * 90);
const proc = spawn(browserName === "edge" ? EDGE : CHROME, ["--headless=new", `--remote-debugging-port=${port}`, "--remote-allow-origins=*",
  `--user-data-dir=${profile}`, "--no-first-run", "--mute-audio", "--autoplay-policy=no-user-gesture-required", "--window-size=1366,900", "about:blank"], { stdio: "ignore" });
let page;
for (let i = 0; i < 80 && !page; i++) {
  try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === "page"); } catch {}
  if (!page) await sleep(250);
}
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0;
const pending = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: `(async () => JSON.stringify(await (${expr})))()`, awaitPromise: true, returnByValue: true, userGesture: true });
  if (r && r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r && r.result && typeof r.result.value === "string" ? JSON.parse(r.result.value) : null;
};
const waitFor = async (expr, timeoutMs) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) { if (await evaluate(expr).catch(() => false)) return true; await sleep(250); }
  return false;
};

/**
 * Hovers the first card of `scroller` and returns how much of it the scroller clips on each side (0 = none), plus the
 * card's place before the hover (to compare with the layout before the change).
 */
async function hoverFirstCard(scroller, card) {
  const box = await evaluate(`(() => { const s = document.querySelector(${JSON.stringify(scroller)}); const c = s && s.querySelector(${JSON.stringify(card)});
    if (!c) return null; c.scrollIntoView({ block: 'center' }); const r = c.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  if (!box) return null;
  await sleep(400);
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: box.x, y: box.y });
  await sleep(700);
  return evaluate(`(() => { const s = document.querySelector(${JSON.stringify(scroller)}); const c = s.querySelector(${JSON.stringify(card)});
    const r = c.getBoundingClientRect(), b = s.getBoundingClientRect();
    return { top: Math.max(0, Math.round(b.top - r.top)), left: Math.max(0, Math.round(b.left - r.left)), bottom: Math.max(0, Math.round(r.bottom - b.bottom)),
      zoomed: Math.round(r.width) > c.offsetWidth, sideScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth }; })()`);
}

const groupsOf = (gridId) => evaluate(`[...document.querySelectorAll('#${gridId} .server-group-block')].map(g => ({
  title: g.querySelector('.servers-section-title span')?.textContent.trim(),
  buttons: [...g.querySelectorAll('button')].map(b => b.textContent.replace(/\\s+/g, ' ').trim()) }))`);

try {
  await send("Runtime.enable");
  await send("Page.navigate", { url: BASE + "/" });
  await waitFor("Boolean(window.TvzinhaActions) && document.body.getAttribute('data-app-view') === 'home'", 40000);
  await evaluate("(window.TvzinhaActions.closeAdblockModal && window.TvzinhaActions.closeAdblockModal(), true)").catch(() => {});

  // ---------- hover room
  await waitFor("document.querySelectorAll('#home-track-movies .movie-poster-card').length > 2", 20000);
  for (const [label, view, scroller, card] of [
    ["Home", "home", "#home-track-movies", ".movie-poster-card"],
    ["Filmes", "movies", "#track-trending", ".movie-poster-card"],
    ["Canais", "tv", ".channels-row-scroller", ".channel-card-16x9"],
  ]) {
    await evaluate(`(window.TvzinhaActions.switchView('${view}'), true)`);
    await waitFor(`document.querySelectorAll(${JSON.stringify(scroller + " " + card)}).length > 2`, 20000);
    await sleep(800);
    const r = await hoverFirstCard(scroller, card);
    check(`${label}: the hovered first card is not clipped`, r && r.zoomed && r.top === 0 && r.left === 0 && r.bottom === 0, JSON.stringify(r));
    check(`${label}: no sideways page scroll`, r && !r.sideScroll);
    await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: 5, y: 5 });
  }

  // ---------- movie selector
  await evaluate("(window.TvzinhaActions.switchView('movies'), true)");
  await sleep(800);
  await evaluate("(window.TvzinhaActions.openMovie({ id: 1022789, title: 'Divertida Mente 2', backdrop_path: null, poster_path: null, overview: '' }, true), true)");
  await waitFor("document.querySelectorAll('#movie-servers-grid .server-group-block').length > 0", 10000);
  const movie = await groupsOf("movie-servers-grid");
  check("movie: groups 'Players' then 'Servidores externos'", movie.length === 2 && movie[0].title === "Players" && movie[1].title === "Servidores externos", JSON.stringify(movie.map(g => g.title)));
  check("movie: 'Player Principal' in Players, external servers in the second group", movie[0]?.buttons.join() === "Player Principal" && movie[1]?.buttons.length >= 5, JSON.stringify(movie));
  check("movie: no 'BETA' left", !/BETA/.test(JSON.stringify(movie)));
  await evaluate("(window.TvzinhaActions.closeMovie(), true)");
  await sleep(800);

  // ---------- anime selector (Dragon Ball Z, first episode)
  await evaluate(`import('/assets/js/modules/series.js?v=${VERSION}').then(m => { window.__series = m; return true; })`);
  await evaluate("(window.TvzinhaActions.switchView('animes'), true)");
  await sleep(1000);
  await evaluate(`(window.TvzinhaActions.openTitle('anime', { id: 12971, name: 'Dragon Ball Z', original_name: 'ドラゴンボールZ', first_air_date: '1989-04-26', genre_ids: [16], original_language: 'ja', backdrop_path: null, poster_path: null }, { episode: { season: 1, episode: 1 } }), true)`);
  await waitFor("document.querySelectorAll('#series-servers-grid .server-group-block').length > 0", 15000);
  const anime = await groupsOf("series-servers-grid");
  check("anime: Players has 'Player Principal' and 'Player Animes'", anime[0]?.title === "Players" && anime[0].buttons.join() === "Player Principal,Player Animes", JSON.stringify(anime[0]));
  check("anime: 'Servidores externos' has the iframe servers, 'Servidor 1 (MGEB)' first", anime[1]?.title === "Servidores externos" && /^Servidor 1 \(MGEB\)/.test(anime[1].buttons[0] || ""), JSON.stringify(anime[1]));
  await evaluate("(window.TvzinhaActions.stopSeries && window.TvzinhaActions.stopSeries(), true)").catch(() => {});
  await sleep(800);

  // ---------- live TV selector
  await evaluate("(window.TvzinhaActions.switchView('tv'), true)");
  await sleep(1200);
  await evaluate("(window.TvzinhaActions.selectChannel('TV Aberta', 'Band'), true)");
  await waitFor("Boolean(document.querySelector('#direct-servers-grid .btn-server-option'))", 10000);
  const tv = await evaluate(`({ direct: document.querySelector('#direct-servers-block .servers-section-title span')?.textContent.trim(),
    iframes: document.querySelector('#contingency-servers-block .servers-section-title span')?.textContent.trim(),
    sources: [...document.querySelectorAll('#direct-servers-grid .btn-server-option')].map(b => b.textContent.replace(/\\s+/g, ' ').trim()) })`);
  check("live TV: 'Player Principal' lists fontes ('Fonte 1 ...'), then 'Servidores externos'",
    tv.direct === "Player Principal" && tv.iframes === "Servidores externos" && tv.sources.length > 0 && tv.sources.every((t, i) => t.startsWith(`Fonte ${i + 1}`)), JSON.stringify(tv));
} finally {
  try { ws.close(); } catch {}
  spawnSync("taskkill", ["/PID", String(proc.pid), "/T", "/F"], { stdio: "ignore" });
}

const failedCount = results.filter(ok => !ok).length;
console.log(`\n${results.length - failedCount}/${results.length} passed`);
process.exit(failedCount ? 1 : 0);
