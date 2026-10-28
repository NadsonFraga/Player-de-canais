# Stream Ranking & Quality System Refactoring

> **Status:** in execution. Branch `staging`.

## Why

1. **Audio Language Sovereignty (PT-BR Priority)**:
   - Some HLS multi-audio streams from aggregators (e.g. MGEB on *Homem-Aranha: Um Novo Dia*) declare multiple tracks (`hi`, `ta`, `te`, `en`, `es`) without Brazilian Portuguese. Serving these on a dubbed request ruins user experience.
   - Requirement: Discard sources **only when it is 100% certain** they lack Portuguese (i.e. explicit audio tracks are declared and none is PT-BR). Undeclared single-track streams (standard dubbed MP4s) are preserved.
   - When multi-audio streams contain PT-BR, auto-select the PT-BR track on mount.
   - Failover must strictly remain within internal player sources (Fonte 1 -> Fonte 2 -> Fonte 3); never jump between external drawer players automatically.
2. **Ranking Overhaul: ABR Multi-Bitrate vs Single 1080p (Buffering Prevention)**:
   - Single-bitrate 1080p MP4s or fixed HLS streams often suffer severe buffering and stalls on congested third-party CDNs.
   - Multi-bitrate HLS streams provide smooth playback via Adaptive Bitrate (ABR).
   - Add User Preference in Settings ("Modo de Qualidade"): `Equilibrado / Fluidez` (default: favors ABR multi-bitrate) vs `Forçar Resolução Máxima (1080p+)`.
3. **Smart Quality Menu with Cross-Source Switching & Rollback**:
   - Only resolutions actually present in verified sources appear in the player quality menu (no phantom resolutions).
   - If the currently playing source already has that resolution, change `hls.currentLevel` in 0ms (no remount).
   - If the user explicitly selects a higher resolution available on another source, switch source preserving `currentPlaybackTime`.
   - If the new source fails or takes > 4s to start, automatically roll back to the previous source with user feedback.

---

## Phase 1: Audio Language Filtering & Portuguese Auto-Selection

1. **Backend Manifest Audio Parsing (`functions/api/resolve.js` & `tools/local_server.py`)**:
   - In `probeHls` / `probe_hls`: parse `#EXT-X-MEDIA:TYPE=AUDIO`.
   - If tracks exist and none is Portuguese: flag `audio_mismatch: true`.
   - If tracks exist and Portuguese is present: flag `has_pt_audio: true`.
   - If no tracks declared: `audio_mismatch: false` (single embedded track).
   - In `rankSourcesByQuality`:
     - In dubbed mode (`lang !== "sub"`): filter out `audio_mismatch: true` when valid sources exist.
     - Rank `!audio_mismatch` above `audio_mismatch`.
     - Rank `has_pt_audio: true` above unverified embedded audio.
     - In `isTrustedTopSource`: require `!src.audio_mismatch`.
2. **Frontend Engine Audio Auto-Selection & Failover (`assets/js/player/engine.js`)**:
   - On `MANIFEST_PARSED` and `AUDIO_TRACKS_UPDATED`:
     - If multiple audio tracks exist and one is Portuguese, automatically switch `hls.audioTrack` to the PT index.
     - If multiple audio tracks exist and none is Portuguese during dubbed playback, failover within `session.sources` via `failoverNativeSource(session, 'no_pt_audio')`.
     - Respect manual user audio selection (`session.userSelectedAudio`).

---

## Phase 2: Quality Mode Preference in Settings (COMPLETED)

1. **Core & Settings (`assets/js/core/playerPrefs.js`, `assets/js/modules/settingsPage.js`)**:
   - Added `quality_mode`: `'balanced'` (default) vs `'highest'`.
   - Added UI segmented control in Configurações -> Player ("Modo de Reprodução": Equilibrado vs Resolução Máxima).
2. **Ranking by Quality Mode (`functions/api/resolve.js` & `tools/local_server.py`)**:
   - Passed `quality_mode` from client to resolver API (`/api/resolve?quality_mode=...`).
   - Implemented `isHdAbr` / `is_hd_abr` helper (HD HLS multi-bitrate streams >= 720p).
   - In `balanced` mode: ranks `hls-multi` (HD ABR) above fixed single-bitrate 1080p MP4s to prevent stalls/buffering.
   - In `highest` mode: ranks raw resolution first (`(b.quality || 0) - (a.quality || 0)`), letting user force 1080p regardless of single/multi bitrate.
   - Preserved pre-probed sources in `rankSourcesByQuality` to avoid redundant network probes.
3. **Automated Verification**:
   - Added test cases in `tools/test_mgeb_rules.py`.
   - 37/37 checks passed (100% parity between Python and Node.js).

---

## Phase 3: Seamless Cross-Source Quality Switching with Rollback (COMPLETED)

1. **Frontend Quality Entries (`assets/js/player/engine.js`)**:
   - `buildQualityEntries`: lists intra-stream levels of active source first (0ms level switch without remount).
   - Aggregates real, verified qualities from other alive, valid sources (skipping dead and audio-mismatched sources).
   - No phantom resolutions: only actual resolutions found across sources appear in the menu.
2. **Cross-Source Switching & 4-Second Safety Rollback**:
   - When switching to a resolution hosted by another internal source, preserves exact `currentPlaybackTime` into `startTime`.
   - Arm 4-second safety rollback timer (`session.qualityRollbackTimer`).
   - If target source plays successfully (`markStreamSuccess`), clears the timer and rollback state.
   - If target source errors (`video-error`, network, decode) or stalls (> 4s), automatically restores previous source at exact playback time with toast notification (`A qualidade ... não respondeu. Retornando para ...`).
   - Clean reset in `atomicPlayerReset` and `selectNativeQuality('auto')` to prevent memory leaks or ghost callbacks.
3. **Verification**:
   - Automated browser suite (`tools/player_ui_check.mjs`) passed all UI and playback checks in headless Chromium.
   - Parity suite (`tools/test_mgeb_rules.py`) 37/37 passed.

---

## Phase 4: Verification, Automated Tests, Version Bump & Deploy

1. Test with real titles (*Homem-Aranha*, *Toy Story 4*, *Deadpool & Wolverine*).
2. Validate parity: `python tools/test_mgeb_rules.py`.
3. Check versioning: `python tools/bump_version.py --check`.
4. Staging deploy and verification in Chrome and Firefox.
