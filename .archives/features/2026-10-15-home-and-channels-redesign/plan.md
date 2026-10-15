# Plan: Home and Live Channels Redesign (Item F6)

> Status: PLAN ONLY. Nothing implemented yet. Awaiting user approval.
> Goal: Bring the Home hub and Channels tab to the same premium, clean visual language as Movies, Series and Animes, removing outdated legacy elements (white square logo cards, fixed accordion sidebar, giant portal blocks, and the startup ad-block popup).

---

## 1. Objectives & Scope

### In Scope
1. **Ad-block Notice Cleanup:**
   - Eliminate the intrusive automatic startup pop-up (`openAdblockModal()` auto-timer after 600 ms and the 24-hour expiration check in `main.js`).
   - Retain the modal and manual access via the discreet footer link ("Dicas de Bloqueador & DNS").
2. **Design Tokens & Theme Harmony:**
   - Add the dedicated Sports tab accent token (`--accent-sports: #0ea5e9;` electric blue / cyan) in `01-base.css` without colliding with Movies (amber `#f59e0b`), Series (ruby `#f43f5e`), Animes (magenta `#ec4899`), or Channels (emerald `#10b981`).
   - Standardize all new cards and containers to reuse existing tokens (`--bg-surface`, `--bg-card`, `--border-subtle`, `--radius-lg`, `--font-heading`).
3. **Home Hub Transformation (Streaming Showcase):**
   - Replace the static text card and huge portal blocks with a dynamic, clean streaming layout.
   - **Hero Carousel (Option A):** Rotates 4-5 high-impact highlights across universes (1 hot Movie, 1 trending Series, 1 top Anime, 1 featured Live Channel/Match), each with its tab-themed category badge, metadata, overview, and direct action button ("Assistir Agora").
   - **"Continuar Assistindo" in Prime Spot:** Positioned immediately below the Hero with 16:9 backdrop cards, **real progress bar** (`position / duration * 100`), remaining time badge ("Faltam 14 min"), and instant single-click resume at the exact stored second.
   - **Integrated Discovery Rows:**
     - "Canais Ao Vivo em Destaque" (16:9 dark glass channel cards).
     - "Em Alta nos Filmes" (TMDB cached popular movies with 2:3 posters).
     - "Séries Mais Maratonadas" (TMDB cached popular series).
     - "Obras-Primas dos Animes" (TMDB/MAL cached anime favorites).
     - Each row includes a trailing "Ver Catálogo Completo" card directing straight to that tab.
   - **Compact Quick Portal Bar:** Replace the massive portal boxes with a sleek, horizontal strip of quick navigation capsules.
   - **Clean Utilities Footer:** Discreet strip for Adblock/DNS guide, favorite team picker, and app status.
