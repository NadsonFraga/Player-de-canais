# Handover 2026-10-21: big feature, security review and Turnstile in production

Read `CLAUDE.md` (rules), then this file, then `.archives/backlog.md` (the open queue).

## State

- `master` (production, https://tvzinhaonline.pages.dev) and `staging` (https://staging.tvzinhaonline.pages.dev) are
  equal and pushed; working tree clean; current branch `staging`. Version stamp `20261021_1511`.
- Delivered today: title pages, new header with global search, Coleção, accounts without e-mail, profiles, sync,
  Configurações, security review, Cloudflare Turnstile. Summary:
  `features/2026-10-20-title-pages-and-accounts/summary.md`; Turnstile: `features/2026-10-21-turnstile/summary.md`.
- The user is now creating a real account in production to test it.

## Things that changed how work is done

- **Git history was rewritten** (chat exports, old keys, e-mail and local paths removed; see backlog S1). Commit hashes
  quoted in older docs no longer exist. Commits use the GitHub private e-mail
  (`164121553+NadsonFraga@users.noreply.github.com`, set in this repository's git config). A backup of the old history
  is kept on purpose at `%LOCALAPPDATA%\tvzinha-local\repo-backup-2026-10-21.git` (the user wants to keep it: do not
  delete it, never push it).
- **Never commit chat exports or secrets**: `.archives/history/` is git-ignored; secrets live only as Cloudflare secrets
  and in the git-ignored `.env`. The repository is public.
- **Cloudflare setup** (done by the user): D1 `tvzinha-accounts` (Production) and `tvzinha-accounts-preview`
  (Preview) bound as `DB`; secrets `ACCOUNTS_PEPPER` (password hashes and the stream proxy signature) and
  `TURNSTILE_SECRET`, both in Production and Preview; Turnstile widget "Tvzinha Online" (Managed). Never change
  `ACCOUNTS_PEPPER` (existing passwords would stop working).
- **CSP has no `'unsafe-inline'` for scripts**: no inline `<script>` and no `onerror=`/`onclick=` attributes; broken
  images use `data-fallback-src` (`core/imageFallback.js`). Third-party text always goes through `escapeHtml`/`escapeAttr`.
- **Stream proxy only takes signed addresses** made by `/api/resolve` (`proxiedStreamUrl` in `functions/api/stream.js`).
- **API origins**: only `tvzinhaonline.pages.dev`, its previews, localhost and LAN.
- **Local server** (`tools/local_server.py`) mirrors the functions, sends the production CSP, blocks private files and
  uses Cloudflare's Turnstile test keys. A server on port 8787 may be the user's: check before starting one, ask before
  stopping it. Tests can use `--base=http://127.0.0.1:<port>`.
- **Browser tests** now delete their temporary profiles and stop their browser at the end (they once filled the disk
  with ~25 GB). Run long suites with `timeout`. Test browsers always `--mute-audio`.
- On staging and production the real Turnstile challenges automated browsers: full sign-up is tested by the user there.

## Main tests

`node tools/accounts_api_check.mjs` + `python tools/test_accounts_api.py` (73/73), `node tools/sync_api_check.mjs` +
`python tools/test_sync_api.py` (48/48), `python tools/test_stream_proxy.py --strict` (29/29),
`python tools/test_resolve_cors.py`, `python tools/test_security_headers.py`, browser: `account_check`, `profile_check`,
`sync_check`, `settings_check`, `header_check`, `title_page_check`, `collection_check`, `xss_app_check`,
`player_touch_check`; after a deploy `python tools/check_deployment.py <url>`. Known flaky: `player_ui_check` DBZ T9E31
(B21).

## Next (user's choice; suggestions)

F13 fluidity review of the whole site, B23 header pill rising on Android, P4/B7 faster and steadier players, F7 sports
calendar (needs its own plan). Watch Party and Premium still show "em breve" in the menu. Google sign-in stays optional
(G7b).
