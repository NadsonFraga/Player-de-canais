/**
 * TVZINHA ONLINE - Layered History & Mobile Hardware/Browser Back-Button Manager
 * Implements strict hierarchical back navigation across all tabs, searches, modals, drawers, and active media.
 */

import { store } from '../core/state.js?v=20261010_1539';

let navigationDepth = 0;
let isProgrammaticBack = false;
let isHandlingPopState = false;
let navBatchDepth = 0;
let batchedPops = 0;

let switchAppViewFn = null;
let closeMobileMenuFn = null;

/**
 * Pushes a new navigation layer into the browser history stack.
 * @param {string} layerType - Type of layer (e.g. 'tab', 'explore', 'modal', 'player', 'drawer')
 * @param {Object} metadata - Optional metadata (e.g. { view: 'movies', id: 123 })
 */
export function pushNavLayer(layerType, metadata = {}) {
    navigationDepth++;
    try {
        window.history.pushState(
            { depth: navigationDepth, layer: layerType, ...metadata },
            ''
        );
    } catch (e) {
        console.warn('[HistoryManager] pushState failed:', e);
    }
}

/**
 * Replaces the current navigation layer in history without growing stack depth.
 * Used for switching between main root tabs (movies -> series -> animes) so back returns to Home in 1 step.
 * @param {string} layerType 
 * @param {Object} metadata 
 */
export function replaceNavLayer(layerType, metadata = {}) {
    try {
        window.history.replaceState(
            { depth: navigationDepth, layer: layerType, ...metadata },
            ''
        );
    } catch (e) {
        console.warn('[HistoryManager] replaceState failed:', e);
    }
}

/**
 * Pops a navigation layer when the UI closes an element directly (e.g. clicking 'X' or backdrop).
 * If already handling a native popstate event (mobile back button), this is a no-op to prevent duplicate history pops.
 */
export function popNavLayer() {
    if (isHandlingPopState) {
        return;
    }
    if (navBatchDepth > 0) {
        // Inside runNavBatch: only count it, the browser history moves once at the end
        if (navigationDepth - batchedPops > 0) batchedPops++;
        return;
    }
    if (navigationDepth > 0) {
        navigationDepth--;
        isProgrammaticBack = true;
        try {
            window.history.back();
        } catch (e) {
            isProgrammaticBack = false;
        }
    }
}

/**
 * Runs `closeSteps` (which may close several layers, each calling popNavLayer) and then moves the browser history
 * back ONCE by that many entries. Separate history.back() calls in the same tick produce several popstate events,
 * and the flag that marks a back as "ours" covers only the first: the next one is treated as the user's Back button
 * and the app jumps to Home.
 */
export function runNavBatch(closeSteps) {
    navBatchDepth++;
    try {
        closeSteps();
    } finally {
        navBatchDepth--;
        if (navBatchDepth === 0 && batchedPops > 0) {
            const steps = batchedPops;
            batchedPops = 0;
            navigationDepth -= steps;
            isProgrammaticBack = true;
            try {
                window.history.go(-steps);
            } catch (e) {
                isProgrammaticBack = false;
            }
        }
    }
}

/**
 * Resets navigation state to clean Home root.
 * Called when the user clicks 'Home' tab directly from any view.
 */
export function resetNavToHome() {
    navigationDepth = 0;
    isProgrammaticBack = false;
    isHandlingPopState = false;
    try {
        window.history.replaceState({ depth: 0, layer: 'home', view: 'home' }, '');
    } catch (e) {}
}

/**
 * Inspects active DOM elements in descending order of depth/priority and closes the topmost active layer.
 * @returns {boolean} True if an active layer was handled and closed, False if already at root Home.
 */
