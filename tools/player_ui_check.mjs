/**
 * Real-browser check of the native player (headless Chrome or Edge over CDP, no dependencies, Node 22+).
 *
 * Covers: background image/carousel activity per tab, the anime episode numbering (Dragon Ball Z S9E31),
 * the details badge, the settings menu rows (no Espelhar/Proporção, Áudio and Legendas always present,
 * Portuguese subtitle first), the progress bar hit area and the horizontal volume control.
 *
 * Usage:
 *   python tools/local_server.py                      (in another terminal)
 *   node tools/player_ui_check.mjs <screenshotDir>    (saves a few PNGs there)
 *
 * Uses 127.0.0.1 on purpose. The cache version used by the import() below is read from index.html.
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = "http://127.0.0.1:8787";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
// --browser=chrome (default) or --browser=edge: both Chromium; Chrome is what most viewers use
const BROWSER = (process.argv.find(a => a.startsWith("--browser=")) || "--browser=chrome").split("=")[1];
const CHROMIUM = BROWSER === "edge" ? EDGE : CHROME;
const shotDir = process.argv[2];
const PORT = 9700 + Math.floor(Math.random() * 200);
const stopBrowser = () => { try { spawnSync("taskkill", ["/PID", String(proc.pid), "/T", "/F"], { stdio: "ignore" }); } catch {} };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = "") => { results.push(ok); console.log(`${ok ? "OK  " : "FAIL"} ${name} ${detail}`); };

const profile = mkdtempSync(join(tmpdir(), "tvz-ui-"));
const proc = spawn(CHROMIUM, ["--headless=new", `--remote-debugging-port=${PORT}`, "--remote-allow-origins=*", `--user-data-dir=${profile}`,
  "--no-first-run", "--mute-audio", "--autoplay-policy=no-user-gesture-required", "--window-size=1280,800", "about:blank"], { stdio: "ignore" });
let page;
for (let i = 0; i < 60 && !page; i++) {
  try { page = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find(t => t.type === "page"); } catch {}
  if (!page) await sleep(250);
}
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let nextId = 0;
const pending = new Map();
const consoleErrors = [];
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { const { res, rej } = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result); }
  else if (msg.method === "Runtime.exceptionThrown") consoleErrors.push((msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text || "").split("\n")[0]);
  else if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") consoleErrors.push(msg.params.args.map(a => a.value ?? a.description ?? "").join(" ").slice(0, 160));
};
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++nextId; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
const evaluate = async (expr) => {
  // userGesture: counts as a click (Chrome refuses fullscreen without one; Edge was lenient)
  const r = await send("Runtime.evaluate", { expression: `(async () => JSON.stringify(await (${expr})))()`, awaitPromise: true, returnByValue: true, userGesture: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return JSON.parse(r.result.value ?? "null");
};
const shot = async (name) => { const r = await send("Page.captureScreenshot", { format: "png" }); writeFileSync(join(shotDir, name), Buffer.from(r.data, "base64")); };
const mouse = (x, y) => send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });

await send("Runtime.enable"); await send("Page.enable");
await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Page.navigate", { url: BASE + "/" });
for (let i = 0; i < 180; i++) {
  if (await evaluate("typeof window.TvzinhaActions !== 'undefined'").catch(() => false)) break;
  await sleep(500);
}
await sleep(1500);
await evaluate("(window.TvzinhaActions && window.TvzinhaActions.closeAdblockModal && window.TvzinhaActions.closeAdblockModal(), true)").catch(() => {});

// ---------- regression: opening a catalog tab right after the app starts must load that catalog
// (the tab hooks used to be registered under the wrong names, so a tab opened before the idle preload stayed empty)
for (const view of ["movies", "series", "animes"]) {
  await send("Storage.clearDataForOrigin", { origin: BASE, storageTypes: "all" });
  await send("Page.navigate", { url: BASE + "/" });
  for (let i = 0; i < 900; i++) { if (await evaluate("typeof window.TvzinhaActions !== 'undefined'").catch(() => false)) break; await sleep(100); }
  await evaluate("(window.TvzinhaActions.closeAdblockModal && window.TvzinhaActions.closeAdblockModal(), true)").catch(() => {});
  await evaluate(`(() => { const b = [...document.querySelectorAll('[data-view]')].find(el => el.getAttribute('data-view') === ${JSON.stringify(view)} && el.offsetParent !== null); if (b) b.click(); return true; })()`);
  await sleep(7000);
  const early = await evaluate(`(() => ({ view: window.TvzinhaActions.store.currentView, tmdb: performance.getEntriesByType('resource').filter(e => e.name.includes('api.themoviedb.org')).length, imgs: document.images.length }))()`);
  check(`opening ${view} right after the app starts loads its catalog`, early.view === view && early.tmdb > 0 && early.imgs > 150, JSON.stringify(early));
}
// clearing the storage also brings the adblock notice back (it opens a moment after the page loads): close it again
await sleep(2500);
await evaluate("(window.TvzinhaActions.closeAdblockModal && window.TvzinhaActions.closeAdblockModal(), true)").catch(() => {});
await evaluate("(window.TvzinhaActions.switchView('home'), true)");
await sleep(1500);

// ---------- background images: carousels must stop when nobody sees them
const tmdbImages = () => evaluate("performance.getEntriesByType('resource').filter(e => e.name.includes('image.tmdb.org')).length");
const heroIndex = () => evaluate("(() => { const dots = [...document.querySelectorAll('#movies-hero-dots .hero-dot')]; return { count: dots.length, active: dots.findIndex(d => d.classList.contains('active')) }; })()");
await evaluate("(window.TvzinhaActions.switchView('movies'), true)");
await sleep(5000);
const heroA = await heroIndex();
await sleep(17000);
const heroB = await heroIndex();
check("positive control: the Movies carousel advances while its tab is visible", heroA.count > 1 && heroA.active !== heroB.active, `slide ${heroA.active} -> ${heroB.active} of ${heroA.count}`);

await evaluate("(window.TvzinhaActions.switchView('tv'), true)");
await sleep(2000);
const tvHeroA = await heroIndex();
const tvBefore = await tmdbImages();
await sleep(17000);
const tvHeroB = await heroIndex();
const tvAfter = await tmdbImages();
check("TV tab: the Movies carousel stays still (it rotates every 7.5 s)", tvHeroA.active === tvHeroB.active, `slide ${tvHeroA.active} -> ${tvHeroB.active}`);
check("TV tab: no TMDB image requests in 17 s", tvAfter === tvBefore, `${tvBefore} -> ${tvAfter}`);

// ---------- DBZ season 9 episode 31 through the anime player
const APP_VERSION = (await import('node:fs')).readFileSync(new URL('../index.html', import.meta.url), 'utf8').match(/main\.js\?v=([^"]+)/)[1];
await evaluate(`import('/assets/js/modules/series.js?v=${APP_VERSION}').then(m => { window.__series = m; return true; })`);
await evaluate("(window.TvzinhaActions.switchView('animes'), true)");
await sleep(1500);
await evaluate(`window.__series.openSeriesModal({ id: 12971, name: 'Dragon Ball Z', original_name: 'ドラゴンボールZ', first_air_date: '1989-04-26', genre_ids: [16], original_language: 'ja', backdrop_path: null, poster_path: null }, 'tv', { autoPlaySeason: 9, autoPlayEpisode: 31 }).then(() => true)`);
await sleep(6000);
await evaluate("(document.querySelector('[data-server=\"native_anime\"]')?.click(), true)");
await sleep(12000);
const resolveUrls = await evaluate("performance.getEntriesByType('resource').map(e => e.name).filter(n => n.includes('/api/resolve') && n.includes('type=anime'))");
const lastUrl = resolveUrls[resolveUrls.length - 1] || "";
console.log("   anime resolve request:", lastUrl.replace(BASE, ""));
check("request carries episode=31, absolute_episode=284 and total_episodes=291",
  /episode=31(&|$)/.test(lastUrl) && /absolute_episode=284/.test(lastUrl) && /total_episodes=291/.test(lastUrl));
const answer = lastUrl ? await evaluate(`fetch(${JSON.stringify(lastUrl)}).then(r => r.json()).then(d => ({ ok: d.success, ep: d.aniskip && d.aniskip.episode, subs: (d.subtitles || []).map(s => s.label + (s.default ? '*' : '')) }))`) : null;
check("server used episode 284 and returned only Portuguese + English subtitles", answer && answer.ok && answer.ep === 284 && answer.subs.length <= 2, JSON.stringify(answer));
const badge = await evaluate("document.getElementById('series-player-meta-badge')?.textContent || ''");
check("details badge shows the show-wide number", /Ep\. geral 284/.test(badge), `"${badge}"`);
const header = await evaluate("document.getElementById('series-player-current-ep')?.textContent || ''");
check("player header shows T9:E31, the show-wide number and the episode name", /T9:E31 • Ep\. geral 284 – \S/.test(header), `"${header}"`);

// ---------- keyboard: the right arrow skips 10 s (Artplayer only enables shortcuts on desktop, after a click on the player)
await evaluate("(window.artInstance.currentTime > 2 ? true : new Promise(r => setTimeout(() => r(true), 3000)))");
const playerPoint = await evaluate("(() => { const r = document.querySelector('#series-artplayer-container .art-video-player').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height * 0.3 }; })()");
await send("Input.dispatchMouseEvent", { type: "mousePressed", x: playerPoint.x, y: playerPoint.y, button: "left", clickCount: 1 });
await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: playerPoint.x, y: playerPoint.y, button: "left", clickCount: 1 });
await sleep(400);
await evaluate("(window.artInstance.video.pause(), true)");
await sleep(300);
const beforeKey = await evaluate("window.artInstance.currentTime");
await send("Input.dispatchKeyEvent", { type: "keyDown", windowsVirtualKeyCode: 39, nativeVirtualKeyCode: 39, key: "ArrowRight", code: "ArrowRight" });
await send("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: 39, nativeVirtualKeyCode: 39, key: "ArrowRight", code: "ArrowRight" });
await sleep(500);
const afterKey = await evaluate("window.artInstance.currentTime");
check("the right arrow key skips 10 s", Math.abs(afterKey - beforeKey - 10) < 1.5, `${beforeKey.toFixed(1)} -> ${afterKey.toFixed(1)}`);
await evaluate("(window.artInstance.play(), true)");

// ---------- settings menu rows (anime player)
const rows = await evaluate("(window.artInstance && window.artInstance.setting.option || []).map(o => ({ name: o.name, html: o.html, tooltip: o.tooltip }))");
console.log("   settings rows:", JSON.stringify(rows));
const names = rows.map(r => r.name);
check("no Espelhar / Proporção rows", !names.includes("flip") && !names.includes("aspect-ratio") && !rows.some(r => /Espelhar|Proporção/.test(r.html || "")));
check("Áudio row is always there (single track shows 'Original')", rows.some(r => r.name === "audio" && /Original/.test(r.tooltip || "")));
const wanted = answer && answer.subs.some(l => /Português/.test(l)) ? /Português/ : /Inglês/;
check("Legendas row starts on Portuguese when the title has it, otherwise English", rows.some(r => r.name === "subtitle" && wanted.test(r.tooltip || "")), `server subs=${JSON.stringify(answer && answer.subs)}`);

// ---------- AniSkip: DBZ episode 284 has an opening (0-203 s) and an ending; the video is inside the opening now
const skip = await evaluate(`new Promise(resolve => {
  const started = Date.now();
  const look = () => {
    const root = document.querySelector('#series-artplayer-container .art-video-player');
    const ranges = root ? root.querySelectorAll('.art-control-progress-inner .tvz-skip-range').length : 0;
    const button = root && root.querySelector('.tvz-skip-go');
    if ((ranges && button) || Date.now() - started > 15000) {
      resolve({ ranges, label: button ? button.textContent.trim() : null, close: Boolean(root && root.querySelector('.tvz-skip-close')) });
    } else setTimeout(look, 300);
  };
  look();
})`);
check("AniSkip: opening and ending drawn on the progress bar", skip.ranges === 2, JSON.stringify(skip));
check("AniSkip: 'Pular abertura' button with a dismiss control inside the opening", skip.label === "Pular abertura" && skip.close, JSON.stringify(skip));
// the card sits above the progress bar (its clickable area), in the window and in fullscreen
const CARD_GAP = `(() => { const root = document.querySelector('#series-artplayer-container .art-video-player');
  root.classList.add('art-control-show'); window.artInstance.emit('control', true);
  const card = root.querySelector('.tvz-side-card'); const bar = root.querySelector('.art-control-progress');
  return new Promise(r => setTimeout(() => r(card && bar ? Math.round(bar.getBoundingClientRect().top - card.getBoundingClientRect().bottom) : null), 400)); })()`;
const gapWindow = await evaluate(CARD_GAP);
await shot("anime-skip-button.png");
await evaluate("(window.artInstance.fullscreen = true, new Promise(r => setTimeout(() => r(true), 1200)))").catch(() => {});
const inFullscreen = await evaluate("Boolean(document.fullscreenElement)");
const gapFull = inFullscreen ? await evaluate(CARD_GAP) : null;
if (inFullscreen) await shot("anime-skip-button-fullscreen.png");
await evaluate("(window.artInstance.fullscreen = false, new Promise(r => setTimeout(() => r(true), 800)))").catch(() => {});
check("skip card sits above the progress bar (window, and fullscreen when the test browser allows it)",
  gapWindow !== null && gapWindow >= 0 && gapWindow <= 30 && (!inFullscreen || (gapFull >= 0 && gapFull <= 30)),
  `window gap ${gapWindow}px, fullscreen ${inFullscreen ? gapFull + "px" : "not available here"}`);
await evaluate("(document.querySelector('#series-artplayer-container .tvz-skip-go').click(), true)");
await sleep(600);
const afterSkip = await evaluate("({ t: window.artInstance.currentTime, button: Boolean(document.querySelector('#series-artplayer-container .tvz-skip-go')) })");
check("AniSkip: the button jumps to the end of the opening and goes away", afterSkip.t > 195 && afterSkip.t < 215 && !afterSkip.button, JSON.stringify(afterSkip));
// DBZ 284's ending runs to the end of the video: the card offers only the next episode (no countdown yet)
await evaluate("(window.artInstance.currentTime = 1365, true)");
// the seek completes once the proxy delivers the segment there
await evaluate("new Promise(r => { const t0 = Date.now(); const look = () => (document.querySelector('#series-artplayer-container .tvz-skip') || Date.now() - t0 > 12000) ? r(true) : setTimeout(look, 300); look(); })");
const outroCard = await evaluate("({ t: window.artInstance.currentTime, actions: [...document.querySelectorAll('#series-artplayer-container .tvz-skip [data-action]')].map(b => b.dataset.action), close: Boolean(document.querySelector('#series-artplayer-container .tvz-skip-close')), countdown: Boolean(document.querySelector('#series-artplayer-container .tvz-upnext')) })");
check("AniSkip: an ending that runs to the end offers 'Próximo episódio' with a dismiss control, no countdown", outroCard.actions.join() === "next" && outroCard.close && !outroCard.countdown, JSON.stringify(outroCard));
await evaluate("(document.querySelector('#series-artplayer-container .tvz-skip-close').click(), true)");
await sleep(400);
const dismissed = await evaluate("Boolean(document.querySelector('#series-artplayer-container .tvz-skip'))");
check("AniSkip: the x removes the card", !dismissed);
await evaluate("(window.artInstance.currentTime = 210, true)");

// ---------- progress bar hit area and volume
// controls hide when the mouse is idle, and they move while hiding: wake them before measuring
const playerBox = await evaluate("(() => { const r = document.querySelector('#series-artplayer-container .art-video-player').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()");
await mouse(playerBox.x + playerBox.w / 2, playerBox.y + playerBox.h / 2);
await sleep(700);
const geometry = await evaluate(`(() => {
  const box = el => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  const root = document.querySelector('#series-artplayer-container .art-video-player');
  return { progress: box(root.querySelector('.art-control-progress')), inner: box(root.querySelector('.art-control-progress-inner')),
           builtin: getComputedStyle(root.querySelector('.art-control-volume')).display, volumeBtn: box(root.querySelector('.tvz-volume-btn')),
           range: box(root.querySelector('.tvz-volume-range')) };
})()`);
console.log("   geometry:", JSON.stringify(geometry));
check("progress click area is at least 20 px tall", geometry.progress && geometry.progress.h >= 20, `${geometry.progress?.h} px`);
check("visible bar stays thin (<= 8 px)", geometry.inner && geometry.inner.h <= 8, `${geometry.inner?.h} px`);
check("built-in vertical volume is hidden, horizontal one exists", geometry.builtin === "none" && Boolean(geometry.volumeBtn));
await mouse(geometry.volumeBtn.x + 10, geometry.volumeBtn.y + 10);
await sleep(500);
const hovered = await evaluate(`(() => { const r = document.querySelector('#series-artplayer-container .tvz-volume-range').getBoundingClientRect(); const p = document.querySelector('#series-artplayer-container .art-control-progress').getBoundingClientRect(); return { range: { y: r.y, h: r.height, w: r.width }, progressBottom: p.bottom }; })()`);
check("hovering volume expands a slider that stays below the progress bar", hovered.range.w > 60 && hovered.range.y >= hovered.progressBottom, `slider w=${Math.round(hovered.range.w)} top=${Math.round(hovered.range.y)} progress bottom=${Math.round(hovered.progressBottom)}`);
await shot("anime-player-volume-hover.png");
// the bar must react 8 px above its drawn line (inside the 24 px area), measured with the controls visible
const live = await evaluate(`(() => { const r = document.querySelector('#series-artplayer-container .art-control-progress').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })()`);
await mouse(live.x + live.w * 0.5, live.y + live.h / 2 - 8);
await sleep(400);
const hoverOnBar = await evaluate("Boolean(document.querySelector('#series-artplayer-container .art-control-progress:hover'))");
check("progress bar reacts with the mouse 8 px above the drawn line", hoverOnBar, `bar rect y=${Math.round(live.y)} h=${Math.round(live.h)}`);
await shot("anime-player-progress-hover.png");

// ---------- MGEB player: rows too
await evaluate("(document.querySelector('[data-server=\"native_direct\"]')?.click(), true)");
await sleep(15000);
const rows2 = await evaluate("(window.artInstance && window.artInstance.setting.option || []).map(o => ({ name: o.name, tooltip: o.tooltip }))");
console.log("   MGEB-player rows:", JSON.stringify(rows2));
check("MGEB player also has Áudio and Legendas rows, no Espelhar/Proporção", rows2.some(r => r.name === "audio") && rows2.some(r => r.name === "subtitle") && !rows2.some(r => r.name === "flip" || r.name === "aspect-ratio"));
await shot("mgeb-player.png");

// ---------- continuous list: cards and the player header carry the real episode name
await evaluate("(window.TvzinhaActions.stopSeries && window.TvzinhaActions.stopSeries(), true)").catch(() => {});
await sleep(1500);
await evaluate(`window.__series.openSeriesModal({ id: 12971, name: 'Dragon Ball Z', original_name: 'ドラゴンボールZ', first_air_date: '1989-04-26', genre_ids: [16], original_language: 'ja', backdrop_path: null, poster_path: null }, 'tv', {}).then(() => true)`);
await sleep(3000);
await evaluate("(document.getElementById('btn-mode-continuous')?.click(), true)");
await sleep(4000);
const card = await evaluate(`(() => { const c = document.querySelector('#series-continuous-grid .series-ep-card[data-season="2"][data-episode="6"]'); return c ? { title: c.querySelector('.ep-title').textContent, overview: c.querySelector('.ep-overview').textContent.length, tag: c.querySelector('.ep-number-tag').textContent } : null; })()`);
console.log("   continuous card (absolute 45 = T2:E6):", JSON.stringify(card));
check("continuous card shows the real episode name and synopsis", card && !/^Epis[oó]dio \d+$/.test(card.title) && card.overview > 0 && card.tag === "Ep. 45", JSON.stringify(card));
await evaluate("(document.querySelector('#series-continuous-grid .series-ep-card[data-season=\"2\"][data-episode=\"6\"]')?.click(), true)");
await sleep(5000);
const header2 = await evaluate("document.getElementById('series-player-current-ep')?.textContent || ''");
check("player opened from the continuous list shows T2:E6, Ep. geral 45 and the episode name", /T2:E6 • Ep\. geral 45 – \S/.test(header2) && !/Epis[oó]dio \d+/.test(header2), `"${header2}"`);
const glyphs = await evaluate("({ emojiMode: getComputedStyle(document.body).fontVariantEmoji, playGlyph: (() => { const c = document.querySelector('#series-continuous-grid .series-ep-card .ep-meta-row span:last-child'); return c ? [...c.textContent].map(ch => ch.codePointAt(0).toString(16)).join(' ') : null; })() })");
check("glyphs are forced to text presentation (no colored emoji on any phone)", glyphs.emojiMode === "text" && /25b6 fe0e$/.test(glyphs.playGlyph || ""), JSON.stringify(glyphs));
await shot("continuous-player-header-desktop.png");
// phone width: the header must keep the show-wide number visible (only the episode name may be cut)
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await sleep(1200);
const phoneHeader = await evaluate(`(() => {
  const rect = sel => document.querySelector(sel).getBoundingClientRect();
  const title = rect('#series-player-current-ep'), actions = rect('#series-player-view .series-player-actions'), back = rect('#btn-close-series-player');
  const media = rect('#series-player-view .series-modal-media-area'), stage = rect('#series-player-view .series-theater-stage');
  const center = r => (r.top + r.bottom) / 2;
  return { titleWidth: Math.round(title.width), rowOffset: Math.round(Math.max(Math.abs(center(title) - center(actions)), Math.abs(center(title) - center(back)))),
           buttonSize: Math.round(Math.min(back.width, back.height, actions.height)), stageHeight: Math.round(stage.height),
           stageInsideMedia: stage.bottom <= media.bottom + 1, inViewport: actions.right <= window.innerWidth };
})()`);
console.log("   phone header:", JSON.stringify(phoneHeader));
check("phone: back, title, reload and exit share one row; the title keeps most of the width", phoneHeader.titleWidth >= 180 && phoneHeader.rowOffset <= 24, JSON.stringify(phoneHeader));
check("phone: icon buttons are easy to touch (>= 36 px) and the video stage is not clipped", phoneHeader.buttonSize >= 36 && phoneHeader.stageInsideMedia && phoneHeader.stageHeight >= 150 && phoneHeader.inViewport, JSON.stringify(phoneHeader));
await shot("continuous-player-header-phone.png");
await send("Emulation.clearDeviceMetricsOverride");
await sleep(800);

// ---------- header buttons: back (episodes), reload, exit (catalog of the same kind)
const exitTitle = await evaluate("document.getElementById('btn-exit-series-player').title");
check("exit button names the catalog it leads to (Animes for an anime)", exitTitle === "Sair para Animes", exitTitle);
await evaluate("(document.getElementById('btn-close-series-player').click(), true)");
await sleep(1200);
const afterBack = await evaluate("({ player: !document.getElementById('series-player-view').classList.contains('hidden'), details: !document.getElementById('series-modal').classList.contains('hidden') })");
check("back arrow returns to the episode list (player closed, details open)", !afterBack.player && afterBack.details, JSON.stringify(afterBack));
await evaluate(`window.__series.playSeriesEpisode({ id: 12971, name: 'Dragon Ball Z', original_name: 'ドラゴンボールZ', first_air_date: '1989-04-26', genre_ids: [16], original_language: 'ja', backdrop_path: null, poster_path: null }, 2, 6)`);
await sleep(3000);
await evaluate("(document.getElementById('btn-exit-series-player').click(), true)");
await sleep(1500);
const afterExit = await evaluate("({ player: !document.getElementById('series-player-view').classList.contains('hidden'), details: !document.getElementById('series-modal').classList.contains('hidden'), view: window.TvzinhaActions.store.currentView, locked: document.body.classList.contains('modal-open') })");
check("exit (X) leaves the player and the details and shows the Animes catalog", !afterExit.player && !afterExit.details && afterExit.view === "animes" && !afterExit.locked, JSON.stringify(afterExit));

// ---------- the case from the screenshot: Fullmetal Alchemist: Brotherhood used to start in Arabic
await evaluate("(window.TvzinhaActions.stopSeries && window.TvzinhaActions.stopSeries(), true)").catch(() => {});
await sleep(1500);
await evaluate(`window.__series.openSeriesModal({ id: 31911, name: 'Fullmetal Alchemist: Brotherhood', original_name: '鋼の錬金術師 FULLMETAL ALCHEMIST', first_air_date: '2009-04-05', genre_ids: [16], original_language: 'ja', backdrop_path: null, poster_path: null }, 'tv', { autoPlaySeason: 1, autoPlayEpisode: 1 }).then(() => true)`);
await sleep(6000);
await evaluate("(document.querySelector('[data-server=\"native_anime\"]')?.click(), true)");
await sleep(12000);
const fmabRows = await evaluate("(window.artInstance && window.artInstance.setting.option || []).map(o => ({ name: o.name, tooltip: o.tooltip, selector: (o.selector || []).map(i => i.html + (i.default ? '*' : '')) }))");
console.log("   FMAB rows:", JSON.stringify(fmabRows));
const subRow = fmabRows.find(r => r.name === "subtitle");
check("FMA:B starts on Português (Brasil), with Inglês as the only other option", subRow && /Português \(Brasil\)/.test(subRow.tooltip) && subRow.selector.join("|") === "Desativada|Português (Brasil)*|Inglês", JSON.stringify(subRow));
await evaluate("(document.querySelector('#series-artplayer-container .art-control-setting')?.click(), true)");
await sleep(600);
await shot("fmab-settings-menu.png");

// ---------- Canais: leaving the tab must stop the channel at once (direct player and contingency iframe)
const silence = () => evaluate(`(() => ({
  tvPlayer: Boolean(window.tvArtInstance),
  playingMedia: [...document.querySelectorAll('video, audio')].filter(m => !m.paused && !m.ended).length,
  liveFrames: [...document.querySelectorAll('iframe')].filter(f => f.getAttribute('src') && f.getAttribute('src') !== 'about:blank').length,
  activeChannel: window.TvzinhaActions.store.activeChannel ? window.TvzinhaActions.store.activeChannel.name || 'sim' : null,
  view: window.TvzinhaActions.store.currentView,
}))()`);

await evaluate("(window.TvzinhaActions.switchView('tv'), true)");
await sleep(1500);
await evaluate("(window.TvzinhaActions.selectChannel('TV Aberta', 'Band'), true)");
await sleep(9000);
const direct = await silence();
check("a channel on the direct player is playing", direct.tvPlayer || direct.playingMedia > 0, JSON.stringify(direct));
await evaluate("(window.TvzinhaActions.switchView('movies'), true)");
await sleep(700);
const afterDirect = await silence();
check("leaving Canais stops the direct player at once and clears the active channel", !afterDirect.tvPlayer && afterDirect.playingMedia === 0 && afterDirect.liveFrames === 0 && afterDirect.activeChannel === null, JSON.stringify(afterDirect));

await evaluate("(window.TvzinhaActions.switchView('tv'), true)");
await sleep(1200);
const welcome = await evaluate("({ hero: (document.querySelector('#content-display .hero-title') || {}).textContent || '', players: document.querySelectorAll('#content-display video, #content-display iframe[src]:not([src=\"about:blank\"])').length })");
check("coming back to Canais shows a clean start screen, not the old player", /Escolha um canal/.test(welcome.hero) && welcome.players === 0, JSON.stringify(welcome));

await evaluate("(window.TvzinhaActions.selectChannel('TV Aberta', 'Globo'), true)");
await sleep(2500);
const contingencyClicked = await evaluate("(() => { const b = document.querySelector('#contingency-servers-grid .btn-server-option'); if (!b) return false; b.click(); return true; })()");
await sleep(4000);
const frameOn = await evaluate("(() => { const f = document.getElementById('stream-iframe'); return f ? f.getAttribute('src') || '' : '(sem iframe)'; })()");
check("a channel on the contingency iframe is loaded", contingencyClicked && /^https?:/.test(frameOn), frameOn.slice(0, 70));
await evaluate("(window.TvzinhaActions.switchView('series'), true)");
await sleep(700);
const afterFrame = await silence();
check("leaving Canais empties the contingency iframe at once (no audio left behind)", afterFrame.liveFrames === 0 && afterFrame.playingMedia === 0 && afterFrame.activeChannel === null, JSON.stringify(afterFrame));

// ---------- movie player: exit goes to the Filmes catalog; the back-to-details step stays hidden
await evaluate("(window.TvzinhaActions.switchView('home'), true)");
await sleep(1000);
await evaluate("(window.TvzinhaActions.openMovie({ id: 1022789, title: 'Divertida Mente 2', backdrop_path: null, poster_path: null, overview: '' }, true), true)");
await sleep(6000);
const movieButtons = await evaluate("({ hiddenBack: document.getElementById('btn-close-movie-player').hidden, exitTitle: document.getElementById('btn-exit-movie-player').title, modalOpen: !document.getElementById('movie-modal').classList.contains('hidden') })");
check("movie header shows reload and exit only (back-to-details is hidden)", movieButtons.modalOpen && movieButtons.hiddenBack && movieButtons.exitTitle === "Sair para Filmes", JSON.stringify(movieButtons));
// an embedded (iframe) server fills the player box instead of the browser's default 150 px
await evaluate("(document.querySelectorAll('#movie-servers-grid .btn-movie-server:not(.native-direct)')[1]?.click(), true)");
await sleep(2500);
const frameBox = await evaluate("(() => { const f = document.getElementById('movie-modal-iframe'); const s = f && f.parentElement.getBoundingClientRect(); const r = f && f.getBoundingClientRect(); return f ? { frameH: Math.round(r.height), stageH: Math.round(s.height), frameW: Math.round(r.width), stageW: Math.round(s.width) } : null; })()");
check("an iframe server fills the whole player box", frameBox && frameBox.frameH > 200 && Math.abs(frameBox.frameH - frameBox.stageH) <= 2 && Math.abs(frameBox.frameW - frameBox.stageW) <= 2, JSON.stringify(frameBox));
await evaluate("(document.getElementById('btn-exit-movie-player').click(), true)");
await sleep(1500);
const movieAfter = await evaluate("({ modal: !document.getElementById('movie-modal').classList.contains('hidden'), view: window.TvzinhaActions.store.currentView, locked: document.body.classList.contains('modal-open') })");
check("movie exit (X) closes the player and shows the Filmes catalog", !movieAfter.modal && movieAfter.view === "movies" && !movieAfter.locked, JSON.stringify(movieAfter));

// ---------- series skip segments (TheIntroDB + SkipDB): Game of Thrones S1E1 on the main player
// Expected: the 100 s opening (the 13 s submission loses), the ending, and no recap in a first episode
await evaluate("(window.__series.openEpisode({ id: 1399, name: 'Game of Thrones' }, { season: 1, episode: 1 }), true)");
const gotSkip = await evaluate(`new Promise(resolve => {
  const started = Date.now();
  const look = () => {
    const root = document.querySelector('#series-artplayer-container .art-video-player');
    const ranges = root ? [...root.querySelectorAll('.art-control-progress-inner .tvz-skip-range')].map(r => r.className.replace('tvz-skip-range tvz-skip-range--', '')) : [];
    if (ranges.length || Date.now() - started > 45000) resolve({ ranges, duration: Math.round(window.artInstance?.video?.duration || 0) });
    else setTimeout(look, 500);
  };
  look();
})`);
check("series: opening and ending of Game of Thrones S1E1 on the bar, no recap in a first episode", gotSkip.ranges.join() === "intro,outro", JSON.stringify(gotSkip));
await evaluate("(window.artInstance.currentTime = 445, true)");
// a seek this far into a long MP4 can take a while in headless Chrome
await evaluate("new Promise(r => { const t0 = Date.now(); const look = () => ((document.querySelector('#series-artplayer-container .tvz-skip-go') && !window.artInstance.video.seeking) || Date.now() - t0 > 40000) ? r(true) : setTimeout(look, 300); look(); })");
const gotButton = await evaluate("(document.querySelector('#series-artplayer-container .tvz-skip-go') || {}).textContent || ''");
await evaluate("(document.querySelector('#series-artplayer-container .tvz-skip-go')?.click(), true)");
await sleep(1500);
const gotAfter = await evaluate("Math.round(window.artInstance.currentTime)");
check("series: 'Pular abertura' jumps to the end of the 100 s opening (~8:57)", /Pular abertura/.test(gotButton) && gotAfter >= 530 && gotAfter <= 545, `${gotButton.trim()} -> ${gotAfter}s`);

check("no uncaught console errors", consoleErrors.filter(e => !/favicon|ERR_|net::|Failed to load resource|403|404/.test(e)).length === 0, JSON.stringify(consoleErrors.slice(0, 4)));

console.log(`\n${results.filter(Boolean).length}/${results.length} checks passed`);
try { ws.close(); } catch {}
stopBrowser();
process.exit(results.every(Boolean) ? 0 : 1);
