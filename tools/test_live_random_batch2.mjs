/**
 * Tvzinha Online - Live Production Benchmark Batch 2 (Random & Trending)
 * Target: https://feat-security-hardening.tvzinhaonline.pages.dev
 */
import { readFileSync } from "node:fs";

const BASE_URL = "https://feat-security-hardening.tvzinhaonline.pages.dev";

const BATCH2 = {
  movies: [
    { name: "Alien: Romulus", tmdbId: 945961, year: 2024, note: "Sucesso Sci-Fi 2024" },
    { name: "Furiosa: Uma Saga Mad Max", tmdbId: 786892, year: 2024, note: "Ação 2024" },
    { name: "Interestelar", tmdbId: 157336, year: 2014, note: "Clássico Sci-Fi" },
    { name: "Gladiador", tmdbId: 98, year: 2000, note: "Clássico Épico" }
  ],
  series: [
    { name: "Fallout", tmdbId: 106379, season: 1, episode: 1, note: "Sucesso Prime Video 2024" },
    { name: "Xógun: A Gloriosa Saga do Japão", tmdbId: 126308, season: 1, episode: 1, note: "Recorde Emmy 2024" },
    { name: "Arcane", tmdbId: 94605, season: 1, episode: 1, note: "Animação Aclamada Netflix" },
    { name: "Ruptura (Severance)", tmdbId: 95557, season: 1, episode: 1, note: "Suspense Apple TV+" }
  ],
  animes: [
    { name: "Chainsaw Man", tmdbId: 114410, original: "Chainsaw Man", malId: 44511, season: 1, episode: 1, note: "Destaque MAPPA" },
    { name: "Attack on Titan", tmdbId: 1429, original: "Shingeki no Kyojin", malId: 16498, season: 1, episode: 1, note: "Clássico Moderno" },
    { name: "Sousou no Frieren", tmdbId: 209867, original: "Sousou no Frieren", malId: 52991, season: 1, episode: 5, note: "Episódio 5 Frieren" }
  ],
  channels: [
    { name: "TNT", category: "Filmes e Séries" },
    { name: "Telecine Pipoca", category: "Filmes e Séries" },
    { name: "Cartoon Network", category: "Infantil" },
    { name: "CNN Brasil", category: "Notícias" },
    { name: "Combate", category: "Esportes" }
  ]
};

async function testEndpoint(params) {
  const qs = new URLSearchParams(params).toString();
  const url = `${BASE_URL}/api/resolve?${qs}`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      headers: { "Origin": BASE_URL, "User-Agent": "TvzinhaBench2/1.0" },
      signal: AbortSignal.timeout(22000)
    });
    const latency = Date.now() - start;
    const cors = res.headers.get("access-control-allow-origin");
    const serverTiming = res.headers.get("server-timing") || "-";
    let data = null;
    try { data = await res.json(); } catch {}
    
    const sources = data?.primary_source
      ? [data.primary_source, ...(data.fallback_sources || [])]
      : (data?.sources || []);

    let streamTtfb = null;
    if (sources.length > 0) {
      const top = sources[0];
      const sUrl = top.stream_url || top.file || top.raw_url;
      if (sUrl) {
        const sStart = Date.now();
        try {
          const sRes = await fetch(sUrl, {
            method: "HEAD",
            headers: { "User-Agent": "TvzinhaBench2/1.0", ...(top.headers || {}) },
            signal: AbortSignal.timeout(6000)
          });
          streamTtfb = Date.now() - sStart;
        } catch {}
      }
    }
    return { status: res.status, latency, cors, serverTiming, sources, data, streamTtfb };
  } catch (e) {
    return { status: 0, latency: Date.now() - start, error: e.message, sources: [] };
  }
}

console.log("=== BATCH 2 LIVE BENCHMARK ===");
console.log("--- FILMES ---");
for (const m of BATCH2.movies) {
  const r = await testEndpoint({ id: m.tmdbId, type: "movie", title: m.name, year: m.year });
  const ok = r.status === 200 && r.sources.length > 0;
  const top = r.sources[0];
  const q = top?.quality ? `${top.quality}p` : (top?.label || "N/A");
  const ttfb = r.streamTtfb != null ? `${r.streamTtfb}ms` : "-";
  console.log(`${m.name.padEnd(28)}: [${ok ? 'OK' : 'FAIL'}] Resolve: ${r.latency}ms | Fontes: ${r.sources.length} | Qualidade: ${q} | TTFB: ${ttfb}`);
}

console.log("\n--- SÉRIES ---");
for (const s of BATCH2.series) {
  const r = await testEndpoint({ id: s.tmdbId, type: "serie", season: s.season, episode: s.episode, title: s.name });
  const ok = r.status === 200 && r.sources.length > 0;
  const top = r.sources[0];
  const q = top?.quality ? `${top.quality}p` : (top?.label || "N/A");
  const ttfb = r.streamTtfb != null ? `${r.streamTtfb}ms` : "-";
  console.log(`${(s.name + ` T${s.season}:E${s.episode}`).padEnd(28)}: [${ok ? 'OK' : 'FAIL'}] Resolve: ${r.latency}ms | Fontes: ${r.sources.length} | Qualidade: ${q} | TTFB: ${ttfb}`);
}

console.log("\n--- ANIMES ---");
for (const a of BATCH2.animes) {
  const r = await testEndpoint({ id: a.tmdbId, type: "anime", title: a.name, original_title: a.original, season: a.season, episode: a.episode, lang: "sub" });
  const ok = r.status === 200 && r.sources.length > 0;
  const top = r.sources[0];
  const q = top?.quality ? `${top.quality}p HLS` : (top?.label || "HLS Multi");
  const aniskip = r.data?.aniskip?.ready ? `MAL:${r.data.aniskip.mal_id}` : "N/A";
  const ttfb = r.streamTtfb != null ? `${r.streamTtfb}ms` : "-";
  console.log(`${(a.name + ` E${a.episode}`).padEnd(28)}: [${ok ? 'OK' : 'FAIL'}] Resolve: ${r.latency}ms | Fontes: ${r.sources.length} | Qualidade: ${q} | AniSkip: ${aniskip} | TTFB: ${ttfb}`);
}

console.log("\n--- CANAIS ADICIONAIS ---");
const canais = JSON.parse(readFileSync(new URL("../data/canais.json", import.meta.url), "utf-8"));
for (const ch of BATCH2.channels) {
  let chInfo = null;
  for (const cat of Object.values(canais)) {
    if (cat[ch.name]) { chInfo = cat[ch.name]; break; }
    const f = Object.keys(cat).find(k => k.toLowerCase().includes(ch.name.toLowerCase()));
    if (f) { chInfo = cat[f]; break; }
  }
  if (!chInfo) { console.log(`${ch.name.padEnd(28)}: NÃO ENCONTRADO`); continue; }
  const s = chInfo.sources || [];
  let sOk = false;
  let sLatency = 0;
  if (s.length > 0) {
    const sStart = Date.now();
    try {
      const res = await fetch(s[0].url, { signal: AbortSignal.timeout(5000) });
      sLatency = Date.now() - sStart;
      const t = await res.text();
      sOk = res.ok && t.includes("#EXTM3U");
    } catch {}
  }
  console.log(`${ch.name.padEnd(28)}: [${sOk ? 'HLS OK' : 'OFFLINE'}] ${sLatency}ms | Fontes: ${s.length} | Contingências: ${Object.keys(chInfo.contingency || {}).length}`);
}
