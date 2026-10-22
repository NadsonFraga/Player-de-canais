# Stream Extractors Suite & New Provider Extractions

> **Status:** in planning. Branch `feat/stream-extractors` branched from `staging`.

## Why

1. `tools/` currently contains over 50 unorganized scripts mixing browser UI tests, accounts D1 tooling, deployment checks, and extraction tests (`test_mgeb_rules.py`, `test_anime_lookup.py`, `test_anime_episode_rule.py`).
2. Stream extraction reverse engineering (endpoints, tokens, multi-source resolution, fallbacks) needs an isolated, modular space:
   - Dedicated folder per extractor under `tools/extractors/`.
   - Clear specifications, documentation, and standalone test harness for each provider.
   - Decoupled testing before wiring clean streams into `functions/api/resolve.js` and `tools/local_server.py`.
3. The user has access/authorization to new stream providers and wants them analyzed, reverse-engineered, and added to the suite.

## Architecture & Directory Layout

Create `tools/extractors/` (blocked by `functions/_middleware.js` along with all `tools/*` so it is never exposed publicly):

```text
tools/extractors/
├── README.md                          # Master index: available extractors, standard contract, resolution flow
├── mgeb/
│   ├── README.md                      # Architecture, TMDB vs IMDb IDs, merged season mappings, durations
│   ├── probe.py                       # Standalone live probe / extractor test tool
│   └── test_rules.py                  # Extractor rule test suite (migrated / linked from tools/test_mgeb_rules.py)
├── anime_native/
│   ├── README.md                      # MAL matching, Jikan fallback, absolute vs relative episode logic
│   ├── test_lookup.py                 # MAL resolution suite (migrated / linked from tools/test_anime_lookup.py)
│   └── test_episode_rule.py           # Absolute episode rule suite (migrated / linked from test_anime_episode_rule.py)
└── <new_provider>/                    # Dedicated subfolder for each incoming authorized provider
    ├── README.md                      # Reverse-engineering documentation: payloads, headers, signature/tokens
    ├── extract.py                     # Standalone CLI extractor: input (title/ID/URL) -> output clean stream URLs
    └── test_rules.py                  # Offline / mocked test suite for stability verification
```

## Phases

### Phase 1: Structure & Migration of Existing Extractors
- Create `tools/extractors/README.md`.
- Create `tools/extractors/mgeb/` with documentation and link/move test harness without breaking existing CI/test runners.
- Create `tools/extractors/anime_native/` with documentation and link/move test harness.
- Verify parity: run `python tools/test_mgeb_rules.py`, `python tools/test_anime_lookup.py`, `python tools/test_anime_episode_rule.py`.

### Phase 2: Ingestion & Deep Analysis of New Providers
- Receive domains, URLs, sample embeds, and authorization details provided by the user.
- For each new provider:
  1. Inspect network activity, payload encryption, auth tokens, iframe signatures, CORS restrictions, and direct stream URLs (HLS/MP4).
  2. Document endpoints, parameters, and quirks in `tools/extractors/<provider>/README.md`.
  3. Create standalone CLI extractor `extract.mjs` to test and validate resolution across sample titles.
  4. Measure TTFF (Time-To-First-Frame), bitrate, stability, and whether Cloudflare stream proxy (`/api/stream`) is required or if direct playback is possible.
- **Completed Extractors**:
  - `tools/extractors/movy/` (Movy / Wecollege API with `mvm1` PRNG cipher).
  - `tools/extractors/rive/` (Rive / ValhallaStream with double-hash `secretKey`).
  - `tools/extractors/cinecat/` (Cinecat / `cdn.hls.lol` with direct REST endpoints).
  - `tools/extractors/fenixflix/` (FenixFlix / Stremio REST API with native **PT-BR Dublado** 4K/1080p multi-engine aggregation - primary contingency for MGEB).


### Phase 3: Hybrid Runtime Resolvers (Client-Side & Server Stream Signing)
- **Root Cause Discovered on Staging**: Upstream providers (`fenixhub.online`, `cdn.hls.lol`, `backend.rivestream.app`, `api.wecollege.net`) run behind Cloudflare. Cloudflare Pages Functions inject `CF-Worker: staging.tvzinhaonline.pages.dev` headers and egress from datacenter IPs, causing upstreams to block with 403 or return empty streams (`streams: []`).
- **Solution**: All 4 upstream APIs have `Access-Control-Allow-Origin: *`. Moving extraction logic to the client browser (`assets/js/player/clientProviders.js`) eliminates Cloudflare-to-Cloudflare blocks, executes with 0ms server overhead, and leverages the user's residential IP.
- Add `/api/resolve?action=sign` and `/api/resolve?action=sign_batch` to `functions/api/resolve.js` and mirror identically in `tools/local_server.py` to sign proxy URLs for streams needing custom `Referer` headers (`embedplayer2.xyz`, `totallyacdn.org`, `valhallastream.com`, `zenoak.top`).
- Create `assets/js/player/clientProviders.js` implementing client-side extraction for FenixFlix, Cinecat, Rive, and Movy.
- Wire `clientProviders.js` into `resolveDirectStream` in `assets/js/player/engine.js`.
- Add unit/regression tests for signing and client extraction in `tools/`.

### Phase 4: Staging Deploy & Validation
- Run full test suite: `python tools/check_js.py`, `node --check`, security headers, resolve tests.
- Bump version stamp via `python tools/bump_version.py`.
- Push to `staging` branch.
- Verify live playback on `https://staging.tvzinhaonline.pages.dev` across test titles (*Homem-Aranha: Um Novo Dia*, *Clube da Luta*, *Breaking Bad*, etc.) for each provider.

