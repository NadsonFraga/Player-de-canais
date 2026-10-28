/**
 * TVZINHA ONLINE - Home Hub & Streaming Showcase Module
 * Coordinates the multi-universe hero carousel, category discovery tracks,
 * and quick-navigation portals for Movies, Series, Animes, and Live Channels.
 */

import { store } from '../core/state.js?v=20261028_1035';
import { escapeHtml, escapeAttr } from '../core/sanitize.js?v=20261028_1035';
import {
    TMDB_IMG_W500,
    TMDB_IMG_ORIGINAL,
    TMDB_CACHE_KEY,
    TMDB_SERIES_CACHE_KEY,
    TMDB_ANIMES_CACHE_KEY
} from '../core/constants.js?v=20261028_1035';
import { isBackgroundMediaAllowed } from '../core/activity.js?v=20261028_1035';
import { switchAppView } from '../navigation/router.js?v=20261028_1035';
import { fetchTmdbEndpoint } from './movies.js?v=20261028_1035';
import { fetchSeriesEndpoint } from './series.js?v=20261028_1035';
import { openTitle } from './titlePage.js?v=20261028_1035';
import { selectChannelByName } from './channels.js?v=20261028_1035';
import { getChannelLogoSrc, createLogoBadgeHtml, createChannelCardLogoHtml } from '../core/icons.js?v=20261028_1035';

const TMDB_GENRES = {
    28: "Ação", 12: "Aventura", 16: "Animação", 35: "Comédia", 80: "Crime",
    99: "Documentário", 18: "Drama", 10751: "Família", 14: "Fantasia",
    36: "História", 27: "Terror", 10402: "Música", 9648: "Mistério",
    10749: "Romance", 878: "Ficção Científica", 10770: "Cinema TV",
    53: "Thriller", 10752: "Guerra", 37: "Faroeste",
    10759: "Ação & Aventura", 10765: "Sci-Fi & Fantasia", 10768: "Guerra & Política"
};

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

/**
 * Returns a curated, diversified list of ~16 featured channels across all categories
 * (Open TV, Sports, Movies, Kids, Documentaries, News, 24h) avoiding repetitive siblings.
 */
function getFeaturedChannelsList() {
    const flat = getFlatChannelsList();
    if (flat.length === 0) return [];

    const CURATED_TARGETS = [
        "globo", "sbt", "band", "record", "cultura",
        "sportv", "espn", "caze", "premiere",
        "hbo", "megapix", "tnt", "space",
        "cartoon", "discovery kids", "nick",
        "discovery", "globonews", "multishow", "chaves"
    ];

    const selected = [];
    const usedNames = new Set();

    // 1. Pick primary matching channel for each curated target
    for (const target of CURATED_TARGETS) {
        const match = flat.find(ch => {
            const n = ch.name.toLowerCase();
            // Avoid secondary sibling channels (e.g. SporTV 2, Premiere 2) unless primary
            if (target === 'sportv' && (n.includes('sportv 2') || n.includes('sportv 3') || n.includes('sportv2') || n.includes('sportv3') || n.includes('sportv4'))) return false;
            if (target === 'premiere' && (n.includes('premiere 2') || n.includes('premiere 3') || n.includes('premiere 4') || n.includes('premiere 5') || n.includes('premiere club'))) return false;
            if (target === 'espn' && (n.includes('espn 2') || n.includes('espn 3') || n.includes('espn 4') || n.includes('espn 5') || n.includes('extra'))) return false;
            if (target === 'hbo' && (n.includes('hbo 2') || n.includes('hbo plus') || n.includes('family') || n.includes('signature') || n.includes('pop') || n.includes('mundi') || n.includes('xtreme'))) return false;
            return n.includes(target) && !usedNames.has(ch.name);
        });
        if (match) {
            selected.push(match);
            usedNames.add(match.name);
        }
    }

    // 2. If fewer than 14 channels matched, fill with other unique channels from diverse categories
    if (selected.length < 14) {
        for (const ch of flat) {
            if (!usedNames.has(ch.name)) {
                selected.push(ch);
                usedNames.add(ch.name);
                if (selected.length >= 16) break;
            }
        }
    }

    return selected;
}

