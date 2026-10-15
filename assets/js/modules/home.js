/**
 * TVZINHA ONLINE - Home Hub & Streaming Showcase Module
 * Coordinates the multi-universe hero carousel, category discovery tracks,
 * and quick-navigation portals for Movies, Series, Animes, and Live Channels.
 */

import { store } from '../core/state.js?v=20261015_1045';
import {
    TMDB_IMG_W500,
    TMDB_IMG_ORIGINAL,
    TMDB_CACHE_KEY,
    TMDB_SERIES_CACHE_KEY,
    TMDB_ANIMES_CACHE_KEY
} from '../core/constants.js?v=20261015_1045';
import { isBackgroundMediaAllowed } from '../core/activity.js?v=20261015_1045';
import { switchAppView } from '../navigation/router.js?v=20261015_1045';
import { openMovieDetailsModal } from './movies.js?v=20261015_1045';
import { openSeriesModal } from './series.js?v=20261015_1045';
import { selectChannelByName } from './channels.js?v=20261015_1045';
import { getChannelLogoSrc, createLogoBadgeHtml } from '../core/icons.js?v=20261015_1045';

let homeHeroItems = [];
let currentHomeHeroIndex = 0;
let homeHeroTimer = null;
let isHomeInitialized = false;

/**
 * Extracts and normalizes a flat array of channels from reactive store.channelsData
 */
function getFlatChannelsList() {
    const data = store.channelsData || {};
    const flat = [];
    Object.entries(data).forEach(([category, channels]) => {
        if (!channels || typeof channels !== 'object') return;
        Object.entries(channels).forEach(([name, players]) => {
            let sourcesCount = 0;
            if (players?.sources && Array.isArray(players.sources)) {
                sourcesCount = players.sources.length + (players.contingency ? Object.keys(players.contingency).length : 0);
            } else if (typeof players === 'object') {
                sourcesCount = Object.keys(players).length;
            }
            const logo = getChannelLogoSrc(name);
            flat.push({
                name,
                category,
                sourcesCount: sourcesCount || 1,
                logo: logo || null,
                players
            });
        });
    });
    return flat;
}

// Curated high-fidelity fallback highlights (used while TMDB caches load in background)
const DEFAULT_HERO_HIGHLIGHTS = [
    {
        type: 'movie',
        id: 1022789,
        title: "Divertida Mente 2",
        categoryLabel: "Filmes",
        categoryBadgeClass: "badge-amber",
        meta: "2024 • ★ 7.7",
        overview: "Na mente de Riley, recém-chegada à adolescência, a sala de controle sofre uma demolição para abrir espaço para novas e surpreendentes emoções.",
        backdropUrl: "https://image.tmdb.org/t/p/original/xg27NrXi7EgQxLQVIzGQZfrtlip.jpg",
        targetTab: "movies"
    },
    {
        type: 'series',
        id: 94605,
        title: "Arcane",
        categoryLabel: "Séries",
        categoryBadgeClass: "badge-ruby",
        meta: "2021 • ★ 8.8",
        overview: "Em meio ao conflito entre as cidades-gêmeas de Piltover e Zaun, duas irmãs lutam em lados opostos de uma guerra entre tecnologias mágicas e crenças incompatíveis.",
        backdropUrl: "https://image.tmdb.org/t/p/original/2wT5nF1gM3pA465t6Y345098k.jpg",
        targetTab: "series"
    },
    {
        type: 'anime',
        id: 37854,
        title: "One Piece",
        categoryLabel: "Animes",
        categoryBadgeClass: "badge-magenta",
        meta: "1999 • ★ 8.7",
        overview: "Monkey D. Luffy e sua tripulação navegam pelos mares mais perigosos em busca do lendário tesouro supremo deixado por Gol D. Roger.",
        backdropUrl: "https://image.tmdb.org/t/p/original/4Mt7RSstvJtk5JouOwhKaMeYSTz.jpg",
        targetTab: "animes"
    },
    {
        type: 'channel',
        title: "SporTV HD",
        channelName: "SporTV",
        categoryLabel: "Ao Vivo",
        categoryBadgeClass: "badge-emerald",
        meta: "Ao Vivo • 4 Servidores",
        overview: "Grandes jogos do futebol brasileiro, campeonatos internacionais e cobertura esportiva 24 horas em alta definição.",
        backdropUrl: "assets/logos/fav/icon-detailed.svg",
        targetTab: "tv"
    }
];

