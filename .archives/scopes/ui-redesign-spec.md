# UI/UX Redesign Specification: Modern Emerald & Obsidian Dark Mode

## 1. Executive Summary & Aesthetic Goal
Transition the TV player UI from a generic AI blue/purple theme with unstructured emoji usage to a high-end, streaming-grade Dark Mode (reminiscent of Spotify, Kick, and premium IPTV applications).

### Core Pillars:
- **Palette**: Deep Obsidian Charcoal (`#090c0b`, `#0f1412`, `#141a17`) paired with Emerald Green accents (`#10b981`, `#059669`).
- **Surface & Borders**: Solid dark surfaces with hairline borders (`1px solid rgba(255, 255, 255, 0.07)`).
- **Total Emoji Eradication**: Replace all UI emojis (`📺`, `⚽`, `📡`, `⭐`, `☆`, `💢`, `⚡`, `🔴`, `🔍`, `🛡️`) with clean, lightweight 1.5px/1.75px vector SVGs.
- **Subtle Micro-Interactions**: Controlled hover translations, hairline active indicators, and refined contrast typography.

---

## 2. Emoji Eradication & Monochromatic SVG Mapping

### 2.1 Centralized SVG System (`script.js` & `index.html`)
To maintain consistency and maintainability, introduce an SVG symbol registry / helper `getUiSvg(name, size = 16)`:

| Component | Current Emoji | New SVG Icon Design | Usage |
| :--- | :--- | :--- | :--- |
| **TV Aberta Category** | `📺` | `<svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>` | Sidebar category accordion header |
| **Esportes Category** | `⚽` | `<svg viewBox="0 0 24 24"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"/><path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>` | Sidebar category accordion header |
| **Default Category** | `📡` | `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>` | Fallback category header |
| **Favorites Pill / Button** | `⭐` / `☆` | `<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>` | Filled emerald/gold when active; outline when inactive |
| **Matches Header** | `💢` | `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>` | Vasco Match Schedule section header |
| **Section Titles** | `⚡` | Removed from typography. Replaced by clean font weighting & optional subtle grid SVG `<rect x="3" y="3" width="7" height="7"/>...` | "Todos os Canais", "Opções de Player & Servidores" |
| **Live Status** | `🔴` / pulse | Native CSS `<span class="live-badge"><span class="live-dot"></span> AO VIVO</span>` | Emerald or muted red pulsating indicator with zero layout shift |
| **Player Tip Note** | `🛡️` | `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>` | Stream fallback tip box |
| **Empty Searches** | `🔍` / `⚽` | `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>` | Clean SVG empty-state placeholders |

---

## 3. Design Tokens & CSS Architecture (`style.css`)

### 3.1 Color Palette Overhaul
```css
:root {
    /* Obsidian & Charcoal Surfaces */
    --bg-base: #090c0b;
    --bg-sidebar: #0f1412;
    --bg-surface: #141a17;
    --bg-surface-elevated: #19221e;
    --bg-surface-hover: #1f2c25;
    --bg-card: rgba(20, 26, 23, 0.85);
    --bg-glass: rgba(15, 20, 18, 0.88);

    /* Emerald Green Accents */
    --accent-emerald: #10b981;
    --accent-emerald-hover: #059669;
    --accent-emerald-subtle: rgba(16, 185, 129, 0.12);
    --accent-emerald-glow: rgba(16, 185, 129, 0.22);
    --accent-emerald-border: rgba(16, 185, 129, 0.35);

    /* Secondary Status Accents */
    --accent-red: #ef4444;
    --accent-red-subtle: rgba(239, 68, 68, 0.15);
    --accent-gold: #f59e0b;

    /* Hairline Borders */
    --border-subtle: rgba(255, 255, 255, 0.07);
    --border-medium: rgba(255, 255, 255, 0.12);
    --border-hover: rgba(16, 185, 129, 0.35);
    --border-focus: rgba(16, 185, 129, 0.6);

    /* Typography Hierarchy */
    --text-primary: #f3f4f6;
    --text-secondary: #9ca3af;
    --text-muted: #6b7280;
    --text-inverse: #090c0b;

    /* Shadows & Effects */
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.4);
    --shadow-md: 0 4px 14px rgba(0, 0, 0, 0.5);
    --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.7);
    --shadow-emerald: 0 0 16px var(--accent-emerald-glow);
}
```

