# Hotfix Summary: Global Channel Direct Stream Restoration

## Delivered Changes
1. **Global Catalog Stream Restoration (P0):**
   - Replaced dead `s23-cloudfront-net.lat` URLs ("MEGATV - PLANO VENCIDO") across all 66 channels (62 unique slugs) with active, verified HLS streams on `s25-cloudfront-net.lat`.
   - Updated `data/canais.json` and mirrored `assets/js/core/fallbackChannels.js` for 100% offline and fallback parity.
   - Configured Servidor 1 (Principal) on `5eae58763dcbe2a0584afac0ef91415a` and Servidor 2 (Backup) on `52d080a3e172c33fd6886a37e7`.
   - Pruned dead contingency links (`nossoplayeronlinehd.ink`, `dlive.sx`, `localhost70.xyz`) across all channels.
   - Updated EmbedTV fallback domains to `https://w7.embedtv.cc/{slug}`.

2. **Automated Batch Extractor Tooling (`tools/extract_channel_stream.py`):**
   - Implemented `--all` mode to scan the catalog and extract live manifests for all slugs.
   - Tested 62/62 slugs with 100% resolution success rate.

3. **Cache Busting & Testing Parity:**
   - Version stamped to `20261101_1742` across 33 files via `bump_version.py`.
   - All tests green: `check_js.py`, `bump_version.py --check`, `test_security_headers.py`, `test_resolve_cors.py`.

## Verification Matrix
- `python tools/check_js.py`: Passed (0 missing imports).
- `python tools/bump_version.py --check`: Passed (single version stamp `20261101_1742`).
- `python tools/test_security_headers.py`: Passed (0 failures).
- `python tools/test_resolve_cors.py`: Passed (0 failures).
