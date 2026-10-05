# TVZINHA ONLINE — ESPECIFICAÇÃO TÉCNICA DO MOTOR DE STREAMING DIRETO E ARQUITETURA DE PLAYERS
**Standard Operating Procedure (SOP) & Technical Implementation Directive**  
**Versão:** 3.0.0 (Produção Consolidada — Dual Engine)  
**Destino:** Frontend Tvzinha Online (Artplayer Shell) + Backend de Borda (Cloudflare Workers / Python Resolver)

---

## 1. Visão Geral & Nova Hierarquia dos Players

O Tvzinha Online está implementando uma evolução de alto impacto no consumo de mídia: a introdução de **Players Diretos Nativos (HLS/MP4 limpos)** sem remover, desordenar ou quebrar os players iframes já existentes no site.

### Contrato de Convivência dos Players no Frontend
A interface existente mantém todos os seus botões e seletores intactos. As novas opções de reprodução direta entram como as **primeiras e principais opções**, enquanto os players terceiros (iframes tradicionais) permanecem como contingência final absoluta:

```
[ Seletor de Players no Frontend do Tvzinha ]
   │
   ├── [ Opção 1 - Player Nativo Direto (Principal) ] ──> Zero anúncios, Artplayer, HLS/MP4 puro (< 300ms)
   │
   ├── [ Opção 2 - Player Nativo Animes (Dub/Leg) ]   ──> Especializado com seletor de áudio/legendas externas
   │
   └── [ Opções 3+ - Players Iframes Tradicionais ]    ──> (Superflix, WarezCDN, etc. mantidos intactos)
```

Essa abordagem garante **100% de disponibilidade de catálogo** mesmo em casos extremos de instabilidade das fontes diretas.

---

## 2. Matriz de Fontes por Categoria

A extração de mídia direta opera sob duas frentes claras e especializadas:

| Categoria | Player Frontal | Perfil de Áudio | Fonte Primária | Fonte Contingência / Fallback | Formato de Entrega |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Filmes (Live-Action)** | Player 1 (Nativo) | Dublado PT-BR | **MGEB** (PlayerCDN HLS) | MGEB (FirePlayer / PeliculaPlay) | HLS Adaptativo (`.m3u8`) |
| **Séries (Live-Action)** | Player 1 (Nativo) | Dublado PT-BR | **MGEB** (PlayerCDN HLS) | MGEB (FirePlayer / PeliculaPlay) | HLS Adaptativo (`.m3u8`) |
| **Animes (Dublado PT-BR)** | Player 2 (Animes) | Dublado PT-BR | **MGEB** (HLS Adaptativo PT) | **AnimesOnline** (GoogleVideo CDN) | HLS (`.m3u8`) / MP4 (206 Range) |
| **Animes (Legendado / JP)** | Player 2 (Animes) | Japonês Original | **ZokoAnime** (1080p FHD HLS) | AnimesOnline (Legendado) | HLS (`.m3u8`) + Legendas `.vtt` |

---

## 3. Arquitetura do Backend: Stream Resolver & Edge Proxy

Para manter o custo de infraestrutura próximo de zero e latência abaixo de 300ms, o backend foi desenhado para rodar sobre **V8 Isolates leves (Cloudflare Workers)** ou serviços de container enxutos (Cloud Run / VPS leve).

### O que o backend FAZ:
1. **Resolução Rápida (Resolver)**: Faz requisições HTTP puras (`GET` assíncrono) para os endpoints das fontes e decodifica os payloads em memória (ex: arrays JS do MGEB, descriptografia XOR estática do ZokoAnime ou tokens do Google Blogger).
2. **Injeção de Cabeçalhos (Proxy de Borda)**: Repassa os fragmentos de vídeo (`.ts`, `.m4s`, `.mp4`) injetando os cabeçalhos anti-hotlink obrigatórios (`Referer`, `Origin`, `User-Agent`) para evitar erros `403 Forbidden`.
3. **CORS Habilitação Universal**: Injeta cabeçalhos `Access-Control-Allow-Origin: *` permitindo que o Artplayer consuma as streams de qualquer domínio.

