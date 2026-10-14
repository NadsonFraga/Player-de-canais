# Summary: stream proxy hardening (2026-10-12)

Written afterwards from the commits (a25d41c, 813c74a; merge 226301d of `feat/security-hardening`). The full security plan (`2026-10-10-security-hardening/plan.md`) was never committed and exists only on the other machine.

## Shipped (backlog D2, D8, T14)

- `functions/api/stream.js` and `tools/local_server.py` follow the same rules:
  - only http/https targets; a line break in referer or origin is refused;
  - redirects followed one by one (at most 5) and each new address is checked again;
  - answers built from scratch: CORS (kept for casting receivers), `nosniff` and a sandbox CSP; only `Content-Length`, `Content-Range` and `Accept-Ranges` are copied from upstream;
  - media types kept, anything else served as `application/octet-stream`;
  - generic 502 on network errors; playlists and subtitles read up to 5 MB; 15 s for upstream headers;
  - WebVTT cleaned on both sides.
- `tools/test_stream_proxy.py` (with `tools/test_stream_proxy.mjs` and `tools/fixtures/stream_cases.json`): 26 offline cases, 26/26 in both implementations.

## Open

- The rest of the security list: D3 (TMDB key, postponed), D4, D5 (resolve only; stream keeps CORS for casting), D6, D7, D9, D11.
