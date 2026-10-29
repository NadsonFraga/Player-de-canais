/**
 * TVZINHA ONLINE - Channels Catalog & TV Interface Module
 * Handles channel data fetching, category filtering, search, sidebar accordion,
 * Home screen quick-cards grid, and pixel-perfect TV player view.
 */

import { store } from '../core/state.js?v=20261029_0112';
import { FALLBACK_CHANNELS } from '../core/fallbackChannels.js?v=20261029_0112';
import { getUiSvg, createLogoBadgeHtml, createChannelCardLogoHtml, getChannelLogoSrc } from '../core/icons.js?v=20261029_0112';
import { showToast } from '../core/toast.js?v=20261029_0112';
import { isBackgroundMediaAllowed } from '../core/activity.js?v=20261029_0112';
import { mountTvDirectStream, mountTvContingencyIframe, atomicTvPlayerReset, handleAllDirectSourcesFailed } from '../player/engine.js?v=20261029_0112';
import { liveSourceLabel } from '../core/serverGroups.js?v=20261029_0112';
import { escapeHtml, escapeAttr } from '../core/sanitize.js?v=20261029_0112';

/**
 * Counts available direct and contingency options for a channel
 */
export function getChannelOptionsCount(players) {
    if (!players) return 0;
    if (players.sources && Array.isArray(players.sources)) {
        const srcCount = players.sources.length;
        const contCount = players.contingency ? Object.keys(players.contingency).length : 0;
        return srcCount + contCount;
    }
    if (typeof players === 'object') {
        return Object.keys(players).length;
    }
    return 0;
}

/**
 * Returns matching icon type for a channel category
 */
export function getCategoryIcon(category) {
    const cat = (category || '').toLowerCase();
    if (cat.includes("esporte")) return getUiSvg('sports', 16);
    if (cat.includes("aberta")) return getUiSvg('tv', 16);
    if (cat.includes("infantil")) return getUiSvg('kids', 16);
    if (cat.includes("24h") || cat.includes("série")) return getUiSvg('series', 16);
    if (cat.includes("notícia") || cat.includes("variedade")) return getUiSvg('news', 16);
    return getUiSvg('broadcast', 16);
}

/**
 * Normalizes raw channel data to standard { sources: [], contingency: {} } format
 */
export function normalizeChannelData(raw) {
    if (!raw) return { status: 'ONLINE', sources: [], contingency: {} };
    if (raw.sources && Array.isArray(raw.sources)) {
        return {
            status: raw.status || 'ONLINE',
            sources: raw.sources,
            contingency: raw.contingency || {}
        };
    }
    const players = raw.players || raw;
    const contingency = {};
    if (typeof players === 'object') {
        for (const [key, url] of Object.entries(players)) {
            if (typeof url === 'string') {
                contingency[key] = url;
            }
        }
    }
    return {
        status: raw.status || 'ONLINE',
        sources: [],
        contingency
    };
}

/**
 * Quick Slide-out Channels Drawer Controls
 */
export function openChannelsDrawer() {
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    if (sidebar) sidebar.classList.add("open");
    if (backdrop) backdrop.classList.add("active");
    document.documentElement.classList.add("sidebar-open");
    document.body.classList.add("sidebar-open");
}

export function closeChannelsDrawer() {
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    if (sidebar) sidebar.classList.remove("open");
    if (backdrop) backdrop.classList.remove("active");
    document.documentElement.classList.remove("sidebar-open");
    document.body.classList.remove("sidebar-open");
    document.body.style.overflow = "";
}

export const closeMobileDrawer = closeChannelsDrawer;

function setupDrawerHandlers() {
    const toggleMenuBtn = document.getElementById("btn-toggle-menu");
    const mobileDrawerBtn = document.getElementById("btn-mobile-drawer-toggle");
    const closeMenuBtn = document.getElementById("btn-close-menu");
    const backdropEl = document.getElementById("sidebar-backdrop");

    if (toggleMenuBtn) toggleMenuBtn.onclick = () => openChannelsDrawer();
    if (mobileDrawerBtn) mobileDrawerBtn.onclick = () => openChannelsDrawer();
    if (closeMenuBtn) closeMenuBtn.onclick = () => closeChannelsDrawer();
    if (backdropEl) backdropEl.onclick = () => closeChannelsDrawer();

    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeChannelsDrawer();
    });
}

/**
 * Initializes the channels catalog, sidebar, and home cards grid
 */
export async function initChannelsCatalog() {
    let loadedData = null;
    try {
        const response = await fetch("data/canais.json?v=" + Date.now(), { cache: "no-store" });
        if (response.ok) {
            loadedData = await response.json();
            console.log("[Channels] Catálogo carregado com sucesso via canais.json");
        }
    } catch (e) {
        console.warn("[Channels] Erro ao carregar data/canais.json, usando dataset de contingência:", e);
    }

    if (!loadedData || Object.keys(loadedData).length === 0) {
        loadedData = FALLBACK_CHANNELS;
        console.log("[Channels] Utilizando FALLBACK_CHANNELS.");
    }

    store.setChannelsData(loadedData);
    buildCategoryPills();
    setupChannelsToolbar();
    setupDrawerHandlers();
    renderChannelsHero();
    renderCategoryRows();
    renderChannelGridCards();
    renderSidebar();
    setupSearchHandlers();

    // Setup home button triggers to return to TV Welcome Screen
    const brandHomeBtn = document.getElementById("brand-home");
    const mobileBrandHomeBtn = document.getElementById("mobile-brand-home");
    if (brandHomeBtn) brandHomeBtn.addEventListener("click", () => renderHomeView());
    if (mobileBrandHomeBtn) mobileBrandHomeBtn.addEventListener("click", () => renderHomeView());

    // Listen for channel requests from sports or external events
    store.on('channel:request', ({ category, channelName }) => {
        selectChannelByName(category, channelName);
    });

    // Re-render when favorites change
    store.on('favorites:change', () => {
        renderSidebar();
        const activeChan = store.activeChannel;
        if (!activeChan) {
            renderChannelGridCards();
            renderCategoryRows();
        } else {
            const favBtn = document.getElementById("btn-fav-current");
            if (favBtn) {
                const isFav = store.isFavorite(activeChan.name, activeChan.category);
                favBtn.className = `btn-card-fav ${isFav ? 'favorited' : ''}`;
                favBtn.innerHTML = isFav ? getUiSvg('starFilled', 16) : getUiSvg('star', 16);
            }
        }
    });
}

