# Plan: western animation (Rick and Morty) is missing from the site

> Status: proposal, waiting for approval. Urgent: before the security phases and MGEB Phase 2.

## Cause (checked 2026-10-12)

- Rick and Morty (TMDB 60625) is genre Animation (16), language English, country US. MGEB has it (T1E1 "Piloto", 4 sources).
- Séries tab drops every title with genre 16: text search (`series.js` ~964 and ~976) and the catalog grid (`without_genres=16`, ~953).
- Animes tab keeps only genre 16 from Japan/Korea/China (`series.js` ~1557-1586).
- So western animation (Rick and Morty, The Simpsons, Family Guy, South Park, Futurama, Arcane, Invincible, Avatar: The Last Airbender...) appears in neither tab, not even in search.
- The Séries "Animação" genre chip asks TMDB for `with_genres=16&without_genres=16`: always 0 results.
- `isAnimeShow()` (~2828) treats any genre-16 show as anime, so a western cartoon opened from anywhere would get the anime server, the MyAnimeList lookup and "exit to Animes".

## Fix (one rule, `series.js` only)

- One predicate for "anime": genre 16 from Japan, Korea or China (language `ja`/`ko`/`zh` or origin `JP`/`KR`/`CN`), plus the current non-animation rule kept (language `ja` or origin `JP`). Everything else is a series.
- Séries tab, text search: drop only anime (western animation stays).
- Séries tab, catalog grid: unchanged by default (`without_genres=16`, so the default lists look the same); with the "Animação" chip, ask for genre 16 and drop anime on the page (pages may hold fewer than 20 cards).
- Animes tab: unchanged.
- `isAnimeShow()` uses the same predicate: western animation opens as a series (main player, no anime server, exits to Séries).
- Cache version bump.

## Result (2026-10-12, not committed)

- `series.js`: `isAsianAnimation()` (genre 16 + language ja/ko/zh or origin JP) drives the Séries search (plain and filtered) and `isAnimeShow()`. Séries catalog unchanged by default; with the "Animação" chip, one page = two TMDB pages minus anime (TMDB ignores `without_origin_country` / `without_original_language`: same totals, checked), about 19 cards per page. Animes tab untouched. Cache version `20261012_1224`.
- `tools/catalog_split_check.mjs` (real search box, chip and player): 10/10 in Chrome and 10/10 in Firefox. Séries "rick and morty" -> Rick e Morty (and "Rick and Morty: The Anime", an English-language US production); Animes "rick and morty" -> none; "one piece": the anime only in Animes, the live-action series in Séries; Breaking Bad unchanged; chip: Os Simpsons, Uma Família da Pesada, American Dad!, Rick e Morty, South Park..., 19 cards, no Japanese anime; Rick e Morty T1E1 opens without the anime server and plays ("Piloto"); One Piece keeps the anime server.
- Known: the results count of the chip is TMDB's total for all animation (anime included).

## Verification

- Browser check (Chrome and Firefox): Séries search "rick and morty" shows Rick e Morty; Animes search does not; Séries "Animação" chip lists western shows (Simpsons, Rick e Morty...) and no Japanese anime; opening Rick e Morty T1E1 offers the main player (no anime server) and plays; regression: One Piece still only in Animes and still offers the anime server; Breaking Bad unchanged in Séries.
- `node --check`, `check_js.py`, `bump_version.py --check`.
