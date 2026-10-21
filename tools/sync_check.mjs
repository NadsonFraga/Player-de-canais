/**
 * Checks the account sync with two separate browsers on the same account (core/sync.js, /api/sync):
 *   1. A (with guest data, kept apart: "Começar vazio") saves a title, a rating, a channel favorite and a movie's time
 *   2. B signs in, picks the profile and receives all of it (Coleção counts, the favorite, the time)
 *   3. B takes the title out of Quero assistir; A receives the removal
 *   4. B offline: a change waits ("Sem conexão" in the menu) and arrives once the connection is back
 *   5. Sair on A with an unsent change asks first (Cancelar keeps the account); then Sair removes the account's copies
 *      from the device and the guest data stays
 *
 *   node tools/sync_check.mjs [--browser=chrome|edge|firefox] [--base=http://127.0.0.1:8787]
 *
 * Needs the local server (or the staging URL in --base). The test account is deleted at the end.
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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
  const profile = mkdtempSync(join(tmpdir(), `tvz-account-${name}-`));
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

const ACCOUNT_OPEN = visible("account-page");
const PICKER_OPEN = visible("profile-page");
const SCREEN = "document.getElementById('profile-page').dataset.screen";
const type = (id, text) => `(() => { const i = document.getElementById('${id}'); i.focus(); i.value = ${JSON.stringify(text)}; i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`;
const click = (id) => `(document.getElementById('${id}').click(), true)`;
const COUNTS = "Object.fromEntries([...document.querySelectorAll('#collection-tabs .collection-tab')].map(t => [t.dataset.collectionTab, Number((t.querySelector('.collection-count') || {}).textContent || 0)]))";
const nickname = `Sync${Date.now().toString(36).slice(-6)}`;
const password = "Cinema2026!";
const CHANNEL = "Teste:Canal Sincronizado";
// The page's own modules (same versioned address as main.js, so the same instances)
const mod = (path) => `[...document.querySelectorAll('script[type=module]')].map(s => s.src).find(s => s.includes('main.js')).replace('main.js', '${path}')`;
const withModule = (path, body) => `import(${mod(path)}).then(m => { ${body} })`;
const OFFLINE = "(() => { window.__realFetch = window.__realFetch || window.fetch; window.fetch = (url, options) => String(url).includes('/api/sync') ? Promise.reject(new TypeError('offline')) : window.__realFetch(url, options); return true; })()";
const ONLINE = "(() => { if (window.__realFetch) window.fetch = window.__realFetch; window.dispatchEvent(new Event('online')); return true; })()";

async function collection(b) {
  await b.evaluate("(window.TvzinhaActions.openCollection('watchlist'), true)");
  await sleep(500);
  return b.evaluate(COUNTS);
}

/** Entrar (or Criar conta), then the first profile; `guestAnswer`: 'yes' | 'no' when the data question shows. */
async function signIn(b, view, guestAnswer = "no") {
  await b.evaluate(`(window.TvzinhaActions.openAccount('${view}'), true)`);
  await b.evaluate(type("account-nickname", nickname));
  await b.evaluate(type("account-password", password));
  await b.evaluate(click("btn-account-submit"));
  if (view === "signup") {
    await waitFor(b, "(() => { const v = document.getElementById('account-code-view'); return Boolean(v) && !v.hidden; })()", 15000);
    await b.evaluate(click("btn-account-code-done"));
  }
  await waitFor(b, `(${PICKER_OPEN}) && !(${ACCOUNT_OPEN}) && document.querySelectorAll('#profile-grid .profile-tile[data-profile-id]').length > 0`, 10000);
  await b.evaluate("(document.querySelector('#profile-grid .profile-tile[data-profile-id]').click(), true)");
  if (await waitFor(b, `${SCREEN} === 'guest'`, 1500) !== null) await b.evaluate(click(guestAnswer === "yes" ? "btn-profile-guest-yes" : "btn-profile-guest-no"));
  return waitFor(b, `!(${PICKER_OPEN})`, 5000);
}

const syncNow = (b) => b.evaluate("window.TvzinhaActions.syncNow()");
const menuSync = (b) => b.evaluate("(() => { const l = document.getElementById('nav-menu-sync'); return l.hidden ? '' : l.textContent; })()");
const favoriteOn = (b) => b.evaluate(`${withModule("core/state.js", `return m.store.getState().favorites.has(${JSON.stringify(CHANNEL)});`)}`);

