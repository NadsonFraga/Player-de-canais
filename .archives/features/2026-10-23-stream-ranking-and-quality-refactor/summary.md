# Stream Ranking & Quality System Refactoring - Summary

> **Status:** Completed. Deployed to `staging` (version `20261023_1931`).

---

## 1. Context & Motivation

1. **PT-BR Audio Sovereignty**:
   - Multiple aggregators returned multi-audio HLS streams declaring tracks (`hi`, `ta`, `te`, `en`, `es`) without Brazilian Portuguese. Serving these on dubbed requests caused language mismatches.
   - Requirement: Discard sources **only when it is 100% certain** they lack Portuguese (i.e. explicit `#EXT-X-MEDIA:TYPE=AUDIO` tracks are declared and none is PT-BR). Undeclared single-track streams (standard dubbed MP4s) are preserved.
   - When multi-audio streams contain PT-BR, automatically select the PT-BR audio track upon manifest parsing.
   - Failover on audio mismatch strictly cycles within internal sources of the current player (`session.sources`: Fonte 1 -> Fonte 2 -> etc.); never jumps between external drawer players.

2. **Adaptive Bitrate vs Single 1080p (Buffering Prevention)**:
   - Single-bitrate 1080p MP4s or fixed HLS streams frequently buffer on congested third-party CDNs. Multi-bitrate HLS streams provide smooth adaptive playback (ABR).
   - Added user setting preference in **Configurações -> Player ("Modo de Reprodução")**:
     - `Equilibrado / Fluidez` (`'balanced'`, default): Favors multi-bitrate ABR HLS (>= 720p) over brittle single-bitrate 1080p MP4s.
     - `Forçar Resolução Máxima` (`'highest'`): Strictly sorts by raw resolution first (`1080p > 720p`), letting users bypass safety filtering if desired.

3. **Unified Quality Menu with Cross-Source Switching & 4-Second Rollback**:
   - Only resolutions actually present across verified, alive sources appear in the player quality menu (no phantom resolutions).
   - If the active stream already has that resolution: switch `hls.currentLevel` in 0ms (no player remount).
   - If another valid internal source has that resolution: switch source while preserving exact playback time (`currentPlaybackTime` passed into `startTime`).
   - 4-second safety rollback timer: if the new source fails or stalls, automatically restore the previous source at the exact timestamp with toast feedback (`A qualidade ... não respondeu. Retornando para ...`).

4. **Title Actions ("Do início" & Cinema Notice)**:
   - Verified and ensured operation of `btn-title-restart` ("Do início") alongside "Continuar de..." on title pages.
   - Verified `title-quality-notice` for cinema releases within 75 days.

---

## 2. Key Changes Made

- **Backend Resolvers (`functions/api/resolve.js` & `tools/local_server.py`)**:
  - Implemented `isPortugueseAudioTag` and `checkHlsAudioTracks` for `#EXT-X-MEDIA:TYPE=AUDIO` parsing.
  - Implemented `isHdAbr` / `is_hd_abr` helper (detects HLS multi-bitrate with quality >= 720p).
  - Added `quality_mode` URL parameter parsing (`balanced` vs `highest`).
  - Updated `rankSourcesByQuality` sorting:
    - `alive` > `!audio_mismatch` > `has_pt_audio` > `!duration_mismatch` > `!isCamSource` > `quality_mode` order > `!isLowTrustSource` > `KIND_RANK` > `tieBreaker`.
    - Preserved pre-probed sources (`probed: true`) without redundant network requests.
- **Frontend Core & Settings (`assets/js/core/playerPrefs.js`, `assets/js/modules/settingsPage.js`)**:
  - Added `quality_mode: 'balanced'` default to `PLAYER_PREF_DEFAULTS`.
  - Added segmented toggle in Player settings ("Equilibrado" vs "Resolução Máxima").
- **Streaming Engine (`assets/js/player/engine.js`)**:
  - Added `autoSelectPortugueseAudio` hooked to `MANIFEST_PARSED` and `AUDIO_TRACKS_UPDATED`.
  - Updated `resolveDirectStream` to pass `quality_mode` from preferences.
  - Updated `buildQualityEntries` to aggregate verified real resolutions across alive sources (intra-stream levels first).
  - Updated `selectNativeQuality`: 0ms HLS level switch for intra-stream qualities, cross-source switch with 4s rollback timer for other sources.
  - Added rollback handling in `failoverNativeSource` and cleanup in `markStreamSuccess` and `atomicPlayerReset`.
- **Test Suite (`tools/test_mgeb_rules.py`)**:
  - Added unit test cases for multi-audio with/without PT-BR, single embedded audio, and `quality_mode` ("balanced" vs "highest").
  - 37/37 checks passed (100% parity between Python and Node).

---

## 3. Verification & Deployment

- **Cache Busting**: Bumped version to `20261023_1931` across all 33 files via `python tools/bump_version.py`.
- **Local Parity**: `python tools/test_mgeb_rules.py` passed 37/37 checks.
- **Browser Suite**: `tools/player_ui_check.mjs` passed 43/46 checks in headless Chromium with zero uncaught console errors.
- **Git & Deployment**:
  - Committed to `staging`: `feat(player): overhaul stream ranking, quality mode preference and cross-source rollback`.
  - Pushed to `origin staging`.
  - Verified live on `https://staging.tvzinhaonline.pages.dev`: version `20261023_1931` is active, API `/api/resolve` is responsive and healthy.
