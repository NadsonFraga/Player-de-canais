/**
 * Opens the same episode through every entry point and checks that all of them build the same episode context
 * (see the "One entry point for episodes" rule in CLAUDE.md).
 *
 *   node tools/episode_entry_check.mjs [--browser=chrome|edge|firefox]   (chrome by default)
 *
 * Needs `python tools/local_server.py` on 127.0.0.1:8787. The /api/resolve calls are answered in the page with a
 * stub source that does not exist (their URL is recorded), so nothing plays and the MGEB host is not hit: what is compared is what the site
 * asks for (server request, anime lookup), the player header and the saved history entry.
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

// The episode each show is opened at, its expected numbering, and a TMDB number saved by older history
const SHOWS = [
  { name: "Dragon Ball Z", id: 12971, anime: true, season: 9, episode: 31, absolute: 284 },
  { name: "Naruto Shippuden", id: 31910, anime: true, season: 2, episode: 1, absolute: 33, legacyEpisode: 33 },
  { name: "JoJo's Bizarre Adventure", id: 45790, anime: true, season: 1, episode: 2, absolute: 2 },
  { name: "Breaking Bad", id: 1396, anime: false, season: 3, episode: 5, absolute: 25 },
];

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

/** { evaluate(expr), navigate(url), close() } for headless Edge (CDP) or Firefox (WebDriver BiDi), always muted. */
async function launch(name) {
  const profile = mkdtempSync(join(tmpdir(), `tvz-entry-${name}-`));
  const port = 9800 + Math.floor(Math.random() * 150);
  if (name === "firefox") {
    writeFileSync(join(profile, "user.js"), 'user_pref("media.volume_scale", "0.0");\nuser_pref("media.autoplay.default", 0);\nuser_pref("full-screen-api.allow-trusted-requests-only", false);\n');
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
      click: (x, y) => send("input.performActions", { context, actions: [{ type: "pointer", id: "mouse", actions: [
        { type: "pointerMove", x: Math.round(x) - 40, y: Math.round(y) - 40 }, { type: "pointerMove", x: Math.round(x), y: Math.round(y), duration: 200 },
        { type: "pause", duration: 400 }, { type: "pointerDown", button: 0 }, { type: "pointerUp", button: 0 }] }] }),
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
      // userGesture: counts as a click, which fullscreen requires (Firefox gets the same through a test-profile pref)
      const r = await send("Runtime.evaluate", { expression: `(async () => JSON.stringify(await (${expr})))()`, awaitPromise: true, returnByValue: true, userGesture: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return JSON.parse(r.result.value ?? "null");
    },
    click: async (x, y) => {
      // controls only take clicks after the pointer has moved over the player
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: x - 40, y: y - 40 });
      await send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
      await sleep(400);
      await send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
      await send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
    },
    close: () => { try { ws.close(); } catch {} try { spawnSync("taskkill", ["/PID", String(proc.pid), "/T", "/F"], { stdio: "ignore" }); } catch {} },
  };
}

