# Execution Plan - Stage 5: Unified Cinematic Player Design (Movies, Series & Animes)

- **Task Name:** `stage-5-unified-player-design`
- **Status:** PENDING_AUTHORIZATION
- **Author:** Antigravity Orchestrator

---

## 1. Objective & Scope

### Objective
Align the layout and design of both Movies and Series/Anime players into a single, cohesive, premium modal pattern as requested by the user:
1. **Header Title Fix in Movies Player:**
   - In `movie-player-top-bar`, replace the generic server name badge (`Player Nativo - Sem Anúncios (BETA)`) with the actual movie title (e.g., `Cidade de Deus`), keeping `[Recarregar]` and `[Fechar Player]` on the right.
2. **Unified Series & Anime Player Layout (Eliminate Floating Box):**
   - Transform the series/anime player from the cramped floating theater box into a unified, rich modal layout mirroring the movie experience:
     - **Top Bar:** Shows `<Show Name> • T{S}:E{E} – <Ep Name>` on the left with graceful truncation, and `[Recarregar]` + `[Voltar aos Episódios]` / `[Fechar Player]` on the right.
     - **Video Stage:** Full-width 16:9 responsive player container directly under the top bar.
     - **Episode Controls Bar:** Positioned right beneath the video stage (`[Anterior]`, `[Lista de Episódios]`, `[Próximo]`).
     - **Servers Section:** Clean 2-column grid cards matching the movie servers design (`Selecione um Servidor para Reproduzir:`) instead of cramped pill buttons.
     - **Series & Episode Info Section:** Below the servers, render the show title, current episode title, rating, release year, and synopsis.
3. **Mobile Screen Optimization:**
   - On mobile displays, ensure the top bar, video area, episode controls, server cards, and details scroll smoothly inside the modal without cutoffs or overlapping.

### Scope
- **Impacted Files:**
  - `assets/js/modules/movies.js`: Update `selectMovieServer` to display movie title in `movie-player-server-title`.
  - `assets/js/modules/series.js`: Unify series theater player DOM rendering and server selector integration.
  - `index.html`: Update series theater player structure and movie player header markup to align templates.
  - `assets/css/07-modals.css`: Unified modal styles for top bars and server grids.
  - `assets/css/08-responsive-tv-movies.css`: Mobile styling for the unified player layout.
  - `assets/css/09-series-animes.css`: Clean up obsolete theater floating overlay styles.

---

## 2. Step-by-Step Strategy

1. **Step 1 - Movie Player Header Title Correction:**
   - In `movies.js` (`selectMovieServer`), set `#movie-player-server-title` to `currentSelectedMovie.title` rather than `server.name`.
2. **Step 2 - Series Player Layout Modernization:**
   - Update `series-player-view` in `index.html` and `09-series-animes.css` so that instead of a floating centered card on a huge empty black background, it expands into a full-height cinematic modal card (identical to `.movie-modal-card`).
   - Place `#series-player-current-ep` in the top bar with ellipsis overflow protection.
   - Place the video stage right below the header.
   - Place the episode navigation buttons (`[Anterior]`, `[Lista de Episódios]`, `[Próximo]`) directly beneath the video stage.
   - Format `#series-server-pills` into a modern grid matching `#movie-servers-grid` with server cards.
   - Add the series synopsis, rating, and metadata below the server cards.
3. **Step 3 - Mobile Responsiveness Refinement:**
   - Ensure touch targets, scrollability, and proper padding on Android viewports.
4. **Step 4 - Verification & Cache Busting:**
   - Verify syntax with `python tools/check_js.py`.
   - Bump cache version to `v21` in `index.html` and `main.js`.
   - Validate desktop and mobile layouts.

---

## 3. Testing & Edge Cases
- Test Movie playback on mobile and PC to confirm the actual movie title appears in the top bar.
- Test Series/Anime playback on mobile and PC to confirm the player is full-width, not a tiny box in the center of the screen, with clean episode navigation and matching server grid.
- Verify scrolling and responsive behavior on small screens (<400px).
