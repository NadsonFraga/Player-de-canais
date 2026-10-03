# Tvzinha Online - Comprehensive Video Providers & Streaming Sources Architecture

This document provides a technical specification and exhaustive breakdown of all streaming providers, embed engines, servers, and playback infrastructure used across Tvzinha Online.

---

## 1. Global Iframe Security, Sandbox & Feature Policies

Across all views (Live TV Channels, Movies, Series, and Animes), video feeds are delivered inside dedicated, responsive 16:9 iframe viewports.

### Iframe Attribute Baseline
```html
<iframe 
    id="[stream-iframe | movie-modal-iframe | series-modal-iframe]"
    src="[stream_url]"
    allow="autoplay; encrypted-media; picture-in-picture; fullscreen" 
    allowfullscreen
    webkitallowfullscreen
    mozallowfullscreen
    referrerpolicy="no-referrer"
></iframe>
```

### Sandbox Compatibility Analysis
| Policy / Flag | Supported? | Technical Impact & Rationale |
| :--- | :---: | :--- |
| **Strict Sandbox (`sandbox=""`)** | ❌ **No** | Completely breaks playback. All streaming providers rely on JavaScript-based video runtimes (HLS.js, Clappr, JWPlayer, VideoJS, Shaka) to fetch `.m3u8` manifests and `.ts` media segments. |
| **Standard Sandbox (`allow-scripts allow-same-origin`)** | ⚠️ **Partial** | Some players function, but third-party anti-bot protections (Cloudflare Turnstile, DDoS-Guard, hCaptcha) and storage tokens fail, generating 403 Forbidden or infinite loading spinners. |
| **Permissive Sandbox (`allow-scripts allow-same-origin allow-forms allow-presentation`)** | ⚠️ **Conditional** | Works on select CDN embeds, but prevents native browser fullscreen transitions on iOS Safari / certain Smart TV browsers. |
| **Unsandboxed with `referrerpolicy="no-referrer"` (Production Baseline)** | ✅ **Yes** | Optimal standard. Strips all origin and referrer headers to prevent CORS/hotlink tracking while allowing native HLS decoders, DRM decryptors, and DRM media keys to initialize without interruption. |

---

## 2. Live TV Channels Engine (TV Aberta, Esportes, Filmes & Séries, Infantil, Variedades, Notícias)

The live streaming subsystem is cataloged in `canais.json` (with local fallback in `script.js`). Over 80 broadcast channels are categorized across 7 genres, each powered by multi-server redundancy.

### Provider Catalog

#### A. MeuPlayer (Primary Live Backbone)
* **Domains & Endpoints:** `https://meuplayeronlinehd.com/myplay/...` and `https://localhost70.xyz/myplay/...`
  * Embed format: `emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=[channel_slug]`
  * Direct HLS embed: `emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=[channel_slug]`
  * Direct watch format: `watch.html?id=[channel_slug]`
* **Sandbox Support:** Strict sandbox **not supported**. Requires unrestricted script execution.
* **Embedded Controls:** Contains built-in stream recovery, audio track selector, quality toggle, and responsive player shell.
* **Coverage:** Dominant provider for Globo (SP, RJ, BA, Minas), SporTV 1/2/3, Premiere 1-7, and Band.
* **Characteristics:** High-definition 1080p/720p 60fps streams, original Brazilian Portuguese broadcast, adaptive HLS bitrate.

#### B. NossoPlayer (Sub-Zero Latency Live Server)
* **Domains & Endpoints:** `https://nossoplayeronlinehd.ink/tv/[channel_slug]`
* **Sandbox Support:** Requires `allow-scripts` and `allow-same-origin`.
* **Embedded Controls:** Clean Clappr/Hls.js player interface, native volume, native fullscreen, low buffer delay.
* **Coverage:** Universal availability across ESPN 1/2/3/4/Extra, Fox Sports 1/2, Combate, Premiere Clubes, HBO Family/Signature/Plus, BandSports, and UFC Fight Pass.
* **Characteristics:** Extremely fast time-to-first-frame (TTFF), dedicated edge caching, resilience against concurrent sporting traffic.

#### C. EmbedTV (High-Availability Contingency)
* **Domains & Endpoints:** `https://w7.embedtv.lat/[channel_slug]` (e.g., `/bandsp`, `/caze1`, `/sportv`, `/xsports`)
* **Sandbox Support:** Does not allow aggressive sandboxing; requires script execution.
* **Embedded Controls:** Includes stream switcher and volume sliders.
* **Coverage:** Deployed as Server 3, 4, or 5 fallback across all premium and sports channels.
* **Characteristics:** Multi-source failover routing; redirects automatically to alternative master streams if primary feed encounters downtime.

