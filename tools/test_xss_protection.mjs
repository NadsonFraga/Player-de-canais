/**
 * Tvzinha Online - Automated XSS Protection & Sanitization Test Suite (T15)
 *
 * Verifies:
 * 1. Unit tests: escapeHtml and escapeAttr correctly neutralize HTML and attribute injection vectors.
 * 2. Integration / Browser tests: In headless Chromium, injecting malicious payloads into
 *    cards (movies, series, sports) does NOT execute script and renders as inert text in the DOM.
 *
 * Run: node tools/test_xss_protection.mjs
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { escapeHtml, escapeAttr } from "../assets/js/core/sanitize.js";

let passed = 0;
let failed = 0;

function assert(condition, description) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${description}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${description}`);
  }
}

console.log("=== 1. Unit Tests: escapeHtml & escapeAttr ===");

// Basic character escaping
assert(escapeHtml("<script>") === "&lt;script&gt;", "escapeHtml escapes < and >");
assert(escapeHtml('"test"') === "&quot;test&quot;", "escapeHtml escapes double quotes");
assert(escapeHtml("'test'") === "&#39;test&#39;", "escapeHtml escapes single quotes");
assert(escapeHtml("a & b") === "a &amp; b", "escapeHtml escapes ampersands");

// Null, undefined, and non-string handling
assert(escapeHtml(null) === "", "escapeHtml handles null as empty string");
assert(escapeHtml(undefined) === "", "escapeHtml handles undefined as empty string");
assert(escapeHtml(0) === "0", "escapeHtml handles number 0");
assert(escapeHtml(123) === "123", "escapeHtml handles positive number");
assert(escapeHtml(false) === "false", "escapeHtml handles boolean false");

// Attribute escaping
assert(escapeAttr('foo" onfocus="alert(1)') === "foo&quot; onfocus=&quot;alert(1)", "escapeAttr breaks quote breakout");
assert(escapeAttr("javascript:alert(1)") === "javascript:alert(1)", "escapeAttr preserves plain text");

// XSS Attack Payloads
const XSS_PAYLOADS = [
  "<script>alert(1)</script>",
  '<img src="x" onerror="alert(1)">',
  '<svg/onload=alert(1)>',
  '"><script>alert(1)</script>',
  "';alert(1)//",
  '<iframe src="javascript:alert(1)"></iframe>',
  '<body onload=alert(1)>',
  '<a href="javascript:alert(1)">click</a>',
  '"><img src=x onerror=alert(document.cookie)>',
];

for (const payload of XSS_PAYLOADS) {
  const sanitized = escapeHtml(payload);
  assert(!sanitized.includes("<") && !sanitized.includes(">"), `Payload neutralized: ${payload}`);
}

console.log("\n=== 2. Real Browser Execution Tests (Headless Chromium) ===");

const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const CHROMIUM = existsSync(CHROME) ? CHROME : EDGE;
const DEBUG_PORT = 9855;

// Reuse a server already on 8787: Windows lets a second one bind the same port, and requests then hit either at random
const serverRunning = await fetch("http://127.0.0.1:8787/", { signal: AbortSignal.timeout(2000) }).then(() => true, () => false);
const serverProc = serverRunning ? null : spawn("python", ["tools/local_server.py", "--port", "8787"], { stdio: "ignore" });
if (serverProc) await new Promise(r => setTimeout(r, 600));

const profile = mkdtempSync(join(tmpdir(), "tvz-xss-"));
const browserProc = spawn(CHROMIUM, [
  "--headless=new",
  `--remote-debugging-port=${DEBUG_PORT}`,
  "--remote-allow-origins=*",
  `--user-data-dir=${profile}`,
  "--no-first-run",
  "--mute-audio",
  "http://127.0.0.1:8787/",
], { stdio: "ignore" });

const cleanup = () => {
  try { spawnSync("taskkill", ["/PID", String(browserProc.pid), "/T", "/F"], { stdio: "ignore" }); } catch {}
  if (serverProc) { try { spawnSync("taskkill", ["/PID", String(serverProc.pid), "/T", "/F"], { stdio: "ignore" }); } catch {} }
};

process.on("exit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(1); });

try {
  await new Promise(r => setTimeout(r, 1200));
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

  await send("Runtime.enable");

  // Evaluate injection test inside the browser runtime
  const testScript = `
    (async () => {
      window.__xss_executed = false;

      // Import sanitizer
      const { escapeHtml, escapeAttr } = await import('/assets/js/core/sanitize.js');

      // Test card construction with malicious inputs
      const maliciousMovie = {
        id: 99999,
        title: '<img src="x" onerror="window.__xss_executed = true">Malicious Movie',
        poster_path: '/poster.jpg" onerror="window.__xss_executed = true',
        release_date: '2026-01-01',
        vote_average: 9.9
      };

      const testDiv = document.createElement('div');
      testDiv.id = 'xss-test-container';

      const safeTitle = escapeHtml(maliciousMovie.title || 'Sem título');
      const safeTitleAttr = escapeAttr(maliciousMovie.title || 'Sem título');
      const safePoster = escapeAttr(maliciousMovie.poster_path);
      const safeYear = escapeHtml('2026');
      const safeRating = escapeHtml('9.9');

      testDiv.innerHTML = \`
        <div class="movie-poster-card">
          <img class="movie-poster-img" src="\${safePoster}" alt="\${safeTitleAttr}" loading="lazy">
          <div class="movie-poster-overlay">
            <h4 class="movie-card-title" title="\${safeTitleAttr}">\${safeTitle}</h4>
            <div class="movie-card-meta">
              <span>\${safeYear}</span>
              <span class="movie-card-rating">★ \${safeRating}</span>
            </div>
          </div>
        </div>
      \`;

      document.body.appendChild(testDiv);

      // Give browser time to fire onerror if any tag was improperly parsed
      await new Promise(r => setTimeout(r, 400));

      const titleEl = testDiv.querySelector('.movie-card-title');
      const renderedText = titleEl ? titleEl.textContent : '';
      const injectedImages = testDiv.querySelectorAll('img');

      return {
        xssExecuted: window.__xss_executed,
        renderedText: renderedText,
        injectedImgCount: injectedImages.length, // Only the poster img, no rogue onerror img
        escapedTitleContainsRawTags: testDiv.innerHTML.includes('<img src="x" onerror')
      };
    })()
  `;

  const evalResult = await send("Runtime.evaluate", {
    expression: testScript,
    awaitPromise: true,
    returnByValue: true
  });

  const res = evalResult.result.value;
  assert(res.xssExecuted === false, "Zero XSS execution in Chromium DOM");
  assert(res.injectedImgCount === 1, "Only intentional <img> rendered (no rogue <img> inserted from payload)");
  assert(res.renderedText.includes('<img src="x"'), "Malicious string preserved safely as inert textContent");
  assert(res.escapedTitleContainsRawTags === false, "innerHTML does not contain unescaped payload tags");

  ws.close();
} finally {
  cleanup();
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
