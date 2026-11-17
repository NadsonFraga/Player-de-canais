# Feature Summary: FenixFlix Audio Compatibility & Stream Tier Ranking

**Slug:** `fenixflix-audio-compatibility`  
**Date:** 2026-10-28  
**Branch:** `feat/fenixflix-audio-compatibility`  

---

## 1. Overview
Diagnosed and resolved an issue on FenixFlix where *Rick and Morty* (S08E04 / Ep. 75) played video without audio in web browsers.

---

## 2. Root Cause Analysis
The FenixFlix API returns a mix of dedicated web VOD re-encodes (`fenixhub.online` like Zeus and Badger) and un-transcoded bot torrent streams (`squareweb.app`, `fenixbot`, `koyeb.app`).
- The bot torrent streams serve raw MKV files with `A_EAC3` (Dolby Digital Plus 5.1) multi-track audio.
- Web browsers (Chrome, Edge, Firefox, Android) do not have licensed E-AC-3 software decoders in HTML5 `<video>`, resulting in silent playback.
- Because `squareweb.app` was previously ranked in Tier 4 alongside `fenixhub.online`, stable sorting selected the silent MKV stream as primary.

---

## 3. Implementation Details
1. **Refined Provider Tier Ranking:**
   - **Tier 4:** Dedicated official web VOD masters (`fenixhub.online`), guaranteed AAC audio, 0ms startup.
   - **Tier 3:** Verified mirrors & direct CDNs (`zunder`, `zunderflix`).
   - **Tier 2:** Third-party web scrapers & adaptive HLS (`hollymovies`, `embedplayer2.xyz`), AAC audio.
   - **Tier 1:** Raw bot torrent streams (`squareweb.app`, `fenixbot`, `koyeb.app`, or any `/stream/` endpoint), kept as fallback contingency.
2. **Synchronized Stack:**
   - Modified `assets/js/player/clientProviders.js`
   - Modified `functions/api/providers.js`
   - Modified `tools/local_providers.py`
3. **Automated Validation:**
   - Full test suite passed (Imports, SRI, CSP, CORS, XSS).
   - Version stamped to `20261028_2242`.

---

## 4. Verification
- *Rick and Morty* S08E04 now selects Tier 4 `fenixhub.online` with native AAC audio as primary.
- Full compatibility maintained across existing series (*Lupin*, *Breaking Bad*) and movies (*Deadpool & Wolverine*).

