# Feature Plan: Subtitle System Overhaul & UI Visual Refinement

**Branch:** `feat/subtitle-system-overhaul-and-ui-alignment`  
**Base:** `staging`  
**Date:** 2026-10-29  

---

## 1. Objective & Scope

### Objective
Completely overhaul TVzinha's subtitle architecture to resolve:
1. **Centering & Alignment Bug:** Fix the left-skewed subtitle bug caused by `max-width: 85%` on an absolute container without `left: 0; right: 0`.
2. **Track Collisions & Fixed/Embedded Subtitles (Bleach/Anime):** Fix Artplayer locking onto embedded HLS text tracks (`$video.textTracks[0]`) instead of external tracks. Disable conflicting embedded tracks when external subtitles are active.
3. **Parameter Discrepancy:** Fix `ctx.imdbId` vs `ctx.imdb_id` so TMDB/IMDb IDs for anime and series resolve correctly for OpenSubtitles.
4. **Missing Track Type & Blob Resolution on Switch:** Fix `art.subtitle.switch()` not passing `type: 'vtt'` and failing to parse `/api/subtitles?action=proxy` URLs.
5. **Dead Link Handling & Resilient Failover:** Handle failed upstream downloads gracefully, attempting fallback tracks in the same language.
6. **UI & Aesthetic Polish:** Elevate subtitle flyout panel and player controls to match modern streaming aesthetics (clean glassmorphism, responsive pills, crisp borders, seamless touch handling).

### Out of Scope
- Modifying Cloudflare worker edge routing logic unrelated to subtitle proxying.
- Altering core video transcoding pipelines outside of player presentation.

---

## 2. Impacted Files
- `assets/css/10-player-v3.css`: Subtitle container layout, centering rules, `::cue` styling, flyout panel glassmorphism and control aesthetics.
- `assets/js/player/engine.js`: Subtitle engine synchronization, type passing, track binding fix, embedded track muting, parameter normalization, and resilient failover.
- `tools/bump_version.py`: Version stamping for cache busting.
- `tools/test_subtitles_api.py`: Additional test coverage if applicable.
- `.archives/features/2026-10-29-subtitle-system-overhaul-and-ui-alignment/plan.md`: Planning specification.
- `.archives/features/2026-10-29-subtitle-system-overhaul-and-ui-alignment/summary.md`: Completion record.
- `docs/02_CURRENT_STATE/ACTIVE_CONTEXT.md`: SSOT living state.

---

## 3. Step-by-Step Strategy

### Step 1: Subtitle Positioning & Centering Engine in CSS
- Refactor `.art-video-player .art-subtitle` to span `position: absolute; left: 0 !important; right: 0 !important; width: 100% !important; margin: 0 !important; pointer-events: none;`.
- Set container to `display: none; flex-direction: column; align-items: center; justify-content: center;`.
- Set `.art-video-player.art-subtitle-show .art-subtitle` to `display: flex !important;`.
- Move `max-width: 85% !important; margin: 0 auto !important; text-align: center !important;` to `.art-subtitle-line`.
- Add `::cue` rules on the player video element to ensure any native fallback cues look decent and readable.

### Step 2: Fix Parameter Resolution & Subtitle Switching in `engine.js`
- Normalize `imdbId`: `let imdbId = ctx.imdbId || ctx.imdb_id;`.
- Fix subtitle switching: always pass `{ name, type: 'vtt' }` to `art.subtitle.switch(url, ...)`.
- Patch `art.subtitle` track selection: ensure `art.subtitle` observes `art.template.$track.track` directly instead of blindly relying on `$video.textTracks[0]`.
- When an external subtitle is active, disable embedded HLS text tracks (`mode = 'disabled'`). When subtitles are turned off, allow HLS subtitles if desired or keep disabled.
- Add failover logic: if fetching the active subtitle fails or returns an error, try the next available subtitle in the same language and notify the user cleanly.

### Step 3: Visual & Aesthetic Polish of the Subtitle Flyout
- Polish `.tvz-subtitles-panel`: refine elevation, backdrop blur (`backdrop-filter: blur(20px)`), refined scrollbar, responsive sizing on mobile/fullscreen.
- Refine settings controls (size pills, color swatches, background mode toggle) for smooth transitions and accessible focus rings.

### Step 4: Verification, Version Bump & Merge
- Run test matrix: `check_js.py`, `bump_version.py`, `test_subtitles_api.py`.
- Merge branch into `staging` (`git merge --no-ff`) and push to `origin/staging`.
- Update documentation and handover.
