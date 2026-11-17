# Handover: Subtitle System Overhaul & UI Visual Refinement

**Date:** 2026-10-29  
**Branch:** `feat/subtitle-system-overhaul-and-ui-alignment` -> `staging`  
**Deploy URL:** `https://staging.tvzinhaonline.pages.dev`  
**Version:** `20261029_1949`  

---

## 1. Summary of Deliverables

- **Centering & Alignment Fix:** `.art-subtitle` set to `left: 0; right: 0; width: 100%` with flexbox centering; safety margins moved to `.art-subtitle-line`.
- **Artplayer 5.1.7 Track Patch:** `patchArtplayerSubtitleEngine` fixes the hardcoded `textTracks[0]` bug so newly switched external tracks receive `cuechange` and render cues properly.
- **Embedded HLS Track Guard:** `disableEmbeddedTextTracks` disables conflicting in-band HLS text tracks when external subtitles are enabled.
- **IMDb / TMDB Parameter Resolution:** Resolved `ctx.imdbId || ctx.imdb_id` and canonical TMDB season/episode mapping so OpenSubtitles v3 receives accurate IDs.
- **VTT Explicit Typing & Automatic Failover:** Forced `type: 'vtt'` on `switch()` and added try/catch failover to alternative tracks in the same language when links are dead.
- **Box Background & Panel Scrollbars:** Added rounded black pill background on `.art-subtitle-line` for `data-bg="box"` and customized scrollbars for the subtitle flyout.

---

## 2. Checks Passed
- `python tools/check_js.py`: Passed (0 missing).
- `python tools/bump_version.py --check`: Passed (`20261029_1949`).
- `python tools/test_subtitles_api.py`: Passed (8/8).
- `python tools/test_resolve_cors.py`: Passed (0 failures).
- `python tools/test_security_headers.py`: Passed (0 failures).
