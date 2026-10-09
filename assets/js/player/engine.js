/**
 * TVZINHA ONLINE - Streaming Engine V3 (Player Unified Controller)
 * Pure player controller with zero upward imports into business or navigation modules
 */

import { store } from '../core/state.js?v=20261009_i';
import { STREAM_ENGINE_API_BASE } from '../core/constants.js?v=20261009_i';
import { showToast } from '../core/toast.js?v=20261009_i';
import { setPlaybackActiveState } from '../core/wakeLock.js?v=20261009_i';
import { syncToLiveEdge, updateLiveStatusBadge, setupLiveLatencySync } from './liveLatency.js?v=20261009_i';
import { fetchAniSkipSegments } from './skipSegments.js?v=20261009_i';

// Global player references for cross-environment inspection and controls
if (typeof window !== 'undefined') {
    window.tvArtInstance = null;
    window.tvHlsInstance = null;
    window.tvWatchdogTimer = null;
    window.tvLiveInterval = null;
    window.artInstance = null;
    window.hlsInstance = null;
    window.cascadeTimer = null;
    window.activeAniSkipData = null;
}

/**
 * Automatically locks mobile device orientation to landscape upon entering True Fullscreen,
 * and restores default orientation upon exit (Android / Chromium Screen Orientation API).
 */
export function setupMobileOrientationLock(art) {
    if (!art) return;
    art.on('fullscreen', (isFullscreen) => {
        if (isFullscreen) {
            if (typeof screen !== 'undefined' && screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(() => {
                    // Gracefully ignored on platforms without orientation lock support (e.g. iOS WebKit)
                });
            }
        } else {
            if (typeof screen !== 'undefined' && screen.orientation && screen.orientation.unlock) {
                try {
                    screen.orientation.unlock();
                } catch (e) {}
            }
        }
    });
}

// Fallback document listener to guarantee orientation unlocks upon back gesture or system exit
if (typeof document !== 'undefined') {
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && typeof screen !== 'undefined' && screen.orientation && screen.orientation.unlock) {
            try {
                screen.orientation.unlock();
            } catch (e) {}
        }
    });
}

/**
 * Stops a <video> download for good. Artplayer.destroy() only detaches the element,
 * which keeps an MP4 transfer open; hosts that cap connections per account
 * (fontedecanais allows ~3) then stall every next title.
 */
function releaseVideoElement(video) {
    if (!video) return;
    try {
        video.pause();
        video.removeAttribute('src');
        video.load();
    } catch (e) {
        // Element already gone
    }
}

// Arrow keys and the mobile double tap skip this many seconds in movies, series and anime
const NATIVE_SEEK_STEP_S = 10;
// A double tap in the outer 40% on each side skips; the middle keeps play/pause
const DOUBLE_TAP_SIDE_ZONE = 0.4;
const CHEVRON_ATTRS = 'width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
const SEEK_FLASH_ICONS = {
    left: `<svg ${CHEVRON_ATTRS}><polyline points="15 18 9 12 15 6"></polyline></svg>`,
    right: `<svg ${CHEVRON_ATTRS}><polyline points="9 18 15 12 9 6"></polyline></svg>`,
};

const VOLUME_ICONS = {
    high: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    low: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>',
    muted: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/></svg>',
};

/**
 * Replaces Artplayer's volume control (a vertical panel that opens over the progress bar) with a button
 * plus a horizontal slider that grows to its right, so it never covers the bar. The original is hidden by CSS.
 */
export function installHorizontalVolume(art) {
    if (!art || !art.controls || art.tvzVolumeInstalled) return;
    art.tvzVolumeInstalled = true;
    try {
        art.controls.add({
            name: 'tvz-volume',
            position: 'left',
            index: 20,
            html: `<button type="button" class="tvz-volume-btn" aria-label="Silenciar ou ativar o som"></button><input class="tvz-volume-range" type="range" min="0" max="100" step="1" aria-label="Volume">`,
            mounted($control) {
                const button = $control.querySelector('.tvz-volume-btn');
                const range = $control.querySelector('.tvz-volume-range');
                const sync = () => {
                    const level = art.muted ? 0 : art.volume;
                    range.value = Math.round(level * 100);
                    range.style.setProperty('--tvz-fill', `${range.value}%`);
                    button.innerHTML = level === 0 ? VOLUME_ICONS.muted : (level < 0.5 ? VOLUME_ICONS.low : VOLUME_ICONS.high);
                };
                button.addEventListener('click', () => {
                    art.muted = !art.muted;
                    if (!art.muted && art.volume === 0) art.volume = 0.5;
                    sync();
                });
                range.addEventListener('input', () => {
                    const level = Number(range.value) / 100;
                    art.volume = level;
                    art.muted = level === 0;
                    sync();
                });
                art.on('video:volumechange', sync);
                sync();
            },
        });
    } catch (e) {
        console.warn("[PlayerEngine] Falha ao instalar o controle de volume:", e);
    }
}

/**
 * Mobile only: double tap on the left side goes back 10 s, on the right side forward 10 s (the middle toggles
 * play/pause as before). Needs Artplayer.MOBILE_DBCLICK_PLAY = false, otherwise Artplayer toggles play first.
 * A short label confirms the jump. Live players do not use it.
 */
export function installDoubleTapSeek(art) {
    const player = art && art.template && art.template.$player;
    if (!player || art.tvzDoubleTapSeek) return;
    art.tvzDoubleTapSeek = true;

    const flash = document.createElement('div');
    flash.className = 'tvz-seek-flash';
    player.appendChild(flash);
    let hideTimer = null;
    const showFlash = (side, text) => {
        // Static markup only (an icon and a number), never data from outside
        flash.innerHTML = side === 'left'
            ? `${SEEK_FLASH_ICONS.left}<span>${text}</span>`
            : `<span>${text}</span>${SEEK_FLASH_ICONS.right}`;
        flash.dataset.side = side;
        flash.classList.add('is-visible');
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => flash.classList.remove('is-visible'), 650);
    };

    art.on('dblclick', (event) => {
        if (!player.classList.contains('art-mobile') || !(art.duration > 0)) return;
        // Taps on the control bar, menus and overlays are not skips
        if (event && event.target && event.target.closest && event.target.closest('.art-bottom, .art-settings, .art-contextmenus, .art-info, .tvz-upnext')) return;

        const box = player.getBoundingClientRect();
        const point = event && event.changedTouches ? event.changedTouches[0] : event;
        const x = (point && Number.isFinite(point.clientX) ? point.clientX : box.left + box.width / 2) - box.left;
        const zone = x / box.width;

        if (zone <= DOUBLE_TAP_SIDE_ZONE) {
            art.seek = Math.max(0, art.currentTime - NATIVE_SEEK_STEP_S);
            showFlash('left', `- ${NATIVE_SEEK_STEP_S} s`);
        } else if (zone >= 1 - DOUBLE_TAP_SIDE_ZONE) {
            art.seek = Math.min(art.duration - 0.5, art.currentTime + NATIVE_SEEK_STEP_S);
            showFlash('right', `+ ${NATIVE_SEEK_STEP_S} s`);
        } else {
            art.toggle();
        }
    });
}

/**
 * Resets the TV player instances, timers, and containers cleanly
 */
export function atomicTvPlayerReset() {
    if (typeof window !== 'undefined' && window.tvzinhaSetContingencyState) {
        window.tvzinhaSetContingencyState(false);
    }
    setPlaybackActiveState(false);

    if (window.tvWatchdogTimer) {
        clearTimeout(window.tvWatchdogTimer);
        window.tvWatchdogTimer = null;
    }
    if (window.tvLiveInterval) {
        clearInterval(window.tvLiveInterval);
        window.tvLiveInterval = null;
    }

    if (window.tvArtInstance) {
        try {
            window.tvArtInstance.pause();
            releaseVideoElement(window.tvArtInstance.video);
            window.tvArtInstance.destroy(true);
        } catch (e) {
            console.warn("[TvArtplayer] Notice during instance destruction:", e);
        }
        window.tvArtInstance = null;
    }

    if (window.tvHlsInstance) {
        try {
            window.tvHlsInstance.stopLoad();
            window.tvHlsInstance.detachMedia();
            window.tvHlsInstance.destroy();
        } catch (e) {
            console.warn("[TvHLS] Notice during Hls.js destruction:", e);
        }
        window.tvHlsInstance = null;
    }

    const tvContainer = document.getElementById("tv-artplayer-container");
    if (tvContainer) {
        tvContainer.innerHTML = "";
        tvContainer.classList.add("hidden");
    }

    // The contingency player is an iframe: only emptying it stops its audio. (A hidden iframe keeps playing.)
    const contingencyFrame = document.getElementById("stream-iframe");
    if (contingencyFrame) {
        contingencyFrame.onload = null;
        contingencyFrame.src = "about:blank";
        contingencyFrame.classList.add("hidden");
    }
}

