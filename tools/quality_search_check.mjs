/**
 * Checks "Buscar qualidade melhor" in the quality menu: the movie starts on what the server ranked first (fast), and
 * on request the browser measures the MP4s the server could not measure, then moves to a better one at the same
 * position, or says nothing better was found. When the best source is already measured, the option is not offered.
 *
 *   node tools/quality_search_check.mjs [--browser=chrome|edge|firefox]   (chrome by default)
 *
 * Needs `python tools/local_server.py` on 127.0.0.1:8787. Uses the real sources of Avengers: Endgame (TMDB 299534)
 * from the local resolve and reshapes the answer in the page the way the edge sees it (its MP4s unmeasured: the host
 * blocks datacenters), so the browser side runs on the real files. A full search takes up to a minute (slow host).
 */
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
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
  const profile = tempDir(join(tmpdir(), `tvz-qsearch-${name}-`));
  const port = 9780 + Math.floor(Math.random() * 40);
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


/**
 * How the resolve answer is reshaped (labels: mp4-1080 / mp4-720 = the direct MP4s, mp4-broken = an MP4 address that
 * does not exist). Sources in `measured` keep the quality the local resolve measured; the others go unmeasured, as the
 * edge sees them. The MGEB list rotates (the 360p mirror is not always there), so the playing source is the 720p MP4.
 */
// An MP4 address that accepts the connection and never answers: the player runs out of start time on it
const hanging = createServer(() => {}).listen(0, "127.0.0.1");
await new Promise(r => hanging.once("listening", r));
const HANGING_URL = `http://127.0.0.1:${hanging.address().port}/movie.mp4`;

const SCENARIOS = {
  edge: { note: "720p playing, the 1080p MP4 unmeasured (edge view)", order: ["mp4-720", "mp4-1080"], measured: ["mp4-720"], search: true },
  timedOut: { note: "first source an unmeasured MP4 that runs out of start time, then 720p", order: ["mp4-hanging", "mp4-720"], measured: ["mp4-720"], search: true },
  nothing: { note: "720p playing, only a broken unmeasured MP4 besides it", order: ["mp4-720", "mp4-broken"], measured: ["mp4-720"], search: true },
  measured: { note: "1080p already measured first: no search offered", order: ["mp4-1080", "mp4-720"], measured: ["mp4-1080", "mp4-720"] },
};

