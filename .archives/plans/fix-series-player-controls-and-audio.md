# Plan: Fix Series/Animes Player Mouse Controls, Remote Enter Key & Multi-Server Audio

- **Task Name:** `fix-series-player-controls-and-audio`
- **Status:** PENDING_APPROVAL
- **Author:** Antigravity Orchestrator

---

## 1. Objective & Scope

### Root Causes Identified
1. **Unattached Event Listeners (Mouse Click Inactivity):**
   - `setupSeriesModalHandlers()` attaches all click listeners for `#btn-reload-series-player`, `#btn-close-series-player`, `#btn-series-prev-ep`, `#btn-series-next-ep`, `#btn-toggle-drawer`, and `#series-server-pills`.
   - However, `setupSeriesModalHandlers()` was ONLY called inside `initSeriesView()`.
   - When a user accessed Animes directly from the navigation capsule, Home, or quick portals, `initAnimesView()` was triggered without calling `setupSeriesModalHandlers()`. As a result, none of the buttons had click event handlers attached, rendering all mouse clicks completely dead.
2. **Missing `Enter` / `OK` Key Handler in D-Pad Navigation:**
   - `setupTvRemoteNavigation()` handled Back (`Escape`, `Backspace`, code `10009`, `461`) and directional arrows, but completely omitted the `Enter` / `OK` (`code 13`, `'Enter'`, `'Select'`) key handler for focused elements.
3. **Z-Index Layering:**
   - `.series-theater-overlay` was set to `z-index: 1000`, which is lower than `.floating-nav-capsule` (1100) and `.sidebar` (1250). Increasing it to `z-index: 5000` guarantees no ghost overlays or navbars intercept pointer events.
4. **Server Dubbing/Audio Options for Animes (e.g., Boku no Hero Academia):**
   - Different scraper servers (MGEB, Superflix, MyEmbed, VsEmbed) carry different audio streams (Japanese original vs PT-BR dub). With the server selector buttons clickable, users can switch between servers.
   - We will also add an anime-friendly server definition or ensure Superflix and MyEmbed endpoints are properly exposed with active badges.

---

## 2. Impacted Files

| File Path | Action | Description |
| :--- | :--- | :--- |
| `script.js` | MODIFY | 1. Initialize `setupSeriesModalHandlers()` globally in `initApp()`.<br>2. Add `Enter` / `Select` (code 13) key trigger in `setupTvRemoteNavigation()`.<br>3. Ensure server pills switch cleanly across all anime shows. |
| `style.css` | MODIFY | 1. Elevate `.series-theater-overlay` `z-index` to `5000`.<br>2. Ensure `.series-theater-top-bar`, `.series-player-bottom-bar`, and all action buttons have explicit `pointer-events: auto`, `cursor: pointer`, and relative positioning. |

---

## 3. Step-by-Step Strategy

1. **Step 1: Global Handler Initialization in `script.js`:**
   - Move or call `setupSeriesModalHandlers()` inside `initApp()` so that all series and animes player buttons (back, reload, next, prev, drawer, servers) are wired up immediately on DOM load regardless of which view is opened.
2. **Step 2: D-Pad & Keyboard `Enter` Support:**
   - Inside `window.addEventListener('keydown')` in `setupTvRemoteNavigation()`, add an `Enter` / `Select` / `keyCode === 13` handler to trigger `document.activeElement.click()` on focused interactive elements.
3. **Step 3: CSS Defense & Z-Index Elevation in `style.css`:**
   - Elevate `.series-theater-overlay` to `z-index: 5000`.
   - Add explicit pointer properties to control bars:
     ```css
     .series-theater-top-bar, .series-player-bottom-bar {
         position: relative;
         z-index: 10;
     }
     .btn-player-action-mini, .btn-player-control, .btn-series-server-pill {
         pointer-events: auto;
         cursor: pointer;
     }
     ```
4. **Step 4: Verification & Multi-Server Validation:**
   - Verify click listeners on Jujutsu Kaisen and Boku no Hero.
   - Confirm server switcher allows testing Superflix, MyEmbed, and MGEB for dubbed audio streams.

---

## 4. Testing & Verification

1. Verify that clicking "Voltar aos Episódios", "Recarregar", "Anterior", "Próximo", and "Lista de Episódios" functions reliably when opening Animes directly.
2. Verify that pressing `Enter` on any focused control button activates its action.
3. Verify that changing server pills reloads the iframe with the chosen server URL.

---

## Changelog & Micro-adjustments
- *(Live adjustments during execution will be appended here)*