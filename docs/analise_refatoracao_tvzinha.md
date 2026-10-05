# 🏗️ Análise Técnica de Refatoração — Tvzinha Online

> **Status**: Apenas análise — nenhuma alteração foi feita no código.
> **Data**: Outubro 2026 | **Versão atual do projeto**: v7

---

## 📊 Diagnóstico Inicial — O Que Temos Hoje

### Métricas de Tamanho (Estado Atual)

| Arquivo | Linhas | Tamanho |
|---|---|---|
| `script.js` | **6.463 linhas** | 310 KB |
| `style.css` | ~3.200+ linhas | 160 KB |
| `index.html` | 1.827 linhas | 126 KB |
| `functions/api/resolve.js` | 389 linhas | 13 KB |
| `functions/api/stream.js` | 151 linhas | 6 KB |
| `canais.json` | 323 linhas | 16 KB |
| `proximos_jogos.json` | — | 98 KB |

**Total frontend monolítico: ~11.690 linhas em 3 arquivos.**

---

## 🗂️ Estrutura de Pastas Atual vs. Proposta

### Estado Atual (Problemático)
```
PROJETO1 - TV/
├── index.html          ← 1.827 linhas (tudo inline)
├── script.js           ← 6.463 linhas (MONOLITO)
├── style.css           ← 3.200+ linhas (MONOLITO)
├── canais.json
├── proximos_jogos.json
├── _headers
├── local_server.py     ← arquivo solto sem pasta
├── .gitignore
├── SOURCES_SUMMARY.md  ← docs no root
├── STREAM_EXTRACTION_RESEARCH_SPEC.md ← docs no root
├── TVZINHA_STREAMING_ENGINE_V3_SOP.md ← docs no root
├── functions/
│   └── api/
│       ├── resolve.js
│       └── stream.js
├── logos/              ← 102 arquivos soltos, sem subpastas
│   └── fav/
├── scripts/
│   └── test_get_matches.py
├── scratch/            ← pasta de temp no repositório (lixo)
└── __pycache__/        ← artefato de build Python no root
```

### Estrutura Proposta (Modularizada)
```
PROJETO1 - TV/
│
├── 📄 index.html               ← raiz (obrigatório para Cloudflare Pages)
├── 📄 _headers                 ← raiz (obrigatório CF Pages)
├── 📄 .gitignore               ← raiz
│
├── 📁 src/                     ← TODO código-fonte frontend
│   ├── 📁 js/
│   │   ├── config.js           ← Constantes e configurações globais
│   │   ├── state.js            ← Estado global da aplicação
│   │   ├── utils.js            ← Funções utilitárias genéricas
│   │   ├── modules/
│   │   │   ├── tv.js           ← Módulo: Canais TV Ao Vivo
│   │   │   ├── matches.js      ← Módulo: Jogos / Calendário
│   │   │   ├── player.js       ← Módulo: Player TV (iframe)
│   │   │   ├── native-player.js← Módulo: Artplayer/HLS nativo
│   │   │   ├── movies.js       ← Módulo: Filmes TMDB
│   │   │   ├── series.js       ← Módulo: Séries e Temporadas
│   │   │   ├── anime.js        ← Módulo: Animes
│   │   │   ├── navigation.js   ← Módulo: SPA routing + TV remote
│   │   │   ├── home.js         ← Módulo: Home view
│   │   │   ├── favorites.js    ← Módulo: Sistema de favoritos
│   │   │   ├── adblock.js      ← Módulo: Aviso/modal adblock
│   │   │   └── security.js     ← Módulo: Anti-popup shield
│   │   └── main.js             ← Ponto de entrada (DOMContentLoaded)
│   │
│   └── 📁 css/
│       ├── variables.css       ← Tokens de design (cores, tipografia)
│       ├── base.css            ← Reset e estilos globais
│       ├── layout.css          ← App layout, sidebar, header
│       ├── nav.css             ← Navegação flutuante capsule
│       ├── home.css            ← View Home
│       ├── tv.css              ← View Canais TV
│       ├── player.css          ← Player de canal
│       ├── movies.css          ← View Filmes
│       ├── series.css          ← View Séries e Animes
│       ├── matches.css         ← Seção de jogos
│       ├── modals.css          ← Modais globais
│       └── animations.css      ← Keyframes e transições
│
├── 📁 functions/               ← Cloudflare Pages Functions (backend)
│   └── api/
│       ├── resolve.js          ← Stream resolver (MGEB + ZokoAnime)
│       └── stream.js           ← CORS proxy de segmentos HLS/MP4
│
├── 📁 data/                    ← Dados estáticos/dinâmicos
│   ├── canais.json             ← Dataset de canais TV
│   └── proximos_jogos.json     ← Feed de jogos (scraper externo)
│
├── 📁 assets/
│   └── logos/                  ← Logos dos canais (organizadas)
│       ├── channels/           ← PNG/WebP dos canais
│       └── fav/                ← Favicons e ícones do app
│
├── 📁 docs/                    ← Documentação técnica
│   ├── SOURCES_SUMMARY.md
│   ├── STREAM_EXTRACTION_RESEARCH_SPEC.md
│   └── TVZINHA_STREAMING_ENGINE_V3_SOP.md
│
├── 📁 tools/                   ← Scripts de suporte/manutenção
│   ├── local_server.py
│   └── test_get_matches.py
│
└── 📁 .github/
    └── workflows/              ← CI/CD (já existe)
```