### O que o backend NÃO FAZ:
* **NÃO roda navegadores pesados**: Zero uso de Chromium headless, Puppeteer ou CDP em produção.
* **NÃO faz transcodificação de vídeo**: Zero processamento com FFmpeg (poupa CPU e evita atrasos de renderização).

```
[ Usuário Clica no Play ]
        │
        ▼
[ Cloudflare Worker: /api/resolve?id={tmdb|mal}&type={type}&season={s}&episode={e}&lang={dub|sub} ]
        │
        ├── 1. Checa Cache KV na Borda (TTL: 1h) ──> Cache Hit (< 20ms)
        │
        ├── 2. Se Cache Miss ──> Executa Requisição HTTP Direta à Fonte (~200ms)
        │       ├── [Se Filmes/Séries/Anime Dublado] ──> MGEB Resolver (var sources = [...])
        │       │       └── Se falhar ──> AnimesOnline Blogger RPC (GoogleVideo CDN)
        │       └── [Se Anime Legendado] ──> ZokoAnime Resolver (Base64 + XOR 'otaku-embed-v1')
        │
        ├── 3. Monta o Objeto de Resposta Unificado (Stream URL + Required Headers + Tracks)
        │
        └── 4. Retorna JSON Limpo para o Frontend
                │
                ▼
[ Artplayer Shell no Frontend ]
        │
        ├── Carrega o Stream através do Proxy de Borda (/api/stream?url=...)
        └── Reproduz o vídeo de forma nativa e sem anúncios
```

---

## 4. Contrato de Dados Unificado (API Payload Schema)

O endpoint de resolução (`/api/resolve`) retorna sempre o mesmo formato padronizado, independentemente do provedor de origem:

```json
{
  "success": true,
  "title": "Solo Leveling - T1E1 - Estou acostumado",
  "category": "anime",
  "audio": "dubbed",
  "primary_source": {
    "label": "Servidor 1 [PlayerCDN (Cloudflare)]",
    "type": "hls",
    "stream_url": "https://api.tvzinha.workers.dev/api/stream?url=https%3A%2F%2Fsolitary-field-9699.playercdn.workers.dev%2Fincludes%2Fhls.php...",
    "raw_url": "https://solitary-field-9699.playercdn.workers.dev/includes/hls.php...",
    "headers": {
      "Referer": "https://embedplayer2.xyz/",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }
  },
  "fallback_sources": [
    {
      "label": "Servidor 2 [GoogleVideo CDN 720p]",
      "type": "mp4",
      "stream_url": "https://api.tvzinha.workers.dev/api/stream?url=https%3A%2F%2Frr1---sn-pouxgnv4ucg-c2ne.googlevideo.com...",
      "raw_url": "https://rr1---sn-pouxgnv4ucg-c2ne.googlevideo.com/videoplayback?...",
      "headers": {
        "Referer": "https://www.blogger.com/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    }
  ],
  "subtitles": [
    {
      "lang": "pt-BR",
      "label": "Português (Brasil)",
      "default": true,
      "url": "https://api.tvzinha.workers.dev/api/stream?url=https%3A%2F%2Fhls.dramahot.top%2Fv%2F...%2Fsubs%2Fpt.vtt"
    }
  ],
  "aniskip": {
    "mal_id": 52299,
    "episode": 1,
    "ready": true
  }
}
```

---

## 5. Especificação do Player Nativo (Frontend Artplayer Shell)

Quando o usuário clica em um dos Players Diretos, a interface exibe o player próprio customizado construído sobre o **Artplayer**.

### 5.1 Controles Principais do Player
O player deve ser limpo, intuitivo e conter apenas o essencial:
* **Play / Pause**: Com suporte a barra de espaço.
* **Barra de Progresso & Buffer**: Com seeking suave (Range requests em MP4 e fragmentos em HLS).
* **Controle de Volume**: Com slider responsivo e memória de áudio.
* **Seletor de Qualidade**: 1080p, 720p, 360p ou Automático (gerenciado pelo Hls.js).
* **Seletor de Legendas (WebVTT)**: Menu pop-up para ativar/desativar e escolher o idioma das legendas externas.
* **Seletor de Faixas de Áudio**: Quando o manifesto HLS contiver multi-áudio (Dublado / Japonês).
* **Modo Tela Cheia & PiP (Picture-in-Picture)**.

