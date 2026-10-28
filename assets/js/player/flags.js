/**
 * TVZINHA ONLINE - Vector Flag Icons & Language Identifiers
 * Standardized SVG flags from open-source flag-icons (MIT) for subtitle menus.
 * Strictly complies with Zero Emojis Red Line.
 * All fills and strokes use inline styles with !important to prevent Artplayer
 * from forcing its white font color on flag elements.
 */

export const FLAG_SVGS = {
    // Brazil (4:3 ratio)
    br: `<svg class="tvz-flag-svg" viewBox="0 0 640 480" width="20" height="15" aria-hidden="true">
        <path style="fill: #009c3b !important;" d="M0 0h640v480H0z"/>
        <path style="fill: #ffdf00 !important;" d="m320 40 260 200-260 200L60 240z"/>
        <circle cx="320" cy="240" r="120" style="fill: #002776 !important;"/>
        <path style="fill: #ffffff !important;" d="M200 245c40-30 140-50 240-5 5 10-230 40-240 5z"/>
    </svg>`,

    // United States / English (4:3 ratio)
    us: `<svg class="tvz-flag-svg" viewBox="0 0 640 480" width="20" height="15" aria-hidden="true">
        <path style="fill: #bd3d44 !important;" d="M0 0h640v480H0z"/>
        <path style="stroke: #ffffff !important; stroke-width: 37px;" d="M0 55h640M0 129h640M0 203h640M0 277h640M0 351h640M0 425h640"/>
        <path style="fill: #192f5d !important;" d="M0 0h260v260H0z"/>
        <circle cx="130" cy="130" r="100" style="fill: none !important; stroke: #ffffff !important; stroke-width: 15px; stroke-dasharray: 10 18;"/>
    </svg>`,

    // Portugal (4:3 ratio)
    pt: `<svg class="tvz-flag-svg" viewBox="0 0 640 480" width="20" height="15" aria-hidden="true">
        <path style="fill: #ff0000 !important;" d="M0 0h640v480H0z"/>
        <path style="fill: #006600 !important;" d="M0 0h256v480H0z"/>
        <circle cx="256" cy="240" r="80" style="fill: #ffcc00 !important;"/>
        <circle cx="256" cy="240" r="60" style="fill: #ffffff !important; stroke: #003399 !important; stroke-width: 8px;"/>
    </svg>`,

    // Spain (4:3 ratio)
    es: `<svg class="tvz-flag-svg" viewBox="0 0 640 480" width="20" height="15" aria-hidden="true">
        <path style="fill: #c60b1e !important;" d="M0 0h640v480H0z"/>
        <path style="fill: #ffc400 !important;" d="M0 120h640v240H0z"/>
        <rect x="120" y="180" width="60" height="90" rx="10" style="fill: #c60b1e !important;"/>
    </svg>`,

    // France (4:3 ratio)
    fr: `<svg class="tvz-flag-svg" viewBox="0 0 640 480" width="20" height="15" aria-hidden="true">
        <path style="fill: #002395 !important;" d="M0 0h214v480H0z"/>
        <path style="fill: #ffffff !important;" d="M213 0h214v480H213z"/>
        <path style="fill: #ed2939 !important;" d="M426 0h214v480H426z"/>
    </svg>`,

    // Italy (4:3 ratio)
    it: `<svg class="tvz-flag-svg" viewBox="0 0 640 480" width="20" height="15" aria-hidden="true">
        <path style="fill: #009246 !important;" d="M0 0h213.3v480H0z"/>
        <path style="fill: #ffffff !important;" d="M213.3 0h213.4v480H213.3z"/>
        <path style="fill: #ce2b37 !important;" d="M426.7 0H640v480H426.7z"/>
    </svg>`,

    // Germany (4:3 ratio)
    de: `<svg class="tvz-flag-svg" viewBox="0 0 640 480" width="20" height="15" aria-hidden="true">
        <path style="fill: #000000 !important;" d="M0 0h640v160H0z"/>
        <path style="fill: #dd0000 !important;" d="M0 160h640v160H0z"/>
        <path style="fill: #ffce00 !important;" d="M0 320h640v160H0z"/>
    </svg>`,

    // Japan (4:3 ratio)
    ja: `<svg class="tvz-flag-svg" viewBox="0 0 640 480" width="20" height="15" aria-hidden="true">
        <path style="fill: #ffffff !important;" d="M0 0h640v480H0z"/>
        <circle cx="320" cy="240" r="144" style="fill: #bc002d !important;"/>
    </svg>`,

    // South Korea (4:3 ratio)
    ko: `<svg class="tvz-flag-svg" viewBox="0 0 640 480" width="20" height="15" aria-hidden="true">
        <path style="fill: #ffffff !important;" d="M0 0h640v480H0z"/>
        <circle cx="320" cy="240" r="120" style="fill: #cd2e3a !important;"/>
        <path style="fill: #0047a0 !important;" d="M320 120a60 60 0 0 0 0 120 60 60 0 0 1 0 120 120 120 0 0 1 0-240z"/>
    </svg>`,

    // China (4:3 ratio)
    zh: `<svg class="tvz-flag-svg" viewBox="0 0 640 480" width="20" height="15" aria-hidden="true">
        <path style="fill: #de2910 !important;" d="M0 0h640v480H0z"/>
        <polygon style="fill: #ffde00 !important;" points="120,40 144,115 220,115 158,160 182,235 120,190 58,235 82,160 20,115 96,115"/>
    </svg>`,

    // Russia (4:3 ratio)
    ru: `<svg class="tvz-flag-svg" viewBox="0 0 640 480" width="20" height="15" aria-hidden="true">
        <path style="fill: #ffffff !important;" d="M0 0h640v160H0z"/>
        <path style="fill: #0039a6 !important;" d="M0 160h640v160H0z"/>
        <path style="fill: #d52b1e !important;" d="M0 320h640v160H0z"/>
    </svg>`,

    // Poland (4:3 ratio)
    pl: `<svg class="tvz-flag-svg" viewBox="0 0 640 480" width="20" height="15" aria-hidden="true">
        <path style="fill: #ffffff !important;" d="M0 0h640v240H0z"/>
        <path style="fill: #dc143c !important;" d="M0 240h640v240H0z"/>
    </svg>`,

    // Indonesia (4:3 ratio)
    id: `<svg class="tvz-flag-svg" viewBox="0 0 640 480" width="20" height="15" aria-hidden="true">
        <path style="fill: #ce1126 !important;" d="M0 0h640v240H0z"/>
        <path style="fill: #ffffff !important;" d="M0 240h640v240H0z"/>
    </svg>`,

    // Arabic / Saudi Arabia (4:3 ratio)
    ar: `<svg class="tvz-flag-svg" viewBox="0 0 640 480" width="20" height="15" aria-hidden="true">
        <path style="fill: #007a3d !important;" d="M0 0h640v480H0z"/>
        <path style="fill: #ffffff !important;" d="M120 220h400v40H120z"/>
    </svg>`,

    // Serbia (4:3 ratio)
    sr: `<svg class="tvz-flag-svg" viewBox="0 0 640 480" width="20" height="15" aria-hidden="true">
        <path style="fill: #c6363c !important;" d="M0 0h640v160H0z"/>
        <path style="fill: #0c4076 !important;" d="M0 160h640v160H0z"/>
        <path style="fill: #ffffff !important;" d="M0 320h640v160H0z"/>
    </svg>`,

    // Turkey (4:3 ratio)
    tr: `<svg class="tvz-flag-svg" viewBox="0 0 640 480" width="20" height="15" aria-hidden="true">
        <path style="fill: #e30a17 !important;" d="M0 0h640v480H0z"/>
        <circle cx="260" cy="240" r="120" style="fill: #ffffff !important;"/>
        <circle cx="290" cy="240" r="96" style="fill: #e30a17 !important;"/>
        <polygon style="fill: #ffffff !important;" points="380,240 420,252 404,215 404,265 420,228"/>
    </svg>`,

    // Vietnam (4:3 ratio)
    vi: `<svg class="tvz-flag-svg" viewBox="0 0 640 480" width="20" height="15" aria-hidden="true">
        <path style="fill: #da251d !important;" d="M0 0h640v480H0z"/>
        <polygon style="fill: #ffff00 !important;" points="320,120 355,230 470,230 377,298 412,408 320,340 228,408 263,298 170,230 285,230"/>
    </svg>`,

    // Romania (4:3 ratio)
    ro: `<svg class="tvz-flag-svg" viewBox="0 0 640 480" width="20" height="15" aria-hidden="true">
        <path style="fill: #002b7f !important;" d="M0 0h213.3v480H0z"/>
        <path style="fill: #fcd116 !important;" d="M213.3 0h213.4v480H213.3z"/>
        <path style="fill: #ce1126 !important;" d="M426.7 0H640v480H426.7z"/>
    </svg>`,

    // Netherlands (4:3 ratio)
    nl: `<svg class="tvz-flag-svg" viewBox="0 0 640 480" width="20" height="15" aria-hidden="true">
        <path style="fill: #ae1c28 !important;" d="M0 0h640v160H0z"/>
        <path style="fill: #ffffff !important;" d="M0 160h640v160H0z"/>
        <path style="fill: #21468b !important;" d="M0 320h640v160H0z"/>
    </svg>`,

    // Sweden (4:3 ratio)
    sv: `<svg class="tvz-flag-svg" viewBox="0 0 640 480" width="20" height="15" aria-hidden="true">
        <path style="fill: #006aa7 !important;" d="M0 0h640v480H0z"/>
        <path style="fill: #fecc00 !important;" d="M0 200h640v80H0zM180 0h80v480h-80z"/>
    </svg>`,

    // Global / Other
    globe: `<svg class="tvz-flag-svg" viewBox="0 0 24 24" width="20" height="15" aria-hidden="true">
        <circle cx="12" cy="12" r="10" style="fill: none !important; stroke: #94a3b8 !important; stroke-width: 2px;"/>
        <line x1="2" y1="12" x2="22" y2="12" style="stroke: #94a3b8 !important; stroke-width: 2px;"/>
        <path style="fill: none !important; stroke: #94a3b8 !important; stroke-width: 2px;" d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>`
};