async function runScenario(b, key) {
  const sc = SCENARIOS[key];
  await b.navigate(BASE + "/");
  for (let i = 0; i < 160; i++) { if (await b.evaluate("Boolean(window.TvzinhaActions && window.TvzinhaActions.store)").catch(() => false)) break; await sleep(250); }
  await sleep(1200);
  await b.evaluate("(window.TvzinhaActions.closeAdblockModal && window.TvzinhaActions.closeAdblockModal(), true)").catch(() => {});
  // 1. open the movie with the reshaped answer and wait for the first frame
  const opened = await b.evaluate(`(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    window.__toasts = [];
    const toast = document.getElementById('app-toast');
    new MutationObserver(() => { const t = toast.textContent.trim(); if (t && window.__toasts[window.__toasts.length - 1] !== t) window.__toasts.push(t); })
      .observe(toast, { childList: true, characterData: true, subtree: true });
    const realFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const url = String((input && input.url) || input);
      if (!url.includes('/api/resolve')) return realFetch(input, init);
      const data = await (await realFetch(input, init)).json();
      const all = [data.primary_source, ...(data.fallback_sources || [])].filter(Boolean);
      // Roles, not fixed numbers (the MGEB list rotates): "mp4-720" = the lowest measured direct MP4 (it plays),
      // "mp4-1080" = another direct MP4, higher or unmeasured (what the search must find)
      const mp4 = all.filter(s => /fontedecanais/.test(s.raw_url || ''));
      const low = mp4.filter(s => s.quality).sort((a, b) => a.quality - b.quality)[0];
      const high = mp4.filter(s => s !== low).sort((a, b) => (b.quality || 9999) - (a.quality || 9999))[0];
      const byLabel = {};
      if (low) byLabel['mp4-720'] = low;
      if (high) byLabel['mp4-1080'] = high;
      window.__roles = { low: low && low.quality, high: high && high.quality };
      if (byLabel['mp4-720']) byLabel['mp4-broken'] = { ...byLabel['mp4-720'], stream_url: byLabel['mp4-720'].stream_url.replace(/\\/\\d+\\.mp4/, '/0.mp4') };
      if (byLabel['mp4-720']) byLabel['mp4-hanging'] = { ...byLabel['mp4-720'], stream_url: ${JSON.stringify(HANGING_URL)}, raw_url: ${JSON.stringify(HANGING_URL)} };
      const picked = ${JSON.stringify(sc.order)}.map(l => byLabel[l] && { ...byLabel[l], label: l }).filter(Boolean).map(s => {
        if (!${JSON.stringify(sc.measured)}.includes(s.label)) return { ...s, quality: null, qualities: [], kind: 'unknown' };
        return s;
      });
      window.__urls = Object.fromEntries(picked.map(s => [s.label, s.stream_url]));
      return new Response(JSON.stringify({ ...data, primary_source: picked[0], fallback_sources: picked.slice(1) }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    };
    const t0 = Date.now();
    window.TvzinhaActions.openMovie({ id: 299534, title: 'Vingadores: Ultimato', backdrop_path: null, poster_path: null, overview: '' }, true);
    let started = false;
    for (let i = 0; i < 320 && !started; i++) {
      await wait(250);
      const v = window.artInstance && window.artInstance.video;
      started = Boolean(v && v.readyState >= 2 && v.currentTime > 0.3);
    }
    return { started, startedMs: Date.now() - t0, roles: window.__roles || null };
  })()`);
  const state = () => b.evaluate(`(() => {
    const art = window.artInstance;
    const playing = art ? (Object.entries(window.__urls || {}).find(([, u]) => u === art.option.url) || [null])[0] : null;
    const menu = art ? ((art.setting.find('quality') || {}).selector || []).map(i => String(i.html).replace(/<[^>]+>/g, '').trim()) : [];
    const v = art && art.video;
    return { playing, menu, frame: v ? v.videoWidth + 'x' + v.videoHeight : null, at: v ? Math.round(v.currentTime) : null, toasts: window.__toasts };
  })()`);
  const before = await state();
  if (!sc.search) return { opened, before };

  // 2. go to 5:00, then ask for a better quality while it plays
  await b.evaluate("(window.artInstance.currentTime = 300, true)");
  await sleep(4000);
  const position = (await state()).at;
  // Through the screen, as a viewer does: gear, Qualidade, the item (it must be drawn and inside the panel)
  const clicked = await b.evaluate(`(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    const root = document.querySelector('.art-video-player');
    root.querySelector('.art-control-setting').click();
    await wait(600);
    [...root.querySelectorAll('.art-setting-item')].find(el => /Qualidade/.test(el.textContent))?.click();
    await wait(800);
    const item = [...root.querySelectorAll('.art-setting-item')].find(el => /Buscar qualidade melhor/.test(el.textContent) && el.offsetParent);
    if (!item) return { drawn: false, visible: false };
    const a = item.getBoundingClientRect(), p = item.closest('.art-settings').getBoundingClientRect();
    const visible = a.height > 0 && a.top >= p.top - 1 && a.bottom <= p.bottom + 1;
    item.click();
    return { drawn: true, visible };
  })()`);
  const searchedAt = Date.now();
  let after = await state();
  for (let i = 0; i < 240; i++) {
    await sleep(500);
    after = await b.evaluate(`(async () => {
      const art = window.artInstance; const v = art && art.video;
      const playing = art ? (Object.entries(window.__urls || {}).find(([, u]) => u === art.option.url) || [null])[0] : null;
      const menu = art ? ((art.setting.find('quality') || {}).selector || []).map(i => String(i.html).replace(/<[^>]+>/g, '').trim()) : [];
      return { playing, menu, frame: v ? v.videoWidth + 'x' + v.videoHeight : null, at: v ? Math.round(v.currentTime) : null, ready: Boolean(v && v.readyState >= 2 && !v.paused), toasts: window.__toasts };
    })()`);
    const settled = key === "nothing" || key === "timedOut" ? after.toasts.some(t => /Não encontramos/.test(t))
      : (after.playing === "mp4-1080" && after.ready && after.at > 0) || after.toasts.some(t => /não respondeu/.test(t));
    if (settled) break;
  }
  return { opened, before, position, clicked, after, searchMs: Date.now() - searchedAt };
}

