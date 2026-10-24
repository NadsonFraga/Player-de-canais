# Handover 2026-10-24: MGEB Dubbed Audio Priority, Brazilian CDNs & Anime Player Recovery

Read `AGENTS.md` (or `CLAUDE.md` / `GEMINI.md`) for rules, then this file, then `.archives/backlog.md`.

## State

- Current branch: `staging` (https://staging.tvzinhaonline.pages.dev).
- Version stamp: `20261024_1234` (verified with `python tools/bump_version.py --check`).
- Delivered and pushed to `staging`:
  1. **MGEB Dubbed Audio Priority (`is_dubbed = true`):**
     - Issue: *Homem-Aranha: Sem Volta Para Casa* (`634649`) and other movies/series were serving unverified 1080p English streams (e.g. Streamtape) ahead of authentic 720p PT-BR streams (e.g. Fontedecanais).
     - Fix: Added `is_brazilian_cdn()` / `isBrazilianCdn()` detecting Brazilian IPTV/VOD CDNs (`fontedecanais`, `57lgoe65efxo71.com`, `77zzhf54vdll71.com`) in `tools/local_server.py` and `functions/api/resolve.js`.
     - Marked these streams with `has_pt_audio = true`.
     - In `rank_sources_by_quality` / `rankSourcesByQuality`, `has_pt_audio` sits before resolution in sort keys for dubbed mode (`is_dubbed = true`).
     - Added `77zzhf54vdll71.com` to direct MP4 detection (`isDirectMp4`), enabling native 206 byte-range playback and eliminating proxy overhead.
  2. **Exemption for Subtitled Titles & Animes (`is_dubbed = false`):**
     - Subtitled requests and Anime Nativo streams are strictly exempt from Portuguese audio priority (`is_dubbed ? ... : 0`), ensuring authentic original audio (Japanese for anime) is never deprioritized or filtered out.
  3. **Anime Player Session & Movy Cleanup:**
     - Issue: Clicking "Movy" previously caused `activeSeriesPlaying.userSelectedServer = true` to remain stuck in module state across show transitions. Switching to any anime (Jujutsu Kaisen, Demon Slayer, etc.) failed with CORS / WAF 403 errors and displayed "sem fontes".
     - Fix: In `assets/js/modules/series.js`, `startEpisodePlayback` now detects `showChanged` and clears `userSelectedServer = false`. `stopSeriesPlayer` resets session state. Anime titles default to `native_anime` automatically.
     - Removed obsolete `native_movy` from `assets/js/core/constants.js`, `assets/js/modules/series.js`, and `assets/js/player/clientProviders.js` (Movy API blocks external browser CORS and Cloudflare Worker IPs).
  4. **Strict Parity:**
     - Verified identical logic between `functions/api/resolve.js` and `tools/local_server.py`.
     - All 42 Python rules and 42 Node rules passed in `tools/test_mgeb_rules.py` with 0 parity discrepancies.
- Documentation:
  - Feature folder: `.archives/features/2026-10-23-mgeb-audio-priority/` (`plan.md`, `tests.md`, `summary.md`).
  - Index updated in `.archives/README.md`.

## Verification & Test Results

- Local 5-title matrix (`scratch/test_phase3_matrix.mjs`):
  1. *Homem-Aranha: Sem Volta Para Casa* (`634649`): Player Principal (MGEB) -> `readyState = 4`, Duration: `8889.9s` (PASSED, direct PT-BR MP4).
  2. *Jujutsu Kaisen* (`95479`): Anime Nativo (Legendado) -> `readyState = 4`, Duration: `1435.0s` (PASSED, HLS Japanese audio).
  3. *Demon Slayer* (`85937`): Anime Nativo (Legendado) -> `readyState = 4`, Duration: `1420.0s` (PASSED).
  4. *Solo Leveling* (`127532`): Anime Nativo (Legendado) -> `readyState = 4`, Duration: `1420.0s` (PASSED).
  5. *Breaking Bad* (`1396`): Player Principal (MGEB) -> `readyState = 4`, Duration: `3486.5s` (PASSED).
- Live Staging (`https://staging.tvzinhaonline.pages.dev`):
  - *Homem-Aranha* -> `readyState = 4` (PASSED, direct stream `https://www-fontedecanais-live.77zzhf54vdll71.com/...`).
  - *Jujutsu Kaisen* -> `readyState = 4` (PASSED, Japanese audio with subtitles via `zokoanime.video` proxy).

## What the Next Agent Should Know

1. **Architecture:** Static ESM SPA hosted on Cloudflare Pages. No build step, no bundler, Vanilla CSS, ArtPlayer 5.1.7. Edge functions in `functions/api/` (`resolve.js`, `stream.js`, `account/`, `sync.js`), strictly mirrored in `tools/local_server.py`.
2. **Version Bump:** Whenever modifying `assets/js` or `assets/css`, run `python tools/bump_version.py` before deploying (`--check` must show only ONE version across all files).
3. **Audio Priority Standard:** `has_pt_audio` must only be prioritized when `is_dubbed = true`. Subtitled / anime requests (`is_dubbed = false`) must never enforce PT-BR audio priority.
4. **Git Workflow:** Never commit, push, merge, or create branches unless explicitly asked by the user. Multi-machine sync requires `git fetch; git log origin/master` before starting work.