/**
 * Resets all active players (TV, Movies, Series, Anime) across the application
 */
export function atomicPlayerReset() {
    // Detach the native session first so events from the instances being destroyed are ignored
    activeNativeSession = null;
    atomicTvPlayerReset();
    setPlaybackActiveState(false);

    if (window.cascadeTimer) {
        clearTimeout(window.cascadeTimer);
        window.cascadeTimer = null;
    }

    if (window.artInstance) {
        try {
            window.artInstance.pause();
            releaseVideoElement(window.artInstance.video);
            window.artInstance.destroy(true);
        } catch (e) {
            console.warn("[Artplayer] Notice during instance destruction:", e);
        }
        window.artInstance = null;
    }

    if (window.hlsInstance) {
        try {
            window.hlsInstance.stopLoad();
            window.hlsInstance.detachMedia();
            window.hlsInstance.destroy();
        } catch (e) {
            console.warn("[HLS] Notice during Hls.js destruction:", e);
        }
        window.hlsInstance = null;
    }

    const movieContainer = document.getElementById("movie-artplayer-container");
    if (movieContainer) {
        movieContainer.innerHTML = "";
        movieContainer.classList.add("hidden");
    }

    const seriesContainer = document.getElementById("series-artplayer-container");
    if (seriesContainer) {
        seriesContainer.innerHTML = "";
        seriesContainer.classList.add("hidden");
    }

    // Comprehensive DOM media sweep: force silence and detonate any orphan media elements
    const mediaElements = document.querySelectorAll("#movie-modal video, #movie-modal audio, #movie-modal iframe, #series-player-view video, #series-player-view audio, #series-player-view iframe, #series-modal iframe, #movie-artplayer-container video, #series-artplayer-container video");
    mediaElements.forEach(el => {
        try {
            if (el.tagName === "VIDEO" || el.tagName === "AUDIO") {
                el.pause();
                el.removeAttribute("src");
                el.load();
            } else if (el.tagName === "IFRAME") {
                el.src = "about:blank";
            }
        } catch (e) {
            console.warn("[PlayerEngine] Error during media element purge:", e);
        }
    });
}

/**
 * Keyboard shortcuts handler for the TV Player
 */
export function handleTvKeyboardShortcuts(e, art) {
    if (!art || !art.video) return;
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    const vid = art.video;
    switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
            e.preventDefault();
            art.toggle();
            break;
        case 'm':
        case 'M':
            e.preventDefault();
            art.muted = !art.muted;
            showToast(art.muted ? "Mudo ativado" : "Som ativado");
            break;
        case 'f':
        case 'F':
            e.preventDefault();
            art.fullscreen.toggle();
            break;
        case 'l':
        case 'L':
            e.preventDefault();
            syncToLiveEdge(art, window.tvHlsInstance, document.getElementById("tv-artplayer-container"));
            break;
        case 'ArrowLeft':
            e.preventDefault();
            if (vid.seekable && vid.seekable.length > 0) {
                const start = vid.seekable.start(0);
                vid.currentTime = Math.max(start, vid.currentTime - 10);
            } else {
                vid.currentTime = Math.max(0, vid.currentTime - 10);
            }
            break;
        case 'ArrowRight':
            e.preventDefault();
            if (vid.seekable && vid.seekable.length > 0) {
                const end = vid.seekable.end(vid.seekable.length - 1);
                vid.currentTime = Math.min(end, vid.currentTime + 10);
            } else {
                vid.currentTime += 10;
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            art.volume = Math.min(1, art.volume + 0.05);
            break;
        case 'ArrowDown':
            e.preventDefault();
            art.volume = Math.max(0, art.volume - 0.05);
            break;
    }
}

