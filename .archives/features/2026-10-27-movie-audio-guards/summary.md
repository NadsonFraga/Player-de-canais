# Feature Summary: Movie Audio Guards & Quality Ranking Integrity

**Slug:** `movie-audio-guards`  
**Date:** 2026-10-27  
**Branch:** `feat/movie-audio-guards`  
**Version:** `20261027_1010`  

---

## 1. Overview of Delivered Changes

### 1. HLS Video-Only Mute Stream Detection (Guard A) [P1]
- **Problem:** Streams from providers like `flyfile.app` (seen on *Spider-Man 3*, TMDB 559, and *Spider-Man 1*, TMDB 557) output master playlists where variants specify `CODECS="avc1.64001f"` with no audio codecs (`mp4a`, `ac-3`, `ec-3`, `opus`, `vorbis`) and no `#EXT-X-MEDIA:TYPE=AUDIO` track. The segments contain zero audio PIDs, causing silent playback in the browser.
- **Solution:**
  - In `functions/api/resolve.js` and `tools/local_server.py`:
    - Updated `checkHlsAudioTracks(lines)` / `check_hls_audio_tracks(lines)`:
      - Parses the variant `CODECS` attribute.
      - If `CODECS` is present on variants but contains only video codecs and no audio codec, and there are no external audio tracks, it marks `audioMismatch: true`, `hasPtAudio: false`, and `noAudio: true`.
    - Updated `probeHls` / `probe_hls` to return `noAudio`.
    - Updated `probeSource` / `probe_source` to mark mute streams as `alive = false`, preventing them from ever being selected or served to users.

### 2. Movie Short Duration & Dummy Sample Filter (Guard B) [P1]
- **Problem:** Dummy 10-second trailer clips or sample streams (such as the 10-second `flyfile.app` sample for *Spider-Man 3*) were treated as valid full movies because duration outlier filtering previously only ran for series (`mgebType === 'serie'`).
- **Solution:**
  - In `functions/api/resolve.js` and `tools/local_server.py`:
    - Added `markMovieDurationOutliers(sources)` / `mark_movie_duration_outliers(sources)`.
    - Defines `MIN_MOVIE_DURATION_S = 1200` (20 minutes).
    - If at least one valid full-length movie source (>= 20 minutes) exists, any source with duration < 20 minutes is marked as `duration_mismatch = true`.
    - In `rankSourcesByQuality()`, `markMovieDurationOutliers` is executed for movies (`!checkLengths`), ensuring short sample streams drop to the lowest priority below real full-length movie copies.

### 3. Dubbed Audio Priority Over Unverified HD (Guard C) [P1]
- **Problem:** In `rankSourcesByQuality()`, resolution (`isHd`) was prioritized ahead of `has_pt_audio`. When an unverified foreign HLS stream claimed `720p` (`isHd = true`), it beat authentic Brazilian Portuguese MP4 streams (e.g., PlayTv `www-fontedecanais...`) whose resolution had not been probed within the fast probe budget, leading to foreign or silent streams being selected as `Opção 1`.
- **Solution:**
  - In `functions/api/resolve.js` and `tools/local_server.py`:
    - Reordered the sort comparator in `rankSourcesByQuality()`:
      When `isDubbed` is active, `has_pt_audio` is compared **before** `isHd`.
    - Authentic Portuguese audio streams now always win priority over unverified or foreign streams when the user requests dubbed content.

---

## 2. Test Verification Matrix

| Test Suite / Script | Target / Scope | Result |
| :--- | :--- | :--- |
| `tools/check_js.py` | ES module import integrity across all JS files | PASS (0 errors) |
| `tools/bump_version.py --check` | Asset version cache-busting consistency (`20261027_1010`) | PASS |
| `tools/test_mgeb_rules.py` | Full rule parity (46 Python rules / 46 Node rules) including movie outliers & mute detection | PASS (100% Parity) |
| `tools/test_security_headers.py` | CSP, SRI, Permissions Policy, and frame headers | PASS (0 failures) |
| `tools/test_resolve_cors.py` | Origin verification, LAN checks, and dispatch parity | PASS (0 failures) |

---

## 3. Impacted Files

- `functions/api/resolve.js`
- `tools/local_server.py`
- `tools/test_mgeb_rules.py`
- All version-stamped assets via `tools/bump_version.py`
