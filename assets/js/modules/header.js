/**
 * TVZINHA ONLINE - Header tools: global search, profile menu and settings menu (the icons after the tabs in the
 * pill). Phones have one round button at the right of the pill with a single menu holding all of it; the pill stays
 * fixed at the top (hiding it on scroll was tried and removed on 2026-10-20).
 *
 * The search reads TMDB's multi search once per query (one /api/tmdb call, after a short pause in the typing) and
 * splits it into Filmes, Séries, Animes and Pessoas on the page; channels are searched in the list already loaded.
 */
import { store } from '../core/state.js?v=20261020_1813';
import { TMDB_IMG_W185 } from '../core/constants.js?v=20261020_1813';
import { fetchTmdb } from '../core/tmdb.js?v=20261020_1813';
import { escapeHtml, escapeAttr } from '../core/sanitize.js?v=20261020_1813';
import { showToast } from '../core/toast.js?v=20261020_1813';
import { syncPageLock } from '../core/activity.js?v=20261020_1813';
import { getChannelLogoSrc } from '../core/icons.js?v=20261020_1813';
import { pushNavLayer, popNavLayer, runNavBatch } from '../navigation/historyManager.js?v=20261020_1813';
import { switchAppView } from '../navigation/router.js?v=20261020_1813';
import { openTitle, openPersonTitles, fillCards, isTitlePageOpen, closeTitlePage } from './titlePage.js?v=20261020_1813';
import { isAnimeShow } from './series.js?v=20261020_1813';
import { selectChannelByName } from './channels.js?v=20261020_1813';
import { openLegalSection } from './footer.js?v=20261020_1813';

const SEARCH_PAUSE_MS = 350;
const MIN_QUERY = 2;
const KIND_LABEL = { movie: 'Filmes', tv: 'Séries', anime: 'Animes', channel: 'Canais', person: 'Pessoas' };

let searchKind = 'all';
let searchTimer = null;
let searchToken = 0;
const multiCache = new Map();
let openMenuId = null;

// --- Menus (profile and settings) ---

function menuButton(menuId) {
    return document.querySelector(`[aria-controls="${menuId}"]`);
}

export function isNavMenuOpen() {
    return Boolean(openMenuId);
}

function openMenu(menuId) {
    if (openMenuId === menuId) return;
    if (openMenuId) closeMenu({ keepHistory: true });
    const menu = document.getElementById(menuId);
    if (!menu) return;
    menu.classList.remove('hidden');
    menuButton(menuId)?.setAttribute('aria-expanded', 'true');
    if (!openMenuId) pushNavLayer('menu');
    openMenuId = menuId;
    menu.querySelector('.nav-menu-item:not([aria-disabled="true"])')?.focus({ preventScroll: true });
}

/** Closes the open menu. `keepHistory`: its history layer was already taken (Back) or is reused. */
export function closeMenu({ keepHistory = false } = {}) {
    if (!openMenuId) return;
    const menu = document.getElementById(openMenuId);
    if (menu) menu.classList.add('hidden');
    menuButton(openMenuId)?.setAttribute('aria-expanded', 'false');
    openMenuId = null;
    if (!keepHistory) popNavLayer();
}

/** Closes the menu, then runs `action` once its history step has landed (so a new layer is not the one undone). */
function closeMenuThen(action) {
    runNavBatch(() => closeMenu(), action);
}

function goToContinueWatching() {
    const go = () => {
        const show = () => {
            const section = document.getElementById('home-continue-watching-section');
            if (section && !section.classList.contains('hidden')) {
                section.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                showToast('Nada em andamento por enquanto. Comece um filme ou episódio e ele aparece aqui.');
            }
        };
        if (isTitlePageOpen()) {
            switchAppView('home');
            setTimeout(show, 600);
        } else if (store.currentView !== 'home') {
            switchAppView('home');
            setTimeout(show, 400);
        } else {
            show();
        }
    };
    closeMenuThen(go);
}

// --- Global search ---

function overlay() {
    return document.getElementById('search-overlay');
}

export function isSearchOpen() {
    const el = overlay();
    return Boolean(el) && !el.classList.contains('hidden');
}

export function openSearch() {
    const el = overlay();
    if (!el) return;
    if (openMenuId) closeMenu();
    if (!isSearchOpen()) {
        el.classList.remove('hidden');
        syncPageLock();
        pushNavLayer('search');
    }
    const input = document.getElementById('global-search-input');
    if (input) {
        input.focus();
        input.select();
    }
    if (!input || input.value.trim().length < MIN_QUERY) renderHint();
}

/** Closes the search. `keepHistory`: its history layer was already taken (Back). */
export function closeSearch({ keepHistory = false } = {}) {
    if (!isSearchOpen()) return;
    clearTimeout(searchTimer);
    searchToken++;
    overlay().classList.add('hidden');
    syncPageLock();
    if (!keepHistory) popNavLayer();
}