// Global document keyboard listener for TV player shortcuts (e.g. L to sync, space/k to toggle, m to mute, f to fullscreen)
if (typeof document !== 'undefined') {
    document.addEventListener("keydown", (e) => {
        const tag = (document.activeElement && document.activeElement.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;

        if (window.tvArtInstance && window.tvArtInstance.video) {
            if (['l', 'L', ' ', 'k', 'K', 'm', 'M', 'f', 'F'].includes(e.key)) {
                handleTvKeyboardShortcuts(e, window.tvArtInstance);
            }
        }
    });
}

/**
 * Handles error state when all direct HLS sources of a channel fail
 */
export function handleAllDirectSourcesFailed(onRetry = null) {
    atomicTvPlayerReset();

    const tvContainer = document.getElementById("tv-artplayer-container");
    const loader = document.getElementById("video-loader");
    const iframe = document.getElementById("stream-iframe");

    if (loader) loader.classList.add("hidden");
    if (iframe) {
        iframe.src = "";
        iframe.classList.add("hidden");
    }

    if (tvContainer) {
        tvContainer.classList.remove("hidden");
        tvContainer.innerHTML = `
            <div class="channel-direct-error-overlay">
                <svg width="44" height="44" fill="none" stroke="#ef4444" stroke-width="1.6" viewBox="0 0 24 24" style="margin-bottom:14px;">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
                </svg>
                <div class="error-overlay-title">Transmissão Direta Instável</div>
                <div class="error-overlay-desc">
                    Os links diretos deste canal estão temporariamente indisponíveis na CDN.
                    Você pode tentar reconectar ou selecionar manualmente uma opção de <strong>Contingência</strong> no seletor abaixo.
                </div>
                <div class="error-overlay-actions">
                    <button id="btn-retry-direct-channel" class="btn-error-retry">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                        </svg>
                        Tentar Reconectar
                    </button>
                </div>
            </div>
        `;

        const retryBtn = tvContainer.querySelector("#btn-retry-direct-channel");
        if (retryBtn && typeof onRetry === 'function') {
            retryBtn.addEventListener("click", onRetry);
        }
    }

    showToast("Transmissão direta indisponível. Alterne para a contingência abaixo se desejar.", 4500);
}

/**
 * Mounts a TV channel using direct HLS stream via Artplayer + Hls.js
 */
export function mountTvDirectStream(channelData, sourceIndex = 0, onAllDirectFailed = null) {
    atomicTvPlayerReset();

    const tvContainer = document.getElementById("tv-artplayer-container");
    const loader = document.getElementById("video-loader");
    const iframe = document.getElementById("stream-iframe");

    if (iframe) {
        iframe.src = "";
        iframe.classList.add("hidden");
    }
    if (tvContainer) {
        tvContainer.innerHTML = "";
        tvContainer.classList.remove("hidden");
    }
    if (loader) {
        loader.classList.remove("hidden");
    }

    const sources = (channelData && channelData.sources) || [];
    if (!sources || sources.length === 0) {
        if (typeof onAllDirectFailed === 'function') onAllDirectFailed();
        else handleAllDirectSourcesFailed();
        return;
    }

    let currentIndex = sourceIndex >= 0 && sourceIndex < sources.length ? sourceIndex : 0;
    const currentSource = sources[currentIndex];
    let isStreamWorking = false;

    function triggerDirectCascade(reason) {
        if (isStreamWorking) return;
        console.warn(`[TvPlayer] Falha na fonte ${currentIndex + 1}/${sources.length} (${currentSource.name}): ${reason}`);

        if (currentIndex + 1 < sources.length) {
            const nextIndex = currentIndex + 1;
            showToast(`Alternando para servidor reserva: ${sources[nextIndex].name}...`, 2500);
            mountTvDirectStream(channelData, nextIndex, onAllDirectFailed);
        } else {
            console.warn("[TvPlayer] Todas as fontes diretas esgotadas.");
            if (typeof onAllDirectFailed === 'function') onAllDirectFailed();
            else handleAllDirectSourcesFailed(() => mountTvDirectStream(channelData, 0, onAllDirectFailed));
        }
    }

    // 12-second Watchdog Timer for stall/timeout detection
    window.tvWatchdogTimer = setTimeout(() => {
        if (!isStreamWorking) {
            triggerDirectCascade("Tempo limite de carregamento (12s) esgotado");
        }
    }, 12000);

    try {
        window.Artplayer.SEEK_STEP = 5;
        window.Artplayer.MOBILE_DBCLICK_PLAY = true;
        const art = new window.Artplayer({
            container: '#tv-artplayer-container',
            url: currentSource.url,
            type: 'm3u8',
            isLive: true,
            autoplay: true,
            autoMini: true,
            theme: '#22c55e',
            volume: 0.9,
            muted: false,
            fullscreen: true,
            fullscreenWeb: false,
            pip: true,
            setting: true,
            loop: false,
            flip: false,
            playbackRate: false,
            aspectRatio: false,
            customType: {
                m3u8: function (video, url, artInstance) {
                    if (window.Hls && window.Hls.isSupported()) {
                        if (window.tvHlsInstance) {
                            window.tvHlsInstance.destroy();
                        }
                        const hls = new window.Hls({
                            enableWorker: true,
                            lowLatencyMode: true,
                            backBufferLength: 60,
                            maxBufferLength: 20,
                            maxMaxBufferLength: 40,
                            liveSyncDurationCount: 3,
                            liveMaxLatencyDurationCount: 8,
                            liveDurationInfinity: true,
                            manifestLoadingTimeOut: 10000,
                            manifestLoadingMaxRetry: 3,
                            levelLoadingTimeOut: 10000,
                            levelLoadingMaxRetry: 3
                        });
                        hls.loadSource(url);
                        hls.attachMedia(video);
                        window.tvHlsInstance = hls;

                        hls.on(window.Hls.Events.MANIFEST_PARSED, (event, data) => {
                            if (data.levels && data.levels.length > 1) {
                                const audioSelectors = data.levels.map((lvl, idx) => ({
                                    default: idx === hls.currentLevel,
                                    html: `${lvl.height ? lvl.height + 'p' : 'Auto'} (${Math.round(lvl.bitrate / 1000)}k)`,
                                    levelIndex: idx
                                }));
                                audioSelectors.unshift({ default: true, html: 'Automático', levelIndex: -1 });

                                artInstance.setting.add({
                                    id: 'tv-quality-selector',
                                    name: 'Qualidade',
                                    width: 200,
                                    tooltip: 'Auto',
                                    selector: audioSelectors,
                                    onSelect: function (item) {
                                        hls.currentLevel = item.levelIndex;
                                        return item.html;
                                    }
                                });
                            }

                            // Start live latency background monitor
                            if (window.tvLiveInterval) clearInterval(window.tvLiveInterval);
                            window.tvLiveInterval = setInterval(() => {
                                updateLiveStatusBadge(tvContainer, artInstance, hls);
                            }, 2500);
                        });

                        hls.on(window.Hls.Events.ERROR, (event, data) => {
                            if (data.fatal) {
                                switch (data.type) {
                                    case window.Hls.ErrorTypes.NETWORK_ERROR:
                                        console.warn("[TvHLS] Fatal Network Error. Tentando recuperar...");
                                        hls.startLoad();
                                        break;
                                    case window.Hls.ErrorTypes.MEDIA_ERROR:
                                        console.warn("[TvHLS] Fatal Media Error. Tentando recuperar...");
                                        hls.recoverMediaError();
                                        break;
                                    default:
                                        triggerDirectCascade(`HLS Fatal Error: ${data.details}`);
                                        break;
                                }
                            }
                        });
                    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = url;
                    } else {
                        triggerDirectCascade("HLS não suportado neste navegador");
                    }
                }
            }
        });

        window.tvArtInstance = art;

        // Settings items
        art.setting.add({
            id: 'tv-sync-mode',
            name: 'Modo Sincronia',
            width: 240,
            tooltip: 'Tempo Real',
            selector: [
                { default: true, html: 'Tempo Real (Baixa Latência)' },
                { default: false, html: 'Estabilidade (Buffer Expandido)' }
            ],
            onSelect: function (item) {
                const hls = window.tvHlsInstance;
                if (hls && hls.config) {
                    if (item.html.includes('Estabilidade')) {
                        hls.config.maxLiveSyncPlaybackRate = 1.0;
                        hls.config.liveSyncDurationCount = 5;
                        showToast("Modo Estabilidade ativado (buffer expandido)");
                    } else {
                        hls.config.maxLiveSyncPlaybackRate = 1.15;
                        hls.config.liveSyncDurationCount = 3;
                        showToast("Modo Tempo Real ativado");
                    }
                }
                return item.html;
            }
        });

        art.setting.add({
            id: 'tv-server-info',
            name: 'Servidor Ativo',
            width: 250,
            tooltip: currentSource.name,
            selector: [
                { default: true, html: `${currentSource.name} • ${currentSource.cdn || 'CDN 1'}` }
            ],
            onSelect: function (item) {
                return item.html;
            }
        });

        // Live-Edge Sync Control Button
        art.controls.add({
            name: 'live-sync-button',
            position: 'left',
            html: '<button type="button" class="art-live-badge-btn is-live" title="Sincronizar com transmissão ao vivo (L)"><span class="art-live-dot"></span><span class="art-live-label">AO VIVO</span></button>',
            click: function () {
                syncToLiveEdge(art, window.tvHlsInstance, tvContainer);
            }
        });

        window.tvArtInstance = art;
        setupMobileOrientationLock(art);
        installHorizontalVolume(art);

        // Artplayer Life-Cycle Events
        art.on('ready', () => {
            isStreamWorking = true;
            if (loader) loader.classList.add("hidden");
            setPlaybackActiveState(true);
            if (window.tvWatchdogTimer) {
                clearTimeout(window.tvWatchdogTimer);
                window.tvWatchdogTimer = null;
            }
            updateLiveStatusBadge(tvContainer, art, window.tvHlsInstance, true, 0);
        });

        art.on('video:playing', () => {
            isStreamWorking = true;
            if (window.tvWatchdogTimer) {
                clearTimeout(window.tvWatchdogTimer);
                window.tvWatchdogTimer = null;
            }
            if (loader) loader.classList.add("hidden");
            setPlaybackActiveState(true);
            updateLiveStatusBadge(tvContainer, art, window.tvHlsInstance, true, 0);
        });

        art.on('video:pause', () => {
            setPlaybackActiveState(false);
            updateLiveStatusBadge(tvContainer, art, window.tvHlsInstance);
        });

        art.on('error', (err) => {
            console.warn("[TvArtplayer] Error on video element:", err);
            triggerDirectCascade("Erro no elemento de vídeo");
        });

        art.on('keydown', (event) => {
            handleTvKeyboardShortcuts(event, art);
        });

    } catch (e) {
        console.error("[TvPlayer] Exception during native mount:", e);
        triggerDirectCascade("Exceção na montagem");
    }
}

/**
 * Mounts a TV channel using an authorized contingency iframe
 */
export function mountTvContingencyIframe(contingencyUrl) {
    atomicTvPlayerReset();

    const tvContainer = document.getElementById("tv-artplayer-container");
    const iframe = document.getElementById("stream-iframe");
    const loader = document.getElementById("video-loader");

    if (tvContainer) {
        tvContainer.innerHTML = "";
        tvContainer.classList.add("hidden");
    }
    if (loader) {
        loader.classList.remove("hidden");
    }
    if (iframe) {
        if (window.tvzinhaArmIframeGuard) {
            window.tvzinhaArmIframeGuard(iframe);
        }
        if (window.tvzinhaSetContingencyState) {
            window.tvzinhaSetContingencyState(true);
        }
        iframe.classList.remove("hidden");
        iframe.src = contingencyUrl;
        iframe.onload = () => {
            if (loader) loader.classList.add("hidden");
            setPlaybackActiveState(true);
        };
        setTimeout(() => {
            if (loader) loader.classList.add("hidden");
        }, 3000);
    }
}

// Source URLs carry expiring tokens, so cached resolves are kept for a short time only
const RESOLVE_CACHE_TTL_MS = 20 * 60 * 1000;
const resolveCache = new Map();

/**
 * Resolves direct media stream via local or remote proxy API
 */
export async function resolveDirectStream({ id, type, season = 1, episode = 1, lang = 'dub', title = '', original_title = '', year = '', season_name = '', mal_id = null, imdb_id = null, absolute_episode = '', total_episodes = '', aniskip_only = false }) {
    const params = new URLSearchParams();
    if (id) params.set("id", id);
    if (type) params.set("type", type);
    params.set("season", season);
    params.set("episode", episode);
    if (absolute_episode) params.set("absolute_episode", absolute_episode);
    if (total_episodes) params.set("total_episodes", total_episodes);
    params.set("lang", lang);
    if (title) params.set("title", title);
    if (original_title) params.set("original_title", original_title);
    if (year) params.set("year", year);
    if (season_name) params.set("season_name", season_name);
    if (mal_id) params.set("mal_id", mal_id);
    if (imdb_id) params.set("imdb_id", imdb_id);
    if (aniskip_only) params.set("aniskip_only", "1");

    const url = `${STREAM_ENGINE_API_BASE}/api/resolve?${params.toString()}`;

    // Reuse a fresh (or in-flight) resolve: prefetched next episodes and reopened titles skip the wait
    const cached = resolveCache.get(url);
    if (cached && Date.now() - cached.at < RESOLVE_CACHE_TTL_MS) return cached.promise;

    const promise = (async () => {
        try {
            const res = await fetch(url);
            if (!res.ok) return null;
            const data = await res.json();
            return data && data.success ? data : null;
        } catch (err) {
            console.error("[StreamEngine] Erro ao resolver stream:", err);
            return null;
        }
    })();
    resolveCache.set(url, { at: Date.now(), promise });
    // Failures are not cached, so the next attempt asks the server again
    promise.then(data => {
        if (!data && resolveCache.get(url)?.promise === promise) resolveCache.delete(url);
    });
    return promise;
}

/** Resolves in the background (e.g. the next episode) so a later resolveDirectStream() is instant. */
export function prefetchDirectStream(options) {
    resolveDirectStream(options).then(data => {
        if (data) console.info("[StreamEngine] Pré-carregado:", options.title, `T${options.season}E${options.episode}`);
    });
}

/* ============================================================
 * NATIVE PLAYER (Movies, Series, Anime)
 * Sources arrive ranked best-first from /api/resolve (quality, qualities, kind).
 * One session holds every source so the "Qualidade" menu can list all
 * resolutions and switch between sources while keeping the position.
 * ============================================================ */

// Start budget per source before failing over to the next one
const NATIVE_START_BUDGET_HLS_MS = 12000;
// MP4 reports no progress until its moov box (often 4-6 MB) is downloaded, so it gets more time
const NATIVE_START_BUDGET_MP4_MS = 20000;
// The last remaining source is given up to this long before the error screen
const NATIVE_START_BUDGET_LAST_SOURCE_MS = 90000;
// This much buffered ahead without playback means the source is stuck, not slow
const NATIVE_STUCK_BUFFER_S = 10;
const NATIVE_STUCK_GRACE_MS = 3000;
// Largest gap at the start (empty first segments) the player jumps over
const NATIVE_START_GAP_MAX_S = 30;
// onNearEnd fires with this much left (next-episode prefetch keeps fresh links)
const NATIVE_NEAR_END_S = 180;
// "Próximo episódio" countdown length before the end when the ending is known (it is offered at the ending already)
const NATIVE_UP_NEXT_S = 10;
// Same countdown when the ending is not known: earlier, since there was no offer before. It ends with the video,
// so a scene after the credits is covered by the card, never cut
const NATIVE_UP_NEXT_NO_DATA_S = 30;
// An ending followed by more than this (a scene or a preview) also offers "Pular encerramento"
const SKIP_OUTRO_TAIL_S = 10;
const NATIVE_SETTING_WIDTH = 230;
const NATIVE_SETTING_ORDER = ['quality', 'audio', 'subtitle', 'playback-rate', 'fit'];
// "Tela": Ajustar shows the whole picture (bars when the shape differs), Preencher covers the box and crops the edges
const FIT_OPTIONS = [{ value: 'contain', html: 'Ajustar' }, { value: 'cover', html: 'Preencher' }];
const FIT_STORAGE_KEY = 'tvz-video-fit';
// Shown when the stream carries a single audio track (no separate dub/sub renditions to choose from)
const AUDIO_SINGLE_LABEL = 'Original';
const SUBTITLES_NONE_LABEL = 'Nenhuma disponível';

const NATIVE_ICONS = {
    quality: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/><circle cx="9" cy="7" r="2.2" fill="#000"/><circle cx="15" cy="12" r="2.2" fill="#000"/><circle cx="7" cy="17" r="2.2" fill="#000"/></svg>',
    audio: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    fit: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4"/></svg>',
    subtitle: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M10.5 10.2a2.2 2.2 0 1 0 0 3.6M16.5 10.2a2.2 2.2 0 1 0 0 3.6" stroke-linecap="round"/></svg>'
};

const NATIVE_I18N = {
    'pt-br': {
        'Play': 'Reproduzir',
        'Pause': 'Pausar',
        'Volume': 'Volume',
        'Fullscreen': 'Tela cheia',
        'Exit Fullscreen': 'Sair da tela cheia',
        'Web Fullscreen': 'Tela cheia na janela',
        'Exit Web Fullscreen': 'Sair da tela cheia na janela',
        'PIP Mode': 'Picture-in-picture',
        'Exit PIP Mode': 'Sair do picture-in-picture',
        'PIP Not Supported': 'Picture-in-picture não suportado',
        'Fullscreen Not Supported': 'Tela cheia não suportada',
        'Show Setting': 'Configurações',
        'Hide Setting': 'Fechar configurações',
        'Play Speed': 'Velocidade',
        'Normal': 'Normal',
        'Aspect Ratio': 'Proporção',
        'Default': 'Padrão',
        'Video Flip': 'Espelhar',
        'Horizontal': 'Horizontal',
        'Vertical': 'Vertical',
        'Screenshot': 'Captura de tela',
        'Close': 'Fechar',
        'Reconnect': 'Reconectando',
        'Video Load Failed': 'Falha ao carregar o vídeo',
        'Switch Video': 'Trocar vídeo',
        'Switch Subtitle': 'Trocar legenda',
        'Subtitle Offset': 'Atraso da legenda',
        'AirPlay': 'AirPlay',
        'AirPlay Not Available': 'AirPlay indisponível',
        'Video Info': 'Informações do vídeo'
    }
};

// Only the most recent native session may react to player events
let activeNativeSession = null;
let nativeSessionCounter = 0;

/**
 * Maps a frame size to a standard quality class (2160, 1440, 1080, 720, 480, 360, 240).
 * Mirrors qualityClass() in functions/api/resolve.js.
 */
export function qualityClass(width, height) {
    const w = Number(width) || 0;
    const h = Number(height) || 0;
    const byW = w >= 3800 ? 2160 : w >= 2500 ? 1440 : w >= 1900 ? 1080 : w >= 1260 ? 720 : w >= 840 ? 480 : w >= 620 ? 360 : w > 0 ? 240 : 0;
    const byH = h >= 2000 ? 2160 : h >= 1400 ? 1440 : h >= 1000 ? 1080 : h >= 700 ? 720 : h >= 460 ? 480 : h >= 340 ? 360 : h > 0 ? 240 : 0;
    return Math.max(byW, byH) || null;
}

function qualityLabel(quality) {
    if (!quality) return 'Original';
    return quality >= 720 ? `${quality}p <sup class="tvz-quality-hd">HD</sup>` : `${quality}p`;
}

function qualityText(quality) {
    return quality ? `${quality}p` : '';
}

/**
 * Normalizes the sources accepted by mountNativePlayer: the new `sources` list,
 * or the legacy `streamUrl` + `fallbackSources` pair (objects or plain URLs).
 */
function normalizeNativeSources({ sources, streamUrl, fallbackSources = [] }) {
    const list = Array.isArray(sources) && sources.length
        ? sources
        : [streamUrl, ...(Array.isArray(fallbackSources) ? fallbackSources : [])];
    return list
        .filter(Boolean)
        .map(src => {
            const obj = typeof src === 'string' ? { stream_url: src } : src;
            const url = obj.stream_url || obj.url || '';
            const qualities = Array.isArray(obj.qualities) && obj.qualities.length
                ? [...obj.qualities].sort((a, b) => b - a)
                : (obj.quality ? [obj.quality] : []);
            return {
                url,
                type: obj.type || '',
                kind: obj.kind || 'unknown',
                label: obj.label || '',
                quality: qualities[0] || null,
                qualities,
                alive: obj.alive !== false
            };
        })
        .filter(src => src.url);
}

function isHlsSource(src) {
    if (src.type === 'hls') return true;
    if (src.type === 'mp4') return false;
    let decoded = src.url;
    try { decoded = decodeURIComponent(src.url); } catch (e) { /* keep raw URL */ }
    if (decoded.includes('.m3u8')) return true;
    if (decoded.includes('.mp4')) return false;
    return true;
}

/**
 * Mounts native Artplayer for Movies, Series and Anime.
 * Accepts `sources` (ranked list from /api/resolve) or the legacy `streamUrl` + `fallbackSources`.
 * `onNearEnd` runs once when NATIVE_NEAR_END_S or less is left (also right away on short videos),
 * e.g. to prefetch the next episode while its links are still fresh.
 * `getNextUp` returns { title, play } or null; when set, the last seconds show an
 * "Próximo episódio" countdown that plays it (cancelable), and the end of the video plays it too.
 * `aniskip` ({ mal_id, episode }, anime player only) looks up the opening, recap and ending once the video length is known.
 */
export function mountNativePlayer({ containerId, streamUrl, sources, title, poster, subtitles = [], fallbackSources = [], startTime = 0, onAllFailed = null, onNearEnd = null, getNextUp = null, aniskip = null }) {
    const normalized = normalizeNativeSources({ sources, streamUrl, fallbackSources });
    if (normalized.length === 0) {
        atomicPlayerReset();
        if (typeof onAllFailed === 'function') onAllFailed();
        return null;
    }

    const session = {
        id: ++nativeSessionCounter,
        containerId,
        title,
        poster,
        subtitles: Array.isArray(subtitles) ? subtitles : [],
        onAllFailed,
        onNearEnd,
        nearEndFired: false,
        getNextUp,
        upNextCancelled: false,
        // { mal_id, episode } or a promise of it (looked up in the background for anime played from another host)
        aniskip: aniskip || null,
        skipRequested: false,
        skipSegments: [],
        skipDismissed: new Set(),
        sources: normalized,
        failed: new Set(),
        currentIndex: 0,
        autoMode: true,
        lockedQuality: null,
        art: null,
        hls: null,
        mountToken: 0
    };
    return mountNativeSource(session, 0, { startTime });
}

function isSessionLive(session, token) {
    return activeNativeSession === session && (token === undefined || session.mountToken === token);
}

function nextPlayableIndex(session, preferQuality = null) {
    const candidates = session.sources
        .map((src, idx) => ({ src, idx }))
        .filter(({ src, idx }) => !session.failed.has(idx) && src.alive);
    if (preferQuality) {
        const match = candidates.find(({ src }) => src.qualities.includes(preferQuality));
        if (match) return match.idx;
    }
    if (candidates.length) return candidates[0].idx;
    // Sources the server flagged as unreachable are only tried as a last resort
    const lastResort = session.sources.findIndex((src, idx) => !session.failed.has(idx));
    return lastResort;
}

function currentPlaybackTime(session) {
    try {
        const t = session.art ? session.art.currentTime : 0;
        return Number.isFinite(t) && t > 1 ? t : 0;
    } catch (e) {
        return 0;
    }
}

/**
 * Marks the current source as failed and mounts the next best one,
 * resuming from the current position.
 */
function failoverNativeSource(session, reason) {
    if (!isSessionLive(session)) return;
    const resumeAt = currentPlaybackTime(session) || session.resumeAt || 0;
    session.failed.add(session.currentIndex);
    const nextIdx = nextPlayableIndex(session, session.autoMode ? null : session.lockedQuality);
    if (nextIdx < 0) {
        console.warn("[PlayerEngine] Todas as fontes diretas falharam.", reason || '');
        activeNativeSession = null;
        if (typeof session.onAllFailed === 'function') session.onAllFailed();
        return;
    }
    console.warn(`[PlayerEngine] Fonte ${session.currentIndex + 1} falhou (${reason}). Alternando para fonte ${nextIdx + 1}.`);
    session.statusNote = 'Fonte anterior não respondeu.';
    mountNativeSource(session, nextIdx, { startTime: resumeAt });
}

/**
 * Mounts one source of a session. Recreates Artplayer/Hls but keeps the session state.
 */
function mountNativeSource(session, index, { startTime = 0 } = {}) {
    atomicPlayerReset();
    activeNativeSession = session;
    session.currentIndex = index;
    session.mountToken += 1;
    session.resumeAt = startTime;
    session.hls = null;
    session.art = null;
    const token = session.mountToken;
    const source = session.sources[index];

    const container = document.getElementById(session.containerId);
    if (!container) return null;

    // Strict Modal Visibility Check: Abort instantly if user closed the modal before resolution completed
    if (session.containerId === "movie-artplayer-container") {
        const movieModal = document.getElementById("movie-modal");
        if (!movieModal || movieModal.classList.contains("hidden")) {
            console.warn("[PlayerEngine] Aborting mountNativePlayer: movie modal is closed/hidden.");
            activeNativeSession = null;
            return null;
        }
    } else if (session.containerId === "series-artplayer-container") {
        const seriesView = document.getElementById("series-player-view");
        if (!seriesView || seriesView.classList.contains("hidden")) {
            console.warn("[PlayerEngine] Aborting mountNativePlayer: series player view is closed/hidden.");
            activeNativeSession = null;
            return null;
        }
    }

    container.innerHTML = "";
    container.classList.remove("hidden");

    const isHls = isHlsSource(source);
    let hasStarted = false;
    const mountedAt = Date.now();

    function markStreamSuccess() {
        if (hasStarted || !isSessionLive(session, token)) return;
        hasStarted = true;
        if (window.cascadeTimer) {
            clearInterval(window.cascadeTimer);
            window.cascadeTimer = null;
        }
        session.statusNote = '';
        setSourceStatus(session, '');
        setPlaybackActiveState(true);
    }

    /**
     * Some hosts ship an empty first segment, so buffered data starts seconds after
     * the playhead and the video never starts. Jump to the first buffered range.
     */
    function jumpStartGap() {
        const video = session.art && session.art.video;
        if (hasStarted || !video || !video.buffered || !video.buffered.length) return;
        const t = video.currentTime;
        for (let i = 0; i < video.buffered.length; i++) {
            if (video.buffered.start(i) <= t + 0.1 && video.buffered.end(i) > t) return;
        }
        for (let i = 0; i < video.buffered.length; i++) {
            const start = video.buffered.start(i);
            if (start > t && start - t <= NATIVE_START_GAP_MAX_S) {
                console.info(`[PlayerEngine] Pulando ${(start - t).toFixed(1)}s sem mídia no início da fonte ${index + 1}.`);
                video.currentTime = start + 0.05;
                return;
            }
        }
    }

    function bufferedAhead() {
        const video = session.art && session.art.video;
        if (!video || !video.buffered || !video.buffered.length) return 0;
        return Math.max(0, video.buffered.end(video.buffered.length - 1) - video.currentTime);
    }

    // Start monitor: fail over when the source is stuck (data buffered, no playback)
    // or over its budget; the last remaining source is allowed to be slow.
    const budget = isHls ? NATIVE_START_BUDGET_HLS_MS : NATIVE_START_BUDGET_MP4_MS;
    let stuckSince = 0;
    window.cascadeTimer = setInterval(() => {
        if (hasStarted || !isSessionLive(session, token)) {
            clearInterval(window.cascadeTimer);
            return;
        }
        jumpStartGap();
        const now = Date.now();
        const elapsed = now - mountedAt;
        const hasAlternative = session.sources.some((src, idx) => idx !== session.currentIndex && !session.failed.has(idx));
        const limit = hasAlternative ? budget : NATIVE_START_BUDGET_LAST_SOURCE_MS;

        stuckSince = bufferedAhead() >= NATIVE_STUCK_BUFFER_S ? (stuckSince || now) : 0;
        const stuck = stuckSince && now - stuckSince >= NATIVE_STUCK_GRACE_MS;

        if ((stuck && hasAlternative) || elapsed >= limit) {
            clearInterval(window.cascadeTimer);
            console.warn(`[PlayerEngine] Fonte ${index + 1} sem reprodução após ${Math.round(elapsed / 1000)}s (${stuck ? 'travada' : 'tempo esgotado'}).`);
            failoverNativeSource(session, stuck ? 'stuck' : 'timeout');
        }
    }, 1000);

    const subtitles = session.subtitles;
    const defaultSubtitle = subtitles[defaultSubtitleIndex(subtitles)];
    // Taller rows and a wider main panel for the YouTube-like settings (Artplayer sizes panels from these constants)
    window.Artplayer.SETTING_ITEM_HEIGHT = 40;
    window.Artplayer.SETTING_WIDTH = 290;
    // Statics are read when the instance is created: arrows skip 10 s and the mobile double tap is ours
    window.Artplayer.SEEK_STEP = NATIVE_SEEK_STEP_S;
    window.Artplayer.MOBILE_DBCLICK_PLAY = false;

    try {
        const art = new window.Artplayer({
            container: `#${session.containerId}`,
            url: source.url,
            type: isHls ? 'm3u8' : 'mp4',
            title: session.title || 'Tvzinha Cinema',
            poster: session.poster || '',
            volume: 0.9,
            autoplay: true,
            autoMini: true,
            theme: '#22c55e',
            lang: 'pt-br',
            i18n: NATIVE_I18N,
            fullscreen: true,
            fullscreenWeb: false,
            pip: true,
            setting: true,
            flip: false,
            playbackRate: true,
            aspectRatio: false,
            hotkey: true,
            airplay: true,
            subtitle: subtitles.length > 0 ? {
                url: defaultSubtitle.url || defaultSubtitle.file,
                type: 'vtt',
                escape: false,
                style: {
                    color: '#ffffff',
                    fontSize: '20px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.9)',
                    fontWeight: '600'
                },
                encoding: 'utf-8',
            } : {},
            customType: {
                m3u8: function (video, url, artInstance) {
                    if (window.Hls && window.Hls.isSupported()) {
                        if (window.hlsInstance) {
                            window.hlsInstance.destroy();
                        }
                        const hls = new window.Hls({
                            enableWorker: true,
                            backBufferLength: 60,
                            maxBufferLength: 30,
                            maxMaxBufferLength: 60
                        });
                        hls.loadSource(url);
                        hls.attachMedia(video);
                        window.hlsInstance = hls;
                        session.hls = hls;

                        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
                            if (!isSessionLive(session, token)) return;
                            applyLockedLevel(session);
                            refreshQualityMenu(session);
                            refreshAudioMenu(session);
                        });

                        hls.on(window.Hls.Events.FRAG_BUFFERED, () => {
                            if (isSessionLive(session, token)) jumpStartGap();
                        });

                        hls.on(window.Hls.Events.LEVEL_SWITCHED, () => {
                            if (isSessionLive(session, token)) updateQualityIndicators(session);
                        });

                        hls.on(window.Hls.Events.AUDIO_TRACKS_UPDATED, () => {
                            if (isSessionLive(session, token)) refreshAudioMenu(session);
                        });

                        hls.on(window.Hls.Events.ERROR, (event, data) => {
                            if (!data.fatal || !isSessionLive(session, token)) return;
                            switch (data.type) {
                                case window.Hls.ErrorTypes.NETWORK_ERROR:
                                    // Manifest errors mean the source is unusable; fragment errors get one retry
                                    if (data.details && /manifest|level/i.test(data.details) && !hasStarted) {
                                        failoverNativeSource(session, data.details);
                                    } else {
                                        hls.startLoad();
                                    }
                                    break;
                                case window.Hls.ErrorTypes.MEDIA_ERROR:
                                    hls.recoverMediaError();
                                    break;
                                default:
                                    failoverNativeSource(session, data.details || 'hls');
                                    break;
                            }
                        });
                    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = url;
                    }
                }
            }
        });

        session.art = art;
        window.artInstance = art;
        setupMobileOrientationLock(art);
        installHorizontalVolume(art);
        installDoubleTapSeek(art);
        const total = session.sources.length;
        setSourceStatus(session, [session.statusNote, total > 1 ? `Conectando à fonte ${index + 1} de ${total}...` : 'Conectando...'].filter(Boolean).join(' '));

        art.on('ready', () => {
            if (!isSessionLive(session, token)) return;
            if (startTime > 0) {
                art.currentTime = startTime;
            }

            refreshQualityMenu(session);
            refreshAudioMenu(session);
            refreshSubtitleMenu(session);
            installFitSetting(art);

            const playPromise = art.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(err => {
                    if (err && (err.name === 'NotAllowedError' || err.name === 'AbortError')) {
                        console.log("[PlayerEngine] Autoplay travado pela política móvel. Vídeo pronto para toque.");
                        markStreamSuccess();
                    }
                });
            }
        });

        art.on('video:progress', () => {
            if (isSessionLive(session, token)) jumpStartGap();
        });

        art.on('video:loadedmetadata', () => {
            if (!isSessionLive(session, token)) return;
            measureCurrentQuality(session);
            requestSkipSegments(session);
            // A source switch builds a new progress bar: draw the known ranges again
            renderSkipRanges(session);
        });

        art.on('video:canplay', markStreamSuccess);
        art.on('video:playing', markStreamSuccess);

        art.on('video:pause', () => {
            setPlaybackActiveState(false);
        });

        art.on('video:timeupdate', () => {
            if (!isSessionLive(session, token)) return;
            // Some streams only report their length after a while: the lookup waits for it
            requestSkipSegments(session);
            handleEndApproach(session);
            updateSkipButton(session);
        });

        art.on('video:ended', () => {
            if (!isSessionLive(session, token)) return;
            const next = !session.upNextCancelled && typeof session.getNextUp === 'function' ? session.getNextUp() : null;
            if (next) playNextUp(session, next);
        });

        art.on('error', (err) => {
            if (!isSessionLive(session, token)) return;
            console.warn("[PlayerEngine] Artplayer erro no stream:", err);
            // Artplayer retries the same URL on its own; switch source on the first error instead
            failoverNativeSource(session, 'video-error');
        });

        return art;
    } catch (err) {
        console.error("[PlayerEngine] Erro ao instanciar Artplayer:", err);
        failoverNativeSource(session, 'init');
        return null;
    }
}