---

## 🔍 Módulos Identificados no `script.js`

O monolito atual tem **módulos bem demarcados por comentários**, mas todos no mesmo arquivo. A divisão lógica já existe, falta só fisicalizá-la:

| Módulo | Linhas Aprox. | Responsabilidade |
|---|---|---|
| `FALLBACK_CHANNELS` | L1–329 | Dataset fallback de canais (hardcoded) |
| Security Shield | L330–354 | Anti-popup / anti-hijack |
| State Management | L355–380 | Estado global (activeChannel, etc.) |
| SVG Registry | L389–409 | Ícones inline como strings |
| Channel Logos | L411–511 | Mapeamento canal → logo |
| `initApp()` | L513–529 | Inicialização + fetch canais.json |
| Matches Module | L531–1180 | Calendário de jogos, favorito de time |
| Adblock Modal | L1181–1308 | Modal de aviso + localStorage |
| Carousel/Drag | L1309–1450 | Carousel de jogos |
| Sidebar/Nav TV | L1451–1900 | Sidebar TV, filtros, busca |
| TV Player View | L1900–2068 | Renderização do player de canal |
| TV Remote | L2069–2100 | Navegação D-pad/keycode |
| SPA Router | L2095–2300 | `switchAppView()`, routing |
| Movies Module | L2862–4110 | TMDB filmes, busca, modal, player |
| Series/Animes Engine | L4111–6215 | Séries, temporadas, episódios |
| TV Remote Navigation | L6216–6452 | Navegação por controle remoto |
| Init | L6454–6460 | `setupSeriesModalHandlers()`, `initApp()` |

---

## 🔒 Análise de Segurança — Backend Cloudflare Functions

### Pontos Positivos (já implementados)
- ✅ CORS configurado com `Access-Control-Allow-Origin: *`
- ✅ Preflight OPTIONS handler em ambas as funções
- ✅ Timeout de 12s no `resolveMgeb()` com AbortController
- ✅ Try/catch em todos os fetches externos
- ✅ Reescrita de URL HLS no proxy (`stream.js`) para rotear segmentos pelo edge

### ⚠️ Riscos de Segurança Identificados

#### 🔴 CRÍTICO — Chave de API TMDB exposta no frontend
```js
// resolve.js — linha 8
const TMDB_API_KEY = "2dca580c2a14b55200e784d157207b4d";

// script.js — mesma chave hardcoded
const TMDB_API_KEY = "2dca580c2a14b55200e784d157207b4d";
```
**Risco**: A API Key está visível no código fonte público (bundle JS). Qualquer pessoa pode extraí-la e usar para consultas à TMDB API com sua quota.

**Solução**: Para o Cloudflare Pages Functions, usar **Environment Variables** (`context.env.TMDB_API_KEY`) configuradas no painel do Cloudflare. Para o frontend, as chamadas TMDB devem passar pela function `/api/resolve` como intermediária, nunca chamar TMDB diretamente do cliente.

---

#### 🟠 ALTO — CORS totalmente aberto no proxy de stream
```js
// stream.js — linha 131
responseHeaders.set("Access-Control-Allow-Origin", "*");
```
**Risco**: O proxy `/api/stream` pode ser usado por qualquer site externo para fazer requisições através do Cloudflare como se fossem do Tvzinha, consumindo sua quota de requests gratuitos e podendo gerar sobrecarga.

**Solução**: Restringir CORS origin para o domínio próprio:
```js
const ALLOWED_ORIGINS = ["https://tvzinhaonline.pages.dev", "https://tvzinha.app"];
const origin = request.headers.get("Origin") || "";
const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
```

---

#### 🟠 ALTO — Sem validação de URL no proxy `/api/stream` (Open Proxy/SSRF)
```js
// stream.js — linha 27
const targetUrl = urlObj.searchParams.get("url");
// → direto para fetch(targetUrl) sem validação de domínio
```
**Risco**: O proxy aceita qualquer URL como destino, podendo ser abusado como **Open Proxy** — alguém pode usar sua function para buscar recursos arbitrários na internet (SSRF/proxy abuse), consumindo sua quota.

