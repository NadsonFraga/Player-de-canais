# External Subtitles & Account Sync — Test Verification Report

**Date:** 2026-10-28  
**Feature Branch:** `feat/external-subtitles-and-account-sync`  
**Target:** `staging`  

---

## 1. Automated Test Suite Results

| Test Suite | Command | Result | Details |
|---|---|---|---|
| Subtitle API & Proxy | `python tools/test_subtitles_api.py` | PASS (7/7) | Query validation, mock search, TMDB/IMDb resolution, CORS, SRT-to-VTT proxy conversion, anti-SSRF guards. |
| Account Sync Engine | `python tools/test_sync_api.py` | PASS (48/48) | Profile sync, sanitation, merge rules, player preference serialization (`subtitle_size`, `subtitle_color`, `subtitle_bg`). |
| XSS Protection | `node tools/test_xss_protection.mjs` | PASS (24/24) | VTT cue sanitization, attribute escaping, headless browser DOM rendering safety. |
| Security Headers | `python tools/test_security_headers.py` | PASS | SRI integrity, CSP policies, frame-ancestors, local server parity. |
| CORS Origin Validation | `python tools/test_resolve_cors.py` | PASS | Localhost, LAN, and Cloudflare Pages origins. |
| ES Module Import Paths | `python tools/check_js.py` | PASS (0 errors) | Zero missing ES module import paths across `assets/js`. |
| Cache Busting Synchronization | `python tools/bump_version.py --check` | PASS | Single synchronized version query stamp (`20261028_1827`). |

---

## 2. Manual Verification Checklist for Staging

- [ ] **Movie/Series Automatic Subtitle Loading:**
  - Open a movie or series episode (e.g., *A Origem* or *Breaking Bad*).
  - Verify that the CC button appears in the player controls.
  - Clicking CC opens the dark glassmorphic flyout panel with flag icons.
  - Native tracks are pinned to the top with `(Original da Fonte)` badge.
  - External tracks are categorized cleanly by language (PT-BR, English, etc.).
- [ ] **Anime Stream Auto-Activation:**
  - Open an anime episode.
  - Verify that PT-BR subtitle is enabled by default.
- [ ] **Dubbed Stream Auto-Activation:**
  - Open a dubbed title/stream.
  - Verify that subtitle is off by default unless explicitly chosen.
- [ ] **Timing Delay Offset Slider:**
  - In the CC flyout, click "Ajustes / Sincronia".
  - Adjust timing slider or click `-0.5s`, `Zerar`, `+0.5s`.
  - Verify that subtitle sync immediately shifts and the offset persists across reload for this title.
- [ ] **Custom Appearance (Size, Color, Box/Shadow):**
  - Switch font size between 75%, 100%, 125%, 150%.
  - Switch color palette between White, Yellow, Cyan, Green.
  - Switch background mode between Shadow and Box.
  - Verify that subtitle cues immediately reflect new appearance.
  - Refresh or open another title on the same profile and confirm styles are preserved.
- [ ] **Contingency Local File Upload:**
  - In the CC flyout, click "Carregar legenda do dispositivo (.srt, .vtt)".
  - Choose a local `.srt` or `.vtt` file.
  - Verify that the custom subtitle activates instantly.