/**
 * Looks up the skip segments once per session, when the video length is first known (a source switch keeps them).
 */
function requestSkipSegments(session) {
    const video = session.art && session.art.video;
    if (session.skipRequested || !session.aniskip || !video || !(video.duration > 0) || !Number.isFinite(video.duration)) return;
    session.skipRequested = true;
    const duration = video.duration;
    Promise.resolve(session.aniskip).then(key => key && key.mal_id && key.episode
        ? fetchAniSkipSegments({ malId: key.mal_id, episode: key.episode, duration })
        : []).then(segments => {
        if (activeNativeSession !== session) return;
        session.skipSegments = segments;
        renderSkipRanges(session);
        updateSkipButton(session);
    });
}

const SKIP_LABELS = { intro: 'Pular abertura', recap: 'Pular recapitulação', outro: 'Pular encerramento' };
// The skip button fades after this long untouched; it comes back whenever the controls are shown
const SKIP_IDLE_MS = 8000;
const SKIP_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5l7 7-7 7"/><path d="M13 5l7 7-7 7"/></svg>';
const NEXT_ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 5l10 7-10 7z"/><path d="M19 5v14"/></svg>';
const CLOSE_ICON = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';

/**
 * Draws the opening, recap and ending as discreet ranges on the progress bar.
 */