/**
 * Builds category filter pills in the sidebar
 */
export function buildCategoryPills() {
    const filterPillsEl = document.getElementById("filter-pills");
    if (!filterPillsEl) return;
    filterPillsEl.innerHTML = "";

    // Allow smooth horizontal scrolling with mouse wheel on desktop
    if (!filterPillsEl._hasWheelListener) {
        filterPillsEl._hasWheelListener = true;
        filterPillsEl.addEventListener("wheel", (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                filterPillsEl.scrollLeft += e.deltaY;
            }
        }, { passive: false });
    }

    const channelsData = store.channelsData;

    // AdBlock disclaimer pill
    const adblockBtn = document.createElement("button");
    adblockBtn.className = "pill pill-adblock";
    adblockBtn.id = "btn-sidebar-adblock";
    adblockBtn.title = "Como bloquear anúncios e pop-ups dos players";
    adblockBtn.innerHTML = `
        <svg class="icon-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <polyline points="9 12 11 14 15 10"></polyline>
        </svg>
        Sem Anúncios
    `;
    filterPillsEl.appendChild(adblockBtn);

    // All pill
    const allBtn = document.createElement("button");
    allBtn.className = `pill ${store.activeFilter === "all" ? "active" : ""}`;
    allBtn.dataset.category = "all";
    allBtn.textContent = "Todos";
    allBtn.addEventListener("click", () => setCategoryFilter("all"));
    filterPillsEl.appendChild(allBtn);

    // Favorites pill
    const favsBtn = document.createElement("button");
    favsBtn.className = `pill ${store.activeFilter === "favs" ? "active" : ""}`;
    favsBtn.dataset.category = "favs";
    favsBtn.innerHTML = `${getUiSvg('star', 13)} Favoritos`;
    favsBtn.addEventListener("click", () => setCategoryFilter("favs"));
    filterPillsEl.appendChild(favsBtn);

    // Dynamic Categories from JSON
    Object.keys(channelsData).forEach(category => {
        const pill = document.createElement("button");
        pill.className = `pill ${store.activeFilter === category ? "active" : ""}`;
        pill.dataset.category = category;
        pill.textContent = category;
        pill.addEventListener("click", () => setCategoryFilter(category));
        filterPillsEl.appendChild(pill);
    });
}

/**
 * Sets active category filter
 */
export function setCategoryFilter(category) {
    store.setActiveFilter(category);
    const filterPillsEl = document.getElementById("filter-pills");
    if (filterPillsEl) {
        const pills = filterPillsEl.querySelectorAll(".pill");
        pills.forEach(pill => {
            const cat = pill.getAttribute("data-category") || (pill.textContent.trim() === "Todos" ? "all" : "");
            if (cat === category) pill.classList.add("active");
            else pill.classList.remove("active");
        });
    }
    renderSidebar();
    if (!store.activeChannel) {
        renderChannelGridCards();
    }
}

/**
 * Wires live search input in the sidebar
 */
export function setupSearchHandlers() {
    const searchInput = document.getElementById("search-input");
    const btnClearSearch = document.getElementById("btn-clear-search");

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const q = e.target.value.trim().toLowerCase();
            store.setSearchQuery(q);
            if (btnClearSearch) {
                if (q.length > 0) btnClearSearch.classList.remove("hidden");
                else btnClearSearch.classList.add("hidden");
            }
            renderSidebar();
            if (!store.activeChannel) {
                renderChannelGridCards();
            }
        });
    }

    if (btnClearSearch && searchInput) {
        btnClearSearch.addEventListener("click", () => {
            searchInput.value = "";
            store.setSearchQuery("");
            btnClearSearch.classList.add("hidden");
            renderSidebar();
            if (!store.activeChannel) {
                renderChannelGridCards();
            }
            searchInput.focus();
        });
    }
}

/**
 * Renders channels list in sidebar with exact original classes and structure
 */
export function renderSidebar() {
    const channelsListEl = document.getElementById("channels-list");
    if (!channelsListEl) return;

    channelsListEl.innerHTML = "";
    const channelsData = store.channelsData;
    const activeFilter = store.activeFilter;
    const searchQuery = store.searchQuery;
    const activeChannel = store.activeChannel;

    let totalMatchingChannels = 0;

    Object.entries(channelsData).forEach(([category, channels]) => {
        if (activeFilter !== "all" && activeFilter !== "favs" && activeFilter !== category) {
            return;
        }

        // Filter channels
        const channelEntries = Object.entries(channels).filter(([channelName]) => {
            const channelKey = `${category}:${channelName}`;
            if (activeFilter === "favs" && !store.isFavorite(channelName, category)) {
                return false;
            }
            if (!searchQuery) return true;
            return channelName.toLowerCase().includes(searchQuery) || category.toLowerCase().includes(searchQuery);
        });

        if (channelEntries.length === 0) return;

        totalMatchingChannels += channelEntries.length;

        // Accordion Group
        const groupEl = document.createElement("div");
        groupEl.className = "category-group open";

        const headerBtn = document.createElement("button");
        headerBtn.className = "category-header";
        headerBtn.innerHTML = `
            <div class="category-title">
                <span>${getCategoryIcon(category)} ${escapeHtml(category)}</span>
                <span class="category-badge-count">${channelEntries.length}</span>
            </div>
            <svg class="category-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        `;

        headerBtn.addEventListener("click", () => {
            groupEl.classList.toggle("open");
        });

        const itemsListEl = document.createElement("div");
        itemsListEl.className = "channel-items-list";

        channelEntries.forEach(([channelName, players]) => {
            const isCurrent = activeChannel && activeChannel.name === channelName && activeChannel.category === category;
            const channelBtn = document.createElement("button");
            channelBtn.className = `channel-btn ${isCurrent ? "active" : ""}`;
            
            const playersCount = getChannelOptionsCount(players);
            const logoHtml = createLogoBadgeHtml(channelName, 'sm');
            const channelKey = `${category}:${channelName}`;
            const isFav = store.isFavorite(channelName, category);

            channelBtn.innerHTML = `
                <div class="channel-info-left">
                    ${logoHtml}
                    <span class="channel-name">${escapeHtml(channelName)}</span>
                </div>
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="channel-options-count">${playersCount} opç</span>
                    <span style="display:inline-flex;align-items:center;color:${isFav ? 'var(--accent-gold)' : 'transparent'};">
                        ${isFav ? getUiSvg('starFilled', 12) : ''}
                    </span>
                </div>
            `;

            channelBtn.addEventListener("click", () => {
                selectChannel(category, channelName, players);
                if (window.innerWidth <= 768) {
                    closeMobileDrawer();
                }
            });

            itemsListEl.appendChild(channelBtn);
        });

        groupEl.appendChild(headerBtn);
        groupEl.appendChild(itemsListEl);
        channelsListEl.appendChild(groupEl);
    });

    if (totalMatchingChannels === 0) {
        channelsListEl.innerHTML = `
            <div class="empty-search-state">
                <div style="display:flex;align-items:center;justify-content:center;gap:8px;color:var(--text-muted);">
                    ${getUiSvg('search', 16)}
                    <p>Nenhum canal encontrado para os filtros atuais.</p>
                </div>
            </div>
        `;
    }
}

