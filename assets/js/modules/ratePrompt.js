/**
 * TVZINHA ONLINE - The end of a title: it becomes Assistido, and a small "Gostou? Avalie" card shows in the player
 * (5 stars with halves, or "Agora não"). Movies call it when they reach the credits or the last 5 %; series when the
 * last episode of a finished show does. Only the native players report the time, so embedded servers never ask.
 *
 * The card lives in the player stage (the element that goes fullscreen), outside Artplayer's box, so it shows in
 * fullscreen and keeps its own colors. Asked once per title per visit, and never for a title already rated.
 */
import { escapeHtml } from '../core/sanitize.js?v=20261027_1747';
import { showToast } from '../core/toast.js?v=20261027_1747';
import { getLibraryState, setRating, setWatched } from '../core/library.js?v=20261027_1747';
import { createRateStars, formatStars } from '../core/rateStars.js?v=20261027_1747';

const asked = new Set();

/** The player's progress report says the title is over: credits reached, or almost at the end. */
export function reachedEnd(info) {
    if (!info) return false;
    return Boolean(info.inEnding) || (info.duration > 0 && info.position >= info.duration * 0.95);
}

/** Marks the title as Assistido and asks for a score in `stage` (once per visit, not when already rated). */
export function titleFinished({ kind, item, stage }) {
    if (!item || item.id == null) return;
    const state = getLibraryState(kind, item.id);
    if (!state.watched) setWatched(kind, item, true);
    const key = `${kind === 'movie' ? 'movie' : 'tv'}:${item.id}`;
    if (asked.has(key) || state.rating || !stage) return;
    asked.add(key);
    showPrompt(kind, item, stage);
}

export function closeRatePrompts() {
    document.querySelectorAll('.rate-prompt').forEach(el => el.remove());
}

function showPrompt(kind, item, stage) {
    closeRatePrompts();
    const name = item.title || item.name || 'este título';
    const card = document.createElement('div');
    card.className = 'rate-prompt';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-label', `Avaliar ${name}`);
    card.innerHTML = `
        <p class="rate-prompt-title">Gostou de <strong>${escapeHtml(name)}</strong>?</p>
        <p class="rate-prompt-hint">Dê sua nota de meia a cinco estrelas.</p>
        <div class="rate-prompt-stars"></div>
        <button type="button" class="rate-prompt-skip">Agora não</button>`;
    const stars = createRateStars({
        onPick: (value) => {
            setRating(kind, item, value);
            card.remove();
            showToast(`Nota salva: ${formatStars(value)} de 5 estrelas`);
        },
        onPreview: (value) => {
            const hint = card.querySelector('.rate-prompt-hint');
            if (hint) hint.textContent = value ? `${formatStars(value)} de 5 estrelas` : 'Dê sua nota de meia a cinco estrelas.';
        }
    });
    card.querySelector('.rate-prompt-stars').appendChild(stars.element);
    card.querySelector('.rate-prompt-skip').addEventListener('click', () => card.remove());
    // Clicks on the card stay on the card (the player under it must not pause or seek)
    ['click', 'pointerdown', 'dblclick'].forEach(type => card.addEventListener(type, (e) => e.stopPropagation()));
    stage.appendChild(card);
}

if (typeof window !== 'undefined') {
    window.addEventListener('tvzinha:playerClosed', closeRatePrompts);
    window.addEventListener('tvzinha:teardownMedia', closeRatePrompts);
}
