# Language rules

- All replies in the chat must be written in Brazilian Portuguese (pt-BR).
- Planning files (plan mode files) must be written in English.

# Working rules

- **Plans:** always paste the complete plan in the chat (not only in the plan file) and stop. Implement only after explicit approval in the chat.
- **Phases:** in approved multi-phase work (even in auto mode), hard stop at the end of every phase, or before any decision with strong impact on development: report what changed, verification results with numbers, and wait for the go-ahead.
- **Git:** no commits, pushes, branch creation, merges or deploys unless the user asks for that specific action.
- **Scope:** prefer general fixes over per-host or per-title patches; point fixes only when strictly necessary.
- **Verification:** test with several titles (movies, series, anime), not just one, in Edge and Firefox when the player is involved (`tools/player_benchmark.mjs`).

# Project context

- Static ESM SPA (no build step) on Cloudflare Pages; edge functions in `functions/api/` (`resolve.js`, `stream.js`), mirrored for local development by `tools/local_server.py` (keep both identical).
- Local server: `python tools/local_server.py` -> http://localhost:8787 (LAN IP for phones).
- Planning docs, summaries and handovers live in `.archives/` (`plans/`, `summaries/`). Start with the newest file in `.archives/summaries/` when resuming work.
- Cache busting: when a frontend module changes, bump the `?v=` version used by `index.html`, `assets/js/main.js` and every importer of `assets/js/player/engine.js` (all importers must use the same string).
