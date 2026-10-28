# Feature Plan: External Subtitles, Account Preferences & Playback Continuity

**Slug:** `external-subtitles-and-account-sync`  
**Date:** 2026-10-28  
**Status:** In Planning / Awaiting Approval  
**Authors:** TVzinha Engineering Team  

---

## 1. Executive Summary & Scope

### 1.1 Goals
1. **External Subtitle Ingestion (.srt, .vtt, .ass):** Enable users to upload or drag-and-drop external subtitle files directly into the native Artplayer on desktop, mobile, and TV.
2. **Account & Profile Preferences Sync:** Make subtitle appearance (font size, font color, background shadow/card, fallback encoding) a first-class citizen in the site settings (`settingsPage.js`), fully persisted per profile and synchronized across devices via the Cloudflare account sync engine (`playerPrefs.js`, `sync.js`, `syncMerge.js`).
3. **Playback Continuity & Per-Title Offset:** Remember subtitle synchronization adjustments (delay/advance) per title and episode in `watchProgress`, and persist active external subtitle files in local `IndexedDB` so refreshing or resuming retains the loaded subtitle and its precise sync timing.
4. **Architectural Red Lines:** Zero bundlers, native ES modules only, zero emojis (strictly inline SVG line icons), mobile-touch compatibility without fullscreen disruption, and zero performance regression on stream startup.

---

## 2. Technical Architecture & Component Design

```
+-----------------------------------------------------------------------------------+
|                              SITE SETTINGS & ACCOUNT                              |
| assets/js/modules/settingsPage.js  <-->  assets/js/core/playerPrefs.js            |
| (Size, Color, Background, Fallback Encoding)        ^                             |
|                                                     | Sincronização               |
|                                                     v                             |
| assets/js/core/sync.js  <-------------------->  assets/js/core/syncMerge.js       |
+-----------------------------------------------------------------------------------+
                                                      |
                                                      v
+-----------------------------------------------------------------------------------+
|                                 ARTPLAYER ENGINE                                  |
| assets/js/player/engine.js                                                        |
|   +--------------------------+  +------------------------+  +-------------------+ |
|   | Subtitle Menu & Selector |  | Subtitle Offset Sync   |  | Custom Styling    | |
|   | (Native + External Tracks|  | (±60s, 0.1s/0.5s step) |  | (CSS Variables /  | |
|   |  + "Carregar arquivo")   |  | Persisted per title    |  |  Artplayer style) | |
|   +--------------------------+  +------------------------+  +-------------------+ |
|                 ^                                                                 |
|                 |                                                                 |
|   +-----------------------------------------------------------------------------+ |
|   | Local Ingestion: <input type="file"> / Drag & Drop                          | |
|   | Encoding Guard: TextDecoder (UTF-8 auto-fallback to Windows-1252 / Latin-1) | |
|   | Parser: Artplayer.utils.srtToVtt / assToVtt -> Blob URL                      | |
|   | Cache: IndexedDB 'tvz_subtitles' (recent titles auto-restore)               | |
|   +-----------------------------------------------------------------------------+ |
+-----------------------------------------------------------------------------------+
```

---

## 3. Detailed Technical Specifications

### A. Account & Profile Sync Specification

#### 1. Schema Extensions in `assets/js/core/playerPrefs.js`
Extend `PLAYER_PREF_DEFAULTS`:
```javascript
export const PLAYER_PREF_DEFAULTS = Object.freeze({
    volume: 0.9,
    muted: false,
    playbackRate: 1,
    subtitle: null,             // 'pt-BR' | 'pt' | 'en' | 'off' | null
    quality: 'auto',
    quality_mode: 'balanced',
    fit: 'contain',
    // --- Subtitle Preferences (Account & Profile Synced) ---
    sub_size: '100%',           // '75%' | '100%' | '125%' | '150%'
    sub_color: '#ffffff',       // '#ffffff' (White) | '#ffeb3b' (Yellow) | '#00e5ff' (Cyan)
    sub_bg: 'shadow',           // 'shadow' (None/Drop shadow) | 'semi' (Translucent black) | 'solid' (Solid black)
    sub_encoding: 'auto'        // 'auto' (UTF-8 with Latin-1 fallback) | 'utf-8' | 'windows-1252'
});
```