function renderSkipRanges(session) {
    const art = session.art;
    const video = art && art.video;
    const inner = art && art.template && art.template.$player && art.template.$player.querySelector('.art-control-progress-inner');
    if (!inner || !video || !(video.duration > 0)) return;
    const old = inner.querySelector('.tvz-skip-ranges');
    if (old) old.remove();
    if (!session.skipSegments.length) return;
    const layer = document.createElement('div');
    layer.className = 'tvz-skip-ranges';
    for (const seg of session.skipSegments) {
        const span = document.createElement('span');
        span.className = `tvz-skip-range tvz-skip-range--${seg.type}`;
        span.style.left = `${(seg.start / video.duration) * 100}%`;
        span.style.width = `${((seg.end - seg.start) / video.duration) * 100}%`;
        layer.appendChild(span);
    }
    inner.appendChild(layer);
}

/**
 * What the side card offers right now, as a list of actions ('skip' or 'next'), or null.
 * Opening/recap: skip. Ending followed by more than a few seconds (a scene or a preview): skip and next.
 * Ending that runs to the end of the video: next only. After skipping the ending: next.
 * The countdown card has priority, and the viewer can dismiss each offer with the x.
 */
function skipCardState(session) {
    const video = session.art && session.art.video;
    if (!video || session.upNextTimer || !(video.duration > 0)) return null;
    const t = video.currentTime;
    const next = !session.upNextCancelled && typeof session.getNextUp === 'function' ? session.getNextUp() : null;
    const seg = session.skipSegments.find(s => t >= s.start && t < s.end - 1);
    if (seg && !session.skipDismissed.has(seg.type)) {
        if (seg.type !== 'outro') return { key: seg.type, seg, actions: ['skip'] };
        // Times taken from a slightly different cut are a few seconds off: skipping could cut the scene after it
        const contentAfter = !seg.approx && video.duration - seg.end > SKIP_OUTRO_TAIL_S;
        const actions = [...(contentAfter ? ['skip'] : []), ...(next ? ['next'] : [])];
        return actions.length ? { key: `outro:${actions.join('+')}`, seg, actions, next } : null;
    }
    const outro = session.skipSegments.find(s => s.type === 'outro');
    if (outro && next && session.outroSkipped && t >= outro.end - 1 && !session.skipDismissed.has('after-outro')) {
        return { key: 'after-outro', actions: ['next'], next };
    }
    return null;
}

