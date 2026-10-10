/**
 * TVZINHA ONLINE - Movies Catalog & Cinema Module (TMDB Engine)
 * Handles movies discovery, TMDB pagination, search filters, masters/studios sections, and modal playback
 */

import { store } from '../core/state.js?v=20261010_1539';
import {
    TMDB_API_KEY,
    TMDB_BASE_URL,
    TMDB_IMG_W500,
    TMDB_IMG_ORIGINAL,
    TMDB_CACHE_KEY,
    TMDB_CACHE_TTL_MS,
    FAMOUS_DIRECTORS,
    FAMOUS_STUDIOS,
    MOVIE_SERVERS
} from '../core/constants.js?v=20261010_1539';
import { showToast } from '../core/toast.js?v=20261010_1539';
import { filteredSearchPage, inYearRange } from '../core/searchFilter.js?v=20261010_1539';
import { isBackgroundMediaAllowed } from '../core/activity.js?v=20261010_1539';
import { setPlaybackActiveState } from '../core/wakeLock.js?v=20261010_1539';
import { getUiSvg } from '../core/icons.js?v=20261010_1539';
import { mountNativePlayer, resolveDirectStream, atomicPlayerReset, setLoaderText, leaveStageFullscreen } from '../player/engine.js?v=20261010_1539';
import { pushNavLayer, popNavLayer, runNavBatch } from '../navigation/historyManager.js?v=20261010_1539';

let isMoviesInitialized = false;
let moviesCacheData = null;
let currentSelectedMovie = null;
let activeMovieServer = null;
let movieSearchDebounceTimer = null;

let moviePlaybackSessionId = 0;
let pendingMovieIframeTimer = null;
let pendingMovieAutoplayTimer = null;

if (typeof window !== 'undefined') {
    window.addEventListener('tvzinha:teardownMedia', () => {
        moviePlaybackSessionId++;
        if (pendingMovieAutoplayTimer) {
            clearTimeout(pendingMovieAutoplayTimer);
            pendingMovieAutoplayTimer = null;
        }
        if (pendingMovieIframeTimer) {
            clearTimeout(pendingMovieIframeTimer);
            pendingMovieIframeTimer = null;
        }
        removeMovieIframe();
    });
}

function getOrCreateMovieIframe() {
    let iframe = document.getElementById("movie-modal-iframe");
    if (!iframe) {
        const stage = document.querySelector(".movie-player-stage");
        if (!stage) return null;
        iframe = document.createElement("iframe");
        iframe.id = "movie-modal-iframe";
        iframe.className = "movie-modal-iframe";
        iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
        iframe.setAttribute("allowfullscreen", "");
        iframe.setAttribute("webkitallowfullscreen", "");
        iframe.setAttribute("mozallowfullscreen", "");
        iframe.setAttribute("referrerpolicy", "no-referrer");
        stage.appendChild(iframe);
    }
    return iframe;
}

function removeMovieIframe() {
    const iframe = document.getElementById("movie-modal-iframe");
    if (iframe) {
        iframe.src = "";
        iframe.remove();
    }
}

let activeFilterGenre = '';
let activeFilterYearRange = '';
let activeFilterSort = 'popularity.desc';

const TMDB_GENRES = {
    28: "Ação", 12: "Aventura", 16: "Animação", 35: "Comédia", 80: "Crime",
    99: "Documentário", 18: "Drama", 10751: "Família", 14: "Fantasia",
    36: "História", 27: "Terror", 10402: "Música", 9648: "Mistério",
    10749: "Romance", 878: "Ficção Científica", 10770: "Cinema TV",
    53: "Thriller", 10752: "Guerra", 37: "Faroeste",
    10759: "Ação & Aventura", 10765: "Sci-Fi & Fantasia", 10768: "Guerra & Política"
};

let heroMoviesList = [];
let currentHeroIndex = 0;
let heroAutoRotateTimer = null;

export async function fetchTmdbEndpoint(path) {
    const separator = path.includes('?') ? '&' : '?';
    const url = `${TMDB_BASE_URL}/${path}${separator}api_key=${TMDB_API_KEY}&language=pt-BR`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`TMDB HTTP error ${res.status}`);
    return await res.json();
}

export async function initMoviesView() {
    if (isMoviesInitialized) return;
    isMoviesInitialized = true;

    setupMoviesSearchAndFilters();
    setupMovieModal();
    setupMoviesCarouselNavigation();

    // Check local cache
    try {
        const rawCache = localStorage.getItem(TMDB_CACHE_KEY);
        if (rawCache) {
            const parsed = JSON.parse(rawCache);
            if (parsed && parsed.data && parsed.data.trending && parsed.data.trending.length > 0 && parsed.timestamp && (Date.now() - parsed.timestamp < TMDB_CACHE_TTL_MS)) {
                moviesCacheData = parsed.data;
                renderMoviesDiscoveryFeed(moviesCacheData);
                return;
            }
        }
    } catch (e) {
        console.warn("[Movies] Falha ao ler cache de filmes:", e);
    }

    // Fetch fresh data from TMDB
    await loadMoviesFromTmdb();
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

export async function loadMoviesFromTmdb() {
    showTrackSkeletons();
    try {
        const [trendingRes, releasesRes, animationRes, nationalRes, classicsRes] = await Promise.allSettled([
            fetchTmdbEndpoint('trending/movie/week'),
            fetchTmdbEndpoint('movie/now_playing'),
            fetchTmdbEndpoint('discover/movie?with_genres=16&sort_by=popularity.desc'),
            fetchTmdbEndpoint('discover/movie?with_origin_country=BR&sort_by=popularity.desc'),
            fetchTmdbEndpoint('discover/movie?primary_release_date.lte=1999-12-31&vote_count.gte=1000&sort_by=vote_average.desc')
        ]);

        const todayStr = new Date().toISOString().split('T')[0];
        const filterReleased = (list) => (list || []).filter(m => {
            const d = m.release_date || m.first_air_date;
            return !d || d <= todayStr;
        });

        const trending = filterReleased(trendingRes.status === 'fulfilled' ? (trendingRes.value.results || []) : []);
        const releases = filterReleased(releasesRes.status === 'fulfilled' ? (releasesRes.value.results || []) : []);
        const animation = filterReleased(animationRes.status === 'fulfilled' ? (animationRes.value.results || []) : []);
        const national = filterReleased(nationalRes.status === 'fulfilled' ? (nationalRes.value.results || []) : []);
        const classics = filterReleased(classicsRes.status === 'fulfilled' ? (classicsRes.value.results || []) : []);

        moviesCacheData = deduplicateFeedRows({ trending, releases, animation, national, classics });

        try {
            localStorage.setItem(TMDB_CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data: moviesCacheData
            }));
        } catch (e) {
            console.warn("[Movies] Falha ao salvar cache de filmes:", e);
        }

        renderMoviesDiscoveryFeed(moviesCacheData);
    } catch (err) {
        console.error("[Movies] Erro ao carregar catálogo de filmes:", err);
    }
}

