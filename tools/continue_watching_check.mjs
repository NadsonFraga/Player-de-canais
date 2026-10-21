/**
 * Checks "Continuar assistindo" with movies and the remove button (B19):
 *   1. a movie played on the Player Principal enters the rail with its progress ("Filme", "Faltam X min")
 *   2. its card reopens it from the saved time, with "Continuando de" and a working "Começar do início"
 *   3. a finished movie (95 %) leaves the rail
 *   4. the remove button hides a movie card and a series card without opening them or erasing their time;
 *      watching the movie again brings it back
 *
 *   node tools/continue_watching_check.mjs [--browser=chrome|edge|firefox]   (chrome by default)
 *
 * Needs `python tools/local_server.py` on 127.0.0.1:8787 and internet (real sources; the movie is an MP4).
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
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
const FIREFOX = "C:\\Program Files\\Mozilla Firefox\\firefox.exe";
const browserName = (process.argv.find(a => a.startsWith("--browser=")) || "--browser=chrome").split("=")[1];
const VERSION = readFileSync(new URL("../index.html", import.meta.url), "utf8").match(/main\.js\?v=([^"]+)/)[1];
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

/** Fresh muted browser: { evaluate, navigate, close }. */
async function launch(name) {
  const profile = tempDir(join(tmpdir(), `tvz-continue-${name}-`));
  const port = 9150 + Math.floor(Math.random() * 40);
  if (name === "firefox") {
    writeFileSync(join(profile, "user.js"), 'user_pref("media.volume_scale", "0.0");\nuser_pref("media.autoplay.default", 0);\n');
    const proc = spawn(FIREFOX, ["--headless", "--remote-debugging-port", String(port), "--profile", profile, "--no-remote", "--width=1280", "--height=800"], { stdio: "ignore" });
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
      close: () => { try { ws.close(); } catch {} try { spawnSync("taskkill", ["/PID", String(proc.pid), "/T", "/F"], { stdio: "ignore" }); } catch {} },
    };
  }
  const proc = spawn(name === "edge" ? EDGE : CHROME, ["--headless=new", `--remote-debugging-port=${port}`, "--remote-allow-origins=*", `--user-data-dir=${profile}`,
    "--no-first-run", "--mute-audio", "--autoplay-policy=no-user-gesture-required", "--window-size=1280,800", "about:blank"], { stdio: "ignore" });
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
    close: () => { try { ws.close(); } catch {} try { spawnSync("taskkill", ["/PID", String(proc.pid), "/T", "/F"], { stdio: "ignore" }); } catch {} },
  };
}

async function waitFor(b, expr, timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) { if (await b.evaluate(expr).catch(() => false)) return Date.now() - t0; await sleep(500); }
  return null;
}

const MOVIE = { id: 1022789, title: "Divertida Mente 2", backdrop_path: null, poster_path: null, overview: "" };
const VIDEO = "document.querySelector('#movie-artplayer-container video')";
const RAIL = `[...document.querySelectorAll('#home-continue-watching-track .continue-card')].map(c => ({
  title: c.querySelector('.continue-card-title')?.textContent, sub: c.querySelector('.continue-card-ep')?.textContent,
  time: c.querySelector('.continue-card-time')?.textContent, bar: parseInt(c.querySelector('.continue-progress-bar-fill')?.style.width || '0', 10) }))`;
const MOVIE_ENTRY = `JSON.parse(localStorage.getItem('tvzinha_watch_progress_v1') || '{}')['movie:${MOVIE.id}'] || null`;

async function startApp(b) {
  for (let attempt = 0; attempt < 2; attempt++) {
    await b.navigate(BASE + "/");
    if (await waitFor(b, `location.href.startsWith(${JSON.stringify(BASE)}) && Boolean(window.TvzinhaActions) && document.body.getAttribute('data-app-view') === 'home'`, 30000) !== null) break;
  }
  await b.evaluate("(window.TvzinhaActions.closeAdblockModal && window.TvzinhaActions.closeAdblockModal(), true)").catch(() => {});
  await b.evaluate(`import('/assets/js/modules/series.js?v=${VERSION}').then(m => { window.__s = m; return true; })`);
}

/** Opens the movie (autoplay on the Player Principal) and waits until it plays. */
async function playMovie(b) {
  await b.evaluate(`(window.TvzinhaActions.openMovie(${JSON.stringify(MOVIE)}, true), true)`);
  return waitFor(b, `(() => { const v = ${VIDEO}; return Boolean(v && v.currentTime > 1 && v.duration > 600); })()`, 60000);
}

/** Moves the movie to `share` of its length, lets it play a moment and pauses (a pause saves the time). */
async function seekAndPause(b, share) {
  await b.evaluate(`(() => { const v = ${VIDEO}; v.currentTime = v.duration * ${share}; return true; })()`);
  await waitFor(b, `(() => { const v = ${VIDEO}; return Boolean(v && v.currentTime > v.duration * ${share} + 1); })()`, 30000);
  await b.evaluate("(window.artInstance.pause(), true)");
  await sleep(800);
}

async function backHome(b) {
  await b.evaluate("(window.TvzinhaActions.closeMovie(), window.TvzinhaActions.switchView('home'), window.__s.renderHomeContinueWatching(), true)");
  await sleep(1200);
}

