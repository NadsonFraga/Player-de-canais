# Tvzinha Online - Stream Extraction Research & Player Modernization Specification

## 1. Executive Summary & Objective

The primary objective of this initiative is to perform **reverse engineering and feasibility research on video stream extraction** from third-party embed providers currently utilized by Tvzinha Online (specifically for Animes, Séries, and Movies).

### The Endgame Feature Set:
By extracting raw stream manifests (`.m3u8` HLS playlists or `.mp4` video files), Tvzinha can replace third-party cross-origin `<iframe>` wrappers with a **custom, high-performance native video player** (e.g., Artplayer, Video.js, or Plyr), unlocking:
1. **Interactive "Skip Intro" (+85s / Custom Duration):** Bypassing opening themes with a single hotkey or UI button.
2. **AniSkip API Integration:** Automatic detection of opening and ending timestamps for thousands of cataloged animes via `api.aniskip.com`.
3. **Automated "Next Episode" Autoplay:** Triggering seamless transition cards when the video progress reaches ~95% or upon credits initiation.
4. **Zero Third-Party Ads & Popups:** Eliminating all injected redirect scripts, malicious ad overlays, and rogue tabs.
5. **Universal Playback Controls:** Custom playback speed (0.5x to 2.0x), audio track switching, external subtitle styling, and Smart TV remote keybindings.

---

## 2. Complete Inventory of Current Video Sources & Providers

### A. Séries & Animes Engines (Primary Extraction Targets)
All episodic providers currently resolve dynamically using `(tmdb_id, season, episode)`:

| Provider Key | Provider Name | Base Embed Pattern | Audio / Subtitle Profile | Internal Sub-Options |
| :--- | :--- | :--- | :---: | :---: |
| **`mgeb`** | **MGEB** | `https://mgeb.top/embed/serie/{id}/{s}/{e}` | Dubbed & Subtitled PT-BR | Multiple internal player options (Player 1, 2) |
| **`superflix`** | **SuperFlix** | `https://superflixapi.quest/serie/{id}/{s}/{e}` | Dubbed PT-BR & Legendado | Dual audio selector |
| **`warezcdn`** | **WarezCDN** | `https://embed.warezcdn.net/serie/{id}/{s}/{e}` | High-bitrate Japanese & English with PT subtitles | Single stream with fast CDN |
| **`vsembed`** | **VsEmbed** | `https://vsembed.ru/embed/tv/{id}/{s}/{e}` | Multi-Language (`ds_lang=pob,pt,en`) | Granular audio & subtitle selectors |
| **`myembed`** | **MyEmbed** | `https://myembed.biz/embed/tv/{id}/{s}/{e}` | High-definition 1080p | Single stream |

### B. Movies Engine (On-Demand Catalog)
Indexed by TMDB movie identifier:

| Provider Key | Provider Name | Base Embed Pattern | Notes & Specialization |
| :--- | :--- | :--- | :--- |
| **`mgeb`** | **MGEB (Principal)** | `https://mgeb.top/embed/{tmdb_id}` | Primary default engine; high reliability. |
| **`superflix`** | **SuperFlix** | `https://superflixapi.quest/filme/{tmdb_id}` | Fast indexing of recent cinema and streaming releases. |
| **`myembed`** | **MyEmbed** | `https://myembed.biz/filme/{tmdb_id}` | Reliable 1080p stream for blockbusters. |
| **`vsembed`** | **VsEmbed** | `https://vsembed.ru/embed/movie/{tmdb_id}?ds_lang=pob,pt,en` | Multilingual European & Brazilian Portuguese audio. |
| **`embedplay`** | **EmbedPlay** | `https://www.embedplay.one/filme/{tmdb_id}` | Secondary fallback for recent catalog. |
| **`fembed`** | **FEmbed** | `https://fembed.lol/filme/e/{tmdb_id}` | Lightweight stream for mobile connections. |

### C. Live TV Channels (For Reference)
Cataloged in `canais.json` across 7 genres (TV Aberta, Esportes, Filmes & Séries, Infantil, Documentários, Notícias, Religiosos):
* **MeuPlayer:** `https://meuplayeronlinehd.com/myplay/emb.html?id=...` & `localhost70.xyz`
* **NossoPlayer:** `https://nossoplayeronlinehd.ink/tv/[slug]`
* **EmbedTV:** `https://w7.embedtv.lat/[slug]`
* **DaddyLive:** `https://dlive.sx/stream/stream-[id].php`
* **EmbedCanais:** `https://embedcanaisdetv.xyz/e/index.php?canal=[slug]/`
* **YouTube Official:** `https://youtube-player.sbt.com.br/?videoID=...`

---

