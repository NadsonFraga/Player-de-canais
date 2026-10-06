/**
 * TVZINHA ONLINE - Monochromatic UI SVGs & Channel Logos Registry
 */

// Monochromatic System Icons
export function getUiSvg(name, size = 16) {
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

// Mapping Channels to Local Image Assets
export const CHANNEL_LOGOS = {
    "globo": "assets/logos/channels/globo.webp",
    "band": "assets/logos/channels/Band.png",
    "sbt": "assets/logos/channels/sbt.png",
    "record": "assets/logos/channels/record.png",
    "sportv 3": "assets/logos/channels/sportv3.png",
    "sportv 2": "assets/logos/channels/sportv2.png",
    "sportv": "assets/logos/channels/sportv.png",
    "premiere": "assets/logos/channels/premiere.png",
    "prime": "assets/logos/channels/amazonprimevideo.png",
    "cazetv": "assets/logos/channels/cazetv.png",
    "disney": "assets/logos/channels/disneyplus.png",
    "max": "assets/logos/channels/max.png",
    "paramount": "assets/logos/channels/paramountplus.png",
    "espn": "assets/logos/channels/espn.png",
    "bandsports": "assets/logos/channels/bandsports.png",
    "combate": "assets/logos/channels/combate.png",
    "xsports": "assets/logos/channels/xsports.png",
    "globonews": "assets/logos/channels/globonews.png",
    "bandnews": "assets/logos/channels/bandnews.png",
    "multishow": "assets/logos/channels/multishow.png",
    "mtv": "assets/logos/channels/mtv.png",
    "cartoonnetwork": "assets/logos/channels/cartoonnetwork.png",
    "cartoonito": "assets/logos/channels/cartoonito.png",
    "discoverykids": "assets/logos/channels/discoverykids.png",
    "gloob": "assets/logos/channels/gloob.png",
    "gloobinho": "assets/logos/channels/gloobinho.png",
    "comedycentral": "assets/logos/channels/comedycentral.png",
    "nickelodeon": "assets/logos/channels/nickelodeon.png",
    "nickjr": "assets/logos/channels/nickjr.png",
    "dreamworks": "assets/logos/channels/dreamworks.png",
    "animalplanet": "assets/logos/channels/animalplanet.png",
    "discoverychannel": "assets/logos/channels/discoverychannel.png",
    "hbo": "assets/logos/channels/hbo.png",
    "hbo2": "assets/logos/channels/hbo2.png",
    "hboplus": "assets/logos/channels/hboplus.png",
    "hbosignature": "assets/logos/channels/hbosignature.png",
    "hbofamily": "assets/logos/channels/hbofamily.png"
};

export function getChannelLogoSrc(channelName) {
    if (!channelName) return null;
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

export function createLogoBadgeHtml(channelName, size = 'sm') {
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
            <span>${(channelName || 'TV').slice(0, 3).toUpperCase()}</span>
        </div>
    `;
}
