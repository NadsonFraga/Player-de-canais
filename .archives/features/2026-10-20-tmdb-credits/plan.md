# Plan: TMDB attribution and copyright line in the footer

> Approved by the user on 2026-10-20 ("pode aproveitar para colocar os créditos ao tmdb"). Branch `feat/tmdb-credits`, first feature through `staging`.

TMDB's API terms ask every app to show their logo and the notice that it uses the TMDB API without being endorsed or certified by TMDB. The site showed neither.

- `assets/logos/brands/tmdb.svg`: TMDB's official "blue short" logo, unmodified (downloaded from themoviedb.org, 2 KB, shapes and a gradient only, no script).
- Home footer (`index.html`, `09-series-animes.css`): the logo linking to themoviedb.org with "Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.", and "© 2026 Tvzinha Online. Títulos, imagens e marcas pertencem aos seus respectivos donos." Right-aligned on desktop, left on phones.
- Privacy policy, contact and removal requests: discussed with the user, pending their decisions (see chat 2026-10-20).