export function initHomeView() {
    if (isHomeInitialized) {
        refreshHomeContent();
        return;
    }
    isHomeInitialized = true;

    setupQuickNavPills();
    setupRowSeeAllButtons();
    buildHomeHeroShowcase();
    refreshHomeContent();

    // Re-check when channel catalog loads
    store.addEventListener('channels:loaded', () => {
        renderHomeChannelsTrack();
        buildHomeHeroShowcase();
    });

    // Re-check periodically when TMDB caches land from idle background preloads
    window.addEventListener('storage', (e) => {
        if ([TMDB_CACHE_KEY, TMDB_SERIES_CACHE_KEY, TMDB_ANIMES_CACHE_KEY].includes(e.key)) {
            refreshHomeContent();
        }
    });

    // Check again after 3s when idle preloading may have finished
    setTimeout(() => {
        refreshHomeContent();
    }, 3500);
}

function setupQuickNavPills() {
    document.querySelectorAll('.home-quick-nav .quick-nav-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const targetView = pill.dataset.viewTarget;
            if (targetView) switchAppView(targetView);
        });
    });
}

function setupRowSeeAllButtons() {
    document.querySelectorAll('.btn-row-see-all').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.targetTab;
            if (targetTab) switchAppView(targetTab);
        });
    });
}

export function refreshHomeContent() {
    buildHomeHeroShowcase();
    renderHomeChannelsTrack();
    renderHomeMoviesTrack();
    renderHomeSeriesTrack();
    renderHomeAnimesTrack();
}

/**
 * Builds dynamic multi-universe Hero slides combining cached highlights
 */
