/**
 * TVZINHA ONLINE - Application Entrypoint (ESM Bootstrap)
 * Coordinates core state, modular engines, navigation, and exposes TvzinhaActions
 */

import { store } from './core/state.js?v=20261009_h';
import { showToast } from './core/toast.js?v=20261009_h';
import { initChannelsCatalog, selectChannelByName, renderChannelGridCards, renderHomeView } from './modules/channels.js?v=20261009_h';
import { renderMatchesSection, openTeamSelectModal, closeTeamSelectModal } from './modules/sports.js?v=20261009_h';
import { runWhenHomeIdle } from './core/activity.js?v=20261009_h';
import { initMoviesView, openMovieDetailsModal, closeMovieDetailsModal } from './modules/movies.js?v=20261009_h';
import { initSeriesView, initAnimesView, playSeriesEpisode, stopSeriesPlayer, renderHomeContinueWatching } from './modules/series.js?v=20261009_h';
import { setupSpaNavigation, switchAppView, closeMobileMenu, registerViewHook } from './navigation/router.js?v=20261009_h';
import { setupTvRemoteNavigation } from './navigation/remote.js?v=20261009_h';
import { initHistoryManager, pushNavLayer, popNavLayer, handleBackButton } from './navigation/historyManager.js?v=20261009_h';

// Setup Adblock & DNS Disclaimer Modal
const ADBLOCK_STORAGE_KEY = 'tvzinha_adblock_ack_timestamp';
const ADBLOCK_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export function openAdblockModal() {
    const modal = document.getElementById("adblock-modal");
    if (modal) {
        const wasHidden = modal.classList.contains("hidden") || modal.style.display === "none";
        modal.classList.remove("hidden");
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
        const btnAck = document.getElementById("btn-adblock-ack");
        if (btnAck) btnAck.focus();
        if (wasHidden) {
            pushNavLayer('modal-adblock');
        }
    }
}

export function closeAdblockModal() {
    const modal = document.getElementById("adblock-modal");
    if (modal) {
        const wasOpen = !modal.classList.contains("hidden") && modal.style.display !== "none";
        modal.classList.add("hidden");
        modal.style.display = "none";
        document.body.style.overflow = "";
        if (wasOpen) {
            popNavLayer();
        }
    }
    try {
        localStorage.setItem(ADBLOCK_STORAGE_KEY, Date.now().toString());
    } catch (e) {}
}

function setupAdblockModalHandlers() {
    const modal = document.getElementById("adblock-modal");
    const btnAck = document.getElementById("btn-adblock-ack");
    const btnClose = document.getElementById("btn-close-adblock-modal");
    const btnCopyDns = document.getElementById("btn-copy-dns");

    if (btnAck) btnAck.onclick = closeAdblockModal;
    if (btnClose) btnClose.onclick = closeAdblockModal;
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) closeAdblockModal();
        };
    }

    if (btnCopyDns) {
        btnCopyDns.onclick = () => {
            const textToCopy = "dns.adguard-dns.com";
            navigator.clipboard.writeText(textToCopy).then(() => {
                const label = document.getElementById("copy-dns-label");
                btnCopyDns.classList.add("copied");
                if (label) label.textContent = "Copiado!";
                setTimeout(() => {
                    btnCopyDns.classList.remove("copied");
                    if (label) label.textContent = "Copiar";
                }, 2200);
            }).catch(() => {});
        };
    }

    document.addEventListener("click", (e) => {
        const btn = e.target.closest("#btn-sidebar-adblock, #btn-hero-adblock, #btn-home-adblock-shortcut");
        if (btn) {
            e.preventDefault();
            openAdblockModal();
        }
    });
}

function checkAdblockNoticeStatus() {
    setupAdblockModalHandlers();
    try {
        const rawTimestamp = localStorage.getItem(ADBLOCK_STORAGE_KEY);
        if (!rawTimestamp) {
            setTimeout(() => openAdblockModal(), 600);
            return;
        }
        const lastAck = parseInt(rawTimestamp, 10);
        if (isNaN(lastAck) || (Date.now() - lastAck > ADBLOCK_EXPIRATION_MS)) {
            setTimeout(() => openAdblockModal(), 600);
        }
    } catch (e) {}
}

// 1. Expose Frozen Global Actions Bus (window.TvzinhaActions)
Object.defineProperty(window, 'TvzinhaActions', {
    value: Object.freeze({
        selectChannel: selectChannelByName,
        openMovie: openMovieDetailsModal,
        closeMovie: closeMovieDetailsModal,
        playEpisode: playSeriesEpisode,
        stopSeries: stopSeriesPlayer,
        switchView: switchAppView,
        openTeamModal: openTeamSelectModal,
        closeTeamModal: closeTeamSelectModal,
        openAdblockModal: openAdblockModal,
        closeAdblockModal: closeAdblockModal,
        handleBack: handleBackButton,
        toast: showToast,
        store: store
    }),
    writable: false,
    configurable: false
});

/**
 * Main application bootstrap function
 */
async function bootstrapApp() {
    console.log("[Tvzinha] Bootstrapping modern ES module architecture...");

    // Initialize tiered history & mobile hardware back button manager
    initHistoryManager({ switchAppView, closeMobileMenu });

    // Register router view hooks for lazy/on-demand section initialization
    registerViewHook('home', () => {
        renderHomeContinueWatching();
    });
    registerViewHook('tvLeave', () => {
        renderHomeView();
    });
    registerViewHook('tv', () => {
        if (!store.activeChannel) {
            renderChannelGridCards();
            renderMatchesSection();
        }
    });
    registerViewHook('movies', () => {
        initMoviesView();
    });
    registerViewHook('series', () => {
        initSeriesView();
    });
    registerViewHook('animes', () => {
        initAnimesView();
    });

    // Initialize SPA navigation & Smart TV Remote D-Pad controls
    setupSpaNavigation();
    setupTvRemoteNavigation();

    // Load TV channels catalog
    await initChannelsCatalog();

    // Render matches and continue watching
    renderMatchesSection();
    renderHomeContinueWatching();

    // Check adblock onboarding notice
    checkAdblockNoticeStatus();

    // Start on Home view by default (aligned with original behavior)
    switchAppView('home');

    // Preload TMDB catalogs for instantaneous navigation, but only when the browser is idle on the home screen:
    // opening a channel or a title first must not compete with its stream for bandwidth.
    // Each catalog still loads by itself when its tab is opened (view hooks above).
    runWhenHomeIdle(() => {
        initMoviesView().catch(e => console.warn("[Preload] Movies:", e));
        initSeriesView().catch(e => console.warn("[Preload] Series:", e));
        initAnimesView().catch(e => console.warn("[Preload] Animes:", e));
    });

    console.log("[Tvzinha] Application bootstrap complete.");
}

// 2. Safe DOM ready check (prevent missed event race condition with type="module")
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
    bootstrapApp();
}
