# Phase 4 plan: account, profiles, sync and the Configurações screen

> **Status:** decisions answered on 2026-10-21 (below); avatars still open. Nothing is implemented.
> Part of the big feature (`plan.md` in this folder). Built on the 2026-10-19 decisions (G7, G7b, F10 in `backlog.md`) and
> the review points listed there; the 2026-10-19 draft (`features/2026-10-19-user-accounts-and-cloud-sync/plan.md`) is
> reference only (it used e-mail, a single blob per category and a max() merge that undoes removals).

## Goal

- An optional account without e-mail: nickname, password and a recovery code shown once.
- Netflix-style profiles inside each account (each profile has its own Coleção, progress, favorites and preferences).
- Sync between devices of: library (Quero assistir, Assistidos, notas), watch progress, channel favorites, player
  preferences. Removals and "Começar do início" travel too.
- The profile menu becomes real (switch profile, Entrar / Sair, Configurações) and the Configurações screen exists.
- Privacidade and Termos rewritten for the account.

Without an account nothing changes: everything keeps working in the browser as today.

## Delivery: four steps, each on staging with a hard stop

| Step | Branch | What |
|---|---|---|
| 4a | `feat/accounts` | Database, account API (create, sign in, sign out, recover, change password, delete), Entrar / Criar conta screens, session |
| 4b | `feat/profiles` | Profiles (create, rename, avatar, remove), the "Trocar" switch and the profile picker, data per profile on the device |
| 4c | `feat/sync` | Sync engine (client and server), first sign-in bringing the guest data, status in the menu |
| 4d | `feat/settings` | Configurações screen (account, profiles, player, sync, legal), Privacidade and Termos rewritten |

Production still gets the whole big feature at once, after 4d is approved.

## Infrastructure (the user creates it once, with a guide)

- Two Cloudflare D1 databases (SQLite at the edge): `tvzinha-accounts` (Production) and `tvzinha-accounts-preview`
  (Preview, used by staging), bound to the Pages project as `DB`. The schema is pasted in the D1 console
  (`tools/accounts_schema.sql`).
- Free plan limits: 5 GB, 5 million rows read and 100 000 rows written per day. Function calls stay the main budget
  (100 000 per day, shared with the players): see "Cost" below.
- Local development: `tools/local_server.py` mirrors the API with Python's `sqlite3` on a git-ignored file
  (`.local/accounts.sqlite3`, never under `data/`, which is public). The same JSON test cases run against both
  implementations, so they cannot drift.

## Data model

```sql
accounts   (id TEXT PK, nickname TEXT UNIQUE (lower-case), password_hash, password_salt,
            recovery_hash, recovery_salt, created_at, updated_at)
sessions   (token_hash TEXT PK, account_id, created_at, last_seen_at, expires_at)
profiles   (id TEXT PK, account_id, name, avatar, position, created_at, updated_at, deleted_at)
records    (profile_id, kind, key, data TEXT (JSON), updated_at, rev INTEGER, PRIMARY KEY (profile_id, kind, key))
counters   (profile_id TEXT PK, rev INTEGER)          -- last change number of each profile
attempts   (key TEXT PK, count, window_start)         -- rate limits (nickname, and a daily-salted hash of the IP)
```

- `kind` is `library` (one title: watchlist, watched, rating, each with its own time), `progress` (one show or movie),
  `favorite` (one channel: on/off with its time), `prefs` (the player preferences, one record).
- No e-mail, no real name, no IP stored (only a hash with a salt that changes daily, for the attempt limits).

## Security

- Passwords: PBKDF2-SHA256 with 100 000 iterations (the Workers maximum) and a 16-byte salt; compared in constant
  time. The recovery code (16 characters in 4 groups) is hashed the same way and shown only once.
- Session: a random 32-byte token in an `HttpOnly; Secure; SameSite=Lax; Path=/api` cookie, valid 90 days and renewed
  while in use; the database keeps only its SHA-256 hash. Scripts in the page cannot read it.
- Every write needs our origin (`isAllowedOrigin`) and a custom header, so other sites cannot post for the user.
- Attempt limits: 5 wrong passwords or codes per nickname every 15 minutes; 30 per device (IP hash) per hour.
- Nickname: 3 to 20 characters, letters, numbers, dot, dash and underscore; unique without case. Password: at least 8
  characters.
- Deleting the account removes the account, its sessions, profiles and every record at once.

## API (Pages Functions, mirrored by the local server)

