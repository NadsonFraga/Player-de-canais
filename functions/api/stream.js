/**
 * Tvzinha Online - Cloudflare Pages Function: /api/stream
 * Proxy for video playlists (.m3u8), segments (.ts/.m4s), MP4 streams and WebVTT subtitles: adds the Referer/Origin
 * the hosts need, keeps CORS open (TV receivers and casting apps fetch from another origin).
 *
 * It only ever answers media or data: upstream headers are never copied, a type that is not media becomes
 * application/octet-stream, and every answer carries nosniff and a sandbox CSP, so nothing it returns can run as a
 * page on our origin. Mirrored by tools/local_server.py (handle_stream); both are checked offline by
 * tools/test_stream_proxy.py.
 *
 * Signed addresses: only /api/resolve (and this proxy, for the parts of a playlist) make proxy addresses, each with
 * `exp` (seconds) and `sig`, an HMAC of the address with a server secret (STREAM_SIGNING_KEY, else derived from
 * ACCOUNTS_PEPPER). Anything else is refused, so the proxy is not open to other people's content. With no secret
 * (local development without .env) the proxy stays open.
 */

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Range, Content-Type, Accept, User-Agent, Referer, Origin",
  "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
};
// Whatever the proxy returns must never run as a page here
const SAFETY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "sandbox; default-src 'none'",
};
// Waiting for the upstream headers only: a long MP4 body keeps streaming after that
const UPSTREAM_HEADERS_TIMEOUT_MS = 15000;
const MAX_REDIRECTS = 5;
// Playlists and subtitles are read whole to be rewritten; real ones stay well under 1 MB
const MAX_BUFFERED_BYTES = 5 * 1024 * 1024;
const MEDIA_TYPE = /^(video\/|audio\/|application\/(mp4|octet-stream)$|binary\/octet-stream$)/i;
// Hosts disguise segments (".jpeg", text/html): the address decides the type, else plain data
const TYPE_BY_EXTENSION = { ts: "video/mp2t", mp4: "video/mp4", m4s: "video/mp4", m4v: "video/mp4", aac: "audio/aac", m4a: "audio/mp4", mp3: "audio/mpeg" };

// A signed address is good for a day: covers a long pause and casting; resolve answers are cached 30 min at most
export const STREAM_LINK_TTL_S = 24 * 3600;
const encoder = new TextEncoder();
const signingKeys = new Map();

/** The HMAC key for proxy addresses, or null when no secret is set. */
export async function streamSigningKey(env) {
  const secret = env && (env.STREAM_SIGNING_KEY || env.ACCOUNTS_PEPPER);
  if (!secret) return null;
  if (!signingKeys.has(secret)) {
    // Its own key: the same secret never signs two kinds of thing
    signingKeys.set(secret, crypto.subtle.importKey("raw", encoder.encode(`tvzinha-stream|${secret}`), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]));
  }
  return signingKeys.get(secret);
}

async function linkSignature(key, exp, url, referer, origin) {
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(`${exp}\n${url}\n${referer}\n${origin}`)));
  let text = "";
  for (const b of mac.slice(0, 16)) text += String.fromCharCode(b);
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** A proxy address for `url` (signed when `key` is set; `exp` keeps the parent's expiry for playlist parts). */
export async function proxiedStreamUrl(proxyBase, key, url, referer = "", { origin = "", exp = null } = {}) {
  let out = `${proxyBase}?url=${encodeURIComponent(url)}&referer=${encodeURIComponent(referer)}`;
  if (origin) out += `&origin=${encodeURIComponent(origin)}`;
  if (key) {
    const expires = exp || Math.floor(Date.now() / 1000) + STREAM_LINK_TTL_S;
    out += `&exp=${expires}&sig=${await linkSignature(key, expires, url, referer, origin)}`;
  }
  return out;
}

/** True when the address carries a valid, unexpired signature (always true with no key). */
async function linkIsValid(key, params, url, referer, origin) {
  if (!key) return true;
  const exp = Number(params.get("exp"));
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isInteger(exp) || exp < now || exp > now + 2 * STREAM_LINK_TTL_S) return false;
  const expected = await linkSignature(key, exp, url, referer, origin);
  const given = params.get("sig") || "";
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { ...CORS_HEADERS, "Access-Control-Max-Age": "86400" } });
}

