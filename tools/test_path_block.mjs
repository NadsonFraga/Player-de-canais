/**
 * Checks the Cloudflare Pages path block (functions/_middleware.js) without a browser or a server.
 *
 * Usage: node tools/test_path_block.mjs
 */
import { onRequest } from "../functions/_middleware.js";

let failures = 0;
const check = (name, ok, detail = "") => { if (!ok) failures++; console.log(`${ok ? "OK  " : "FAIL"} ${name} ${detail}`); };
// Only onRequest is exported (Cloudflare turns every export of a functions file into a route), so everything is
// checked through it: a blocked path answers 404 and never calls the next handler.
const asked = async (rawPath) => {
  let calls = 0;
  const response = await onRequest({ request: new Request("https://site.test" + rawPath), next: async () => { calls++; return new Response("page"); } });
  return { status: response.status, reachedFile: calls > 0 };
};
const isBlockedPath = async (rawPath) => (await asked(rawPath)).status === 404;
const pathOf = (url) => new URL(url).pathname;

// What the site, its modules and its data need must stay public
for (const allowed of ["/", "/index.html", "/assets/js/main.js", "/assets/css/10-player-v3.css", "/assets/logos/fav/site.webmanifest",
                       "/assets/logos/channels/globo.webp", "/data/canais.json", "/data/proximos_jogos.json", "/api/resolve", "/api/stream"]) {
  check(`allows ${allowed}`, (await isBlockedPath(allowed)) === false);
}

// Internal folders and files, including the usual ways of dodging a plain prefix check
const blocked = [
  "/.archives/README.md", "/.archives/history/chat_history_full.jsonl", "/tools/local_server.py", "/docs/CHAT_HISTORY.md",
  "/.github/workflows/update_matches.yml", "/.git/config", "/scratch/test_batch_subs.py", "/CLAUDE.md", "/.gitignore", "/_headers",
  "/.ARCHIVES/README.md", "/Tools/local_server.py", "//tools/local_server.py", "/tools", "/.archives",
  "/%2Earchives/README.md", "/%2e%61rchives/README.md", "/tools%2Flocal_server.py", "/tools%5Clocal_server.py", "/%43LAUDE.md", "/.%67ithub/workflows/update_matches.yml", "/%ZZ",
];
for (const path of blocked) check(`blocks ${path}`, (await isBlockedPath(path)) === true);

// Dot segments are resolved by URL parsing before the check ever sees them
for (const url of ["https://site.test/assets/../tools/local_server.py", "https://site.test/assets/js/../../.archives/README.md"]) {
  check(`blocks ${url}`, (await isBlockedPath(pathOf(url))) === true, pathOf(url));
}

// End to end: a blocked path answers 404 and never calls the next handler; an allowed one passes through
let nextCalls = 0;
const context = (url) => ({ request: new Request(url), next: async () => { nextCalls++; return new Response("page"); } });
const denied = await onRequest(context("https://site.test/tools/local_server.py"));
check("blocked request returns 404 without reaching the file", denied.status === 404 && nextCalls === 0, `status ${denied.status}`);
const passed = await onRequest(context("https://site.test/assets/js/main.js"));
check("allowed request goes on to the next handler", passed.status === 200 && nextCalls === 1, `status ${passed.status}`);

console.log(failures ? `\n${failures} FAILED` : "\nALL PASSED");
process.exit(failures ? 1 : 0);
