# Summary: TMDB attribution and copyright line

**Branch:** `feat/tmdb-credits` -> `staging` -> `master` · **Date:** 2026-10-20
**Status:** approved by the user on staging; merged into `master` together with the site footer (which absorbed it).

## Change

- `assets/logos/brands/tmdb.svg`: TMDB's official "blue short" logo, unmodified (shapes and a gradient only).
- The logo, linking to themoviedb.org, with the notice "Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB." and "© 2026 Tvzinha Online. Títulos, imagens e marcas pertencem aos seus respectivos donos."
- The first version sat in the old home footer strip; the site footer (`features/2026-10-20-site-footer/`) replaced that strip and carries the same credits.

## Decisions

- Only TMDB gets a logo (its API terms require one). MyAnimeList, AniSkip, TheIntroDB and SkipDB are credited by name only (user, 2026-10-20).
