# Tests: title pages, new header, Coleção and accounts

## Phase 1: title page and full-screen player (`feat/title-page` -> `staging`)

**Date:** 2026-10-20 · **Staging:** https://staging.tvzinhaonline.pages.dev

### Automated

Version `20261020_1520`, commit `8e6ad58`, merged into `staging` as `bb44405`.

| Check | Result |
|---|---|
| `node --check`, `check_js.py`, `bump_version.py --check`, tag balance of `index.html` | PASS |
| `title_page_check.mjs` (new): movie, series, anime, Back chain, stacked titles, cast list, library buttons after reload, title link, tab switch, phone width | 27/27 Chrome, 27/27 Firefox, 27/27 against staging |
| `episode_entry_check.mjs` | 52/52 |
| `continue_watching_check.mjs` | 9/9 |
| `server_groups_check.mjs` | 12/12 |
| `tab_reset_check.mjs` | all passed |
| `player_ui_check.mjs` | 45/46: only the outdated "Escolha um canal" check (B21), same as before the phase |
| `player_touch_check.mjs` | 16/17: only the flaky double tap (B21) |
| `check_deployment.py` on staging | ALL PASSED |

Fixed during the phase: a tab switch right after Back could be undone by the grouped history step (batches now count inside the 60 ms window after a popstate, and tab switches wait for a pending grouped step).

### Manual (user, on staging)

**Result:** approved by the user on 2026-10-20 ("tudo certo"), after these adjustments on staging: sideways rows for trailers, cast (directors look), collection and recommendations; smooth loading of the top; upcoming episodes greyed out with their release date; facts card without original language and network; banner "Assistir Agora" opens the title page everywhere.

| # | Steps | Expected | Result |
|---|---|---|---|
| 1 | Filmes: open any movie from a row | Full page: title logo, genres, Assistir, +, eye, star, year / duration / age rating / score, Direção, overview with "Ler mais", facts card on the right ("termina às"), company logos | |
| 2 | Scroll down the same movie | Trailers, Elenco, the movie's collection (try a Marvel or Harry Potter movie), "Você pode gostar"; empty sections do not show | |
| 3 | Click a trailer | Small player over the page; "Abrir no YouTube" opens it in a new tab; Back or X closes it | |
| 4 | Click an actor, then a company logo | A list of their titles; "Carregar mais" on companies; Back returns to the movie | |
| 5 | Click a movie in "Você pode gostar", then Back | The new movie opens on the page; Back returns to the first one | |
| 6 | Assistir on a movie | Player in full screen, Player Principal starts; the arrow returns to the page; X goes to Filmes | |
| 7 | A series (Friends) and an anime (One Piece, Naruto) | Episodes on the page: seasons, continuous list, "ir para N"; an episode opens the full-screen player; previous / next work; Back returns to the page | |
| 8 | Início: a "Continuar assistindo" card (movie and series) | The page opens and playback starts; Back lands on the page | |
| 9 | +, eye and star (try half a star) on a title, then reload the page | The buttons keep their state after the reload | |
| 10 | Copy the address of an open title (`?filme=...`) and open it in another tab | The same page opens | |
| 11 | With a page open, click a tab on the pill (Filmes, Séries, Início) | The page closes and the tab shows | |
| 12 | Phone (Chrome Android): items 1, 6, 7 and the phone's Back button | Layout fits the screen; Back closes player, then page | |
| 13 | Firefox: items 1, 6 and 7 | Same as Chrome | |
| 14 | The banner "Assistir Agora" on Início, Filmes, Séries and Animes | Always opens the title page (decided on 2026-10-20: same behavior everywhere); a live channel on the Início banner still opens the channel | |

## Phase 2: new header and global search (`feat/new-header` -> `staging`)

**Date:** 2026-10-20 · **Staging:** https://staging.tvzinhaonline.pages.dev

### Automated

