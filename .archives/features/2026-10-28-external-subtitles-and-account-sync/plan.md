# Feature Plan: Automated Multi-Source Subtitles, Dedicated Player Panel & Account Sync

**Slug:** `external-subtitles-and-account-sync`  
**Date:** 2026-10-28  
**Status:** In Planning / Awaiting Approval  
**Authors:** TVzinha Engineering Team  

---

## 1. Executive Summary & Design Scope

The subtitle architecture is built to mirror modern top-tier streaming players (e.g. Cinejoy / modern video players), ensuring an automated, intuitive, and platform-consistent experience.

### Core Pillars
1. **Automated Search & Multi-Release Aggregation:** Subtitles are fetched **automatically** from online providers (OpenSubtitles / Stremio API) using TMDB / IMDb IDs, season, and episode. No manual user effort required.
2. **IMDb ID Resolution Guard:**
   - Stremio's OpenSubtitles v3 strictly requires an IMDb ID (`tt...`).
   - If the client only passes a `tmdb_id`, the backend (`/api/subtitles`) automatically queries TMDB's `/{type}/{id}/external_ids` to retrieve and cache the `imdb_id` before querying Stremio, eliminating 404 or empty list failures.
3. **CORS & Proxy Fallback Guard:**
   - Third-party CDN subtitle URLs may lack CORS headers or encounter WAF blocks in the browser.
   - The backend provides a built-in proxy route (`/api/subtitles?action=proxy&url=...`) with guaranteed `Access-Control-Allow-Origin: *` and automatic WebVTT conversion if client direct fetch fails.
4. **Smart Auto-Activation Rules (Audio Context Aware):**
   - **Dubbed / Brazilian Streams (MGEB, FênixFlix, Portuguese audio):** Subtitles start **DESATIVADAS (Off)** by default. Displaying subtitles over already dubbed Portuguese audio degrades UX. Options are silently fetched in background and ready in the menu for 1-click manual activation. When manually activated, the choice is persisted for that specific title/series.
   - **Subtitled / Original Foreign Audio (Player Animes, Zoko, `lang=sub`):** Subtitles are **ATIVADAS (On)** in Portuguese (Brazil) by default. If the user turns it off, their choice is respected and remembered for that title.
   - **Account Settings Override:** If the user explicitly sets a global subtitle preference in the site's Account Settings (`settingsPage.js`), the global profile preference takes precedence over heuristics.
5. **Prioritization of Native/Embedded Subtitles:**
   - When a video source provides native/embedded subtitles (e.g. ZokoAnime or streams with embedded tracks), the **native track is prioritized** for frame-perfect sync and pinned at the top as `Português (Brasil) (Original da Fonte) [Ativa]`.
   - External OpenSubtitles releases (`Versão 1 - OpenSubtitles`, `Versão 2`, etc.) are listed directly underneath, allowing users to switch if desired.
6. **Dedicated Control Bar Button & Glassmorphism Flyout Panel:**
   - A dedicated **Closed Captions (`CC`)** button on the bottom control bar, positioned immediately adjacent to the Settings gear (`⚙`).
   - Panel features:
     - Header: "Legendas" + "Customizar" button.
     - "Desativada" toggle.
     - "Enviar arquivo de legenda" (discreet contingency upload).
     - "Sincronizar áudio/legenda >" shortcut.
     - Language rows with **authentic vector SVG flags** and release counters (e.g., `[SVG Flag BR] Português (Brasil) 3 >`, `[SVG Flag US] Inglês 11 >`).
     - Clicking a language drills down into available releases.
     - "Mais idiomas..." search/expansion for secondary languages (Spanish, French, Japanese, etc.).
7. **In-Player Customization & Playback Continuity:**
   - **Subtitle Delay:** Interactive slider (`-10s` to `+10s`) and quick buttons (`< Ouviu áudio` / `> Viu legenda` / `Zerar`), saved per title in `watchProgress`.
   - **Styling:** Font size (75%-150%), font colors (White, Yellow, Cyan, Green), and background contrast (Drop Shadow vs Translucent Box), synced to account preferences via `playerPrefs.js` and `syncMerge.js`.
8. **Zero Emojis Red Line:** In compliance with repository guidelines, country flags are rendered using authentic, lightweight SVG vector illustrations (`flags.js`) with Artplayer CSS isolation—never Unicode emoji pictographs.

---

## 2. Component Architecture & Data Flow

