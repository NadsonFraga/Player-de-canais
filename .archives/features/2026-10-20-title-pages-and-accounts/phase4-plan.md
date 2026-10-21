# Phase 4 plan: account, profiles, sync and the Configurações screen

> **Status:** 4a, 4b and 4c approved on staging (2026-10-21). 4d implemented (two-pane layout), on staging for the manual tests.
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
7. Avatars: option C, free-license illustrated avatars (CC0, licence checked per style, e.g. DiceBear "Lorelei" or
   "Notionists") plus our own line icons, all on a palette of colored backgrounds; small SVG files loaded only by the
   profile screens. The user may swap them later.
8. Profile picker: after creating the account and after signing in, like Netflix. On later visits it shows again when
   the site was last used more than 3 hours before; within 3 hours the same profile continues.
9. The account flow must feel very fluid (instant feedback, transitions, no jumps): it is the first thing people see.
   A review of the fluidity of the whole site comes later (backlog F13).

## Step 4b in detail (written 2026-10-21, after 4a was approved)

Branch `feat/profiles` from `staging`.

### Server

- `POST /api/account/profiles` with `{ action, ... }`, signed in only, answers the full profile list:
  - `create { name, avatar }`: up to 5 profiles (`profiles_full` after that).
  - `update { id, name?, avatar? }`: rename and/or change the avatar.
  - `remove { id }`: marks `deleted_at` (4c tells the other devices); the last profile cannot be removed (`profile_last`).
- Rules: name 1 to 20 characters after trimming, unique inside the account without case (`profile_name_taken`);
  avatar one of the ids the site ships (`avatar_unknown` otherwise); another account's profile answers `not_found`.
- Same code in `functions/api/account/[[path]].js` and `tools/local_accounts.py`; new cases in `tools/accounts_cases.json`
  run against both.

### Avatars

- 24 illustrated faces, both styles CC0 (license checked on dicebear.com/licenses on 2026-10-21): 12 "Lorelei"
  (Lisa Wischofsky) and 12 "Notionists" (Zoish), plus 8 of our own line icons (TV, film, popcorn, star, ...), each on a
  color of one palette.
- Generated once by `tools/make_avatars.mjs` and committed as small SVG files in `assets/img/avatars/` (no request to
  DiceBear at run time). Ids: `l01`-`l12`, `n01`-`n12`, `i01`-`i08`; the server keeps the same list. The 4a default `a01`
  maps to `l01`.
- Loaded only where shown: the active avatar in the pill and menu, the rest only by the picker and the editor.
- Credit line in Sobre / Termos (4d): "Avatares Lorelei (Lisa Wischofsky) e Notionists (Zoish), CC0".

### Data per profile on the device

- One helper, `core/profileStore.js`: `storageKey(base)` gives `base` for guests and `base:<profileId>` when signed
  in. Per profile: library, watch progress, channel favorites, favorite team, player preferences. Shared by the device:
  TMDB caches, ad-block notice, sidebar width, the account cache.
- Every read and write goes through it (series.js reads and writes the progress directly today: it moves to
  `core/watchProgress.js`).
- Switching profile fires `tvzinha:profile`: the stores drop their memory copies (player prefs cache, favorites and team
  in the store) and the screens redraw (Início rows, Coleção, channel stars, header); the site goes to Início.
- First use of a profile on a device that has guest data: "Levar o que está neste aparelho para o perfil X?" (Sim /
  Começar vazio). Sim copies the guest data into the profile; the guest data stays. (Brought forward from 4c because 4b is
  where the profile keys appear; 4c then sends it up.)
- Sign out keeps the profile copies in 4b: with no sync yet, removing them would lose data. The removal (decision 4)
  turns on in 4c, once the data is on the server.

### Screens

- **Quem está assistindo?** Full screen, avatars in a row (wrapping on phones) with the names, "Adicionar perfil" while
  under 5, "Gerenciar perfis". Opens after creating the account (after "Guardei o código"), after signing in, from
  "Trocar" in the menu, and on opening the site when the last use was more than 3 hours before. After sign-in or the
  3-hour mark a profile must be chosen (Back does nothing there); from "Trocar", Back closes it.
- **Gerenciar perfis:** a pencil on each avatar; the editor has the name, the avatar grid (Ilustrados / Ícones) and
  "Excluir perfil" with a confirmation (not shown for the last profile). "Adicionar perfil" opens the same editor empty.