**Solução**: Whitelist de domínios permitidos:
```js
const ALLOWED_DOMAINS = [
  "mgeb.top", "peliculaplay.com", "playspelis.com",
  "zokoanime.video", "dramahot.top", "playercdn.workers.dev"
];
function isAllowedUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    return ALLOWED_DOMAINS.some(d => hostname === d || hostname.endsWith("." + d));
  } catch { return false; }
}
```

---

#### 🟡 MÉDIO — Referer hardcoded aponta para domínio Cloudflare Pages
```js
// resolve.js — linha 72
"Referer": "https://tvzinhaonline.pages.dev/",
```
**Risco**: Se o domínio mudar (ex: domínio customizado), o Referer enviado aos servidores de stream fica desatualizado, o que pode causar bloqueios (muitos players verificam Referer).

**Solução**: Usar variável de ambiente ou derivar do `request.url`:
```js
const appOrigin = new URL(request.url).origin;
"Referer": `${appOrigin}/`,
```

---

#### 🟡 MÉDIO — Sem rate limiting nas functions
**Risco**: `/api/resolve` faz múltiplas requisições encadeadas externas (TMDB + MGEB + MAL API + Jikan). Um loop malicioso ou bot pode consumir toda a quota gratuita do Cloudflare Workers em minutos.

**Solução**: Implementar rate limiting por IP usando **Cloudflare Rate Limiting Rules** (via painel) ou via KV storage para contar requests por IP.

---

#### 🟡 MÉDIO — `FALLBACK_CHANNELS` duplica `canais.json` no bundle
```js
// script.js — L1 a L329 (hardcoded)
const FALLBACK_CHANNELS = { "TV Aberta": { "Globo": {...}, ...} }
```
**Risco**: Toda vez que atualizar `canais.json`, o fallback interno fica desatualizado. Além de inflar o bundle desnecessariamente com 329 linhas repetidas.

---

#### 🟢 BAIXO — CDN sem Subresource Integrity (SRI)
```html
<script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.8/dist/hls.min.js">
<script src="https://cdn.jsdelivr.net/npm/artplayer@5.1.7/dist/artplayer.js">
```
Sem SRI, se o CDN for comprometido, código malicioso poderia ser injetado diretamente.

---

#### 🟢 BAIXO — `__pycache__/` e `scratch/` no repositório
Não é risco de segurança, mas polui o deploy do Cloudflare Pages com artefatos desnecessários.

---

## ⚠️ Riscos da Refatoração — Pontos Críticos

### 🔴 Risco 1: Quebra do Anti-Popup Shield
O shield em `L330–354` **precisa ser o PRIMEIRO código executado** antes de qualquer outro módulo. Se for movido para um módulo separado carregado depois, os iframes de alguns canais podem disparar popups antes do shield estar ativo.

**Regra**: Manter o shield no `main.js` como primeira instrução, antes de qualquer import de módulo.

---

### 🔴 Risco 2: Referências de IDs do HTML no JavaScript
O `script.js` tem **~80+ chamadas** `getElementById()` e `querySelector()` espalhadas por todos os módulos. Se movermos código sem garantir que o DOM já foi construído, teremos `null reference errors` silenciosos.

**Regra**: Todos os módulos devem ser inicializados **dentro** do `DOMContentLoaded`, ou usar import dinâmico (lazy) ativado apenas quando a view correspondente for aberta.

---

### 🔴 Risco 3: Estado global compartilhado entre módulos
Variáveis como `activeChannel`, `channelsData`, `currentSelectedMovie`, `currentSelectedSeries`, `favorites`, `cachedScheduleFeed` são compartilhadas entre múltiplas funções de módulos diferentes. Ao separar em arquivos, precisam de um **store centralizado**.

**Abordagem segura**: Criar um `state.js` que exporta um objeto mutável centralizado, sem reescrever a lógica de nenhuma função existente.

---

### 🟠 Risco 4: Versioning de cache (query strings `?v=`)
O projeto usa versionamento manual nos `<script>` e `<link>`:
```html
<link rel="stylesheet" href="style.css?v=20261002_v7">
<script src="script.js?v=20261002_v7">
```
Ao fragmentar em múltiplos arquivos, precisa atualizar **todos** manualmente a cada release ou configurar hash automático.

---

### 🟠 Risco 5: Caminhos relativos de assets (logos)
Logos em `logos/` são referenciadas com paths relativos (`logos/globo.png`). Após mover para `assets/logos/channels/`, todos os caminhos no `CHANNEL_LOGOS` e no `index.html` precisam ser atualizados — qualquer logo esquecida vira ícone quebrado na UI.

---

