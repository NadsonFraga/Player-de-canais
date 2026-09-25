# Vasco Match Schedule Module - Technical Planning & Specification

## 1. Executive Summary & Objective
Implement an interactive match schedule widget for CR Vasco da Gama within the web TV player home screen, displaying the next 4 upcoming matches extracted from Globo Esporte (`ge.globo.com`).

---

## 2. Phase 1 - PoC Extraction & Verification (COMPLETED)
- **Script**: [scripts/test_get_matches.py](file:///c:/Users/ratew/OneDrive/Área de Trabalho/PESSOAL/CODE/ANTIGRAVITY/PROJETO1%20-%20TV/scripts/test_get_matches.py) (Pure Python 3.14 standard library).
- **Extracted Data**: Saved in [arquivos/proximos_jogos.json](file:///c:/Users/ratew/OneDrive/Área de Trabalho/PESSOAL/CODE/ANTIGRAVITY/PROJETO1%20-%20TV/arquivos/proximos_jogos.json).
- **Features Tested**:
  1. Header spoofing with desktop `User-Agent`.
  2. Balanced brace extractor for `scheduleTeam: { ... }` bypassing unquoted root object keys.
  3. Safe dictionary navigation for optional fields (`location`, `phase`, `liveWatchSources`).
  4. Temporal cutoff filter (`match_date >= Today - 1 day`).
  5. Sliced to the next 4 matches.

---

## 3. Phase 2 - Home Screen UI Architecture & Detailed Specification

### 3.1 Layout & Placement
- **Location**: Inside `.welcome-screen`, situated directly between `.welcome-hero` and `.quick-channels-section`.
- **Container**: `<section class="vasco-matches-section" id="vasco-matches-section">`.
- **Visual Flow**:
  1. Welcome Hero Header (Existing).
  2. **Vasco Matches Showcase (NEW)**: Immediate visual attraction for upcoming fixtures.
  3. All Channels Quick Grid (Existing).

### 3.2 Visual Design System & Aesthetics
- **Theme**: Dark glassmorphism (`--bg-surface-elevated`, `rgba(26, 32, 44, 0.75)`, blur, subtle borders).
- **Color Accent**: Vasco Maltese cross aesthetic + subtle neon blue/amber cues for match status.
- **Card Differentiation**:
  - **Featured Card (Match 1)**: Distinctive gradient border or glowing badge (`PRÓXIMO JOGO`) to draw immediate eye focus.
  - **Upcoming Cards (Matches 2-4)**: Compact, balanced cards with hover micro-interactions (translate-Y -4px, shadow-glow).

### 3.3 Card Anatomy & Component Structure
Each match card contains 4 distinct tiers:

1. **Card Header**:
   - Championship pill (e.g. `Brasileirão`, `Copa Sul-Americana`).
   - Match Date & Time with calendar/clock glyphs (e.g., `Qua, 07/10 • 20:30`).
   - Live / Proximity Badge: If match is today (`HOJE`) or tomorrow (`AMANHÃ`), an animated pulse badge appears.

2. **Card Core (The Face-off / Versus)**:
   - **Home Team**: High-res SVG badge (`badgeSvg`) + bold popular name.
   - **VS Center Badge**: Glassmorphic badge with glow effect.
   - **Away Team**: High-res SVG badge (`badgeSvg`) + bold popular name.

3. **Venue & Stadium**:
   - Location icon + Stadium name (e.g., `São Januário`, `Nilton Santos`).

4. **Broadcast & Interactive Channel Routing ("Onde Assistir")**:
   - Badges for each broadcaster in `ondeAssistir` (e.g. `Premiere`, `Sportv`, `Prime Vídeo`, `Paramount+`).
   - **Smart Channel Linking**: If the broadcaster matches an available channel in `canais.json` (such as `Premiere` or `SporTV`), the badge becomes an interactive action button (`▶ Assistir no Premiere`). Clicking it launches the player directly with that channel loaded!
   - If the broadcaster is an external streaming service (e.g. `Prime Vídeo`, `Paramount+`), it renders as an informative badge.

### 3.4 State Handling
- **Loading State**: Shimmering skeleton cards rendered before data loads.
- **Error / Empty State**: Fallback card with a retry button if `proximos_jogos.json` fails to load.
- **Empty Broadcast State**: Displays `"Transmissão a confirmar"` when `ondeAssistir` is empty.

---

## 4. Code Implementation Plan

### 4.1 `index.html`
- Insert `<section class="vasco-matches-section" id="vasco-matches-section">` in `.welcome-screen`.
- Add initial skeleton placeholders for instant visual feedback on page load.

### 4.2 `script.js`
- Define `fetchAndRenderVascoMatches()`:
  - Fetches `arquivos/proximos_jogos.json`.
  - Parses date strings to friendly Brazilian Portuguese dates (`Qua, 07/10`, `Sáb, 10/10`).
  - Checks if `ondeAssistir` entries match existing channels in `channelsData`.
  - Injects cards into `#vasco-matches-section`.
  - Attaches click listeners on channel badges to invoke `selectChannel(category, channelName, players)`.
- Wire `fetchAndRenderVascoMatches()` into `renderHomeView()` so it stays updated when returning home.

### 4.3 `style.css`
- Implement styling for:
  - `.vasco-matches-section`: section container, heading with Vasco badge, responsive grid (`grid-template-columns: repeat(auto-fit, minmax(270px, 1fr))`).
  - `.match-card`: glassmorphism background, subtle border, smooth hover lift.
  - `.match-card.featured`: highlight border, gold accent for the immediate upcoming fixture.
  - `.match-teams`: flex alignment, badge images sizing (42x42px), crisp contrast.
  - `.broadcast-pill`: sleek broadcast tag, with `.broadcast-pill.playable` showing play glyph and hover glow.
  - Mobile responsiveness: horizontal scroll on narrow mobile screens for effortless swiping.

---

## 5. Acceptance & Verification Steps
1. Verify layout across Desktop (1920px, 1440px), Tablet (768px), and Mobile (375px).
2. Validate that clicking a playable broadcast badge (e.g., `Premiere`) opens the TV player with the Premiere stream active.
3. Validate that returning to the home screen via the top-left logo re-renders the match widget cleanly.
