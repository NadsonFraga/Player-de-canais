# Feature Summary: FenixFlix Parallel Candidate Resolution

## 1. Overview
Implemented concurrent candidate querying in `assets/js/player/clientProviders.js` using `Promise.all` and a single 4.5-second timeout budget. This drastically reduces latency on missing/cold stream lookups without UI freezing or duplicate server strain.

## 2. Changes
- `assets/js/player/clientProviders.js`: Replaced sequential `for` loop with `Promise.all(queryCandidates.map(fetchCandidate))` over a single unified `AbortController`.
- Prioritizes IMDb `tt...` candidates over TMDB fallbacks while evaluating both concurrently.
- Bumped asset version to `20261112_1656`.
