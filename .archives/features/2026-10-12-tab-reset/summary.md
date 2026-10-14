# Summary: leaving a catalog tab resets it (2026-10-12)

Written afterwards from the commit (050b467); the work was done on the other machine.

## Shipped

- `router.js` leave hooks for Filmes, Séries and Animes, called when the tab changes. `main.js` resets the tab's search, filters, sort and studio collection with `keepHistory`. Inside a tab nothing changes.
- `tools/tab_reset_check.mjs`: 9/9 in Chrome and 9/9 in Firefox.