#### D. DaddyLive (International Live Relay)
* **Domains & Endpoints:** `https://dlive.sx/stream/stream-[id].php`
* **Sandbox Support:** Strict sandbox **breaks video**. Requires script execution.
* **Embedded Controls:** Custom player controls, multi-bitrate HLS feed.
* **Coverage:** Backup streams for Premiere 1-7, SporTV 1-3, ESPN 1-4, Combate, and UFC Fight Pass.
* **Characteristics:** Robust offshore infrastructure, highly resistant to local ISP ISP throttling during major regional matches.

#### E. EmbedCanais (Web & Streaming Channels)
* **Domains & Endpoints:** `https://embedcanaisdetv.xyz/e/index.php?canal=[slug]/`
* **Sandbox Support:** Requires unrestricted script execution.
* **Embedded Controls:** Standard HTML5 video UI.
* **Coverage:** Specialized for internet-first and OTT feeds: CazéTV, XSports, Disney+, Amazon Prime Video, and Max.
* **Characteristics:** Optimized for continuous linear simulcasts.

#### F. Official YouTube Player (SBT Official Simulcast)
* **Domains & Endpoints:** `https://youtube-player.sbt.com.br/?videoID=[id]&t=0&adunit=...`
* **Sandbox Support:** Supports standard YouTube sandbox (`allow-scripts allow-same-origin allow-presentation`).
* **Embedded Controls:** Official YouTube player with standard scrubbing, resolution selector (up to 1080p), and closed captions.
* **Characteristics:** Official, 100% legal, zero-downtime stream directly from SBT broadcast network.

---

## 3. On-Demand Movies Engine (Catálogo de Filmes)

Powered by TMDB metadata integration (`TMDB_BASE_URL` with pt-BR localization), movies are fetched dynamically and loaded on-demand using 6 redundant embed providers indexed by TMDB movie ID.

| Server ID | Public Label | Endpoint Pattern | Multi-Audio / Subtitles? | Internal Sub-Servers? | Characteristics & Performance |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **`mgeb`** | **Servidor 1 (MGEB - Principal)** | `https://mgeb.top/embed/{tmdb_id}` | ✅ Yes (Dub/Leg) | ✅ **Yes** (Internal Player 1, 2, 3) | Primary default engine. High-speed CDN, integrated player switcher, clean UI, minimal ad injection. |
| **`superflix`** | **Servidor 2 (SuperFlix)** | `https://superflixapi.quest/filme/{tmdb_id}` | ✅ Yes (Dub/Leg) | ✅ **Yes** | Comprehensive Portuguese audio catalog, rapid indexing of recent cinema releases. |
| **`myembed`** | **Servidor 3 (MyEmbed)** | `https://myembed.biz/filme/{tmdb_id}` | ✅ Yes | ❌ Single Stream | Clean interface, low latency, reliable 1080p stream for blockbusters and trending titles. |
| **`vsembed`** | **Servidor 4 (VSEmbed - Multi-Áudio)** | `https://vsembed.ru/embed/movie/{tmdb_id}?ds_lang=pob,pt,en` | ✅ **Multi-Language** (PT-BR, PT-PT, EN) | ✅ **Yes** (Audio & Subtitle selector) | Best international player. Allows user to switch between Portuguese Brazilian audio, European Portuguese, and English with subtitles. |
| **`embedplay`** | **Servidor 5 (EmbedPlay)** | `https://www.embedplay.one/filme/{tmdb_id}` | ✅ Yes | ❌ Single Stream | Fallback engine with strong uptime for newly released and classic catalog items. |
| **`fembed`** | **Servidor 6 (FEmbed)** | `https://fembed.lol/filme/e/{tmdb_id}` | ✅ Yes | ❌ Single Stream | Lightweight secondary fallback, fast buffering on low-bandwidth mobile connections. |

---

## 4. Séries & Animes Engine (Dual-Mode Navigator & Ep episodic Player)

Séries and Animes share a unified episodic player architecture that automatically binds season, episode number, and TMDB media identifier to stream endpoints.

### Series & Anime Server Configurations
All providers resolve dynamically via: `buildUrl: (tmdb_id, season, episode) => string`

