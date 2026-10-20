/**
 * Phone-behaviour check of the native player (headless Edge as an Android phone, over CDP, no dependencies).
 *
 * Covers: double tap skipping 10 s (left/right zones), the middle double tap toggling play/pause, a single tap not
 * skipping, and an even gap on all four sides of the movie, series and player modals.
 *
 * Usage:
 *   python tools/local_server.py                      (in another terminal)
 *   node tools/player_touch_check.mjs
 *
 * Uses 127.0.0.1 on purpose. The cache version used by the import() below is read from index.html.
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = "http://127.0.0.1:8787";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
// --browser=chrome (default) or --browser=edge: both Chromium; Chrome is what most viewers use
const BROWSER = (process.argv.find(a => a.startsWith("--browser=")) || "--browser=chrome").split("=")[1];
const CHROMIUM = BROWSER === "edge" ? EDGE : CHROME;
const PHONE_UA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";
const PORT = 9700 + Math.floor(Math.random() * 200);
const stopBrowser = () => { try { spawnSync("taskkill", ["/PID", String(proc.pid), "/T", "/F"], { stdio: "ignore" }); } catch {} };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = "") => { results.push(ok); console.log(`${ok ? "OK  " : "FAIL"} ${name} ${detail}`); };

const profile = mkdtempSync(join(tmpdir(), "tvz-touch-"));
const proc = spawn(CHROMIUM, ["--headless=new", `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*", `--user-data-dir=${profile}`,
  "--no-first-run", "--mute-audio", "--autoplay-policy=no-user-gesture-required", "about:blank"], { stdio: "ignore" });
let page;
for (let i = 0; i < 60 && !page; i++) {
  try { page = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find(t => t.type === "page"); } catch {}
  if (!page) await sleep(250);
}
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let nextId = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); }
};
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++nextId; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
const evaluate = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: `(async () => JSON.stringify(await (${expr})))()`, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return JSON.parse(r.result.value ?? "null");
};
const click = async (x, y) => {
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
};
const doubleTap = async (x, y) => { await click(x, y); await sleep(90); await click(x, y); };
const waitFor = async (expr, ms = 40000) => { const end = Date.now() + ms; while (Date.now() < end) { if (await evaluate(expr).catch(() => false)) return true; await sleep(400); } return false; };

await send("Runtime.enable"); await send("Page.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Emulation.setUserAgentOverride", { userAgent: PHONE_UA });
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await send("Page.navigate", { url: BASE + "/" });
await waitFor("typeof window.TvzinhaActions !== 'undefined'", 90000);   // the player libraries come from a CDN that is sometimes slow
await sleep(2500);
await evaluate("(window.TvzinhaActions.closeAdblockModal && window.TvzinhaActions.closeAdblockModal(), true)").catch(() => {});

// ---------- anime episode playing on the phone
const APP_VERSION = (await import('node:fs')).readFileSync(new URL('../index.html', import.meta.url), 'utf8').match(/main\.js\?v=([^"]+)/)[1];
await evaluate(`import('/assets/js/modules/series.js?v=${APP_VERSION}').then(m => { window.__series = m; return true; })`);
await evaluate("(window.TvzinhaActions.switchView('animes'), true)");
await sleep(1500);
await evaluate(`(window.TvzinhaActions.openTitle('anime', { id: 12971, name: 'Dragon Ball Z', original_name: 'ドラゴンボールZ', first_air_date: '1989-04-26', genre_ids: [16], original_language: 'ja', backdrop_path: null, poster_path: null }, { episode: { season: 9, episode: 31 } }), true)`);
await sleep(6000);
await evaluate("(document.querySelector('[data-server=\"native_anime\"]')?.click(), true)");
const playing = await waitFor("window.artInstance && window.artInstance.duration > 100 && !window.artInstance.video.paused && window.artInstance.currentTime > 2");
check("anime episode is playing", playing);

const box = await evaluate("(() => { const r = document.querySelector('#series-artplayer-container .art-video-player').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()");
const at = (fraction) => ({ x: box.x + box.w * fraction, y: box.y + box.h * 0.3 });
const time = () => evaluate("window.artInstance.currentTime");
check("player runs in phone mode (art-mobile)", await evaluate("document.querySelector('#series-artplayer-container .art-video-player').classList.contains('art-mobile')"));

// ---------- tapping "Pular abertura" with the controls hidden skips (the tap must not land on the progress bar)
await evaluate("new Promise(r => { const t0 = Date.now(); const look = () => (document.querySelector('#series-artplayer-container .tvz-skip-go') || Date.now() - t0 > 20000) ? r(true) : setTimeout(look, 300); look(); })");
await evaluate("new Promise(r => { const t0 = Date.now(); const look = () => (!document.querySelector('#series-artplayer-container .art-video-player').classList.contains('art-control-show') || Date.now() - t0 > 8000) ? r(true) : setTimeout(look, 300); look(); })");
const skipBox = await evaluate("(() => { const b = document.querySelector('#series-artplayer-container .tvz-skip-go'); if (!b) return null; const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()");
const beforeSkip = await time();
if (skipBox) await click(skipBox.x, skipBox.y);
await sleep(1200);
const afterSkip = await time();
check("tapping 'Pular abertura' with the controls hidden jumps to the end of the opening", Boolean(skipBox) && afterSkip > 190 && afterSkip < 215,
  `${beforeSkip.toFixed(1)} -> ${afterSkip.toFixed(1)}`);
await evaluate("(window.artInstance.currentTime = 5, true)");
await sleep(800);

// ---------- double tap
let t0 = await time();
await doubleTap(at(0.85).x, at(0.85).y);
await sleep(500);
let t1 = await time();
check("double tap on the right skips about +10 s", t1 - t0 >= 9 && t1 - t0 <= 12.5, `${t0.toFixed(1)} -> ${t1.toFixed(1)} (${(t1 - t0).toFixed(1)} s)`);
check("playback keeps running after the skip", await evaluate("!window.artInstance.video.paused"));
const flashText = await evaluate("document.querySelector('#series-artplayer-container .tvz-seek-flash')?.textContent || ''");
check("a confirmation label is shown", /10 s/.test(flashText), JSON.stringify(flashText));

await sleep(900);
t0 = await time();
await doubleTap(at(0.15).x, at(0.15).y);
await sleep(500);
t1 = await time();
check("double tap on the left skips about -10 s", t0 - t1 >= 8 && t0 - t1 <= 10.5, `${t0.toFixed(1)} -> ${t1.toFixed(1)} (${(t1 - t0).toFixed(1)} s)`);

await sleep(900);
const wasPaused = await evaluate("window.artInstance.video.paused");
await doubleTap(at(0.5).x, at(0.5).y);
await sleep(500);
check("double tap in the middle still toggles play/pause", (await evaluate("window.artInstance.video.paused")) !== wasPaused);
await evaluate("(window.artInstance.play(), true)");
await sleep(900);

t0 = await time();
await click(at(0.85).x, at(0.85).y);
await sleep(900);
t1 = await time();
check("a single tap does not skip", Math.abs(t1 - t0 - 0.9) < 1.5, `${t0.toFixed(1)} -> ${t1.toFixed(1)}`);

// ---------- a sideways drag over the video does not seek (Android's back gesture starts at the edge and drags inward)
const swipe = async (fromX, toX, y) => {
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: fromX, y }] });
  for (let i = 1; i <= 8; i++) {
    await send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: fromX + (toX - fromX) * i / 8, y }] });
    await sleep(16);
  }
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
};
await sleep(900);
t0 = await time();
await swipe(box.x + box.w - 4, box.x + box.w * 0.3, at(0.5).y);
await sleep(700);
t1 = await time();
check("dragging from the right edge to the left does not seek", t1 - t0 > -1 && t1 - t0 < 2.5, `${t0.toFixed(1)} -> ${t1.toFixed(1)}`);
t0 = await time();
// (a drag to the right reads as the browser's own back navigation in emulation, so both drags go left)
await swipe(box.x + box.w * 0.8, box.x + box.w * 0.2, at(0.5).y);
await sleep(700);
t1 = await time();
check("dragging across the middle of the video does not seek", t1 - t0 > -1 && t1 - t0 < 2.5, `${t0.toFixed(1)} -> ${t1.toFixed(1)}`);

// ---------- fullscreen survives the next episode on the phone (the button sets art.fullscreen; userGesture stands for the tap)
const evaluateTap = async (expr) => {
  const r = await send("Runtime.evaluate", { expression: `(async () => JSON.stringify(await (${expr})))()`, awaitPromise: true, returnByValue: true, userGesture: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return JSON.parse(r.result.value ?? "null");
};
await evaluateTap("(window.artInstance.fullscreen = true, new Promise(r => setTimeout(() => r(true), 1500)))").catch(() => {});
const fsBefore = await evaluate("(() => { const f = document.fullscreenElement; return f ? f.className : null; })()");
check("fullscreen on the phone goes to the player stage", /movie-player-stage/.test(fsBefore || ""), JSON.stringify(fsBefore));
const headerBefore = await evaluate("(document.getElementById('series-player-current-ep') || {}).textContent || ''");
await evaluateTap("(document.getElementById('btn-series-next-ep').click(), true)");
const fsNext = await evaluate(`new Promise(resolve => { const before = ${JSON.stringify(headerBefore)}; const t0 = Date.now(); const look = () => {
  const header = (document.getElementById('series-player-current-ep') || {}).textContent || '';
  const art = window.artInstance; const f = document.fullscreenElement;
  if ((header && header !== before && art && art.video && art.video.readyState > 0) || Date.now() - t0 > 45000)
    resolve({ header: header.slice(0, 40), fullscreen: f ? f.className : null, artSaysFullscreen: Boolean(art && art.fullscreen) });
  else setTimeout(look, 500); }; look(); })`);
check("fullscreen on the phone stays on through the next episode",
  fsNext.header !== headerBefore.slice(0, 40) && /movie-player-stage/.test(fsNext.fullscreen || "") && fsNext.artSaysFullscreen, JSON.stringify(fsNext));
await evaluate("(document.exitFullscreen ? document.exitFullscreen().catch(() => {}) : null, new Promise(r => setTimeout(() => r(true), 800)))");

// ---------- skip step shared with the keyboard (the arrow keys themselves are checked in player_ui_check.mjs:
// Artplayer does not enable keyboard shortcuts on phones)
check("the skip step is 10 s for taps and for the arrow keys", (await evaluate("window.Artplayer.SEEK_STEP")) === 10);

// ---------- the player pages and the title page fill the screen (the same gap, none, on every side)
const gaps = (selector) => evaluate(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { left: Math.round(r.left), right: Math.round(innerWidth - r.right), top: Math.round(r.top), bottom: Math.round(innerHeight - r.bottom) }; })()`);
const even = (g) => Math.max(g.left, g.right, g.top, g.bottom) - Math.min(g.left, g.right, g.top, g.bottom) <= 1;
const playerGaps = await gaps("#series-player-view .movie-modal-card");
check("series player page fills the screen", even(playerGaps) && playerGaps.left === 0, JSON.stringify(playerGaps));

await evaluate("(document.getElementById('btn-close-series-player').click(), true)");
await sleep(1200);
const detailsGaps = await gaps("#title-page");
check("title page fills the screen", even(detailsGaps) && detailsGaps.left === 0, JSON.stringify(detailsGaps));

await evaluate("(window.TvzinhaActions.switchView('movies'), true)");
await sleep(1500);
await evaluate("(window.TvzinhaActions.openMovie({ id: 1022789, title: 'Divertida Mente 2', backdrop_path: null, poster_path: null, overview: '' }, true), true)");
await sleep(5000);
const movieGaps = await gaps("#movie-player-view .movie-modal-card");
check("movie player page fills the screen", even(movieGaps) && movieGaps.left === 0, JSON.stringify(movieGaps));

console.log(`\n${results.filter(Boolean).length}/${results.length} checks passed`);
try { ws.close(); } catch {}
stopBrowser();
process.exit(results.every(Boolean) ? 0 : 1);