/**
 * Returns the SVG string for a given language code or flag key.
 */
export function getFlagSvg(lang) {
    if (!lang) return FLAG_SVGS.globe;
    const l = String(lang).toLowerCase().replace('_', '-');
    if (l === 'pt-br' || l === 'pob' || l === 'br') return FLAG_SVGS.br;
    if (l === 'pt' || l === 'por') return FLAG_SVGS.pt;
    if (l === 'en' || l === 'eng' || l === 'us') return FLAG_SVGS.us;
    if (l === 'es' || l === 'spa' || l === 'spl' || l === 'cat' || l === 'ca') return FLAG_SVGS.es;
    if (l === 'fr' || l === 'fre' || l === 'fra') return FLAG_SVGS.fr;
    if (l === 'it' || l === 'ita') return FLAG_SVGS.it;
    if (l === 'de' || l === 'ger' || l === 'deu') return FLAG_SVGS.de;
    if (l === 'ja' || l === 'jpn' || l === 'jp') return FLAG_SVGS.ja;
    if (l === 'ko' || l === 'kor' || l === 'kr') return FLAG_SVGS.ko;
    if (l === 'zh' || l === 'chi' || l === 'zho' || l === 'zht' || l === 'cn') return FLAG_SVGS.zh;
    if (l === 'ru' || l === 'rus') return FLAG_SVGS.ru;
    if (l === 'pl' || l === 'pol') return FLAG_SVGS.pl;
    if (l === 'id' || l === 'ind') return FLAG_SVGS.id;
    if (l === 'ar' || l === 'ara') return FLAG_SVGS.ar;
    if (l === 'sr' || l === 'srp') return FLAG_SVGS.sr;
    if (l === 'tr' || l === 'tur') return FLAG_SVGS.tr;
    if (l === 'vi' || l === 'vie') return FLAG_SVGS.vi;
    if (l === 'ro' || l === 'ron') return FLAG_SVGS.ro;
    if (l === 'nl' || l === 'nld' || l === 'dut') return FLAG_SVGS.nl;
    if (l === 'sv' || l === 'swe') return FLAG_SVGS.sv;
    return FLAG_SVGS.globe;
}

/**
 * Client-side subtitle sanitization to prevent XSS in VTT cues.
 */
export function cleanVtt(text) {
    if (!text) return 'WEBVTT\n\n';
    return text.split('\n').map(line => {
        if (line.includes('-->')) return line;
        return line
            .replace(/<\/?[a-zA-Z][^<>]*>/g, tag => (/^<\/?[ibu]>$/i.test(tag) ? tag.toLowerCase() : ''))
            .replace(/<(?!\/?[ibu]>)/g, '&lt;')
            .replace(/(?<!<[ibu])(?<!<\/[ibu])>/g, '&gt;');
    }).join('\n');
}

/**
 * Converts SubRip (.srt) subtitle string to standard WebVTT format.
 */
export function srtToVtt(srtText) {
    if (!srtText) return 'WEBVTT\n\n';
    let text = srtText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    if (/^WEBVTT/i.test(text.trim())) {
        return cleanVtt(text);
    }
    text = text.replace(/(\d{1,2}:\d{2}:\d{2}),(\d{3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2 --> $3.$4');
    return 'WEBVTT\n\n' + cleanVtt(text);
}
