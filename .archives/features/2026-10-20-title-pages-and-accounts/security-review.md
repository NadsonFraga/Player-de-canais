# Security and code review before production (2026-10-21)

Asked by the user before merging `staging` into `master`: dead code, a security review "in the OWASP standard", live
attack tests, and the whole backlog. Nothing was changed by the review itself; fixes wait for the user's decisions.

## Standard used

OWASP Top 10 (2021) as the risk map, checked item by item with OWASP ASVS 4.0.3 level 2 (the verification standard
for apps that keep personal data behind accounts) and the OWASP API Security Top 10 (2023) for `/api/*`. No standard
makes a site "totally secure"; the goal is no known open issue, defense in depth, and a way to notice abuse.

## Live tests (own site; low volume on staging, test accounts deleted)

Tools: an HTTP probe (files, headers, account and sync API, TMDB and stream proxies, resolve) against the local server
and staging, and a browser probe with malicious titles in TMDB data, the Coleção, progress and favorites.

Passed: SQL injection, type confusion, oversized and broken bodies, CSRF (no header, other origin), forged and
malformed session cookies, cookie flags (HttpOnly, Secure, SameSite=Lax, Path=/api), HTML in nickname and profile
name, path in avatar id, sync data validation (`javascript:` poster dropped, SQL-like keys refused, prefs clamped, future
times cut), Coleção/progress/favorites drawn escaped (no script ran), SSRF from Cloudflare (127.0.0.1, localhost,
169.254.169.254, LAN: 403), header injection in the stream referer, proxied HTML served inert (octet-stream + sandbox
CSP), TMDB proxy path allowlist (no account/auth endpoints, the key never in an answer), internal folders 404 on staging
(the 200s for `/.env`, `/TOOLS/...`, `/%2Etools/...` are the SPA fallback page, checked), clickjacking (frame-ancestors,
X-Frame-Options), nosniff, `.env` and `ACCOUNTS_PEPPER` never committed.

## Findings

| # | Severity | OWASP | Finding | Proposed fix |
|---|---|---|---|---|
| H1 | High | A03 Injection (XSS) | Home rows (`home.js` `createPosterCard`, hero genres) put TMDB titles, ratings and genres into `innerHTML` unescaped; channel names too (`home.js`, `channels.js`, from our own `canais.json`). Confirmed in the browser: a title with `<img onerror>` ran script 8 times. TMDB titles are community-edited third-party data. The 15/10 XSS test predates the home redesign. | Escape every interpolation; extend `tools/test_xss_protection.mjs` to the home and channel paths |
| H2 | High | A02/A05 (secret exposure) | The GitHub repository is public. `.archives/scopes/refactor-analysis.md` (tracked now) holds an old TMDB key (`2dca...`), and the history holds two chat exports with an e-mail address, local paths and another old key (`428f...`, already invalid). Neither is the key in use. | Revoke `2dca...` at TMDB if it still exists; remove it from the file; decide on rewriting history (force push) |
| M1 | Medium | API7 SSRF / A04 | `/api/stream` proxies any public http(s) address for anyone (open proxy): our function quota and domain can be used for other content. Cloudflare blocks internal addresses. | Signed, expiring stream addresses issued by `/api/resolve` (HMAC with a secret); or accept for now |
| M2 | Medium | A01/API4 | `isAllowedOrigin` accepts every `*.pages.dev` site and requests with no Origin: other people's Pages sites and scripts can use `/api/resolve` and `/api/tmdb` (our quotas). | Allow only `tvzinhaonline.pages.dev` and its preview subdomains; limits per IP for these routes too (F14 for the real cap) |
| M3 | Medium | A05 | CSP `script-src 'unsafe-inline'`: if HTML is ever injected, it runs. One inline script in `<head>` and 12 inline `onerror=` handlers depend on it. | Move the head script to a file (or hash it), replace inline handlers, drop `'unsafe-inline'` from `script-src` |
| M4 | Medium | A05/A10 (local only) | `tools/local_server.py` serves the whole folder (`.env` with keys, `.git`, `.archives`) and its stream proxy reaches 127.0.0.1/LAN. Default bind is 127.0.0.1 (only this computer); with `--lan` anyone on the Wi-Fi can read `.env`. | Mirror the middleware's blocked paths in the local server; refuse private addresses in its stream proxy |
| M5 | Medium | A05 | Third-party video iframes have no `sandbox` (popups, top-navigation attempts; the head guard mitigates; same-origin policy keeps our data safe). | Try `sandbox` per provider, keep it where players still work |
| L1 | Low | API8 / A03 | `/api/resolve` puts `id`/`mal_id` unchecked into third-party addresses (also a TMDB path with our key). | Accept digits only (`tt\d+` for IMDb) |
| L2 | Low | A08 | Sync accepts a favorite key `"__proto__"`, which then sets an object prototype in the page (no global pollution). | Refuse `__proto__`, `constructor`, `prototype` as keys (page and server) |
| L3 | Low | A07 | Login is faster for an unknown nickname (no hash): existence can be told apart (registration also reveals it). | Optional: hash a dummy on unknown nicknames (costs CPU) |
| L4 | Low | A07 | 5 wrong passwords lock a nickname for 15 min for everyone, owner included (targeted lockout). | Accept (trade-off), or count per nickname + device |
| L5 | Low | A04 | IP limits live in each isolate's memory (approximate). | F14 (custom domain + WAF rate rule) |
| L6 | Low | A02/A07 | PBKDF2 100 000 rounds (OWASP suggests 600 000 for SHA-256; capped by the free plan's CPU, pepper compensates); 8-character passwords without a breached-password list (ASVS asks 12 and a list): user decisions. | Keep; revisit on a paid plan |
| L7 | Low | A09 | No security event log or alert (failed logins, 429s, deletes). | Count events in D1 or Workers Analytics; a weekly look |
| L8 | Info | A05 | No HSTS header; `.dev` is HSTS-preloaded, so `pages.dev` is always HTTPS. | Add HSTS with a custom domain |
| L9 | Info | A08 | GitHub Actions pinned by tag, not commit hash; hls.js 1.5.8 and Artplayer 5.1.7 are older (SRI pinned). | Pin by hash; review library updates |

## Dead code

- Never used: `isConfirmOpen` (core/confirmDialog.js), `getPlaybackActiveState` (core/wakeLock.js),
  `openMobileDrawer` and `setupSidebarResizer` (modules/channels.js, with the `tvzinha_sidebar_width` key),
  `isNavMenuOpen` (modules/header.js). `getCurrentEpisodeContext` (series.js) is used only by a test tool.
- About 40 exports are used only inside their own file (or by tools): harmless.
- About 60-70 CSS classes are not written by any JS or HTML (old hero, welcome, quick channels, drawer, theater and
  movie search sections); each needs a check (some are built at run time) before removal.
- Backlog statuses out of date: the "feat grande" header still says "aguardando aprovação"; F11 (busca geral) was
  delivered in phase 2.

The old symbols (★ ✓ ✦ ▶) are a user decision (backlog E5), not a finding.

## Decisions and fixes (2026-10-21, branch `feat/security-review`)

The user approved the full package; `tvzinha.online` is not the user's (removed); M5 stays (most hosts refuse a
sandboxed frame); L3, L4, L6 stay as decided; L7 left out; the history rewrite comes last, after production.

