# Feature Plan: SporTV 3 Direct Stream Restoration and Extraction

## 1. Objective & Scope

### Objective
Restore direct high-definition HTML5 playback (native Artplayer + Hls.js) for **SporTV 3** in TVzinha Online. The previous upstream CDN (`s23-cloudfront-net.lat`) expired due to expired third-party IPTV subscription tokens (yielding the "MEGATV - PLANO VENCIDO" loop). The stream has been extracted and validated on the newly deployed, active CDN (`s25-cloudfront-net.lat`), playing authentic 720p 60fps live sports.

### In Scope
- Update direct stream endpoints for **SporTV 3** (Servidor 1 Principal and Servidor 2 Backup) in `data/canais.json`.
- Keep `assets/js/core/fallbackChannels.js` in 100% synchronization with `data/canais.json`.
- Prune offline / unresolvable contingency links for SporTV 3 (`nossoplayeronlinehd.ink`, `dlive.sx`).
- Provide an automated extraction utility (`tools/extract_channel_stream.py`) to scrape and refresh upstream channel manifests on demand.
- Run version stamp (`python tools/bump_version.py`) and integrity checks (`check_js.py`, direct playback benchmark).

### Out of Scope
- Modifying other channels in this sprint (user explicitly requested: *"inicialmente, procure somente do sportv 3, para fazer a extração, preciso desse canal urgentemente"*).
- Modifying core player architecture (`assets/js/player/engine.js`).

---

## 2. Impacted Files

- `data/canais.json`: Update `SporTV 3` direct sources (Servidor 1 & 2) and prune dead contingencies.
- `assets/js/core/fallbackChannels.js`: Mirror `SporTV 3` updates to prevent desynchronization when offline or fetching fails.
- `tools/extract_channel_stream.py` (New): Automated tool to fetch and extract live stream manifests for specified channel slugs.
- `docs/02_CURRENT_STATE/ACTIVE_CONTEXT.md`: Reflect current active context and changes.

---

## 3. Step-by-Step Strategy

### Step 1: Branch Creation
- Create feature branch `feat/sportv3-direct-stream-restoration` branching from `staging`.

### Step 2: Implement Extraction Utility
- Create `tools/extract_channel_stream.py`:
  - Accepts `--slug <slug>` (defaults to `sportv3`) and optional `--update` flag.
  - Fetches the current live endpoint from the embed source.
  - Tests stream validity (verifies HTTP 200, `#EXTM3U`, and active chunk accessibility).

### Step 3: Update Datasets
- Update `data/canais.json` for `SporTV 3`:
  - `Servidor 1 (Principal)`: `https://5eae58763dcbe2a0584afac0ef91415a.s25-cloudfront-net.lat/stream/86ec9721d4780493cea0657f56229342/sportv3.txt`
  - `Servidor 2 (Backup)`: `https://52d080a3e172c33fd6886a37e7.s25-cloudfront-net.lat/stream/86ec9721d4780493cea0657f56229342/sportv3.txt`
  - Contingency: keep `Servidor 5 (EmbedTV)` and `Servidor 1 (MeuPlayer)`; remove dead domains.
- Update `assets/js/core/fallbackChannels.js` with identical data.

### Step 4: Verification and Cache-Busting
- Run `python tools/bump_version.py` to synchronize version query parameters across assets.
- Run `python tools/check_js.py` to ensure ES module imports integrity.
- Run automated headless Chrome check to verify Artplayer mounts and plays SporTV 3 cleanly (`readyState === 4`).

---

## 4. Testing & Edge Cases

- **Direct Stream Availability:** Verify both Servidor 1 and Servidor 2 return HTTP 200 with `#EXTM3U` and valid `#EXTINF` segment headers.
- **CORS Compliance:** Ensure segments (`.png` wrapped MPEG-TS chunks) respond with `Access-Control-Allow-Origin: *` to prevent cross-origin fetch rejections.
- **Failover Verification:** If Servidor 1 fails or is slow, verify Servidor 2 is called without crashing the player.
- **Visual Validation:** Ensure no "Plano Vencido" overlay appears; stream renders live sporting content cleanly.

