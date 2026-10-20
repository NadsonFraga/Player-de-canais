/**
 * Checks the Coleção (modules/collection.js) and the "Gostou? Avalie" card (modules/ratePrompt.js):
 *   1. the profile menu opens it, with the count of each tab (seeded library, progress and favorites)
 *   2. Assistindo shows the time left of a movie and the episode of a series, with the bar
 *   3. Quero assistir lists newest first; the Filmes / Séries / Animes filter splits it
 *   4. Avaliados shows the score; 5. the remove button turns the field off (kept with its time, for the sync)
 *   6. a card opens its title page and Back returns; 7. Back from the Coleção goes home; the menu's "Continuar
 *      assistindo" opens it on Assistindo; 8. a favorite channel opens the channel
 *   9. the end of a movie marks it Assistido and asks for a score in the player; a star saves it
 *  10. phones: no sideways scroll
 *
 *   node tools/collection_check.mjs [--browser=chrome|edge|firefox] [--shots=<folder>]   (chrome by default)
 *
 * Needs `python tools/local_server.py` on 127.0.0.1:8787 and internet (TMDB through /api/tmdb, a real movie).
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
  const profile = mkdtempSync(join(tmpdir(), `tvz-collection-${name}-`));
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

const COLLECTION_OPEN = `document.body.getAttribute('data-app-view') === 'collection' && ${visible("view-collection")}`;
const COUNTS = "Object.fromEntries([...document.querySelectorAll('#collection-tabs .collection-tab')].map(t => [t.dataset.collectionTab, Number((t.querySelector('.collection-count') || {}).textContent || 0)]))";
const CARDS = "[...document.querySelectorAll('#collection-grid .movie-poster-card')].map(c => ({ title: c.querySelector('.movie-card-title').textContent, meta: c.querySelector('.movie-card-meta span').textContent, score: (c.querySelector('.collection-score') || {}).textContent || '', bar: Boolean(c.querySelector('.collection-progress')) }))";
const tab = (id) => `(document.querySelector('[data-collection-tab="${id}"]').click(), true)`;
const filter = (id) => `(document.querySelector('[data-collection-filter="${id}"]').click(), true)`;
const LIBRARY = "JSON.parse(localStorage.getItem('tvzinha_library_v1') || '{}').items || {}";
const VIDEO = "document.querySelector('#movie-artplayer-container video')";

const seed = `(() => {
  const now = Date.now();
  const on = (at) => ({ on: true, at });
  localStorage.setItem('tvzinha_library_v1', JSON.stringify({ items: {
    'movie:299534': { kind: 'movie', id: 299534, title: 'Vingadores: Ultimato', poster_path: '/q6725aR8Zs4IwGMXzZT8aC8lh41.jpg', year: '2019', watchlist: on(now - 3000), rating: { value: 7, at: now - 2000 } },
    'tv:1668': { kind: 'tv', id: 1668, title: 'Friends', poster_path: '/f496cm9enuEsZkSPzCwnTESEK5s.jpg', year: '1994', watched: on(now - 1000) },
    'tv:31911': { kind: 'anime', id: 31911, title: 'Fullmetal Alchemist: Brotherhood', poster_path: '/5ZFUEOULaVml7pQuXxhpR2SmVUw.jpg', year: '2009', watchlist: on(now) }
  } }));
  localStorage.setItem('tvzinha_watch_progress_v1', JSON.stringify({
    'movie:550': { id: 550, title: 'Clube da Luta', poster_path: '/r3pPehX4ik8NLYPpbDRAh0YRtMb.jpg', mediaType: 'movie', position: 3000, duration: 8340, finished: false, timestamp: now - 500 },
    1399: { id: 1399, title: 'Game of Thrones', poster_path: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg', season: 1, episode: 2, mediaType: 'tv', timestamp: now }
  }));
  localStorage.setItem('tvzinha_favorites', JSON.stringify(['TV Aberta:Globo']));
  return true;
})()`;

const b = await launch(browserName);
try {
  await b.viewport(1366, 800);
  await startApp(b);
  await b.evaluate(seed);
  await startApp(b);

  // 1. From the profile menu, with the counts of each tab
  await b.evaluate("(document.getElementById('btn-nav-profile').click(), true)");
  await b.evaluate("(document.querySelector('#nav-profile-menu [data-menu-action=\"collection\"]').click(), true)");
  const opened = await waitFor(b, COLLECTION_OPEN, 5000);
  const counts = await b.evaluate(COUNTS);
  check("the profile menu opens the Coleção", opened !== null);
  check("tab counts: Assistindo 2, Quero assistir 2, Assistidos 1, Avaliados 1, Canais 1",
    counts.watching === 2 && counts.watchlist === 2 && counts.watched === 1 && counts.rated === 1 && counts.channels === 1, JSON.stringify(counts));

  // 2. Assistindo: progress label and bar
  const watching = await b.evaluate(CARDS);
  const movieCard = watching.find(c => c.title === 'Clube da Luta');
  const showCard = watching.find(c => c.title === 'Game of Thrones');
  check("Assistindo shows 'Faltam X min' for a movie and T1:E2 for a series, with the bar",
    Boolean(movieCard && /^Faltam \d+ min$/.test(movieCard.meta) && movieCard.bar && showCard && showCard.meta === 'T1:E2'), JSON.stringify(watching));
  await b.shot("collection-watching.png");

  // 3. Quero assistir and the filter
  await b.evaluate(tab("watchlist"));
  const all = (await b.evaluate(CARDS)).map(c => c.title);
  await b.evaluate(filter("anime"));
  const animes = (await b.evaluate(CARDS)).map(c => c.title);
  await b.evaluate(filter("movie"));
  const movies = (await b.evaluate(CARDS)).map(c => c.title);
  await b.evaluate(filter("all"));
  check("Quero assistir lists both, newest first", all.join('|') === 'Fullmetal Alchemist: Brotherhood|Vingadores: Ultimato', JSON.stringify(all));
  check("the filter splits Animes and Filmes", animes.join('|') === 'Fullmetal Alchemist: Brotherhood' && movies.join('|') === 'Vingadores: Ultimato', JSON.stringify({ animes, movies }));

  // 4. Avaliados shows the score
  await b.evaluate(tab("rated"));
  const rated = await b.evaluate(CARDS);
  check("Avaliados shows the score in stars (3,5)", rated.length === 1 && /3,5/.test(rated[0].score), JSON.stringify(rated));

  // 5. Remove from Quero assistir
  await b.evaluate(tab("watchlist"));
  await b.evaluate("(document.querySelector('#collection-grid .collection-remove').click(), true)");
  await sleep(300);
  const afterRemove = await b.evaluate(`({ cards: document.querySelectorAll('#collection-grid .movie-poster-card').length, entry: (${LIBRARY})['tv:31911'] })`);
  check("the remove button takes it off Quero assistir (kept as off, with its time)", afterRemove.cards === 1 && afterRemove.entry && afterRemove.entry.watchlist && afterRemove.entry.watchlist.on === false && afterRemove.entry.watchlist.at > 0, JSON.stringify(afterRemove));

  // 6. A card opens the title page; Back returns to the Coleção
  await b.evaluate(tab("watched"));
  await b.evaluate("(document.querySelector('#collection-grid .movie-poster-card').click(), true)");
  const titleOpen = await waitFor(b, `${PAGE_OPEN} && location.search === '?serie=1668'`, 8000);
  check("a card opens its title page", titleOpen !== null);
  await b.evaluate("(history.back(), true)");
  const backToCollection = await waitFor(b, `!(${PAGE_OPEN}) && ${COLLECTION_OPEN}`, 5000);
  check("Back returns to the Coleção", backToCollection !== null);

  // 7. Back from the Coleção goes home; the menu's "Continuar assistindo" opens it on Assistindo
  await b.evaluate("(history.back(), true)");
  const home = await waitFor(b, "document.body.getAttribute('data-app-view') === 'home'", 5000);
  check("Back from the Coleção goes home", home !== null);
  await b.evaluate("(document.getElementById('btn-nav-profile').click(), true)");
  await b.evaluate("(document.querySelector('#nav-profile-menu [data-menu-action=\"continue\"]').click(), true)");
  const onWatching = await waitFor(b, `${COLLECTION_OPEN} && document.querySelector('.collection-tab.active').dataset.collectionTab === 'watching'`, 5000);
  check("'Continuar assistindo' opens the Coleção on Assistindo", onWatching !== null);

  // 8. Favorite channels open the channel
  await b.evaluate(tab("channels"));
  const channelNames = await b.evaluate("[...document.querySelectorAll('#collection-grid .collection-channel')].map(c => c.dataset.channel)");
  await b.evaluate("(document.querySelector('#collection-grid .collection-channel').click(), true)");
  const channel = await waitFor(b, "document.body.getAttribute('data-app-view') === 'tv' && window.TvzinhaActions.store.activeChannel && /globo/i.test(window.TvzinhaActions.store.activeChannel.name || '')", 10000);
  check("Canais favoritos lists Globo and opens it", channelNames.join() === 'Globo' && channel !== null, JSON.stringify(channelNames));
  await b.evaluate("(window.TvzinhaActions.switchView('home'), true)");
  await sleep(1500);

  // 9. The end of a movie: Assistido and the "Gostou? Avalie" card; a star saves the score
  await b.evaluate("(window.TvzinhaActions.openMovie({ id: 1022789, title: 'Divertida Mente 2' }, true), true)");
  const playing = await waitFor(b, `(() => { const v = ${VIDEO}; return Boolean(v && v.currentTime > 1 && v.duration > 600); })()`, 60000);
  check("the movie plays on the Player Principal", playing !== null);
  await b.evaluate(`(() => { const v = ${VIDEO}; v.currentTime = v.duration * 0.97; return true; })()`);
  await waitFor(b, `(() => { const v = ${VIDEO}; return Boolean(v && v.currentTime > v.duration * 0.97 + 1); })()`, 30000);
  await b.evaluate("(window.artInstance.pause(), true)");
  const prompt = await waitFor(b, "Boolean(document.querySelector('#movie-player-view .rate-prompt'))", 15000);
  const watchedNow = await b.evaluate(`Boolean((${LIBRARY})['movie:1022789'] && (${LIBRARY})['movie:1022789'].watched.on)`);
  check("reaching the end marks it Assistido and shows 'Gostou? Avalie' in the player", prompt !== null && watchedNow);
  await b.shot("rate-prompt.png");
  await b.evaluate("(document.querySelector('#movie-player-view .rate-prompt .rate-star-half[data-value=\"8\"]').click(), true)");
  await sleep(400);
  const scored = await b.evaluate(`({ value: ((${LIBRARY})['movie:1022789'] || {}).rating, gone: !document.querySelector('.rate-prompt') })`);
  check("a star saves the score (4 stars = 8) and closes the card", scored.value && scored.value.value === 8 && scored.gone, JSON.stringify(scored));
  await b.evaluate("(window.TvzinhaActions.closeTitle(), true)");
  await sleep(1000);

  // 10. Phones: the Coleção fits the width
  await b.viewport(390, 844, true);
  await b.evaluate("(window.TvzinhaActions.openCollection('watched'), true)");
  await waitFor(b, COLLECTION_OPEN, 5000);
  await sleep(800);
  const side = await b.evaluate("document.documentElement.scrollWidth > innerWidth");
  check("phone: no sideways scroll", !side);
  await b.shot("collection-phone.png");
} catch (e) {
  check("run without errors", false, e.message);
} finally {
  b.close();
}

const failed = results.filter(ok => !ok).length;
console.log(`\n${results.length - failed}/${results.length} passed (${browserName})`);
process.exit(failed ? 1 : 0);
