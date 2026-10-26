/**
 * TVZINHA ONLINE - Coleção: what the viewer keeps, in tabs (Assistindo, Quero assistir, Assistidos, Avaliados,
 * Canais favoritos) with a Filmes / Séries / Animes filter. Opened from the profile menu; it is a view of its own
 * (no tab in the pill) and Back leads home like the other tabs.
 *
 * Reads the watch progress (core/watchProgress.js), the library (core/library.js) and the channel favorites
 * (store); everything stays in this browser until the account sync.
 */
import { store } from '../core/state.js?v=20261026_1520';
import { escapeHtml, escapeAttr } from '../core/sanitize.js?v=20261026_1520';
import { showToast } from '../core/toast.js?v=20261026_1520';
import { getChannelLogoSrc } from '../core/icons.js?v=20261026_1520';
import { continueWatchingEntries, hideFromContinueWatching, PROGRESS_EVENT } from '../core/watchProgress.js?v=20261026_1520';
import { libraryEntries, setWatchlist, setWatched, setRating, LIBRARY_EVENT } from '../core/library.js?v=20261026_1520';
import { formatStars, starSvg } from '../core/rateStars.js?v=20261026_1520';
import { switchAppView } from '../navigation/router.js?v=20261026_1520';
import { openTitle, fillCards } from './titlePage.js?v=20261026_1520';
import { selectChannelByName } from './channels.js?v=20261026_1520';

const TABS = [
    { id: 'watching', label: 'Assistindo', empty: 'Nada em andamento. Comece um filme ou episódio e ele aparece aqui.' },
    { id: 'watchlist', label: 'Quero assistir', empty: 'Use o botão + na página de um título para guardar aqui o que você quer assistir.' },
    { id: 'watched', label: 'Assistidos', empty: 'O que você terminar de assistir, ou marcar com o olho na página do título, aparece aqui.' },
    { id: 'rated', label: 'Avaliados', empty: 'Dê uma nota com as estrelas na página de um título e ele aparece aqui.' },
    { id: 'channels', label: 'Canais favoritos', empty: 'Marque a estrela de um canal em Canais para ele aparecer aqui.' }
];
const FILTERS = [
    { id: 'all', label: 'Tudo' },
    { id: 'movie', label: 'Filmes' },
    { id: 'tv', label: 'Séries' },
    { id: 'anime', label: 'Animes' }
];
const REMOVE_LABEL = {
    watching: 'Remover de Assistindo',
    watchlist: 'Remover de Quero assistir',
    watched: 'Desmarcar como assistido',
    rated: 'Remover a nota',
    channels: 'Remover dos favoritos'
};
const ICON_REMOVE = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"></line><line x1="18" y1="6" x2="6" y2="18"></line></svg>';

let activeTab = 'watching';
let activeFilter = 'all';

function view() {
    return document.getElementById('view-collection');
}

function isShown() {
    const el = view();
    return Boolean(el) && !el.classList.contains('hidden');
}

/** Opens the Coleção on a tab (the profile menu; "Continuar assistindo" opens it on Assistindo). */
export function openCollection(tab = 'watching') {
    if (TABS.some(t => t.id === tab)) activeTab = tab;
    if (isShown()) renderCollection();
    else switchAppView('collection');
}

function kindOfProgress(entry) {
    return entry.mediaType === 'movie' ? 'movie' : entry.mediaType === 'anime' ? 'anime' : 'tv';
}

function asItem(entry) {
    return { id: entry.id, title: entry.title, name: entry.title, poster_path: entry.poster_path, backdrop_path: entry.backdrop_path };
}

