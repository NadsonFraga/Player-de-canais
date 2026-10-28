# Multi-Native Players Test Plan & Verification

This document specifies the verification cases for testing the new multi-native direct player suite on staging (`https://staging.tvzinhaonline.pages.dev`).

## Test Matrix

| ID | Title / Content | Type | Provider / Player Button | Expected Behavior | Status |
|:---|:---|:---|:---|:---|:---|
| T01 | *O Auto da Compadecida* | Movie | `FenixFlix (Dublado)` | Instant playback (<500ms), 1080p PT-BR Dublado | Pending User Check |
| T02 | *O Auto da Compadecida* | Movie | `Player Principal (MGEB)` | Plays PT-BR Dublado via MGEB | Pending User Check |
| T03 | *Deadpool & Wolverine* | Movie | `Rive (Original / 4K)` | 4K/1080p stream, original audio | Pending User Check |
| T04 | *Deadpool & Wolverine* | Movie | `Movy (Original / FHD)` | High-speed 1080p stream | Pending User Check |
| T05 | *Breaking Bad* (S01E01) | Series | `Player Principal (MGEB)` | Resolves dubbed episode S01E01 | Pending User Check |
| T06 | *Breaking Bad* (S01E01) | Series | `FenixFlix (Dublado)` | Fast dubbed stream S01E01 | Pending User Check |
| T07 | *Breaking Bad* (S01E01) | Series | `Rive (Original / 4K)` | 4K stream S01E01 | Pending User Check |
| T08 | *Breaking Bad* (S01E01) | Series | `Movy (Original / FHD)` | High-speed 1080p series stream | Pending User Check |
| T10 | *Jujutsu Kaisen* (S01E01) | Anime | `Anime Nativo (Legendado)` | Default player for anime, 1080p subbed | Pending User Check |
| T11 | *Jujutsu Kaisen* (S01E01) | Anime | `FenixFlix (Dublado)` | Switches to dubbed stream | Pending User Check |
| T12 | *Jujutsu Kaisen* (S01E01) | Anime | `Player Principal (MGEB)` | Switches to MGEB dubbed | Pending User Check |
| T13 | Failed Source Test | Movie | Any failing source | Shows "sem fontes" message without automatic fallback | Pending User Check |

## Rules Verified
- [x] No automatic/silent fallback in backend resolver.
- [x] Each provider is independently selectable in the UI.
- [x] Version stamped with `python tools/bump_version.py`.
- [x] Local server mirror strictly identical.
