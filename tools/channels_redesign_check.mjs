/**
 * Verification test for Phase 3: Channels Redesign.
 *
 *   node tools/channels_redesign_check.mjs [--browser=chrome|edge]
 *
 * Requires `python tools/local_server.py` running on 127.0.0.1:8787.
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = "http://127.0.0.1:8787";
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const browserName = (process.argv.find(a => a.startsWith("--browser=")) || "--browser=chrome").split("=")[1];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = "") => {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? " - " + detail : ""}`);
};

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

function rpc(ws) {
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
    }
  };
  return (method, params = {}) => new Promise((res, rej) => {
    const mid = ++id;
    pending.set(mid, { res, rej });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}

async function launch(name) {
  const profile = mkdtempSync(join(tmpdir(), `tvz-chan-check-${name}-`));
  const port = 9740 + Math.floor(Math.random() * 40);
  const proc = spawn(name === "edge" ? EDGE : CHROME, [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    "--remote-allow-origins=*",
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--mute-audio",
    "--autoplay-policy=no-user-gesture-required",
    "--window-size=1280,800",
    "about:blank"
  ], { stdio: "ignore" });

  let page;
  for (let i = 0; i < 80 && !page; i++) {
    try { page = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find(t => t.type === "page"); } catch {}
    if (!page) await sleep(250);
  }
  const ws = await connectWs(page.webSocketDebuggerUrl);
  const send = rpc(ws);
  await send("Runtime.enable");
  await send("Page.enable");

  const errors = [];
  ws.addEventListener("message", (ev) => {
    try {
      const data = JSON.parse(ev.data);
      if (data.method === "Runtime.exceptionThrown") {
        errors.push(data.params.exceptionDetails?.exception?.description || data.params.exceptionDetails?.text);
      }
    } catch {}
  });

  return {
    navigate: async (url) => { await send("Page.navigate", { url }); await sleep(2500); },
    evaluate: async (expr) => {
      const r = await send("Runtime.evaluate", {
        expression: `(async () => JSON.stringify(await (${expr})))()`,
        awaitPromise: true,
        returnByValue: true,
        userGesture: true
      });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return JSON.parse(r.result.value ?? "null");
    },
    errors,
    close: () => {
      try { ws.close(); } catch {}
      try { spawnSync("taskkill", ["/PID", String(proc.pid), "/T", "/F"], { stdio: "ignore" }); } catch {}
    }
  };
}

async function main() {
  console.log(`Starting Channels Redesign check with ${browserName}...`);
  const browser = await launch(browserName);

  try {
    await browser.navigate(`${BASE}/#tv`);

    // Resilient wait for app initialization and channel cards render
    await browser.evaluate(`(async () => {
      for (let i = 0; i < 50; i++) {
        if (document.querySelectorAll('.channel-card-16x9').length > 0) return true;
        const tabTv = document.getElementById('nav-tab-tv');
        if (tabTv) tabTv.click();
        await new Promise(r => setTimeout(r, 200));
      }
      return false;
    })()`);

    // 1. Check #channels-hero
    const heroInfo = await browser.evaluate(`(() => {
      const hero = document.getElementById('channels-hero');
      const title = document.getElementById('channels-hero-title');
      const meta = document.getElementById('channels-hero-meta');
      const watchBtn = document.getElementById('btn-channels-hero-watch');
      const drawerBtn = document.getElementById('btn-channels-hero-drawer');
      return {
        exists: Boolean(hero),
        visible: hero ? !hero.classList.contains('hidden') : false,
        titleText: title ? title.textContent.trim() : '',
        metaText: meta ? meta.textContent.trim() : '',
        hasWatchBtn: Boolean(watchBtn),
        hasDrawerBtn: Boolean(drawerBtn)
      };
    })()`);
    check("Channels Hero is present and populated", heroInfo.exists && heroInfo.titleText.length > 0 && heroInfo.hasWatchBtn && heroInfo.hasDrawerBtn, `Title: "${heroInfo.titleText}", Meta: "${heroInfo.metaText}"`);

    // 2. Check #channels-nav-toolbar
    const toolbarInfo = await browser.evaluate(`(() => {
      const tb = document.getElementById('channels-nav-toolbar');
      const pills = document.querySelectorAll('.channel-cat-pill');
      const search = document.getElementById('channels-spotlight-input');
      const drawerBtn = document.getElementById('btn-toolbar-open-drawer');
      return {
        exists: Boolean(tb),
        pillCount: pills.length,
        hasSearch: Boolean(search),
        hasDrawerBtn: Boolean(drawerBtn)
      };
    })()`);
    check("Channels sticky toolbar with category pills, search and quick drawer button", toolbarInfo.exists && toolbarInfo.pillCount >= 5 && toolbarInfo.hasSearch && toolbarInfo.hasDrawerBtn, `Pills: ${toolbarInfo.pillCount}`);

    // 3. Check Discovery Feed & Category Rows
    const feedInfo = await browser.evaluate(`(() => {
      const feed = document.getElementById('channels-discovery-feed');
      const sportsSection = document.getElementById('vasco-matches-section');
      const rows = document.querySelectorAll('.channels-category-row');
      const cards16x9 = document.querySelectorAll('.channel-card-16x9');
      return {
        feedVisible: feed ? !feed.classList.contains('hidden') : false,
        hasSportsSection: Boolean(sportsSection),
        rowCount: rows.length,
        cardCount: cards16x9.length
      };
    })()`);
    check("Discovery feed with preserved sports section and category rows", feedInfo.feedVisible && feedInfo.hasSportsSection && feedInfo.rowCount > 0 && feedInfo.cardCount > 0, `Rows: ${feedInfo.rowCount}, Cards: ${feedInfo.cardCount}`);

    // 4. Check Logo Styling (No white background)
    const logoBgCheck = await browser.evaluate(`(() => {
      const wrappers = document.querySelectorAll('.channel-logo-img-wrapper');
      let whiteCount = 0;
      wrappers.forEach(w => {
        const bg = window.getComputedStyle(w).backgroundColor;
        if (bg === 'rgb(255, 255, 255)' || bg === '#ffffff') whiteCount++;
      });
      return {
        totalWrappers: wrappers.length,
        whiteCount
      };
    })()`);
    check("Channel logo wrappers do NOT have solid white backgrounds", logoBgCheck.totalWrappers > 0 && logoBgCheck.whiteCount === 0, `White boxes: ${logoBgCheck.whiteCount}/${logoBgCheck.totalWrappers}`);

    // 5. Test Category Filter (Click on 'Esportes' pill in toolbar)
    const filterTest = await browser.evaluate(`(() => {
      const pills = Array.from(document.querySelectorAll('.channel-cat-pill'));
      const sportsPill = pills.find(p => p.textContent.includes('Esportes'));
      if (sportsPill) sportsPill.click();
      return Boolean(sportsPill);
    })()`);
    await sleep(1000);

    const exploreState = await browser.evaluate(`(() => {
      const feed = document.getElementById('channels-discovery-feed');
      const explore = document.getElementById('channels-explore-view');
      const grid = document.getElementById('quick-grid');
      const gridCards = grid ? grid.querySelectorAll('.channel-card-16x9').length : 0;
      return {
        feedHidden: feed ? feed.classList.contains('hidden') : false,
        exploreVisible: explore ? !explore.classList.contains('hidden') : false,
        gridCards
      };
    })()`);
    check("Category pill activates Explore Grid and hides Discovery Feed", exploreState.feedHidden && exploreState.exploreVisible && exploreState.gridCards > 0, `Filtered cards: ${exploreState.gridCards}`);

    // 6. Test 'Voltar aos Destaques'
    await browser.evaluate(`(() => {
      const backBtn = document.getElementById('btn-channels-back-feed');
      if (backBtn) backBtn.click();
    })()`);
    await sleep(800);

    const backState = await browser.evaluate(`(() => {
      const feed = document.getElementById('channels-discovery-feed');
      const explore = document.getElementById('channels-explore-view');
      return {
        feedVisible: feed ? !feed.classList.contains('hidden') : false,
        exploreHidden: explore ? explore.classList.contains('hidden') : false
      };
    })()`);
    check("Voltar aos Destaques restores Discovery Feed", backState.feedVisible && backState.exploreHidden);

    // 7. Test Quick Drawer Open & Close
    await browser.evaluate(`(() => {
      const drawerBtn = document.getElementById('btn-toolbar-open-drawer');
      if (drawerBtn) drawerBtn.click();
    })()`);
    await sleep(600);

    const drawerOpen = await browser.evaluate(`(() => {
      const sidebar = document.getElementById('sidebar');
      const backdrop = document.getElementById('sidebar-backdrop');
      return {
        sidebarOpen: sidebar ? sidebar.classList.contains('open') : false,
        backdropActive: backdrop ? backdrop.classList.contains('active') : false
      };
    })()`);
    check("Quick Drawer opens on button click with backdrop", drawerOpen.sidebarOpen && drawerOpen.backdropActive);

    // Close drawer via close button
    await browser.evaluate(`(() => {
      const closeBtn = document.getElementById('btn-close-menu');
      if (closeBtn) closeBtn.click();
    })()`);
    await sleep(600);

    const drawerClosed = await browser.evaluate(`(() => {
      const sidebar = document.getElementById('sidebar');
      const backdrop = document.getElementById('sidebar-backdrop');
      return {
        sidebarClosed: sidebar ? !sidebar.classList.contains('open') : true,
        backdropInactive: backdrop ? !backdrop.classList.contains('active') : true
      };
    })()`);
    check("Quick Drawer closes properly via close button", drawerClosed.sidebarClosed && drawerClosed.backdropInactive);

    // 8. Check Scrollability on Channels View
    const scrollInfo = await browser.evaluate(`(() => {
      window.scrollTo({ top: 350, behavior: 'instant' });
      return {
        scrollY: window.scrollY,
        scrollHeight: document.documentElement.scrollHeight,
        innerHeight: window.innerHeight
      };
    })()`);
    check("Channels tab allows smooth vertical page scrolling", scrollInfo.scrollY > 0 && scrollInfo.scrollHeight > scrollInfo.innerHeight, `scrollY: ${scrollInfo.scrollY}px, total height: ${scrollInfo.scrollHeight}px`);

    // 9. Check for Console Errors
    check("Zero JavaScript exceptions thrown", browser.errors.length === 0, browser.errors.length > 0 ? browser.errors.join("; ") : "Clean console");

    console.log(`\nChannels Redesign Check Finished: ${results.filter(Boolean).length}/${results.length} PASSED`);
    if (results.some(r => !r)) process.exitCode = 1;
  } finally {
    browser.close();
  }
}

main().catch(err => {
  console.error("Test runner error:", err);
  process.exit(1);
});
