# Handover: Subtitle Tag Sanitization & Streaming Standards Typography

**Date:** 2026-10-29  
**Branch:** `feat/subtitle-tag-sanitization-and-streaming-standards` -> `staging`  
**Deploy URL:** `https://staging.tvzinhaonline.pages.dev`

---

## 1. Summary of Changes

This release addresses two specific subtitle quality areas requested by the user:

1. **Subtitle Tag Sanitization (`{\an8}`, `{/an8}`, etc.):**
   - **Root Cause:** Upstream SRT / ASS files often contain SubStation Alpha override tags such as `{\an8}` (top alignment), `{/an8}`, `{\pos(...)}`, `{\fad(...)}`, `{\b1}`, `{\c&H...&}`, or MicroDVD `{y:i}` and ASS line breaks `\N`. Because WebVTT and HTML5 video render cue text directly, these tags were being displayed as raw text on screen.
   - **Ingestion Sanitization:**
     - `functions/api/subtitles.js`: `cleanVtt()` now converts `\N` to real line breaks, strips all curly bracket tags (`/\{[^}]*\}/g`), and preserves safe styling (`<i>`, `<b>`, `<u>`).
     - `tools/local_server.py`: Mirrored identical logic in `clean_vtt()`.
     - `assets/js/player/flags.js`: Client-side `cleanVtt()` updated for user-uploaded `.srt` and `.vtt` files.
   - **Player Display Sanitizer (Double Shield):**
     - `assets/js/player/engine.js`: Added `installSubtitleSanitizer(art)` with an event listener on `art.on('subtitleUpdate')` and a DOM `MutationObserver` on `art.template.$subtitle`. This ensures that even unproxied, raw HLS-embedded or third-party subtitles with stray tags are scrubbed immediately before rendering to the viewer.
   - **Automated Tests:**
     - Added `test_srt_to_vtt_ass_and_override_tags_stripping` to `tools/test_subtitles_api.py`.

2. **Typography & Styling Aligned with Major Streaming Standards (Netflix, HBO Max, Prime Video, Crunchyroll):**
   - **Font Stack:** Set to `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;`.
   - **Font Weight & Letter Spacing:** Updated to `font-weight: 600 !important;` (Semi-bold, standard for Netflix & HBO to prevent background bleed-through) and `letter-spacing: 0.02em !important;`.
   - **360-Degree Crisp Contour:** Replaced single-direction drop shadow with a multi-pass 360-degree crisp contour matching Netflix and Crunchyroll:
     `text-shadow: 0 0 3px #000, 0 0 5px rgba(0,0,0,0.95), 0 1px 3px rgba(0,0,0,0.95), 0 2px 4px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.6) !important;` with `-webkit-text-stroke: 0.35px rgba(0, 0, 0, 0.3);`. This ensures perfect legibility over both snow/bright-white scenes and dark scenes.
   - **Screen-Proportional Fullscreen Scaling:** Switched fullscreen font size formula to `calc(clamp(25px, 2.7vh, 34px) * var(--tvz-sub-scale, 1)) !important;` (~29px on 1080p, ~34px on 1440p, ~25px on 720p).
   - **Safe Margins & Line Height:** `max-width: 85% !important; margin: 0 auto !important; line-height: 1.35 !important; word-break: break-word !important;`.
   - **Controls Clearance:** Lifts up cleanly (`bottom: 95px` fullscreen, `75px` windowed) whenever player controls appear so seek bar and buttons never cover subtitles.

---

## 2. Verification Matrix

- `python tools/test_subtitles_api.py`: Passed (8 tests OK, including ASS tag stripping).
- `node tools/test_xss_protection.mjs`: Passed (24 tests OK).
- `python tools/check_js.py`: Passed (0 missing imports).
- `python tools/test_resolve_cors.py`: Passed (0 failures).
- `python tools/test_security_headers.py`: Passed (0 failures).
- `python tools/bump_version.py --check`: Passed (`20261029_1203`).
- Pushed to `origin/staging`.
