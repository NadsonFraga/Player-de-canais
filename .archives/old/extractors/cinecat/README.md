# Cinecat Stream Extractor Specification

- **Website / Frontend**: `https://cinecat.eu`
- **Architecture**: Fork of `movie-web` / `p-stream` (Vite SPA) backed by `cdn.hls.lol` and `api.zstream.mov`.
- **Underlying Stream CDN**: `https://cdn.hls.lol` and `https://totallyacdn.org`
- **Supported Media**: Movies (`movie`) and TV Series (`series`).
- **Index Key**: TMDB ID (`tmdbId`).

## Architecture & Reverse-Engineering Findings

### 1. Direct Content Resolution (`cdn.hls.lol`)
Unlike complex encrypted embeds, Cinecat's primary backend provides direct, high-speed resolution endpoints indexed by TMDB ID:

- **Movie Resolution**:
  ```http
  GET https://cdn.hls.lol/content/movie/{tmdbId}
  Headers:
    Origin: https://cinecat.eu
    Referer: https://cinecat.eu/
    User-Agent: Mozilla/5.0 ...
  ```

- **TV Series Resolution**:
  ```http
  GET https://cdn.hls.lol/content/series/{tmdbId}/{season}/{episode}
  Headers:
    Origin: https://cinecat.eu
    Referer: https://cinecat.eu/
  ```

Response format:
```json
{
  "found": true,
  "media_type": "movie",
  "tmdb_id": "533535",
  "title": "Deadpool & Wolverine",
  "url": "https://totallyacdn.org/cdn-m3u8?payload=...",
  "type": "hls"
}
```

### 2. Stream Delivery & Playback
- Master stream URL: `https://totallyacdn.org/cdn-m3u8?payload=...`
- Manifest: Standard HLS multi-bitrate playlist (1080p 3.2 Mbps, 720p, 480p).
- CORS: `Access-Control-Allow-Origin: *`.
- Upstream requirement: Requires `Referer: https://cinecat.eu/`.
- Routing: Proxied through `/api/stream` with signed token for injection of the upstream `Referer` header.

## Standalone Usage

```bash
node tools/extractors/cinecat/extract.mjs 533535 movie
node tools/extractors/cinecat/extract.mjs 1396 series 1 1
```