- Menu: the avatar and name of the active profile at the top, "Trocar" enabled; the pill shows the avatar instead of the
  initial.
- Works with the TV remote; transitions as on the account page; phone layout.

### Tests

- API: the new cases (5 profiles then refused, duplicate name, unknown avatar, last profile, another account's profile,
  removed profile gone from `me`), JavaScript and Python.
- Browser, new `tools/profile_check.mjs` (Chrome and Firefox): picker after sign-in, add and edit a profile, data kept
  apart (a title saved in one profile is missing in the other), Trocar, the 3-hour rule, the guest data question, phone
  width, Back rules.
- `account_check`, `header_check`, `collection_check`, `continue_watching_check`, `title_page_check` and the player
  suites (the storage keys change under them).

## Step 4c in detail (written 2026-10-21, after 4b was approved)

Branch `feat/sync` from `staging`. No database change (the `records` and `counters` tables exist since 4a).

### What travels (one record per item, per profile)

| kind | key | data | merge |
|---|---|---|---|
| `library` | `movie:<id>` / `tv:<id>` | the library entry (title, poster, year, `watchlist`, `watched`, `rating`) | each of `watchlist`, `watched`, `rating` by its own time; the title data follows the newest |
| `progress` | show id / `movie:<id>` | the "Continuar assistindo" entry | the head (season, episode, `timestamp`) by `timestamp`; each episode position by its `at`; `hidden` by `hiddenAt` against `timestamp` (watching again brings it back); a movie's position by `at`; at most 40 positions kept, as on the device |
| `favorite` | channel key | `{ on, at }` | by `at` |
| `prefs` | `player` | the player preferences with `at` | the whole object, newest wins |
| `prefs` | `team` | `{ team, at }` | newest wins |

- Favorites, the team and the player preferences get a time when they change (today they have none): `toggleFavorite`,
  `setFavoriteTeam` and `setPlayerPref` write it next to the value, in a small side record, so the stored formats stay
  as they are.
- Removals are fields turned off with their time (the library already works this way; a favorite becomes
  `{ on: false, at }`), never a deleted row, so they reach the other devices. "Começar do início" saves a newer time and
  wins.
- One merge module, `assets/js/core/syncMerge.js` (no imports), used by the page and by the Cloudflare function (a
  relative import: Pages bundles it). If the bundling refuses a file outside `functions/`, a copy goes to
  `functions/api/_lib/` with a check that both are identical. The Python mirror (`tools/local_sync.py`) runs the same
  JSON cases (`tools/sync_cases.json`), like the account API.

### Server: `POST /api/sync`

- Body `{ profileId, since, changes: [{ kind, key, data }] }`; signed in, same origin and header as the account writes.
- The profile must belong to the account (`not_found` otherwise). Each change is merged with the stored record; a
  record that really changed gets the profile's next change number (`rev`).
- Answer `{ rev, changes, more }`: every record with `rev > since` (the client merges them again, which changes nothing
  for its own), at most 500 per answer; `more: true` makes the client ask again.
- Limits: body up to 256 KB (the account routes keep 4 KB), up to 300 changes per request, 16 KB per record, 5 000
  records per profile; one sync per second per session is enough (more answers `too_many_attempts`).
- Writes go in one D1 batch (one round trip), so a first upload of a big library stays fast.

### Client: `assets/js/core/sync.js`

- Per profile and device, `tvzinha_sync_v1:<profile>`: the last `rev` received and a fingerprint of each record as the
  server last confirmed it. A sync builds the records from the stores, sends only those whose fingerprint differs (up to
  300 per request, more requests if needed), then merges the answer into the stores and redraws (the same events as a
  profile switch).
- When: on opening the site (once a profile is in use), 30 s after the last change, when the page is hidden (sent with
  `keepalive`), on coming back to the tab after 5 minutes away, before switching profile, and from "Sincronizar agora"
  (Configurações, 4d). Never during a sync already running. Guests never sync.
- Offline or server errors: nothing is lost (the fingerprints only move once the server confirms); the next sync sends
  it. Retries wait longer each time (30 s, 1 min, 2 min... up to 10 min).
- First sync of a profile on a device: `since = 0` brings everything the account has; what the device has (for example
  what "Sim" brought from the guest data in 4b) goes up in the same sync.
