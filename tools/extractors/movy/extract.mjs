#!/usr/bin/env node
/**
 * Standalone CLI extractor for Movy / Wecollege.
 * Usage:
 *   node tools/extractors/movy/extract.mjs <tmdbId> [mediaType: movie|tv] [season] [episode] [server]
 * Examples:
 *   node tools/extractors/movy/extract.mjs 533535 movie
 *   node tools/extractors/movy/extract.mjs 1396 tv 1 1 miami
 */

const CONSTANTS_D = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174
];
const MAGIC_MVM1 = [109, 118, 109, 49]; // "mvm1"
const isEven = (e) => (e * (e + 1) & 1) === 0;

function mix32(e) {
  e >>>= 0;
  e ^= e >>> 16;
  e = Math.imul(e, 0x85ebca6b) >>> 0;
  e ^= e >>> 13;
  e = Math.imul(e, 0xc2b2ae35) >>> 0;
  return (e ^= e >>> 16) >>> 0;
}

function rotl32(e, a) {
  e >>>= 0;
  a &= 31;
  return a === 0 ? e >>> 0 : (e << a | e >>> (32 - a)) >>> 0;
}

function base64UrlToBytes(str) {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return new Uint8Array(Buffer.from(b64, "base64"));
}

function initKeystreamState(seed, mediaId) {
  let mediaIdNum = Number(mediaId);
  let S = Array(61);
  
  let seedHash = (() => {
    let acc = 0x811c9dc5;
    for (let t = 0; t < seed.length; t++) {
      acc = Math.imul(acc ^ seed.charCodeAt(t), 0x1000193) >>> 0;
    }
    return mix32(acc);
  })();

  let s = mix32(seedHash ^ mix32((mediaIdNum >>> 0) ^ 0x9e3779b9)) >>> 0;

  for (let e = 0; e < 8; e++) {
    if (isEven(e)) {
      let a = s % 61;
      s = rotl32((s + 0x9e3779b9) >>> 0, 7 + (7 & e));
      S[a] = (s ^ mix32(s)) >>> 0;
      s = mix32((s + a) >>> 0);
    } else {
      S[e] = CONSTANTS_D[15 & e];
    }
  }

  return { S, acc: mix32(0xa5a5a5a5 ^ s) >>> 0 };
}

function nextKeystreamWord(state, step) {
  let S = state.S;
  let l = state.acc;
  let d_idx = l % 61;
  let r = 0 - Number(d_idx in S);
  let s_val = S[d_idx] >>> 0;
  let c_val = Math.imul(0x9e3779b9, step + 1) >>> 0;
  let n_val = (s_val ^ c_val) >>> 0;
  let b_val = (((l ^ n_val) >>> 0) | ((l & n_val & r) >>> 0)) >>> 0;
  let rotated = (rotl32((b_val + l) >>> 0, 31 & d_idx) ^ rotl32(l, 31 & Math.imul(d_idx, 7))) >>> 0;
  l = mix32((rotated + 0x9e3779b9) >>> 0);
  S[d_idx] = l >>> 0;
  state.acc = l;
  return l >>> 0;
}

function decryptPayload(encryptedB64, seed, mediaId) {
  const cipherBytes = base64UrlToBytes(encryptedB64);
  const state = initKeystreamState(seed, mediaId);
  const len = cipherBytes.length;
  
  let step = 0;
  let pos = 0;
  while (pos < len) {
    let word = nextKeystreamWord(state, step++);
    cipherBytes[pos++] ^= (word & 255);
    if (pos < len) cipherBytes[pos++] ^= ((word >>> 8) & 255);
    if (pos < len) cipherBytes[pos++] ^= ((word >>> 16) & 255);
    if (pos < len) cipherBytes[pos++] ^= ((word >>> 24) & 255);
  }

  for (let i = 0; i < MAGIC_MVM1.length; i++) {
    if (cipherBytes[i] !== MAGIC_MVM1[i]) {
      throw new Error(`Magic signature mismatch at byte ${i}: got ${cipherBytes[i]}, expected ${MAGIC_MVM1[i]}`);
    }
  }

  const payload = cipherBytes.subarray(MAGIC_MVM1.length);
  return JSON.parse(new TextDecoder("utf-8").decode(payload));
}

export async function extractMovyStreams({
  tmdbId,
  mediaType = "movie",
  season = 1,
  episode = 1,
  server = "miami",
  title = "",
  year = "",
  imdbId = ""
}) {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Origin": "https://www.movy.sx",
    "Referer": "https://www.movy.sx/"
  };

  // 1. Get seed
  const seedRes = await fetch(`https://api.wecollege.net/seed?mediaId=${tmdbId}`, { headers });
  if (!seedRes.ok) throw new Error(`Seed request failed with status HTTP ${seedRes.status}`);
  const { seed } = await seedRes.json();

  // 2. Query sources
  const params = new URLSearchParams({
    title: encodeURIComponent(title || "title"),
    mediaType,
    seasonId: String(season),
    episodeId: String(episode),
    tmdbId: String(tmdbId),
    imdbId: imdbId || "",
    year: String(year || "2024"),
    enc: "2",
    seed
  });

  const sourcesUrl = `https://api.wecollege.net/${server}/sources?${params.toString()}`;
  const sourcesRes = await fetch(sourcesUrl, { headers });
  if (!sourcesRes.ok) throw new Error(`Sources request failed with status HTTP ${sourcesRes.status}`);
  
  const encryptedText = await sourcesRes.text();
  return decryptPayload(encryptedText, seed, tmdbId);
}

// CLI entry point
if (process.argv[1]?.endsWith("extract.mjs")) {
  const args = process.argv.slice(2);
  const tmdbId = args[0] || "533535";
  const mediaType = args[1] || "movie";
  const season = args[2] || 1;
  const episode = args[3] || 1;
  const server = args[4] || "miami";

  console.log(`[movy-extract] Extracting TMDB ${tmdbId} (${mediaType}) via server '${server}'...`);
  extractMovyStreams({ tmdbId, mediaType, season, episode, server })
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((err) => {
      console.error("[movy-extract] Error:", err.message);
      process.exit(1);
    });
}
