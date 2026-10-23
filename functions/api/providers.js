/**
 * Tvzinha Online - Multi-Provider Native Stream Extractors for /api/resolve
 * Implements FenixFlix and Movy resolvers.
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
        else if (text.includes("1440p") || text.includes("2k")) quality = 1440;
        else if (text.includes("1080p") || text.includes("fhd") || text.includes("full hd") || text.includes("fullhd")) quality = 1080;
        else if (text.includes("720p") || text.includes("hd")) quality = 720;
        else if (text.includes("480p") || text.includes("sd")) quality = 480;
        else if (text.includes("360p")) quality = 360;

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