/**
 * Shows, swaps or removes the side card ("Pular abertura", "Pular encerramento", "Próximo episódio").
 */
function updateSkipButton(session) {
    const art = session.art;
    const video = art && art.video;
    if (!video || !art.layers) return;
    const state = skipCardState(session);
    const existing = art.layers['tvz-skip'];
    if (existing && (!state || existing.dataset.key !== state.key)) {
        clearTimeout(session.skipIdleTimer);
        art.layers.remove('tvz-skip');
    }
    if (!state || art.layers['tvz-skip']) return;
    const buttons = state.actions.map(action => action === 'skip'
        ? `<button type="button" class="tvz-skip-go" data-action="skip">${SKIP_ICON}<span>${SKIP_LABELS[state.seg.type]}</span></button>`
        : `<button type="button" class="tvz-skip-go tvz-skip-next" data-action="next">${NEXT_ICON}<span>Próximo episódio</span></button>`).join('');
    try {
        art.layers.add({
            name: 'tvz-skip',
            html: `<div class="tvz-skip">${buttons}<button type="button" class="tvz-skip-close" aria-label="Dispensar" title="Dispensar">${CLOSE_ICON}</button></div>`,
            style: { position: 'absolute', right: '16px', bottom: '84px', pointerEvents: 'auto' },
            mounted: ($el) => {
                $el.classList.add('tvz-side-card');
                $el.dataset.key = state.key;
                const nextButton = $el.querySelector('[data-action="next"]');
                // textContent: the title comes from TMDB
                if (nextButton && state.next) nextButton.title = state.next.title || '';
                $el.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (button.dataset.action === 'next') {
                        playNextUp(session, state.next);
                        return;
                    }
                    session.skipDismissed.add(state.seg.type);
                    if (state.seg.type === 'outro') session.outroSkipped = true;
                    art.currentTime = Math.min(state.seg.end, video.duration - 0.5);
                    updateSkipButton(session);
                }));
                $el.querySelector('.tvz-skip-close').addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Dismissing only hides the offer: the next episode still plays when the video ends
                    session.skipDismissed.add(state.seg ? state.seg.type : 'after-outro');
                    updateSkipButton(session);
                });
                session.skipIdleTimer = setTimeout(() => $el.classList.add('tvz-skip-layer--idle'), SKIP_IDLE_MS);
            }
        });
    } catch (e) {
        // The skip card is optional UI
    }
}

