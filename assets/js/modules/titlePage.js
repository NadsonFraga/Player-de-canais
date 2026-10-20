/**
 * TVZINHA ONLINE - Title page: every movie, series and anime opens here, in full screen, before the player.
 *
 * One page (#title-page) shows one entry at a time:
 *   title  information, Assistir, Quero assistir / Assistido / Avaliar, episodes (series and animes), trailers,
 *          cast, the movie's collection and recommendations
 *   list   the titles of a person (cast, director, creator) or of a production company
 * Opening another title or list from the page stacks it: each one is a history layer, and Back returns to the one
 * before. The address shows the open title (?filme=ID, ?serie=ID, ?anime=ID), so a reload or a shared link opens it.
 * The players (movies.js, series.js) open over this page and Back from them returns here.
 */
import {
    TMDB_IMG_W500,
    TMDB_IMG_W185,
    TMDB_IMG_W1280
} from '../core/constants.js?v=20261020_1714';
import { fetchTmdb } from '../core/tmdb.js?v=20261020_1714';
import { escapeHtml, escapeAttr } from '../core/sanitize.js?v=20261020_1714';
import { showToast } from '../core/toast.js?v=20261020_1714';
import { syncPageLock } from '../core/activity.js?v=20261020_1714';
import { getLibraryState, setWatchlist, setWatched, setRating } from '../core/library.js?v=20261020_1714';
import { getMovieProgress, PROGRESS_EVENT } from '../core/watchProgress.js?v=20261020_1714';
import { pushNavLayer, popNavLayer, runNavBatch } from '../navigation/historyManager.js?v=20261020_1714';
import { switchAppView, setViewSwitchGuard } from '../navigation/router.js?v=20261020_1714';
import { playMovie, stopMoviePlayer, isMoviePlayerOpen } from './movies.js?v=20261020_1714';
import {
    loadShowDetails,
    showSeriesEpisodes,
    clearSeriesEpisodes,
    openEpisode,
    getStoredWatchProgress,
    stopSeriesPlayer,
    isSeriesPlayerOpen,
    isAnimeShow
} from './series.js?v=20261020_1714';

// Kinds: 'movie', 'tv' (series), 'anime'. The address uses Portuguese names.
const URL_PARAM = { movie: 'filme', tv: 'serie', anime: 'anime' };
const PLACEHOLDER = 'assets/logos/fav/icon-detailed.svg';
// The top of the page waits at most this long for its pictures, then shows anyway (slow connections)
const REVEAL_WAIT_MS = 2000;

const STATUS_PT = {
    'Released': 'Lançado',
    'Post Production': 'Pós-produção',
    'In Production': 'Em produção',
    'Planned': 'Planejado',
    'Rumored': 'Anunciado',
    'Canceled': 'Cancelado',
    'Returning Series': 'Em exibição',
    'Ended': 'Finalizada',
    'Pilot': 'Piloto'
};

// TMDB leaves its TV-only genres in English even in pt-BR
const GENRE_PT = {
    10759: 'Ação e Aventura',
    10762: 'Infantil',
    10763: 'Notícias',
    10764: 'Reality',
    10765: 'Ficção Científica e Fantasia',
    10766: 'Novela',
    10767: 'Talk show',
    10768: 'Guerra e Política'
};

// The entry on screen and the ones under it (Back returns to them)
let current = null;
const stack = [];
let renderToken = 0;
const movieDetailsCache = new Map();
const collectionCache = new Map();
let footerHome = null;

function page() {
    return document.getElementById('title-page');
}

export function isTitlePageOpen() {
    const el = page();
    return Boolean(el) && !el.classList.contains('hidden');
}

function addressFor(entry) {
    if (!entry || entry.type !== 'title') return '';
    return `${window.location.pathname}?${URL_PARAM[entry.kind]}=${encodeURIComponent(entry.item.id)}`;
}

/** Same kind words the catalogs use: animes are TV titles shown in the Animes tab. */
function kindOfTvItem(item) {
    return isAnimeShow(item) ? 'anime' : 'tv';
}

function kindLabel(kind) {
    return kind === 'movie' ? 'Filme' : kind === 'anime' ? 'Anime' : 'Série';
}

// --- Opening and closing ---

/**
 * Opens a title page. `kind`: 'movie', 'tv' or 'anime'; `item`: at least { id } (a catalog item shows its picture and
 * text at once, the rest arrives with the details). `options.play`: start playing right away (movies: Player
 * Principal; series: the episode in progress or T1:E1). `options.episode`: { season, episode } to play.
 */
export function openTitle(kind, item, options = {}) {
    if (!item || item.id == null) return;
    const normalizedKind = kind === 'movie' ? 'movie' : kind === 'anime' ? 'anime' : 'tv';
    const entry = { type: 'title', kind: normalizedKind, item, scroll: 0 };
    showEntry(entry, options);
}

function showEntry(entry, options = {}) {
    const el = page();
    if (!el) return;
    const wasOpen = isTitlePageOpen();
    if (wasOpen && current) {
        current.scroll = el.scrollTop;
        stack.push(current);
    }
    if (!wasOpen) {
        footerHome = null;
        mountFooter();
        el.classList.remove('hidden');
        syncPageLock();
    }
    current = entry;
    pushNavLayer(entry.type === 'title' ? 'title' : 'title-list', { id: entry.item ? entry.item.id : null }, addressFor(entry));
    render(entry, options);
    el.scrollTop = 0;
    el.focus({ preventScroll: true });
}

