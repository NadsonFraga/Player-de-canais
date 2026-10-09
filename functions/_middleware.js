/**
 * Tvzinha Online - Cloudflare Pages middleware: keeps internal repository folders private.
 *
 * Cloudflare Pages publishes the whole repository root, so notes, tools and chat exports would otherwise be
 * downloadable by anyone. These paths answer 404 as if they did not exist. `_routes.json` limits this middleware
 * to the paths below plus /api/*, so ordinary page, image and script requests never run it (no extra cost).
 *
 * Keep BLOCKED_PREFIXES, BLOCKED_FILES and `_routes.json` in sync.
 */

const BLOCKED_PREFIXES = ["/.archives/", "/tools/", "/docs/", "/.github/", "/.git/", "/scratch/"];
const BLOCKED_FILES = ["/claude.md", "/.gitignore", "/_headers"];

/** Normalizes a request path so encoded, upper-case or doubled-slash variants cannot slip past the list. */
function normalizePath(pathname) {
  let path = pathname;
  try {
    path = decodeURIComponent(pathname);
  } catch (e) {
    // A malformed escape is never a legitimate asset request
    return null;
  }
  return path.toLowerCase().replace(/\/{2,}/g, "/");
}

function isBlockedPath(pathname) {
  const path = normalizePath(pathname);
  if (path === null) return true;
  if (BLOCKED_FILES.includes(path)) return true;
  return BLOCKED_PREFIXES.some(prefix => path.startsWith(prefix) || path === prefix.slice(0, -1));
}

export async function onRequest(context) {
  const { pathname } = new URL(context.request.url);
  if (isBlockedPath(pathname)) {
    return new Response("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
  return context.next();
}
