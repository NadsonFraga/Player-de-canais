/**
 * TVZINHA ONLINE - Configurações: topics on the left (Conta, Perfis, Player, Sincronização, Sobre), the chosen one on
 * the right; phones show the list first and one topic at a time (Back returns to the list).
 *
 * A full-screen page and a history layer, like the account and profile pages. Each topic is drawn from the current
 * state when shown (and again when the account, the profile, the preferences or the sync change), in grouped cards of
 * rows. Guests see Conta (Entrar ou criar conta), Player and Sobre.
 */
import { getAccount, getActiveProfile, changePassword, renewRecoveryCode, passwordRules, passwordStrength, ACCOUNT_EVENT } from '../core/account.js?v=20261021_1129';
import { leaveAccount, deleteAccountHere, syncNow, getSyncStatus, syncStatusText, SYNC_EVENT } from '../core/sync.js?v=20261021_1129';
import { getPlayerPrefs, setPlayerPref, PREFS_EVENT } from '../core/playerPrefs.js?v=20261021_1129';
import { PROFILE_EVENT } from '../core/profileStore.js?v=20261021_1129';
import { avatarSrc } from '../core/avatars.js?v=20261021_1129';
import { confirmDialog } from '../core/confirmDialog.js?v=20261021_1129';
import { showToast } from '../core/toast.js?v=20261021_1129';
import { syncPageLock } from '../core/activity.js?v=20261021_1129';
import { escapeHtml, escapeAttr } from '../core/sanitize.js?v=20261021_1129';
import { pushNavLayer, popNavLayer, isHandlingBack, runNavBatch } from '../navigation/historyManager.js?v=20261021_1129';
import { openLegalSection } from './footer.js?v=20261021_1129';
import { openAccountPage } from './accountPage.js?v=20261021_1129';
import { openProfilePicker } from './profilePage.js?v=20261021_1129';

const SECTIONS = {
    account: 'Conta',
    profiles: 'Perfis',
    player: 'Player',
    sync: 'Sincronização',
    about: 'Sobre'
};
// Only with an account
const SIGNED_IN_ONLY = ['profiles', 'sync'];

const MESSAGES = {
    wrong_password: 'Senha incorreta.',
    password_short: 'A senha nova precisa ter pelo menos 8 caracteres.',
    password_long: 'A senha nova pode ter até 200 caracteres.',
    password_letter: 'A senha nova precisa ter pelo menos uma letra.',
    password_number: 'A senha nova precisa ter pelo menos um número.',
    password_is_nickname: 'A senha nova não pode ser igual ao apelido.',
    not_signed_in: 'Sua sessão terminou. Entre de novo.',
    accounts_unavailable: 'As contas estão fora do ar agora. Tente de novo mais tarde.',
    network: 'Sem conexão com o servidor. Verifique a internet e tente de novo.'
};

const PLAYER_CHOICES = [
    { pref: 'subtitle', title: 'Legenda', sub: 'Usada quando o título tem essa legenda.', options: [[null, 'Automática'], ['pt-BR', 'Português'], ['en', 'Inglês'], ['off', 'Desligada']] },
    { pref: 'quality', title: 'Qualidade', sub: 'Automática escolhe a melhor que a sua conexão aguenta.', options: [['auto', 'Automática'], [1080, '1080p'], [720, '720p'], [480, '480p']] },
    { pref: 'fit', title: 'Tela', sub: 'Preencher corta as bordas para ocupar a tela toda.', options: [['contain', 'Ajustar'], ['cover', 'Preencher']] },
    { pref: 'playbackRate', title: 'Velocidade', sub: 'Velocidade inicial dos vídeos.', options: [[0.75, '0,75x'], [1, 'Normal'], [1.25, '1,25x'], [1.5, '1,5x'], [2, '2x']] }
];

const CHEVRON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>';
const EYE = '<svg class="icon-show" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"></path><circle cx="12" cy="12" r="3"></circle></svg><svg class="icon-hide" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-6.5 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c6.5 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"></path></svg>';

let current = 'account';
// Phones: a topic is open over the list
let detail = false;
// The form open in Conta: 'password' | 'code' | 'delete' | null
let openForm = null;
// A new recovery code on screen (Back waits for "Guardei o código")
let codeShowing = false;
let busy = false;
let openAdblockTips = null;