/** Back from the page: the entry under this one, or out of the page. */
export function titleBack() {
    if (!isTitlePageOpen()) return;
    if (stack.length > 0) {
        leaveCurrent();
        current = stack.pop();
        render(current, {});
        const el = page();
        const scroll = current.scroll || 0;
        requestAnimationFrame(() => { if (el) el.scrollTop = scroll; });
        popNavLayer();
        return;
    }
    hidePage();
    popNavLayer();
}

/** Closes the players over the page and every stacked entry, in one history step; `onSettled` runs after it. */
function closeEverything(onSettled = null) {
    runNavBatch(() => {
        if (isSeriesPlayerOpen()) stopSeriesPlayer();
        if (isMoviePlayerOpen()) stopMoviePlayer();
        if (!isTitlePageOpen()) return;
        const layers = stack.length + 1;
        stack.length = 0;
        hidePage();
        for (let i = 0; i < layers; i++) popNavLayer();
    }, onSettled);
}

/** Closes any player and the whole title page (every stacked entry), staying where the page was opened from. */
export function closeTitlePage() {
    closeEverything();
}

/**
 * Leaves the page (and any player over it) for a catalog tab. The tab changes once the grouped history step has
 * landed, so its new history entry is not the one undone.
 */
export function exitTitleTo(view) {
    closeEverything(() => switchAppView(view));
}

function hidePage() {
    leaveCurrent();
    current = null;
    stack.length = 0;
    closeRatePanel();
    closeTrailer({ keepHistory: true });
    const el = page();
    if (el) el.classList.add('hidden');
    restoreFooter();
    syncPageLock();
}

/** What the entry on screen leaves behind before another one replaces it. */
function leaveCurrent() {
    if (current && current.type === 'title' && current.kind !== 'movie') clearSeriesEpisodes();
    closeRatePanel();
}

// The site footer moves into the page while it is open, and back afterwards
function mountFooter() {
    const footer = document.getElementById('site-footer');
    const slot = document.getElementById('title-footer-slot');
    if (!footer || !slot || footer.parentElement === slot) return;
    footerHome = { parent: footer.parentElement, next: footer.nextSibling };
    slot.appendChild(footer);
}

function restoreFooter() {
    const footer = document.getElementById('site-footer');
    if (!footer || !footerHome || !footerHome.parent) return;
    footerHome.parent.insertBefore(footer, footerHome.next);
    footerHome = null;
}

// --- Rendering ---

function render(entry, options) {
    const token = ++renderToken;
    const el = page();
    const detail = document.getElementById('title-detail');
    const list = document.getElementById('title-list');
    if (entry.type === 'list') {
        setLoading(false);
        detail.classList.add('hidden');
        list.classList.remove('hidden');
        el.classList.remove('theme-anime');
        renderList(entry, token);
        return;
    }
    list.classList.add('hidden');
    detail.classList.remove('hidden');
    el.classList.toggle('theme-anime', entry.kind === 'anime');
    setLoading(true);
    renderTitleShell(entry);
    const started = Date.now();
    loadDetails(entry).then(async details => {
        if (token !== renderToken) return;
        entry.details = details;
        if (details) renderTitleDetails(entry);
        await picturesReady(['title-backdrop', 'title-logo'], Math.max(0, REVEAL_WAIT_MS - (Date.now() - started)));
        if (token !== renderToken) return;
        setLoading(false);
        startRequestedPlayback(entry, options);
    });
}

/** While the top is not ready it stays invisible (its space kept) and a ring shows (after a short delay, in CSS). */
function setLoading(on) {
    document.getElementById('title-detail')?.classList.toggle('is-loading', on);
    document.getElementById('title-loading')?.classList.toggle('hidden', !on);
}

/** Resolves when the visible pictures among `ids` are decoded, or after `maxWaitMs`. */
function picturesReady(ids, maxWaitMs) {
    const pictures = ids
        .map(id => document.getElementById(id))
        .filter(img => img && !img.classList.contains('hidden') && img.getAttribute('src'));
    if (pictures.length === 0) return Promise.resolve();
    const decoded = Promise.all(pictures.map(img => (typeof img.decode === 'function' ? img.decode() : Promise.resolve()).catch(() => null)));
    return Promise.race([decoded, new Promise(resolve => setTimeout(resolve, maxWaitMs))]);
}

async function loadDetails(entry) {
    if (entry.details) return entry.details;
    const id = Number(entry.item.id);
    try {
        if (entry.kind === 'movie') {
            if (!movieDetailsCache.has(id)) {
                const path = `movie/${id}?append_to_response=credits,videos,recommendations,release_dates,images&include_image_language=pt,en,null&include_video_language=pt,en,null`;
                movieDetailsCache.set(id, fetchTmdb(path).catch(() => {
                    movieDetailsCache.delete(id);
                    return null;
                }));
            }
            return await movieDetailsCache.get(id);
        }
        return await loadShowDetails(id);
    } catch (e) {
        return null;
    }
}

/** The title as the players and the library want it: the catalog item completed with the details. */
function fullItem(entry) {
    const details = entry.details || {};
    return { ...details, ...Object.fromEntries(Object.entries(entry.item).filter(([, v]) => v != null && v !== '')) };
}

function titleText(item) {
    return item.title || item.name || '';
}

