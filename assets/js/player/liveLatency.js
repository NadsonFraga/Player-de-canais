/**
 * TVZINHA ONLINE - Live Latency & Live-Edge Synchronizer
 * Handles Hls.js liveSyncPosition calculations and dynamic AO VIVO badge states
 */

import { showToast } from '../core/toast.js?v=20261010_1539';

export function syncToLiveEdge(art, hls, container = null) {
    if (!art || !art.video) return;
    const vid = art.video;

    if (hls && typeof hls.liveSyncPosition === 'number' && Number.isFinite(hls.liveSyncPosition) && hls.liveSyncPosition > 0) {
        vid.currentTime = hls.liveSyncPosition;
    } else if (vid.seekable && vid.seekable.length > 0) {
        vid.currentTime = vid.seekable.end(vid.seekable.length - 1);
    }

    vid.play().catch(() => {});
    if (container) {
        updateLiveStatusBadge(container, art, hls, true, 0);
    }
    showToast("Sincronizado com a transmissão ao vivo.");
}

export function updateLiveStatusBadge(container, art, hls, forceLive = false, customLag = 0) {
    if (!container || !art || !art.video) return;
    const liveBtn = container.querySelector(".art-live-badge-btn");
    if (!liveBtn) return;

    const vid = art.video;
    let isNearLive = forceLive;
    let lagSeconds = customLag;

    if (!forceLive) {
        const currentPos = Number.isFinite(vid.currentTime) ? vid.currentTime : 0;
        const syncPos = (hls && typeof hls.liveSyncPosition === 'number' && Number.isFinite(hls.liveSyncPosition) && hls.liveSyncPosition > 0)
            ? hls.liveSyncPosition
            : ((vid.seekable && vid.seekable.length > 0 && Number.isFinite(vid.seekable.end(vid.seekable.length - 1)))
                ? vid.seekable.end(vid.seekable.length - 1)
                : currentPos);

        const rawLatency = syncPos - currentPos;
        const safeLatency = (Number.isFinite(rawLatency) && rawLatency > 0) ? Math.floor(rawLatency) : 0;

        if (vid.paused) {
            isNearLive = false;
            lagSeconds = Math.max(1, safeLatency);
        } else if (hls && typeof hls.liveSyncPosition === 'number' && hls.liveSyncPosition > 0) {
            if (safeLatency <= 6) {
                isNearLive = true;
            } else {
                isNearLive = false;
                lagSeconds = Math.max(1, safeLatency);
            }
        } else if (vid.seekable && vid.seekable.length > 0) {
            const targetChunk = (hls && hls.targetDuration) ? hls.targetDuration : 12;
            if (safeLatency <= targetChunk * 1.6) {
                isNearLive = true;
            } else {
                isNearLive = false;
                lagSeconds = Math.max(1, Math.round(safeLatency - targetChunk));
            }
        } else {
            isNearLive = !vid.paused;
        }
    }

    if (!Number.isFinite(lagSeconds) || Number.isNaN(lagSeconds)) {
        lagSeconds = 0;
    }

    if (isNearLive) {
        liveBtn.classList.add("is-live");
        liveBtn.classList.remove("is-behind");
        liveBtn.innerHTML = '<span class="art-live-dot"></span><span class="art-live-label">AO VIVO</span>';
    } else {
        liveBtn.classList.remove("is-live");
        liveBtn.classList.add("is-behind");
        liveBtn.innerHTML = `<span class="art-live-dot-gray"></span><span class="art-live-label">AO VIVO (-${lagSeconds}s)</span>`;
    }
}

export function setupLiveLatencySync(container, art, hls, intervalMs = 2500) {
    if (!container || !art) return () => {};

    // Initial update
    updateLiveStatusBadge(container, art, hls, true, 0);

    const intervalId = setInterval(() => {
        updateLiveStatusBadge(container, art, hls, false, 0);
    }, intervalMs);

    return () => clearInterval(intervalId);
}