function page() {
    return document.getElementById('settings-page');
}

export function isSettingsPageOpen() {
    const el = page();
    return Boolean(el) && !el.classList.contains('hidden');
}

function isPhone() {
    return window.matchMedia('(max-width: 768px)').matches;
}

function visibleSections() {
    const signedIn = getAccount().signedIn;
    return Object.keys(SECTIONS).filter(id => signedIn || !SIGNED_IN_ONLY.includes(id));
}

/** Opens Configurações on Conta, or on `section` (on phones: the list, or that topic in full). */
export function openSettingsPage(section = null) {
    const el = page();
    if (!el) return;
    if (!isSettingsPageOpen()) {
        el.classList.remove('hidden', 'is-entering');
        void el.offsetWidth;
        el.classList.add('is-entering');
        syncPageLock();
        pushNavLayer('settings');
    }
    openForm = null;
    codeShowing = false;
    detail = Boolean(section) && isPhone();
    // Always opens on Conta (or the topic asked for), like the settings of phones and TVs
    select(section && SECTIONS[section] ? section : 'account', { focusNav: !section });
}

export function closeSettingsPage({ keepHistory = false } = {}) {
    if (!isSettingsPageOpen()) return;
    page().classList.add('hidden');
    openForm = null;
    codeShowing = false;
    busy = false;
    syncPageLock();
    if (!keepHistory) popNavLayer();
}

function select(section, { focusNav = false, focusPanel = false, animate = true } = {}) {
    if (!visibleSections().includes(section)) section = 'account';
    if (section !== current) {
        openForm = null;
        codeShowing = false;
    }
    current = section;
    const el = page();
    el.classList.toggle('is-detail', detail);
    el.dataset.section = section;
    document.querySelectorAll('#settings-nav .settings-nav-item').forEach(item => {
        const id = item.dataset.settingsSection;
        item.hidden = !visibleSections().includes(id);
        const on = id === section;
        item.classList.toggle('active', on);
        item.setAttribute('aria-selected', String(on));
        item.tabIndex = on ? 0 : -1;
    });
    document.getElementById('settings-title').textContent = isPhone() && detail ? SECTIONS[section] : 'Configurações';
    renderPanel({ animate });
    if (focusNav) document.querySelector('#settings-nav .settings-nav-item.active')?.focus({ preventScroll: true });
    if (focusPanel) {
        const first = document.querySelector('#settings-panel button, #settings-panel input');
        (first || document.getElementById('settings-panel')).focus({ preventScroll: true });
    }
}

// --- Building blocks ---

const group = (title, body, extra = '') => `
    <section class="settings-group ${extra}">
        ${title ? `<h3 class="settings-group-title">${escapeHtml(title)}</h3>` : ''}
        <div class="settings-card">${body}</div>
    </section>`;

const row = ({ title, sub = '', action = '', id = '', extra = '' }) => `
    <div class="settings-row ${extra}"${id ? ` id="${id}"` : ''}>
        <div class="settings-row-text">
            <span class="settings-row-title">${escapeHtml(title)}</span>
            ${sub ? `<span class="settings-row-sub">${escapeHtml(sub)}</span>` : ''}
        </div>
        ${action ? `<div class="settings-row-action">${action}</div>` : ''}
    </div>`;

const linkRow = (title, attrs, sub = '') => `
    <button type="button" class="settings-row settings-row-link" ${attrs}>
        <span class="settings-row-text">
            <span class="settings-row-title">${escapeHtml(title)}</span>
            ${sub ? `<span class="settings-row-sub">${escapeHtml(sub)}</span>` : ''}
        </span>
        <span class="settings-row-chevron">${CHEVRON}</span>
    </button>`;

const button = (label, attrs, kind = '', type = 'button') => `<button type="${type}" class="settings-button ${kind}" ${attrs}><span>${escapeHtml(label)}</span><span class="account-spinner" aria-hidden="true"></span></button>`;

/**
 * A password field. `confirm`: a password typed again to confirm a serious action (trocar senha, código, apagar):
 * marked so the browser and password managers (1Password, LastPass, Bitwarden) do not fill it with the saved password;
 * filled in, anyone at an unlocked computer could change or delete the account without knowing the password.
 */
