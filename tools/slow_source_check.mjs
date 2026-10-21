/**
 * Checks the start monitor of the movie/series player when a source takes longer than its budget:
 *   1. slow connection (the whole browser throttled): the source keeps its turn, "Conexão lenta, carregando a fonte..."
 *   2. slow host on a fast connection: next source at the normal budget
 *   3. dead source (no data at all): next source at the normal budget
 *   4. data that stops mid-download: next source about 10 s after the last byte
 *
 *   node tools/slow_source_check.mjs [--browser=chrome|edge] [--only=1,3]   (chrome by default; throttling needs CDP)
 *
 * Needs `python tools/local_server.py` on 127.0.0.1:8787 and internet: the media is Mux's public HLS test stream.
 * The slow host is a throttling proxy started here on another port (the page's CSP is bypassed for it).
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:http";
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
const browserName = (process.argv.find(a => a.startsWith("--browser=")) || "--browser=chrome").split("=")[1];
const ONLY = ((process.argv.find(a => a.startsWith("--only=")) || "").split("=")[1] || "").split(",").filter(Boolean);
const runs = (n) => !ONLY.length || ONLY.includes(String(n));
const VERSION = readFileSync(new URL("../index.html", import.meta.url), "utf8").match(/main\.js\?v=([^"]+)/)[1];
const MUX = "https://test-streams.mux.dev/x36xhzz/";
const HLS = MUX + "x36xhzz.m3u8";
// Unroutable address: never answers
const DEAD_MP4 = "https://10.255.255.1/tvz-slow-check.mp4";
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = "") => { results.push(ok); console.log(`${ok ? "OK  " : "FAIL"} ${name}${detail ? " " + detail : ""}`); };

/**
 * Proxy to the Mux stream that sends every response at `bytesPerSecond` (a slow host). With `stopAfter`, the first
 * media segment stops after that many bytes and the connection stays open with nothing more (`server.stoppedAt`).
 */
function startSlowHost(bytesPerSecond, stopAfter = 0) {
  let stopUsed = false;
  const server = createServer(async (req, res) => {
    try {
      const upstream = await fetch(MUX + req.url.replace(/^\/+/, "").split("?")[0]);
      const body = Buffer.from(await upstream.arrayBuffer());
      res.writeHead(upstream.status, { "Content-Type": upstream.headers.get("content-type") || "application/octet-stream", "Access-Control-Allow-Origin": "*" });
      const chunk = Math.max(1024, Math.round(bytesPerSecond / 10));
      const stopsHere = stopAfter > 0 && !stopUsed && /\.ts$/.test(req.url.split("?")[0]);
      if (stopsHere) stopUsed = true;
      for (let i = 0; i < body.length; i += chunk) {
        if (res.destroyed) return;
        if (stopsHere && i >= stopAfter) {
          server.stoppedAt = Date.now();
          return;
        }
        res.write(body.subarray(i, i + chunk));
        await sleep(100);
      }
      res.end();
    } catch {
      try { res.destroy(); } catch {}
    }
  });
  return new Promise(resolve => server.listen(0, "127.0.0.1", () => resolve(server)));
}

