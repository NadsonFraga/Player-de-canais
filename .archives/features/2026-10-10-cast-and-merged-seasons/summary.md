# Summary: merged TMDB seasons and casting (2026-10-10)

Written afterwards from the commits (b8b5d84, 4223647); the work was done on the other machine.

## Shipped

- **Merged seasons:** shows that TMDB lists as one long season but MGEB splits (Jujutsu Kaisen, Re:Zero, Diário de uma Apotecária) are mapped through the TMDB "Seasons" episode group after a mismatch. Example: JJK T1E41 becomes T2E17.
- **Transmitir:** a "Transmitir" row, last in the settings menu and shown on Android only, pauses the player and opens Web Video Caster through an intent with the source address and title (Play Store page when the app is missing). `tools/cast_check.mjs`: 6/6 in Chrome and 6/6 in Firefox.

## Open

- Phase 3, automatic detection by casting apps (B2): only if the button is not enough.
