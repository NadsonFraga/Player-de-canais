/**
 * TVZINHA ONLINE - Modern Core Application Logic
 */

// Fallback channels dataset for when opened directly via file:// protocol
const FALLBACK_CHANNELS = {
    "TV Aberta": {
        "Globo": {
            "RJ - Principal": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=6120663-rj1",
            "RJ - Backup": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=globorj",
            "SP - Principal": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=globosp",
            "SP - Backup": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=globosp",
            "BA - Principal": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=globoba",
            "BA - Backup": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=globoba",
            "Opção 5": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=globomg",
            "Opção 6": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=globoes",
            "Opção 7": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=globors",
            "Opção 8": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/cd3.html?id=globors",
            "Opção 9": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=globosc",
            "Opção 10": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=globosc",
            "Opção 11": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=globopr",
            "Opção 12": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=globope",
            "Opção 13": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=globope",
            "Opção 16": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=globoce",
            "Opção 17": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=globopi",
            "Opção 18": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=globoam",
            "Opção 19": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=globorn",
            "Opção 20": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=globopb",
            "Opção 21": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=globoal",
            "Opção 22": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=globose",
            "Opção 23": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=globomt",
            "Opção 24": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=globopa"
        },
        "Band": {
            "Principal": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/eventos/band.html?id=019a797e-eeb8-7eda-9518-132403ccb160",
            "Backup": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/eventos/band.html?id=019cc41a-ccc4-75e0-a31f-9bf47fad8d8b"
        },
        "SBT": {
            "SP - Principal": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=sbtsp",
            "RJ - Principal": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=sbtrj",
            "Alternativo": "https://youtube-player.sbt.com.br/?videoID=ABVQXgr2LW4&t=0&adunit=/1011235/SBT_Videos/Especiais/SBT_Live/video"
        }
    },
    "Esportes": {
        "SporTV": {
            "Principal": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=sportv",
            "Backup": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/premiere/primebr.html?id=sportv",
            "Alternativo": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=sportv"
        },
        "SporTV 2": {
            "Principal": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=sportv2",
            "Backup": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/premiere/primebr.html?id=sportv2",
            "Alternativo": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/premiere/primebr.html?id=sportv2sd"
        },
        "SporTV 3": {
            "Principal": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=sportv3",
            "Backup": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/premiere/primebr.html?id=sportv3",
            "Alternativo": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/premiere/primebr.html?id=sportv3sd"
        },
        "Premiere": {
            "Principal": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=premiere",
            "Backup": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/premiere/primebr.html?id=premiere",
            "Alternativo": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/primebr.html?id=premieresd"
        }
    }
};