4. **Live Channels Redesign (Hybrid Catalog + Quick Drawer):**
   - **Discard the White Square Boxes:** All channel logos rendered in 16:9 Dark Glass cards (`#121214` to `#18181b`), subtle brand glow, pulsing live dot, category tag, server count, and quick-favorite star button.
   - **Hybrid Navigation (Merging A & B):**
     - Full-width modern catalog page by default: "Ao Vivo Agora" Hero banner (featuring today's match / favorite team / headline live broadcast) + horizontal category pills bar ("Todos", "Favoritos", "TV Aberta", "Esportes", "Filmes & Séries", "Infantil", "Variedades & 24h") + Spotlight search + horizontal category rows.
     - **Quick Channel Drawer ("Guia Rápido"):** Sleek slide-out glass drawer accessible via a button in the toolbar AND inside the player view ("Trocar Canal"), allowing rapid zapping without leaving playback or cluttering the discovery screen.
     - Full Grid Explore View upon searching or selecting "Ver Todos".
5. **No Emojis Rule & Clean Code:**
   - 100% SVG line icons in the site's native style.
   - No commented-out dead code.

### Out of Scope (For Future Features)
- Replacing the channel search engine / fuzzy matcher (planned for a dedicated follow-up).
- Building the full Sports tab backend / multi-league calendar (item F7).
- Modifying video stream proxy resolution or edge functions.

---

## 2. Impacted Files

| File | Change Description |
|---|---|
| `assets/css/01-base.css` | Add `--accent-sports: #0ea5e9` and related utilities. |
| `assets/css/02-layout.css` | Refactor Home container styles, hero carousel, compact quick-portals, and footer strip. |
| `assets/css/03-channels.css` | Overhaul channel cards to 16:9 dark glass, category rows, live hero, and sleek quick drawer. |
| `assets/css/06-catalog.css` | Extend row and card utilities where shared between catalog, channels, and home. |
| `index.html` | Update markup for `#view-home` (dynamic hero, continue watching, rows, compact shortcuts) and `#view-tv` (hero, category pills toolbar, rows, explore view, drawer). |
| `assets/js/main.js` | Remove automatic adblock popup check (`checkAdblockNoticeStatus`); wire home initialization and leave hooks. |
| `assets/js/modules/series.js` | Update `renderHomeContinueWatching` to display real progress bar and remaining time formatting. |
| `assets/js/modules/channels.js` | Refactor channels UI renderer to build the live hero, category rows, quick drawer, and explore grid. |
| `assets/js/navigation/router.js` | Ensure clean leave/enter hooks for home and channels. |
| `tools/bump_version.py` | Version bump before validation. |

---

## 3. Step-by-Step Implementation Phases

### Phase 1: Foundation & Adblock Popup Deactivation
1. In `assets/js/main.js`:
   - Remove the automatic call `setTimeout(() => openAdblockModal(), 600)` and the 24h expiration trigger.
   - Keep `openAdblockModal()` and `setupAdblockModalHandlers()` attached to manual clicks on `#btn-home-adblock-shortcut` and any help button.
2. In `assets/css/01-base.css`:
   - Introduce `--accent-sports: #0ea5e9;` and `--accent-sports-hover: #38bdf8;`.
3. Stop and verify: verify with `tools/check_js.py` and ensure the site opens cleanly with zero popups.

### Phase 2: Home Screen (Vitrine de Streaming)
1. **Markup (`index.html` inside `#view-home`):**
   - Add `#home-hero-showcase`: container with background image wrapper, gradient overlays, category badge, title, metadata line, synopsis, CTA buttons ("Assistir Agora", "Mais Detalhes"), navigation arrows, and dots.
   - Restructure `#home-continue-watching-section`: place it directly below the Hero, using 16:9 cards with progress bar elements.
   - Add `#home-content-rows`: containers for "Ao Vivo Agora", "Filmes em Alta", "Séries Populares", and "Animes em Destaque".
   - Replace old portal cards with a compact, modern navigation capsule bar (`#home-quick-nav`).
   - Clean footer utility section (`#home-footer-utilities`).
2. **Logic & Rendering:**
   - In `assets/js/modules/series.js` (or helper module): enhance `renderHomeContinueWatching()` to calculate `pct = (position / duration) * 100` and remaining time string (`"Faltam ${min} min"`), rendering the progress fill bar and clicking directly into `openEpisode()` / resume.
   - Implement Home Hero auto-rotation (using existing `isBackgroundMediaAllowed('home')` from `activity.js` to avoid background cycles).
   - Render the trending rows reusing already cached TMDB items from `movies.js` and `series.js` (no new API rate-limit pressure).
3. **Styles (`02-layout.css` / `06-catalog.css`):**
   - Clean dark aesthetic, smooth transitions, mobile responsiveness (440px hero on mobile).
4. Stop and report verification.

### Phase 3: Channels Tab (Hybrid Discovery & 16:9 Dark Cards)
1. **Markup (`index.html` inside `#view-tv`):**
   - Introduce `#channels-hero`: live headline broadcast / favorite team match banner with dark atmospheric glow.
   - Add `#channels-nav-toolbar`: horizontal category pills ("Todos", "Favoritos", "TV Aberta", "Esportes", "Filmes & Séries", "Infantil", "Variedades & 24h") and Spotlight search box.
   - Add `#channels-discovery-feed`: container for categorized horizontal rows.
   - Add `#channels-explore-view`: grid view for search results and full category browsing.
   - Add `#channels-quick-drawer`: collapsible slide-out drawer for fast zapping during playback or on-demand.
2. **Channel Cards & Row Rendering (`assets/js/modules/channels.js`):**
   - Redesign card generator: 16:9 aspect ratio, dark gradient card base, centered crisp SVG/PNG logo with subtle glow, pulsing live dot, channel title, server count, and one-tap favorite button.
   - Render horizontal rows grouped by category (`sports`, `open`, `movies`, `kids`, etc.).
   - Support instant filtering via category pills and spotlight search.
3. **Styles (`03-channels.css`):**
   - Remove legacy white-box rules (`background: #ffffff;`).
   - Implement dark glassmorphism card styles, hover lift, glow, and drawer animations.
4. Stop and report verification.

### Phase 4: Proportional Verification & Polish
1. Run syntax validation: `python tools/check_js.py`.
2. Run cache bumper: `python tools/bump_version.py`.
3. Validate mobile responsiveness (390px viewport), tablet (768px), and desktop (1280px).
4. Verify D-pad / keyboard navigation through cards.
5. Confirm no emojis exist anywhere in modified markup.
6. Verify Chrome, Edge, and Firefox rendering.

---

## 4. Verification Table

| Test Case | Method | Expected Result |
|---|---|---|
| Adblock Popup Deactivated | Open homepage in browser | No popup appears. Page is interactive immediately. |
| Manual Adblock Modal | Click footer link "Dicas de Bloqueador & DNS" | Modal opens cleanly; "Entendi" closes it. |
| Home Hero Rotation | Observe homepage for 10s | Rotates through multi-category highlights; stops on hover. |
| Continue Watching Progress | Play an episode for 2 min, go home | Card shows 16:9 thumbnail, progress bar, and "Faltam X min". |
| Continue Watching Resume | Click continue watching card | Opens episode directly at the exact saved second. |
| Channels Dark 16:9 Cards | Navigate to Canais tab | No white boxes; sleek 16:9 cards with glow and live dots. |
| Category Pills Filter | Click "Esportes" or "TV Aberta" | Filters channels smoothly without full reload. |
| Quick Channel Drawer | Click "Guia Rápido" or "Trocar Canal" in player | Drawer slides in smoothly; selecting a channel plays it. |
| Mobile Layout | View at 390px width | Responsive hero, horizontal scroll rows, no horizontal overflow. |

---

## 5. Changelog & Micro-adjustments

### 2026-10-15 - Phase 1 (Completed)
- Removed automatic adblock modal timer (`setTimeout 600ms`) and 24h expiration in `assets/js/main.js`.
- Added `--accent-sports: #0ea5e9;` in `assets/css/01-base.css`.

### 2026-10-15 - Phase 2 (Completed)
- Implemented modern Home Hub with Streaming Showcase hero carousel in `assets/js/modules/home.js`.
- Added real progress bars and "Faltam X min" remaining time badges to Continue Watching rail in `assets/js/modules/series.js`.
- Created compact quick navigation strip and multi-universe discovery rows.

### 2026-10-15 - Phase 3 (Completed)
- Overhauled Live Channels tab (`#view-tv` in `index.html`):
  - Added Cinematic Live Hero (`#channels-hero`) with dynamic live broadcast presentation, emerald pulsing dot, and direct action triggers.
  - Added Sticky Navigation Toolbar (`#channels-nav-toolbar`) with category pills, spotlight search input, and quick drawer toggle.
  - Added Categorized Discovery Feed (`#channels-discovery-feed`) preserving `#vasco-matches-section` and rendering horizontal tracks (`#channels-category-rows`).
  - Added Full Explore Grid (`#channels-explore-view`) with search results/filtered counts and "Voltar aos Destaques".
  - Replaced legacy white logo boxes (`background: #ffffff;`) with 16:9 dark glass cards (`rgba(255, 255, 255, 0.05)` backdrop, hover lift, glow, live dot, server count, and favorite button).
  - Converted desktop fixed sidebar into an on-demand slide-out glass drawer (`#sidebar.channels-quick-drawer`) with backdrop and keyboard ESC support.
  - Fixed `logoHtml` reference to `logoLargeHtml` in `createChannel16x9Card`.
  - Added in-player "Trocar Canal" button to trigger quick drawer without leaving playback.
  - Automated tests verified in Chrome & Edge (9/9 checks passing).

### 2026-10-15 - Micro-adjustment: Channels Tab Vertical Scroll
- **What:** Removed legacy `body.view-tv-active { overflow: hidden; }` and `.app-layout { height: 100vh; overflow: hidden; }` from `assets/css/01-base.css` and set `height: auto; overflow-y: visible;` on `.app-layout` in `assets/css/03-channels.css`. Added automated scrollability verification to `tools/channels_redesign_check.mjs`.
- **Why:** The legacy code locked the browser window scroll when on the TV tab because the previous design used a fixed two-column desktop frame with internal overflow. In the modern redesign, the Channels tab is a full-width catalog page (like Movies and Series) requiring natural vertical page scrolling.
- **How:** Cleaned up `01-base.css` and `03-channels.css`. Verified in headless Chrome & Edge (10/10 checks passing, `scrollY: 350px` on a 2313px document).

### 2026-10-15 - Phase 4 (Completed)
- **Smart TV Remote / D-Pad Navigation:**
  - Updated `getFocusableElements` in `assets/js/navigation/remote.js` to include all new Home & Live Channels interactive elements (`#btn-home-hero-watch`, `.quick-nav-pill`, `.home-channel-card`, `#btn-channels-hero-watch`, `#btn-channels-hero-drawer`, `.channel-cat-pill`, `.channel-card-16x9`, `#btn-toolbar-open-drawer`, `#btn-open-drawer-player`, etc.).
  - Added TV Remote Escape/Back key handler to close the Quick Channel Drawer (`#sidebar.open`).
  - Added `:focus-visible` styling in `assets/css/03-channels.css` matching glow and elevation states for TV remotes.
- **Cache-Busting & Imports:**
  - Bumped version to `20261015_1045` with `python tools/bump_version.py` across all CSS/JS tags and imports.
  - Verified 0 missing imports via `python tools/check_js.py`.
- **Verification Suites:**
  - `tools/channels_redesign_check.mjs` (Chrome): 10/10 PASS.
  - `tools/channels_redesign_check.mjs` (Edge): 10/10 PASS.
  - `tools/player_touch_check.mjs`: 17/17 PASS.
  - D-pad spatial navigation check (`scratch/test_dpad_tv.mjs`): 100% PASS with 0 console errors.



