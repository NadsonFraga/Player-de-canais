/**
 * Checks that hls.js and Artplayer load on demand (B11): the app starts without waiting for jsDelivr, a player opened
 * before the libraries arrive waits for them (with a "slow connection" note, never cut by a timer), a reset drops a
 * waiting mount, and a CDN failure shows "Não foi possível carregar o player" with a working retry, in the movie/series
 * player and in live TV.
 *
 *   node tools/player_libs_check.mjs [--browser=chrome|edge|firefox] [--only=1,5]   (chrome by default, all scenarios)
 *
 * Needs `python tools/local_server.py` on 127.0.0.1:8787. jsDelivr requests are held or failed by the browser
 * automation (CDP Fetch / WebDriver BiDi network intercepts); every scenario uses a fresh profile, so nothing is cached.
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
const ONLY = ((process.argv.find(a => a.startsWith("--only=")) || "").split("=")[1] || "").split(",").filter(Boolean);
const runs = (n) => !ONLY.length || ONLY.includes(String(n));
const VERSION = readFileSync(new URL("../index.html", import.meta.url), "utf8").match(/main\.js\?v=([^"]+)/)[1];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = "") => { results.push(ok); console.log(`${ok ? "OK  " : "FAIL"} ${name}${detail ? " " + detail : ""}`); };

// Collects page errors from the first line of every document
const ERROR_TRAP = "window.__errs = []; addEventListener('error', e => window.__errs.push(String(e.message))); addEventListener('unhandledrejection', e => window.__errs.push(String(e.reason && e.reason.message || e.reason)));";

let launchCount = 0;

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

function rpc(ws, isBidi, onEvent) {
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      (isBidi ? msg.type === "error" : msg.error) ? rej(new Error(JSON.stringify(msg.error || msg.message))) : res(msg.result);
    } else if (msg.method) {
      onEvent(msg.method, msg.params);
    }
  };
  return (method, params = {}) => new Promise((res, rej) => {
    const mid = ++id;
    pending.set(mid, { res, rej });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}

/**
 * Fresh muted browser with the jsDelivr requests under control: cdn('pass' | 'hold' | 'fail'); cdn('pass') also
 * releases the held ones. Returns { evaluate(expr), navigate(url), cdn(mode), close() }.
 */
