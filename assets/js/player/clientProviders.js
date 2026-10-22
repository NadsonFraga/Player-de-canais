/**
 * Tvzinha Online - Client-Side Stream Extractors (FenixFlix, Rive, Movy)
 * 
 * Executes directly in the user's browser to bypass Cloudflare-to-Cloudflare WAF / CF-Worker blocks,
 * utilizing the user's residential/mobile IP with open CORS (Access-Control-Allow-Origin: *).
 * Signs final proxy URLs through /api/resolve?action=sign for streams requiring custom Referer headers.
 */

import { STREAM_ENGINE_API_BASE } from '../core/constants.js?v=20261022_1109';

/* ============================================================
 * 0. STREAM SIGNING HELPER
 * ============================================================ */

function getApiBase() {
  if (STREAM_ENGINE_API_BASE) return STREAM_ENGINE_API_BASE;
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return 'http://127.0.0.1:8787';
}

/**
 * Signs an upstream stream URL through /api/resolve?action=sign to generate a valid /api/stream proxy URL.
 */
export async function signStreamUrl(url, referer = '', targetOrigin = '') {
  if (!url) return '';
  try {
    const params = new URLSearchParams({
      action: 'sign',
      url,
      referer,
      target_origin: targetOrigin
    });
    const res = await fetch(`${getApiBase()}/api/resolve?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.signed_url) {
        return data.signed_url;
      }
    }
  } catch (e) {
    console.warn('[ClientProviders] Erro ao assinar URL individual:', e);
  }
  return url;
}

/**
 * Signs multiple stream URLs in a single batch request via /api/resolve?action=sign_batch.
 */
export async function signStreamUrlsBatch(items) {
  if (!items || !items.length) return [];
  try {
    const res = await fetch(`${getApiBase()}/api/resolve?action=sign_batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.items)) {
        return data.items;
      }
    }
  } catch (e) {
    console.warn('[ClientProviders] Erro no batch sign, recorrendo a URLs individuais:', e);
  }
  // Fallback: sign individually
  return Promise.all(items.map(async (it) => {
    const signed = await signStreamUrl(it.url, it.referer || '', it.origin || '');
    return { ...it, signed_url: signed };
  }));
}


/* ============================================================
 * 1. FENIXFLIX (PT-BR Dublado Native Stream Aggregator)
 * ============================================================ */