/**
 * Runs on every timeupdate: fires onNearEnd once and drives the "Próximo episódio" countdown.
 */
function handleEndApproach(session) {
    const video = session.art && session.art.video;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
    const remaining = video.duration - video.currentTime;

    if (!session.nearEndFired && typeof session.onNearEnd === 'function' && remaining <= NATIVE_NEAR_END_S) {
        session.nearEndFired = true;
        try { session.onNearEnd(); } catch (e) { console.warn("[PlayerEngine] onNearEnd falhou:", e); }
    }

    if (typeof session.getNextUp !== 'function' || session.upNextCancelled) return;
    const lead = session.skipSegments.some(s => s.type === 'outro') ? NATIVE_UP_NEXT_S : NATIVE_UP_NEXT_NO_DATA_S;
    if (remaining > lead) {
        // Seeking back before the end stops the countdown
        stopUpNextCountdown(session);
        return;
    }
    if (!session.upNextTimer) startUpNextCountdown(session, Math.max(1, Math.ceil(remaining)));
}

/**
 * Counts down on its own clock: some HLS streams never fire "ended" (playback just
 * stops at the last frame), so the switch cannot depend on video events.
 */
function startUpNextCountdown(session, seconds) {
    const next = session.getNextUp();
    if (!next) return;
    let left = seconds;
    setUpNext(session, next, left);
    session.upNextTimer = setInterval(() => {
        if (!isSessionLive(session) || session.upNextCancelled) {
            stopUpNextCountdown(session);
            return;
        }
        const video = session.art && session.art.video;
        // A paused (not finished) video freezes the countdown
        if (video && video.paused && !video.ended && video.duration - video.currentTime > 1) return;
        left -= 1;
        if (left <= 0) {
            playNextUp(session, next);
            return;
        }
        setUpNext(session, next, left);
    }, 1000);
}

function stopUpNextCountdown(session) {
    if (session.upNextTimer) {
        clearInterval(session.upNextTimer);
        session.upNextTimer = null;
    }
    setUpNext(session, null);
}

/**
 * Shows (next != null) or removes the "Próximo episódio" card with its countdown.
 */
function setUpNext(session, next, seconds = 0) {
    const art = session.art;
    if (!art || !art.layers) return;
    try {
        if (!next) {
            if (art.layers['tvz-upnext']) art.layers.remove('tvz-upnext');
            return;
        }
        const existing = art.layers['tvz-upnext'];
        if (existing) {
            const counter = existing.querySelector('.tvz-upnext-count');
            if (counter) counter.textContent = String(seconds);
            return;
        }
        art.layers.add({
            name: 'tvz-upnext',
            html: `<div class="tvz-upnext">
                <div class="tvz-upnext-label">Próximo episódio em <span class="tvz-upnext-count">${seconds}</span>s</div>
                <div class="tvz-upnext-title"></div>
                <div class="tvz-upnext-actions">
                    <button type="button" class="tvz-upnext-play">Assistir agora</button>
                    <button type="button" class="tvz-upnext-cancel">Cancelar</button>
                </div>
            </div>`,
            style: { position: 'absolute', right: '16px', bottom: '84px', pointerEvents: 'auto' },
            mounted: ($el) => {
                $el.classList.add('tvz-side-card');
                // textContent: the title comes from TMDB
                $el.querySelector('.tvz-upnext-title').textContent = next.title || '';
                $el.querySelector('.tvz-upnext-play').addEventListener('click', (e) => {
                    e.stopPropagation();
                    playNextUp(session, next);
                });
                $el.querySelector('.tvz-upnext-cancel').addEventListener('click', (e) => {
                    e.stopPropagation();
                    session.upNextCancelled = true;
                    stopUpNextCountdown(session);
                });
            }
        });
    } catch (e) {
        // Countdown is optional UI
    }
}

function playNextUp(session, next) {
    if (session.upNextStarted) return;
    session.upNextStarted = true;
    stopUpNextCountdown(session);
    // Defer: the handler may run inside Artplayer events of the instance being replaced
    setTimeout(() => next.play(), 0);
}

/**
 * Shows a short status line under the loading spinner ("Conectando à fonte 2 de 4...").
 * An empty text removes it.
 */
function setSourceStatus(session, text) {
    const art = session.art;
    if (!art || !art.layers) return;
    try {
        if (!text) {
            if (art.layers['tvz-status']) art.layers.remove('tvz-status');
            return;
        }
        art.layers.update({
            name: 'tvz-status',
            html: `<div class="tvz-source-status">${text}</div>`,
            style: { position: 'absolute', left: '0', right: '0', top: 'calc(50% + 46px)', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }
        });
    } catch (e) {
        // Status is cosmetic
    }
}

/** Sets the text of a page loader overlay (the <span> next to its spinner). */
export function setLoaderText(loader, text) {
    const label = loader && loader.querySelector('span');
    if (label) label.textContent = text;
}

/** The viewer's last "Tela" choice, kept in this browser only. */
function storedFit() {
    try {
        return localStorage.getItem(FIT_STORAGE_KEY) === 'cover' ? 'cover' : 'contain';
    } catch (e) {
        return 'contain';
    }
}

function applyFit(art, value) {
    const player = art && art.template && art.template.$player;
    if (player) player.classList.toggle('tvz-fit-cover', value === 'cover');
}

/** "Tela: Ajustar / Preencher" row in the gear menu. */
function installFitSetting(art) {
    const current = storedFit();
    applyFit(art, current);
    upsertSetting(art, {
        name: 'fit',
        html: 'Tela',
        icon: NATIVE_ICONS.fit,
        width: NATIVE_SETTING_WIDTH,
        tooltip: FIT_OPTIONS.find(o => o.value === current).html,
        selector: FIT_OPTIONS.map(o => ({ ...o, default: o.value === current })),
        onSelect: (item) => {
            applyFit(art, item.value);
            try { localStorage.setItem(FIT_STORAGE_KEY, item.value); } catch (e) { /* the choice just is not remembered */ }
            return item.html;
        }
    });
}

/* ---------- Settings panel helpers (idempotent: one entry per name) ---------- */

/**
 * Adds or replaces a setting by name, then keeps the panel in a fixed order.
 * Artplayer's setting.add() always appends, which is what duplicated the
 * quality rows before; update() replaces the entry with the same name.
 */
function upsertSetting(art, option) {
    if (!art || !art.setting) return;
    try {
        art.setting.update(option);
        const list = art.setting.option;
        if (Array.isArray(list)) {
            const rank = name => {
                const i = NATIVE_SETTING_ORDER.indexOf(name);
                return i === -1 ? NATIVE_SETTING_ORDER.length : i;
            };
            const sorted = [...list].sort((a, b) => rank(a.name) - rank(b.name));
            if (sorted.some((item, i) => item !== list[i])) {
                list.splice(0, list.length, ...sorted);
                art.setting.destroy();
                art.setting.render(list);
            }
        }
    } catch (e) {
        console.warn("[PlayerEngine] Falha ao atualizar configurações:", e);
    }
}

function hlsLevelQuality(level) {
    return level ? qualityClass(level.width, level.height) : null;
}

/**
 * Builds the unified quality map: resolutions of the playing source first
 * (switching inside it needs no remount), then resolutions only offered by
 * other sources, in ranked order.
 */
function buildQualityEntries(session) {
    const entries = new Map();
    const current = session.sources[session.currentIndex];
    const hls = session.hls;

    if (hls && Array.isArray(hls.levels) && hls.levels.length) {
        const levels = hls.levels
            .map((lvl, levelIndex) => ({ quality: hlsLevelQuality(lvl) || (hls.levels.length === 1 ? current.quality : null), bitrate: lvl.bitrate || 0, levelIndex }))
            .filter(l => l.quality)
            .sort((a, b) => b.bitrate - a.bitrate);
        for (const l of levels) {
            if (!entries.has(l.quality)) entries.set(l.quality, { sourceIndex: session.currentIndex, levelIndex: l.levelIndex });
        }
    } else if (current.quality) {
        entries.set(current.quality, { sourceIndex: session.currentIndex, levelIndex: -1 });
    }

    session.sources.forEach((src, idx) => {
        if (idx === session.currentIndex || session.failed.has(idx) || !src.alive) return;
        for (const q of src.qualities) {
            if (!entries.has(q)) entries.set(q, { sourceIndex: idx, levelIndex: null });
        }
    });

    return new Map([...entries.entries()].sort((a, b) => b[0] - a[0]));
}