async function launch(name, initialMode) {
  const profile = tempDir(join(tmpdir(), `tvz-libs-${name}-`));
  // A new port per browser: a browser being closed must never answer for the next one
  const port = 9600 + (launchCount++ % 8) * 10 + Math.floor(Math.random() * 10);
  let mode = initialMode;
  const held = [];
  let release;

  if (name === "firefox") {
    writeFileSync(join(profile, "user.js"), 'user_pref("media.volume_scale", "0.0");\nuser_pref("media.autoplay.default", 0);\n');
    const proc = spawn(FIREFOX, ["--headless", "--remote-debugging-port", String(port), "--profile", profile, "--no-remote", "--width=1280", "--height=800"], { stdio: "ignore" });
    const ws = await connectWs(`ws://127.0.0.1:${port}/session`);
    let send;
    const onEvent = (method, params) => {
      if (method !== "network.beforeRequestSent" || !params.isBlocked) return;
      const request = params.request.request;
      if (mode === "fail") send("network.failRequest", { request }).catch(() => {});
      else if (mode === "hold") held.push(request);
      else send("network.continueRequest", { request }).catch(() => {});
    };
    send = rpc(ws, true, onEvent);
    release = () => { while (held.length) send("network.continueRequest", { request: held.shift() }).catch(() => {}); };
    await send("session.new", { capabilities: {} });
    const context = (await send("browsingContext.getTree", {})).contexts[0].context;
    await send("session.subscribe", { events: ["network.beforeRequestSent"] });
    await send("network.addIntercept", { phases: ["beforeRequestSent"], urlPatterns: [{ type: "pattern", hostname: "cdn.jsdelivr.net" }] });
    await send("script.addPreloadScript", { functionDeclaration: `() => { ${ERROR_TRAP} }` });
    return {
      navigate: (url) => send("browsingContext.navigate", { context, url, wait: "none" }),
      evaluate: async (expr) => {
        const r = await send("script.evaluate", { expression: `(async () => JSON.stringify(await (${expr})))()`, target: { context }, awaitPromise: true, resultOwnership: "none", userActivation: true });
        if (r.type === "exception") throw new Error(r.exceptionDetails.text);
        return JSON.parse(r.result.value ?? "null");
      },
      cdn: (m) => { mode = m; if (m === "pass") release(); },
      close: () => { try { ws.close(); } catch {} try { spawnSync("taskkill", ["/PID", String(proc.pid), "/T", "/F"], { stdio: "ignore" }); } catch {} },
    };
  }

  const proc = spawn(name === "edge" ? EDGE : CHROME, ["--headless=new", `--remote-debugging-port=${port}`, "--remote-allow-origins=*", `--user-data-dir=${profile}`,
    "--no-first-run", "--mute-audio", "--autoplay-policy=no-user-gesture-required", "--window-size=1280,800", "about:blank"], { stdio: "ignore" });
  let page;
  for (let i = 0; i < 80 && !page; i++) {
    try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === "page"); } catch {}
    if (!page) await sleep(250);
  }
  const ws = await connectWs(page.webSocketDebuggerUrl);
  let send;
  const onEvent = (method, params) => {
    if (method !== "Fetch.requestPaused") return;
    const requestId = params.requestId;
    if (mode === "fail") send("Fetch.failRequest", { requestId, errorReason: "ConnectionRefused" }).catch(() => {});
    else if (mode === "hold") held.push(requestId);
    else send("Fetch.continueRequest", { requestId }).catch(() => {});
  };
  send = rpc(ws, false, onEvent);
  release = () => { while (held.length) send("Fetch.continueRequest", { requestId: held.shift() }).catch(() => {}); };
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Network.enable");
  await send("Network.setCacheDisabled", { cacheDisabled: true });
  await send("Fetch.enable", { patterns: [{ urlPattern: "*cdn.jsdelivr.net*" }] });
  await send("Page.addScriptToEvaluateOnNewDocument", { source: ERROR_TRAP });
  return {
    navigate: (url) => send("Page.navigate", { url }),
    evaluate: async (expr) => {
      const r = await send("Runtime.evaluate", { expression: `(async () => JSON.stringify(await (${expr})))()`, awaitPromise: true, returnByValue: true, userGesture: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return JSON.parse(r.result.value ?? "null");
    },
    cdn: (m) => { mode = m; if (m === "pass") release(); },
    close: () => { try { ws.close(); } catch {} try { spawnSync("taskkill", ["/PID", String(proc.pid), "/T", "/F"], { stdio: "ignore" }); } catch {} },
  };
}

/** Polls `expr` every 200 ms until it is truthy; returns the elapsed ms, or null after `timeoutMs`. */
async function waitFor(b, expr, timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (await b.evaluate(expr).catch(() => false)) return Date.now() - t0;
    await sleep(200);
  }
  return null;
}

// The start ends with switchAppView('home'), which tears down any media: wait for it (data-app-view) before opening players
const APP_READY = `location.href.startsWith(${JSON.stringify(BASE)}) && Boolean(window.TvzinhaActions && window.TvzinhaActions.store) && document.body.getAttribute('data-app-view') === 'home'`;
const LIBS_READY = "typeof window.Hls === 'function' && typeof window.Artplayer === 'function'";
// A stage outside the app panels: the engine mounts there without the modal visibility checks
const ADD_STAGE = `(() => { let s = document.getElementById('tvz-libs-stage'); if (!s) { s = document.createElement('div'); s.id = 'tvz-libs-stage';
  s.style.cssText = 'position:fixed;left:0;top:0;width:640px;height:360px;z-index:99999;'; document.body.appendChild(s); } return true; })()`;