### 5.2 Protocolo Obrigatório de Reset Atômico (`atomicReset`)
Para evitar sobreposição de instâncias, vazamentos de memória (memory leaks) e reprodução fantasma de áudio ao trocar de servidor ou player, o frontend deve executar uma rotina estrita de destruição antes de montar um novo fluxo:

```javascript
/**
 * Destruição e Reset Atômico do Player
 * Garante que nenhum processo ou elemento visual anterior persista.
 */
function atomicPlayerReset() {
  // 1. Destrói o Artplayer anterior se existir
  if (window.artInstance) {
    try {
      window.artInstance.pause();
      window.artInstance.destroy(true); // true = remove nós do DOM
    } catch (e) {
      console.warn("[Artplayer] Aviso ao destruir instância:", e);
    }
    window.artInstance = null;
  }

  // 2. Destrói instância pendente do Hls.js
  if (window.hlsInstance) {
    try {
      window.hlsInstance.stopLoad();
      window.hlsInstance.detachMedia();
      window.hlsInstance.destroy();
    } catch (e) {
      console.warn("[HLS] Aviso ao destruir Hls.js:", e);
    }
    window.hlsInstance = null;
  }

  // 3. Limpeza forçada do elemento HTML do contêiner
  const container = document.getElementById("artplayer-container");
  if (container) {
    container.innerHTML = "";
  }

  // 4. Limpa timeouts ou intervalos pendentes do auto-cascade
  if (window.cascadeTimer) {
    clearTimeout(window.cascadeTimer);
    window.cascadeTimer = null;
  }
}
```

### 5.3 Auto-Cascade Silencioso (Failover de Servidor)
Se o servidor ativo falhar (timeout de 6 segundos ou erro de rede 404/502), o Artplayer salva o tempo atual (`currentTime`) e monta imediatamente o servidor secundário (fallback) sem intervenção manual do usuário:

```javascript
function onStreamError(errorEvent) {
  const lastTime = window.artInstance ? window.artInstance.currentTime : 0;
  console.warn(`[Auto-Cascade] Falha no servidor. Tentando contingência a partir de ${lastTime}s...`);

  atomicPlayerReset();
  mountServer(nextAvailableSource, lastTime);
}
```

### 5.4 Preparação para AniSkip (Feature Futura)
O player deve ser instanciado mantendo ganchos (hooks) no evento `video:timeupdate`. Assim que a feature de skip for conectada, o botão flutuante **"Pular Abertura (+85s)"** será acionado nos intervalos retornados pela API:
```javascript
// Hook reservado para futura integração do AniSkip
art.on('video:timeupdate', () => {
  const current = art.currentTime;
  if (window.activeOpening && current >= window.activeOpening.start && current <= window.activeOpening.end) {
    showSkipButton("Pular Abertura", window.activeOpening.end);
  } else {
    hideSkipButton();
  }
});
```

---

## 6. Mapeamento de Identificadores (TMDB $\leftrightarrow$ MAL)

Para que o usuário possa selecionar animes no catálogo principal indexado por TMDB e o Resolver consiga consultar o ZokoAnime (que usa MyAnimeList ID), o backend emprega uma rotina de conversão leve:

1. **Consulta Direta ao Cache**: Mantém no KV ou memória os pares `tmdb_id -> mal_id` dos principais animes catalogados (gerado via script de pré-indexação).
2. **Fallback Dinâmico via Jikan / AniList API**:
   * Requisição leve em caso de miss: `https://api.jikan.moe/v4/anime?q={title}&limit=1`
   * Armazena o resultado no cache com TTL de 30 dias.

---

## 7. Roteiro de Implantação e Procedimento Operacional (SOP)

