/**
 * Checks the profiles in the browser (modules/profilePage.js, core/profileStore.js, /api/account/profiles):
 *   1. a guest with a Coleção and progress creates an account: "Quem está assistindo?" opens, Back does not skip it
 *   2. the first profile asks to bring the device's data; Sim brings it (the Coleção shows it)
 *   3. Trocar in the menu opens the picker, and Back closes it there
 *   4. Adicionar perfil: the name is checked while typing (symbols, a name in use), an icon avatar, created
 *   5. the new profile starts empty ("Começar vazio"); what it saves stays in it; the first profile keeps its own
 *   6. Gerenciar perfis: rename and change the avatar; Excluir perfil removes it and its data on this device
 *   7. more than 3 hours away: the picker asks again on opening the site
 *   8. phones: the picker and the editor fit; "Sair da conta" brings back the guest data
 *
 *   node tools/profile_check.mjs [--browser=chrome|edge|firefox] [--shots=<folder>] [--base=http://127.0.0.1:8787]
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
const COUNTS = "Object.fromEntries([...document.querySelectorAll('#collection-tabs .collection-tab')].map(t => [t.dataset.collectionTab, Number((t.querySelector('.collection-count') || {}).textContent || 0)]))";
const TILES = "[...document.querySelectorAll('#profile-grid .profile-tile[data-profile-id]')].map(t => t.querySelector('.profile-tile-name').textContent)";
const tile = (name) => `(() => { const t = [...document.querySelectorAll('#profile-grid .profile-tile[data-profile-id]')].find(t => t.querySelector('.profile-tile-name').textContent === ${JSON.stringify(name)}); if (t) t.click(); return Boolean(t); })()`;
const click = (id) => `(document.getElementById('${id}').click(), true)`;
const nickname = `Perfil${Date.now().toString(36).slice(-6)}`;
const password = "Cinema2026!";

/** Coleção counts of whoever is in use now. */
async function collection(b) {
  await b.evaluate("(window.TvzinhaActions.openCollection('watchlist'), true)");
  await sleep(500);
  return b.evaluate(COUNTS);
}

async function openSwitch(b) {
  await b.evaluate("(document.getElementById('btn-nav-profile').click(), true)");
  await sleep(200);
  await b.evaluate(click("btn-menu-switch"));
  return waitFor(b, PICKER_OPEN, 4000);
}

