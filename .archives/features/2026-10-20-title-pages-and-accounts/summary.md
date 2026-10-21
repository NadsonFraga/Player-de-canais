# Summary: title pages, new header, Coleção and accounts

**Delivered:** 2026-10-21 (production, merged from `staging` with the user's approval). Plan: `plan.md` and
`phase4-plan.md`; tests and the user's answers: `tests.md`; security review: `security-review.md`.

## What the site gained

1. **Title page** (movies, series, animes) in full screen with the player in full screen: trailers, cast, collection,
   recommendations, upcoming episodes, "termina às", lists of a person or a company, address `?filme=`/`?serie=`/`?anime=`.
2. **New header**: brand icon, tabs, global search (titles, channels, people) with "/" shortcut, Coleção icon, profile
   menu.
3. **Coleção** (Assistindo, Quero assistir, Assistidos, Avaliados, Canais) and "Gostou? Avalie" at the end of a title.
4. **Accounts without e-mail** (4a): nickname and password, recovery code shown once, HttpOnly session cookie, attempt
   limits; Cloudflare D1 (`tvzinha-accounts`, `tvzinha-accounts-preview`).
5. **Profiles** (4b): up to 5, "Quem está assistindo?", illustrated (CC0) and line-icon avatars, data per profile, guest
   data question.
6. **Sync** (4c): field-by-field merge (newest wins, removals travel), signed-in only, abuse limits, Sair sends what is
   pending and clears the account's copies from the device.
7. **Configurações** (4d): topics on the left; Conta (password, recovery code, Sair, Apagar conta), Perfis, Player,
   Sincronização, Sobre; Privacidade and Termos rewritten for accounts.
8. **Security review** before production: third-party data escaped everywhere, strict CSP (no inline scripts), signed
   stream proxy addresses, API only for our origins with per-IP limits, identifiers validated, reserved sync keys
   refused, Actions pinned, dead JS and CSS removed (about 800 lines), Git history cleaned of chat exports, old keys,
   e-mail and local paths (commits now use the GitHub private e-mail).
9. **Cloudflare Turnstile** on sign-up, recovery and sign-in after 2 wrong passwords (`features/2026-10-21-turnstile/`).

## Production setup (done by the user)

D1 databases with `tools/accounts_schema.sql`; binding `DB` (Production `tvzinha-accounts`, Preview
`tvzinha-accounts-preview`); secrets `ACCOUNTS_PEPPER` and `TURNSTILE_SECRET` in Production and Preview; Turnstile widget
"Tvzinha Online" (Managed) for `tvzinhaonline.pages.dev` and `staging.tvzinhaonline.pages.dev`.

## Kept for later (backlog)

F12 ("termina às" elsewhere), F13 (fluidity review), F14 (custom domain + rate-limit rule), G7b (Google sign-in,
optional), Watch Party and Premium ("em breve" in the menu), B23 (pill on Android), S2 (security items kept as decided).