async function launch() {
  const profile = tempDir(join(tmpdir(), "tvz-slow-"));
  const port = 9500 + Math.floor(Math.random() * 90);
  const proc = spawn(browserName === "edge" ? EDGE : CHROME, ["--headless=new", `--remote-debugging-port=${port}`, "--remote-allow-origins=*",
    `--user-data-dir=${profile}`, "--no-first-run", "--mute-audio", "--autoplay-policy=no-user-gesture-required", "--window-size=1280,800", "about:blank"], { stdio: "ignore" });
  let page;
  for (let i = 0; i < 80 && !page; i++) {
    try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === "page"); } catch {}
    if (!page) await sleep(250);
  }
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0;
  const pending = new Map();
  const logs = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); return; }
    if (m.method === "Runtime.consoleAPICalled") {
      const text = m.params.args.map(a => a.value ?? a.description ?? "").join(" ");
      if (text.includes("[PlayerEngine]")) logs.push({ at: Date.now(), text });
    }
  };
  const send = (method, params = {}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expr) => {
    const r = await send("Runtime.evaluate", { expression: `(async () => JSON.stringify(await (${expr})))()`, awaitPromise: true, returnByValue: true, userGesture: true });
    if (r && r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r && r.result && typeof r.result.value === "string" ? JSON.parse(r.result.value) : null;
  };
  await send("Runtime.enable");
  await send("Page.enable");
  await send("Network.enable");
  await send("Network.setCacheDisabled", { cacheDisabled: true });
  // Catalog images would compete with the stream for the throttled bandwidth and make the timings noisy
  await send("Network.setBlockedURLs", { urls: ["*image.tmdb.org*"] });
  await send("Page.setBypassCSP", { enabled: true });
  return {
    send, evaluate, logs,
    throttle: (kbps) => send("Network.emulateNetworkConditions", { offline: false, latency: 100, downloadThroughput: kbps * 1024 / 8, uploadThroughput: 250 * 1024 / 8 }),
    offline: () => send("Network.emulateNetworkConditions", { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 }),
    close: () => { try { ws.close(); } catch {} try { spawnSync("taskkill", ["/PID", String(proc.pid), "/T", "/F"], { stdio: "ignore" }); } catch {} },
  };
}

/** App started and libraries loaded (downloaded under the current network conditions), a test stage on top. */
async function prepare(b) {
  await b.send("Page.navigate", { url: BASE + "/" });
  for (let i = 0; i < 480; i++) {
    if (await b.evaluate("Boolean(window.TvzinhaActions) && document.body.getAttribute('data-app-view') === 'home'").catch(() => false)) break;
    await sleep(250);
  }
  for (let i = 0; i < 3; i++) {
    const ok = await b.evaluate(`import('/assets/js/player/engine.js?v=${VERSION}').then(m => { window.__engine = m; return m.ensurePlayerLibs(); }).then(() => true)`).catch(() => false);
    if (ok) break;
    await sleep(1000);
  }
  await b.evaluate(`(() => { const s = document.createElement('div'); s.id = 'tvz-slow-stage';
    s.style.cssText = 'position:fixed;left:0;top:0;width:640px;height:360px;z-index:99999;'; document.body.appendChild(s); return true; })()`);
}

const mount = (b, sources) => b.evaluate(`(window.__allFailed = false, window.__engine.mountNativePlayer({ containerId: 'tvz-slow-stage', title: 'Teste',
  sources: ${JSON.stringify(sources)}, onAllFailed: () => { window.__allFailed = true; } }), true)`);
const PLAYING = "Boolean(window.artInstance && window.artInstance.video && window.artInstance.video.currentTime > 0.3)";

/** Waits until the stage plays, every source failed, or `timeoutMs`; returns { playing, allFailed, ms, slowNote }. */
async function watch(b, timeoutMs) {
  const t0 = Date.now();
  let slowNote = false;
  while (Date.now() - t0 < timeoutMs) {
    const s = await b.evaluate(`({ playing: ${PLAYING}, allFailed: window.__allFailed,
      note: /Conexão lenta, carregando a fonte/.test(document.getElementById('tvz-slow-stage')?.textContent || '') })`).catch(() => null);
    if (s && s.note) slowNote = true;
    if (s && (s.playing || s.allFailed)) return { ...s, ms: Date.now() - t0, slowNote };
    await sleep(250);
  }
  return { playing: false, allFailed: false, ms: Date.now() - t0, slowNote };
}

// One line per failover ("Fonte N falhou (...)"), with the seconds since `since`
const failovers = (b, since) => b.logs.filter(l => l.at >= since && /falhou/.test(l.text)).map(l => ({ s: Math.round((l.at - since) / 1000), text: l.text.slice(0, 100) }));
const verdicts = (b, since) => b.logs.filter(l => l.at >= since && /KB\/s/.test(l.text)).map(l => l.text.replace("[PlayerEngine] ", "").slice(0, 150));
const show = (list) => list.map(f => typeof f === "string" ? f : `${f.s}s ${f.text}`).join(" | ");