function showTrackSkeletons() {
    const tracks = ['track-trending', 'track-releases', 'track-animation', 'track-directors', 'track-studios', 'track-national', 'track-classics'];
    tracks.forEach(trackId => {
        const track = document.getElementById(trackId);
        if (!track) return;
        track.innerHTML = Array.from({ length: 6 }).map(() => `
            <div class="movie-poster-card" style="opacity: 0.4; pointer-events: none;">
                <div style="width: 100%; height: 100%; background: #27272a; animation: pulse 1.8s infinite;"></div>
            </div>
        `).join('');
    });
}

function createMovieCardElement(movie) {
    const card = document.createElement("div");
    card.className = "movie-poster-card";
    card.tabIndex = 0;
    card.dataset.movieId = movie.id;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `${movie.title} (${(movie.release_date || '').substring(0, 4)})`);

    const posterUrl = movie.poster_path
        ? `${TMDB_IMG_W500}${movie.poster_path}`
        : 'assets/logos/fav/icon-detailed.svg';

    const releaseYear = (movie.release_date || '').substring(0, 4) || 'N/A';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '—';

    card.innerHTML = `
        <img class="movie-poster-img" src="${posterUrl}" alt="${movie.title}" loading="lazy" onerror="this.src='assets/logos/fav/icon-detailed.svg'">
        <div class="movie-poster-overlay">
            <h4 class="movie-card-title" title="${movie.title}">${movie.title}</h4>
            <div class="movie-card-meta">
                <span>${releaseYear}</span>
                <span class="movie-card-rating">★ ${rating}</span>
            </div>
        </div>
    `;

    card.addEventListener("click", () => openMovieDetailsModal(movie));
    card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openMovieDetailsModal(movie);
        }
    });

    return card;
}

export function renderMoviesDiscoveryFeed(data) {
    if (!data) return;

    // 1. Setup Hero Showcase Carousel
    const candidates = (data.trending || []).filter(m => m.backdrop_path);
    heroMoviesList = candidates.length >= 3 ? candidates.slice(0, 5) : (data.trending || []).slice(0, 5);

    if (heroMoviesList.length > 0) {
        currentHeroIndex = 0;
        initHeroCarousel(heroMoviesList);
    }

    // 2. Render each curated track
    populateTrack('track-trending', data.trending);
    populateTrack('track-releases', data.releases);
    populateTrack('track-animation', data.animation);
    populateDirectorsTrack('track-directors', FAMOUS_DIRECTORS);
    populateStudiosTrack('track-studios', FAMOUS_STUDIOS);
    populateTrack('track-national', data.national);
    populateTrack('track-classics', data.classics);
}

function initHeroCarousel(movies) {
    const dotsContainer = document.getElementById("movies-hero-dots");
    const btnPrev = document.getElementById("btn-hero-prev");
    const btnNext = document.getElementById("btn-hero-next");
    const heroSection = document.getElementById("movies-hero");

    // Concurrent pre-fetch of clearlogo and backdrops
    movies.forEach(movie => {
        if (movie.backdrop_path) {
            const preBackdrop = new Image();
            preBackdrop.src = `${TMDB_IMG_ORIGINAL}${movie.backdrop_path}`;
        }

        if (!movie.logo_url && !movie.has_no_logo) {
            fetchTmdbEndpoint(`movie/${movie.id}/images?include_image_language=pt,en,null`).then(imgData => {
                if (imgData && imgData.logos && imgData.logos.length > 0) {
                    const ptLogo = imgData.logos.find(l => l.iso_639_1 === 'pt');
                    const enLogo = imgData.logos.find(l => l.iso_639_1 === 'en');
                    const chosenLogo = ptLogo || enLogo || imgData.logos[0];
                    if (chosenLogo && chosenLogo.file_path) {
                        const logoUrl = `${TMDB_IMG_W500}${chosenLogo.file_path}`;
                        movie.logo_url = logoUrl;
                        const preImg = new Image();
                        preImg.src = logoUrl;
                        preImg.onload = () => {
                            movie.logo_loaded = true;
                            if (heroMoviesList[currentHeroIndex] && heroMoviesList[currentHeroIndex].id === movie.id) {
                                const logoEl = document.getElementById("movies-hero-title-logo");
                                const titleEl = document.getElementById("movies-hero-title");
                                if (logoEl && titleEl) {
                                    logoEl.src = movie.logo_url;
                                    logoEl.classList.remove("hidden");
                                    titleEl.classList.add("hidden");
                                }
                            }
                        };
                    } else {
                        movie.has_no_logo = true;
                    }
                } else {
                    movie.has_no_logo = true;
                }
            }).catch(() => {
                movie.has_no_logo = true;
            });
        }
    });

    if (dotsContainer) {
        dotsContainer.innerHTML = "";
        movies.forEach((m, idx) => {
            const dot = document.createElement("button");
            dot.className = `hero-dot ${idx === 0 ? 'active' : ''}`;
            dot.setAttribute("aria-label", `Destaque ${idx + 1}: ${m.title}`);
            dot.addEventListener("click", () => goToHeroSlide(idx));
            dotsContainer.appendChild(dot);
        });
    }

    if (btnPrev) {
        btnPrev.onclick = () => {
            const nextIndex = (currentHeroIndex - 1 + movies.length) % movies.length;
            goToHeroSlide(nextIndex);
        };
    }

    if (btnNext) {
        btnNext.onclick = () => {
            const nextIndex = (currentHeroIndex + 1) % movies.length;
            goToHeroSlide(nextIndex);
        };
    }

    renderHeroBanner(movies[0]);
    startHeroAutoRotate();

    if (heroSection) {
        heroSection.onmouseenter = () => clearInterval(heroAutoRotateTimer);
        heroSection.onmouseleave = () => startHeroAutoRotate();
    }
}

function startHeroAutoRotate() {
    clearInterval(heroAutoRotateTimer);
    if (heroMoviesList.length <= 1) return;
    heroAutoRotateTimer = setInterval(() => {
        // Nothing is downloaded for a carousel nobody can see (other tab, player open, browser tab hidden)
        if (!isBackgroundMediaAllowed('movies')) return;
        const nextIndex = (currentHeroIndex + 1) % heroMoviesList.length;
        goToHeroSlide(nextIndex);
    }, 7500);
}

function goToHeroSlide(index) {
    if (!heroMoviesList || !heroMoviesList[index]) return;
    currentHeroIndex = index;
    renderHeroBanner(heroMoviesList[index]);

    const dots = document.querySelectorAll("#movies-hero-dots .hero-dot");
    dots.forEach((dot, idx) => {
        dot.classList.toggle("active", idx === index);
    });
}

