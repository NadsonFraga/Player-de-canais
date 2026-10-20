# Plan: full site footer, About pages and data credits

> Status: approved on 2026-10-20 with the user's changes below. Branch `feat/site-footer` from `staging`. Builds on the TMDB attribution already on `staging` (`feat/tmdb-credits`).

## Request

The user sent three references (FlyStream, Popcorn Movies, Movy): a footer with the brand, navigation columns, legal links (Terms, Privacy, DMCA, Contact/Support), data credits (TMDB, AniList...), a note that the site does not host files, a copyright line, an e-mail and a back-to-top button. Contact e-mail and social links (Discord, Instagram, YouTube, an app) come later.

## Today

- The only footer is a strip at the bottom of Início (ad-block tips, favorite team, tagline and, on `staging`, the TMDB credit and copyright). Filmes, Séries, Animes and Canais have none.
- External data the site uses: TMDB (titles, images), MyAnimeList and Jikan (anime matching), AniSkip, TheIntroDB and SkipDB (opening/ending times).

## Change

1. **One footer for every catalog tab** (Início, Filmes, Séries, Animes; Canais keeps its own layout), built once in `index.html`/a small module and styled to the site (no emojis, line icons, neutral colors):
   ```
   [logo] Tvzinha Online            NAVEGAR      TVZINHA
   short tagline                    Início       Sobre
   (social links later)             Canais       Privacidade
                                    Filmes       Termos de uso
                                    Séries       Pedidos de remoção
                                    Animes       Contato (when the e-mail exists)
                                    Esportes
   ---------------------------------------------------------------------------------
   O Tvzinha Online não armazena nem envia arquivos de mídia. Os vídeos são exibidos a partir de provedores de terceiros.
   [TMDB logo] Dados de filmes e séries: TMDB. Animes: MyAnimeList. Aberturas e encerramentos: AniSkip, TheIntroDB, SkipDB.
   Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.
   © 2026 Tvzinha Online. Títulos, imagens e marcas pertencem aos seus respectivos donos.        [back to top]
   ```
   The ad-block tips and favorite team links stay (moved into the TVZINHA column). Phones: the columns stack.
2. **About pages** (one panel with sections, opened from the footer links, Back closes it): Sobre, Privacidade (what is kept in the browser, no tracking cookies, anonymous Cloudflare Web Analytics; to be extended with the account), Termos de uso (short), Pedidos de remoção (how to ask, what happens, the same accurate wording about files). Contato appears once the e-mail is chosen.
3. Future credits (AniList, Trakt) join the credit line when those integrations exist.

## User's changes (2026-10-20), as built

- No "Sobre" page: a short description under the logo.
- Left: logo, description and the contact e-mail (hidden until the user creates the site's own Gmail). Right: NAVEGAR (Início, Canais, Filmes, Séries, Animes; Esportes stays out while it is "em breve") and LEGAL (Privacidade, Termos de uso, DMCA).
- Ad-block and DNS tips: out of the footer columns, into a callout of their own right above the footer.
- Favorite team shortcut: removed from the footer (the team picker stays in the sports section, "Trocar time").
- The wording "não armazena nem envia arquivos de mídia" kept (user did not object).
- Legal texts live in `modules/footer.js`, shown in a panel with the ad-block modal's look; Back closes it (`historyManager`). The footer is hidden on Canais.

## Wording note

The user asked for "we do not host anything". The proxy (`/api/stream`) passes video through our servers, so "não hospeda" could be disputed; "não armazena nem envia arquivos de mídia" says the same and is accurate (nothing is stored or uploaded). Proposed to the user.

## Verification

Screenshots desktop and phone of the footer on each tab; links go to the right tab/section; Back closes the About panel; no sideways scroll; `player_ui_check`/`tab_reset_check` regression (router and layout touched).