// Unroutable address: the video never answers, so the Artplayer instance stays while we look at it
const MOUNT_NATIVE = `import('/assets/js/player/engine.js?v=${VERSION}').then(m => { window.__engine = m;
  m.mountNativePlayer({ containerId: 'tvz-libs-stage', streamUrl: 'https://10.255.255.1/tvz-libs-check.mp4', title: 'Teste' }); return true; })`;
const STAGE_TEXT = "(document.getElementById('tvz-libs-stage') || {}).textContent || ''";
const STAGE_HAS_PLAYER = "Boolean(document.querySelector('#tvz-libs-stage .art-video-player'))";
const ERRORS = "(window.__errs || []).filter(e => !/10\\.255\\.255\\.1|NotSupportedError|play\\(\\)|AbortError/.test(e))";

async function startApp(b) {
  await b.navigate(BASE + "/");
  const ms = await waitFor(b, APP_READY, 40000);
  await b.evaluate("(window.TvzinhaActions.closeAdblockModal && window.TvzinhaActions.closeAdblockModal(), true)").catch(() => {});
  return ms;
}

console.log(`player libraries on demand, ${browserName}, version ${VERSION}`);

// 1. CDN held: the app starts anyway, and the idle preload finishes once the CDN answers
if (runs(1)) {
  const b = await launch(browserName, "hold");
  try {
    const started = await startApp(b);
    const libsEarly = await b.evaluate(LIBS_READY);
    check("app starts while jsDelivr is held", started !== null && started < 8000, `${started} ms`);
    check("the libraries are not there yet (nothing blocks on them)", !libsEarly);
    await sleep(3000);
    b.cdn("pass");
    const loaded = await waitFor(b, LIBS_READY, 20000);
    const tags = await b.evaluate("[...document.querySelectorAll('script[src*=\"cdn.jsdelivr.net\"]')].map(s => Boolean(s.integrity) && s.crossOrigin === 'anonymous')");
    check("idle preload loads hls.js and Artplayer once the CDN answers", loaded !== null, `${loaded} ms`);
    check("both tags carry SRI and crossorigin, one tag each", tags.length === 2 && tags.every(Boolean), JSON.stringify(tags));
    check("no page errors", (await b.evaluate(ERRORS)).length === 0, JSON.stringify(await b.evaluate(ERRORS)));
  } finally { b.close(); }
}

// 2. A player opened before the libraries arrive waits, says the connection is slow after 8 s, then mounts
if (runs(2)) {
  const b = await launch(browserName, "hold");
  try {
    await startApp(b);
    await b.evaluate(ADD_STAGE);
    await b.evaluate(MOUNT_NATIVE);
    await sleep(1000);
    // A tab switch resets the TV player; it must not drop a movie or episode waiting for the libraries
    await b.evaluate("(window.__engine.atomicTvPlayerReset(), true)");
    const waiting = await b.evaluate(STAGE_TEXT);
    check("waiting player shows 'Carregando o player...'", /Carregando o player/.test(waiting), JSON.stringify(waiting.trim()));
    await sleep(8500);
    const slow = await b.evaluate(STAGE_TEXT);
    check("after 8 s it says the connection is slow and keeps waiting", /Conexão lenta/.test(slow) && !(await b.evaluate(STAGE_HAS_PLAYER)), JSON.stringify(slow.trim()));
    b.cdn("pass");
    const mounted = await waitFor(b, STAGE_HAS_PLAYER, 20000);
    check("the player mounts as soon as the libraries arrive (a TV reset meanwhile did not drop it)", mounted !== null, `${mounted} ms after release`);
    check("no page errors", (await b.evaluate(ERRORS)).length === 0, JSON.stringify(await b.evaluate(ERRORS)));
  } finally { b.close(); }
}

// 3. A reset while waiting (player closed, other episode, tab left) drops the waiting mount
if (runs(3)) {
  const b = await launch(browserName, "hold");
  try {
    await startApp(b);
    await b.evaluate(ADD_STAGE);
    await b.evaluate(MOUNT_NATIVE);
    await sleep(800);
    await b.evaluate("(window.__engine.atomicPlayerReset(), true)");
    b.cdn("pass");
    await waitFor(b, LIBS_READY, 20000);
    await sleep(1500);
    check("a reset while waiting drops the mount", !(await b.evaluate(STAGE_HAS_PLAYER)));
  } finally { b.close(); }
}