console.log(`slow source start monitor, ${browserName}, version ${VERSION}`);

// 1. Slow connection (~400 kbps, the whole browser): hls.js starts on the stream's first variant (720p, ~2.6 MB
// segments), so the first segment takes ~50 s, far over the 12 s HLS budget, at the speed of the connection itself
if (runs(1)) {
  const b = await launch();
  try {
    await b.throttle(400);
    await prepare(b);
    const t0 = Date.now();
    await mount(b, [{ url: HLS, type: "hls" }, { url: HLS + "?alt=2", type: "hls" }]);
    const r = await watch(b, 120000);
    const fo = failovers(b, t0);
    check("slow connection: the first source plays without failing over", r.playing && fo.length === 0, `${(r.ms / 1000).toFixed(1)} s ${show(fo)}`);
    check("slow connection: it took longer than the 12 s budget (the case this fixes)", r.ms > 12000, `${(r.ms / 1000).toFixed(1)} s`);
    check("slow connection: 'Conexão lenta, carregando a fonte...' was shown", r.slowNote, show(verdicts(b, t0)));
  } finally { b.close(); }
}

// 2. Slow host (~40 KB/s) on a fast connection: not worth waiting for, the next source plays
if (runs(2)) {
  const slow = await startSlowHost(40 * 1024);
  const b = await launch();
  try {
    await prepare(b);
    const t0 = Date.now();
    await mount(b, [{ url: `http://127.0.0.1:${slow.address().port}/x36xhzz.m3u8`, type: "hls" }, { url: HLS, type: "hls" }]);
    const r = await watch(b, 60000);
    const fo = failovers(b, t0);
    check("slow host: fails over at the 12 s budget and the next source plays", r.playing && fo.length === 1 && fo[0].s <= 14, `${show(fo)} | ${show(verdicts(b, t0))}`);
  } finally { b.close(); slow.close(); }
}

// 3. A source with no data at all still fails over at its budget, and the next one plays
if (runs(3)) {
  const b = await launch();
  try {
    await prepare(b);
    const t0 = Date.now();
    await mount(b, [{ url: DEAD_MP4, type: "mp4" }, { url: HLS, type: "hls" }]);
    const r = await watch(b, 60000);
    const fo = failovers(b, t0);
    check("dead source: fails over within its 20 s budget and the next one plays", r.playing && fo.length === 1 && fo[0].s <= 21, show(fo));
  } finally { b.close(); }
}

// 4. Data that stops mid-download (slow connection, host goes silent after ~900 KB of the first segment):
// next source about 10 s after the last byte, not at the 90 s cap
if (runs(4)) {
  // Sent slightly under the throttled speed, so the last byte sent is also about the last byte received
  const stalling = await startSlowHost(45 * 1024, 900 * 1024);
  const b = await launch();
  try {
    await b.throttle(400);
    await prepare(b);
    const t0 = Date.now();
    await mount(b, [{ url: `http://127.0.0.1:${stalling.address().port}/x36xhzz.m3u8`, type: "hls" }, { url: HLS, type: "hls" }]);
    for (let i = 0; i < 120 && !stalling.stoppedAt; i++) await sleep(500);
    await sleep(15000);
    const cut = stalling.stoppedAt ? Math.round((stalling.stoppedAt - t0) / 1000) : null;
    const fo = failovers(b, t0);
    check("data stops: fails over ~10 s after the last byte (not at the 90 s cap)", cut !== null && cut > 12 && fo.length >= 1 && fo[0].s >= cut && fo[0].s - cut <= 12,
      `last byte sent at ${cut} s; ${show(fo)} | ${show(verdicts(b, t0))}`);
  } finally { b.close(); stalling.close(); }
}

const failedCount = results.filter(ok => !ok).length;
console.log(`\n${results.length - failedCount}/${results.length} passed`);
process.exit(failedCount ? 1 : 0);
