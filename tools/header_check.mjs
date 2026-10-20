/**
 * Checks the header pill tools (modules/header.js):
 *   1. the brand icon replaces the Início tab and goes home; Esportes is dimmed with no badge; search, profile and
 *      settings come in that order
 *   2. the profile and settings menus open and Back closes them; settings opens Privacidade and the ad-block tips
 *   3. "/" opens the search; typing a word makes one request (not one per letter); the category filters reuse it;
 *      a result opens the title page and Back returns
 *   4. channels are found with no request, listed first, and open the channel; Back closes the search
 *   5. phones: one row with a single menu button (search, profile and options inside); the whole pill tucks away
 *      scrolling down and comes back scrolling up; it clears the title page's back button
 *
 *   node tools/header_check.mjs [--browser=chrome|edge|firefox] [--shots=<folder>]   (chrome by default)
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
  const profile = mkdtempSync(join(tmpdir(), `tvz-header-${name}-`));
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

const TOOLS_ORDER = "[...document.querySelectorAll('#nav-capsule-tools .nav-tool')].map(b => b.id).join(',')";
const SEARCH_OPEN = visible("search-overlay");
const SEARCH_CALLS = "performance.getEntriesByType('resource').filter(e => e.name.includes('/api/tmdb') && e.name.includes('search%2Fmulti')).length";
const typeInSearch = (text) => `(() => { const i = document.getElementById('global-search-input'); i.value = ${JSON.stringify(text)}; i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`;

const b = await launch(browserName);
try {
  await b.viewport(1366, 800);
  await startApp(b);

  // 1. The pill: brand icon instead of Início, Esportes dimmed without a badge, tools in order
  const pill = await b.evaluate(`({
    homeLabel: document.getElementById('nav-tab-home').textContent.trim(),
    brand: Boolean(document.querySelector('#nav-tab-home img')),
    badge: Boolean(document.querySelector('.nav-capsule-badge')),
    sportsOpacity: Number(getComputedStyle(document.getElementById('nav-tab-sports')).opacity),
    tools: ${TOOLS_ORDER}
  })`);
  check("brand icon in place of the Início tab", pill.brand && pill.homeLabel === "", JSON.stringify(pill));
  check("Esportes dimmed, no badge", !pill.badge && pill.sportsOpacity < 0.6, String(pill.sportsOpacity));
  check("tools in order: search, profile, settings", pill.tools === "btn-nav-search,btn-nav-profile,btn-nav-settings", pill.tools);
  await b.evaluate("(window.TvzinhaActions.switchView('movies'), true)");
  await sleep(800);
  await b.evaluate("(document.getElementById('nav-tab-home').click(), true)");
  const home = await waitFor(b, "document.body.getAttribute('data-app-view') === 'home'", 4000);
  check("the brand icon goes home", home !== null);
  await b.evaluate("(document.getElementById('nav-tab-sports').click(), true)");
  await sleep(500);
  const sports = await b.evaluate("({ view: document.body.getAttribute('data-app-view'), toast: document.getElementById('app-toast').textContent })");
  check("Esportes keeps the view and says it is coming", sports.view === "home" && /breve/i.test(sports.toast), JSON.stringify(sports));

  // 2. Menus: open, Back closes; Privacidade from the settings menu
  await b.evaluate("(document.getElementById('btn-nav-profile').click(), true)");
  const profileOpen = await b.evaluate(visible("nav-profile-menu"));
  await b.evaluate("(history.back(), true)");
  const profileClosed = await waitFor(b, `!(${visible("nav-profile-menu")}) && document.body.getAttribute('data-app-view') === 'home'`, 4000);
  check("profile menu opens and Back closes it (page stays)", profileOpen && profileClosed !== null);
  await b.evaluate("(document.getElementById('btn-nav-settings').click(), true)");
  await b.evaluate("(document.querySelector('#nav-settings-menu [data-menu-legal=\"privacy\"]').click(), true)");
  const legal = await waitFor(b, `!(${visible("nav-settings-menu")}) && document.getElementById('legal-modal').style.display === 'flex' && document.getElementById('legal-modal-title').textContent === 'Privacidade'`, 4000);
  check("settings menu opens Privacidade", legal !== null);
  await b.evaluate("(history.back(), true)");
  const legalClosed = await waitFor(b, "document.getElementById('legal-modal').classList.contains('hidden')", 4000);
  check("Back closes the legal panel", legalClosed !== null);
  await b.evaluate("(document.getElementById('btn-nav-settings').click(), true)");
  await b.evaluate("(document.getElementById('btn-menu-adblock').click(), true)");
  const tips = await waitFor(b, `!(${visible("nav-settings-menu")}) && document.getElementById('adblock-modal').style.display === 'flex'`, 4000);
  check("settings menu opens the ad-block tips", tips !== null);
  await b.evaluate("(window.TvzinhaActions.closeAdblockModal(), true)");
  await sleep(500);

  // 3. Search: "/" opens it, one request per search, a result opens the title page
  await b.evaluate("(document.body.focus(), document.dispatchEvent(new KeyboardEvent('keydown', { key: '/', bubbles: true })), true)");
  const searchOpen = await waitFor(b, `${SEARCH_OPEN} && document.activeElement && document.activeElement.id === 'global-search-input'`, 3000);
  check("'/' opens the search with the cursor in the field", searchOpen !== null);
  const before = await b.evaluate(SEARCH_CALLS);
  for (const part of ["b", "ba", "bat", "batm", "batma", "batman"]) {
    await b.evaluate(typeInSearch(part));
    await sleep(60);
  }
  const results = await waitFor(b, "document.querySelectorAll('#search-results .movie-poster-card').length > 0", 15000);
  await sleep(800);
  const after = await b.evaluate(SEARCH_CALLS);
  const groups = await b.evaluate("[...document.querySelectorAll('#search-results .search-group-heading')].map(h => h.textContent)");
  check("typing 'batman' shows Filmes", results !== null && groups.includes("Filmes"), JSON.stringify(groups));
  check("one request for the whole word (not one per letter)", after - before === 1, `${after - before} request(s)`);
  await b.evaluate("(document.querySelector('[data-search-kind=\"tv\"]').click(), true)");
  await sleep(600);
  const tvOnly = await b.evaluate(`({ groups: document.querySelectorAll('#search-results .search-group-heading').length, cards: document.querySelectorAll('#search-results .movie-poster-card').length, calls: ${SEARCH_CALLS} })`);
  check("Séries filters the same answer (no new request)", tvOnly.groups === 0 && tvOnly.cards > 0 && tvOnly.calls === after, JSON.stringify(tvOnly));
  await b.evaluate("(document.querySelector('[data-search-kind=\"all\"]').click(), true)");
  await sleep(400);
  await b.evaluate("(document.querySelector('#search-results .search-title-grid .movie-poster-card').click(), true)");
  const opened = await waitFor(b, `!(${SEARCH_OPEN}) && (${PAGE_OPEN}) && /^\\?(filme|serie|anime)=/.test(location.search)`, 15000);
  check("a result closes the search and opens the title page", opened !== null);
  await b.evaluate("(history.back(), true)");
  const back = await waitFor(b, `!(${PAGE_OPEN}) && !(${SEARCH_OPEN}) && location.search === ''`, 5000);
  check("Back from that title page returns home", back !== null);

  // 4. Channels in the search, and Back closes the search
  await b.evaluate("(window.TvzinhaActions.openSearch(), true)");
  await b.evaluate(typeInSearch("globo"));
  const channelFound = await waitFor(b, "Boolean(document.querySelector('#search-results [data-channel=\"Globo\"]'))", 10000);
  const firstGroup = await b.evaluate("(document.querySelector('#search-results .search-group-heading') || {}).textContent");
  check("'globo' finds the channel, listed first", channelFound !== null && firstGroup === "Canais", firstGroup);
  await b.evaluate("(history.back(), true)");
  const searchClosed = await waitFor(b, `!(${SEARCH_OPEN})`, 4000);
  check("Back closes the search", searchClosed !== null);
  await b.evaluate("(window.TvzinhaActions.openSearch(), true)");
  await b.evaluate(typeInSearch("globo"));
  await waitFor(b, "Boolean(document.querySelector('#search-results [data-channel=\"Globo\"]'))", 10000);
  await b.evaluate("(document.querySelector('#search-results [data-channel=\"Globo\"]').click(), true)");
  const channel = await waitFor(b, `!(${SEARCH_OPEN}) && document.body.getAttribute('data-app-view') === 'tv' && window.TvzinhaActions.store.activeChannel && /globo/i.test(window.TvzinhaActions.store.activeChannel.name || '')`, 10000);
  check("a channel result opens the channel", channel !== null);
  await b.evaluate("(window.TvzinhaActions.switchView('home'), true)");
  await sleep(1200);

  // 5. Phones: one row (tabs and a single round menu button), the menu holds search, profile and options;
  //    the whole pill tucks away scrolling down and comes back scrolling up
  await b.viewport(390, 844, true);
  await sleep(1000);
  const phone = await b.evaluate(`(() => { const p = document.getElementById('floating-nav-capsule').getBoundingClientRect(); const more = document.getElementById('btn-nav-more').getBoundingClientRect();
    return { toolsHidden: getComputedStyle(document.getElementById('nav-capsule-tools')).display === 'none', moreInPill: more.width > 0 && more.top >= p.top && more.bottom <= p.bottom,
             inside: p.left >= 0 && p.right <= innerWidth, sideScroll: document.documentElement.scrollWidth > innerWidth }; })()`);
  check("phone: one row with the menu button, nothing under the pill", phone.toolsHidden && phone.moreInPill && phone.inside && !phone.sideScroll, JSON.stringify(phone));
  await b.evaluate("(document.getElementById('btn-nav-more').click(), true)");
  const menuItems = await b.evaluate("[...document.querySelectorAll('#nav-mobile-menu .nav-menu-item')].map(i => i.dataset.menuAction || i.dataset.menuLegal).join(',')");
  check("phone: the menu holds search, continue, account, tips and the legal panels", menuItems === "search,continue,account,adblock,privacy,terms,dmca", menuItems);
  await b.shot("header-phone-menu.png");
  await b.evaluate("(document.querySelector('#nav-mobile-menu [data-menu-action=\"search\"]').click(), true)");
  const phoneSearch = await waitFor(b, `${SEARCH_OPEN} && !(${visible("nav-mobile-menu")})`, 4000);
  check("phone: Buscar in the menu opens the search", phoneSearch !== null);
  await b.evaluate("(history.back(), true)");
  await waitFor(b, `!(${SEARCH_OPEN})`, 4000);
  await b.evaluate("(window.scrollTo(0, 50), true)");
  await sleep(200);
  await b.evaluate("(window.scrollTo(0, 700), true)");
  const tucked = await waitFor(b, "document.body.classList.contains('nav-tucked') && getComputedStyle(document.getElementById('floating-nav-capsule')).pointerEvents === 'none'", 3000);
  await b.evaluate("(window.scrollTo(0, 300), true)");
  const shown = await waitFor(b, "!document.body.classList.contains('nav-tucked')", 3000);
  check("phone: the pill tucks away scrolling down and comes back scrolling up", tucked !== null && shown !== null);
  await b.evaluate("(window.scrollTo(0, 0), window.TvzinhaActions.openTitle('movie', { id: 1022789, title: 'Divertida Mente 2' }), true)");
  await waitFor(b, PAGE_OPEN, 5000);
  await sleep(1500);
  const clear = await b.evaluate("(() => { const t = document.getElementById('floating-nav-capsule').getBoundingClientRect(); const k = document.getElementById('btn-title-back').getBoundingClientRect(); return !(t.left < k.right && t.right > k.left && t.top < k.bottom && t.bottom > k.top); })()");
  check("phone: the pill is clear of the title page's back button", clear);
  await b.shot("header-phone-title.png");
} catch (e) {
  check("run without errors", false, e.message);
} finally {
  b.close();
}

const failed = results.filter(ok => !ok).length;
console.log(`\n${results.length - failed}/${results.length} passed (${browserName})`);
process.exit(failed ? 1 : 0);