```
+-----------------------------------------------------------------------------------------+
|                                    BACKEND RESOLUTION                                   |
| /api/subtitles?tmdb_id=...&imdb_id=...&season=...&episode=...&type=movie|series         |
|   (Cloudflare Pages Function & tools/local_server.py parity)                            |
|   ├── Step 1: Validate / Resolve imdb_id via TMDB external_ids (cached)                 |
|   ├── Step 2: Query OpenSubtitles / Stremio Addon API                                   |
|   ├── Step 3: Group by Language: pt-br (pob/por), en (eng), other + count releases      |
|   └── Step 4: Proxy fallback (/api/subtitles?action=proxy&url=...)                      |
+-----------------------------------------------------------------------------------------+
                                           |
                                           v
+-----------------------------------------------------------------------------------------+
|                                  ARTPLAYER INTEGRATION                                  |
| assets/js/player/engine.js                                                              |
|                                                                                         |
|  [Bottom Bar]                                                                           |
|  Play/Pause | Timeline | ... | [CC Subtitles Button] | [⚙ Settings] | [Fullscreen]      |
|                                     |                                                   |
|                                     v (Opens Flyout Panel)                              |
|  +-----------------------------------------------------------------------------------+  |
|  | Subtitles Panel:                                                                  |  |
|  |   Header: "Legendas" .......................................... [Customizar]      |  |
|  |   ( ) Desativada (Default on MGEB / FênixFlix)                                    |  |
|  |   [Upload] Enviar arquivo próprio (opcional)                                      |  |
|  |   [Timer] Sincronizar áudio/legenda >                                             |  |
|  |                                                                                   |  |
|  |   [SVG Flag BR] Português (Brasil)  ..................................... 3 >     |  |
|  |      ├── [★] Embutida (Original da Fonte) [Auto-Active on Animes/Subbed]          |  |
|  |      ├── [ ] Versão 1 (OpenSubtitles)                                             |  |
|  |      └── [ ] Versão 2 (OpenSubtitles - Rip)                                       |  |
|  |                                                                                   |  |
|  |   [SVG Flag US] Inglês  ................................................. 11 >    |  |
|  |   [Globe] Outros idiomas...                                                       |  |
|  +-----------------------------------------------------------------------------------+  |
|                                     |                                                   |
|                                     v ("Customizar" clicked)                            |
|  +-----------------------------------------------------------------------------------+  |
|  | Subtitle Customization & Sync:                                                    |  |
|  |   < Voltar                                                                        |  |
|  |   Atraso da legenda: [-0.5s] [ 0s ] [+0.5s]  (Slider: -10s .. +10s)               |  |
|  |   Tamanho da fonte: [ 100% ] (Slider: 75% .. 150%)                                 |  |
|  |   Cor do texto: [Branco] [Amarelo] [Ciano] [Verde]                                |  |
|  |   Fundo: ( ) Sombra clássica  ( ) Caixa translúcida                               |  |
|  +-----------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
                    v                                             v
     +------------------------------+             +-------------------------------+
     | ACCOUNT / PROFILE SYNC       |             | TITLE PLAYBACK CONTINUITY     |
     | playerPrefs.js + syncMerge.js|             | watchProgress.js              |
     | (Size, Color, Bg, Default)   |             | (Delay Offset per movie / ep) |
     +------------------------------+             +-------------------------------+
```

---

## 3. Step-by-Step Implementation Roadmap

### Phase 1: Subtitle Lookup API, IMDb Resolution & Proxy Parity
- **Endpoints:**
  - `functions/api/subtitles.js` (Cloudflare Pages Function).
  - `tools/local_server.py` (Local development server mirror).
- **Tasks:**
  - Implement TMDB external ID fallback (`/movie/{id}/external_ids`) when `imdb_id` is missing.
  - Implement Stremio OpenSubtitles v3 query with language grouping (`pt-br`, `en`, `others`).
  - Implement CORS-safe proxy action (`action=proxy`).
  - Unit test suite: `tools/test_subtitles_api.py`.

### Phase 2: Authentic Vector Flags, Control Bar Button & Flyout Panel in Artplayer
- In `assets/js/player/flags.js`:
  - Authentic mini vector SVGs for primary countries (`br`, `us`, `es`, `ja`, `fr`).
- In `assets/js/player/engine.js`:
  - Add `subtitles` button to Artplayer controls bar next to settings.
  - Render dark glassmorphism flyout panel.
  - Implement subtitle merging: Native tracks at top with `(Original da Fonte)` badge.
  - Implement heuristic auto-activation:
    - `isAnime || audio === 'subtitled'` -> Auto-select best PT-BR track.
    - `audio === 'dubbed' || provider === 'mgeb' || provider === 'fenix'` -> Start Off by default.

### Phase 3: Customization Panel, Offset Controller & Account Integration
- Implement the "Customizar" sub-view inside the subtitle drawer:
  - Real-time subtitle delay with `< Ouviu áudio` / `> Viu legenda` controls and interactive slider.
  - Font size, color swatches, and background toggles.
- Connect settings to `playerPrefs.js` and `syncMerge.js` so they persist to the user's account and sync between devices.
- Connect offset to `watchProgress.js` so adjustments persist when resuming a title.

### Phase 4: Automated Testing, Cache Busting & Staging Verification
- Automated checks:
  - `python tools/check_js.py`
  - `node tools/test_xss_protection.mjs`
  - `python tools/bump_version.py`
- Test playback across Anime (Jujutsu Kaisen, DBZ), Movies (Shawshank Redemption, Spider-Man), and Series (Breaking Bad).
- Merge into `staging` and verify on live preview `https://staging.tvzinhaonline.pages.dev/`.
