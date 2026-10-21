/**
 * Checks Configurações in the browser (modules/settingsPage.js):
 *   1. guests: opened from the menu; Conta (Entrar ou criar conta), Player and Sobre only
 *   2. a player choice is saved and kept after a reload; Privacidade tells about the account
 *   3. signed in: Trocar senha (a wrong current password is refused; the old password stops working)
 *   4. a new recovery code: shown once, kept on Back, the old code is refused
 *   5. Sincronizar agora; Gerenciar perfis opens the profile page over Configurações and Back returns
 *   6. phones: the list of topics, a topic in full, Back to the list, Back closes
 *   7. Apagar conta: Cancelar keeps it; confirmed, the account is gone, its copies leave the device
 *
 *   node tools/settings_check.mjs [--browser=chrome|edge|firefox] [--shots=<folder>] [--base=http://127.0.0.1:8787]
 *
 * Needs the local server (or the staging URL in --base). The test account is deleted by the test itself.
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
const SETTINGS_OPEN = visible("settings-page");
const LEGAL_OPEN = visible("legal-modal");
const type = (id, text) => `(() => { const i = document.getElementById('${id}'); if (!i) throw new Error('missing ${id} on ' + location.href + ' account=' + !document.getElementById('account-page').classList.contains('hidden')); i.focus(); i.value = ${JSON.stringify(text)}; i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`;
const click = (id) => `(document.getElementById('${id}').click(), true)`;
const act = (name) => `(() => { const b = document.querySelector('#settings-panel [data-settings-action="${name}"]'); if (b) b.click(); return Boolean(b); })()`;
const section = (name) => `(document.querySelector('#settings-nav [data-settings-section="${name}"]').click(), true)`;
const segment = (pref, value) => `(() => { const b = [...document.querySelectorAll('#settings-panel .settings-segment[data-pref="${pref}"]')].find(s => s.dataset.value === ${JSON.stringify(JSON.stringify(value))}); if (b) b.click(); return Boolean(b); })()`;
const NAV = "[...document.querySelectorAll('#settings-nav .settings-nav-item')].filter(i => !i.hidden).map(i => i.dataset.settingsSection).join()";
const ERROR = "(document.querySelector('#settings-panel .settings-error') || {}).textContent || ''";
const nickname = `Conf${Date.now().toString(36).slice(-6)}`;
const password = "Cinema2026!";
const newPassword = "Pipoca2027x";
const post = (path, body) => `fetch('/api/account/${path}', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Tvzinha-Request': '1' }, body: JSON.stringify(${JSON.stringify(body)}) }).then(r => r.status)`;
const mod = (path) => `[...document.querySelectorAll('script[type=module]')].map(s => s.src).find(s => s.includes('main.js')).replace('main.js', '${path}')`;

async function openSettings(b) {
  await b.evaluate("(document.getElementById('btn-nav-profile').click(), true)");
  await sleep(200);
  await b.evaluate(click("btn-menu-settings"));
  return waitFor(b, SETTINGS_OPEN, 4000);
}

const b = await launch(browserName);
try {
  await b.viewport(1366, 800);
  await startApp(b);

  // 1. Guests
  const opened = await openSettings(b);
  const guest = await b.evaluate(`({ nav: ${NAV}, hero: Boolean(document.querySelector('#settings-panel .settings-hero')), title: document.querySelector('#settings-panel .settings-panel-title').textContent })`);
  check("guests: Configurações opens from the menu with Conta (Entrar ou criar conta), Player and Sobre", opened !== null && guest.nav === "account,player,about" && guest.hero && guest.title === "Conta", JSON.stringify(guest));
  await b.shot("settings-guest.png");

  // 2. A player choice is kept; Privacidade tells about the account
  await b.evaluate(section("player"));
  await b.evaluate(segment("quality", 720));
  await b.evaluate(segment("subtitle", "en"));
  await b.shot("settings-player.png");
  await startApp(b);
  await openSettings(b);
  await b.evaluate(section("player"));
  const kept = await b.evaluate("[...document.querySelectorAll('#settings-panel .settings-segment.active')].map(s => s.dataset.pref + '=' + s.dataset.value).join(' ')");
  const prefs = await b.evaluate(`import(${mod("core/playerPrefs.js")}).then(m => m.getPlayerPrefs())`);
  check("a player choice is saved and kept after a reload (720p, English subtitles)", /quality=720/.test(kept) && /subtitle="en"/.test(kept) && prefs.quality === 720 && prefs.subtitle === "en", JSON.stringify({ kept, quality: prefs.quality, subtitle: prefs.subtitle }));
  await b.evaluate(segment("quality", "auto"));
  await b.evaluate(section("about"));
  await b.evaluate("(document.querySelector('#settings-panel [data-legal=\"privacy\"]').click(), true)");
  await waitFor(b, LEGAL_OPEN, 3000);
  const privacy = await b.evaluate("document.getElementById('legal-modal-body').textContent");
  await b.evaluate("(history.back(), true)");
  const legalClosed = await waitFor(b, `!(${LEGAL_OPEN}) && (${SETTINGS_OPEN})`, 3000);
  check("Privacidade tells what the account keeps and how to delete it; Back returns to Configurações",
    /apelido/.test(privacy) && /Apagar conta/.test(privacy) && /não guardamos seu endereço IP/i.test(privacy) && legalClosed !== null);
  await b.evaluate("(history.back(), true)");
  await waitFor(b, `!(${SETTINGS_OPEN})`, 3000);

  // 3. Signed in: Trocar senha
  await b.evaluate("(window.TvzinhaActions.openAccount('signup'), true)");
  await b.evaluate(type("account-nickname", nickname));
  await b.evaluate(type("account-password", password));
  await b.evaluate(click("btn-account-submit"));
  await waitFor(b, "(() => { const v = document.getElementById('account-code-view'); return Boolean(v) && !v.hidden; })()", 15000);
  const firstCode = await b.evaluate("document.getElementById('account-code').textContent");
  await b.evaluate(click("btn-account-code-done"));
  await waitFor(b, `(${PICKER_OPEN}) && document.querySelectorAll('#profile-grid .profile-tile[data-profile-id]').length > 0`, 8000);
  await b.evaluate("(document.querySelector('#profile-grid .profile-tile[data-profile-id]').click(), true)");
  await waitFor(b, `!(${PICKER_OPEN})`, 5000);
  await openSettings(b);
  const signedNav = await b.evaluate(NAV);
  const identity = await b.evaluate("(document.querySelector('#settings-panel .settings-identity-name') || {}).textContent");
  await b.shot("settings-account.png");
  await b.evaluate(act("open-password"));
  await b.evaluate(type("settings-current-password", "Errada2026"));
  await b.evaluate(type("settings-new-password", newPassword));
  const ticked = await b.evaluate("document.querySelectorAll('#settings-panel .settings-rules .is-met').length");
  // The saved password is never filled in for a confirmation (an unlocked computer must not change the account)
  const noFill = await b.evaluate("['settings-current-password'].every(id => document.getElementById(id).autocomplete === 'new-password')");
  await b.shot("settings-password.png");
  await b.evaluate(act("save-password"));
  const wrong = await waitFor(b, `${ERROR} === 'Senha incorreta.'`, 8000);
  await b.evaluate(type("settings-current-password", password));
  await b.evaluate(act("save-password"));
  const saved = await waitFor(b, "!document.querySelector('#settings-panel .settings-form')", 8000);
  const oldLogin = await b.evaluate(post("login", { nickname, password }));
  const newLogin = await b.evaluate(post("login", { nickname, password: newPassword }));
  check("signed in: every topic, the nickname; the confirmation field is not filled by the browser; Trocar senha refuses a wrong current password, then the new one replaces the old",
    signedNav === "account,profiles,player,sync,about" && identity === nickname && ticked === 3 && noFill && wrong !== null && saved !== null && oldLogin === 401 && newLogin === 200,
    JSON.stringify({ signedNav, identity, ticked, oldLogin, newLogin }));

  // 4. A new recovery code
  await b.evaluate(act("open-code"));
  const codeNoFill = await b.evaluate("document.getElementById('settings-code-password').autocomplete === 'new-password'");
  await b.evaluate(type("settings-code-password", newPassword));
  await b.evaluate(act("make-code"));
  const shown = await waitFor(b, "/^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/.test((document.getElementById('settings-code') || {}).textContent || '')", 10000);
  await b.shot("settings-code.png");
  await b.evaluate("(history.back(), true)");
  await sleep(600);
  const stays = await b.evaluate(`(${SETTINGS_OPEN}) && Boolean(document.getElementById('settings-code'))`);
  await b.evaluate(act("code-done"));
  const oldCode = await b.evaluate(post("recover", { nickname, recoveryCode: firstCode, newPassword: "Outra2028" }));
  check("a new recovery code is shown once, stays on Back, and the old code is refused", codeNoFill && shown !== null && stays && oldCode === 401, JSON.stringify({ stays, oldCode }));

  // 5. Sincronizar agora; Gerenciar perfis
  await b.evaluate(section("sync"));
  await b.evaluate(act("sync-now"));
  const synced = await waitFor(b, "/Sincronizado agora/.test(document.querySelector('#settings-panel .settings-row-title').textContent)", 10000);
  await b.shot("settings-sync.png");
  await b.evaluate(section("profiles"));
  await b.evaluate(act("manage-profiles"));
  const managing = await waitFor(b, `(${PICKER_OPEN}) && document.getElementById('profile-page').classList.contains('is-managing')`, 4000);
  await b.evaluate("(history.back(), true)");
  await sleep(400);
  await b.evaluate("(history.back(), true)");
  const backToSettings = await waitFor(b, `!(${PICKER_OPEN}) && (${SETTINGS_OPEN})`, 4000);
  check("Sincronizar agora updates the line; Gerenciar perfis opens over Configurações and Back returns to it", synced !== null && managing !== null && backToSettings !== null);
  await b.evaluate("(history.back(), true)");
  await waitFor(b, `!(${SETTINGS_OPEN})`, 3000);

  // 6. Phones
  await b.viewport(390, 844, true);
  await openSettings(b);
  const list = await b.evaluate("({ nav: getComputedStyle(document.getElementById('settings-nav')).display !== 'none', panel: getComputedStyle(document.getElementById('settings-panel')).display !== 'none' })");
  await b.shot("settings-phone-list.png");
  await b.evaluate(section("player"));
  await sleep(300);
  const topic = await b.evaluate("({ nav: getComputedStyle(document.getElementById('settings-nav')).display !== 'none', panel: getComputedStyle(document.getElementById('settings-panel')).display !== 'none', title: document.getElementById('settings-title').textContent, side: document.documentElement.scrollWidth > innerWidth })");
  await b.shot("settings-phone-player.png");
  await b.evaluate("(history.back(), true)");
  const toList = await waitFor(b, `(${SETTINGS_OPEN}) && getComputedStyle(document.getElementById('settings-nav')).display !== 'none'`, 3000);
  await b.evaluate("(history.back(), true)");
  const closed = await waitFor(b, `!(${SETTINGS_OPEN})`, 3000);
  check("phones: the list first, a topic in full (its name on top), Back to the list, Back closes",
    list.nav && !list.panel && !topic.nav && topic.panel && topic.title === "Player" && !topic.side && toList !== null && closed !== null, JSON.stringify({ list, topic }));
  await b.viewport(1366, 800);

  // 7. Apagar conta
  const profileId = await b.evaluate("JSON.parse(localStorage.getItem('tvzinha_profile_v1')).profileId");
  await openSettings(b);
  await b.evaluate(act("open-delete"));
  const deleteNoFill = await b.evaluate("document.getElementById('settings-delete-password').autocomplete === 'new-password'");
  await b.evaluate(type("settings-delete-password", newPassword));
  await b.shot("settings-delete.png");
  await b.evaluate(act("delete-account"));
  const asked = await waitFor(b, visible("confirm-dialog"), 4000);
  await b.evaluate(click("btn-confirm-dialog-no"));
  await sleep(500);
  const kept2 = await b.evaluate("document.getElementById('nav-menu-profile-name').textContent");
  await b.evaluate(act("delete-account"));
  await waitFor(b, visible("confirm-dialog"), 4000);
  await b.evaluate(click("btn-confirm-dialog-yes"));
  const gone = await waitFor(b, `!(${SETTINGS_OPEN}) && document.getElementById('nav-menu-profile-name').textContent === 'Visitante'`, 10000);
  const leftovers = await b.evaluate(`Object.keys(localStorage).filter(k => k.endsWith(':' + ${JSON.stringify(profileId)})).length`);
  const loginAfter = await b.evaluate(post("login", { nickname, password: newPassword }));
  check("Apagar conta: Cancelar keeps it; confirmed, the account is gone and its copies leave the device",
    deleteNoFill && asked !== null && kept2 !== "Visitante" && gone !== null && leftovers === 0 && loginAfter === 401, JSON.stringify({ kept2, leftovers, loginAfter }));
} catch (e) {
  check("run without errors", false, e.message);
} finally {
  b.close();
}

const failed = results.filter(ok => !ok).length;
console.log(`\n${results.length - failed}/${results.length} passed (${browserName})`);
process.exit(failed ? 1 : 0);