### 🟡 Risco 6: `canais.json` e `proximos_jogos.json` movidos para `data/`
A requisição `fetch("canais.json?v=...")` usa caminho relativo. Se o arquivo mover para `data/canais.json`, precisa atualizar a URL do fetch no JS e o `_headers` do Cloudflare que referencia `/proximos_jogos.json` direto.

---

### 🟡 Risco 7: `globo.png` tem 544 KB — maior que o script inteiro
```
logos/globo.png = 544.391 bytes (544 KB!)
logos/globo.webp = 86.976 bytes (87 KB)
```
O WebP já existe mas não está sendo usado. Essa é uma regressão de performance que pode ser corrigida como parte da reorganização de assets.

---

## 📋 Plano de Refatoração em Fases

> [!IMPORTANT]
> A ordem das fases é crítica. Cada fase deve ter um deploy intermediário no Cloudflare Pages para validar antes de avançar. Nunca fazer toda a refatoração em um único commit.

### **Fase 0 — Limpeza (Sem risco de funcionalidade)**
- Mover `local_server.py` e `test_get_matches.py` para `tools/`
- Mover docs `.md` do root para `docs/`
- Adicionar `scratch/`, `__pycache__/`, `tools/` ao `.gitignore`
- Deletar pasta `scratch/` do repositório
- Sem impacto em nenhum arquivo servido pelo Cloudflare

### **Fase 1 — Reorganização de Assets (Baixo risco)**
- Mover logos para `assets/logos/channels/` e `assets/logos/fav/`
- Atualizar `CHANNEL_LOGOS` no `script.js`
- Atualizar paths do `index.html`
- Mover `canais.json` e `proximos_jogos.json` para `data/`
- Atualizar `fetch("canais.json")` → `fetch("data/canais.json")`
- Atualizar `_headers` para `/data/proximos_jogos.json`
- Trocar `logos/globo.png` → `logos/globo.webp` nos usos

### **Fase 2 — Fragmentação do CSS (Médio risco)**
- Separar `style.css` em módulos por responsabilidade
- Importar todos no `index.html` ou usar `@import` em ordem correta
- Validar visualmente todas as 6 views (Home, TV, Movies, Series, Animes, Sports)

### **Fase 3 — Fragmentação do JS (Alto risco — requer testes)**
- Criar `src/js/config.js` com todas as constantes globais
- Criar `src/js/state.js` com estado global compartilhado
- Extrair módulos em ordem de menor para maior dependência
- Usar `type="module"` no HTML e `import/export` nativo do browser
- Testar cada módulo individualmente antes de avançar para o próximo

### **Fase 4 — Segurança do Backend (Crítica)**
- Migrar `TMDB_API_KEY` para Environment Variable do Cloudflare (`context.env.TMDB_API_KEY`)
- Adicionar domain whitelist no `stream.js` (bloqueio de SSRF/Open Proxy)
- Restringir CORS origin no proxy para o domínio próprio
- Tornar o Referer dinâmico baseado no `request.url`
- Adicionar SRI hashes nas CDN tags do HTML

### **Fase 5 — Otimização Final (Opcional)**
- Considerar bundler leve (Vite) para hash automático e tree-shaking
- Converter logos PNG grandes para WebP onde ainda não feito
- Configurar Cloudflare Rate Limiting Rules para as functions

---

## 🏁 Resumo Executivo

| Área | Estado Atual | Severidade | Ação |
|---|---|---|---|
| API Key TMDB exposta | Hardcoded no bundle público | 🔴 Crítico | Mover para CF Environment Var |
| Proxy CORS aberto | Aceita qualquer domínio | 🟠 Alto | Whitelist de origins |
| Open Proxy / SSRF | Qualquer URL aceita | 🟠 Alto | Whitelist de domínios |
| Monolito JS 6.4k linhas | Um arquivo | 🟠 Alto | Fragmentar em ~13 módulos |
| Monolito CSS 3.2k linhas | Um arquivo | 🟡 Médio | Fragmentar em ~11 arquivos |
| Referer hardcoded | `.pages.dev` fixo | 🟡 Médio | Usar `request.url` dinâmico |
| Sem rate limiting | Functions expostas | 🟡 Médio | CF Rate Limiting Rules |
| Docs no root | Sem pasta | 🟡 Médio | Mover para `docs/` |
| Scripts Python no root | Sem pasta | 🟡 Médio | Mover para `tools/` |
| `scratch/` no repo | Commited por acidente | 🟡 Médio | Remove + gitignore |
| `globo.png` 544 KB | WebP disponível mas ignorado | 🟡 Médio | Trocar para `.webp` |
| Logos sem organização | 102 arquivos na raiz | 🟢 Baixo | Organizar em subpastas |
| CDN sem SRI | Hls.js e Artplayer | 🟢 Baixo | Adicionar integrity hash |