const b = await launch(browserName);
try {
  await b.navigate(BASE + "/");
  for (let i = 0; i < 120; i++) {
    if (await b.evaluate("Boolean(window.TvzinhaActions && window.TvzinhaActions.store)").catch(() => false)) break;
    await sleep(250);
  }
  // Stub the resolve endpoint (record what is asked) and load the series module
  await b.evaluate(`(async () => {
    window.__resolves = [];
    const realFetch = window.fetch.bind(window);
    window.__realFetch = realFetch;
    window.fetch = (input, init) => {
      const url = String((input && input.url) || input);
      if (url.includes('/api/resolve')) {
        window.__resolves.push(url);
        // A source that does not exist: the player starts (and fires the anime lookup) but nothing plays
        const body = url.includes('aniskip_only=1') ? { success: false, reason: 'test_stub' }
          : { success: true, primary_source: { label: 'stub', type: 'hls', stream_url: location.origin + '/test-stub.m3u8' }, fallback_sources: [], subtitles: [] };
        return Promise.resolve(new Response(JSON.stringify(body), { status: body.success ? 200 : 404, headers: { 'Content-Type': 'application/json' } }));
      }
      return realFetch(input, init);
    };
    window.__s = await import('/assets/js/modules/series.js?v=${VERSION}');
    return true;
  })()`);

  // What the page asked for after an action: the server request, the anime lookup, the header and the history
  // The episode context the page built, the header and the history entry it saved
  const SNAPSHOT = (id) => `(() => {
    const c = window.__s.getCurrentEpisodeContext() || {};
    const progress = JSON.parse(localStorage.getItem('tvzinha_watch_progress_v1') || '{}')[${id}] || {};
    return {
      header: (document.getElementById('series-player-current-ep') || {}).textContent || '',
      context: [c.tmdbId, c.season, c.episode, c.tmdbEpisode, c.absolute, c.totalEpisodes, c.isAnime, c.imdbId].join('|'),
      history: progress.season + ':' + progress.episode + ':' + progress.absolute + ':' + progress.mediaType,
      count: window.__resolves.length,
    };
  })()`;
  // Requests made while this show was being tested: the main server request and the anime lookup
  const REQUESTS = `(() => {
    const pick = (url, keys) => { const q = new URL(url).searchParams; return keys.map(k => k + '=' + (q.get(k) || '')).join('&'); };
    return {
      main: [...new Set(window.__resolves.filter(u => !u.includes('aniskip_only=1')).map(u => pick(u, ['type', 'season', 'episode'])))],
      lookup: [...new Set(window.__resolves.filter(u => u.includes('aniskip_only=1')).map(u => pick(u, ['season', 'episode', 'absolute_episode', 'total_episodes'])))],
    };
  })()`;
  const waitForOpen = async (show, before) => {
    for (let i = 0; i < 60; i++) {
      const snap = await b.evaluate(SNAPSHOT(show.id));
      if (snap.count > before && snap.header.includes(`T${show.season}:E${show.episode}`)) { await sleep(700); return b.evaluate(SNAPSHOT(show.id)); }
      await sleep(250);
    }
    return b.evaluate(SNAPSHOT(show.id));
  };
  const count = () => b.evaluate("window.__resolves.length");
  const reset = () => b.evaluate("(window.__s.stopSeriesPlayer(), window.__s.closeSeriesModal(), new Promise(r => setTimeout(() => r(true), 400)))");
  const openDetails = async (show) => {
    await b.evaluate(`(window.__s.openSeriesModal({ id: ${show.id}, name: ${JSON.stringify(show.name)} }, '${show.anime ? "anime" : "tv"}'), true)`);
    for (let i = 0; i < 40; i++) {
      if (await b.evaluate("document.querySelectorAll('#series-season-select option').length > 0")) break;
      await sleep(250);
    }
    await sleep(500);
  };

  for (const show of SHOWS) {
    console.log(`\n== ${show.name} (T${show.season}:E${show.episode}, geral ${show.absolute})`);
    const paths = {};
    await b.evaluate("(window.__resolves = [], true)");

    // 1. "Continuar assistindo": the card keeps only id and name; Naruto's entry uses TMDB's old number
    await reset();
    await b.evaluate(`(localStorage.setItem('tvzinha_watch_progress_v1', JSON.stringify({ ${show.id}: { id: ${show.id}, title: ${JSON.stringify(show.name)}, season: ${show.season}, episode: ${show.legacyEpisode || show.episode}, mediaType: 'tv', timestamp: Date.now() } })), window.__s.renderHomeContinueWatching(), window.TvzinhaActions.switchView('home'), true)`);
    await sleep(800);
    let before = await count();
    await b.evaluate("(document.querySelector('#home-continue-watching-section .continue-card')?.click(), true)");
    paths["continuar assistindo"] = await waitForOpen(show, before);

    // 2. details button "Continuar" (reads the history saved by path 1)
    await reset();
    await openDetails(show);
    before = await count();
    await b.evaluate("(document.getElementById('btn-series-modal-direct-play').click(), true)");
    paths["botao dos detalhes"] = await waitForOpen(show, before);

    // 3. season list
    await reset();
    await openDetails(show);
    await b.evaluate(`(() => { const s = document.getElementById('series-season-select'); s.value = '${show.season}'; s.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
    for (let i = 0; i < 40; i++) {
      if (await b.evaluate(`[...document.querySelectorAll('#series-episodes-grid .series-ep-card')].some(c => /Ep\\. ${show.episode}$/.test((c.querySelector('.ep-number-tag') || {}).textContent || ''))`)) break;
      await sleep(250);
    }
    before = await count();
    await b.evaluate(`([...document.querySelectorAll('#series-episodes-grid .series-ep-card')].find(c => /Ep\\. ${show.episode}$/.test((c.querySelector('.ep-number-tag') || {}).textContent || ''))?.click(), true)`);
    paths["temporadas e arcos"] = await waitForOpen(show, before);

    // 4. continuous list (block that holds the show-wide number)
    await reset();
    await openDetails(show);
    await b.evaluate("(document.getElementById('btn-mode-continuous').click(), true)");
    await sleep(800);
    await b.evaluate(`([...document.querySelectorAll('#series-chunks-container .chunk-pill')].find(p => { const [a, z] = p.textContent.split('-').map(Number); return ${show.absolute} >= a && ${show.absolute} <= z; })?.click(), true)`);
    await sleep(800);
    before = await count();
    await b.evaluate(`(document.querySelector('#series-continuous-grid .series-ep-card[data-season="${show.season}"][data-episode="${show.episode}"]')?.click(), true)`);
    paths["lista continua"] = await waitForOpen(show, before);

    // 5. "ir para o episodio N"
    before = await count();
    await b.evaluate(`(() => { document.getElementById('series-quick-ep-search').value = '${show.absolute}'; document.getElementById('btn-go-to-ep').click(); return true; })()`);
    paths["ir para o episodio N"] = await waitForOpen(show, before);

    // 6. episode list inside the player
    await b.evaluate("(document.getElementById('btn-toggle-drawer').click(), true)");
    await sleep(500);
    before = await count();
    await b.evaluate(`([...document.querySelectorAll('#series-drawer-list .drawer-item')].find(i => /^Ep\\. ${show.episode} -/.test(i.textContent.trim()))?.click(), true)`);
    paths["lista do player"] = await waitForOpen(show, before);

    // 7. "Proximo" from the episode before (crosses seasons through the show-wide number)
    await b.evaluate(`(() => { document.getElementById('series-quick-ep-search').value = '${show.absolute - 1}'; document.getElementById('btn-go-to-ep').click(); return true; })()`);
    await sleep(2500);
    before = await count();
    await b.evaluate("(document.getElementById('btn-series-next-ep').click(), true)");
    paths["botao proximo"] = await waitForOpen(show, before);

    // 8. "Anterior" from the episode after
    await b.evaluate(`(() => { document.getElementById('series-quick-ep-search').value = '${show.absolute + 1}'; document.getElementById('btn-go-to-ep').click(); return true; })()`);
    await sleep(2500);
    before = await count();
    await b.evaluate("(document.getElementById('btn-series-prev-ep').click(), true)");
    paths["botao anterior"] = await waitForOpen(show, before);

    const ref = paths["temporadas e arcos"];
    for (const [path, snap] of Object.entries(paths)) {
      const same = snap.header === ref.header && snap.context === ref.context && snap.history === ref.history;
      const expectHeader = snap.header.includes(`T${show.season}:E${show.episode}`) && snap.header.includes(`Ep. geral ${show.absolute}`);
      const expectContext = snap.context.startsWith(`${show.id}|${show.season}|${show.episode}|`) && snap.context.includes(`|${show.absolute}|`) && snap.context.includes(`|${show.anime}|`);
      const expectHistory = snap.history === `${show.season}:${show.episode}:${show.absolute}:${show.anime ? "anime" : "tv"}`;
      const ok = same && expectHeader && expectContext && expectHistory;
      check(`${show.name} - ${path}`, ok, ok ? "" : JSON.stringify(snap));
    }
    const req = await b.evaluate(REQUESTS);
    const target = `type=serie&season=${show.season}&episode=${show.episode}`;
    check(`${show.name} - pedido ao servidor principal na nossa numeracao`, req.main.includes(target), JSON.stringify(req.main));
    check(`${show.name} - ${show.anime ? "consulta do anime com o numero geral" : "nenhuma consulta de anime"}`,
      show.anime ? req.lookup.some(l => l.includes(`season=${show.season}&episode=${show.episode}&absolute_episode=${show.absolute}`)) : req.lookup.length === 0,
      JSON.stringify(req.lookup));
    console.log(`   cabecalho: ${ref.header}
   contexto (tmdb|temp|ep|ep TMDB|geral|total|anime|imdb): ${ref.context}`);
  }
  // Real playback (stub removed): skip markers reach the progress bar for a series and for an anime resumed from
  // the "Continuar assistindo" card. No recap in a first episode.
  await b.evaluate("(window.fetch = window.__realFetch, window.__s.stopSeriesPlayer(), window.__s.closeSeriesModal(), true)");
  const markers = async (label, open, expected) => {
    await b.evaluate("(window.__s.stopSeriesPlayer(), new Promise(r => setTimeout(() => r(true), 1500)))");
    await b.evaluate(open);
    const found = await b.evaluate(`new Promise(resolve => { const t0 = Date.now(); const look = () => {
      const ranges = [...document.querySelectorAll('#series-artplayer-container .tvz-skip-range')].map(r => r.className.split('--')[1]);
      if ((ranges.length && Date.now() - t0 > 3000) || Date.now() - t0 > 60000) resolve(ranges); else setTimeout(look, 500); }; look(); })`);
    check(`marcacoes reais - ${label}`, expected.every(t => found.includes(t)) && !found.includes("recap"), JSON.stringify(found));
  };
  await markers("Game of Thrones T1E1 (serie: abertura e encerramento, sem recapitulacao)",
    "(window.__s.openEpisode({ id: 1399, name: 'Game of Thrones' }, { season: 1, episode: 1 }), true)", ["intro", "outro"]);
  // Fullscreen survives the next episode. The player's fullscreen button sets art.fullscreen; the test sets it the
  // same way (simulated pointer clicks do not reach Artplayer's controls in headless browsers). Headless Firefox
  // refuses every fullscreen request (even on a plain element), so there only the episode change is checked.
  const fsAllowed = await b.evaluate(`(async () => { const d = document.createElement('div'); document.body.appendChild(d);
    try { await d.requestFullscreen(); await document.exitFullscreen(); return true; } catch (e) { return false; } finally { d.remove(); } })()`);
  await sleep(800);
  if (fsAllowed) await b.evaluate("(window.artInstance.fullscreen = true, new Promise(r => setTimeout(() => r(true), 1500)))").catch(() => {});
  const fsOn = await b.evaluate("(() => { const f = document.fullscreenElement; return Boolean(f && f.matches('.movie-player-stage')); })()");
  if (fsAllowed) check("tela cheia entra pela moldura do player", fsOn);
  else console.log("   (tela cheia nao disponivel neste navegador de teste: so a troca de episodio e conferida)");
  await b.evaluate("(document.getElementById('btn-series-next-ep').click(), true)");
  const fsNext = await b.evaluate(`new Promise(resolve => { const t0 = Date.now(); const look = () => {
    const header = (document.getElementById('series-player-current-ep') || {}).textContent || '';
    const art = window.artInstance; const f = document.fullscreenElement;
    if ((header.includes('T1:E2') && art && art.video && art.video.readyState > 0) || Date.now() - t0 > 45000)
      resolve({ header: header.slice(0, 40), stage: Boolean(f && f.matches('.movie-player-stage')), artSaysFullscreen: Boolean(art && art.fullscreen) });
    else setTimeout(look, 500); }; look(); })`);
  check(fsAllowed ? "tela cheia continua no proximo episodio" : "proximo episodio abre depois de uma tentativa de tela cheia",
    fsNext.header.includes("T1:E2") && (!fsAllowed || (fsNext.stage && fsNext.artSaysFullscreen)), JSON.stringify(fsNext));
  await b.evaluate("(window.__s.stopSeriesPlayer(), new Promise(r => setTimeout(() => r(true), 1000)))");
  check("fechar o player sai da tela cheia", await b.evaluate("!document.fullscreenElement"));
  await b.evaluate(`(localStorage.setItem('tvzinha_watch_progress_v1', JSON.stringify({ 45790: { id: 45790, title: "JoJo's Bizarre Adventure", season: 1, episode: 2, mediaType: 'tv', timestamp: Date.now() } })), window.__s.renderHomeContinueWatching(), window.TvzinhaActions.switchView('home'), true)`);
  await sleep(800);
  // The dubbed video of the main player is 32 s longer than any AniSkip cut, so the anime player is used, as a viewer
  // resuming an anime there would
  await markers("JoJo T1E2 pelo continuar assistindo, no player de animes",
    `(async () => { document.querySelector('#home-continue-watching-section .continue-card')?.click();
      for (let i = 0; i < 60 && !document.querySelector('[data-server="native_anime"]'); i++) await new Promise(r => setTimeout(r, 250));
      document.querySelector('[data-server="native_anime"]')?.click(); return true; })()`, ["intro", "outro"]);

  // ---------- Resume at the exact time and player preferences (JoJo E2 on the anime player, HLS: plays in both browsers)
  const ready = (episodeText) => b.evaluate(`new Promise(resolve => { const t0 = Date.now(); const look = () => {
    const a = window.artInstance; const header = (document.getElementById('series-player-current-ep') || {}).textContent || '';
    if ((a && a.video && a.video.readyState >= 2 && header.includes('${episodeText}') && Date.now() - t0 > 2500) || Date.now() - t0 > 60000) resolve(Boolean(a && a.video && a.video.readyState >= 2));
    else setTimeout(look, 400); }; look(); })`);
  const seekTo = (t) => b.evaluate(`new Promise(r => { const v = window.artInstance.video; v.addEventListener('seeked', () => setTimeout(() => r(true), 1500), { once: true }); window.artInstance.currentTime = ${t}; setTimeout(() => r(false), 15000); })`);
  const now = () => b.evaluate("Math.round(window.artInstance.currentTime)");
  const saved = () => b.evaluate("((JSON.parse(localStorage.getItem('tvzinha_watch_progress_v1') || '{}')[45790] || {}).positions || {})['1:2'] || null");
  const notice = () => b.evaluate("(document.querySelector('#series-artplayer-container .tvz-resume-text') || {}).textContent || ''");
  const jojo = "(window.__s.openEpisode({ id: 45790, name: \"JoJo's Bizarre Adventure\" }, { season: 1, episode: 2 }), true)";

  await ready("T1:E2");
  await seekTo(600);
  await b.evaluate("(window.artInstance.pause(), true)");
  await sleep(500);
  const kept = await saved();
  check("retomada: a posicao fica salva ao pausar", kept && Math.abs(kept.position - 600) <= 3 && kept.server === "native_anime", JSON.stringify(kept));
  await b.evaluate("(window.__s.stopSeriesPlayer(), new Promise(r => setTimeout(() => r(true), 1200)))");
  await b.evaluate(jojo);
  await ready("T1:E2");
  const resumedAt = await now();
  const resumeText = await notice();
  check("retomada: reabrir o episodio continua de onde parou, com o aviso", resumedAt >= 595 && resumedAt <= 615 && /^Continuando de 10:0\d$/.test(resumeText), `${resumedAt}s, "${resumeText}"`);
  await b.evaluate("(document.querySelector('#series-artplayer-container .tvz-resume-restart')?.click(), true)");
  await sleep(1500);
  check("retomada: 'Comecar do inicio' volta para o comeco", (await now()) <= 5, `${await now()}s`);

  await seekTo(400);
  await b.evaluate("(document.getElementById('btn-reload-series-player').click(), true)");
  await ready("T1:E2");
  const afterReload = await now();
  check("retomada: recarregar mantem o minuto, sem aviso", afterReload >= 397 && afterReload <= 410 && (await notice()) === "", `${afterReload}s`);

  // switching between the two native players: Dragon Ball Z S9E31 has HLS sources on both
  await b.evaluate("(window.__s.stopSeriesPlayer(), new Promise(r => setTimeout(() => r(true), 1000)))");
  await b.evaluate("(window.__s.openEpisode({ id: 12971, name: 'Dragon Ball Z' }, { season: 9, episode: 31 }), true)");
  await b.evaluate("(document.querySelector('[data-server=\"native_direct\"]')?.click(), true)");
  if (await ready("T9:E31")) {
    await seekTo(300);
    await b.evaluate("(window.artInstance.pause(), true)");
    await b.evaluate("(document.querySelector('[data-server=\"native_anime\"]')?.click(), true)");
    await ready("T9:E31");
    const afterSwitch = await now();
    check("retomada: trocar do player principal para o de animes volta 10 s", afterSwitch >= 287 && afterSwitch <= 296, `${afterSwitch}s (estava em ~300s)`);
  } else {
    console.log("   (o player principal nao tocou o DBZ neste navegador de teste: troca de player nao conferida)");
  }

  // preferences: volume, speed and subtitle language come back after the page is reloaded
  await b.evaluate("(document.querySelector('[data-server=\"native_anime\"]')?.click(), true)");
  await ready("T1:E2");
  await b.evaluate("(window.artInstance.volume = 0.4, window.artInstance.playbackRate = 1.5, true)");
  await sleep(800);
  await b.evaluate("(() => { const p = JSON.parse(localStorage.getItem('tvzinha_player_prefs_v1') || '{}'); p.subtitle = 'en'; localStorage.setItem('tvzinha_player_prefs_v1', JSON.stringify(p)); return true; })()");
  const storedPrefs = await b.evaluate("JSON.parse(localStorage.getItem('tvzinha_player_prefs_v1') || '{}')");
  check("preferencias: volume e velocidade salvos num registro proprio", storedPrefs.volume === 0.4 && storedPrefs.playbackRate === 1.5, JSON.stringify(storedPrefs));
  await b.navigate(BASE + "/");
  for (let i = 0; i < 120; i++) { if (await b.evaluate("Boolean(window.TvzinhaActions && window.TvzinhaActions.store)").catch(() => false)) break; await sleep(250); }
  await b.evaluate(`import('/assets/js/modules/series.js?v=${VERSION}').then(m => (window.__s = m, true))`);
  await b.evaluate(jojo);
  await ready("T1:E2");
  // a fresh page starts on the main player; JoJo's subtitles come with the anime player
  await b.evaluate("(document.querySelector('[data-server=\"native_anime\"]')?.click(), true)");
  await ready("T1:E2");
  const applied = await b.evaluate("({ volume: Math.round(window.artInstance.volume * 100) / 100, rate: window.artInstance.playbackRate, subtitle: (window.artInstance.setting.find('subtitle') || {}).tooltip || '' })");
  check("preferencias: volume, velocidade e legenda voltam depois de recarregar a pagina", applied.volume === 0.4 && applied.rate === 1.5 && /Ingl/.test(applied.subtitle), JSON.stringify(applied));
} catch (err) {
  check("script ran to the end", false, String(err && err.message || err));
} finally {
  b.close();
}
console.log(`\n${results.filter(Boolean).length}/${results.length} checks passed (${browserName})`);
process.exit(results.every(Boolean) ? 0 : 1);
