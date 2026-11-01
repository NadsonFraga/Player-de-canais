# Hotfix Plan: Global Channel Direct Stream Restoration (Direct to Master)

## 1. Objective & Scope

### Objective
Restore direct high-definition HTML5 playback (native Artplayer + Hls.js) across **all 66 channels (62 unique slugs)** in TVzinha Online. Upstream providers migrated the cluster from `s23-cloudfront-net.lat` (expired third-party subscription loop "MEGATV PLANO VENCIDO") to `s25-cloudfront-net.lat`. 
Per user request, this hotfix branches directly from production (`master`), restores all channels, tests, merges, and deploys directly to production (`master`), bypassing `staging` to prevent prematurely deploying the large in-progress subtitle feature. After `master` is deployed, `master` will be merged back into `staging` to maintain parity without losing subtitle progress.

### In Scope
- Branch directly from `origin/master`: `hotfix/all-channels-stream-restoration`.
- Update `tools/extract_channel_stream.py` to support `--all` batch extraction across all categories.
- Update `data/canais.json` and `assets/js/core/fallbackChannels.js` for all channels (62 slugs tested with 100% success rate).
- Prune obsolete / dead contingency links (`nossoplayeronlinehd.ink`, `dlive.sx`, `localhost70.xyz`) across all channels.
- Stamped version bump (`python tools/bump_version.py`) and verify import integrity (`check_js.py`).
- Merge `hotfix/all-channels-stream-restoration` into `master` with `--no-ff` and push to `origin/master` (live production).
- Back-merge `master` into `staging` and push to `origin/staging` to preserve subtitle developments and sync channels.

### Out of Scope
- Merging in-progress subtitle features from `staging` into `master` (explicitly kept in `staging`).
- Modifying player architecture (`assets/js/player/engine.js`).

---

## 2. Impacted Files

- `tools/extract_channel_stream.py`: Add batch `--all` mode.
- `data/canais.json`: Update direct stream URLs (Servidor 1 & 2) and clean contingencies across all 66 channels.
- `assets/js/core/fallbackChannels.js`: Keep in 100% synchronization with `data/canais.json`.
- `index.html` + 32 JS modules: Cache-busting version query string stamped via `bump_version.py`.
- `.archives/features/2026-11-01-all-channels-stream-restoration/`: Plan, test, and summary documentation.
- `docs/02_CURRENT_STATE/ACTIVE_CONTEXT.md`: Update living memory state.

---

## 3. Step-by-Step Strategy

### Step 1: Branch Creation from Master
- Switch to `master` and create hotfix branch: `git checkout -b hotfix/all-channels-stream-restoration origin/master`.

### Step 2: Implement Batch Extractor
- Enhance `tools/extract_channel_stream.py` with `--all` flag:
  - Iterates over all categories in `data/canais.json`.
  - Scrapes active stream manifests from `embedtv.cc` / `embedtv.lat`.
  - Configures Servidor 1 (`5eae58763dcbe2a0584afac0ef91415a`) and Servidor 2 (`52d080a3e172c33fd6886a37e7`) on `s25-cloudfront-net.lat`.
  - Cleans obsolete contingency entries.
  - Updates both `data/canais.json` and `assets/js/core/fallbackChannels.js`.

### Step 3: Execute Batch Update & Verification
- Execute `python tools/extract_channel_stream.py --all`.
- Stamp version with `python tools/bump_version.py`.
- Run automated verification matrix:
  - `python tools/check_js.py`
  - `python tools/bump_version.py --check`
  - `python tools/test_security_headers.py`
  - `python tools/test_resolve_cors.py`

### Step 4: Merge to Production (`master`)
- Checkout `master`.
- Merge hotfix branch: `git merge --no-ff hotfix/all-channels-stream-restoration`.
- Push to `origin master` (triggers Cloudflare Pages production deployment).

### Step 5: Back-Merge to `staging`
- Checkout `staging`.
- Merge `master` into `staging`: `git merge master`.
- Push to `origin staging` to ensure staging retains all fixed channels while keeping its ongoing subtitle work intact.

---

## 4. Testing & Edge Cases

- **100% Slug Resolution:** Verify all 62 unique slugs resolve to valid stream tokens.
- **Failover Redundancy:** Ensure both Primary (CDN 1) and Backup (CDN 2) are present on each channel.
- **Clean Production History:** Verify `master` history contains zero unreviewed subtitle commits.
- **Back-Merge Integrity:** Ensure merging `master` into `staging` produces zero git conflicts.

