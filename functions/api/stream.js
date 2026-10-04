/**
 * Tvzinha Online - Cloudflare Pages Function: /api/stream
 * Edge CORS Proxy for video manifests (.m3u8), segments (.ts/.m4s), MP4 streams, and WebVTT subtitles.
 * Injects required Referer/Origin headers to prevent 403 Forbidden and enables full CORS.
 */

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, Content-Type, Accept, User-Agent, Referer, Origin",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function onRequestHead(context) {
  return onRequestGet(context);
}

export async function onRequestGet(context) {
  const { request } = context;
  const urlObj = new URL(request.url);

  const targetUrl = urlObj.searchParams.get("url");
  if (!targetUrl) {
    return new Response(JSON.stringify({ error: "Missing 'url' query parameter" }), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  // Custom referer override or automatic provider detection
  let customReferer = urlObj.searchParams.get("referer");
  let customOrigin = urlObj.searchParams.get("origin");

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

  try {
    const forwardHeaders = new Headers();
    forwardHeaders.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
    if (customReferer) forwardHeaders.set("Referer", customReferer);
    if (customOrigin) forwardHeaders.set("Origin", customOrigin);

    if (request.headers.has("Range")) {
      forwardHeaders.set("Range", request.headers.get("Range"));
    }
    if (request.headers.has("Accept")) {
      forwardHeaders.set("Accept", request.headers.get("Accept"));
    }

    const upstreamResponse = await fetch(targetUrl, {
      method: "GET",
      headers: forwardHeaders,
      redirect: "follow",
    });

    const contentType = upstreamResponse.headers.get("content-type") || "";
    const isM3U8 = targetUrl.includes(".m3u8") || contentType.includes("mpegurl") || contentType.includes("application/x-mpegURL");

    const isHead = request.method === "HEAD";

    // If HLS playlist (.m3u8), rewrite relative & absolute paths so segments route through this proxy
    if (isM3U8 && upstreamResponse.ok) {
      const resHeaders = new Headers(upstreamResponse.headers);
      resHeaders.set("Access-Control-Allow-Origin", "*");
      resHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      resHeaders.set("Access-Control-Allow-Headers", "Range, Content-Type, Accept, User-Agent, Referer, Origin");
      resHeaders.set("Content-Type", "application/vnd.apple.mpegurl; charset=utf-8");

      if (isHead) {
        return new Response(null, {
          status: upstreamResponse.status,
          headers: resHeaders,
        });
      }

      const playlistText = await upstreamResponse.text();
      const baseUrl = new URL(targetUrl);
      const proxyBase = `${urlObj.origin}${urlObj.pathname}`;

      const rewritten = playlistText.split("\n").map(line => {
        const trimmed = line.trim();
        if (!trimmed) return line;

        // Rewrite URI in tags (e.g., #EXT-X-KEY:METHOD=...,URI="...", #EXT-X-MAP:URI="...")
        if (trimmed.startsWith("#")) {
          return line.replace(/URI=["']([^"']+)["']/g, (match, uri) => {
            const absUri = new URL(uri, baseUrl).toString();
            const proxied = `${proxyBase}?url=${encodeURIComponent(absUri)}&referer=${encodeURIComponent(customReferer || "")}`;
            return `URI="${proxied}"`;
          });
        }

        // Rewrite segment/sub-playlist line
        try {
          const absUri = new URL(trimmed, baseUrl).toString();
          return `${proxyBase}?url=${encodeURIComponent(absUri)}&referer=${encodeURIComponent(customReferer || "")}`;
        } catch (e) {
          return line;
        }
      }).join("\n");

      return new Response(rewritten, {
        status: upstreamResponse.status,
        headers: resHeaders,
      });
    }

    // Binary / Segment stream response (.ts, .m4s, .mp4, .vtt)
    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "Range, Content-Type, Accept, User-Agent, Referer, Origin");
    responseHeaders.set("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");

    return new Response(isHead ? null : upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Stream proxy failure", message: err.message }), {
      status: 502,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