const b = await launch(browserName);
try {
  for (const key of Object.keys(SCENARIOS)) {
    const r = await runScenario(b, key);
    console.log(`\n== ${browserName}: ${SCENARIOS[key].note}`);
    console.log("   " + JSON.stringify(r));
    if (r.clicked) check(`${key}: 'Buscar qualidade melhor' is drawn in the Qualidade panel, visible, and a click starts it`, r.clicked.drawn && r.clicked.visible && r.after.toasts.some(t => /Procurando/.test(t)), JSON.stringify(r.clicked));
    if (key === "edge" && r.after.toasts.some(t => /não respondeu/.test(t))) {
      // The host did not deliver the 1080p file in 45 s (it happens: slow host): the viewer must be told and kept on 720p
      console.log("   (the 1080p file did not start in 45 s on this run: checking the way back)");
      check("found the 1080p, which did not start: the viewer is told and playback goes back to 720p",
        r.after.toasts.some(t => /1080p encontrada/.test(t)) && r.after.playing === "mp4-720" && r.after.ready, JSON.stringify(r.after.toasts));
    } else if (key === "edge") {
      const height = frame => Number(String(frame || "0x0").split("x")[1]);
      console.log(`   roles this run: playing MP4 ${r.opened.roles && r.opened.roles.low}p, other MP4 ${r.opened.roles && r.opened.roles.high ? r.opened.roles.high + "p" : "unmeasured"}`);
      check("starts on what the server ranked first, as today (no measuring before the start)", r.opened.started && r.before.playing === "mp4-720", `${r.opened.startedMs} ms`);
      check("the quality menu offers 'Buscar qualidade melhor'", r.before.menu.includes("Buscar qualidade melhor"), JSON.stringify(r.before.menu));
      check("the search finds the better MP4 and moves to it", r.after.playing === "mp4-1080" && height(r.after.frame) > height(r.before.frame), `${Math.round(r.searchMs / 1000)} s, ${r.before.frame} -> ${r.after.frame}`);
      check("it continues from the same point", Math.abs(r.after.at - r.position) <= 30, `at ${r.position}s before, ${r.after.at}s after`);
      check("the viewer is told (searching, then found)", r.after.toasts.some(t => /Procurando/.test(t)) && r.after.toasts.some(t => /encontrada/.test(t)), JSON.stringify(r.after.toasts));
      check("the menu lists the new quality and no longer offers the search", r.after.menu.length >= r.before.menu.length && !r.after.menu.some(t => /Buscar/.test(t)), JSON.stringify(r.after.menu));
    } else if (key === "timedOut") {
      check("the first MP4 runs out of start time and the player moves on to 720p", r.opened.started && r.before.playing === "mp4-720", `${Math.round(r.opened.startedMs / 1000)} s`);
      check("the search is still offered, the timed-out MP4 counting again", r.before.menu.includes("Buscar qualidade melhor"), JSON.stringify(r.before.menu));
      check("it measures that MP4 too (here it never answers): nothing better, the viewer is told", r.after.toasts.some(t => /Procurando/.test(t)) && r.after.toasts.some(t => /Não encontramos/.test(t)) && r.after.playing === "mp4-720", JSON.stringify(r.after.toasts));
    } else if (key === "nothing") {
      check("nothing better: the viewer is told", r.after.toasts.some(t => /Não encontramos uma qualidade melhor/.test(t)), JSON.stringify(r.after.toasts));
      check("nothing better: playback stays on the same source", r.after.playing === "mp4-720", `${Math.round(r.searchMs / 1000)} s`);
    } else if (!(r.opened.roles && r.opened.roles.high >= 1080)) {
      console.log(`   SKIP: no measured 1080p MP4 in this run's answer (roles ${JSON.stringify(r.opened.roles)})`);
    } else {
      // When the slow host does not deliver the 1080p within the normal 20 s, the player moves on to 720p (as today)
      check("measured first: no search offered", r.opened.started && !r.before.menu.some(t => /Buscar/.test(t)), `${r.before.playing}, ${JSON.stringify(r.before.menu)}`);
    }
  }
} finally {
  b.close();
  hanging.close();
}

const failed = results.filter(ok => !ok).length;
console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
