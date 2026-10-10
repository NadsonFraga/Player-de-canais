# Tvzinha — Archives & Documentation

Project documentation folder (replaces the former `docs/`). When resuming work, read the newest file in `handovers/`, then `backlog.md`.

## Layout

- `backlog.md` — open work queue (Portuguese, living document)
- `features/YYYY-MM-DD-<slug>/` — one folder per feature, dated by the day it started:
  - `plan.md` — the approved plan (English); extra plans as `plan-<part>.md`
  - `research.md` — research or user-provided material, when there is any
  - `tests.md` — manual test table sent to the user before the preview, with their results
  - `summary.md` — what shipped, written at merge time
- `handovers/YYYY-MM-DD[-topic].md` — state for the next agent or machine
- `scopes/` — long-lived specs: design system, sources, streaming engine, knowledge base (some describe older layouts; check the code)
- `history/` — chat history exports (made with `old/tools/export_chat_history.py`); **local only, not versioned** (listed in `.gitignore`)
- `reference/` — reference dumps
- `old/` — legacy assets; `old/tools/` holds retired diagnostic scripts from the single-file era

## Feature process

1. Plan: create `features/<date>-<slug>/plan.md`; the branch, when the user asks for one, is `feat/<slug>` (preview at `feat-<slug>.tvzinhaonline.pages.dev`).
2. Before the preview: write `tests.md` (what to test, URL, how, expected result) and record the user's answers there.
3. Merge (`git merge --no-ff`): write `summary.md`, add the row below, update `backlog.md`.

## Index

| Started | Feature | Status |
| --- | --- | --- |
| 2026-09-29 | [favorite-team-selection](features/2026-09-29-favorite-team-selection/) | done |
| 2026-09-30 | [adblock-notice](features/2026-09-30-adblock-notice/) | done |
| 2026-10-02 | [fix-series-player-controls-and-audio](features/2026-10-02-fix-series-player-controls-and-audio/) | done |
| 2026-10-02 | [migrate-archives-and-docs](features/2026-10-02-migrate-archives-and-docs/) | done |
| 2026-10-03 | [decouple-archives-from-submodule](features/2026-10-03-decouple-archives-from-submodule/) | done |
| 2026-10-03 | [fix-player-black-screen-and-loader](features/2026-10-03-fix-player-black-screen-and-loader/) | done |
| 2026-10-05 | [stage-1-ui-cleanup](features/2026-10-05-stage-1-ui-cleanup/) | done |
| 2026-10-05 | [stage-2-mobile-rotation-and-playback](features/2026-10-05-stage-2-mobile-rotation-and-playback/) | done |
| 2026-10-05 | [stage-3-series-episodes-navigation](features/2026-10-05-stage-3-series-episodes-navigation/) | done |
| 2026-10-05 | [stage-4-subtitles-and-mobile-movie-player](features/2026-10-05-stage-4-subtitles-and-mobile-movie-player/) | done |
| 2026-10-06 | [stage-5-unified-player-design](features/2026-10-06-stage-5-unified-player-design/) | done |
| 2026-10-07 | [clean-console-and-dynamic-iframes](features/2026-10-07-clean-console-and-dynamic-iframes/) | done |
| 2026-10-08 | [native-player-startup-and-quality](features/2026-10-08-native-player-startup-and-quality/) | done |
| 2026-10-08 | [anime-title-lookup-and-resolve-speed](features/2026-10-08-anime-title-lookup-and-resolve-speed/) | done |
| 2026-10-08 | [skip-segments](features/2026-10-08-skip-segments/) | done (IntroDB as third source still open) |
| 2026-10-09 | [episode-entry-standard](features/2026-10-09-episode-entry-standard/) | done |
| 2026-10-09 | [player-continuity](features/2026-10-09-player-continuity/) | done |

Folders before 2026-10-08 were dated from their summaries and commit history; older ones may lack a `summary.md`.
