# Summary: MGEB source checks, phase 1 (2026-10-10)

Written afterwards from the commit (b8b5d84); the work was done on the other machine.

## Shipped

- **P5:** an MGEB answer whose title names another episode is refused (MGEB falls back to T1E1 for episodes it lacks). One Piece T1E62/E500 now answer `episode_mismatch` instead of playing E1.
- **P7 (helps P1, P2):** the existing probe measures each source's length (HLS `#EXTINF`, MP4 `mvhd`). On episodes, a source far from the median ranks last, and an empty playlist is not treated as live. Movies keep the previous ranking because of legitimate cuts.
- `functions/api/resolve.js` and `tools/local_server.py` kept identical. `tools/test_mgeb_rules.py`: 21 rule cases in Python and Node, plus a live matrix.

## Open

- Phase 2, P4 (MGEB burst throttling: server retry and client prefetch queue). Approved for later; did not reproduce on 2026-10-10.
- The DBZ and Bleach demotions depend on mgeb.site being measured, which only happens on Cloudflare. Confirm on production (backlog P1).
