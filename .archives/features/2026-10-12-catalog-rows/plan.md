# Plan: catalog rows fill up (Filmes, Séries, Animes carousels)

> Approved by the user on 2026-10-12. Shipped to production (commit fabfb0a).

## Cause

- Each carousel row fetched one TMDB page (20 titles) and then dropped titles already shown in an earlier row. Rows that overlap a lot ended almost empty: Animes Fantasia & Isekai 4, Shonen 7, Clássicos 16; Séries Comédia 13, Ficção 16; Filmes Lançamentos 10, Em alta 16 (simulated with the same queries on 2026-10-12).

## Fix

- `assets/js/core/feedRows.js` (`buildFeedRows`): first page of every row in parallel, duplicates dropped in row order (an earlier row keeps the title, as before), and only the rows still short of 20 ask for their next page, up to 3 pages. A failed page counts as empty.
- `series.js` (Séries and Animes) and `movies.js` (Filmes) use it; both copies of `deduplicateFeedRows` removed.
- Browser cache keys `tvzinha_*_cache_v4` -> `_v5`, so the old short rows are not reused for 12 h. Cache version bumped.

## Verification

- `tools/feed_rows_check.mjs` (empty browser storage, real TMDB): Filmes, Séries and Animes, 5 rows each, all 20 cards, 100 distinct titles per tab, in Chrome and Firefox (6/6 each). TMDB requests counted by address per tab: 9, 9 and 10 (the address filter also counts other requests of the tab that use the same endpoints).
- `tools/catalog_split_check.mjs` still passes (Chrome).