Version `20261020_1704`, commit `42c7180`, merged into `staging` as `52163e1`.

| Check | Result |
|---|---|
| `node --check`, `check_js.py`, `bump_version.py --check`, tag balance of `index.html` | PASS |
| `header_check.mjs` (new): brand, Esportes, tool order, menus and Back, Privacidade and tips from the menu, "/" shortcut, one request per search, category filter without a new request, result opens the title page, channels first and opening, phone tools pill (under the tabs, tucks on scroll, clear of the title page back button) | 21/21 Chrome, 21/21 Firefox, 21/21 against staging |
| `title_page_check.mjs` | 28/28 |
| `tab_reset_check.mjs` | all passed |
| `channels_redesign_check.mjs` | 10/10 |
| `player_touch_check.mjs` | 17/17 |
| `player_ui_check.mjs` | 43/46: "Escolha um canal" (B21), DBZ T9E31 fixed waits (B21, now failing more often), and once "opening movies right after the app starts" (start-up race, noted in B21) |
| `check_deployment.py` on staging | ALL PASSED |

### Manual (user, on staging)

**Result:** approved by the user on 2026-10-20 ("pode prosseguir"), after these adjustments on staging: search hides titles not out yet and shows long names whole; "Em breve" tag on cards of titles not out yet (Assistir becomes "Em breve · estreia em ..."); phones get option B (one row, a single menu at the right) and a dark top band on the title page; hiding the pill on scroll was tried and removed. Open: the pill slides up a little while scrolling on Chrome for Android (B23).

| # | Steps | Expected | Result |
|---|---|---|---|
| 1 | Look at the pill on the computer | TV icon (no "Início" tab), Canais, Filmes, Séries, Animes, Esportes dimmed with no badge, then search, profile, settings; everything centered | |
| 2 | Click the TV icon from another tab; click Esportes | Goes to Início; Esportes shows "em breve" and stays | |
| 3 | Profile icon | Menu: Visitante, "Continuar assistindo" (goes to the row on Início), "Entrar ou criar conta" (em breve) | |
| 4 | Settings icon | Menu: ad-block tips, Privacidade, Termos de uso, DMCA; each opens its panel | |
| 5 | Search icon, or "/" on the keyboard | Search opens with the cursor in the field; results while typing; Tudo / Filmes / Séries / Animes / Canais / Pessoas | |
| 6 | Search a movie, a series, an anime, a person ("Tom Hanks") and a channel ("globo", "espn") | Each kind shows; a title opens its page; a person opens their titles; a channel opens the channel | |
| 7 | Back (or Esc) with a menu or the search open | Closes it and nothing else | |
| 8 | Phone: the pill | One row: TV icon, tab icons and a round profile button at the right (option B, decided 2026-10-20); the pill stays fixed (hiding it on scroll was removed on 2026-10-20) | |
| 9 | Phone: the profile button, the search, Canais and a title page | One menu with Buscar, Continuar assistindo, Entrar (em breve), tips and the legal panels; search fills the screen; nothing covered | |
| 10 | Firefox: items 1, 5 and 6 | Same as Chrome | |
| 11 | A movie collection with titles not out yet (Vingadores) | Those cards are dimmed with an "Em breve" tag and still open their page; there, the button reads "Em breve · estreia em ..." and does not play; the search does not list them | |

## Phase 3: Coleção and "Gostou? Avalie" (`feat/collection` -> `staging`)

**Date:** 2026-10-20 · **Staging:** https://staging.tvzinhaonline.pages.dev

### Automated

Version `20261020_1857`, commit `5f2feaf`, merged into `staging` as `55f5f38`.

