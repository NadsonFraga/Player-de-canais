/**
 * TVZINHA ONLINE - Header tools: global search, the Coleção and the profile menu (the three icons after the tabs in
 * the pill, the same on computers and phones). The profile menu holds the account only: the profile in use with its
 * switch, Entrar ou criar conta, Watch Party, Premium and Configurações (a screen of its own, later). The legal
 * panels and the ad-block tips live in the footer. The pill stays fixed at the top.
 *
 * The search reads TMDB's multi search once per query (one /api/tmdb call, after a short pause in the typing) and
 * splits it into Filmes, Séries, Animes and Pessoas on the page; channels are searched in the list already loaded.
 */
import { store } from '../core/state.js?v=20261028_1415';
import { TMDB_IMG_W185 } from '../core/constants.js?v=20261028_1415';
import { fetchTmdb } from '../core/tmdb.js?v=20261028_1415';
import { escapeHtml, escapeAttr } from '../core/sanitize.js?v=20261028_1415';
import { showToast } from '../core/toast.js?v=20261028_1415';
import { syncPageLock } from '../core/activity.js?v=20261028_1415';
import { getChannelLogoSrc } from '../core/icons.js?v=20261028_1415';
import { pushNavLayer, popNavLayer, runNavBatch } from '../navigation/historyManager.js?v=20261028_1415';
import { openTitle, openPersonTitles, fillCards, isTitlePageOpen, closeTitlePage } from './titlePage.js?v=20261028_1415';
import { isAnimeShow } from './series.js?v=20261028_1415';
import { selectChannelByName } from './channels.js?v=20261028_1415';
import { openCollection } from './collection.js?v=20261028_1415';
import { getAccount, getActiveProfile, ACCOUNT_EVENT } from '../core/account.js?v=20261028_1415';
import { leaveAccount, getSyncStatus, syncStatusText, SYNC_EVENT } from '../core/sync.js?v=20261028_1415';
import { PROFILE_EVENT } from '../core/profileStore.js?v=20261028_1415';
import { avatarSrc } from '../core/avatars.js?v=20261028_1415';
import { openAccountPage } from './accountPage.js?v=20261028_1415';
import { openProfilePicker } from './profilePage.js?v=20261028_1415';
import { openSettingsPage } from './settingsPage.js?v=20261028_1415';

const SEARCH_PAUSE_MS = 350;
const MIN_QUERY = 2;
const KIND_LABEL = { movie: 'Filmes', tv: 'Séries', anime: 'Animes', channel: 'Canais', person: 'Pessoas' };
// People: TMDB lists everyone ever credited (crew of small productions included). Only actors, directors and writers
// with a photo and something known show: a title with this many votes, or this popularity (TMDB's scale is low:
// Fernanda Montenegro is ~1, Christopher Nolan ~8; the unknown namesakes stay under 0.5).
const PERSON_ROLE = { Acting: 'Atuação', Directing: 'Direção', Writing: 'Roteiro' };
const PERSON_MIN_VOTES = 300;
const PERSON_MIN_POPULARITY = 2;

let searchKind = 'all';
let searchTimer = null;
let searchToken = 0;
const multiCache = new Map();
let openMenuId = null;

// --- Menus (profile and settings) ---

function menuButton(menuId) {
    return document.querySelector(`[aria-controls="${menuId}"]`);
}

function openMenu(menuId) {
    if (openMenuId === menuId) return;
    if (openMenuId) closeMenu({ keepHistory: true });
    const menu = document.getElementById(menuId);
    if (!menu) return;
    // "Sincronizado há N min" is relative: up to date each time the menu opens
    renderSync();
    menu.classList.remove('hidden');
    menuButton(menuId)?.setAttribute('aria-expanded', 'true');
    if (!openMenuId) pushNavLayer('menu');
    openMenuId = menuId;
    menu.querySelector('button')?.focus({ preventScroll: true });
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

function knownTitles(person) {
    return (person.known_for || []).filter(work => work.title || work.name);
}

/** An actor, director or writer people may look for (see PERSON_ROLE). */
function isKnownPerson(person) {
    if (!person.profile_path || !PERSON_ROLE[person.known_for_department]) return false;
    const mostVoted = Math.max(0, ...knownTitles(person).map(work => Number(work.vote_count) || 0));
    return mostVoted >= PERSON_MIN_VOTES || Number(person.popularity) >= PERSON_MIN_POPULARITY;
}

/** "Atuação · Central do Brasil": the role and the best-known title. */
function personLine(person) {
    const best = knownTitles(person).sort((a, b) => (Number(b.vote_count) || 0) - (Number(a.vote_count) || 0))[0];
    const role = PERSON_ROLE[person.known_for_department] || '';
    return best ? `${role} · ${best.title || best.name}` : role;
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
        } else if (item.media_type === 'person' && isKnownPerson(item)) out.person.push(item);
    });
    out.person.sort((a, b) => (Number(b.popularity) || 0) - (Number(a.popularity) || 0));
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

