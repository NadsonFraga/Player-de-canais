# Plan: Fix Player Black Screen Flashes & Implement Resilient Stream Loaders

- **Task Name:** `fix-player-black-screen-and-loader`
- **Status:** PENDING_APPROVAL
- **Author:** Antigravity Orchestrator

---

## 1. Objective & Scope

### Root Causes Identified
1. **Race Condition in Rapid `about:blank` Navigation:**
   - In `script.js` (lines 5041 and 5504), player stream swapping used:
     ```javascript
     iframe.src = "about:blank";
     requestAnimationFrame(() => { iframe.src = nextUrl; });
     ```
   - In Chromium/WebKit, setting `about:blank` queues an asynchronous document unload. When `nextUrl` is set in the very next animation frame (~16ms), the browser's navigation scheduler frequently cancels the second navigation or locks the iframe context onto a pure black `about:blank` page.
2. **Missing Visual Loader in Series/Animes & Movies Theaters:**
   - While Live TV (`video-theater-wrapper`) had `.video-loader-overlay`, the Series/Animes Theater (`series-theater-stage`) and Movie Player (`movie-modal-player-container`) had NO visual loading spinner.
   - When third-party streaming providers take 2–5 seconds to negotiate stream handshakes, the iframe displays a blank black box (`background: #000000;`). Without a loader, viewers perceive this as a frozen black screen.
3. **Flaky Server Fallback (WarezCDN SSL/Handshake issues):**
   - Live testing revealed `WarezCDN` has intermittent SSL handshake closures (`UNEXPECTED_EOF_WHILE_READING`).
   - We will replace flaky endpoints with robust, verified high-speed anime/series streaming providers (e.g. `Superflix`, `MGEB`, `MyEmbed`, `EmbedFlix`).

---

## 2. Impacted Files

| File Path | Action | Description |
| :--- | :--- | :--- |
| `index.html` | MODIFY | Add `<div id="series-theater-loader" class="video-loader-overlay">` inside `.series-theater-stage`, and loader in `#movie-modal-player-container`. |
| `script.js` | MODIFY | 1. Replace the flaky `requestAnimationFrame` unloader with a deterministic `setTimeout(..., 50)` safe transition.<br>2. Hook `iframe.onload` and a 4s safety timeout to auto-hide the loading spinner.<br>3. Replace unreliable server endpoints with verified active providers. |
| `style.css` | MODIFY | Ensure `.video-loader-overlay` works seamlessly inside both `.series-theater-stage` and `.movie-player-wrapper`. |

---

## 3. Step-by-Step Strategy

1. **Step 1: HTML Structure Enhancement:**
   - In `index.html`, inject the loading overlay inside `.series-theater-stage`:
     ```html
     <div id="series-theater-loader" class="video-loader-overlay hidden">
         <div class="spinner"></div>
         <span>Carregando reprodução...</span>
     </div>
     ```
   - Inject matching loader into movie player container.
2. **Step 2: Stream Swapping & Unloader Stabilization (`script.js`):**
   - In `playSeriesEpisode` and server pill click handlers:
     ```javascript
     const loader = document.getElementById("series-theater-loader");
     if (loader) loader.classList.remove("hidden");
     
     iframe.src = "about:blank";
     setTimeout(() => {
         iframe.src = embedUrl;
     }, 60);

     iframe.onload = () => {
         if (iframe.src && !iframe.src.endsWith("about:blank")) {
             if (loader) loader.classList.add("hidden");
         }
     };
     setTimeout(() => {
         if (loader) loader.classList.add("hidden");
     }, 4000);
     ```
3. **Step 3: Server Endpoint Optimization:**
   - Verify all active anime/series streaming endpoints to eliminate broken servers.
4. **Step 4: Verification:**
   - Test episode switching and server switching in Jujutsu Kaisen and Boku no Hero Academia.
   - Confirm spinner displays during loading and hides once stream renders.

---

## 4. Testing & Verification

1. Verify that switching episodes displays the spinner and transitions cleanly to video without getting stuck on black.
2. Verify that clicking another server pill reloads the stream with visual feedback.
3. Verify that closing the player kills all background audio immediately.

---

## Changelog & Micro-adjustments
- *(Live adjustments during execution will be appended here)*