| Check | Result |
|---|---|
| `node --check`, `check_js.py`, `bump_version.py --check`, tag balance of `index.html` | PASS |
| `collection_check.mjs` (new): menu entry, tab counts, Assistindo labels and bars, newest first, filters, score, remove (kept as off with its time), card to title page and Back, Back home, "Continuar assistindo" to Assistindo, favorite channel, end of a movie marks Assistido and shows the rating card, a star saves the score, phone width | 16/16 Chrome, 16/16 Firefox, 16/16 against staging |
| `title_page_check.mjs` (shared stars) | 28/28 |
| `header_check.mjs` (Coleção in the menus) | 22/22 |
| `continue_watching_check.mjs` | 9/9 |
| `episode_entry_check.mjs` | 52/52 |
| `tab_reset_check.mjs` | all passed |
| `player_touch_check.mjs` | 17/17 |
| `player_ui_check.mjs` | 43/46: only the known B21 items ("Escolha um canal", DBZ T9E31 fixed waits) |
| `check_deployment.py` on staging | ALL PASSED |

### Manual (user, on staging)

**Result:** approved by the user on 2026-10-21 ("pode prosseguir"), after these adjustments on staging: search, Coleção (library icon) and profile in the pill on every screen; the profile menu holds the account only (profile with "Trocar", Entrar, Watch Party, Premium, Configurações, all em breve); legal and tips items left the menus; Esportes hidden on phones; people in the search are only known actors, directors and writers.

| # | Steps | Expected | Result |
|---|---|---|---|
| 1 | The Coleção icon in the pill (computer and phone) | The Coleção opens with tabs Assistindo, Quero assistir, Assistidos, Avaliados, Canais favoritos, each with its count; the icon lights up there | |
| 2 | Mark a few titles with +, eye and stars on their pages, favorite a channel in Canais | Each shows up in its tab, newest first; Avaliados shows the score | |
| 3 | Filter Filmes / Séries / Animes | Only that kind stays | |
| 4 | The X on a card | It leaves that list (the title page buttons agree) | |
| 5 | Click a card in each tab | Assistindo resumes where it stopped; the others open the title page; Back returns to the Coleção | |
| 6 | The pill on computer and phone: search, Coleção, profile; the profile menu | Profile at the top with "Trocar"; Entrar ou criar conta, Watch Party, Premium and Configurações marked em breve (each says what it will be); no legal or tips items (they are in the footer); Esportes hidden on phones until it opens | |
| 7 | Watch a movie to the credits (or jump close to the end) on the Player Principal | "Gostou de ...?" card in the player (also in fullscreen); a star saves the score; "Agora não" closes it; the movie becomes Assistido | |
| 8 | The last episode of a finished series (e.g. Breaking Bad T5:E16) to the end | Same card for the series; the series becomes Assistido and leaves "Continuar assistindo" | |
| 9 | Phone and Firefox: items 1, 3 and 7 | Same as Chrome on a computer | |

## Phase 4a: accounts (`feat/accounts` -> `staging`)

**Date:** 2026-10-21 · **Staging:** https://staging.tvzinhaonline.pages.dev (needs the D1 databases and the `DB` binding)

### Automated