#### 2. Sanitization & Merging in `assets/js/core/syncMerge.js`
Ensure incoming cloud records sanitize new subtitle fields:
```javascript
clean = {
    volume: num(data.volume, 0, 1) ?? 0.9,
    muted: Boolean(data.muted),
    playbackRate: num(data.playbackRate, 0.25, 4) ?? 1,
    subtitle: data.subtitle == null ? null : text(String(data.subtitle), 10),
    quality: data.quality === 'auto' ? 'auto' : (int(data.quality, 100, 5000) ?? 'auto'),
    quality_mode: data.quality_mode === 'highest' ? 'highest' : 'balanced',
    fit: data.fit === 'cover' ? 'cover' : 'contain',
    sub_size: ['75%', '100%', '125%', '150%'].includes(data.sub_size) ? data.sub_size : '100%',
    sub_color: ['#ffffff', '#ffeb3b', '#00e5ff'].includes(data.sub_color) ? data.sub_color : '#ffffff',
    sub_bg: ['shadow', 'semi', 'solid'].includes(data.sub_bg) ? data.sub_bg : 'shadow',
    sub_encoding: ['auto', 'utf-8', 'windows-1252'].includes(data.sub_encoding) ? data.sub_encoding : 'auto',
    at: time(data.at, now)
};
```

#### 3. Settings UI in `assets/js/modules/settingsPage.js`
Under the **Player** section, add a dedicated card: **Legendas e Aparência**:
- **Tamanho da Legenda:** Pequeno (75%), Normal (100%), Grande (125%), Muito Grande (150%).
- **Cor do Texto:** Branco (Padrão), Amarelo, Ciano.
- **Destaque de Fundo:** Sombra (Padrão), Fundo translúcido, Fundo sólido.
- **Codificação de Arquivos:** Automática (Recomendada), UTF-8, Windows-1252.

---

### B. Subtitle Parsing & Encoding Guard

Brazilian subtitle repositories (e.g. Legendas.tv, OpenSubtitles) frequently distribute `.srt` files encoded in **Windows-1252 / ISO-8859-1** rather than UTF-8, causing corrupt characters (``, `c~ao`, etc.).

#### Safe Decoder Algorithm
```javascript
export async function decodeSubtitleBuffer(arrayBuffer, encodingPreference = 'auto') {
    const bytes = new Uint8Array(arrayBuffer);
    
    if (encodingPreference === 'windows-1252') {
        return new TextDecoder('windows-1252').decode(bytes);
    }
    if (encodingPreference === 'utf-8') {
        return new TextDecoder('utf-8').decode(bytes);
    }
    
    // Auto detection: try UTF-8 with fatal: true to detect encoding errors
    try {
        const strictUtf8 = new TextDecoder('utf-8', { fatal: true });
        return strictUtf8.decode(bytes);
    } catch {
        // Fallback to Windows-1252 for Brazilian Portuguese legacy subtitles
        return new TextDecoder('windows-1252').decode(bytes);
    }
}
```

#### Zero-Dependency Conversion
Artplayer 5.1.7 already exports:
- `Artplayer.utils.srtToVtt(str)`
- `Artplayer.utils.assToVtt(str)`
- `Artplayer.utils.vttToBlob(vttStr)`

We convert the parsed VTT into an in-memory `blob:` URL, avoiding any bloated external NPM packages.

---

### C. Playback Continuity & IndexedDB Caching

1. **Subtitle Sync Offset in `watchProgress.js`:**
   - Add `sub_offset` (seconds, float) to the progress entry for the active title/episode.
   - Example: `watchProgress.save(id, { time, duration, sub_offset: 1.5 })`.
   - On player init, if `sub_offset` exists, the offset is restored immediately upon subtitle activation.

2. **IndexedDB Cache (`tvz_subtitles`):**
   - Store structure: `{ key: mediaKey, name: string, vtt: string, updatedAt: number }`.
   - When a user uploads a subtitle for Movie `12345` or Episode `S01E03`, store the converted VTT in `IndexedDB`.
   - If the user reloads the browser tab or returns to that episode later, the player auto-loads the stored subtitle from `IndexedDB` and marks it: `Externa: nome_do_arquivo.srt`.
   - LRU eviction retains a maximum of 10 recent titles (~1MB total browser storage).