export function handleBackButton() {
    // LAYER 1: Active Video Player (Top Priority)
    // 1.1 Active Series / Animes Player
    const seriesPlayerView = document.getElementById("series-player-view");
    if (seriesPlayerView && !seriesPlayerView.classList.contains("hidden")) {
        const btnClose = document.getElementById("btn-close-series-player");
        if (btnClose) {
            btnClose.click();
            return true;
        }
    }

    // 1.2 Active Movie Player
    const movieModal = document.getElementById("movie-modal");
    const moviePlayerContainer = document.getElementById("movie-modal-player-container");
    const isMoviePlaying = movieModal && !movieModal.classList.contains("hidden") && (
        Boolean(document.querySelector(".movie-modal-card.is-playing")) ||
        (moviePlayerContainer && !moviePlayerContainer.classList.contains("hidden"))
    );
    if (isMoviePlaying) {
        const btnCloseMoviePlayer = document.getElementById("btn-close-movie-player");
        if (btnCloseMoviePlayer) {
            btnCloseMoviePlayer.click();
            return true;
        }
    }

    // LAYER 2: Details Modals & Generic App Modals
    // 2.1 Series / Animes Details Modal
    const seriesModal = document.getElementById("series-modal");
    if (seriesModal && !seriesModal.classList.contains("hidden")) {
        const btnCloseSeriesModal = document.getElementById("btn-close-series-modal");
        if (btnCloseSeriesModal) {
            btnCloseSeriesModal.click();
            return true;
        }
    }

    // 2.2 Movie Details Modal
    if (movieModal && !movieModal.classList.contains("hidden")) {
        const btnCloseMovieModal = document.getElementById("btn-close-movie-modal");
        if (btnCloseMovieModal) {
            btnCloseMovieModal.click();
            return true;
        }
    }

    // 2.3 Team Selection Modal (Sports)
    const teamModal = document.getElementById("team-select-modal");
    if (teamModal && !teamModal.classList.contains("hidden") && teamModal.style.display !== "none") {
        const btnCloseTeamModal = document.getElementById("btn-close-team-modal");
        if (btnCloseTeamModal) {
            btnCloseTeamModal.click();
            return true;
        }
    }

    // 2.4 Adblock & DNS Disclaimer Modal
    const adblockModal = document.getElementById("adblock-modal");
    if (adblockModal && !adblockModal.classList.contains("hidden") && adblockModal.style.display !== "none") {
        const btnCloseAdblock = document.getElementById("btn-close-adblock-modal");
        if (btnCloseAdblock) {
            btnCloseAdblock.click();
            return true;
        }
    }

    // LAYER 3: Dedicated Explore & Search Views / Studio Collections
    // 3.1 Movie Studio Collections (Marvel, Disney, etc.)
    const movieCollection = document.getElementById("movies-collection-section");
    if (movieCollection && !movieCollection.classList.contains("hidden")) {
        const btnCollectionBack = document.getElementById("btn-collection-back");
        if (btnCollectionBack) {
            btnCollectionBack.click();
            return true;
        }
    }

    // 3.2 Movie Search & Explore View
    const moviesExplore = document.getElementById("movies-explore-view");
    if (moviesExplore && !moviesExplore.classList.contains("hidden")) {
        const btnExploreBack = document.getElementById("btn-explore-back");
        if (btnExploreBack) {
            btnExploreBack.click();
            return true;
        }
    }

    // 3.3 Series Search & Explore View
    const seriesExplore = document.getElementById("series-explore-view");
    if (seriesExplore && !seriesExplore.classList.contains("hidden")) {
        const btnSeriesExploreBack = document.getElementById("btn-series-explore-back");
        if (btnSeriesExploreBack) {
            btnSeriesExploreBack.click();
            return true;
        }
    }

    // 3.4 Animes Search & Explore View
    const animesExplore = document.getElementById("animes-explore-view");
    if (animesExplore && !animesExplore.classList.contains("hidden")) {
        const btnAnimesExploreBack = document.getElementById("btn-animes-explore-back");
        if (btnAnimesExploreBack) {
            btnAnimesExploreBack.click();
            return true;
        }
    }

    // LAYER 4: Mobile Drawer / Sidebar (Channels list drawer)
    const sidebar = document.getElementById("sidebar");
    const isSidebarOpen = (sidebar && sidebar.classList.contains("open")) || document.body.classList.contains("sidebar-open");
    if (isSidebarOpen) {
        if (typeof closeMobileMenuFn === 'function') {
            closeMobileMenuFn();
        } else {
            const btnCloseMenu = document.getElementById("btn-close-menu");
            if (btnCloseMenu) btnCloseMenu.click();
        }
        return true;
    }

    // LAYER 5: Main Root View Tabs (Movies, Series, Animes, TV Channels -> Back to Home)
    if (store.currentView && store.currentView !== 'home') {
        if (typeof switchAppViewFn === 'function') {
            switchAppViewFn('home');
        } else {
            const tabHome = document.getElementById("nav-tab-home");
            if (tabHome) tabHome.click();
        }
        return true;
    }

    // LAYER 0: Clean Home View - Do not intercept, allow natural browser page exit
    return false;
}

/**
 * Native popstate event listener.
 * Handles hardware/browser back button clicks.
 */
function onPopState(event) {
    if (isProgrammaticBack) {
        isProgrammaticBack = false;
        return;
    }

    if (navigationDepth > 0) {
        navigationDepth--;
    }

    isHandlingPopState = true;
    try {
        handleBackButton();
    } finally {
        setTimeout(() => {
            isHandlingPopState = false;
        }, 60);
    }
}

/**
 * Initializes the history manager. Sets initial clean root state and attaches popstate listener.
 * @param {Object} options
 * @param {Function} options.switchAppView - Callback to switch app view
 * @param {Function} options.closeMobileMenu - Callback to close mobile drawer
 */
export function initHistoryManager(options = {}) {
    if (typeof options.switchAppView === 'function') {
        switchAppViewFn = options.switchAppView;
    }
    if (typeof options.closeMobileMenu === 'function') {
        closeMobileMenuFn = options.closeMobileMenu;
    }

    if (typeof window === 'undefined') return;

    try {
        if (!window.history.state || typeof window.history.state.depth === 'undefined') {
            window.history.replaceState({ depth: 0, layer: 'home', view: 'home' }, '');
        } else {
            navigationDepth = window.history.state.depth || 0;
        }
    } catch (e) {
        console.warn('[HistoryManager] Initial state check failed:', e);
    }

    window.removeEventListener('popstate', onPopState);
    window.addEventListener('popstate', onPopState);
}