const passwordField = (id, label, autocomplete, { confirm = false } = {}) => `
    <div class="account-field">
        <label class="account-label" for="${id}">${escapeHtml(label)}</label>
        <div class="account-input-wrap">
            <input id="${id}" name="${confirm ? `confirm-${id}` : id}" class="account-input" type="password" autocomplete="${confirm ? 'new-password' : autocomplete}" maxlength="200"${confirm ? ' data-1p-ignore data-lpignore="true" data-bwignore="true"' : ''}>
            <button type="button" class="account-eye settings-eye" data-eye-for="${id}" aria-label="Mostrar senha" aria-pressed="false">${EYE}</button>
        </div>
    </div>`;

// --- The topics ---

function accountPanel() {
    const { signedIn, account } = getAccount();
    if (!signedIn) {
        return `
            <div class="settings-hero">
                <h2 class="settings-hero-title">Entre ou crie uma conta</h2>
                <p class="settings-hero-text">Com uma conta, sua Coleção, o progresso e os perfis aparecem em qualquer aparelho. Sem e-mail: só um apelido e uma senha.</p>
                <div class="settings-hero-actions">
                    ${button('Entrar', 'data-settings-action="signin"', 'is-primary')}
                    ${button('Criar conta', 'data-settings-action="signup"')}
                </div>
            </div>`;
    }
    const created = account.createdAt ? new Date(account.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '';
    const rules = `
        <ul class="account-rules settings-rules" aria-live="polite">
            <li data-rule="length"><span class="account-rule-mark" aria-hidden="true">${checkSvg()}</span>8 caracteres</li>
            <li data-rule="letter"><span class="account-rule-mark" aria-hidden="true">${checkSvg()}</span>Uma letra</li>
            <li data-rule="number"><span class="account-rule-mark" aria-hidden="true">${checkSvg()}</span>Um número</li>
        </ul>`;
    const passwordForm = openForm === 'password' ? `
        <form class="settings-form" data-form="password" novalidate>
            ${passwordField('settings-current-password', 'Senha atual', 'current-password', { confirm: true })}
            ${passwordField('settings-new-password', 'Senha nova', 'new-password')}
            <div class="account-strength" id="settings-strength" data-level=""><span class="account-strength-bar"><span></span></span><span class="account-strength-label" id="settings-strength-label"></span></div>
            ${rules}
            <p class="account-error settings-error" role="alert"></p>
            <div class="settings-form-actions">
                ${button('Cancelar', 'data-settings-action="cancel-form"')}
                ${button('Salvar senha', 'data-settings-action="save-password"', 'is-primary', 'submit')}
            </div>
        </form>` : '';
    const codeForm = openForm === 'code' ? (codeShowing ? `
        <div class="settings-form" data-form="code-shown">
            <p class="settings-form-lead">Guarde este código: ele aparece só agora, e o anterior deixou de valer.</p>
            <div id="settings-code" class="account-code" aria-live="polite"></div>
            <div class="settings-form-actions">
                ${button('Copiar código', 'data-settings-action="copy-code"')}
                ${button('Guardei o código', 'data-settings-action="code-done"', 'is-primary')}
            </div>
        </div>` : `
        <form class="settings-form" data-form="code" novalidate>
            <p class="settings-form-lead">O código novo substitui o anterior. Confirme com a sua senha.</p>
            ${passwordField('settings-code-password', 'Senha', 'current-password', { confirm: true })}
            <p class="account-error settings-error" role="alert"></p>
            <div class="settings-form-actions">
                ${button('Cancelar', 'data-settings-action="cancel-form"')}
                ${button('Gerar código', 'data-settings-action="make-code"', 'is-primary', 'submit')}
            </div>
        </form>`) : '';
    const deleteForm = openForm === 'delete' ? `
        <form class="settings-form" data-form="delete" novalidate>
            <p class="settings-form-lead">Apaga a conta, os perfis e tudo o que foi sincronizado. Não dá para desfazer. Os dados guardados neste aparelho sem conta continuam aqui.</p>
            ${passwordField('settings-delete-password', 'Senha', 'current-password', { confirm: true })}
            <p class="account-error settings-error" role="alert"></p>
            <div class="settings-form-actions">
                ${button('Cancelar', 'data-settings-action="cancel-form"')}
                ${button('Apagar conta', 'data-settings-action="delete-account"', 'is-danger', 'submit')}
            </div>
        </form>` : '';
    return `
        <div class="settings-identity">
            <span class="settings-identity-name">${escapeHtml(account.nickname)}</span>
            ${created ? `<span class="settings-identity-sub">Conta criada em ${escapeHtml(created)}</span>` : ''}
        </div>
        ${group('Segurança', `
            ${row({ title: 'Senha', sub: 'Ao trocar, os outros aparelhos precisam entrar de novo.', action: openForm === 'password' ? '' : button('Trocar', 'data-settings-action="open-password"') })}
            ${passwordForm}
            ${row({ title: 'Código de recuperação', sub: 'Sem e-mail, é ele que recupera a conta se você esquecer a senha.', action: openForm === 'code' ? '' : button('Gerar novo', 'data-settings-action="open-code"') })}
            ${codeForm}`)}
        ${group('Sessão', row({ title: 'Sair da conta', sub: 'O que mudou é enviado antes; as cópias da conta saem deste aparelho.', action: button('Sair', 'data-settings-action="signout"') }))}
        ${group('Zona de perigo', `
            ${row({ title: 'Apagar conta', sub: 'Remove a conta e todos os dados dela, para sempre.', action: openForm === 'delete' ? '' : button('Apagar', 'data-settings-action="open-delete"', 'is-danger-outline') })}
            ${deleteForm}`, 'is-danger-zone')}`;
}

function checkSvg() {
    return '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
}

function profilesPanel() {
    const { profiles } = getAccount();
    const active = getActiveProfile();
    const rows = profiles.map(p => `
        <div class="settings-row settings-profile-row">
            <img class="settings-profile-avatar" src="${avatarSrc(p.avatar)}" alt="" width="40" height="40" draggable="false">
            <div class="settings-row-text">
                <span class="settings-row-title">${escapeHtml(p.name)}</span>
            </div>
            ${active && active.id === p.id ? '<span class="settings-badge">Em uso</span>' : ''}
        </div>`).join('');
    return `
        ${group(`${profiles.length} de 5 perfis`, rows)}
        <div class="settings-actions-row">
            ${button('Trocar de perfil', 'data-settings-action="switch-profile"')}
            ${button('Gerenciar perfis', 'data-settings-action="manage-profiles"', 'is-primary')}
        </div>
        <p class="settings-note">Cada perfil tem a própria Coleção, o progresso, os canais favoritos e as preferências do player.</p>`;
}

function playerPanel() {
    const prefs = getPlayerPrefs();
    const signedIn = Boolean(getActiveProfile());
    const choices = PLAYER_CHOICES.map(choice => {
        const value = prefs[choice.pref] === undefined ? null : prefs[choice.pref];
        const buttons = choice.options.map(([optionValue, label]) => {
            const on = optionValue === value || (optionValue === null && (value === null || value === undefined));
            return `<button type="button" class="settings-segment${on ? ' active' : ''}" role="radio" aria-checked="${on}" data-pref="${choice.pref}" data-value="${escapeAttr(JSON.stringify(optionValue))}">${escapeHtml(label)}</button>`;
        }).join('');
        return `
            <div class="settings-row settings-row-stacked">
                <div class="settings-row-text">
                    <span class="settings-row-title">${escapeHtml(choice.title)}</span>
                    <span class="settings-row-sub">${escapeHtml(choice.sub)}</span>
                </div>
                <div class="settings-segmented" role="radiogroup" aria-label="${escapeAttr(choice.title)}">${buttons}</div>
            </div>`;
    }).join('');
    return `
        ${group('Ao assistir', choices)}
        <p class="settings-note">${signedIn ? 'Valem para este perfil e vão junto para os outros aparelhos.' : 'Ficam guardadas neste aparelho.'} Mudar uma opção durante o vídeo também muda aqui.</p>`;
}

function syncPanel() {
    const { state, lastSync } = getSyncStatus();
    const when = lastSync ? new Date(lastSync).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'ainda não';
    return `
        ${group('', `
            ${row({ title: syncStatusText(), sub: `Última sincronização: ${when}`, action: button('Sincronizar agora', 'data-settings-action="sync-now"', state === 'syncing' ? 'is-primary is-busy' : 'is-primary'), id: 'settings-sync-row', extra: `is-sync-${state}` })}`)}
        ${group('Quando sincroniza', `
            <ul class="settings-list">
                <li>Ao abrir o site e ao voltar para ele depois de 5 minutos fora.</li>
                <li>30 segundos depois de uma mudança, juntando tudo num envio só.</li>
                <li>Ao fechar ou esconder a página, e ao trocar de perfil.</li>
                <li>Sem internet nada se perde: as mudanças esperam e vão quando a conexão voltar.</li>
            </ul>`)}`;
}

function siteVersion() {
    const main = document.querySelector('script[src*="main.js"]');
    const match = main && /[?&]v=([\w-]+)/.exec(main.getAttribute('src'));
    return match ? match[1] : '';
}

function aboutPanel() {
    return `
        ${group('Informações legais', `
            ${linkRow('Privacidade', 'data-legal="privacy"', 'O que fica guardado e como apagar')}
            ${linkRow('Termos de uso', 'data-legal="terms"')}
            ${linkRow('DMCA e pedidos de remoção', 'data-legal="dmca"')}`)}
        ${group('Ajuda', linkRow('Dicas para bloquear anúncios', 'data-settings-action="adblock"', 'Nos servidores externos'))}
        ${group('Créditos', `
            <p class="settings-credits">Dados de filmes e séries: TMDB. Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.</p>
            <p class="settings-credits">Avatares: Lorelei, de Lisa Wischofsky, e Notionists, de Zoish (CC0, via DiceBear).</p>`)}
        <p class="settings-note">Versão ${escapeHtml(siteVersion())}</p>`;
}

function renderPanel({ animate = false } = {}) {
    const panel = document.getElementById('settings-panel');
    if (!panel) return;
    const draw = { account: accountPanel, profiles: profilesPanel, player: playerPanel, sync: syncPanel, about: aboutPanel }[current];
    panel.innerHTML = `<h2 class="settings-panel-title">${escapeHtml(SECTIONS[current])}</h2>${draw()}`;
    panel.setAttribute('aria-labelledby', `settings-tab-${current}`);
    if (animate) {
        panel.classList.remove('is-switching');
        void panel.offsetWidth;
        panel.classList.add('is-switching');
    }
    if (current === 'account' && openForm === 'password') updatePasswordChecks();
}

function updatePasswordChecks() {
    const input = document.getElementById('settings-new-password');
    if (!input) return;
    const rules = passwordRules(input.value, getAccount().account?.nickname || '');
    document.querySelectorAll('#settings-panel .settings-rules [data-rule]').forEach(item => item.classList.toggle('is-met', Boolean(rules[item.dataset.rule])));
    const strength = passwordStrength(input.value);
    const box = document.getElementById('settings-strength');
    box.dataset.level = strength.level;
    box.style.setProperty('--strength', `${Math.min(100, Math.round((strength.score / 6) * 100))}%`);
    document.getElementById('settings-strength-label').textContent = strength.level === 'forte' ? 'Forte' : strength.level === 'media' ? 'Média' : strength.level === 'fraca' ? 'Fraca' : '';
}

function setFormError(message) {
    const box = document.querySelector('#settings-panel .settings-error');
    if (!box) return;
    box.textContent = message || '';
    if (message) {
        box.classList.remove('is-shaking');
        void box.offsetWidth;
        box.classList.add('is-shaking');
    }
}

function setBusy(on, actionButton) {
    busy = on;
    if (actionButton) {
        actionButton.classList.toggle('is-busy', on);
        actionButton.disabled = on;
    }
}

function messageFor(result) {
    const error = result.json && result.json.error;
    if (error === 'too_many_attempts') {
        const minutes = Math.max(1, Math.ceil((Number(result.json.retryAfter) || 60) / 60));
        return `Muitas tentativas. Tente de novo em ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}.`;
    }
    return MESSAGES[error] || 'Algo deu errado. Tente de novo.';
}

function showForm(name) {
    openForm = name;
    codeShowing = false;
    renderPanel();
    const first = document.querySelector('#settings-panel .settings-form input, #settings-panel .settings-form button');
    if (first) first.focus({ preventScroll: false });
}

// --- Actions ---

async function savePassword(actionButton) {
    const currentPassword = document.getElementById('settings-current-password').value;
    const newPassword = document.getElementById('settings-new-password').value;
    const rules = passwordRules(newPassword, getAccount().account?.nickname || '');
    if (!currentPassword) return setFormError('Digite a senha atual.');
    if (!(rules.length && rules.letter && rules.number && rules.notNickname)) return setFormError('A senha nova ainda não cumpre as regras.');
    setFormError('');
    setBusy(true, actionButton);
    const result = await changePassword(currentPassword, newPassword);
    setBusy(false, actionButton);
    if (result.status !== 200) return setFormError(messageFor(result));
    openForm = null;
    renderPanel();
    showToast('Senha trocada. Os outros aparelhos vão pedir para entrar de novo.');
}

async function makeCode(actionButton) {
    const password = document.getElementById('settings-code-password').value;
    if (!password) return setFormError('Digite a sua senha.');
    setFormError('');
    setBusy(true, actionButton);
    const result = await renewRecoveryCode(password);
    setBusy(false, actionButton);
    if (result.status !== 200) return setFormError(messageFor(result));
    codeShowing = true;
    renderPanel();
    document.getElementById('settings-code').textContent = result.json.recoveryCode || '';
    document.querySelector('[data-settings-action="code-done"]')?.focus({ preventScroll: true });
}

async function copyCode() {
    const code = document.getElementById('settings-code')?.textContent || '';
    try {
        await navigator.clipboard.writeText(code);
        showToast('Código copiado');
    } catch (e) {
        const range = document.createRange();
        range.selectNodeContents(document.getElementById('settings-code'));
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        showToast('Selecionei o código: copie com Ctrl+C ou segurando o dedo.');
    }
}

async function removeAccount(actionButton) {
    const password = document.getElementById('settings-delete-password').value;
    if (!password) return setFormError('Digite a sua senha.');
    const sure = await confirmDialog({
        title: 'Apagar a conta para sempre?',
        text: 'A conta, os perfis e tudo o que foi sincronizado serão apagados agora. Não dá para desfazer.',
        confirm: 'Apagar conta',
        cancel: 'Cancelar',
        danger: true
    });
    if (!sure) return;
    setFormError('');
    setBusy(true, actionButton);
    const result = await deleteAccountHere(password);
    setBusy(false, actionButton);
    if (result.status !== 200) return setFormError(messageFor(result));
    closeSettingsPage();
    showToast('Conta apagada. Os dados deste aparelho sem conta continuam aqui.');
}

async function runAction(action, target) {
    if (busy) return;
    if (action === 'signin' || action === 'signup') {
        runNavBatch(() => closeSettingsPage(), () => openAccountPage(action));
    } else if (action === 'open-password') {
        showForm('password');
    } else if (action === 'open-code') {
        showForm('code');
    } else if (action === 'open-delete') {
        showForm('delete');
    } else if (action === 'cancel-form') {
        openForm = null;
        renderPanel();
    } else if (action === 'save-password') {
        await savePassword(target);
    } else if (action === 'make-code') {
        await makeCode(target);
    } else if (action === 'copy-code') {
        await copyCode();
    } else if (action === 'code-done') {
        openForm = null;
        codeShowing = false;
        renderPanel();
        showToast('Código novo guardado.');
    } else if (action === 'delete-account') {
        await removeAccount(target);
    } else if (action === 'signout') {
        if (await leaveAccount()) showToast('Você saiu da conta. A conta continua salva: é só entrar de novo.');
    } else if (action === 'switch-profile') {
        openProfilePicker();
    } else if (action === 'manage-profiles') {
        openProfilePicker({ manage: true });
    } else if (action === 'sync-now') {
        target.classList.add('is-busy');
        const ok = await syncNow();
        showToast(ok ? 'Tudo sincronizado.' : 'Não deu para sincronizar agora. Tentamos de novo em seguida.');
    } else if (action === 'adblock') {
        if (openAdblockTips) openAdblockTips();
    }
}

/** Back: closes a form, then (phones) returns to the list, then closes the page. */
function back() {
    const restoreLayer = () => {
        if (isHandlingBack()) pushNavLayer('settings');
    };
    if (busy) {
        restoreLayer();
        return;
    }
    if (codeShowing) {
        showToast('Guarde o código e toque em "Guardei o código" para continuar.');
        restoreLayer();
        return;
    }
    if (openForm) {
        openForm = null;
        renderPanel();
        restoreLayer();
        return;
    }
    if (isPhone() && detail) {
        detail = false;
        select(current, { focusNav: true });
        restoreLayer();
        return;
    }
    closeSettingsPage();
}

/** `openAdblock`: shows the ad-block tips (main.js owns them). */
export function setupSettingsPage({ openAdblock = null } = {}) {
    const el = page();
    if (!el || el.dataset.ready === '1') return;
    el.dataset.ready = '1';
    openAdblockTips = openAdblock;

    document.getElementById('btn-settings-back').addEventListener('click', back);
    document.getElementById('settings-nav').addEventListener('click', (e) => {
        const item = e.target.closest('[data-settings-section]');
        if (!item) return;
        detail = isPhone();
        select(item.dataset.settingsSection, { focusPanel: detail });
    });
    // Up and down move along the topics (the remote's right arrow goes into the topic)
    document.getElementById('settings-nav').addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        const items = [...document.querySelectorAll('#settings-nav .settings-nav-item:not([hidden])')];
        const index = items.indexOf(document.activeElement);
        if (index < 0) return;
        e.preventDefault();
        e.stopPropagation();
        const next = items[Math.min(items.length - 1, Math.max(0, index + (e.key === 'ArrowDown' ? 1 : -1)))];
        if (!isPhone()) select(next.dataset.settingsSection);
        next.focus({ preventScroll: true });
    });

    const panel = document.getElementById('settings-panel');
    panel.addEventListener('click', (e) => {
        const legal = e.target.closest('[data-legal]');
        if (legal) {
            openLegalSection(legal.dataset.legal);
            return;
        }
        const eye = e.target.closest('[data-eye-for]');
        if (eye) {
            const input = document.getElementById(eye.dataset.eyeFor);
            const show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            eye.classList.toggle('is-on', show);
            eye.setAttribute('aria-pressed', String(show));
            eye.setAttribute('aria-label', show ? 'Esconder senha' : 'Mostrar senha');
            input.focus({ preventScroll: true });
            return;
        }
        const segment = e.target.closest('.settings-segment');
        if (segment) {
            setPlayerPref(segment.dataset.pref, JSON.parse(segment.dataset.value));
            renderPanel();
            document.querySelector(`#settings-panel .settings-segment[data-pref="${segment.dataset.pref}"].active`)?.focus({ preventScroll: true });
            return;
        }
        const actionButton = e.target.closest('[data-settings-action]');
        if (actionButton && actionButton.type !== 'submit') runAction(actionButton.dataset.settingsAction, actionButton);
    });
    // The eye keeps the focus (and the phone keyboard) in its field
    panel.addEventListener('mousedown', (e) => {
        if (e.target.closest('[data-eye-for]')) e.preventDefault();
    });
    panel.addEventListener('submit', (e) => {
        e.preventDefault();
        const submit = e.target.querySelector('[type="submit"]');
        if (submit) runAction(submit.dataset.settingsAction, submit);
    });
    panel.addEventListener('input', (e) => {
        if (e.target.id === 'settings-new-password') updatePasswordChecks();
    });

    // Drawn again when what it shows changes (forms stay open: only when none is)
    const refresh = () => {
        if (!isSettingsPageOpen()) return;
        if (!getAccount().signedIn && SIGNED_IN_ONLY.includes(current)) {
            current = 'account';
            detail = false;
        }
        if (openForm) return;
        select(current, { animate: false });
    };
    [ACCOUNT_EVENT, PROFILE_EVENT, PREFS_EVENT].forEach(name => window.addEventListener(name, refresh));
    window.addEventListener(SYNC_EVENT, () => {
        if (isSettingsPageOpen() && current === 'sync') renderPanel();
    });
    // Rotating a tablet or resizing between the two layouts
    window.matchMedia('(max-width: 768px)').addEventListener('change', () => {
        if (!isSettingsPageOpen()) return;
        if (!isPhone()) detail = false;
        select(current);
    });
}