const b = await launch(browserName);
try {
  await b.viewport(1366, 800);
  await startApp(b);

  // A guest with one title in Quero assistir and one movie being watched
  await b.evaluate(`(() => { const now = Date.now();
    localStorage.setItem('tvzinha_library_v1', JSON.stringify({ items: { 'movie:603': { kind: 'movie', id: 603, title: 'Matrix', year: '1999', watchlist: { on: true, at: now } } } }));
    localStorage.setItem('tvzinha_watch_progress_v1', JSON.stringify({ 'movie:27205': { id: 27205, title: 'A Origem', mediaType: 'movie', position: 900, duration: 8880, finished: false, timestamp: now } }));
    return true; })()`);
  await startApp(b);
  const guestCounts = await collection(b);

  // 1. Create the account: the code, then "Quem está assistindo?"
  await b.evaluate("(window.TvzinhaActions.openAccount('signup'), true)");
  await b.evaluate(type("account-nickname", nickname));
  await b.evaluate(type("account-password", password));
  await b.evaluate(click("btn-account-submit"));
  await waitFor(b, "(() => { const v = document.getElementById('account-code-view'); return Boolean(v) && !v.hidden; })()", 15000);
  await b.evaluate(click("btn-account-code-done"));
  const picker = await waitFor(b, `(${PICKER_OPEN}) && !(${ACCOUNT_OPEN})`, 6000);
  await sleep(400);
  await b.evaluate("(history.back(), true)");
  await sleep(600);
  const first = await b.evaluate(`({ open: ${PICKER_OPEN}, tiles: ${TILES}, add: Boolean(document.querySelector('#profile-grid .profile-tile-add')) })`);
  check("guest data first: Quero assistir 1, Assistindo 1", guestCounts.watchlist === 1 && guestCounts.watching === 1, JSON.stringify(guestCounts));
  check("after the account: the picker with the first profile and Adicionar perfil; Back keeps it", picker !== null && first.open && first.tiles.join() === nickname && first.add, JSON.stringify(first));
  await b.shot("profiles-picker.png");

  // 2. The first profile on a device with guest data: the question; Sim brings the data
  await b.evaluate(tile(nickname));
  const asked = await waitFor(b, `${SCREEN} === 'guest'`, 3000);
  check("choosing the profile asks to bring this device's data", asked !== null);
  await b.shot("profiles-guest.png");
  await b.evaluate(click("btn-profile-guest-yes"));
  await waitFor(b, `!(${PICKER_OPEN})`, 4000);
  const brought = await collection(b);
  const menu1 = await b.evaluate("document.getElementById('nav-menu-profile-name').textContent");
  check("Sim: the profile's Coleção has the device's data (Quero assistir 1, Assistindo 1)", brought.watchlist === 1 && brought.watching === 1 && menu1 === nickname, JSON.stringify({ ...brought, menu1 }));

  // 3. Trocar opens the picker; there Back closes it
  const switched = await openSwitch(b);
  await sleep(400);
  const arrow = await b.evaluate("!document.getElementById('btn-profile-back').hidden");
  await b.evaluate("(history.back(), true)");
  const closedByBack = await waitFor(b, `!(${PICKER_OPEN})`, 3000);
  check("Trocar opens the picker with the arrow; Back closes it", switched !== null && arrow && closedByBack !== null);

  // 4. Adicionar perfil: live name check, an icon avatar, created
  await openSwitch(b);
  await b.evaluate("(document.querySelector('#profile-grid .profile-tile-add').click(), true)");
  await waitFor(b, `${SCREEN} === 'edit'`, 3000);
  await b.evaluate(type("profile-name", "Ana <b>"));
  const symbols = await b.evaluate("({ hint: document.getElementById('profile-name-hint').textContent, disabled: document.getElementById('btn-profile-save').disabled })");
  await b.evaluate(type("profile-name", nickname.toUpperCase()));
  const taken = await b.evaluate("({ hint: document.getElementById('profile-name-hint').textContent, disabled: document.getElementById('btn-profile-save').disabled })");
  check("the name is checked while typing: symbols and a name in use (any case) are pointed out, the button waits",
    /letras/.test(symbols.hint) && symbols.disabled && /Já existe/.test(taken.hint) && taken.disabled, JSON.stringify({ symbols, taken }));
  await b.evaluate(type("profile-name", "Mãe"));
  await b.evaluate("(document.querySelector('.profile-avatar-tab[data-avatar-set=\"icons\"]').click(), true)");
  await b.evaluate("(document.querySelector('#profile-avatar-grid [data-avatar=\"i03\"]').click(), true)");
  const editor = await b.evaluate("({ preview: document.getElementById('profile-edit-preview').getAttribute('src'), options: document.querySelectorAll('#profile-avatar-grid .profile-avatar-option').length, disabled: document.getElementById('btn-profile-save').disabled })");
  await b.shot("profiles-editor.png");
  await b.evaluate(click("btn-profile-save"));
  const created = await waitFor(b, `${SCREEN} === 'pick' && ${TILES}.length === 2`, 8000);
  const tiles2 = await b.evaluate(TILES);
  check("Adicionar perfil: the icons, the preview follows the choice, 'Mãe' created next to the first",
    editor.options === 8 && /i03\.svg$/.test(editor.preview) && !editor.disabled && created !== null && tiles2.join() === `${nickname},Mãe`, JSON.stringify({ ...editor, tiles2 }));

  // 5. The new profile starts empty; what it saves stays in it
  await b.evaluate(tile("Mãe"));
  await waitFor(b, `${SCREEN} === 'guest'`, 3000);
  await b.evaluate(click("btn-profile-guest-no"));
  await waitFor(b, `!(${PICKER_OPEN})`, 4000);
  const empty = await collection(b);
  const pill = await b.evaluate("(() => { const i = document.querySelector('#btn-nav-profile .nav-avatar'); return i ? i.getAttribute('src') : ''; })()");
  check("'Começar vazio': the new profile's Coleção is empty and its avatar is in the pill", empty.watchlist === 0 && empty.watching === 0 && /i03\.svg$/.test(pill), JSON.stringify({ ...empty, pill }));
  // The page's own library module (same versioned address as main.js uses)
  const libraryUrl = await b.evaluate("[...document.querySelectorAll('script[type=module]')].map(s => s.src).find(s => s.includes('main.js')).replace('main.js', 'core/library.js')");
  await b.evaluate(`import(${JSON.stringify(libraryUrl)}).then(m => (m.setWatchlist('movie', { id: 155, title: 'Batman: O Cavaleiro das Trevas' }, true), true))`);
  const own = await collection(b);
  await openSwitch(b);
  await b.evaluate(tile(nickname));
  await waitFor(b, `!(${PICKER_OPEN})`, 4000);
  const back1 = await collection(b);
  check("each profile keeps its own data: Mãe has her title; the first profile still has its own only",
    own.watchlist === 1 && back1.watchlist === 1 && back1.watching === 1, JSON.stringify({ own, back1 }));

  // 6. Gerenciar perfis: rename and change the avatar, then remove
  await openSwitch(b);
  await b.evaluate(click("btn-profile-manage"));
  const managing = await b.evaluate("document.getElementById('profile-page').classList.contains('is-managing') && document.getElementById('profile-title').textContent");
  await b.evaluate(tile("Mãe"));
  await waitFor(b, `${SCREEN} === 'edit'`, 3000);
  await b.evaluate(type("profile-name", "Mamãe"));
  await b.evaluate("(document.querySelector('.profile-avatar-tab[data-avatar-set=\"faces\"]').click(), true)");
  await b.evaluate("(document.querySelector('#profile-avatar-grid [data-avatar=\"n05\"]').click(), true)");
  await b.evaluate(click("btn-profile-save"));
  const renamed = await waitFor(b, `${SCREEN} === 'pick' && ${TILES}.includes('Mamãe')`, 8000);
  const renamedSrc = await b.evaluate("[...document.querySelectorAll('#profile-grid .profile-tile[data-profile-id] img')].map(i => i.getAttribute('src')).join()");
  check("Gerenciar perfis: rename and new avatar saved", managing === "Gerenciar perfis" && renamed !== null && /n05\.svg/.test(renamedSrc), JSON.stringify({ managing, renamedSrc }));
  const mamaeId = await b.evaluate("[...document.querySelectorAll('#profile-grid .profile-tile[data-profile-id]')].find(t => t.textContent.includes('Mamãe')).dataset.profileId");
  await b.evaluate(tile("Mamãe"));
  await waitFor(b, `${SCREEN} === 'edit'`, 3000);
  await b.evaluate(click("btn-profile-remove"));
  await waitFor(b, `${SCREEN} === 'confirm'`, 3000);
  await b.evaluate("(history.back(), true)");
  const backToEdit = await waitFor(b, `${SCREEN} === 'edit' && (${PICKER_OPEN})`, 3000);
  await b.evaluate(click("btn-profile-remove"));
  await waitFor(b, `${SCREEN} === 'confirm'`, 3000);
  await b.evaluate(click("btn-profile-confirm-remove"));
  const removed = await waitFor(b, `${SCREEN} === 'pick' && ${TILES}.length === 1`, 8000);
  const leftovers = await b.evaluate(`Object.keys(localStorage).filter(k => k.endsWith(':' + ${JSON.stringify(mamaeId)})).length`);
  check("Excluir perfil: Back from the confirmation returns to the editor; removing leaves one profile and no data of it here",
    backToEdit !== null && removed !== null && leftovers === 0, JSON.stringify({ leftovers }));
  await b.evaluate(click("btn-profile-manage"));
  await b.evaluate("(history.back(), true)");
  await waitFor(b, `!(${PICKER_OPEN})`, 3000);

  // 7. More than 3 hours away: the picker on opening the site (no question again)
  await b.evaluate("(() => { const p = JSON.parse(localStorage.getItem('tvzinha_profile_v1')); p.lastSeen = Date.now() - 4 * 3600 * 1000; localStorage.setItem('tvzinha_profile_v1', JSON.stringify(p)); return true; })()");
  await startApp(b);
  const again = await waitFor(b, PICKER_OPEN, 5000);
  await b.evaluate(tile(nickname));
  const noQuestion = await waitFor(b, `!(${PICKER_OPEN})`, 4000);
  await b.evaluate("(() => { const p = JSON.parse(localStorage.getItem('tvzinha_profile_v1')); p.lastSeen = Date.now() - 30 * 60 * 1000; localStorage.setItem('tvzinha_profile_v1', JSON.stringify(p)); return true; })()");
  await startApp(b);
  await sleep(1200);
  const within = await b.evaluate(PICKER_OPEN);
  check("4 hours away: the picker asks again (and not the data question); 30 minutes away: it does not", again !== null && noQuestion !== null && !within);

  // 8. Phones: the picker and the editor fit; Sair da conta from the picker brings back the guest data
  await b.viewport(390, 844, true);
  await openSwitch(b);
  await b.evaluate("(document.querySelector('#profile-grid .profile-tile-add').click(), true)");
  await waitFor(b, `${SCREEN} === 'edit'`, 3000);
  const fits = await b.evaluate("(() => { const c = document.querySelector('#profile-edit-view .profile-card').getBoundingClientRect(); return { inside: c.left >= 0 && c.right <= innerWidth, side: document.documentElement.scrollWidth > innerWidth }; })()");
  await b.shot("profiles-phone-editor.png");
  await b.evaluate("(history.back(), true)");
  await waitFor(b, `${SCREEN} === 'pick'`, 3000);
  const pickFits = await b.evaluate("(() => { const tiles = [...document.querySelectorAll('#profile-grid .profile-tile')].map(t => t.getBoundingClientRect()); return tiles.every(r => r.left >= 0 && r.right <= innerWidth); })()");
  await b.shot("profiles-phone-picker.png");
  check("phone: the picker and the editor fit the screen", fits.inside && !fits.side && pickFits, JSON.stringify({ ...fits, pickFits }));
  await b.evaluate(click("btn-profile-signout"));
  await waitFor(b, `!(${PICKER_OPEN}) && document.getElementById('nav-menu-profile-name').textContent === 'Visitante'`, 5000);
  const guestAgain = await collection(b);
  check("Sair da conta: Visitante with the guest data as it was", guestAgain.watchlist === 1 && guestAgain.watching === 1, JSON.stringify(guestAgain));

  // Clean up: delete the test account
  await b.evaluate(`fetch('/api/account/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Tvzinha-Request': '1' }, body: JSON.stringify({ nickname: ${JSON.stringify(nickname)}, password: ${JSON.stringify(password)} }) }).then(r => r.status)`);
  const deleted = await b.evaluate(`fetch('/api/account/delete', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Tvzinha-Request': '1' }, body: JSON.stringify({ password: ${JSON.stringify(password)} }) }).then(r => r.status)`);
  check("the test account is deleted", deleted === 200, String(deleted));
} catch (e) {
  check("run without errors", false, e.message);
} finally {
  b.close();
}

const failed = results.filter(ok => !ok).length;
console.log(`\n${results.length - failed}/${results.length} passed (${browserName})`);
process.exit(failed ? 1 : 0);
