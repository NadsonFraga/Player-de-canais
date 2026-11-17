# Handover: FenixFlix Audio Compatibility & Stream Tier Ranking

**Date:** 2026-10-28  
**Feature:** `feat/fenixflix-audio-compatibility`  
**Base:** `staging`  
**Deploy Staging Preview:** `https://staging.tvzinhaonline.pages.dev`  
**Version:** `20261028_2242`  

---

## Context
The user reported that *Rick and Morty* (S08E04 / Ep. 75 – "The Last Temptation of Jerry") had no audio on FenixFlix.

## Root Cause
FenixFlix returns un-transcoded bot torrent streams (`squareweb.app`, `fenixbot`, `koyeb.app`) as well as dedicated web VOD streams (`fenixhub.online`). The bot torrent streams serve raw MKVs with `A_EAC3` (Dolby Digital Plus 5.1). Browsers cannot decode E-AC-3 in HTML5 video elements, leading to silent playback. Previous tier ranking placed `squareweb.app` in Tier 4 alongside `fenixhub.online`, causing the silent MKV to be prioritized over MP4s with AAC audio (Zeus/Badger) and HLS streams (Hollymovies).

## Changes
1. **Tier Ranking Refinement:**
   - **Tier 4:** `fenixhub.online` (official web VOD masters with universal `mp4a` AAC stereo audio).
   - **Tier 3:** `zunder`, `zunderflix` (verified mirrors / direct CDNs).
   - **Tier 2:** `hollymovies`, `embedplayer2` (third-party scrapers & adaptive HLS with AAC).
   - **Tier 1:** `squareweb.app`, `koyeb.app`, `fenixbot`, or any `/stream/` endpoint (un-transcoded bot torrent streams with E-AC-3 audio, kept as last-resort fallback).
2. **Synchronized Stack:**
   - `assets/js/player/clientProviders.js`
   - `functions/api/providers.js`
   - `tools/local_providers.py`
3. **Version Stamp:**
   - Bumped to `20261028_2242`.

## Verification Status
- Import integrity check: PASSED (0 missing imports).
- Security headers check: PASSED (0 failures).
- CORS origin test: PASSED (0 failures).
- XSS prevention test: PASSED (24/24 passed).
- Rick & Morty S08E04 selects Tier 4 `fenixhub.online` (Badger/Zeus) with AAC audio.

