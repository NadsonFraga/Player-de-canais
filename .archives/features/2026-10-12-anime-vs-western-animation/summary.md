# Summary: western animation in Séries (2026-10-12)

Written afterwards from the commit (fabfb0a); the work was done on the other machine.

## Shipped

- One rule for anime: animation from Japan, Korea or China (`isAsianAnimation`). Animation from anywhere else is a series: it shows in the Séries search, opens with the main player and no anime server, and exits to Séries. Before, Rick and Morty, The Simpsons and the like showed in neither tab.
- The Séries "Animação" chip, which asked TMDB for genre 16 with and without it (always empty), now lists western animation.
- `tools/catalog_split_check.mjs`: 10/10 in Chrome and 10/10 in Firefox.

## Known

- The chip's results count is TMDB's total for all animation, anime included.
