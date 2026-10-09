/**
 * TVZINHA ONLINE - Dynamic Multi-Team Upcoming Matches Module (Sports)
 * Fetches and renders match schedule feeds with team crest resolution and custom team picker
 */

import { store } from '../core/state.js?v=20261009_a';
import { FAVORITE_TEAM_KEY, KNOWN_TEAM_CRESTS, GITHUB_RAW_FEED_URL } from '../core/constants.js?v=20261009_a';
import { getUiSvg } from '../core/icons.js?v=20261009_a';
import { showToast } from '../core/toast.js?v=20261009_a';
import { pushNavLayer, popNavLayer } from '../navigation/historyManager.js?v=20261009_a';

let matchesRefreshTimer = null;
let isTeamModalInitialized = false;

function normalizeSearchText(str) {
    if (!str) return "";
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export function resolveClientTeamCrest(teamId, teamInfo) {
    if (teamInfo && teamInfo.escudo && teamInfo.escudo.startsWith("http")) {
        return teamInfo.escudo;
    }
    const matches = (teamInfo && teamInfo.matches) || [];
    const targetName = ((teamInfo && teamInfo.name) || teamId).toLowerCase();
    for (const m of matches) {
        const mName = (m.mandante?.nome || "").toLowerCase();
        if ((mName.includes(targetName) || targetName.includes(mName)) && m.mandante?.escudo) {
            return m.mandante.escudo;
        }
        const vName = (m.visitante?.nome || "").toLowerCase();
        if ((vName.includes(targetName) || targetName.includes(vName)) && m.visitante?.escudo) {
            return m.visitante.escudo;
        }
    }
    return KNOWN_TEAM_CRESTS[teamId] || KNOWN_TEAM_CRESTS["brasil"] || "assets/logos/fav/favicon.svg";
}

export function getFavoriteTeam() {
    return store.favoriteTeam || localStorage.getItem(FAVORITE_TEAM_KEY) || null;
}

export function setFavoriteTeam(teamId) {
    store.setFavoriteTeam(teamId);
}

export async function fetchUpcomingMatches() {
    if (store.cachedScheduleFeed) {
        return store.cachedScheduleFeed;
    }

    try {
        const remoteUrl = `${GITHUB_RAW_FEED_URL}?t=${Date.now()}`;
        const response = await fetch(remoteUrl, { cache: "no-store" });
        if (response.ok) {
            const data = await response.json();
            if (data && (data.teams || data.times || data.vasco)) {
                store.setCachedScheduleFeed(data);
                return data;
            }
        }
    } catch (e) {
        console.warn("[MatchesFeed] Aviso ao buscar feed do GitHub:", e);
    }

    try {
        const response = await fetch("data/proximos_jogos.json?t=" + Date.now(), { cache: "no-store" });
        if (response.ok) {
            const data = await response.json();
            store.setCachedScheduleFeed(data);
            return data;
        }
    } catch (e) {
        console.warn("[MatchesFeed] Erro ao carregar feed local de jogos:", e);
    }

    return null;
}

export function getTeamScheduleData(feed, teamId) {
    if (!feed) return null;
    const teamsMap = feed.teams || feed.times;
    if (teamsMap && teamsMap[teamId]) {
        return teamsMap[teamId];
    }
    if (teamId === "vasco" && feed.vasco) {
        return {
            name: "Vasco da Gama",
            escudo: KNOWN_TEAM_CRESTS["vasco"],
            matches: feed.vasco
        };
    }
    if (feed[teamId] && Array.isArray(feed[teamId])) {
        return {
            name: teamId.charAt(0).toUpperCase() + teamId.slice(1),
            escudo: KNOWN_TEAM_CRESTS[teamId] || KNOWN_TEAM_CRESTS["brasil"],
            matches: feed[teamId]
        };
    }
    return null;
}

export function setupTeamSelectModal() {
    if (isTeamModalInitialized) return;
    const modal = document.getElementById("team-select-modal");
    const btnClose = document.getElementById("btn-close-team-modal");
    const searchInput = document.getElementById("team-search-input");

    if (!modal) return;
    isTeamModalInitialized = true;

    if (btnClose) {
        btnClose.addEventListener("click", closeTeamSelectModal);
    }

    // Close on backdrop click
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            closeTeamSelectModal();
        }
    });

    // Delegated click for change team buttons
    document.addEventListener("click", (e) => {
        const btn = e.target.closest("#btn-change-team, #btn-home-team-shortcut");
        if (btn) {
            e.preventDefault();
            openTeamSelectModal();
        }
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.classList.contains("active")) {
            closeTeamSelectModal();
        }
    });

    // Search filter input
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            const query = normalizeSearchText(searchInput.value);
            const cards = modal.querySelectorAll(".team-select-card");
            let visibleCount = 0;

            cards.forEach(card => {
                const teamName = card.getAttribute("data-team-name") || "";
                const normName = normalizeSearchText(teamName);
                const matches = normName.includes(query);
                card.style.display = matches ? "flex" : "none";
                if (matches) visibleCount++;
            });

            let emptyMsg = modal.querySelector(".teams-empty-search");
            if (visibleCount === 0) {
                if (!emptyMsg) {
                    emptyMsg = document.createElement("div");
                    emptyMsg.className = "teams-empty-search";
                    const grid = document.getElementById("teams-grid");
                    if (grid) grid.appendChild(emptyMsg);
                }
                emptyMsg.textContent = `Nenhum clube encontrado para "${searchInput.value}"`;
                emptyMsg.style.display = "block";
            } else if (emptyMsg) {
                emptyMsg.style.display = "none";
            }
        });
    }
}

