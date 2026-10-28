# FenixFlix Stream Extractor Specification

- **Website / Service**: `https://fenixflix.fenixhub.online`
- **Role**: Native PT-BR Dubbed direct stream contingency provider for Tvzinha Online (backup to MGEB).
- **Media Types**: Movies (`movie`), TV Series (`series`), and Dubbed Animes (`anime`).
- **Index Support**: Both TMDB IDs (`tmdb:{id}`) and IMDb IDs (`tt{id}`).
- **Stream Format**: Direct HTTP MP4 (`video/mp4`) and HLS (`.m3u8` master playlists).
- **Target Audio**: Primary focus on Brazilian Portuguese (**Dublado PT-BR**), with secondary Legendado tracks.

---

## Architecture & Reverse-Engineering Findings

### 1. Direct REST Protocol
FenixFlix follows the open Stremio Addon Protocol specification. It does not require captchas, Cloudflare Turnstile challenges, or client-side secret generation:

- **Movie Resolution**:
  ```http
  GET https://fenixflix.fenixhub.online/stream/movie/{id}.json
  Headers:
    User-Agent: Mozilla/5.0 ...
    Accept: application/json
  ```
  *(Where `{id}` can be `tmdb:{tmdbId}` or canonical IMDb `tt{imdbId}`)*

- **TV Series Resolution**:
  ```http
  GET https://fenixflix.fenixhub.online/stream/series/{id}:{season}:{episode}.json
  Headers:
    User-Agent: Mozilla/5.0 ...
    Accept: application/json
  ```
  *(Where `{id}` can be `tmdb:{tmdbId}` or `tt{imdbId}`)*

### 2. Aggregated Engines & Providers
FenixFlix aggregates streams across multiple specialized Brazilian media engines:
- **Zeus**: Ultra-fast dedicated VOD server (`http://fenixflix.fenixhub.online/r/.../video.mp4`).
- **Hypex**: 4K HDR and 1080p high bitrate releases.
- **Badger**: High availability backup node.
- **Hollymovies**: Direct multi-resolution HLS (`https://embedplayer2.xyz/cdn/hls/.../master.m3u8`).
- **Figgs / Atlas / Malfoy**: Distributed VOD clusters.
- **FenixHub**: Koyeb-hosted direct stream bridges.

### 3. Response Schema
```json
{
  "streams": [
    {
      "name": "FenixFlix 4K",
      "title": "🐦‍🔥 Duna: Parte Dois\n🇧🇷 Dublado\n🌪️ Hypex",
      "url": "http://fenixflix.fenixhub.online/r/.../video.mp4",
      "behaviorHints": {
        "notWebReady": false,
        "bingeGroup": "fenixflix-hypex"
      }
    },
    {
      "name": "FenixFlix 1080p",
      "title": "🐦‍🔥 Duna: Parte Dois\n🇧🇷 Dublado\n⭐️ Hollymovies",
      "url": "https://embedplayer2.xyz/cdn/hls/.../master.m3u8?md5=...",
      "behaviorHints": {
        "notWebReady": false,
        "bingeGroup": "fenixflix-hollymovies-dublado"
      }
    }
  ]
}
```

### 4. Direct Playback & CORS Strategy
- **Direct Playback**: Streams on `embedplayer2.xyz` or `fenixflix.fenixhub.online` do not restrict domain access via referers.
- **CORS Handling**: To ensure seamless playback across all browsers and devices in Artplayer / Hls.js, streams that omit `Access-Control-Allow-Origin: *` can be piped transparently through Tvzinha's `/api/stream` endpoint with an HMAC signature.

---

## Standalone Usage

```bash
# Resolve a movie by TMDB ID (defaults to Dublado):
node tools/extractors/fenixflix/extract.mjs 533535 movie

# Resolve a movie by IMDb ID:
node tools/extractors/fenixflix/extract.mjs tt15239678 movie

# Resolve a TV series episode:
node tools/extractors/fenixflix/extract.mjs 76479 series 1 1

# Filter by audio type (dubbed | subbed | all):
node tools/extractors/fenixflix/extract.mjs 533535 movie 1 1 all
```
