/**
 * TVZINHA ONLINE - SPA Router & Layout Navigation Capsule
 * Handles view switching, active navigation state, mobile drawer, and player lifecycle/audio teardown
 */

import { store } from '../core/state.js';
import { atomicTvPlayerReset, atomicPlayerReset } from '../player/engine.js?v=20261008_q3';
import { setPlaybackActiveState } from '../core/wakeLock.js';
import { showToast } from '../core/toast.js';
import { pushNavLayer, replaceNavLayer, popNavLayer, resetNavToHome } from './historyManager.js';

let viewHooks = {
    onHome: null,
    onMovies: null,
    onSeries: null,
    onAnimes: null,
    onTv: null
};

export function registerViewHook(viewName, callback) {
    if (viewHooks[viewName] !== undefined) {
        viewHooks[viewName] = callback;
    }
}

export function teardownAllMedia() {
    atomicPlayerReset();
    setPlaybackActiveState(false);
    const movieIframe = document.getElementById("movie-modal-iframe");
    if (movieIframe) movieIframe.remove();
    const seriesIframe = document.getElementById("series-modal-iframe");
    if (seriesIframe) seriesIframe.remove();
    const movieModal = document.getElementById("movie-modal");
    if (movieModal) movieModal.classList.add("hidden");
    const seriesModal = document.getElementById("series-modal");
    if (seriesModal) seriesModal.classList.add("hidden");
    const seriesTheater = document.getElementById("series-player-view");
    if (seriesTheater) seriesTheater.classList.add("hidden");
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    document.documentElement.classList.remove("modal-open");
    document.body.classList.remove("modal-open");
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tvzinha:teardownMedia'));
    }
}

export function openMobileMenu() {
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    const wasOpen = (sidebar && sidebar.classList.contains("open")) || document.body.classList.contains("sidebar-open");
    if (!wasOpen) {
        pushNavLayer('drawer');
    }
    if (sidebar) sidebar.classList.add("open");
    if (backdrop) backdrop.classList.add("active");
    document.body.classList.add("sidebar-open");
    document.body.style.overflow = "hidden";
}

export function closeMobileMenu() {
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    const wasOpen = (sidebar && sidebar.classList.contains("open")) || document.body.classList.contains("sidebar-open");
    if (sidebar) sidebar.classList.remove("open");
    if (backdrop) backdrop.classList.remove("active");
    document.body.classList.remove("sidebar-open");
    document.body.style.overflow = "";
    if (wasOpen) {
        popNavLayer();
    }
}

