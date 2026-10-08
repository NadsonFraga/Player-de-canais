# 🚀 TVZINHA ONLINE — HANDOVER & ONBOARDING BRIEFING

> **Target Audience:** Next Agent / Incoming Developer  
> **Repository:** `NadsonFraga/Player-de-canais`  
> **Current Base Branch:** `master` (Sync required: `git pull origin master`)  
> **Date:** October 2026 | **State:** Working Tree Clean, Production Deployed via Cloudflare Pages  

---

## 📌 1. IMMEDIATE FIRST STEP FOR THE NEXT AGENT
Before doing any investigation, editing, or testing:
```bash
git checkout master
git pull origin master
```
Verify status:
```bash
git status
```
The workspace must be 100% clean and aligned with `origin/master` (commit `abb31a7` or later).

---

## 🏗️ 2. WHAT WAS ACCOMPLISHED (RECENT MAJOR REFACTORING)

### A. Full Architectural Migration (Monolith to ESM)
1. **JavaScript ESM Modularization**:
   - The former monolithic `script.js` (6,500+ lines) has been fully decomposed into standard native ES Modules (`assets/js/`):
     - `assets/js/core/`: `state.js`, `constants.js`, `icons.js`, `toast.js`, `wakeLock.js`, `fallbackChannels.js`.
     - `assets/js/navigation/`: `router.js` (SPA view manager), `remote.js` (TV D-pad key navigation), `historyManager.js` (browser pushState/popState back button stack).
     - `assets/js/player/`: `engine.js` (dual Hls.js + Artplayer runtime), `liveLatency.js`.
     - `assets/js/modules/`: `channels.js`, `home.js`, `sports.js`, `movies.js`, `series.js`.
     - `assets/js/main.js`: Main bootstrap script orchestrating all modules.
   - `index.html` loads `<script type="module" src="assets/js/main.js?v=20261006_v26"></script>`.
2. **CSS Modularization**:
   - The former monolithic `style.css` (3,200+ lines) was fragmented into 10 scoped style modules under `assets/css/` (`01-base.css` to `10-player-v3.css`).
3. **Data & Docs Clean Up**:
   - `canais.json` and `proximos_jogos.json` moved to `data/`.
   - Documentation consolidated in `docs/`.
   - Python support scripts and local servers moved to `tools/`.

### B. Recent Fixes & Critical Stability Enhancements
1. **Search Isolation (Series vs. Anime)**:
   - **Anime Tab**: Text queries now explicitly require `genre_ids.includes(16)` and Japanese/Asian origin (`ja`, `JP`, `ko`, `zh`) so live-action TV series are barred from anime results.
   - **Series Tab**: Text queries explicitly filter out `genre_ids.includes(16)` so anime releases do not pollute the live-action TV series catalog.
   - Results counters are synced with post-filtered items.
2. **Catalog HTTP 400 Bad Request Fix**:
   - Fixed a duplicate `with_genres` parameter construction bug in `executeFilteredAnimesSearch()` that was throwing 400 errors when clicking genre tags (e.g. Comedy, Mystery).
3. **Anime Resolver Scoring & Seasonality Mapping**:
   - Upgraded `tools/local_server.py` and `functions/api/resolve.js` with heuristic scoring for MyAnimeList/Jikan matching.
   - Resolved franchise seasonality mismatch (e.g. *JoJo's Bizarre Adventure: Stone Ocean* correctly maps to MAL ID 48661 instead of Season 1).
4. **Merge to Master**:
   - Merged `feat/v14-esm-refactor-and-stability` into `master` via clean fast-forward and pushed to GitHub.

---

## 🧭 3. DISCOVERIES & SYSTEM ARCHITECTURE KNOWLEDGE

1. **One Piece & Long-Running Anime Provider Status**:
   - **Player 1 (MGEB)**: MGEB only hosts files for Season 1 (East Blue, episodes 1–61). Seasons 2+ return `sources = []` from MGEB's own servers.
   - **Player 2 (SuperFlix, MyEmbed, VsEmbed)**: These external iframe providers have all seasons (1,100+ episodes).
   - **Native Anime Player (ZokoAnime)**: Has all 1,100+ episodes available in subbed 1080p, indexed by continuous/absolute episode number (e.g. Season 2 Episode 1 is Episode 62).
2. **Local Testing Environment**:
   - Local dev server is run with `python tools/local_server.py` (listens on `http://localhost:8787`).
   - Serves local static files while mirroring `/api/resolve` and `/api/stream` edge proxy behavior.
   - *Note: Ensure processes on port 8787 are killed before starting.*

---

## 📋 4. MASTER BACKLOG: WHAT REMAINS TO BE DONE

Here is the prioritized backlog for the project:

### Phase 4: Backend Edge Security Hardening (Highest Priority)
1. **Migrate TMDB API Key to Cloudflare Environment Variables**:
   - Currently, `TMDB_API_KEY` is hardcoded in `functions/api/resolve.js`.
   - Migrate to `context.env.TMDB_API_KEY` configured in the Cloudflare Pages dashboard, with fallback for local dev.
2. **Mitigate Open Proxy & SSRF in `/api/stream`**:
   - `functions/api/stream.js` currently fetches arbitrary URLs passed to `?url=`.
   - Add a strict domain whitelist (`mgeb.top`, `dramahot.top`, `zokoanime.video`, `peliculaplay.com`, `playspelis.com`, `playercdn.workers.dev`, `embedplayer2.xyz`, etc.).
3. **Restrict CORS in `/api/stream` & `/api/resolve`**:
   - Replace `Access-Control-Allow-Origin: *` with domain validation (`https://tvzinhaonline.pages.dev`, `http://localhost:8787`, `https://tvzinha.app`).
4. **Dynamic Referer Header**:
   - Replace hardcoded `https://tvzinhaonline.pages.dev/` with dynamic origin derived from `new URL(request.url).origin`.

### Phase 5: Codebase Housekeeping & Asset Optimization
1. **Archive/Remove Legacy Monolithic `script.js`**:
   - `script.js` (6,500 lines) remains in the root as a historical artifact. Verify no external references exist and archive/delete it to reduce repository bloat.
2. **Image Optimization**:
   - Audit `assets/logos/channels/` to replace legacy heavy PNG files with existing WebP counterparts (e.g. `globo.png` 544 KB vs `globo.webp` 87 KB).
3. **Subresource Integrity (SRI)**:
   - Add `integrity` and `crossorigin` hashes to CDN `<script>` tags in `index.html` (Artplayer and Hls.js).
4. **Player Resilience (Empty Sources Handling)**:
   - When Player 1 (MGEB) returns empty sources (as in One Piece Season 2+), automatically suggest or failover to SuperFlix (Player 2) or Native Anime Player without showing a broken state.

---

## 🛠️ 5. HOW TO RUN & VERIFY LOCAL TESTS
```bash
# 1. Start the local dev server
python tools/local_server.py

# 2. Test an anime resolve query
python -c "import urllib.request, json; res = urllib.request.urlopen('http://localhost:8787/api/resolve?type=anime&id=37854&season=1&episode=1&title=One+Piece&lang=sub'); print(json.loads(res.read())['success'])"

# 3. Run regression tests
python tools/test_live_resolve.py
```
