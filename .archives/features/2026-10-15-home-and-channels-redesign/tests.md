# Manual Test Suite: Home & Live Channels Redesign (Feature F6)

**Feature Branch:** `feat/home-and-channels-redesign`  
**Date:** 2026-10-15  
**Version:** `20261015_1045`  
**Status:** Ready for Preview Validation

---

## 1. Automated Verification Summary

All automated verification test suites have executed and passed across Chromium and Edge engines:

| Suite | Command | Result | Notes |
|---|---|---|---|
| Import Integrity | `python tools/check_js.py` | PASS (0 missing imports) | Verified across all ESM modules |
| Cache Bumper | `python tools/bump_version.py --check` | PASS (`20261015_1045`) | Single unified version string across imports and HTML |
| Channels Redesign Suite | `node tools/channels_redesign_check.mjs --browser=chrome` | 10/10 PASS | Hero, toolbar, discovery feed, explore grid, drawer, vertical scroll, clean console |
| Channels Redesign Suite | `node tools/channels_redesign_check.mjs --browser=edge` | 10/10 PASS | Cross-browser validation in Microsoft Edge |
| Mobile Touch Suite | `node tools/player_touch_check.mjs` | 17/17 PASS | Touch controls, +/-10s double tap, opening skip, card margins, theater mode |
| TV Remote D-Pad Navigation | `node scratch/test_dpad_tv.mjs` | PASS | Spatial navigation on Home & Channels, Escape/Back drawer dismiss, 0 console errors |

---

## 2. Manual Test Matrix for User Preview

Please test these items on your devices (Desktop, Mobile, Smart TV / Keyboard) and confirm the results:

| # | Category | Test Case & Steps | Expected Result | User Verification |
|---|---|---|---|---|
| **T01** | **Adblock Policy** | Open the homepage cleanly without adblock or with adblock. | No blocking modal or aggressive popups appear. The interface is immediately accessible and interactive. | [ ] Pending |
| **T02** | **Adblock Modal** | Scroll to the footer and click "Dicas de Bloqueador & DNS". | The modal opens cleanly with helpful DNS/extension advice. Clicking "Entendi" or outside dismisses it. | [ ] Pending |
| **T03** | **Home Hero** | Observe the Showcase Carousel at the top of the Home tab. | Displays multi-category highlights (movies, series, channels). Auto-rotates every few seconds and pauses when hovered. Arrow buttons and indicator dots work. | [ ] Pending |
| **T04** | **Home Hero Actions** | Click "Assistir Agora" or "Explorar Mais" on the current slide. | "Assistir Agora" launches playback or opens the content details modal. "Explorar Mais" navigates to the respective section. | [ ] Pending |
| **T05** | **Continue Watching** | Watch an episode of a series/anime for >30 seconds, then return to Home. | The Continue Watching card appears with 16:9 thumbnail, progress bar, episode numbering, and remaining time badge ("Faltam X min"). Clicking it resumes at the exact second. | [ ] Pending |
| **T06** | **Home Discovery** | Scroll down the Home tab. | Rows for "Canais Ao Vivo", "Filmes em Alta", "Séries Populares", and "Animes" render cleanly with smooth horizontal scrolling. | [ ] Pending |
| **T07** | **Channels Hero** | Navigate to the "Canais" tab. | Sleek Live Hero renders at the top with glowing atmospheric background, emerald pulsing live dot, channel metadata, and "Assistir Transmissão" action. | [ ] Pending |
| **T08** | **Channels Toolbar** | Test the category pills ("Todos", "Favoritos", "TV Aberta", "Esportes", etc.) on the Channels tab. | Clicking a pill instantly switches to the Explore Grid view, showing filtered channels with count without any page reload. | [ ] Pending |
| **T09** | **Spotlight Search** | Type a channel name (e.g., "SporTV" or "Globo") in the Spotlight search box. | Grid filters instantly in real-time as you type, highlighting matched channels. | [ ] Pending |
| **T10** | **Discovery Feed** | In the Channels tab, click "Voltar aos Destaques". | Returns smoothly to the Discovery Feed with Vasco match banners (if available) and categorized horizontal tracks. | [ ] Pending |
| **T11** | **Card Aesthetics** | Inspect the channel cards on both Home and Channels tabs. | 16:9 aspect ratio, dark glass background (`rgba(255, 255, 255, 0.05)`), subtle emerald hover glow, crisp centered logo (no white boxes), live dot, and server counter. | [ ] Pending |
| **T12** | **Favorites Toggle** | Click the heart icon on any channel card. | Heart fills and channel is instantly added to "Favoritos". Clicking the "Favoritos" pill shows the favorited channels. | [ ] Pending |
| **T13** | **Quick Drawer** | Click "Guia Rápido" in the toolbar or "Trocar Canal" in the player toolbar during playback. | Sleek slide-out glass drawer opens from the right with channel list and search. Selecting a channel switches stream instantly without leaving player view. | [ ] Pending |
| **T14** | **Drawer Dismissal** | Press Escape, the Close button (X), or click the backdrop. | Drawer closes smoothly and returns focus to the previous element. | [ ] Pending |
| **T15** | **Vertical Scroll** | Scroll up and down on the Channels tab. | The entire page scrolls naturally and smoothly (sticky toolbar stays accessible). | [ ] Pending |
| **T16** | **D-Pad / TV Remote** | Use Arrow keys (Up/Down/Left/Right) and Enter on a TV remote or keyboard. | Focus smoothly traverses hero buttons, category pills, and channel cards with visible emerald outline and lift. Enter triggers action; Back/ESC closes drawer. | [ ] Pending |
| **T17** | **Mobile Responsive** | Open the site on a mobile device (or 390px dev tools). | Layout scales cleanly: hero adapts gracefully, horizontal tracks swipe smoothly with touch, sticky toolbar wraps without breaking, and drawer adapts to mobile width. | [ ] Pending |

---

## 3. Notes & Observations

- Zero emojis are used across the markup; all glyphs are inline SVG line icons matching site aesthetics.
- Artplayer SVG overrides are preserved (`stroke: currentColor; fill: none;`).
- Direct stream fallback logic and contingency iframes remain untouched and fully compatible.