| Check | Result |
|---|---|
| `tools/accounts_api_check.mjs` (the Cloudflare function with Node's SQLite) and `tools/test_accounts_api.py` (the local mirror): the same 38 cases from `tools/accounts_cases.json` (rules, duplicate nickname, origin and header, attempt limits, password change signing out other devices, recovery code once and loosely typed, logout, delete, routes and methods; no secret in any answer; HttpOnly cookie) | 38/38 and 38/38 |
| Password hashes identical in JavaScript and Python (with and without pepper) | PASS |
| `tools/account_check.mjs` (new, browser): guest menu, live rules and strength, recovery code kept on Back, signed-in menu and initial, reload keeps the session (cookie unreadable by the page), Sair, wrong password, Esqueci a senha, phone width, test account deleted | 15/15 Chrome, 15/15 Firefox (local server) |
| `header_check.mjs`, `title_page_check.mjs` | 26/26, 28/28 |
| `collection_check.mjs` | 15/16: the movie stays paused right after it starts in the test browser; production does the same today (not from this feature, see the chat of 2026-10-21) |
| On staging, after the D1 databases, the `DB` binding and `ACCOUNTS_PEPPER` were set up: `account_check.mjs` | 15/15 Chrome, 15/15 Firefox |
| PBKDF2 on the free plan (5 sign-ins, 1 sign-up, 3 `/me` on staging) | no CPU-limit error; sign-up ~1.9 s, sign-in ~1.1 s, `/me` ~0.6 s (kept at 100 000 rounds) |
| Fix `feat/accounts-fixes` (the password eye dropped 18 px when pressed: the focus style replaced its centering transform; same for the Coleção channel remove button): new real-press check in `account_check.mjs` | fails on the old code (18 px), 16/16 Chrome and Firefox with the fix, 16/16 on staging |

### Manual (user, on staging, after the databases exist)

| # | Steps | Expected | Result |
|---|---|---|---|
| 1 | Profile menu -> Entrar ou criar conta -> Criar conta | Rules ticked while typing, strength bar, button only works with the rules met; line with Termos and Privacidade links | PASS after the eye fix (the user found the eye jumping when pressed) |
| 2 | Create the account | Recovery code in large type, Copiar works, Back keeps the screen, "Guardei o código" closes it; menu shows the profile, Sair, and the initial in the pill | PASS |
| 3 | Reload; open the site on the phone and sign in there | Still signed in after the reload; the phone signs in with the nickname in any case | PASS (the Coleção did not show on the phone: expected, sync is step 4c) |
| 4 | Sair; a wrong password; the right one | Visitante again; "Apelido ou senha incorretos."; signed in | PASS (the guest data stayed after Sair: expected until 4c) |
| 5 | Esqueci a senha with the code | New password saved, a new code shown | |
| 6 | Five wrong passwords in a row | "Muitas tentativas. Tente de novo em N minutos." | |

**Phase 4a approved by the user on 2026-10-21** ("pode prosseguir"; no delete-account button yet: it comes with Configurações in 4d).

## Phase 4b: profiles (`feat/profiles` -> `staging`)

**Date:** 2026-10-21 · **Staging:** https://staging.tvzinhaonline.pages.dev

### Automated

| Check | Result |
|---|---|
| `accounts_api_check.mjs` and `test_accounts_api.py`: 24 new profile cases (empty, long and symbol names, unknown avatar, accents allowed, same name in other case refused, up to 5 then `profiles_full`, rename and avatar, rename to another's name refused, own name in other case kept, update without fields, remove, removed is gone, unknown action, signed out, another account's profile not found, the last profile cannot be removed) | 62/62 and 62/62 |
| `tools/profile_check.mjs` (new, browser): picker after the account (Back keeps it), guest data question and Sim, Trocar with Back, Adicionar perfil with live name checks and an icon avatar, Começar vazio, data kept apart per profile, Gerenciar perfis rename and avatar, Excluir perfil (Back to the editor; no data left on the device), the 3-hour rule (4 h asks, 30 min does not), phone width, Sair da conta brings the guest data back | 15/15 Chrome, 15/15 Firefox |
| `account_check.mjs` (now through the picker; avatar in the pill) | 17/17 Chrome, 17/17 Firefox |
| `header_check`, `title_page_check` | 26/26, 28/28 |
| `collection_check`, `continue_watching_check` | 15/16, 8/9: only the movie that pauses right after starting in the test browser (known, also on production) |
| `player_ui_check` | DBZ T9E31 request checks fail (known flaky, backlog B21) |
| `player_touch_check` | 15/17: "anime episode is playing" and "playback keeps running after the skip"; the same two fail on staging without 4b (the test browser pauses the video), so not from this step |
| Schema with block comments, run as one joined line (as the D1 console does) | the 6 tables created |

### Manual (user, on staging)

| # | Steps | Expected | Result |
|---|---|---|---|
| 1 | Open the site on the computer where you are signed in | "Quem está assistindo?" with your profile; choosing it asks "Levar o que está neste aparelho..."; Sim: your Coleção is there | |
| 2 | Menu -> Trocar -> Adicionar perfil | Name checked while typing; the illustrated avatars and the icons; Criar perfil adds it to the list | |
| 3 | Choose the new profile -> Começar vazio | Empty Coleção and Continuar assistindo; its avatar in the pill and in the menu | |
| 4 | Save a title in each profile and switch with Trocar | Each one sees only its own titles; the site goes to Início after switching | |
| 5 | Gerenciar perfis: rename, change the avatar, delete a profile | Saved at once; deleting asks first and the profile leaves the list | |
| 6 | Phone: sign in | The picker after signing in; on the phone the profile starts empty (sync is 4c) | |
| 7 | TV remote or keyboard arrows on the picker and the editor | Every tile, avatar and button can be reached; Esc goes back one step | |

**Phase 4b approved by the user on 2026-10-21** (account created on the computer, signed in on the phone, profiles and Trocar working; the data itself syncs in 4c).

## Phase 4c: sync (`feat/sync` -> `staging`)

**Date:** 2026-10-21 · **Staging:** https://staging.tvzinhaonline.pages.dev (no database change)

### Automated

| Check | Result |
|---|---|
| `tools/sync_api_check.mjs` (syncMerge.js + the Cloudflare function) and `tools/test_sync_api.py` (the local mirror): the same `tools/sync_cases.json`: 10 data checks (unknown fields dropped, fake poster, future time cut to now, bad keys and kinds, sizes), 11 merges (newest field wins, removal travels, rewatch brings back a hidden entry, "Começar do início", a finished movie opened again, per-episode positions, a tie settled by content; each also merged in the other order and again with itself), 26 route steps (signed out, header, origin, broken request, another account's profile, more than 300 changes, one sync a second, a second device gets everything, removal reaches the first device, an older copy comes back corrected, the same change twice gets no new number, paging of 604 records, profiles apart, a removed profile, only POST; no secret in any answer) | 47/47 and 47/47 |
| `account_check` 17/17 (account API also gained the per-IP limit and the early cookie check: 62/62 and 62/62) | Chrome and Firefox |
| `tools/sync_check.mjs` (new, two separate browsers on one account): A sends a title, a rating, a favorite and a movie time; B receives them; B's removal reaches A; B offline: the change waits ("Sem conexão" in the menu) and arrives; Sair with an unsent change asks first; Sair removes the account's copies and keeps the guest data; what A sent while leaving reaches B | 8/8 Chrome, 8/8 Firefox |
| `profile_check` | 15/15 Chrome, 15/15 Firefox |
| `header_check`, `title_page_check`, `collection_check`, `continue_watching_check` | 26/26, 28/28, 16/16, 9/9 (the movie autoplay passed this time: that failure is flaky) |
| `player_ui_check` | DBZ T9E31 request checks fail (known, B21) |
| `player_touch_check` | hung once for hours (no time limit in the script, B21); run again with a 7-minute limit: 17/17 |

### Manual (user, on staging)

| # | Steps | Expected | Result |
|---|---|---|---|
| 1 | Open the site on the computer (signed in) and wait a few seconds; open the profile menu | "Sincronizado agora" under the profile; the Coleção you had there goes up | |
| 2 | Open the site on the phone, same account and profile | The computer's Coleção, ratings, Continuar assistindo and favorite channels show up | |
| 3 | Mark a title on the phone; on the computer, switch tabs and come back after 5 minutes (or reload) | The title is there | |
| 4 | Take something out of the Coleção on one device | It leaves the other one too | |
| 5 | Sair on the phone | Visitante; the account's Coleção leaves the phone; entering again brings it back | |
| 6 | Two profiles: save something in each, check on the other device | Each profile keeps its own | |

