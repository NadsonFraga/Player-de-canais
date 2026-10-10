# Language rules

- All replies in the chat must be written in Brazilian Portuguese (pt-BR).
- Planning files (plan mode files) must be written in English.

# Working rules

- **Plans:** always paste the complete plan in the chat (not only in the plan file) and stop. Implement only after explicit approval in the chat.
- **Phases:** in approved multi-phase work (even in auto mode), hard stop at the end of every phase, or before any decision with strong impact on development: report what changed, verification results with numbers, and wait for the go-ahead.
- **Git:** no commits, pushes, branch creation, merges or deploys unless the user asks for that specific action. Merge feature branches into `master` with `git merge --no-ff` (always a merge commit, so the branch shows in the history graph); never fast-forward.
- **Scope:** prefer general fixes over per-host or per-title patches; point fixes only when strictly necessary.
- **Verification:** test with several titles (movies, series, anime), not just one, in Chrome and Firefox when the player is involved (test scripts take `--browser=chrome|edge|firefox`, Chrome by default; `tools/player_benchmark.mjs`).
- **No emojis in the site:** never put emojis or pictograph glyphs (play, rewind, fast-forward symbols and the like) in anything the site renders. Use inline SVG line icons in the site's own style, or no icon at all. Artplayer paints every svg inside `.art-video-player` white, so line icons there need `fill: none; stroke: currentColor` in CSS.
- **One entry point for episodes:** every way of opening a series or anime episode (resume card, details button, season list, continuous list, go to N, player drawer, previous/next, next-episode card, and any new one) calls `openEpisode()` in `assets/js/modules/series.js`. Features read the episode context it builds (`resolveEpisodeContext`: anime flag, TMDB/IMDb/MAL ids, our and TMDB numbering, show-wide number, episode data), never the raw call arguments or a thin catalog item.
- **Tests are proportional and silent:** small changes get a targeted check (syntax, the one affected assertion). Run the browser suites (`tools/player_ui_check.mjs`, `tools/player_touch_check.mjs`) only for broad changes (player, router, history, layout, resolve logic), and always launch test browsers with `--mute-audio`.

# Project context

- Static ESM SPA (no build step) on Cloudflare Pages; edge functions in `functions/api/` (`resolve.js`, `stream.js`), mirrored for local development by `tools/local_server.py` (keep both identical).
- Local server: `python tools/local_server.py` -> http://localhost:8787 (LAN IP for phones).
- All project documentation lives in `.archives/` (there is no `docs/` folder; layout in `.archives/README.md`): `backlog.md` (open queue), `features/YYYY-MM-DD-<slug>/` (one folder per feature), `handovers/`, `scopes/` (long-lived specs), `history/` (chat exports, local only: not versioned), `reference/`, `old/`. Start with the newest file in `.archives/handovers/` when resuming work.
- **Feature docs:** each feature gets `.archives/features/<start date>-<slug>/` with `plan.md` (written with the plan), `tests.md` (manual test table sent before the preview, with the user's answers) and `summary.md` (at merge, plus a row in the `.archives/README.md` index and an update to `backlog.md`). A branch, when asked for, uses the same slug: `feat/<slug>`.
- Cache busting: before every deploy that touches `assets/js` or `assets/css`, run `python tools/bump_version.py` (stamps ONE `?v=` on every local import and on the CSS/JS tags of `index.html`; `--check` fails when versions are mixed). Never version imports by hand: a module with two different strings loads twice, and an unversioned import can be served stale next to a new one, which breaks the whole app.