function progressInfo(entry) {
    if (entry.mediaType === 'movie') {
        const pct = entry.duration > 0 ? Math.round((entry.position / entry.duration) * 100) : 0;
        const left = entry.duration > 0 ? Math.round(Math.max(0, entry.duration - entry.position) / 60) : 0;
        return { pct, label: left > 0 ? `Faltam ${left} min` : 'Filme' };
    }
    const pos = (entry.positions || {})[`${entry.season}:${entry.episode}`];
    const pct = pos && pos.duration > 0 ? Math.round((pos.position / pos.duration) * 100) : 0;
    return { pct, label: `T${entry.season}:E${entry.episode}` };
}

/** Cards of a tab, newest first, before the filter. */
function cardsFor(tab) {
    if (tab === 'watching') {
        return continueWatchingEntries().map(entry => ({ kind: kindOfProgress(entry), item: asItem(entry), entry, ...progressInfo(entry) }));
    }
    const field = tab === 'watchlist' ? 'watchlist' : tab === 'watched' ? 'watched' : 'rating';
    return libraryEntries()
        .filter(entry => (field === 'rating' ? entry.rating && entry.rating.value : entry[field] && entry[field].on))
        .sort((a, b) => (b[field].at || 0) - (a[field].at || 0))
        .map(entry => ({
            kind: entry.kind === 'movie' ? 'movie' : entry.kind === 'anime' ? 'anime' : 'tv',
            item: { id: entry.id, title: entry.title, name: entry.title, poster_path: entry.poster_path, backdrop_path: entry.backdrop_path, release_date: entry.year ? `${entry.year}-01-01` : '' },
            entry
        }));
}

/** Favorite channels as stored ("category:name" or "name"), with the name to show and to open. */
function favoriteChannels() {
    return Array.from(store.favorites || []).map(key => ({ key, name: String(key).includes(':') ? String(key).split(':').slice(1).join(':') : String(key) }));
}

function matchesFilter(card) {
    return activeFilter === 'all' || card.kind === activeFilter;
}

function removeFrom(tab, card) {
    const title = card.item.title || 'Título';
    if (tab === 'watching') hideFromContinueWatching(card.entry.key);
    else if (tab === 'watchlist') setWatchlist(card.kind, card.item, false);
    else if (tab === 'watched') setWatched(card.kind, card.item, false);
    else if (tab === 'rated') setRating(card.kind, card.item, null);
    showToast(`${title}: ${REMOVE_LABEL[tab].toLowerCase()}`);
    renderCollection();
}

function decorate(tab) {
    return (cardEl, card) => {
        if (tab === 'watching') {
            const meta = cardEl.querySelector('.movie-card-meta span');
            if (meta) meta.textContent = card.label;
            const bar = document.createElement('span');
            bar.className = 'collection-progress';
            bar.innerHTML = `<span style="width: ${Math.min(100, Math.max(4, card.pct || 0))}%"></span>`;
            cardEl.appendChild(bar);
        }
        if (tab === 'rated') {
            const badge = document.createElement('span');
            badge.className = 'collection-score';
            badge.innerHTML = `${starSvg(true, 12)}<span>${escapeHtml(formatStars(card.entry.rating.value))}</span>`;
            cardEl.appendChild(badge);
        }
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'collection-remove';
        remove.title = REMOVE_LABEL[tab];
        remove.setAttribute('aria-label', `${REMOVE_LABEL[tab]}: ${card.item.title || ''}`);
        remove.innerHTML = ICON_REMOVE;
        remove.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFrom(tab, card);
        });
        cardEl.appendChild(remove);
    };
}

/** Assistindo resumes where it stopped (like the home rail); the other tabs open the title page. */
function openCard(tab) {
    return (kind, item, card) => {
        if (tab !== 'watching') {
            openTitle(kind, item);
            return;
        }
        if (kind === 'movie') openTitle('movie', item, { play: true });
        else openTitle(kind, item, { episode: { season: card.entry.season, episode: card.entry.episode } });
    };
}