export async function openTeamSelectModal() {
    const modal = document.getElementById("team-select-modal");
    const grid = document.getElementById("teams-grid");
    const searchInput = document.getElementById("team-search-input");
    if (!modal || !grid) return;

    setupTeamSelectModal();

    const feed = await fetchUpcomingMatches();
    const teams = (feed?.teams || feed?.times) || {};
    const currentFavorite = getFavoriteTeam();

    grid.innerHTML = "";

    // Sort teams alphabetically, keeping Seleção Brasileira at the top or end
    const sortedEntries = Object.entries(teams).sort((a, b) => {
        if (a[0] === 'brasil') return 1;
        if (b[0] === 'brasil') return -1;
        const nameA = a[1].name || a[0];
        const nameB = b[1].name || b[0];
        return nameA.localeCompare(nameB, 'pt-BR');
    });

    sortedEntries.forEach(([teamId, teamInfo]) => {
        const card = document.createElement("div");
        const isSelected = teamId === currentFavorite;
        card.className = `team-select-card ${isSelected ? 'active' : ''}`;
        card.setAttribute("data-team-id", teamId);
        card.setAttribute("data-team-name", teamInfo.name || teamId);
        card.setAttribute("tabindex", "0");
        card.setAttribute("role", "button");
        card.setAttribute("aria-label", `Selecionar ${teamInfo.name || teamId}`);

        const checkHtml = isSelected ? `<span class="team-card-check">${getUiSvg('check', 11)}</span>` : '';
        const crestUrl = resolveClientTeamCrest(teamId, teamInfo);

        card.innerHTML = `
            ${checkHtml}
            <div class="team-card-crest-wrapper">
                <img src="${crestUrl}" alt="${teamInfo.name || teamId}" class="team-card-crest" loading="lazy" onerror="this.src='assets/logos/fav/favicon.svg'">
            </div>
            <span class="team-card-name">${teamInfo.name || teamId}</span>
        `;

        card.addEventListener("click", () => {
            setFavoriteTeam(teamId);
            closeTeamSelectModal();
            renderMatchesSection();
            showToast(`Time alterado para ${teamInfo.name || teamId}`);
        });

        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setFavoriteTeam(teamId);
                closeTeamSelectModal();
                renderMatchesSection();
                showToast(`Time alterado para ${teamInfo.name || teamId}`);
            }
        });

        grid.appendChild(card);
    });

    if (searchInput) {
        searchInput.value = "";
        const cards = grid.querySelectorAll(".team-select-card");
        cards.forEach(c => c.style.display = "flex");
        const emptyMsg = grid.querySelector(".teams-empty-search");
        if (emptyMsg) emptyMsg.style.display = "none";
    }

    const wasHidden = modal.classList.contains("hidden");
    modal.classList.add("active");
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (wasHidden) {
        pushNavLayer('modal-team');
    }

    setTimeout(() => {
        if (searchInput) searchInput.focus();
    }, 120);
}