| Route | Does |
|---|---|
| `POST /api/account/register` | nickname + password -> account, first profile, session cookie, recovery code |
| `POST /api/account/login` / `logout` | sign in (cookie) / sign out (session removed) |
| `GET /api/account/me` | account, profiles (no secrets) |
| `POST /api/account/recover` | nickname + recovery code + new password -> new code, other sessions signed out |
| `POST /api/account/password` | current + new password |
| `POST /api/account/delete` | password -> everything removed |
| `POST /api/account/profiles` | create, rename, change avatar, remove (max 5) |
| `POST /api/sync` | profile, last change number seen, local changes -> merged changes since that number |

## Sync rules

- The client keeps the last change number (`rev`) it received per profile and the time of each local change.
- A push sends only what changed since the last push; the server merges each record **field by field, newest time
  wins** (library: watchlist, watched and rating separately; favorite: on/off; progress: the show entry and each
  episode position separately; prefs: the whole object) and answers with every record changed since the client's
  `rev`.
- A removal is a field turned off with its time, never a deleted row, so it reaches the other devices.
- "Começar do início" and rewatching save a newer time, so they win (the old draft's max(position) undid them).
- When: on opening the site, when the tab comes back after 5 minutes away, 30 s after the last change, when the page
  is hidden (`keepalive`), and from "Sincronizar agora". One request carries everything (no request per item).
- Offline or server errors: nothing is lost; changes wait and go with the next sync.

## Data on the device

- Signed out: today's keys, as they are (guest data).
- Signed in: the same keys with the profile in the name (`tvzinha_library_v1:<profile>`...). One helper picks the key,
  and every module reads and writes through it (today the progress is written in two places; both go through it).
- First sign-in on a device with guest data: "Levar o que está neste aparelho para o perfil X?" (default yes on a new
  account). Nothing is merged without asking.
- Signing out removes that account's copies from the device (shared computers); the guest data stays.

## Screens

- **Entrar / Criar conta:** a full-screen page like the title page: nickname, password, "Criar conta" or "Entrar",
  "Esqueci a senha" (nickname + code + new password). After creating: the recovery code in large type with "Copiar" and
  "Guardei o código" (required to continue). Text under the button: "Ao criar a conta, você concorda com os Termos de
  uso e a Política de Privacidade", with links.
- **Profile picker:** full screen, profiles as large avatars with their names, "Adicionar perfil", "Gerenciar
  perfis". Opens after signing in when there are two or more profiles, and from "Trocar" in the menu.
- **Avatars:** our own set of 12 line icons on colored circles (no characters, no photos, no Gravatar).
- **Profile menu (signed in):** the profile at the top with "Trocar"; Watch Party (em breve), Premium (em breve),
  Configurações, Sair. Signed out: "Visitante" and Entrar ou criar conta.
- **Configurações:** a full-screen page with sections: Conta (nickname, change password, new recovery code, sign out,
  delete account), Perfis, Player (subtitles, quality, Ajustar / Preencher, speed), Sincronização (last sync, "Sincronizar
  agora"), Sobre (Privacidade, Termos, DMCA, ad-block tips). Works with the TV remote.

## Cost (Cloudflare function calls)

About 1 call on opening the site, 1 per sync (a few per visit) and none for reading the Coleção. Estimate: 5 to 10
calls per signed-in visitor per day; 1 000 such visitors use 5 000 to 10 000 of the 100 000 daily calls. Guests cost
nothing new.

## Tests

- Merge rules: one set of JSON cases run against the JavaScript and the Python code.
- API (`tools/test_accounts_api.py`): register, duplicate nickname, login, wrong password limits, recover, change
  password, delete, profiles, sync merge (removal travels, newer time wins), CORS and missing header refused.
- Browser (`tools/account_check.mjs`, Chrome and Firefox): create an account with guest data, the code screen, a second
  browser signs in and receives the data, profiles keep their data apart, sign out clears the device copy, delete.
- The existing suites, with the account signed out and signed in.

## Decisions (user, 2026-10-21)

1. No e-mail (confirmed after discussing it: sending e-mail needs a provider and our own domain; it can come later as an
   optional recovery e-mail, so the accounts table keeps room for it).
2. Passwords: at least 8 characters with at least one letter and one number, and not equal to the nickname. No list of
   common passwords (the user found it unnecessary). A strength bar computed in the browser (length and variety) guides
   without blocking. Same rules checked by the server.
3. Up to 5 profiles per account; Netflix-like flow: after creating the account or signing in, the profile picker
   ("Quem está assistindo?") with "Adicionar perfil".
4. Signing out removes the account's copies from the device (the account itself stays intact on the server).
5. Sign-up acceptance: a line with links under the button, no checkbox.
6. Four steps (4a to 4d), each with its own stop on staging.
7. Avatars: open (see the answer in the chat of 2026-10-21; the user is looking for a set).