// Alias for backwards compatibility
export const renderChannels = renderSidebar;

/**
/**
 * Creates a modern 16:9 Dark Glass channel card
 */
export function createChannel16x9Card(category, channelName, players) {
    const card = document.createElement("div");
    card.className = "channel-card-16x9";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Assistir canal ${channelName}`);

    const isFav = store.isFavorite(channelName, category);
    const optionsCount = getChannelOptionsCount(players);
    const logoLargeHtml = createChannelCardLogoHtml(channelName);
    const channelKey = `${category}:${channelName}`;

    card.innerHTML = `
        <div class="channel-card-glow"></div>
        <div class="channel-card-top">
            <button class="btn-card-fav ${isFav ? 'favorited' : ''}" type="button" aria-label="${isFav ? 'Desfavoritar' : 'Favoritar'}">
                ${isFav ? getUiSvg('starFilled', 14) : getUiSvg('star', 14)}
            </button>
        </div>
        <div class="channel-card-logo-box">
            ${logoLargeHtml}
        </div>
        <div class="channel-card-bottom">
            <h4 class="channel-card-name" title="${escapeAttr(channelName)}">${escapeHtml(channelName)}</h4>
        </div>
    `;

    const favBtn = card.querySelector(".btn-card-fav");
    if (favBtn) {
        favBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const isNowFav = store.toggleFavorite(channelKey);
            favBtn.className = `btn-card-fav ${isNowFav ? 'favorited' : ''}`;
            favBtn.innerHTML = isNowFav ? getUiSvg('starFilled', 14) : getUiSvg('star', 14);
            if (store.activeFilter === "favs") {
                renderChannelGridCards();
            }
            renderSidebar();
        });
    }

    card.addEventListener("click", () => {
        selectChannel(category, channelName, players);
    });

    card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            selectChannel(category, channelName, players);
        }
    });

    return card;
}

/**
 * Renders categorized horizontal tracks in the Discovery Feed
 */
export function renderCategoryRows() {
    const container = document.getElementById("channels-category-rows");
    if (!container) return;
    container.innerHTML = "";

    const channelsData = store.channelsData || {};
    const fragment = document.createDocumentFragment();

    Object.entries(channelsData).forEach(([category, channels]) => {
        const channelList = Object.entries(channels || {});
        if (channelList.length === 0) return;

        const row = document.createElement("section");
        row.className = "channels-category-row";

        const iconSvg = getCategoryIcon(category);

        row.innerHTML = `
            <div class="channels-row-header">
                <div class="channels-row-title-box">
                    <span class="channels-row-badge">${iconSvg}</span>
                    <h3>${escapeHtml(category)}</h3>
                    <span class="channels-row-count">${channelList.length} canais</span>
                </div>
                <button class="btn-channels-row-see-all" data-category="${escapeAttr(category)}" type="button">Ver Todos &rarr;</button>
            </div>
            <div class="channels-row-scroller" data-category="${escapeAttr(category)}"></div>
        `;

        const scroller = row.querySelector(".channels-row-scroller");
        channelList.forEach(([channelName, players]) => {
            const card = createChannel16x9Card(category, channelName, players);
            scroller.appendChild(card);
        });

        const seeAllBtn = row.querySelector(".btn-channels-row-see-all");
        if (seeAllBtn) {
            seeAllBtn.addEventListener("click", () => {
                setCategoryFilter(category);
                syncToolbarPills(category);
            });
        }

        fragment.appendChild(row);
    });

    container.appendChild(fragment);
}

let channelsHeroItems = [];
let currentChannelsHeroIndex = 0;
let channelsHeroTimer = null;

const BASE_CHANNELS_HERO_SLIDES = [
    {
        name: "Globo",
        category: "TV Aberta",
        title: "Globo HD",
        badge: "TV Aberta • Ao Vivo",
        meta: "Transmissão Oficial • Cobertura Nacional",
        overview: "A maior rede de televisão aberta do país com programação ao vivo, jornalismo de ponta, novelas e grandes coberturas em alta definição.",
        glowColor: "rgba(17, 94, 69, 0.25)",
        gradient: "radial-gradient(circle at 80% 30%, rgba(17, 94, 69, 0.18) 0%, transparent 65%)"
    },
    {
        name: "SporTV",
        category: "Esportes",
        title: "SporTV HD",
        badge: "Esportes • Ao Vivo",
        meta: "Transmissão Oficial • Canais Globo",
        overview: "O canal campeão com cobertura completa do futebol brasileiro e internacional, ligas de elite e eventos esportivos com múltiplos servidores.",
        glowColor: "rgba(17, 94, 69, 0.25)",
        gradient: "radial-gradient(circle at 80% 30%, rgba(17, 94, 69, 0.18) 0%, transparent 65%)"
    },
    {
        name: "HBO",
        category: "Filmes & Séries",
        title: "HBO HD",
        badge: "Cinema & Séries • Ao Vivo",
        meta: "Transmissão Oficial • Cinema Premium",
        overview: "Grandes estreias do cinema mundial, séries consagradas e produções aclamadas transmitidas com qualidade máxima e som cristalino.",
        glowColor: "rgba(17, 94, 69, 0.25)",
        gradient: "radial-gradient(circle at 80% 30%, rgba(17, 94, 69, 0.18) 0%, transparent 65%)"
    },
    {
        name: "Cartoon Network",
        category: "Infantil",
        title: "Cartoon Network HD",
        badge: "Infantil • Ao Vivo",
        meta: "Transmissão Oficial • Desenhos 24h",
        overview: "O canal número 1 da garotada com os melhores desenhos animados, séries nostálgicas e os maiores sucessos da animação mundial.",
        glowColor: "rgba(17, 94, 69, 0.25)",
        gradient: "radial-gradient(circle at 80% 30%, rgba(17, 94, 69, 0.18) 0%, transparent 65%)"
    }
];

function buildChannelsHeroSlides() {
    const channelsData = store.channelsData || {};
    const slides = [];

    // Helper to find channel players
    function findChannel(name, cat) {
        if (channelsData[cat]?.[name]) return { name, category: cat, players: channelsData[cat][name] };
        for (const [c, chs] of Object.entries(channelsData)) {
            for (const [n, players] of Object.entries(chs)) {
                if (n.toLowerCase().includes(name.toLowerCase())) {
                    return { name: n, category: c, players };
                }
            }
        }
        return null;
    }

    // Prioritize user's favorited channel if any
    const favs = store.favorites || [];
    if (favs.length > 0) {
        const [firstFavKey] = favs;
        const [favCat, favName] = firstFavKey.split(":");
        const favCh = findChannel(favName, favCat);
        if (favCh) {
            slides.push({
                name: favCh.name,
                category: favCh.category,
                title: `${favCh.name} HD`,
                badge: `Favorito • ${favCh.category}`,
                meta: `Seu Canal Favorito • Transmissão Direta`,
                overview: `Acesso rápido ao seu canal favorito com transmissão contínua e múltiplos servidores disponíveis.`,
                glowColor: "rgba(17, 94, 69, 0.25)",
                gradient: "radial-gradient(circle at 80% 30%, rgba(17, 94, 69, 0.18) 0%, transparent 65%)",
                players: favCh.players
            });
        }
    }

    // Populate curated multi-genre slides
    for (const base of BASE_CHANNELS_HERO_SLIDES) {
        const ch = findChannel(base.name, base.category);
        if (ch) {
            slides.push({
                ...base,
                players: ch.players
            });
        }
    }

    return slides.slice(0, 4);
}

function updateChannelsHeroDisplay(index) {
    const slide = channelsHeroItems[index];
    if (!slide) return;

    const titleEl = document.getElementById("channels-hero-title");
    const metaEl = document.getElementById("channels-hero-meta");
    const overviewEl = document.getElementById("channels-hero-overview");
    const badgeTextEl = document.getElementById("channels-hero-badge-text");
    const logoEl = document.getElementById("channels-hero-logo");
    const glowEl = document.getElementById("channels-hero-glow");
    const gradientEl = document.getElementById("channels-hero-gradient");
    const watchBtn = document.getElementById("btn-channels-hero-watch");
    const drawerBtn = document.getElementById("btn-channels-hero-drawer");

    if (titleEl) titleEl.textContent = slide.title;
    if (metaEl) metaEl.textContent = slide.meta;
    if (overviewEl) overviewEl.textContent = slide.overview;
    if (badgeTextEl) badgeTextEl.textContent = slide.badge || "AO VIVO AGORA";

    const logoSrc = getChannelLogoSrc(slide.name);
    if (logoEl) {
        if (logoSrc) {
            logoEl.src = logoSrc;
            logoEl.alt = slide.name;
            logoEl.style.display = "block";
        } else {
            logoEl.style.display = "none";
        }
    }

    if (glowEl && slide.glowColor) {
        glowEl.style.background = `radial-gradient(circle, ${slide.glowColor} 0%, transparent 70%)`;
    }
    if (gradientEl && slide.gradient) {
        gradientEl.style.background = slide.gradient;
    }

    if (watchBtn) {
        watchBtn.onclick = () => {
            selectChannel(slide.category, slide.name, slide.players);
        };
    }
    if (drawerBtn) {
        drawerBtn.onclick = () => {
            openChannelsDrawer();
        };
    }

    // Update dots
    const dotsContainer = document.getElementById("channels-hero-dots") || document.getElementById("channels-hero-nav");
    if (dotsContainer) {
        const dots = dotsContainer.querySelectorAll(".hero-dot, .channels-hero-dot");
        dots.forEach((d, idx) => {
            d.classList.toggle("active", idx === index);
        });
    }
}

function setupChannelsHeroNavDots() {
    const dotsContainer = document.getElementById("channels-hero-dots") || document.getElementById("channels-hero-nav");
    const btnPrev = document.getElementById("btn-channels-hero-prev");
    const btnNext = document.getElementById("btn-channels-hero-next");

    if (dotsContainer) {
        dotsContainer.innerHTML = "";
        channelsHeroItems.forEach((_, idx) => {
            const dot = document.createElement("button");
            dot.className = `hero-dot ${idx === currentChannelsHeroIndex ? 'active' : ''}`;
            dot.type = "button";
            dot.setAttribute("aria-label", `Slide ${idx + 1}`);
            dot.onclick = () => {
                currentChannelsHeroIndex = idx;
                updateChannelsHeroDisplay(currentChannelsHeroIndex);
                startChannelsHeroTimer();
            };
            dotsContainer.appendChild(dot);
        });
    }

    if (btnPrev && !btnPrev._hasChannelsClick) {
        btnPrev._hasChannelsClick = true;
        btnPrev.onclick = () => {
            if (channelsHeroItems.length <= 1) return;
            currentChannelsHeroIndex = (currentChannelsHeroIndex - 1 + channelsHeroItems.length) % channelsHeroItems.length;
            updateChannelsHeroDisplay(currentChannelsHeroIndex);
            startChannelsHeroTimer();
        };
    }

    if (btnNext && !btnNext._hasChannelsClick) {
        btnNext._hasChannelsClick = true;
        btnNext.onclick = () => {
            if (channelsHeroItems.length <= 1) return;
            currentChannelsHeroIndex = (currentChannelsHeroIndex + 1) % channelsHeroItems.length;
            updateChannelsHeroDisplay(currentChannelsHeroIndex);
            startChannelsHeroTimer();
        };
    }
}

export function startChannelsHeroTimer() {
    stopChannelsHeroTimer();
    channelsHeroTimer = setInterval(() => {
        if (!isBackgroundMediaAllowed('tv')) return;
        if (channelsHeroItems.length <= 1) return;
        currentChannelsHeroIndex = (currentChannelsHeroIndex + 1) % channelsHeroItems.length;
        updateChannelsHeroDisplay(currentChannelsHeroIndex);
    }, 7000);
}

export function stopChannelsHeroTimer() {
    if (channelsHeroTimer) {
        clearInterval(channelsHeroTimer);
        channelsHeroTimer = null;
    }
}

/**
 * Renders live headline broadcast hero
 */
export function renderChannelsHero() {
    const heroEl = document.getElementById("channels-hero");
    if (!heroEl) return;

    channelsHeroItems = buildChannelsHeroSlides();
    if (channelsHeroItems.length === 0) return;

    if (currentChannelsHeroIndex >= channelsHeroItems.length) {
        currentChannelsHeroIndex = 0;
    }

    updateChannelsHeroDisplay(currentChannelsHeroIndex);
    setupChannelsHeroNavDots();
    startChannelsHeroTimer();

    if (!heroEl._hasHoverListeners) {
        heroEl._hasHoverListeners = true;
        heroEl.addEventListener("mouseenter", () => stopChannelsHeroTimer());
        heroEl.addEventListener("mouseleave", () => startChannelsHeroTimer());
    }
}

/**
 * Wires sticky navigation toolbar pills and spotlight search
 */
export function setupChannelsToolbar() {
    const toolbar = document.getElementById("channels-nav-toolbar");
    if (!toolbar) return;

    const pills = toolbar.querySelectorAll(".channel-cat-pill");
    pills.forEach(pill => {
        pill.onclick = () => {
            const cat = pill.dataset.category || "all";
            setCategoryFilter(cat);
            syncToolbarPills(cat);
        };
    });

    const spotlightInput = document.getElementById("channels-spotlight-input");
    const clearBtn = document.getElementById("btn-clear-channels-search");
    if (spotlightInput) {
        spotlightInput.oninput = (e) => {
            const q = e.target.value.trim().toLowerCase();
            store.setSearchQuery(q);
            if (clearBtn) clearBtn.classList.toggle("hidden", q.length === 0);
            renderChannelGridCards();
            renderSidebar();
        };
    }

    if (clearBtn && spotlightInput) {
        clearBtn.onclick = () => {
            spotlightInput.value = "";
            store.setSearchQuery("");
            clearBtn.classList.add("hidden");
            renderChannelGridCards();
            renderSidebar();
            spotlightInput.focus();
        };
    }

    const openDrawerBtn = document.getElementById("btn-toolbar-open-drawer");
    if (openDrawerBtn) {
        openDrawerBtn.onclick = () => openChannelsDrawer();
    }

    const backFeedBtn = document.getElementById("btn-channels-back-feed");
    if (backFeedBtn) {
        backFeedBtn.onclick = () => {
            setCategoryFilter("all");
            syncToolbarPills("all");
            if (spotlightInput) spotlightInput.value = "";
            if (clearBtn) clearBtn.classList.add("hidden");
            store.setSearchQuery("");
            renderChannelGridCards();
        };
    }
}

export function syncToolbarPills(activeCategory) {
    const pills = document.querySelectorAll("#channels-pills-bar .channel-cat-pill");
    pills.forEach(p => {
        const cat = p.dataset.category || "all";
        p.classList.toggle("active", cat === activeCategory);
    });
}

/**
 * Renders Channel Visual Grid Cards on the Welcome/Explore Screen (#quick-grid)
 */
export function renderChannelGridCards() {
    const gridEl = document.getElementById("quick-grid");
    if (!gridEl) return;
    gridEl.innerHTML = "";

    const channelsData = store.channelsData;
    const q = (store.searchQuery || "").toLowerCase();
    const filter = store.activeFilter || "all";
    const allChannels = [];

    Object.entries(channelsData).forEach(([category, channels]) => {
        if (filter !== "all" && filter !== "favs" && category !== filter) return;

        Object.entries(channels).forEach(([channelName, players]) => {
            const isFav = store.isFavorite(channelName, category);
            if (filter === "favs" && !isFav) return;

            if (q) {
                const matchName = channelName.toLowerCase().includes(q);
                const matchCat = category.toLowerCase().includes(q);
                if (!matchName && !matchCat) return;
            }

            allChannels.push({ category, channelName, players });
        });
    });

    const feedEl = document.getElementById("channels-discovery-feed");
    const exploreEl = document.getElementById("channels-explore-view");
    const isFiltered = filter !== "all" || q.length > 0;

    if (feedEl && exploreEl) {
        if (isFiltered) {
            feedEl.classList.add("hidden");
            exploreEl.classList.remove("hidden");
            const titleEl = document.getElementById("channels-explore-title");
            const countEl = document.getElementById("channels-explore-count");
            if (titleEl) {
                if (q) titleEl.textContent = `Resultados para "${q}"`;
                else if (filter === "favs") titleEl.textContent = "Canais Favoritos";
                else titleEl.textContent = filter;
            }
            if (countEl) {
                countEl.textContent = `${allChannels.length} canal${allChannels.length === 1 ? '' : 'is'} encontrado${allChannels.length === 1 ? '' : 's'}`;
            }
        } else {
            feedEl.classList.remove("hidden");
            exploreEl.classList.add("hidden");
        }
    }

    if (allChannels.length === 0) {
        gridEl.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-muted);">
                <p style="font-size: 1.05rem; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">Nenhum canal encontrado</p>
                <span style="font-size: 0.85rem;">Tente buscar por outro termo ou selecione a categoria "Todos".</span>
            </div>
        `;
        return;
    }

    const fragment = document.createDocumentFragment();
    allChannels.forEach(({ category, channelName, players }) => {
        const card = createChannel16x9Card(category, channelName, players);
        fragment.appendChild(card);
    });
    gridEl.appendChild(fragment);
}

