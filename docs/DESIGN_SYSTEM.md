# Tvzinha Design System & Architectural Guide

## 1. Design Philosophy: Obsidian & Emerald
Tvzinha employs a refined, streaming-grade Dark Mode aesthetic inspired by Spotify, Kick, and high-end IPTV interfaces. The visual language strictly avoids saturated neon gradients and artificial AI styling in favor of deep obsidian surfaces, hairline borders, and emerald accents.

---

## 2. Design Tokens (`style.css`)

### 2.1 Surfaces & Backgrounds
| Token | Value | Semantic Role |
| :--- | :--- | :--- |
| `--bg-base` | `#090c0b` | Root viewport canvas background |
| `--bg-sidebar` | `#0f1412` | Navigation sidebar and persistent left rails |
| `--bg-surface` | `#141a17` | Cards, panels, and inner containers |
| `--bg-surface-elevated` | `#19221e` | Modals, elevated dropdowns, and flyouts |
| `--bg-surface-hover` | `#1f2c25` | Interactive element hover states |
| `--bg-card` | `rgba(20, 26, 23, 0.85)` | Glassmorphism match and channel cards |
| `--bg-glass` | `rgba(15, 20, 18, 0.88)` | Backdrop filters and blurred navigation bars |

### 2.2 Accent Palette (Emerald Accentuation)
| Token | Value | Semantic Role |
| :--- | :--- | :--- |
| `--accent-emerald` | `#10b981` | Primary interactive accent, active pills, live indicators |
| `--accent-emerald-hover` | `#059669` | Pressed and hovered primary CTAs |
| `--accent-emerald-subtle` | `rgba(16, 185, 129, 0.12)`| Soft badge fills, match card highlights |
| `--accent-emerald-glow` | `rgba(16, 185, 129, 0.22)`| Hairline outline glows and focus rings |
| `--accent-emerald-border` | `rgba(16, 185, 129, 0.35)`| Active container borders and featured tags |

### 2.3 Status & Functional Colors
| Token | Value | Semantic Role |
| :--- | :--- | :--- |
| `--accent-red` | `#ef4444` | Live broadcasts, error states, and critical alerts |
| `--accent-red-subtle` | `rgba(239, 68, 68, 0.15)` | Background pill for active live streams |
| `--accent-gold` | `#f59e0b` | Starred favorites and high-priority fixtures |

### 2.4 Borders & Dividers
| Token | Value | Description |
| :--- | :--- | :--- |
| `--border-subtle` | `rgba(255, 255, 255, 0.07)`| Hairline card and divider borders |
| `--border-medium` | `rgba(255, 255, 255, 0.12)`| Input controls, active separators |
| `--border-hover` | `rgba(16, 185, 129, 0.35)`| Interactive card hover perimeter |
| `--border-focus` | `rgba(16, 185, 129, 0.60)`| Keyboard accessibility outline |

### 2.5 Typography Hierarchy
* **Primary Font**: Inter / Roboto / System UI font-family stack.
* `--text-primary`: `#f3f4f6` (Headings, titles, high contrast data).
* `--text-secondary`: `#9ca3af` (Metadata, stadium info, subtitles).
* `--text-muted`: `#6b7280` (Hints, placeholders, timestamps).
* `--text-inverse`: `#090c0b` (Text over solid emerald badges).

---

## 3. Strict Iconography Standards: Zero Emoji Policy

All visual symbols MUST be lightweight, accessible SVG paths rendered with consistent stroke geometries:
* `stroke-width`: `1.75px` or `2.0px`.
* `stroke-linecap`: `round`.
* `stroke-linejoin`: `round`.
* `fill`: `none` (unless filled star/badge).
* Emojis (`⚽`, `📺`, `💢`, `⭐`, `🔴`) are **strictly prohibited** in UI components.

### 3.1 Centralized SVG Registry (`getUiSvg`)
Key application icons registered in `script.js`:
- `calendar`: Upcoming match schedules.
- `trophy`: Competitions, leagues, and championship badges.
- `search`: Channel filter and club search inputs.
- `close`: Modal dismiss and active filter clearance.
- `star` / `star-filled`: Favorite channel toggle.
- `external`: External stream launchers.
- `refresh`: Schedule refresh trigger.

---

## 4. UI Patterns & Component Guidelines

### 4.1 Modals & Drawers
* **Backdrop**: `rgba(0, 0, 0, 0.75)` with `backdrop-filter: blur(8px)`.
* **Surface**: Centered dialog utilizing `--bg-surface-elevated` and `--border-medium`.
* **Transitions**: Smooth scale-in (`transform: scale(0.96)` to `scale(1)`) over `200ms cubic-bezier(0.16, 1, 0.3, 1)`.
* **Dismissibility**: Accessible via `Escape` key, backdrop click, or close button.

### 4.2 Empty States & Invitations (Friendly Unselected State)
* Unselected states must never appear broken or empty.
* Must feature an obsidian card container with a subtle emerald SVG illustration, clear call-to-action text, and a prominent button to trigger selection.

### 4.3 Match Cards & Carousels
* Responsive card layout (`min-width: 280px`).
* First/featured match receives a delicate 1px `--accent-emerald-border`.
* Broadcast sources displayed as interactive pills (`.broadcast-pill.playable`).