/** What a catalog item already has: shown at once, before the details arrive. */
function renderTitleShell(entry) {
    const item = entry.item;
    const backdrop = document.getElementById('title-backdrop');
    if (backdrop) {
        const src = item.backdrop_path ? `${TMDB_IMG_W1280}${item.backdrop_path}` : (item.poster_path ? `${TMDB_IMG_W500}${item.poster_path}` : '');
        if (src) {
            backdrop.src = src;
            backdrop.classList.remove('hidden');
        } else {
            backdrop.removeAttribute('src');
            backdrop.classList.add('hidden');
        }
    }
    const logo = document.getElementById('title-logo');
    if (logo) {
        logo.classList.add('hidden');
        logo.removeAttribute('src');
    }
    const name = document.getElementById('title-page-name');
    if (name) {
        name.textContent = titleText(item) || 'Carregando...';
        name.classList.remove('visually-hidden');
    }
    setText('title-genres', '');
    setText('title-meta', '');
    setText('title-credit-line', '');
    const overview = document.getElementById('title-overview');
    if (overview) {
        overview.textContent = item.overview || '';
        overview.classList.remove('expanded');
    }
    document.getElementById('btn-title-more')?.classList.add('hidden');
    setText('title-facts', '');
    setText('title-companies', '');
    ['title-episodes-section', 'title-trailers-section', 'title-cast-section', 'title-collection-section', 'title-recs-section']
        .forEach(id => document.getElementById(id)?.classList.add('hidden'));
    renderActions(entry);
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function renderTitleDetails(entry) {
    const item = fullItem(entry);
    const details = entry.details;
    const backdrop = document.getElementById('title-backdrop');
    if (backdrop && details.backdrop_path) {
        backdrop.src = `${TMDB_IMG_W1280}${details.backdrop_path}`;
        backdrop.classList.remove('hidden');
    }

    // Title logo (transparent picture), like the catalog banners; the name stays for screen readers
    const logoPath = pickLogo(details, entry.kind);
    const logo = document.getElementById('title-logo');
    const name = document.getElementById('title-page-name');
    if (name) name.textContent = titleText(item);
    if (logo && logoPath) {
        logo.alt = titleText(item);
        logo.onload = () => name && name.classList.add('visually-hidden');
        logo.onerror = () => {
            logo.classList.add('hidden');
            if (name) name.classList.remove('visually-hidden');
        };
        logo.src = `${TMDB_IMG_W500}${logoPath}`;
        logo.classList.remove('hidden');
    }

    const genres = document.getElementById('title-genres');
    if (genres) {
        genres.innerHTML = (details.genres || []).slice(0, 3).map(g => `<span>${escapeHtml(GENRE_PT[g.id] || g.name)}</span>`).join('');
    }

    renderMeta(entry, details);
    renderCreditLine(entry, details);

    const overview = document.getElementById('title-overview');
    if (overview) {
        overview.textContent = details.overview || entry.item.overview || 'Sinopse não disponível em português.';
        overview.classList.remove('expanded');
        const more = document.getElementById('btn-title-more');
        requestAnimationFrame(() => {
            if (more) more.classList.toggle('hidden', overview.scrollHeight <= overview.clientHeight + 2);
        });
    }

    renderFacts(entry, details);
    renderCompanies(entry, details);
    renderActions(entry);

    if (entry.kind !== 'movie') {
        document.getElementById('title-episodes-section')?.classList.remove('hidden');
        const progress = getStoredWatchProgress()[details.id];
        showSeriesEpisodes(item, entry.kind === 'anime' ? 'anime' : 'tv', details, progress && progress.season ? Number(progress.season) : null);
    }
    renderTrailers(details);
    renderCast(entry, details);
    renderCollection(entry, details);
    renderRecommendations(entry, details);
    updateRowArrows();
}

/** A row that fits on screen needs no arrows. */
function updateRowArrows() {
    requestAnimationFrame(() => {
        document.querySelectorAll('#title-page .title-row').forEach(row => {
            const arrows = row.parentElement && row.parentElement.querySelector('.title-row-arrows');
            if (arrows) arrows.classList.toggle('is-idle', row.scrollWidth <= row.clientWidth + 2);
        });
    });
}

/** Title logo: Portuguese, then English, then Japanese (animes; often dark, so it comes after English). */
function pickLogo(details, kind) {
    const logos = (details.images && details.images.logos) || [];
    if (logos.length === 0) return null;
    const by = lang => logos.find(l => l.iso_639_1 === lang);
    const chosen = by('pt') || by('en') || (kind === 'anime' ? by('ja') : null) || logos[0];
    return chosen ? chosen.file_path : null;
}

function formatRuntime(minutes) {
    const total = Number(minutes) || 0;
    if (total <= 0) return '';
    const h = Math.floor(total / 60);
    const m = total % 60;
    return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m} min`;
}

/** Brazilian age rating (L, 10, 12, 14, 16, 18), or ''. */
function ageRating(entry, details) {
    if (entry.kind === 'movie') {
        const br = ((details.release_dates && details.release_dates.results) || []).find(r => r.iso_3166_1 === 'BR');
        const found = br && (br.release_dates || []).find(d => d.certification);
        return found ? found.certification : '';
    }
    const br = ((details.content_ratings && details.content_ratings.results) || []).find(r => r.iso_3166_1 === 'BR');
    return br && br.rating ? br.rating : '';
}

function renderMeta(entry, details) {
    const meta = document.getElementById('title-meta');
    if (!meta) return;
    const parts = [];
    const year = String(details.release_date || details.first_air_date || '').substring(0, 4);
    if (year) parts.push(`<span>${escapeHtml(year)}</span>`);
    if (entry.kind === 'movie') {
        const runtime = formatRuntime(details.runtime);
        if (runtime) parts.push(`<span>${escapeHtml(runtime)}</span>`);
    } else {
        const seasons = Number(details.number_of_seasons) || 0;
        const episodes = Number(details.number_of_episodes) || 0;
        if (seasons) parts.push(`<span>${seasons} ${seasons === 1 ? 'temporada' : 'temporadas'}</span>`);
        if (episodes) parts.push(`<span>${episodes} episódios</span>`);
    }
    const rating = ageRating(entry, details);
    if (rating) {
        const cls = rating === 'L' ? 'is-free' : `is-${escapeAttr(rating)}`;
        parts.push(`<span class="title-age ${cls}" title="Classificação indicativa">${escapeHtml(rating)}</span>`);
    }
    if (details.vote_average) {
        parts.push(`<span class="title-score">${starSvg(true)}${escapeHtml(Number(details.vote_average).toFixed(1))}</span>`);
    }
    meta.innerHTML = parts.join('');
}

/** "Direção: ..." (movies) or "Criação: ..." (series), each name opening that person's titles. */
function renderCreditLine(entry, details) {
    const line = document.getElementById('title-credit-line');
    if (!line) return;
    let label = '';
    let people = [];
    if (entry.kind === 'movie') {
        label = 'Direção';
        people = ((details.credits && details.credits.crew) || []).filter(c => c.job === 'Director').slice(0, 2);
    } else {
        label = 'Criação';
        people = (details.created_by || []).slice(0, 2);
    }
    if (people.length === 0) {
        line.textContent = '';
        return;
    }
    line.innerHTML = `<span class="title-credit-label">${label}:</span> ` + people.map(p =>
        `<button type="button" class="title-credit-link" data-person-id="${escapeAttr(p.id)}" data-person-name="${escapeAttr(p.name)}" data-person-photo="${escapeAttr(p.profile_path || '')}">${escapeHtml(p.name)}</button>`
    ).join(', ');
}

function formatDate(isoDate) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate || ''));
    if (!match) return '';
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

/** Clock time the movie ends if it starts now ("16:38"). */
function endsAt(minutes) {
    const end = new Date(Date.now() + Number(minutes) * 60000);
    return `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
}