| # | Status | What changed | Checked by |
|---|---|---|---|
| H1 | Fixed | Home rows, hero genres, channel names (cards, rows, sidebar, player header) and channel logos escaped (`home.js`, `channels.js`, `icons.js`, `series.js`) | New `tools/xss_app_check.mjs` on the real screens (Início, catalogs, Coleção, title page; scripts that run and injected handlers): 4/4 Chrome and Firefox; 0/4 on the old staging code |
| H2 | Fixed | History rewritten with `git filter-repo` (user approved it before production): the 4 chat exports removed from every version; the old keys, the e-mail and local user paths replaced by placeholders; commit e-mails moved to the GitHub private address; `master` and `staging` force-pushed | A scan of every object in the new history: no key, e-mail or local path; only 5 `.archives` documents differ from before in the current tree |
| M1 | Fixed | `/api/stream` takes only addresses signed by `/api/resolve` (HMAC-SHA256 of exp, url, referer, origin; 24 h; playlist parts keep the parent's expiry). Key: `STREAM_SIGNING_KEY`, else derived from `ACCOUNTS_PEPPER` (already in Production and Preview: nothing to set up) | `tools/test_stream_proxy.py --strict`: 29/29 both implementations, with 3 new cases (unsigned, signed for another address, expired); players play through it (collection, continue watching, touch suites) |
| M2 | Fixed | Origins: only `tvzinhaonline.pages.dev` and its previews (plus localhost/LAN for development); 300 calls a minute per IP on `/api/resolve` and `/api/tmdb` | `tools/test_resolve_cors.py` (updated): 0 failures |
| M3 | Fixed | The head guard moved to `assets/js/guard.js`; the 12 inline `onerror` handlers became `data-fallback-*` attributes with one listener (`core/imageFallback.js`); CSP `script-src` without `'unsafe-inline'`; the local server now sends the same CSP (read from `_headers`) | `tools/test_security_headers.py` (now forbids `'unsafe-inline'` and `'unsafe-eval'` in `script-src`; its SRI check fixed to read `engine.js`): 0 failures; every browser suite ran under the CSP |
| M4 | Fixed | Local server: the middleware's private paths and any dot-file (`.env`, `.git`) answer 404; its stream proxy refuses this computer and the local network | Attack probe: all private paths 404, SSRF to 127.0.0.1 refused |
| M5 | Kept | User decision | - |
| L1 | Fixed | `id`/`mal_id` digits only, `imdb_id` `tt` + digits (both implementations) | Attack probe: 400 |
| L2 | Fixed | `__proto__`, `constructor`, `prototype` refused as sync keys (page and both servers) | `sync_cases.json`: 48/48 JavaScript and Python |
| L9 | Fixed | GitHub Actions pinned to commit hashes (`checkout` v4, `setup-python` v5) | Workflow file |
| Dead code | Removed | JS: `isConfirmOpen`, `getPlaybackActiveState`, `openMobileDrawer`, `setupSidebarResizer` (+ `tvzinha_sidebar_width`), `isNavMenuOpen`. CSS: 122 selectors of 76 classes no code writes and the page never showed (checked by a run-time collection of every class on the main screens, desktop and phone); `:not(.tv-focused)` dropped (always true); classes built at run time (`is-10`...`is-18`, `is-sync-*`) kept | All browser suites |

Also found and fixed while testing: the browser tests left their temporary profiles in `%TEMP%` (about 25 GB filled the
disk) and a launched Firefox could outlive the test. Every test now removes its profile and stops any browser still
using it when it ends.