export async function onRequestHead(context) {
  return onRequestGet(context);
}

function errorResponse(status, error) {
  return new Response(JSON.stringify({ error }), { status, headers: { ...CORS_HEADERS, ...SAFETY_HEADERS, "Content-Type": "application/json" } });
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && Boolean(url.hostname);
  } catch (e) {
    return false;
  }
}

/** Content type of a binary answer: media types as they come, anything else from the address, else plain data. */
function mediaType(upstreamType, url) {
  const type = String(upstreamType || "").split(";")[0].trim();
  if (MEDIA_TYPE.test(type)) return type;
  const extension = new URL(url).pathname.split(".").pop().toLowerCase();
  return TYPE_BY_EXTENSION[extension] || "application/octet-stream";
}

/**
 * Subtitle cues keep italics, bold and underline only. Any other complete tag is dropped and a stray "<" or ">"
 * (a tag split over two lines) is escaped, so the player can draw the cue as HTML without running anything.
 */
function cleanVtt(text) {
  return text.split("\n").map(line => {
    if (line.includes("-->")) return line;
    return line
      .replace(/<\/?[a-zA-Z][^<>]*>/g, tag => (/^<\/?[ibu]>$/i.test(tag) ? tag.toLowerCase() : ""))
      .replace(/<(?!\/?[ibu]>)/g, "&lt;")
      .replace(/(?<!<[ibu])(?<!<\/[ibu])>/g, "&gt;");
  }).join("\n");
}

/** Reads a whole body up to MAX_BUFFERED_BYTES; null when it is bigger. */
async function readCapped(response) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_BUFFERED_BYTES) {
      reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  const buf = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { buf.set(chunk, offset); offset += chunk.length; }
  return new TextDecoder().decode(buf);
}

/**
 * Fetches the target following redirects one by one (each new address must be http/https again).
 * Returns { response, url } with the final address, or { response: null } after too many or a bad redirect.
 */
async function fetchUpstream(targetUrl, headers) {
  let url = targetUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_HEADERS_TIMEOUT_MS);
    let response;
    try {
      response = await fetch(url, { method: "GET", headers, redirect: "manual", signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      if (response.body) response.body.cancel().catch(() => {});
      const next = new URL(location, url).toString();
      if (!isHttpUrl(next)) return { response: null, url };
      url = next;
      continue;
    }
    return { response, url };
  }
  return { response: null, url };
}

