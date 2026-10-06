/**
 * TVZINHA ONLINE - Channels Catalog & TV Interface Module
 * Handles channel data fetching, category filtering, search, sidebar accordion,
 * Home screen quick-cards grid, and pixel-perfect TV player view.
 */

import { store } from '../core/state.js';
import { FALLBACK_CHANNELS } from '../core/fallbackChannels.js';
import { getUiSvg, createLogoBadgeHtml } from '../core/icons.js';
import { showToast } from '../core/toast.js';
import { mountTvDirectStream, mountTvContingencyIframe, atomicTvPlayerReset, handleAllDirectSourcesFailed } from '../player/engine.js';

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
 * Safely closes the mobile sidebar drawer
 */
function closeMobileDrawer() {
    const sidebar = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");
    if (sidebar) sidebar.classList.remove("open");
    if (backdrop) backdrop.classList.remove("active");
    document.body.classList.remove("sidebar-open");
    document.body.style.overflow = "";
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
    renderSidebar();
    renderChannelGridCards();
    setupSearchHandlers();
    setupSidebarResizer();

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
                <span>${getCategoryIcon(category)} ${category}</span>
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
                    <span class="channel-name">${channelName}</span>
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
 * Renders Channel Visual Grid Cards on the Welcome/Home Screen (#quick-grid)
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

    if (allChannels.length === 0) {
        gridEl.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-muted);">
                <p style="font-size: 1.05rem; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">Nenhum canal encontrado</p>
                <span style="font-size: 0.85rem;">Tente buscar por outro termo ou selecione a categoria "Todos".</span>
            </div>
        `;
        return;
    }

    allChannels.forEach(({ category, channelName, players }) => {
        const card = document.createElement("div");
        card.className = "quick-card";
        card.tabIndex = 0;
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", `Assistir canal ${channelName}`);
        
        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                selectChannel(category, channelName, players);
            }
        });

        const optionsCount = getChannelOptionsCount(players);
        const logoLargeHtml = createLogoBadgeHtml(channelName, 'lg');
        const channelKey = `${category}:${channelName}`;
        const isFav = store.isFavorite(channelName, category);

        card.innerHTML = `
            <div class="card-top">
                <span class="card-category-tag">${category}</span>
                <button class="btn-card-fav ${isFav ? 'favorited' : ''}" title="${isFav ? 'Remover dos favoritos' : 'Favoritar canal'}">
                    ${isFav ? getUiSvg('starFilled', 16) : getUiSvg('star', 16)}
                </button>
            </div>
            <div class="card-main-info">
                ${logoLargeHtml}
                <div>
                    <h4 class="card-title">${channelName}</h4>
                    <span class="card-live"><span class="live-dot"></span> AO VIVO</span>
                </div>
            </div>
            <div class="card-footer">
                <span>${optionsCount} Servidor${optionsCount > 1 ? "es" : ""}</span>
                <span class="card-play-action">Assistir &rarr;</span>
            </div>
        `;

        // Favorite click
        const favBtn = card.querySelector(".btn-card-fav");
        if (favBtn) {
            favBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                store.toggleFavorite(channelKey);
                renderChannelGridCards();
                renderSidebar();
            });
        }

        // Card play click
        card.addEventListener("click", () => {
            selectChannel(category, channelName, players);
        });

        gridEl.appendChild(card);
    });
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
        <div class="welcome-screen">
            <div class="welcome-hero">
                <div class="welcome-hero-text">
                    <button class="hero-badge hero-badge-btn" id="btn-hero-adblock" title="Como bloquear anúncios e pop-ups dos players" aria-label="Aviso e configuração de Bloqueador de Anúncios">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            <polyline points="9 12 11 14 15 10"></polyline>
                        </svg>
                        <span>Sem Anúncios</span>
                    </button>
                    <h1 class="hero-title">Escolha um canal para assistir agora</h1>
                    <p class="hero-subtitle">
                        Acesse transmissões de alta estabilidade de <strong>TV Aberta</strong> e <strong>Esportes</strong> com múltiplos servidores disponíveis.
                    </p>
                </div>
                <div class="welcome-hero-emblem" aria-hidden="true" title="Tvzinha Online">
                    <img src="assets/logos/fav/icon-detailed.svg" alt="Tvzinha Logo" class="hero-emblem-img">
                </div>
            </div>

            <!-- Multi-Team Upcoming Matches Section -->
            <section class="vasco-matches-section" id="vasco-matches-section">
                <div class="section-heading" id="matches-section-heading">
                    <div class="matches-heading-left">
                        <span class="matches-team-badge" id="matches-team-badge">${getUiSvg('calendar', 18)}</span>
                        <div>
                            <h3 id="matches-section-title">Próximos Jogos de Futebol</h3>
                            <span class="section-hint" id="matches-section-hint">Agenda atualizada dos confrontos de futebol (via ge.globo)</span>
                        </div>
                    </div>
                    <div class="matches-heading-right" id="matches-heading-right">
                        <button id="btn-change-team" class="btn-change-team" aria-label="Escolher ou trocar time" title="Alterar time favorito">
                            ${getUiSvg('swap', 15)}
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

            <!-- Channel Visual Grid with Logos -->
            <div class="quick-channels-section">
                <div class="section-heading">
                    <h3>Todos os Canais</h3>
                    <span class="section-hint">Clique no card para abrir o player</span>
                </div>
                <div class="quick-grid" id="quick-grid"></div>
            </div>
        </div>
    `;

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
    const channelsData = store.channelsData;
    let targetCat = category;
    let targetData = channelsData[targetCat]?.[channelName];

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
        const sourceName = activeChannel.data.sources[idx]?.name || "";
        btn.innerHTML = `<span>${sourceName}</span>${isActive ? '<span style="font-size:0.75rem;">(Ativo)</span>' : ''}`;
    });

    const contButtons = document.querySelectorAll("#contingency-servers-grid .btn-server-option");
    contButtons.forEach(btn => {
        const name = btn.dataset.name;
        const isActive = activeChannel.serverType === 'contingency' && activeChannel.contingencyName === name;
        btn.classList.toggle("active", isActive);
        btn.innerHTML = `<span>${name}</span>${isActive ? '<span style="font-size:0.75rem;">(Ativo)</span>' : ''}`;
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

    const statusBadgeHtml = isDirect ? `
        <div class="player-shield-badge native-badge" title="Transmissão direta HLS ativa sem anúncios">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <polyline points="9 12 11 14 15 10"></polyline>
            </svg>
            <span style="color:#4ade80;">HLS Direto Nativo</span>
        </div>
    ` : `
        <div class="player-shield-badge contingency-badge" title="Contingência Web via Iframe com Proteção Ativa">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <polyline points="9 12 11 14 15 10"></polyline>
            </svg>
            <span style="color:#fbbf24;">Contingência Web</span>
        </div>
    `;

    contentDisplay.innerHTML = `
        <div class="player-view-container">
            <!-- Player Header Toolbar -->
            <div class="player-header">
                <div class="player-info">
                    ${logoLargeHtml}
                    <div class="player-title-box">
                        <div style="display:flex;align-items:center;gap:8px;">
                            <h2>${name}</h2>
                            <button id="btn-fav-current" class="btn-card-fav ${isFav ? 'favorited' : ''}" title="${isFav ? 'Remover dos favoritos' : 'Favoritar canal'}">
                                ${isFav ? getUiSvg('starFilled', 16) : getUiSvg('star', 16)}
                            </button>
                        </div>
                        <span class="channel-category-label">
                            <span class="live-indicator"><span class="live-dot"></span> AO VIVO</span> &bull; ${category}
                        </span>
                    </div>
                </div>
                <div class="player-toolbar">
                    ${statusBadgeHtml}
                    <button id="btn-reload-player" class="btn-player-action" title="Recarregar Transmissão">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                        </svg>
                        Recarregar
                    </button>
                    <button id="btn-fullscreen-player" class="btn-player-action" title="Tela Cheia">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                        </svg>
                        Tela Cheia
                    </button>
                    <button id="btn-open-external" class="btn-player-action" title="Abrir em Nova Aba">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                        Nova Aba
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
                        <span style="display:inline-flex;align-items:center;gap:6px;">${getUiSvg('server', 16)} Opções de Transmissão & Servidores</span>
                    </h4>
                    <span class="server-selector-hint">Se a transmissão direta estiver instável, alterne o servidor direto ou selecione uma opção de contingência.</span>
                </div>
                
                ${data.sources && data.sources.length > 0 ? `
                    <div class="server-group-block" id="direct-servers-block">
                        <div class="servers-section-title">
                            <span>Transmissão Direta</span>
                            <span class="badge-server-native">Nativo • Sem Anúncios</span>
                        </div>
                        <div class="servers-grid" id="direct-servers-grid"></div>
                    </div>
                ` : ''}

                ${data.contingency && Object.keys(data.contingency).length > 0 ? `
                    <div class="server-group-block" id="contingency-servers-block" style="margin-top:14px;">
                        <div class="servers-section-title">
                            <span>Servidores de Contingência</span>
                            <span class="badge-server-contingency">Iframe Web</span>
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
                <span>${source.name}</span>
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
                <span>${optName}</span>
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
    const btnFullscreen = document.getElementById("btn-fullscreen-player");
    const btnExternal = document.getElementById("btn-open-external");
    const videoTheater = document.getElementById("video-theater");

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

    if (btnFullscreen && videoTheater) {
        btnFullscreen.addEventListener("click", () => {
            if (activeChannel.serverType === 'direct' && window.tvArtInstance && window.tvArtInstance.fullscreen) {
                window.tvArtInstance.fullscreen.toggle();
            } else {
                if (!document.fullscreenElement) {
                    if (videoTheater.requestFullscreen) videoTheater.requestFullscreen();
                    else if (videoTheater.webkitRequestFullscreen) videoTheater.webkitRequestFullscreen();
                } else {
                    if (document.exitFullscreen) document.exitFullscreen();
                }
            }
        });
    }

    if (btnExternal) {
        btnExternal.addEventListener("click", () => {
            let urlToOpen = "";
            if (activeChannel.serverType === 'direct') {
                const src = activeChannel.data.sources[activeChannel.sourceIndex];
                urlToOpen = src ? src.url : "";
            } else {
                urlToOpen = activeChannel.contingencyUrl || "";
            }
            if (urlToOpen) {
                if (window.tvzinhaSafeOpen) {
                    window.tvzinhaSafeOpen(urlToOpen, "_blank", "noopener,noreferrer");
                } else {
                    window.open(urlToOpen, "_blank", "noopener,noreferrer");
                }
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

/**
 * Resizable Sidebar (drag-to-resize)
 */
export function setupSidebarResizer() {
    const sidebar = document.getElementById("sidebar");
    const sidebarResizer = document.getElementById("sidebar-resizer");
    if (!sidebar || !sidebarResizer) return;

    let isResizing = false;

    // Load saved width from localStorage
    try {
        const savedWidth = localStorage.getItem("tvzinha_sidebar_width");
        if (savedWidth && window.innerWidth > 768) {
            const widthVal = parseInt(savedWidth, 10);
            if (widthVal >= 240 && widthVal <= 600) {
                sidebar.style.width = widthVal + "px";
            }
        }
    } catch (e) {
        console.warn("Erro ao ler largura da sidebar:", e);
    }

    sidebarResizer.addEventListener("mousedown", (e) => {
        if (window.innerWidth <= 768) return;
        e.preventDefault();
        isResizing = true;
        document.body.classList.add("is-resizing");

        function onMouseMove(moveEvent) {
            if (!isResizing) return;
            const newWidth = Math.max(240, Math.min(600, moveEvent.clientX));
            sidebar.style.width = newWidth + "px";
            try {
                localStorage.setItem("tvzinha_sidebar_width", newWidth);
            } catch (err) {}
        }

        function onMouseUp() {
            if (isResizing) {
                isResizing = false;
                document.body.classList.remove("is-resizing");
                window.removeEventListener("mousemove", onMouseMove);
                window.removeEventListener("mouseup", onMouseUp);
            }
        }

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    });
}
