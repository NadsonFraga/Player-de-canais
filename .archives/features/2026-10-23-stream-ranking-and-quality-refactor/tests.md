# Manual & Automated Test Matrix - Quality & Ranking Refactor

| Test ID | Title / Scenario | Expected Result | Status |
| :--- | :--- | :--- | :--- |
| **TEST-01** | Total Rive Removal Verification | Zero occurrences of Rive in active JS/Python files; server options show only MGEB, FenixFlix, Movy, and Anime Nativo. | Passed |
| **TEST-02** | Quality Tooltip Display Accuracy | Gear menu tooltip reflects the exact video resolution playing on screen (`activeQuality`), never showing false 2160p when media is 480p or 1080p. | Passed |
| **TEST-03** | Submenu Quality Match | Submenu entries correspond 1:1 with real HLS levels or MP4 sources without phantom/unmatched resolutions. | Passed |
| **TEST-04** | Toy Story 4 (TMDB 301528) Ranking | MGEB chooses clean HD stream (720p) instead of demoting it behind a low-bitrate 480p HLS. | Passed |
| **TEST-05** | Anti-CAM / Low-Bitrate Demotion | Sources with CAM signatures or bitrates < 1.2 Mbps are ranked behind clean digital WEB-DL sources. | Passed |
| **TEST-06** | Fast-Start Top-Down Continuity | Videos start in the highest available resolution for that specific title without stalling (`hls.startLevel = bestIdx`). | Passed |
| **TEST-07** | Automated Rules Suite | `python tools/test_mgeb_rules.py` passes 100% without regression across Python and Node. | Passed |
| **TEST-08** | Asset Version Stamping | `python tools/bump_version.py --check` succeeds with single uniform timestamp `20261023_1040`. | Passed |
| **TEST-09** | Instant Server Switch Teardown | Switching between player server buttons stops playback instantly (0ms) and resets player before resolving next source. | Passed |