console.log(`continue watching with movies, ${browserName}, version ${VERSION}`);
const b = await launch(browserName);
try {
  await startApp(b);
  await b.evaluate("(localStorage.removeItem('tvzinha_watch_progress_v1'), true)");

  // 1. A movie's progress on the rail
  const started = await playMovie(b);
  check("movie plays on the Player Principal", started !== null, `${started} ms`);
  await seekAndPause(b, 0.4);
  const saved = await b.evaluate(MOVIE_ENTRY);
  check("its time is saved under movie:<id>", Boolean(saved && saved.mediaType === "movie" && saved.position > 0 && saved.duration > 600 && !saved.finished),
    JSON.stringify(saved && { position: saved.position, duration: saved.duration, finished: saved.finished, server: saved.server }));
  await backHome(b);
  const card = (await b.evaluate(RAIL)).find(c => c.title === MOVIE.title);
  check("the rail shows the movie with 'Filme', 'Faltam X min' and the bar", Boolean(card && card.sub === "Filme" && /^Faltam \d+ min$/.test(card.time) && card.bar >= 35 && card.bar <= 45), JSON.stringify(card));

  // 2. Reopening from the card resumes
  await b.evaluate("(document.querySelector('#home-continue-watching-track .continue-card').click(), true)");
  await waitFor(b, `(() => { const v = ${VIDEO}; return Boolean(v && v.currentTime > 1); })()`, 60000);
  await sleep(1500);
  const resumed = await b.evaluate(`({ t: ${VIDEO}.currentTime, notice: document.querySelector('#movie-artplayer-container .tvz-resume-text')?.textContent || '' })`);
  check("the card reopens it near the saved time, with 'Continuando de'", Math.abs(resumed.t - saved.position) < 20 && /Continuando de/.test(resumed.notice), `${Math.round(resumed.t)} s vs ${saved.position} s, "${resumed.notice}"`);
  await b.evaluate("(document.querySelector('#movie-artplayer-container .tvz-resume-restart')?.click(), true)");
  await sleep(1500);
  check("'Começar do início' goes back to the start", (await b.evaluate(`${VIDEO}.currentTime`)) < 10);

  // 3. A finished movie leaves the rail
  await seekAndPause(b, 0.96);
  const done = await b.evaluate(MOVIE_ENTRY);
  await backHome(b);
  const railAfter = (await b.evaluate(RAIL)).map(c => c.title);
  check("a finished movie is marked and leaves the rail", Boolean(done && done.finished) && !railAfter.includes(MOVIE.title), JSON.stringify({ finished: done && done.finished, rail: railAfter }));

  // 4. The remove button, on a movie card and a series card
  await b.evaluate(`(() => { const p = JSON.parse(localStorage.getItem('tvzinha_watch_progress_v1') || '{}');
    p['movie:${MOVIE.id}'] = { ...p['movie:${MOVIE.id}'], finished: false, position: 900, duration: 5800, timestamp: Date.now() - 1000 };
    p[1396] = { id: 1396, title: 'Breaking Bad', season: 1, episode: 2, episodeTitle: 'Episódio 2', mediaType: 'tv', timestamp: Date.now() };
    localStorage.setItem('tvzinha_watch_progress_v1', JSON.stringify(p)); window.__s.renderHomeContinueWatching(); return true; })()`);
  await sleep(500);
  const before = (await b.evaluate(RAIL)).map(c => c.title);
  const removeCard = (title) => b.evaluate(`(() => { const c = [...document.querySelectorAll('#home-continue-watching-track .continue-card')]
    .find(x => x.querySelector('.continue-card-title').textContent === ${JSON.stringify(title)}); c.querySelector('.continue-card-remove').click(); return true; })()`);
  await removeCard(MOVIE.title);
  await removeCard("Breaking Bad");
  await sleep(400);
  const modalOpen = await b.evaluate("Boolean(document.getElementById('movie-player-view') && !document.getElementById('movie-player-view').classList.contains('hidden'))");
  const afterRemove = (await b.evaluate(RAIL)).map(c => c.title);
  const kept = await b.evaluate(`(() => { const p = JSON.parse(localStorage.getItem('tvzinha_watch_progress_v1')); const m = p['movie:${MOVIE.id}'];
    return { movieHidden: m.hidden, moviePosition: m.position, showHidden: p[1396].hidden }; })()`);
  check("remove hides the movie and the series card", before.includes(MOVIE.title) && before.includes("Breaking Bad") && !afterRemove.includes(MOVIE.title) && !afterRemove.includes("Breaking Bad"),
    JSON.stringify({ before, afterRemove }));
  check("removing does not open the title and keeps its time", !modalOpen && kept.movieHidden === true && kept.moviePosition === 900 && kept.showHidden === true, JSON.stringify({ modalOpen, kept }));
  await playMovie(b);
  await backHome(b);
  check("watching the movie again brings it back", (await b.evaluate(RAIL)).some(c => c.title === MOVIE.title));
} finally { b.close(); }

const failedCount = results.filter(ok => !ok).length;
console.log(`\n${results.length - failedCount}/${results.length} passed`);
process.exit(failedCount ? 1 : 0);
