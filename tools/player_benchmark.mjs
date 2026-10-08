/**
 * Tvzinha Online - Native player benchmark
 *
 * Opens titles through the real UI (window.TvzinhaActions) in headless Edge (CDP)
 * or Firefox (WebDriver BiDi) and measures time-to-first-frame (TTFF), the source
 * that played, its resolution, failovers and resolve timings (Server-Timing).
 *
 * Usage:
 *   python tools/local_server.py            (in another terminal)
 *   node tools/player_benchmark.mjs [--browser=edge|firefox] [--only=reacher,avatar] [--out=results.json] [--warm]
 *
 * --warm keeps the local resolve cache (default clears it so every title is a cold open).
 * No dependencies: uses Node 22+ global fetch/WebSocket.
 */
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = "http://localhost:8787";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const FIREFOX = "C:\\Program Files\\Mozilla Firefox\\firefox.exe";
const TIMEOUT_MS = 120000;
const WATCH_BEFORE_NEXT_MS = 15000;

// type: movie -> openMovie(id); serie -> playEpisode(show, season, episode) for each episode in order
const MATRIX = [
  { key: "reacher", name: "Reacher", type: "serie", id: 108978, season: 1, episodes: [1, 2, 3] },
  { key: "friends", name: "Friends", type: "serie", id: 1668, season: 1, episodes: [1, 2] },
  { key: "mentalista", name: "O Mentalista", type: "serie", id: 5920, season: 1, episodes: [1, 2] },
  { key: "breakingbad", name: "Breaking Bad", type: "serie", id: 1396, season: 1, episodes: [1] },
  { key: "lastofus", name: "The Last of Us", type: "serie", id: 100088, season: 1, episodes: [1] },
  { key: "avatar", name: "Avatar Aang", type: "movie", id: 980431 },
  { key: "mario", name: "Super Mario Galaxy", type: "movie", id: 1226863 },
  { key: "robo", name: "Robo Selvagem", type: "movie", id: 1184918 },
  { key: "ladobom", name: "O Lado Bom de Ser Traida", type: "movie", id: 1173558 },
  { key: "jack", name: "O Estranho Mundo de Jack", type: "movie", id: 9479 },
  { key: "demonslayer", name: "Demon Slayer Castelo Infinito", type: "movie", id: 1311031 },
  { key: "ilha", name: "A Ilha Esquecida", type: "movie", id: 1465063 },
  { key: "zootopia", name: "Zootopia 2", type: "movie", id: 1084242 },
  { key: "divertida", name: "Divertida Mente 2", type: "movie", id: 1022789 },
  { key: "deadpool", name: "Deadpool & Wolverine", type: "movie", id: 533535 },
  { key: "corrida", name: "Corrida dos Bichos", type: "movie", id: 1263532 },
];

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, v] = a.replace(/^--/, "").split("=");
  return [k, v ?? true];
}));
const browserName = args.browser || "edge";
const only = args.only ? String(args.only).split(",") : null;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function connectWs(url) {
  for (let i = 0; i < 60; i++) {
    try {
      const ws = new WebSocket(url);
      await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
      return ws;
    } catch {
      await sleep(500);
    }
  }
  throw new Error("Could not connect to " + url);
}

