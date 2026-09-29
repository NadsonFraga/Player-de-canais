# Implementation Plan: Dynamic Multi-Team Match Tracking

## 1. Context & Business Logic
The match tracking module will transition from a hardcoded single-club layout (Vasco) to a dynamic, user-selectable multi-club system supporting the 20 clubs of the Brazilian Série A and the Brazilian National Team (`brasil`).

### Core Rules:
1. **No Default Club**: By default, no team is selected (`localStorage.getItem('tvzinha_favorite_team') === null`).
2. **Non-Intrusive UX**: No automatic popups or navigation blocking.
3. **Friendly Unselected State**: If no team is selected, the matches section renders a sleek Emerald & Obsidian invitation card inviting the user to pick their club.
4. **Instant Switch & Persistence**: Once a club is picked, it is saved to `localStorage` (`tvzinha_favorite_team`) and immediately renders the fixtures without reloading. An "Alterar time" button remains in the header.
5. **No "Cartola"**: Cartola is strictly omitted from broadcast pills.
6. **Aggressive Cache Busting**: Protected by Cloudflare Pages `_headers` and client-side timestamp query parameters.

---

## 2. Architecture & File Manifest

### Files to Create:
- `_headers`: Directs Cloudflare Pages edge servers to never cache `proximos_jogos.json`.
- `docs/DESIGN_SYSTEM.md`: Source of truth for tokens, SVG standards, and components.

### Files to Update:
- `scripts/test_get_matches.py`: Production multiteam scraping pipeline (21 teams, resilient `try/except`, rate-limit delay of 1.2s, exclusion of "Cartola").
- `index.html`: Team selection modal markup and accessible trigger buttons.
- `style.css`: Modal styling, club selection grid, and the unselected invitation hero card.
- `script.js`: State management (`favoriteTeam`), invitation state rendering, fixture carousel dynamic population, and modal search filter.

---

## 3. Step-by-Step Implementation Breakdown

### Phase 1: Data Pipeline & Cloudflare Edge Rules
1. **Cloudflare `_headers`**:
   - Path rule: `/arquivos/proximos_jogos.json`
   - Headers: `Cache-Control: no-cache, no-store, must-revalidate` and `CDN-Cache-Control: no-store`.
2. **Refactor `scripts/test_get_matches.py`**:
   - Update dictionary of 21 teams with verified endpoints (Athletico-PR, Bragantino, Cuiabá, Seleção, etc.).
   - Implement clean source filtering: discard `Cartola` and normalize `sportv` -> `SporTV`, `Prime Vídeo` -> `Prime Video`, `globoplay` -> `Globo`.
   - Output structured JSON to `arquivos/proximos_jogos.json`:
     ```json
     {
       "updatedAt": "ISO_TIMESTAMP",
       "teams": {
         "flamengo": { "name": "Flamengo", "matches": [...] },
         "vasco": { "name": "Vasco", "matches": [...] }
       }
     }
     ```

### Phase 2: User Interface & Modal (`index.html` & `style.css`)
1. **Team Selection Modal (`#team-select-modal`)**:
   - High-contrast modal adhering to `--bg-surface-elevated` and `--border-medium`.
   - Header with title: *"Escolha seu Time do Coração"*, close button (SVG `close`), and instant search input (`#team-search-input`).
   - Responsive grid of club badges: each item displays club crest (SVG), club name, and active check indicator.
2. **Invitation State (When No Club is Selected)**:
   - Modern glassmorphism invitation card inside `.vasco-matches-section`:
     - Centered calendar/trophy icon in `--accent-emerald-subtle`.
     - Heading: *"Acompanhe os Jogos do seu Time"*.
     - Subtitle: *"Selecione seu clube favorito para ver as datas, horários e canais de transmissão ao vivo."*
     - Button: `[SVG Troféu] Escolher meu time` (triggers modal).

### Phase 3: Logic, Filtering & Storage (`script.js`)
1. **State Handler**:
   - `getFavoriteTeam()`: reads `localStorage.getItem('tvzinha_favorite_team')`. Returns `null` if unselected.
   - `setFavoriteTeam(teamId)`: persists choice and triggers dynamic re-render.
2. **Rendering Flow**:
   - If `favoriteTeam === null`:
     - Render the sleek invitation card with CTA.
   - If `favoriteTeam !== null`:
     - Render header: *"Próximos Jogos • [Club Name]"* with `[Alterar time]` button.
     - Render match cards with badge, date/time, and validated broadcast pills.
     - If matches list is empty (`[]`): render empty state *"Nenhum jogo agendado para [Club Name] nos próximos dias"*.
3. **Modal Search Logic**:
   - Live character-by-character filtering across club names.

---

## 4. Quality Assurance & Rollout Checklist
- [ ] Verify fresh load with cleared `localStorage` displays unselected invitation state smoothly.
- [ ] Verify modal opens and closes via button, backdrop click, and `Escape` key.
- [ ] Verify selecting a club updates header, badge, and fixtures immediately without full page reload.
- [ ] Verify `F5` reload remembers the chosen club.
- [ ] Verify zero occurrences of "Cartola" in any match card.
- [ ] Verify all broadcast pills link to the appropriate active channel/stream.
- [ ] Clean up temporary files in `TEST/`.
