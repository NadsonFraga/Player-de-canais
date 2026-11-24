import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9760;
const profile = mkdtempSync(join(tmpdir(), "tvz-diag-"));
const proc = spawn(CHROME, [
  "--headless=new",
  `--remote-debugging-port=${PORT}`,
  "--remote-allow-origins=*",
  `--user-data-dir=${profile}`,
  "--no-first-run",
  "--mute-audio",
  "--window-size=1280,800",
  "about:blank"
], { stdio: "ignore" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const isLocal = process.argv.includes("--local");
const BASE_URL = isLocal ? "http://127.0.0.1:8787" : "https://staging.tvzinhaonline.pages.dev";

async function main() {
  let page;
  for (let i = 0; i < 40 && !page; i++) {
    try {
      page = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === "page");
    } catch {}
    if (!page) await sleep(250);
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let nextId = 0;
  const pending = new Map();
  const networkLogs = [];
  const requestUrls = new Map();
  const consoleLogs = [];

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.method === "Network.requestWillBeSent") {
      requestUrls.set(msg.params.requestId, msg.params.request.url);
    }
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
    } else if (msg.method === "Network.responseReceived") {
      const { response } = msg.params;
      if (response.status >= 400 || response.url.includes("resolve") || response.url.includes("stream") || response.url.includes("m3u8") || response.url.includes("txt") || response.url.includes("woff") || response.url.includes("fenix")) {
        networkLogs.push(`[HTTP ${response.status}] ${response.url.slice(0, 120)}`);
      }
    } else if (msg.method === "Network.loadingFailed") {
      const failedUrl = requestUrls.get(msg.params.requestId) || msg.params.requestId;
      networkLogs.push(`[FAILED] ${msg.params.errorText} on ${failedUrl}`);
    } else if (msg.method === "Runtime.consoleAPICalled") {
      const text = msg.params.args.map(a => a.value ?? a.description ?? "").join(" ");
      consoleLogs.push(`[${msg.params.type}] ${text.slice(0, 200)}`);
    }
  };

  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const id = ++nextId;
      pending.set(id, { res, rej });
      ws.send(JSON.stringify({ id, method, params }));
    });

  await send("Network.enable");
  await send("Page.enable");
  await send("Runtime.enable");

  console.log(`=== TEST 1: Open Canais -> SporTV on ${BASE_URL} ===`);
  await send("Page.navigate", { url: `${BASE_URL}/` });
  await sleep(4000);

  // Click on "Canais" tab, then click SporTV
  await send("Runtime.evaluate", {
    expression: `(() => {
      const tvTab = document.querySelector('[data-view="tv"]') || document.getElementById('nav-tab-tv');
      if (tvTab) tvTab.click();
    })()`
  });
  await sleep(3000);

  const foundCh = await send("Runtime.evaluate", {
    expression: `(() => {
      const ch = Array.from(document.querySelectorAll('.channel-card-16x9, .channel-card, .tv-channel-item')).find(c => c.innerText.includes('SporTV'));
      if (ch) ch.click();
      return Boolean(ch);
    })()`,
    returnByValue: true
  });
  console.log("Found SporTV:", foundCh.result.value);
  await sleep(6000);

  const tvState = await send("Runtime.evaluate", {
    expression: `(() => {
      const overlay = document.querySelector('.channel-direct-error-overlay');
      const video = document.querySelector('video');
      const art = document.querySelector('.art-video-player');
      const iframe = document.getElementById('stream-iframe');
      return {
        hasOverlay: Boolean(overlay),
        overlayText: overlay ? overlay.innerText.slice(0, 150) : null,
        hasVideo: Boolean(video),
        videoSrc: video ? video.src : null,
        iframeSrc: iframe ? iframe.src : null,
        iframeHidden: iframe ? iframe.classList.contains('hidden') : null
      };
    })()`,
    returnByValue: true
  });
  console.log("TvState:", tvState.result.value);

  console.log(`\n=== TEST 2: Open Movie -> Fight Club (550) on ${BASE_URL} ===`);
  await send("Page.navigate", { url: `${BASE_URL}/?filme=550` });
  await sleep(3000);

  await send("Runtime.evaluate", {
    expression: `(() => {
      const btn = document.getElementById('btn-title-play');
      if (btn) btn.click();
    })()`
  });
  await sleep(6000);

  console.log("Switching to Fenix Player (Dual Áudio) ...");
  await send("Runtime.evaluate", {
    expression: `(() => {
      const fenixBtn = Array.from(document.querySelectorAll('.btn-movie-server')).find(b => b.innerText.includes('Fenix'));
      if (fenixBtn) fenixBtn.click();
      return Boolean(fenixBtn);
    })()`
  });
  await sleep(7000);

  const movieState = await send("Runtime.evaluate", {
    expression: `(() => {
      const art = document.querySelector('.art-video-player');
      const video = document.querySelector('#movie-player-container video, .art-video-player video');
      const errOverlay = document.querySelector('.tvz-player-error-overlay, .error-overlay-title, .art-error');
      const notice = document.querySelector('.art-notice');
      const serverBtns = Array.from(document.querySelectorAll('.btn-movie-server')).map(b => ({
        text: b.innerText,
        active: b.classList.contains('active')
      }));
      return {
        hasArt: Boolean(art),
        videoSrc: video ? video.src : null,
        videoReadyState: video ? video.readyState : null,
        hasError: Boolean(errOverlay),
        errorText: errOverlay ? errOverlay.innerText.slice(0, 150) : null,
        noticeText: notice ? notice.innerText : null,
        serverBtns
      };
    })()`,
    returnByValue: true
  });
  console.log("MovieState after switching to Fenix:", movieState.result.value);

  console.log("\n=== Recent Console Logs ===");
  console.log(consoleLogs.slice(-25).join("\n"));

  console.log("\n=== Recent Network Logs ===");
  console.log(networkLogs.slice(-25).join("\n"));

  ws.close();
  try { spawnSync("taskkill", ["/PID", String(proc.pid), "/T", "/F"], { stdio: "ignore" }); } catch {}
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}

main().catch((e) => {
  console.error("Diagnosis error:", e);
  try { spawnSync("taskkill", ["/PID", String(proc.pid), "/T", "/F"], { stdio: "ignore" }); } catch {}
});
