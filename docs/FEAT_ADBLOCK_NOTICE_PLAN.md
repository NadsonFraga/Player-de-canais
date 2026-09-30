# Implementation Plan: Adblocker & Private DNS Disclaimer Modal

## 1. Overview
Tvzinha functions as a live stream directory and aggregator. External third-party video embeds embed unsolicited pop-ups, redirects, and overlay ads outside the control of the application. To protect the user experience and avoid confusion, a persistent disclaimer modal is introduced.

## 2. Key Requirements
- **Modal Blockage on First Visit & 24h Window**:
  - Automatically triggers if `localStorage.getItem('tvzinha_adblock_ack_timestamp')` is null or if `Date.now() - timestamp > 24 * 60 * 60 * 1000` (24 hours).
  - Background is locked with obsidian blurred overlay (`backdrop-filter: blur(12px)`).
  - Primary button: "Compreendi e desejo continuar" updates the timestamp and closes the modal.
- **Persistent Residual Trigger**:
  - A discreet header/sidebar button with a shield icon ("Bloqueador / DNS") allows users to reopen instructions and tutorial links anytime.
- **Two Practical Adblocking Solutions**:
  1. **Browser Extensions**: Direct links to AdGuard and uBlock Origin (Chrome Web Store and Firefox Add-ons).
  2. **Private DNS Configuration**: Instructions for Android, iOS, Windows, and Smart TVs using AdGuard DNS (`dns.adguard-dns.com`), with one-click copy and official documentation link.
- **Aesthetic Consistency**:
  - Adheres strictly to `docs/DESIGN_SYSTEM.md`: Obsidian surfaces, hairline borders (`rgba(255, 255, 255, 0.08)`), emerald accents (`#10b981`), zero UI emojis, accessible keyboard and TV remote navigation.

## 3. Storage Schema
- Key: `tvzinha_adblock_ack_timestamp` (stores unix millisecond epoch integer as string).
- TTL: 86,400,000 ms (24 hours).

## 4. Technical File Impact
- `index.html`: Modal markup (`#adblock-modal`) and residual toolbar button (`#btn-adblock-info`).
- `style.css`: Modal styling, solution cards, DNS copy pill, responsive breakpoints.
- `script.js`: Time-based trigger logic, focus trap, copy-to-clipboard feedback, modal controls.
