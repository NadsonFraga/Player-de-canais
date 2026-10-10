/**
 * TVZINHA ONLINE - Series & Animes Module (ESM)
 * Comprehensive TMDB Series and Animes Showcase, Discovery Filters,
 * Dual-Mode Episode Navigator (Seasons & Continuous Arcs), Watch History and Theater Player
 */

import { store } from '../core/state.js?v=20261010_1539';
import {
    TMDB_API_KEY,
    TMDB_BASE_URL,
    TMDB_IMG_W500,
    TMDB_IMG_ORIGINAL,
    TMDB_SERIES_CACHE_KEY,
    TMDB_ANIMES_CACHE_KEY,
    WATCH_PROGRESS_KEY,
    SERIES_SERVERS
} from '../core/constants.js?v=20261010_1539';
import { showToast } from '../core/toast.js?v=20261010_1539';
import { filteredSearchPage, inYearRange } from '../core/searchFilter.js?v=20261010_1539';
import { isBackgroundMediaAllowed } from '../core/activity.js?v=20261010_1539';
import { setPlaybackActiveState } from '../core/wakeLock.js?v=20261010_1539';
import { resumeStartTime } from '../core/resume.js?v=20261010_1539';
import { mountNativePlayer, resolveDirectStream, prefetchDirectStream, atomicPlayerReset, setLoaderText, leaveStageFullscreen } from '../player/engine.js?v=20261010_1539';
import { pushNavLayer, popNavLayer, runNavBatch } from '../navigation/historyManager.js?v=20261010_1539';

// --- TMDB Genres Dictionary ---
const TMDB_GENRES = {
    28: "Ação", 12: "Aventura", 16: "Animação", 35: "Comédia", 80: "Crime",
    99: "Documentário", 18: "Drama", 10751: "Família", 14: "Fantasia",
    36: "História", 27: "Terror", 10402: "Música", 9648: "Mistério",
    10749: "Romance", 878: "Ficção Científica", 10770: "Cinema TV",
    53: "Thriller", 10752: "Guerra", 37: "Faroeste",
    10759: "Ação & Aventura", 10765: "Sci-Fi & Fantasia", 10768: "Guerra & Política"
};

const TMDB_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// --- Module State ---
let isSeriesInitialized = false;
let isAnimesInitialized = false;
let isSeriesModalHandlersInitialized = false;

let heroSeriesList = [];
let currentHeroSeriesIndex = 0;
let heroSeriesAutoRotateTimer = null;

let heroAnimesList = [];
let currentHeroAnimesIndex = 0;
let heroAnimesAutoRotateTimer = null;

let activeSeriesFilterGenre = '';
let activeSeriesFilterYearRange = '';
let activeSeriesFilterSort = 'popularity.desc';
let seriesSearchDebounceTimer = null;

let activeAnimesFilterGenre = '';
let activeAnimesFilterYearRange = '';
let activeAnimesFilterSort = 'popularity.desc';
let animesSearchDebounceTimer = null;

let currentSelectedSeries = null;
let currentSeriesDetails = null;
const cachedSeasonsMap = {};

let activeSeriesPlaying = {
    show: null,
    seasonNumber: 1,
    episodeNumber: 1,
    episodeData: null,
    server: 'native_direct'
};

let seriesPlaybackSessionId = 0;
let pendingSeriesIframeTimer = null;
let pendingSeriesAutoplayTimer = null;

if (typeof window !== 'undefined') {
    window.addEventListener('tvzinha:teardownMedia', () => {
        seriesPlaybackSessionId++;
        if (pendingSeriesAutoplayTimer) {
            clearTimeout(pendingSeriesAutoplayTimer);
            pendingSeriesAutoplayTimer = null;
        }
        if (pendingSeriesIframeTimer) {
            clearTimeout(pendingSeriesIframeTimer);
            pendingSeriesIframeTimer = null;
        }
        removeSeriesIframe();
    });
}

function getOrCreateSeriesIframe() {
    let iframe = document.getElementById("series-modal-iframe");
    if (!iframe) {
        const stage = document.querySelector(".series-theater-stage");
        if (!stage) return null;
        iframe = document.createElement("iframe");
        iframe.id = "series-modal-iframe";
        iframe.className = "movie-modal-iframe series-theater-iframe";
        iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
        iframe.setAttribute("allowfullscreen", "");
        iframe.setAttribute("webkitallowfullscreen", "");
        iframe.setAttribute("mozallowfullscreen", "");
        iframe.setAttribute("referrerpolicy", "no-referrer");
        stage.appendChild(iframe);
    }
    return iframe;
}

function removeSeriesIframe() {
    const iframe = document.getElementById("series-modal-iframe");
    if (iframe) {
        iframe.src = "";
        iframe.remove();
    }
}

export function pauseHeroCarousels() {
    if (heroSeriesAutoRotateTimer) {
        clearInterval(heroSeriesAutoRotateTimer);
        heroSeriesAutoRotateTimer = null;
    }
    if (heroAnimesAutoRotateTimer) {
        clearInterval(heroAnimesAutoRotateTimer);
        heroAnimesAutoRotateTimer = null;
    }
}

// --- Watch Progress / History Helpers ---
export function getStoredWatchProgress() {
    try {
        const raw = localStorage.getItem(WATCH_PROGRESS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        return {};
    }
}

export function saveStoredWatchProgress(show, season, episode, epTitle, mediaType = 'tv', absolute = null) {
    try {
        const progress = getStoredWatchProgress();
        const previous = progress[show.id];
        progress[show.id] = {
            positions: (previous && previous.positions) || {},
            id: show.id,
            title: show.name || show.title,
            poster_path: show.poster_path,
            backdrop_path: show.backdrop_path,
            season: Number(season),
            episode: Number(episode),
            episodeTitle: epTitle || `Episódio ${episode}`,
            mediaType: mediaType,
            absolute: absolute ? Number(absolute) : null,
            timestamp: Date.now()
        };
        localStorage.setItem(WATCH_PROGRESS_KEY, JSON.stringify(progress));
        renderHomeContinueWatching();
    } catch (e) {
        console.warn("[Series] Falha ao salvar histórico de episódios:", e);
    }
}

// Where each started episode stopped, per show (native players only), newest kept
const EPISODE_POSITIONS_KEEP = 40;

function getSavedPosition(showId, season, episode) {
    const entry = getStoredWatchProgress()[showId];
    return entry && entry.positions ? entry.positions[`${season}:${episode}`] || null : null;
}

/** Saves the time of the episode on screen (called by the player every ~10 s, on pause and before it closes). */
function saveEpisodePosition(context, server, { position, duration, inEnding }) {
    try {
        const progress = getStoredWatchProgress();
        const entry = progress[context.tmdbId];
        if (!entry) return;
        const positions = entry.positions || {};
        positions[`${context.season}:${context.episode}`] = {
            position: Math.round(position),
            duration: Math.round(duration),
            // Stopped in the ending (or almost at the end): watched, it starts from the beginning next time
            finished: Boolean(inEnding) || (duration > 0 && position >= duration * 0.95),
            server,
            at: Date.now(),
        };
        const keys = Object.keys(positions).sort((a, b) => (positions[b].at || 0) - (positions[a].at || 0));
        keys.slice(EPISODE_POSITIONS_KEEP).forEach(key => delete positions[key]);
        entry.positions = positions;
        progress[context.tmdbId] = entry;
        localStorage.setItem(WATCH_PROGRESS_KEY, JSON.stringify(progress));
    } catch (e) {
        // Resume is optional
    }
}

export function renderHomeContinueWatching() {
    const section = document.getElementById("home-continue-watching-section");
    const track = document.getElementById("home-continue-watching-track");
    if (!section || !track) return;

    const progress = getStoredWatchProgress();
    const items = Object.values(progress).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    if (items.length === 0) {
        section.classList.add("hidden");
        track.innerHTML = "";
        return;
    }

    section.classList.remove("hidden");
    track.innerHTML = "";

    const fragment = document.createDocumentFragment();
    items.slice(0, 10).forEach(item => {
        const card = document.createElement("div");
        card.className = "continue-card";
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", `Continuar ${item.title} T${item.season}:E${item.episode}`);

        const imgUrl = item.backdrop_path
            ? `${TMDB_IMG_W500}${item.backdrop_path}`
            : (item.poster_path ? `${TMDB_IMG_W500}${item.poster_path}` : 'assets/logos/fav/icon-detailed.svg');

        card.innerHTML = `
            <div class="continue-card-media">
                <img src="${imgUrl}" alt="${item.title}" loading="lazy" onerror="this.src='assets/logos/fav/icon-detailed.svg'">
                <div class="continue-play-overlay">
                    <div class="continue-play-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                    </div>
                </div>
            </div>
            <div class="continue-card-info">
                <span class="continue-card-title">${item.title}</span>
                <span class="continue-card-ep">T${item.season}:E${item.episode} • ${item.episodeTitle || 'Episódio ' + item.episode}</span>
                <span class="continue-card-time">Retomar agora</span>
            </div>
        `;

        const resumeAction = () => {
            openSeriesModal({ id: item.id, name: item.title, poster_path: item.poster_path, backdrop_path: item.backdrop_path }, item.mediaType || 'tv', {
                autoPlaySeason: item.season,
                autoPlayEpisode: item.episode
            });
        };

        card.addEventListener("click", resumeAction);
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                resumeAction();
            }
        });

        fragment.appendChild(card);
    });

    track.appendChild(fragment);
}

