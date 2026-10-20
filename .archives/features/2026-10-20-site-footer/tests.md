# Tests: site footer, legal panel and data credits

**Date:** 2026-10-20 · **Branch:** `feat/site-footer` -> `staging`
**Staging:** https://staging.tvzinhaonline.pages.dev

## Automated

| Check | Result |
|---|---|
| `node --check`, `check_js.py`, `bump_version.py --check` | PASS |
| Screenshots: footer on Início and Filmes, desktop 1366 px and phone 390 px | visible, logos loaded, no sideways scroll; hidden on Canais |
| Legal panel | "DMCA" opens with 4 paragraphs; Back closes it and stays on Início; footer link "Séries" opens Séries |
| `tab_reset_check.mjs` | all passed |
| `episode_entry_check.mjs` | 52/52 |
| `player_ui_check.mjs` | 43/46: the flaky DBZ T9E31 item (2) and B21; nothing in the footer's path |

## Manual (user, on staging)

| # | Steps | Expected | Result |
|---|---|---|---|
| 1 | Scroll to the bottom of Início, Filmes, Séries and Animes (PC) | tips callout, then the footer: logo + description on the left, NAVEGAR and LEGAL on the right, notes, credits and © below, back-to-top button | |
| 2 | Same on the phone | callout and columns stacked, readable | |
| 3 | Canais | no footer (its own layout) | |
| 4 | "Ver dicas de bloqueador e DNS" | opens the tips modal | |
| 5 | Privacidade, Termos de uso, DMCA | the panel opens with the text; X, click outside and the phone's Back close it | |
| 6 | NAVEGAR links and the back-to-top button | go to the tab / to the top | |
