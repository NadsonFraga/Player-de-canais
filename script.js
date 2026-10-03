/**
 * TVZINHA ONLINE - Modern Core Application Logic
 */

// Fallback channels dataset for when opened directly via file:// protocol
const FALLBACK_CHANNELS = {
  "TV Aberta": {
    "Globo": {
      "SP - Principal": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=globosp",
      "SP - Backup": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=globosp",
      "SP - NossoPlayer": "https://nossoplayeronlinehd.ink/tv/globo-sp",
      "RJ - Principal": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=6120663-rj1",
      "RJ - Backup": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=globorj",
      "RJ - NossoPlayer": "https://nossoplayeronlinehd.ink/tv/globo-rj",
      "Minas - NossoPlayer": "https://nossoplayeronlinehd.ink/tv/globo-minas",
      "BA - Principal": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=globoba",
      "BA - Backup": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=globoba"
    },
    "Band": {
      "Servidor 1": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/eventos/band.html?id=019a797e-eeb8-7eda-9518-132403ccb160",
      "Servidor 2": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/eventos/band.html?id=019cc41a-ccc4-75e0-a31f-9bf47fad8d8b",
      "SP - NossoPlayer": "https://nossoplayeronlinehd.ink/tv/band-sp",
      "RJ - NossoPlayer": "https://nossoplayeronlinehd.ink/tv/band-rj",
      "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/bandsp",
      "Servidor 4 (EmbedTV)": "https://w7.embedtv.lat/bandrj"
    },
    "SBT": {
      "SP - Principal": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=sbtsp",
      "RJ - Principal": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=sbtrj",
      "SP - NossoPlayer": "https://nossoplayeronlinehd.ink/tv/sbt-sp",
      "RJ - NossoPlayer": "https://nossoplayeronlinehd.ink/tv/sbt-rj",
      "Alternativo": "https://youtube-player.sbt.com.br/?videoID=ABVQXgr2LW4&t=0&adunit=/1011235/SBT_Videos/Especiais/SBT_Live/video"
    },
    "Record": {
      "SP - NossoPlayer": "https://nossoplayeronlinehd.ink/tv/record-sp",
      "RJ - NossoPlayer": "https://nossoplayeronlinehd.ink/tv/record-rj",
      "SP - EmbedTV": "https://w7.embedtv.lat/recordsp",
      "RJ - EmbedTV": "https://w7.embedtv.lat/recordrj",
      "MG - EmbedTV": "https://w7.embedtv.lat/recordmg"
    }
  },
  "Esportes": {
    "SporTV": {
      "Servidor 1 (MeuPlayer)": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=sportv",
      "Servidor 2 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/sportv",
      "Servidor 3 (DaddyLive)": "https://dlive.sx/stream/stream-291.php",
      "Alternativo": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=sportv",
      "Servidor 5 (EmbedTV)": "https://w7.embedtv.lat/sportv"
    },
    "SporTV 2": {
      "Servidor 1 (MeuPlayer)": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/eventos/gbplay.html?id=sportv2",
      "Servidor 2 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/sportv2",
      "Servidor 3 (DaddyLive)": "https://dlive.sx/stream/stream-292.php",
      "Alternativo": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/premiere/primebr.html?id=sportv2sd",
      "Servidor 5 (EmbedTV)": "https://w7.embedtv.lat/sportv2"
    },
    "SporTV 3": {
      "Servidor 1 (MeuPlayer)": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/primebr.html?id=sportv3",
      "Servidor 2 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/sportv3",
      "Servidor 3 (DaddyLive)": "https://dlive.sx/stream/stream-293.php",
      "Alternativo": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://localhost70.xyz/myplay/premiere/primebr.html?id=sportv3sd",
      "Servidor 5 (EmbedTV)": "https://w7.embedtv.lat/sportv3"
    },
    "Premiere": {
      "Servidor 1 (MeuPlayer)": "https://meuplayeronlinehd.com/myplay/emb.html?id=https://meuplayeronlinehd.com/myplay/premiere/hls.html?id=premiere",
      "Servidor 2 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/premiere",
      "Servidor 3 (DaddyLive)": "https://dlive.sx/stream/stream-294.php",
      "Servidor 4 (EmbedTV)": "https://w7.embedtv.lat/premiere"
    },
    "Premiere 2": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/premiere2",
      "Servidor 2 (DaddyLive)": "https://dlive.sx/stream/stream-295.php",
      "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/premiere2"
    },
    "Premiere 3": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/premiere3",
      "Servidor 2 (DaddyLive)": "https://dlive.sx/stream/stream-296.php",
      "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/premiere3"
    },
    "Premiere 4": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/premiere4",
      "Servidor 2 (DaddyLive)": "https://dlive.sx/stream/stream-297.php",
      "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/premiere4"
    },
    "Premiere 5": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/premiere5",
      "Servidor 2 (DaddyLive)": "https://dlive.sx/stream/stream-298.php",
      "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/premiere5"
    },
    "Premiere 6": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/premiere6",
      "Servidor 2 (DaddyLive)": "https://dlive.sx/stream/stream-299.php",
      "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/premiere6"
    },
    "Premiere 7": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/premiere7",
      "Servidor 2 (DaddyLive)": "https://dlive.sx/stream/stream-300.php",
      "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/premiere7"
    },
    "Premiere Clubes": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/premiere-clubes",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/premiereclubes"
    },
    "ESPN": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/espn",
      "Servidor 2 (DaddyLive)": "https://dlive.sx/stream/stream-81.php",
      "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/espn"
    },
    "ESPN 2": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/espn2",
      "Servidor 2 (DaddyLive)": "https://dlive.sx/stream/stream-82.php",
      "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/espn2"
    },
    "ESPN 3": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/espn3",
      "Servidor 2 (DaddyLive)": "https://dlive.sx/stream/stream-83.php",
      "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/espn3"
    },
    "ESPN 4": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/espn4",
      "Servidor 2 (DaddyLive)": "https://dlive.sx/stream/stream-84.php",
      "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/espn4"
    },
    "ESPN Extra": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/espn-extra",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/espnextra"
    },
    "FOX Sports": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/fox-sports",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/foxsports"
    },
    "FOX Sports 2": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/fox-sports2",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/foxsports2"
    },
    "BandSports": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/bandsports",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/bandsports"
    },
    "CazéTV": {
      "Servidor 1 (EmbedCanais)": "https://embedcanaisdetv.xyz/e/index.php?canal=cazetv/",
      "Servidor 2": "https://embedcanaisdetv.xyz/e/index.php?canal=cazetv2/",
      "Servidor 3": "https://embedcanaisdetv.xyz/e/index.php?canal=cazetv3/",
      "Servidor 4 (EmbedTV)": "https://w7.embedtv.lat/caze1"
    },
    "Combate": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/combate",
      "Servidor 2 (DaddyLive)": "https://dlive.sx/stream/stream-291.php",
      "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/combate"
    },
    "UFC Fight Pass": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/ufcfightpass",
      "Servidor 2 (DaddyLive)": "https://dlive.sx/stream/stream-291.php",
      "Servidor 3 (MeuPlayer)": "https://meuplayeronlinehd.com/myplay/watch.html?id=paramount1",
      "Servidor 4 (EmbedTV)": "https://w7.embedtv.lat/ufcfightpass"
    },
    "XSports": {
      "Servidor 1 (EmbedCanais)": "https://embedcanaisdetv.xyz/e/index.php?canal=xsports",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/xsports"
    }
  },
  "Filmes & Séries": {
    "HBO": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/hbo",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/hbo"
    },
    "HBO 2": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/hbo2",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/hbo2"
    },
    "HBO Plus": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/hbo-plus",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/hboplus"
    },
    "HBO Signature": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/hbo-signature",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/hbosignature"
    },
    "HBO Family": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/hbo-family",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/hbofamily"
    },
    "Comedy Central": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/comedycentral",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/comedycentral"
    },
    "FOX (Star Channel)": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/star-channel",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/starchannel"
    },
    "Disney+": {
      "Servidor 1": "https://embedcanaisdetv.xyz/e/index.php?canal=disneyplus/",
      "Servidor 2": "https://embedcanaisdetv.xyz/e/index.php?canal=disneyplus02/",
      "Servidor 3": "https://embedcanaisdetv.xyz/e/index.php?canal=disneyplus03/",
      "Servidor 4 (EmbedTV)": "https://w7.embedtv.lat/disneyplus1"
    },
    "Max": {
      "Servidor 1": "https://embedcanaisdetv.xyz/e/index.php?canal=max/",
      "Servidor 2": "https://embedcanaisdetv.xyz/e/index.php?canal=max02/",
      "Servidor 3": "https://embedcanaisdetv.xyz/e/index.php?canal=max03/",
      "Servidor 4 (EmbedTV)": "https://w7.embedtv.lat/max1"
    },
    "Paramount+": {
      "Servidor 1": "https://embedcanaisdetv.xyz/e/index.php?canal=paramountplus/",
      "Servidor 2": "https://embedcanaisdetv.xyz/e/index.php?canal=paramountplus02/",
      "Servidor 3": "https://embedcanaisdetv.xyz/e/index.php?canal=paramountplus03/",
      "Servidor 4 (EmbedTV)": "https://w7.embedtv.lat/paramountplus"
    },
    "Prime Video": {
      "Servidor 1": "https://embedcanaisdetv.xyz/e/index.php?canal=amazonprimevideo",
      "Servidor 2": "https://embedcanaisdetv.xyz/e/index.php?canal=amazonprimevideo02",
      "Servidor 3 (EmbedTV)": "https://w7.embedtv.lat/primevideo",
      "Servidor 4 (EmbedTV)": "https://w7.embedtv.lat/primevideo2",
      "Servidor 5 (EmbedTV)": "https://w7.embedtv.lat/primevideo4"
    }
  },
  "Infantil": {
    "Cartoon Network": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/cartoon-network",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/cartoonnetwork"
    },
    "Cartoonito": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/cartoonito",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/cartoonito"
    },
    "Boomerang": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/boomerang",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/boomerang"
    },
    "Disney Channel": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/disney-channel",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/disneychannel"
    },
    "Disney Junior": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/disney-junior",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/disneyjunior"
    },
    "Disney XD": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/disney-xd",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/disneyxd"
    },
    "DreamWorks TV": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/dreamworks",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/dreamworks"
    },
    "Nickelodeon": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/nickelodeon",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/nickelodeon"
    },
    "Nick Jr.": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/nick-jr",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/nickjr"
    },
    "Discovery Kids": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/discovery-kids",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/discoverykids"
    },
    "Gloob": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/gloob",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/gloob"
    },
    "Gloobinho": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/gloobinho",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/gloobinho"
    }
  },
  "Documentários & Variedades": {
    "Discovery Channel": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/discovery-channel",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/discoverychannel"
    },
    "Animal Planet": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/animal-planet",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/animalplanet"
    },
    "National Geographic": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/national-geographic",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/nationalgeographic"
    },
    "NatGeo Wild": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/natgeo-wild",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/natgeowild"
    },
    "NatGeo Kids": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/natgeo-kids",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/natgeokids"
    },
    "GloboNews": {
      "Servidor 1 (EmbedCanais)": "https://embedcanaisdetv.xyz/e/index.php?canal=globonews",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/globonews"
    },
    "BandNews": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/band-news",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/bandnews"
    },
    "Multishow": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/multishow",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/multishow"
    },
    "MTV": {
      "Servidor 1 (NossoPlayer)": "https://nossoplayeronlinehd.ink/tv/mtv",
      "Servidor 2 (EmbedTV)": "https://w7.embedtv.lat/mtv"
    }
  },
  "Séries 24h": {
    "Chaves 24h": {
      "EmbedTV": "https://w7.embedtv.lat/24h_chaves"
    },
    "Dragon Ball 24h": {
      "EmbedTV": "https://w7.embedtv.lat/24h_dragonball"
    },
    "Naruto 24h": {
      "EmbedTV": "https://w7.embedtv.lat/24h_naruto"
    },
    "Os Simpsons 24h": {
      "EmbedTV": "https://w7.embedtv.lat/24h_simpsons"
    },
    "Pica-Pau 24h": {
      "EmbedTV": "https://w7.embedtv.lat/24h_picapau"
    },
    "Friends 24h": {
      "EmbedTV": "https://w7.embedtv.lat/24h_friends"
    },
    "Todo Mundo Odeia o Chris 24h": {
      "EmbedTV": "https://w7.embedtv.lat/24h_odeiachris"
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
    // --- Pop-up & Anti-Hijack Protection Shield ---
    // Preserves intentional "Nova Aba" opening while blocking rogue popups & parent window redirects
    const safeWindowOpen = window.open ? window.open.bind(window) : null;
    window.open = function(url, target, features) {
        console.warn("Tvzinha Shield: Bloqueada tentativa não autorizada de abertura de janela:", url);
        return null;
    };

    let isAuthorizedUserAction = false;
    window.addEventListener("beforeunload", (e) => {
        if (!isAuthorizedUserAction) {
            // Prevent rogue iframe scripts from navigating away from the app
            e.preventDefault();
            e.returnValue = "";
            return "";
        }
    });

    document.addEventListener("click", () => {
        isAuthorizedUserAction = true;
        setTimeout(() => {
            isAuthorizedUserAction = false;
        }, 1200);
    }, true);

    // --- State Management ---
    let channelsData = {};
    let activeFilter = "all";
    let searchQuery = "";
    let activeChannel = null; // { category, name, players, currentPlayerName, currentPlayerUrl }
    let adShieldEnabled = true; // Auto-blocks popunder ad tabs (Superbet, etc.) on non-EmbedTV players

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
            server: `<svg class="icon-svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>`,
            news: `<svg class="category-header-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path><path d="M18 14h-8"></path><path d="M15 18h-5"></path><path d="M10 6h8v4h-8V6Z"></path></svg>`,
            kids: `<svg class="category-header-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>`,
            series: `<svg class="category-header-icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>`,
            trophy: `<svg class="icon-svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"></path><path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.45 1-1 1H7v4h10v-4h-2c-.55 0-1-.45-1-1v-2.34"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path></svg>`,
            swap: `<svg class="icon-svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`,
            search: `<svg class="icon-svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
            check: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`
        };
        return icons[name] || '';
    }

    // --- Mapping Channels to Images in logos/ ---
    const CHANNEL_LOGOS = {
        "globo": "logos/globo.png",
        "band": "logos/Band.png",
        "sbt": "logos/sbt.png",
        "record": "logos/record.png",
        "sportv 3": "logos/sportv3.png",
        "sportv 2": "logos/sportv2.png",
        "sportv": "logos/sportv.png",
        "premiere": "logos/premiere.png",
        "prime": "logos/amazonprimevideo.png",
        "cazetv": "logos/cazetv.png",
        "disney": "logos/disneyplus.png",
        "max": "logos/max.png",
        "paramount": "logos/paramountplus.png",
        "espn": "logos/espn.png",
        "bandsports": "logos/bandsports.png",
        "combate": "logos/combate.png",
        "xsports": "logos/xsports.png",
        "globonews": "logos/globonews.png",
        "bandnews": "logos/bandnews.png",
        "multishow": "logos/multishow.png",
        "mtv": "logos/mtv.png",
        "cartoonnetwork": "logos/cartoonnetwork.png",
        "cartoonito": "logos/cartoonito.png",
        "discoverykids": "logos/discoverykids.png",
        "gloob": "logos/gloob.png",
        "gloobinho": "logos/gloobinho.png",
        "comedycentral": "logos/comedycentral.png",
        "nickelodeon": "logos/nickelodeon.png",
        "nickjr": "logos/nickjr.png",
        "dreamworks": "logos/dreamworks.png",
        "animalplanet": "logos/animalplanet.png",
        "discoverychannel": "logos/discoverychannel.png",
        "hbo": "logos/hbo.png",
        "hbo2": "logos/hbo2.png",
        "hboplus": "logos/hboplus.png",
        "hbosignature": "logos/hbosignature.png",
        "hbofamily": "logos/hbofamily.png"
    };

    function getChannelLogoSrc(channelName) {
        const name = channelName.toLowerCase().trim();
        if (name.includes("sportv 3") || name.includes("sportv3")) return CHANNEL_LOGOS["sportv 3"];
        if (name.includes("sportv 2") || name.includes("sportv2")) return CHANNEL_LOGOS["sportv 2"];
        if (name.includes("sportv")) return CHANNEL_LOGOS["sportv"];
        if (name.includes("bandsports")) return CHANNEL_LOGOS["bandsports"];
        if (name.includes("bandnews")) return CHANNEL_LOGOS["bandnews"];
        if (name.includes("band")) return CHANNEL_LOGOS["band"];
        if (name.includes("globonews")) return CHANNEL_LOGOS["globonews"];
        if (name.includes("globo")) return CHANNEL_LOGOS["globo"];
        if (name.includes("sbt")) return CHANNEL_LOGOS["sbt"];
        if (name.includes("record")) return CHANNEL_LOGOS["record"];
        if (name.includes("premiere")) return CHANNEL_LOGOS["premiere"];
        if (name.includes("prime") || name.includes("amazon")) return CHANNEL_LOGOS["prime"];
        if (name.includes("caze") || name.includes("cazé")) return CHANNEL_LOGOS["cazetv"];
        if (name.includes("disney")) return CHANNEL_LOGOS["disney"];
        if (name.includes("hbo 2") || name.includes("hbo2")) return CHANNEL_LOGOS["hbo2"];
        if (name.includes("hbo plus") || name.includes("hboplus")) return CHANNEL_LOGOS["hboplus"];
        if (name.includes("hbo signature") || name.includes("hbosignature")) return CHANNEL_LOGOS["hbosignature"];
        if (name.includes("hbo family") || name.includes("hbofamily")) return CHANNEL_LOGOS["hbofamily"];
        if (name.includes("hbo")) return CHANNEL_LOGOS["hbo"];
        if (name.includes("max")) return CHANNEL_LOGOS["max"];
        if (name.includes("paramount")) return CHANNEL_LOGOS["paramount"];
        if (name.includes("espn")) return CHANNEL_LOGOS["espn"];
        if (name.includes("combate")) return CHANNEL_LOGOS["combate"];
        if (name.includes("xsports")) return CHANNEL_LOGOS["xsports"];
        if (name.includes("multishow")) return CHANNEL_LOGOS["multishow"];
        if (name.includes("mtv")) return CHANNEL_LOGOS["mtv"];
        if (name.includes("cartoon network") || name.includes("cartoonnetwork")) return CHANNEL_LOGOS["cartoonnetwork"];
        if (name.includes("cartoonito")) return CHANNEL_LOGOS["cartoonito"];
        if (name.includes("discovery kids") || name.includes("discoverykids")) return CHANNEL_LOGOS["discoverykids"];
        if (name.includes("discovery")) return CHANNEL_LOGOS["discoverychannel"];
        if (name.includes("animal")) return CHANNEL_LOGOS["animalplanet"];
        if (name.includes("dreamworks")) return CHANNEL_LOGOS["dreamworks"];
        if (name.includes("gloobinho")) return CHANNEL_LOGOS["gloobinho"];
        if (name.includes("gloob")) return CHANNEL_LOGOS["gloob"];
        if (name.includes("comedy")) return CHANNEL_LOGOS["comedycentral"];
        if (name.includes("nick jr") || name.includes("nickjr")) return CHANNEL_LOGOS["nickjr"];
        if (name.includes("nick")) return CHANNEL_LOGOS["nickelodeon"];
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
            const response = await fetch("canais.json?v=" + Date.now(), { cache: "no-store" });
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

    // --- Dynamic Multi-Team Upcoming Matches Module ---
    const FAVORITE_TEAM_KEY = "tvzinha_favorite_team";
    let cachedScheduleFeed = null;

    const KNOWN_TEAM_CRESTS = {
        "athletico-pr": "https://s.sde.globo.com/media/organizations/2026/01/07/Athletico-PR.svg",
        "atletico-mg": "https://s.sde.globo.com/media/organizations/2018/03/10/atletico-mg.svg",
        "bahia": "https://s.sde.globo.com/media/organizations/2018/03/11/bahia.svg",
        "botafogo": "https://s.sde.globo.com/media/organizations/2019/02/04/botafogo-svg.svg",
        "corinthians": "https://s.sde.globo.com/media/organizations/2024/10/09/Corinthians_2024_Q4ahot4.svg",
        "criciuma": "https://s.sde.globo.com/media/teams/2026/01/16/criciuma-2026-svg-79692.svg",
        "cruzeiro": "https://s.sde.globo.com/media/organizations/2021/02/13/cruzeiro_2021.svg",
        "cuiaba": "https://s.sde.globo.com/media/organizations/2018/12/26/Cuiaba_EC.svg",
        "flamengo": "https://s.sde.globo.com/media/organizations/2018/04/10/Flamengo-2018.svg",
        "fluminense": "https://s.sde.globo.com/media/organizations/2018/03/11/fluminense.svg",
        "fortaleza": "https://s.sde.globo.com/media/organizations/2021/09/19/Fortaleza_2021_1.svg",
        "gremio": "https://s.sde.globo.com/media/organizations/2018/03/12/gremio.svg",
        "internacional": "https://s.sde.globo.com/media/organizations/2018/03/11/internacional.svg",
        "juventude": "https://s.sde.globo.com/media/organizations/2021/04/29/Juventude-2021-01.svg",
        "palmeiras": "https://s.sde.globo.com/media/organizations/2019/07/06/Palmeiras.svg",
        "red-bull-bragantino": "https://s.sde.globo.com/media/organizations/2021/06/28/bragantino.svg",
        "santos": "https://s.sde.globo.com/media/organizations/2018/03/12/santos.svg",
        "sao-paulo": "https://s.sde.globo.com/media/organizations/2018/03/11/sao-paulo.svg",
        "vasco": "https://s.sde.globo.com/media/organizations/2021/09/04/vasco_SVG.svg",
        "vitoria": "https://s.sde.globo.com/media/organizations/2025/12/18/Vitoria_2025.svg",
        "brasil": "https://s.sde.globo.com/media/organizations/2019/07/16/Brasil_rgYHF6Z.svg"
    };

    function resolveClientTeamCrest(teamId, teamInfo) {
        if (teamInfo && teamInfo.escudo && teamInfo.escudo.startsWith("http")) {
            return teamInfo.escudo;
        }
        const matches = (teamInfo && teamInfo.matches) || [];
        const targetName = ((teamInfo && teamInfo.name) || teamId).toLowerCase();
        for (const m of matches) {
            const mName = (m.mandante?.nome || "").toLowerCase();
            if (mName.includes(targetName) || targetName.includes(mName)) {
                if (m.mandante?.escudo && m.mandante.escudo.startsWith("http")) return m.mandante.escudo;
            }
            const vName = (m.visitante?.nome || "").toLowerCase();
            if (vName.includes(targetName) || targetName.includes(vName)) {
                if (m.visitante?.escudo && m.visitante.escudo.startsWith("http")) return m.visitante.escudo;
            }
        }
        if (KNOWN_TEAM_CRESTS[teamId]) {
            return KNOWN_TEAM_CRESTS[teamId];
        }
        return 'logos/fav/favicon.svg';
    }

    function getFavoriteTeam() {
        return localStorage.getItem(FAVORITE_TEAM_KEY);
    }

    function setFavoriteTeam(teamId) {
        if (teamId) {
            localStorage.setItem(FAVORITE_TEAM_KEY, teamId);
        } else {
            localStorage.removeItem(FAVORITE_TEAM_KEY);
        }
        renderMatchesSection();
    }

    async function loadScheduleFeed() {
        if (cachedScheduleFeed) return cachedScheduleFeed;
        try {
            const response = await fetch("proximos_jogos.json?t=" + Date.now(), { cache: "no-store" });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            cachedScheduleFeed = data;
            return data;
        } catch (err) {
            console.warn("Aviso ao carregar feed consolidado de jogos:", err);
            return null;
        }
    }

    function formatMatchDateTime(dateStr, hourStr) {
        if (!dateStr) return { formattedDate: "Data a definir", isToday: false, isTomorrow: false, diffDays: null, countdownText: "", countdownBadge: "" };
        try {
            const [year, month, day] = dateStr.split("-").map(Number);
            const matchDate = new Date(year, month - 1, day);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const isToday = matchDate.getTime() === today.getTime();
            const isTomorrow = matchDate.getTime() === tomorrow.getTime();

            // Calculate calendar day difference
            const diffTime = matchDate.getTime() - today.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            let countdownText = "";
            let countdownBadge = "";
            if (diffDays <= 0) {
                countdownText = "Hoje";
                countdownBadge = "HOJE";
            } else if (diffDays === 1) {
                countdownText = "Amanhã";
                countdownBadge = "AMANHÃ";
            } else {
                countdownText = `Em ${diffDays} dias`;
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
                countdownText,
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
                countdownText: "",
                countdownBadge: ""
            };
        }
    }

    function normalizeChampionshipName(name) {
        if (!name) return "Competição";
        const clean = name.trim();
        const low = clean.toLowerCase();

        if (low.includes("brasileiro") || low.includes("brasileirão")) {
            if (low.includes("série b") || low.includes("serie b")) return "Brasileirão Série B";
            return "Brasileirão";
        }
        if (low.includes("libertadores")) return "Libertadores";
        if (low.includes("sul-americana") || low.includes("sudamericana")) return "Sul-Americana";
        if (low.includes("copa do brasil")) return "Copa do Brasil";
        if (low.includes("recopa")) return "Recopa";
        if (low.includes("eliminatórias") || low.includes("eliminatorias")) return "Eliminatórias";
        if (low.includes("amistoso")) return "Amistoso";
        if (low.includes("mundial")) return "Mundial de Clubes";
        if (low.includes("paulista") || low.includes("paulistão")) return "Paulistão";
        if (low.includes("carioca")) return "Carioca";
        if (low.includes("mineiro")) return "Mineiro";
        if (low.includes("gaúcho") || low.includes("gaucho")) return "Gaúcho";
        if (low.includes("paranaense")) return "Paranaense";

        return clean;
    }

    function normalizeChannelSearch(text) {
        if (!text) return "";
        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]/g, "");
    }

    function findChannelByName(targetName) {
        const normTarget = normalizeChannelSearch(targetName);
        for (const [category, channels] of Object.entries(channelsData)) {
            for (const [channelName, players] of Object.entries(channels)) {
                if (normalizeChannelSearch(channelName) === normTarget) {
                    return { category, channelName, players };
                }
            }
        }
        return null;
    }

    function findMatchingChannel(sourceName) {
        if (!sourceName || !channelsData) return null;
        const raw = sourceName.toLowerCase().trim();

        // 1. Direct intelligent alias matching
        if (raw.includes("prime") || raw.includes("amazon")) {
            const found = findChannelByName("Prime Video");
            if (found) return found;
        }
        if (raw.includes("caze") || raw.includes("cazé")) {
            const found = findChannelByName("CazéTV");
            if (found) return found;
        }
        if (raw.includes("paramount")) {
            const found = findChannelByName("Paramount+");
            if (found) return found;
        }
        if (raw.includes("premiere")) {
            const found = findChannelByName("Premiere");
            if (found) return found;
        }
        if (raw.includes("sportv 3") || raw.includes("sportv3")) {
            const found = findChannelByName("SporTV 3");
            if (found) return found;
        }
        if (raw.includes("sportv 2") || raw.includes("sportv2")) {
            const found = findChannelByName("SporTV 2");
            if (found) return found;
        }
        if (raw.includes("sportv")) {
            const found = findChannelByName("SporTV");
            if (found) return found;
        }
        if (raw.includes("globonews")) {
            const found = findChannelByName("GloboNews");
            if (found) return found;
        }
        if (raw.includes("globo") || raw.includes("ge") || raw.includes("tv globo") || raw.includes("globoplay")) {
            const found = findChannelByName("Globo");
            if (found) return found;
        }
        if (raw.includes("bandnews")) {
            const found = findChannelByName("BandNews");
            if (found) return found;
        }
        if (raw.includes("bandsports")) {
            const found = findChannelByName("BandSports");
            if (found) return found;
        }
        if (raw.includes("band")) {
            const found = findChannelByName("Band");
            if (found) return found;
        }
        if (raw.includes("sbt")) {
            const found = findChannelByName("SBT");
            if (found) return found;
        }
        if (raw.includes("record")) {
            const found = findChannelByName("Record");
            if (found) return found;
        }
        if (raw.includes("disney")) {
            const found = findChannelByName("Disney+");
            if (found) return found;
        }
        if (raw.includes("max") || raw.includes("hbo")) {
            const found = findChannelByName("Max");
            if (found) return found;
        }
        if (raw.includes("combate")) {
            const found = findChannelByName("Combate");
            if (found) return found;
        }

        // 2. Generic fallback search
        const normalizedSource = normalizeChannelSearch(sourceName);
        if (!normalizedSource) return null;

        for (const [category, channels] of Object.entries(channelsData)) {
            for (const [channelName, players] of Object.entries(channels)) {
                const normalizedChannel = normalizeChannelSearch(channelName);
                if (normalizedChannel && (normalizedChannel.includes(normalizedSource) || normalizedSource.includes(normalizedChannel))) {
                    return { category, channelName, players };
                }
            }
        }
        return null;
    }

    async function renderMatchesSection() {
        const sectionEl = document.getElementById("vasco-matches-section");
        const headingTitle = document.getElementById("matches-section-title");
        const headingHint = document.getElementById("matches-section-hint");
        const teamBadgeEl = document.getElementById("matches-team-badge");
        const btnChangeTeam = document.getElementById("btn-change-team");
        const btnChangeTeamLabel = document.getElementById("btn-change-team-label");
        const navArrows = document.getElementById("matches-nav-arrows");
        const carouselFooter = document.getElementById("matches-carousel-footer");
        const wrapperEl = document.getElementById("matches-carousel-wrapper");

        if (!sectionEl || !wrapperEl) return;

        // Ensure Team Selection Modal is initialized
        setupTeamSelectModal();

        // Wire change button to open modal
        if (btnChangeTeam) {
            btnChangeTeam.onclick = (e) => {
                e.stopPropagation();
                openTeamSelectModal();
            };
        }

        const favoriteTeamId = getFavoriteTeam();

        // --- CASE 1: No Team Selected (Friendly Unselected State) ---
        if (!favoriteTeamId) {
            if (headingTitle) headingTitle.textContent = "Próximos Jogos de Futebol";
            if (headingHint) headingHint.textContent = "Agenda de confrontos do futebol brasileiro (via ge.globo)";
            if (teamBadgeEl) teamBadgeEl.innerHTML = getUiSvg('calendar', 18);
            if (btnChangeTeamLabel) btnChangeTeamLabel.textContent = "Escolher Time";
            if (carouselFooter) carouselFooter.style.display = "none";
            if (navArrows) navArrows.style.display = "none";

            wrapperEl.innerHTML = `
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
            return;
        }

        // --- CASE 2: Team Selected ---
        if (btnChangeTeamLabel) btnChangeTeamLabel.textContent = "Alterar time";

        // Load data feed
        const feed = await loadScheduleFeed();
        const teams = feed?.teams || {};
        const teamData = teams[favoriteTeamId];

        // If saved team is not found in feed, reset gracefully
        if (!teamData) {
            console.warn(`Time salvo '${favoriteTeamId}' não encontrado no feed.`);
            setFavoriteTeam(null);
            return;
        }

        if (headingTitle) headingTitle.textContent = `Jogos de Futebol • ${teamData.name}`;
        if (headingHint) headingHint.textContent = `Agenda atualizada do ${teamData.name} (via ge.globo)`;
        if (teamBadgeEl) {
            const crestUrl = resolveClientTeamCrest(favoriteTeamId, teamData);
            teamBadgeEl.innerHTML = `<img src="${crestUrl}" alt="${teamData.name}" class="team-header-crest" onerror="this.src='logos/fav/favicon.svg'">`;
        }

        const matches = teamData.matches || [];

        // Restore carousel grid container
        wrapperEl.innerHTML = `
            <div class="matches-grid matches-carousel" id="vasco-matches-grid" tabindex="0" role="region" aria-label="Carrossel de próximos jogos do ${teamData.name}"></div>
        `;

        const gridEl = document.getElementById("vasco-matches-grid");
        if (!gridEl) return;

        if (matches.length === 0) {
            if (carouselFooter) carouselFooter.style.display = "none";
            if (navArrows) navArrows.style.display = "none";
            gridEl.innerHTML = `
                <div class="match-card" style="grid-column: 1 / -1; text-align: center; padding: 28px 20px;">
                    <p style="color: var(--text-primary); font-weight: 600; margin-bottom: 6px;">Nenhum jogo agendado para o ${teamData.name} no momento.</p>
                    <span style="font-size: 0.82rem; color: var(--text-muted);">Isso ocorre em intervalos de competições, férias ou Data FIFA. A agenda é sincronizada via ge.globo.</span>
                </div>
            `;
            return;
        }

        if (carouselFooter) carouselFooter.style.display = matches.length > 1 ? "flex" : "none";
        if (navArrows) navArrows.style.display = "inline-flex";

        matches.forEach((match, index) => {
            const card = document.createElement("div");
            const isFeatured = index === 0;
            card.className = `match-card ${isFeatured ? 'featured' : ''}`;

            const { formattedDate, dateDayText, timePart, isToday, isTomorrow, countdownBadge } = formatMatchDateTime(match.data, match.hora);

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

            const championshipFormatted = normalizeChampionshipName(match.campeonato);
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
                    <span class="championship-badge" title="${match.campeonato || 'Competição'}">${championshipFormatted}</span>
                    ${statusBadgeHtml}
                </div>

                <div class="match-duel">
                    <div class="duel-team duel-mandante">
                        <div class="duel-badge-wrapper">
                            <img src="${mandanteEscudo}" alt="${match.mandante?.nome || 'Mandante'}" loading="lazy" onerror="this.src='logos/fav/favicon.svg'">
                        </div>
                        <span class="duel-team-name" title="${match.mandante?.nome || ''}">${match.mandante?.nome || 'Mandante'}</span>
                    </div>

                    <div class="duel-vs-box">
                        <div class="duel-vs-circle-wrapper">
                            ${match.placar ? `<span class="duel-score-badge" title="Placar do jogo">${match.placar.mandante} - ${match.placar.visitante}</span>` : `<span class="duel-vs">VS</span>`}
                        </div>
                        <div class="duel-date-time">
                            <span class="duel-date-day">${dateDayText}</span>
                            <span class="duel-date-hour">${match.aoVivo ? 'Em andamento' : timePart}</span>
                        </div>
                    </div>

                    <div class="duel-team duel-visitante">
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

        setupMatchesCarousel();
    }

    // --- Team Selection Modal Handlers ---
    let isTeamModalInitialized = false;

    function setupTeamSelectModal() {
        if (isTeamModalInitialized) return;
        const modal = document.getElementById("team-select-modal");
        const btnClose = document.getElementById("btn-close-team-modal");
        const searchInput = document.getElementById("team-search-input");

        if (!modal) return;
        isTeamModalInitialized = true;

        if (btnClose) {
            btnClose.addEventListener("click", closeTeamSelectModal);
        }

        // Close when clicking on backdrop
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                closeTeamSelectModal();
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
                const query = normalizeChannelSearch(searchInput.value);
                const cards = modal.querySelectorAll(".team-select-card");
                let visibleCount = 0;

                cards.forEach(card => {
                    const teamName = card.getAttribute("data-team-name") || "";
                    const normName = normalizeChannelSearch(teamName);
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

    async function openTeamSelectModal() {
        const modal = document.getElementById("team-select-modal");
        const grid = document.getElementById("teams-grid");
        const searchInput = document.getElementById("team-search-input");
        if (!modal || !grid) return;

        setupTeamSelectModal();

        // Load feed
        const feed = await loadScheduleFeed();
        const teams = feed?.teams || {};
        const currentFavorite = getFavoriteTeam();

        grid.innerHTML = "";

        // Sort teams alphabetically, keeping Seleção Brasileira at the top or end
        const sortedEntries = Object.entries(teams).sort((a, b) => {
            if (a[0] === 'brasil') return 1;
            if (b[0] === 'brasil') return -1;
            return a[1].name.localeCompare(b[1].name, 'pt-BR');
        });

        sortedEntries.forEach(([teamId, teamInfo]) => {
            const card = document.createElement("div");
            const isSelected = teamId === currentFavorite;
            card.className = `team-select-card ${isSelected ? 'active' : ''}`;
            card.setAttribute("data-team-id", teamId);
            card.setAttribute("data-team-name", teamInfo.name);
            card.setAttribute("tabindex", "0");
            card.setAttribute("role", "button");
            card.setAttribute("aria-label", `Selecionar ${teamInfo.name}`);

            const checkHtml = isSelected ? `<span class="team-card-check">${getUiSvg('check', 11)}</span>` : '';
            const crestUrl = resolveClientTeamCrest(teamId, teamInfo);

            card.innerHTML = `
                ${checkHtml}
                <div class="team-card-crest-wrapper">
                    <img src="${crestUrl}" alt="${teamInfo.name}" class="team-card-crest" loading="lazy" onerror="this.src='logos/fav/favicon.svg'">
                </div>
                <span class="team-card-name">${teamInfo.name}</span>
            `;

            card.addEventListener("click", () => {
                setFavoriteTeam(teamId);
                closeTeamSelectModal();
            });

            card.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setFavoriteTeam(teamId);
                    closeTeamSelectModal();
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

        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";

        setTimeout(() => {
            if (searchInput) searchInput.focus();
        }, 120);
    }

    function closeTeamSelectModal() {
        const modal = document.getElementById("team-select-modal");
        if (!modal) return;
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }

    // --- Adblock & DNS Disclaimer Modal Handlers ---
    const ADBLOCK_STORAGE_KEY = 'tvzinha_adblock_ack_timestamp';
    const ADBLOCK_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

    let isAdblockModalInitialized = false;

    function setupAdblockModal() {
        if (isAdblockModalInitialized) return;
        const modal = document.getElementById("adblock-modal");
        const btnAck = document.getElementById("btn-adblock-ack");
        const btnClose = document.getElementById("btn-close-adblock-modal");
        const btnCopyDns = document.getElementById("btn-copy-dns");
        const btnMobileAdblock = document.getElementById("btn-mobile-adblock");

        if (!modal) return;
        isAdblockModalInitialized = true;

        if (btnAck) {
            btnAck.addEventListener("click", () => {
                acknowledgeAdblockNotice();
                closeAdblockModal();
            });
        }

        if (btnClose) {
            btnClose.addEventListener("click", () => {
                acknowledgeAdblockNotice();
                closeAdblockModal();
            });
        }

        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                acknowledgeAdblockNotice();
                closeAdblockModal();
            }
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && modal.style.display !== "none") {
                acknowledgeAdblockNotice();
                closeAdblockModal();
            }
        });

        if (btnCopyDns) {
            btnCopyDns.addEventListener("click", () => {
                const textToCopy = "dns.adguard-dns.com";
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const label = document.getElementById("copy-dns-label");
                    btnCopyDns.classList.add("copied");
                    if (label) label.textContent = "Copiado!";
                    setTimeout(() => {
                        btnCopyDns.classList.remove("copied");
                        if (label) label.textContent = "Copiar";
                    }, 2200);
                }).catch(() => {
                    const label = document.getElementById("copy-dns-label");
                    if (label) label.textContent = "dns.adguard-dns.com";
                });
            });
        }

        if (btnMobileAdblock) {
            btnMobileAdblock.addEventListener("click", () => {
                openAdblockModal();
            });
        }

        // Delegated listener for hero adblock button (PC Welcome Screen)
        document.addEventListener("click", (e) => {
            const heroAdblockBtn = e.target.closest("#btn-hero-adblock");
            if (heroAdblockBtn) {
                openAdblockModal();
            }
        });
    }

    function checkAdblockNoticeStatus() {
        setupAdblockModal();
        try {
            const rawTimestamp = localStorage.getItem(ADBLOCK_STORAGE_KEY);
            if (!rawTimestamp) {
                setTimeout(() => openAdblockModal(), 500);
                return;
            }
            const lastAck = parseInt(rawTimestamp, 10);
            if (isNaN(lastAck) || (Date.now() - lastAck > ADBLOCK_EXPIRATION_MS)) {
                setTimeout(() => openAdblockModal(), 500);
            }
        } catch (e) {
            console.warn("Falha ao ler status do adblock no localStorage:", e);
        }
    }

    function acknowledgeAdblockNotice() {
        try {
            localStorage.setItem(ADBLOCK_STORAGE_KEY, Date.now().toString());
        } catch (e) {
            console.warn("Falha ao salvar status do adblock no localStorage:", e);
        }
    }

    function openAdblockModal() {
        const modal = document.getElementById("adblock-modal");
        if (!modal) return;
        setupAdblockModal();
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
        const btnAck = document.getElementById("btn-adblock-ack");
        if (btnAck) btnAck.focus();
    }

    function closeAdblockModal() {
        const modal = document.getElementById("adblock-modal");
        if (!modal) return;
        modal.style.display = "none";
        document.body.style.overflow = "";
    }

    // --- Matches Carousel Navigation & Drag Scrolling ---
    function setupMatchesCarousel() {
        const gridEl = document.getElementById("vasco-matches-grid");
        const prevBtn = document.getElementById("btn-matches-prev");
        const nextBtn = document.getElementById("btn-matches-next");

        if (!gridEl) return;

        function updateArrowState() {
            if (!prevBtn || !nextBtn) return;
            const maxScroll = Math.max(0, gridEl.scrollWidth - gridEl.clientWidth);
            const atStart = gridEl.scrollLeft <= 8;
            const atEnd = gridEl.scrollLeft >= maxScroll - 8;

            prevBtn.disabled = atStart;
            nextBtn.disabled = atEnd;
            prevBtn.classList.toggle("disabled", atStart);
            nextBtn.classList.toggle("disabled", atEnd);
        }

        function getScrollStep() {
            const firstCard = gridEl.querySelector(".match-card");
            if (firstCard) {
                const cardWidth = firstCard.offsetWidth;
                const gap = 16;
                return cardWidth + gap;
            }
            return gridEl.clientWidth * 0.85;
        }

        if (prevBtn) {
            prevBtn.onclick = () => {
                gridEl.scrollBy({ left: -getScrollStep(), behavior: "smooth" });
            };
        }

        if (nextBtn) {
            nextBtn.onclick = () => {
                gridEl.scrollBy({ left: getScrollStep(), behavior: "smooth" });
            };
        }

        // Scroll listener (throttled via requestAnimationFrame)
        let ticking = false;
        gridEl.addEventListener("scroll", () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateArrowState();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });

        window.addEventListener("resize", updateArrowState, { passive: true });

        requestAnimationFrame(() => {
            updateArrowState();
        });

        // Mouse Drag-to-Scroll Support
        let isDown = false;
        let startX = 0;
        let initialScroll = 0;
        let hasDragged = false;

        gridEl.addEventListener("mousedown", (e) => {
            if (e.button !== 0 || e.target.closest("button") || e.target.closest(".broadcast-pill.playable")) return;
            isDown = true;
            hasDragged = false;
            gridEl.classList.add("is-dragging");
            startX = e.pageX - gridEl.offsetLeft;
            initialScroll = gridEl.scrollLeft;
        });

        window.addEventListener("mouseup", () => {
            if (isDown) {
                isDown = false;
                gridEl.classList.remove("is-dragging");
            }
        });

        gridEl.addEventListener("mousemove", (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - gridEl.offsetLeft;
            const walk = (x - startX) * 1.35;
            if (Math.abs(walk) > 4) hasDragged = true;
            gridEl.scrollLeft = initialScroll - walk;
        });

        // Prevent button clicks if dragging
        gridEl.addEventListener("click", (e) => {
            if (hasDragged) {
                e.stopPropagation();
                hasDragged = false;
            }
        }, true);

        // Keyboard arrow navigation
        gridEl.addEventListener("keydown", (e) => {
            if (e.key === "ArrowLeft") {
                e.preventDefault();
                gridEl.scrollBy({ left: -getScrollStep(), behavior: "smooth" });
            } else if (e.key === "ArrowRight") {
                e.preventDefault();
                gridEl.scrollBy({ left: getScrollStep(), behavior: "smooth" });
            }
        });
    }

    // --- Return to Home View ---
    function renderHomeView() {
        activeChannel = null;

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
                        <img src="logos/fav/icon-detailed.svg" alt="Tvzinha Logo" class="hero-emblem-img">
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
        renderMatchesSection();
        renderSidebar();
    }

    if (brandHomeBtn) brandHomeBtn.addEventListener("click", renderHomeView);
    if (mobileBrandHomeBtn) mobileBrandHomeBtn.addEventListener("click", renderHomeView);

    // --- 2. Mobile Menu Management ---
    function openMobileMenu() {
        sidebar.classList.add("open");
        sidebarBackdrop.classList.add("active");
        document.body.classList.add("sidebar-open");
        document.body.style.overflow = "hidden";
    }

    function closeMobileMenu() {
        sidebar.classList.remove("open");
        sidebarBackdrop.classList.remove("active");
        document.body.classList.remove("sidebar-open");
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

        // AdBlock / DNS guide pill (placed first as requested)
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
        adblockBtn.addEventListener("click", () => openAdblockModal());
        filterPillsEl.appendChild(adblockBtn);

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
        const cat = category.toLowerCase();
        if (cat.includes("esporte")) return getUiSvg('sports', 16);
        if (cat.includes("aberta")) return getUiSvg('tv', 16);
        if (cat.includes("infantil")) return getUiSvg('kids', 16);
        if (cat.includes("24h") || cat.includes("série")) return getUiSvg('series', 16);
        if (cat.includes("notícia") || cat.includes("variedade")) return getUiSvg('news', 16);
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
            card.tabIndex = 0;
            card.setAttribute("role", "button");
            card.setAttribute("aria-label", `Assistir canal ${channelName}`);
            card.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectChannel(category, channelName, players);
                }
            });
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

        if (currentAppView !== 'tv') {
            switchAppView('tv');
        }

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
        window.scrollTo({ top: 0, behavior: "smooth" });
        if (window.innerWidth <= 768) {
            closeMobileMenu();
        }
    }

    function renderPlayerView() {
        if (!activeChannel) return;

        const { category, name, players, currentPlayerName, currentPlayerUrl } = activeChannel;
        const logoLargeHtml = createLogoBadgeHtml(name, 'md');
        const channelKey = `${category}:${name}`;
        const isFav = favorites.has(channelKey);

        const isEmbedTv = currentPlayerUrl.toLowerCase().includes("embedtv");
        const shieldToolbarHtml = `
            <div class="player-shield-badge" title="Proteção Anti-Popups nativa ativa">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <polyline points="9 12 11 14 15 10"></polyline>
                </svg>
                <span>${isEmbedTv ? 'EmbedTV Direct' : 'Proteção Ativa'}</span>
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
                        ${shieldToolbarHtml}
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
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen" 
                        allowfullscreen
                        webkitallowfullscreen
                        mozallowfullscreen
                        referrerpolicy="no-referrer"
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

        // Anti-Popups Shield Toggle Listener
        const btnToggleShield = document.getElementById("btn-toggle-shield");
        if (btnToggleShield) {
            btnToggleShield.addEventListener("click", () => {
                adShieldEnabled = !adShieldEnabled;
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
                isAuthorizedUserAction = true;
                if (safeWindowOpen) {
                    safeWindowOpen(activeChannel.currentPlayerUrl, "_blank", "noopener,noreferrer");
                }
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

    // --- 7. TV Remote & D-Pad Spatial Navigation Module ---
        // Global delegation for broadcast pills (ensures clicks always forward to channel)
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".broadcast-pill.playable");
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            let cat = btn.getAttribute("data-category") || "Esportes";
            let ch = btn.getAttribute("data-channel") || "Prime Video";
            let players = channelsData[cat]?.[ch];
            if (!players) {
                for (const [c, chs] of Object.entries(channelsData)) {
                    if (chs[ch]) {
                        cat = c;
                        players = chs[ch];
                        break;
                    }
                }
            }
            if (players) {
                selectChannel(cat, ch, players);
            }
        }
    });

    // ==========================================================================
    // NUVIO MULTIMEDIA & SPA ROUTING MODULE
    // ==========================================================================
    let currentAppView = 'tv'; // 'tv' | 'movies' | 'sports'

    function showToast(message, duration = 3200) {
        const toast = document.getElementById("app-toast");
        if (!toast) return;
        toast.textContent = message;
        toast.classList.remove("hidden");
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.classList.add("hidden");
        }, duration);
    }


    // --- View State Reset Modules (Guarantees fresh state when switching tabs or clicking back) ---
    function resetMoviesViewState() {
        const moviesExploreView = document.getElementById("movies-explore-view");
        const discoveryFeed = document.getElementById("movies-discovery-feed");
        const collectionSection = document.getElementById("movies-collection-section");
        const moviesSearchInput = document.getElementById("movies-search-input");
        const exploreSearchInput = document.getElementById("explore-search-input");
        const btnClearMovieSearch = document.getElementById("btn-clear-movie-search");
        const btnClearExploreSearch = document.getElementById("btn-clear-explore-search");
        const categoryPills = document.getElementById("movies-category-pills");
        const exploreGenresChips = document.getElementById("explore-genres-chips");
        const exploreTimelineChips = document.getElementById("explore-timeline-chips");
        const sortCurrentLabel = document.getElementById("sort-current-label");
        const exploreSortDropdownMenu = document.getElementById("explore-sort-dropdown-menu");
        const btnExploreSortDropdown = document.getElementById("btn-explore-sort-dropdown");

        if (moviesExploreView) moviesExploreView.classList.add("hidden");
        if (collectionSection) collectionSection.classList.add("hidden");
        if (discoveryFeed) discoveryFeed.classList.remove("hidden");

        if (moviesSearchInput) moviesSearchInput.value = "";
        if (exploreSearchInput) exploreSearchInput.value = "";
        if (btnClearMovieSearch) btnClearMovieSearch.classList.add("hidden");
        if (btnClearExploreSearch) btnClearExploreSearch.classList.add("hidden");

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
    }

    function resetSeriesViewState() {
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

        if (seriesExploreView) seriesExploreView.classList.add("hidden");
        if (seriesDiscoveryFeed) seriesDiscoveryFeed.classList.remove("hidden");

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

    function resetAnimesViewState() {
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

        if (animesExploreView) animesExploreView.classList.add("hidden");
        if (animesDiscoveryFeed) animesDiscoveryFeed.classList.remove("hidden");

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

    function switchAppView(viewName) {
        if (viewName === 'sports') {
            showToast("⚽ Agenda de Esportes estará disponível em breve!");
            return;
        }

        currentAppView = viewName;
        document.body.classList.toggle('view-tv-active', viewName === 'tv');
        document.body.setAttribute('data-app-view', viewName);

        // Keep clean URL so refresh always returns to initial Home view
        try {
            history.replaceState(null, '', window.location.pathname + window.location.search);
        } catch (e) {}

        // Reset episode quick search input across views
        const quickEpInput = document.getElementById("series-quick-ep-search");
        if (quickEpInput) quickEpInput.value = "";

        // Close channels mobile sidebar if leaving tv view
        if (viewName !== 'tv') {
            closeMobileMenu();
        }

        const viewHome = document.getElementById("view-home");
        const viewTv = document.getElementById("view-tv");
        const viewMovies = document.getElementById("view-movies");
        const viewSeries = document.getElementById("view-series");
        const viewAnimes = document.getElementById("view-animes");

        const tabHome = document.getElementById("nav-tab-home");
        const tabTv = document.getElementById("nav-tab-tv");
        const tabMovies = document.getElementById("nav-tab-movies");
        const tabSeries = document.getElementById("nav-tab-series");
        const tabAnimes = document.getElementById("nav-tab-animes");
        const tabSports = document.getElementById("nav-tab-sports");

        const allViews = [viewHome, viewTv, viewMovies, viewSeries, viewAnimes];
        allViews.forEach(v => {
            if (v) v.classList.add("hidden");
        });

        const allTabs = [tabHome, tabTv, tabMovies, tabSeries, tabAnimes, tabSports];
        allTabs.forEach(t => {
            if (t) t.classList.remove("active");
        });

        // Always reset search, explore views, and filters when changing views
        resetMoviesViewState();
        resetSeriesViewState();
        resetAnimesViewState();

        if (viewName === 'home') {
            if (viewHome) viewHome.classList.remove("hidden");
            if (tabHome) tabHome.classList.add("active");
            renderHomeContinueWatching();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (viewName === 'movies') {
            if (viewMovies) viewMovies.classList.remove("hidden");
            if (tabMovies) tabMovies.classList.add("active");
            initMoviesView();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (viewName === 'series') {
            if (viewSeries) viewSeries.classList.remove("hidden");
            if (tabSeries) tabSeries.classList.add("active");
            initSeriesView();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (viewName === 'animes') {
            if (viewAnimes) viewAnimes.classList.remove("hidden");
            if (tabAnimes) tabAnimes.classList.add("active");
            initAnimesView();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // 'tv'
            if (viewTv) viewTv.classList.remove("hidden");
            if (tabTv) tabTv.classList.add("active");
        }
    }

    function setupSpaNavigation() {
        const tabHome = document.getElementById("nav-tab-home");
        const tabTv = document.getElementById("nav-tab-tv");
        const tabMovies = document.getElementById("nav-tab-movies");
        const tabSeries = document.getElementById("nav-tab-series");
        const tabAnimes = document.getElementById("nav-tab-animes");
        const tabSports = document.getElementById("nav-tab-sports");

        if (tabHome) tabHome.addEventListener("click", () => switchAppView('home'));
        if (tabTv) tabTv.addEventListener("click", () => switchAppView('tv'));
        if (tabMovies) tabMovies.addEventListener("click", () => switchAppView('movies'));
        if (tabSeries) tabSeries.addEventListener("click", () => switchAppView('series'));
        if (tabAnimes) tabAnimes.addEventListener("click", () => switchAppView('animes'));
        if (tabSports) tabSports.addEventListener("click", () => switchAppView('sports'));

        // Setup Home Portal Navigation Cards
        document.querySelectorAll("#view-home .home-portal-card").forEach(card => {
            const target = card.getAttribute("data-view-target");
            const handleCardAction = () => {
                if (target === 'tv') {
                    switchAppView('tv');
                } else if (target === 'movies') {
                    switchAppView('movies');
                } else if (target === 'series') {
                    switchAppView('series');
                } else if (target === 'animes') {
                    switchAppView('animes');
                } else if (target === 'sports') {
                    showToast("Hub Esportivo em breve! Acompanhe as partidas na aba Canais.");
                }
            };
            card.addEventListener("click", handleCardAction);
            card.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCardAction();
                }
            });
        });

        // Setup Home Utility Shortcuts
        const btnHomeAdblock = document.getElementById("btn-home-adblock-shortcut");
        if (btnHomeAdblock) {
            btnHomeAdblock.addEventListener("click", () => {
                const adblockModal = document.getElementById("adblock-modal");
                if (adblockModal) adblockModal.style.display = "flex";
            });
        }

        const btnHomeTeam = document.getElementById("btn-home-team-shortcut");
        if (btnHomeTeam) {
            btnHomeTeam.addEventListener("click", () => {
                const teamModal = document.getElementById("team-select-modal");
                if (teamModal) {
                    teamModal.classList.add("open");
                    teamModal.setAttribute("aria-hidden", "false");
                    const searchInput = document.getElementById("team-search-input");
                    if (searchInput) searchInput.focus();
                }
            });
        }

        function handleHash() {
            const hash = (window.location.hash || '').toLowerCase();
            if (hash === '#inicio' || hash === '#home') {
                switchAppView('home');
            } else if (hash === '#filmes' || hash === '#movies') {
                switchAppView('movies');
            } else if (hash === '#series') {
                switchAppView('series');
            } else if (hash === '#animes') {
                switchAppView('animes');
            } else if (hash === '#agenda' || hash === '#sports') {
                switchAppView('sports');
            } else {
                switchAppView('tv');
            }
        }

        // Always start fresh on the Home view upon page reload
        if (window.location.hash) {
            try {
                history.replaceState(null, '', window.location.pathname + window.location.search);
            } catch (e) {}
        }
        switchAppView('home');
    }

    // ==========================================================================
    // MOVIES CATALOG & TMDB ENGINE (NUVIO CINEMA STYLE)
    // ==========================================================================
    const TMDB_API_KEY = '2dca580c2a14b55200e784d157207b4d';
    const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
    const TMDB_IMG_W500 = 'https://image.tmdb.org/t/p/w500';
    const TMDB_IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original';
    const TMDB_CACHE_KEY = 'tvzinha_movies_cache_v3';
    const TMDB_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

    // Curated Masters of Cinema (Directors) - TMDB verified 200 OK profile photos
    const FAMOUS_DIRECTORS = [
        { id: 525, name: "Christopher Nolan", knownFor: "Ficção & Suspense", photo: "https://image.tmdb.org/t/p/w300/kWogkBJKzXFJSY8cZpuzanfsaFi.jpg" },
        { id: 138, name: "Quentin Tarantino", knownFor: "Ação & Diálogos", photo: "https://image.tmdb.org/t/p/w300/1gjcpAa99FAOWGnrUvHEXXsRs7o.jpg" },
        { id: 488, name: "Steven Spielberg", knownFor: "Aventura & Épicos", photo: "https://image.tmdb.org/t/p/w300/tZxcg19YQ3e8fJ0pOs7hjlnmmr6.jpg" },
        { id: 1032, name: "Martin Scorsese", knownFor: "Crime & Drama", photo: "https://image.tmdb.org/t/p/w300/g3DjfKsgZQWZiw30I20hZVk1oMX.jpg" },
        { id: 137427, name: "Denis Villeneuve", knownFor: "Ficção Científica", photo: "https://image.tmdb.org/t/p/w300/xzQYqb4nR8xT7Zdw5itbEL9K3fd.jpg" },
        { id: 608, name: "Hayao Miyazaki", knownFor: "Animação & Fantasia", photo: "https://image.tmdb.org/t/p/w300/ouhjt9KugzhWtdEyBPipihB3ic8.jpg" },
        { id: 2710, name: "James Cameron", knownFor: "Grandes Bilheterias", photo: "https://image.tmdb.org/t/p/w300/2Hh4Jos62luf90CCglP5K32qaWO.jpg" },
        { id: 240, name: "Stanley Kubrick", knownFor: "Clássicos & Cults", photo: "https://image.tmdb.org/t/p/w300/yFT0VyIelI9aegZrsAwOG5iVP4v.jpg" },
        { id: 7467, name: "David Fincher", knownFor: "Suspense Psicológico", photo: "https://image.tmdb.org/t/p/w300/tpEczFclQZeKAiCeKZZ0adRvtfz.jpg" },
        { id: 10828, name: "Guillermo del Toro", knownFor: "Fantasia & Monstros", photo: "https://image.tmdb.org/t/p/w300/cWvt8FdPAH0j3QtLzAN1j7ZJJrr.jpg" },
        { id: 510, name: "Tim Burton", knownFor: "Gótico & Fantasia", photo: "https://image.tmdb.org/t/p/w300/yHEHAHQpN9PfSEQx1UxZPczhcAi.jpg" },
        { id: 291263, name: "Jordan Peele", knownFor: "Terror & Crítica", photo: "https://image.tmdb.org/t/p/w300/kFUKn5g3ebpyZ3CSZZZo2HFWRNQ.jpg" }
    ];

    // Curated Famous Studios & Universes - TMDB verified 200 OK logos
    const FAMOUS_STUDIOS = [
        { id: 420, name: "Marvel Studios", badge: "MCU", logo: "https://image.tmdb.org/t/p/w500/hUzeosd33nzE5MCNsZxCGEKTXaQ.png" },
        { id: 174, name: "Warner Bros", badge: "WB & DC", logo: "https://image.tmdb.org/t/p/w500/zhD3hhtKB5qyv7ZeL4uLpNxgMVU.png" },
        { id: 2, name: "Walt Disney", badge: "Disney", logo: "https://image.tmdb.org/t/p/w500/wdrCwmRnLFJhEoH8GSfymY85KHT.png" },
        { id: 3, name: "Pixar", badge: "Pixar Animation", logo: "https://image.tmdb.org/t/p/w500/1TjvGVDMYsj6JBxOAkUHpPEwLf7.png" },
        { id: 10342, name: "Studio Ghibli", badge: "Ghibli", logo: "https://image.tmdb.org/t/p/w500/uFuxPEZRUcBTEiYIxjHJq62Vr77.png" },
        { id: 41077, name: "A24", badge: "Cinema Cult", logo: "https://image.tmdb.org/t/p/w500/1ZXsGaFPgrgS6ZZGS37AqD5uU12.png" },
        { id: 33, name: "Universal Pictures", badge: "Universal", logo: "https://image.tmdb.org/t/p/w500/8lvHyhjr8oUKOOy2dKXoALWKdp0.png" },
        { id: 4, name: "Paramount", badge: "Paramount", logo: "https://image.tmdb.org/t/p/w500/jay6WcMgagAklUt7i9Euwj1pzTF.png" },
        { id: 5, name: "Columbia Pictures", badge: "Sony / Columbia", logo: "https://image.tmdb.org/t/p/w500/71BqEFAF4V3qjjMPCpLuyJFB9A.png" },
        { id: 3172, name: "Blumhouse", badge: "Terror & Suspense", logo: "https://image.tmdb.org/t/p/w500/rzKluDcRkIwHZK2pHsiT667A2Kw.png" },
        { id: 521, name: "DreamWorks", badge: "DreamWorks", logo: "https://image.tmdb.org/t/p/w500/3BPX5VGBov8SDqTV7wC1L1xShAS.png" }
    ];

    // Multi-server embed generators based on universal TMDB ID
    const MOVIE_SERVERS = [
        { id: 'mgeb',      name: 'Servidor 1 (MGEB - Principal)', buildUrl: (id) => `https://mgeb.top/embed/${id}` },
        { id: 'superflix', name: 'Servidor 2 (SuperFlix)', buildUrl: (id) => `https://superflixapi.quest/filme/${id}` },
        { id: 'myembed',   name: 'Servidor 3 (MyEmbed)', buildUrl: (id) => `https://myembed.biz/filme/${id}` },
        { id: 'vsembed',   name: 'Servidor 4 (VSEmbed - Multi-Áudio)', buildUrl: (id) => `https://vsembed.ru/embed/movie/${id}?ds_lang=pob,pt,en` },
        { id: 'embedplay', name: 'Servidor 5 (EmbedPlay)', buildUrl: (id) => `https://www.embedplay.one/filme/${id}` },
        { id: 'fembed',    name: 'Servidor 6 (FEmbed)', buildUrl: (id) => `https://fembed.lol/filme/e/${id}` }
    ];

    let isMoviesInitialized = false;
    let moviesCacheData = null;
    let currentSelectedMovie = null;
    let activeMovieServer = null;
    let movieSearchDebounceTimer = null;

    // Advanced search filter state
    let activeFilterGenre = '';
    let activeFilterYearRange = '';
    let activeFilterSort = 'popularity.desc';

    async function fetchTmdbEndpoint(path) {
        const separator = path.includes('?') ? '&' : '?';
        const url = `${TMDB_BASE_URL}/${path}${separator}api_key=${TMDB_API_KEY}&language=pt-BR`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`TMDB HTTP error ${res.status}`);
        return await res.json();
    }

    async function initMoviesView() {
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
                if (parsed && parsed.timestamp && (Date.now() - parsed.timestamp < TMDB_CACHE_TTL_MS)) {
                    moviesCacheData = parsed.data;
                    renderMoviesDiscoveryFeed(moviesCacheData);
                    return;
                }
            }
        } catch (e) {
            console.warn("Falha ao ler cache de filmes:", e);
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

    async function loadMoviesFromTmdb() {
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

            // Save to cache
            try {
                localStorage.setItem(TMDB_CACHE_KEY, JSON.stringify({
                    timestamp: Date.now(),
                    data: moviesCacheData
                }));
            } catch (e) {
                console.warn("Falha ao salvar cache de filmes:", e);
            }

            renderMoviesDiscoveryFeed(moviesCacheData);
        } catch (err) {
            console.error("Erro ao carregar catálogo de filmes:", err);
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
            : 'logos/fav/icon-detailed.svg';

        const releaseYear = (movie.release_date || '').substring(0, 4) || 'N/A';
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '—';

        card.innerHTML = `
            <img class="movie-poster-img" src="${posterUrl}" alt="${movie.title}" loading="lazy" onerror="this.src='logos/fav/icon-detailed.svg'">
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

    function renderMoviesDiscoveryFeed(data) {
        if (!data) return;

        // 1. Setup Hero Showcase Carousel (3 to 5 top trending movies with backdrops)
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

        // Concurrent pre-fetch and pre-load of all hero movie logos and backdrops
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
                                // If this movie is currently displayed, smoothly upgrade it
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

        // Instant Zero-Delay Clearlogo Transition
        if (movie.logo_url) {
            // Logo already fetched & cached: render immediately with zero delay
            if (logoEl) {
                logoEl.src = movie.logo_url;
                logoEl.classList.remove("hidden");
            }
            if (titleEl) {
                titleEl.classList.add("hidden");
                titleEl.textContent = movie.title || "Filme em Destaque";
            }
        } else if (movie.has_no_logo) {
            // Confirmed no logo available: show clean text title
            if (logoEl) {
                logoEl.classList.add("hidden");
                logoEl.src = "";
            }
            if (titleEl) {
                titleEl.classList.remove("hidden");
                titleEl.textContent = movie.title || "Filme em Destaque";
            }
        } else {
            // Still fetching (very first load): show title fallback and fetch immediately
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

    function setupMoviesCarouselNavigation() {
        document.querySelectorAll('.btn-carousel-arrow').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const trackId = btn.getAttribute('data-track');
                const track = document.getElementById(trackId);
                if (!track) return;
                const isNext = btn.classList.contains('btn-next');
                // Scroll by 2 cards smoothly: (175px card width + 16px gap) * 2 = 382px
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
                <img class="director-avatar" src="${director.photo}" alt="${director.name}" loading="lazy" onerror="this.src='logos/fav/icon-detailed.svg'">
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

        if (!totalPages || totalPages <= 1) {
            container.innerHTML = "";
            container.classList.add("hidden");
            return;
        }

        container.classList.remove("hidden");
        const effectiveTotalPages = Math.min(totalPages, 500); // TMDB API maximum page limit is 500

        // Build pagination page number array with ellipses
        const pageItems = [];
        if (effectiveTotalPages <= 7) {
            for (let i = 1; i <= effectiveTotalPages; i++) pageItems.push(i);
        } else {
            pageItems.push(1);
            if (currentPage > 3) {
                pageItems.push('...');
            }
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(effectiveTotalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) {
                pageItems.push(i);
            }
            if (currentPage < effectiveTotalPages - 2) {
                pageItems.push('...');
            }
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

    async function openCollectionView(type, item, page = 1) {
        const collectionSection = document.getElementById("movies-collection-section");
        const discoveryFeed = document.getElementById("movies-discovery-feed");
        const searchSection = document.getElementById("movies-search-section");
        const grid = document.getElementById("movies-collection-grid");
        const titleEl = document.getElementById("collection-title");
        const metaEl = document.getElementById("collection-meta");
        const badgeEl = document.getElementById("collection-badge");
        const avatarEl = document.getElementById("collection-avatar");

        if (!collectionSection || !grid) return;

        if (searchSection) searchSection.classList.add("hidden");
        if (discoveryFeed) discoveryFeed.classList.add("hidden");
        collectionSection.classList.remove("hidden");

        if (page === 1) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            collectionSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        if (type === 'director') {
            if (badgeEl) badgeEl.textContent = "Mestre da Direção";
            if (titleEl) titleEl.textContent = item.name;
            if (metaEl) metaEl.textContent = `Filmografia Selecionada • ${item.knownFor}`;
            if (avatarEl) {
                avatarEl.src = item.photo;
                avatarEl.classList.remove("collection-logo");
                avatarEl.classList.remove("hidden");
            }
        } else {
            if (badgeEl) badgeEl.textContent = "Grande Estúdio & Produtora";
            if (titleEl) titleEl.textContent = item.name;
            if (metaEl) metaEl.textContent = `Produções & Clássicos do Estúdio (${item.badge || item.name})`;
            if (avatarEl) {
                if (item.logo) {
                    avatarEl.src = item.logo;
                    avatarEl.classList.add("collection-logo");
                    avatarEl.classList.remove("hidden");
                } else {
                    avatarEl.classList.add("hidden");
                }
            }
        }

        grid.innerHTML = `<p style="color:#a1a1aa; grid-column:1/-1; padding:30px 0;">Carregando página ${page}...</p>`;

        try {
            const endpoint = type === 'director'
                ? `discover/movie?with_crew=${item.id}&sort_by=vote_average.desc&vote_count.gte=30&page=${page}`
                : `discover/movie?with_companies=${item.id}&sort_by=popularity.desc&page=${page}`;

            const data = await fetchTmdbEndpoint(endpoint);
            const results = (data.results || []).filter(m => m.poster_path);

            grid.innerHTML = "";
            if (results.length === 0) {
                grid.innerHTML = `<p style="color:#71717a; grid-column:1/-1; padding:30px 0; text-align:center;">Nenhum título encontrado para esta coleção.</p>`;
                renderPaginationControls("movies-collection-pagination", 1, 0, 0, () => {});
                return;
            }

            const fragment = document.createDocumentFragment();
            results.forEach(m => fragment.appendChild(createMovieCardElement(m)));
            grid.appendChild(fragment);

            // Render Pagination
            renderPaginationControls(
                "movies-collection-pagination",
                data.page || page,
                data.total_pages || 1,
                data.total_results || results.length,
                (newPage) => openCollectionView(type, item, newPage)
            );
        } catch (e) {
            console.error("Erro ao carregar coleção:", e);
            grid.innerHTML = `<p style="color:#f87171; grid-column:1/-1;">Erro ao carregar títulos desta coleção.</p>`;
            renderPaginationControls("movies-collection-pagination", 1, 0, 0, () => {});
        }
    }

    function setupMoviesSearchAndFilters() {
        const moviesSearchInput = document.getElementById("movies-search-input");
        const btnClearMovieSearch = document.getElementById("btn-clear-movie-search");
        const btnOpenMovieExplore = document.getElementById("btn-open-movie-explore");
        const spotlightContainer = document.getElementById("spotlight-search-container");

        const moviesExploreView = document.getElementById("movies-explore-view");
        const btnExploreBack = document.getElementById("btn-explore-back");
        const exploreSearchInput = document.getElementById("explore-search-input");
        const btnClearExploreSearch = document.getElementById("btn-clear-explore-search");

        const btnExploreSortDropdown = document.getElementById("btn-explore-sort-dropdown");
        const exploreSortDropdownMenu = document.getElementById("explore-sort-dropdown-menu");
        const sortCurrentLabel = document.getElementById("sort-current-label");
        const exploreGenresChips = document.getElementById("explore-genres-chips");
        const exploreTimelineChips = document.getElementById("explore-timeline-chips");

        const exploreSectionTitle = document.getElementById("explore-section-title");
        const exploreResultsCount = document.getElementById("explore-results-count");
        const exploreActiveTags = document.getElementById("explore-active-tags");
        const explorePosterGrid = document.getElementById("explore-poster-grid");

        const discoveryFeed = document.getElementById("movies-discovery-feed");
        const collectionSection = document.getElementById("movies-collection-section");
        const categoryPills = document.getElementById("movies-category-pills");

        // Generic decoupled media type: 'movie' in Phase 1, ready for 'tv' and 'anime' in Phase 2
        let activeMediaType = 'movie';

        function openExploreView(autoFocus = false) {
            if (!moviesExploreView) return;

            moviesExploreView.classList.remove("hidden");
            if (discoveryFeed) discoveryFeed.classList.add("hidden");
            if (collectionSection) collectionSection.classList.add("hidden");

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

        function closeExploreView() {
            if (!moviesExploreView) return;
            resetMoviesViewState();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

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

        // Back from collection view
        const btnCollectionBack = document.getElementById("btn-collection-back");
        if (btnCollectionBack) {
            btnCollectionBack.addEventListener("click", () => {
                if (collectionSection) collectionSection.classList.add("hidden");
                if (moviesExploreView && !moviesExploreView.classList.contains("hidden")) {
                    // Remain in explore view
                } else if (discoveryFeed) {
                    discoveryFeed.classList.remove("hidden");
                }
                renderPaginationControls("movies-collection-pagination", 1, 0, 0, () => {});
            });
        }

        // Windows-style Sort Dropdown Interactive Logic
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

        // Reusable chips listener helper
        function setupExploreChipsGroup(container, onSelect) {
            if (!container) return;
            container.addEventListener("click", (e) => {
                const chip = e.target.closest(".explore-chip");
                if (!chip) return;
                container.querySelectorAll(".explore-chip").forEach(c => c.classList.remove("active"));
                chip.classList.add("active");
                onSelect(chip);
                executeFilteredCatalogSearch(1);
            });
        }

        setupExploreChipsGroup(exploreGenresChips, (chip) => {
            activeFilterGenre = chip.dataset.genre || '';
        });

        setupExploreChipsGroup(exploreTimelineChips, (chip) => {
            activeFilterYearRange = chip.dataset.yearRange || '';
        });

        // Search inputs listeners
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

        // Active tags renderer
        function updateActiveFilterTags() {
            if (!exploreActiveTags) return;
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
                return;
            }

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
                        if (exploreGenresChips) {
                            exploreGenresChips.querySelectorAll(".explore-chip").forEach(c => c.classList.toggle("active", c.dataset.genre === ""));
                        }
                    } else if (tagType === 'year') {
                        activeFilterYearRange = '';
                        if (exploreTimelineChips) {
                            exploreTimelineChips.querySelectorAll(".explore-chip").forEach(c => c.classList.toggle("active", c.dataset.yearRange === ""));
                        }
                    }
                    executeFilteredCatalogSearch(1);
                });
            });
        }

        // Generic Decoupled Query Engine for Catalog Explorer
        async function executeFilteredCatalogSearch(page = 1) {
            const query = (exploreSearchInput ? exploreSearchInput.value.trim() : '') || (moviesSearchInput ? moviesSearchInput.value.trim() : '');

            if (explorePosterGrid) {
                explorePosterGrid.innerHTML = `<p style="color:#a1a1aa; grid-column: 1/-1; padding: 30px 0; text-align:center;">Buscando títulos no catálogo (página ${page})...</p>`;
            }

            if (page === 1) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else if (moviesExploreView) {
                moviesExploreView.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            updateActiveFilterTags();

            try {
                let endpoint = '';
                const todayDate = new Date().toISOString().split('T')[0];
                const isTv = (activeMediaType === 'tv');
                const dateField = isTv ? 'first_air_date' : 'primary_release_date';

                if (query) {
                    if (exploreSectionTitle) exploreSectionTitle.textContent = `Resultados para "${query}"`;
                    endpoint = `search/${activeMediaType}?query=${encodeURIComponent(query)}&page=${page}`;
                } else {
                    if (exploreSectionTitle) exploreSectionTitle.textContent = `Catálogo Completo de ${activeMediaType === 'movie' ? 'Filmes' : 'Títulos'}`;

                    let effectiveSort = activeFilterSort;
                    if (isTv && effectiveSort.includes('primary_release_date')) {
                        effectiveSort = effectiveSort.replace('primary_release_date', 'first_air_date');
                    } else if (!isTv && effectiveSort.includes('first_air_date')) {
                        effectiveSort = effectiveSort.replace('first_air_date', 'primary_release_date');
                    }

                    let params = `discover/${activeMediaType}?sort_by=${effectiveSort}&page=${page}`;
                    if (activeFilterGenre) params += `&with_genres=${activeFilterGenre}`;

                    if (activeFilterYearRange) {
                        const [startYear, endYear] = activeFilterYearRange.split('-');
                        const currentYear = new Date().getFullYear();
                        const effectiveEnd = (Number(endYear) >= currentYear) ? todayDate : `${endYear}-12-31`;
                        params += `&${dateField}.gte=${startYear}-01-01&${dateField}.lte=${effectiveEnd}`;
                    } else {
                        // Crucial: Cap at today's date so unreleased titles (e.g. 2027, 2030) are NEVER returned
                        params += `&${dateField}.lte=${todayDate}`;
                    }

                    // For release date descending sort, filter out 0-vote placeholders/junk so real releases appear
                    if (effectiveSort.includes('release_date') || effectiveSort.includes('air_date')) {
                        params += `&vote_count.gte=5`;
                    }

                    endpoint = params;
                }

                const data = await fetchTmdbEndpoint(endpoint);
                let results = (data.results || []).filter(m => m.poster_path);

                // Enforce strict release check: never allow titles with a release/air date in the future
                results = results.filter(m => {
                    const itemDate = m.release_date || m.first_air_date;
                    if (itemDate && itemDate > todayDate) return false;
                    return true;
                });

                // If query + genre filter active, apply in-memory filter
                if (query && activeFilterGenre) {
                    results = results.filter(m => m.genre_ids && m.genre_ids.includes(Number(activeFilterGenre)));
                }

                const totalFormatted = (data.total_results || results.length).toLocaleString('pt-BR');
                if (exploreResultsCount) {
                    exploreResultsCount.textContent = `${totalFormatted} ${activeMediaType === 'movie' ? 'filmes encontrados' : 'títulos encontrados'}`;
                }

                if (explorePosterGrid) {
                    explorePosterGrid.innerHTML = "";
                    if (results.length === 0) {
                        explorePosterGrid.innerHTML = `<p style="color:#71717a; grid-column: 1/-1; padding: 40px 0; text-align: center;">Nenhum título encontrado para os filtros selecionados.</p>`;
                        renderPaginationControls("explore-pagination", 1, 0, 0, () => {});
                        return;
                    }
                    const fragment = document.createDocumentFragment();
                    results.forEach(m => {
                        const card = (activeMediaType === 'tv' || m.first_air_date !== undefined)
                            ? createSeriesCardElement(m, activeAnimeFilter ? 'anime' : 'tv')
                            : createMovieCardElement(m);
                        fragment.appendChild(card);
                    });
                    explorePosterGrid.appendChild(fragment);
                }

                // Render Pagination
                renderPaginationControls(
                    "explore-pagination",
                    data.page || page,
                    data.total_pages || 1,
                    data.total_results || results.length,
                    (newPage) => executeFilteredCatalogSearch(newPage)
                );
            } catch (err) {
                console.error("Erro na busca de títulos:", err);
                if (explorePosterGrid) explorePosterGrid.innerHTML = `<p style="color:#f87171; grid-column: 1/-1; padding: 30px 0; text-align: center;">Erro ao carregar o catálogo. Verifique sua conexão e tente novamente.</p>`;
                renderPaginationControls("explore-pagination", 1, 0, 0, () => {});
            }
        }

        // Category Pills (Smooth Scroll to Row on Showcase)
        if (categoryPills) {
            categoryPills.addEventListener("click", (e) => {
                const pill = e.target.closest(".movie-pill");
                if (!pill) return;
                categoryPills.querySelectorAll(".movie-pill").forEach(p => p.classList.remove("active"));
                pill.classList.add("active");

                // If currently in explore view, return to showcase first
                if (moviesExploreView && !moviesExploreView.classList.contains("hidden")) {
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

    // Modal & Player Handlers
    function setupMovieModal() {
        const modal = document.getElementById("movie-modal");
        const btnClose = document.getElementById("btn-close-movie-modal");
        const btnReload = document.getElementById("btn-reload-movie-player");
        const btnClosePlayer = document.getElementById("btn-close-movie-player");

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
                const iframe = document.getElementById("movie-modal-iframe");
                if (iframe && activeMovieServer && currentSelectedMovie) {
                    const currentSrc = iframe.src;
                    iframe.src = "";
                    setTimeout(() => { iframe.src = currentSrc; }, 100);
                }
            });
        }

        if (btnClosePlayer) {
            btnClosePlayer.addEventListener("click", () => {
                const playerContainer = document.getElementById("movie-modal-player-container");
                const backdropBox = document.getElementById("movie-modal-backdrop-box");
                const iframe = document.getElementById("movie-modal-iframe");
                const modalCard = document.querySelector(".movie-modal-card");

                if (iframe) iframe.src = "";
                if (playerContainer) playerContainer.classList.add("hidden");
                if (backdropBox) backdropBox.classList.remove("hidden");
                if (modalCard) modalCard.classList.remove("is-playing");
                document.querySelectorAll(".btn-movie-server").forEach(btn => btn.classList.remove("active"));
                activeMovieServer = null;
            });
        }
    }

    function openMovieDetailsModal(movie, autoplayFirstServer = false) {
        currentSelectedMovie = movie;
        const modal = document.getElementById("movie-modal");
        if (!modal) return;

        // Reset player state
        const playerContainer = document.getElementById("movie-modal-player-container");
        const backdropBox = document.getElementById("movie-modal-backdrop-box");
        const iframe = document.getElementById("movie-modal-iframe");
        const modalCard = document.querySelector(".movie-modal-card");
        if (iframe) iframe.src = "";
        if (playerContainer) playerContainer.classList.add("hidden");
        if (backdropBox) backdropBox.classList.remove("hidden");
        if (modalCard) modalCard.classList.remove("is-playing");

        // Fill modal content
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

        // Populate server buttons
        const serversGrid = document.getElementById("movie-servers-grid");
        if (serversGrid) {
            serversGrid.innerHTML = "";
            MOVIE_SERVERS.forEach((server, idx) => {
                const btn = document.createElement("button");
                btn.className = "btn-movie-server";
                btn.innerHTML = `
                    <span>${server.name}</span>
                    <span style="font-size: 0.72rem; color: #a1a1aa; opacity: 0.8;">▶ Reproduzir</span>
                `;
                btn.addEventListener("click", () => selectMovieServer(server, btn));
                serversGrid.appendChild(btn);

                if (autoplayFirstServer && idx === 0) {
                    setTimeout(() => selectMovieServer(server, btn), 150);
                }
            });
        }

        modal.classList.remove("hidden");
        document.body.style.overflow = "hidden";
    }

    function selectMovieServer(server, buttonElement) {
        if (!currentSelectedMovie) return;
        activeMovieServer = server;

        document.querySelectorAll(".btn-movie-server").forEach(b => b.classList.remove("active"));
        if (buttonElement) buttonElement.classList.add("active");

        const playerContainer = document.getElementById("movie-modal-player-container");
        const backdropBox = document.getElementById("movie-modal-backdrop-box");
        const serverTitle = document.getElementById("movie-player-server-title");
        const iframe = document.getElementById("movie-modal-iframe");
        const modalCard = document.querySelector(".movie-modal-card");

        if (serverTitle) serverTitle.textContent = server.name;
        if (backdropBox) backdropBox.classList.add("hidden");
        if (playerContainer) playerContainer.classList.remove("hidden");
        if (modalCard) modalCard.classList.add("is-playing");

        const movieLoader = document.getElementById("movie-player-loader");
        if (movieLoader) movieLoader.classList.remove("hidden");

        const embedUrl = server.buildUrl(currentSelectedMovie.id);
        if (iframe) {
            iframe.src = "about:blank";
            setTimeout(() => {
                iframe.src = embedUrl;
            }, 60);

            iframe.onload = () => {
                if (iframe.src && !iframe.src.endsWith("about:blank")) {
                    if (movieLoader) movieLoader.classList.add("hidden");
                }
            };
            setTimeout(() => {
                if (movieLoader) movieLoader.classList.add("hidden");
            }, 3000);
        }

        // Smooth scroll to player on mobile
        if (window.innerWidth <= 768) {
            playerContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }

    function closeMovieDetailsModal() {
        const modal = document.getElementById("movie-modal");
        const iframe = document.getElementById("movie-modal-iframe");
        const movieLoader = document.getElementById("movie-player-loader");
        const modalCard = document.querySelector(".movie-modal-card");
        if (iframe) iframe.src = "";
        if (movieLoader) movieLoader.classList.add("hidden");
        if (modal) modal.classList.add("hidden");
        if (modalCard) modalCard.classList.remove("is-playing");
        document.body.style.overflow = "";
        currentSelectedMovie = null;
        activeMovieServer = null;
    }

    // ==========================================================================
    // PHASE 2: SÉRIES & ANIMES ENGINE, DUAL-MODE NAVIGATOR & WATCH PROGRESS
    // ==========================================================================
    let isSeriesInitialized = false;
    let isAnimesInitialized = false;
    let activeAnimeFilter = false;

    const TMDB_SERIES_CACHE_KEY = 'tvzinha_series_cache_v2';
    const TMDB_ANIMES_CACHE_KEY = 'tvzinha_animes_cache_v2';
    const WATCH_PROGRESS_KEY = 'tvzinha_watch_progress_v1';

    let currentSelectedSeries = null;
    let currentSeriesDetails = null;
    const cachedSeasonsMap = {}; // showId_seasonNum -> episodes array

    let activeSeriesPlaying = {
        show: null,
        seasonNumber: 1,
        episodeNumber: 1,
        episodeData: null,
        server: 'mgeb'
    };

    let heroSeriesList = [];
    let currentHeroSeriesIndex = 0;
    let heroSeriesTimer = null;

    let heroAnimesList = [];
    let currentHeroAnimesIndex = 0;
    let heroAnimesTimer = null;

    // Series Video Providers (Verified 200 OK)
    const SERIES_SERVERS = {
        mgeb: {
            name: "MGEB",
            buildUrl: (id, s, e) => `https://mgeb.top/embed/serie/${id}/${s}/${e}`
        },
        superflix: {
            name: "Superflix",
            buildUrl: (id, s, e) => `https://superflixapi.quest/serie/${id}/${s}/${e}`
        },
        myembed: {
            name: "MyEmbed",
            buildUrl: (id, s, e) => `https://myembed.biz/embed/tv/${id}/${s}/${e}`
        },
        warezcdn: {
            name: "WarezCDN",
            buildUrl: (id, s, e) => `https://embed.warezcdn.net/serie/${id}/${s}/${e}`
        },
        vsembed: {
            name: "VsEmbed",
            buildUrl: (id, s, e) => `https://vsembed.ru/embed/tv/${id}/${s}/${e}`
        }
    };

    // --- 1. Persistent Watch History (Safe from TMDB Cache Purges) ---
    function getStoredWatchProgress() {
        try {
            const raw = localStorage.getItem(WATCH_PROGRESS_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) {
            return {};
        }
    }

    function saveStoredWatchProgress(show, season, episode, epTitle, mediaType = 'tv') {
        try {
            const progress = getStoredWatchProgress();
            progress[show.id] = {
                id: show.id,
                title: show.name || show.title,
                poster_path: show.poster_path,
                backdrop_path: show.backdrop_path,
                season: Number(season),
                episode: Number(episode),
                episodeTitle: epTitle || `Episódio ${episode}`,
                mediaType: mediaType,
                timestamp: Date.now()
            };
            localStorage.setItem(WATCH_PROGRESS_KEY, JSON.stringify(progress));
            renderHomeContinueWatching();
        } catch (e) {
            console.warn("Falha ao salvar histórico de episódios:", e);
        }
    }

    function renderHomeContinueWatching() {
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
                : (item.poster_path ? `${TMDB_IMG_W500}${item.poster_path}` : 'logos/fav/icon-detailed.svg');

            card.innerHTML = `
                <div class="continue-card-media">
                    <img src="${imgUrl}" alt="${item.title}" loading="lazy" onerror="this.src='logos/fav/icon-detailed.svg'">
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
                openSeriesModal({ id: item.id, name: item.title, poster_path: item.poster_path, backdrop_path: item.backdrop_path }, item.mediaType, {
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

    // --- 2. Series & Animes Card Element Creator ---
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
            : 'logos/fav/icon-detailed.svg';

        card.innerHTML = `
            <img class="movie-poster-img" src="${posterUrl}" alt="${title}" loading="lazy" onerror="this.src='logos/fav/icon-detailed.svg'">
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

    // --- 3. Series Showcase View Module ---
    async function initSeriesView() {
        if (isSeriesInitialized) return;
        isSeriesInitialized = true;

        setupSeriesToolbarAndNavigation();
        setupSeriesModalHandlers();

        // Check local cache
        try {
            const rawCache = localStorage.getItem(TMDB_SERIES_CACHE_KEY);
            if (rawCache) {
                const parsed = JSON.parse(rawCache);
                if (parsed && parsed.timestamp && (Date.now() - parsed.timestamp < TMDB_CACHE_TTL_MS)) {
                    renderSeriesDiscoveryFeed(parsed.data);
                    return;
                }
            }
        } catch (e) {
            console.warn("Falha ao ler cache de séries:", e);
        }

        await loadSeriesFromTmdb();
    }

    async function loadSeriesFromTmdb() {
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const [trendingRes, releasesRes, dramaRes, scifiRes, comedyRes] = await Promise.allSettled([
                fetchTmdbEndpoint('discover/tv?without_genres=16,10767,10766,10763&sort_by=popularity.desc&vote_count.gte=30'),
                fetchTmdbEndpoint(`discover/tv?without_genres=16,10767,10766,10763&sort_by=first_air_date.desc&first_air_date.lte=${todayStr}&vote_count.gte=10`),
                fetchTmdbEndpoint('discover/tv?with_genres=18&without_genres=16,10767,10766,10763&sort_by=vote_average.desc&vote_count.gte=300'),
                fetchTmdbEndpoint('discover/tv?with_genres=10765&without_genres=16,10767,10766,10763&sort_by=popularity.desc'),
                fetchTmdbEndpoint('discover/tv?with_genres=35&without_genres=16,10767,10766,10763&sort_by=popularity.desc')
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
            console.error("Erro ao carregar dados de séries:", err);
        }
    }

    function renderSeriesDiscoveryFeed(data) {
        if (!data) return;

        // Hero Showcase
        const candidates = (data.trending || []).filter(s => s.backdrop_path);
        heroSeriesList = candidates.length >= 3 ? candidates.slice(0, 5) : (data.trending || []).slice(0, 5);
        if (heroSeriesList.length > 0) {
            currentHeroSeriesIndex = 0;
            initHeroSeriesCarousel(heroSeriesList);
        }

        // Render Tracks
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

        // Concurrent pre-fetch and pre-load of all hero series logos and backdrops
        seriesItems.forEach(item => {
            if (item.backdrop_path) {
                const preBackdrop = new Image();
                preBackdrop.src = `${TMDB_IMG_ORIGINAL}${item.backdrop_path}`;
            }

            if (!item.logo_url && !item.has_no_logo) {
                fetchTmdbEndpoint(`tv/${item.id}/images?include_image_language=pt,en,null`).then(imgData => {
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

            // Clearlogo transition for Series
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

                if (item.id && logoEl) {
                    fetchTmdbEndpoint(`tv/${item.id}/images?include_image_language=pt,en,null`).then(imgData => {
                        if (imgData && imgData.logos && imgData.logos.length > 0) {
                            const ptLogo = imgData.logos.find(l => l.iso_639_1 === 'pt');
                            const enLogo = imgData.logos.find(l => l.iso_639_1 === 'en');
                            const chosenLogo = ptLogo || enLogo || imgData.logos[0];
                            if (chosenLogo && chosenLogo.file_path) {
                                item.logo_url = `${TMDB_IMG_W500}${chosenLogo.file_path}`;
                                const img = new Image();
                                img.src = item.logo_url;
                                img.onload = () => {
                                    if (heroSeriesList[currentHeroSeriesIndex] && heroSeriesList[currentHeroSeriesIndex].id === item.id) {
                                        logoEl.src = item.logo_url;
                                        logoEl.classList.remove("hidden");
                                        if (titleEl) titleEl.classList.add("hidden");
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
            }

            if (yearEl) yearEl.textContent = (item.first_air_date || '').substring(0, 4) || 'Série';
            if (ratingEl) ratingEl.textContent = `★ ${item.vote_average ? item.vote_average.toFixed(1) : '8.0'}`;
            if (overviewEl) overviewEl.textContent = item.overview || "Sinopse não disponível em português.";

            if (genresEl && item.genre_ids) {
                genresEl.innerHTML = item.genre_ids.slice(0, 3).map(id => {
                    return `<span class="movies-genre-tag">${TMDB_GENRES[id] || 'Série'}</span>`;
                }).join('');
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

        showHeroSeriesSlide(0);

        if (btnPrev) btnPrev.onclick = () => showHeroSeriesSlide(currentHeroSeriesIndex - 1);
        if (btnNext) btnNext.onclick = () => showHeroSeriesSlide(currentHeroSeriesIndex + 1);

        if (heroSeriesTimer) clearInterval(heroSeriesTimer);
        heroSeriesTimer = setInterval(() => {
            showHeroSeriesSlide(currentHeroSeriesIndex + 1);
        }, 7000);

        if (heroSection) {
            heroSection.addEventListener("mouseenter", () => clearInterval(heroSeriesTimer));
            heroSection.addEventListener("mouseleave", () => {
                clearInterval(heroSeriesTimer);
                heroSeriesTimer = setInterval(() => showHeroSeriesSlide(currentHeroSeriesIndex + 1), 7000);
            });
        }
    }

    // --- Dedicated Full-Screen Explore & Filter System for Séries ---
    let activeSeriesFilterGenre = '';
    let activeSeriesFilterYearRange = '';
    let activeSeriesFilterSort = 'popularity.desc';
    let seriesSearchDebounceTimer = null;

    function openSeriesExploreView(autoFocus = false) {
        const seriesExploreView = document.getElementById("series-explore-view");
        const seriesDiscoveryFeed = document.getElementById("series-discovery-feed");
        const exploreSearchInput = document.getElementById("series-explore-search-input");
        const seriesSearchInput = document.getElementById("series-search-input");
        const btnClear = document.getElementById("btn-clear-series-explore-search");

        if (!seriesExploreView) return;

        seriesExploreView.classList.remove("hidden");
        if (seriesDiscoveryFeed) seriesDiscoveryFeed.classList.add("hidden");

        const initialQuery = seriesSearchInput ? seriesSearchInput.value.trim() : '';
        if (exploreSearchInput) {
            exploreSearchInput.value = initialQuery;
            if (btnClear) btnClear.classList.toggle("hidden", initialQuery.length === 0);
            if (autoFocus) {
                setTimeout(() => exploreSearchInput.focus(), 80);
            }
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
        executeFilteredSeriesSearch(1);
    }

    function closeSeriesExploreView() {
        const seriesExploreView = document.getElementById("series-explore-view");
        if (!seriesExploreView) return;
        resetSeriesViewState();
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

        // Horizontal arrows
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

        // Trigger open explore view on search interaction
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

        // Sort dropdown
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

        // Genre and Timeline chips
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

        // Search input
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
            tags.push({ label: `Gênero: ${genreName}`, type: 'genre' });
        }
        if (activeSeriesFilterYearRange) {
            tags.push({ label: `Época: ${activeSeriesFilterYearRange}`, type: 'year' });
        }

        if (tags.length === 0) {
            container.innerHTML = "";
            return;
        }

        container.innerHTML = tags.map(t => `
            <span class="active-filter-tag">
                <span>${t.label}</span>
                <button type="button" class="btn-remove-tag" data-tag-type="${t.type}" aria-label="Remover filtro">&times;</button>
            </span>
        `).join('');

        container.querySelectorAll(".btn-remove-tag").forEach(btn => {
            btn.addEventListener("click", () => {
                const tagType = btn.dataset.tagType;
                if (tagType === 'genre') {
                    activeSeriesFilterGenre = '';
                    if (genresChips) genresChips.querySelectorAll(".explore-chip").forEach(c => c.classList.toggle("active", c.dataset.genre === ""));
                } else if (tagType === 'year') {
                    activeSeriesFilterYearRange = '';
                    if (timelineChips) timelineChips.querySelectorAll(".explore-chip").forEach(c => c.classList.toggle("active", c.dataset.yearRange === ""));
                }
                executeFilteredSeriesSearch(1);
            });
        });
    }

    async function executeFilteredSeriesSearch(page = 1) {
        const exploreView = document.getElementById("series-explore-view");
        const posterGrid = document.getElementById("series-explore-poster-grid");
        const sectionTitle = document.getElementById("series-explore-section-title");
        const resultsCount = document.getElementById("series-explore-results-count");
        const searchInput = document.getElementById("series-explore-search-input");
        const query = searchInput ? searchInput.value.trim() : '';

        if (posterGrid) {
            posterGrid.innerHTML = `<p style="color:#a1a1aa; grid-column: 1/-1; padding: 30px 0; text-align:center;">Buscando séries no catálogo (página ${page})...</p>`;
        }

        if (page === 1) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (exploreView) {
            exploreView.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        updateActiveSeriesFilterTags();

        try {
            let endpoint = '';
            const todayDate = new Date().toISOString().split('T')[0];

            if (query) {
                if (sectionTitle) sectionTitle.textContent = `Resultados para "${query}"`;
                endpoint = `search/tv?query=${encodeURIComponent(query)}&page=${page}`;
            } else {
                if (sectionTitle) sectionTitle.textContent = "Catálogo de Séries";
                let params = `discover/tv?sort_by=${activeSeriesFilterSort}&page=${page}`;

                if (activeSeriesFilterGenre) {
                    params += `&with_genres=${activeSeriesFilterGenre}`;
                } else {
                    params += `&without_genres=16,10767,10766,10763&vote_count.gte=10`;
                }

                if (activeSeriesFilterYearRange) {
                    const parts = activeSeriesFilterYearRange.split('-');
                    if (parts.length === 2) {
                        params += `&first_air_date.gte=${parts[0]}-01-01&first_air_date.lte=${parts[1]}-12-31`;
                    }
                } else {
                    params += `&first_air_date.lte=${todayDate}`;
                }

                endpoint = params;
            }

            const data = await fetchTmdbEndpoint(endpoint);
            const results = (data.results || []).filter(item => item.poster_path);
            const totalResults = data.total_results || results.length;
            const totalPages = Math.min(data.total_pages || 1, 100);

            if (resultsCount) {
                resultsCount.textContent = `${totalResults.toLocaleString('pt-BR')} ${totalResults === 1 ? 'série encontrada' : 'séries encontradas'}`;
            }

            if (results.length === 0) {
                if (posterGrid) {
                    posterGrid.innerHTML = `<p style="color:#71717a; padding: 40px 20px; grid-column: 1/-1; text-align:center;">Nenhuma série encontrada para os filtros selecionados.</p>`;
                }
                renderPaginationControls("series-explore-pagination", 1, 0, 0, () => {});
                return;
            }

            if (posterGrid) {
                posterGrid.innerHTML = "";
                const fragment = document.createDocumentFragment();
                results.forEach(seriesItem => {
                    fragment.appendChild(createSeriesCardElement(seriesItem, 'tv'));
                });
                posterGrid.appendChild(fragment);
            }

            renderPaginationControls("series-explore-pagination", page, totalPages, totalResults, (p) => {
                executeFilteredSeriesSearch(p);
            });
        } catch (err) {
            console.error("Erro na busca de séries:", err);
            if (posterGrid) posterGrid.innerHTML = `<p style="color:#f87171; padding: 20px; grid-column: 1/-1; text-align:center;">Erro ao carregar séries do catálogo.</p>`;
        }
    }

    // --- 4. Animes Showcase View Module ---
    async function initAnimesView() {
        if (isAnimesInitialized) return;
        isAnimesInitialized = true;

        setupAnimesToolbarAndNavigation();
        setupSeriesModalHandlers();

        // Check local cache
        try {
            const rawCache = localStorage.getItem(TMDB_ANIMES_CACHE_KEY);
            if (rawCache) {
                const parsed = JSON.parse(rawCache);
                if (parsed && parsed.timestamp && (Date.now() - parsed.timestamp < TMDB_CACHE_TTL_MS)) {
                    renderAnimesDiscoveryFeed(parsed.data);
                    return;
                }
            }
        } catch (e) {
            console.warn("Falha ao ler cache de animes:", e);
        }

        await loadAnimesFromTmdb();
    }

    async function loadAnimesFromTmdb() {
        try {
            const todayStr = new Date().toISOString().split('T')[0];
            const [trendingRes, shonenRes, isekaiRes, classicsRes, releasesRes] = await Promise.allSettled([
                fetchTmdbEndpoint('discover/tv?with_genres=16&with_original_language=ja&sort_by=popularity.desc&vote_count.gte=30&without_keywords=256466,157145'),
                fetchTmdbEndpoint('discover/tv?with_genres=16,10759&without_genres=10762&with_original_language=ja&sort_by=popularity.desc&without_keywords=256466,157145'),
                fetchTmdbEndpoint('discover/tv?with_genres=16,10765&without_genres=10762&with_original_language=ja&sort_by=popularity.desc&without_keywords=256466,157145'),
                fetchTmdbEndpoint('discover/tv?with_genres=16&with_original_language=ja&first_air_date.lte=2010-12-31&vote_count.gte=200&sort_by=vote_average.desc&without_keywords=256466,157145'),
                fetchTmdbEndpoint(`discover/tv?with_genres=16&with_original_language=ja&sort_by=first_air_date.desc&first_air_date.lte=${todayStr}&vote_count.gte=5&without_keywords=256466,157145`)
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
            console.error("Erro ao carregar dados de animes:", err);
        }
    }

    function renderAnimesDiscoveryFeed(data) {
        if (!data) return;

        // Hero Showcase
        const candidates = (data.trending || []).filter(a => a.backdrop_path);
        heroAnimesList = candidates.length >= 3 ? candidates.slice(0, 5) : (data.trending || []).slice(0, 5);
        if (heroAnimesList.length > 0) {
            currentHeroAnimesIndex = 0;
            initHeroAnimesCarousel(heroAnimesList);
        }

        // Render Tracks
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

        // Concurrent pre-fetch and pre-load of all hero anime logos and backdrops
        animeItems.forEach(item => {
            if (item.backdrop_path) {
                const preBackdrop = new Image();
                preBackdrop.src = `${TMDB_IMG_ORIGINAL}${item.backdrop_path}`;
            }

            if (!item.logo_url && !item.has_no_logo) {
                fetchTmdbEndpoint(`tv/${item.id}/images?include_image_language=pt,en,null,ja`).then(imgData => {
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
                dot.className = `hero-dot ${idx === 0 ? 'active' : ''}`;
                dot.setAttribute("aria-label", `Destaque Anime ${idx + 1}`);
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

            // Clearlogo transition for Animes
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

                if (item.id && logoEl) {
                    fetchTmdbEndpoint(`tv/${item.id}/images?include_image_language=pt,en,null,ja`).then(imgData => {
                        if (imgData && imgData.logos && imgData.logos.length > 0) {
                            const ptLogo = imgData.logos.find(l => l.iso_639_1 === 'pt');
                            const enLogo = imgData.logos.find(l => l.iso_639_1 === 'en');
                            const chosenLogo = ptLogo || enLogo || imgData.logos[0];
                            if (chosenLogo && chosenLogo.file_path) {
                                item.logo_url = `${TMDB_IMG_W500}${chosenLogo.file_path}`;
                                const img = new Image();
                                img.src = item.logo_url;
                                img.onload = () => {
                                    if (heroAnimesList[currentHeroAnimesIndex] && heroAnimesList[currentHeroAnimesIndex].id === item.id) {
                                        logoEl.src = item.logo_url;
                                        logoEl.classList.remove("hidden");
                                        if (titleEl) titleEl.classList.add("hidden");
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
            }

            if (yearEl) yearEl.textContent = (item.first_air_date || '').substring(0, 4) || 'Anime';
            if (ratingEl) ratingEl.textContent = `★ ${item.vote_average ? item.vote_average.toFixed(1) : '8.5'}`;
            if (overviewEl) overviewEl.textContent = item.overview || "Sinopse não disponível em português.";

            if (genresEl && item.genre_ids) {
                genresEl.innerHTML = item.genre_ids.slice(0, 3).map(id => {
                    return `<span class="movies-genre-tag">${TMDB_GENRES[id] || 'Anime'}</span>`;
                }).join('');
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

        showHeroAnimesSlide(0);

        if (btnPrev) btnPrev.onclick = () => showHeroAnimesSlide(currentHeroAnimesIndex - 1);
        if (btnNext) btnNext.onclick = () => showHeroAnimesSlide(currentHeroAnimesIndex + 1);

        if (heroAnimesTimer) clearInterval(heroAnimesTimer);
        heroAnimesTimer = setInterval(() => {
            showHeroAnimesSlide(currentHeroAnimesIndex + 1);
        }, 7000);

        if (heroSection) {
            heroSection.addEventListener("mouseenter", () => clearInterval(heroAnimesTimer));
            heroSection.addEventListener("mouseleave", () => {
                clearInterval(heroAnimesTimer);
                heroAnimesTimer = setInterval(() => showHeroAnimesSlide(currentHeroAnimesIndex + 1), 7000);
            });
        }
    }

    // --- Dedicated Full-Screen Explore & Filter System for Animes ---
    let activeAnimesFilterGenre = '';
    let activeAnimesFilterYearRange = '';
    let activeAnimesFilterSort = 'popularity.desc';
    let animesSearchDebounceTimer = null;

    function openAnimesExploreView(autoFocus = false) {
        const animesExploreView = document.getElementById("animes-explore-view");
        const animesDiscoveryFeed = document.getElementById("animes-discovery-feed");
        const exploreSearchInput = document.getElementById("animes-explore-search-input");
        const animesSearchInput = document.getElementById("animes-search-input");
        const btnClear = document.getElementById("btn-clear-animes-explore-search");

        if (!animesExploreView) return;

        animesExploreView.classList.remove("hidden");
        if (animesDiscoveryFeed) animesDiscoveryFeed.classList.add("hidden");

        const initialQuery = animesSearchInput ? animesSearchInput.value.trim() : '';
        if (exploreSearchInput) {
            exploreSearchInput.value = initialQuery;
            if (btnClear) btnClear.classList.toggle("hidden", initialQuery.length === 0);
            if (autoFocus) {
                setTimeout(() => exploreSearchInput.focus(), 80);
            }
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
        executeFilteredAnimesSearch(1);
    }

    function closeAnimesExploreView() {
        const animesExploreView = document.getElementById("animes-explore-view");
        if (!animesExploreView) return;
        resetAnimesViewState();
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

        // Horizontal arrows
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

        // Trigger open explore view on search interaction
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

        // Sort dropdown
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

        // Genre/Theme chips
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

        // Timeline chips
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

        // Search input
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
            tags.push({ label: `Tema: ${genreName}`, type: 'genre' });
        }
        if (activeAnimesFilterYearRange) {
            tags.push({ label: `Época: ${activeAnimesFilterYearRange}`, type: 'year' });
        }

        if (tags.length === 0) {
            container.innerHTML = "";
            return;
        }

        container.innerHTML = tags.map(t => `
            <span class="active-filter-tag">
                <span>${t.label}</span>
                <button type="button" class="btn-remove-tag" data-tag-type="${t.type}" aria-label="Remover filtro">&times;</button>
            </span>
        `).join('');

        container.querySelectorAll(".btn-remove-tag").forEach(btn => {
            btn.addEventListener("click", () => {
                const tagType = btn.dataset.tagType;
                if (tagType === 'genre') {
                    activeAnimesFilterGenre = '';
                    if (genresChips) genresChips.querySelectorAll(".explore-chip").forEach(c => c.classList.toggle("active", c.dataset.genre === ""));
                } else if (tagType === 'year') {
                    activeAnimesFilterYearRange = '';
                    if (timelineChips) timelineChips.querySelectorAll(".explore-chip").forEach(c => c.classList.toggle("active", c.dataset.yearRange === ""));
                }
                executeFilteredAnimesSearch(1);
            });
        });
    }

    async function executeFilteredAnimesSearch(page = 1) {
        const exploreView = document.getElementById("animes-explore-view");
        const posterGrid = document.getElementById("animes-explore-poster-grid");
        const sectionTitle = document.getElementById("animes-explore-section-title");
        const resultsCount = document.getElementById("animes-explore-results-count");
        const searchInput = document.getElementById("animes-explore-search-input");
        const query = searchInput ? searchInput.value.trim() : '';

        if (posterGrid) {
            posterGrid.innerHTML = `<p style="color:#a1a1aa; grid-column: 1/-1; padding: 30px 0; text-align:center;">Buscando animes no catálogo (página ${page})...</p>`;
        }

        if (page === 1) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (exploreView) {
            exploreView.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        updateActiveAnimesFilterTags();

        try {
            let endpoint = '';
            const todayDate = new Date().toISOString().split('T')[0];

            if (query) {
                if (sectionTitle) sectionTitle.textContent = `Resultados para "${query}"`;
                endpoint = `search/tv?query=${encodeURIComponent(query)}&page=${page}`;
            } else {
                if (sectionTitle) sectionTitle.textContent = "Catálogo de Animes";
                let genresList = ['16'];
                if (activeAnimesFilterGenre) {
                    genresList.push(activeAnimesFilterGenre);
                }

                let params = `discover/tv?sort_by=${activeAnimesFilterSort}&page=${page}&with_genres=${genresList.join(',')}&with_original_language=ja&without_keywords=256466,157145&vote_count.gte=5`;

                if (activeAnimesFilterYearRange) {
                    const parts = activeAnimesFilterYearRange.split('-');
                    if (parts.length === 2) {
                        params += `&first_air_date.gte=${parts[0]}-01-01&first_air_date.lte=${parts[1]}-12-31`;
                    }
                } else {
                    params += `&first_air_date.lte=${todayDate}`;
                }

                endpoint = params;
            }

            const data = await fetchTmdbEndpoint(endpoint);
            const allResults = (data.results || []).filter(item => item.poster_path);
            let results = allResults;

            // In text search mode, prioritize Japanese animations if mixed
            if (query) {
                const animeFiltered = allResults.filter(item => {
                    const isAnim = item.genre_ids && item.genre_ids.includes(16);
                    const isJp = item.original_language === 'ja' || (item.origin_country && item.origin_country.includes('JP'));
                    return isAnim || isJp;
                });
                results = (animeFiltered.length > 0) ? animeFiltered : allResults;
            }

            const totalResults = data.total_results || results.length;
            const totalPages = Math.min(data.total_pages || 1, 100);

            if (resultsCount) {
                resultsCount.textContent = `${totalResults.toLocaleString('pt-BR')} ${totalResults === 1 ? 'anime encontrado' : 'animes encontrados'}`;
            }

            if (results.length === 0) {
                if (posterGrid) {
                    posterGrid.innerHTML = `<p style="color:#71717a; padding: 40px 20px; grid-column: 1/-1; text-align:center;">Nenhum anime encontrado para os filtros selecionados.</p>`;
                }
                renderPaginationControls("animes-explore-pagination", 1, 0, 0, () => {});
                return;
            }

            if (posterGrid) {
                posterGrid.innerHTML = "";
                const fragment = document.createDocumentFragment();
                results.forEach(animeItem => {
                    fragment.appendChild(createSeriesCardElement(animeItem, 'anime'));
                });
                posterGrid.appendChild(fragment);
            }

            renderPaginationControls("animes-explore-pagination", page, totalPages, totalResults, (p) => {
                executeFilteredAnimesSearch(p);
            });
        } catch (err) {
            console.error("Erro na busca de animes:", err);
            if (posterGrid) posterGrid.innerHTML = `<p style="color:#f87171; padding: 20px; grid-column: 1/-1; text-align:center;">Erro ao carregar animes do catálogo.</p>`;
        }
    }

    // --- 5. SERIES & ANIMES DETAILS MODAL & DUAL-MODE EPISODE NAVIGATOR ---
    let isSeriesModalHandlersInitialized = false;
    function setupSeriesModalHandlers() {
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
                const iframe = document.getElementById("series-modal-iframe");
                if (iframe && activeSeriesPlaying.show) {
                    const curSrc = iframe.src;
                    iframe.src = "";
                    setTimeout(() => { iframe.src = curSrc; }, 100);
                }
            });
        }

        if (btnClosePlayer) {
            btnClosePlayer.addEventListener("click", stopSeriesPlayer);
        }

        // Previous and Next Episode buttons
        const btnPrevEp = document.getElementById("btn-series-prev-ep");
        const btnNextEp = document.getElementById("btn-series-next-ep");

        if (btnPrevEp) {
            btnPrevEp.addEventListener("click", () => {
                if (activeSeriesPlaying.episodeNumber > 1) {
                    playSeriesEpisode(
                        activeSeriesPlaying.show,
                        activeSeriesPlaying.seasonNumber,
                        activeSeriesPlaying.episodeNumber - 1
                    );
                }
            });
        }

        if (btnNextEp) {
            btnNextEp.addEventListener("click", () => {
                const currentEp = activeSeriesPlaying.episodeNumber;
                const curSeason = activeSeriesPlaying.seasonNumber;
                const cachedEpisodes = cachedSeasonsMap[`${activeSeriesPlaying.show.id}_${curSeason}`] || [];

                if (currentEp < cachedEpisodes.length) {
                    playSeriesEpisode(activeSeriesPlaying.show, curSeason, currentEp + 1);
                } else if (currentSeriesDetails && curSeason < currentSeriesDetails.number_of_seasons) {
                    // Advance to season + 1, episode 1
                    playSeriesEpisode(activeSeriesPlaying.show, curSeason + 1, 1);
                } else {
                    showToast("Você já está no último episódio disponível!");
                }
            });
        }

        // Toggle Drawer
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

        // Server switcher pills inside series player
        document.querySelectorAll("#series-server-pills .btn-series-server-pill").forEach(pill => {
            pill.addEventListener("click", () => {
                document.querySelectorAll("#series-server-pills .btn-series-server-pill").forEach(p => p.classList.remove("active"));
                pill.classList.add("active");
                activeSeriesPlaying.server = pill.dataset.server || 'mgeb';

                const iframe = document.getElementById("series-modal-iframe");
                const seriesLoader = document.getElementById("series-theater-loader");
                if (iframe && activeSeriesPlaying.show) {
                    const serverDef = SERIES_SERVERS[activeSeriesPlaying.server] || SERIES_SERVERS.mgeb;
                    const nextUrl = serverDef.buildUrl(activeSeriesPlaying.show.id, activeSeriesPlaying.seasonNumber, activeSeriesPlaying.episodeNumber);
                    
                    if (seriesLoader) seriesLoader.classList.remove("hidden");
                    iframe.src = "about:blank";
                    setTimeout(() => {
                        iframe.src = nextUrl;
                    }, 60);

                    iframe.onload = () => {
                        if (iframe.src && !iframe.src.endsWith("about:blank")) {
                            if (seriesLoader) seriesLoader.classList.add("hidden");
                        }
                    };
                    setTimeout(() => {
                        if (seriesLoader) seriesLoader.classList.add("hidden");
                    }, 3000);
                }
            });
        });

        // Direct play button on backdrop in series modal (matching movie modal)
        const directPlayBtn = document.getElementById("btn-series-modal-direct-play");
        if (directPlayBtn) {
            directPlayBtn.addEventListener("click", () => {
                if (!currentSelectedSeries) return;
                const progress = getStoredWatchProgress()[currentSelectedSeries.id];
                if (progress && progress.season && progress.episode) {
                    playSeriesEpisode(currentSelectedSeries, progress.season, progress.episode);
                } else {
                    playSeriesEpisode(currentSelectedSeries, 1, 1);
                }
            });
        }

        // Dual-Mode Toggle: Arcs vs Continuous
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

        // Quick episode search in continuous mode
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

    async function openSeriesModal(seriesItem, mediaType = 'tv', options = {}) {
        currentSelectedSeries = seriesItem;
        const modal = document.getElementById("series-modal");
        if (!modal) return;

        // Reset player UI
        stopSeriesPlayer();

        // Clear quick episode search field
        const quickSearchInput = document.getElementById("series-quick-ep-search");
        if (quickSearchInput) quickSearchInput.value = "";

        // Fill basic header info
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

        // Backdrop direct play CTA label check (matching movie modal)
        const directPlayLabel = document.getElementById("series-modal-direct-play-label");
        const progress = getStoredWatchProgress()[seriesItem.id];
        if (directPlayLabel) {
            if (progress && progress.season && progress.episode) {
                directPlayLabel.textContent = `Continuar T${progress.season}:E${progress.episode}`;
            } else {
                directPlayLabel.textContent = "Assistir Agora (T1:E1)";
            }
        }

        modal.classList.remove("hidden");
        document.body.style.overflow = "hidden";

        // Reset mode toggle to Arcs view by default
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

        // Fetch detailed series metadata (seasons, total episodes)
        try {
            const details = await fetchTmdbEndpoint(`tv/${seriesItem.id}`);
            currentSeriesDetails = details;

            if (seasonsCountEl) {
                const totalSeasons = details.number_of_seasons || 1;
                const totalEpisodes = details.number_of_episodes || '';
                seasonsCountEl.textContent = `${totalSeasons} ${totalSeasons === 1 ? 'Temporada' : 'Temporadas'} ${totalEpisodes ? '• ' + totalEpisodes + ' eps' : ''}`;
            }

            if (genresEl && details.genres) {
                genresEl.innerHTML = details.genres.slice(0, 3).map(g => `<span class="movie-modal-genre-tag">${g.name}</span>`).join('');
            }

            // Populate Seasons Select dropdown
            populateSeasonsSelect(details);

            // Auto-play or auto-resume if requested
            if (options.autoPlaySeason && options.autoPlayEpisode) {
                setTimeout(() => {
                    playSeriesEpisode(seriesItem, options.autoPlaySeason, options.autoPlayEpisode);
                }, 300);
            }
        } catch (err) {
            console.error("Erro ao carregar detalhes completos da série:", err);
        }
    }

    function populateSeasonsSelect(details) {
        const select = document.getElementById("series-season-select");
        if (!select) return;

        select.innerHTML = "";
        const seasons = (details.seasons || []).filter(s => s.season_number > 0); // exclude specials Season 0 by default

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

        // Trigger loading first season
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
                const data = await fetchTmdbEndpoint(`tv/${showId}/season/${seasonNumber}`);
                episodes = data.results || data.episodes || [];
                cachedSeasonsMap[cacheKey] = episodes;
            } catch (err) {
                console.error("Erro ao carregar episódios:", err);
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
                : (currentSelectedSeries.backdrop_path ? `${TMDB_IMG_W500}${currentSelectedSeries.backdrop_path}` : 'logos/fav/icon-detailed.svg');

            const epTitle = ep.name || `Episódio ${ep.episode_number}`;
            const epDuration = ep.runtime ? `${ep.runtime} min` : '';

            card.innerHTML = `
                <div class="ep-thumbnail-box">
                    <img class="ep-thumbnail-img" src="${stillUrl}" alt="${epTitle}" loading="lazy" onerror="this.src='logos/fav/icon-detailed.svg'">
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
                    </div>
                    <p class="ep-overview">${ep.overview || "Sem descrição disponível."}</p>
                </div>
            `;

            const playAction = () => {
                playSeriesEpisode(currentSelectedSeries, seasonNumber, ep.episode_number, ep);
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

    // --- Continuous Absolute Episode Navigation (Accurately Mapped to TMDB Seasons) ---
    function mapAbsoluteEpisodeToSeason(seasons, absoluteEp) {
        if (!seasons || !Array.isArray(seasons) || seasons.length === 0) {
            return { season: 1, episode: absoluteEp };
        }

        // Filter valid broadcast seasons (ignore specials season 0)
        const regularSeasons = seasons
            .filter(s => s.season_number > 0 && typeof s.episode_count === 'number' && s.episode_count > 0)
            .sort((a, b) => a.season_number - b.season_number);

        if (regularSeasons.length === 0) {
            return { season: 1, episode: absoluteEp };
        }

        let accumulated = 0;
        for (const s of regularSeasons) {
            if (accumulated + s.episode_count >= absoluteEp) {
                // In continuous anime providers (One Piece, Naruto, etc.), servers expect the absolute episode number paired with the season
                return {
                    season: s.season_number,
                    episode: absoluteEp,
                    seasonName: s.name || `Temporada ${s.season_number}`
                };
            }
            accumulated += s.episode_count;
        }

        // If absoluteEp exceeds total cumulative count, map to the last season with the absolute number
        const lastSeason = regularSeasons[regularSeasons.length - 1];
        return {
            season: lastSeason.season_number,
            episode: absoluteEp,
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
        const fragment = document.createDocumentFragment();

        for (let epNum = startEp; epNum <= endEp; epNum++) {
            const card = document.createElement("div");
            card.className = "series-ep-card";
            card.tabIndex = 0;

            const mapped = mapAbsoluteEpisodeToSeason(seasons, epNum);

            const isCurrentPlaying = (activeSeriesPlaying.show && activeSeriesPlaying.show.id === currentSelectedSeries.id &&
                                      activeSeriesPlaying.seasonNumber === mapped.season &&
                                      activeSeriesPlaying.episodeNumber === mapped.episode);
            if (isCurrentPlaying) card.classList.add("is-active-playing");

            const stillUrl = currentSelectedSeries.backdrop_path
                ? `${TMDB_IMG_W500}${currentSelectedSeries.backdrop_path}`
                : 'logos/fav/icon-detailed.svg';

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
                        <span>Reproduzir ▶</span>
                    </div>
                </div>
            `;

            const currentEpNum = epNum;
            const playAction = () => {
                const targetMapped = mapAbsoluteEpisodeToSeason(seasons, currentEpNum);
                playSeriesEpisode(currentSelectedSeries, targetMapped.season, currentEpNum, { name: `Episódio ${currentEpNum}` });
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
    }

    function goToEpisodeByAbsoluteNumber(epNumber) {
        if (!currentSelectedSeries) return;
        const seasons = (currentSeriesDetails && currentSeriesDetails.seasons) ? currentSeriesDetails.seasons : [];
        const mapped = mapAbsoluteEpisodeToSeason(seasons, epNumber);
        playSeriesEpisode(currentSelectedSeries, mapped.season, epNumber, { name: `Episódio ${epNumber}` });
        showToast(`Carregando Episódio ${epNumber} (T${mapped.season}:E${epNumber})...`);
    }

    // --- 6. Series Video Player Controller ---
    function playSeriesEpisode(showItem, seasonNumber, episodeNumber, epData = null) {
        if (!showItem) return;

        activeSeriesPlaying.show = showItem;
        activeSeriesPlaying.seasonNumber = Number(seasonNumber);
        activeSeriesPlaying.episodeNumber = Number(episodeNumber);
        activeSeriesPlaying.episodeData = epData;

        // UI: Hide details modal and display the Dedicated Theater View
        const detailsModal = document.getElementById("series-modal");
        const theaterView = document.getElementById("series-player-view");
        const currentEpTitle = document.getElementById("series-player-current-ep");
        const iframe = document.getElementById("series-modal-iframe");
        const btnPrev = document.getElementById("btn-series-prev-ep");

        if (detailsModal) detailsModal.classList.add("hidden");
        if (theaterView) theaterView.classList.remove("hidden");
        document.body.style.overflow = "hidden";

        const showName = showItem.name || showItem.title || 'Série';
        const epName = (epData && epData.name) ? ` – ${epData.name}` : '';
        if (currentEpTitle) {
            currentEpTitle.textContent = `${showName} • T${seasonNumber}:E${episodeNumber}${epName}`;
        }

        // Build embed URL with active server
        const serverDef = SERIES_SERVERS[activeSeriesPlaying.server] || SERIES_SERVERS.mgeb;
        const embedUrl = serverDef.buildUrl(showItem.id, seasonNumber, episodeNumber);
        
        const seriesLoader = document.getElementById("series-theater-loader");
        if (seriesLoader) seriesLoader.classList.remove("hidden");

        // Safe stream loading with guaranteed unbuffering
        if (iframe) {
            iframe.src = "about:blank";
            setTimeout(() => {
                iframe.src = embedUrl;
            }, 60);

            iframe.onload = () => {
                if (iframe.src && !iframe.src.endsWith("about:blank")) {
                    if (seriesLoader) seriesLoader.classList.add("hidden");
                }
            };
            setTimeout(() => {
                if (seriesLoader) seriesLoader.classList.add("hidden");
            }, 3000);
        }

        // Sync active server pill in bottom bar
        document.querySelectorAll("#series-server-pills .btn-series-server-pill").forEach(p => {
            p.classList.toggle("active", p.dataset.server === activeSeriesPlaying.server);
        });

        // Update Prev / Next buttons state
        if (btnPrev) {
            btnPrev.disabled = (seasonNumber === 1 && episodeNumber === 1);
        }

        // Save watch history immediately
        saveStoredWatchProgress(showItem, seasonNumber, episodeNumber, epData ? epData.name : `Episódio ${episodeNumber}`);

        // Update active highlight in current episode grid
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
                <span>▶</span>
            `;
            item.addEventListener("click", () => {
                playSeriesEpisode(activeSeriesPlaying.show, activeSeriesPlaying.seasonNumber, ep.episode_number, ep);
                const drawer = document.getElementById("series-player-drawer");
                if (drawer) drawer.classList.add("hidden");
            });
            drawerList.appendChild(item);
        });
    }

    function stopSeriesPlayer() {
        const theaterView = document.getElementById("series-player-view");
        const iframe = document.getElementById("series-modal-iframe");
        const seriesLoader = document.getElementById("series-theater-loader");
        const drawer = document.getElementById("series-player-drawer");

        if (iframe) iframe.src = "";
        if (seriesLoader) seriesLoader.classList.add("hidden");
        if (theaterView) theaterView.classList.add("hidden");
        if (drawer) drawer.classList.add("hidden");

        // Reopen details modal so user returns directly to the episode list
        const detailsModal = document.getElementById("series-modal");
        if (detailsModal && currentSelectedSeries) {
            detailsModal.classList.remove("hidden");
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
    }

    function closeSeriesModal() {
        const modal = document.getElementById("series-modal");
        const theaterView = document.getElementById("series-player-view");
        const iframe = document.getElementById("series-modal-iframe");

        if (iframe) iframe.src = "";
        if (theaterView) theaterView.classList.add("hidden");
        if (modal) modal.classList.add("hidden");

        document.body.style.overflow = "";
        const quickSearchInput = document.getElementById("series-quick-ep-search");
        if (quickSearchInput) quickSearchInput.value = "";
        currentSelectedSeries = null;
        currentSeriesDetails = null;
    }
    function setupTvRemoteNavigation() {
        function getFocusableElements() {
            const selector = [
                '#floating-nav-capsule .nav-capsule-item',
                '.home-portal-card',
                '.home-utility-card',
                '.continue-card',
                '#movies-search-input',
                '#series-search-input',
                '#animes-search-input',
                '#btn-open-movie-explore',
                '#btn-explore-back',
                '#explore-search-input',
                '#btn-explore-sort-dropdown',
                '.sort-dropdown-item',
                '.explore-chip',
                '#btn-hero-watch',
                '#btn-series-hero-watch',
                '#btn-animes-hero-watch',
                '#movies-category-pills .movie-pill',
                '#series-category-pills .movie-pill',
                '#animes-category-pills .movie-pill',
                '.movie-poster-card',
                '#btn-close-movie-modal',
                '#btn-close-series-modal',
                '.btn-movie-server',
                '.btn-series-server-pill',
                '.series-ep-card',
                '.btn-mode-switch',
                '#series-season-select',
                '#btn-series-prev-ep',
                '#btn-series-next-ep',
                '#btn-toggle-drawer',
                '.chunk-pill',
                '.btn-player-action-mini',
                '.btn-page-number',
                '.btn-pagination-nav',
                '#filter-pills .pill',
                '#quick-grid .quick-card',
                '#btn-change-team',
                '#btn-unselected-choose',
                '#vasco-matches-grid .broadcast-pill.playable',
                '#channels-list .channel-btn',
                '#channels-list .category-header',
                '.btn-server-option',
                '.btn-player-action',
                '#search-input',
                '#brand-home',
                '#btn-close-team-modal',
                '#team-search-input',
                '.team-select-card'
            ].join(', ');

            return Array.from(document.querySelectorAll(selector)).filter(el => {
                const rect = el.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden' && window.getComputedStyle(el).display !== 'none';
            });
        }

        function findBestDirectionalCandidate(currentEl, direction) {
            const currentRect = currentEl.getBoundingClientRect();
            const currentCenter = {
                x: currentRect.left + currentRect.width / 2,
                y: currentRect.top + currentRect.height / 2
            };

            const candidates = getFocusableElements().filter(el => el !== currentEl);
            let bestCandidate = null;
            let minDistance = Infinity;

            candidates.forEach(cand => {
                const rect = cand.getBoundingClientRect();
                const center = {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                };

                let isEligible = false;
                let primaryDist = 0;
                let secondaryDist = 0;

                if (direction === 'right') {
                    if (rect.left >= currentRect.left + 5) {
                        isEligible = true;
                        primaryDist = rect.left - currentRect.right;
                        secondaryDist = Math.abs(center.y - currentCenter.y);
                    }
                } else if (direction === 'left') {
                    if (rect.right <= currentRect.right - 5) {
                        isEligible = true;
                        primaryDist = currentRect.left - rect.right;
                        secondaryDist = Math.abs(center.y - currentCenter.y);
                    }
                } else if (direction === 'down') {
                    if (rect.top >= currentRect.top + 5) {
                        isEligible = true;
                        primaryDist = rect.top - currentRect.bottom;
                        secondaryDist = Math.abs(center.x - currentCenter.x);
                    }
                } else if (direction === 'up') {
                    if (rect.bottom <= currentRect.bottom - 5) {
                        isEligible = true;
                        primaryDist = currentRect.top - rect.bottom;
                        secondaryDist = Math.abs(center.x - currentCenter.x);
                    }
                }

                if (isEligible) {
                    const totalDistance = Math.max(0, primaryDist) + secondaryDist * 2.2;
                    if (totalDistance < minDistance) {
                        minDistance = totalDistance;
                        bestCandidate = cand;
                    }
                }
            });

            return bestCandidate;
        }

        window.addEventListener('keydown', (e) => {
            const key = e.key;
            const code = e.keyCode;

            // If user is actively typing in an input or textarea, preserve all native editing (Backspace, Delete, arrows, typing)
            const isTyping = document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');
            if (isTyping) {
                if (key === 'Escape') {
                    document.activeElement.blur();
                }
                return;
            }

            // Handle OK / Enter / Select keys (Smart TV OK, Remote Select, Keyboard Enter)
            const isEnterKey = key === 'Enter' || code === 13 || key === 'Select' || code === 10001;
            if (isEnterKey) {
                const el = document.activeElement;
                if (el && el !== document.body && typeof el.click === 'function') {
                    e.preventDefault();
                    el.click();
                    return;
                }
            }

            // Handle Back / Return keys (Samsung 10009, webOS 461, Android 4, Esc 27, Backspace 8)
            const isBackKey = key === 'Escape' || key === 'Backspace' || code === 27 || code === 8 || code === 10009 || code === 461 || code === 4;

            if (isBackKey) {
                // If dedicated episode theater player is open, back key closes theater and returns to episode list
                const theaterView = document.getElementById("series-player-view");
                if (theaterView && !theaterView.classList.contains("hidden")) {
                    e.preventDefault();
                    stopSeriesPlayer();
                    return;
                }

                // If series modal is open, back key closes it
                const seriesModal = document.getElementById("series-modal");
                if (seriesModal && !seriesModal.classList.contains("hidden")) {
                    e.preventDefault();
                    closeSeriesModal();
                    return;
                }

                // If movie modal is open, back key closes it
                const movieModal = document.getElementById("movie-modal");
                if (movieModal && !movieModal.classList.contains("hidden")) {
                    e.preventDefault();
                    closeMovieDetailsModal();
                    return;
                }

                // If in series or animes view, back key returns to home or TV
                if (currentAppView === 'series' || currentAppView === 'animes' || currentAppView === 'movies') {
                    e.preventDefault();
                    switchAppView('home');
                    return;
                }

                if (activeChannel) {
                    e.preventDefault();
                    renderHomeView();
                    setTimeout(() => {
                        const firstCard = document.querySelector('#quick-grid .quick-card');
                        if (firstCard) firstCard.focus();
                    }, 60);
                    return;
                }

                if (sidebar.classList.contains('open')) {
                    e.preventDefault();
                    closeMobileMenu();
                    return;
                }
            }

            const directions = {
                ArrowUp: 'up',
                ArrowDown: 'down',
                ArrowLeft: 'left',
                ArrowRight: 'right',
                Up: 'up',
                Down: 'down',
                Left: 'left',
                Right: 'right'
            };

            const dir = directions[key];
            if (dir) {
                const currentEl = document.activeElement;
                const focusables = getFocusableElements();
                if (focusables.length === 0) return;

                if (!currentEl || currentEl === document.body || !focusables.includes(currentEl)) {
                    e.preventDefault();
                    if (currentAppView === 'movies') {
                        const defaultMovieEl = document.getElementById('btn-hero-watch') || document.querySelector('.movie-poster-card') || focusables[0];
                        if (defaultMovieEl) defaultMovieEl.focus();
                    } else if (activeChannel) {
                        const defaultPlayerBtn = document.querySelector('.btn-server-option.active') || document.querySelector('.btn-server-option') || document.getElementById('btn-fullscreen-player');
                        if (defaultPlayerBtn) defaultPlayerBtn.focus();
                        else focusables[0].focus();
                    } else {
                        const defaultHomeEl = document.querySelector('.pill.active') || focusables[0];
                        if (defaultHomeEl) defaultHomeEl.focus();
                    }
                    return;
                }

                const nextEl = findBestDirectionalCandidate(currentEl, dir);
                if (nextEl) {
                    e.preventDefault();
                    nextEl.focus();
                    nextEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                }
            }
        });
    }

    // --- Initialize ---
    setupSeriesModalHandlers();
    initApp();
    setupSpaNavigation();
    setupTvRemoteNavigation();
    checkAdblockNoticeStatus();
});