// 4. CDN down: clear error with retry (movie/series player), then retry works once the CDN is back
if (runs(4)) {
  const b = await launch(browserName, "fail");
  try {
    const started = await startApp(b);
    check("app starts with jsDelivr down", started !== null && started < 8000, `${started} ms`);
    await b.evaluate(ADD_STAGE);
    await b.evaluate(MOUNT_NATIVE);
    const failed = await waitFor(b, `/Não foi possível carregar o player/.test(${STAGE_TEXT})`, 10000);
    check("movie/series player: 'Não foi possível carregar o player' with a retry button", failed !== null && await b.evaluate("Boolean(document.querySelector('#tvz-libs-stage .btn-error-retry'))"));
    check("no page errors (the old code threw on window.Artplayer)", (await b.evaluate(ERRORS)).length === 0, JSON.stringify(await b.evaluate(ERRORS)));
    b.cdn("pass");
    await b.evaluate("(document.querySelector('#tvz-libs-stage .btn-error-retry').click(), true)");
    const mounted = await waitFor(b, STAGE_HAS_PLAYER, 20000);
    check("retry with the CDN back mounts the player", mounted !== null, `${mounted} ms`);
  } finally { b.close(); }
}

// 5. CDN down: live TV shows the same clear error (not "Transmissão Direta Instável") and retry works
if (runs(5)) {
  const b = await launch(browserName, "fail");
  try {
    await startApp(b);
    await b.evaluate("(window.TvzinhaActions.switchView('tv'), true)");
    await sleep(1500);
    await b.evaluate("(window.TvzinhaActions.selectChannel('TV Aberta', 'Band'), true)");
    const failed = await waitFor(b, "/Não foi possível carregar o player/.test((document.getElementById('tv-artplayer-container') || {}).textContent || '')", 10000);
    const misleading = await b.evaluate("/Transmissão Direta Instável/.test(document.getElementById('tv-artplayer-container')?.textContent || '')");
    check("live TV: clear library error instead of walking every source", failed !== null && !misleading);
    b.cdn("pass");
    await b.evaluate("(document.querySelector('#tv-artplayer-container .btn-error-retry').click(), true)");
    const mounted = await waitFor(b, "Boolean(window.tvArtInstance)", 20000);
    check("live TV: retry with the CDN back mounts the player", mounted !== null, `${mounted} ms`);
    check("no page errors", (await b.evaluate(ERRORS)).length === 0, JSON.stringify(await b.evaluate(ERRORS)));
  } finally { b.close(); }
}

// 6. Normal CDN: the libraries are ready a few seconds after start and a channel opens right away
if (runs(6)) {
  const b = await launch(browserName, "pass");
  try {
    const started = await startApp(b);
    const loaded = await waitFor(b, LIBS_READY, 20000);
    check("normal CDN: app starts and the idle preload follows", started !== null && loaded !== null, `start ${started} ms, libraries +${loaded} ms`);
    await b.evaluate("(window.TvzinhaActions.switchView('tv'), true)");
    await sleep(1500);
    await b.evaluate("(window.TvzinhaActions.selectChannel('TV Aberta', 'Band'), true)");
    const mounted = await waitFor(b, "Boolean(window.tvArtInstance)", 5000);
    check("normal CDN: live TV mounts at once (libraries already loaded)", mounted !== null && mounted < 1500, `${mounted} ms`);
    check("no page errors", (await b.evaluate(ERRORS)).length === 0, JSON.stringify(await b.evaluate(ERRORS)));
  } finally { b.close(); }
}

const failedCount = results.filter(ok => !ok).length;
console.log(`\n${results.length - failedCount}/${results.length} passed`);
process.exit(failedCount ? 1 : 0);
