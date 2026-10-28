/**
 * TVZINHA ONLINE - Vector Flag Icons & Language Identifiers
 * Standardized SVG flags from open-source flag-icons (MIT) for subtitle menus.
 * Strictly complies with Zero Emojis Red Line.
 */

export const FLAG_SVGS = {
    // Brazil (4:3 ratio)
    br: `<svg class="tvz-flag-svg" viewBox="0 0 640 480" width="18" height="13.5" aria-hidden="true">
        <path fill="#009c3b" d="M0 0h640v480H0z"/>
        <path fill="#ffdf00" d="m320 40 260 200-260 200L60 240z"/>
        <circle cx="320" cy="240" r="120" fill="#002776"/>
        <path fill="#fff" d="M200 245c40-30 140-50 240-5 5 10-230 40-240 5z"/>
    </svg>`,

    // United States (4:3 ratio)
    us: `<svg class="tvz-flag-svg" viewBox="0 0 640 480" width="18" height="13.5" aria-hidden="true">
        <path fill="#bd3d44" d="M0 0h640v480H0z"/>
        <path stroke="#fff" stroke-width="37" d="M0 55h640M0 129h640M0 203h640M0 277h640M0 351h640M0 425h640"/>
        <path fill="#192f5d" d="M0 0h260v260H0z"/>
        <circle cx="130" cy="130" r="100" fill="none" stroke="#fff" stroke-width="15" stroke-dasharray="10 18"/>
    </svg>`,

    // Portugal (4:3 ratio)
    pt: `<svg class="tvz-flag-svg" viewBox="0 0 640 480" width="18" height="13.5" aria-hidden="true">
        <path fill="#ff0000" d="M0 0h640v480H0z"/>
        <path fill="#006600" d="M0 0h256v480H0z"/>
        <circle cx="256" cy="240" r="80" fill="#ffcc00"/>
        <circle cx="256" cy="240" r="60" fill="#ffffff" stroke="#003399" stroke-width="8"/>
    </svg>`,

    // Spain (4:3 ratio)
    es: `<svg class="tvz-flag-svg" viewBox="0 0 640 480" width="18" height="13.5" aria-hidden="true">
        <path fill="#c60b1e" d="M0 0h640v480H0z"/>
        <path fill="#ffc400" d="M0 120h640v240H0z"/>
        <rect x="120" y="180" width="60" height="90" rx="10" fill="#c60b1e"/>
    </svg>`,

    // France (4:3 ratio)
    fr: `<svg class="tvz-flag-svg" viewBox="0 0 640 480" width="18" height="13.5" aria-hidden="true">
        <path fill="#002395" d="M0 0h214v480H0z"/>
        <path fill="#fff" d="M213 0h214v480H213z"/>
        <path fill="#ed2939" d="M426 0h214v480H426z"/>
    </svg>`,

    // Japan (4:3 ratio)
    ja: `<svg class="tvz-flag-svg" viewBox="0 0 640 480" width="18" height="13.5" aria-hidden="true">
        <path fill="#fff" d="M0 0h640v480H0z"/>
        <circle cx="320" cy="240" r="144" fill="#bc002d"/>
    </svg>`,

    // Fallback: Globe Icon for other languages
    globe: `<svg class="tvz-flag-svg tvz-globe-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>`
};

/**
 * Returns the SVG string for a given language code or flag key.
 */
export function getFlagSvg(code) {
    if (!code) return FLAG_SVGS.globe;
    const clean = String(code).toLowerCase().replace(/[^a-z]/g, '');
    if (clean === 'pob' || clean === 'ptbr' || clean === 'br') return FLAG_SVGS.br;
    if (clean === 'por' || clean === 'pt' || clean === 'ptpt') return FLAG_SVGS.pt;
    if (clean === 'eng' || clean === 'en' || clean === 'enus' || clean === 'us') return FLAG_SVGS.us;
    if (clean === 'spa' || clean === 'es') return FLAG_SVGS.es;
    if (clean === 'fre' || clean === 'fra' || clean === 'fr') return FLAG_SVGS.fr;
    if (clean === 'jpn' || clean === 'ja') return FLAG_SVGS.ja;
    return FLAG_SVGS.globe;
}

/**
 * Sanitizes subtitle text, preserving only harmless formatting tags (i, b, u).
 */
export function cleanVtt(text) {
    if (!text) return '';
    return text.split('\n').map(line => {
        if (line.includes('-->')) return line;
        return line
            .replace(/<\/?[a-zA-Z][^<>]*>/g, tag => (/^<\/?[ibu]>$/i.test(tag) ? tag.toLowerCase() : ''))
            .replace(/<(?!\/?[ibu]>)/g, '&lt;')
            .replace(/(?<!<[ibu])(?<!<\/[ibu])>/g, '&gt;');
    }).join('\n');
}

/**
 * Converts SubRip (.srt) subtitle text to standard WebVTT format and sanitizes tags.
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

