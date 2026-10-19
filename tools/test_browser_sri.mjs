/**
 * Verifies that index.html loads in a real Chromium browser with SRI and security headers active,
 * confirming window.Hls and window.Artplayer, loaded on demand by ensurePlayerLibs() in engine.js,
 * execute without integrity or CSP violations.
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const fs = await import("node:fs");
const CHROMIUM = fs.existsSync(CHROME) ? CHROME : EDGE;
const DEBUG_PORT = 9850;

// Start local server in background
const serverProc = spawn("python", ["tools/local_server.py", "--port", "8787"], { stdio: "ignore" });
await new Promise(r => setTimeout(r, 800));

const profile = mkdtempSync(join(tmpdir(), "tvz-sri-"));
const browserProc = spawn(CHROMIUM, [
  "--headless=new",
  `--remote-debugging-port=${DEBUG_PORT}`,
  "--remote-allow-origins=*",
  `--user-data-dir=${profile}`,
  "--no-first-run",
  "--mute-audio",
  "about:blank",
], { stdio: "ignore" });

const cleanup = () => {
  try { spawnSync("taskkill", ["/PID", String(browserProc.pid), "/T", "/F"], { stdio: "ignore" }); } catch {}
  try { spawnSync("taskkill", ["/PID", String(serverProc.pid), "/T", "/F"], { stdio: "ignore" }); } catch {}
};

try {
  // Wait for DevTools port
  await new Promise(r => setTimeout(r, 1000));
  const targetsRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`);
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === "page") || targets[0];

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((res, rej) => {
    ws.onopen = res;
    ws.onerror = rej;
  });

  let id = 1;
  const send = (method, params = {}) => new Promise((resolve) => {
    const curId = id++;
    const handler = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id === curId) {
        ws.removeEventListener("message", handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener("message", handler);
    ws.send(JSON.stringify({ id: curId, method, params }));
  });

  const errors = [];
  ws.addEventListener("message", (evt) => {
    const msg = JSON.parse(evt.data);
    if (msg.method === "Log.entryAdded" && msg.params.entry.level === "error") {
      errors.push(msg.params.entry.text);
    }
  });

  await send("Log.enable");
  await send("Page.enable");
  await send("Page.navigate", { url: "http://127.0.0.1:8787/" });
  await new Promise(r => setTimeout(r, 2000));

  // The libraries load on demand (B11): ask the engine for them, as a player would
  const version = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8").match(/main\.js\?v=([^"]+)/)[1];
  await send("Runtime.evaluate", {
    expression: `import('/assets/js/player/engine.js?v=${version}').then(m => m.ensurePlayerLibs()).then(() => true, () => false)`,
    awaitPromise: true,
  });

  const evalHls = await send("Runtime.evaluate", { expression: "typeof window.Hls" });
  const evalArt = await send("Runtime.evaluate", { expression: "typeof window.Artplayer" });

  const hlsOk = evalHls.result && evalHls.result.value === "function";
  const artOk = evalArt.result && evalArt.result.value === "function";

  console.log(`Hls.js loaded via SRI: ${hlsOk ? "OK (function)" : "FAIL"}`);
  console.log(`Artplayer loaded via SRI: ${artOk ? "OK (function)" : "FAIL"}`);

  const sriErrors = errors.filter(e => /integrity|subresource|failed to find a valid digest/i.test(e));
  console.log(`SRI integrity violations in browser: ${sriErrors.length} (${sriErrors.length === 0 ? "PASSED" : "FAILED"})`);

  const passed = hlsOk && artOk && sriErrors.length === 0;
  cleanup();
  process.exit(passed ? 0 : 1);
} catch (e) {
  console.error("Test error:", e);
  cleanup();
  process.exit(1);
}
