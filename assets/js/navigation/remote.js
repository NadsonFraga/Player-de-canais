/**
 * TVZINHA ONLINE - Smart TV & Spatial Navigation Module (D-Pad / Remote Control)
 * Purely DOM-based spatial navigation with Euclidean 2D distance calculation
 */

import { store } from '../core/state.js?v=20261009_h';

export function setupTvRemoteNavigation() {
    function getFocusableElements() {
        const selector = [
            '#floating-nav-capsule .nav-capsule-item',
            '.home-portal-card',
            '.home-utility-card',
            '.continue-card',
            '.continue-watching-card',
            '#movies-search-input',
            '#series-search-input',
            '#animes-search-input',
            '#btn-hero-watch-movie',
            '.movie-poster-card',
            '#btn-close-movie-modal',
            '#btn-close-series-modal',
            '.btn-movie-server-pill',
            '.btn-series-server-pill',
            '.series-ep-card',
            '#series-season-select',
            '#btn-series-back',
            '#filter-pills .pill',
            '#btn-change-team',
            '#vasco-matches-grid .broadcast-pill.playable',
            '#channels-list .channel-item',
            '.btn-server-option',
            '.btn-player-action',
            '#search-input',
            '#btn-close-team-modal',
            '.team-select-option'
        ].join(', ');

        return Array.from(document.querySelectorAll(selector)).filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden' && window.getComputedStyle(el).display !== 'none';
        });
    }

    function findBestDirectionalCandidate(currentEl, direction) {
        const currentRect = currentEl.getBoundingClientRect();
        const currentCenter = {
            x: currentRect.left + currentRect.width / 2,
            y: currentRect.top + currentRect.height / 2
        };

        const candidates = getFocusableElements().filter(el => el !== currentEl);
        let bestCandidate = null;
        let minDistance = Infinity;

        for (const candidate of candidates) {
            const rect = candidate.getBoundingClientRect();
            const center = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };

            const dx = center.x - currentCenter.x;
            const dy = center.y - currentCenter.y;

            let isCandidateInDirection = false;
            switch (direction) {
                case 'up':
                    isCandidateInDirection = dy < -10 && Math.abs(dx) <= Math.abs(dy) * 1.75;
                    break;
                case 'down':
                    isCandidateInDirection = dy > 10 && Math.abs(dx) <= Math.abs(dy) * 1.75;
                    break;
                case 'left':
                    isCandidateInDirection = dx < -10 && Math.abs(dy) <= Math.abs(dx) * 1.75;
                    break;
                case 'right':
                    isCandidateInDirection = dx > 10 && Math.abs(dy) <= Math.abs(dx) * 1.75;
                    break;
            }

            if (isCandidateInDirection) {
                const distance = Math.hypot(dx, dy);
                if (distance < minDistance) {
                    minDistance = distance;
                    bestCandidate = candidate;
                }
            }
        }

        return bestCandidate;
    }

    window.addEventListener("keydown", (e) => {
        const activeModal = document.querySelector(".modal:not(.hidden), .movie-modal:not(.hidden), #team-select-modal:not(.hidden)");
        const tag = (document.activeElement && document.activeElement.tagName) || '';

        // Allow normal typing inside input elements
        if ((tag === 'INPUT' || tag === 'TEXTAREA') && !['ArrowUp', 'ArrowDown', 'Escape', 'Enter'].includes(e.key)) {
            return;
        }

        const key = e.key;

        if (key === 'Escape' || key === 'Back' || key === 'BrowserBack') {
            if (activeModal) {
                e.preventDefault();
                const closeBtn = activeModal.querySelector(".btn-close-modal, #btn-close-movie-modal, #btn-close-series-modal, #btn-close-team-modal");
                if (closeBtn) closeBtn.click();
                return;
            }
        }

        if (key === 'Enter') {
            const currentEl = document.activeElement;
            if (currentEl && currentEl !== document.body) {
                // If it's not a native link or button, trigger click
                if (currentEl.tagName !== 'BUTTON' && currentEl.tagName !== 'A') {
                    e.preventDefault();
                    currentEl.click();
                }
            }
            return;
        }

        const directions = {
            ArrowUp: 'up',
            ArrowDown: 'down',
            ArrowLeft: 'left',
            ArrowRight: 'right'
        };

        const dir = directions[key];
        if (dir) {
            const currentEl = document.activeElement;
            const focusables = getFocusableElements();
            if (focusables.length === 0) return;

            if (!currentEl || currentEl === document.body || !focusables.includes(currentEl)) {
                e.preventDefault();
                const currentView = store.currentView;
                if (currentView === 'movies') {
                    const defaultMovieEl = document.getElementById('btn-hero-watch-movie') || document.querySelector('.movie-poster-card') || focusables[0];
                    if (defaultMovieEl) defaultMovieEl.focus();
                } else if (currentView === 'tv') {
                    const defaultPlayerBtn = document.querySelector('.btn-server-option.active') || document.getElementById('btn-fullscreen-player') || focusables[0];
                    if (defaultPlayerBtn) defaultPlayerBtn.focus();
                } else {
                    const defaultHomeEl = document.querySelector('.nav-capsule-item.active') || focusables[0];
                    if (defaultHomeEl) defaultHomeEl.focus();
                }
                return;
            }

            const nextEl = findBestDirectionalCandidate(currentEl, dir);
            if (nextEl) {
                e.preventDefault();
                nextEl.focus();
                nextEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
        }
    });

    console.log("[Remote] Smart TV D-Pad Spatial Navigation initialized.");
}