export async function onRequestGet(context) {
  const { request } = context;
  const urlObj = new URL(request.url);
  const targetUrl = urlObj.searchParams.get("url") || "";
  let customReferer = urlObj.searchParams.get("referer");
  let customOrigin = urlObj.searchParams.get("origin");

  // Only web addresses, and no line break that could add a header upstream
  if (!isHttpUrl(targetUrl) || /[\r\n]/.test(customReferer || "") || /[\r\n]/.test(customOrigin || "")) {
    return errorResponse(400, "bad_request");
  }
  // Only addresses this site made (signed by /api/resolve or by this proxy for a playlist's parts)
  const signingKey = await streamSigningKey(context.env);
  if (!(await linkIsValid(signingKey, urlObj.searchParams, targetUrl, customReferer || "", customOrigin || ""))) {
    return errorResponse(403, "forbidden");
  }
  const linkExp = signingKey ? Number(urlObj.searchParams.get("exp")) : null;

  // Custom referer override or automatic provider detection
  if (!customReferer) {
    if (targetUrl.includes("dramahot.top") || targetUrl.includes("zokoanime.video")) {
      customReferer = "https://zokoanime.video/";
      customOrigin = "https://zokoanime.video";
    } else if (targetUrl.includes("playercdn.workers.dev") || targetUrl.includes("embedplayer2.xyz")) {
      customReferer = "https://embedplayer2.xyz/";
      customOrigin = "https://embedplayer2.xyz";
    } else if (targetUrl.includes("googlevideo.com") || targetUrl.includes("blogger.com")) {
      customReferer = "https://www.blogger.com/";
    } else if (targetUrl.includes("peliculaplay.com")) {
      customReferer = "https://mgeb.top/";
    } else {
      customReferer = "https://tvzinhaonline.pages.dev/";
    }
  }
  // The anime host checks Origin together with its Referer (the resolver's probe sends both)
  if (!customOrigin && customReferer.includes("zokoanime")) customOrigin = "https://zokoanime.video";

  const forwardHeaders = new Headers();
  forwardHeaders.set("User-Agent", USER_AGENT);
  forwardHeaders.set("Referer", customReferer);
  if (customOrigin) forwardHeaders.set("Origin", customOrigin);
  if (request.headers.has("Range")) forwardHeaders.set("Range", request.headers.get("Range"));
  if (request.headers.has("Accept")) forwardHeaders.set("Accept", request.headers.get("Accept"));

  let upstream;
  let finalUrl;
  try {
    ({ response: upstream, url: finalUrl } = await fetchUpstream(targetUrl, forwardHeaders));
  } catch (err) {
    console.error("[stream] upstream request failed:", targetUrl, err && err.message);
    return errorResponse(502, "upstream_failed");
  }
  if (!upstream) return errorResponse(502, "upstream_failed");

  const isHead = request.method === "HEAD";
  const dropBody = () => { if (upstream.body) upstream.body.cancel().catch(() => {}); };

  // Upstream error: the status is kept (the player retries on it), the host's page is not passed on
  if (upstream.status >= 400) {
    dropBody();
    return new Response(isHead ? null : "upstream_error", {
      status: upstream.status,
      headers: { ...CORS_HEADERS, ...SAFETY_HEADERS, "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const contentType = (upstream.headers.get("content-type") || "").toLowerCase();
  const isM3U8 = targetUrl.includes(".m3u8") || finalUrl.includes(".m3u8") || contentType.includes("mpegurl");
  const isVtt = targetUrl.includes(".vtt") || finalUrl.includes(".vtt") || contentType.includes("text/vtt");

  // HLS playlist: rewrite relative and absolute paths (against the final address) so segments route through here
  if (isM3U8 && upstream.ok) {
    const headers = { ...CORS_HEADERS, ...SAFETY_HEADERS, "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8" };
    if (isHead) {
      dropBody();
      return new Response(null, { status: upstream.status, headers });
    }
    const playlistText = await readCapped(upstream);
    if (playlistText === null) return errorResponse(502, "upstream_too_large");
    const baseUrl = new URL(finalUrl);
    const proxyBase = `${urlObj.origin}${urlObj.pathname}`;
    // The playlist's parts expire with the playlist
    const proxied = (uri) => proxiedStreamUrl(proxyBase, signingKey, new URL(uri, baseUrl).toString(), customReferer, { exp: linkExp });

    const rewritten = (await Promise.all(playlistText.split("\n").map(async line => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      // URI in tags (e.g., #EXT-X-KEY:METHOD=...,URI="...", #EXT-X-MAP:URI="...")
      if (trimmed.startsWith("#")) {
        let out = line;
        for (const [match, uri] of [...line.matchAll(/URI=["']([^"']+)["']/g)]) {
          try {
            out = out.replace(match, `URI="${await proxied(uri)}"`);
          } catch (e) {
            // An address that does not parse stays as it is
          }
        }
        return out;
      }
      try {
        return await proxied(trimmed);
      } catch (e) {
        return line;
      }
    }))).join("\n");
    return new Response(rewritten, { status: upstream.status, headers });
  }

  // WebVTT subtitles: only harmless formatting tags reach the player
  if (isVtt && upstream.ok) {
    const headers = { ...CORS_HEADERS, ...SAFETY_HEADERS, "Content-Type": "text/vtt; charset=utf-8" };
    if (isHead) {
      dropBody();
      return new Response(null, { status: upstream.status, headers });
    }
    const vttText = await readCapped(upstream);
    if (vttText === null) return errorResponse(502, "upstream_too_large");
    return new Response(cleanVtt(vttText), { status: upstream.status, headers });
  }

  // Binary / segment stream (.ts, .m4s, .mp4): built from scratch, only the range headers come from upstream
  const headers = new Headers({ ...CORS_HEADERS, ...SAFETY_HEADERS, "Content-Type": mediaType(contentType, finalUrl) });
  for (const name of ["Content-Length", "Content-Range", "Accept-Ranges"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (isHead) dropBody();
  return new Response(isHead ? null : upstream.body, { status: upstream.status, headers });
}