- A profile removed on another device: its copies on this device are removed when `/me` no longer lists it.

### Sair (decision 4 turns on)

- Sair first sends what is pending (up to 4 s). Then it removes every copy of the account's profiles from the device and
  their sync records; the guest data stays.
- If the pending changes could not be sent (offline): "Algumas mudanças ainda não foram enviadas. Sair mesmo assim?"
  with Sair / Cancelar.

### Abuse limits and data checks (asked by the user when approving 4c)

- Rejected before any database read, at no D1 cost: wrong method, origin or header, oversized body, broken JSON, a
  cookie that cannot be a session token.
- Per IP, counted in the isolate's memory (approximate, free): at most 60 account or sync calls a minute; more answers
  429 at once.
- Per account (D1 counters in `attempts`): 1 sync a second, 120 an hour, 10 000 records written a day; 5 000 records per
  profile, 16 KB per record. Normal use stays far below; the page waits longer after a 429.
- Data checks on the server: only known kinds and fields are kept (anything else is dropped), ids and numbers checked,
  texts trimmed to a length, poster paths must look like TMDB paths, times in the future are cut to "now" (so nobody can
  make a change win forever). Synced titles are still escaped when shown.
- What code cannot stop: every call that reaches the function counts toward the 100 000 daily calls, rejected or not. A
  large flood could use them up (players and accounts would stop until the next day; the site itself stays up).
  Cloudflare's automatic DDoS protection covers `pages.dev`; a free rate-limiting rule that blocks before the function
  runs needs a custom domain (backlog item).

### Status in the menu

- Under the profile name in the menu: "Sincronizado agora" / "Sincronizado há 5 min" / "Sincronizando..." / "Sem
  conexão: as mudanças esperam". No toast for routine syncs.

### Cost

- About 1 call on opening, 1 per batch of changes (30 s after the last one) and 1 when leaving: 5 to 10 calls per
  signed-in visitor per day, as estimated before. D1: one row written per changed record.

### Tests