export async function resolveFenixFlixClient({ id, imdbId, type = 'movie', season = 1, episode = 1, audio = 'dubbed', title = '' }) {
  const isSeries = type === 'series' || type === 'serie' || type === 'tv';
  const queryId = (imdbId && imdbId.startsWith('tt')) ? imdbId : (id && String(id).startsWith('tmdb:') ? id : `tmdb:${id}`);
  const endpoint = isSeries
    ? `https://fenixflix.fenixhub.online/stream/series/${queryId}:${season}:${episode}.json`
    : `https://fenixflix.fenixhub.online/stream/movie/${queryId}.json`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 9000);

  try {
    const res = await fetch(endpoint, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    if (!res.ok) {
      return { success: false, error: `FenixFlix retornou HTTP ${res.status}`, provider: 'fenixflix', reason: 'no_sources' };
    }
    const data = await res.json();
    const rawStreams = Array.isArray(data.streams) ? data.streams : [];
    if (!rawStreams.length) {
      return { success: false, error: 'FenixFlix sem fontes para este título', provider: 'fenixflix', reason: 'no_sources' };
    }

    const parsed = rawStreams
      .filter(s => s && s.url && typeof s.url === 'string')
      .map(s => {
        const text = `${s.name || ''} ${s.title || ''}`.toLowerCase();
        let quality = 1080;
        if (text.includes('4k') || text.includes('2160p')) quality = 2160;
        else if (text.includes('720p') || text.includes('hd')) quality = 720;
        else if (text.includes('480p')) quality = 480;

        const isDubbed = text.includes('dublado') || text.includes('nacional');
        const isSubbed = text.includes('legendado');
        const isHls = s.url.includes('.m3u8');
        const cleanName = s.name || `FenixFlix ${quality}p`;

        return {
          label: `${cleanName} [${isDubbed ? 'Dublado' : (isSubbed ? 'Legendado' : 'Original')}]`,
          file: s.url,
          quality,
          type: isHls ? 'hls' : 'mp4',
          isDubbed,
          isSubbed
        };
      });

    let filtered = parsed;
    if (audio === 'dubbed') {
      const dubbed = parsed.filter(s => s.isDubbed);
      if (dubbed.length > 0) filtered = dubbed;
    }

    filtered.sort((a, b) => {
      if (b.quality !== a.quality) return b.quality - a.quality;
      if (a.type === 'hls' && b.type !== 'hls') return -1;
      if (b.type === 'hls' && a.type !== 'hls') return 1;
      return 0;
    });

    if (!filtered.length) {
      return { success: false, error: 'FenixFlix sem fontes correspondentes ao áudio selecionado', provider: 'fenixflix', reason: 'no_sources' };
    }

    // Sign proxy URLs for streams needing referer
    const itemsToSign = filtered.map(s => {
      const rawFile = (s.file || '').trim();
      const isDirectMp4 = rawFile.includes('.mp4') && (rawFile.includes('fontedecanais') || rawFile.includes('57lgoe65efxo71.com'));
      const directCleanUrl = isDirectMp4 ? rawFile.replace(/^http:\/\//i, 'https://').replace(/:80\//, '/') : rawFile;
      const referer = 'https://embedplayer2.xyz/';
      return {
        url: directCleanUrl,
        referer,
        origin: 'https://embedplayer2.xyz',
        sourceItem: s,
        isDirectMp4
      };
    });

    const signedResults = await signStreamUrlsBatch(itemsToSign);

    const sources = signedResults.map((item, idx) => {
      const s = item.sourceItem || filtered[idx];
      const finalStreamUrl = item.isDirectMp4 ? item.url : (item.signed_url || item.url);
      const isDirectHls = !item.isDirectMp4 && s.type === 'hls' && /^https:\/\//i.test(s.file);
      return {
        label: s.label,
        type: s.type,
        stream_url: finalStreamUrl,
        direct_url: isDirectHls ? s.file : null,
        raw_url: s.file,
        headers: { 'Referer': item.referer || 'https://embedplayer2.xyz/' },
        quality: s.quality || 1080
      };
    });

    return {
      success: true,
      title: data.title || title || (type === 'movie' ? 'Filme' : `Série T${season}E${episode}`),
      category: type,
      audio: 'dubbed',
      provider: 'fenixflix',
      primary_source: sources[0],
      fallback_sources: sources.slice(1),
      subtitles: [],
      aniskip: { mal_id: null, episode, ready: false }
    };
  } catch (err) {
    console.error('[ClientProviders] Erro FenixFlix:', err);
    return { success: false, error: err.message || 'Erro ao carregar FenixFlix', provider: 'fenixflix', reason: 'error' };
  } finally {
    clearTimeout(timer);
  }
}




/* ============================================================
 * 3. RIVE (4K HDR Multi-Engine Aggregator)
 * ============================================================ */

const RIVE_SALT_TOKENS = [
  "4Z7lUo","gwIVSMD","PLmz2elE2v","Z4OFV0","SZ6RZq6Zc","zhJEFYxrz8","FOm7b0","axHS3q4KDq","o9zuXQ","4Aebt",
  "wgjjWwKKx","rY4VIxqSN","kfjbnSo","2DyrFA1M","YUixDM9B","JQvgEj0","mcuFx6JIek","eoTKe26gL","qaI9EVO1rB","0xl33btZL",
  "1fszuAU","a7jnHzst6P","wQuJkX","cBNhTJlEOf","KNcFWhDvgT","XipDGjST","PCZJlbHoyt","2AYnMZkqd","HIpJh","KH0C3iztrG",
  "W81hjts92","rJhAT","NON7LKoMQ","NMdY3nsKzI","t4En5v","Qq5cOQ9H","Y9nwrp","VX5FYVfsf","cE5SJG","x1vj1",
  "HegbLe","zJ3nmt4OA","gt7rxW57dq","clIE9b","jyJ9g","B5jXjMCSx","cOzZBZTV","FTXGy","Dfh1q1","ny9jqZ2POI",
  "X2NnMn","MBtoyD","qz4Ilys7wB","68lbOMye","3YUJnmxp","1fv5Imona","PlfvvXD7mA","ZarKfHCaPR","owORnX","dQP1YU",
  "dVdkx","qgiK0E","cx9wQ","5F9bGa","7UjkKrp","Yvhrj","wYXez5Dg3","pG4GMU","MwMAu","rFRD5wlM"
];

function generateRiveSecretKey(id) {
  if (id === undefined) return "rive";
  try {
    let t, n;
    let r = String(id);
    if (isNaN(Number(id))) {
      let sum = r.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      t = RIVE_SALT_TOKENS[sum % RIVE_SALT_TOKENS.length] || btoa(r);
      n = Math.floor((sum % r.length) / 2);
    } else {
      let num = Number(id);
      t = RIVE_SALT_TOKENS[num % RIVE_SALT_TOKENS.length] || btoa(r);
      n = Math.floor((num % r.length) / 2);
    }
    
    let combined = r.slice(0, n) + t + r.slice(n);
    
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
        code ^= (131 * idx + 89 ^ (code << (idx % 5))) & 255;
        acc = (((acc << 7) | (acc >>> 25)) >>> 0) ^ code;
        let low = (acc & 65535) * 60205;
        let high = ((acc >>> 16) * 60205) << 16;
        acc = (low + high) >>> 0;
        acc ^= acc >>> 11;
      }
      acc ^= acc >>> 15;
      acc = ((acc & 65535) * 49842 + (((acc >>> 16) * 49842) << 16)) >>> 0;
      acc ^= acc >>> 13;
      acc = ((acc & 65535) * 40503 + (((acc >>> 16) * 40503) << 16)) >>> 0;
      acc ^= acc >>> 16;
      acc = ((acc & 65535) * 10196 + (((acc >>> 16) * 10196) << 16)) >>> 0;
      acc ^= acc >>> 15;
      return acc.toString(16).padStart(8, "0");
    }
    
    const hex = hashPass2(hashPass1(combined));
    return btoa(hex);
  } catch (err) {
    return "topSecret";
  }
}

