/**
 * Tvzinha Online - Multi-Provider Native Stream Extractors for /api/resolve
 * Implements FenixFlix, Rive, and Movy resolvers.
 */

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

/* ============================================================
 * 1. FENIXFLIX (PT-BR Dublado Native Stream Aggregator)
 * ============================================================ */
export async function resolveFenixFlix({ id, imdbId, type, season = 1, episode = 1, audio = "dubbed" }) {
  const isSeries = type === "series" || type === "serie" || type === "tv";
  const queryId = (imdbId && imdbId.startsWith("tt")) ? imdbId : (id && String(id).startsWith("tmdb:") ? id : `tmdb:${id}`);
  const endpoint = isSeries
    ? `https://fenixflix.fenixhub.online/stream/series/${queryId}:${season}:${episode}.json`
    : `https://fenixflix.fenixhub.online/stream/movie/${queryId}.json`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const debug = { endpoint, status: null, statusText: null, error: null, streams: 0, body: null };

  try {
    const res = await fetch(endpoint, {
      headers: { "User-Agent": USER_AGENT, "Accept": "application/json" },
      signal: controller.signal
    });
    debug.status = res.status;
    debug.statusText = res.statusText;
    if (!res.ok) {
      debug.body = (await res.text()).slice(0, 300);
      return { title: "", sources: [], debug };
    }
    const data = await res.json();
    const rawStreams = Array.isArray(data.streams) ? data.streams : [];
    debug.streams = rawStreams.length;
    if (!rawStreams.length) return { title: "", sources: [], debug };

    const parsed = rawStreams
      .filter(s => s && s.url && typeof s.url === "string")
      .map(s => {
        const text = `${s.name || ''} ${s.title || ''}`.toLowerCase();
        let quality = 1080;
        if (text.includes("4k") || text.includes("2160p")) quality = 2160;
        else if (text.includes("720p") || text.includes("hd")) quality = 720;
        else if (text.includes("480p")) quality = 480;

        const isDubbed = text.includes("dublado") || text.includes("nacional");
        const isSubbed = text.includes("legendado");
        const isHls = s.url.includes(".m3u8");

        // Clean label
        const cleanName = s.name || `FenixFlix ${quality}p`;
        return {
          label: `${cleanName} [${isDubbed ? 'Dublado' : (isSubbed ? 'Legendado' : 'Original')}]`,
          file: s.url,
          quality,
          type: isHls ? "hls" : "mp4",
          isDubbed,
          isSubbed
        };
      });

    // Prefer dubbed if available
    let filtered = parsed;
    if (audio === "dubbed") {
      const dubbed = parsed.filter(s => s.isDubbed);
      if (dubbed.length > 0) filtered = dubbed;
    }

    // Sort: 2160 > 1080 > 720, prefer HLS over raw MP4
    filtered.sort((a, b) => {
      if (b.quality !== a.quality) return b.quality - a.quality;
      if (a.type === "hls" && b.type !== "hls") return -1;
      if (b.type === "hls" && a.type !== "hls") return 1;
      return 0;
    });

    return {
      title: data.title || "",
      sources: filtered,
      debug
    };
  } catch (err) {
    debug.error = err.message || String(err);
    return { title: "", sources: [], debug };
  } finally {
    clearTimeout(timer);
  }
}


/* ============================================================
 * 3. RIVE (4K HDR Multi-Engine Aggregator)
 * ============================================================ */
