/**
 * Tvzinha Online - Cloudflare Pages Function: /api/tmdb
 * TMDB reads for the browser with the key kept in the TMDB_API_KEY secret (D3): the site's code carries no key.
 *
 *   GET /api/tmdb?path=/discover/movie?with_genres=16&page=1&language=pt-BR  ->  TMDB's JSON
 *
 * Read paths only, same origins as /api/resolve. Answers are cached for 30 min by the browser and at the edge
 * (keyed by the path, never by the key). Mirrored by tools/local_server.py.
 */
import { isAllowedOrigin, apiIpBlockedFor } from "./resolve.js";

const TMDB_ORIGIN = "https://api.themoviedb.org";
// Only what the site reads: titles, lists, search; nothing that writes or reaches an account
const ALLOWED_PATH = /^\/(movie|tv|discover|trending|search|genre|collection|person|find)(\/|\?|$)/;
const CACHE_TTL_S = 1800;

function json(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...extraHeaders } });
}

/** The TMDB address for `path`, or null when the path is not an allowed read. */
export function tmdbTarget(path, key) {
  if (typeof path !== "string" || !ALLOWED_PATH.test(path) || path.includes("..") || /[\s\\]/.test(path)) return null;
  const target = new URL(`${TMDB_ORIGIN}/3${path}`);
  if (target.origin !== TMDB_ORIGIN || !target.pathname.startsWith("/3/")) return null;
  target.searchParams.delete("api_key");
  target.searchParams.set("api_key", key);
  return target;
}

export async function onRequestOptions(context) {
  const origin = context.request.headers.get("Origin");
  if (!isAllowedOrigin(origin)) return new Response(null, { status: 403 });
  return new Response(null, {
    status: 204,
    headers: { "Access-Control-Allow-Origin": origin || "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Max-Age": "86400", "Vary": "Origin" },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const origin = request.headers.get("Origin");
  if (!isAllowedOrigin(origin)) return json(403, { error: "origin_forbidden" });
  const cors = { "Access-Control-Allow-Origin": origin || "*", "Vary": "Origin" };
  const ipWait = apiIpBlockedFor(request.headers.get("CF-Connecting-IP"));
  if (ipWait) return json(429, { error: "too_many_requests" }, { ...cors, "Retry-After": String(ipWait) });

  const key = env && env.TMDB_API_KEY;
  if (!key) return json(503, { error: "tmdb_key_missing" }, cors);
  const path = new URL(request.url).searchParams.get("path") || "";
  const target = tmdbTarget(path, key);
  if (!target) return json(400, { error: "path_not_allowed" }, cors);

  const cache = typeof caches !== "undefined" ? caches.default : null;
  const cacheKey = new Request(`${new URL(request.url).origin}/api/tmdb-cache${path.startsWith("/") ? path : `/${path}`}`);
  if (cache) {
    const hit = await cache.match(cacheKey);
    if (hit) return new Response(hit.body, { status: hit.status, headers: { ...Object.fromEntries(hit.headers), ...cors } });
  }

  let upstream;
  try {
    upstream = await fetch(target.toString(), { headers: { Accept: "application/json" } });
  } catch (e) {
    return json(502, { error: "tmdb_unreachable" }, cors);
  }
  const body = await upstream.text();
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": upstream.ok ? `public, max-age=${CACHE_TTL_S}` : "no-store",
  };
  if (cache && upstream.ok) context.waitUntil(cache.put(cacheKey, new Response(body, { status: 200, headers })));
  return new Response(body, { status: upstream.status, headers: { ...headers, ...cors } });
}