// Curated high-fidelity fallback highlights (used while TMDB caches load in background)
const DEFAULT_HERO_HIGHLIGHTS = [
    {
        type: 'movie',
        id: 1022789,
        title: "Divertida Mente 2",
        categoryLabel: "Filmes",
        year: "2024",
        rating: "7.7",
        genres: ["Animação", "Família", "Aventura"],
        overview: "Na mente de Riley, recém-chegada à adolescência, a sala de controle sofre uma demolição para abrir espaço para novas e surpreendentes emoções.",
        backdropUrl: "https://image.tmdb.org/t/p/original/xg27NrXi7EgQxLQVIzGQZfrtlip.jpg",
        targetTab: "movies"
    },
    {
        type: 'series',
        id: 94605,
        title: "Arcane",
        categoryLabel: "Séries",
        year: "2021",
        rating: "8.8",
        genres: ["Animação", "Sci-Fi", "Ação"],
        overview: "Em meio ao conflito entre as cidades-gêmeas de Piltover e Zaun, duas irmãs lutam em lados opostos de uma guerra entre tecnologias mágicas e crenças incompatíveis.",
        backdropUrl: "https://image.tmdb.org/t/p/original/2wT5nF1gM3pA465t6Y345098k.jpg",
        targetTab: "series"
    },
    {
        type: 'anime',
        id: 37854,
        title: "One Piece",
        categoryLabel: "Animes",
        year: "1999",
        rating: "8.7",
        genres: ["Anime", "Ação", "Aventura"],
        overview: "Monkey D. Luffy e sua tripulação navegam pelos mares mais perigosos em busca do lendário tesouro supremo deixado por Gol D. Roger.",
        backdropUrl: "https://image.tmdb.org/t/p/original/4Mt7RSstvJtk5JouOwhKaMeYSTz.jpg",
        targetTab: "animes"
    },
    {
        type: 'channel',
        title: "SporTV HD",
        channelName: "SporTV",
        categoryLabel: "Ao Vivo",
        channelCategory: "Esportes",
        genres: ["Ao Vivo", "Esportes"],
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
                    year: (m.release_date || '').substring(0, 4) || 'Cinema',
                    rating: m.vote_average ? m.vote_average.toFixed(1) : '',
                    genres: (m.genre_ids || []).map(id => TMDB_GENRES[id]).filter(Boolean).slice(0, 3),
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
                    year: (s.first_air_date || '').substring(0, 4) || 'Série',
                    rating: s.vote_average ? s.vote_average.toFixed(1) : '',
                    genres: (s.genre_ids || []).map(id => TMDB_GENRES[id]).filter(Boolean).slice(0, 3),
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
            const trending = parsed?.data?.trending || [];
            // Exclude Doraemon (TMDB 65733) and entries without backdrop
            const candidates = trending.filter(a => a && a.backdrop_path && a.id !== 65733 && !/doraemon/i.test(a.name || ''));
            // Rank top candidates by strong audience engagement (votes) among top trending
            const a = candidates.slice(0, 8).sort((x, y) => (Number(y.vote_count) || 0) - (Number(x.vote_count) || 0))[0] || candidates[0];
            if (a && a.backdrop_path) {
                slides.push({
                    type: 'anime',
                    id: a.id,
                    title: a.name || a.title,
                    categoryLabel: "Animes",
                    categoryBadgeClass: "badge-magenta",
                    year: (a.first_air_date || '').substring(0, 4) || 'Anime',
                    rating: a.vote_average ? a.vote_average.toFixed(1) : '',
                    genres: (a.genre_ids || []).map(id => TMDB_GENRES[id]).filter(Boolean).slice(0, 3),
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
                channelCategory: featuredChannel.category || "TV",
                categoryBadgeClass: "badge-emerald",
                year: "Ao Vivo",
                rating: "",
                genres: [featuredChannel.category || "Ao Vivo"],
                overview: "Assista à programação ao vivo com alta estabilidade e players nativos sem interrupções.",
                backdropUrl: featuredChannel.logo || "assets/logos/fav/icon-detailed.svg",
                targetTab: "tv",
                raw: featuredChannel
            });
        }
    }

    homeHeroItems = slides.length >= 2 ? slides : DEFAULT_HERO_HIGHLIGHTS;

    // Concurrent pre-fetch clearlogos for all hero items
    homeHeroItems.forEach(item => {
        fetchSlideLogo(item);
    });

    setupHeroControls(homeHeroItems);
    showHeroSlide(0);
}

/**
 * Pre-fetches transparent PNG title clearlogos from TMDB
 */