const RIVE_SERVICES = [
  "vanguard", "apogee", "velocity", "ignite", "tampa",
  "meridian", "savannah", "solstice", "primevids", "mirage"
];

export async function resolveRiveClient({ id, type = 'movie', season = 1, episode = 1, title = '' }) {
  const isSeries = type === 'series' || type === 'serie' || type === 'tv';
  const tmdbId = /^\d+$/.test(id) ? id : null;
  if (!tmdbId) {
    return { success: false, error: 'Rive requer ID numérico do TMDB', provider: 'rive', reason: 'invalid_id' };
  }

  const secretKey = generateRiveSecretKey(tmdbId);
  const endpoint = isSeries ? 'tvVideoProvider' : 'movieVideoProvider';

  let foundSources = [];
  let foundCaptions = [];

  for (const service of RIVE_SERVICES) {
    const query = new URLSearchParams({
      requestID: endpoint,
      id: String(tmdbId),
      service,
      secretKey,
      proxyMode: 'noProxy'
    });
    if (isSeries) {
      query.set('season', String(season));
      query.set('episode', String(episode));
    }
    if (service === 'primevids' || service === 'citadel') {
      query.set('cb', String(Math.floor(Date.now() / 3e6)));
    }

    const url = `https://backend.rivestream.app/api/backendfetch?${query.toString()}`;
    try {
      const res = await fetch(url, {
        headers: {
          'Origin': 'https://watch.rivestream.app',
          'Referer': 'https://watch.rivestream.app/'
        }
      });
      if (!res.ok) continue;
      const json = await res.json();
      const sources = json?.data?.sources || [];
      const captions = json?.data?.captions || [];
      if (sources.length > 0) {
        foundSources = sources;
        foundCaptions = captions;
        break; // Found valid stream on preferred high quality service
      }
    } catch (e) {
      // Continue to next service
    }
  }

  if (!foundSources.length) {
    return { success: false, error: 'Rive sem fontes para este título', provider: 'rive', reason: 'no_sources' };
  }

  // Sign sources
  const itemsToSign = foundSources.map(s => ({
    url: s.url,
    referer: 'https://watch.rivestream.app/',
    sourceObj: s
  }));

  const signedResults = await signStreamUrlsBatch(itemsToSign);

  const sources = signedResults.map((item, idx) => {
    const s = item.sourceObj || foundSources[idx];
    const quality = s.quality?.includes('4K') ? 2160 : (s.quality?.includes('720') ? 720 : 1080);
    return {
      label: `Rive ${s.source || 'Stream'} [${s.quality || '1080p'}]`,
      type: s.format === 'mp4' ? 'mp4' : 'hls',
      stream_url: item.signed_url || item.url,
      direct_url: s.url,
      raw_url: s.url,
      headers: { 'Referer': 'https://watch.rivestream.app/' },
      quality
    };
  });

  // Filter subtitles (Portuguese / English)
  const subtitles = foundCaptions
    .filter(c => c && c.file && (c.label?.toLowerCase().includes('portuguese') || c.label?.toLowerCase().includes('english')))
    .map((c, i) => ({
      lang: c.label?.toLowerCase().includes('portuguese') ? 'pt-BR' : 'en',
      label: c.label?.toLowerCase().includes('portuguese') ? 'Português' : 'Inglês',
      default: i === 0,
      url: c.file
    }));

  return {
    success: true,
    title: title || (type === 'movie' ? 'Filme' : `Série T${season}E${episode}`),
    category: type,
    audio: 'original',
    provider: 'rive',
    primary_source: sources[0],
    fallback_sources: sources.slice(1),
    subtitles,
    aniskip: { mal_id: null, episode, ready: false }
  };
}