function renderHeroBanner(movie) {
    const backdropEl = document.getElementById("movies-hero-backdrop");
    const titleEl = document.getElementById("movies-hero-title");
    const logoEl = document.getElementById("movies-hero-title-logo");
    const yearEl = document.getElementById("movies-hero-year");
    const ratingEl = document.getElementById("movies-hero-rating");
    const overviewEl = document.getElementById("movies-hero-overview");
    const genresEl = document.getElementById("movies-hero-genres");
    const btnWatch = document.getElementById("btn-hero-watch");

    if (backdropEl && movie.backdrop_path) {
        backdropEl.classList.add("fade-transition");
        const newImg = new Image();
        newImg.onload = () => {
            backdropEl.src = newImg.src;
            backdropEl.classList.remove("fade-transition");
        };
        newImg.src = `${TMDB_IMG_ORIGINAL}${movie.backdrop_path}`;
    }

    if (movie.logo_url) {
        if (logoEl) {
            logoEl.src = movie.logo_url;
            logoEl.classList.remove("hidden");
        }
        if (titleEl) {
            titleEl.classList.add("hidden");
            titleEl.textContent = movie.title || "Filme em Destaque";
        }
    } else if (movie.has_no_logo) {
        if (logoEl) {
            logoEl.classList.add("hidden");
            logoEl.src = "";
        }
        if (titleEl) {
            titleEl.classList.remove("hidden");
            titleEl.textContent = movie.title || "Filme em Destaque";
        }
    } else {
        if (logoEl) {
            logoEl.classList.add("hidden");
            logoEl.src = "";
        }
        if (titleEl) {
            titleEl.classList.remove("hidden");
            titleEl.textContent = movie.title || "Filme em Destaque";
        }

        if (movie.id && logoEl) {
            fetchTmdbEndpoint(`movie/${movie.id}/images?include_image_language=pt,en,null`).then(imgData => {
                if (imgData && imgData.logos && imgData.logos.length > 0) {
                    const ptLogo = imgData.logos.find(l => l.iso_639_1 === 'pt');
                    const enLogo = imgData.logos.find(l => l.iso_639_1 === 'en');
                    const chosenLogo = ptLogo || enLogo || imgData.logos[0];
                    if (chosenLogo && chosenLogo.file_path) {
                        movie.logo_url = `${TMDB_IMG_W500}${chosenLogo.file_path}`;
                        const img = new Image();
                        img.src = movie.logo_url;
                        img.onload = () => {
                            if (heroMoviesList[currentHeroIndex] && heroMoviesList[currentHeroIndex].id === movie.id) {
                                logoEl.src = movie.logo_url;
                                logoEl.classList.remove("hidden");
                                if (titleEl) titleEl.classList.add("hidden");
                            }
                        };
                    } else {
                        movie.has_no_logo = true;
                    }
                } else {
                    movie.has_no_logo = true;
                }
            }).catch(() => {
                movie.has_no_logo = true;
            });
        }
    }

    if (yearEl) yearEl.textContent = (movie.release_date || '').substring(0, 4) || 'Cinema';
    if (ratingEl) ratingEl.textContent = `★ ${movie.vote_average ? movie.vote_average.toFixed(1) : '8.5'}`;
    if (overviewEl) overviewEl.textContent = movie.overview || "Uma emocionante experiência cinematográfica disponível para assistir online agora.";

    if (genresEl && movie.genre_ids && Array.isArray(movie.genre_ids)) {
        genresEl.innerHTML = movie.genre_ids.slice(0, 3).map(id => {
            const genreName = TMDB_GENRES[id];
            return genreName ? `<span class="movies-genre-tag">${genreName}</span>` : '';
        }).join('');
    }

    if (btnWatch) {
        btnWatch.onclick = () => openMovieDetailsModal(movie, true);
    }
}

export function setupMoviesCarouselNavigation() {
    document.querySelectorAll('.btn-carousel-arrow').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const trackId = btn.getAttribute('data-track');
            const track = document.getElementById(trackId);
            if (!track) return;
            const isNext = btn.classList.contains('btn-next');
            const scrollDistance = 382;
            track.scrollBy({
                left: isNext ? scrollDistance : -scrollDistance,
                behavior: 'smooth'
            });
        });
    });
}

function populateTrack(trackId, movies) {
    const track = document.getElementById(trackId);
    if (!track) return;
    track.innerHTML = "";
    if (!movies || movies.length === 0) {
        track.innerHTML = `<p style="color: #71717a; font-size: 0.82rem; padding: 10px;">Nenhum título disponível no momento.</p>`;
        return;
    }

    const fragment = document.createDocumentFragment();
    movies.forEach(movie => {
        fragment.appendChild(createMovieCardElement(movie));
    });
    track.appendChild(fragment);
}

function populateDirectorsTrack(trackId, directors) {
    const track = document.getElementById(trackId);
    if (!track) return;
    track.innerHTML = "";
    const fragment = document.createDocumentFragment();

    directors.forEach(director => {
        const card = document.createElement("div");
        card.className = "director-card";
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", `Diretor: ${director.name}`);

        card.innerHTML = `
            <img class="director-avatar" src="${director.photo}" alt="${director.name}" loading="lazy" onerror="this.src='assets/logos/fav/icon-detailed.svg'">
            <h4 class="director-name">${director.name}</h4>
            <span class="director-meta">${director.knownFor}</span>
        `;

        card.addEventListener("click", () => openCollectionView('director', director));
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openCollectionView('director', director);
            }
        });

        fragment.appendChild(card);
    });

    track.appendChild(fragment);
}

function populateStudiosTrack(trackId, studios) {
    const track = document.getElementById(trackId);
    if (!track) return;
    track.innerHTML = "";
    const fragment = document.createDocumentFragment();

    studios.forEach(studio => {
        const card = document.createElement("div");
        card.className = "studio-card";
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", `Estúdio: ${studio.name}`);

        card.innerHTML = `
            <div class="studio-logo-wrapper">
                <img class="studio-logo-img" src="${studio.logo}" alt="${studio.name}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';">
                <span class="studio-fallback-name" style="display:none;">${studio.badge || studio.name}</span>
            </div>
            <h4 class="studio-name">${studio.name}</h4>
        `;

        card.addEventListener("click", () => openCollectionView('studio', studio));
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openCollectionView('studio', studio);
            }
        });

        fragment.appendChild(card);
    });

    track.appendChild(fragment);
}

