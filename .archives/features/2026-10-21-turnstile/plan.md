# Turnstile on the account forms

> **Status:** implemented 2026-10-21, on staging for the manual tests (tests.md). Production waits for the user. Google sign-in stays optional for later (G7b), not part of this.

## Why

The account API already limits attempts (10 sign-ups an hour per device, 5 wrong passwords per nickname every 15 min,
30 per device an hour, 120 calls a minute per IP). What remains open: someone with many IPs can create accounts in bulk
(junk in the database) and try passwords on many nicknames a little at a time. Cloudflare Turnstile asks the browser to
prove it is a person, mostly without showing anything. It does not save function calls (the request still reaches the
function; that is F14).

## Where

- **Criar conta** and **Esqueci a senha**: always.
- **Entrar**: only after 2 wrong passwords for that nickname or that device in the current window, so a normal sign-in
  stays instant. The server answers `captcha_required`; the page shows the check and sends again by itself once it passes.
- Not in Configurações (changing the password, a new code, deleting the account already need the session and the
  password).

## Setup (user, once)

1. Cloudflare dashboard -> Turnstile -> Add widget: name "Tvzinha Online", hostnames `tvzinhaonline.pages.dev` and
   `staging.tvzinhaonline.pages.dev`, mode **Managed**.
2. Send the **site key** (public; it goes in the code).
3. Add the **secret key** as the secret `TURNSTILE_SECRET` in Production and Preview (like `ACCOUNTS_PEPPER`).

## Server (`functions/api/account/[[path]].js`, mirrored in `tools/local_accounts.py`)

- `register` and `recover` need `turnstileToken`; `login` needs it only after 2 failures (nickname or device). The token
  is checked with Cloudflare's `siteverify` (secret, token, IP), which must say `success`, the expected `action`
  (`register`, `recover`, `login`) and one of our hostnames.
- Errors: `captcha_required` (400), `captcha_failed` (403), `captcha_unavailable` (503, Cloudflare could not be reached:
  sign-up waits, nothing is created without the check).
- No `TURNSTILE_SECRET`: the check is off (local work without network). To catch a misconfiguration,
  `tools/check_deployment.py` asks staging and production to create an account without a token and expects
  `captcha_required`.
- The check goes in as a parameter of `handleAccount`, so the shared JSON cases run with a fake check (no network).

## Page (`modules/accountPage.js`)

- The Turnstile script (`challenges.cloudflare.com`, about 30 KB) loads only when the account page opens, and the check
  renders in "interaction-only" mode under the password: invisible unless Cloudflare needs a click. Dark theme, pt-BR.
- The button waits for the token (it usually arrives within a second, while the person types); a token is used once and
  renewed after each try.
- Messages: "Confirme a verificação para continuar.", "Não deu para confirmar que você é uma pessoa. Tente de novo.",
  "A verificação está fora do ar agora. Tente de novo em instantes."
- CSP: `script-src` gains `https://challenges.cloudflare.com` (frames are already allowed).
- Privacidade: one line saying the account forms use Cloudflare Turnstile to block robots.

## Keys by place

| Where | Site key | Secret |
|---|---|---|
| Production, staging | the user's widget | `TURNSTILE_SECRET` |
| Local server (localhost, LAN) | Cloudflare's test key that always passes, invisible (`1x00000000000000000000BB`) | the test secret that always passes, when `.env` has none |

## Tests

- `accounts_cases.json` (JavaScript and Python, fake check): sign-up without a token, with a refused token, with a good
  one; recovery the same; login without a token while there are fewer than 2 failures, required after 2; Cloudflare
  unreachable.
- `account_check.mjs` (local, test keys): the full flow still passes; with the "always blocks" test key, sign-up shows
  the failure message.
- Staging and production: the server refuses sign-up without a token (`check_deployment`). The full sign-up with the
  real check is in the manual tests: Cloudflare may challenge automated headless browsers.
- `settings_check`, `profile_check`, `sync_check`, `header_check` (unchanged flows), `test_security_headers.py` (the new
  `script-src`).

Branch `feat/turnstile` from `staging`; staging only, production waits for the user.