/**
 * Returns to Welcome Screen from Player View
 */
export function renderHomeView() {
    atomicTvPlayerReset();
    store.setActiveChannel(null);

    const contentDisplay = document.getElementById("content-display");
    if (!contentDisplay) return;

    contentDisplay.innerHTML = `
        <div class="welcome-screen" id="channels-welcome-screen">
            <!-- Channels Cinematic Hero Showcase -->
            <section class="channels-hero" id="channels-hero">
                <div class="channels-hero-bg">
                    <div class="channels-hero-gradient" id="channels-hero-gradient"></div>
                    <div class="channels-hero-glow" id="channels-hero-glow"></div>
                </div>
                <div class="channels-hero-content">
                    <div class="channels-hero-top-row">
                        <div class="channels-hero-badge">
                            <span class="live-dot pulse-emerald"></span>
                            <span id="channels-hero-badge-text">AO VIVO AGORA</span>
                        </div>
                        <div class="movies-hero-nav channels-hero-nav" id="channels-hero-nav">
                            <button id="btn-channels-hero-prev" class="btn-hero-nav-arrow" aria-label="Canal anterior" title="Canal anterior" type="button">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>
                            <div id="channels-hero-dots" class="hero-dots-container movies-hero-dots"></div>
                            <button id="btn-channels-hero-next" class="btn-hero-nav-arrow" aria-label="Próximo canal" title="Próximo canal" type="button">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="channels-hero-brand-box">
                        <img id="channels-hero-logo" class="channels-hero-logo" src="" alt="" style="display:none;">
                        <h1 class="channels-hero-title" id="channels-hero-title">Globo HD</h1>
                    </div>
                    <p class="channels-hero-meta" id="channels-hero-meta">Transmissão Oficial • TV Aberta</p>
                    <p class="channels-hero-overview" id="channels-hero-overview">
                        A maior rede de televisão aberta do país com programação ao vivo, jornalismo de ponta e entretenimento.
                    </p>
                    <div class="channels-hero-actions">
                        <button class="btn-channels-hero-play" id="btn-channels-hero-watch" type="button">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                            <span>Assistir Transmissão</span>
                        </button>
                        <button class="btn-channels-hero-drawer" id="btn-channels-hero-drawer" type="button">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <line x1="9" y1="3" x2="9" y2="21"></line>
                            </svg>
                            <span>Guia Rápido de Canais</span>
                        </button>
                    </div>
                </div>
            </section>

            <!-- Channels Navigation Toolbar (Category Pills + Spotlight Search) -->
            <div class="movies-nav-toolbar channels-nav-toolbar" id="channels-nav-toolbar">
                <nav class="movies-category-pills channels-pills-bar" id="channels-pills-bar" aria-label="Navegar por Canais">
                    <button class="movie-pill channel-cat-pill active" data-category="all" type="button">Todos</button>
                    <button class="movie-pill channel-cat-pill" data-category="favs" type="button">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                        <span>Favoritos</span>
                    </button>
                    <button class="movie-pill channel-cat-pill" data-category="Esportes" type="button">Esportes</button>
                    <button class="movie-pill channel-cat-pill" data-category="TV Aberta" type="button">TV Aberta</button>
                    <button class="movie-pill channel-cat-pill" data-category="Filmes e Séries" type="button">Filmes & Séries</button>
                    <button class="movie-pill channel-cat-pill" data-category="Infantil" type="button">Infantil</button>
                    <button class="movie-pill channel-cat-pill" data-category="Notícias" type="button">Notícias</button>
                    <button class="movie-pill channel-cat-pill" data-category="Variedades" type="button">Variedades</button>
                </nav>
                <div class="spotlight-search-container pills-search-box channels-search-box" id="channels-search-container" title="Clique para buscar canal">
                    <svg class="spotlight-icon pills-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input type="text" id="channels-spotlight-input" class="spotlight-input pills-search-input" placeholder="Buscar canal..." autocomplete="off">
                    <button id="btn-clear-channels-search" class="spotlight-clear hidden" aria-label="Limpar busca">&times;</button>
                </div>
            </div>

            <!-- Discovery Feed (Categorized Horizontal Rows) -->
            <div class="channels-discovery-feed" id="channels-discovery-feed">
                <!-- Multi-Team Upcoming Matches Section -->
                <section class="vasco-matches-section" id="vasco-matches-section">
                    <div class="section-heading" id="matches-section-heading">
                        <div class="matches-heading-left">
                            <span class="matches-team-badge" id="matches-team-badge">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="16" y1="2" x2="16" y2="6"></line>
                                    <line x1="8" y1="2" x2="8" y2="6"></line>
                                    <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                            </span>
                            <div>
                                <h3 id="matches-section-title">Próximos Jogos de Futebol</h3>
                                <span class="section-hint" id="matches-section-hint">Agenda atualizada dos confrontos de futebol (via ge.globo)</span>
                            </div>
                        </div>
                        <div class="matches-heading-right" id="matches-heading-right">
                            <button id="btn-change-team" class="btn-change-team" aria-label="Escolher ou trocar time" title="Alterar time favorito">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="17 1 21 5 17 9"></polyline>
                                    <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                                    <polyline points="7 23 3 19 7 15"></polyline>
                                    <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                                </svg>
                                <span id="btn-change-team-label">Escolher Time</span>
                            </button>
                        </div>
                    </div>

                    <div class="matches-carousel-wrapper" id="matches-carousel-wrapper">
                        <div class="matches-grid matches-carousel" id="vasco-matches-grid" tabindex="0" role="region" aria-label="Carrossel de próximos jogos">
                            <div class="match-card skeleton-match-card">
                                <div class="skeleton-match-line short"></div>
                                <div class="skeleton-match-duel"></div>
                                <div class="skeleton-match-line"></div>
                            </div>
                            <div class="match-card skeleton-match-card">
                                <div class="skeleton-match-line short"></div>
                                <div class="skeleton-match-duel"></div>
                                <div class="skeleton-match-line"></div>
                            </div>
                            <div class="match-card skeleton-match-card">
                                <div class="skeleton-match-line short"></div>
                                <div class="skeleton-match-duel"></div>
                                <div class="skeleton-match-line"></div>
                            </div>
                        </div>
                    </div>

                    <div class="matches-carousel-footer" id="matches-carousel-footer">
                        <div class="matches-nav-arrows" id="matches-nav-arrows">
                            <button id="btn-matches-prev" class="btn-matches-arrow" aria-label="Jogos anteriores" title="Ver jogos anteriores" disabled>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>
                            <button id="btn-matches-next" class="btn-matches-arrow" aria-label="Próximos jogos" title="Ver mais jogos">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        </div>
                    </div>
                </section>

                <!-- Categorized Horizontal Tracks Container -->
                <div id="channels-category-rows" class="channels-category-rows"></div>
            </div>

            <!-- Explore Full Grid View (Activated upon Search or Category Filter) -->
            <div class="channels-explore-view hidden" id="channels-explore-view">
                <div class="channels-explore-header">
                    <div>
                        <h3 id="channels-explore-title">Todos os Canais</h3>
                        <span class="channels-explore-subtitle" id="channels-explore-count">Exibindo canais disponíveis</span>
                    </div>
                    <button id="btn-channels-back-feed" class="btn-channels-secondary" type="button">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                        <span>Voltar aos Destaques</span>
                    </button>
                </div>
                <div class="quick-grid" id="quick-grid"></div>
            </div>
        </div>
    `;

    setupChannelsToolbar();
    renderChannelsHero();
    renderCategoryRows();
    renderChannelGridCards();
    renderSidebar();

    const mainContent = document.getElementById("main-content");
    if (mainContent) mainContent.scrollTo({ top: 0, behavior: 'smooth' });

    // Trigger sports matches rendering on the renewed DOM
    store.dispatchEvent(new CustomEvent('sports:refreshMatches'));
}

