# Execution Plan - Stage 2: Mobile Player Orientation & Playback Stability

- **Task Name:** `stage-2-mobile-rotation-and-playback`
- **Status:** EXECUTING (Authorized by User)
- **Author:** Antigravity Orchestrator

---

## 1. Objective & Scope

### Objective
1. **Screen Orientation Lock on Fullscreen (Android):**
   - Integrate the `Screen Orientation API` into the native Artplayer fullscreen cycle (`art.on('fullscreen')`) so that entering fullscreen automatically rotates the phone to `landscape`.
   - Ensure exiting fullscreen unlocks orientation back to default portrait/auto-rotation.
2. **Eliminate False "Stream Nativo Indisponível" on Mobile (Autoplay & Watchdog Calibration):**
   - Address mobile browser unmuted autoplay restrictions (`NotAllowedError`).
   - Prevent the 10-second cascade watchdog from erroneously destroying healthy streams when a mobile device holds playback pending a user tap.
   - Confirm stream viability on `MANIFEST_PARSED`, `loadedmetadata`, and `canplay` events.

### Scope
- **Impacted Files:**
  - `assets/js/player/engine.js`: Add orientation lock/unlock helper and calibrate `mountNativePlayer` watchdog/event cycle.
  - `index.html`: Version increment for cache busting.

---

## 2. Step-by-Step Strategy

1. **Step 1 - Mobile Orientation Helper:**
   - Create `setupMobileOrientationLock(art)` in `assets/js/player/engine.js`.
   - Hook to `art.on('fullscreen', (isFullscreen) => ...)` to call `screen.orientation.lock('landscape')` when entering and `unlock()` when exiting.
   - Add fallback document-level `fullscreenchange` listener to ensure orientation is never permanently locked.
2. **Step 2 - Calibrate Watchdog in `mountNativePlayer`:**
   - In `mountNativePlayer`, trigger `markStreamSuccess()` on `MANIFEST_PARSED`, `canplay`, and `loadedmetadata`.
   - Handle `art.play()` promise rejection safely on mobile (`NotAllowedError`), keeping the player ready and preventing premature fallback cascade.
3. **Step 3 - Apply Orientation Helper to Live TV and Movies/Series:**
   - Attach `setupMobileOrientationLock(art)` in both `mountTvDirectStream` and `mountNativePlayer`.
4. **Step 4 - Cache Busting & Verification:**
   - Bump version to `v16` in `index.html`.
   - Verify server and test endpoints.