export function closeTeamSelectModal() {
    const modal = document.getElementById("team-select-modal");
    if (!modal) return;
    const wasOpen = !modal.classList.contains("hidden");
    modal.classList.remove("active");
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (wasOpen) {
        popNavLayer();
    }
}

export function formatMatchDateTime(dateStr, hourStr) {
    if (!dateStr) return { formattedDate: "Data a definir", dateDayText: "Data a definir", timePart: "A definir", isToday: false, isTomorrow: false, countdownBadge: "" };
    try {
        const [year, month, day] = dateStr.split("-").map(Number);
        const matchDate = new Date(year, month - 1, day);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const isToday = matchDate.getTime() === today.getTime();
        const isTomorrow = matchDate.getTime() === tomorrow.getTime();

        const diffTime = matchDate.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        let countdownBadge = "";
        if (diffDays <= 0) {
            countdownBadge = "HOJE";
        } else if (diffDays === 1) {
            countdownBadge = "AMANHÃ";
        } else {
            countdownBadge = `EM ${diffDays} DIAS`;
        }

        const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        const weekday = weekdays[matchDate.getDay()];
        const formattedDayMonth = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
        const timePart = hourStr && hourStr !== "A definir" ? hourStr : "A definir";
        const dateDayText = `${weekday}, ${formattedDayMonth}`;

        return {
            formattedDate: `${dateDayText} • ${timePart}`,
            dateDayText,
            timePart,
            isToday,
            isTomorrow,
            diffDays,
            countdownBadge
        };
    } catch (e) {
        return {
            formattedDate: `${dateStr} ${hourStr || ''}`,
            dateDayText: dateStr || "Data a definir",
            timePart: hourStr || "A definir",
            isToday: false,
            isTomorrow: false,
            diffDays: null,
            countdownBadge: ""
        };
    }
}

