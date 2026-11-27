# Handover: 2026-11-24 - Catalog & Covers Loading Speed Optimization

## 1. Context & User Issue
- **Reported Issue:** "Identifiquei uma demora boa para carregar as obras/capas. O que pode ser? E como podemos resolver? Passa 1 a 3 segundos até carregar as obras/capas"
- **Root Causes Identified:**
  1. **Oversized Image Dimensions:** Poster cards (115px mobile, 175px desktop) were requesting `TMDB_IMG_W500` (~200KB-300KB each), and hero banners were requesting `TMDB_IMG_ORIGINAL` (uncompressed 4K up to 4MB-6MB each). For 45 posters plus backdrops on initial load, the browser had to download over 12MB of images.
  2. **Lack of CDN Preconnect:** Missing `<link rel="preconnect" href="https://image.tmdb.org">` forced an extra 350-500ms DNS resolution + TLS handshake delay before the first image download began.
  3. **No In-Memory Query Cache:** `fetchTmdb()` had no memory cache or in-flight request deduplication, causing duplicate network roundtrips to `/api/tmdb` for identical queries.
  4. **Deferred Lazy Loading on Above-Fold Items:** All poster cards used `loading="lazy"`, which forced browsers to delay requesting images until after complete layout/geometry calculation.
  5. **Sequential Idle Starvation on Cold Starts:** When localStorage was empty or expired, `runWhenHomeIdle` waited 1500ms before starting preloads, and Home tracks displayed plain text while waiting for all 3 full catalogs (15 rows) to complete simultaneously, hitting the browser's 6-connection per host limit.

---

## 2. Changes Made
1. **TMDB CDN Preconnect (`index.html`):**
   - Added `<link rel="preconnect" href="https://image.tmdb.org">` and `<link rel="dns-prefetch" href="https://image.tmdb.org">` in the `<head>` for immediate zero-latency DNS/TLS establishment.

2. **Targeted Image Sizing (`constants.js`, `home.js`, `movies.js`, `series.js`, `titlePage.js`):**
   - Added and exported `TMDB_IMG_W342 = 'https://image.tmdb.org/t/p/w342'`.
   - Replaced `TMDB_IMG_W500` with `TMDB_IMG_W342` across catalog tracks, saving 70-75% payload per card (down to ~40KB-60KB while remaining ultra-crisp on retina displays).
   - Replaced `TMDB_IMG_ORIGINAL` with `TMDB_IMG_W1280` across hero carousels and modal backdrops, saving 90-95% bandwidth per backdrop (~150KB vs 4MB).

3. **In-Memory Cache & Request Coalescing (`assets/js/core/tmdb.js`):**
   - Added `tmdbMemCache` (Map with bounded 150-entry FIFO eviction) for 0ms repeated lookups.
   - Added `inflightRequests` promise map to coalesce simultaneous requests to the same endpoint.

4. **Above-the-Fold Loading Optimization:**
   - First 6 cards of visible tracks now load with `loading="eager"` (omitting lazy), `decoding="async"`, and top cards receive `fetchpriority="high"`.
   - Hero backdrops explicitly set `backdropEl.fetchPriority = "high"`.
   - Off-screen cards (indices 6+) maintain `loading="lazy"`.

5. **Smooth Skeletons & Staggered Preloading (`home.js`, `main.js`):**
   - Added `createTrackSkeletons()` in `home.js` so placeholder cards maintain track geometry without visual jumps.
   - Dynamic preload scheduler in `main.js`: if catalogs are not yet cached, preload begins immediately (100ms) and staggers Movies -> Series -> Animes sequentially, updating Home tracks row by row as they arrive.

6. **Versioning:**
   - Stamped synchronized version `20261124_0910` across 34 modules and HTML assets via `tools/bump_version.py`.

---

## 3. Verification & Deployment
- Automated test matrix passed:
  - `python tools/check_js.py`: 0 missing imports.
  - `python tools/bump_version.py --check`: single synchronized version `20261124_0910`.
  - `python tools/test_security_headers.py`: 0 failures (CSP & SRI valid).
  - `python tools/test_resolve_cors.py`: 0 failures.
  - `node tools/test_xss_protection.mjs`: 24/24 passed.
  - `python tools/test_mgeb_rules.py`: all checks passed with 100% parity.
- Merged `feat/catalog-load-optimization` into `staging` with `--no-ff`.
- Pushed to `origin/staging` (commit `261b759`).
- Live preview verified on `https://staging.tvzinhaonline.pages.dev`:
  - Version stamp `20261124_0910` active.
  - Preconnect and dns-prefetch to `image.tmdb.org` active in `<head>`.
