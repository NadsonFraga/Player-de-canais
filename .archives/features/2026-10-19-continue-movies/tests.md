# Tests: movies in "Continuar assistindo" and the remove button (B19)

**Date:** 2026-10-19 · **Branch:** `feat/continue-movies` · **Version:** `20261019_1817`
**Preview:** https://feat-continue-movies.tvzinhaonline.pages.dev

## Automated

| Suite | Result | Notes |
|---|---|---|
| `node --check`, `check_js.py`, `bump_version.py --check` | PASS | |
| `node tools/continue_watching_check.mjs` (new) | Chrome 9/9, Firefox 9/9 | Divertida Mente 2 on the Player Principal: saved under `movie:1022789` (2314 of 5781 s); rail card "Filme", "Faltam 58 min", bar 40 %; the card reopens it at 2315 s with "Continuando de 38:34"; "Começar do início" back to 0; at 96 % `finished` and off the rail; remove hides a movie and a series card without opening them and keeps the time; watching again brings the movie back |
| `node tools/player_ui_check.mjs` | 45/46 | first run 43/46 (DBZ T9E31 fixed waits, flaky, noted in B21), rerun 45/46: only B21 |
| `node tools/player_touch_check.mjs` | 17/17 | |
| `node tools/episode_entry_check.mjs` | 52/52 | resume card of episodes unchanged |

## Manual (user, on the preview)

| # | Steps | Expected | Result |
|---|---|---|---|
| 1 | Play a movie on the Player Principal for a few minutes, close it, go to Início | the movie is on "Continuar assistindo" with "Filme", the bar and "Faltam X min" | |
| 2 | Click that card | the movie opens and plays from where it stopped, with "Continuando de ..." and "Começar do início" | |
| 3 | Open another movie on a servidor externo, go back to Início | it is on the rail too (no bar: external servers do not report the time) | |
| 4 | Pass the mouse over a card and click the "x" in its corner | the card leaves, toast "... removido de Continuar assistindo", nothing opens | |
| 5 | Watch the removed movie again | it comes back to the rail, from where it stopped | |
| 6 | Phone: the "x" is visible on every card without hovering; tap it | same as 4 | |
| 7 | Series and anime cards | open the episode as before; the "x" works the same | |
| 8 | Remote / keyboard arrows on the rail | the "x" can be reached and Enter on it removes (Enter on the card still opens it) | |
