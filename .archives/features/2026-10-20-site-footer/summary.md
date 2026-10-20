# Summary: site footer, legal panel and data credits

**Branches:** `feat/site-footer`, then `feat/site-footer-v2` (redesign after review) -> `staging` -> `master` · **Date:** 2026-10-20 · **Version:** `20261020_1352`
**Status:** approved by the user on staging.

## Change

- One footer for Início, Filmes, Séries and Animes (`<footer id="site-footer">` in `index.html`, section 6 of `09-series-animes.css`); hidden on Canais, which keeps its full-screen layout. The old home footer strip and the club shortcut (`#btn-home-team-shortcut`) were removed; the team picker stays under `#btn-change-team`.
- Layout after the user's review:
  - A small "Menos anúncios nos servidores externos" link with a shield line icon, no box or description; it opens the ad-block and DNS tips (`#btn-footer-adblock`, wired in `main.js`).
  - Left: logo, name and tagline on one line ("Tvzinha Online - Filmes, séries, animes e canais ao vivo em um só lugar.", white and bold; the tagline drops to its own line on phones), the TMDB logo and, under it, the data credits. A hidden `#site-footer-contact` waits for the site's e-mail.
  - Right: "Navegar" (Início, Canais, Filmes, Séries, Animes) and "Legal" (Privacidade, Termos de uso, DMCA).
  - Bottom: one thin row, copyright on the left, back-to-top on the right.
- `assets/js/modules/footer.js`: delegated clicks for the footer, and the legal panel (`#legal-modal`, plain text from `LEGAL_SECTIONS`), closed by its button, the backdrop or Back (layer in `historyManager.js`).
- Wording: "não armazena nem envia arquivos de mídia" (accurate: the proxy passes video through without storing it); it lives in Termos de uso and DMCA, not in the footer.

## Results

Screenshots at 1366 px and 390 px on Início and Filmes: footer visible, logos loaded, no sideways scroll, hidden on Canais. Legal panel opens and Back closes it; footer links switch tabs. `check_deployment.py` on staging: all passed.

## Left to do

- Contact e-mail (user will create one) in the footer and the DMCA panel; later Discord, Instagram, YouTube and the app.
- Rewrite Privacidade and Termos with the account system (backlog G7).