---

### D. Player Interface & Controls Integration

1. **Settings Menu in Player (`refreshSubtitleMenu` in `engine.js`):**
   - **Row 1:** Subtitle Selector:
     - `Desativada`
     - Native track(s) (e.g. `Português (Brasil)`, `Inglês`)
     - `Externa: [nome_do_arquivo]` (when loaded)
   - **Row 2:** Action: **"Carregar legenda externa..."**
     - Clicking opens the native file picker dialog (`<input type="file" accept=".srt,.vtt,.ass">`).
   - **Row 3:** Submenu: **"Sincronia da legenda"** (visible when a subtitle is active)
     - Interactive panel with increment buttons: `[-1s]` `[-0.2s]` `[Zerar]` `[+0.2s]` `[+1s]`
     - Tooltip / Status displaying active offset: `Offset: +1.4s`
   - **Row 4:** Submenu: **"Estilo da legenda"**
     - Direct shortcuts to change Size and Color, reflecting immediately and saving to account prefs.

2. **Drag & Drop Support:**
   - Drop listener on `.art-video-player`: dropping an `.srt` or `.vtt` file immediately parses and enables the subtitle, displaying a confirmation toast: *"Legenda carregada: [nome]"*.

3. **Visual Aesthetics & CSS Styling:**
   - Configure Artplayer's `.art-subtitle` container using dynamic CSS custom properties:
     - `--tvz-sub-size`
     - `--tvz-sub-color`
     - `--tvz-sub-shadow`
     - `--tvz-sub-bg`
   - Ensure Artplayer subtitles do not collide with player controls, the timeline bar, or mobile double-tap seek indicators.

---

## 4. Phased Implementation Roadmap

- **Phase 1: Foundation & Account Preferences Sync**
  - Update `playerPrefs.js` with subtitle defaults.
  - Update `syncMerge.js` with validation and cloud merge rules.
  - Update `settingsPage.js` to render the new Subtitle configuration cards.
  - Run `tools/check_js.py` and test account sync persistence.

- **Phase 2: Subtitle Ingestion, Safe Decoding & Parsing**
  - Implement `assets/js/player/subtitles.js` (isolated helper module for file reading, encoding detection, SRT->VTT parsing, and IndexedDB caching).
  - Write test script `tools/test_subtitles.mjs` verifying parsing and Windows-1252 / UTF-8 detection.

- **Phase 3: Artplayer Integration & Offset Controls**
  - Wire external subtitle loader into `refreshSubtitleMenu` in `assets/js/player/engine.js`.
  - Implement the offset controller with real-time cue shifting and persistence into `watchProgress`.
  - Add Drag & Drop listeners on desktop.

- **Phase 4: Automated Checks, Responsive Verification & Staging Deploy**
  - Automated tests: SRI integrity, CSP validation (`test_browser_sri.mjs`), UI touch check (`player_touch_check.mjs`).
  - Cache version bump via `python tools/bump_version.py`.
  - Merge into `staging` and verify live preview on `https://staging.tvzinhaonline.pages.dev/`.

---

## 5. Verification Matrix & Edge Cases

| Test Case | Expected Behavior |
| :--- | :--- |
| UTF-8 `.srt` upload | Parsed seamlessly, cues aligned, Brazilian accents (`ç`, `ã`) intact |
| Windows-1252 / ANSI `.srt` upload | Auto-fallback prevents mojibake (``), accented words render correctly |
| Mobile touch upload (Android/iOS) | Native file picker opens; selecting file does not disrupt player orientation |
| Drag & Drop on desktop player | Drops file, converts to VTT blob, activates subtitle and shows toast |
| Offset adjustment (`+1.5s`) | Cues advance cleanly without cumulative drift; persists on page reload |
| Account sync across devices | Subtitle size/color/bg chosen on Device A immediately applies on Device B |
| Fullscreen & player rotation | Subtitles scale responsively without clipping bottom controls |
| Stream without native subtitles | Subtitle menu displays "Nenhuma disponível" + "Carregar legenda externa..." |

