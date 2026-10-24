# Verification Tests: MGEB Dubbed Audio Priority & Anime Player Recovery

## Automated Playback Matrix Results

| Index | Title | Kind | Expected Server | Actual Server | ReadyState | Duration | Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | Homem-Aranha: Sem Volta Para Casa (`634649`) | Movie | Player Principal (MGEB) | Player Principal (MGEB) | 4 | 8889.9s | PASSED (PT-BR direct stream: `77zzhf54vdll71.com`) |
| 2 | Jujutsu Kaisen (`95479`) | Anime | Anime Nativo (Legendado) | Anime Nativo (Legendado) | 4 | 1435.0s | PASSED (HLS stream via Drama/Zoko) |
| 3 | Demon Slayer (`85937`) | Anime | Anime Nativo (Legendado) | Anime Nativo (Legendado) | 4 | 1420.0s | PASSED (HLS stream via Drama/Zoko) |
| 4 | Solo Leveling (`127532`) | Anime | Anime Nativo (Legendado) | Anime Nativo (Legendado) | 4 | 1420.0s | PASSED (HLS stream via Drama/Zoko) |
| 5 | Breaking Bad (`1396`) | TV | Player Principal (MGEB) | Player Principal (MGEB) | 4 | 3486.5s | PASSED (PT-BR direct stream: `77zzhf54vdll71.com`) |

## Parity & Unit Tests

- `tools/test_mgeb_rules.py`:
  - Python (`tools/local_server.py`): 42/42 rules passed.
  - Node (`functions/api/resolve.js`): 42/42 rules passed.
  - Parity discrepancy: 0.
- `tools/bump_version.py --check`:
  - Stamped version: `20261024_1234`.
  - In use: `['20261024_1234']` (all 33 modules in sync).