function buildHomeHeroShowcase() {
    const slides = [];

    // 1. Movie Highlight
    try {
        const raw = localStorage.getItem(TMDB_CACHE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            const m = parsed?.data?.trending?.[0];
            if (m && m.backdrop_path) {
                slides.push({
                    type: 'movie',
                    id: m.id,
                    title: m.title || m.name,
                    categoryLabel: "Filmes",
                    categoryBadgeClass: "badge-amber",
                    meta: `${(m.release_date || '').substring(0, 4) || 'Cinema'} • ★ ${m.vote_average ? m.vote_average.toFixed(1) : '8.0'}`,
                    overview: m.overview || "Grande sucesso em cartaz no cinema sob demanda da Tvzinha.",
                    backdropUrl: `${TMDB_IMG_ORIGINAL}${m.backdrop_path}`,
                    targetTab: "movies",
                    raw: m
                });
            }
        }
    } catch (e) {}

    // 2. Series Highlight
    try {
        const raw = localStorage.getItem(TMDB_SERIES_CACHE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            const s = parsed?.data?.trending?.[0];
            if (s && s.backdrop_path) {
                slides.push({
                    type: 'series',
                    id: s.id,
                    title: s.name || s.title,
                    categoryLabel: "Séries",
                    categoryBadgeClass: "badge-ruby",
                    meta: `${(s.first_air_date || '').substring(0, 4) || 'Série'} • ★ ${s.vote_average ? s.vote_average.toFixed(1) : '8.5'}`,
                    overview: s.overview || "Temporadas completas com alta qualidade de reprodução e múltiplos servidores.",
                    backdropUrl: `${TMDB_IMG_ORIGINAL}${s.backdrop_path}`,
                    targetTab: "series",
                    raw: s
                });
            }
        }
    } catch (e) {}

    // 3. Anime Highlight
    try {
        const raw = localStorage.getItem(TMDB_ANIMES_CACHE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            const a = parsed?.data?.trending?.[0];
            if (a && a.backdrop_path) {
                slides.push({
                    type: 'anime',
                    id: a.id,
                    title: a.name || a.title,
                    categoryLabel: "Animes",
                    categoryBadgeClass: "badge-magenta",
                    meta: `${(a.first_air_date || '').substring(0, 4) || 'Anime'} • ★ ${a.vote_average ? a.vote_average.toFixed(1) : '8.6'}`,
                    overview: a.overview || "Animações japonesas de sucesso com legendas e dublagens de alta fidelidade.",
                    backdropUrl: `${TMDB_IMG_ORIGINAL}${a.backdrop_path}`,
                    targetTab: "animes",
                    raw: a
                });
            }
        }
    } catch (e) {}

    // 4. Live Channel / Sports Highlight
    const flatChannels = getFlatChannelsList();
    if (flatChannels.length > 0) {
        const featuredChannel = flatChannels.find(c => c.name.toLowerCase().includes('sportv')) ||
                                flatChannels.find(c => c.name.toLowerCase().includes('globo')) ||
                                flatChannels[0];
        if (featuredChannel) {
            slides.push({
                type: 'channel',
                title: `${featuredChannel.name} HD`,
                channelName: featuredChannel.name,
                categoryLabel: "Ao Vivo",
                categoryBadgeClass: "badge-emerald",
                meta: `Transmissão HD • ${featuredChannel.sourcesCount} Servidores`,
                overview: "Assista à programação ao vivo com alta estabilidade e players nativos sem interrupções.",
                backdropUrl: featuredChannel.logo || "assets/logos/fav/icon-detailed.svg",
                targetTab: "tv",
                raw: featuredChannel
            });
        }
    }

    homeHeroItems = slides.length >= 2 ? slides : DEFAULT_HERO_HIGHLIGHTS;
    setupHeroControls(homeHeroItems);
    showHeroSlide(0);
}

function setupHeroControls(items) {
    const dotsContainer = document.getElementById("home-hero-dots");
    const btnPrev = document.getElementById("btn-home-hero-prev");
    const btnNext = document.getElementById("btn-home-hero-next");
    const heroSection = document.getElementById("home-hero-showcase");

    if (dotsContainer) {
        dotsContainer.innerHTML = "";
        items.forEach((_, idx) => {
            const dot = document.createElement("button");
            dot.className = `hero-dot ${idx === 0 ? 'active' : ''}`;
            dot.setAttribute("aria-label", `Destaque ${idx + 1}`);
            dot.addEventListener("click", () => showHeroSlide(idx));
            dotsContainer.appendChild(dot);
        });
    }

    if (btnPrev) {
        btnPrev.onclick = () => showHeroSlide((currentHomeHeroIndex - 1 + items.length) % items.length);
    }
    if (btnNext) {
        btnNext.onclick = () => showHeroSlide((currentHomeHeroIndex + 1) % items.length);
    }

    if (heroSection) {
        heroSection.onmouseenter = () => clearInterval(homeHeroTimer);
        heroSection.onmouseleave = () => startHeroAutoRotate();
    }

    startHeroAutoRotate();
}

function startHeroAutoRotate() {
    clearInterval(homeHeroTimer);
    if (!homeHeroItems || homeHeroItems.length <= 1) return;
    homeHeroTimer = setInterval(() => {
        if (!isBackgroundMediaAllowed('home')) return;
        const nextIdx = (currentHomeHeroIndex + 1) % homeHeroItems.length;
        showHeroSlide(nextIdx);
    }, 7500);
}