/** Quality class currently on screen (active HLS level, or the measured frame). */
function activeQuality(session) {
    const hls = session.hls;
    if (hls && Array.isArray(hls.levels) && hls.currentLevel >= 0) {
        const q = hlsLevelQuality(hls.levels[hls.currentLevel]);
        if (q) return q;
    }
    const video = session.art && session.art.video;
    if (video && video.videoHeight) {
        const q = qualityClass(video.videoWidth, video.videoHeight);
        if (q) return q;
    }
    return session.sources[session.currentIndex].quality;
}

function autoLabel(session) {
    const q = activeQuality(session);
    return q ? `Automático <span class="tvz-quality-auto-current">(${qualityText(q)})</span>` : 'Automático';
}

function refreshQualityMenu(session) {
    const art = session.art;
    if (!art) return;
    const entries = buildQualityEntries(session);
    session.qualityEntries = entries;

    const selector = [{
        html: autoLabel(session),
        value: 'auto',
        default: session.autoMode
    }];
    for (const quality of entries.keys()) {
        selector.push({
            html: qualityLabel(quality),
            value: quality,
            default: !session.autoMode && session.lockedQuality === quality
        });
    }

    upsertSetting(art, {
        name: 'quality',
        html: 'Qualidade',
        icon: NATIVE_ICONS.quality,
        width: NATIVE_SETTING_WIDTH,
        tooltip: qualityTooltip(session),
        selector,
        onSelect: (item) => selectNativeQuality(session, item.value)
    });
    updateQualityIndicators(session);
}

function qualityTooltip(session) {
    if (session.autoMode) return autoLabel(session);
    return qualityText(session.lockedQuality) || 'Automático';
}

/** Updates the tooltip, the Auto item text and the HD badge without re-rendering the panel. */
function updateQualityIndicators(session) {
    const art = session.art;
    if (!art) return;
    try {
        const option = art.setting && art.setting.find('quality');
        if (option) {
            option.tooltip = qualityTooltip(session);
            const autoItem = (option.selector || []).find(item => item.value === 'auto');
            if (autoItem) autoItem.html = autoLabel(session);
        }
        const q = activeQuality(session);
        art.template.$player.classList.toggle('tvz-playing-hd', Boolean(q && q >= 720));
        // A real element: the gear's ::before/::after are taken by its hover tooltip
        const gear = art.template.$player.querySelector('.art-control-setting');
        if (gear && !gear.querySelector('.tvz-hd-badge')) {
            gear.insertAdjacentHTML('beforeend', '<span class="tvz-hd-badge">HD</span>');
        }
    } catch (e) {
        // Panel not rendered yet
    }
}

function applyLockedLevel(session) {
    const hls = session.hls;
    if (!hls || session.autoMode || !session.lockedQuality) return;
    const levelIndex = hls.levels.findIndex(lvl => hlsLevelQuality(lvl) === session.lockedQuality);
    if (levelIndex >= 0) hls.currentLevel = levelIndex;
}

/**
 * Handles a pick in the quality menu. Returns the tooltip text for Artplayer.
 */
function selectNativeQuality(session, value) {
    if (!isSessionLive(session)) return '';

    if (value === 'auto') {
        session.autoMode = true;
        session.lockedQuality = null;
        const bestIdx = nextPlayableIndex(session);
        if (bestIdx >= 0 && bestIdx !== session.currentIndex) {
            remountFromMenu(session, bestIdx);
            return 'Automático';
        }
        if (session.hls) session.hls.currentLevel = -1;
        updateQualityIndicators(session);
        return qualityTooltip(session);
    }

    const quality = Number(value);
    const entry = session.qualityEntries && session.qualityEntries.get(quality);
    if (!entry) return qualityTooltip(session);
    session.autoMode = false;
    session.lockedQuality = quality;

    if (entry.sourceIndex === session.currentIndex) {
        if (session.hls && entry.levelIndex >= 0) session.hls.currentLevel = entry.levelIndex;
        updateQualityIndicators(session);
        return qualityText(quality);
    }

    showToast(`Alterando para ${qualityText(quality)}...`, 2000);
    remountFromMenu(session, entry.sourceIndex);
    return qualityText(quality);
}

/** Switches source after the click handler returns, so Artplayer is not destroyed mid-event. */
function remountFromMenu(session, sourceIndex) {
    const resumeAt = currentPlaybackTime(session);
    const token = session.mountToken;
    setTimeout(() => {
        if (isSessionLive(session, token)) mountNativeSource(session, sourceIndex, { startTime: resumeAt });
    }, 0);
}

/**
 * Records the real frame size of single-quality sources once the video reports it,
 * so the menu shows the true resolution even when the server could not probe it.
 */
function measureCurrentQuality(session) {
    const video = session.art && session.art.video;
    if (!video || !video.videoHeight) return;
    const measured = qualityClass(video.videoWidth, video.videoHeight);
    const src = session.sources[session.currentIndex];
    const isMultiLevel = session.hls && session.hls.levels && session.hls.levels.length > 1;
    if (measured && !isMultiLevel && src.quality !== measured) {
        src.quality = measured;
        src.qualities = [measured];
        refreshQualityMenu(session);
        return;
    }
    updateQualityIndicators(session);
}

function refreshAudioMenu(session) {
    const hls = session.hls;
    if (!session.art) return;
    if (!hls || !hls.audioTracks || hls.audioTracks.length <= 1) {
        // One audio track (or an MP4): the row still tells what is playing. It carries a one-entry list because
        // Artplayer swaps the icon of a row without a selector for its own (hidden) check mark.
        upsertSetting(session.art, {
            name: 'audio',
            html: 'Áudio',
            icon: NATIVE_ICONS.audio,
            width: NATIVE_SETTING_WIDTH,
            tooltip: AUDIO_SINGLE_LABEL,
            selector: [{ default: true, html: AUDIO_SINGLE_LABEL }],
            onSelect: (item) => item.html,
        });
        return;
    }
    const selector = hls.audioTracks.map((trk, idx) => ({
        default: idx === hls.audioTrack,
        html: trk.name || trk.lang || `Áudio ${idx + 1}`,
        trackIndex: idx
    }));
    upsertSetting(session.art, {
        name: 'audio',
        html: 'Áudio',
        icon: NATIVE_ICONS.audio,
        width: NATIVE_SETTING_WIDTH,
        tooltip: hls.audioTracks[hls.audioTrack]?.name || 'Padrão',
        selector,
        onSelect: (item) => {
            hls.audioTrack = item.trackIndex;
            return item.html;
        }
    });
}

/**
 * Index of the subtitle to start with: Brazilian Portuguese, then Portuguese, then the one the host marks as
 * default, then English. The host's own order is alphabetical (Arabic first), so it must not decide.
 */
function defaultSubtitleIndex(subtitles) {
    const rank = sub => {
        const lang = String(sub.lang || '').toLowerCase();
        if (/^pt[-_]?br$/.test(lang)) return 0;
        if (lang.startsWith('pt')) return 1;
        if (sub.default) return 2;
        if (lang.startsWith('en')) return 3;
        return 4;
    };
    let best = 0;
    subtitles.forEach((sub, idx) => {
        if (rank(sub) < rank(subtitles[best])) best = idx;
    });
    return best;
}

function refreshSubtitleMenu(session) {
    const art = session.art;
    const subtitles = session.subtitles;
    if (!art) return;
    if (!subtitles.length) {
        // Every player has the row, so external subtitles can be added to it later
        upsertSetting(art, {
            name: 'subtitle',
            html: 'Legendas',
            icon: NATIVE_ICONS.subtitle,
            width: NATIVE_SETTING_WIDTH,
            tooltip: SUBTITLES_NONE_LABEL,
            selector: [{ default: true, html: SUBTITLES_NONE_LABEL }],
            onSelect: (item) => item.html,
        });
        return;
    }
    const preferred = defaultSubtitleIndex(subtitles);
    const selector = subtitles.map((sub, idx) => ({
        default: idx === preferred,
        html: sub.label || sub.name || `Legenda ${idx + 1}`,
        url: sub.url || sub.file
    }));
    selector.unshift({ default: false, html: 'Desativada', url: '' });

    upsertSetting(art, {
        name: 'subtitle',
        html: 'Legendas',
        icon: NATIVE_ICONS.subtitle,
        width: NATIVE_SETTING_WIDTH,
        tooltip: selector[preferred + 1]?.html || 'Ativada',
        selector,
        onSelect: (item) => {
            if (!item.url) {
                art.subtitle.show = false;
            } else {
                art.subtitle.switch(item.url, { name: item.html });
                art.subtitle.show = true;
            }
            return item.html;
        }
    });
}
