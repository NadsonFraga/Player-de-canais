# Stream Extractors Suite

This directory contains standalone specifications, reverse-engineering documentation, and isolated CLI test extractors for all third-party media sources supported or under evaluation for Tvzinha Online.

## Purpose & Architecture

1. **Isolation**: Extractors and their reverse-engineered algorithms live here in modular subfolders, separate from the core web application.
2. **Safety & Secrets**: This entire directory (`tools/*`) is blocked by `functions/_middleware.js` on Cloudflare Pages and is never served to clients.
3. **Pipeline**:
   - **Research & Extraction**: Reverse engineer the provider, isolate signatures/ciphers, document endpoints in `<provider>/README.md`, and build a standalone test script `<provider>/extract.mjs` (or `.py`).
   - **Validation & Health**: Test reliability across movies, series, and animes.
   - **Integration**: Once approved, port the resolution logic into `functions/api/resolve.js` and mirror identically in `tools/local_server.py`.

## Directory Index

| Provider | Folder | Status | Media Types | Direct Playback? | Notes |
|---|---|---|---|---|---|
| **MGEB** | [`mgeb/`](file:///c:/Users/ratew/OneDrive/Área%20de%20Trabalho/PESSOAL/CODE/ANTIGRAVITY/PROJETO1%20-%20TV/tools/extractors/mgeb/) | Production | Movies & Series | Yes (HLS direct) | Player Principal; uses TMDB/IMDb routing and duration outlier checks. |
| **Anime Native** | [`anime_native/`](file:///c:/Users/ratew/OneDrive/Área%20de%20Trabalho/PESSOAL/CODE/ANTIGRAVITY/PROJETO1%20-%20TV/tools/extractors/anime_native/) | Production | Animes | No (needs `/api/stream`) | Zoko host; uses MAL matching, AniSkip, absolute episode math. |
| **Movy** | [`movy/`](file:///c:/Users/ratew/OneDrive/Área%20de%20Trabalho/PESSOAL/CODE/ANTIGRAVITY/PROJETO1%20-%20TV/tools/extractors/movy/) | Extracted / Verified | Movies & Series | No (needs `/api/stream`) | 18 CDN servers, 1080p/4K, custom `mvm1` stream cipher. |
| **FenixFlix** | [`fenixflix/`](file:///c:/Users/ratew/OneDrive/Área%20de%20Trabalho/PESSOAL/CODE/ANTIGRAVITY/PROJETO1%20-%20TV/tools/extractors/fenixflix/) | Extracted / Verified | Movies, Series & Anime | Mixed (Direct / `/api/stream`) | Primary PT-BR Dublado native contingency for MGEB; 1080p/4K multi-engine aggregator. |