/* ============================================================
 * 4. MOVY (Wecollege PRNG Decryption / Fast CDN)
 * ============================================================ */

const MOVY_CONSTANTS_D = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174
];
const MOVY_MAGIC_MVM1 = [109, 118, 109, 49]; // "mvm1"
const movyIsEven = (e) => (e * (e + 1) & 1) === 0;

function movyMix32(e) {
  e >>>= 0;
  e ^= e >>> 16;
  e = Math.imul(e, 0x85ebca6b) >>> 0;
  e ^= e >>> 13;
  e = Math.imul(e, 0xc2b2ae35) >>> 0;
  return (e ^= e >>> 16) >>> 0;
}

function movyRotl32(e, a) {
  e >>>= 0;
  a &= 31;
  return a === 0 ? e >>> 0 : (e << a | e >>> (32 - a)) >>> 0;
}

function movyBase64UrlToBytes(str) {
  let b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function movyInitKeystreamState(seed, mediaId) {
  let mediaIdNum = Number(mediaId);
  let S = Array(61);
  let seedHash = (() => {
    let acc = 0x811c9dc5;
    for (let t = 0; t < seed.length; t++) {
      acc = Math.imul(acc ^ seed.charCodeAt(t), 0x1000193) >>> 0;
    }
    return movyMix32(acc);
  })();

  let s = movyMix32(seedHash ^ movyMix32((mediaIdNum >>> 0) ^ 0x9e3779b9)) >>> 0;

  for (let e = 0; e < 8; e++) {
    if (movyIsEven(e)) {
      let a = s % 61;
      s = movyRotl32((s + 0x9e3779b9) >>> 0, 7 + (7 & e));
      S[a] = (s ^ movyMix32(s)) >>> 0;
      s = movyMix32((s + a) >>> 0);
    } else {
      S[e] = MOVY_CONSTANTS_D[15 & e];
    }
  }

  return { S, acc: movyMix32(0xa5a5a5a5 ^ s) >>> 0 };
}

function movyNextKeystreamWord(state, step) {
  let S = state.S;
  let l = state.acc;
  let d_idx = l % 61;
  let r = 0 - Number(d_idx in S);
  let s_val = S[d_idx] >>> 0;
  let c_val = Math.imul(0x9e3779b9, step + 1) >>> 0;
  let n_val = (s_val ^ c_val) >>> 0;
  let b_val = (((l ^ n_val) >>> 0) | ((l & n_val & r) >>> 0)) >>> 0;
  let rotated = (movyRotl32((b_val + l) >>> 0, 31 & d_idx) ^ movyRotl32(l, 31 & Math.imul(d_idx, 7))) >>> 0;
  l = movyMix32((rotated + 0x9e3779b9) >>> 0);
  S[d_idx] = l >>> 0;
  state.acc = l;
  return l >>> 0;
}

function movyDecryptPayload(encryptedB64, seed, mediaId) {
  const cipherBytes = movyBase64UrlToBytes(encryptedB64);
  const state = movyInitKeystreamState(seed, mediaId);
  const len = cipherBytes.length;
  
  let step = 0;
  let pos = 0;
  while (pos < len) {
    let word = movyNextKeystreamWord(state, step++);
    cipherBytes[pos++] ^= (word & 255);
    if (pos < len) cipherBytes[pos++] ^= ((word >>> 8) & 255);
    if (pos < len) cipherBytes[pos++] ^= ((word >>> 16) & 255);
    if (pos < len) cipherBytes[pos++] ^= ((word >>> 24) & 255);
  }

  for (let i = 0; i < MOVY_MAGIC_MVM1.length; i++) {
    if (cipherBytes[i] !== MOVY_MAGIC_MVM1[i]) {
      throw new Error(`Magic signature mismatch at byte ${i}`);
    }
  }

  const payload = cipherBytes.subarray(MOVY_MAGIC_MVM1.length);
  return JSON.parse(new TextDecoder("utf-8").decode(payload));
}

export async function resolveMovyClient({ id, type = 'movie', season = 1, episode = 1, title = '', year = '', imdbId = '' }) {
  const tmdbId = /^\d+$/.test(id) ? id : null;
  if (!tmdbId) {
    return { success: false, error: 'Movy requer ID numérico do TMDB', provider: 'movy', reason: 'invalid_id' };
  }

  const isSeries = type === 'series' || type === 'serie' || type === 'tv';
  const mediaType = isSeries ? 'tv' : 'movie';
  const headers = {
    'Origin': 'https://www.movy.sx',
    'Referer': 'https://www.movy.sx/'
  };

  try {
    // 1. Get seed
    const seedRes = await fetch(`https://api.wecollege.net/seed?mediaId=${tmdbId}`, { headers });
    if (!seedRes.ok) throw new Error(`Seed falhou com HTTP ${seedRes.status}`);
    const { seed } = await seedRes.json();

    // 2. Query sources
    const params = new URLSearchParams({
      title: encodeURIComponent(title || 'title'),
      mediaType,
      seasonId: String(season),
      episodeId: String(episode),
      tmdbId: String(tmdbId),
      imdbId: imdbId || '',
      year: String(year || '2024'),
      enc: '2',
      seed
    });

    const sourcesRes = await fetch(`https://api.wecollege.net/miami/sources?${params.toString()}`, { headers });
    if (!sourcesRes.ok) throw new Error(`Sources falhou com HTTP ${sourcesRes.status}`);
    const encryptedText = await sourcesRes.text();
    const data = movyDecryptPayload(encryptedText, seed, tmdbId);

    const rawSources = Array.isArray(data?.sources) ? data.sources : [];
    if (!rawSources.length && !data?.playlist) {
      return { success: false, error: 'Movy sem fontes para este título', provider: 'movy', reason: 'no_sources' };
    }

    // Process sources
    const playlistUrl = data.playlist || (rawSources[0]?.url);
    const signedUrl = await signStreamUrl(playlistUrl, 'https://www.movy.sx/');

    const sourceObj = {
      label: 'Movy Miami [FHD HLS]',
      type: 'hls',
      stream_url: signedUrl,
      direct_url: playlistUrl,
      raw_url: playlistUrl,
      headers: { 'Referer': 'https://www.movy.sx/' },
      quality: 1080
    };

    return {
      success: true,
      title: title || (type === 'movie' ? 'Filme' : `Série T${season}E${episode}`),
      category: type,
      audio: 'original',
      provider: 'movy',
      primary_source: sourceObj,
      fallback_sources: [],
      subtitles: [],
      aniskip: { mal_id: null, episode, ready: false }
    };
  } catch (err) {
    console.error('[ClientProviders] Erro Movy:', err);
    return { success: false, error: err.message || 'Erro ao carregar Movy', provider: 'movy', reason: 'error' };
  }
}


/* ============================================================
 * 5. UNIFIED DISPATCHER
 * ============================================================ */

export const CLIENT_PROVIDERS = ['fenixflix', 'rive', 'movy'];

export async function resolveClientProvider(source, options) {
  switch (source) {
    case 'fenixflix':
      return resolveFenixFlixClient(options);
    case 'rive':
      return resolveRiveClient(options);
    case 'movy':
      return resolveMovyClient(options);
    default:
      return null;
  }
}