function showHeroSlide(index) {
    if (!homeHeroItems || !homeHeroItems[index]) return;
    currentHomeHeroIndex = index;
    const item = homeHeroItems[index];

    const backdropEl = document.getElementById("home-hero-backdrop");
    const badgeEl = document.getElementById("home-hero-badge");
    const metaEl = document.getElementById("home-hero-meta");
    const titleEl = document.getElementById("home-hero-title");
    const overviewEl = document.getElementById("home-hero-overview");
    const btnWatch = document.getElementById("btn-home-hero-watch");
    const btnWatchLabel = document.getElementById("btn-home-hero-watch-label");
    const btnExplore = document.getElementById("btn-home-hero-explore");
    const btnExploreLabel = document.getElementById("btn-home-hero-explore-label");

    if (backdropEl && item.backdropUrl) {
        backdropEl.classList.add("fade-transition");
        const img = new Image();
        img.onload = () => {
            backdropEl.src = img.src;
            backdropEl.classList.remove("fade-transition");
        };
        img.src = item.backdropUrl;
    }

    if (badgeEl) {
        badgeEl.textContent = item.categoryLabel;
        badgeEl.className = `home-hero-badge category-badge ${item.categoryBadgeClass || ''}`;
    }

    if (metaEl) metaEl.textContent = item.meta || '';
    if (titleEl) titleEl.textContent = item.title;
    if (overviewEl) overviewEl.textContent = item.overview;

    if (btnWatch) {
        btnWatch.onclick = () => {
            if (item.type === 'movie' && item.raw) {
                openMovieDetailsModal(item.raw);
            } else if ((item.type === 'series' || item.type === 'anime') && item.raw) {
                openSeriesModal(item.raw, item.type === 'anime' ? 'anime' : 'tv');
            } else if (item.type === 'channel' && item.channelName) {
                selectChannelByName(item.channelName);
            } else {
                switchAppView(item.targetTab);
            }
        };
    }

    if (btnWatchLabel) {
        btnWatchLabel.textContent = item.type === 'channel' ? "Assistir Transmissão" : "Assistir Agora";
    }

    if (btnExplore) {
        btnExplore.onclick = () => switchAppView(item.targetTab);
    }

    if (btnExploreLabel) {
        btnExploreLabel.textContent = `Explorar ${item.categoryLabel}`;
    }

    // Update dots
    document.querySelectorAll("#home-hero-dots .hero-dot").forEach((dot, idx) => {
        dot.classList.toggle("active", idx === index);
    });
}

/**
 * Renders modern 16:9 Dark Glass channel cards in the Home track
 */
function renderHomeChannelsTrack() {
    const track = document.getElementById("home-track-channels");
    if (!track) return;

    const channels = getFlatChannelsList().slice(0, 10);
    if (channels.length === 0) {
        track.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem; padding: 12px;">Carregando canais ao vivo...</p>`;
        return;
    }

    track.innerHTML = "";
    const fragment = document.createDocumentFragment();

    channels.forEach(ch => {
        const card = document.createElement("div");
        card.className = "home-channel-card";
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", `Canal ${ch.name}`);

        const logoHtml = createLogoBadgeHtml(ch.name, 'lg');

        card.innerHTML = `
            <div class="channel-card-glow"></div>
            <div class="channel-card-top">
                <span class="live-dot-badge"><span class="pulse-dot"></span> AO VIVO</span>
                <span class="channel-sources-badge">${ch.sourcesCount} fontes</span>
            </div>
            <div class="channel-card-logo-box">
                ${logoHtml}
            </div>
            <div class="channel-card-bottom">
                <h4 class="channel-card-name">${ch.name}</h4>
                <span class="channel-card-category">${ch.category || 'TV'}</span>
            </div>
        `;

        card.addEventListener("click", () => selectChannelByName(ch.name));
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                selectChannelByName(ch.name);
            }
        });

        fragment.appendChild(card);
    });

    track.appendChild(fragment);
}

/**
 * Renders Movies row from TMDB cache
 */
