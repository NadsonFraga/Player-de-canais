# External Subtitles & Account Sync — Feature Summary

**Feature:** Automated External Subtitles, Customizer & Profile Sync  
**Branch:** `feat/external-subtitles-and-account-sync`  
**Date:** 2026-10-28  
**Status:** Completed & Merged into `staging`  

---

## 1. Overview of Delivered Scope

1. **Subtitles Discovery & Proxy API (`functions/api/subtitles.js` & `tools/local_server.py`):**
   - Implemented `GET /api/subtitles` endpoint querying Stremio OpenSubtitles v3.
   - Handled TMDB-to-IMDb ID resolution fallback when IMDb ID is not natively provided.
   - Provided CORS-safe WebVTT proxy converter (`action=proxy&url=...`) with server-side SRT to WebVTT conversion.
   - Guarded against SSRF and cleaned malicious payloads (`<script>`, `onerror`, etc.) inside cues.
   - Parity guaranteed between Cloudflare Edge Function and local python server.

2. **Player Subtitle Engine (`assets/js/player/engine.js` & `assets/js/player/flags.js`):**
   - Added dedicated `CC` control button in Artplayer control bar.
   - Added vector SVG country flag icons (BR, US, PT, ES, FR, JA, Global) compliant with the Zero Emojis rule.
   - Non-blocking async background fetch on stream launch with session cancellation token.
   - Context-aware auto-activation: Dubbed streams default to off; anime and subtitled streams auto-activate PT-BR.
   - Priority pinning for native stream tracks with `(Original da Fonte)` badge.
   - Grouping by language with drill-down release variant selection.
   - Manual contingency upload for local `.srt` and `.vtt` files with client-side blob conversion.

3. **Subtitle Timing & Style Customizer:**
   - Dedicated adjustment panel inside the CC flyout.
   - Timing delay offset slider (`-10.0s` to `+10.0s`) with quick adjustment buttons (`-0.5s`, `Zerar`, `+0.5s`), saved per title in localStorage.
   - Subtitle typography controls: Size (75%, 100%, 125%, 150%), Color (White `#ffffff`, Yellow `#facc15`, Cyan `#22d3ee`, Green `#4ade80`), and Background (Shadow vs Semi-opaque Box).
   - Dynamically applied to Artplayer subtitle container via CSS custom properties.

4. **Account & Profile Synchronization:**
   - Extended `assets/js/core/playerPrefs.js` defaults with `subtitle_size`, `subtitle_color`, `subtitle_bg`.
   - Updated `assets/js/core/syncMerge.js` and `tools/local_sync.py` to sanitize and sync subtitle appearance preferences across user profile devices without breaking legacy sync records.

5. **Cache Busting & Test Integrity:**
   - Version stamped to `20261028_1827` across 33 project files.
   - All automated test suites passing (sync, subtitles API, XSS, headers, CORS, imports).

