# Multi-Provider Stream Extraction Benchmark

Date: 2026-10-22

Total Samples: 21 (7 Movies, 7 TV Series, 7 Animes)


## Summary Statistics

| Provider | Role / Focus | Success Rate | Avg Latency | Top Quality | Audio | Format |
|---|---|---|---|---|---|---|
| **FenixFlix** | Contingência PT-BR | 20/21 (95%) | 281ms | 4K / 1080p | Dublado (PT-BR) | HLS / MP4 |
| **Cinecat** | Baixa Latência | 21/21 (100%) | 1142ms | 1080p | Original (EN/JA) | HLS Multi-bitrate |
| **Rive** | 4K HDR Multi-engine | 21/21 (100%) | 1576ms | 4K HDR | Original (EN/JA) | HLS Multi-bitrate |
| **Anime Nativo** | Anime Legendado | 7/7 (100%) | 768ms | 1080p | Legendado (PT-BR) | HLS |
| **Movy** | Alta Resolução CDN | 19/21 (90%) | 754ms | 1080p / 4K | Original (EN/JA) | HLS |
| **MGEB** | Player Principal | 19/21 (90%) | 7921ms | 1080p | Dublado (PT-BR) | HLS / MP4 |

---

## Per-Title Test Matrix

| Title | Category | MGEB | FenixFlix | Rive | Movy | Cinecat | Anime Nativo |
|---|---|---|---|---|---|---|---|
| Deadpool & Wolverine | Movie | Offline | 4K (320ms) | 4K HDRp (504ms) | 1080p (732ms) | 1080p (701ms) | - |
| Dune: Part Two | Movie | 1080p (18933ms) | 4K (288ms) | 4K HDRp (441ms) | 1080p (991ms) | 1080p (340ms) | - |
| Inside Out 2 | Movie | 1080p (8868ms) | 4K (333ms) | 4K HDRp (460ms) | 1080p (801ms) | 1080p (341ms) | - |
| Oppenheimer | Movie | 1080p (5595ms) | 4K (254ms) | 4K HDRp (316ms) | 1080p (740ms) | 1080p (343ms) | - |
| Fight Club | Movie | 1080p (20585ms) | 1080p (239ms) | 4K HDRp (327ms) | 1080p (741ms) | 1080p (330ms) | - |
| Interstellar | Movie | 1080p (9613ms) | 4K (438ms) | 4K HDRp (882ms) | 1080p (705ms) | 1080p (346ms) | - |
| Gladiator | Movie | 1080p (3569ms) | 1080p (272ms) | 4K HDRp (319ms) | 1080p (723ms) | 1080p (357ms) | - |
| The Boys | Series | 1080p (8830ms) | 1080p (254ms) | 4K | Englishp (477ms) | 1080p (729ms) | 1080p (343ms) | - |
| Breaking Bad | Series | 1080p (9343ms) | 1080p (336ms) | 4K HDRp (680ms) | 1080p (740ms) | 1080p (556ms) | - |
| Stranger Things | Series | 1080p (6383ms) | 1080p (238ms) | 4K HDRp (765ms) | 1080p (746ms) | 1080p (2840ms) | - |
| House of the Dragon | Series | 1080p (8984ms) | 1080p (235ms) | 4K HDRp (665ms) | 1080p (691ms) | 1080p (559ms) | - |
| The Last of Us | Series | 1080p (7359ms) | 1080p (317ms) | 4K HDRp (134ms) | 1080p (725ms) | 1080p (354ms) | - |
| Fallout | Series | 1080p (4023ms) | 1080p (257ms) | 4K HDRp (110ms) | 1080p (738ms) | 1080p (2853ms) | - |
| Game of Thrones | Series | 1080p (6362ms) | 1080p (277ms) | 4K HDRp (813ms) | 1080p (863ms) | 1080p (2853ms) | - |
| Demon Slayer | Anime | 1080p (6143ms) | 1080p (284ms) | 4K HDRp (340ms) | 1080p (743ms) | 1080p (559ms) | 1080p (732ms) |
| Jujutsu Kaisen | Anime | 1080p (5541ms) | 1080p (241ms) | 4K HDRp (310ms) | 1080p (715ms) | 1080p (2860ms) | 1080p (777ms) |
| Attack on Titan | Anime | 1080p (3520ms) | 1080p (257ms) | 4K HDRp (905ms) | 1080p (752ms) | 1080p (564ms) | 1080p (922ms) |
| Solo Leveling | Anime | 1080p (5288ms) | 1080p (250ms) | 4K HDRp (669ms) | Offline | 1080p (3073ms) | 1080p (780ms) |
| Frieren | Anime | Offline | Offline | 4K HDRp (312ms) | Offline | 1080p (2876ms) | 1080p (730ms) |
| Naruto Shippuden | Anime | 1080p (5880ms) | 1080p (242ms) | dcloudp (23146ms) | 1080p (730ms) | 1080p (323ms) | 1080p (724ms) |
| Death Note | Anime | 1080p (5685ms) | 1080p (296ms) | 4K HDRp (517ms) | 1080p (712ms) | 1080p (607ms) | 1080p (713ms) |