function renderHomeMoviesTrack() {
    const track = document.getElementById("home-track-movies");
    if (!track) return;

    try {
        const raw = localStorage.getItem(TMDB_CACHE_KEY);
        if (!raw) {
            track.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem; padding: 12px;">Carregando catálogo de filmes...</p>`;
            return;
        }
        const parsed = JSON.parse(raw);
        const movies = parsed?.data?.trending || [];
        if (movies.length === 0) return;

        track.innerHTML = "";
        const fragment = document.createDocumentFragment();
        movies.slice(0, 15).forEach(m => {
            const card = createPosterCard({
                id: m.id,
                title: m.title || m.name,
                year: (m.release_date || '').substring(0, 4) || 'Cinema',
                rating: m.vote_average ? m.vote_average.toFixed(1) : '—',
                posterPath: m.poster_path,
                onClick: () => openMovieDetailsModal(m)
            });
            fragment.appendChild(card);
        });
        track.appendChild(fragment);
    } catch (e) {}
}

/**
 * Renders Series row from TMDB series cache
 */
function renderHomeSeriesTrack() {
    const track = document.getElementById("home-track-series");
    if (!track) return;

    try {
        const raw = localStorage.getItem(TMDB_SERIES_CACHE_KEY);
        if (!raw) {
            track.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem; padding: 12px;">Carregando catálogo de séries...</p>`;
            return;
        }
        const parsed = JSON.parse(raw);
        const series = parsed?.data?.trending || [];
        if (series.length === 0) return;

        track.innerHTML = "";
        const fragment = document.createDocumentFragment();
        series.slice(0, 15).forEach(s => {
            const card = createPosterCard({
                id: s.id,
                title: s.name || s.title,
                year: (s.first_air_date || '').substring(0, 4) || 'Série',
                rating: s.vote_average ? s.vote_average.toFixed(1) : '—',
                posterPath: s.poster_path,
                onClick: () => openSeriesModal(s, 'tv')
            });
            fragment.appendChild(card);
        });
        track.appendChild(fragment);
    } catch (e) {}
}

/**
 * Renders Anime masterpieces row from TMDB anime cache
 */
function renderHomeAnimesTrack() {
    const track = document.getElementById("home-track-animes");
    if (!track) return;

    try {
        const raw = localStorage.getItem(TMDB_ANIMES_CACHE_KEY);
        if (!raw) {
            track.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem; padding: 12px;">Carregando catálogo de animes...</p>`;
            return;
        }
        const parsed = JSON.parse(raw);
        const animes = parsed?.data?.trending || parsed?.data?.all_time_top || [];
        if (animes.length === 0) return;

        track.innerHTML = "";
        const fragment = document.createDocumentFragment();
        animes.slice(0, 15).forEach(a => {
            const card = createPosterCard({
                id: a.id,
                title: a.name || a.title,
                year: (a.first_air_date || '').substring(0, 4) || 'Anime',
                rating: a.vote_average ? a.vote_average.toFixed(1) : '—',
                posterPath: a.poster_path,
                onClick: () => openSeriesModal(a, 'anime')
            });
            fragment.appendChild(card);
        });
        track.appendChild(fragment);
    } catch (e) {}
}

/**
 * Helper to build standard 2:3 poster cards identical to catalog rows
 */
function createPosterCard({ id, title, year, rating, posterPath, onClick }) {
    const card = document.createElement("div");
    card.className = "movie-poster-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `${title} (${year})`);

    const posterUrl = posterPath
        ? `${TMDB_IMG_W500}${posterPath}`
        : 'assets/logos/fav/icon-detailed.svg';

    card.innerHTML = `
        <img class="movie-poster-img" src="${posterUrl}" alt="${title}" loading="lazy" onerror="this.src='assets/logos/fav/icon-detailed.svg'">
        <div class="movie-poster-overlay">
            <h4 class="movie-card-title" title="${title}">${title}</h4>
            <div class="movie-card-meta">
                <span>${year}</span>
                <span class="movie-card-rating">★ ${rating}</span>
            </div>
        </div>
    `;

    card.addEventListener("click", onClick);
    card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
        }
    });

    return card;
}