/**
 * Searches and selects a channel by name across all categories
 */
export function selectChannelByName(category, channelName) {
    if (!channelName && category) {
        channelName = category;
        category = null;
    }
    if (!channelName) return;

    const channelsData = store.channelsData;
    let targetCat = category;
    let targetData = targetCat ? channelsData[targetCat]?.[channelName] : null;

    if (!targetData) {
        for (const [cat, chs] of Object.entries(channelsData)) {
            if (chs[channelName]) {
                targetCat = cat;
                targetData = chs[channelName];
                break;
            }
            const fuzzyKey = Object.keys(chs).find(k => k.toLowerCase().includes(channelName.toLowerCase()) || channelName.toLowerCase().includes(k.toLowerCase()));
            if (fuzzyKey) {
                targetCat = cat;
                targetData = chs[fuzzyKey];
                channelName = fuzzyKey;
                break;
            }
        }
    }

    if (targetData) {
        selectChannel(targetCat, channelName, targetData);
    } else {
        showToast(`Canal ${channelName} indisponível no momento.`);
    }
}

/**
 * Selects a channel, prepares active data object, and renders the player
 */
export function selectChannel(category, channelName, rawChannelData, preferredOption = null) {
    const data = normalizeChannelData(rawChannelData);
    const hasSources = data.sources && data.sources.length > 0;
    const hasContingency = data.contingency && Object.keys(data.contingency).length > 0;

    if (!hasSources && !hasContingency) {
        showToast(`Canal ${channelName} sem opções disponíveis.`);
        return;
    }

    // Ensure we are in TV view
    if (store.currentView !== 'tv') {
        const tabTv = document.getElementById("nav-tab-tv");
        if (tabTv) tabTv.click();
    }

    let selectedServerType = 'direct';
    let selectedSourceIndex = 0;
    let selectedContingencyName = null;
    let selectedContingencyUrl = null;

    if (preferredOption) {
        const sIdx = hasSources ? data.sources.findIndex(s => s.name === preferredOption) : -1;
        if (sIdx !== -1) {
            selectedServerType = 'direct';
            selectedSourceIndex = sIdx;
        } else if (hasContingency && data.contingency[preferredOption]) {
            selectedServerType = 'contingency';
            selectedContingencyName = preferredOption;
            selectedContingencyUrl = data.contingency[preferredOption];
        }
    } else if (hasSources) {
        selectedServerType = 'direct';
        selectedSourceIndex = 0;
    } else {
        const firstContKey = Object.keys(data.contingency)[0];
        selectedServerType = 'contingency';
        selectedContingencyName = firstContKey;
        selectedContingencyUrl = data.contingency[firstContKey];
    }

    const channelObj = {
        category,
        name: channelName,
        data,
        serverType: selectedServerType,
        sourceIndex: selectedSourceIndex,
        contingencyName: selectedContingencyName,
        contingencyUrl: selectedContingencyUrl
    };

    store.setActiveChannel(channelObj);
    renderPlayerView(channelObj);
    renderSidebar();

    window.scrollTo({ top: 0, behavior: "smooth" });
    if (window.innerWidth <= 768) {
        closeMobileDrawer();
    }
}