function renderPaginationControls(containerId, currentPage, totalPages, totalResults, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (totalPages <= 1) {
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
            ${totalResults ? ` • <span class="pagination-total-count">${formattedTotal} filmes no catálogo</span>` : ''}
        </div>
        <div class="pagination-nav-group">
            <button class="btn-pagination-nav btn-page-prev" ${currentPage <= 1 ? 'disabled' : ''} aria-label="Página anterior">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                <span>Anterior</span>
            </button>
            <div class="pagination-numbers-list">
                ${pagesHtml}
            </div>
            <button class="btn-pagination-nav btn-page-next" ${currentPage >= effectiveTotalPages ? 'disabled' : ''} aria-label="Próxima página">
                <span>Próxima</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
        </div>
    `;

    const btnPrev = container.querySelector(".btn-page-prev");
    const btnNext = container.querySelector(".btn-page-next");

    if (btnPrev && currentPage > 1) {
        btnPrev.addEventListener("click", () => onPageChange(currentPage - 1));
    }
    if (btnNext && currentPage < effectiveTotalPages) {
        btnNext.addEventListener("click", () => onPageChange(currentPage + 1));
    }

    container.querySelectorAll(".btn-page-number").forEach(btn => {
        btn.addEventListener("click", () => {
            const targetPage = Number(btn.getAttribute("data-page"));
            if (targetPage && targetPage !== currentPage) {
                onPageChange(targetPage);
            }
        });
    });
}

export function openExploreView(autoFocus = false) {
    const moviesExploreView = document.getElementById("movies-explore-view");
    const discoveryFeed = document.getElementById("movies-discovery-feed");
    const collectionSection = document.getElementById("movies-collection-section");
    const exploreSearchInput = document.getElementById("explore-search-input");
    const moviesSearchInput = document.getElementById("movies-search-input");
    const btnClearExploreSearch = document.getElementById("btn-clear-explore-search");

    if (!moviesExploreView) return;

    const wasHidden = moviesExploreView.classList.contains("hidden");
    moviesExploreView.classList.remove("hidden");
    if (discoveryFeed) discoveryFeed.classList.add("hidden");
    if (collectionSection) collectionSection.classList.add("hidden");
    if (wasHidden) {
        pushNavLayer('explore-movies');
    }

    // Sync input values
    const initialQuery = moviesSearchInput ? moviesSearchInput.value.trim() : '';
    if (exploreSearchInput) {
        exploreSearchInput.value = initialQuery;
        if (btnClearExploreSearch) {
            btnClearExploreSearch.classList.toggle("hidden", initialQuery.length === 0);
        }
        if (autoFocus) {
            setTimeout(() => exploreSearchInput.focus(), 80);
        }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    executeFilteredCatalogSearch(1);
}

export function closeExploreView() {
    const moviesExploreView = document.getElementById("movies-explore-view");
    const discoveryFeed = document.getElementById("movies-discovery-feed");
    const moviesSearchInput = document.getElementById("movies-search-input");
    const exploreSearchInput = document.getElementById("explore-search-input");
    const btnClearExploreSearch = document.getElementById("btn-clear-explore-search");
    const btnClearMovieSearch = document.getElementById("btn-clear-movie-search");
    const exploreGenresChips = document.getElementById("explore-genres-chips");
    const exploreTimelineChips = document.getElementById("explore-timeline-chips");
    const sortCurrentLabel = document.getElementById("sort-current-label");
    const exploreSortDropdownMenu = document.getElementById("explore-sort-dropdown-menu");
    const btnExploreSortDropdown = document.getElementById("btn-explore-sort-dropdown");
    const categoryPills = document.getElementById("movies-category-pills");

    const wasOpen = moviesExploreView && !moviesExploreView.classList.contains("hidden");
    if (moviesExploreView) moviesExploreView.classList.add("hidden");
    if (discoveryFeed) discoveryFeed.classList.remove("hidden");
    if (wasOpen) {
        popNavLayer();
    }

    if (exploreSearchInput) exploreSearchInput.value = "";
    if (moviesSearchInput) moviesSearchInput.value = "";
    if (btnClearExploreSearch) btnClearExploreSearch.classList.add("hidden");
    if (btnClearMovieSearch) btnClearMovieSearch.classList.add("hidden");

    activeFilterGenre = '';
    activeFilterYearRange = '';
    activeFilterSort = 'popularity.desc';

    if (sortCurrentLabel) sortCurrentLabel.textContent = "Populares";
    if (exploreSortDropdownMenu) {
        exploreSortDropdownMenu.classList.add("hidden");
        exploreSortDropdownMenu.querySelectorAll(".sort-dropdown-item").forEach(it => {
            it.classList.toggle("active", it.dataset.sort === 'popularity.desc');
        });
    }
    if (btnExploreSortDropdown) btnExploreSortDropdown.setAttribute("aria-expanded", "false");

    if (exploreGenresChips) {
        exploreGenresChips.querySelectorAll(".explore-chip").forEach(c => c.classList.toggle("active", c.dataset.genre === ""));
    }
    if (exploreTimelineChips) {
        exploreTimelineChips.querySelectorAll(".explore-chip").forEach(c => c.classList.toggle("active", c.dataset.yearRange === ""));
    }
    if (categoryPills) {
        categoryPills.querySelectorAll(".movie-pill").forEach(p => p.classList.toggle("active", p.dataset.target === "all"));
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export async function executeFilteredCatalogSearch(page = 1) {
    const exploreSearchInput = document.getElementById("explore-search-input");
    const moviesSearchInput = document.getElementById("movies-search-input");
    const explorePosterGrid = document.getElementById("explore-poster-grid");
    const exploreSectionTitle = document.getElementById("explore-section-title");
    const exploreResultsCount = document.getElementById("explore-results-count");
    const exploreActiveTags = document.getElementById("explore-active-tags");
    const moviesExploreView = document.getElementById("movies-explore-view");

    const query = (exploreSearchInput ? exploreSearchInput.value.trim() : '') || (moviesSearchInput ? moviesSearchInput.value.trim() : '');

    if (explorePosterGrid) {
        explorePosterGrid.innerHTML = `<p style="color:#a1a1aa; grid-column: 1/-1; padding: 30px 0; text-align:center;">Buscando títulos no catálogo (página ${page})...</p>`;
    }

    if (page === 1) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (moviesExploreView) {
        moviesExploreView.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Active tags renderer
    if (exploreActiveTags) {
        const tags = [];
        if (activeFilterGenre) {
            const genreName = TMDB_GENRES[activeFilterGenre] || "Gênero";
            tags.push({ label: `Gênero: ${genreName}`, type: 'genre' });
        }
        if (activeFilterYearRange) {
            tags.push({ label: `Época: ${activeFilterYearRange}`, type: 'year' });
        }

        if (tags.length === 0) {
            exploreActiveTags.innerHTML = "";
        } else {
            exploreActiveTags.innerHTML = tags.map(t => `
                <span class="active-filter-tag">
                    <span>${t.label}</span>
                    <button type="button" class="btn-remove-tag" data-tag-type="${t.type}" aria-label="Remover filtro">&times;</button>
                </span>
            `).join('');

            exploreActiveTags.querySelectorAll(".btn-remove-tag").forEach(btn => {
                btn.addEventListener("click", () => {
                    const tagType = btn.dataset.tagType;
                    if (tagType === 'genre') {
                        activeFilterGenre = '';
                        const chips = document.getElementById("explore-genres-chips");
                        if (chips) chips.querySelectorAll(".explore-chip").forEach(c => c.classList.toggle("active", c.dataset.genre === ""));
                    } else if (tagType === 'year') {
                        activeFilterYearRange = '';
                        const chips = document.getElementById("explore-timeline-chips");
                        if (chips) chips.querySelectorAll(".explore-chip").forEach(c => c.classList.toggle("active", c.dataset.yearRange === ""));
                    }
                    executeFilteredCatalogSearch(1);
                });
            });
        }
    }

    try {
        let endpoint = '';
        const todayDate = new Date().toISOString().split('T')[0];

        if (query) {
            if (exploreSectionTitle) exploreSectionTitle.textContent = `Resultados para "${query}"`;
            endpoint = `search/movie?query=${encodeURIComponent(query)}&page=${page}`;
        } else {
            if (exploreSectionTitle) exploreSectionTitle.textContent = `Catálogo Completo de Filmes`;

            let effectiveSort = activeFilterSort;
            let params = `discover/movie?sort_by=${effectiveSort}&page=${page}`;
            if (activeFilterGenre) params += `&with_genres=${activeFilterGenre}`;

            if (activeFilterYearRange) {
                const [startYear, endYear] = activeFilterYearRange.split('-');
                const currentYear = new Date().getFullYear();
                const effectiveEnd = (Number(endYear) >= currentYear) ? todayDate : `${endYear}-12-31`;
                params += `&primary_release_date.gte=${startYear}-01-01&primary_release_date.lte=${effectiveEnd}`;
            } else {
                params += `&primary_release_date.lte=${todayDate}`;
            }

            if (effectiveSort.includes('release_date')) {
                params += `&vote_count.gte=5`;
            }

            endpoint = params;
        }

        // Text + filter: TMDB's search ignores the filters, so they are applied over the first search pages
        const filterWithText = query && (activeFilterGenre || activeFilterYearRange || activeFilterSort !== 'popularity.desc');
        const data = filterWithText
            ? await filteredSearchPage({
                key: `movie|${query}|${activeFilterGenre}|${activeFilterYearRange}|${activeFilterSort}`,
                fetchPage: n => fetchTmdbEndpoint(`search/movie?query=${encodeURIComponent(query)}&page=${n}`),
                keep: m => Boolean(m.poster_path) && (!m.release_date || m.release_date <= todayDate)
                    && (!activeFilterGenre || (m.genre_ids || []).includes(Number(activeFilterGenre)))
                    && inYearRange(m.release_date, activeFilterYearRange),
                sort: activeFilterSort,
                dateField: 'release_date',
                page,
            })
            : await fetchTmdbEndpoint(endpoint);
        let results = (data.results || []).filter(m => m.poster_path);

        // Enforce strict release check: never allow titles with a release date in the future
        results = results.filter(m => {
            const itemDate = m.release_date;
            if (itemDate && itemDate > todayDate) return false;
            return true;
        });

        if (query && activeFilterGenre) {
            results = results.filter(m => m.genre_ids && m.genre_ids.includes(Number(activeFilterGenre)));
        }

        const totalFormatted = (data.total_results || results.length).toLocaleString('pt-BR');
        if (exploreResultsCount) {
            exploreResultsCount.textContent = `${totalFormatted} filmes encontrados`;
        }

        if (explorePosterGrid) {
            explorePosterGrid.innerHTML = "";
            if (results.length === 0) {
                explorePosterGrid.innerHTML = `<p style="color:#71717a; grid-column: 1/-1; padding: 40px 0; text-align: center;">Nenhum filme encontrado para os filtros selecionados.</p>`;
                renderPaginationControls("explore-pagination", 1, 0, 0, () => {});
                return;
            }
            const fragment = document.createDocumentFragment();
            results.forEach(m => {
                fragment.appendChild(createMovieCardElement(m));
            });
            explorePosterGrid.appendChild(fragment);
        }

        renderPaginationControls(
            "explore-pagination",
            data.page || page,
            data.total_pages || 1,
            data.total_results || results.length,
            (newPage) => executeFilteredCatalogSearch(newPage)
        );
    } catch (err) {
        console.error("[Movies] Erro na busca de títulos:", err);
        if (explorePosterGrid) explorePosterGrid.innerHTML = `<p style="color:#f87171; grid-column: 1/-1; padding: 30px 0; text-align: center;">Erro ao carregar o catálogo. Verifique sua conexão e tente novamente.</p>`;
        renderPaginationControls("explore-pagination", 1, 0, 0, () => {});
    }
}

export function setupMoviesSearchAndFilters() {
    const moviesSearchInput = document.getElementById("movies-search-input");
    const btnClearMovieSearch = document.getElementById("btn-clear-movie-search");
    const btnOpenMovieExplore = document.getElementById("btn-open-movie-explore");
    const spotlightContainer = document.getElementById("spotlight-search-container");

    const btnExploreBack = document.getElementById("btn-explore-back");
    const exploreSearchInput = document.getElementById("explore-search-input");
    const btnClearExploreSearch = document.getElementById("btn-clear-explore-search");

    const btnExploreSortDropdown = document.getElementById("btn-explore-sort-dropdown");
    const exploreSortDropdownMenu = document.getElementById("explore-sort-dropdown-menu");
    const sortCurrentLabel = document.getElementById("sort-current-label");
    const exploreGenresChips = document.getElementById("explore-genres-chips");
    const exploreTimelineChips = document.getElementById("explore-timeline-chips");
    const categoryPills = document.getElementById("movies-category-pills");

    // Trigger open explore view
    if (btnOpenMovieExplore) {
        btnOpenMovieExplore.addEventListener("click", () => openExploreView(false));
    }

    if (moviesSearchInput) {
        moviesSearchInput.addEventListener("focus", () => openExploreView(true));
        moviesSearchInput.addEventListener("input", () => openExploreView(false));
    }

    if (spotlightContainer) {
        spotlightContainer.addEventListener("click", (e) => {
            if (e.target.closest("#btn-clear-movie-search")) return;
            openExploreView(true);
        });
    }

    if (btnExploreBack) {
        btnExploreBack.addEventListener("click", closeExploreView);
    }

    const btnCollectionBack = document.getElementById("btn-collection-back");
    if (btnCollectionBack) {
        btnCollectionBack.addEventListener("click", () => {
            closeCollectionView();
        });
    }

    // Sort Dropdown
    if (btnExploreSortDropdown && exploreSortDropdownMenu) {
        btnExploreSortDropdown.addEventListener("click", (e) => {
            e.stopPropagation();
            const isExpanded = !exploreSortDropdownMenu.classList.contains("hidden");
            exploreSortDropdownMenu.classList.toggle("hidden", isExpanded);
            btnExploreSortDropdown.setAttribute("aria-expanded", String(!isExpanded));
        });

        document.addEventListener("click", (e) => {
            if (!exploreSortDropdownMenu.contains(e.target) && !btnExploreSortDropdown.contains(e.target)) {
                exploreSortDropdownMenu.classList.add("hidden");
                btnExploreSortDropdown.setAttribute("aria-expanded", "false");
            }
        });

        exploreSortDropdownMenu.querySelectorAll(".sort-dropdown-item").forEach(item => {
            item.addEventListener("click", (e) => {
                e.stopPropagation();
                exploreSortDropdownMenu.querySelectorAll(".sort-dropdown-item").forEach(it => it.classList.remove("active"));
                item.classList.add("active");
                activeFilterSort = item.dataset.sort || 'popularity.desc';
                if (sortCurrentLabel) {
                    const rawText = item.querySelector(".sort-item-text")?.textContent || "Populares";
                    sortCurrentLabel.textContent = rawText.replace("Mais ", "").replace("Melhor ", "");
                }
                exploreSortDropdownMenu.classList.add("hidden");
                btnExploreSortDropdown.setAttribute("aria-expanded", "false");
                executeFilteredCatalogSearch(1);
            });
        });
    }

    // Chips filter handlers
    if (exploreGenresChips) {
        exploreGenresChips.addEventListener("click", (e) => {
            const chip = e.target.closest(".explore-chip");
            if (!chip) return;
            exploreGenresChips.querySelectorAll(".explore-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            activeFilterGenre = chip.dataset.genre || '';
            executeFilteredCatalogSearch(1);
        });
    }

    if (exploreTimelineChips) {
        exploreTimelineChips.addEventListener("click", (e) => {
            const chip = e.target.closest(".explore-chip");
            if (!chip) return;
            exploreTimelineChips.querySelectorAll(".explore-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            activeFilterYearRange = chip.dataset.yearRange || '';
            executeFilteredCatalogSearch(1);
        });
    }

    // Search inputs synchronization & live debounced search
    function setupSearchInputHandlers(inputEl, clearBtn) {
        if (!inputEl) return;
        inputEl.addEventListener("input", () => {
            const val = inputEl.value.trim();
            if (clearBtn) clearBtn.classList.toggle("hidden", val.length === 0);
            if (exploreSearchInput && inputEl !== exploreSearchInput) exploreSearchInput.value = val;
            if (moviesSearchInput && inputEl !== moviesSearchInput) moviesSearchInput.value = val;

            clearTimeout(movieSearchDebounceTimer);
            movieSearchDebounceTimer = setTimeout(() => {
                executeFilteredCatalogSearch(1);
            }, 320);
        });

        if (clearBtn) {
            clearBtn.addEventListener("click", () => {
                inputEl.value = "";
                if (exploreSearchInput) exploreSearchInput.value = "";
                if (moviesSearchInput) moviesSearchInput.value = "";
                clearBtn.classList.add("hidden");
                inputEl.focus();
                executeFilteredCatalogSearch(1);
            });
        }
    }

    setupSearchInputHandlers(exploreSearchInput, btnClearExploreSearch);
    setupSearchInputHandlers(moviesSearchInput, btnClearMovieSearch);

    // Category pills smooth scroll
    if (categoryPills) {
        categoryPills.addEventListener("click", (e) => {
            const pill = e.target.closest(".movie-pill");
            if (!pill) return;
            categoryPills.querySelectorAll(".movie-pill").forEach(p => p.classList.remove("active"));
            pill.classList.add("active");

            const exploreView = document.getElementById("movies-explore-view");
            if (exploreView && !exploreView.classList.contains("hidden")) {
                closeExploreView();
            }

            const target = pill.dataset.target || pill.dataset.filter;
            if (target === "all") {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                const targetEl = document.getElementById(target.startsWith("row-") ? target : `row-${target}`);
                if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    }
}

export async function openCollectionView(type, item, page = 1) {
    const collectionSection = document.getElementById("movies-collection-section");
    const discoveryFeed = document.getElementById("movies-discovery-feed");
    const exploreView = document.getElementById("movies-explore-view");
    const grid = document.getElementById("movies-collection-grid");
    const titleEl = document.getElementById("collection-title");
    const metaEl = document.getElementById("collection-meta");
    const badgeEl = document.getElementById("collection-badge");
    const avatarEl = document.getElementById("collection-avatar");

    if (!collectionSection || !grid) return;

    if (exploreView) exploreView.classList.add("hidden");
    if (discoveryFeed) discoveryFeed.classList.add("hidden");
    const wasCollectionHidden = collectionSection.classList.contains("hidden");
    collectionSection.classList.remove("hidden");
    if (page === 1 && wasCollectionHidden) {
        pushNavLayer('collection-movies');
    }

    if (page === 1) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        collectionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    grid.innerHTML = `<p style="color:#a1a1aa; grid-column:1/-1; padding:30px 0; text-align:center;">Carregando títulos...</p>`;

    if (type === 'director') {
        if (badgeEl) badgeEl.textContent = "Mestre da Direção";
        if (titleEl) titleEl.textContent = item.name;
        if (metaEl) metaEl.textContent = `Filmografia Selecionada • ${item.knownFor}`;
        if (avatarEl) {
            avatarEl.src = item.photo;
            avatarEl.classList.remove("collection-logo");
            avatarEl.classList.remove("hidden");
        }

        try {
            const data = await fetchTmdbEndpoint(`discover/movie?with_crew=${item.id}&sort_by=vote_average.desc&vote_count.gte=30&page=${page}`);
            const results = (data.results || []).filter(m => m.poster_path);
            grid.innerHTML = "";
            if (results.length === 0) {
                grid.innerHTML = `<p style="color:#71717a; grid-column:1/-1; padding:30px 0; text-align:center;">Nenhum título encontrado para este diretor.</p>`;
                renderPaginationControls("movies-collection-pagination", 1, 0, 0, () => {});
                return;
            }
            const fragment = document.createDocumentFragment();
            results.forEach(m => fragment.appendChild(createMovieCardElement(m)));
            grid.appendChild(fragment);

            renderPaginationControls(
                "movies-collection-pagination",
                data.page || page,
                data.total_pages || 1,
                data.total_results || results.length,
                (newPage) => openCollectionView(type, item, newPage)
            );
        } catch (e) {
            console.error("Erro ao carregar coleção:", e);
            grid.innerHTML = `<p style="color:#f87171; grid-column:1/-1;">Erro ao carregar títulos deste diretor.</p>`;
            renderPaginationControls("movies-collection-pagination", 1, 0, 0, () => {});
        }
    } else {
        if (badgeEl) badgeEl.textContent = "Grande Estúdio & Produtora";
        if (titleEl) titleEl.textContent = item.name;
        if (metaEl) metaEl.textContent = `Produções Notáveis • ${item.badge || 'Estúdio'}`;
        if (avatarEl) {
            avatarEl.src = item.logo;
            avatarEl.classList.add("collection-logo");
            avatarEl.classList.remove("hidden");
        }

        try {
            const data = await fetchTmdbEndpoint(`discover/movie?with_companies=${item.id}&sort_by=popularity.desc&page=${page}`);
            const results = (data.results || []).filter(m => m.poster_path);
            grid.innerHTML = "";
            if (results.length === 0) {
                grid.innerHTML = `<p style="color:#71717a; grid-column:1/-1; padding:30px 0; text-align:center;">Nenhum título encontrado para este estúdio.</p>`;
                renderPaginationControls("movies-collection-pagination", 1, 0, 0, () => {});
                return;
            }
            const fragment = document.createDocumentFragment();
            results.forEach(m => fragment.appendChild(createMovieCardElement(m)));
            grid.appendChild(fragment);

            renderPaginationControls(
                "movies-collection-pagination",
                data.page || page,
                data.total_pages || 1,
                data.total_results || results.length,
                (newPage) => openCollectionView(type, item, newPage)
            );
        } catch (e) {
            console.error("Erro ao carregar coleção:", e);
            grid.innerHTML = `<p style="color:#f87171; grid-column:1/-1;">Erro ao carregar títulos deste estúdio.</p>`;
            renderPaginationControls("movies-collection-pagination", 1, 0, 0, () => {});
        }
    }
}

export function closeCollectionView() {
    const collectionSection = document.getElementById("movies-collection-section");
    const discoveryFeed = document.getElementById("movies-discovery-feed");
    const moviesExploreView = document.getElementById("movies-explore-view");
    const wasOpen = collectionSection && !collectionSection.classList.contains("hidden");
    if (collectionSection) collectionSection.classList.add("hidden");
    if (moviesExploreView && !moviesExploreView.classList.contains("hidden")) {
        // Stay in explore
    } else if (discoveryFeed) {
        discoveryFeed.classList.remove("hidden");
    }
    renderPaginationControls("movies-collection-pagination", 1, 0, 0, () => {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (wasOpen) {
        popNavLayer();
    }
}

export function setupMovieModal() {
    const modal = document.getElementById("movie-modal");
    const btnClose = document.getElementById("btn-close-movie-modal");
    const btnReload = document.getElementById("btn-reload-movie-player");
    const btnClosePlayer = document.getElementById("btn-close-movie-player");
    const btnExitPlayer = document.getElementById("btn-exit-movie-player");

    if (btnClose) {
        btnClose.addEventListener("click", () => closeMovieDetailsModal());
    }

    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeMovieDetailsModal();
        });
    }

    if (btnReload) {
        btnReload.addEventListener("click", () => {
            if (activeMovieServer && currentSelectedMovie) {
                selectMovieServer(activeMovieServer);
            }
        });
    }

    // X: leave to the Filmes catalog. The (hidden) back-to-details step runs first so the player's history
    // layer is popped before the modal's own.
    if (btnExitPlayer) {
        btnExitPlayer.addEventListener("click", () => {
            runNavBatch(() => {
                if (btnClosePlayer) btnClosePlayer.click();
                closeMovieDetailsModal();
            });
            // The grouped history step settles a moment later; changing tabs before that would mix with it
            setTimeout(() => {
                if (window.TvzinhaActions && store.currentView !== 'movies') {
                    window.TvzinhaActions.switchView('movies');
                }
            }, 150);
        });
    }

    if (btnClosePlayer) {
        btnClosePlayer.addEventListener("click", () => {
            const modalCard = document.querySelector(".movie-modal-card");
            const playerContainer = document.getElementById("movie-modal-player-container");
            const wasPlaying = (modalCard && modalCard.classList.contains("is-playing")) || (playerContainer && !playerContainer.classList.contains("hidden"));

            atomicPlayerReset();
            removeMovieIframe();
            const backdropBox = document.getElementById("movie-modal-backdrop-box");

            if (playerContainer) playerContainer.classList.add("hidden");
            if (backdropBox) backdropBox.classList.remove("hidden");
            leaveStageFullscreen();
            if (modalCard) modalCard.classList.remove("is-playing");
            document.querySelectorAll(".btn-movie-server").forEach(btn => btn.classList.remove("active"));
            activeMovieServer = null;

            if (wasPlaying) {
                popNavLayer();
            }
        });
    }
}

export function openMovieDetailsModal(movie, autoplayFirstServer = false) {
    currentSelectedMovie = movie;
    const modal = document.getElementById("movie-modal");
    if (!modal) return;

    removeMovieIframe();
    const playerContainer = document.getElementById("movie-modal-player-container");
    const backdropBox = document.getElementById("movie-modal-backdrop-box");
    const modalCard = document.querySelector(".movie-modal-card");
    if (playerContainer) playerContainer.classList.add("hidden");
    if (backdropBox) backdropBox.classList.remove("hidden");
    leaveStageFullscreen();
    if (modalCard) modalCard.classList.remove("is-playing");

    const backdropImg = document.getElementById("movie-modal-backdrop-img");
    const titleEl = document.getElementById("movie-modal-title");
    const yearEl = document.getElementById("movie-modal-year");
    const ratingEl = document.getElementById("movie-modal-rating");
    const overviewEl = document.getElementById("movie-modal-overview");

    const backdropUrl = movie.backdrop_path
        ? `${TMDB_IMG_ORIGINAL}${movie.backdrop_path}`
        : (movie.poster_path ? `${TMDB_IMG_W500}${movie.poster_path}` : '');

    if (backdropImg) backdropImg.src = backdropUrl;
    if (titleEl) titleEl.textContent = movie.title;
    if (yearEl) yearEl.textContent = (movie.release_date || '').substring(0, 4) || 'Cinema';
    if (ratingEl) ratingEl.textContent = `★ ${movie.vote_average ? movie.vote_average.toFixed(1) : '8.0'}`;
    if (overviewEl) overviewEl.textContent = movie.overview || "Sinopse não disponível em português.";

    const serversGrid = document.getElementById("movie-servers-grid");
    if (serversGrid) {
        serversGrid.innerHTML = "";
        MOVIE_SERVERS.forEach((server, idx) => {
            const btn = document.createElement("button");
            btn.className = server.isNative ? "btn-movie-server native-direct" : "btn-movie-server";
            btn.innerHTML = server.isNative 
                ? `<span>${server.name}</span>`
                : `<span>${server.name}</span><span style="font-size: 0.72rem; color: #a1a1aa; opacity: 0.85;">Reproduzir</span>`;
            btn.addEventListener("click", () => selectMovieServer(server, btn));
            serversGrid.appendChild(btn);

            if (autoplayFirstServer && idx === 0) {
                if (pendingMovieAutoplayTimer) clearTimeout(pendingMovieAutoplayTimer);
                pendingMovieAutoplayTimer = setTimeout(() => {
                    const currentModal = document.getElementById("movie-modal");
                    if (currentModal && !currentModal.classList.contains("hidden")) {
                        selectMovieServer(server, btn);
                    }
                }, 150);
            }
        });
    }

    const wasHidden = modal.classList.contains("hidden");
    modal.classList.remove("hidden");
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.documentElement.classList.add("modal-open");
    document.body.classList.add("modal-open");
    if (wasHidden) {
        pushNavLayer('modal-movie', { id: movie.id });
    }
}

export function closeMovieDetailsModal() {
    moviePlaybackSessionId++;
    leaveStageFullscreen();
    if (pendingMovieAutoplayTimer) {
        clearTimeout(pendingMovieAutoplayTimer);
        pendingMovieAutoplayTimer = null;
    }
    if (pendingMovieIframeTimer) {
        clearTimeout(pendingMovieIframeTimer);
        pendingMovieIframeTimer = null;
    }
    atomicPlayerReset();
    const modal = document.getElementById("movie-modal");
    const wasOpen = modal && !modal.classList.contains("hidden");
    if (modal) modal.classList.add("hidden");
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
    document.documentElement.classList.remove("modal-open");
    document.body.classList.remove("modal-open");
    if (wasOpen) {
        popNavLayer();
    }
}

export function selectMovieServer(server, buttonElement = null) {
    if (!currentSelectedMovie) return;
    const currentSessionId = ++moviePlaybackSessionId;
    if (pendingMovieIframeTimer) {
        clearTimeout(pendingMovieIframeTimer);
        pendingMovieIframeTimer = null;
    }
    if (pendingMovieAutoplayTimer) {
        clearTimeout(pendingMovieAutoplayTimer);
        pendingMovieAutoplayTimer = null;
    }
    activeMovieServer = server;

    document.querySelectorAll(".btn-movie-server").forEach(b => b.classList.remove("active"));
    if (buttonElement) {
        buttonElement.classList.add("active");
    }

    const playerContainer = document.getElementById("movie-modal-player-container");
    const backdropBox = document.getElementById("movie-modal-backdrop-box");
    const serverTitle = document.getElementById("movie-player-server-title");
    const movieArt = document.getElementById("movie-artplayer-container");
    const modalCard = document.querySelector(".movie-modal-card");
    const movieLoader = document.getElementById("movie-player-loader");
    const wasPlaying = (modalCard && modalCard.classList.contains("is-playing")) || (playerContainer && !playerContainer.classList.contains("hidden"));

    if (serverTitle) {
        serverTitle.textContent = currentSelectedMovie.title || server.name;
        serverTitle.title = currentSelectedMovie.title || server.name;
    }
    if (backdropBox) backdropBox.classList.add("hidden");
    if (playerContainer) playerContainer.classList.remove("hidden");
    if (modalCard) modalCard.classList.add("is-playing");
    if (!wasPlaying) {
        pushNavLayer('player-movie');
    }

    if (server.isNative) {
        removeMovieIframe();
        setLoaderText(movieLoader, "Buscando fontes...");
        if (movieLoader) movieLoader.classList.remove("hidden");

        resolveDirectStream({
            id: currentSelectedMovie.id,
            type: "movie",
            title: currentSelectedMovie.title,
            imdb_id: currentSelectedMovie.imdb_id || null
        }).then(data => {
            const currentModal = document.getElementById("movie-modal");
            if (currentSessionId !== moviePlaybackSessionId || !currentModal || currentModal.classList.contains("hidden")) {
                console.warn("[Movies] Abortando montagem nativa: reprodução cancelada ou modal fechado.");
                return;
            }
            if (movieLoader) movieLoader.classList.add("hidden");
            if (!data || !data.primary_source) {
                showToast("Fontes diretas indisponíveis para este filme. Selecione outro servidor abaixo se desejar.");
                if (movieArt) {
                    movieArt.innerHTML = `
                        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#a1a1aa;padding:32px 20px;text-align:center;background:radial-gradient(circle at center, rgba(30,41,59,0.5) 0%, rgba(10,12,16,0.95) 100%);border-radius:12px;">
                            <svg width="44" height="44" fill="none" stroke="#eab308" stroke-width="1.6" viewBox="0 0 24 24" style="margin-bottom:12px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 7.5h.008v.008H12v-.008z"/></svg>
                            <div style="font-size:16px;font-weight:600;color:#fff;margin-bottom:6px;">Stream nativo indisponível</div>
                            <div style="font-size:13px;max-width:380px;line-height:1.5;">Não encontramos transmissões diretas sem anúncios ativas para este título no momento. Por favor, escolha um dos servidores alternativos abaixo.</div>
                        </div>`;
                    movieArt.classList.remove("hidden");
                }
                return;
            }

            const backdropUrl = currentSelectedMovie.backdrop_path
                ? `${TMDB_IMG_ORIGINAL}${currentSelectedMovie.backdrop_path}`
                : '';

            mountNativePlayer({
                containerId: "movie-artplayer-container",
                sources: [data.primary_source, ...(data.fallback_sources || [])],
                title: data.title || currentSelectedMovie.title,
                poster: backdropUrl,
                subtitles: data.subtitles || [],
                onAllFailed: () => {
                    showToast("Todas as fontes diretas falharam. Selecione outro servidor abaixo se desejar.");
                    if (movieArt) {
                        movieArt.innerHTML = `
                            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#a1a1aa;padding:32px 20px;text-align:center;background:radial-gradient(circle at center, rgba(30,41,59,0.5) 0%, rgba(10,12,16,0.95) 100%);border-radius:12px;">
                                <svg width="44" height="44" fill="none" stroke="#ef4444" stroke-width="1.6" viewBox="0 0 24 24" style="margin-bottom:12px;"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                                <div style="font-size:16px;font-weight:600;color:#fff;margin-bottom:6px;">Falha na reprodução nativa</div>
                                <div style="font-size:13px;max-width:380px;line-height:1.5;">Os links diretos deste filme estão temporariamente instáveis. Selecione um servidor alternativo abaixo para continuar assistindo.</div>
                            </div>`;
                        movieArt.classList.remove("hidden");
                    }
                }
            });
        }).catch(err => {
            if (movieLoader) movieLoader.classList.add("hidden");
            showToast("Erro ao conectar ao motor de streaming nativo.");
        });
        return;
    }

    // Handle Alternative Iframe Servers
    atomicPlayerReset();
    if (movieArt) {
        movieArt.innerHTML = "";
        movieArt.classList.add("hidden");
    }
    const iframe = getOrCreateMovieIframe();
    if (iframe) {
        if (window.tvzinhaArmIframeGuard) window.tvzinhaArmIframeGuard(iframe);
        if (window.tvzinhaSetContingencyState) window.tvzinhaSetContingencyState(true);
        iframe.classList.remove("hidden");
        setLoaderText(movieLoader, "Carregando filme...");
        if (movieLoader) movieLoader.classList.remove("hidden");

        const embedUrl = server.buildUrl(currentSelectedMovie.id);
        pendingMovieIframeTimer = setTimeout(() => {
            const currentModal = document.getElementById("movie-modal");
            if (currentSessionId !== moviePlaybackSessionId || !currentModal || currentModal.classList.contains("hidden")) {
                console.warn("[Movies] Abortando carregamento de iframe: modal fechado antes de montar.");
                return;
            }
            iframe.src = embedUrl;
        }, 30);

        iframe.onload = () => {
            if (movieLoader) movieLoader.classList.add("hidden");
            setPlaybackActiveState(true);
        };
        setTimeout(() => {
            if (movieLoader) movieLoader.classList.add("hidden");
        }, 3000);
    }
}

export function resetMoviesViewState() {
    closeExploreView();
}