// --- TMDB Fetch Helper ---
export async function fetchSeriesEndpoint(path) {
    const separator = path.includes('?') ? '&' : '?';
    const url = `${TMDB_BASE_URL}/${path}${separator}api_key=${TMDB_API_KEY}&language=pt-BR`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB Series error ${res.status}`);
    return await res.json();
}

function deduplicateFeedRows(sections) {
    const seenIds = new Set();
    const result = {};
    for (const [key, list] of Object.entries(sections)) {
        result[key] = [];
        for (const item of (list || [])) {
            if (item && item.id && !seenIds.has(item.id)) {
                seenIds.add(item.id);
                result[key].push(item);
            }
        }
    }
    return result;
}

function renderPaginationControls(containerId, currentPage, totalPages, totalResults, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!totalPages || totalPages <= 1) {
        container.innerHTML = "";
        container.classList.add("hidden");
        return;
    }

    container.classList.remove("hidden");
    const effectiveTotalPages = Math.min(totalPages, 500);

    const pageItems = [];
    if (effectiveTotalPages <= 7) {
        for (let i = 1; i <= effectiveTotalPages; i++) pageItems.push(i);
    } else {
        pageItems.push(1);
        if (currentPage > 3) pageItems.push('...');
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(effectiveTotalPages - 1, currentPage + 1);
        for (let i = start; i <= end; i++) pageItems.push(i);
        if (currentPage < effectiveTotalPages - 2) pageItems.push('...');
        pageItems.push(effectiveTotalPages);
    }

    const pagesHtml = pageItems.map(item => {
        if (item === '...') {
            return `<span class="pagination-ellipsis">…</span>`;
        }
        const isActive = item === currentPage;
        return `<button class="btn-page-number ${isActive ? 'active' : ''}" data-page="${item}" aria-label="Página ${item}" ${isActive ? 'aria-current="page"' : ''}>${item}</button>`;
    }).join('');

    const formattedTotal = totalResults ? totalResults.toLocaleString('pt-BR') : '';

    container.innerHTML = `
        <div class="pagination-info">
            Página <strong class="text-white">${currentPage}</strong> de <strong class="text-white">${effectiveTotalPages}</strong>
            ${formattedTotal ? `<span class="pagination-total">(${formattedTotal} títulos)</span>` : ''}
        </div>
        <div class="pagination-controls">
            <button class="btn-page-nav btn-page-prev" ${currentPage <= 1 ? 'disabled aria-disabled="true"' : ''} aria-label="Página anterior">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                <span>Anterior</span>
            </button>
            <div class="pagination-numbers">${pagesHtml}</div>
            <button class="btn-page-nav btn-page-next" ${currentPage >= effectiveTotalPages ? 'disabled aria-disabled="true"' : ''} aria-label="Próxima página">
                <span>Próxima</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
        </div>
    `;

    container.querySelectorAll(".btn-page-number").forEach(btn => {
        btn.addEventListener("click", () => {
            const p = parseInt(btn.dataset.page, 10);
            if (p && p !== currentPage && onPageChange) onPageChange(p);
        });
    });

    const prevBtn = container.querySelector(".btn-page-prev");
    const nextBtn = container.querySelector(".btn-page-next");
    if (prevBtn && currentPage > 1) {
        prevBtn.addEventListener("click", () => onPageChange && onPageChange(currentPage - 1));
    }
    if (nextBtn && currentPage < effectiveTotalPages) {
        nextBtn.addEventListener("click", () => onPageChange && onPageChange(currentPage + 1));
    }
}

// --- Card Creator Element ---
function createSeriesCardElement(seriesItem, mediaType = 'tv') {
    const card = document.createElement("div");
    card.className = "movie-poster-card";
    card.tabIndex = 0;
    card.dataset.seriesId = seriesItem.id;
    card.setAttribute("role", "button");

    const title = seriesItem.name || seriesItem.title || 'Título';
    const year = (seriesItem.first_air_date || seriesItem.release_date || '').substring(0, 4) || 'Série';
    const rating = seriesItem.vote_average ? seriesItem.vote_average.toFixed(1) : '-';

    card.setAttribute("aria-label", `${title} (${year})`);

    const posterUrl = seriesItem.poster_path
        ? `${TMDB_IMG_W500}${seriesItem.poster_path}`
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

    card.addEventListener("click", () => openSeriesModal(seriesItem, mediaType));
    card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openSeriesModal(seriesItem, mediaType);
        }
    });

    return card;
}

// ==========================================
// 1. SÉRIES SHOWCASE & DISCOVERY
// ==========================================

export async function initSeriesView() {
    if (isSeriesInitialized) return;
    isSeriesInitialized = true;

    setupSeriesToolbarAndNavigation();
    setupSeriesModalHandlers();

    try {
        const rawCache = localStorage.getItem(TMDB_SERIES_CACHE_KEY);
        if (rawCache) {
            const parsed = JSON.parse(rawCache);
            if (parsed && parsed.data && parsed.data.trending && parsed.data.trending.length > 0 && parsed.timestamp && (Date.now() - parsed.timestamp < TMDB_CACHE_TTL_MS)) {
                renderSeriesDiscoveryFeed(parsed.data);
                return;
            }
        }
    } catch (e) {
        console.warn("[Series] Falha ao ler cache:", e);
    }

    await loadSeriesFromTmdb();
}

export async function loadSeriesFromTmdb() {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const [trendingRes, releasesRes, dramaRes, scifiRes, comedyRes] = await Promise.allSettled([
            fetchSeriesEndpoint('discover/tv?without_genres=16,10767,10766,10763&sort_by=popularity.desc&vote_count.gte=30'),
            fetchSeriesEndpoint(`discover/tv?without_genres=16,10767,10766,10763&sort_by=first_air_date.desc&first_air_date.lte=${todayStr}&vote_count.gte=10`),
            fetchSeriesEndpoint('discover/tv?with_genres=18&without_genres=16,10767,10766,10763&sort_by=vote_average.desc&vote_count.gte=300'),
            fetchSeriesEndpoint('discover/tv?with_genres=10765&without_genres=16,10767,10766,10763&sort_by=popularity.desc'),
            fetchSeriesEndpoint('discover/tv?with_genres=35&without_genres=16,10767,10766,10763&sort_by=popularity.desc')
        ]);

        const filterReleased = (list) => (list || []).filter(s => {
            const d = s.first_air_date || s.release_date;
            return !d || d <= todayStr;
        });

        const seriesData = deduplicateFeedRows({
            trending: filterReleased(trendingRes.status === 'fulfilled' ? trendingRes.value.results : []),
            releases: filterReleased(releasesRes.status === 'fulfilled' ? releasesRes.value.results : []),
            drama: filterReleased(dramaRes.status === 'fulfilled' ? dramaRes.value.results : []),
            scifi: filterReleased(scifiRes.status === 'fulfilled' ? scifiRes.value.results : []),
            comedy: filterReleased(comedyRes.status === 'fulfilled' ? comedyRes.value.results : [])
        });

        localStorage.setItem(TMDB_SERIES_CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            data: seriesData
        }));

        renderSeriesDiscoveryFeed(seriesData);
    } catch (err) {
        console.error("[Series] Erro ao carregar dados do TMDB:", err);
    }
}

function renderSeriesDiscoveryFeed(data) {
    if (!data) return;

    // 1. Hero Showcase
    const candidates = (data.trending || []).filter(s => s.backdrop_path);
    heroSeriesList = candidates.length >= 3 ? candidates.slice(0, 5) : (data.trending || []).slice(0, 5);
    if (heroSeriesList.length > 0) {
        currentHeroSeriesIndex = 0;
        initHeroSeriesCarousel(heroSeriesList);
    }

    // 2. Render Real Tracks
    populateSeriesTrack('series-track-trending', data.trending, 'tv');
    populateSeriesTrack('series-track-releases', data.releases, 'tv');
    populateSeriesTrack('series-track-drama', data.drama, 'tv');
    populateSeriesTrack('series-track-scifi', data.scifi, 'tv');
    populateSeriesTrack('series-track-comedy', data.comedy, 'tv');
}

function populateSeriesTrack(trackId, items, mediaType = 'tv') {
    const track = document.getElementById(trackId);
    if (!track) return;
    track.innerHTML = "";
    if (!items || items.length === 0) {
        track.innerHTML = `<p style="color:#71717a; font-size:0.82rem; padding:10px;">Nenhum título disponível no momento.</p>`;
        return;
    }
    const fragment = document.createDocumentFragment();
    items.forEach(item => fragment.appendChild(createSeriesCardElement(item, mediaType)));
    track.appendChild(fragment);
}

function initHeroSeriesCarousel(seriesItems) {
    const dotsContainer = document.getElementById("series-hero-dots");
    const btnPrev = document.getElementById("btn-series-hero-prev");
    const btnNext = document.getElementById("btn-series-hero-next");
    const heroSection = document.getElementById("series-hero");

    // Pre-fetch clearlogos
    seriesItems.forEach(item => {
        if (item.backdrop_path) {
            const preBackdrop = new Image();
            preBackdrop.src = `${TMDB_IMG_ORIGINAL}${item.backdrop_path}`;
        }

        if (!item.logo_url && !item.has_no_logo) {
            fetchSeriesEndpoint(`tv/${item.id}/images?include_image_language=pt,en,null`).then(imgData => {
                if (imgData && imgData.logos && imgData.logos.length > 0) {
                    const ptLogo = imgData.logos.find(l => l.iso_639_1 === 'pt');
                    const enLogo = imgData.logos.find(l => l.iso_639_1 === 'en');
                    const chosenLogo = ptLogo || enLogo || imgData.logos[0];
                    if (chosenLogo && chosenLogo.file_path) {
                        const logoUrl = `${TMDB_IMG_W500}${chosenLogo.file_path}`;
                        item.logo_url = logoUrl;
                        const preImg = new Image();
                        preImg.src = logoUrl;
                        preImg.onload = () => {
                            item.logo_loaded = true;
                            if (heroSeriesList[currentHeroSeriesIndex] && heroSeriesList[currentHeroSeriesIndex].id === item.id) {
                                const logoEl = document.getElementById("series-hero-title-logo");
                                const titleEl = document.getElementById("series-hero-title");
                                if (logoEl && titleEl) {
                                    logoEl.src = item.logo_url;
                                    logoEl.classList.remove("hidden");
                                    titleEl.classList.add("hidden");
                                }
                            }
                        };
                    } else {
                        item.has_no_logo = true;
                    }
                } else {
                    item.has_no_logo = true;
                }
            }).catch(() => {
                item.has_no_logo = true;
            });
        }
    });

    if (dotsContainer) {
        dotsContainer.innerHTML = "";
        seriesItems.forEach((_, idx) => {
            const dot = document.createElement("button");
            dot.className = `hero-dot ${idx === 0 ? 'active' : ''}`;
            dot.setAttribute("aria-label", `Destaque ${idx + 1}`);
            dot.addEventListener("click", () => showHeroSeriesSlide(idx));
            dotsContainer.appendChild(dot);
        });
    }

    function showHeroSeriesSlide(index) {
        currentHeroSeriesIndex = (index + seriesItems.length) % seriesItems.length;
        const item = seriesItems[currentHeroSeriesIndex];
        if (!item) return;

        const backdropImg = document.getElementById("series-hero-backdrop");
        const titleEl = document.getElementById("series-hero-title");
        const logoEl = document.getElementById("series-hero-title-logo");
        const yearEl = document.getElementById("series-hero-year");
        const ratingEl = document.getElementById("series-hero-rating");
        const genresEl = document.getElementById("series-hero-genres");
        const overviewEl = document.getElementById("series-hero-overview");
        const btnWatch = document.getElementById("btn-series-hero-watch");

        if (backdropImg && item.backdrop_path) {
            backdropImg.src = `${TMDB_IMG_ORIGINAL}${item.backdrop_path}`;
        }

        if (item.logo_url) {
            if (logoEl) {
                logoEl.src = item.logo_url;
                logoEl.classList.remove("hidden");
            }
            if (titleEl) {
                titleEl.classList.add("hidden");
                titleEl.textContent = item.name || item.title || "Série em Destaque";
            }
        } else if (item.has_no_logo) {
            if (logoEl) {
                logoEl.classList.add("hidden");
                logoEl.src = "";
            }
            if (titleEl) {
                titleEl.classList.remove("hidden");
                titleEl.textContent = item.name || item.title || "Série em Destaque";
            }
        } else {
            if (logoEl) {
                logoEl.classList.add("hidden");
                logoEl.src = "";
            }
            if (titleEl) {
                titleEl.classList.remove("hidden");
                titleEl.textContent = item.name || item.title || "Série em Destaque";
            }
        }

        if (yearEl) yearEl.textContent = (item.first_air_date || item.release_date || '').substring(0, 4) || 'Série';
        if (ratingEl) ratingEl.textContent = `★ ${item.vote_average ? item.vote_average.toFixed(1) : '8.0'}`;
        if (overviewEl) overviewEl.textContent = item.overview || "Sinopse não disponível em português.";

        if (genresEl && item.genre_ids) {
            genresEl.innerHTML = item.genre_ids.slice(0, 2).map(id =>
                `<span class="movies-genre-tag">${TMDB_GENRES[id] || 'Série'}</span>`
            ).join('');
        }

        if (btnWatch) {
            btnWatch.onclick = () => openSeriesModal(item, 'tv');
        }

        if (dotsContainer) {
            dotsContainer.querySelectorAll(".hero-dot").forEach((dot, idx) => {
                dot.classList.toggle("active", idx === currentHeroSeriesIndex);
            });
        }
    }

    if (btnPrev) btnPrev.onclick = () => showHeroSeriesSlide(currentHeroSeriesIndex - 1);
    if (btnNext) btnNext.onclick = () => showHeroSeriesSlide(currentHeroSeriesIndex + 1);

    clearInterval(heroSeriesAutoRotateTimer);
    heroSeriesAutoRotateTimer = setInterval(() => {
        if (!isBackgroundMediaAllowed('series')) return;
        showHeroSeriesSlide(currentHeroSeriesIndex + 1);
    }, 7000);

    if (heroSection) {
        heroSection.onmouseenter = () => clearInterval(heroSeriesAutoRotateTimer);
        heroSection.onmouseleave = () => {
            clearInterval(heroSeriesAutoRotateTimer);
            heroSeriesAutoRotateTimer = setInterval(() => {
                if (!isBackgroundMediaAllowed('series')) return;
                showHeroSeriesSlide(currentHeroSeriesIndex + 1);
            }, 7000);
        };
    }

    showHeroSeriesSlide(0);
}

function openSeriesExploreView(autoFocus = false) {
    const seriesExploreView = document.getElementById("series-explore-view");
    const seriesDiscoveryFeed = document.getElementById("series-discovery-feed");
    const exploreSearchInput = document.getElementById("series-explore-search-input");
    const seriesSearchInput = document.getElementById("series-search-input");
    const btnClear = document.getElementById("btn-clear-series-explore-search");

    if (seriesDiscoveryFeed) seriesDiscoveryFeed.classList.add("hidden");
    const wasHidden = seriesExploreView && seriesExploreView.classList.contains("hidden");
    if (seriesExploreView) seriesExploreView.classList.remove("hidden");
    if (wasHidden) {
        pushNavLayer('explore-series');
    }

    const initialQuery = seriesSearchInput ? seriesSearchInput.value.trim() : '';
    if (exploreSearchInput) {
        exploreSearchInput.value = initialQuery;
        if (btnClear) btnClear.classList.toggle("hidden", initialQuery.length === 0);
        if (autoFocus) {
            setTimeout(() => exploreSearchInput.focus(), 120);
        }
    }

    executeFilteredSeriesSearch(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeSeriesExploreView() {
    resetSeriesViewState();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function resetSeriesViewState() {
    const seriesExploreView = document.getElementById("series-explore-view");
    const seriesDiscoveryFeed = document.getElementById("series-discovery-feed");
    const seriesSearchInput = document.getElementById("series-search-input");
    const exploreSearchInput = document.getElementById("series-explore-search-input");
    const btnClearSeriesSearch = document.getElementById("btn-clear-series-search");
    const btnClearExplore = document.getElementById("btn-clear-series-explore-search");
    const categoryPills = document.getElementById("series-category-pills");
    const genresChips = document.getElementById("series-explore-genres-chips");
    const timelineChips = document.getElementById("series-explore-timeline-chips");
    const sortLabel = document.getElementById("series-sort-current-label");
    const sortMenu = document.getElementById("series-explore-sort-dropdown-menu");
    const btnSort = document.getElementById("btn-series-explore-sort-dropdown");

    const wasOpen = seriesExploreView && !seriesExploreView.classList.contains("hidden");
    if (seriesExploreView) seriesExploreView.classList.add("hidden");
    if (seriesDiscoveryFeed) seriesDiscoveryFeed.classList.remove("hidden");
    if (wasOpen) {
        popNavLayer();
    }

    if (seriesSearchInput) seriesSearchInput.value = "";
    if (exploreSearchInput) exploreSearchInput.value = "";
    const quickEpInput = document.getElementById("series-quick-ep-search");
    if (quickEpInput) quickEpInput.value = "";
    if (btnClearSeriesSearch) btnClearSeriesSearch.classList.add("hidden");
    if (btnClearExplore) btnClearExplore.classList.add("hidden");

    activeSeriesFilterGenre = '';
    activeSeriesFilterYearRange = '';
    activeSeriesFilterSort = 'popularity.desc';

    if (sortLabel) sortLabel.textContent = "Populares";
    if (sortMenu) {
        sortMenu.classList.add("hidden");
        sortMenu.querySelectorAll(".sort-dropdown-item").forEach(it => {
            it.classList.toggle("active", it.dataset.sort === 'popularity.desc');
        });
    }
    if (btnSort) btnSort.setAttribute("aria-expanded", "false");

    if (genresChips) {
        genresChips.querySelectorAll(".explore-chip").forEach(c => c.classList.toggle("active", c.dataset.genre === ""));
    }
    if (timelineChips) {
        timelineChips.querySelectorAll(".explore-chip").forEach(c => c.classList.toggle("active", c.dataset.yearRange === ""));
    }
    if (categoryPills) {
        categoryPills.querySelectorAll(".series-pill").forEach(p => p.classList.toggle("active", p.dataset.target === "all"));
    }
}

function setupSeriesToolbarAndNavigation() {
    const categoryPills = document.getElementById("series-category-pills");
    const searchInput = document.getElementById("series-search-input");
    const searchContainer = document.getElementById("series-search-container");
    const btnClear = document.getElementById("btn-clear-series-search");

    if (categoryPills) {
        categoryPills.addEventListener("click", (e) => {
            const pill = e.target.closest(".series-pill");
            if (!pill) return;
            categoryPills.querySelectorAll(".series-pill").forEach(p => p.classList.remove("active"));
            pill.classList.add("active");

            const target = pill.dataset.target;
            if (target === "all") {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const targetEl = document.getElementById(target);
                if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }

    document.querySelectorAll("#view-series .btn-carousel-arrow").forEach(btn => {
        btn.addEventListener("click", () => {
            const trackId = btn.getAttribute("data-track");
            const track = document.getElementById(trackId);
            if (!track) return;
            const isNext = btn.classList.contains("btn-next");
            const scrollAmount = track.clientWidth * 0.75;
            track.scrollBy({ left: isNext ? scrollAmount : -scrollAmount, behavior: 'smooth' });
        });
    });

    if (searchInput) {
        searchInput.addEventListener("focus", () => openSeriesExploreView(true));
        searchInput.addEventListener("input", () => openSeriesExploreView(false));
    }

    if (searchContainer) {
        searchContainer.addEventListener("click", (e) => {
            if (e.target.closest("#btn-clear-series-search")) return;
            openSeriesExploreView(true);
        });
    }

    if (btnClear) {
        btnClear.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            btnClear.classList.add("hidden");
        });
    }

    setupSeriesExploreModule();
}

function setupSeriesExploreModule() {
    const btnBack = document.getElementById("btn-series-explore-back");
    const exploreSearchInput = document.getElementById("series-explore-search-input");
    const btnClearExplore = document.getElementById("btn-clear-series-explore-search");
    const btnSort = document.getElementById("btn-series-explore-sort-dropdown");
    const sortMenu = document.getElementById("series-explore-sort-dropdown-menu");
    const sortLabel = document.getElementById("series-sort-current-label");
    const genresChips = document.getElementById("series-explore-genres-chips");
    const timelineChips = document.getElementById("series-explore-timeline-chips");

    if (btnBack) btnBack.addEventListener("click", closeSeriesExploreView);

    if (btnSort && sortMenu) {
        btnSort.addEventListener("click", (e) => {
            e.stopPropagation();
            const isExpanded = !sortMenu.classList.contains("hidden");
            sortMenu.classList.toggle("hidden", isExpanded);
            btnSort.setAttribute("aria-expanded", String(!isExpanded));
        });

        document.addEventListener("click", (e) => {
            if (!sortMenu.contains(e.target) && !btnSort.contains(e.target)) {
                sortMenu.classList.add("hidden");
                btnSort.setAttribute("aria-expanded", "false");
            }
        });

        sortMenu.querySelectorAll(".sort-dropdown-item").forEach(item => {
            item.addEventListener("click", (e) => {
                e.stopPropagation();
                sortMenu.querySelectorAll(".sort-dropdown-item").forEach(it => it.classList.remove("active"));
                item.classList.add("active");
                activeSeriesFilterSort = item.dataset.sort || 'popularity.desc';
                if (sortLabel) {
                    const rawText = item.querySelector(".sort-item-text")?.textContent || "Populares";
                    sortLabel.textContent = rawText.replace("Mais ", "").replace("Melhor ", "");
                }
                sortMenu.classList.add("hidden");
                btnSort.setAttribute("aria-expanded", "false");
                executeFilteredSeriesSearch(1);
            });
        });
    }

    if (genresChips) {
        genresChips.addEventListener("click", (e) => {
            const chip = e.target.closest(".explore-chip");
            if (!chip) return;
            genresChips.querySelectorAll(".explore-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            activeSeriesFilterGenre = chip.dataset.genre || '';
            executeFilteredSeriesSearch(1);
        });
    }

    if (timelineChips) {
        timelineChips.addEventListener("click", (e) => {
            const chip = e.target.closest(".explore-chip");
            if (!chip) return;
            timelineChips.querySelectorAll(".explore-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            activeSeriesFilterYearRange = chip.dataset.yearRange || '';
            executeFilteredSeriesSearch(1);
        });
    }

    if (exploreSearchInput) {
        exploreSearchInput.addEventListener("input", () => {
            const val = exploreSearchInput.value.trim();
            if (btnClearExplore) btnClearExplore.classList.toggle("hidden", val.length === 0);
            clearTimeout(seriesSearchDebounceTimer);
            seriesSearchDebounceTimer = setTimeout(() => {
                executeFilteredSeriesSearch(1);
            }, 320);
        });

        if (btnClearExplore) {
            btnClearExplore.addEventListener("click", () => {
                exploreSearchInput.value = "";
                btnClearExplore.classList.add("hidden");
                exploreSearchInput.focus();
                executeFilteredSeriesSearch(1);
            });
        }
    }
}

function updateActiveSeriesFilterTags() {
    const container = document.getElementById("series-explore-active-tags");
    const genresChips = document.getElementById("series-explore-genres-chips");
    const timelineChips = document.getElementById("series-explore-timeline-chips");
    if (!container) return;

    const tags = [];
    if (activeSeriesFilterGenre) {
        const genreName = TMDB_GENRES[activeSeriesFilterGenre] || "Gênero";
        tags.push({
            label: genreName,
            onRemove: () => {
                activeSeriesFilterGenre = '';
                if (genresChips) {
                    genresChips.querySelectorAll(".explore-chip").forEach(c => c.classList.toggle("active", c.dataset.genre === ""));
                }
                executeFilteredSeriesSearch(1);
            }
        });
    }

    if (activeSeriesFilterYearRange) {
        tags.push({
            label: activeSeriesFilterYearRange,
            onRemove: () => {
                activeSeriesFilterYearRange = '';
                if (timelineChips) {
                    timelineChips.querySelectorAll(".explore-chip").forEach(c => c.classList.toggle("active", c.dataset.yearRange === ""));
                }
                executeFilteredSeriesSearch(1);
            }
        });
    }

    container.innerHTML = "";
    tags.forEach(t => {
        const tag = document.createElement("span");
        tag.className = "explore-active-tag";
        tag.innerHTML = `<span>${t.label}</span><button type="button" aria-label="Remover filtro">&times;</button>`;
        tag.querySelector("button").onclick = t.onRemove;
        container.appendChild(tag);
    });
}

async function executeFilteredSeriesSearch(page = 1) {
    const exploreView = document.getElementById("series-explore-view");
    const posterGrid = document.getElementById("series-explore-poster-grid");
    const sectionTitle = document.getElementById("series-explore-section-title");
    const resultsCount = document.getElementById("series-explore-results-count");
    const searchInput = document.getElementById("series-explore-search-input");
    const query = searchInput ? searchInput.value.trim() : '';

    if (!exploreView || exploreView.classList.contains("hidden")) return;
    if (!posterGrid) return;

    posterGrid.innerHTML = `
        <div class="explore-loading-placeholder" style="grid-column: 1/-1; padding: 40px; text-align: center; color: #a1a1aa;">
            <div class="spinner" style="margin: 0 auto 12px;"></div>
            <span>Pesquisando séries...</span>
        </div>
    `;

    updateActiveSeriesFilterTags();

    try {
        let endpoint = '';
        if (query) {
            endpoint = `search/tv?query=${encodeURIComponent(query)}&page=${page}`;
            if (sectionTitle) sectionTitle.textContent = `Resultados para "${query}"`;
        } else {
            let params = [`page=${page}`, `sort_by=${activeSeriesFilterSort}`];
            if (activeSeriesFilterGenre) params.push(`with_genres=${activeSeriesFilterGenre}`);
            if (activeSeriesFilterYearRange) {
                const parts = activeSeriesFilterYearRange.split('-');
                if (parts.length === 2) {
                    params.push(`first_air_date.gte=${parts[0]}-01-01`);
                    params.push(`first_air_date.lte=${parts[1]}-12-31`);
                }
            }
            params.push('without_genres=16'); // Exclude animation from standard series explore
            endpoint = `discover/tv?${params.join('&')}`;
            if (sectionTitle) sectionTitle.textContent = "Catálogo de Séries";
        }

        // Text + filter: TMDB's search ignores the filters, so they are applied over the first search pages
        const filterWithText = query && (activeSeriesFilterGenre || activeSeriesFilterYearRange || activeSeriesFilterSort !== 'popularity.desc');
        const data = filterWithText
            ? await filteredSearchPage({
                key: `tv|${query}|${activeSeriesFilterGenre}|${activeSeriesFilterYearRange}|${activeSeriesFilterSort}`,
                fetchPage: n => fetchSeriesEndpoint(`search/tv?query=${encodeURIComponent(query)}&page=${n}`),
                keep: item => !(item.genre_ids || []).includes(16)
                    && (!activeSeriesFilterGenre || (item.genre_ids || []).includes(Number(activeSeriesFilterGenre)))
                    && inYearRange(item.first_air_date, activeSeriesFilterYearRange),
                sort: activeSeriesFilterSort,
                dateField: 'first_air_date',
                page,
            })
            : await fetchSeriesEndpoint(endpoint);
        let results = data.results || [];

        // Exclude animation (genre 16) from series search when text query is used
        if (query) {
            results = results.filter(item => !(item.genre_ids && item.genre_ids.includes(16)));
        }

        posterGrid.innerHTML = "";

        if (resultsCount) {
            const count = query && !data.filtered ? results.length : (data.total_results || 0);
            resultsCount.textContent = `${count.toLocaleString('pt-BR')} ${count === 1 ? 'série encontrada' : 'séries encontradas'}`;
        }

        if (results.length === 0) {
            posterGrid.innerHTML = `
                <div class="explore-empty-state" style="grid-column: 1/-1; padding: 60px 20px; text-align: center; color: #71717a;">
                    <p style="font-size: 1.1rem; font-weight: 500; color: #e4e4e7; margin-bottom: 8px;">Nenhuma série encontrada</p>
                    <p style="font-size: 0.9rem;">Tente buscar com outros termos ou remover alguns filtros aplicados.</p>
                </div>
            `;
            renderPaginationControls("series-explore-pagination", 1, 0, 0, null);
            return;
        }

        const fragment = document.createDocumentFragment();
        results.forEach(seriesItem => fragment.appendChild(createSeriesCardElement(seriesItem, 'tv')));
        posterGrid.appendChild(fragment);

        renderPaginationControls("series-explore-pagination", page, data.total_pages || 1, data.total_results || 0, (newPage) => {
            executeFilteredSeriesSearch(newPage);
            const gridEl = document.getElementById("series-explore-poster-grid");
            if (gridEl) gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    } catch (err) {
        console.error("[Series] Erro ao filtrar séries:", err);
        posterGrid.innerHTML = `<p style="color:#ef4444; grid-column: 1/-1; padding: 20px; text-align:center;">Erro ao carregar séries do catálogo.</p>`;
    }
}

// ==========================================
// 2. ANIMES SHOWCASE & DISCOVERY
// ==========================================

export async function initAnimesView() {
    if (isAnimesInitialized) return;
    isAnimesInitialized = true;

    setupAnimesToolbarAndNavigation();
    setupSeriesModalHandlers();

    try {
        const rawCache = localStorage.getItem(TMDB_ANIMES_CACHE_KEY);
        if (rawCache) {
            const parsed = JSON.parse(rawCache);
            if (parsed && parsed.data && parsed.data.trending && parsed.data.trending.length > 0 && parsed.timestamp && (Date.now() - parsed.timestamp < TMDB_CACHE_TTL_MS)) {
                renderAnimesDiscoveryFeed(parsed.data);
                return;
            }
        }
    } catch (e) {
        console.warn("[Animes] Falha ao ler cache:", e);
    }

    await loadAnimesFromTmdb();
}

export async function loadAnimesFromTmdb() {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const [trendingRes, shonenRes, isekaiRes, classicsRes, releasesRes] = await Promise.allSettled([
            fetchSeriesEndpoint('discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc&vote_count.gte=30&without_keywords=256466,157145'),
            fetchSeriesEndpoint('discover/tv?with_genres=16,10759&without_genres=10762&with_original_language=ja&sort_by=popularity.desc&without_keywords=256466,157145'),
            fetchSeriesEndpoint('discover/tv?with_genres=16,10765&without_genres=10762&with_original_language=ja&sort_by=popularity.desc&without_keywords=256466,157145'),
            fetchSeriesEndpoint('discover/tv?with_genres=16&with_original_language=ja&first_air_date.lte=2010-12-31&vote_count.gte=200&sort_by=vote_average.desc&without_keywords=256466,157145'),
            fetchSeriesEndpoint(`discover/tv?with_genres=16&with_original_language=ja&sort_by=first_air_date.desc&first_air_date.lte=${todayStr}&vote_count.gte=5&without_keywords=256466,157145`)
        ]);

        const filterReleased = (list) => (list || []).filter(s => {
            const d = s.first_air_date || s.release_date;
            return !d || d <= todayStr;
        });

        const animesData = deduplicateFeedRows({
            trending: filterReleased(trendingRes.status === 'fulfilled' ? trendingRes.value.results : []),
            shonen: filterReleased(shonenRes.status === 'fulfilled' ? shonenRes.value.results : []),
            isekai: filterReleased(isekaiRes.status === 'fulfilled' ? isekaiRes.value.results : []),
            classics: filterReleased(classicsRes.status === 'fulfilled' ? classicsRes.value.results : []),
            releases: filterReleased(releasesRes.status === 'fulfilled' ? releasesRes.value.results : [])
        });

        localStorage.setItem(TMDB_ANIMES_CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            data: animesData
        }));

        renderAnimesDiscoveryFeed(animesData);
    } catch (err) {
        console.error("[Animes] Erro ao carregar dados do TMDB:", err);
    }
}

function renderAnimesDiscoveryFeed(data) {
    if (!data) return;

    // 1. Hero Showcase
    const candidates = (data.trending || []).filter(a => a.backdrop_path);
    heroAnimesList = candidates.length >= 3 ? candidates.slice(0, 5) : (data.trending || []).slice(0, 5);
    if (heroAnimesList.length > 0) {
        currentHeroAnimesIndex = 0;
        initHeroAnimesCarousel(heroAnimesList);
    }

    // 2. Render Real Tracks
    populateSeriesTrack('animes-track-trending', data.trending, 'anime');
    populateSeriesTrack('animes-track-shonen', data.shonen, 'anime');
    populateSeriesTrack('animes-track-isekai', data.isekai, 'anime');
    populateSeriesTrack('animes-track-classics', data.classics, 'anime');
    populateSeriesTrack('animes-track-releases', data.releases, 'anime');
}

function initHeroAnimesCarousel(animeItems) {
    const dotsContainer = document.getElementById("animes-hero-dots");
    const btnPrev = document.getElementById("btn-animes-hero-prev");
    const btnNext = document.getElementById("btn-animes-hero-next");
    const heroSection = document.getElementById("animes-hero");

    animeItems.forEach(item => {
        if (item.backdrop_path) {
            const preBackdrop = new Image();
            preBackdrop.src = `${TMDB_IMG_ORIGINAL}${item.backdrop_path}`;
        }

        if (!item.logo_url && !item.has_no_logo) {
            fetchSeriesEndpoint(`tv/${item.id}/images?include_image_language=pt,ja,en,null`).then(imgData => {
                if (imgData && imgData.logos && imgData.logos.length > 0) {
                    const ptLogo = imgData.logos.find(l => l.iso_639_1 === 'pt');
                    const jaLogo = imgData.logos.find(l => l.iso_639_1 === 'ja');
                    const enLogo = imgData.logos.find(l => l.iso_639_1 === 'en');
                    const chosenLogo = ptLogo || jaLogo || enLogo || imgData.logos[0];
                    if (chosenLogo && chosenLogo.file_path) {
                        const logoUrl = `${TMDB_IMG_W500}${chosenLogo.file_path}`;
                        item.logo_url = logoUrl;
                        const preImg = new Image();
                        preImg.src = logoUrl;
                        preImg.onload = () => {
                            item.logo_loaded = true;
                            if (heroAnimesList[currentHeroAnimesIndex] && heroAnimesList[currentHeroAnimesIndex].id === item.id) {
                                const logoEl = document.getElementById("animes-hero-title-logo");
                                const titleEl = document.getElementById("animes-hero-title");
                                if (logoEl && titleEl) {
                                    logoEl.src = item.logo_url;
                                    logoEl.classList.remove("hidden");
                                    titleEl.classList.add("hidden");
                                }
                            }
                        };
                    } else {
                        item.has_no_logo = true;
                    }
                } else {
                    item.has_no_logo = true;
                }
            }).catch(() => {
                item.has_no_logo = true;
            });
        }
    });

    if (dotsContainer) {
        dotsContainer.innerHTML = "";
        animeItems.forEach((_, idx) => {
            const dot = document.createElement("button");
            dot.className = `hero-dot anime-hero-dot ${idx === 0 ? 'active' : ''}`;
            dot.setAttribute("aria-label", `Destaque ${idx + 1}`);
            dot.addEventListener("click", () => showHeroAnimesSlide(idx));
            dotsContainer.appendChild(dot);
        });
    }

    function showHeroAnimesSlide(index) {
        currentHeroAnimesIndex = (index + animeItems.length) % animeItems.length;
        const item = animeItems[currentHeroAnimesIndex];
        if (!item) return;

        const backdropImg = document.getElementById("animes-hero-backdrop");
        const titleEl = document.getElementById("animes-hero-title");
        const logoEl = document.getElementById("animes-hero-title-logo");
        const yearEl = document.getElementById("animes-hero-year");
        const ratingEl = document.getElementById("animes-hero-rating");
        const genresEl = document.getElementById("animes-hero-genres");
        const overviewEl = document.getElementById("animes-hero-overview");
        const btnWatch = document.getElementById("btn-animes-hero-watch");

        if (backdropImg && item.backdrop_path) {
            backdropImg.src = `${TMDB_IMG_ORIGINAL}${item.backdrop_path}`;
        }

        if (item.logo_url) {
            if (logoEl) {
                logoEl.src = item.logo_url;
                logoEl.classList.remove("hidden");
            }
            if (titleEl) {
                titleEl.classList.add("hidden");
                titleEl.textContent = item.name || item.title || "Anime em Destaque";
            }
        } else if (item.has_no_logo) {
            if (logoEl) {
                logoEl.classList.add("hidden");
                logoEl.src = "";
            }
            if (titleEl) {
                titleEl.classList.remove("hidden");
                titleEl.textContent = item.name || item.title || "Anime em Destaque";
            }
        } else {
            if (logoEl) {
                logoEl.classList.add("hidden");
                logoEl.src = "";
            }
            if (titleEl) {
                titleEl.classList.remove("hidden");
                titleEl.textContent = item.name || item.title || "Anime em Destaque";
            }
        }

        if (yearEl) yearEl.textContent = (item.first_air_date || item.release_date || '').substring(0, 4) || 'Anime';
        if (ratingEl) ratingEl.textContent = `★ ${item.vote_average ? item.vote_average.toFixed(1) : '8.5'}`;
        if (overviewEl) overviewEl.textContent = item.overview || "Sinopse não disponível em português.";

        if (genresEl && item.genre_ids) {
            genresEl.innerHTML = item.genre_ids.slice(0, 2).map(id =>
                `<span class="movies-genre-tag anime-genre-tag">${TMDB_GENRES[id] || 'Anime'}</span>`
            ).join('');
        }

        if (btnWatch) {
            btnWatch.onclick = () => openSeriesModal(item, 'anime');
        }

        if (dotsContainer) {
            dotsContainer.querySelectorAll(".hero-dot").forEach((dot, idx) => {
                dot.classList.toggle("active", idx === currentHeroAnimesIndex);
            });
        }
    }

    if (btnPrev) btnPrev.onclick = () => showHeroAnimesSlide(currentHeroAnimesIndex - 1);
    if (btnNext) btnNext.onclick = () => showHeroAnimesSlide(currentHeroAnimesIndex + 1);

    clearInterval(heroAnimesAutoRotateTimer);
    heroAnimesAutoRotateTimer = setInterval(() => {
        if (!isBackgroundMediaAllowed('animes')) return;
        showHeroAnimesSlide(currentHeroAnimesIndex + 1);
    }, 7000);

    if (heroSection) {
        heroSection.onmouseenter = () => clearInterval(heroAnimesAutoRotateTimer);
        heroSection.onmouseleave = () => {
            clearInterval(heroAnimesAutoRotateTimer);
            heroAnimesAutoRotateTimer = setInterval(() => {
                if (!isBackgroundMediaAllowed('animes')) return;
                showHeroAnimesSlide(currentHeroAnimesIndex + 1);
            }, 7000);
        };
    }

    showHeroAnimesSlide(0);
}

function openAnimesExploreView(autoFocus = false) {
    const animesExploreView = document.getElementById("animes-explore-view");
    const animesDiscoveryFeed = document.getElementById("animes-discovery-feed");
    const exploreSearchInput = document.getElementById("animes-explore-search-input");
    const animesSearchInput = document.getElementById("animes-search-input");
    const btnClear = document.getElementById("btn-clear-animes-explore-search");

    if (animesDiscoveryFeed) animesDiscoveryFeed.classList.add("hidden");
    const wasHidden = animesExploreView && animesExploreView.classList.contains("hidden");
    if (animesExploreView) animesExploreView.classList.remove("hidden");
    if (wasHidden) {
        pushNavLayer('explore-animes');
    }

    const initialQuery = animesSearchInput ? animesSearchInput.value.trim() : '';
    if (exploreSearchInput) {
        exploreSearchInput.value = initialQuery;
        if (btnClear) btnClear.classList.toggle("hidden", initialQuery.length === 0);
        if (autoFocus) {
            setTimeout(() => exploreSearchInput.focus(), 120);
        }
    }

    executeFilteredAnimesSearch(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeAnimesExploreView() {
    resetAnimesViewState();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function resetAnimesViewState() {
    const animesExploreView = document.getElementById("animes-explore-view");
    const animesDiscoveryFeed = document.getElementById("animes-discovery-feed");
    const animesSearchInput = document.getElementById("animes-search-input");
    const exploreSearchInput = document.getElementById("animes-explore-search-input");
    const btnClearAnimesSearch = document.getElementById("btn-clear-animes-search");
    const btnClearExplore = document.getElementById("btn-clear-animes-explore-search");
    const categoryPills = document.getElementById("animes-category-pills");
    const genresChips = document.getElementById("animes-explore-genres-chips");
    const timelineChips = document.getElementById("animes-explore-timeline-chips");
    const sortLabel = document.getElementById("animes-sort-current-label");
    const sortMenu = document.getElementById("animes-explore-sort-dropdown-menu");
    const btnSort = document.getElementById("btn-animes-explore-sort-dropdown");

    const wasOpen = animesExploreView && !animesExploreView.classList.contains("hidden");
    if (animesExploreView) animesExploreView.classList.add("hidden");
    if (animesDiscoveryFeed) animesDiscoveryFeed.classList.remove("hidden");
    if (wasOpen) {
        popNavLayer();
    }

    if (animesSearchInput) animesSearchInput.value = "";
    if (exploreSearchInput) exploreSearchInput.value = "";
    if (btnClearAnimesSearch) btnClearAnimesSearch.classList.add("hidden");
    if (btnClearExplore) btnClearExplore.classList.add("hidden");

    activeAnimesFilterGenre = '';
    activeAnimesFilterYearRange = '';
    activeAnimesFilterSort = 'popularity.desc';

    if (sortLabel) sortLabel.textContent = "Populares";
    if (sortMenu) {
        sortMenu.classList.add("hidden");
        sortMenu.querySelectorAll(".sort-dropdown-item").forEach(it => {
            it.classList.toggle("active", it.dataset.sort === 'popularity.desc');
        });
    }
    if (btnSort) btnSort.setAttribute("aria-expanded", "false");

    if (genresChips) {
        genresChips.querySelectorAll(".explore-chip").forEach(c => c.classList.toggle("active", c.dataset.genre === ""));
    }
    if (timelineChips) {
        timelineChips.querySelectorAll(".explore-chip").forEach(c => c.classList.toggle("active", c.dataset.yearRange === ""));
    }
    if (categoryPills) {
        categoryPills.querySelectorAll(".anime-pill").forEach(p => p.classList.toggle("active", p.dataset.target === "all"));
    }
}

function setupAnimesToolbarAndNavigation() {
    const categoryPills = document.getElementById("animes-category-pills");
    const searchInput = document.getElementById("animes-search-input");
    const searchContainer = document.getElementById("animes-search-container");
    const btnClear = document.getElementById("btn-clear-animes-search");

    if (categoryPills) {
        categoryPills.addEventListener("click", (e) => {
            const pill = e.target.closest(".anime-pill");
            if (!pill) return;
            categoryPills.querySelectorAll(".anime-pill").forEach(p => p.classList.remove("active"));
            pill.classList.add("active");

            const target = pill.dataset.target;
            if (target === "all") {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const targetEl = document.getElementById(target);
                if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }

    document.querySelectorAll("#view-animes .btn-carousel-arrow").forEach(btn => {
        btn.addEventListener("click", () => {
            const trackId = btn.getAttribute("data-track");
            const track = document.getElementById(trackId);
            if (!track) return;
            const isNext = btn.classList.contains("btn-next");
            const scrollAmount = track.clientWidth * 0.75;
            track.scrollBy({ left: isNext ? scrollAmount : -scrollAmount, behavior: 'smooth' });
        });
    });

    if (searchInput) {
        searchInput.addEventListener("focus", () => openAnimesExploreView(true));
        searchInput.addEventListener("input", () => openAnimesExploreView(false));
    }

    if (searchContainer) {
        searchContainer.addEventListener("click", (e) => {
            if (e.target.closest("#btn-clear-animes-search")) return;
            openAnimesExploreView(true);
        });
    }

    if (btnClear) {
        btnClear.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            btnClear.classList.add("hidden");
        });
    }

    setupAnimesExploreModule();
}

function setupAnimesExploreModule() {
    const btnBack = document.getElementById("btn-animes-explore-back");
    const exploreSearchInput = document.getElementById("animes-explore-search-input");
    const btnClearExplore = document.getElementById("btn-clear-animes-explore-search");
    const btnSort = document.getElementById("btn-animes-explore-sort-dropdown");
    const sortMenu = document.getElementById("animes-explore-sort-dropdown-menu");
    const sortLabel = document.getElementById("animes-sort-current-label");
    const genresChips = document.getElementById("animes-explore-genres-chips");
    const timelineChips = document.getElementById("animes-explore-timeline-chips");

    if (btnBack) btnBack.addEventListener("click", closeAnimesExploreView);

    if (btnSort && sortMenu) {
        btnSort.addEventListener("click", (e) => {
            e.stopPropagation();
            const isExpanded = !sortMenu.classList.contains("hidden");
            sortMenu.classList.toggle("hidden", isExpanded);
            btnSort.setAttribute("aria-expanded", String(!isExpanded));
        });

        document.addEventListener("click", (e) => {
            if (!sortMenu.contains(e.target) && !btnSort.contains(e.target)) {
                sortMenu.classList.add("hidden");
                btnSort.setAttribute("aria-expanded", "false");
            }
        });

        sortMenu.querySelectorAll(".sort-dropdown-item").forEach(item => {
            item.addEventListener("click", (e) => {
                e.stopPropagation();
                sortMenu.querySelectorAll(".sort-dropdown-item").forEach(it => it.classList.remove("active"));
                item.classList.add("active");
                activeAnimesFilterSort = item.dataset.sort || 'popularity.desc';
                if (sortLabel) {
                    const rawText = item.querySelector(".sort-item-text")?.textContent || "Populares";
                    sortLabel.textContent = rawText.replace("Mais ", "").replace("Melhor ", "");
                }
                sortMenu.classList.add("hidden");
                btnSort.setAttribute("aria-expanded", "false");
                executeFilteredAnimesSearch(1);
            });
        });
    }

    if (genresChips) {
        genresChips.addEventListener("click", (e) => {
            const chip = e.target.closest(".explore-chip");
            if (!chip) return;
            genresChips.querySelectorAll(".explore-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            activeAnimesFilterGenre = chip.dataset.genre || '';
            executeFilteredAnimesSearch(1);
        });
    }

    if (timelineChips) {
        timelineChips.addEventListener("click", (e) => {
            const chip = e.target.closest(".explore-chip");
            if (!chip) return;
            timelineChips.querySelectorAll(".explore-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            activeAnimesFilterYearRange = chip.dataset.yearRange || '';
            executeFilteredAnimesSearch(1);
        });
    }

    if (exploreSearchInput) {
        exploreSearchInput.addEventListener("input", () => {
            const val = exploreSearchInput.value.trim();
            if (btnClearExplore) btnClearExplore.classList.toggle("hidden", val.length === 0);
            clearTimeout(animesSearchDebounceTimer);
            animesSearchDebounceTimer = setTimeout(() => {
                executeFilteredAnimesSearch(1);
            }, 320);
        });

        if (btnClearExplore) {
            btnClearExplore.addEventListener("click", () => {
                exploreSearchInput.value = "";
                btnClearExplore.classList.add("hidden");
                exploreSearchInput.focus();
                executeFilteredAnimesSearch(1);
            });
        }
    }
}

function updateActiveAnimesFilterTags() {
    const container = document.getElementById("animes-explore-active-tags");
    const genresChips = document.getElementById("animes-explore-genres-chips");
    const timelineChips = document.getElementById("animes-explore-timeline-chips");
    if (!container) return;

    const tags = [];
    if (activeAnimesFilterGenre) {
        const genreName = TMDB_GENRES[activeAnimesFilterGenre] || "Tema";
        tags.push({
            label: genreName,
            onRemove: () => {
                activeAnimesFilterGenre = '';
                if (genresChips) {
                    genresChips.querySelectorAll(".explore-chip").forEach(c => c.classList.toggle("active", c.dataset.genre === ""));
                }
                executeFilteredAnimesSearch(1);
            }
        });
    }

    if (activeAnimesFilterYearRange) {
        tags.push({
            label: activeAnimesFilterYearRange,
            onRemove: () => {
                activeAnimesFilterYearRange = '';
                if (timelineChips) {
                    timelineChips.querySelectorAll(".explore-chip").forEach(c => c.classList.toggle("active", c.dataset.yearRange === ""));
                }
                executeFilteredAnimesSearch(1);
            }
        });
    }

    container.innerHTML = "";
    tags.forEach(t => {
        const tag = document.createElement("span");
        tag.className = "explore-active-tag anime-active-tag";
        tag.innerHTML = `<span>${t.label}</span><button type="button" aria-label="Remover filtro">&times;</button>`;
        tag.querySelector("button").onclick = t.onRemove;
        container.appendChild(tag);
    });
}

async function executeFilteredAnimesSearch(page = 1) {
    const exploreView = document.getElementById("animes-explore-view");
    const posterGrid = document.getElementById("animes-explore-poster-grid");
    const sectionTitle = document.getElementById("animes-explore-section-title");
    const resultsCount = document.getElementById("animes-explore-results-count");
    const searchInput = document.getElementById("animes-explore-search-input");
    const query = searchInput ? searchInput.value.trim() : '';

    if (!exploreView || exploreView.classList.contains("hidden")) return;
    if (!posterGrid) return;

    posterGrid.innerHTML = `
        <div class="explore-loading-placeholder" style="grid-column: 1/-1; padding: 40px; text-align: center; color: #a1a1aa;">
            <div class="spinner" style="margin: 0 auto 12px;"></div>
            <span>Pesquisando animes...</span>
        </div>
    `;

    updateActiveAnimesFilterTags();

    try {
        let endpoint = '';
        if (query) {
            endpoint = `search/tv?query=${encodeURIComponent(query)}&page=${page}`;
            if (sectionTitle) sectionTitle.textContent = `Resultados para "${query}"`;
        } else {
            const genresParam = activeAnimesFilterGenre ? `16,${activeAnimesFilterGenre}` : '16';
            let params = [
                `page=${page}`,
                `sort_by=${activeAnimesFilterSort}`,
                `with_genres=${genresParam}`,
                'with_original_language=ja',
                'without_keywords=256466,157145'
            ];
            if (activeAnimesFilterYearRange) {
                const parts = activeAnimesFilterYearRange.split('-');
                if (parts.length === 2) {
                    params.push(`first_air_date.gte=${parts[0]}-01-01`);
                    params.push(`first_air_date.lte=${parts[1]}-12-31`);
                }
            }
            endpoint = `discover/tv?${params.join('&')}`;
            if (sectionTitle) sectionTitle.textContent = "Catálogo de Animes";
        }

        const isAnimeResult = item => {
            if (!item.genre_ids || !item.genre_ids.includes(16)) return false;
            const lang = item.original_language || '';
            const countries = item.origin_country || [];
            return lang === 'ja' || countries.includes('JP') || lang === 'ko' || lang === 'zh';
        };
        // Text + filter: TMDB's search ignores the filters, so they are applied over the first search pages
        const filterWithText = query && (activeAnimesFilterGenre || activeAnimesFilterYearRange || activeAnimesFilterSort !== 'popularity.desc');
        const data = filterWithText
            ? await filteredSearchPage({
                key: `anime|${query}|${activeAnimesFilterGenre}|${activeAnimesFilterYearRange}|${activeAnimesFilterSort}`,
                fetchPage: n => fetchSeriesEndpoint(`search/tv?query=${encodeURIComponent(query)}&page=${n}`),
                keep: item => isAnimeResult(item)
                    && (!activeAnimesFilterGenre || item.genre_ids.includes(Number(activeAnimesFilterGenre)))
                    && inYearRange(item.first_air_date, activeAnimesFilterYearRange),
                sort: activeAnimesFilterSort,
                dateField: 'first_air_date',
                page,
            })
            : await fetchSeriesEndpoint(endpoint);
        let results = data.results || [];

        // Filter to only genuine Anime (Animation genre 16 + Japanese or Asian anime origin) when a text query is used
        if (query) {
            results = results.filter(item => {
                if (!item.genre_ids || !item.genre_ids.includes(16)) return false;
                const lang = item.original_language || '';
                const countries = item.origin_country || [];
                return lang === 'ja' || countries.includes('JP') || lang === 'ko' || lang === 'zh';
            });
        }
        posterGrid.innerHTML = "";

        if (resultsCount) {
            const count = query && !data.filtered ? results.length : (data.total_results || 0);
            resultsCount.textContent = `${count.toLocaleString('pt-BR')} ${count === 1 ? 'anime encontrado' : 'animes encontrados'}`;
        }

        if (results.length === 0) {
            posterGrid.innerHTML = `
                <div class="explore-empty-state" style="grid-column: 1/-1; padding: 60px 20px; text-align: center; color: #71717a;">
                    <p style="font-size: 1.1rem; font-weight: 500; color: #e4e4e7; margin-bottom: 8px;">Nenhum anime encontrado</p>
                    <p style="font-size: 0.9rem;">Tente buscar com outros termos ou remover alguns filtros aplicados.</p>
                </div>
            `;
            renderPaginationControls("animes-explore-pagination", 1, 0, 0, null);
            return;
        }

        const fragment = document.createDocumentFragment();
        results.forEach(animeItem => fragment.appendChild(createSeriesCardElement(animeItem, 'anime')));
        posterGrid.appendChild(fragment);

        renderPaginationControls("animes-explore-pagination", page, data.total_pages || 1, data.total_results || 0, (newPage) => {
            executeFilteredAnimesSearch(newPage);
            const gridEl = document.getElementById("animes-explore-poster-grid");
            if (gridEl) gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    } catch (err) {
        console.error("[Animes] Erro ao filtrar animes:", err);
        posterGrid.innerHTML = `<p style="color:#ef4444; grid-column: 1/-1; padding: 20px; text-align:center;">Erro ao carregar animes do catálogo.</p>`;
    }
}

// ==========================================
// 3. SERIES & ANIMES DETAILS MODAL
// ==========================================

const SERIES_SERVER_OPTIONS = [
    { id: 'native_direct', name: 'Player Nativo - Sem Anúncios (BETA)', isNative: true },
    { id: 'native_anime',  name: 'Player Nativo Animes - Sem Anúncios (BETA)', isNative: true, animeOnly: true },
    { id: 'mgeb',          name: 'Servidor 1 (MGEB - Principal)' },
    { id: 'superflix',     name: 'Servidor 2 (SuperFlix)' },
    { id: 'myembed',       name: 'Servidor 3 (MyEmbed)' },
    { id: 'warezcdn',      name: 'Servidor 4 (WarezCDN)' },
    { id: 'vsembed',       name: 'Servidor 5 (VsEmbed)' }
];

function renderSeriesServerButtons(showItem) {
    const serversGrid = document.getElementById("series-servers-grid");
    if (!serversGrid) return;
    serversGrid.innerHTML = "";

    const isAnime = isAnimeShow(showItem);

    const availableServers = SERIES_SERVER_OPTIONS.filter(s => !s.animeOnly || isAnime);

    availableServers.forEach(server => {
        const btn = document.createElement("button");
        btn.type = "button";
        const isCurrentActive = activeSeriesPlaying.server === server.id;
        btn.className = `btn-movie-server ${server.isNative ? 'native-direct' : ''} ${isCurrentActive ? 'active' : ''}`;
        btn.dataset.server = server.id;
        btn.innerHTML = server.isNative
            ? `<span>${server.name}</span>`
            : `<span>${server.name}</span><span style="font-size: 0.72rem; color: #a1a1aa; opacity: 0.85;">Reproduzir</span>`;

        btn.addEventListener("click", () => {
            document.querySelectorAll("#series-servers-grid .btn-movie-server").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeSeriesPlaying.server = server.id;

            if (activeSeriesPlaying.show) {
                openEpisode(activeSeriesPlaying.show, { season: activeSeriesPlaying.seasonNumber, episode: activeSeriesPlaying.episodeNumber }, { keepPosition: true });
            }
        });

        serversGrid.appendChild(btn);
    });
}

export function setupSeriesModalHandlers() {
    if (isSeriesModalHandlersInitialized) return;
    isSeriesModalHandlersInitialized = true;

    const modal = document.getElementById("series-modal");
    const btnClose = document.getElementById("btn-close-series-modal");
    const btnReload = document.getElementById("btn-reload-series-player");
    const btnClosePlayer = document.getElementById("btn-close-series-player");

    if (btnClose) btnClose.addEventListener("click", closeSeriesModal);
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeSeriesModal();
        });
    }

    if (btnReload) {
        btnReload.addEventListener("click", () => {
            if (activeSeriesPlaying.show) {
                openEpisode(activeSeriesPlaying.show, { season: activeSeriesPlaying.seasonNumber, episode: activeSeriesPlaying.episodeNumber }, { keepPosition: true });
            }
        });
    }

    if (btnClosePlayer) {
        btnClosePlayer.addEventListener("click", stopSeriesPlayer);
    }

    // X: leave to the catalog of this kind (Animes or Séries) instead of the episode list
    const btnExitPlayer = document.getElementById("btn-exit-series-player");
    if (btnExitPlayer) {
        btnExitPlayer.addEventListener("click", exitSeriesToCatalog);
    }

    const btnPrevEp = document.getElementById("btn-series-prev-ep");
    const btnNextEp = document.getElementById("btn-series-next-ep");

    if (btnPrevEp) {
        btnPrevEp.addEventListener("click", () => {
            const current = activeSeriesPlaying.context;
            if (!current) return;
            // The show-wide number also crosses back into the previous season
            if (current.absolute > 1 && regularSeasonsOf(current.details).length > 0) {
                showToast(current.episode > 1 ? `Voltando para Episódio ${current.episode - 1}...` : `Voltando para a Temporada ${current.season - 1}...`, 1200);
                openEpisode(current.show, { absolute: current.absolute - 1 });
            } else if (current.episode > 1) {
                showToast(`Voltando para Episódio ${current.episode - 1}...`, 1200);
                openEpisode(current.show, { season: current.season, episode: current.episode - 1 });
            }
        });
    }

    if (btnNextEp) {
        btnNextEp.addEventListener("click", () => {
            const next = getNextEpisodeTarget();
            if (!next) {
                showToast("Você já está no último episódio disponível!");
                return;
            }
            showToast(next.newSeason ? `Iniciando Temporada ${next.season}...` : `Passando para Episódio ${next.episode}...`, 1200);
            openEpisode(activeSeriesPlaying.show, { season: next.season, episode: next.episode });
        });
    }

    const btnToggleDrawer = document.getElementById("btn-toggle-drawer");
    const btnCloseDrawer = document.getElementById("btn-close-series-drawer");
    const drawer = document.getElementById("series-player-drawer");

    if (btnToggleDrawer && drawer) {
        btnToggleDrawer.addEventListener("click", () => {
            drawer.classList.toggle("hidden");
            if (!drawer.classList.contains("hidden")) {
                populateSeriesDrawer();
            }
        });
    }

    if (btnCloseDrawer && drawer) {
        btnCloseDrawer.addEventListener("click", () => drawer.classList.add("hidden"));
    }

    const theaterView = document.getElementById("series-player-view");
    if (theaterView) {
        theaterView.addEventListener("click", (e) => {
            if (e.target === theaterView) stopSeriesPlayer();
        });
    }

    const directPlayBtn = document.getElementById("btn-series-modal-direct-play");
    if (directPlayBtn) {
        directPlayBtn.addEventListener("click", () => {
            if (!currentSelectedSeries) return;
            const progress = getStoredWatchProgress()[currentSelectedSeries.id];
            if (progress && progress.season && progress.episode) {
                openEpisode(currentSelectedSeries, { season: progress.season, episode: progress.episode });
            } else {
                openEpisode(currentSelectedSeries, { season: 1, episode: 1 });
            }
        });
    }

    const btnModeArcs = document.getElementById("btn-mode-arcs");
    const btnModeContinuous = document.getElementById("btn-mode-continuous");
    const arcsPanel = document.getElementById("series-arcs-panel");
    const continuousPanel = document.getElementById("series-continuous-panel");

    if (btnModeArcs && btnModeContinuous) {
        btnModeArcs.addEventListener("click", () => {
            btnModeArcs.classList.add("active");
            btnModeContinuous.classList.remove("active");
            if (arcsPanel) arcsPanel.classList.remove("hidden");
            if (continuousPanel) continuousPanel.classList.add("hidden");
        });

        btnModeContinuous.addEventListener("click", () => {
            btnModeContinuous.classList.add("active");
            btnModeArcs.classList.remove("active");
            if (arcsPanel) arcsPanel.classList.add("hidden");
            if (continuousPanel) continuousPanel.classList.remove("hidden");
            initContinuousModeForCurrentShow();
        });
    }

    const quickSearchInput = document.getElementById("series-quick-ep-search");
    const btnGoToEp = document.getElementById("btn-go-to-ep");

    const handleQuickSearch = () => {
        const num = parseInt(quickSearchInput ? quickSearchInput.value.trim() : '0', 10);
        if (!num || num < 1) {
            showToast("Por favor, digite um número de episódio válido.");
            return;
        }
        goToEpisodeByAbsoluteNumber(num);
    };

    if (btnGoToEp) btnGoToEp.addEventListener("click", handleQuickSearch);
    if (quickSearchInput) {
        quickSearchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") handleQuickSearch();
        });
    }
}

export async function openSeriesModal(seriesItem, mediaType = 'tv', options = {}) {
    setupSeriesModalHandlers();
    currentSelectedSeries = seriesItem;
    const modal = document.getElementById("series-modal");
    if (!modal) return;

    stopSeriesPlayer();

    const quickSearchInput = document.getElementById("series-quick-ep-search");
    if (quickSearchInput) quickSearchInput.value = "";

    const backdropImg = document.getElementById("series-modal-backdrop-img");
    const titleEl = document.getElementById("series-modal-title");
    const yearEl = document.getElementById("series-modal-year");
    const ratingEl = document.getElementById("series-modal-rating");
    const seasonsCountEl = document.getElementById("series-modal-seasons-count");
    const overviewEl = document.getElementById("series-modal-overview");
    const genresEl = document.getElementById("series-modal-genres");

    const backdropUrl = seriesItem.backdrop_path
        ? `${TMDB_IMG_ORIGINAL}${seriesItem.backdrop_path}`
        : (seriesItem.poster_path ? `${TMDB_IMG_W500}${seriesItem.poster_path}` : '');

    if (backdropImg) backdropImg.src = backdropUrl;
    const title = seriesItem.name || seriesItem.title || 'Título';
    if (titleEl) titleEl.textContent = title;
    if (yearEl) yearEl.textContent = (seriesItem.first_air_date || seriesItem.release_date || '').substring(0, 4) || 'Série';
    if (ratingEl) ratingEl.textContent = `★ ${seriesItem.vote_average ? seriesItem.vote_average.toFixed(1) : '8.0'}`;
    if (overviewEl) overviewEl.textContent = seriesItem.overview || "Sinopse não disponível em português.";

    const directPlayLabel = document.getElementById("series-modal-direct-play-label");
    const progress = getStoredWatchProgress()[seriesItem.id];
    if (directPlayLabel) {
        if (progress && progress.season && progress.episode) {
            directPlayLabel.textContent = `Continuar T${progress.season}:E${progress.episode}`;
        } else {
            directPlayLabel.textContent = "Assistir Agora (T1:E1)";
        }
    }

    const wasHidden = modal.classList.contains("hidden");
    modal.classList.remove("hidden");
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("modal-open");
    document.body.classList.add("modal-open");
    if (wasHidden) {
        pushNavLayer('modal-series', { id: seriesItem.id });
    }

    const btnModeArcs = document.getElementById("btn-mode-arcs");
    const btnModeContinuous = document.getElementById("btn-mode-continuous");
    const arcsPanel = document.getElementById("series-arcs-panel");
    const continuousPanel = document.getElementById("series-continuous-panel");
    const modalCard = modal.querySelector(".series-modal-card");

    if (modalCard) {
        modalCard.classList.toggle("theme-anime", mediaType === 'anime');
    }

    if (btnModeArcs && btnModeContinuous) {
        btnModeArcs.classList.add("active");
        btnModeContinuous.classList.remove("active");
    }
    if (arcsPanel) arcsPanel.classList.remove("hidden");
    if (continuousPanel) continuousPanel.classList.add("hidden");

    try {
        // external_ids brings the IMDb id (SkipDB) in the same request
        const details = await fetchSeriesEndpoint(`tv/${seriesItem.id}?append_to_response=external_ids`);
        currentSeriesDetails = details;
        rememberShowDetails(details);

        if (seasonsCountEl) {
            const totalSeasons = details.number_of_seasons || 1;
            const totalEpisodes = details.number_of_episodes || '';
            seasonsCountEl.textContent = `${totalSeasons} ${totalSeasons === 1 ? 'Temporada' : 'Temporadas'} ${totalEpisodes ? '• ' + totalEpisodes + ' eps' : ''}`;
        }

        if (genresEl && details.genres) {
            genresEl.innerHTML = details.genres.slice(0, 3).map(g => `<span class="movie-modal-genre-tag">${g.name}</span>`).join('');
        }

        populateSeasonsSelect(details);

        if (options.autoPlaySeason && options.autoPlayEpisode) {
            if (pendingSeriesAutoplayTimer) clearTimeout(pendingSeriesAutoplayTimer);
            pendingSeriesAutoplayTimer = setTimeout(() => {
                const modal = document.getElementById("series-modal");
                if (modal && !modal.classList.contains("hidden")) {
                    openEpisode(seriesItem, { season: options.autoPlaySeason, episode: options.autoPlayEpisode });
                }
            }, 300);
        }
    } catch (err) {
        console.error("[Series] Erro ao carregar detalhes completos:", err);
    }
}

export function closeSeriesModal() {
    seriesPlaybackSessionId++;
    if (pendingSeriesIframeTimer) {
        clearTimeout(pendingSeriesIframeTimer);
        pendingSeriesIframeTimer = null;
    }
    if (pendingSeriesAutoplayTimer) {
        clearTimeout(pendingSeriesAutoplayTimer);
        pendingSeriesAutoplayTimer = null;
    }
    setPlaybackActiveState(false);
    atomicPlayerReset();
    removeSeriesIframe();

    const modal = document.getElementById("series-modal");
    const theaterView = document.getElementById("series-player-view");
    const seriesLoader = document.getElementById("series-theater-loader");
    const drawer = document.getElementById("series-player-drawer");

    const wasOpen = modal && !modal.classList.contains("hidden");
    if (seriesLoader) seriesLoader.classList.add("hidden");
    if (theaterView) theaterView.classList.add("hidden");
    if (drawer) drawer.classList.add("hidden");
    if (modal) modal.classList.add("hidden");
    if (wasOpen) {
        popNavLayer();
    }

    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    document.documentElement.classList.remove("modal-open");
    document.body.classList.remove("modal-open");
    const quickSearchInput = document.getElementById("series-quick-ep-search");
    if (quickSearchInput) quickSearchInput.value = "";
    currentSelectedSeries = null;
    currentSeriesDetails = null;
}

function populateSeasonsSelect(details) {
    const select = document.getElementById("series-season-select");
    if (!select) return;

    select.innerHTML = "";
    const seasons = (details.seasons || []).filter(s => s.season_number > 0);

    if (seasons.length === 0) {
        seasons.push({ season_number: 1, name: "Temporada 1", episode_count: details.number_of_episodes || 12 });
    }

    seasons.forEach((season, idx) => {
        const opt = document.createElement("option");
        opt.value = season.season_number;
        opt.textContent = season.name || `Temporada ${season.season_number}`;
        if (season.episode_count) {
            opt.textContent += ` (${season.episode_count} eps)`;
        }
        if (idx === 0) opt.selected = true;
        select.appendChild(opt);
    });

    const initialSeason = seasons[0].season_number;
    loadSeasonEpisodes(details.id, initialSeason);

    select.onchange = () => {
        const seasonNum = parseInt(select.value, 10);
        loadSeasonEpisodes(details.id, seasonNum);
    };
}

async function loadSeasonEpisodes(showId, seasonNumber) {
    const grid = document.getElementById("series-episodes-grid");
    const totalEl = document.getElementById("series-season-episodes-total");

    if (grid) grid.innerHTML = `<p style="color:#a1a1aa; padding: 20px; grid-column: 1/-1;">Carregando episódios da Temporada ${seasonNumber}...</p>`;

    const cacheKey = `${showId}_${seasonNumber}`;
    let episodes = cachedSeasonsMap[cacheKey];

    if (!episodes) {
        try {
            const data = await fetchSeriesEndpoint(`tv/${showId}/season/${seasonNumber}`);
            episodes = normalizeSeasonEpisodes(data.results || data.episodes || []);
            cachedSeasonsMap[cacheKey] = episodes;
        } catch (err) {
            console.error("[Series] Erro ao carregar episódios:", err);
            if (grid) grid.innerHTML = `<p style="color:#f87171; padding: 20px; grid-column: 1/-1;">Erro ao obter episódios desta temporada.</p>`;
            return;
        }
    }

    if (totalEl) totalEl.textContent = `${episodes.length} episódios encontrados`;
    renderEpisodesGrid(grid, episodes, seasonNumber);
}

function renderEpisodesGrid(container, episodes, seasonNumber) {
    if (!container) return;
    container.innerHTML = "";

    if (episodes.length === 0) {
        container.innerHTML = `<p style="color:#71717a; padding: 20px; grid-column: 1/-1;">Nenhum episódio cadastrado nesta temporada.</p>`;
        return;
    }

    const storedProgress = getStoredWatchProgress();
    const currentShowHistory = storedProgress[currentSelectedSeries.id];

    const fragment = document.createDocumentFragment();
    episodes.forEach(ep => {
        const card = document.createElement("div");
        card.className = "series-ep-card";
        card.tabIndex = 0;
        card.setAttribute("role", "button");

        const isCurrentPlaying = (activeSeriesPlaying.show && activeSeriesPlaying.show.id === currentSelectedSeries.id &&
                                  activeSeriesPlaying.seasonNumber === seasonNumber &&
                                  activeSeriesPlaying.episodeNumber === ep.episode_number);
        if (isCurrentPlaying) card.classList.add("is-active-playing");

        const isWatched = currentShowHistory && (
            currentShowHistory.season > seasonNumber ||
            (currentShowHistory.season === seasonNumber && currentShowHistory.episode >= ep.episode_number)
        );

        const stillUrl = ep.still_path
            ? `${TMDB_IMG_W500}${ep.still_path}`
            : (currentSelectedSeries.backdrop_path ? `${TMDB_IMG_W500}${currentSelectedSeries.backdrop_path}` : 'assets/logos/fav/icon-detailed.svg');

        const epTitle = ep.name || `Episódio ${ep.episode_number}`;
        const epDuration = ep.runtime ? `${ep.runtime} min` : '';
        // Shows with several seasons also list the show-wide number, to find an episode by its overall position
        const episodeDetails = detailsFor(currentSelectedSeries && currentSelectedSeries.id);
        const epAbsolute = regularSeasonsOf(episodeDetails).length > 1 ? absoluteEpisodeOf(episodeDetails, seasonNumber, ep.episode_number) : 0;
        const epAbsoluteLabel = epAbsolute ? `Ep. geral ${epAbsolute}` : '';

        card.innerHTML = `
            <div class="ep-thumbnail-box">
                <img class="ep-thumbnail-img" src="${stillUrl}" alt="${epTitle}" loading="lazy" onerror="this.src='assets/logos/fav/icon-detailed.svg'">
                <span class="ep-number-tag">Ep. ${ep.episode_number}</span>
                ${isWatched ? '<span class="ep-watched-tag">Visto</span>' : ''}
                <div class="ep-play-overlay">
                    <div class="ep-play-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                    </div>
                </div>
            </div>
            <div class="ep-info-box">
                <h4 class="ep-title" title="${epTitle}">${epTitle}</h4>
                <div class="ep-meta-row">
                    <span>${ep.air_date ? ep.air_date.substring(0, 4) : ''}</span>
                    <span>${epDuration}</span>
                    ${epAbsoluteLabel ? `<span>${epAbsoluteLabel}</span>` : ''}
                </div>
                <p class="ep-overview">${ep.overview || "Sem descrição disponível."}</p>
            </div>
        `;

        const playAction = () => {
            openEpisode(currentSelectedSeries, { season: seasonNumber, episode: ep.episode_number });
        };

        card.addEventListener("click", playAction);
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                playAction();
            }
        });

        fragment.appendChild(card);
    });

    container.appendChild(fragment);
}

// --- Episode numbering (season-relative vs show-wide "absolute") ---

/** TMDB details of the show, only when they belong to `showId` (the modal may hold another show). */
function detailsFor(showId) {
    if (currentSeriesDetails && Number(currentSeriesDetails.id) === Number(showId)) return currentSeriesDetails;
    return showDetailsById.get(Number(showId)) || null;
}

function regularSeasonsOf(details) {
    if (!details || !Array.isArray(details.seasons)) return [];
    return details.seasons
        .filter(s => s.season_number > 0 && typeof s.episode_count === 'number' && s.episode_count > 0)
        .sort((a, b) => a.season_number - b.season_number);
}

/** Show-wide number of a season episode: episodes of the earlier regular seasons plus its own number. 0 when unknown. */
function absoluteEpisodeOf(details, seasonNumber, episodeNumber) {
    const seasons = regularSeasonsOf(details);
    if (!(Number(seasonNumber) > 0) || seasons.length === 0) return 0;
    let before = 0;
    for (const season of seasons) {
        if (season.season_number >= Number(seasonNumber)) break;
        before += season.episode_count;
    }
    return before + Number(episodeNumber);
}

function totalEpisodesOf(details) {
    const sum = regularSeasonsOf(details).reduce((total, season) => total + season.episode_count, 0);
    return sum || (details && details.number_of_episodes) || 0;
}

// --- One entry point for opening an episode ---
// Every way of opening an episode (resume card, details button, season list, continuous list, go to N, player
// drawer, previous/next, next-episode card) goes through openEpisode(), and everything downstream (header, servers,
// resolve request, AniSkip, skip bases, history) reads the same episode context. See CLAUDE.md.

const showDetailsById = new Map();
const showDetailsRequests = new Map();
let episodeOpenToken = 0;

function rememberShowDetails(details) {
    if (details && details.id != null) showDetailsById.set(Number(details.id), details);
}

/** Show details with external_ids, loaded once per show. */
async function loadShowDetails(showId) {
    const known = detailsFor(showId);
    if (known) return known;
    const id = Number(showId);
    if (!showDetailsRequests.has(id)) {
        showDetailsRequests.set(id, fetchSeriesEndpoint(`tv/${id}?append_to_response=external_ids`)
            .then(details => { rememberShowDetails(details); return details; })
            .catch(() => null)
            .finally(() => showDetailsRequests.delete(id)));
    }
    return showDetailsRequests.get(id);
}

/** The item a caller had (maybe only id and name) completed with the show details. */
function mergeShow(showRef, details) {
    if (!details) return showRef;
    const given = Object.fromEntries(Object.entries(showRef).filter(([, v]) => v !== undefined && v !== null && v !== ''));
    const merged = { ...details, ...given };
    if (!Array.isArray(merged.genre_ids) && Array.isArray(details.genres)) merged.genre_ids = details.genres.map(g => g.id);
    return merged;
}

/**
 * Everything the player and its features need about one episode, built the same way whatever opened it.
 * `target`: { season, episode } in our numbering (seasons start at 1), { absolute } (show-wide), or
 * { season, tmdbEpisode } (TMDB's own number). An episode saved with TMDB's continuous number before seasons were
 * renumbered (Naruto: T2E33 for T2E1) is found through `tmdb_episode_number`.
 */
export async function resolveEpisodeContext(showRef, target = {}) {
    const details = await loadShowDetails(showRef.id);
    const show = mergeShow(showRef, details);
    let season = Number(target.season) || 1;
    let episode = Number(target.episode) || Number(target.tmdbEpisode) || 1;
    if (Number(target.absolute) > 0) {
        const mapped = mapAbsoluteEpisodeToSeason(details ? details.seasons : [], Number(target.absolute));
        season = Number(mapped.season);
        episode = Number(mapped.episode);
    }
    let list = [];
    try {
        list = await fetchSeasonEpisodes(show.id, season);
    } catch (e) {
        list = [];
    }
    const tmdbNumber = ep => Number(ep.tmdb_episode_number != null ? ep.tmdb_episode_number : ep.episode_number);
    let epData = target.tmdbEpisode
        ? list.find(ep => tmdbNumber(ep) === Number(target.tmdbEpisode))
        : list.find(ep => Number(ep.episode_number) === episode);
    if (!epData && !target.absolute) epData = list.find(ep => ep.tmdb_episode_number != null && Number(ep.tmdb_episode_number) === episode);
    if (epData) episode = Number(epData.episode_number);
    return {
        show,
        details,
        isAnime: isAnimeShow(show),
        tmdbId: Number(show.id),
        imdbId: (details && details.external_ids && details.external_ids.imdb_id) || null,
        season,
        episode,
        tmdbEpisode: epData ? tmdbNumber(epData) : episode,
        absolute: details ? (absoluteEpisodeOf(details, season, episode) || episode) : null,
        totalEpisodes: details ? totalEpisodesOf(details) : 0,
        epData: epData || null,
        malId: animeMalIds.get(`${show.id}_${season}`) || null,
    };
}

/** The context of the episode on screen (read-only use: checks and diagnostics). */
export function getCurrentEpisodeContext() {
    return activeSeriesPlaying.context || null;
}

/** The only way to start an episode. A newer call wins over an older one still loading. */
export async function openEpisode(showRef, target = {}, options = {}) {
    if (!showRef || showRef.id == null) return;
    // The player buttons (previous, next, reload, exit, episode list) are wired here too: an episode opened from the
    // home screen before the Séries/Animes tabs were prepared had dead buttons
    setupSeriesModalHandlers();
    const token = ++episodeOpenToken;
    const context = await resolveEpisodeContext(showRef, target);
    if (token !== episodeOpenToken) return;
    startEpisodePlayback(context, options);
}

// --- Episode names and the player header ---

/** Placeholders such as "Episódio 109" stand for a name that is not known yet. */
function isGenericEpisodeName(name) {
    return !name || /^Epis[oó]dio\s+\d+$/i.test(String(name).trim());
}

function findCachedEpisode(showId, seasonNumber, episodeNumber) {
    const list = cachedSeasonsMap[`${showId}_${seasonNumber}`];
    return Array.isArray(list) ? (list.find(ep => Number(ep.episode_number) === Number(episodeNumber)) || null) : null;
}

const seasonEpisodeRequests = new Map();

/**
 * Some TMDB shows keep counting across seasons inside each season (Naruto Shippuden season 2 starts at episode 33).
 * The whole app (player hosts, show-wide number, next episode) works with the number inside the season, so such a
 * season is shifted to start at 1. The TMDB number is kept in `tmdb_episode_number`.
 */
function normalizeSeasonEpisodes(list) {
    if (!Array.isArray(list) || list.length === 0) return list;
    const first = Math.min(...list.map(ep => Number(ep.episode_number)).filter(Number.isFinite));
    if (!Number.isFinite(first) || first <= 1) return list;
    return list.map(ep => ({ ...ep, tmdb_episode_number: ep.episode_number, episode_number: Number(ep.episode_number) - (first - 1) }));
}

/** Episodes of one season (TMDB), cached; simultaneous callers share one request. */
function fetchSeasonEpisodes(showId, seasonNumber) {
    const key = `${showId}_${seasonNumber}`;
    const cached = cachedSeasonsMap[key];
    if (Array.isArray(cached) && cached.length > 0) return Promise.resolve(cached);
    if (seasonEpisodeRequests.has(key)) return seasonEpisodeRequests.get(key);
    const request = fetchSeriesEndpoint(`tv/${showId}/season/${seasonNumber}`)
        .then(data => {
            const list = normalizeSeasonEpisodes(data.episodes || data.results || []);
            if (list.length > 0) cachedSeasonsMap[key] = list;
            return list;
        })
        .finally(() => seasonEpisodeRequests.delete(key));
    seasonEpisodeRequests.set(key, request);
    return request;
}

/** Title of the player header: show, season/episode, show-wide number (several seasons only), episode name. */
function episodeHeaderText(showItem, seasonNumber, episodeNumber, episodeName, absoluteEpisode) {
    const showName = showItem.name || showItem.title || 'Série';
    const details = detailsFor(showItem.id);
    const several = regularSeasonsOf(details).length > 1;
    const absolute = several ? (absoluteEpisode || absoluteEpisodeOf(details, seasonNumber, episodeNumber)) : 0;
    return `${showName} • T${seasonNumber}:E${episodeNumber}${absolute ? ` • Ep. geral ${absolute}` : ''}${episodeName ? ` – ${episodeName}` : ''}`;
}

// MyAnimeList id the server picked per show+season, so the next episodes skip the title search
const animeMalIds = new Map();

// --- Continuous Mode Navigation ---
function mapAbsoluteEpisodeToSeason(seasons, absoluteEp) {
    if (!seasons || !Array.isArray(seasons) || seasons.length === 0) {
        return { season: 1, episode: absoluteEp, absoluteEpisode: absoluteEp };
    }

    const regularSeasons = seasons
        .filter(s => s.season_number > 0 && typeof s.episode_count === 'number' && s.episode_count > 0)
        .sort((a, b) => a.season_number - b.season_number);

    if (regularSeasons.length === 0) {
        return { season: 1, episode: absoluteEp, absoluteEpisode: absoluteEp };
    }

    let accumulated = 0;
    for (const s of regularSeasons) {
        if (accumulated + s.episode_count >= absoluteEp) {
            const relEp = Math.max(1, absoluteEp - accumulated);
            return {
                season: s.season_number,
                episode: relEp,
                absoluteEpisode: absoluteEp,
                seasonName: s.name || `Temporada ${s.season_number}`
            };
        }
        accumulated += s.episode_count;
    }

    const lastSeason = regularSeasons[regularSeasons.length - 1];
    const prevAccumulated = accumulated - lastSeason.episode_count;
    const lastRelEp = Math.max(1, absoluteEp - prevAccumulated);
    return {
        season: lastSeason.season_number,
        episode: lastRelEp,
        absoluteEpisode: absoluteEp,
        seasonName: lastSeason.name || `Temporada ${lastSeason.season_number}`
    };
}

function initContinuousModeForCurrentShow() {
    const chunksContainer = document.getElementById("series-chunks-container");
    if (!chunksContainer || !currentSeriesDetails) return;

    const totalEpisodes = currentSeriesDetails.number_of_episodes || 100;
    const chunkSize = 50;
    const totalChunks = Math.ceil(totalEpisodes / chunkSize);

    chunksContainer.innerHTML = "";
    for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize + 1;
        const end = Math.min((i + 1) * chunkSize, totalEpisodes);

        const pill = document.createElement("button");
        pill.type = "button";
        pill.className = `chunk-pill ${i === 0 ? 'active' : ''}`;
        pill.textContent = `${start} - ${end}`;
        pill.addEventListener("click", () => {
            chunksContainer.querySelectorAll(".chunk-pill").forEach(p => p.classList.remove("active"));
            pill.classList.add("active");
            renderContinuousChunk(start, end);
        });
        chunksContainer.appendChild(pill);
    }

    renderContinuousChunk(1, Math.min(chunkSize, totalEpisodes));
}

function renderContinuousChunk(startEp, endEp) {
    const grid = document.getElementById("series-continuous-grid");
    if (!grid) return;
    grid.innerHTML = "";

    const seasons = (currentSeriesDetails && currentSeriesDetails.seasons) ? currentSeriesDetails.seasons : [];
    const showId = currentSelectedSeries.id;
    const fragment = document.createDocumentFragment();
    const seasonsInChunk = new Set();

    for (let epNum = startEp; epNum <= endEp; epNum++) {
        const card = document.createElement("div");
        card.className = "series-ep-card";
        card.tabIndex = 0;

        const mapped = mapAbsoluteEpisodeToSeason(seasons, epNum);
        seasonsInChunk.add(mapped.season);
        card.dataset.season = mapped.season;
        card.dataset.episode = mapped.episode;

        const isCurrentPlaying = (activeSeriesPlaying.show && activeSeriesPlaying.show.id === currentSelectedSeries.id &&
                                  ((activeSeriesPlaying.absoluteEpisodeNumber && activeSeriesPlaying.absoluteEpisodeNumber === epNum) ||
                                   (activeSeriesPlaying.seasonNumber === mapped.season &&
                                    activeSeriesPlaying.episodeNumber === mapped.episode)));
        if (isCurrentPlaying) card.classList.add("is-active-playing");

        const stillUrl = currentSelectedSeries.backdrop_path
            ? `${TMDB_IMG_W500}${currentSelectedSeries.backdrop_path}`
            : 'assets/logos/fav/icon-detailed.svg';

        card.innerHTML = `
            <div class="ep-thumbnail-box">
                <img class="ep-thumbnail-img" src="${stillUrl}" alt="Episódio ${epNum}" loading="lazy">
                <span class="ep-number-tag">Ep. ${epNum}</span>
                <div class="ep-play-overlay">
                    <div class="ep-play-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                        </svg>
                    </div>
                </div>
            </div>
            <div class="ep-info-box">
                <h4 class="ep-title">Episódio ${epNum}</h4>
                <div class="ep-meta-row">
                    <span>T${mapped.season} • Ep. ${mapped.episode}</span>
                    <span>Reproduzir ▶\uFE0E</span>
                </div>
                <p class="ep-overview"></p>
            </div>
        `;

        // Real name, thumbnail and synopsis when the season is already cached; the rest arrives below
        const known = findCachedEpisode(showId, mapped.season, mapped.episode);
        if (known) applyEpisodeToCard(card, known);

        const currentEpNum = epNum;
        const playAction = () => {
            openEpisode(currentSelectedSeries, { absolute: currentEpNum });
        };

        card.addEventListener("click", playAction);
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                playAction();
            }
        });

        fragment.appendChild(card);
    }

    grid.appendChild(fragment);

    // Names are not part of the show details: fetch the seasons this block covers (cached, shared requests)
    seasonsInChunk.forEach(seasonNumber => {
        fetchSeasonEpisodes(showId, seasonNumber).then(episodes => {
            if (!currentSelectedSeries || currentSelectedSeries.id !== showId) return;
            grid.querySelectorAll(`.series-ep-card[data-season="${seasonNumber}"]`).forEach(card => {
                const episode = episodes.find(ep => Number(ep.episode_number) === Number(card.dataset.episode));
                if (episode) applyEpisodeToCard(card, episode);
            });
        }).catch(err => console.warn("[Series] Nomes dos episódios indisponíveis para a temporada", seasonNumber, err));
    });
}

/** Fills a continuous-list card with the TMDB episode (text through textContent, never as HTML). */
function applyEpisodeToCard(card, episode) {
    const title = card.querySelector(".ep-title");
    if (title && episode.name) {
        title.textContent = episode.name;
        title.title = episode.name;
    }
    const overview = card.querySelector(".ep-overview");
    if (overview) overview.textContent = episode.overview || "";
    const image = card.querySelector(".ep-thumbnail-img");
    if (image && episode.still_path) image.src = `${TMDB_IMG_W500}${episode.still_path}`;
}

function goToEpisodeByAbsoluteNumber(epNumber) {
    if (!currentSelectedSeries) return;
    const seasons = (currentSeriesDetails && currentSeriesDetails.seasons) ? currentSeriesDetails.seasons : [];
    const mapped = mapAbsoluteEpisodeToSeason(seasons, epNumber);
    openEpisode(currentSelectedSeries, { absolute: epNumber });
    showToast(`Carregando Episódio ${epNumber} (T${mapped.season}:E${mapped.episode})...`);
}

// ==========================================
// 4. SERIES & ANIMES THEATER PLAYER
// ==========================================

/**
 * Next episode after the one playing (same rules as the "Próximo" button):
 * next in the season, or episode 1 of the next season; null on the last one.
 */
function getNextEpisodeTarget() {
    const currentEp = activeSeriesPlaying.episodeNumber;
    const curSeason = activeSeriesPlaying.seasonNumber;
    const cachedEpisodes = cachedSeasonsMap[`${activeSeriesPlaying.show.id}_${curSeason}`] || [];
    const abs = activeSeriesPlaying.absoluteEpisodeNumber ? activeSeriesPlaying.absoluteEpisodeNumber + 1 : null;

    if (cachedEpisodes.length === 0 || currentEp < cachedEpisodes.length) {
        const nextEp = currentEp + 1;
        const epData = cachedEpisodes.find(ep => Number(ep.episode_number) === nextEp) || cachedEpisodes[currentEp] || null;
        return { season: curSeason, episode: nextEp, epData, abs, newSeason: false };
    }
    if (currentSeriesDetails && curSeason < currentSeriesDetails.number_of_seasons) {
        const nextSeasonEpisodes = cachedSeasonsMap[`${activeSeriesPlaying.show.id}_${curSeason + 1}`] || [];
        const epData = nextSeasonEpisodes.find(ep => Number(ep.episode_number) === 1) || nextSeasonEpisodes[0] || null;
        return { season: curSeason + 1, episode: 1, epData, abs, newSeason: true };
    }
    return null;
}

/**
 * /api/resolve parameters for the native players. native_direct always sends the season-relative episode.
 * native_anime sends both numberings plus the show total: the server picks the one the chosen
 * MyAnimeList entry uses (a whole-show entry wants the absolute number, a per-season entry the relative one).
 */
function buildNativeResolveRequest(showItem, serverKey, seasonNumber, episodeNumber, absoluteEpisode) {
    const isAnimeMode = serverKey === 'native_anime';
    let seasonName = "";
    if (currentSeriesDetails && currentSeriesDetails.seasons) {
        const matchedSeason = currentSeriesDetails.seasons.find(s => Number(s.season_number) === Number(seasonNumber));
        if (matchedSeason && matchedSeason.name) seasonName = matchedSeason.name;
    }
    // TMDB original_name (Japanese for anime): MyAnimeList finds it even when the pt-BR title is a translation.
    // Items reopened through the resume card only carry id/name, so fall back to the loaded details.
    let originalTitle = showItem.original_name || '';
    if (!originalTitle && currentSeriesDetails && Number(currentSeriesDetails.id) === Number(showItem.id)) {
        originalTitle = currentSeriesDetails.original_name || '';
    }
    // First air year tells apart remakes that share one title (Hunter x Hunter 1999 vs 2011)
    const airDate = showItem.first_air_date
        || (currentSeriesDetails && Number(currentSeriesDetails.id) === Number(showItem.id) ? currentSeriesDetails.first_air_date : '')
        || '';
    const details = detailsFor(showItem.id);
    return {
        id: showItem.id,
        type: isAnimeMode ? "anime" : "serie",
        season: seasonNumber,
        episode: episodeNumber,
        absolute_episode: isAnimeMode ? (absoluteEpisode || absoluteEpisodeOf(details, seasonNumber, episodeNumber) || '') : '',
        total_episodes: isAnimeMode ? (totalEpisodesOf(details) || '') : '',
        mal_id: isAnimeMode ? (animeMalIds.get(`${showItem.id}_${seasonNumber}`) || '') : '',
        lang: isAnimeMode ? "sub" : "dub",
        title: showItem.name || showItem.title || 'Série',
        original_title: isAnimeMode ? originalTitle : '',
        year: isAnimeMode ? airDate.substring(0, 4) : '',
        season_name: seasonName
    };
}

/** Kept for older callers (main.js); goes through openEpisode like everything else. */
export function playSeriesEpisode(showItem, seasonNumber, episodeNumber) {
    return openEpisode(showItem, { season: seasonNumber, episode: episodeNumber });
}

/** Starts a resolved episode (see resolveEpisodeContext). Only openEpisode calls it. */
function startEpisodePlayback(context, options = {}) {
    const showItem = context.show;
    const seasonNumber = context.season;
    const episodeNumber = context.episode;
    const absoluteEpNumber = context.absolute;
    let epData = context.epData ? { ...context.epData, absoluteEpisode: context.absolute } : null;
    activeSeriesPlaying.context = context;

    const currentSessionId = ++seriesPlaybackSessionId;
    if (pendingSeriesIframeTimer) {
        clearTimeout(pendingSeriesIframeTimer);
        pendingSeriesIframeTimer = null;
    }
    if (pendingSeriesAutoplayTimer) {
        clearTimeout(pendingSeriesAutoplayTimer);
        pendingSeriesAutoplayTimer = null;
    }

    activeSeriesPlaying.show = showItem;
    activeSeriesPlaying.seasonNumber = Number(seasonNumber);
    activeSeriesPlaying.episodeNumber = Number(episodeNumber);
    activeSeriesPlaying.absoluteEpisodeNumber = absoluteEpNumber || (epData && epData.absoluteEpisode) || null;
    activeSeriesPlaying.episodeData = epData;

    const detailsModal = document.getElementById("series-modal");
    const theaterView = document.getElementById("series-player-view");
    const currentEpTitle = document.getElementById("series-player-current-ep");
    const btnPrev = document.getElementById("btn-series-prev-ep");

    if (detailsModal) detailsModal.classList.add("hidden");
    const wasTheaterHidden = theaterView && theaterView.classList.contains("hidden");
    if (theaterView) theaterView.classList.remove("hidden");
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("modal-open");
    document.body.classList.add("modal-open");
    if (wasTheaterHidden) {
        pushNavLayer('player-series');
    }
    pauseHeroCarousels();

    const showName = showItem.name || showItem.title || 'Série';
    let epName = (epData && !isGenericEpisodeName(epData.name)) ? epData.name : '';

    // No real name yet (nothing passed, or a placeholder): use the season cache, else ask TMDB
    if (!epName) {
        const found = findCachedEpisode(showItem.id, seasonNumber, episodeNumber);
        if (found && found.name) {
            epName = found.name;
            epData = { ...found, absoluteEpisode: activeSeriesPlaying.absoluteEpisodeNumber };
            activeSeriesPlaying.episodeData = epData;
        }
    }

    if (!epName) {
        fetchSeasonEpisodes(showItem.id, seasonNumber).then(epList => {
            const match = epList.find(ep => Number(ep.episode_number) === Number(episodeNumber));
            if (!match || !match.name) return;
            const stillThisEpisode = activeSeriesPlaying.show && String(activeSeriesPlaying.show.id) === String(showItem.id) &&
                Number(activeSeriesPlaying.seasonNumber) === Number(seasonNumber) &&
                Number(activeSeriesPlaying.episodeNumber) === Number(episodeNumber);
            if (!stillThisEpisode) return;
            activeSeriesPlaying.episodeData = { ...match, absoluteEpisode: activeSeriesPlaying.absoluteEpisodeNumber };
            const currentTitleEl = document.getElementById("series-player-current-ep");
            const currentOverviewEl = document.getElementById("series-player-overview");
            if (currentTitleEl) {
                currentTitleEl.textContent = episodeHeaderText(showItem, seasonNumber, episodeNumber, match.name, activeSeriesPlaying.absoluteEpisodeNumber);
            }
            if (currentOverviewEl && match.overview) {
                currentOverviewEl.textContent = match.overview;
            }
        }).catch(err => {
            console.warn("[Series] Não foi possível obter o nome do episódio do TMDB:", err);
        });
    }

    if (currentEpTitle) {
        currentEpTitle.textContent = episodeHeaderText(showItem, seasonNumber, episodeNumber, epName, activeSeriesPlaying.absoluteEpisodeNumber);
    }

    const isAnime = context.isAnime;

    if (!isAnime && activeSeriesPlaying.server === 'native_anime') {
        activeSeriesPlaying.server = 'native_direct';
    }

    const exitButton = document.getElementById("btn-exit-series-player");
    if (exitButton) {
        const exitLabel = isAnime ? 'Sair para Animes' : 'Sair para Séries';
        exitButton.title = exitLabel;
        exitButton.setAttribute('aria-label', exitLabel);
    }

    renderSeriesServerButtons(showItem);

    // Populate show details below server grid
    const showTitleEl = document.getElementById("series-player-show-title");
    const metaBadgeEl = document.getElementById("series-player-meta-badge");
    const ratingBadgeEl = document.getElementById("series-player-rating-badge");
    const genresEl = document.getElementById("series-player-genres");
    const overviewEl = document.getElementById("series-player-overview");

    if (showTitleEl) showTitleEl.textContent = showName;
    if (metaBadgeEl) {
        const year = (showItem.first_air_date || showItem.release_date || '').substring(0, 4) || 'Série';
        const details = detailsFor(showItem.id);
        const absoluteLabel = regularSeasonsOf(details).length > 1 ? absoluteEpisodeOf(details, seasonNumber, episodeNumber) : 0;
        metaBadgeEl.textContent = `${year} • T${seasonNumber}:E${episodeNumber}${absoluteLabel ? ` • Ep. geral ${absoluteLabel}` : ''}`;
    }
    if (ratingBadgeEl) {
        const vote = showItem.vote_average ? showItem.vote_average.toFixed(1) : '8.0';
        ratingBadgeEl.textContent = `★ ${vote}`;
    }
    if (genresEl) {
        genresEl.innerHTML = (showItem.genre_ids || []).slice(0, 3).map(id => {
            const name = TMDB_GENRES[id];
            return name ? `<span class="movie-modal-badge">${name}</span>` : '';
        }).join('');
    }
    if (overviewEl) {
        overviewEl.textContent = epData?.overview || showItem.overview || "Sinopse não disponível em português.";
    }

    const seriesArt = document.getElementById("series-artplayer-container");
    const seriesLoader = document.getElementById("series-theater-loader");
    const serverKey = activeSeriesPlaying.server;

    // Route A: Native Direct Player
    if (serverKey === 'native_direct' || serverKey === 'native_anime') {
        atomicPlayerReset();
        removeSeriesIframe();
        if (seriesArt) {
            seriesArt.innerHTML = "";
            seriesArt.classList.add("hidden");
        }
        setLoaderText(seriesLoader, "Buscando fontes...");
        if (seriesLoader) seriesLoader.classList.remove("hidden");

        resolveDirectStream(
            buildNativeResolveRequest(showItem, serverKey, seasonNumber, episodeNumber, activeSeriesPlaying.absoluteEpisodeNumber || epData?.absoluteEpisode)
        ).then(data => {
            if (currentSessionId !== seriesPlaybackSessionId || !theaterView || theaterView.classList.contains("hidden")) {
                console.warn("[Series] Abortando montagem nativa: reprodução cancelada ou janela fechada.");
                return;
            }
            if (seriesLoader) seriesLoader.classList.add("hidden");
            if (data && data.primary_source && serverKey === 'native_anime' && data.aniskip && data.aniskip.mal_id) {
                animeMalIds.set(`${showItem.id}_${seasonNumber}`, data.aniskip.mal_id);
            }
            if (!data || !data.primary_source) {
                const animeMissing = serverKey === 'native_anime';
                showToast(animeMissing
                    ? "Anime não encontrado no player nativo. Tente outro servidor."
                    : "Fontes diretas indisponíveis para este episódio. Selecione outro servidor abaixo se desejar.");
                if (seriesArt) {
                    seriesArt.innerHTML = `
                        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#a1a1aa;padding:32px 20px;text-align:center;background:radial-gradient(circle at center, rgba(30,41,59,0.5) 0%, rgba(10,12,16,0.95) 100%);">
                            <svg width="44" height="44" fill="none" stroke="#eab308" stroke-width="1.6" viewBox="0 0 24 24" style="margin-bottom:12px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 7.5h.008v.008H12v-.008z"/></svg>
                            <div style="font-size:16px;font-weight:600;color:#fff;margin-bottom:6px;">${animeMissing ? 'Anime não encontrado no player nativo' : 'Stream nativo indisponível'}</div>
                            <div style="font-size:13px;max-width:380px;line-height:1.5;">${animeMissing ? 'Não encontramos este episódio no player nativo de animes. Escolha um dos outros servidores na barra abaixo.' : 'Não encontramos transmissões diretas sem anúncios ativas para este episódio no momento. Por favor, escolha um dos servidores alternativos na barra abaixo.'}</div>
                        </div>`;
                    seriesArt.classList.remove("hidden");
                }
                return;
            }

            const backdropUrl = showItem.backdrop_path
                ? `${TMDB_IMG_ORIGINAL}${showItem.backdrop_path}`
                : '';

            // Read after the previous player saved its last time (the reset above), so a switch keeps it
            const resumeAt = resumeStartTime(getSavedPosition(context.tmdbId, context.season, context.episode),
                { keep: Boolean(options.keepPosition), server: serverKey });
            mountNativePlayer({
                containerId: "series-artplayer-container",
                startTime: resumeAt,
                resumeNotice: !options.keepPosition,
                onProgress: (info) => saveEpisodePosition(context, serverKey, info),
                sources: [data.primary_source, ...(data.fallback_sources || [])],
                title: `${showName} • T${seasonNumber}:E${episodeNumber}`,
                poster: backdropUrl,
                subtitles: data.subtitles || [],
                // Series bases (TheIntroDB, SkipDB) for every show, in TMDB's own numbering; no recap in a first episode
                tvskip: { tmdbId: context.tmdbId, imdbId: context.imdbId, season: context.season, episode: context.tmdbEpisode },
                noRecap: context.season === 1 && context.episode === 1,
                // Opening/ending times (anime only). The anime host numbers episodes per MyAnimeList entry like
                // AniSkip does; for the main host the entry and number are looked up in the background
                aniskip: !isAnime ? null : serverKey === 'native_anime' ? data.aniskip
                    : resolveDirectStream({ ...buildNativeResolveRequest(showItem, 'native_anime', seasonNumber, episodeNumber, activeSeriesPlaying.absoluteEpisodeNumber || epData?.absoluteEpisode), aniskip_only: true })
                        .then(found => {
                            const key = found && found.aniskip;
                            if (key && key.mal_id) animeMalIds.set(`${showItem.id}_${seasonNumber}`, key.mal_id);
                            return key;
                        }),
                // Near the end, resolve the next episode so "Próximo" starts without the search wait
                onNearEnd: () => {
                    if (currentSessionId !== seriesPlaybackSessionId) return;
                    const next = getNextEpisodeTarget();
                    if (next) prefetchDirectStream(buildNativeResolveRequest(showItem, serverKey, next.season, next.episode, next.abs || next.epData?.absoluteEpisode));
                },
                getNextUp: () => {
                    if (currentSessionId !== seriesPlaybackSessionId) return null;
                    const next = getNextEpisodeTarget();
                    if (!next) return null;
                    return {
                        title: `T${next.season}:E${next.episode}${next.epData?.name ? ` – ${next.epData.name}` : ''}`,
                        play: () => openEpisode(activeSeriesPlaying.show, { season: next.season, episode: next.episode })
                    };
                },
                onAllFailed: () => {
                    showToast("Todas as fontes diretas deste episódio falharam. Selecione outro servidor abaixo se desejar.");
                    if (seriesArt) {
                        seriesArt.innerHTML = `
                            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#a1a1aa;padding:32px 20px;text-align:center;background:radial-gradient(circle at center, rgba(30,41,59,0.5) 0%, rgba(10,12,16,0.95) 100%);">
                                <svg width="44" height="44" fill="none" stroke="#ef4444" stroke-width="1.6" viewBox="0 0 24 24" style="margin-bottom:12px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                                <div style="font-size:16px;font-weight:600;color:#fff;margin-bottom:6px;">Falha na reprodução nativa</div>
                                <div style="font-size:13px;max-width:380px;line-height:1.5;">Os links diretos deste episódio estão temporariamente indisponíveis. Selecione um servidor alternativo (MGEB, Superflix, etc.) abaixo para continuar assistindo.</div>
                            </div>`;
                        seriesArt.classList.remove("hidden");
                    }
                }
            });
        }).catch(err => {
            if (seriesLoader) seriesLoader.classList.add("hidden");
            showToast("Erro ao conectar ao motor de streaming nativo.");
        });
    } else {
        // Route B: Iframe Alternative Servers
        atomicPlayerReset();
        if (seriesArt) seriesArt.classList.add("hidden");
        const iframe = getOrCreateSeriesIframe();
        if (iframe) {
            if (window.tvzinhaArmIframeGuard) {
                window.tvzinhaArmIframeGuard(iframe);
            }
            if (window.tvzinhaSetContingencyState) {
                window.tvzinhaSetContingencyState(true);
            }
            iframe.classList.remove("hidden");
            setLoaderText(seriesLoader, "Carregando reprodução...");
            if (seriesLoader) seriesLoader.classList.remove("hidden");

            const serverDef = SERIES_SERVERS[serverKey] || SERIES_SERVERS.mgeb;
            const embedUrl = serverDef.buildUrl(showItem.id, seasonNumber, episodeNumber);

            pendingSeriesIframeTimer = setTimeout(() => {
                if (currentSessionId !== seriesPlaybackSessionId || !theaterView || theaterView.classList.contains("hidden")) {
                    console.warn("[Series] Abortando carregamento de iframe: janela fechada antes de montar.");
                    return;
                }
                iframe.src = embedUrl;
            }, 30);

            iframe.onload = () => {
                if (seriesLoader) seriesLoader.classList.add("hidden");
                setPlaybackActiveState(true);
            };
            setTimeout(() => {
                if (seriesLoader) seriesLoader.classList.add("hidden");
            }, 3000);
        }
    }

    if (btnPrev) {
        btnPrev.disabled = (seasonNumber === 1 && episodeNumber === 1);
    }

    saveStoredWatchProgress(showItem, seasonNumber, episodeNumber, epData ? epData.name : `Episódio ${episodeNumber}`,
        context.isAnime ? 'anime' : 'tv', context.absolute);

    document.querySelectorAll("#series-episodes-grid .series-ep-card").forEach(c => {
        c.classList.remove("is-active-playing");
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function populateSeriesDrawer() {
    const drawerList = document.getElementById("series-drawer-list");
    if (!drawerList || !activeSeriesPlaying.show) return;

    drawerList.innerHTML = "";
    const cacheKey = `${activeSeriesPlaying.show.id}_${activeSeriesPlaying.seasonNumber}`;
    const episodes = cachedSeasonsMap[cacheKey] || [];

    if (episodes.length === 0) {
        drawerList.innerHTML = `<p style="color:#71717a; padding:10px;">Episódios não carregados.</p>`;
        return;
    }

    episodes.forEach(ep => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = `drawer-item ${ep.episode_number === activeSeriesPlaying.episodeNumber ? 'active' : ''}`;
        item.innerHTML = `
            <span>Ep. ${ep.episode_number} - ${ep.name || 'Episódio'}</span>
            <span>▶\uFE0E</span>
        `;
        item.addEventListener("click", () => {
            openEpisode(activeSeriesPlaying.show, { season: activeSeriesPlaying.seasonNumber, episode: ep.episode_number });
            const drawer = document.getElementById("series-player-drawer");
            if (drawer) drawer.classList.add("hidden");
        });
        drawerList.appendChild(item);
    });
}

/** Anime-like show (same rule the player uses to offer the anime server). */
/**
 * Anime or not, from the catalog item or, when the item is thin (the "Continuar assistindo" card only keeps id and
 * name), from the show details loaded for it (`genres` instead of `genre_ids`).
 */
function isAnimeShow(showItem) {
    const looksAnime = item => Boolean(item && (
        (item.genre_ids && item.genre_ids.includes(16)) ||
        (Array.isArray(item.genres) && item.genres.some(g => Number(g.id) === 16)) ||
        item.original_language === 'ja' ||
        (item.origin_country && (item.origin_country.includes('JP') || item.origin_country.includes('Japan')))
    ));
    return looksAnime(showItem) || Boolean(showItem && looksAnime(detailsFor(showItem.id)));
}

/**
 * Closes the player and the details panel, then shows the catalog tab of this kind.
 * The player is stopped first so its history layer is popped before the details layer.
 */
function exitSeriesToCatalog() {
    const target = isAnimeShow(activeSeriesPlaying.show || currentSelectedSeries) ? 'animes' : 'series';
    runNavBatch(() => {
        stopSeriesPlayer();
        closeSeriesModal();
    });
    // The grouped history step settles a moment later; changing tabs before that would mix with it.
    // Only needed when the title was opened from another tab (for example Home).
    setTimeout(() => {
        if (window.TvzinhaActions && store.currentView !== target) {
            window.TvzinhaActions.switchView(target);
        }
    }, 150);
}

export function stopSeriesPlayer() {
    seriesPlaybackSessionId++;
    leaveStageFullscreen();
    if (pendingSeriesIframeTimer) {
        clearTimeout(pendingSeriesIframeTimer);
        pendingSeriesIframeTimer = null;
    }
    if (pendingSeriesAutoplayTimer) {
        clearTimeout(pendingSeriesAutoplayTimer);
        pendingSeriesAutoplayTimer = null;
    }
    setPlaybackActiveState(false);
    atomicPlayerReset();
    removeSeriesIframe();
    const theaterView = document.getElementById("series-player-view");
    const seriesLoader = document.getElementById("series-theater-loader");
    const drawer = document.getElementById("series-player-drawer");

    const wasTheaterOpen = theaterView && !theaterView.classList.contains("hidden");
    if (seriesLoader) seriesLoader.classList.add("hidden");
    if (theaterView) theaterView.classList.add("hidden");
    if (drawer) drawer.classList.add("hidden");
    if (wasTheaterOpen) {
        popNavLayer();
    }

    const detailsModal = document.getElementById("series-modal");
    if (detailsModal && currentSelectedSeries) {
        detailsModal.classList.remove("hidden");
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
        document.documentElement.classList.add("modal-open");
        document.body.classList.add("modal-open");
    } else {
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
        document.documentElement.classList.remove("modal-open");
        document.body.classList.remove("modal-open");
    }
}