function renderFacts(entry, details) {
    const facts = document.getElementById('title-facts');
    if (!facts) return;
    const rows = [];
    const originalTitle = details.original_title || details.original_name;
    if (originalTitle && originalTitle !== (details.title || details.name)) rows.push(['Título original', originalTitle]);
    if (details.status) rows.push(['Situação', STATUS_PT[details.status] || details.status]);
    if (entry.kind === 'movie') {
        if (details.release_date) rows.push(['Lançamento', formatDate(details.release_date)]);
        if (details.runtime) rows.push(['Duração', `${formatRuntime(details.runtime)} · termina às ${endsAt(details.runtime)}`]);
    } else {
        if (details.first_air_date) rows.push(['Estreia', formatDate(details.first_air_date)]);
        const next = details.next_episode_to_air;
        if (next && next.air_date) rows.push(['Próximo episódio', `${formatDate(next.air_date)} · T${next.season_number}:E${next.episode_number}`]);
        const runtime = Array.isArray(details.episode_run_time) ? details.episode_run_time[0] : null;
        if (runtime) rows.push(['Episódios', `cerca de ${runtime} min`]);
    }
    facts.innerHTML = rows.map(([label, value]) =>
        `<div class="title-fact"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`
    ).join('');
    facts.closest('.title-hero-side')?.classList.toggle('hidden', rows.length === 0);
}

/** Production company logos (white, as on a dark poster), each opening that company's titles. */
function renderCompanies(entry, details) {
    const box = document.getElementById('title-companies');
    if (!box) return;
    const companies = (details.production_companies || []).filter(c => c.logo_path).slice(0, 6);
    box.innerHTML = companies.map(c =>
        `<button type="button" class="title-company" data-company-id="${escapeAttr(c.id)}" data-company-name="${escapeAttr(c.name)}" data-company-logo="${escapeAttr(c.logo_path)}" title="${escapeAttr(c.name)}" aria-label="Títulos de ${escapeAttr(c.name)}">
            <img class="fade-in" src="${escapeAttr(TMDB_IMG_W185 + c.logo_path)}" alt="${escapeAttr(c.name)}" loading="lazy">
        </button>`
    ).join('');
}

// --- Assistir and the library buttons ---

