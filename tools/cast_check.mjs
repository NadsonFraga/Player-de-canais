/**
 * Checks the "Transmitir" row of the native player: present on Android only, and the Web Video Caster intent it
 * opens carries the absolute address of the source that is playing.
 *
 *   node tools/cast_check.mjs [--browser=chrome|edge|firefox]   (chrome by default)
 *
 * Needs `python tools/local_server.py` on 127.0.0.1:8787. Opens Friends T1E1 on the main player with a real resolve
 * (the local server caches it, so MGEB is asked once per 30 min). Android is simulated by overriding
 * navigator.userAgent in the page, which is all the player reads, so CDP (Chrome, Edge) and WebDriver BiDi (Firefox)
 * take the same path. Nothing is sent to the app: the intent address is built and inspected.
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
const ANDROID_UA = "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";
const APP = "com.instantbits.cast.webvideo";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = "") => { results.push(ok); console.log(`${ok ? "OK  " : "FAIL"} ${name}${detail ? " " + detail : ""}`); };

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

/** { evaluate(expr), navigate(url), close() } for headless Chrome/Edge (CDP) or Firefox (WebDriver BiDi), always muted. */
async function launch(name) {
  const profile = mkdtempSync(join(tmpdir(), `tvz-cast-${name}-`));
  const port = 9950 + Math.floor(Math.random() * 40);
  if (name === "firefox") {
    writeFileSync(join(profile, "user.js"), 'user_pref("media.volume_scale", "0.0");\nuser_pref("media.autoplay.default", 0);\n');
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
  const send = rpc(ws, false);
  await send("Runtime.enable");
  await send("Page.enable");
  return {
    navigate: async (url) => { await send("Page.navigate", { url }); await sleep(1500); },
    evaluate: async (expr) => {
      const r = await send("Runtime.evaluate", { expression: `(async () => JSON.stringify(await (${expr})))()`, awaitPromise: true, returnByValue: true, userGesture: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return JSON.parse(r.result.value ?? "null");
    },
    close: () => { try { ws.close(); } catch {} try { spawnSync("taskkill", ["/PID", String(proc.pid), "/T", "/F"], { stdio: "ignore" }); } catch {} },
  };
}

/** Opens Friends T1E1 on the main player and returns its settings rows and the playing source. */
async function openPlayer(b, android) {
  await b.navigate(BASE + "/");
  for (let i = 0; i < 120; i++) {
    if (await b.evaluate("Boolean(window.TvzinhaActions && window.TvzinhaActions.store)").catch(() => false)) break;
    await sleep(250);
  }
  await b.evaluate(`(async () => {
    ${android ? `Object.defineProperty(navigator, 'userAgent', { get: () => ${JSON.stringify(ANDROID_UA)}, configurable: true });` : ""}
    window.__s = await import('/assets/js/modules/series.js?v=${VERSION}');
    window.__engine = await import('/assets/js/player/engine.js?v=${VERSION}');
    return true;
  })()`);
  await b.evaluate("(window.TvzinhaActions.closeAdblockModal && window.TvzinhaActions.closeAdblockModal(), true)").catch(() => {});
  await b.evaluate("(window.__s.openEpisode({ id: 1668, name: 'Friends' }, { season: 1, episode: 1 }), true)");
  await b.evaluate(`(async () => {
    for (let i = 0; i < 60 && !document.querySelector('[data-server="native_direct"]'); i++) await new Promise(r => setTimeout(r, 250));
    document.querySelector('[data-server="native_direct"]')?.click(); return true; })()`);
  // Qualidade and Áudio arrive with the playlist; Legendas (and Transmitir) when the player is ready
  for (let i = 0; i < 160; i++) {
    const ready = await b.evaluate("Boolean(window.artInstance && window.artInstance.setting && (window.artInstance.setting.option || []).some(o => o.name === 'subtitle'))").catch(() => false);
    if (ready) break;
    await sleep(250);
  }
  await sleep(500);
  const state = await b.evaluate(`(() => {
    const art = window.artInstance;
    const rows = (art.setting.option || []).map(o => ({ name: o.name, html: o.html, items: (o.selector || []).length, select: typeof o.onSelect }));
    return { rows, url: art.option.url, type: art.option.type };
  })()`);
  await b.evaluate("(window.artInstance && window.artInstance.pause(), true)").catch(() => {});
  return state;
}

const b = await launch(browserName);
try {
  console.log(`== ${browserName}: desktop`);
  const desktop = await openPlayer(b, false);
  console.log("   rows:", desktop.rows.map(r => r.name).join(", "));
  check("desktop: the menu is built (Qualidade, Áudio, Legendas) and has no Transmitir row",
    ["quality", "audio", "subtitle"].every(n => desktop.rows.some(r => r.name === n)) && !desktop.rows.some(r => r.name === "cast"));

  console.log(`\n== ${browserName}: Android`);
  const android = await openPlayer(b, true);
  console.log("   rows:", android.rows.map(r => r.name).join(", "));
  console.log("   playing:", android.type, android.url.slice(0, 110));
  const cast = android.rows.find(r => r.name === "cast");
  check("Android: Transmitir row present, last in the menu, one option that opens the app",
    Boolean(cast) && android.rows[android.rows.length - 1].name === "cast" && /Transmitir/.test(cast.html) && cast.items === 1 && cast.select === "function",
    JSON.stringify(cast));
  check("Android: the other rows stay (Qualidade, Áudio, Legendas)", ["quality", "audio", "subtitle"].every(n => android.rows.some(r => r.name === n)));

  const isHls = android.type === "m3u8";
  const intents = await b.evaluate(`({
    playing: window.__engine.castIntentUrl(${JSON.stringify(android.url)}, 'Friends • T1:E1', ${isHls}),
    mp4: window.__engine.castIntentUrl('https://host.example.invalid/v/ep.mp4?token=a%2Fb', 'Filme', false),
    hls: window.__engine.castIntentUrl('/api/stream?url=' + encodeURIComponent('https://cdn.example.invalid/ep/index.m3u8'), 'Série', true),
  })`);
  console.log("   intent (playing source):", intents.playing.slice(0, 160) + "...");
  const playing = new URL(android.url, BASE);
  check("the intent opens Web Video Caster with the playing address (absolute, query kept, its own type)",
    intents.playing.startsWith(`intent://${playing.host}${playing.pathname}${playing.search}#Intent;`) &&
    intents.playing.includes(`;scheme=${playing.protocol.replace(":", "")};`) &&
    intents.playing.includes(`;type=${isHls ? "application/x-mpegURL" : "video/mp4"};`) &&
    intents.playing.includes(`;package=${APP};`) && intents.playing.endsWith(";end"));
  check("the intent carries the title and the Play Store page as fallback",
    intents.playing.includes(`;S.title=${encodeURIComponent("Friends • T1:E1")};`) &&
    intents.playing.includes(`;S.browser_fallback_url=${encodeURIComponent(`https://play.google.com/store/apps/details?id=${APP}`)};`));
  check("a relative proxy address becomes absolute, HLS type",
    intents.hls.startsWith(`intent://127.0.0.1:8787/api/stream?url=${encodeURIComponent("https://cdn.example.invalid/ep/index.m3u8")}#Intent;`) &&
    intents.hls.includes(";scheme=http;") && intents.hls.includes(";type=application/x-mpegURL;"), intents.hls.slice(0, 120));
  check("a direct MP4: https scheme, video/mp4 type, query kept",
    intents.mp4.startsWith("intent://host.example.invalid/v/ep.mp4?token=a%2Fb#Intent;") && intents.mp4.includes(";scheme=https;") && intents.mp4.includes(";type=video/mp4;"));
} finally {
  b.close();
}

const failed = results.filter(ok => !ok).length;
console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