/**
 * Updates active server button pill classes without re-rendering entire player
 */
function updateServerButtonsActiveState(activeChannel) {
    const directButtons = document.querySelectorAll("#direct-servers-grid .btn-server-option");
    directButtons.forEach(btn => {
        const idx = parseInt(btn.dataset.index, 10);
        const isActive = activeChannel.serverType === 'direct' && activeChannel.sourceIndex === idx;
        btn.classList.toggle("active", isActive);
        const sourceLabel = liveSourceLabel(activeChannel.data.sources[idx], idx);
        btn.innerHTML = `<span>${escapeHtml(sourceLabel)}</span>${isActive ? '<span style="font-size:0.75rem;">(Ativo)</span>' : ''}`;
    });

    const contButtons = document.querySelectorAll("#contingency-servers-grid .btn-server-option");
    contButtons.forEach(btn => {
        const name = btn.dataset.name;
        const isActive = activeChannel.serverType === 'contingency' && activeChannel.contingencyName === name;
        btn.classList.toggle("active", isActive);
        btn.innerHTML = `<span>${escapeHtml(name)}</span>${isActive ? '<span style="font-size:0.75rem;">(Ativo)</span>' : ''}`;
    });
}

/**
 * Renders the full TV player view with 100% exact parity with CSS design system
 */
