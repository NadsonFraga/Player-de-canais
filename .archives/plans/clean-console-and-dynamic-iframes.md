# Plan: Clean Console Warnings & Dynamic On-Demand Iframes

> **Status:** Planned / In Progress  
> **Target:** Remove persistent F12 console warnings (`autoplay`, `encrypted-media`, `Quirks Mode [blank]`) caused by idle standby iframes in SPA tabs.

---

## 1. Objective & Scope

### Objective
Eliminate redundant browser warnings produced during application startup and view switching, transitioning static empty modal iframes into dynamic on-demand DOM elements.

### In Scope
1. **Remove static iframes from index.html**:
   - `movie-modal-iframe` inside `.movie-player-stage`.
   - `series-modal-iframe` inside `#series-player-view`.
2. **Helper function in movies.js and series.js**:
   - Create and mount the iframe dynamically only when an iframe server (MGEB, Superflix, MyEmbed, etc.) is triggered.
   - Cleanly remove (`iframe.remove()`) and clear the container when closing or tearing down modal playback.
3. **Router Teardown in router.js**:
   - Replace `iframe.src = "about:blank"` with clean element removal (`document.getElementById(...)?.remove()`).
4. **Validation**:
   - Ensure native streaming (ArtPlayer / Hls.js) continues functioning without alteration.
   - Ensure third-party iframe providers load smoothly on user click.
   - Confirm F12 console remains clean without `about:blank` Quirks Mode warnings or Permissions Policy noise on tab switches.

### Out of Scope
- Modifications to ArtPlayer or HLS.js streaming pipelines.
- Changes to API endpoints or Cloudflare Functions.

---

## 2. Impacted Files
- `index.html`
- `assets/js/navigation/router.js`
- `assets/js/modules/movies.js`
- `assets/js/modules/series.js`

---

## 3. Step-by-Step Strategy

1. **`index.html`**:
   - Delete lines 1694 (`#movie-modal-iframe`) and 1864 (`#series-modal-iframe`).
   - Leave clean containers: `.movie-player-stage` and `#series-theater-wrapper`.
2. **`assets/js/modules/movies.js`**:
   - Implement `getOrCreateMovieIframe()` to instantiate the iframe with exact attributes (`allow="autoplay; encrypted-media; picture-in-picture; fullscreen"`, `referrerpolicy="no-referrer"`, etc.) only when loading an iframe server.
   - On close/reset (`btnClosePlayer`, modal close, or native stream switch), call `removeMovieIframe()` which detaches the element from DOM.
3. **`assets/js/modules/series.js`**:
   - Implement `getOrCreateSeriesIframe()` with identical attributes inside `#series-theater-wrapper`.
   - On close/reset (`closeSeriesModal`, `stopSeriesPlayer`, or native stream switch), call `removeSeriesIframe()`.
4. **`assets/js/navigation/router.js`**:
   - Update tab switch handlers to simply remove any existing movie/series iframe elements without assigning `src = "about:blank"`.
5. **Syntax & Regression Testing**:
   - Run python JS syntax validation.
   - Test navigation between tabs in browser.

---

## 4. Changelog & Micro-adjustments
*(To be populated during execution)*