function formatClock(seconds) {
    const s = Math.max(0, Math.floor(Number(seconds) || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
}

function playLabel(entry) {
    const id = entry.item.id;
    if (entry.kind === 'movie') {
        const progress = getMovieProgress(id);
        if (progress && !progress.finished && progress.position > 30) return `Continuar de ${formatClock(progress.position)}`;
        return 'Assistir';
    }
    const progress = getStoredWatchProgress()[id];
    if (progress && progress.season && progress.episode) return `Continuar T${progress.season}:E${progress.episode}`;
    return 'Assistir T1:E1';
}

function renderActions(entry) {
    setText('title-play-label', playLabel(entry));
    const state = getLibraryState(entry.kind, entry.item.id);
    const watchlist = document.getElementById('btn-title-watchlist');
    if (watchlist) {
        watchlist.classList.toggle('is-on', state.watchlist);
        watchlist.setAttribute('aria-pressed', String(state.watchlist));
        watchlist.title = state.watchlist ? 'Remover de Quero assistir' : 'Quero assistir';
        watchlist.setAttribute('aria-label', watchlist.title);
    }
    const watched = document.getElementById('btn-title-watched');
    if (watched) {
        watched.classList.toggle('is-on', state.watched);
        watched.setAttribute('aria-pressed', String(state.watched));
        watched.title = state.watched ? 'Desmarcar como assistido' : 'Marcar como assistido';
        watched.setAttribute('aria-label', watched.title);
    }
    const rate = document.getElementById('btn-title-rate');
    if (rate) {
        rate.classList.toggle('is-on', Boolean(state.rating));
        rate.title = state.rating ? `Sua nota: ${formatStars(state.rating)} estrelas` : 'Avaliar';
        rate.setAttribute('aria-label', rate.title);
        setText('title-rate-value', state.rating ? formatStars(state.rating) : '');
    }
}

/** 1 to 10 shown as stars with halves: 7 -> "3,5". */
function formatStars(value) {
    return (Number(value) / 2).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}

function play(entry, target = null) {
    const item = fullItem(entry);
    if (entry.kind === 'movie') {
        playMovie(item);
        return;
    }
    if (target) {
        openEpisode(item, target);
        return;
    }
    const progress = getStoredWatchProgress()[item.id];
    openEpisode(item, progress && progress.season && progress.episode
        ? { season: progress.season, episode: progress.episode }
        : { season: 1, episode: 1 });
}

function startRequestedPlayback(entry, options) {
    if (!options || current !== entry) return;
    if (options.episode) play(entry, options.episode);
    else if (options.play) play(entry);
}

function libraryToggle(field) {
    if (!current || current.type !== 'title') return;
    const entry = current;
    const state = getLibraryState(entry.kind, entry.item.id);
    const item = fullItem(entry);
    if (field === 'watchlist') {
        setWatchlist(entry.kind, item, !state.watchlist);
        showToast(state.watchlist ? 'Removido de Quero assistir' : 'Adicionado a Quero assistir');
    } else {
        setWatched(entry.kind, item, !state.watched);
        showToast(state.watched ? 'Desmarcado como assistido' : 'Marcado como assistido');
    }
    renderActions(entry);
}

// --- Rating: 5 stars with halves (1 to 10) ---

function starSvg(filled) {
    return `<svg class="title-star-svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><polygon points="12 2.5 14.9 8.6 21.5 9.4 16.6 13.9 17.9 20.5 12 17.2 6.1 20.5 7.4 13.9 2.5 9.4 9.1 8.6"></polygon></svg>`;
}

function buildRateStars() {
    const box = document.getElementById('title-rate-stars');
    if (!box || box.childElementCount > 0) return;
    for (let star = 1; star <= 5; star++) {
        const wrap = document.createElement('span');
        wrap.className = 'title-rate-star';
        wrap.dataset.star = String(star);
        wrap.innerHTML = `
            <span class="title-rate-outline">${starSvg(false)}</span>
            <span class="title-rate-fill">${starSvg(true)}</span>
            <button type="button" class="title-rate-half left" data-value="${star * 2 - 1}" aria-label="Nota ${formatStars(star * 2 - 1)}"></button>
            <button type="button" class="title-rate-half right" data-value="${star * 2}" aria-label="Nota ${formatStars(star * 2)}"></button>`;
        box.appendChild(wrap);
    }
}

/** Fills the stars for `value` (1 to 10); 0 empties them. */
function paintStars(value) {
    document.querySelectorAll('#title-rate-stars .title-rate-star').forEach(wrap => {
        const star = Number(wrap.dataset.star);
        const fill = value >= star * 2 ? 100 : value === star * 2 - 1 ? 50 : 0;
        wrap.style.setProperty('--fill', `${fill}%`);
    });
    setText('title-rate-hint', value ? `${formatStars(value)} de 5 estrelas` : 'Escolha de meia a cinco estrelas');
}

function openRatePanel() {
    if (!current || current.type !== 'title') return;
    buildRateStars();
    const panel = document.getElementById('title-rate-panel');
    const button = document.getElementById('btn-title-rate');
    if (!panel || !button) return;
    const value = getLibraryState(current.kind, current.item.id).rating || 0;
    paintStars(value);
    document.getElementById('btn-title-rate-clear')?.classList.toggle('hidden', !value);
    panel.classList.remove('hidden');
    button.setAttribute('aria-expanded', 'true');
    panel.querySelector(`.title-rate-half[data-value="${value || 6}"]`)?.focus({ preventScroll: true });
}

function closeRatePanel() {
    const panel = document.getElementById('title-rate-panel');
    if (panel) panel.classList.add('hidden');
    document.getElementById('btn-title-rate')?.setAttribute('aria-expanded', 'false');
}

function saveRating(value) {
    if (!current || current.type !== 'title') return;
    setRating(current.kind, fullItem(current), value);
    closeRatePanel();
    renderActions(current);
    showToast(value ? `Nota salva: ${formatStars(value)} de 5 estrelas` : 'Nota removida');
}

// --- Sections below the top ---

function renderTrailers(details) {
    const section = document.getElementById('title-trailers-section');
    const row = document.getElementById('title-trailers');
    if (!section || !row) return;
    const rank = v => (v.iso_639_1 === 'pt' ? 0 : 2) + (v.type === 'Trailer' ? 0 : 1) - (v.official ? 0.5 : 0);
    const videos = ((details.videos && details.videos.results) || [])
        .filter(v => v.site === 'YouTube' && /^[\w-]{6,20}$/.test(v.key || '') && (v.type === 'Trailer' || v.type === 'Teaser'))
        .sort((a, b) => rank(a) - rank(b))
        .slice(0, 10);
    row.innerHTML = videos.map(v => `
        <button type="button" class="title-trailer-card" data-video-key="${escapeAttr(v.key)}" data-video-name="${escapeAttr(v.name || 'Trailer')}">
            <span class="title-trailer-thumb">
                <img class="fade-in" src="https://i.ytimg.com/vi/${escapeAttr(v.key)}/mqdefault.jpg" alt="" loading="lazy">
                <span class="title-trailer-play" aria-hidden="true"><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="7 4 20 12 7 20 7 4"></polygon></svg></span>
            </span>
            <span class="title-trailer-name">${escapeHtml(v.name || 'Trailer')}</span>
        </button>`).join('');
    section.classList.toggle('hidden', videos.length === 0);
}

function renderCast(entry, details) {
    const section = document.getElementById('title-cast-section');
    const grid = document.getElementById('title-cast');
    if (!section || !grid) return;
    const cast = entry.kind === 'movie'
        ? ((details.credits && details.credits.cast) || []).map(c => ({ ...c, role: c.character }))
        : ((details.aggregate_credits && details.aggregate_credits.cast) || []).map(c => ({ ...c, role: c.roles && c.roles[0] ? c.roles[0].character : '' }));
    const people = cast.slice(0, 20);
    grid.innerHTML = people.map(p => `
        <button type="button" class="title-cast-card" data-person-id="${escapeAttr(p.id)}" data-person-name="${escapeAttr(p.name)}" data-person-photo="${escapeAttr(p.profile_path || '')}" title="${escapeAttr(p.role ? `${p.name} (${p.role})` : p.name)}">
            ${p.profile_path
                ? `<img class="title-cast-photo fade-in" src="${escapeAttr(TMDB_IMG_W185 + p.profile_path)}" alt="" loading="lazy">`
                : `<span class="title-cast-photo is-empty" aria-hidden="true"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c0-4 4-6 8-6s8 2 8 6"></path></svg></span>`}
            <span class="title-cast-name">${escapeHtml(p.name)}</span>
            <span class="title-cast-role">${escapeHtml(p.role || '')}</span>
        </button>`).join('');
    section.classList.toggle('hidden', people.length === 0);
}

async function renderCollection(entry, details) {
    const section = document.getElementById('title-collection-section');
    const grid = document.getElementById('title-collection');
    if (!section || !grid) return;
    section.classList.add('hidden');
    const collection = entry.kind === 'movie' ? details.belongs_to_collection : null;
    if (!collection || !collection.id) return;
    const token = renderToken;
    if (!collectionCache.has(collection.id)) {
        collectionCache.set(collection.id, fetchTmdb(`collection/${Number(collection.id)}`).catch(() => {
            collectionCache.delete(collection.id);
            return null;
        }));
    }
    const data = await collectionCache.get(collection.id);
    if (token !== renderToken || !data) return;
    const parts = (data.parts || [])
        .filter(p => p.poster_path)
        .sort((a, b) => String(a.release_date || '9999').localeCompare(String(b.release_date || '9999')));
    if (parts.length < 2) return;
    // TMDB names them "Vingadores: Coleção"; the heading already says it
    const collectionName = String(data.name || collection.name || '').replace(/\s*[-:–]?\s*Cole[cç][aã]o$/i, '').trim();
    setText('title-collection-heading', collectionName ? `Parte da coleção ${collectionName}` : 'Coleção');
    fillCards(grid, parts.map(p => ({ kind: 'movie', item: p, current: Number(p.id) === Number(details.id) })));
    section.classList.remove('hidden');
    updateRowArrows();
}

function renderRecommendations(entry, details) {
    const section = document.getElementById('title-recs-section');
    const grid = document.getElementById('title-recs');
    if (!section || !grid) return;
    const results = ((details.recommendations && details.recommendations.results) || []).filter(r => r.poster_path).slice(0, 20);
    fillCards(grid, results.map(r => ({ kind: entry.kind === 'movie' ? 'movie' : kindOfTvItem(r), item: r })));
    section.classList.toggle('hidden', results.length === 0);
}

/** Poster cards (the catalog's look); a click opens that title here, or runs `options.onOpen(kind, item)`. */
export function fillCards(grid, cards, options = {}) {
    grid.innerHTML = '';
    const fragment = document.createDocumentFragment();
    cards.forEach(({ kind, item, current: isCurrent }) => {
        const card = document.createElement('div');
        card.className = `movie-poster-card title-card${isCurrent ? ' is-current' : ''}`;
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        const name = titleText(item) || 'Título';
        const year = String(item.release_date || item.first_air_date || '').substring(0, 4);
        card.setAttribute('aria-label', year ? `${name} (${year})` : name);
        const poster = item.poster_path ? `${TMDB_IMG_W500}${item.poster_path}` : PLACEHOLDER;
        const score = item.vote_average ? Number(item.vote_average).toFixed(1) : '';
        card.innerHTML = `
            <img class="movie-poster-img fade-in" src="${escapeAttr(poster)}" alt="${escapeAttr(name)}" loading="lazy" onerror="this.src='${PLACEHOLDER}'">
            <div class="movie-poster-overlay">
                <h4 class="movie-card-title" title="${escapeAttr(name)}">${escapeHtml(name)}</h4>
                <div class="movie-card-meta">
                    <span>${escapeHtml(year || kindLabel(kind))}</span>
                    ${score ? `<span class="movie-card-rating">★ ${escapeHtml(score)}</span>` : ''}
                </div>
            </div>`;
        const open = () => {
            if (isCurrent) {
                page()?.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            if (typeof options.onOpen === 'function') options.onOpen(kind, item);
            else openTitle(kind, item);
        };
        card.addEventListener('click', open);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                open();
            }
        });
        fragment.appendChild(card);
    });
    grid.appendChild(fragment);
}

// --- Lists: a person's or a company's titles ---

/** A person's titles on the page (search results use it too). */
export function openPersonTitles(person) {
    openPersonList(person);
}

function openPersonList(person) {
    showEntry({ type: 'list', list: { kind: 'person', ...person }, item: { id: person.id }, scroll: 0 });
}

function openCompanyList(company, media) {
    showEntry({ type: 'list', list: { kind: 'company', media, ...company }, item: { id: company.id }, page: 0, scroll: 0 });
}

async function renderList(entry, token) {
    const list = entry.list;
    const avatar = document.getElementById('title-list-avatar');
    const grid = document.getElementById('title-list-grid');
    const more = document.getElementById('btn-title-list-more');
    setText('title-list-name', list.name || '');
    setText('title-list-kicker', list.kind === 'person' ? 'Filmes e séries' : (list.media === 'movie' ? 'Filmes da produtora' : 'Séries da produtora'));
    if (avatar) {
        const picture = list.kind === 'person' ? list.photo : list.logo;
        avatar.classList.toggle('is-logo', list.kind === 'company');
        if (picture) {
            avatar.src = `${TMDB_IMG_W185}${picture}`;
            avatar.classList.remove('hidden');
        } else {
            avatar.removeAttribute('src');
            avatar.classList.add('hidden');
        }
    }
    if (more) more.classList.add('hidden');
    if (entry.cards) {
        fillCards(grid, entry.cards);
        if (more) more.classList.toggle('hidden', !(entry.page < entry.totalPages));
        return;
    }
    grid.innerHTML = '<p class="title-list-status">Carregando títulos...</p>';
    try {
        if (list.kind === 'person') {
            const data = await fetchTmdb(`person/${Number(list.id)}/combined_credits`);
            if (token !== renderToken) return;
            const seen = new Set();
            const roles = [...(data.cast || []), ...((data.crew || []).filter(c => ['Director', 'Creator', 'Screenplay', 'Writer', 'Producer'].includes(c.job)))];
            entry.cards = roles
                .filter(r => (r.media_type === 'movie' || r.media_type === 'tv') && r.poster_path)
                .filter(r => {
                    const key = `${r.media_type}:${r.id}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                })
                .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
                .slice(0, 60)
                .map(r => ({ kind: r.media_type === 'movie' ? 'movie' : kindOfTvItem(r), item: r }));
        } else {
            await loadCompanyPage(entry);
            if (token !== renderToken) return;
        }
        if (!entry.cards || entry.cards.length === 0) {
            grid.innerHTML = '<p class="title-list-status">Nenhum título encontrado.</p>';
            return;
        }
        fillCards(grid, entry.cards);
        if (more) more.classList.toggle('hidden', !(entry.page < entry.totalPages));
    } catch (e) {
        if (token === renderToken) grid.innerHTML = '<p class="title-list-status">Não foi possível carregar os títulos.</p>';
    }
}

