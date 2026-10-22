# MGEB Stream Extractor Specification

- **Website / Host**: `mgeb.top`, `mgeb.space`, `peliculaplay.com`, `playspelis.com`
- **Role**: Primary stream provider (Player Principal) for movies and series in Tvzinha Online.
- **Media Types**: Movies & TV Series.
- **Delivery**: Direct HLS (.m3u8) without proxy (saving Cloudflare worker limits).

## Architecture & Integration Details

1. **Routing Strategy**:
   - For movies, queries via IMDb ID (`/embed/tt...`) to prevent collisions with series sharing identical numeric TMDB IDs.
   - For TV series, queries via TMDB ID (`/embed/serie/{tmdb_id}/{season}/{episode}`).
2. **Merged Seasons Normalization**:
   - Uses TMDB episode groups (type 6 "Seasons") to map shows merged into a single season by TMDB (e.g. Jujutsu Kaisen, Re:Zero) into the separate seasons expected by MGEB.
3. **Outlier Filtering & Quality Ranking**:
   - Measures segment durations (`EXTINF` sum / MP4 `mvhd` box) in the probe phase.
   - Sources whose duration deviates significantly from the median duration of the group are demoted to the bottom to avoid playback mismatches (e.g. DBZ T1E1 or Bleach Thousand-Year Blood War).
4. **Direct Playback**:
   - MGEB streams serve with `Access-Control-Allow-Origin: *` and require no custom `Referer`. They play directly in the browser via Hls.js/Artplayer.

## Test Harness
- Primary test suite: `tools/test_mgeb_rules.py` (21 unit cases verifying duration checks, episode mappings, and early exit rules).