export async function renderMatchesSection() {
    const section = document.getElementById("vasco-matches-section");
    if (!section) return;

    const currentTeamId = getFavoriteTeam();
    const badgeEl = document.getElementById("matches-team-badge");
    const titleEl = document.getElementById("matches-section-title");
    const hintEl = document.getElementById("matches-section-hint");
    const btnChangeLabel = document.getElementById("btn-change-team-label");
    const btnChange = document.getElementById("btn-change-team");
    const btnHomeShortcut = document.getElementById("btn-home-team-shortcut");
    const carouselFooter = document.getElementById("matches-carousel-footer");
    const navArrows = document.getElementById("matches-nav-arrows");
    const gridEl = document.getElementById("vasco-matches-grid");

    if (btnChange) {
        btnChange.onclick = openTeamSelectModal;
    }
    if (btnHomeShortcut) {
        btnHomeShortcut.onclick = openTeamSelectModal;
    }

    // --- CASE 1: No Team Selected (Friendly Unselected State) ---
    if (!currentTeamId) {
        if (titleEl) titleEl.textContent = "Próximos Jogos de Futebol";
        if (hintEl) hintEl.textContent = "Agenda de confrontos do futebol brasileiro (via ge.globo)";
        if (badgeEl) badgeEl.innerHTML = getUiSvg('calendar', 18);
        if (btnChangeLabel) btnChangeLabel.textContent = "Escolher Time";
        if (carouselFooter) carouselFooter.style.display = "none";
        if (navArrows) navArrows.style.display = "none";

        if (gridEl) {
            gridEl.innerHTML = `
                <div class="unselected-team-card">
                    <div class="unselected-icon-bubble" aria-hidden="true">
                        ${getUiSvg('trophy', 26)}
                    </div>
                    <h4 class="unselected-title">Acompanhe os Jogos do seu Time</h4>
                    <p class="unselected-desc">
                        Escolha seu clube favorito para ver as datas, horários e canais de transmissão ao vivo das próximas partidas.
                    </p>
                    <button class="btn-choose-team-cta" id="btn-unselected-choose" type="button">
                        ${getUiSvg('trophy', 16)}
                        <span>Escolher meu time</span>
                    </button>
                </div>
            `;
            const chooseBtn = document.getElementById("btn-unselected-choose");
            if (chooseBtn) {
                chooseBtn.onclick = () => openTeamSelectModal();
            }
        }
        return;
    }

    if (carouselFooter) carouselFooter.style.display = "";
    if (navArrows) navArrows.style.display = "";

    const feed = await fetchUpcomingMatches();
    const teamData = getTeamScheduleData(feed, currentTeamId);

    if (!teamData || !teamData.matches || teamData.matches.length === 0) {
        if (titleEl) titleEl.textContent = `Próximos Jogos - ${teamData?.name || "Clube"}`;
        if (gridEl) {
            gridEl.innerHTML = `
                <div class="match-card" style="grid-column: 1 / -1; text-align: center; padding: 28px 20px;">
                    <p style="color: var(--text-primary); font-weight: 600; margin-bottom: 6px;">Nenhum jogo agendado para o ${teamData?.name || "clube"} no momento.</p>
                    <span style="font-size: 0.82rem; color: var(--text-muted);">Isso ocorre em intervalos de competições, férias ou Data FIFA. A agenda é sincronizada via ge.globo.</span>
                </div>
            `;
        }
        return;
    }

    if (badgeEl) {
        const teamCrest = resolveClientTeamCrest(currentTeamId, teamData);
        badgeEl.innerHTML = `<img src="${teamCrest}" alt="${teamData.name}" class="team-header-crest matches-header-crest" onerror="this.src='${KNOWN_TEAM_CRESTS['brasil']}'">`;
    }
    if (titleEl) titleEl.textContent = `Próximos Jogos - ${teamData.name}`;
    if (hintEl) hintEl.textContent = `Agenda atualizada do ${teamData.name} (via ge.globo)`;
    if (btnChangeLabel) btnChangeLabel.textContent = "Trocar Time";

    // Render matches cards inside carousel
    if (!gridEl) return;
    gridEl.innerHTML = "";

    teamData.matches.forEach((match, index) => {
        const card = document.createElement("div");
        const isFeatured = index === 0;
        card.className = `match-card ${isFeatured ? 'featured' : ''}`;
        card.tabIndex = 0;

        const mandanteNome = match.mandante?.nome || "Mandante";
        const visitanteNome = match.visitante?.nome || "Visitante";
        const mandanteEscudo = match.mandante?.escudo || KNOWN_TEAM_CRESTS["brasil"] || "assets/logos/fav/favicon.svg";
        const visitanteEscudo = match.visitante?.escudo || KNOWN_TEAM_CRESTS["brasil"] || "assets/logos/fav/favicon.svg";

        const broadcastList = match.transmissao || match.ondeAssistir || [];
        let broadcastHtml = "";
        if (broadcastList && broadcastList.length > 0) {
            broadcastHtml = broadcastList.map(src => {
                return `<button type="button" class="broadcast-pill playable" data-broadcast-name="${src}" title="Buscar canal para ${src}">▶ ${src}</button>`;
            }).join("");
        } else {
            broadcastHtml = `<span class="broadcast-pill empty">Transmissão a confirmar</span>`;
        }

        const { dateDayText, timePart, isToday, isTomorrow, countdownBadge } = formatMatchDateTime(match.data, match.horario || match.hora);

        let statusBadgeHtml = '';
        if (match.aoVivo) {
            statusBadgeHtml = `<span class="match-status-badge live"><span class="live-dot pulse"></span> AO VIVO</span>`;
        } else if (isToday) {
            statusBadgeHtml = `<span class="match-status-badge today"><span class="live-dot"></span> HOJE</span>`;
        } else if (isTomorrow) {
            statusBadgeHtml = `<span class="match-status-badge tomorrow">AMANHÃ</span>`;
        } else if (isFeatured) {
            statusBadgeHtml = `<span class="match-status-badge featured">${countdownBadge || 'PRÓXIMO JOGO'}</span>`;
        } else if (countdownBadge) {
            statusBadgeHtml = `<span class="match-status-badge countdown">${countdownBadge}</span>`;
        }

        card.innerHTML = `
            <div class="match-top-bar">
                <span class="championship-badge">${match.campeonato || "Futebol"} ${match.rodada ? `• ${match.rodada}` : ""}</span>
                ${statusBadgeHtml}
            </div>
            <div class="match-duel">
                <div class="duel-team duel-mandante">
                    <div class="duel-badge-wrapper">
                        <img src="${mandanteEscudo}" alt="${mandanteNome}" class="match-team-crest" loading="lazy" onerror="this.src='assets/logos/fav/favicon.svg'">
                    </div>
                    <span class="duel-team-name">${mandanteNome}</span>
                </div>
                <div class="duel-vs-box">
                    <div class="duel-vs-circle-wrapper">
                        ${match.placar ? `<span class="duel-score-badge">${match.placar.mandante} - ${match.placar.visitante}</span>` : `<span class="duel-vs">VS</span>`}
                    </div>
                    <div class="duel-date-time">
                        <span class="duel-date-day">${dateDayText}</span>
                        <span class="duel-date-hour">${match.aoVivo ? 'Em andamento' : timePart}</span>
                    </div>
                </div>
                <div class="duel-team duel-visitante">
                    <div class="duel-badge-wrapper">
                        <img src="${visitanteEscudo}" alt="${visitanteNome}" class="match-team-crest" loading="lazy" onerror="this.src='assets/logos/fav/favicon.svg'">
                    </div>
                    <span class="duel-team-name">${visitanteNome}</span>
                </div>
            </div>
            <div class="match-broadcast-footer">
                <span class="broadcast-label">Onde Assistir</span>
                <div class="broadcast-pills">
                    ${broadcastHtml}
                </div>
            </div>
        `;

        gridEl.appendChild(card);
    });

    setupMatchesCarouselControls(gridEl);
}