document.addEventListener("DOMContentLoaded", () => {
    // --- State Management ---
    let channelsData = {};
    let activeFilter = "all";
    let searchQuery = "";
    let activeChannel = null; // { category, name, players, currentPlayerName, currentPlayerUrl }

    // Load Favorites from LocalStorage
    let favorites = new Set();
    try {
        const savedFavs = localStorage.getItem("tvzinha_favorites");
        if (savedFavs) {
            favorites = new Set(JSON.parse(savedFavs));
        }
    } catch (e) {
        console.warn("Erro ao carregar favoritos:", e);
    }

    // --- DOM Elements ---
    const channelsListEl = document.getElementById("channels-list");
    const filterPillsEl = document.getElementById("filter-pills");
    const searchInput = document.getElementById("search-input");
    const btnClearSearch = document.getElementById("btn-clear-search");
    const contentDisplay = document.getElementById("content-display");
    const brandHomeBtn = document.getElementById("brand-home");
    const mobileBrandHomeBtn = document.getElementById("mobile-brand-home");

    // Mobile Elements
    const btnToggleMenu = document.getElementById("btn-toggle-menu");
    const btnCloseMenu = document.getElementById("btn-close-menu");
    const sidebar = document.getElementById("sidebar");
    const sidebarBackdrop = document.getElementById("sidebar-backdrop");

    // --- Monochromatic UI SVGs Registry ---
    function getUiSvg(name, size = 16) {
        const icons = {
            tv: `<svg class="category-header-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>`,
            sports: `<svg class="category-header-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"></path><path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path></svg>`,
            broadcast: `<svg class="category-header-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"></circle><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path></svg>`,
            star: `<svg class="star-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
            starFilled: `<svg class="star-icon filled" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
            calendar: `<svg class="icon-svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
            info: `<svg class="icon-svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
            server: `<svg class="icon-svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>`
        };
        return icons[name] || '';
    }

    // --- Mapping Channels to Images in logos/ ---
    const CHANNEL_LOGOS = {
        "globo": "logos/globo.png",
        "band": "logos/Band.png",
        "sbt": "logos/sbt.png",
        "sportv 3": "logos/sportv3.png",
        "sportv3": "logos/sportv3.png",
        "sportv 2": "logos/sportv2.png",
        "sportv2": "logos/sportv2.png",
        "sportv": "logos/sportv.png",
        "premiere": "logos/premiere.png"
    };

    function getChannelLogoSrc(channelName) {
        const name = channelName.toLowerCase().trim();
        if (name.includes("sportv 3") || name.includes("sportv3")) return CHANNEL_LOGOS["sportv 3"];
        if (name.includes("sportv 2") || name.includes("sportv2")) return CHANNEL_LOGOS["sportv 2"];
        if (name.includes("sportv")) return CHANNEL_LOGOS["sportv"];
        if (name.includes("globo")) return CHANNEL_LOGOS["globo"];
        if (name.includes("band")) return CHANNEL_LOGOS["band"];
        if (name.includes("sbt")) return CHANNEL_LOGOS["sbt"];
        if (name.includes("premiere")) return CHANNEL_LOGOS["premiere"];
        return null;
    }

    function createLogoBadgeHtml(channelName, size = 'sm') {
        const imgSrc = getChannelLogoSrc(channelName);
        const sizeClass = size === 'lg' ? 'logo-lg' : (size === 'md' ? 'logo-md' : 'logo-sm');

        if (imgSrc) {
            return `
                <div class="channel-logo-img-wrapper ${sizeClass}">
                    <img src="${imgSrc}" alt="${channelName}" class="channel-logo-img" loading="lazy">
                </div>
            `;
        }

        return `
            <div class="channel-logo-img-wrapper channel-logo-fallback ${sizeClass}">
                <span>${channelName.slice(0, 3).toUpperCase()}</span>
            </div>
        `;
    }

    // --- 1. Initialization & Data Fetching ---
    async function initApp() {
        try {
            const response = await fetch("canais.json");
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            channelsData = await response.json();
        } catch (error) {
            console.warn("Aviso: fetch de canais.json falhou (aberto via file://). Usando dataset local:", error);
            channelsData = FALLBACK_CHANNELS;
        }

        buildCategoryPills();
        renderSidebar();
        renderHomeView();
    }

    // --- Vasco Upcoming Matches Module ---
    let cachedVascoMatches = null;

    function formatMatchDateTime(dateStr, hourStr) {
        if (!dateStr) return { formattedDate: "Data a definir", isToday: false, isTomorrow: false };
        try {
            const [year, month, day] = dateStr.split("-").map(Number);
            const matchDate = new Date(year, month - 1, day);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const isToday = matchDate.getTime() === today.getTime();
            const isTomorrow = matchDate.getTime() === tomorrow.getTime();

            const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
            const weekday = weekdays[matchDate.getDay()];
            const formattedDayMonth = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
            const timePart = hourStr && hourStr !== "A definir" ? hourStr : "Horário a definir";

            return {
                formattedDate: `${weekday}, ${formattedDayMonth} • ${timePart}`,
                isToday,
                isTomorrow
            };
        } catch (e) {
            return {
                formattedDate: `${dateStr} ${hourStr || ''}`,
                isToday: false,
                isTomorrow: false
            };
        }
    }

    function findMatchingChannel(sourceName) {
        if (!sourceName || !channelsData) return null;
        const normalizedSource = sourceName.toLowerCase().replace(/[^a-z0-9]/g, "");

        for (const [category, channels] of Object.entries(channelsData)) {
            for (const [channelName, players] of Object.entries(channels)) {
                const normalizedChannel = channelName.toLowerCase().replace(/[^a-z0-9]/g, "");
                if (normalizedChannel.includes(normalizedSource) || normalizedSource.includes(normalizedChannel)) {
                    return { category, channelName, players };
                }
            }
        }
        return null;
    }

    async function fetchAndRenderVascoMatches() {
        const gridEl = document.getElementById("vasco-matches-grid");
        if (!gridEl) return;

        let matches = cachedVascoMatches;
        if (!matches) {
            try {
                const response = await fetch("arquivos/proximos_jogos.json");
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                matches = await response.json();
                cachedVascoMatches = matches;
            } catch (err) {
                console.warn("Aviso ao carregar próximos jogos:", err);
            }
        }

        if (!matches || !Array.isArray(matches) || matches.length === 0) {
            gridEl.innerHTML = `
                <div class="match-card" style="grid-column: 1 / -1; text-align: center; padding: 24px;">
                    <p style="color: var(--text-secondary); margin-bottom: 6px;">Nenhum jogo agendado para os próximos dias.</p>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">A agenda é atualizada periodicamente via Globo Esporte.</span>
                </div>
            `;
            return;
        }

        gridEl.innerHTML = "";

        matches.forEach((match, index) => {
            const card = document.createElement("div");
            const isFeatured = index === 0;
            card.className = `match-card ${isFeatured ? 'featured' : ''}`;

            const { formattedDate, isToday, isTomorrow } = formatMatchDateTime(match.data, match.hora);

            let statusBadgeHtml = '';
            if (isToday) {
                statusBadgeHtml = `<span class="match-status-badge today"><span class="live-dot"></span> HOJE</span>`;
            } else if (isTomorrow) {
                statusBadgeHtml = `<span class="match-status-badge tomorrow">AMANHÃ</span>`;
            } else if (isFeatured) {
                statusBadgeHtml = `<span class="match-status-badge featured">PRÓXIMO JOGO</span>`;
            }

            const mandanteEscudo = match.mandante?.escudo || 'logos/fav/favicon.svg';
            const visitanteEscudo = match.visitante?.escudo || 'logos/fav/favicon.svg';

            const broadcastList = match.ondeAssistir || [];
            let broadcastPillsHtml = '';

            if (broadcastList.length > 0) {
                broadcastPillsHtml = broadcastList.map(source => {
                    const matchedChannel = findMatchingChannel(source);
                    if (matchedChannel) {
                        return `<button class="broadcast-pill playable" data-category="${matchedChannel.category}" data-channel="${matchedChannel.channelName}" title="Assistir no canal ${matchedChannel.channelName}">▶ ${source}</button>`;
                    }
                    return `<span class="broadcast-pill">${source}</span>`;
                }).join('');
            } else {
                broadcastPillsHtml = `<span class="broadcast-pill empty">Transmissão a confirmar</span>`;
            }

            const stadiumText = match.local && match.local !== "A definir" ? match.local : "Local a definir";

            card.innerHTML = `
                <div class="match-top-bar">
                    <span class="championship-badge" title="${match.campeonato || 'Competição'}">${match.campeonato || 'Competição'}</span>
                    ${statusBadgeHtml}
                </div>

                <div class="match-duel">
                    <div class="duel-team">
                        <div class="duel-badge-wrapper">
                            <img src="${mandanteEscudo}" alt="${match.mandante?.nome || 'Mandante'}" loading="lazy" onerror="this.src='logos/fav/favicon.svg'">
                        </div>
                        <span class="duel-team-name" title="${match.mandante?.nome || ''}">${match.mandante?.nome || 'Mandante'}</span>
                    </div>

                    <div class="duel-vs-box">
                        <span class="duel-vs">VS</span>
                        <span class="duel-date-time">${formattedDate}</span>
                    </div>

                    <div class="duel-team">
                        <div class="duel-badge-wrapper">
                            <img src="${visitanteEscudo}" alt="${match.visitante?.nome || 'Visitante'}" loading="lazy" onerror="this.src='logos/fav/favicon.svg'">
                        </div>
                        <span class="duel-team-name" title="${match.visitante?.nome || ''}">${match.visitante?.nome || 'Visitante'}</span>
                    </div>
                </div>

                <div class="match-meta-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span class="match-meta-stadium" title="${stadiumText}">${stadiumText}</span>
                </div>

                <div class="match-broadcast-footer">
                    <span class="broadcast-label">Onde Assistir</span>
                    <div class="broadcast-pills">
                        ${broadcastPillsHtml}
                    </div>
                </div>
            `;

            // Attach play click listeners for broadcast buttons
            const playBtns = card.querySelectorAll(".broadcast-pill.playable");
            playBtns.forEach(btn => {
                btn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const cat = btn.getAttribute("data-category");
                    const ch = btn.getAttribute("data-channel");
                    if (cat && ch && channelsData[cat] && channelsData[cat][ch]) {
                        selectChannel(cat, ch, channelsData[cat][ch]);
                    }
                });
            });

            gridEl.appendChild(card);
        });
    }

    // --- Return to Home View ---
    function renderHomeView() {
        activeChannel = null;

        contentDisplay.innerHTML = `
            <div class="welcome-screen">
                <div class="welcome-hero">
                    <div class="hero-badge">
                        <span class="live-dot"></span> Grade de Canais Ao Vivo
                    </div>
                    <h1 class="hero-title">Escolha um canal para assistir agora</h1>
                    <p class="hero-subtitle">
                        Acesse transmissões de alta estabilidade de <strong>TV Aberta</strong> e <strong>Esportes</strong> com múltiplos servidores disponíveis.
                    </p>
                </div>

                <!-- Vasco Upcoming Matches Section -->
                <section class="vasco-matches-section" id="vasco-matches-section">
                    <div class="section-heading">
                        <div class="matches-heading-left">
                            <span class="matches-team-badge">${getUiSvg('calendar', 18)}</span>
                            <div>
                                <h3>Próximos Jogos do Vascão</h3>
                                <span class="section-hint">Agenda atualizada dos próximos confrontos</span>
                            </div>
                        </div>
                        <span class="matches-source-tag">via ge.globo</span>
                    </div>
                    <div class="matches-grid" id="vasco-matches-grid">
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
        fetchAndRenderVascoMatches();
        renderSidebar();
    }

    if (brandHomeBtn) brandHomeBtn.addEventListener("click", renderHomeView);
    if (mobileBrandHomeBtn) mobileBrandHomeBtn.addEventListener("click", renderHomeView);

    // --- 2. Mobile Menu Management ---
    function openMobileMenu() {
        sidebar.classList.add("open");
        sidebarBackdrop.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    function closeMobileMenu() {
        sidebar.classList.remove("open");
        sidebarBackdrop.classList.remove("active");
        document.body.style.overflow = "";
    }

    if (btnToggleMenu) btnToggleMenu.addEventListener("click", openMobileMenu);
    if (btnCloseMenu) btnCloseMenu.addEventListener("click", closeMobileMenu);
    if (sidebarBackdrop) sidebarBackdrop.addEventListener("click", closeMobileMenu);

    // --- 2.1 Resizable Sidebar (Drag to Resize) ---
    const sidebarResizer = document.getElementById("sidebar-resizer");
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

    if (sidebarResizer) {
        sidebarResizer.addEventListener("mousedown", (e) => {
            if (window.innerWidth <= 768) return; // disable on mobile drawer
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

    // --- 3. Filter Pills & Search ---
    function buildCategoryPills() {
        filterPillsEl.innerHTML = "";

        // All pill
        const allBtn = document.createElement("button");
        allBtn.className = `pill ${activeFilter === "all" ? "active" : ""}`;
        allBtn.dataset.category = "all";
        allBtn.textContent = "Todos";
        allBtn.addEventListener("click", () => setCategoryFilter("all"));
        filterPillsEl.appendChild(allBtn);

        // Favorites pill
        const favsBtn = document.createElement("button");
        favsBtn.className = `pill ${activeFilter === "favs" ? "active" : ""}`;
        favsBtn.dataset.category = "favs";
        favsBtn.innerHTML = `${getUiSvg('star', 13)} Favoritos`;
        favsBtn.addEventListener("click", () => setCategoryFilter("favs"));
        filterPillsEl.appendChild(favsBtn);

        // Categories from JSON
        Object.keys(channelsData).forEach(category => {
            const pill = document.createElement("button");
            pill.className = `pill ${activeFilter === category ? "active" : ""}`;
            pill.dataset.category = category;
            pill.textContent = category;
            pill.addEventListener("click", () => setCategoryFilter(category));
            filterPillsEl.appendChild(pill);
        });
    }

    function setCategoryFilter(category) {
        activeFilter = category;
        const pills = filterPillsEl.querySelectorAll(".pill");
        pills.forEach(pill => {
            const cat = pill.getAttribute("data-category") || (pill.textContent.trim() === "Todos" ? "all" : "");
            if (cat === category) {
                pill.classList.add("active");
            } else {
                pill.classList.remove("active");
            }
        });
        renderSidebar();
    }

    // Live search
    searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        if (searchQuery.length > 0) {
            btnClearSearch.classList.remove("hidden");
        } else {
            btnClearSearch.classList.add("hidden");
        }
        renderSidebar();
    });

    btnClearSearch.addEventListener("click", () => {
        searchInput.value = "";
        searchQuery = "";
        btnClearSearch.classList.add("hidden");
        searchInput.focus();
        renderSidebar();
    });

    // --- Favorites Helper ---
    function toggleFavorite(channelKey, e) {
        if (e) e.stopPropagation();
        if (favorites.has(channelKey)) {
            favorites.delete(channelKey);
        } else {
            favorites.add(channelKey);
        }
        try {
            localStorage.setItem("tvzinha_favorites", JSON.stringify([...favorites]));
        } catch (err) {
            console.warn("Erro ao salvar favoritos:", err);
        }
        renderSidebar();
        if (!activeChannel) {
            renderChannelGridCards();
        }
    }

    // --- 4. Sidebar Rendering ---
    function renderSidebar() {
        channelsListEl.innerHTML = "";

        let totalMatchingChannels = 0;

        Object.entries(channelsData).forEach(([category, channels]) => {
            if (activeFilter !== "all" && activeFilter !== "favs" && activeFilter !== category) {
                return;
            }

            // Filter channels
            const channelEntries = Object.entries(channels).filter(([channelName]) => {
                const channelKey = `${category}:${channelName}`;
                if (activeFilter === "favs" && !favorites.has(channelKey)) {
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
                
                const playersCount = Object.keys(players).length;
                const logoHtml = createLogoBadgeHtml(channelName, 'sm');
                const channelKey = `${category}:${channelName}`;
                const isFav = favorites.has(channelKey);

                channelBtn.innerHTML = `
                    <div class="channel-info-left">
                        ${logoHtml}
                        <span class="channel-name">${channelName}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span class="channel-options-count">${playersCount} opç</span>
                        <span style="display:inline-flex;align-items:center;color:${isFav ? 'var(--accent-gold)' : 'transparent'};">${isFav ? getUiSvg('starFilled', 12) : ''}</span>
                    </div>
                `;

                channelBtn.addEventListener("click", () => {
                    selectChannel(category, channelName, players);
                    if (window.innerWidth <= 768) {
                        closeMobileMenu();
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

    function getCategoryIcon(category) {
        if (category.toLowerCase().includes("esporte")) return getUiSvg('sports', 16);
        if (category.toLowerCase().includes("aberta")) return getUiSvg('tv', 16);
        return getUiSvg('broadcast', 16);
    }

    // --- 5. Channel Grid Cards on Home Screen ---
    function renderChannelGridCards() {
        const gridEl = document.getElementById("quick-grid");
        if (!gridEl) return;
        gridEl.innerHTML = "";

        const allChannels = [];
        Object.entries(channelsData).forEach(([category, channels]) => {
            Object.entries(channels).forEach(([channelName, players]) => {
                allChannels.push({ category, channelName, players });
            });
        });

        allChannels.forEach(({ category, channelName, players }) => {
            const card = document.createElement("div");
            card.className = "quick-card";
            const optionsCount = Object.keys(players).length;
            const logoLargeHtml = createLogoBadgeHtml(channelName, 'lg');
            const channelKey = `${category}:${channelName}`;
            const isFav = favorites.has(channelKey);

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
            favBtn.addEventListener("click", (e) => {
                toggleFavorite(channelKey, e);
            });

            // Card play click
            card.addEventListener("click", () => {
                selectChannel(category, channelName, players);
            });

            gridEl.appendChild(card);
        });
    }

    // --- 6. Channel Selection & Player Rendering ---
    function selectChannel(category, channelName, players, preferredPlayerName = null) {
        const playerNames = Object.keys(players);
        if (playerNames.length === 0) return;

        const defaultPlayerName = preferredPlayerName && players[preferredPlayerName] 
            ? preferredPlayerName 
            : playerNames[0];
        const defaultPlayerUrl = players[defaultPlayerName];

        activeChannel = {
            category,
            name: channelName,
            players,
            currentPlayerName: defaultPlayerName,
            currentPlayerUrl: defaultPlayerUrl
        };

        renderPlayerView();
        renderSidebar();
    }

    function renderPlayerView() {
        if (!activeChannel) return;

        const { category, name, players, currentPlayerName, currentPlayerUrl } = activeChannel;
        const logoLargeHtml = createLogoBadgeHtml(name, 'md');
        const channelKey = `${category}:${name}`;
        const isFav = favorites.has(channelKey);

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
                    <iframe 
                        id="stream-iframe"
                        src="${currentPlayerUrl}" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowfullscreen
                        sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
                    ></iframe>
                </div>

                <!-- Server Selector & Switcher -->
                <div class="server-selector-card">
                    <div class="server-selector-header">
                        <h4>
                            <span style="display:inline-flex;align-items:center;gap:6px;">${getUiSvg('server', 16)} Opções de Player & Servidores</span>
                        </h4>
                        <span class="server-selector-hint">Se a transmissão travar, alterne para outra opção</span>
                    </div>
                    <div class="servers-grid" id="servers-grid">
                        <!-- Server buttons -->
                    </div>
                    <div class="stream-tip-note">
                        <span style="display:inline-flex;align-items:center;">${getUiSvg('info', 16)}</span>
                        <span>Dica: Caso o player apresente tela preta ou bloqueio, utilize o botão <strong>"Nova Aba"</strong> no topo.</span>
                    </div>
                </div>
            </div>
        `;

        // Favorite button listener in player
        const favBtnCurrent = document.getElementById("btn-fav-current");
        if (favBtnCurrent) {
            favBtnCurrent.addEventListener("click", () => {
                toggleFavorite(channelKey);
                renderPlayerView();
            });
        }

        // Render Server Buttons
        const serversGridEl = document.getElementById("servers-grid");
        Object.entries(players).forEach(([optionName, optionUrl]) => {
            const isOptionActive = optionName === currentPlayerName;
            const btn = document.createElement("button");
            btn.className = `btn-server-option ${isOptionActive ? "active" : ""}`;
            btn.innerHTML = `
                <span>${optionName}</span>
                ${isOptionActive ? '<span style="font-size:0.75rem;">(Ativo)</span>' : ''}
            `;

            btn.addEventListener("click", () => {
                if (optionName !== activeChannel.currentPlayerName) {
                    activeChannel.currentPlayerName = optionName;
                    activeChannel.currentPlayerUrl = optionUrl;
                    renderPlayerView();
                }
            });

            serversGridEl.appendChild(btn);
        });

        // Video Loader Management
        const iframe = document.getElementById("stream-iframe");
        const loader = document.getElementById("video-loader");
        if (iframe && loader) {
            iframe.onload = () => {
                loader.classList.add("hidden");
            };
            setTimeout(() => {
                loader.classList.add("hidden");
            }, 3000);
        }

        // Attach Toolbar Actions
        const btnReload = document.getElementById("btn-reload-player");
        const btnFullscreen = document.getElementById("btn-fullscreen-player");
        const btnExternal = document.getElementById("btn-open-external");
        const videoTheater = document.getElementById("video-theater");

        if (btnReload && iframe) {
            btnReload.addEventListener("click", () => {
                loader.classList.remove("hidden");
                iframe.src = activeChannel.currentPlayerUrl;
            });
        }

        if (btnExternal) {
            btnExternal.addEventListener("click", () => {
                window.open(activeChannel.currentPlayerUrl, "_blank", "noopener,noreferrer");
            });
        }

        if (btnFullscreen && videoTheater) {
            btnFullscreen.addEventListener("click", () => {
                if (!document.fullscreenElement) {
                    if (videoTheater.requestFullscreen) {
                        videoTheater.requestFullscreen();
                    } else if (videoTheater.webkitRequestFullscreen) {
                        videoTheater.webkitRequestFullscreen();
                    } else if (videoTheater.msRequestFullscreen) {
                        videoTheater.msRequestFullscreen();
                    }
                } else {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    }
                }
            });
        }
    }

    // --- Initialize ---
    initApp();
});