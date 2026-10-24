# Feature Summary: MGEB Dubbed Audio Priority & Anime Player Recovery

## Overview
1. **MGEB Dubbed Audio Priority:**
   - Fixed dubbed requests (`lang=dub`) serving unverified English 1080p streams over verified Portuguese 720p streams (e.g. *Homem-Aranha: Sem Volta Para Casa* TMDB `634649`).
   - Implemented `is_brazilian_cdn()` / `isBrazilianCdn()` covering Brazilian CDN domains (`fontedecanais`, `57lgoe65efxo71.com`, `77zzhf54vdll71.com`).
   - Flagged Brazilian CDN streams with `has_pt_audio = true`.
   - Updated `rank_sources_by_quality` / `rankSourcesByQuality`: for `is_dubbed=True`, `has_pt_audio` sits before resolution in sort keys; for `is_dubbed=False` (Anime Nativo and subtitled requests), `has_pt_audio` priority is strictly disabled so original audio / Japanese streams are not blocked or penalized.
   - Handled `77zzhf54vdll71.com` as direct MP4 (`isDirectMp4`), enabling native browser byte-range streaming.
   - Maintained strict parity between `tools/local_server.py` and `functions/api/resolve.js`.

2. **Anime Player Session & Movy Cleanup:**
   - Fixed `activeSeriesPlaying.userSelectedServer = true` stickiness when navigating between shows: `startEpisodePlayback` now detects `showChanged` and resets stickiness, and `stopSeriesPlayer` resets session state.
   - Anime titles automatically default to `native_anime` unless the user explicitly chose another server for that specific title.
   - Removed obsolete `native_movy` from movie and series server options, and removed `'movy'` from `CLIENT_PROVIDERS` (Movy API has CORS restriction on non-movy origins and blocks Cloudflare worker egress with 403).

## Verification
- 42/42 Python rules passed, 42/42 Node rules passed.
- 5/5 title browser matrix passed with `readyState = 4`.
- Version stamped to `20261024_1234`.
