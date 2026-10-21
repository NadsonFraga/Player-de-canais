/**
 * TVZINHA ONLINE - Five stars with halves (a score from 1 to 10, the Trakt and Letterboxd scale).
 * Used by the title page (Avaliar) and by the "Gostou? Avalie" card at the end of a movie or a series.
 *
 *   const stars = createRateStars({ value: 7, onPick: v => ..., onPreview: v => ... });
 *   container.appendChild(stars.element); stars.setValue(8);
 *
 * Each star has two invisible halves (buttons), so a mouse, a finger and the TV remote all pick half stars.
 */

/** 1 to 10 shown as stars with halves: 7 -> "3,5". */
export function formatStars(value) {
    return (Number(value) / 2).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}

export function starSvg(filled, size = 16) {
    return `<svg class="star-svg" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><polygon points="12 2.5 14.9 8.6 21.5 9.4 16.6 13.9 17.9 20.5 12 17.2 6.1 20.5 7.4 13.9 2.5 9.4 9.1 8.6"></polygon></svg>`;
}

export function createRateStars({ value = 0, onPick = null, onPreview = null } = {}) {
    let current = Number(value) || 0;
    const element = document.createElement('div');
    element.className = 'rate-stars';
    element.setAttribute('role', 'group');
    element.setAttribute('aria-label', 'Nota de meia a cinco estrelas');
    for (let star = 1; star <= 5; star++) {
        const wrap = document.createElement('span');
        wrap.className = 'rate-star';
        wrap.dataset.star = String(star);
        wrap.innerHTML = `
            <span class="rate-star-outline">${starSvg(false)}</span>
            <span class="rate-star-fill">${starSvg(true)}</span>
            <button type="button" class="rate-star-half left" data-value="${star * 2 - 1}" aria-label="Nota ${formatStars(star * 2 - 1)}"></button>
            <button type="button" class="rate-star-half right" data-value="${star * 2}" aria-label="Nota ${formatStars(star * 2)}"></button>`;
        element.appendChild(wrap);
    }

    const paint = (v) => {
        element.querySelectorAll('.rate-star').forEach(wrap => {
            const star = Number(wrap.dataset.star);
            const fill = v >= star * 2 ? 100 : v === star * 2 - 1 ? 50 : 0;
            wrap.style.setProperty('--fill', `${fill}%`);
        });
        if (typeof onPreview === 'function') onPreview(v);
    };
    const halfOf = (e) => e.target.closest && e.target.closest('.rate-star-half');

    element.addEventListener('click', (e) => {
        const half = halfOf(e);
        if (!half) return;
        e.stopPropagation();
        current = Number(half.dataset.value);
        paint(current);
        if (typeof onPick === 'function') onPick(current);
    });
    element.addEventListener('mouseover', (e) => {
        const half = halfOf(e);
        if (half) paint(Number(half.dataset.value));
    });
    element.addEventListener('focusin', (e) => {
        const half = halfOf(e);
        if (half) paint(Number(half.dataset.value));
    });
    element.addEventListener('mouseleave', () => paint(current));
    element.addEventListener('focusout', (e) => {
        if (!element.contains(e.relatedTarget)) paint(current);
    });
    paint(current);

    return {
        element,
        setValue(v) {
            current = Number(v) || 0;
            paint(current);
        },
        /** Focus on the current score, or on 3 stars when there is none. */
        focus() {
            element.querySelector(`.rate-star-half[data-value="${current || 6}"]`)?.focus({ preventScroll: true });
        }
    };
}
