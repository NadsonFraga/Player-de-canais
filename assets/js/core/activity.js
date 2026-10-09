/**
 * Tvzinha Online - Background activity guard
 * Carousels and catalog preloading must not download images while nobody can see them
 * (another tab, a player or detail panel on top, or the browser tab hidden).
 */
import { store } from './state.js?v=20261009_h';

// Panels that cover the whole page while a title is detailed or playing
const COVERING_PANELS = ['movie-modal', 'series-modal', 'series-player-view'];

export function isPageCovered() {
    return COVERING_PANELS.some(id => {
        const panel = document.getElementById(id);
        return Boolean(panel) && !panel.classList.contains('hidden');
    });
}

/** True when the carousel of `viewName` ('movies', 'series', 'animes') is on screen and may load its next slide. */
export function isBackgroundMediaAllowed(viewName) {
    if (typeof document === 'undefined' || document.hidden) return false;
    if (store.currentView !== viewName) return false;
    return !isPageCovered();
}

/**
 * Runs `task` once the browser is idle, and only while the home screen is showing with nothing on top.
 * The catalogs load on their own when their tab is opened, so skipping this never loses content.
 */
export function runWhenHomeIdle(task, delayMs = 1500) {
    const attempt = () => {
        if (store.currentView === 'home' && !document.hidden && !isPageCovered()) task();
    };
    const schedule = typeof window.requestIdleCallback === 'function'
        ? () => window.requestIdleCallback(attempt, { timeout: 5000 })
        : () => attempt();
    setTimeout(schedule, delayMs);
}
