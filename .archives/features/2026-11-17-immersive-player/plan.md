# Feature Plan: Immersive Cinema Player Refactoring

## 1. Goal
Modernize the movie and series playback experience into a full-viewport, cinema-grade immersive player (`100vw` × `100vh`), replacing the legacy centered card modal and detached bottom server list with integrated on-player overlays, popovers, and flawless auto-hide behavior inspired by modern streaming industry standards (Atlantic.bz, Netflix, YouTube).

## 2. Key UX & Architectural Principles
1. **Full-Viewport Cinema Mode (`100vw` × `100vh`):**
   - The playback screen expands to occupy the entire viewport with zero vertical page scrolling and an absolute dark canvas.
2. **Context-Aware Title & Obra Card (Pause-Only):**
   - **While Playing:** Moving the mouse or tapping only reveals playback controls (bottom bar) and a subtle back button; the video frame remains unobstructed.
   - **While Paused:** An elegant Netflix/MGEB-style information card fades in at the top-left (Poster thumbnail, Title, Rating badge, Release Year, Age rating, Genres, and Synopsis).
   - **Clean Pause State (YouTube-style):** Clicking on the empty video surface while paused dismisses the card and controls, allowing the user to view an unhindered paused frame.
3. **Flawless UI Auto-Hide & Mobile Touch Stability:**
   - Unified UI state manager preventing stuck controls on mobile and desktop.
   - Strict 3.0s inactivity timer with smooth fade-in/fade-out transitions.
4. **Bottom Control Bar Reorganization:**
   - **Left:** Play/Pause, Rewind 10s (`-10s`), Forward 10s (`+10s`), Volume button with horizontal slider on hover, Current / Total time.
   - **Right:**
     - `[⊞ Episodes]` (Series & Anime only): Floating drawer with episode thumbnails, titles, and synopses.
     - `[CC Subtitles]`: Dedicated popover for subtitle track selection, manual upload (`.srt`/`.vtt`), and typography settings.
     - `[⛯ Servers]`: Dedicated button on the bar with popover list (MGEB Player, Fênix Player, External Iframes) featuring instant stream switching.
     - `[⚙ Settings]`:
       - Top 2x2 grid: Quality (1080p, 720p, Auto), Watch Party, Playback Speed, Audio track.
       - Bottom list: Cast (Google Cast / AirPlay), Trakt.tv synchronization, Download.
     - `[⛶ Fullscreen]`: Toggle native fullscreen.
5. **Modernized Visual Design System:**
   - Eliminate fluorescent/neon green (`#00dc82` / `#00b894`).
   - Introduce a restrained, premium palette: dark translucent frosted glass (`rgba(16, 20, 28, 0.88)` + `backdrop-filter: blur(16px)`), subtle hairline borders (`rgba(255, 255, 255, 0.08)`), clean contrast, and inline SVG line icons (zero emojis).

## 3. Implementation Phases
- **Phase 1: Immersive Stage & Pause-Only Obra Card**
  - Refactor `#movie-player-view` and `#series-player-view` into a unified `100vw` × `100vh` viewport.
  - Implement top-left Obra Card that mounts dynamically with metadata (poster, rating, year, classification, genres, overview) and only displays when paused.
  - Fix playback click handlers for YouTube-style toggle on paused state.
- **Phase 2: Bottom Bar & Dedicated Server Popover**
  - Add dedicated Server button to Artplayer controls.
  - Migrate server selection from external DOM `#movie-servers-grid` into a styled frosted glass popover inside the player container.
  - Ensure instant stream switching with zero layout shifts.
- **Phase 3: Settings Grid & Subtitles Harmonization**
  - Implement the 2x2 quick-action card grid inside the Settings popover (`Quality`, `Watch Party`, `Speed`, `Audio`).
  - Move Cast/Transmissão into the Settings popover list.
  - Harmonize Subtitles popover styling with the new design system.
- **Phase 4: Episode Drawer Modernization**
  - Integrate episode cards with thumbnails, episode numbers, titles, and synopses directly over the viewport.
- **Phase 5: Styling, Color Normalization & Multi-Device Verification**
  - Replace all legacy green styling with the new refined dark theme.
  - Verify touch controls, auto-hide reliability, and responsive scaling across mobile, tablet, and desktop screens.
