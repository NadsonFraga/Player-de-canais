# Tests: TMDB attribution in the footer

**Date:** 2026-10-20 · **Branch:** `feat/tmdb-credits` -> `staging`
**Staging:** https://staging.tvzinhaonline.pages.dev

## Automated

| Check | Result |
|---|---|
| `check_js.py`, `bump_version.py --check` | PASS |
| Footer screenshots, desktop 1366 px and phone 390 px | logo loaded, notice and copyright visible, no sideways scroll |

## Manual (user, on staging)

| # | Steps | Expected | Result |
|---|---|---|---|
| 1 | Início, scroll to the bottom (PC) | TMDB logo + notice and the © line on the right, discreet | |
| 2 | Same on the phone | stacked on the left, readable | |
| 3 | Click the TMDB logo | opens themoviedb.org in a new tab | |
