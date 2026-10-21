/**
 * TVZINHA ONLINE - Layered History & Mobile Hardware/Browser Back-Button Manager
 * Implements strict hierarchical back navigation across all tabs, searches, modals, drawers, and active media.
 */

import { store } from '../core/state.js?v=20261021_0957';

let navigationDepth = 0;
let isProgrammaticBack = false;
let isHandlingPopState = false;
let navBatchDepth = 0;
let batchedPops = 0;
// Runs once our own grouped history step has landed (see runNavBatch)
let afterBatchSettled = null;
let afterBatchTimer = null;

let switchAppViewFn = null;
let closeMobileMenuFn = null;

/**
 * Pushes a new navigation layer into the browser history stack.
 * @param {string} layerType - Type of layer (e.g. 'tab', 'explore', 'modal', 'player', 'drawer')
 * @param {Object} metadata - Optional metadata (e.g. { view: 'movies', id: 123 })
 * @param {string} url - Optional address for this layer (the title page: "?filme=123"); kept as it is when empty
 */
export function pushNavLayer(layerType, metadata = {}, url = '') {
    navigationDepth++;
    try {
        window.history.pushState(
            { depth: navigationDepth, layer: layerType, ...metadata },
            '',
            url || undefined
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
        // A tab has no address of its own: drop a title's "?filme=123"
        window.history.replaceState(
            { depth: navigationDepth, layer: layerType, ...metadata },
            '',
            window.location.pathname
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
    if (navBatchDepth > 0) {
        // Inside runNavBatch: only count it, the browser history moves once at the end. A batch never runs inside
        // the Back handler, so it counts even in the short window after a popstate (a tab switch right after Back).
        if (navigationDepth - batchedPops > 0) batchedPops++;
        return;
    }
    if (isHandlingPopState) {
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
 * `onSettled` runs once the browser has moved back (its popstate arrived), or right away when nothing moved. A new
 * history entry (a tab switch) must wait for it: pushed before the step lands, it would be the one undone.
 */
export function runNavBatch(closeSteps, onSettled = null) {
    navBatchDepth++;
    let moved = false;
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
                moved = true;
            } catch (e) {
                isProgrammaticBack = false;
            }
        }
    }
    if (typeof onSettled !== 'function') return;
    if (!moved) {
        onSettled();
        return;
    }
    afterBatchSettled = onSettled;
    clearTimeout(afterBatchTimer);
    // Safety net: some browsers skip the popstate of a history.go() that lands on the same document state
    afterBatchTimer = setTimeout(runAfterBatchSettled, 1500);
}

/**
 * While a grouped history step is still landing, queues `callback` after it and returns true; returns false when
 * nothing is pending (the caller goes on at once).
 */
export function whenNavSettled(callback) {
    if (!afterBatchSettled) return false;
    const previous = afterBatchSettled;
    afterBatchSettled = () => {
        previous();
        callback();
    };
    return true;
}

function runAfterBatchSettled() {
    clearTimeout(afterBatchTimer);
    const callback = afterBatchSettled;
    afterBatchSettled = null;
    if (callback) callback();
}

/** True while the browser's Back (popstate) is being handled: its history entry is already gone. */
export function isHandlingBack() {
    return isHandlingPopState;
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
        window.history.replaceState({ depth: 0, layer: 'home', view: 'home' }, '', window.location.pathname);
    } catch (e) {}
}

/**
 * Inspects active DOM elements in descending order of depth/priority and closes the topmost active layer.
 * @returns {boolean} True if an active layer was handled and closed, False if already at root Home.
 */
export function handleBackButton() {
    // LAYER 1: Active Video Player (Top Priority), over the title page
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
    const moviePlayerView = document.getElementById("movie-player-view");
    if (moviePlayerView && !moviePlayerView.classList.contains("hidden")) {
        const btnCloseMoviePlayer = document.getElementById("btn-close-movie-player");
        if (btnCloseMoviePlayer) {
            btnCloseMoviePlayer.click();
            return true;
        }
    }

    // LAYER 2: Panels over the page (menus, search, the trailer and the legal panel can open over the title page)
    // 2.0 Header menus (profile, settings) and the global search
    const openMenu = document.querySelector("#floating-nav-capsule .nav-menu:not(.hidden)");
    if (openMenu) {
        const menuButton = document.querySelector(`[aria-controls="${openMenu.id}"]`);
        if (menuButton) {
            menuButton.click();
            return true;
        }
    }
    const searchOverlay = document.getElementById("search-overlay");
    if (searchOverlay && !searchOverlay.classList.contains("hidden")) {
        const btnCloseSearch = document.getElementById("btn-close-search");
        if (btnCloseSearch) {
            btnCloseSearch.click();
            return true;
        }
    }

    // 2.1 Trailer player (title page)
    const trailerModal = document.getElementById("trailer-modal");
    if (trailerModal && !trailerModal.classList.contains("hidden")) {
        const btnCloseTrailer = document.getElementById("btn-close-trailer");
        if (btnCloseTrailer) {
            btnCloseTrailer.click();
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

    // 2.5 Legal panel (footer: Privacidade, Termos de uso, DMCA)
    const legalModal = document.getElementById("legal-modal");
    if (legalModal && !legalModal.classList.contains("hidden")) {
        const btnCloseLegal = document.getElementById("btn-close-legal-modal");
        if (btnCloseLegal) {
            btnCloseLegal.click();
            return true;
        }
    }

    // 2.53 A confirmation (core/confirmDialog.js), over everything: Back answers "no"
    const confirmBox = document.getElementById("confirm-dialog");
    if (confirmBox && !confirmBox.classList.contains("hidden")) {
        document.getElementById("btn-confirm-dialog-no")?.click();
        return true;
    }

    // 2.54 Profiles (Quem está assistindo?, the editor), over the title page; it may stay (a profile must be chosen)
    const profilePage = document.getElementById("profile-page");
    if (profilePage && !profilePage.classList.contains("hidden")) {
        const btnProfileBack = document.getElementById("btn-profile-back");
        if (btnProfileBack) {
            btnProfileBack.click();
            return true;
        }
    }

    // 2.55 Account page (Entrar, Criar conta, the recovery code), over the title page
    const accountPage = document.getElementById("account-page");
    if (accountPage && !accountPage.classList.contains("hidden")) {
        const btnAccountBack = document.getElementById("btn-account-back");
        if (btnAccountBack) {
            btnAccountBack.click();
            return true;
        }
    }

    // 2.56 Configurações: a form closes first, then (phones) the topic returns to the list, then the page closes
    const settingsPage = document.getElementById("settings-page");
    if (settingsPage && !settingsPage.classList.contains("hidden")) {
        const btnSettingsBack = document.getElementById("btn-settings-back");
        if (btnSettingsBack) {
            btnSettingsBack.click();
            return true;
        }
    }

    // 2.6 Title page (movie, series or anime; a stacked title or list goes back to the one before)
    const titlePage = document.getElementById("title-page");
    if (titlePage && !titlePage.classList.contains("hidden")) {
        const btnTitleBack = document.getElementById("btn-title-back");
        if (btnTitleBack) {
            btnTitleBack.click();
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
        if (afterBatchSettled) setTimeout(runAfterBatchSettled, 0);
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
