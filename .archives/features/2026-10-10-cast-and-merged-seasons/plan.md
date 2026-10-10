# Plan: merged TMDB seasons on MGEB (Jujutsu Kaisen) and casting with Web Video Caster

> Status: proposal, waiting for approval. Urgent: placed before the security phases and MGEB Phase 2 (those stay as planned in `2026-10-10-security-hardening/plan.md` and `2026-10-10-mgeb-source-checks/plan.md`).

## 1. Jujutsu Kaisen plays episode 1 on the main player

### Cause (measured 2026-10-10)

- TMDB lists Jujutsu Kaisen as ONE season of 59 episodes. "Trovão, parte 2" is TMDB S1E41, so the site asks MGEB for T1E41.
- MGEB numbers by the real seasons (24 / 23 / 12). It has no T1E41 and answers with its T1E1 page ("Ryomen Sukuna"), which the player plays. The same happens for T1E48. MGEB T2E17 exists (3 sources).
- Same structure on TMDB: Re:Zero (1 season, 85 eps), Diário de uma Apotecária (1 season, 60 eps). Explains backlog P2 (Re:Zero) and F2 on the main player.
- TMDB "episode groups" of type 6 named "Seasons" carry the real split: JJK 24/23/12, Re:Zero 25/25/16/19, Apotecária 24/24/12 (plus "Specials" groups, ignored).
- With MGEB Phase 1 (P5, not committed) the wrong episode is already refused (clean "unavailable" message), but the right one does not play yet.

### Fix (server, `resolve.js` and `local_server.py`, identical)

- Only when MGEB answered for another episode (P5 mismatch) AND the show has a single regular TMDB season:
  1. Read the show's TMDB episode groups (type 6, regular groups only, skipping "Specials" and empty groups; cached 24 h).
  2. Find the group holding the requested TMDB episode: its position gives the MGEB season, the episode's position inside it gives the MGEB episode (S1E41 -> T2E17).
  3. Ask MGEB once for that pair (both ids, as today) and keep the answer only if its title names exactly that pair (P5 check).
- Normal titles are untouched (no extra request). Extra cost only on the mismatch path: about 1 TMDB request (cached) + 1 MGEB lookup (~3 s).
- Diagnosis field in the response: `mgeb_episode` ("T2E17").

### Verification

- Rule cases (Python + Node): group mapping for JJK (E24 -> T1E24, E25 -> T2E1, E41 -> T2E17, E48 -> T3E1), Re:Zero (E26 -> T2E1, E51 -> T3E1), Apotecária (E25 -> T2E1); multi-season shows never remapped.
- Live, sequential: JJK T1E41 (expect title T2E17), T1E25, T1E17 (unchanged), Re:Zero T1E30, Apotecária T1E30, One Piece T1E62 (still 404), DBZ T1E1, Friends T1E1 (unchanged).
- Browser: open JJK "Trovão, parte 2" in the main player (Chrome and Firefox) and check the header and the video.

### Phase 1 result (2026-10-10, not committed)

- Approved by the user (Android confirmed; cast = only the B1 button, inside the settings menu next to quality and audio).
- Implemented in `resolve.js` and `local_server.py` (identical): `regularSeasonGroups` / `mapMergedEpisode` / `fetchSeasonGroups` (TMDB episode groups type 6, cached 24 h), used only after a P5 mismatch on a show with one regular TMDB season; `mgeb_episode` in the response.
- Finding: MGEB is not consistent. For Jujutsu Kaisen it uses the real seasons; for Re:Zero and Diário de uma Apotecária it follows the TMDB numbering (T1E30 exists there with the right episode name). Converting only after a mismatch handles both.
- Rule cases: 8 new (29 total) pass in Python and Node, same answers.
- Live (sequential): JJK T1E17 unchanged (T1E17), T1E25 -> T2E1, T1E41 -> T2E17, T1E48 -> T3E1; Re:Zero T1E30 and Apotecária T1E30 unchanged with the right names; the 14 earlier titles unchanged (One Piece E62/E500 still 404). Converted episodes take 10-14 s (two MGEB lookups) instead of playing episode 1.
- Not checked: the picture itself in the browser (MGEB names season-2 episodes generically, "Episódio 17"); the user confirms on a manual test.

## 2. Web Video Caster does not detect the main player

### Cause (code reading; the app itself cannot be tested from this machine)

- The main player plays HLS through hls.js: the `<video>` element gets a `blob:` address (Media Source), which no casting app can send to a TV or projector.
- The playlist and segments go through our proxy at `/api/stream?url=...`: the address has no `.m3u8`/`.mp4` ending, so the in-app browser's detector (which recognizes media by address) does not flag it. Iframe servers expose plain `...index.m3u8` addresses, so they are detected.
- Proxied segments keep the host's own content type (some hosts send video as `image/jpeg` or `text/html`), which some receivers refuse.

### Fix

- B1. "Transmitir" button in the native player (movies, series, anime; Android only, where Web Video Caster runs): opens Web Video Caster directly with the full address of the source that is playing (our proxy adds the Referer the host needs) and the title. If the app is not installed, the Play Store page opens. Hidden on desktop and iPhone.
- B2. Automatic detection: proxy addresses get a media ending in the path (`/api/stream/video.m3u8?url=...` for playlists, `/api/stream/seg.ts?url=...` for segments), served by the same proxy code; the old `/api/stream?url=` keeps working. Needs a test with the app on a preview deploy.
- Effect on the security plan (to adjust there, not now): `/api/stream` keeps CORS (TV receivers fetch from another origin) and returns correct media types for playlists and segments (`application/vnd.apple.mpegurl`, `video/mp2t`, `video/mp4`) instead of a generic type; CORS is removed only from `/api/resolve`; signed addresses stay valid long enough for a whole movie (24 h).

### Verification

- B1: syntax checks, `python tools/bump_version.py`, `tools/player_ui_check.mjs` (button present with an Android user agent, absent on desktop; the intent address carries the source URL). Manual on the user's phone + projector: movie, series, anime.
- B2: proxy suite (playlist rewrite keeps the new endings, Range/206 and HEAD unchanged) in Python and Node; benchmark Chrome + Firefox; manual detection test with the app on preview.

## Phases

1. Merged seasons (Jujutsu Kaisen). Stop and report.
2. Cast button (B1). Stop and report; manual test table for the user.
3. Automatic detection (B2), only if B1 is not enough or the user wants both. Stop and report.
