/**
 * TVZINHA ONLINE - Screen Wake Lock Controller
 * Prevents screen from dimming/sleeping during active media playback
 */

let screenWakeLockSentinel = null;
let isPlaybackActive = false;

export async function requestScreenWakeLock() {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
        return;
    }
    if (screenWakeLockSentinel !== null && !screenWakeLockSentinel.released) {
        return;
    }
    try {
        screenWakeLockSentinel = await navigator.wakeLock.request('screen');
        screenWakeLockSentinel.addEventListener('release', () => {
            screenWakeLockSentinel = null;
        });
        console.log("[WakeLock] Screen wake lock acquired successfully.");
    } catch (err) {
        console.warn("[WakeLock] Failed to acquire screen wake lock:", err.name, err.message);
    }
}

export async function releaseScreenWakeLock() {
    if (screenWakeLockSentinel) {
        try {
            await screenWakeLockSentinel.release();
        } catch (err) {
            console.warn("[WakeLock] Error releasing screen wake lock:", err);
        }
        screenWakeLockSentinel = null;
        console.log("[WakeLock] Screen wake lock released.");
    }
}

export function setPlaybackActiveState(active) {
    isPlaybackActive = Boolean(active);
    if (isPlaybackActive) {
        requestScreenWakeLock();
    } else {
        releaseScreenWakeLock();
    }
}

export function getPlaybackActiveState() {
    return isPlaybackActive;
}

if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && isPlaybackActive) {
            requestScreenWakeLock();
        }
    });
}