const RIVE_SALT_TOKENS = [
  "r0V1d-s3cr3t-t0k3n-99", "k9X2m-v1d30-pr0v1d3r-42", "z7B4q-str34m-k3y-2024",
  "m3N8p-fl1x-s3cur1ty-77", "w5K1v-pl4y3r-h4sh-88", "p2L9x-b4ck3nd-t0k3n-33",
  "h4J7m-v1d-4uth-55", "t8R3w-str34m-s3cr3t-11", "q1V6b-pr0v1d3r-k3y-66",
  "x9M4p-pl4y-t0k3n-22", "c5N2v-v1d30-h4sh-99", "b8K7x-s3cur3-str34m-44",
  "j3L1m-b4ck3nd-k3y-88", "f6P9w-v1d-s3cr3t-77", "d2R4t-fl1x-4uth-33",
  "s7T5k-str34m-t0k3n-55", "v1N8x-pr0v1d3r-h4sh-11", "g4H2m-pl4y3r-s3cr3t-66",
  "l9K6p-v1d30-k3y-22", "y3B5w-s3cur3-t0k3n-99", "n8M1v-str34m-4uth-44",
  "w2P7t-b4ck3nd-h4sh-88", "k5R4x-fl1x-s3cr3t-77", "t9L2m-v1d-t0k3n-33",
  "p4N6w-pr0v1d3r-s3cur3-55", "h1K8v-pl4y3r-k3y-11", "m7J3t-str34m-h4sh-66",
  "q2V5x-v1d30-s3cr3t-22", "b6B9m-s3cur3-k3y-99", "x8T1w-b4ck3nd-4uth-44",
  "c4N7p-fl1x-t0k3n-88", "f1R5v-pr0v1d3r-t0k3n-77", "d9M2x-v1d-h4sh-33",
  "s5P8t-str34m-s3cur3-55", "j2K4w-pl4y3r-t0k3n-11", "l7L1m-b4ck3nd-s3cr3t-66",
  "y4N9x-v1d30-4uth-22", "v8B3v-s3cur3-h4sh-99", "w1T6p-fl1x-k3y-44",
  "k6R2t-str34m-k3y-88", "t3P7w-pr0v1d3r-4uth-77", "p9M5x-v1d-s3cr3t-33",
  "h2K1v-pl4y3r-h4sh-55", "m8J4t-b4ck3nd-t0k3n-11", "q5V9m-s3cur3-str34m-66",
  "b1B6w-v1d30-t0k3n-22", "x7T3p-fl1x-s3cur3-99", "c2N8v-str34m-t0k3n-44",
  "f9R1x-pr0v1d3r-h4sh-88", "d4M7t-v1d-k3y-77", "s1P3w-pl4y3r-4uth-33",
  "j8K5m-b4ck3nd-k3y-55", "l2L9v-s3cur3-s3cr3t-11", "y6N4p-str34m-h4sh-66",
  "v3B8t-v1d30-s3cur3-22", "w7T2x-fl1x-t0k3n-99", "k1R6w-pr0v1d3r-k3y-44",
  "t5P9m-v1d-4uth-88", "p8M3v-pl4y3r-s3cr3t-77", "h4K7t-b4ck3nd-h4sh-33",
  "m1J2p-str34m-4uth-55", "q6V8x-s3cur3-t0k3n-11", "b9B4w-v1d30-k3y-66",
  "x2T7v-fl1x-h4sh-22", "c7N1t-pr0v1d3r-s3cr3t-99", "f3R6m-v1d-t0k3n-44",
  "d8M9p-str34m-s3cur3-88", "s4P2x-pl4y3r-k3y-77", "j1K7w-b4ck3nd-4uth-33",
  "l5L3v-s3cur3-h4sh-55"
];

function generateRiveSecretKey(id, isMovie = true) {
  const r = isMovie ? "movieVideoProvider" : "tvVideoProvider";
  let t = "";
  let n = 0;
  if (typeof id === "string" && id.startsWith("tt")) {
    let sum = 0;
    for (let c of id) sum += c.charCodeAt(0);
    t = RIVE_SALT_TOKENS[sum % RIVE_SALT_TOKENS.length] || btoa(r);
    n = Math.floor((sum % r.length) / 2);
  } else {
    let num = Number(id);
    t = RIVE_SALT_TOKENS[num % RIVE_SALT_TOKENS.length] || btoa(r);
    n = Math.floor((num % r.length) / 2);
  }
  
  const combined = r.slice(0, n) + t + r.slice(n);
  
  function hashPass1(str) {
    str = String(str);
    let acc = 0;
    for (let idx = 0; idx < str.length; idx++) {
      let code = str.charCodeAt(idx);
      acc = (code + (acc << 6) + (acc << 16) - acc) >>> 0;
      let rot = ((acc << (idx % 5)) | (acc >>> (32 - (idx % 5)))) >>> 0;
      let x = (code << (idx % 7)) | (code >>> (8 - (idx % 7)));
      acc ^= (rot ^ x) >>> 0;
      acc = (acc + ((acc >>> 11) ^ (acc << 3))) >>> 0;
    }
    acc ^= acc >>> 15;
    acc = ((acc & 65535) * 49842 + ((((acc >>> 16) * 49842) & 65535) << 16)) >>> 0;
    acc ^= acc >>> 13;
    acc = ((acc & 65535) * 40503 + ((((acc >>> 16) * 40503) & 65535) << 16)) >>> 0;
    acc ^= acc >>> 16;
    return acc.toString(16).padStart(8, "0");
  }
  
  function hashPass2(str) {
    str = String(str);
    let acc = (3735928559 ^ str.length) >>> 0;
    for (let idx = 0; idx < str.length; idx++) {
      let code = str.charCodeAt(idx);
      acc = Math.imul(acc ^ code, 2654435761) >>> 0;
      acc = ((acc << 13) | (acc >>> 19)) >>> 0;
    }
    acc ^= acc >>> 16;
    acc = Math.imul(acc, 2246822507) >>> 0;
    acc ^= acc >>> 13;
    acc = Math.imul(acc, 3266489909) >>> 0;
    acc ^= acc >>> 16;
    return acc.toString(16).padStart(8, "0");
  }
  
  return hashPass1(combined) + hashPass2(combined);
}