function fetchSlideLogo(item) {
    if (!item || !item.id || item.type === 'channel' || item.logo_url || item.has_no_logo) return;

    const endpoint = item.type === 'movie'
        ? `movie/${item.id}/images?include_image_language=pt,en,null`
        : `tv/${item.id}/images?include_image_language=pt,ja,en,null`;

    const fetcher = item.type === 'movie' ? fetchTmdbEndpoint : fetchSeriesEndpoint;

    fetcher(endpoint).then(imgData => {
        if (imgData && imgData.logos && imgData.logos.length > 0) {
            const ptLogo = imgData.logos.find(l => l.iso_639_1 === 'pt');
            const jaLogo = item.type === 'anime' ? imgData.logos.find(l => l.iso_639_1 === 'ja') : null;
            const enLogo = imgData.logos.find(l => l.iso_639_1 === 'en');
            const chosenLogo = ptLogo || jaLogo || enLogo || imgData.logos[0];
            if (chosenLogo && chosenLogo.file_path) {
                const logoUrl = `${TMDB_IMG_W500}${chosenLogo.file_path}`;
                item.logo_url = logoUrl;
                const preImg = new Image();
                preImg.src = logoUrl;
                preImg.onload = () => {
                    item.logo_loaded = true;
                    if (homeHeroItems[currentHomeHeroIndex] && homeHeroItems[currentHomeHeroIndex].id === item.id) {
                        applyHeroLogo(item);
                    }
                };
                return;
            }
        }
        item.has_no_logo = true;
    }).catch(() => {
        item.has_no_logo = true;
    });
}

function applyHeroLogo(item) {
    const logoEl = document.getElementById("home-hero-title-logo");
    const titleEl = document.getElementById("home-hero-title");
    if (!logoEl || !titleEl) return;

    if (item.logo_url) {
        logoEl.src = item.logo_url;
        logoEl.alt = item.title;
        logoEl.classList.remove("hidden");
        titleEl.classList.add("hidden");
    } else {
        logoEl.classList.add("hidden");
        logoEl.src = "";
        titleEl.classList.remove("hidden");
        titleEl.textContent = item.title;
    }
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
    const yearEl = document.getElementById("home-hero-year");
    const ratingEl = document.getElementById("home-hero-rating");
    const genresEl = document.getElementById("home-hero-genres");
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

    // Apply transparent clearlogo or graceful fallback to text title
    applyHeroLogo(item);

    if (!item.logo_url && !item.has_no_logo && item.id && item.type !== 'channel') {
        fetchSlideLogo(item);
    }

    if (badgeEl) {
        badgeEl.className = "movies-hero-badge";
        badgeEl.innerHTML = `<span class="cinema-sparkle">✦</span> Destaque`;
    }

    if (yearEl) {
        yearEl.textContent = item.year || '';
        yearEl.style.display = item.year ? 'inline-block' : 'none';
    }

    if (ratingEl) {
        if (item.rating) {
            ratingEl.textContent = `★ ${item.rating}`;
            ratingEl.style.display = 'inline-block';
        } else {
            ratingEl.textContent = '';
            ratingEl.style.display = 'none';
        }
    }

    if (genresEl) {
        if (Array.isArray(item.genres) && item.genres.length > 0) {
            genresEl.innerHTML = item.genres.map(g => `<span class="movies-genre-tag">${escapeHtml(g)}</span>`).join('');
            genresEl.style.display = 'flex';
        } else {
            genresEl.innerHTML = '';
            genresEl.style.display = 'none';
        }
    }

    if (overviewEl) overviewEl.textContent = item.overview;

    if (btnWatch) {
        btnWatch.onclick = () => {
            if (item.type === 'movie' && item.raw) {
                openTitle('movie', item.raw);
            } else if ((item.type === 'series' || item.type === 'anime') && item.raw) {
                openTitle(item.type === 'anime' ? 'anime' : 'tv', item.raw);
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

    const channels = getFeaturedChannelsList();
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

        const logoHtml = createChannelCardLogoHtml(ch.name);

        card.innerHTML = `
            <div class="channel-card-glow"></div>
            <div class="channel-card-logo-box">
                ${logoHtml}
            </div>
            <div class="channel-card-bottom">
                <h4 class="channel-card-name">${escapeHtml(ch.name)}</h4>
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
                onClick: () => openTitle('movie', m)
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
                onClick: () => openTitle('tv', s)
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
                onClick: () => openTitle('anime', a)
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
        <img class="movie-poster-img" src="${escapeAttr(posterUrl)}" alt="${escapeAttr(title)}" loading="lazy" data-fallback-src="assets/logos/fav/icon-detailed.svg">
        <div class="movie-poster-overlay">
            <h4 class="movie-card-title" title="${escapeAttr(title)}">${escapeHtml(title)}</h4>
            <div class="movie-card-meta">
                <span>${escapeHtml(year)}</span>
                <span class="movie-card-rating">★ ${escapeHtml(rating)}</span>
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
