# Rive Stream Extractor Specification

- **Website / App**: `https://www.rivestream.app`, `https://watch.rivestream.app`, `https://corsflix.net`
- **Backend API**: `https://backend.rivestream.app/api/backendfetch`
- **Supported Media**: Movies (`movieVideoProvider`) and TV Series (`tvVideoProvider`).
- **Index Key**: TMDB ID (`id`).

## Architecture & Reverse-Engineering Findings

### 1. Provider Services
Rive aggregates streams across 15 internal provider engines:
`apogee`, `vanguard`, `mirage`, `velocity`, `ignite`, `tampa`, `meridian`, `savannah`, `prometheus`, `quasar`, `solstice`, `primevids`, `citadel`, `apollo`, `asiacloud`.

A dynamic list of available services can be retrieved with:
```http
GET https://backend.rivestream.app/api/backendfetch?requestID=VideoProviderServices&secretKey=rive
```

### 2. Secret Key Generation
All provider requests require a cryptographic `secretKey` parameter derived from the TMDB ID:
1. Lookup table `c` with 70 pre-seeded base tokens.
2. Injects salt `t = c[id % c.length]` into the middle of the string ID.
3. **Pass 1 Hash**: Bitwise accumulator with variable rotation and 16-bit multiplier mix (`* 49842`, `* 40503`).
4. **Pass 2 Hash**: Murmur-style bit mixer with prime `3735928559`, rotation, and final multiplier mix (`* 10196`).
5. Hex output is Base64 encoded to form `secretKey`.

### 3. Movie Endpoint
```http
GET https://backend.rivestream.app/api/backendfetch?requestID=movieVideoProvider&id={tmdbId}&service={service}&secretKey={key}&proxyMode=noProxy
Headers:
  Origin: https://watch.rivestream.app
  Referer: https://watch.rivestream.app/
  User-Agent: Mozilla/5.0 ...
```

### 4. TV Series Endpoint
```http
GET https://backend.rivestream.app/api/backendfetch?requestID=tvVideoProvider&id={tmdbId}&season={season}&episode={episode}&service={service}&secretKey={key}&proxyMode=noProxy
Headers:
  Origin: https://watch.rivestream.app
  Referer: https://watch.rivestream.app/
```

### 5. Media Playback & Proxies
- Stream quality: Often delivers **4K HDR** and **1080p** master playlists.
- Stream URL: Proxied via `proxy.valhallastream.com/m3u8?url=...` with upstream origin headers encoded.
- CORS: `Access-Control-Allow-Origin: *`.
- Referer: Requires `Referer: https://watch.rivestream.app/`.
- Delivery: Plays smoothly via `/api/stream` using our signed stream proxy.

## Standalone Usage

```bash
node tools/extractors/rive/extract.mjs 533535 movie
node tools/extractors/rive/extract.mjs 1396 tv 1 1
```