export async function resolveRive({ tmdbId, type, season = 1, episode = 1 }) {
  const isMovie = type === "movie";
  const secretKey = generateRiveSecretKey(tmdbId, isMovie);
  const services = ["vanguard", "mirage", "apogee", "hydra", "citadel", "primevids"];
  
  const headers = {
    "User-Agent": USER_AGENT,
    "Referer": "https://watch.rivestream.app/",
    "Origin": "https://watch.rivestream.app",
    "Accept": "application/json"
  };

  for (const service of services) {
    const query = new URLSearchParams({
      requestID: isMovie ? "movieVideoProvider" : "tvVideoProvider",
      id: String(tmdbId),
      service,
      secretKey,
      proxyMode: "noProxy"
    });
    if (!isMovie) {
      query.set("season", String(season));
      query.set("episode", String(episode));
    }

    try {
      const res = await fetch(`https://backend.rivestream.app/api/backendfetch?${query.toString()}`, { headers });
      if (!res.ok) continue;
      const json = await res.json();
      const sources = json?.data?.sources || [];
      if (sources.length > 0) {
        const mapped = sources.map(s => ({
          label: `Rive [${s.quality ? `${s.quality}p` : '4K HDR'}]`,
          file: s.url,
          quality: s.quality ? Number(s.quality) : 2160,
          type: "hls",
          referer: "https://watch.rivestream.app/"
        }));
        return {
          title: "",
          sources: mapped
        };
      }
    } catch {
      // Try next
    }
  }
  return null;
}

/* ============================================================
 * 4. MOVY (Wecollege mvm1 Stream Cipher Decryptor)
 * ============================================================ */
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
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function initKeystreamState(seed, mediaId) {
  let mediaIdNum = Number(mediaId);
  let S = Array(61);
  let acc = 0x811c9dc5;
  for (let t = 0; t < seed.length; t++) {
    acc = Math.imul(acc ^ seed.charCodeAt(t), 0x1000193) >>> 0;
  }
  let seedHash = mix32(acc);
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

function decryptMovyPayload(encryptedB64, seed, mediaId) {
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
      throw new Error(`Magic signature mismatch at byte ${i}`);
    }
  }

  const payload = cipherBytes.subarray(MAGIC_MVM1.length);
  return JSON.parse(new TextDecoder("utf-8").decode(payload));
}

export async function resolveMovy({ tmdbId, type, season = 1, episode = 1, imdbId = "" }) {
  const mediaType = type === "movie" ? "movie" : "tv";
  const headers = {
    "User-Agent": USER_AGENT,
    "Referer": "https://www.movy.sx/",
    "Origin": "https://www.movy.sx",
    "Accept": "application/json"
  };

  try {
    const seedRes = await fetch(`https://api.wecollege.net/seed?mediaId=${tmdbId}`, { headers });
    if (!seedRes.ok) return null;
    const { seed } = await seedRes.json();

    const params = new URLSearchParams({
      title: "title",
      mediaType,
      seasonId: String(season),
      episodeId: String(episode),
      tmdbId: String(tmdbId),
      imdbId: imdbId || "",
      year: "2024",
      enc: "2",
      seed
    });

    const sourcesRes = await fetch(`https://api.wecollege.net/miami/sources?${params.toString()}`, { headers });
    if (!sourcesRes.ok) return null;
    const encryptedText = await sourcesRes.text();
    const data = decryptMovyPayload(encryptedText, seed, tmdbId);
    const sources = data?.sources || [];
    if (!sources.length && !data?.playlist) return null;

    const mapped = sources.map(s => {
      const q = s.quality || "";
      const is4k = q.includes("2160") || q.includes("4k") || q.includes("4K");
      const is1080 = q.includes("1080");
      const is720 = q.includes("720");
      const qualityNum = is4k ? 2160 : (is1080 ? 1080 : (is720 ? 720 : 480));
      return {
        label: `Movy [${q || (qualityNum + 'p')}]`,
        file: s.url || s.file,
        quality: qualityNum,
        type: "hls",
        referer: "https://www.movy.sx/"
      };
    });

    if (!mapped.length && data?.playlist) {
      mapped.push({
        label: "Movy [Auto FHD]",
        file: data.playlist,
        quality: 1080,
        type: "hls",
        referer: "https://www.movy.sx/"
      });
    }

    // Sort by quality descending
    mapped.sort((a, b) => b.quality - a.quality);

    return {
      title: "",
      sources: mapped
    };
  } catch {
    return null;
  }
}