---

## 4. Component Harmonization

### 4.1 Sidebar & Navigation
- **Sidebar Background**: `--bg-sidebar` (`#0f1412`) with a single hairline border on the right (`rgba(255, 255, 255, 0.07)`).
- **Active Channel Button**:
  - Remove diffuse blue glow.
  - Implement a clean 2px left border in `--accent-emerald` (`border-left: 2px solid var(--accent-emerald)`).
  - Subtle background tint `rgba(16, 185, 129, 0.08)`.
  - Channel name switches to `#f3f4f6` with font-weight 600.
- **Category Headers**: Monochromatic SVG icons on the left, subtle rotate chevron on the right.
- **Filter Pills**: Active pill receives a solid or subtle emerald outline (`background: var(--accent-emerald); color: var(--text-inverse);` or obsidian pill with emerald border).

### 4.2 Vasco Match Schedule Module
- **Section Header**: Calendar/clock vector SVG instead of `💢`. Monochromatic title: `Agenda de Jogos • Vasco da Gama`.
- **Match Cards**:
  - Background: Solid dark glassmorphism (`--bg-card`) with hairline border.
  - **1st Card (Featured Match)**:
    - Remove multicolored gradient line and harsh glow.
    - Replace with an elegant 1px hairline border in `var(--accent-emerald-border)`.
    - Compact status badge: `PRÓXIMO JOGO` with `--accent-emerald-subtle` background and `--accent-emerald` text.
  - **Match Status**:
    - `HOJE`: Muted red border with subtle live dot.
    - `AMANHÃ`: Emerald tint pill.
  - **Broadcast Pills ("Onde Assistir")**:
    - Non-playable: Neutral obsidian pill (`background: rgba(255, 255, 255, 0.05); color: var(--text-secondary); border: 1px solid var(--border-subtle)`).
    - Playable (e.g. Premiere / SporTV): Sleek emerald pill (`background: var(--accent-emerald-subtle); color: #34d399; border: 1px solid var(--accent-emerald-border); cursor: pointer`). On hover, smoothly transitions to filled emerald with dark text.

### 4.3 Channel Quick Grid Cards
- **Card Background**: Clean elevated obsidian (`#141a17`) with `1px solid var(--border-subtle)`.
- **Card Hover**: Soft upward translation (-3px) and hairline emerald border (`var(--border-hover)`).
- **Action Link ("Assistir")**: Switches from blue arrow to emerald highlight (`color: var(--accent-emerald)`).

### 4.4 Player View & Server Selector
- **Video Stage**: Deep obsidian framing with a crisp 1px hairline border.
- **Active Server Button (`.btn-server-option.active`)**:
  - Replaces electric blue with solid `--accent-emerald` background and dark inverse text (`#090c0b`), delivering immediate visual clarity and high contrast.
  - Non-active server buttons remain in neutral `--bg-surface` with subtle hover border.
- **Stream Tips Note**: Monochromatic SVG info/shield icon with clean gray text.
- **Player Reload / Popout Buttons**: Styled consistently with neutral obsidian buttons and emerald hover highlights.

---

## 5. Execution Strategy & Verification Plan

1. **Step 1: Style Tokens & CSS Refactor (`style.css`)**
   - Update CSS variables in `:root` with the Emerald & Obsidian palette.
   - Refactor sidebar active channel, filter pills, server buttons, live indicators, and card hovers.
2. **Step 2: Markup Cleaning (`index.html`)**
   - Remove emojis from static header, hero, filter pills, and section headings.
   - Inject inline SVG vectors with consistent `stroke-width="1.75"`.
3. **Step 3: Script & Dynamic Template Cleaning (`script.js`)**
   - Implement `getUiSvg(iconName)` helper.
   - Replace emojis in category icons, favorite toggles, server titles, tip notes, and match card templates.
4. **Step 4: Visual Validation**
   - Verify layout and contrast across all screens on local server (`http://localhost:8085`).
   - Validate that channel selection, favorite toggle, and match card deep links function without regressions.