function rpc(ws, onEvent, isBidi) {
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      const failed = isBidi ? msg.type === "error" : Boolean(msg.error);
      failed ? rej(new Error(JSON.stringify(msg.error || msg.message))) : res(msg.result);
    } else if (msg.method) {
      onEvent(msg);
    }
  };
  return (method, params = {}) => new Promise((res, rej) => {
    const mid = ++id;
    pending.set(mid, { res, rej });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}

/** Returns { evaluate(expr) -> JSON-parsed value, navigate(url), close(), logs[] } */
async function launchBrowser(name) {
  const profile = mkdtempSync(join(tmpdir(), `tvz-bench-${name}-`));
  const logs = [];
  if (name === "firefox") {
    writeFileSync(join(profile, "user.js"), 'user_pref("media.autoplay.default", 0);\nuser_pref("media.autoplay.blocking_policy", 0);\n');
    const proc = spawn(FIREFOX, ["--headless", "--remote-debugging-port", "9611", "--profile", profile, "--no-remote"], { stdio: "ignore" });
    const ws = await connectWs("ws://127.0.0.1:9611/session");
    const send = rpc(ws, (m) => {
      if (m.method === "log.entryAdded") logs.push(`${m.params.level} ${m.params.text}`);
    }, true);
    await send("session.new", { capabilities: {} });
    const context = (await send("browsingContext.getTree", {})).contexts[0].context;
    await send("session.subscribe", { events: ["log.entryAdded"] });
    return {
      logs,
      navigate: (url) => send("browsingContext.navigate", { context, url, wait: "complete" }),
      evaluate: async (expr) => {
        const r = await send("script.evaluate", { expression: `JSON.stringify(${expr})`, target: { context }, awaitPromise: true, resultOwnership: "none" });
        if (r.type === "exception") throw new Error(r.exceptionDetails.text);
        return JSON.parse(r.result.value ?? "null");
      },
      close: () => { try { ws.close(); } catch {} proc.kill(); },
    };
  }
  const proc = spawn(EDGE, ["--headless=new", "--remote-debugging-port=9610", "--remote-allow-origins=*", `--user-data-dir=${profile}`,
    "--no-first-run", "--autoplay-policy=no-user-gesture-required", "--window-size=1280,800", "about:blank"], { stdio: "ignore" });
  let page;
  for (let i = 0; i < 60 && !page; i++) {
    try { page = (await (await fetch("http://127.0.0.1:9610/json")).json()).find(t => t.type === "page"); } catch {}
    if (!page) await sleep(250);
  }
  const ws = await connectWs(page.webSocketDebuggerUrl);
  const send = rpc(ws, (m) => {
    if (m.method === "Runtime.consoleAPICalled") logs.push(`${m.params.type} ${m.params.args.map(a => a.value ?? a.description ?? "").join(" ")}`);
    if (m.method === "Runtime.exceptionThrown") logs.push(`exception ${(m.params.exceptionDetails.exception?.description || "").split("\n")[0]}`);
  }, false);
  await send("Runtime.enable");
  await send("Page.enable");
  return {
    logs,
    navigate: async (url) => { await send("Page.navigate", { url }); await sleep(3000); },
    evaluate: async (expr) => {
      const r = await send("Runtime.evaluate", { expression: `JSON.stringify(${expr})`, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return JSON.parse(r.result.value ?? "null");
    },
    close: () => { try { ws.close(); } catch {} proc.kill(); },
  };
}

// Snapshot of the native player state, evaluated in the page
const SNAPSHOT = `(() => {
  const a = window.artInstance;
  const errorBox = [...document.querySelectorAll('#movie-artplayer-container, #series-artplayer-container')]
    .map(el => el.textContent || '').find(t => /Falha na reprodu|Stream nativo indispon/.test(t));
  const resolves = performance.getEntriesByType('resource').filter(e => e.name.includes('/api/resolve'));
  const last = resolves[resolves.length - 1];
  if (!a) return { mounted: false, error: errorBox || null, resolve: last ? { ms: Math.round(last.duration), timing: (last.serverTiming || []).map(t => t.name + '=' + Math.round(t.duration)).join(' ') } : null };
  let url = String(a.option.url);
  try { const inner = new URL(url).searchParams.get('url'); if (inner) url = inner; } catch (e) {}
  const q = a.setting && a.setting.find && a.setting.find('quality');
  return {
    mounted: true,
    t: a.video.currentTime, paused: a.video.paused, w: a.video.videoWidth, h: a.video.videoHeight,
    host: (() => { try { return new URL(url).host; } catch (e) { return url.slice(0, 40); } })(),
    menu: q ? q.selector.map(i => String(i.html).replace(/<[^>]+>/g, '').trim()) : null,
    error: errorBox || null,
    resolve: last ? { ms: Math.round(last.duration), timing: (last.serverTiming || []).map(t => t.name + '=' + Math.round(t.duration)).join(' ') } : null
  };
})()`;

async function waitForPlayback(b, startedAt) {
  let snap = null;
  while (Date.now() - startedAt < TIMEOUT_MS) {
    snap = await b.evaluate(SNAPSHOT);
    if (snap && snap.mounted && !snap.paused && snap.t > 0.3) return { ok: true, snap };
    if (snap && snap.error) return { ok: false, snap };
    await sleep(250);
  }
  return { ok: false, snap, timeout: true };
}

function qualityOf(w, h) {
  if (!h) return "?";
  const byW = w >= 1900 ? 1080 : w >= 1260 ? 720 : w >= 840 ? 480 : w >= 620 ? 360 : 240;
  const byH = h >= 1000 ? 1080 : h >= 700 ? 720 : h >= 460 ? 480 : h >= 340 ? 360 : 240;
  return Math.max(byW, byH) + "p";
}

async function main() {
  const b = await launchBrowser(browserName);
  const results = [];
  try {
    await b.navigate(BASE + "/");
    await b.evaluate("(window.TvzinhaActions.closeAdblockModal && window.TvzinhaActions.closeAdblockModal(), true)");

    for (const item of MATRIX) {
      if (only && !only.includes(item.key)) continue;
      if (!args.warm) await fetch(BASE + "/__dev/clear-cache").catch(() => {});
      const steps = item.type === "movie" ? [null] : item.episodes;
      for (const ep of steps) {
        b.logs.length = 0;
        await b.evaluate("(performance.clearResourceTimings(), true)");
        const label = ep ? `${item.name} T${item.season}E${ep}` : item.name;
        const startedAt = Date.now();
        if (item.type === "movie") {
          await b.evaluate("(window.TvzinhaActions.closeMovie && window.TvzinhaActions.closeMovie(), true)");
          await b.evaluate(`(window.TvzinhaActions.openMovie({ id: ${item.id}, title: ${JSON.stringify(item.name)}, backdrop_path: null, poster_path: null, overview: '' }, true), true)`);
        } else {
          if (ep === steps[0]) await b.evaluate("(window.TvzinhaActions.switchView('series'), true)");
          await b.evaluate(`(window.TvzinhaActions.playEpisode({ id: ${item.id}, name: ${JSON.stringify(item.name)}, backdrop_path: null, poster_path: null }, ${item.season}, ${ep}), true)`);
        }
        const r = await waitForPlayback(b, startedAt);
        const secs = (Date.now() - startedAt) / 1000;
        const failovers = b.logs.filter(l => /Fonte \d+ falhou/.test(l)).length;
        const errors = b.logs.filter(l => /^(error|exception)/.test(l)).length;
        const s = r.snap || {};
        const row = {
          title: label,
          result: r.ok ? "TOCOU" : (s.error ? "ERRO" : "TIMEOUT"),
          ttff_s: Math.round(secs * 10) / 10,
          resolve_ms: s.resolve ? s.resolve.ms : null,
          server_timing: s.resolve ? s.resolve.timing : "",
          host: s.host || "",
          quality: qualityOf(s.w, s.h),
          failovers,
          console_errors: errors,
          menu: s.menu ? s.menu.join(" | ") : "",
        };
        results.push(row);
        console.log(`${row.result.padEnd(7)} ${String(row.ttff_s).padStart(6)}s  ${row.quality.padEnd(5)} fo=${failovers} res=${row.resolve_ms ?? "-"}ms [${row.server_timing}]  ${row.host}  ${label}`);
        // Watch a little before switching episode, as a viewer would (lets the next-episode prefetch run)
        if (item.type === "serie" && r.ok) await sleep(WATCH_BEFORE_NEXT_MS);
      }
      if (item.type === "serie") await b.evaluate("(window.TvzinhaActions.stopSeries && window.TvzinhaActions.stopSeries(), true)").catch(() => {});
    }
  } finally {
    b.close();
  }

  const played = results.filter(r => r.result === "TOCOU").map(r => r.ttff_s).sort((x, y) => x - y);
  const median = played.length ? played[Math.floor(played.length / 2)] : null;
  console.log(`\n${browserName}: ${played.length}/${results.length} tocaram | TTFF mediana ${median}s | pior ${played[played.length - 1] ?? "-"}s`);
  if (args.out) writeFileSync(String(args.out), JSON.stringify({ browser: browserName, date: new Date().toISOString(), results }, null, 2));
}

main().catch(err => { console.error(err); process.exit(1); });
