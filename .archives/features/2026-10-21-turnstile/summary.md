# Summary: Cloudflare Turnstile on the account forms

**Delivered:** 2026-10-21 (production, with the big feature). Plan: `plan.md`; tests: `tests.md`.

- Always on Criar conta and Esqueci a senha; on Entrar only after 2 wrong passwords (nickname or device), then the page
  adds the check and sends again by itself. Mostly invisible; when Cloudflare shows its box, a try made before ticking it
  says "Confirme a verificação para continuar." and goes on by itself once ticked.
- Server: `turnstileVerifier` in `functions/api/account/[[path]].js` (siteverify, action and hostname checked; Cloudflare
  unreachable creates nothing), mirrored in `tools/local_accounts.py` / `tools/local_server.py` (test keys locally).
- Secret `TURNSTILE_SECRET` (Production and Preview); public site key in `assets/js/core/turnstile.js`.
- `tools/check_deployment.py` checks that sign-up without the check is refused.
- Approved by the user on staging on 2026-10-21.