function setupMatchesCarouselControls(gridEl) {
    const btnPrev = document.getElementById("btn-matches-prev");
    const btnNext = document.getElementById("btn-matches-next");

    function updateArrows() {
        if (!gridEl) return;
        const maxScroll = gridEl.scrollWidth - gridEl.clientWidth;
        if (btnPrev) btnPrev.disabled = gridEl.scrollLeft <= 5;
        if (btnNext) btnNext.disabled = gridEl.scrollLeft >= maxScroll - 5;
    }

    if (btnPrev) {
        btnPrev.onclick = () => {
            gridEl.scrollBy({ left: -320, behavior: 'smooth' });
        };
    }
    if (btnNext) {
        btnNext.onclick = () => {
            gridEl.scrollBy({ left: 320, behavior: 'smooth' });
        };
    }

    gridEl.addEventListener("scroll", updateArrows, { passive: true });
    updateArrows();

    // Event Delegation: Forward broadcast pill clicks via Store Event
    gridEl.addEventListener("click", (e) => {
        const pill = e.target.closest(".broadcast-pill.playable");
        if (pill) {
            e.preventDefault();
            e.stopPropagation();
            const broadcastName = pill.getAttribute("data-broadcast-name") || "";
            store.setCurrentView('tv');
            store.dispatchEvent(new CustomEvent('channel:request', {
                detail: {
                    category: "Esportes",
                    channelName: broadcastName
                }
            }));
            showToast(`Buscando canal para ${broadcastName}...`);
        }
    });
}

// Auto re-render when requested via store events
store.on('sports:refreshMatches', () => {
    renderMatchesSection();
});
store.on('team:change', () => {
    renderMatchesSection();
});

// Initialize team modal listeners immediately
setupTeamSelectModal();