function titleScore(entry) {
    const item = entry && entry.item;
    if (!item) return 0;
    const pop = Number(item.popularity) || 0;
    const votes = Math.max(10, Number(item.vote_count) || 10);
    return pop * Math.log10(votes);
}

function renderResults(box, split, channels) {
    box.innerHTML = '';
    let total = 0;

    if (searchKind === 'all') {
        // 1. Live channels first if query matched any
        if (channels.length > 0) {
            total += channels.length;
            const group = document.createElement('section');
            group.className = 'search-group';
            const heading = document.createElement('h3');
            heading.className = 'search-group-heading';
            heading.textContent = KIND_LABEL.channel;
            group.appendChild(heading);
            const grid = document.createElement('div');
            grid.className = 'search-channel-grid';
            grid.innerHTML = channels.map(c => {
                const logo = getChannelLogoSrc(c.name);
                return `<button type="button" class="search-channel" data-channel="${escapeAttr(c.name)}">
                    <span class="search-channel-logo">${logo ? `<img src="${escapeAttr(logo)}" alt="" loading="lazy">` : ''}</span>
                    <span class="search-channel-name">${escapeHtml(c.name)}</span>
                </button>`;
            }).join('');
            group.appendChild(grid);
            box.appendChild(group);
        }

        // 2. Unified titles (movies, series, animes) without category separation, sorted by relevance/popularity
        const allTitles = [...split.movie, ...split.tv, ...split.anime];
        if (allTitles.length > 0) {
            total += allTitles.length;
            allTitles.sort((a, b) => titleScore(b) - titleScore(a));
            const group = document.createElement('section');
            group.className = 'search-group';
            const grid = document.createElement('div');
            grid.className = 'search-title-grid';
            fillCards(grid, allTitles, { onOpen: (cardKind, item) => closeSearchThen(() => openTitle(cardKind, item)) });
            group.appendChild(grid);
            box.appendChild(group);
        }

        // 3. Persons at bottom if any
        if (split.person.length > 0) {
            total += split.person.length;
            const group = document.createElement('section');
            group.className = 'search-group';
            const heading = document.createElement('h3');
            heading.className = 'search-group-heading';
            heading.textContent = KIND_LABEL.person;
            group.appendChild(heading);
            const grid = document.createElement('div');
            grid.className = 'search-person-grid';
            grid.innerHTML = split.person.slice(0, 12).map(p => `
                <button type="button" class="title-cast-card search-person" data-search-person="${escapeAttr(p.id)}" data-name="${escapeAttr(p.name)}" data-photo="${escapeAttr(p.profile_path || '')}">
                    ${p.profile_path
                        ? `<img class="title-cast-photo" src="${escapeAttr(TMDB_IMG_W185 + p.profile_path)}" alt="" loading="lazy">`
                        : `<span class="title-cast-photo is-empty" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4 4-6 8-6s8 2 8 6"></path></svg></span>`}
                    <span class="title-cast-name">${escapeHtml(p.name)}</span>
                    <span class="title-cast-role">${escapeHtml(personLine(p))}</span>
                </button>`).join('');
            group.appendChild(grid);
            box.appendChild(group);
        }
    } else {
        const count = searchKind === 'channel' ? channels.length : split[searchKind].length;
        if (count > 0) {
            total += count;
            const group = document.createElement('section');
            group.className = 'search-group';
            const grid = document.createElement('div');
            if (searchKind === 'channel') {
                grid.className = 'search-channel-grid';
                grid.innerHTML = channels.map(c => {
                    const logo = getChannelLogoSrc(c.name);
                    return `<button type="button" class="search-channel" data-channel="${escapeAttr(c.name)}">
                        <span class="search-channel-logo">${logo ? `<img src="${escapeAttr(logo)}" alt="" loading="lazy">` : ''}</span>
                        <span class="search-channel-name">${escapeHtml(c.name)}</span>
                    </button>`;
                }).join('');
            } else if (searchKind === 'person') {
                grid.className = 'search-person-grid';
                grid.innerHTML = split.person.slice(0, 12).map(p => `
                    <button type="button" class="title-cast-card search-person" data-search-person="${escapeAttr(p.id)}" data-name="${escapeAttr(p.name)}" data-photo="${escapeAttr(p.profile_path || '')}">
                        ${p.profile_path
                            ? `<img class="title-cast-photo" src="${escapeAttr(TMDB_IMG_W185 + p.profile_path)}" alt="" loading="lazy">`
                            : `<span class="title-cast-photo is-empty" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4 4-6 8-6s8 2 8 6"></path></svg></span>`}
                        <span class="title-cast-name">${escapeHtml(p.name)}</span>
                        <span class="title-cast-role">${escapeHtml(personLine(p))}</span>
                    </button>`).join('');
            } else {
                grid.className = 'search-title-grid';
                const items = split[searchKind].slice().sort((a, b) => titleScore(b) - titleScore(a));
                fillCards(grid, items, { onOpen: (cardKind, item) => closeSearchThen(() => openTitle(cardKind, item)) });
            }
            group.appendChild(grid);
            box.appendChild(group);
        }
    }

    if (total === 0) box.innerHTML = '<p class="search-status">Nada encontrado. Tente outro nome.</p>';
}

// --- Setup ---

/** The sync line under the profile (signed in with a profile in use only). */
function renderSync() {
    const line = document.getElementById('nav-menu-sync');
    if (!line) return;
    const show = Boolean(getActiveProfile());
    line.hidden = !show;
    if (!show) return;
    line.textContent = syncStatusText();
    line.dataset.state = getSyncStatus().state;
}

/** The profile menu and the pill's profile button follow the account: the profile in use, or Visitante. */
function renderAccount() {
    const { signedIn, account } = getAccount();
    const profile = getActiveProfile();
    const name = document.getElementById('nav-menu-profile-name');
    const sub = document.getElementById('nav-menu-profile-sub');
    if (name) name.textContent = profile ? profile.name : signedIn ? account.nickname : 'Visitante';
    if (sub) sub.textContent = signedIn ? `Conta ${account.nickname}` : 'Perfil deste aparelho';
    document.getElementById('btn-menu-account')?.toggleAttribute('hidden', signedIn);
    document.getElementById('btn-menu-signout')?.toggleAttribute('hidden', !signedIn);
    document.getElementById('btn-menu-switch')?.toggleAttribute('hidden', !signedIn);
    // Signed in: the profile's avatar in place of the line icon, in the pill and in the menu
    [document.getElementById('btn-nav-profile'), document.getElementById('nav-menu-avatar')].forEach(el => {
        if (!el) return;
        el.classList.toggle('has-avatar', Boolean(profile));
        let image = el.querySelector('.nav-avatar');
        if (profile) {
            if (!image) {
                image = document.createElement('img');
                image.className = 'nav-avatar';
                image.alt = '';
                image.draggable = false;
                el.appendChild(image);
            }
            const src = avatarSrc(profile.avatar);
            if (image.getAttribute('src') !== src) image.setAttribute('src', src);
        } else if (image) {
            image.remove();
        }
    });
    const button = document.getElementById('btn-nav-profile');
    if (button) button.setAttribute('aria-label', profile ? `Perfil ${profile.name}` : 'Perfil');
}

export function setupHeader() {
    const tools = document.getElementById('nav-capsule-tools');
    if (!tools || tools.dataset.ready === '1') return;
    tools.dataset.ready = '1';

    document.getElementById('btn-nav-search')?.addEventListener('click', openSearch);
    document.getElementById('btn-nav-collection')?.addEventListener('click', () => openCollection());
    // The Coleção icon lights up while the Coleção is on screen, like the tabs
    const markCollection = () => {
        const on = document.body.getAttribute('data-app-view') === 'collection';
        const button = document.getElementById('btn-nav-collection');
        if (!button) return;
        button.classList.toggle('active', on);
        if (on) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
    };
    new MutationObserver(markCollection).observe(document.body, { attributes: true, attributeFilter: ['data-app-view'] });
    markCollection();
    ['nav-profile-menu'].forEach(menuId => {
        menuButton(menuId)?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (openMenuId === menuId) closeMenu();
            else openMenu(menuId);
        });
    });

    // Profile menu: Trocar, Entrar ou criar conta, Configurações and Sair work; the rest says what it will be
    const SOON = {
        watchparty: 'Watch Party em breve: assistir junto com amigos, ao mesmo tempo.',
        premium: 'Premium em breve.'
    };
    document.getElementById('nav-profile-menu')?.addEventListener('click', async (e) => {
        const item = e.target.closest('[data-menu-action]');
        if (!item) return;
        const action = item.dataset.menuAction;
        if (action === 'account') {
            // The page's history layer goes in after the menu's has left, or the menu's Back would undo it
            runNavBatch(() => closeMenu(), () => openAccountPage('signin'));
        } else if (action === 'profiles') {
            runNavBatch(() => closeMenu(), () => openProfilePicker());
        } else if (action === 'settings') {
            runNavBatch(() => closeMenu(), () => openSettingsPage());
        } else if (action === 'signout') {
            // What is pending goes first; a confirmation may open, after the menu's history entry has left
            runNavBatch(() => closeMenu(), async () => {
                if (await leaveAccount()) showToast('Você saiu da conta. A conta continua salva: é só entrar de novo.');
            });
        } else if (SOON[action]) {
            showToast(SOON[action]);
        }
    });
    renderAccount();
    window.addEventListener(ACCOUNT_EVENT, renderAccount);
    window.addEventListener(PROFILE_EVENT, renderAccount);
    [ACCOUNT_EVENT, PROFILE_EVENT, SYNC_EVENT].forEach(name => window.addEventListener(name, renderSync));
    renderSync();

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
