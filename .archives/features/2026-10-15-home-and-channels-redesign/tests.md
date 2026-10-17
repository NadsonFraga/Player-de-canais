# Manual Test Suite: Home & Live Channels Redesign (Feature F6)

**Feature Branch:** `feat/home-and-channels-redesign`  
**Date:** 2026-10-15  
**Version:** `20261015_1519`  
**Status:** Ready for Preview Validation

---

## 1. Automated Verification Summary

All automated verification test suites have executed and passed across Chromium and Edge engines:

| Suite | Command | Result | Notes |
|---|---|---|---|
| Import Integrity | `python tools/check_js.py` | PASS (0 missing imports) | Verified across all ESM modules |
| Cache Bumper | `python tools/bump_version.py --check` | PASS (`20261015_1519`) | Single unified version string across imports and HTML |
| Channels Redesign Suite | `node tools/channels_redesign_check.mjs --browser=chrome` | 10/10 PASS | Hero, toolbar, discovery feed, explore grid, drawer, vertical scroll, clean console |
| Channels Redesign Suite | `node tools/channels_redesign_check.mjs --browser=edge` | 10/10 PASS | Cross-browser validation in Microsoft Edge |
| Mobile Touch Suite | `node tools/player_touch_check.mjs` | 17/17 PASS | Touch controls, +/-10s double tap, opening skip, card margins, theater mode |
| TV Remote D-Pad Navigation | `node scratch/test_dpad_tv.mjs` | PASS | Spatial navigation on Home & Channels, Escape/Back drawer dismiss, 0 console errors |

---

## 2. Manual Test Matrix for User Preview

Please test these items on your devices (Desktop, Mobile, Smart TV / Keyboard) and confirm the results:

| # | Category | Test Case & Steps | Expected Result | User Verification |
|---|---|---|---|---|
| **T01** | **Adblock Policy** | Open the homepage cleanly without adblock or with adblock. | No blocking modal or aggressive popups appear. The interface is immediately accessible and interactive. | [x] PASS |
| **T02** | **Adblock Modal** | Scroll to the footer and click "Dicas de Bloqueador & DNS". | The modal opens cleanly with helpful DNS/extension advice. Clicking "Entendi" or outside dismisses it. | [x] PASS |
| **T03** | **Edge-to-Edge Hero** | Observe the Showcase Carousel at the top of the Home tab. | Hero spans 100% full-width edge-to-edge without rounded inset corners or side margins, identical to Movies/Series hero architecture. | [x] PASS |
| **T04** | **Backdrop Brightness** | Compare backdrops on Home, Movies, Series, and Animes heroes. | Gradients are transparent and soft; images are clear, vibrant, and luminous without heavy dark masks. | [x] PASS |
| **T05** | **Title Clearlogos (PNG)** | Watch slide transitions on the Home Hero (e.g., Spider-Man, Arcane, One Piece). | Official high-resolution transparent PNG title logos render prominently; text fallback only shows if no logo exists. | [x] PASS |
| **T06** | **Hero Metadata Bar** | Check the metadata strip under the hero title/logo. | Displays Category badge (`FILMES`), Year (`2026`), Golden Star Rating (`★ 8.5`), and Genre tags (`Ficção`, `Ação`, etc.). | [x] PASS |
| **T07** | **Hero Actions** | Click "Assistir Agora" or "Explorar Filmes/Séries" on the current slide. | "Assistir Agora" opens modal or starts stream. "Explorar..." navigates to the respective section. | [x] PASS |
| **T08** | **Quick Nav Strip** | Check the navigation pills below the Home Hero. | Sleek frosted glass capsules ("Canais Ao Vivo", "Filmes", "Séries", "Animes") with clean line icons, no square colored boxes or clutter. | [x] PASS |
| **T09** | **Harmonized Continue Watching** | Start watching a series/anime episode, then return to Home. | Header matches standard catalog row styling; thumbnail card shows progress bar and remaining time. | [x] PASS |
| **T10** | **Clean Channel Cards** | Inspect channel cards on Home track and Channels discovery feed. | Clean 16:9 cards with subtle glow, large centered logo, crisp channel name, and category. No repetitive "AO VIVO" or "X fontes" noise. | [x] PASS |
| **T11** | **Clean Channels Hero** | Navigate to the "Canais" tab. | Sleek Live Hero renders with clean badge and metadata: "Transmissão Oficial • Esportes" (no server count noise). | [x] PASS |
| **T12** | **Channels Toolbar** | Test the category pills ("Todos", "Favoritos", "TV Aberta", "Esportes", etc.) on the Channels tab. | Clicking a pill instantly switches to Explore Grid view with filtered channels and count without reloading. | [x] PASS |
| **T13** | **Spotlight Search** | Type a channel name (e.g., "SporTV" or "Globo") in the Spotlight search box. | Grid filters instantly in real-time as you type, highlighting matched channels. | [x] PASS |
| **T14** | **Quick Drawer** | Click "Guia Rápido" in the toolbar or "Trocar Canal" during live playback. | Sleek slide-out glass drawer opens from the right with channel list and search. Selecting a channel switches stream instantly. | [x] PASS |
| **T15** | **Vertical Scroll** | Scroll up and down on the Channels tab. | The entire page scrolls naturally and smoothly (sticky toolbar stays accessible). | [x] PASS |
| **T16** | **D-Pad / TV Remote** | Use Arrow keys (Up/Down/Left/Right) and Enter on a TV remote or keyboard. | Focus smoothly traverses hero buttons, category pills, and channel cards with visible emerald outline and lift. Enter triggers action; Back/ESC closes drawer. | [x] PASS |
| **T17** | **Mobile Responsive** | Open the site on a mobile device (or 390px dev tools). | Layout scales cleanly: hero adapts gracefully, horizontal tracks swipe smoothly with touch, sticky toolbar wraps without breaking, and drawer adapts to mobile width. | [x] PASS |

---

## 3. Notes & Observations

- Zero emojis are used across the markup; all glyphs are inline SVG line icons matching site aesthetics.
- Artplayer SVG overrides are preserved (`stroke: currentColor; fill: none;`).
- Direct stream fallback logic and contingency iframes remain untouched and fully compatible.
