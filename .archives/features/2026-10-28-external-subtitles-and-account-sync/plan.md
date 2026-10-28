# Feature Plan: Automated Multi-Source Subtitles, Dedicated Player Panel & Account Sync

**Slug:** `external-subtitles-and-account-sync`  
**Date:** 2026-10-28  
**Status:** In Planning / Awaiting Approval  
**Authors:** TVzinha Engineering Team  

---

## 1. Context & Architectural Overview

The user clarified the vision for external subtitles based on modern top-tier streaming players (e.g. Cinejoy / modern video players):
1. **Automated Search & Multi-Release Aggregation:** Subtitles are fetched **automatically** from online providers (OpenSubtitles / Stremio API) using TMDB / IMDb IDs, season, and episode. No manual user effort required.
2. **Prioritization of Native/Embedded Subtitles over External Subtitles:**
   - When a video source already delivers a native/embedded subtitle track (e.g. ZokoAnime or direct streams with embedded WebVTT in Portuguese):
     - The **native track is prioritized** by default because its synchronization is 100% frame-perfect with that specific video cut.
     - In the subtitle selection menu, the native track is pinned at the top and marked clearly as `Português (Brasil) (Original da Fonte)`.
     - The external options from OpenSubtitles (`Versão 1 - OpenSubtitles`, `Versão 2`, etc.) are also listed right below it, giving users the freedom to switch if they prefer a different translation or font formatting.
   - When the stream has NO native subtitles (e.g. MGEB movie in original audio, or series without embedded tracks), the highest-rated external Portuguese subtitle is auto-selected by default.
3. **Multiple Releases Per Language:** Providers like OpenSubtitles return multiple subtitle releases per language (different translation quality, sync profiles, release groups). The system picks the best one by default, but allows users to click into the language and switch between releases (e.g., Release 1, Release 2, Hearing Impaired).
4. **Dedicated Control Bar Button & Glassmorphism Panel:** 
   - A dedicated **Subtitles button** (`Closed Captions` SVG icon) placed on the bottom player control bar, immediately adjacent to the Settings gear (`⚙`).
   - Clicking it opens a dedicated Subtitles Flyout Panel with:
     - Header: "Legendas" + "Customizar" button (navigates to styling & sync panel).
     - "Desativada" toggle.
     - "Enviar arquivo de legenda" (subtle contingency upload option).
     - "Sincronizar legenda >" shortcut.
     - Primary languages with release counters: `[Bandeira BR] Português` (e.g. `3 >`), `[Bandeira US] Inglês` (e.g. `11 >`).
     - "Mais idiomas..." / Search filter (Spanish, French, Japanese, etc.).
     - Clicking a language expands the available releases.
5. **Auto-Activation Rule:**
   - When playing non-PT-BR audio (such as Japanese anime in Player Animes, or subbed movies/series), the best available **Português (Brasil)** subtitle (native first, then external) is auto-selected and displayed immediately on playback start.
   - Respects user preferences in the site's Account Settings (`settingsPage.js`): users can turn it off by default or set a different preferred language.
6. **In-Player Customization & Sync Panel:**
   - **Subtitle Delay:** Slider and quick micro-steppers (`< Ouviu áudio` / `> Viu legenda` / `Zerar`), saved per title in `watchProgress`.
   - **Styling:** Font size (75%-150%), font colors (White, Yellow, Cyan, Green), and background contrast (Drop Shadow vs Translucent Box), synced to account preferences via `playerPrefs.js`.
7. **Zero-Emoji Compliance with Authentic Vector Flags:**
   - Unicode emoji flags (e.g. 🇧🇷) are strictly forbidden because they break into letters on Windows Desktop ("BR", "US"), vary wildly across platforms, and violate the project's visual integrity.
   - Instead, we implement **authentic vector SVG flags** (Brazil, United States, Spain, Japan, France, etc.) sized at `20x14px` with subtle `border-radius: 2px`.
   - SVG flag paths are protected from Artplayer's global white fill CSS override via dedicated `.tvz-sub-flag` rules, guaranteeing pixel-perfect color reproduction on Windows, Android, iOS, and Smart TVs.

---

## 2. Component Architecture & Data Flow

```
+-----------------------------------------------------------------------------------------+
|                                    BACKEND RESOLUTION                                   |
| /api/subtitles?tmdb_id=...&imdb_id=...&season=...&episode=...&type=movie|series         |
|   (Cloudflare Pages Function & tools/local_server.py parity)                            |
|   + Queries OpenSubtitles / Stremio Addon API                                           |
|   + Groups by Language: pt-br (pob/por), en (eng), other                                |
|   + Caches responses in memory / Cloudflare Cache API (24h TTL)                         |
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
|  |   ( ) Desativada                                                                  |  |
|  |   [Upload] Enviar arquivo próprio (opcional)                                      |  |
|  |   [Timer] Sincronizar áudio/legenda >                                             |  |
|  |                                                                                   |  |
|  |   [SVG Flag BR] Português (Brasil)  ..................................... 3 >     |  |
|  |      ├── [★] Embutida (Original da Fonte - Zoko/Stream) [Prioritária]             |  |
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

## 3. Step-by-Step Implementation Strategy

### Phase 1: Subtitle Lookup API & Backend Parity
- **Endpoints:**
  - `functions/api/subtitles.js` (Cloudflare Pages Function).
  - `tools/local_server.py` (Local development server mirror).
- **Behavior:**
  - Accepts `tmdb_id`, `imdb_id`, `type`, `season`, `episode`.
  - Queries OpenSubtitles v3 public CDN endpoint (`https://opensubtitles-v3.strem.io/subtitles/{type}/{imdb_id}.json` or `{type}/{imdb_id}:{season}:{episode}.json`).
  - Formats results into structured payload:
    ```json
    {
      "pt-br": [
        { "id": "1", "name": "Versão 1 (Padrão)", "url": "https://...", "format": "srt" },
        { "id": "2", "name": "Versão 2 (Rip)", "url": "https://...", "format": "srt" }
      ],
      "en": [
        { "id": "3", "name": "English (Original)", "url": "https://...", "format": "srt" }
      ],
      "others": {
        "es": 5, "fr": 4, "ja": 2
      }
    }
    ```
  - Unit test: `tools/test_subtitles_api.py` validating responses and edge cases.

### Phase 2: Dedicated Control Bar Button, Vector Flags & Flyout Panel in Artplayer
- In `assets/js/player/flags.js`:
  - Mini vector SVGs for primary countries: Brazil (`br`), USA/UK (`us`), Spain (`es`), Japan (`ja`), France (`fr`), etc.
- In `assets/js/player/engine.js`:
  - Register dedicated control icon `subtitles` on Artplayer controls (`art.controls.add`).
  - Build UI flyout modal styled identically to reference screenshots (dark translucent glassmorphism, rounded corners, clean typography, authentic flag vectors).
  - Implement subtitle merging: Native tracks placed at the top of their language group with an `(Original da Fonte)` badge.
  - Implement language selection and drill-down into specific subtitle releases.
  - Implement subtitle auto-activation on startup for non-PT audio streams (Native track prioritized; external fallback).

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