export function switchAppView(viewName) {
    if (!viewName) return;

    if (viewName === 'sports') {
        showToast("Hub Esportivo em breve! Acompanhe as partidas na aba Canais.");
        return;
    }

    const previousView = store.currentView;

    // Synchronize History Stack
    if (viewName === 'home') {
        resetNavToHome();
    } else {
        if (!previousView || previousView === 'home') {
            pushNavLayer('tab', { view: viewName });
        } else if (previousView !== viewName) {
            replaceNavLayer('tab', { view: viewName });
        }
    }

    document.body.classList.toggle('view-tv-active', viewName === 'tv');
    document.body.setAttribute('data-app-view', viewName);

    // Audio & media teardown across SPA tabs
    if (viewName !== 'tv') {
        closeMobileMenu();
        atomicTvPlayerReset();
    }

    if (viewName !== 'movies') {
        const movieIframe = document.getElementById("movie-modal-iframe");
        if (movieIframe) movieIframe.remove();
        const movieModal = document.getElementById("movie-modal");
        if (movieModal) movieModal.classList.add("hidden");
        const movieArt = document.getElementById("movie-artplayer-container");
        if (movieArt) {
            movieArt.innerHTML = "";
            movieArt.classList.add("hidden");
        }
    }

    if (viewName !== 'series' && viewName !== 'animes') {
        const seriesIframe = document.getElementById("series-modal-iframe");
        if (seriesIframe) seriesIframe.remove();
        const seriesModal = document.getElementById("series-modal");
        if (seriesModal) seriesModal.classList.add("hidden");
        const seriesTheater = document.getElementById("series-player-view");
        if (seriesTheater) seriesTheater.classList.add("hidden");
        const seriesArt = document.getElementById("series-artplayer-container");
        if (seriesArt) {
            seriesArt.innerHTML = "";
            seriesArt.classList.add("hidden");
        }
    }

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tvzinha:teardownMedia'));
    }

    if (viewName === 'home') {
        teardownAllMedia();
    } else {
        const isMovieModalActive = !document.getElementById("movie-modal")?.classList.contains("hidden");
        const isSeriesPlayerActive = !document.getElementById("series-player-view")?.classList.contains("hidden");
        if (!isMovieModalActive && !isSeriesPlayerActive) {
            setPlaybackActiveState(false);
            document.documentElement.style.overflow = "";
            document.body.style.overflow = "";
            document.documentElement.classList.remove("modal-open");
            document.body.classList.remove("modal-open");
        }
    }

    const viewHome = document.getElementById("view-home");
    const viewTv = document.getElementById("view-tv");
    const viewMovies = document.getElementById("view-movies");
    const viewSeries = document.getElementById("view-series");
    const viewAnimes = document.getElementById("view-animes");

    const tabHome = document.getElementById("nav-tab-home");
    const tabTv = document.getElementById("nav-tab-tv");
    const tabMovies = document.getElementById("nav-tab-movies");
    const tabSeries = document.getElementById("nav-tab-series");
    const tabAnimes = document.getElementById("nav-tab-animes");
    const tabSports = document.getElementById("nav-tab-sports");

    const allViews = [viewHome, viewTv, viewMovies, viewSeries, viewAnimes];
    allViews.forEach(v => {
        if (v) v.classList.add("hidden");
    });

    const allTabs = [tabHome, tabTv, tabMovies, tabSeries, tabAnimes, tabSports];
    allTabs.forEach(t => {
        if (t) t.classList.remove("active");
    });

    // Update Reactive Store
    store.setCurrentView(viewName);

    if (viewName === 'home') {
        if (viewHome) viewHome.classList.remove("hidden");
        if (tabHome) tabHome.classList.add("active");
        if (typeof viewHooks.onHome === 'function') viewHooks.onHome();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (viewName === 'movies') {
        if (viewMovies) viewMovies.classList.remove("hidden");
        if (tabMovies) tabMovies.classList.add("active");
        if (typeof viewHooks.onMovies === 'function') viewHooks.onMovies();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (viewName === 'series') {
        if (viewSeries) viewSeries.classList.remove("hidden");
        if (tabSeries) tabSeries.classList.add("active");
        if (typeof viewHooks.onSeries === 'function') viewHooks.onSeries();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (viewName === 'animes') {
        if (viewAnimes) viewAnimes.classList.remove("hidden");
        if (tabAnimes) tabAnimes.classList.add("active");
        if (typeof viewHooks.onAnimes === 'function') viewHooks.onAnimes();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        // Default: 'tv'
        if (viewTv) viewTv.classList.remove("hidden");
        if (tabTv) tabTv.classList.add("active");
        if (typeof viewHooks.onTv === 'function') viewHooks.onTv();
    }
}

export function setupSpaNavigation() {
    // Delegated click handler on the capsule container for maximum click resilience
    const capsule = document.getElementById("floating-nav-capsule");
    if (capsule) {
        capsule.addEventListener("click", (e) => {
            const btn = e.target.closest(".nav-capsule-item");
            if (!btn) return;
            const view = btn.getAttribute("data-view");
            if (view === 'sports') {
                e.preventDefault();
                showToast("Hub Esportivo em breve! Acompanhe as partidas na aba Canais.");
                return;
            }
            if (view) {
                e.preventDefault();
                switchAppView(view);
            }
        });
    }

    const tabHome = document.getElementById("nav-tab-home");
    const tabTv = document.getElementById("nav-tab-tv");
    const tabMovies = document.getElementById("nav-tab-movies");
    const tabSeries = document.getElementById("nav-tab-series");
    const tabAnimes = document.getElementById("nav-tab-animes");
    const tabSports = document.getElementById("nav-tab-sports");

    if (tabHome) tabHome.addEventListener("click", () => switchAppView('home'));
    if (tabTv) tabTv.addEventListener("click", () => switchAppView('tv'));
    if (tabMovies) tabMovies.addEventListener("click", () => switchAppView('movies'));
    if (tabSeries) tabSeries.addEventListener("click", () => switchAppView('series'));
    if (tabAnimes) tabAnimes.addEventListener("click", () => switchAppView('animes'));
    if (tabSports) {
        tabSports.addEventListener("click", () => {
            showToast("Hub Esportivo em breve! Acompanhe as partidas na aba Canais.");
        });
    }

    // Mobile drawer toggle buttons
    const btnToggleMenu = document.getElementById("btn-toggle-menu");
    const btnCloseMenu = document.getElementById("btn-close-menu");
    const sidebarBackdrop = document.getElementById("sidebar-backdrop");

    if (btnToggleMenu) btnToggleMenu.addEventListener("click", openMobileMenu);
    if (btnCloseMenu) btnCloseMenu.addEventListener("click", closeMobileMenu);
    if (sidebarBackdrop) sidebarBackdrop.addEventListener("click", closeMobileMenu);

    // Setup Home Portal Navigation Cards
    document.querySelectorAll("#view-home .home-portal-card").forEach(card => {
        const target = card.getAttribute("data-view-target");
        card.addEventListener("click", () => {
            if (target) switchAppView(target);
        });
    });
}
