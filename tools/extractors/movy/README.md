# Movy Stream Extractor Specification

- **Website Frontend**: `https://www.movy.sx`
- **Underlying API**: `https://api.wecollege.net`
- **Supported Media**: Movies (`mediaType: "movie"`) and TV Series (`mediaType: "tv"`).
- **Index Key**: TMDB ID (`tmdbId`).

## Architecture & Reverse-Engineering Findings

### 1. Seed Endpoint
Before fetching stream sources, an ephemeral seed token must be requested:
```http
GET https://api.wecollege.net/seed?mediaId={tmdbId}
Headers:
  Origin: https://www.movy.sx
  Referer: https://www.movy.sx/
  User-Agent: Mozilla/5.0 ...
```
Response:
```json
{
  "seed": "59753900.njKxVUss0-UdRAaEkkyt19",
  "ttlMs": 30000
}
```
*Note*: The seed expires in 30 seconds (`ttlMs: 30000`). If an expired seed is passed to `/sources`, the server returns `401 Unauthorized`.

### 2. Sources Endpoint
Sources are partitioned across 18 geographic CDN routes:
`miami`, `boise`, `vegas`, `reno`, `oakland`, `seattle`, `phoenix`, `atlanta`, `portland`, `austin`, `dallas`, `tampa`, `orlando`, `munich`, `berlin`, `paris`, `delhi`, `cancun`.

Query Parameters:
- `title`: URL-encoded title (e.g. `Deadpool%20%26%20Wolverine`)
- `mediaType`: `"movie"` or `"tv"`
- `year`: 4-digit release year (e.g. `2024`)
- `seasonId`: Season number (`"1"` for movie, or integer string for series)
- `episodeId`: Episode number (`"1"` for movie, or integer string for series)
- `tmdbId`: Canonical TMDB ID integer
- `imdbId`: Canonical IMDb ID string (e.g. `tt6263850`, optional but recommended)
- `enc`: `"2"` (enforces response encryption)
- `seed`: The fresh seed returned by `/seed`

Request:
```http
GET https://api.wecollege.net/{server}/sources?title={title}&mediaType={mediaType}&year={year}&seasonId={season}&episodeId={episode}&tmdbId={tmdbId}&imdbId={imdbId}&enc=2&seed={seed}
Headers:
  Origin: https://www.movy.sx
  Referer: https://www.movy.sx/
```

### 3. Payload Decryption (`mvm1` Cipher)
The server responds with `Content-Type: text/plain` containing a Base64URL-encoded ciphertext.
The decryption process uses a custom 32-bit PRNG keystream generator:
- **Constants**:
  ```javascript
  const d = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174
  ];
  const MAGIC = [109, 118, 109, 49]; // "mvm1"
  ```
- **PRNG Murmur3/SplitMix32 mix**:
  ```javascript
  function o(e) {
    e >>>= 0; e ^= e >>> 16;
    e = Math.imul(e, 0x85ebca6b) >>> 0;
    e ^= e >>> 13;
    e = Math.imul(e, 0xc2b2ae35) >>> 0;
    return (e ^= e >>> 16) >>> 0;
  }
  ```
- Keystream state initialized with a 32-bit FNV-1a hash of the seed combined with `mediaId ^ 0x9e3779b9`.
- The ciphertext is XORed with the keystream.
- The first 4 bytes must match the magic signature `mvm1`.
- The remaining bytes are UTF-8 decoded to JSON:
  ```json
  {
    "sources": [
      {
        "quality": "1080p",
        "url": "https://moon.zenoak.top/vd/.../index-s1080p-v1-a1.m3u8"
      }
    ],
    "subtitles": [
      { "lang": "English", "url": "https://..." }
    ]
  }
  ```

### 4. Media Playback Constraints
- Hosts: `moon.zenoak.top`, `laserlamp.top`.
- Streams: Clean HLS master/index (`.m3u8`) with `.m4s` chunks.
- CORS: `Access-Control-Allow-Origin: *`.
- Referer: Requires `Referer: https://www.movy.sx/` (returns 403 Forbidden without it).
- Streaming route: Proxied through `/api/stream` using our signed stream proxy.

## Standalone Usage

```bash
node tools/extractors/movy/extract.mjs 533535 movie
node tools/extractors/movy/extract.mjs 1396 tv 1 1 miami
```
