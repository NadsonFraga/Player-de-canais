# Plan: leaving a catalog tab resets it

> Approved by the user on 2026-10-12, shipped together with `feat/source-quality` (same branch, at the user's request).

## Problem

Switching tabs cleared players and detail modals but not the search/explore view (nor a Filmes studio collection) of the tab left behind: coming back showed the old search and filters instead of the tab's start page (hero and rows).

## Change

- `router.js`: leave hooks `onMoviesLeave`, `onSeriesLeave`, `onAnimesLeave`, called by `switchAppView` when the previous tab differs from the new one (same pattern as `onTvLeave`).
- `main.js`: the hooks call `resetMoviesViewState` / `resetSeriesViewState` / `resetAnimesViewState` with `keepHistory: true` (the tab switch already replaced the history entry, so the explore layer is not popped again).
- `series.js`, `movies.js`: those resets (and `closeExploreView` / `closeCollectionView`) take `{ keepHistory }`; `resetMoviesViewState` also closes a studio collection. Inside a tab nothing changes. Cache version `20261012_1827`.

## Verification

- `tools/tab_reset_check.mjs`, Chrome 9/9 and Firefox 9/9: Séries search, Animes genre filter, Filmes studio collection and Filmes search all reset after leaving and coming back (start page shown, search/filter cleared); opening a title from a search and closing it keeps the search; Back closes the search, then goes home.
- Regression (Chrome): `player_ui_check.mjs` 46/46, `catalog_split_check.mjs` and `feed_rows_check.mjs` all passed.
