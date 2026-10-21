# Turnstile: tests

**Date:** 2026-10-21 · **Staging:** https://staging.tvzinhaonline.pages.dev (widget "Tvzinha Online", Managed, secret
`TURNSTILE_SECRET` in Production and Preview)

## Automated

| Check | Result |
|---|---|
| `accounts_api_check.mjs` / `test_accounts_api.py` (fake check): sign-up without the check refused before anything else, a refused check, Cloudflare unreachable (nothing created), recovery without the check, sign-in asks nothing for 2 wrong passwords then asks, with the check a wrong password is still wrong and the right one signs in, the device keeps asking for a while | 73/73 and 73/73 |
| `sync_api_check` / `test_sync_api` (their sign-ups pass the fake check) | 48/48 and 48/48 |
| `account_check.mjs` (local, Cloudflare test keys): full flow; 2 wrong passwords then the right one goes through the check by itself; the "always blocks" test key stops Criar conta with its message | 18/18 Chrome, 18/18 Firefox |
| `profile_check`, `sync_check`, `settings_check`, `header_check`, `xss_app_check` | 15/15, 8/8, 8/8 (Chrome and Firefox), 26/26, 4/4 |
| `test_security_headers.py` (`script-src` with `challenges.cloudflare.com`, still no `'unsafe-inline'`) | 0 failures |
| `check_deployment.py`: sign-up without the check refused (`captcha_required`), the proxy refuses an unsigned address | see below |

## Manual (user, on staging)

| # | Steps | Expected | Result |
|---|---|---|---|
| 1 | Criar conta (a test account) | Usually nothing to click; the account is created | |
| 2 | Esqueci a senha | Works the same | |
| 3 | Entrar with a wrong password twice, then the right one | After the second error a small check may appear (or not); the right password signs in | |
| 4 | Phone: Criar conta | Same; the check fits the screen when it shows | |
