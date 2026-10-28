# Feature Plan: Movie Audio Guards & Quality Ranking Integrity

**Slug:** `movie-audio-guards`  
**Date:** 2026-10-27  
**Status:** In Execution (Phase 2)  
**Branch:** `feat/movie-audio-guards` (branched from `staging`)  

---

## 1. Scope & Objectives

1. **HLS Audio Absence Detection (Guard A) [P1]:**
   - In `functions/api/resolve.js` and `tools/local_server.py`:
   - Inspect `#EXT-X-STREAM-INF` playlist variant tags.
   - When a master playlist variant explicitly provides `CODECS="..."` with only video codecs (e.g. `avc1`, `hvc1`, `vp9`) and completely omits audio codecs (`mp4a`, `ac-3`, `ec-3`, `opus`, `vorbis`), and has no `#EXT-X-MEDIA:TYPE=AUDIO` track:
     - Mark `audio_mismatch: true` and `has_pt_audio: false`.
     - When all variants in the stream lack audio codecs and audio tags, mark the source as mute (`alive = false` or `audio_mismatch = true`) to prevent silent dummy/test streams from being served.

2. **Movie Duration Threshold & Outlier Guard (Guard B) [P1]:**
   - In `functions/api/resolve.js` and `tools/local_server.py`:
   - Currently, `markDurationOutliers` only runs for series (`mgebType === 'serie'`).
   - For movies (`mgebType === 'movie'`), detect dummy/sample streams that have absurdly short durations (e.g., < 15 minutes / 900 seconds) when valid full-length movie sources exist (> 40 minutes / 2400 seconds).
   - Mark short sample streams as `duration_mismatch = true` so they drop to the lowest priority below real full-length movie copies.

3. **Dubbed Audio Priority over Unverified HD (Guard C) [P1]:**
   - In `functions/api/resolve.js` and `tools/local_server.py`:
   - In `rankSourcesByQuality()`, the sort comparator currently places `(Number(isHd(b)) - Number(isHd(a)))` BEFORE `has_pt_audio`.
   - When probing is fast or uncompleted on direct Brazilian MP4s (`has_pt_audio = true`, but resolution unmeasured in probe budget), an unverified foreign HLS claiming `720p` (`isHd = true`) erroneously beat the authentic Portuguese dubbed stream.
   - Reorder the comparator when `isDubbed` is active:
     `has_pt_audio` MUST be prioritized before `isHd`.
   - This guarantees that for dubbed titles, authentic Portuguese audio streams (PlayTv/Brazilian CDN) always claim `primary_source` (Opção 1) over foreign HLS streams with unknown or missing audio.

4. **Strict Parity Guarantee [P1]:**
   - Maintain 100% behavioral parity between Cloudflare edge function `functions/api/resolve.js` and Python dev server `tools/local_server.py`.
   - Run `python tools/test_mgeb_rules.py` to assert identical rule outputs.

---

## 2. Impacted Files

| File | Purpose |
| :--- | :--- |
| `functions/api/resolve.js` | Implement audio absence check, movie duration outlier guard, and dubbed audio priority ranking. |
| `tools/local_server.py` | Implement identical audio absence check, movie duration outlier guard, and dubbed audio priority ranking. |
| `tools/test_mgeb_rules.py` | Add unit tests verifying audio absence detection, movie short duration handling, and audio priority over unmeasured HD. |

---

## 3. Implementation Steps

1. **Step 1:** Update `checkHlsAudioTracks` / `probeHls` in `functions/api/resolve.js` to detect absence of audio codecs when `CODECS` is specified without audio tags.
2. **Step 2:** Update movie duration checking in `rankSourcesByQuality` in `functions/api/resolve.js`.
3. **Step 3:** Reorder sort comparator in `rankSourcesByQuality` in `functions/api/resolve.js` to prioritize `has_pt_audio` over `isHd` for dubbed streams.
4. **Step 4:** Mirror all logic changes precisely into `tools/local_server.py`.
5. **Step 5:** Add unit tests to `tools/test_mgeb_rules.py` and run full test suites.
6. **Step 6:** Run `python tools/bump_version.py` and import checks.
7. **Step 7:** Merge `feat/movie-audio-guards` into `staging`, push, verify on Cloudflare, and prepare manual test checklist for user.
