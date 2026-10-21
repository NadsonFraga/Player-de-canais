/**
 * Checks the account flow in the browser (modules/accountPage.js, core/account.js, /api/account/*):
 *   1. a guest's menu offers Entrar ou criar conta, which opens the page
 *   2. Criar conta checks the nickname and the password rules while typing (strength bar, button waits)
 *   3. creating shows the recovery code; Back does not leave it; "Guardei o código" signs in (menu, initial)
 *   4. a reload keeps the session, and the page cannot read the session cookie (HttpOnly)
 *   5. Sair; a wrong password says so without telling which field; the right one signs in
 *   6. Esqueci a senha with the code (typed loosely) saves a new password and shows a new code
 *   7. phones: the page fits; the test account is deleted at the end
 *
 *   node tools/account_check.mjs [--browser=chrome|edge|firefox] [--shots=<folder>] [--base=http://127.0.0.1:8787]
 *
 * Needs the local server (or the staging URL in --base, once its accounts database exists).
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
const CODE_VIEW = "(() => { const v = document.getElementById('account-code-view'); return Boolean(v) && !v.hidden; })()";
const MENU = `({ name: document.getElementById('nav-menu-profile-name').textContent, sub: document.getElementById('nav-menu-profile-sub').textContent,
  signout: !document.getElementById('btn-menu-signout').hidden, enter: !document.getElementById('btn-menu-account').hidden,
  initial: (document.querySelector('#btn-nav-profile .nav-initial') || {}).textContent || '' })`;
const type = (id, text) => `(() => { const i = document.getElementById('${id}'); i.focus(); i.value = ${JSON.stringify(text)}; i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`;
const nickname = `Teste${Date.now().toString(36).slice(-6)}`;
const password = "Cinema2026!";
const newPassword = "Pipoca2027";

const b = await launch(browserName);
try {
  await b.viewport(1366, 800);
  await startApp(b);

  // 1. Guest: the menu offers Entrar ou criar conta, which opens the page
  const guest = await b.evaluate(MENU);
  check("guest menu: Visitante with Entrar ou criar conta", guest.name === "Visitante" && guest.enter && !guest.signout, JSON.stringify(guest));
  await b.evaluate("(document.getElementById('btn-nav-profile').click(), true)");
  await b.evaluate("(document.getElementById('btn-menu-account').click(), true)");
  const opened = await waitFor(b, `${ACCOUNT_OPEN} && document.getElementById('account-title').textContent === 'Entrar'`, 4000);
  check("the account page opens on Entrar", opened !== null);

  // 2. Criar conta: the rules are checked while typing
  await b.evaluate("(document.querySelector('[data-account-view=\"signup\"]').click(), true)");
  await b.evaluate(type("account-nickname", "nad son"));
  const badNick = await b.evaluate("({ hint: document.getElementById('account-nickname-hint').textContent, disabled: document.getElementById('btn-account-submit').disabled, terms: !document.getElementById('account-terms').hidden })");
  check("a nickname with a space is pointed out at once; the button waits", /sem espaços/.test(badNick.hint) && badNick.disabled && badNick.terms, JSON.stringify(badNick));
  await b.evaluate(type("account-nickname", nickname));
  await b.evaluate(type("account-password", "abcdefgh"));
  const weak = await b.evaluate("({ met: [...document.querySelectorAll('#account-rules .is-met')].map(r => r.dataset.rule).join(','), level: document.getElementById('account-strength').dataset.level, disabled: document.getElementById('btn-account-submit').disabled })");
  check("'abcdefgh': length and letter met, the number missing, the button waits", weak.met === "length,letter" && weak.disabled, JSON.stringify(weak));
  await b.evaluate(type("account-password", password));
  const strong = await b.evaluate("({ met: [...document.querySelectorAll('#account-rules .is-met')].length, level: document.getElementById('account-strength').dataset.level, disabled: document.getElementById('btn-account-submit').disabled })");
  check("'Cinema2026!': every rule met, strength above weak, the button works", strong.met === 3 && strong.level !== "fraca" && !strong.disabled, JSON.stringify(strong));
  await b.shot("account-signup.png");

  // The eye: real presses keep it in place inside the field (a focused button once lost its centering and dropped) and each one toggles
  await b.evaluate(`(() => { const eye = document.getElementById('btn-account-eye'); window.__eyeTops = [];
    const sample = () => { if (!window.__eyeTops) return; window.__eyeTops.push(eye.getBoundingClientRect().top - eye.parentElement.getBoundingClientRect().top); requestAnimationFrame(sample); }; sample(); return true; })()`);
  const eyeAt = await b.evaluate("(() => { const r = document.getElementById('btn-account-eye').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()");
  const types = [];
  for (let i = 0; i < 3; i++) {
    await b.press(eyeAt.x, eyeAt.y, 250);
    await sleep(300);
    types.push(await b.evaluate("document.getElementById('account-password').type"));
  }
  const eye = await b.evaluate("(() => { const t = window.__eyeTops; window.__eyeTops = null; return { moved: Math.max(...t) - Math.min(...t), samples: t.length, focus: document.activeElement && document.activeElement.id }; })()");
  check("the eye stays in place in the field while pressed and toggles on every press (focus stays in the password)", eye.moved < 1 && types.join() === "text,password,text" && eye.focus === "account-password", JSON.stringify({ ...eye, types }));
  await b.evaluate("(document.getElementById('btn-account-eye').click(), true)");

  // 3. Create: the recovery code, which the page keeps until "Guardei o código"
  await b.evaluate("(document.getElementById('btn-account-submit').click(), true)");
  const codeShown = await waitFor(b, CODE_VIEW, 15000);
  const code = await b.evaluate("document.getElementById('account-code').textContent");
  check("creating the account shows the recovery code", codeShown !== null && /^[A-Z2-9]{4}(-[A-Z2-9]{4}){3}$/.test(code), code);
  await b.shot("account-code.png");
  await b.evaluate("(history.back(), true)");
  await sleep(600);
  const stays = await b.evaluate(`(${ACCOUNT_OPEN}) && (${CODE_VIEW})`);
  check("Back does not leave the code screen", stays);
  await b.evaluate("(document.getElementById('btn-account-code-done').click(), true)");
  await waitFor(b, `!(${ACCOUNT_OPEN})`, 4000);
  const signed = await b.evaluate(MENU);
  check("signed in: the menu shows the profile, Sair and the initial in the pill", signed.name === nickname && signed.signout && !signed.enter && signed.initial === "T", JSON.stringify(signed));

  // 4. A reload keeps the session (HttpOnly cookie, confirmed by /api/account/me)
  await startApp(b);
  await sleep(1500);
  const cookieHidden = await b.evaluate("!document.cookie.includes('tvz_session')");
  const afterReload = await b.evaluate(MENU);
  check("after a reload the person is still signed in; the page cannot read the session cookie", afterReload.name === nickname && cookieHidden, JSON.stringify({ ...afterReload, cookieHidden }));

  // 5. Sair, then a wrong password and the right one
  await b.evaluate("(document.getElementById('btn-nav-profile').click(), true)");
  await b.evaluate("(document.getElementById('btn-menu-signout').click(), true)");
  const out = await waitFor(b, "document.getElementById('nav-menu-profile-name').textContent === 'Visitante'", 5000);
  check("Sair returns to Visitante", out !== null);
  await b.evaluate("(window.TvzinhaActions.openAccount('signin'), true)");
  await b.evaluate(type("account-nickname", nickname.toLowerCase()));
  await b.evaluate(type("account-password", "Errada2026"));
  await b.evaluate("(document.getElementById('btn-account-submit').click(), true)");
  const wrong = await waitFor(b, "document.getElementById('account-error').textContent === 'Apelido ou senha incorretos.'", 10000);
  check("a wrong password says so (without telling which field)", wrong !== null);
  await b.evaluate(type("account-password", password));
  await b.evaluate("(document.getElementById('btn-account-submit').click(), true)");
  const back = await waitFor(b, `!(${ACCOUNT_OPEN}) && document.getElementById('nav-menu-profile-name').textContent === ${JSON.stringify(nickname)}`, 10000);
  check("the right password signs in (nickname in any case)", back !== null);

  // 6. Esqueci a senha: nickname + code + new password, then a new code
  await b.evaluate("(document.getElementById('btn-nav-profile').click(), document.getElementById('btn-menu-signout').click(), true)");
  await waitFor(b, "document.getElementById('nav-menu-profile-name').textContent === 'Visitante'", 5000);
  await b.evaluate("(window.TvzinhaActions.openAccount('signin'), true)");
  await b.evaluate("(document.getElementById('btn-account-forgot').click(), true)");
  await b.evaluate(type("account-nickname", nickname));
  await b.evaluate(type("account-code-input", code.toLowerCase().replace(/-/g, " ")));
  await b.evaluate(type("account-password", newPassword));
  await b.evaluate("(document.getElementById('btn-account-submit').click(), true)");
  const recovered = await waitFor(b, CODE_VIEW, 15000);
  const code2 = await b.evaluate("document.getElementById('account-code').textContent");
  check("Esqueci a senha with the code (typed loosely) saves the new password and shows a new code", recovered !== null && code2 && code2 !== code, code2);
  await b.evaluate("(document.getElementById('btn-account-code-done').click(), true)");
  await waitFor(b, `!(${ACCOUNT_OPEN})`, 4000);

  // 7. Phones: the page fits
  await b.viewport(390, 844, true);
  await b.evaluate("(document.getElementById('btn-nav-profile').click(), document.getElementById('btn-menu-signout').click(), true)");
  await waitFor(b, "document.getElementById('nav-menu-profile-name').textContent === 'Visitante'", 5000);
  await b.evaluate("(window.TvzinhaActions.openAccount('signup'), true)");
  await sleep(600);
  const phone = await b.evaluate("(() => { const c = document.querySelector('.account-card').getBoundingClientRect(); return { inside: c.left >= 0 && c.right <= innerWidth, side: document.documentElement.scrollWidth > innerWidth }; })()");
  check("phone: the account page fits the screen", phone.inside && !phone.side, JSON.stringify(phone));
  await b.shot("account-phone.png");
  await b.evaluate("(history.back(), true)");

  // Clean up: delete the test account
  await b.evaluate(`fetch('/api/account/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Tvzinha-Request': '1' }, body: JSON.stringify({ nickname: ${JSON.stringify(nickname)}, password: ${JSON.stringify(newPassword)} }) }).then(r => r.status)`);
  const deleted = await b.evaluate(`fetch('/api/account/delete', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Tvzinha-Request': '1' }, body: JSON.stringify({ password: ${JSON.stringify(newPassword)} }) }).then(r => r.status)`);
  check("the test account is deleted", deleted === 200, String(deleted));
} catch (e) {
  check("run without errors", false, e.message);
} finally {
  b.close();
}

const failed = results.filter(ok => !ok).length;
console.log(`\n${results.length - failed}/${results.length} passed (${browserName})`);
process.exit(failed ? 1 : 0);