const a = await launch(browserName);
const b = await launch(browserName);
try {
  await a.viewport(1366, 800);
  await b.viewport(1366, 800);
  await startApp(a);
  await startApp(b);

  // A has guest data of its own, which stays apart
  await a.evaluate("(localStorage.setItem('tvzinha_library_v1', JSON.stringify({ items: { 'movie:13': { kind: 'movie', id: 13, title: 'Forrest Gump', watchlist: { on: true, at: Date.now() } } } })), true)");
  await startApp(a);
  const created = await signIn(a, "signup", "no");

  // 1. A saves a title, a rating, a favorite and a movie's time, then syncs
  await a.evaluate(withModule("core/library.js", "m.setWatchlist('movie', { id: 603, title: 'Matrix', release_date: '1999-03-31' }, true); m.setRating('movie', { id: 155, title: 'Batman: O Cavaleiro das Trevas' }, 9); return true;"));
  await a.evaluate(withModule("core/state.js", `m.store.toggleFavorite(${JSON.stringify(CHANNEL)}); return true;`));
  await a.evaluate(withModule("core/watchProgress.js", "m.recordMovieOpened({ id: 27205, title: 'A Origem' }); m.saveMovieProgress({ id: 27205 }, 'principal', { position: 1200, duration: 8880, inEnding: false }); return true;"));
  const sentA = await syncNow(a);
  const lineA = await menuSync(a);
  const countsA = await collection(a);
  check("A: account created, its profile empty (guest data kept apart), four kinds of change sent",
    created !== null && sentA === true && countsA.watchlist === 1 && countsA.rated === 1 && countsA.watching === 1 && lineA === "Sincronizado agora",
    JSON.stringify({ sentA, lineA, countsA }));

  // 2. B signs in and receives everything
  const signedB = await signIn(b, "signin");
  const arrived = await waitFor(b, `(() => { try { const p = JSON.parse(localStorage.getItem('tvzinha_profile_v1')).profileId; const l = JSON.parse(localStorage.getItem('tvzinha_library_v1:' + p) || '{}'); return Boolean(l.items && l.items['movie:603']); } catch (e) { return false; } })()`, 10000);
  const countsB = await collection(b);
  const favB = await favoriteOn(b);
  const timeB = await b.evaluate(withModule("core/watchProgress.js", "return (m.getMovieProgress(27205) || {}).position || 0;"));
  check("B: signing in brings A's title, rating, favorite and movie time",
    signedB !== null && arrived !== null && countsB.watchlist === 1 && countsB.rated === 1 && countsB.watching === 1 && favB === true && timeB === 1200,
    JSON.stringify({ countsB, favB, timeB }));

  // 3. B takes the title out; A receives the removal
  await b.evaluate(withModule("core/library.js", "m.setWatchlist('movie', { id: 603, title: 'Matrix' }, false); return true;"));
  const sentB = await syncNow(b);
  await sleep(1200);
  await syncNow(a);
  const afterRemoval = await collection(a);
  check("B removes the title from Quero assistir; A receives the removal", sentB === true && afterRemoval.watchlist === 0 && afterRemoval.rated === 1, JSON.stringify(afterRemoval));

  // 4. B offline: the change waits, then arrives
  await b.evaluate(OFFLINE);
  await b.evaluate(withModule("core/library.js", "m.setRating('movie', { id: 550, title: 'Clube da Luta' }, 7); return true;"));
  const offlineSent = await syncNow(b);
  const offlineLine = await menuSync(b);
  await b.evaluate(ONLINE);
  const resent = await waitFor(b, "document.getElementById('nav-menu-sync').textContent === 'Sincronizado agora'", 8000);
  await sleep(1200);
  await syncNow(a);
  const afterOffline = await collection(a);
  check("B offline: the change waits ('Sem conexão' in the menu) and arrives when the connection is back",
    offlineSent === false && /Sem conexão/.test(offlineLine) && resent !== null && afterOffline.rated === 2, JSON.stringify({ offlineSent, offlineLine, afterOffline }));

  // 5. Sair on A: an unsent change asks first; then the account's copies leave the device, the guest data stays
  const profileA = await a.evaluate("JSON.parse(localStorage.getItem('tvzinha_profile_v1')).profileId");
  await a.evaluate(OFFLINE);
  await a.evaluate(withModule("core/library.js", "m.setWatched('movie', { id: 680, title: 'Pulp Fiction' }, true); return true;"));
  await a.evaluate("(document.getElementById('btn-nav-profile').click(), document.getElementById('btn-menu-signout').click(), true)");
  const asked = await waitFor(a, "(() => { const d = document.getElementById('confirm-dialog'); return Boolean(d) && !d.classList.contains('hidden'); })()", 9000);
  const askedTitle = await a.evaluate("(document.getElementById('confirm-dialog-title') || {}).textContent || ''");
  await a.evaluate(click("btn-confirm-dialog-no"));
  await sleep(500);
  const stillIn = await a.evaluate("document.getElementById('nav-menu-profile-name').textContent");
  await a.evaluate(ONLINE);
  await sleep(1500);
  await a.evaluate("(document.getElementById('btn-nav-profile').click(), document.getElementById('btn-menu-signout').click(), true)");
  const out = await waitFor(a, "document.getElementById('nav-menu-profile-name').textContent === 'Visitante'", 10000);
  const leftovers = await a.evaluate(`Object.keys(localStorage).filter(k => k.endsWith(':' + ${JSON.stringify(profileA)})).length`);
  const guestA = await collection(a);
  check("Sair with an unsent change asks first (Cancelar keeps the account)", asked !== null && /não foram enviadas/.test(askedTitle) && stillIn === nickname, JSON.stringify({ askedTitle, stillIn }));
  check("Sair sends it, removes the account's copies from the device, and the guest data stays", out !== null && leftovers === 0 && guestA.watchlist === 1, JSON.stringify({ leftovers, guestA }));
  await sleep(1200);
  await syncNow(b);
  const watchedB = await collection(b);
  check("what A sent while leaving reached B", watchedB.watched === 1, JSON.stringify(watchedB));

  // Clean up: delete the test account
  const deleted = await b.evaluate(`fetch('/api/account/delete', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Tvzinha-Request': '1' }, body: JSON.stringify({ password: ${JSON.stringify(password)} }) }).then(r => r.status)`);
  check("the test account is deleted", deleted === 200, String(deleted));
} catch (e) {
  check("run without errors", false, e.message);
} finally {
  a.close();
  b.close();
}

const failed = results.filter(ok => !ok).length;
console.log(`\n${results.length - failed}/${results.length} passed (${browserName})`);
process.exit(failed ? 1 : 0);