/** Closes the search, then opens what was picked once the history step has landed. */
function closeSearchThen(action) {
    runNavBatch(() => closeSearch(), action);
}

function results() {
    return document.getElementById('search-results');
}

function renderHint() {
    const box = results();
    if (box) box.innerHTML = '<p class="search-status">Digite pelo menos duas letras.</p>';
}

function setKind(kind) {
    searchKind = kind;
    document.querySelectorAll('#search-overlay .search-kind').forEach(btn => {
        const on = btn.dataset.searchKind === kind;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-selected', String(on));
    });
    runSearch(true);
}

function normalize(text) {
    return String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Channels whose name holds the query (no request: the list is already loaded). */
function searchChannels(query) {
    const wanted = normalize(query);
    const found = [];
    const seen = new Set();
    Object.entries(store.channelsData || {}).forEach(([category, channels]) => {
        Object.keys(channels || {}).forEach(name => {
            if (seen.has(name) || !normalize(name).includes(wanted)) return;
            seen.add(name);
            found.push({ name, category });
        });
    });
    return found.slice(0, 24);
}

/** TMDB multi search, cached per query for this visit (the browser also keeps it for 30 min). */
function searchTmdb(query) {
    const key = normalize(query).trim();
    if (!multiCache.has(key)) {
        const path = `search/multi?query=${encodeURIComponent(query.trim())}&include_adult=false&page=1`;
        multiCache.set(key, fetchTmdb(path).then(data => data.results || []).catch(() => {
            multiCache.delete(key);
            throw new Error('search_failed');
        }));
    }
    return multiCache.get(key);
}

function localToday() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Already out: a release (or first episode) date up to today. Announced titles (later date or none yet) stay out. */
function isOut(item, today) {
    const date = String(item.release_date || item.first_air_date || '');
    return Boolean(date) && date <= today;
}

/** Splits TMDB's mixed answer into our kinds, without titles that are not out yet. */
function splitResults(items) {
    const out = { movie: [], tv: [], anime: [], person: [] };
    const today = localToday();
    items.forEach(item => {
        if ((item.media_type === 'movie' || item.media_type === 'tv') && !isOut(item, today)) return;
        if (item.media_type === 'movie' && item.poster_path) out.movie.push({ kind: 'movie', item });
        else if (item.media_type === 'tv' && item.poster_path) {
            const kind = isAnimeShow(item) ? 'anime' : 'tv';
            out[kind].push({ kind, item });
        } else if (item.media_type === 'person') out.person.push(item);
    });
    return out;
}

/** Runs the search now (`immediate`) or after the typing pause. */
function runSearch(immediate = false) {
    clearTimeout(searchTimer);
    const input = document.getElementById('global-search-input');
    const query = input ? input.value.trim() : '';
    if (query.length < MIN_QUERY) {
        searchToken++;
        renderHint();
        return;
    }
    searchTimer = setTimeout(() => performSearch(query), immediate ? 0 : SEARCH_PAUSE_MS);
}

async function performSearch(query) {
    const token = ++searchToken;
    const box = results();
    if (!box) return;
    const channels = searchKind === 'all' || searchKind === 'channel' ? searchChannels(query) : [];
    let split = { movie: [], tv: [], anime: [], person: [] };
    if (searchKind !== 'channel') {
        if (!box.querySelector('.search-group')) box.innerHTML = '<p class="search-status">Buscando...</p>';
        try {
            split = splitResults(await searchTmdb(query));
        } catch (e) {
            if (token === searchToken) box.innerHTML = '<p class="search-status">Não foi possível buscar agora. Tente de novo.</p>';
            return;
        }
    }
    if (token !== searchToken) return;
    renderResults(box, split, channels);
}

function renderResults(box, split, channels) {
    box.innerHTML = '';
    // Channels first: few, and when the name matches one it is usually what the person wants ("globo")
    const kinds = searchKind === 'all' ? ['channel', 'movie', 'tv', 'anime', 'person'] : [searchKind];
    let total = 0;
    kinds.forEach(kind => {
        const count = kind === 'channel' ? channels.length : split[kind].length;
        if (count === 0) return;
        total += count;
        const group = document.createElement('section');
        group.className = 'search-group';
        if (searchKind === 'all') {
            const heading = document.createElement('h3');
            heading.className = 'search-group-heading';
            heading.textContent = KIND_LABEL[kind];
            group.appendChild(heading);
        }
        const grid = document.createElement('div');
        if (kind === 'channel') {
            grid.className = 'search-channel-grid';
            grid.innerHTML = channels.map(c => {
                const logo = getChannelLogoSrc(c.name);
                return `<button type="button" class="search-channel" data-channel="${escapeAttr(c.name)}">
                    <span class="search-channel-logo">${logo ? `<img src="${escapeAttr(logo)}" alt="" loading="lazy">` : ''}</span>
                    <span class="search-channel-name">${escapeHtml(c.name)}</span>
                </button>`;
            }).join('');
        } else if (kind === 'person') {
            grid.className = 'search-person-grid';
            grid.innerHTML = split.person.slice(0, 12).map(p => `
                <button type="button" class="title-cast-card search-person" data-search-person="${escapeAttr(p.id)}" data-name="${escapeAttr(p.name)}" data-photo="${escapeAttr(p.profile_path || '')}">
                    ${p.profile_path
                        ? `<img class="title-cast-photo" src="${escapeAttr(TMDB_IMG_W185 + p.profile_path)}" alt="" loading="lazy">`
                        : `<span class="title-cast-photo is-empty" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4 4-6 8-6s8 2 8 6"></path></svg></span>`}
                    <span class="title-cast-name">${escapeHtml(p.name)}</span>
                    <span class="title-cast-role">${escapeHtml(p.known_for_department === 'Directing' ? 'Direção' : p.known_for_department === 'Acting' ? 'Atuação' : (p.known_for_department || ''))}</span>
                </button>`).join('');
        } else {
            grid.className = 'search-title-grid';
            fillCards(grid, split[kind], { onOpen: (cardKind, item) => closeSearchThen(() => openTitle(cardKind, item)) });
        }
        group.appendChild(grid);
        box.appendChild(group);
    });
    if (total === 0) box.innerHTML = '<p class="search-status">Nada encontrado. Tente outro nome.</p>';
}

// --- Setup ---

export function setupHeader() {
    const tools = document.getElementById('nav-capsule-tools');
    if (!tools || tools.dataset.ready === '1') return;
    tools.dataset.ready = '1';

    document.getElementById('btn-nav-search')?.addEventListener('click', openSearch);
    ['nav-profile-menu', 'nav-settings-menu', 'nav-mobile-menu'].forEach(menuId => {
        menuButton(menuId)?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (openMenuId === menuId) closeMenu();
            else openMenu(menuId);
        });
    });

    // Menu items (the same actions in the computer menus and in the phone's single menu)
    document.querySelectorAll('#floating-nav-capsule .nav-menu').forEach(menu => menu.addEventListener('click', (e) => {
        const legal = e.target.closest('[data-menu-legal]');
        if (legal) {
            closeMenuThen(() => openLegalSection(legal.dataset.menuLegal));
            return;
        }
        const item = e.target.closest('[data-menu-action]');
        if (!item) return;
        const action = item.dataset.menuAction;
        if (action === 'continue') goToContinueWatching();
        else if (action === 'search') closeMenuThen(openSearch);
        else if (action === 'account') showToast('A conta chega em breve. Por enquanto, tudo fica salvo neste aparelho.');
        // The tips open through the footer's button (main.js handles it), after the menu's history step lands
        else if (action === 'adblock') closeMenuThen(() => document.getElementById('btn-footer-adblock')?.click());
    }));

    // A click outside closes the menu; Esc closes it and gives the focus back to its button
    document.addEventListener('click', (e) => {
        if (openMenuId && !e.target.closest('.nav-menu-wrap')) closeMenu();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && openMenuId) {
            const button = menuButton(openMenuId);
            e.preventDefault();
            e.stopPropagation();
            closeMenu();
            button?.focus({ preventScroll: true });
            return;
        }
        // "/" opens the search (computers), unless the person is typing somewhere
        const tag = (document.activeElement && document.activeElement.tagName) || '';
        if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && tag !== 'INPUT' && tag !== 'TEXTAREA' && !isSearchOpen()) {
            const playerOpen = ['movie-player-view', 'series-player-view'].some(id => {
                const view = document.getElementById(id);
                return view && !view.classList.contains('hidden');
            });
            if (playerOpen) return;
            e.preventDefault();
            openSearch();
        }
    }, true);

    // Search overlay
    const input = document.getElementById('global-search-input');
    input?.addEventListener('input', () => runSearch(false));
    input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') runSearch(true);
    });
    document.getElementById('btn-close-search')?.addEventListener('click', () => closeSearch());
    const searchOverlay = overlay();
    searchOverlay?.addEventListener('click', (e) => {
        if (e.target === searchOverlay) {
            closeSearch();
            return;
        }
        const kind = e.target.closest('[data-search-kind]');
        if (kind) {
            setKind(kind.dataset.searchKind);
            return;
        }
        const channel = e.target.closest('[data-channel]');
        if (channel) {
            const name = channel.dataset.channel;
            closeSearchThen(() => {
                const pick = () => selectChannelByName(name);
                if (isTitlePageOpen()) {
                    closeTitlePage();
                    setTimeout(pick, 300);
                } else {
                    pick();
                }
            });
            return;
        }
        const person = e.target.closest('[data-search-person]');
        if (person) {
            closeSearchThen(() => openPersonTitles({ id: Number(person.dataset.searchPerson), name: person.dataset.name, photo: person.dataset.photo || '' }));
        }
    });
}
