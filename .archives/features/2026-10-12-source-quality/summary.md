# Summary: "Buscar qualidade melhor" (2026-10-12)

Written afterwards from the commits (bb461a5, 2261ad3; merge ebd3362); the work was done on the other machine.

## Shipped

- The automatic choice is unchanged (fast start). On request, the quality menu measures in the browser the live MP4 sources the server left unmeasured (the MP4 host blocks datacenters), while the video keeps playing. A better quality is played from the same position with a 45 s start budget; otherwise the viewer is told nothing better was found, and playback goes back if the new source does not start.
- Offered only when such sources exist and less than 1080p is playing; never on the anime player.
- Sources that failed only by timeout count again for the search; sources that failed with an error stay out.
- `tools/quality_search_check.mjs`: 9/9 in Chrome and 9/9 in Firefox.
