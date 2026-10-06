/**
 * TVZINHA ONLINE - Streaming Engine V3 (Player Unified Controller)
 * Pure player controller with zero upward imports into business or navigation modules
 */

import { store } from '../core/state.js';
import { STREAM_ENGINE_API_BASE } from '../core/constants.js';
import { showToast } from '../core/toast.js';
import { setPlaybackActiveState } from '../core/wakeLock.js';
import { syncToLiveEdge, updateLiveStatusBadge, setupLiveLatencySync } from './liveLatency.js';

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
}

/**
 * Resets all active players (TV, Movies, Series, Anime) across the application
 */
export function atomicPlayerReset() {
    atomicTvPlayerReset();
    setPlaybackActiveState(false);

    if (window.cascadeTimer) {
        clearTimeout(window.cascadeTimer);
        window.cascadeTimer = null;
    }

    if (window.artInstance) {
        try {
            window.artInstance.pause();
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
            fullscreenWeb: true,
            pip: true,
            setting: true,
            loop: false,
            flip: true,
            playbackRate: false,
            aspectRatio: true,
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

/**
 * Resolves direct media stream via local or remote proxy API
 */
export async function resolveDirectStream({ id, type, season = 1, episode = 1, lang = 'dub', title = '', mal_id = null, imdb_id = null }) {
    const params = new URLSearchParams();
    if (id) params.set("id", id);
    if (type) params.set("type", type);
    params.set("season", season);
    params.set("episode", episode);
    params.set("lang", lang);
    if (title) params.set("title", title);
    if (mal_id) params.set("mal_id", mal_id);
    if (imdb_id) params.set("imdb_id", imdb_id);

    const url = `${STREAM_ENGINE_API_BASE}/api/resolve?${params.toString()}`;
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        return data && data.success ? data : null;
    } catch (err) {
        console.error("[StreamEngine] Erro ao resolver stream:", err);
        return null;
    }
}

/**
 * Mounts native Artplayer for Movies, Series and Anime with subtitles and AniSkip support
 */
export function mountNativePlayer({ containerId, streamUrl, title, poster, subtitles = [], fallbackSources = [], startTime = 0, onAllFailed = null }) {
    atomicPlayerReset();

    const container = document.getElementById(containerId);
    if (!container) return null;
    container.innerHTML = "";
    container.classList.remove("hidden");

    const isHls = streamUrl.includes(".m3u8") || streamUrl.includes("type=hls") || !streamUrl.includes(".mp4");
    let activeSourcesQueue = [...fallbackSources];
    let hasMountedSuccessfully = false;

    function markStreamSuccess() {
        if (!hasMountedSuccessfully) {
            hasMountedSuccessfully = true;
            if (window.cascadeTimer) {
                clearTimeout(window.cascadeTimer);
                window.cascadeTimer = null;
            }
            setPlaybackActiveState(true);
        }
    }

    window.cascadeTimer = setTimeout(() => {
        if (!hasMountedSuccessfully) {
            console.warn("[PlayerEngine] Watchdog disparado (10s sem playback). Tentando fallback...");
            tryFallback();
        }
    }, 10000);

    function tryFallback() {
        if (hasMountedSuccessfully) return;
        if (activeSourcesQueue.length > 0) {
            const nextSrc = activeSourcesQueue.shift();
            console.log("[PlayerEngine] Alternando para fonte reserva:", nextSrc);
            showToast("Alternando para link alternativo de streaming...", 2500);
            mountNativePlayer({
                containerId,
                streamUrl: nextSrc.url || nextSrc,
                title,
                poster,
                subtitles,
                fallbackSources: activeSourcesQueue,
                startTime: 0,
                onAllFailed
            });
        } else {
            console.warn("[PlayerEngine] Todas as fontes diretas falharam.");
            if (typeof onAllFailed === 'function') {
                onAllFailed();
            }
        }
    }

    try {
        const art = new window.Artplayer({
            container: `#${containerId}`,
            url: streamUrl,
            type: isHls ? 'm3u8' : 'mp4',
            title: title || 'Tvzinha Cinema',
            poster: poster || '',
            volume: 0.9,
            autoplay: true,
            autoMini: true,
            theme: '#22c55e',
            fullscreen: true,
            fullscreenWeb: true,
            pip: true,
            setting: true,
            flip: true,
            playbackRate: true,
            aspectRatio: true,
            hotkey: true,
            airplay: true,
            customType: {
                m3u8: function (video, url, artInstance) {
                    if (window.Hls && window.Hls.isSupported()) {
                        if (window.hlsInstance) {
                            window.hlsInstance.destroy();
                        }
                        const hls = new window.Hls({
                            enableWorker: true,
                            backBufferLength: 90
                        });
                        hls.loadSource(url);
                        hls.attachMedia(video);
                        window.hlsInstance = hls;

                        hls.on(window.Hls.Events.MANIFEST_PARSED, (event, data) => {
                            if (data.levels && data.levels.length > 1) {
                                const qualities = data.levels.map((lvl, idx) => ({
                                    default: idx === hls.currentLevel,
                                    html: `${lvl.height ? lvl.height + 'p' : 'Auto'} (${Math.round(lvl.bitrate / 1000)}k)`,
                                    levelIndex: idx
                                }));
                                qualities.unshift({ default: true, html: 'Automático', levelIndex: -1 });

                                artInstance.setting.add({
                                    id: 'quality-selector',
                                    name: 'Qualidade',
                                    width: 150,
                                    tooltip: 'Auto',
                                    selector: qualities,
                                    onSelect: function (item) {
                                        hls.currentLevel = item.levelIndex;
                                        return item.html;
                                    }
                                });
                            }
                        });

                        hls.on(window.Hls.Events.ERROR, (event, data) => {
                            if (data.fatal) {
                                switch (data.type) {
                                    case window.Hls.ErrorTypes.NETWORK_ERROR:
                                        hls.startLoad();
                                        break;
                                    case window.Hls.ErrorTypes.MEDIA_ERROR:
                                        hls.recoverMediaError();
                                        break;
                                    default:
                                        tryFallback();
                                        break;
                                }
                            }
                        });
                    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = url;
                    }
                }
            }
        });

        window.artInstance = art;

        // Restore start time (watch history)
        if (startTime > 0) {
            art.on('ready', () => {
                art.currentTime = startTime;
            });
        }

        art.on('video:playing', () => {
            markStreamSuccess();
        });

        art.on('video:pause', () => {
            setPlaybackActiveState(false);
        });

        art.on('error', (err) => {
            console.warn("[PlayerEngine] Artplayer erro no stream:", err);
            tryFallback();
        });

        return art;
    } catch (err) {
        console.error("[PlayerEngine] Erro ao instanciar Artplayer:", err);
        tryFallback();
        return null;
    }
}
