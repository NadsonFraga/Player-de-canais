# Feature Plan: Preserve Primary Source Quality on Episode Navigation

**Slug:** `preserve-primary-source-quality`  
**Date:** 2026-10-27  
**Branch:** `feat/preserve-primary-source-quality`  

---

## 1. Problem Statement
When transitioning between episodes (e.g. in *Rick and Morty* S8E2, where the primary source is a 1080p MP4 direct stream from a Brazilian CDN whose dimensions are unprobed by the server due to datacenter WAF), the client player engine inspected the candidate list and found that only a secondary HLS fallback had a known quality declaration (480p). Because the user had previously selected a numeric resolution preference (e.g. 1080p), the player attempted to match the closest available quality, downgraded to 480p, and immediately switched to the fallback HLS source (index 1), locking `autoMode = false`.

This bypassed the top-tier 1080p primary source on every episode change, locked the player to a muddy 480p stream with low-volume compressed audio, and required the user to manually click "Buscar qualidade melhor" every time.

---

## 2. Solution Design
1. **Prevent Premature Downgrade in `mountNativePlayer`:**
   - In `assets/js/player/engine.js`, if the user has a numeric quality preference $\ge 720p$ and the primary source (`normalized[0]`) has not yet been probed by the server (`quality == null`), keep `firstIndex = 0` and preserve the requested quality. Do not switch to a lower-resolution fallback source ($< 720p$) before the primary source has a chance to play and be measured by the browser.
2. **Prevent Premature Checkmark Reconciliation:**
   - In `refreshQualityMenu()`, if the current playing source is unmeasured (`current && !current.quality`), do not prematurely downgrade `session.lockedQuality` to lower resolutions.
3. **Upgrade Safeguard for Locked & Auto Quality:**
   - In `measureCurrentQuality()`, when playing a source with resolution $< 720p$, automatically trigger background search if the user wants higher quality (`session.autoMode` or `session.lockedQuality > activeQuality`), promoting to 1080p without manual user action.

---

## 3. Scope
- `assets/js/player/engine.js`: Source selection, quality reconciliation, and upgrade trigger.
- Version stamping via `tools/bump_version.py`.
- Automated test suites (`check_js.py`, `bump_version.py --check`, `test_mgeb_rules.py`, `test_security_headers.py`, `test_resolve_cors.py`).
