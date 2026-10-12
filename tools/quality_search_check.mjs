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
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

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
  const profile = mkdtempSync(join(tmpdir(), `tvz-qsearch-${name}-`));
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
const SCENARIOS = {
  edge: { note: "720p playing, the 1080p MP4 unmeasured (edge view)", order: ["mp4-720", "mp4-1080"], measured: ["mp4-720"], search: true },
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
    const labelOf = s => /playercdn|workers\\.dev/.test(s.raw_url || s.stream_url) ? 'mirror' : (s.quality === 1080 ? 'mp4-1080' : s.quality === 720 ? 'mp4-720' : 'other');
    window.fetch = async (input, init) => {
      const url = String((input && input.url) || input);
      if (!url.includes('/api/resolve')) return realFetch(input, init);
      const data = await (await realFetch(input, init)).json();
      const all = [data.primary_source, ...(data.fallback_sources || [])].filter(Boolean);
      const byLabel = Object.fromEntries(all.map(s => [labelOf(s), s]));
      if (byLabel['mp4-720']) byLabel['mp4-broken'] = { ...byLabel['mp4-720'], stream_url: byLabel['mp4-720'].stream_url.replace(/\\/\\d+\\.mp4/, '/0.mp4') };
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
    return { started, startedMs: Date.now() - t0 };
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
  await b.evaluate("(window.artInstance.setting.find('quality').onSelect({ value: 'search', html: 'Buscar qualidade melhor' }), true)");
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
    const settled = key === "nothing" ? after.toasts.some(t => /Não encontramos/.test(t))
      : (after.playing === "mp4-1080" && after.ready && after.at > 0) || after.toasts.some(t => /não respondeu/.test(t));
    if (settled) break;
  }
  return { opened, before, position, after, searchMs: Date.now() - searchedAt };
}

const b = await launch(browserName);
try {
  for (const key of Object.keys(SCENARIOS)) {
    const r = await runScenario(b, key);
    console.log(`\n== ${browserName}: ${SCENARIOS[key].note}`);
    console.log("   " + JSON.stringify(r));
    if (key === "edge" && r.after.toasts.some(t => /não respondeu/.test(t))) {
      // The host did not deliver the 1080p file in 45 s (it happens: slow host): the viewer must be told and kept on 720p
      console.log("   (the 1080p file did not start in 45 s on this run: checking the way back)");
      check("found the 1080p, which did not start: the viewer is told and playback goes back to 720p",
        r.after.toasts.some(t => /1080p encontrada/.test(t)) && r.after.playing === "mp4-720" && r.after.ready, JSON.stringify(r.after.toasts));
    } else if (key === "edge") {
      check("starts on what the server ranked first, as today (no measuring before the start)", r.opened.started && r.before.playing === "mp4-720", `${r.opened.startedMs} ms`);
      check("the quality menu offers 'Buscar qualidade melhor'", r.before.menu.includes("Buscar qualidade melhor"), JSON.stringify(r.before.menu));
      check("the search finds the 1080p MP4 and moves to it", r.after.playing === "mp4-1080" && r.after.frame === "1920x804", `${Math.round(r.searchMs / 1000)} s, frame ${r.after.frame}`);
      check("it continues from the same point", Math.abs(r.after.at - r.position) <= 30, `at ${r.position}s before, ${r.after.at}s after`);
      check("the viewer is told (searching, then found)", r.after.toasts.some(t => /Procurando/.test(t)) && r.after.toasts.some(t => /1080p encontrada/.test(t)), JSON.stringify(r.after.toasts));
      check("the menu lists 1080p and no longer offers the search", r.after.menu.some(t => t.startsWith("1080p")) && !r.after.menu.some(t => /Buscar/.test(t)), JSON.stringify(r.after.menu));
    } else if (key === "nothing") {
      check("nothing better: the viewer is told", r.after.toasts.some(t => /Não encontramos uma qualidade melhor/.test(t)), JSON.stringify(r.after.toasts));
      check("nothing better: playback stays on the same source", r.after.playing === "mp4-720", `${Math.round(r.searchMs / 1000)} s`);
    } else {
      // When the slow host does not deliver the 1080p within the normal 20 s, the player moves on to 720p (as today)
      check("measured first: no search offered", r.opened.started && !r.before.menu.some(t => /Buscar/.test(t)), `${r.before.playing}, ${JSON.stringify(r.before.menu)}`);
    }
  }
} finally {
  b.close();
}

const failed = results.filter(ok => !ok).length;
console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
