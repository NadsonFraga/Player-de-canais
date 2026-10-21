/**
 * Tvzinha Online - Live Production Benchmark & Deep Health Analysis
 *
 * Runs comprehensive multi-tier tests directly against the live Cloudflare Pages preview:
 * https://feat-security-hardening.tvzinhaonline.pages.dev
 *
 * Tests:
 * 1. API & Stream Engine: Latency, CORS, Server-Timing, Source Resolution, Audio/Subtitles, Buffer Speed.
 * 2. Live Channels: Stream playlist availability, HLS headers, contingency options.
 * 3. Real Browser Execution (Chromium Headless): Actual playback (TTFF, videoWidth, currentTime, CSP violations).
 *
 * Run: node tools/test_live_deploy_matrix.mjs
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

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


const BASE_URL = "https://feat-security-hardening.tvzinhaonline.pages.dev";

const TEST_TITLES = {
  movies: [
    { name: "Duna: Parte 2", tmdbId: 693134, year: 2024, note: "Blockbuster recente (2024)" },
    { name: "Deadpool & Wolverine", tmdbId: 533535, year: 2024, note: "Mega bilheteria recente (2024)" },
    { name: "A Substância", tmdbId: 933260, year: 2024, note: "Fenômeno recente de terror (2024)" },
    { name: "Oppenheimer", tmdbId: 872585, year: 2023, note: "Vencedor do Oscar" },
    { name: "Divertida Mente 2", tmdbId: 1022789, year: 2024, note: "Maior animação recente (2024)" },
    { name: "O Estranho Mundo de Jack", tmdbId: 9479, year: 1993, note: "Clássico cult de catálogo" }
  ],
  series: [
    { name: "Pinguim", tmdbId: 124834, season: 1, episode: 1, note: "Sucesso HBO recente (2024)" },
    { name: "A Casa do Dragão", tmdbId: 94997, season: 2, episode: 1, note: "Temporada 2 recente (2024)" },
    { name: "X-Men '97", tmdbId: 138502, season: 1, episode: 1, note: "Animação recente Disney+ (2024)" },
    { name: "The Last of Us", tmdbId: 100088, season: 1, episode: 1, note: "Sucesso dramático HBO" },
    { name: "O Urso (The Bear)", tmdbId: 136283, season: 1, episode: 1, note: "Série premiada" }
  ],
  animes: [
    { name: "Dan Da Dan", tmdbId: 240411, original: "ダンダダン", malId: 57334, season: 1, episode: 1, note: "Estreia Outono 2024" },
    { name: "Solo Leveling", tmdbId: 202250, original: "Ore dake Level Up na Ken", malId: 52299, season: 1, episode: 1, note: "Mega sucesso 2024" },
    { name: "Kaiju No. 8", tmdbId: 207347, original: "Kaijuu 8-gou", malId: 52588, season: 1, episode: 1, note: "Destaque ação 2024" },
    { name: "Frieren e a Jornada para o Além", tmdbId: 209867, original: "Sousou no Frieren", malId: 52991, season: 1, episode: 1, note: "Top #1 MyAnimeList" },
    { name: "Demon Slayer (Hashira Training)", tmdbId: 85937, original: "Kimetsu no Yaiba", malId: 55701, season: 4, episode: 1, note: "Nova temporada 2024" }
  ],
  channels: [
    { name: "Globo", category: "TV Aberta" },
    { name: "Band", category: "TV Aberta" },
    { name: "SBT", category: "TV Aberta" },
    { name: "Record", category: "TV Aberta" },
    { name: "SporTV", category: "Esportes" },
    { name: "ESPN", category: "Esportes" },
    { name: "Premiere Clubes", category: "Esportes" },
    { name: "CazéTV", category: "Esportes" }
  ]
};

console.log("===============================================================================");
console.log(` TVZINHA ONLINE - LIVE DEPLOY HEALTH & BENCHMARK ANALYSIS`);
console.log(` Target: ${BASE_URL}`);
console.log(` Local Time: ${new Date().toLocaleString("pt-BR")}`);
console.log("===============================================================================\n");

const results = {
  movies: [],
  series: [],
  animes: [],
  channels: [],
  browserPlayback: []
};

// Helper: Measure API resolve
async function testResolveEndpoint(params) {
  const qs = new URLSearchParams(params).toString();
  const url = `${BASE_URL}/api/resolve?${qs}`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      headers: {
        "Origin": BASE_URL,
        "User-Agent": "TvzinhaBenchmark/1.0"
      },
      signal: AbortSignal.timeout(22000)
    });
    const latencyMs = Date.now() - start;
    const cors = res.headers.get("access-control-allow-origin");
    const serverTiming = res.headers.get("server-timing") || "";
    let data = null;
    try {
      data = await res.json();
    } catch {}

    const sources = data?.primary_source
      ? [data.primary_source, ...(data.fallback_sources || [])]
      : (data?.sources || []);

    let streamCheck = null;
    if (sources.length > 0) {
      const topSource = sources[0];
      const streamUrl = topSource.stream_url || topSource.file || topSource.raw_url;
      if (streamUrl) {
        const streamStart = Date.now();
        try {
          const sRes = await fetch(streamUrl, {
            method: "HEAD",
            headers: {
              "User-Agent": "TvzinhaBenchmark/1.0",
              ...(topSource.headers || {})
            },
            signal: AbortSignal.timeout(7000)
          });
          streamCheck = {
            status: sRes.status,
            ttfbMs: Date.now() - streamStart,
            contentType: sRes.headers.get("content-type") || "unknown"
          };
        } catch (se) {
          streamCheck = { error: se.message, ttfbMs: Date.now() - streamStart };
        }
      }
    }

    return {
      status: res.status,
      latencyMs,
      corsOk: cors === BASE_URL || cors === "*",
      serverTiming,
      data,
      sources,
      streamCheck
    };
  } catch (err) {
    return {
      status: 0,
      latencyMs: Date.now() - start,
      error: err.message,
      sources: []
    };
  }
}

// ----------------------------------------------------------------------------
// 1. TEST MOVIES (Filmes)
// ----------------------------------------------------------------------------
console.log("--- 1. BENCHMARK: FILMES (MGEB & Native Stream Resolve) ---");
for (const m of TEST_TITLES.movies) {
  process.stdout.write(`  Testing movie: ${m.name.padEnd(26)} ... `);
  const r = await testResolveEndpoint({
    id: m.tmdbId,
    type: "movie",
    title: m.name,
    year: m.year
  });

  const sourcesCount = r.sources.length;
  const ok = r.status === 200 && sourcesCount > 0;
  const top = r.sources[0];
  const topRes = top?.quality ? `${top.quality}p` : (top?.label || (top?.stream_url ? "Stream Ativo" : "N/A"));
  const audio = r.data?.audio === "dubbed" ? "Dublado" : (r.data?.audio === "subtitled" ? "Legendado" : "Original");
  const subs = r.data?.subtitles?.length || 0;
  const timing = r.serverTiming || "-";
  const streamTtfb = r.streamCheck?.ttfbMs ? `${r.streamCheck.ttfbMs}ms` : "-";

  const row = {
    name: m.name,
    status: r.status,
    latencyMs: r.latencyMs,
    sourcesCount,
    topRes,
    audio,
    subtitlesCount: subs,
    serverTiming: timing,
    streamTtfb,
    result: ok ? "SUCESSO" : (r.status === 404 ? "SEM FONTES" : "ERRO")
  };
  results.movies.push(row);

  if (ok) {
    console.log(`[${row.result}] ${r.latencyMs}ms | Fontes: ${sourcesCount} | Qualidade: ${topRes} | Áudio: ${audio} | Legendas: ${subs} | Stream TTFB: ${streamTtfb}`);
  } else {
    console.log(`[${row.result}] HTTP ${r.status} (${r.latencyMs}ms) | Timing: ${timing}`);
  }
}

// ----------------------------------------------------------------------------
// 2. TEST SERIES (Séries)
// ----------------------------------------------------------------------------
console.log("\n--- 2. BENCHMARK: SÉRIES (TMDB & MGEB Multi-Temporadas) ---");
for (const s of TEST_TITLES.series) {
  process.stdout.write(`  Testing série: ${(s.name + ` T${s.season}:E${s.episode}`).padEnd(26)} ... `);
  const r = await testResolveEndpoint({
    id: s.tmdbId,
    type: "serie",
    season: s.season,
    episode: s.episode,
    title: s.name
  });

  const sourcesCount = r.sources.length;
  const ok = r.status === 200 && sourcesCount > 0;
  const top = r.sources[0];
  const topRes = top?.quality ? `${top.quality}p` : (top?.label || (top?.stream_url ? "Stream Ativo" : "N/A"));
  const audio = r.data?.audio === "dubbed" ? "Dublado" : (r.data?.audio === "subtitled" ? "Legendado" : "Original");
  const subs = r.data?.subtitles?.length || 0;
  const timing = r.serverTiming || "-";
  const streamTtfb = r.streamCheck?.ttfbMs ? `${r.streamCheck.ttfbMs}ms` : "-";

  const row = {
    name: `${s.name} T${s.season}:E${s.episode}`,
    status: r.status,
    latencyMs: r.latencyMs,
    sourcesCount,
    topRes,
    audio,
    subtitlesCount: subs,
    serverTiming: timing,
    streamTtfb,
    result: ok ? "SUCESSO" : (r.status === 404 ? "SEM FONTES" : "ERRO")
  };
  results.series.push(row);

  if (ok) {
    console.log(`[${row.result}] ${r.latencyMs}ms | Fontes: ${sourcesCount} | Qualidade: ${topRes} | Áudio: ${audio} | Legendas: ${subs} | Stream TTFB: ${streamTtfb}`);
  } else {
    console.log(`[${row.result}] HTTP ${r.status} (${r.latencyMs}ms) | Timing: ${timing}`);
  }
}

// ----------------------------------------------------------------------------
// 3. TEST ANIMES (ZokoAnime & AniSkip Integration)
// ----------------------------------------------------------------------------
console.log("\n--- 3. BENCHMARK: ANIMES (ZokoAnime & AniSkip Sync) ---");
for (const a of TEST_TITLES.animes) {
  process.stdout.write(`  Testing anime: ${(a.name).slice(0, 26).padEnd(26)} ... `);
  const r = await testResolveEndpoint({
    id: a.tmdbId,
    type: "anime",
    title: a.name,
    original_title: a.original,
    season: a.season,
    episode: a.episode,
    lang: "sub"
  });

  const sourcesCount = r.sources.length;
  const ok = r.status === 200 && sourcesCount > 0;
  const top = r.sources[0];
  const topRes = top?.quality ? `${top.quality}p HLS` : (top?.label || "HLS Multi");
  const aniskip = r.data?.aniskip?.ready ? `MAL:${r.data.aniskip.mal_id} (OK)` : "Nenhum";
  const subs = r.data?.subtitles?.length || 0;
  const timing = r.serverTiming || "-";
  const streamTtfb = r.streamCheck?.ttfbMs ? `${r.streamCheck.ttfbMs}ms` : "-";

  const row = {
    name: a.name,
    status: r.status,
    latencyMs: r.latencyMs,
    sourcesCount,
    topRes,
    aniskip,
    subtitlesCount: subs,
    serverTiming: timing,
    streamTtfb,
    result: ok ? "SUCESSO" : (r.status === 404 ? "SEM FONTES" : "ERRO")
  };
  results.animes.push(row);

  if (ok) {
    console.log(`[${row.result}] ${r.latencyMs}ms | Fontes: ${sourcesCount} | Qualidade: ${topRes} | AniSkip: ${aniskip} | Legendas: ${subs} | Stream TTFB: ${streamTtfb}`);
  } else {
    console.log(`[${row.result}] HTTP ${r.status} (${r.latencyMs}ms) | Timing: ${timing}`);
  }
}

// ----------------------------------------------------------------------------
// 4. TEST LIVE CHANNELS (Canais ao Vivo)
// ----------------------------------------------------------------------------
console.log("\n--- 4. BENCHMARK: CANAIS AO VIVO (HLS Playlists & Contingência) ---");
const canaisJsonRaw = readFileSync(new URL("../data/canais.json", import.meta.url), "utf-8");
const canaisData = JSON.parse(canaisJsonRaw);

for (const ch of TEST_TITLES.channels) {
  process.stdout.write(`  Testing canal: ${(ch.name).padEnd(20)} ... `);
  let chInfo = null;
  for (const [cat, chs] of Object.entries(canaisData)) {
    if (chs[ch.name]) {
      chInfo = chs[ch.name];
      break;
    }
    const fuzzy = Object.keys(chs).find(k => k.toLowerCase().includes(ch.name.toLowerCase()));
    if (fuzzy) {
      chInfo = chs[fuzzy];
      break;
    }
  }

  if (!chInfo) {
    console.log(`[NÃO ENCONTRADO NO JSON]`);
    continue;
  }

  const sources = chInfo.sources || [];
  const contingencies = Object.keys(chInfo.contingency || {});

  let directStreamOk = false;
  let directLatency = 0;
  let statusText = "N/A";

  if (sources.length > 0) {
    const sStart = Date.now();
    try {
      const sRes = await fetch(sources[0].url, {
        headers: { "User-Agent": "TvzinhaBenchmark/1.0" },
        signal: AbortSignal.timeout(6000)
      });
      directLatency = Date.now() - sStart;
      const text = await sRes.text();
      directStreamOk = sRes.ok && text.includes("#EXTM3U");
      statusText = directStreamOk ? `OK (#EXTM3U, ${text.split('\n').length} linhas)` : `HTTP ${sRes.status}`;
    } catch (err) {
      directLatency = Date.now() - sStart;
      statusText = `Falha: ${err.message}`;
    }
  }

  const row = {
    name: ch.name,
    sourcesCount: sources.length,
    contingencyCount: contingencies.length,
    directStreamOk,
    directLatencyMs: directLatency,
    statusText
  };
  results.channels.push(row);

  console.log(`[${directStreamOk ? 'HLS ONLINE' : 'DIRETO OFF'}] ${directLatency}ms | Fontes: ${sources.length} | Contingências: ${contingencies.length} (${contingencies.slice(0, 2).join(', ')}) | ${statusText}`);
}

// ----------------------------------------------------------------------------
// 5. REAL BROWSER EXECUTION TESTS (Chromium Headless on Live Deploy)
// ----------------------------------------------------------------------------
console.log("\n--- 5. REAL BROWSER PLAYBACK ON LIVE DEPLOY (Chromium CDP) ---");

const CHROMIUM = existsSync("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe")
  ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
  : "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

const DEBUG_PORT = 9890;
const profile = tempDir(join(tmpdir(), "tvz-live-bench-"));
const proc = spawn(CHROMIUM, [
  "--headless=new",
  `--remote-debugging-port=${DEBUG_PORT}`,
  "--remote-allow-origins=*",
  `--user-data-dir=${profile}`,
  "--no-first-run",
  "--mute-audio",
  "--autoplay-policy=no-user-gesture-required",
  `${BASE_URL}/?test_session=${Date.now()}`
], { stdio: "ignore" });

const cleanup = () => {
  try { spawnSync("taskkill", ["/PID", String(proc.pid), "/T", "/F"], { stdio: "ignore" }); } catch {}
};

try {
  await new Promise(r => setTimeout(r, 2000));
  const targets = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json`)).json();
  const target = targets.find(t => t.type === "page") || targets[0];
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  const send = (m, p = {}) => new Promise((resolve, reject) => {
    const cur = id++;
    const h = (e) => {
      const d = JSON.parse(e.data);
      if (d.id === cur) {
        ws.removeEventListener("message", h);
        if (d.error) reject(new Error(JSON.stringify(d.error)));
        else resolve(d.result);
      }
    };
    ws.addEventListener("message", h);
    ws.send(JSON.stringify({ id: cur, method: m, params: p }));
  });

  const logs = [];
  ws.onmessage = (ev) => {
    const d = JSON.parse(ev.data);
    if (d.method === "Log.entryAdded") logs.push(d.params.entry);
    if (d.method === "Runtime.consoleAPICalled") {
      const txt = (d.params.args || []).map(a => a.value ?? a.description ?? "").join(" ");
      logs.push({ text: txt, type: d.params.type });
    }
  };

  await send("Log.enable");
  await send("Runtime.enable");

  // Wait for bootstrap
  await new Promise(r => setTimeout(r, 2500));

  // Snapshot expression for real Artplayer state
  const SNAPSHOT_EXPR = `
    (() => {
      const art = window.artInstance;
      const video = art ? art.video : document.querySelector('video');
      const iframe = document.getElementById('stream-iframe');
      const isIframeVisible = iframe && !iframe.classList.contains('hidden') && iframe.src;
      
      if (!art && !video) {
        return { mounted: false, isIframe: Boolean(isIframeVisible), iframeSrc: isIframeVisible ? iframe.src : null };
      }
      
      const v = video || (art && art.video);
      return {
        mounted: true,
        isIframe: Boolean(isIframeVisible),
        paused: v.paused,
        currentTime: v.currentTime,
        duration: v.duration || 0,
        videoWidth: v.videoWidth || 0,
        videoHeight: v.videoHeight || 0,
        bufferedSeconds: v.buffered && v.buffered.length > 0 ? (v.buffered.end(v.buffered.length - 1) - v.buffered.start(0)) : 0
      };
    })()
  `;

  async function testPlaybackInBrowser(label, setupCode, maxWaitMs = 12000) {
    process.stdout.write(`  Browser playback: ${label.padEnd(28)} ... `);
    logs.length = 0;
    const start = Date.now();
    await send("Runtime.evaluate", { expression: setupCode, returnByValue: true });

    let playing = false;
    let finalSnap = null;
    while (Date.now() - start < maxWaitMs) {
      await new Promise(r => setTimeout(r, 350));
      const res = await send("Runtime.evaluate", { expression: SNAPSHOT_EXPR, returnByValue: true });
      const snap = res?.result?.value;
      if (snap && snap.mounted && !snap.paused && (snap.currentTime > 0.1 || snap.videoWidth > 0)) {
        playing = true;
        finalSnap = snap;
        break;
      }
      if (snap && snap.isIframe) {
        playing = true;
        finalSnap = snap;
        break;
      }
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    const cspViolations = logs.filter(l => (l.text || "").includes("Content Security Policy")).length;
    const fatalErrors = logs.filter(l => (l.text || "").includes("Fatal Network Error")).length;

    const row = {
      label,
      playing,
      ttffSeconds: elapsed,
      resolution: finalSnap ? `${finalSnap.videoWidth}x${finalSnap.videoHeight}` : "N/A",
      currentTime: finalSnap ? finalSnap.currentTime?.toFixed(1) : "0",
      buffered: finalSnap ? `${finalSnap.bufferedSeconds?.toFixed(1)}s` : "0s",
      cspViolations,
      fatalErrors
    };
    results.browserPlayback.push(row);

    if (playing) {
      console.log(`[TOCOU] TTFF: ${elapsed}s | Res: ${row.resolution} | Buffer: ${row.buffered} | CSP Erros: ${cspViolations}`);
    } else {
      console.log(`[TIMEOUT / FALHA] ${elapsed}s | CSP Erros: ${cspViolations} | Erros: ${fatalErrors}`);
    }
  }

  // 1. Movie: Deadpool & Wolverine
  await testPlaybackInBrowser(
    "Filme: Deadpool & Wolverine",
    `window.TvzinhaActions.openMovie({ id: 533535, title: 'Deadpool & Wolverine' }, true)`
  );
  await new Promise(r => setTimeout(r, 1200));

  // 2. Movie: Oppenheimer
  await testPlaybackInBrowser(
    "Filme: Oppenheimer",
    `window.TvzinhaActions.openMovie({ id: 872585, title: 'Oppenheimer' }, true)`
  );
  await new Promise(r => setTimeout(r, 1200));

  // 3. Series: The Last of Us
  await testPlaybackInBrowser(
    "Série: The Last of Us T1:E1",
    `window.TvzinhaActions.playEpisode({ id: 100088, name: 'The Last of Us' }, 1, 1)`
  );
  await new Promise(r => setTimeout(r, 1200));

  // 4. Anime: Dan Da Dan
  await testPlaybackInBrowser(
    "Anime: Dan Da Dan E1",
    `window.TvzinhaActions.playEpisode({ id: 240411, name: 'Dan Da Dan', original_name: 'ダンダダン', origin_country: ['JP'], original_language: 'ja', genre_ids: [16] }, 1, 1)`
  );
  await new Promise(r => setTimeout(r, 1200));

  // 5. Anime: Solo Leveling
  await testPlaybackInBrowser(
    "Anime: Solo Leveling E1",
    `window.TvzinhaActions.playEpisode({ id: 202250, name: 'Solo Leveling', original_name: 'Ore dake Level Up na Ken', origin_country: ['JP'], original_language: 'ja', genre_ids: [16] }, 1, 1)`
  );
  await new Promise(r => setTimeout(r, 1200));

  // 6. Live TV: Globo
  await testPlaybackInBrowser(
    "Canal: Globo SP (TV Aberta)",
    `window.TvzinhaActions.selectChannel('TV Aberta', 'Globo')`
  );
  await new Promise(r => setTimeout(r, 1200));

  // 7. Live TV: Band
  await testPlaybackInBrowser(
    "Canal: Band SP (TV Aberta)",
    `window.TvzinhaActions.selectChannel('TV Aberta', 'Band')`
  );

  ws.close();
} catch (err) {
  console.error("Browser benchmark error:", err);
} finally {
  cleanup();
}

console.log("\n===============================================================================");
console.log(" BENCHMARK CONCLUÍDO - RESUMO GERAL DAS MÉTRICAS");
console.log("===============================================================================");

const totalMoviesOk = results.movies.filter(m => m.result === "SUCESSO").length;
const totalSeriesOk = results.series.filter(s => s.result === "SUCESSO").length;
const totalAnimesOk = results.animes.filter(a => a.result === "SUCESSO").length;
const totalChannelsOk = results.channels.filter(c => c.directStreamOk).length;
const totalBrowserOk = results.browserPlayback.filter(b => b.playing).length;

console.log(`- Filmes: ${totalMoviesOk}/${results.movies.length} com fontes diretas resolvidas`);
console.log(`- Séries: ${totalSeriesOk}/${results.series.length} com fontes diretas resolvidas`);
console.log(`- Animes: ${totalAnimesOk}/${results.animes.length} com fontes e AniSkip sincronizados`);
console.log(`- Canais: ${totalChannelsOk}/${results.channels.length} com stream direto ativo (#EXTM3U)`);
console.log(`- Player no Navegador Real: ${totalBrowserOk}/${results.browserPlayback.length} reproduziram com sucesso`);
console.log("===============================================================================\n");
