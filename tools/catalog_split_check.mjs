/**
 * Checks where animated shows land: anime (Japan, Korea, China) in the Animes tab, western animation (Rick and
 * Morty, The Simpsons) in the Séries tab, and how each opens in the player.
 *
 *   node tools/catalog_split_check.mjs [--browser=chrome|edge|firefox]   (chrome by default)
 *
 * Needs `python tools/local_server.py` on 127.0.0.1:8787. Uses the real search box and genre chip of each tab
 * (TMDB answers), then opens Rick e Morty T1E1 and One Piece T1E1 (one real resolve each, cached by the server).
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
  const profile = mkdtempSync(join(tmpdir(), `tvz-split-${name}-`));
  const port = 9900 + Math.floor(Math.random() * 40);
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

/** Titles on a tab's explore grid after typing `query` (or clicking the genre chip when `genre` is given). */
const gridTitles = (tab, { query = "", genre = "" }) => `(async () => {
  window.TvzinhaActions.switchView('${tab}');
  await new Promise(r => setTimeout(r, 1200));
  document.getElementById('${tab}-search-container').click();
  const grid = document.getElementById('${tab}-explore-poster-grid');
  const titles = () => [...grid.querySelectorAll('img')].map(i => i.alt).filter(Boolean);
  const settled = () => !grid.querySelector('.explore-loading-placeholder') && (titles().length || grid.querySelector('.explore-empty-state'));
  // Let the default catalog finish first: requests are not cancelled, so a late one would repaint the grid
  for (let i = 0; i < 40 && !settled(); i++) await new Promise(r => setTimeout(r, 250));
  await new Promise(r => setTimeout(r, 600));
  grid.innerHTML = '';
  const input = document.getElementById('${tab}-explore-search-input');
  input.value = ${JSON.stringify(query)};
  input.dispatchEvent(new Event('input', { bubbles: true }));
  ${genre ? `document.querySelector('#${tab}-explore-genres-chips [data-genre="${genre}"]').click();` : ""}
  // The search runs 320 ms after typing; wait for its title ("Resultados para ...") or the chip's filter tag
  const sectionTitle = document.getElementById('${tab}-explore-section-title');
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 300));
    const ours = ${query ? `sectionTitle.textContent.includes(${JSON.stringify(query)})` : "true"};
    if (ours && settled()) break;
  }
  const out = titles();
  document.getElementById('btn-${tab}-explore-back')?.click();
  return out;
})()`;

/** Opens an episode and returns the servers offered and whether the main player started. */
const openShow = (id, name) => `(async () => {
  window.__s.openEpisode({ id: ${id}, name: ${JSON.stringify(name)} }, { season: 1, episode: 1 });
  const headerNow = () => (document.getElementById('series-player-current-ep') || {}).textContent || '';
  for (let i = 0; i < 80 && !(headerNow().startsWith(${JSON.stringify(name)}) && document.querySelector('[data-server="native_direct"]')); i++) {
    await new Promise(r => setTimeout(r, 250));
  }
  await new Promise(r => setTimeout(r, 500));
  const servers = [...document.querySelectorAll('[data-server]')].map(b => b.dataset.server);
  document.querySelector('[data-server="native_direct"]')?.click();
  let started = false;
  for (let i = 0; i < 160 && !started; i++) {
    await new Promise(r => setTimeout(r, 250));
    started = Boolean(window.artInstance && window.artInstance.video && window.artInstance.video.readyState >= 2);
  }
  if (window.artInstance) window.artInstance.pause();
  const header = (document.getElementById('series-player-current-ep') || {}).textContent || '';
  window.__s.stopSeriesPlayer(); window.TvzinhaActions.closeTitle();
  await new Promise(r => setTimeout(r, 600));
  return { servers: [...new Set(servers)], started, header };
})()`;

const b = await launch(browserName);
try {
  await b.navigate(BASE + "/");
  for (let i = 0; i < 120; i++) {
    if (await b.evaluate("Boolean(window.TvzinhaActions && window.TvzinhaActions.store)").catch(() => false)) break;
    await sleep(250);
  }
  await sleep(1500);
  await b.evaluate("(window.TvzinhaActions.closeAdblockModal && window.TvzinhaActions.closeAdblockModal(), true)").catch(() => {});
  await b.evaluate(`import('/assets/js/modules/series.js?v=${VERSION}').then(m => { window.__s = m; return true; })`);

  console.log(`== ${browserName}: search`);
  const seriesRick = await b.evaluate(gridTitles("series", { query: "rick and morty" }));
  check("Séries search 'rick and morty' finds Rick e Morty", seriesRick.some(t => /Rick e Morty|Rick and Morty/i.test(t)), JSON.stringify(seriesRick.slice(0, 4)));
  const animesRick = await b.evaluate(gridTitles("animes", { query: "rick and morty" }));
  check("Animes search 'rick and morty' does not list Rick e Morty", !animesRick.some(t => /^Rick e Morty$|^Rick and Morty$/i.test(t)), JSON.stringify(animesRick.slice(0, 4)));
  const seriesOnePiece = await b.evaluate(gridTitles("series", { query: "one piece" }));
  check("Séries search 'one piece' does not list the anime", !seriesOnePiece.some(t => /^One Piece$/i.test(t)), JSON.stringify(seriesOnePiece.slice(0, 4)));
  const animesOnePiece = await b.evaluate(gridTitles("animes", { query: "one piece" }));
  check("Animes search 'one piece' lists the anime", animesOnePiece.some(t => /^One Piece$/i.test(t)), JSON.stringify(animesOnePiece.slice(0, 4)));
  const seriesBreaking = await b.evaluate(gridTitles("series", { query: "breaking bad" }));
  check("Séries search 'breaking bad' unchanged", seriesBreaking.some(t => /Breaking Bad/i.test(t)));

  console.log(`\n== ${browserName}: Séries "Animação" chip`);
  const chip = await b.evaluate(gridTitles("series", { genre: "16" }));
  console.log("   first cards:", JSON.stringify(chip.slice(0, 8)));
  check("the chip lists western animation, about a full page (was always empty)", chip.length >= 14 && chip.some(t => /Simpsons|Rick e Morty|Family Guy|Uma Família da Pesada|South Park|Bob/i.test(t)), `${chip.length} cards`);
  check("the chip lists no Japanese anime", !chip.some(t => /^(One Piece|Naruto|Dragon Ball|Jujutsu Kaisen|Demon Slayer|Attack on Titan|Shingeki)/i.test(t)));

  console.log(`\n== ${browserName}: player`);
  const rick = await b.evaluate(openShow(60625, "Rick e Morty"));
  console.log("   Rick e Morty:", JSON.stringify(rick));
  check("Rick e Morty opens as a series: no anime server", rick.servers.includes("native_direct") && !rick.servers.includes("native_anime"));
  check("Rick e Morty T1E1 starts on the main player", rick.started, rick.header);
  const onePiece = await b.evaluate(openShow(37854, "One Piece"));
  console.log("   One Piece:", JSON.stringify(onePiece));
  check("One Piece still offers the anime server", onePiece.servers.includes("native_anime"));
} finally {
  b.close();
}

const failed = results.filter(ok => !ok).length;
console.log(failed ? `\n${failed} check(s) failed` : "\nAll checks passed");
process.exit(failed ? 1 : 0);