export function renderPlayerView(activeChannel) {
    const contentDisplay = document.getElementById("content-display");
    if (!contentDisplay || !activeChannel) return;

    const { category, name, data, serverType, sourceIndex } = activeChannel;
    const logoLargeHtml = createLogoBadgeHtml(name, 'md');
    const channelKey = `${category}:${name}`;
    const isFav = store.isFavorite(name, category);
    const isDirect = serverType === 'direct';

    contentDisplay.innerHTML = `
        <div class="player-view-container">
            <!-- Player Header Toolbar -->
            <div class="player-header">
                <div class="player-info">
                    <button id="btn-back-to-channels" class="btn-player-back" title="Voltar aos Canais" type="button">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </button>
                    ${logoLargeHtml}
                    <div class="player-title-box">
                        <div style="display:flex;align-items:center;gap:8px;">
                            <h2>${escapeHtml(name)}</h2>
                            <button id="btn-fav-current" class="btn-card-fav ${isFav ? 'favorited' : ''}" title="${isFav ? 'Remover dos favoritos' : 'Favoritar canal'}" type="button">
                                ${isFav ? getUiSvg('starFilled', 16) : getUiSvg('star', 16)}
                            </button>
                        </div>
                        <span class="channel-category-label">
                            <span class="live-indicator"><span class="live-dot pulse-emerald"></span> AO VIVO</span> &bull; ${escapeHtml(category)}
                        </span>
                    </div>
                </div>
                <div class="player-toolbar">
                    <button id="btn-reload-player" class="btn-player-action" title="Recarregar Transmissão" type="button">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                        </svg>
                        Recarregar
                    </button>
                </div>
            </div>

            <!-- Video Stage (16:9 Frame) -->
            <div id="video-theater" class="video-theater-wrapper">
                <div id="video-loader" class="video-loader-overlay">
                    <div class="spinner"></div>
                    <span style="color:var(--text-secondary);font-size:0.85rem;">Carregando transmissão...</span>
                </div>
                <div id="tv-artplayer-container" class="tv-artplayer-stage"></div>
                <iframe 
                    id="stream-iframe"
                    src="" 
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen" 
                    allowfullscreen
                    webkitallowfullscreen
                    mozallowfullscreen
                    referrerpolicy="no-referrer"
                    class="hidden"
                ></iframe>
            </div>

            <!-- Server Selector & Switcher -->
            <div class="server-selector-card">
                <div class="server-selector-header">
                    <h4>
                        <span style="display:inline-flex;align-items:center;gap:6px;">${getUiSvg('server', 16)} Players e servidores</span>
                    </h4>
                    <span class="server-selector-hint">Se a transmissão travar, troque a fonte do Player Principal ou escolha um servidor externo.</span>
                </div>
                
                ${data.sources && data.sources.length > 0 ? `
                    <div class="server-group-block" id="direct-servers-block">
                        <div class="servers-section-title">
                            <span>Player Principal</span>
                            <span class="badge-server-native">Sem anúncios</span>
                        </div>
                        <div class="servers-grid" id="direct-servers-grid"></div>
                    </div>
                ` : ''}

                ${data.contingency && Object.keys(data.contingency).length > 0 ? `
                    <div class="server-group-block" id="contingency-servers-block" style="margin-top:14px;">
                        <div class="servers-section-title">
                            <span>Servidores externos</span>
                            <span class="badge-server-contingency">Iframe</span>
                        </div>
                        <div class="servers-grid" id="contingency-servers-grid"></div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    // Favorite button click
    const favBtnCurrent = document.getElementById("btn-fav-current");
    if (favBtnCurrent) {
        favBtnCurrent.addEventListener("click", () => {
            store.toggleFavorite(channelKey);
            const isNowFav = store.isFavorite(name, category);
            favBtnCurrent.className = `btn-card-fav ${isNowFav ? 'favorited' : ''}`;
            favBtnCurrent.innerHTML = isNowFav ? getUiSvg('starFilled', 16) : getUiSvg('star', 16);
            showToast(isNowFav ? `${name} adicionado aos favoritos` : `${name} removido dos favoritos`);
        });
    }

    // Populate Direct Servers Buttons
    const directGridEl = document.getElementById("direct-servers-grid");
    if (directGridEl && data.sources) {
        data.sources.forEach((source, idx) => {
            const isOptionActive = activeChannel.serverType === 'direct' && activeChannel.sourceIndex === idx;
            const btn = document.createElement("button");
            btn.className = `btn-server-option native-server ${isOptionActive ? "active" : ""}`;
            btn.dataset.index = idx;
            btn.innerHTML = `
                <span>${escapeHtml(liveSourceLabel(source, idx))}</span>
                ${isOptionActive ? '<span style="font-size:0.75rem;">(Ativo)</span>' : ''}
            `;
            btn.addEventListener("click", () => {
                if (activeChannel.serverType !== 'direct' || activeChannel.sourceIndex !== idx) {
                    activeChannel.serverType = 'direct';
                    activeChannel.sourceIndex = idx;
                    updateServerButtonsActiveState(activeChannel);
                    mountTvDirectStream(activeChannel.data, activeChannel.sourceIndex, () => {
                        handleAllDirectSourcesFailed(() => mountTvDirectStream(activeChannel.data, 0));
                    });
                }
            });
            directGridEl.appendChild(btn);
        });
    }

    // Populate Contingency Servers Buttons
    const contingencyGridEl = document.getElementById("contingency-servers-grid");
    if (contingencyGridEl && data.contingency) {
        Object.entries(data.contingency).forEach(([optName, optUrl]) => {
            const isOptionActive = activeChannel.serverType === 'contingency' && activeChannel.contingencyName === optName;
            const btn = document.createElement("button");
            btn.className = `btn-server-option contingency-server ${isOptionActive ? "active" : ""}`;
            btn.dataset.name = optName;
            btn.innerHTML = `
                <span>${escapeHtml(optName)}</span>
                ${isOptionActive ? '<span style="font-size:0.75rem;">(Ativo)</span>' : ''}
            `;
            btn.addEventListener("click", () => {
                activeChannel.serverType = 'contingency';
                activeChannel.contingencyName = optName;
                activeChannel.contingencyUrl = optUrl;
                updateServerButtonsActiveState(activeChannel);
                mountTvContingencyIframe(optUrl);
            });
            contingencyGridEl.appendChild(btn);
        });
    }

    // Toolbar Actions
    const btnReload = document.getElementById("btn-reload-player");
    const btnBackToChannels = document.getElementById("btn-back-to-channels");

    if (btnBackToChannels) {
        btnBackToChannels.addEventListener("click", () => renderHomeView());
    }

    if (btnReload) {
        btnReload.addEventListener("click", () => {
            showToast("Recarregando transmissão...");
            if (activeChannel.serverType === 'direct') {
                mountTvDirectStream(activeChannel.data, activeChannel.sourceIndex, () => {
                    handleAllDirectSourcesFailed(() => mountTvDirectStream(activeChannel.data, 0));
                });
            } else {
                mountTvContingencyIframe(activeChannel.contingencyUrl);
            }
        });
    }

    // Initial Mount based on selected serverType
    if (activeChannel.serverType === 'direct') {
        mountTvDirectStream(activeChannel.data, activeChannel.sourceIndex, () => {
            handleAllDirectSourcesFailed(() => mountTvDirectStream(activeChannel.data, 0));
        });
    } else {
        mountTvContingencyIframe(activeChannel.contingencyUrl);
    }
}