async function loadCompanyPage(entry) {
    const list = entry.list;
    const nextPage = (entry.page || 0) + 1;
    const data = await fetchTmdb(`discover/${list.media === 'movie' ? 'movie' : 'tv'}?with_companies=${Number(list.id)}&sort_by=popularity.desc&page=${nextPage}`);
    const cards = (data.results || [])
        .filter(r => r.poster_path)
        .map(r => ({ kind: list.media === 'movie' ? 'movie' : kindOfTvItem(r), item: r }));
    entry.cards = [...(entry.cards || []), ...cards];
    entry.page = data.page || nextPage;
    entry.totalPages = Math.min(Number(data.total_pages) || 1, 20);
}

async function loadMoreList() {
    const entry = current;
    if (!entry || entry.type !== 'list' || entry.list.kind !== 'company') return;
    const more = document.getElementById('btn-title-list-more');
    if (more) more.disabled = true;
    try {
        await loadCompanyPage(entry);
        if (current === entry) {
            fillCards(document.getElementById('title-list-grid'), entry.cards);
            if (more) more.classList.toggle('hidden', !(entry.page < entry.totalPages));
        }
    } catch (e) {
        showToast('Não foi possível carregar mais títulos.');
    } finally {
        if (more) more.disabled = false;
    }
}