## 3. The Core Challenge: Why Extraction is "Step Zero"

In the current web architecture (`tvzinhaonline.pages.dev`), browser security rules (**Same-Origin Policy - SOP**) strictly isolate third-party iframes from parent JavaScript. You cannot read or control the iframe's internal `<video>` tag.

To bypass this barrier without rebuilding everything prematurely, **we must first prove that we can programmatically extract the raw media URL** (`.m3u8` or `.mp4`).

### Obstacles Providers Use to Prevent Extraction:
1. **JavaScript Obfuscation:** Packed scripts (`eval(function(p,a,c,k,e,d)...)`), Base64 encoding, and hidden variable chains.
2. **Ephemeral Access Tokens:** Hashes and expiration timestamps appended to stream URLs (e.g., `?token=xyz&expires=1727970000`).
3. **HTTP Header Verification:** Providers verifying `Referer`, `Origin`, and `User-Agent` to reject direct hotlinking.
4. **Cloudflare Turnstile / DDoS Protections:** JavaScript challenges designed to block basic `curl` or standard `requests` calls.
5. **CORS Restrictions:** Servers sending restrictive `Access-Control-Allow-Origin` headers that block client-side fetch unless routed through an origin proxy.

---

## 4. Phased Research & Testing Methodology (Step-by-Step)

When opening the dedicated reverse engineering thread, execute the research following this sequence:

### Phase 1: Benchmark Candidate Selection
* Choose **one specific popular anime episode** (e.g., *Jujutsu Kaisen* Season 1 Episode 1 or *Demon Slayer* Season 1 Episode 1) and **one trending movie** (e.g., TMDB ID `550` or a recent 2025/2026 title).
* Target provider order:
  1. **Superflix** (`superflixapi.quest`)
  2. **MGEB** (`mgeb.top`)
  3. **WarezCDN** (`embed.warezcdn.net`)
  4. **VsEmbed** (`vsembed.ru`)

### Phase 2: Network Traffic & DOM Decryption Analysis
1. Inspect the iframe network waterfall via browser DevTools (Network tab $\rightarrow$ Filter: `m3u8` or `xhr`/`fetch`).
2. Identify the exact API route that delivers the player playlist or video config JSON.
3. Determine how the payload is scrambled (unpacker algorithms, AES deciphering, or plain JSON response).

### Phase 3: Standalone Extraction Scripting (Python / Node.js)
1. Write a lightweight standalone test script (e.g., `scripts/research_extract_stream.py` or Node.js equivalent).
2. Attempt extraction using standard HTTP requests with tailored headers.
3. If Cloudflare Turnstile blocks simple requests, evaluate headless automation (Playwright/Puppeteer with stealth plugin).
4. Goal: Output the raw media link: `https://[cdn_host]/[path]/master.m3u8`.

### Phase 4: Playback Validation
1. Test the extracted `.m3u8` URL in **VLC Media Player** (Media $\rightarrow$ Open Network Stream).
2. Test the extracted URL in a minimal, local HTML test file with **Hls.js** / **Artplayer**.
3. Determine if the stream requires a lightweight CORS reverse-proxy to play in standard browsers.

---

## 5. Zero-Cost Local Testing Architecture (No Server or Domain Required)

Before provisioning cloud infrastructure, the entire feature can be fully proven on your local machine:

```
[Developer PC]
  ├── Backend Resolver (Python FastAPI / Node.js on port 3000)
  │     └── Resolves TMDB ID -> Raw .m3u8 link (with local in-memory cache)
  │
  ├── Frontend Client (Tvzinha running on http://localhost:8080 or live-server)
  │     └── Native Artplayer / Video.js replacing <iframe>
  │           ├── Native "Skip Intro (+85s)" button
  │           ├── AniSkip integration test
  │           └── Next Episode overlay
  │
  └── (Optional Multi-Device Testing)
        ├── Same Wi-Fi Network: Open http://192.168.x.x:8080 on Smart TV / Phone
        └── Free Remote Access: Run `cloudflared tunnel --url http://localhost:8080` (Free HTTPS URL, no domain needed)
```

---

## 6. How to Feed This File into the New Workflow

When starting the new conversation/workflow:
1. Reference this file: `SOURCES_SUMMARY.md` and `STREAM_EXTRACTION_RESEARCH_SPEC.md`.
2. Initial Prompt suggestion:
   > *"Estou iniciando o workflow de Pesquisa e Extração de Streams para o Tvzinha Online com base no arquivo `STREAM_EXTRACTION_RESEARCH_SPEC.md`. Vamos iniciar a Fase 1 e 2: inspecionar o provedor Superflix e MGEB para um anime de teste e extrair a URL pura `.m3u8`."*