- Merge: `tools/sync_cases.json` (newest field wins, removal travels, rewatch brings back a hidden entry, "Começar do
  início" wins over an older further position, positions capped at 40, the same change twice changes nothing) against
  `syncMerge.js` and the Python mirror.
- API: signed out, another account's profile, `since` and paging (`more`), the limits, a change sent twice gets no new
  `rev`.
- Browser, new `tools/sync_check.mjs` with two separate browsers (A and B) on the same account, Chrome and Firefox:
  A saves a title, a rating, a favorite and progress; B opens and has them; B removes the title; A gets the removal;
  B goes offline, changes, comes back and the change arrives; Sair on A removes the profile copies and keeps the guest
  data; two profiles stay apart in the cloud.
- `account_check`, `profile_check`, `collection_check`, `continue_watching_check`, `header_check`, the player suites.

### Sync timing as built (confirmed with the user on 2026-10-21)

| Moment | When | What |
|---|---|---|
| Opening the site (signed in, profile in use) | 1.5 s after it loads | brings what changed elsewhere, sends what is pending |
| A change here (Coleção, favorites, team, player preferences, movie progress) | 30 s after the **first** unsent change (later changes do not push it back) | one request with everything changed meanwhile; a playing movie saves every ~10 s, so it syncs at most every 30 s |
| Episode positions of series | saved without starting the 30 s count | go with the next sync (page hidden, another change, opening) |
| Page hidden (tab switch, minimize, close, phone locked) | at once, only when something is pending | sent with `keepalive` (survives the page closing) |
| Back to the tab after more than 5 minutes away | 0.5 s after coming back | brings what changed elsewhere |
| Profile switch | at once | what the old profile left goes first, then the new one syncs |
| "Sim" to the guest data question | 2 s later | sends what was brought |
| Connection back (`online`) | 1 s later | sends what waited |
| Sair | before signing out, up to 4 s | sends what is pending; asks before leaving unsent changes |
| "Sincronizar agora" (Configurações, 4d) | at once | full sync |
| Errors | 30 s, 1, 2, 4, 8, 10 min; a 429 waits the time the server gives | |

Guests never sync. **Decision:** while a tab is open and in use it does not ask the server for news on its own; a change
made on another device shows after a reload, a return to the tab after 5 minutes, or the next sync of this device.
A light check every 5 minutes while the tab is visible was offered (up to 12 calls an hour per open tab) and left out
for now to save the daily calls; it can be added later if needed.

## Step 4d in detail (written 2026-10-21, after 4c was approved)

Branch `feat/settings` from `staging`. No database or API change (the account routes for password, recovery code and
delete exist since 4a).

### Configurações (a full-screen page, like the account and profile pages)

- Opened from "Configurações" in the profile menu (no "em breve" any more), for guests too. Back and Esc close it.
- Layout (user, 2026-10-21: "algo bem moderno, seguindo os padrões da indústria"): two panes on computers and TVs, the
  topics on the left (icon + name: Conta, Perfis, Player, Sincronização, Sobre) and the chosen topic on the right, in
  grouped cards of rows (title, short description, control on the right), segmented choices for the player options
  and a "zona de perigo" at the end of Conta; switching topic changes only the right side. Phones: the list of topics
  first, a topic opens full screen and Back returns to the list. TV remote: up/down on the list, right into the topic.
- **Conta** (signed in): nickname and creation date; **Trocar senha** (current + new, the same rules, strength bar and
  live checks as Criar conta; the other devices are signed out, as the API already does); **Gerar novo código de
  recuperação** (asks the password, shows the new code once with Copiar, like after Criar conta; the old one stops
  working); **Sair**; **Apagar conta** (password + a red confirmation: "Isso apaga a conta, os perfis e tudo o que foi
  sincronizado. Não dá para desfazer."; then the account's copies leave the device, the guest data stays). Guests see a
  card "Entrar ou criar conta" instead.
- **Perfis** (signed in): the profiles with their avatars and "Gerenciar perfis" (opens the profile page already in the
  manage mode).
- **Player**: Legenda preferida (Automática / Português / Inglês / Desligada), Qualidade (Automática / 1080p / 720p /
  480p), Tela (Ajustar / Preencher), Velocidade (0.75x to 2x). The same preferences the player already saves when you
  change them while watching; per profile, and synced.
- **Sincronização** (signed in): the status line of the menu ("Sincronizado há 5 min"...) and "Sincronizar agora" with a
  spinner.
- **Sobre**: Privacidade, Termos de uso, DMCA (the legal panel), Dicas para bloquear anúncios (the existing tips),
  credits ("Dados de filmes e séries: TMDB. Avatares: Lorelei, de Lisa Wischofsky, e Notionists, de Zoish, CC0") and
  the site version.

### Privacidade and Termos rewritten

- **Privacidade**: without an account nothing changes (data only in the browser). With the optional account, exactly what
  is kept: the nickname; the password and the recovery code only as one-way hashes (nobody, us included, can read them);
  the profiles (name and avatar); the synced data of each profile (Coleção and ratings, Continuar assistindo, favorite
  channels and team, player preferences). The session cookie (essential, HttpOnly, renewed while in use, ends after 90
  days without use) only keeps you signed in. No e-mail, no real name, no IP stored: attempt limits use a code made from
  the IP that changes every day and is erased within 24 hours. Stored on Cloudflare's servers (D1). Apagar conta in
  Configurações erases everything at once; Sair removes the account's copies from that device. Analytics and third
  parties stay as today.
- **Termos de uso**: adds the account: it is free and optional; keep the password and the recovery code safe (without
  e-mail, a lost code means a lost account); one nickname per person is not required, but accounts used to abuse the
  service may be removed; the sync and the account may change or end, with notice on the site when possible. The rest
  stays.

### Tests

- New `tools/settings_check.mjs` (Chrome and Firefox): guest view (Player and Sobre, the Entrar card); signed in:
  Trocar senha (wrong current refused, rules, success; the old password no longer works), new recovery code shown once
  and the old code refused, the player choices saved and kept after a reload, Sincronizar agora updates the line,
  Gerenciar perfis opens the manage mode, the legal texts mention the account, Apagar conta (Cancelar keeps it; with the
  password the account is gone, the device copies leave, the guest data stays), phone width, Back.
- `account_check`, `profile_check`, `sync_check`, `header_check`, the player suites (with a time limit).

### After 4d

On approval, and only with the user's go-ahead, `staging` merges into `master` (production): the whole big feature. Then
`summary.md` for the feature, its row in `.archives/README.md` and the backlog update.

