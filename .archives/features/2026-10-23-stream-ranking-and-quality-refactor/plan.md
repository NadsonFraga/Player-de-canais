# Stream Ranking & Quality System Refactoring

> **Status:** in planning. Branch `feat/quality-and-ranking-refactor` or directly on `staging`.

## Why

1. **Rive Instability**: The Rive aggregator includes unpredictable third-party engines (`primevids` on `fastcloud.live` and `mirage`) that serve dummy 2m46s troll clips (`bigtits.m3u8`) or YouTube teasers when a title is unreleased or unindexed. The user requested complete removal of Rive across the entire codebase.
2. **Quality Indicator Bug**: In `engine.js`, `qualityTooltip(session)` reads `session.lockedQuality` instead of the actively playing quality (`activeQuality(session)`). When a user has a 2160p preference, the player settings gear menu falsely displays "Qualidade 2160p" even when the playing source is only 480p or 720p.
3. **Backend vs Frontend HLS Level Mismatch**: In `probeHls`, when the master playlist declares a lower resolution (e.g. 854x480) but the first TS segment measures higher (e.g. 1280x538), the backend adds 720p to the API response. However, the browser's Hls.js client only parses the raw playlist text (which only has 480p), creating a severe UI mismatch.
4. **Flawed Ranking & CAM Leaks in MGEB**:
   - The current ranking algorithm blindly favors `hls-multi` over `mp4` via `KIND_RANK`, even if the HLS stream is low-bitrate 480p and the MP4 is a pristine 720p/1080p WEB-DL.
   - Low-quality cinema recordings (CAM/TS) hosted on secondary CDNs leak into the primary slot because the ranking algorithm only looks at pixel dimensions without validating bitrate thresholds or audio/video fidelity.

---

## Phase 1: Complete Rive Removal

1. **Archive Extractor**:
   - Move `tools/extractors/rive/` to `.archives/old/extractors/rive/`.
2. **Remove Client-Side Engine**:
   - In `assets/js/player/clientProviders.js`: remove `resolveRiveClient`, `generateRiveSecretKey`, `RIVE_SERVICES`, and remove `'rive'` from `CLIENT_PROVIDERS` and `resolveClientProvider`.
3. **Remove Server Resolvers & Routes**:
   - In `functions/api/resolve.js`: remove Rive route block and imports.
   - In `functions/api/providers.js`: remove `resolveRive` function.
   - In `tools/local_server.py`: remove Route: Rive.
   - In `tools/local_providers.py`: remove `fetch_rive` and token tables.
4. **Remove UI References & Constants**:
   - In `assets/js/core/constants.js`: remove `native_rive` from `MOVIE_SERVERS`.
   - In `assets/js/modules/series.js`: remove `native_rive` from `SERIES_SERVER_OPTIONS`.
   - In `tools/extractors/README.md`: remove Rive from active extractors table.
5. **Verify Clean Removal**:
   - Grep search to ensure zero remnants of `rive` in active code.

---

## Phase 2: Quality System Refactoring (Frontend & Backend)

### Industry Benchmark Analysis
* **YouTube / Netflix**: Uses ABR but decouples user preference from the active badge. The gear icon tooltip ALWAYS displays the resolution currently rendering on screen (e.g. "1080p HD"). If the user selects a higher resolution not supported by the video, the player automatically clamps to the media's maximum ceiling and displays that ceiling.
* **Stremio / Video.js / Artplayer**: The quality menu options must 1:1 match the actual tracks available in the media element or Hls.js instance. Backend probing must never promise qualities that Hls.js cannot switch to.

### Technical Redesign
1. **Frontend Tooltip & Indicators Fix (`engine.js`)**:
   - Fix `qualityTooltip(session)` to strictly return `qualityText(activeQuality(session))` or `autoLabel(session)`.
   - Clamp `session.lockedQuality`: if user preferred 2160p but video only has 1080p, the player selects 1080p and displays 1080p, without pretending 2160p exists.
   - Update `updateQualityIndicators()` to ensure the HD badge (`>= 720p`) reflects the true rendering resolution.
2. **Backend/Frontend Playlist Synchronization (`probeHls` & `resolve.js` / `local_server.py`)**:
   - Do NOT inject phantom quality levels into `qualities` that are absent from the playlist variant definitions.
   - If an HLS master playlist declares variants `[480, 360, 240]`, the backend reports `qualities: [480, 360, 240]`. The true frame size measured on the first segment can override the label of the top variant, but must not introduce unmatched level indices.

---

## Phase 3: Source Filtering & Ranking Overhaul (Anti-CAM & Bitrate-Aware Priority)

### Industry Benchmark Analysis
* **Stremio / Torrentio / Kodi**: Aggregators penalize CAM / TeleSync / Screener releases by inspecting filename tags, container metadata, and bitrate. A clean 720p/1080p WEB-DL with clean audio is always prioritized over a low-bitrate multi-stream or CAM release.

### Technical Redesign
1. **Bitrate-Aware Quality Scoring in `rankSourcesByQuality`**:
   - Invert the blind `KIND_RANK` priority: a high-quality MP4 (`fontedecanais` 720p/1080p, bitrate >= 2.5 Mbps) must rank ABOVE a low-bitrate `hls-multi` (e.g. 480p at 1 Mbps).
   - Only favor `hls-multi` when the top quality of the HLS stream is `>=` the quality of the MP4 stream.
2. **Anti-CAM & Low-Fidelity Filtering**:
   - Add explicit pattern detection for CAM signatures in stream URLs and titles: `\b(cam|ts|telesync|hdcam|cinema|gravado)\b`.
   - Add bitrate threshold check: if an HLS stream's top variant has bandwidth < 1,200,000 bps (1.2 Mbps) while an alternative source has bandwidth >= 2.5 Mbps, demote the low-bitrate stream.
3. **Failover & Timeout Resilience**:
   - Ensure unreachable or slow hosts (> 2.5s probe timeout) do not stall the resolve response.
   - Maintain seamless failover to backup sources on playback error.

---

## Phase 4: Verification, Automated & Manual Tests, Staging Deploy

1. Test with multiple real titles:
   - Movies: *Toy Story 4* (TMDB 301528), *Deadpool & Wolverine* (TMDB 533535), *Fight Club* (TMDB 550).
   - Series: *Breaking Bad* (TMDB 1396), *Arcane* (TMDB 94605).
   - Anime: *Jujutsu Kaisen*, *Demon Slayer*.
2. Run automated test suites:
   - `python tools/test_mgeb_rules.py`
   - `python tools/bump_version.py --check`
   - `node --check` syntax validation on all modified JS files.
3. Deploy to `staging` branch and verify in Chrome and Firefox.
