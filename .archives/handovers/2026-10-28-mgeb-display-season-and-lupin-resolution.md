# Handover: 2026-10-28 - MGEB Display Season Preservation & Multi-Part Resolution

## 1. Problem Summary
1. **Lupin T2:E1 on MGEB Failed with "Sem Resposta":**
   When `ab88866` introduced `reqSeason = context.tmdbSeason || seasonNumber`, Tvzinha queried MGEB for `season: 1, episode: 6` (collapsed TMDB season) instead of `season: 2, episode: 1` (split part). On MGEB, `1/6` is a ghost endpoint with only 1 dead Streamtape link locked to Cloudflare's IP (returning HTML 200 anti-bot pages). In contrast, `2/1` on MGEB has 4 active streams (Direct MP4 1080p and HLS).
2. **Lupin Episode Discrepancy & Video Lengths:**
   The user noticed our player played a 43:00 video for T2:E1 (Capítulo 6) and 44:01 for T2:E2 (Capítulo 7), while another streaming site showed a 48:58 video featuring the "Black Pearl" for S1E6. Investigation confirmed that the external site had mislabeled Part 3 Episode 1 (the Black Pearl, 48:58) as S1E6. According to official Netflix and TMDB records, Chapter 6 is exactly 43 minutes and Chapter 7 is 44 minutes. Our player was serving the real official episode all along.
3. **FenixFlix Cold-Start Delay:**
   FenixFlix stream 60654 is proxied through Koyeb container instances (`koyeb.app`), which spin down when idle and take 10-15s to wake up on cold requests.
4. **Shingeki no Kyojin T4:E1 (Final Season Part 1):**
   MAL fuzzy search matched `48583` ("The Final Season Part 2") instead of `40028` ("The Final Season") when querying for "Final Season Part 1", because `40028` does not have "Part 1" in its name.

## 2. Changes Made
- **`assets/js/modules/series.js`:**
  - Preserved `seasonNumber` and `episodeNumber` as native parameters sent to MGEB in `buildNativeResolveRequest`, ensuring MGEB receives the split part (`season: 2, episode: 1` for Lupin T2:E1) where healthy MP4 and HLS sources reside.
  - Attached `tmdb_season` and `tmdb_episode` alongside `display_season` and `display_episode` so external providers can still consume canonical TMDB parameters.
- **`functions/api/resolve.js` & `tools/local_server.py`:**
  - `hasSources` updated to discard ghost Streamtape links (`streamtape`, `tapecontent`) if no playable CDN or HLS streams are present.
  - Added fallback to `display_season` / `display_episode` and `mapMergedEpisode` when MGEB returns 0 playable sources.
  - Added Part mismatch scoring rule in MAL search: penalizes candidate entries whose part number conflicts with the requested season part (e.g., candidate Part 2 when requesting Part 1).
- **Version Bump:**
  - Bumped to `20261028_1551`.

## 3. Verification
- Live staging tests:
  - `Lupin T2:E1 MGEB`: Returns 200 with Opção 2 Direct MP4 (`fontedecanais-live`).
  - `Shingeki S4:E1 MGEB`: Returns 200 with Opção 2 Direct MP4.
  - `Shingeki S4:E1 Anime Nativo`: Returns 200 with 1080p HLS (ZokoAnime).
- Automated suites:
  - `tools/check_js.py`: 0 errors.
  - `tools/bump_version.py --check`: Clean single version stamp.
  - `tools/test_security_headers.py`: Passed.
  - `tools/test_resolve_cors.py`: Passed.
  - `tools/test_xss_protection.mjs`: 24 passed, 0 failed.