// --- Trailer: a small YouTube player over the page ---

function openTrailer(key, name) {
    const modal = document.getElementById('trailer-modal');
    const frame = document.getElementById('trailer-modal-frame');
    if (!modal || !frame || !/^[\w-]{6,20}$/.test(key)) return;
    setText('trailer-modal-title', name || 'Trailer');
    const youtube = document.getElementById('trailer-modal-youtube');
    if (youtube) youtube.href = `https://www.youtube.com/watch?v=${key}`;
    frame.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${key}?autoplay=1&rel=0&playsinline=1`;
    iframe.title = name || 'Trailer';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    iframe.setAttribute('allowfullscreen', '');
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.appendChild(iframe);
    const wasHidden = modal.classList.contains('hidden');
    modal.classList.remove('hidden');
    if (wasHidden) pushNavLayer('modal-trailer');
    document.getElementById('btn-close-trailer')?.focus({ preventScroll: true });
}

export function closeTrailer({ keepHistory = false } = {}) {
    const modal = document.getElementById('trailer-modal');
    if (!modal || modal.classList.contains('hidden')) return;
    modal.classList.add('hidden');
    const frame = document.getElementById('trailer-modal-frame');
    if (frame) frame.innerHTML = '';
    if (!keepHistory) popNavLayer();
}

// --- Setup ---

/** A title link opened the site (?filme=ID, ?serie=ID, ?anime=ID): read before the first tab switch clears it. */
export function readTitleFromAddress() {
    try {
        const params = new URLSearchParams(window.location.search);
        for (const [kind, name] of Object.entries(URL_PARAM)) {
            const value = params.get(name);
            if (value && /^\d{1,9}$/.test(value)) return { kind, id: Number(value) };
        }
    } catch (e) {
        // No usable address
    }
    return null;
}

export function setupTitlePage() {
    const el = page();
    if (!el || el.dataset.ready === '1') return;
    el.dataset.ready = '1';

    // Any tab switch while the page is open leaves the page first
    setViewSwitchGuard((viewName) => {
        if (!isTitlePageOpen()) return false;
        exitTitleTo(viewName);
        return true;
    });

    document.getElementById('btn-title-back')?.addEventListener('click', titleBack);
    document.getElementById('btn-title-play')?.addEventListener('click', () => {
        if (current && current.type === 'title') play(current);
    });
    document.getElementById('btn-title-watchlist')?.addEventListener('click', () => libraryToggle('watchlist'));
    document.getElementById('btn-title-watched')?.addEventListener('click', () => libraryToggle('watched'));
    document.getElementById('btn-title-rate')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const panel = document.getElementById('title-rate-panel');
        if (panel && panel.classList.contains('hidden')) openRatePanel();
        else closeRatePanel();
    });
    document.getElementById('btn-title-rate-clear')?.addEventListener('click', () => saveRating(null));
    document.getElementById('btn-title-more')?.addEventListener('click', () => {
        const overview = document.getElementById('title-overview');
        const more = document.getElementById('btn-title-more');
        if (!overview || !more) return;
        const expanded = overview.classList.toggle('expanded');
        more.textContent = expanded ? 'Ler menos' : 'Ler mais';
    });
    document.getElementById('btn-title-list-more')?.addEventListener('click', loadMoreList);

    const stars = document.getElementById('title-rate-stars');
    if (stars) {
        stars.addEventListener('click', (e) => {
            const half = e.target.closest('.title-rate-half');
            if (half) saveRating(Number(half.dataset.value));
        });
        stars.addEventListener('mouseover', (e) => {
            const half = e.target.closest('.title-rate-half');
            if (half) paintStars(Number(half.dataset.value));
        });
        stars.addEventListener('focusin', (e) => {
            const half = e.target.closest('.title-rate-half');
            if (half) paintStars(Number(half.dataset.value));
        });
        stars.addEventListener('mouseleave', () => {
            if (current && current.type === 'title') paintStars(getLibraryState(current.kind, current.item.id).rating || 0);
        });
    }

    // Pictures marked .fade-in show once loaded (or failed: their fallback takes the place)
    const markLoaded = (e) => {
        if (e.target && e.target.classList && e.target.classList.contains('fade-in')) e.target.classList.add('is-loaded');
    };
    el.addEventListener('load', markLoaded, true);
    el.addEventListener('error', markLoaded, true);

    // Delegated: row arrows, people, companies, trailers
    el.addEventListener('click', (e) => {
        const arrow = e.target.closest('[data-row]');
        if (arrow) {
            const row = document.getElementById(arrow.dataset.row);
            if (row) row.scrollBy({ left: Number(arrow.dataset.dir) * Math.max(240, row.clientWidth * 0.8), behavior: 'smooth' });
            return;
        }

        const panel = document.getElementById('title-rate-panel');
        if (panel && !panel.classList.contains('hidden') && !e.target.closest('.title-rate-wrap')) closeRatePanel();

        const person = e.target.closest('[data-person-id]');
        if (person) {
            openPersonList({ id: Number(person.dataset.personId), name: person.dataset.personName, photo: person.dataset.personPhoto || '' });
            return;
        }
        const company = e.target.closest('[data-company-id]');
        if (company) {
            const media = current && current.type === 'title' && current.kind === 'movie' ? 'movie' : 'tv';
            openCompanyList({ id: Number(company.dataset.companyId), name: company.dataset.companyName, logo: company.dataset.companyLogo || '' }, media);
            return;
        }
        const trailer = e.target.closest('[data-video-key]');
        if (trailer) openTrailer(trailer.dataset.videoKey, trailer.dataset.videoName);
    });
    el.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const panel = document.getElementById('title-rate-panel');
            if (panel && !panel.classList.contains('hidden')) {
                e.stopPropagation();
                closeRatePanel();
                document.getElementById('btn-title-rate')?.focus({ preventScroll: true });
            }
        }
    });

    const trailerModal = document.getElementById('trailer-modal');
    document.getElementById('btn-close-trailer')?.addEventListener('click', () => closeTrailer());
    trailerModal?.addEventListener('click', (e) => {
        if (e.target === trailerModal) closeTrailer();
    });

    // Back from a player lands here: the Assistir label and the buttons show the new progress
    const refresh = () => {
        if (isTitlePageOpen() && current && current.type === 'title') renderActions(current);
    };
    window.addEventListener('tvzinha:playerClosed', refresh);
    window.addEventListener('resize', () => {
        if (isTitlePageOpen()) updateRowArrows();
    });
    window.addEventListener(PROGRESS_EVENT, refresh);
}
