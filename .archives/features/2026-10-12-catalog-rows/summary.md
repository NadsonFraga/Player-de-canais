# Summary: catalog rows fill up (2026-10-12)

Written afterwards from the commit (fabfb0a); the work was done on the other machine.

## Shipped

- `assets/js/core/feedRows.js` builds the Filmes, Séries and Animes carousels. Rows still short of 20 titles after duplicates are dropped ask for their next TMDB page, up to 3. Rows went from 4-16 cards to 20 (Fantasia & Isekai had 4). Browser cache keys moved to `_v5`.
- `tools/feed_rows_check.mjs` in Chrome and Firefox.
