/**
 * TVZINHA ONLINE - A confirmation in the site's style ("Sair mesmo assim?"): resolves true or false.
 *
 * Built on first use, over everything (layer 1400). It is a history layer: the phone's Back and Esc answer "no"
 * (historyManager.js presses its "no" button).
 */
import { pushNavLayer, popNavLayer, isHandlingBack } from '../navigation/historyManager.js?v=20261026_1543';
import { escapeHtml } from './sanitize.js?v=20261026_1543';

let pending = null;

function dialog() {
    let el = document.getElementById('confirm-dialog');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'confirm-dialog';
    el.className = 'confirm-dialog hidden';
    el.setAttribute('role', 'alertdialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'confirm-dialog-title');
    el.innerHTML = `
        <div class="account-card confirm-dialog-card">
            <h2 id="confirm-dialog-title" class="account-title"></h2>
            <p id="confirm-dialog-text" class="account-lead"></p>
            <button id="btn-confirm-dialog-yes" class="account-submit" type="button"><span></span></button>
            <button id="btn-confirm-dialog-no" class="account-secondary" type="button"></button>
        </div>`;
    document.body.appendChild(el);
    el.querySelector('#btn-confirm-dialog-yes').addEventListener('click', () => answer(true));
    el.querySelector('#btn-confirm-dialog-no').addEventListener('click', () => answer(false));
    el.addEventListener('click', (e) => {
        if (e.target === el) answer(false);
    });
    el.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            answer(false);
        }
    });
    return el;
}

function answer(value) {
    const el = document.getElementById('confirm-dialog');
    if (!el || !pending) return;
    el.classList.add('hidden');
    const resolve = pending;
    pending = null;
    // The browser's Back already took the history entry
    if (!isHandlingBack()) popNavLayer();
    resolve(value);
}

/** { title, text, confirm, cancel, danger } -> Promise<boolean> */
export function confirmDialog({ title, text = '', confirm = 'Confirmar', cancel = 'Cancelar', danger = false }) {
    if (pending) answer(false);
    const el = dialog();
    el.querySelector('#confirm-dialog-title').innerHTML = escapeHtml(title);
    el.querySelector('#confirm-dialog-text').textContent = text;
    el.querySelector('#confirm-dialog-text').hidden = !text;
    const yes = el.querySelector('#btn-confirm-dialog-yes');
    yes.querySelector('span').textContent = confirm;
    yes.classList.toggle('profile-danger', danger);
    el.querySelector('#btn-confirm-dialog-no').textContent = cancel;
    el.classList.remove('hidden');
    pushNavLayer('confirm');
    el.querySelector('#btn-confirm-dialog-no').focus({ preventScroll: true });
    return new Promise(resolve => {
        pending = resolve;
    });
}