function renderChannels(grid) {
    const channels = favoriteChannels();
    grid.className = 'collection-channel-grid';
    grid.innerHTML = channels.map(c => {
        const logo = getChannelLogoSrc(c.name);
        return `<div class="collection-channel-wrap">
            <button type="button" class="search-channel collection-channel" data-channel="${escapeAttr(c.name)}">
                <span class="search-channel-logo">${logo ? `<img src="${escapeAttr(logo)}" alt="" loading="lazy">` : ''}</span>
                <span class="search-channel-name">${escapeHtml(c.name)}</span>
            </button>
            <button type="button" class="collection-remove" data-unfavorite="${escapeAttr(c.key)}" title="${REMOVE_LABEL.channels}" aria-label="${REMOVE_LABEL.channels}: ${escapeAttr(c.name)}">${ICON_REMOVE}</button>
        </div>`;
    }).join('');
    return channels.length;
}

export function renderCollection() {
    const root = view();
    if (!root) return;
    const tabsBox = document.getElementById('collection-tabs');
    const filtersBox = document.getElementById('collection-filters');
    const grid = document.getElementById('collection-grid');
    const empty = document.getElementById('collection-empty');

    if (tabsBox) {
        tabsBox.innerHTML = TABS.map(tab => {
            const count = tab.id === 'channels' ? favoriteChannels().length : cardsFor(tab.id).length;
            const on = tab.id === activeTab;
            return `<button type="button" class="collection-tab${on ? ' active' : ''}" role="tab" aria-selected="${on}" data-collection-tab="${tab.id}">
                <span>${tab.label}</span>${count ? `<span class="collection-count">${count}</span>` : ''}
            </button>`;
        }).join('');
    }
    // Phones scroll the tabs sideways: keep the active one in view
    tabsBox?.querySelector('.collection-tab.active')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (filtersBox) {
        filtersBox.classList.toggle('hidden', activeTab === 'channels');
        filtersBox.innerHTML = FILTERS.map(f => `<button type="button" class="collection-filter${f.id === activeFilter ? ' active' : ''}" aria-pressed="${f.id === activeFilter}" data-collection-filter="${f.id}">${f.label}</button>`).join('');
    }

    let shown = 0;
    if (activeTab === 'channels') {
        shown = renderChannels(grid);
    } else {
        grid.className = 'title-card-grid collection-grid';
        const cards = cardsFor(activeTab).filter(matchesFilter);
        fillCards(grid, cards, { onOpen: openCard(activeTab), decorate: decorate(activeTab), noUpcoming: true });
        shown = cards.length;
    }
    if (empty) {
        const tab = TABS.find(t => t.id === activeTab);
        const filtered = activeFilter !== 'all' && activeTab !== 'channels';
        empty.textContent = filtered ? 'Nada aqui com este filtro.' : tab.empty;
        empty.classList.toggle('hidden', shown > 0);
    }
}

export function setupCollection() {
    const root = view();
    if (!root || root.dataset.ready === '1') return;
    root.dataset.ready = '1';
    root.addEventListener('click', (e) => {
        const tab = e.target.closest('[data-collection-tab]');
        if (tab) {
            activeTab = tab.dataset.collectionTab;
            renderCollection();
            return;
        }
        const filter = e.target.closest('[data-collection-filter]');
        if (filter) {
            activeFilter = filter.dataset.collectionFilter;
            renderCollection();
            return;
        }
        const unfavorite = e.target.closest('[data-unfavorite]');
        if (unfavorite) {
            store.toggleFavorite(unfavorite.dataset.unfavorite);
            showToast('Canal removido dos favoritos');
            renderCollection();
            return;
        }
        const channel = e.target.closest('[data-channel]');
        if (channel) selectChannelByName(channel.dataset.channel);
    });
    // Changes made elsewhere (a title page, the player, Canais) show up when the Coleção is on screen
    const refresh = () => {
        if (isShown()) renderCollection();
    };
    window.addEventListener(LIBRARY_EVENT, refresh);
    window.addEventListener(PROGRESS_EVENT, refresh);
    store.addEventListener('favorites:change', refresh);
}