1. **Fase 1 (Módulos de Extração)**:
   * Consolidar o extrator do MGEB ([src/providers/mgeb/mgeb_extractor.py](file:///c:/Users/ratew/OneDrive/Área%20de%20Trabalho/PESSOAL/CODE/ANTIGRAVITY/PROJETO6%20-%20fontes/src/providers/mgeb/mgeb_extractor.py)).
   * Adicionar o extrator do ZokoAnime (`src/providers/zoko/zoko_extractor.py`) com decodificador XOR `otaku-embed-v1`.
   * Adicionar o extrator de contingência AnimesOnline Blogger (`src/providers/blogger/blogger_extractor.py`).
2. **Fase 2 (Proxy e Roteamento)**:
   * Atualizar [server.py](file:///c:/Users/ratew/OneDrive/Área%20de%20Trabalho/PESSOAL/CODE/ANTIGRAVITY/PROJETO6%20-%20fontes/server.py) para expor a rota `/api/resolve` com o contrato padronizado.
   * Garantir que o `/api/stream` faça o repasse dinâmico de `Referer` conforme recebido no payload.
3. **Fase 3 (Integração no Frontend)**:
   * Adicionar os seletores "Player 1 (Nativo)" e "Player 2 (Animes)" na UI do Tvzinha sem alterar as opções já existentes.
   * Implementar a função `atomicPlayerReset()` na troca de abas e players.
4. **Fase 4 (Validação)**:
   * Testar a reprodução e seeking em Filmes (Matrix/Oppenheimer), Séries (Stranger Things) e Animes (Solo Leveling/Jujutsu Kaisen).
   * Validar o auto-cascade simulando queda de rede no Servidor 1.

---

## 8. Frontend & Player Hardening (Artplayer, Protocols, Subtitles & UX Directives)

### 8.1 The HTTP HEAD Protocol Bug & Edge Proxy Resolution
* **The Root Cause:** Chromium-based browsers (Chrome, Edge) always issue a preliminary `HEAD` request before mounting HTML5 `<video src="...">` MP4 media. The browser expects `Accept-Ranges: bytes` and a valid video `Content-Type` to verify that range seeking is supported.
* **The Failure Mode:** When the streaming proxy (`/api/stream`) lacked an explicit `HEAD` handler (e.g. `do_HEAD` in Python or `onRequestHead` in Cloudflare Pages), the server returned `404 Not Found` or closed the socket. The browser immediately fired a fatal `video.onerror`, triggering premature fallback to legacy iframes.
* **The Solution:**
  1. Both `local_server.py` and `functions/api/stream.js` strictly implement `HEAD` handlers.
  2. For binary/MP4 media, the proxy injects `Range: bytes=0-0` when probing upstream, mirrors `Accept-Ranges`, `Content-Range`, `Content-Length`, and `Content-Type` headers, and completes the handshake without transmitting unnecessary body bytes.

### 8.2 Real Dynamic Subtitle Settings & PT-BR Prioritization
* **The Issue & Artplayer Validator Bug:** Defaulting to `subtitles[0]` unconditionally forced English subtitles. Furthermore, if `initialSubtitle` was `undefined` (for dubs or titles without external subtitles), passing `subtitle: undefined` directly triggered a fatal Artplayer constructor crash: `Error: [Type Error]: 'option.subtitle' require 'object' type, but got 'undefined'`.
* **The Solution:**
  1. **Strict Object Conditioning:** The `subtitle` key is conditionally attached to `artOptions` *only* if `initialSubtitle` evaluates to a valid object. If absent or null, the property is omitted completely, allowing dubs and raw MP4 streams to mount without exceptions.
  2. **Smart Default:** The frontend parses track labels and language codes (`label`, `lang`), prioritizing Portuguese tracks (`pt-BR`, `Portuguese`, `Brasil`). If unavailable, it falls back to the first available track.
  3. **Artplayer Settings Integration:** Subtitle tracks are registered via `art.setting.add()` with an interactive track list, allowing the user to seamlessly switch between English, Portuguese, Spanish, or disable subtitles (`art.subtitle.show = false`).

### 8.3 Theater Bar Button Conditionality, Naming & Unified Styling
* **Naming Convention & Zero-Emoji Standard:**
  * In strict compliance with project design standards, **no emojis** are allowed anywhere in player controls, labels, buttons, or toasts.
  * Native movie and TV series player button: `Player Nativo - Sem Anúncios (BETA)`
  * Specialized anime player button: `Player Nativo Animes - Sem Anúncios (BETA)`
* **Conditionality:** The `[Player Nativo Animes - Sem Anúncios (BETA)]` button in the series theater bar must strictly appear only if the currently loaded item is an anime (`genre_ids.includes(16)`, `original_language === 'ja'`, or `origin_country.includes('JP')`). For live-action TV series, only `[Player Nativo - Sem Anúncios (BETA)]` is rendered to prevent confusion.
* **Unified Aesthetics:**
  * **Inactive State:** Both movie and series native pills share identical neutral dark-glass styling (`background: rgba(255, 255, 255, 0.06)`, `border: 1px solid rgba(255, 255, 255, 0.12)`, `color: #e4e4e7`).
  * **Active State:** When active, both buttons display a vivid green highlight (`background: #16a34a !important`, `box-shadow: 0 0 14px rgba(34, 197, 94, 0.45) !important`, `color: #ffffff !important`).

### 8.4 MGEB Source Scoring, Cloudflare Handshake Tolerance & Edge Caching
* **Intelligent Scoring:**
  * HLS Adaptive Streams (`.m3u8`): Score +100 (smooth adaptive buffering, best stability).
  * Direct MP4 Streams: Score +70 (direct progressive download).
  * Known Broken Sub-Providers: Links containing `playercdn.workers.dev` or dead cache endpoints receive -100 to prevent mounting dead links.
* **Handshake Tolerance & Memory Caching:**
  * MGEB sits behind Cloudflare and LiteSpeed with active SSL renegotiation, requiring 8 to 10 seconds on cold connections. Upstream timeout is set to 12 seconds to prevent premature timeout aborts.
  * Resolved payloads are stored in an in-memory TTL cache (30 minutes). Subsequent requests for the same media or adjacent episodes respond in < 30ms without hitting MGEB again.

### 8.5 Non-Invasive Cascade & Absolute User Agency (Zero Auto-Switching)
* **The Golden Rule:** The player must **NEVER** switch tabs or force an iframe onto the user automatically.
* **Internal Failover:** Cascade switching occurs *exclusively* between internal mirror streams of the selected provider (e.g. from Primary HLS to Mirror 2 MP4).
* **Final Fallback State:** If all native direct streams are exhausted or unavailable:
  1. The player shell remains in place without jarring layout shifts.
  2. A polite toast notification informs the user that direct streams are currently unavailable.
  3. An elegant in-container informative card invites the user to manually select an alternative server (MGEB, Superflix, etc.) from the server bar if they wish. All switching decisions remain 100% in the user's hands.

### 8.6 Artplayer Brightness Calibration & Mask/Overlay Neutralization
* **The Full-Height Gradient Bug:** By default, Artplayer's `.art-bottom` control container has `position: absolute; inset: 0; height: 100%`. Applying custom CSS with `background: linear-gradient(...) !important` stretched an 85% black translucent curtain over the entire video frame from top to bottom, making native playback appear significantly darker than iframes.
* **The Fix:**
  1. **Confining `.art-bottom`:** Styled strictly as `top: auto !important; bottom: 0 !important; height: 75px !important; width: 100% !important;` to ensure controls gradient only touches the bottom bar.
  2. **Mask Neutralization:** `.art-mask`, `.art-layers`, and `.art-backdrop` are forced to `background: transparent !important`.
  3. **Poster Dismissal:** `.art-poster` is forced to `display: none !important; opacity: 0 !important` as soon as the `art-playing` class attaches on playback start.
  4. **Source Selection:** Master MGEB streams (calibrated Rec.709 8-bit SDR) are given primary priority, ensuring natural studio color contrast identical to official iframes.

### 8.7 Screen Wake Lock API & Mobile Sleep Prevention Architecture
* **The Problem:** Mobile devices, tablets, and smart TVs enforce strict OS-level display sleep timeouts (often 30s to 2 minutes of touch inactivity). When streaming long-form media through embedded WebViews, iframes, or HTML5 video tags, displays would shut off mid-playback.
* **The Solution — Universal Wake Lock Controller:**
  * **Native API Utilization:** Built around the W3C `navigator.wakeLock.request('screen')` standard, with progressive fallback checking (`'wakeLock' in navigator`).
  * **Sentinel Lifecycle Management:** The sentinel object `screenWakeLockSentinel` is tracked in application memory. When acquired, screen locking persists across the user session without requiring recurrent touch input.
  * **Automatic Visibility Re-acquisition:** When mobile operating systems minimize or switch browser tabs, the browser automatically releases the wake lock sentinel. A global `visibilitychange` event listener detects when the document returns to `document.visibilityState === 'visible'`. If `isPlaybackActive` is `true`, it immediately re-acquires the screen lock seamlessly.
* **Comprehensive Player Coverage:**
  1. **Native Artplayer (Movies, Series, Anime):** Lock is acquired when playback starts (`art.on('video:playing')`) and released on pause (`art.on('video:pause')`), stop (`art.on('destroy')`), or failure (`art.on('error')`).
  2. **Legacy Iframes (Movie Modals & Series Theater):** Lock is acquired immediately when the embed iframe loads valid content (`iframe.onload`) and released when the modal/theater is closed (`closeMovieDetailsModal()`, `stopSeriesPlayer()`).
  3. **Live TV Channel Player:** Lock is acquired when the live stream iframe finishes loading in the theater stage and released when the user leaves the TV view (`switchAppView`) or changes destination.
  4. **Atomic Reset Integrity:** Any call to `atomicPlayerReset()` immediately invokes `setPlaybackActiveState(false)`, freeing system resources and preventing background battery drain.

### 8.8 Cloudflare WAF Datacenter Block Tolerance & HLS Manifest Prioritization
* **The Problem (Cloudflare-to-Cloudflare WAF Block):**
  * Certain direct MP4 upstreams (such as `www-fontedecanais-sh.57lgoe65efxo71.com`) utilize aggressive Cloudflare WAF bot management rules. When accessed via residential client IPs (local development), requests succeed. However, when proxied through Cloudflare Pages Functions / Workers in production, the upstream WAF detects datacenter egress IPs (Cloudflare ASN 13335) and responds with `HTTP 403 Forbidden (Attention Required! | Cloudflare)`.
  * Historically, the scoring algorithm penalized `cache/hls` links under the assumption that cached manifests were transient, which discarded active Playspelis/MGEB HLS mirrors and emptied the fallback queue for titles like *Game of Thrones*.
* **The Solution:**
  1. **URL Normalization & Referer Correction:** Relative path artifacts emitted by MGEB (e.g. `mgeb.top/../cache/hls/...`) are normalized to canonical absolute paths (`mgeb.top/cache/hls/...`), and appropriate referers (`https://mgeb.top/`) are assigned dynamically.
  2. **HLS Manifest Prioritization (+95 Score):** Datacenter-safe HLS adaptive streams (`.m3u8`, `cache/hls`, `playspelis.com`, `peliculaplay.com`) are prioritized with score 95. These streams pass Cloudflare Pages Functions proxying cleanly with HTTP 200 OK and automatic segment URI rewriting.
  3. **Preserving MP4 Mirrors as Fallbacks (+80 / +70 Score):** Direct MP4 streams remain registered in the secondary fallback queue (`fallback_sources`) rather than being discarded, ensuring complete fault tolerance across environments.
  4. **Socket Disconnect Resiliency:** Added `ConnectionAbortedError` (Windows `WinError 10053`) to socket exception handlers to cleanly tolerate rapid browser pause, scrub, or range-cancellation events without producing spurious 502/500 proxy responses.

### 8.9 Hybrid Streaming Architecture & Direct Secure MP4 Seeking
* **Architecture Distinction (HLS Proxy vs. Direct MP4 Delivery):**
  * **HLS Adaptive Streams (`.m3u8`):** Handled via `Hls.js` through JavaScript `fetch()` calls. Because browsers enforce strict CORS on JS fetches, HLS manifests and segment URIs must route through the Cloudflare edge proxy (`/api/stream`) to inject CORS headers (`Access-Control-Allow-Origin: *`) and spoof origin/referer policies.
  * **Direct Progressive MP4 Streams (`.mp4`):** Handled directly by native HTML5 `<video src="...">` elements. The HTML5 specification permits cross-origin media playback without requiring CORS headers on standard video elements (omitting `crossorigin="anonymous"`). 
* **Key Implementation Pillars:**
  1. **Direct HTTPS Sanitization & Port 80 Stripping:** Raw MGEB links often present plain HTTP with an explicit port `:80` (e.g., `http://...:80/movies/...`). The resolver automatically sanitizes these to standard HTTPS on port 443 (`https://.../movies/...`). This eliminates Mixed Content warnings on secure HTTPS deployments while avoiding `ERR_SSL_PROTOCOL_ERROR` handshake rejections caused by attempting TLS over port 80.
  2. **Bypassing Datacenter WAF 403 Blocks:** By delivering the direct HTTPS MP4 URL to the client player instead of wrapping it in the Cloudflare Worker proxy, video requests originate directly from the user's residential/mobile IP. Upstream WAF filters accept the connection without challenge, resolving 403 Forbidden errors across catalog titles like *Avengers: Endgame*, *Avengers: Infinity War*, and *City of God*.
  3. **Instant Timeline Seeking (`HTTP 206 Partial Content`):** Native browser range requests (`Range: bytes=X-`) connect directly to the origin server, which responds with `206 Partial Content` and `Accept-Ranges: bytes`. Users can seek seamlessly through 4GB+ files without downloading the entire media payload.
  4. **Automatic Fallback Safety Net:** Secondary HLS mirrors (`playercdn.xyz`, `workers.dev`, `powestream.workers.dev`) are assigned Tier 4 scoring (Score 60) and preserved in `fallback_sources`. If client-side network interruptions impact the direct MP4, the player's internal cascade transitions to the HLS mirror automatically without interface freezing.

### 8.10 Artplayer Controls Overflow & Popup Menu Unclipping
* **The Problem (75px Controls Clipping):**
  * When applying custom CSS to confine the bottom dark vignette gradient to the lower 75px bar (`.art-video-player .art-bottom { height: 75px !important; }`), Artplayer's core style sheet enforces `overflow: hidden;` on `.art-bottom`.
  * Because Artplayer renders its settings balloon menu (`.art-settings`, height ~250px) and vertical volume slider panel (`.art-volume-panel`, height ~100px) as children of `.art-bottom` positioned relative to the control bar, confining the parent container with `overflow: hidden` sliced off any elements expanding upward past 75px. Only the bottom 5px arrow of the settings menu was visible, and the volume slider was completely invisible.
* **The Solution:**
  * Enforced `overflow: visible !important;` on both `.art-video-player .art-bottom` and `.art-video-player .art-controls`.
  * The dark bottom gradient (`linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.85) 100%)`) remains cleanly confined to the bottom 75px bar, while all balloon menus, quality selectors, subtitle pickers, and volume sliders freely expand upward over the video stage without clipping.

### 8.11 Dynamic Quality Hooking (HLS Levels & MP4 Single-Resolution) & Subtitle Offset UX
* **The Problem (Missing Quality & Confusing Subtitle Offset):**
  * Dubbed Brazilian movies (MGEB / fontedecanais) feature hardcoded Portuguese audio tracks and no external text subtitles (`subtitles: []`).
  * While the custom subtitle selector was properly guarded, Artplayer's built-in option `subtitleOffset: true` remained active. This displayed an empty "Atraso da legenda" setting inside the menu when no subtitles existed, misleading users.
  * Furthermore, Artplayer lacked automatic hooks to display stream resolution tiers (e.g. 1080p, 720p, 480p) from adaptive HLS manifests.
* **The Solution:**
  1. **Conditional Subtitle Offset:** Configured `subtitleOffset: Boolean(initialSubtitle || (subtitles && subtitles.length > 0))`. Subtitle offset controls now only render when subtitles are actively present.
  2. **Adaptive HLS Level Hooking:** Listened for `Hls.Events.MANIFEST_PARSED` inside `customType.m3u8`. If `hls.levels.length > 1`, dynamically registers a `Qualidade` menu inside `art.setting.add()` with options: `Automática` (level -1), `1080p`, `720p`, `480p`, etc., binding user selection directly to `hls.currentLevel`.
  3. **Static MP4 Quality Indicator:** For direct progressive MP4 streams (`!isHls`), registers a `Qualidade` menu in Artplayer settings indicating `1080p (Original)`.