```javascript
const SERIES_SERVERS = {
    mgeb: {
        name: "MGEB",
        buildUrl: (id, s, e) => `https://mgeb.top/embed/serie/${id}/${s}/${e}`
    },
    superflix: {
        name: "Superflix",
        buildUrl: (id, s, e) => `https://superflixapi.quest/serie/${id}/${s}/${e}`
    },
    myembed: {
        name: "MyEmbed",
        buildUrl: (id, s, e) => `https://myembed.biz/embed/tv/${id}/${s}/${e}`
    },
    warezcdn: {
        name: "WarezCDN",
        buildUrl: (id, s, e) => `https://embed.warezcdn.net/serie/${id}/${s}/${e}`
    },
    vsembed: {
        name: "VsEmbed",
        buildUrl: (id, s, e) => `https://vsembed.ru/embed/tv/${id}/${s}/${e}`
    }
};
```

### Detailed Provider Evaluation for Séries & Animes

#### 1. MGEB (`mgeb.top`)
* **Content Specialization:** Global TV hits, Netflix/HBO/AppleTV+ originals, popular Shonen/Seinen anime (Demon Slayer, Jujutsu Kaisen, Attack on Titan, Solo Leveling).
* **Multi-Option:** Features internal server failover within the player frame.
* **Sandbox Compatibility:** Requires unsandboxed execution with `referrerpolicy="no-referrer"`.
* **State Preservation:** Compatible with episode progression tracker (`WATCH_PROGRESS_KEY`).

#### 2. SuperFlix (`superflixapi.quest`)
* **Content Specialization:** Extensive anime dubbing (Dublado PT-BR) and complete season backlogs.
* **Multi-Option:** Dual audio tracks (Dubbed and Subtitled) directly selectable.
* **Characteristics:** Highly reliable episode sync matching TMDB season numbering.

#### 3. MyEmbed (`myembed.biz`)
* **Content Specialization:** High-bitrate 1080p master copies for ongoing anime series and Western premium series.
* **Controls:** HTML5 controls with quick seek, buffer preview, and responsive sizing.

#### 4. WarezCDN (`embed.warezcdn.net`)
* **Content Specialization:** Fast streaming CDN optimized for high concurrency.
* **Characteristics:** Excellent reliability for newly aired weekly episodes within 24 hours of Japanese/US broadcast.

#### 5. VsEmbed (`vsembed.ru`)
* **Content Specialization:** Japanese audio with Portuguese subtitles for anime purists, alongside dual-audio American/European television.
* **Multi-Option:** Granular audio track switcher and multilingual subtitle synchronization.

---

## 5. Storage, State & Cache Layer

Tvzinha Online maintains seamless client-side state without external database requirements:

| State Key (`localStorage`) | Scope | Expiration / Policy | Function |
| :--- | :--- | :--- | :--- |
| `tvzinha_favorite_team` | Live Sports | Persistent | Stores selected Brazilian club/national team identifier for live fixture widgets. |
| `tvzinha_favorites` | Live TV | Persistent | Array of pinned favorite channel keys for instant access in Quick Grid. |
| `tvzinha_recent_channels` | Live TV | Max 6 items | FIFO stack of recently tuned channels with timestamps. |
| `tvzinha_watch_progress` | Séries & Animes | Persistent | Keeps track of show ID, season, episode, title, backdrop, and resume timestamp for the "Continue Watching" carousel. |
| `tvzinha_movies_cache_v2` | Movies | 12 Hours TTL | Caches TMDB discovery feed, genres, and hero carousel to eliminate unnecessary API requests. |
| `tvzinha_animes_cache_v2` | Animes | 12 Hours TTL | Caches Anime TMDB catalog, filtered lists, and studio metadata. |

---

## 6. Real-Time Football Fixtures & Score Feed

* **Source Scraper:** `scripts/test_get_matches.py` (extracts from Globo Esporte schedule endpoints for 20 Serie A clubs + Brazilian National Team).
* **Live Match Parser:** Detects and merges `now` (active live matches), `future` (scheduled matches), and recent `past` events.
* **Deployment Branch:** Dedicated `data` branch (`proximos_jogos.json`) updated via GitHub Actions single-commit force push.
* **Client Delivery:** Fetched dynamically via `https://raw.githubusercontent.com/NadsonFraga/Player-de-canais/data/proximos_jogos.json?t=[timestamp]` with silent 2-minute polling and local origin fallback.
