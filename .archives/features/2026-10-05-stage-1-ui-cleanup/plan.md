# Execution Plan - Stage 1: UI Cleanup & Mobile Layout Adjustments

- **Task Name:** `stage-1-ui-cleanup`
- **Status:** EXECUTING (Authorized by User)
- **Author:** Antigravity Orchestrator

---

## 1. Objective & Scope

### Objective
Implement the 4 approved visual cleanup and mobile UI fixes:
1. Disable redundant `fullscreenWeb` in Artplayer instances across the application.
2. Remove the `(CHECK) HLS Direto Nativo` and `Contingência Web` status badge in the channels player view.
3. Unify the dual-scroll behavior in the series episodes modal by eliminating the nested overflow grid.
4. Correct mobile capsule navigation styling so the 6th tab ("Esportes") fits seamlessly on mobile displays without overflowing.

### Scope
- **Impacted Files:**
  - `assets/js/player/engine.js`: Toggle `fullscreenWeb: false`.
  - `assets/js/modules/channels.js`: Remove direct/contingency badge HTML from TV player toolbar.
  - `assets/css/09-series-animes.css`: Remove nested max-height and inner scrolling on `.series-episodes-grid`.
  - `assets/css/08-responsive-tv-movies.css`: Adjust mobile `.floating-nav-capsule` width, margins, and padding.

---

## 2. Step-by-Step Strategy

1. **Step 1 - Artplayer FullscreenWeb:**
   - In `assets/js/player/engine.js`, set `fullscreenWeb: false` in both Live TV player config and Cinema/Series player config.
2. **Step 2 - TV Player Badge Cleanup:**
   - In `assets/js/modules/channels.js`, remove `statusBadgeHtml` from `renderPlayerView()`.
3. **Step 3 - Single Unified Scroll in Series Modal:**
   - In `assets/css/09-series-animes.css`, update `.series-episodes-grid` to remove `max-height: 480px; overflow-y: auto;`.
4. **Step 4 - Capsule Nav Mobile Adjustment:**
   - In `assets/css/08-responsive-tv-movies.css`, adjust `.floating-nav-capsule` max-width, item padding and gaps so all 6 icons/labels fit within narrow Android viewports.
5. **Step 5 - Cache Busting & Verification:**
   - Increment script version in `index.html` to guarantee instant refresh.
   - Test locally with browser/HTTP checks.

---

## 3. Testing & Verification

- Verify Artplayer controls show only True Fullscreen (no Web Fullscreen).
- Verify channels header no longer shows "HLS Direto Nativo".
- Verify series episodes modal scrolls cleanly in a single viewport container.
- Verify capsule navigation on mobile (<= 400px width) displays all 6 tabs without horizontal clipping.
