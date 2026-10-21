/**
 * TVZINHA ONLINE - Profiles: "Quem está assistindo?", Gerenciar perfis, the editor and the guest data question.
 *
 * A full-screen page (a history layer, like the account page). It opens after creating the account or signing in,
 * with "Trocar" in the menu, and on opening the site (or coming back to the tab) more than 3 hours after the last use.
 * In those first cases a profile must be chosen (`required`: Back does not leave). Picking a profile makes it the one
 * whose data the site reads (core/profileStore.js) and goes to Início. The first time a profile is used on a device
 * that has guest data, the page asks whether that data goes with it.
 */
import { getAccount, getActiveProfile, createProfile, updateProfile, removeProfile, profileNameProblem, ACCOUNT_EVENT } from '../core/account.js?v=20261021_1502';
import { leaveAccount } from '../core/sync.js?v=20261021_1502';
import { activeProfileId, setActiveProfile, timeSinceLastUse, touchProfile, shouldAskAboutGuestData, markGuestDataAsked, copyGuestDataTo, removeProfileData } from '../core/profileStore.js?v=20261021_1502';
import { AVATAR_FACES, AVATAR_ICONS, DEFAULT_AVATAR, avatarSrc, freeAvatar } from '../core/avatars.js?v=20261021_1502';
import { showToast } from '../core/toast.js?v=20261021_1502';
import { syncPageLock } from '../core/activity.js?v=20261021_1502';
import { escapeHtml, escapeAttr } from '../core/sanitize.js?v=20261021_1502';
import { pushNavLayer, popNavLayer, isHandlingBack, runNavBatch } from '../navigation/historyManager.js?v=20261021_1502';
import { switchAppView } from '../navigation/router.js?v=20261021_1502';
import { isTitlePageOpen, exitTitleTo } from './titlePage.js?v=20261021_1502';

const MAX_PROFILES = 5;
// Away longer than this: the picker asks again who is watching
export const PICK_AFTER_MS = 3 * 3600 * 1000;

const MESSAGES = {
    profile_name_short: 'Digite um nome.',
    profile_name_long: 'O nome pode ter até 20 caracteres.',
    profile_name_chars: 'Use só letras, números, espaços, ponto, hífen ou apóstrofo.',
    profile_name_taken: 'Já existe um perfil com esse nome.',
    profile_name_invalid: 'Digite um nome.',
    profiles_full: 'Uma conta pode ter até 5 perfis.',
    profile_last: 'A conta precisa de pelo menos um perfil.',
    avatar_unknown: 'Escolha um avatar da lista.',
    not_found: 'Esse perfil não existe mais. Atualize a página.',
    not_signed_in: 'Sua sessão terminou. Entre de novo.',
    accounts_unavailable: 'As contas estão fora do ar agora. Tente de novo mais tarde.',
    network: 'Sem conexão com o servidor. Verifique a internet e tente de novo.'
};

const PENCIL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"></path></svg>';
const PLUS = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>';

// A profile must be chosen before the page closes (after signing in, or the 3-hour mark)
let required = false;
let screen = 'pick';         // pick | edit | confirm | guest
let managing = false;
let editingId = null;        // null: a new profile
let editAvatar = DEFAULT_AVATAR;
let avatarSet = 'faces';
let pendingGuestId = null;
let busy = false;

function page() {
    return document.getElementById('profile-page');
}

export function isProfilePageOpen() {
    const el = page();
    return Boolean(el) && !el.classList.contains('hidden');
}

function profiles() {
    return getAccount().profiles;
}

function findProfile(id) {
    return profiles().find(p => p.id === id) || null;
}

/** Opens "Quem está assistindo?". `required`: a profile must be chosen (Back stays); `manage`: in Gerenciar perfis. */
export function openProfilePicker({ required: mustChoose = false, manage = false } = {}) {
    if (!getAccount().signedIn) return;
    const el = page();
    if (!el) return;
    required = required || mustChoose;
    if (!isProfilePageOpen()) {
        el.classList.remove('hidden', 'is-entering');
        void el.offsetWidth;
        el.classList.add('is-entering');
        syncPageLock();
        pushNavLayer('profiles');
    }
    setManaging(manage && !required);
    showScreen('pick');
    const active = el.querySelector('.profile-tile.is-active') || el.querySelector('.profile-tile');
    if (active) active.focus({ preventScroll: true });
}

export function closeProfilePage({ keepHistory = false } = {}) {
    if (!isProfilePageOpen()) return;
    page().classList.add('hidden');
    required = false;
    pendingGuestId = null;
    setBusy(false);
    syncPageLock();
    if (!keepHistory) popNavLayer();
}

function showScreen(next) {
    screen = next;
    const el = page();
    ['pick', 'edit', 'confirm', 'guest'].forEach(name => {
        const view = document.getElementById(`profile-${name}-view`);
        if (view) view.hidden = name !== next;
    });
    const view = document.getElementById(`profile-${next}-view`);
    if (view) {
        view.classList.remove('is-switching');
        void view.offsetWidth;
        view.classList.add('is-switching');
    }
    el.dataset.screen = next;
    updateBackButton();
    if (next === 'pick') renderGrid();
}

/** Nothing to go back to while a profile must be chosen: the arrow hides (Back still explains why). */
function updateBackButton() {
    const backButton = document.getElementById('btn-profile-back');
    if (backButton) backButton.hidden = screen === 'guest' || (screen === 'pick' && required && !managing);
}

function setManaging(on) {
    managing = on;
    const el = page();
    el.classList.toggle('is-managing', on);
    document.getElementById('profile-title').textContent = on ? 'Gerenciar perfis' : 'Quem está assistindo?';
    document.getElementById('btn-profile-manage').textContent = on ? 'Concluído' : 'Gerenciar perfis';
    updateBackButton();
    if (screen === 'pick') renderGrid();
}

function renderGrid() {
    const grid = document.getElementById('profile-grid');
    if (!grid) return;
    const list = profiles();
    const activeId = activeProfileId();
    const tiles = list.map(p => `
        <div role="listitem">
            <button type="button" class="profile-tile${p.id === activeId && !required ? ' is-active' : ''}" data-profile-id="${escapeAttr(p.id)}" aria-label="${escapeAttr(managing ? `Editar ${p.name}` : p.name)}">
                <span class="profile-avatar-wrap">
                    <img class="profile-avatar" src="${avatarSrc(p.avatar)}" alt="" width="120" height="120" draggable="false">
                    <span class="profile-tile-edit" aria-hidden="true">${PENCIL}</span>
                </span>
                <span class="profile-tile-name">${escapeHtml(p.name)}</span>
            </button>
        </div>`);
    if (list.length < MAX_PROFILES) {
        tiles.push(`
        <div role="listitem">
            <button type="button" class="profile-tile profile-tile-add" data-profile-add="1">
                <span class="profile-avatar-wrap profile-add-circle">${PLUS}</span>
                <span class="profile-tile-name">Adicionar perfil</span>
            </button>
        </div>`);
    }
    grid.innerHTML = tiles.join('');
}

// --- Choosing ---

function choose(id) {
    const profile = findProfile(id);
    if (!profile) return;
    if (shouldAskAboutGuestData(id)) {
        showGuestQuestion(profile);
        return;
    }
    applyProfile(profile);
}

function showGuestQuestion(profile) {
    pendingGuestId = profile.id;
    document.getElementById('profile-guest-avatar').src = avatarSrc(profile.avatar);
    document.getElementById('profile-guest-title').textContent = `Levar o que está neste aparelho para o perfil ${profile.name}?`;
    showScreen('guest');
    document.getElementById('btn-profile-guest-yes').focus({ preventScroll: true });
}

function answerGuest(bring) {
    const profile = findProfile(pendingGuestId);
    pendingGuestId = null;
    if (!profile) {
        showScreen('pick');
        return;
    }
    if (bring) copyGuestDataTo(profile.id);
    markGuestDataAsked(profile.id);
    applyProfile(profile, { reload: bring });
}

/** The profile becomes the one in use; the page closes and the site goes to Início when it changed. */
function applyProfile(profile, { reload = false } = {}) {
    const changed = profile.id !== activeProfileId() || reload;
    setActiveProfile(profile.id, { force: reload });
    required = false;
    // Início's history entry goes in after the page's has left, or the page's Back would undo it
    runNavBatch(() => closeProfilePage(), () => {
        // From Configurações the person stays there (the page redraws with the new profile)
        if (!changed || isOpen('settings-page')) return;
        if (isTitlePageOpen()) exitTitleTo('home');
        else switchAppView('home');
    });
    showToast(`Olá, ${profile.name}!`);
}

// --- The editor ---

function openEditor(id) {
    const profile = id ? findProfile(id) : null;
    editingId = profile ? profile.id : null;
    editAvatar = profile ? profile.avatar : freeAvatar(profiles());
    avatarSet = AVATAR_ICONS.includes(editAvatar) ? 'icons' : 'faces';
    document.getElementById('profile-edit-title').textContent = profile ? 'Editar perfil' : 'Adicionar perfil';
    document.getElementById('profile-name').value = profile ? profile.name : '';
    document.getElementById('btn-profile-remove').hidden = !profile || profiles().length <= 1;
    document.getElementById('btn-profile-save-label').textContent = profile ? 'Salvar' : 'Criar perfil';
    setEditError('');
    renderAvatarSet();
    showScreen('edit');
    updateEditor();
    document.getElementById('profile-name').focus({ preventScroll: true });
}

function renderAvatarSet() {
    document.querySelectorAll('#profile-page .profile-avatar-tab').forEach(tab => {
        const on = tab.dataset.avatarSet === avatarSet;
        tab.classList.toggle('active', on);
        tab.setAttribute('aria-selected', String(on));
    });
    const ids = avatarSet === 'icons' ? AVATAR_ICONS : AVATAR_FACES;
    document.getElementById('profile-avatar-grid').innerHTML = ids.map(id => `
        <button type="button" class="profile-avatar-option${id === editAvatar ? ' is-selected' : ''}" role="radio" aria-checked="${id === editAvatar}" data-avatar="${id}" aria-label="Avatar ${id}">
            <img src="${avatarSrc(id)}" alt="" width="64" height="64" loading="lazy" draggable="false">
        </button>`).join('');
}

function pickAvatar(id) {
    editAvatar = id;
    document.querySelectorAll('#profile-avatar-grid .profile-avatar-option').forEach(option => {
        const on = option.dataset.avatar === id;
        option.classList.toggle('is-selected', on);
        option.setAttribute('aria-checked', String(on));
    });
    updateEditor();
}

/** The preview, the name hint and the button, on every change. */
function updateEditor() {
    const name = document.getElementById('profile-name').value;
    document.getElementById('profile-edit-preview').src = avatarSrc(editAvatar);
    const problem = profileNameProblem(name, profiles(), editingId);
    const hint = document.getElementById('profile-name-hint');
    hint.textContent = name && problem ? MESSAGES[problem] : '';
    hint.classList.toggle('is-problem', Boolean(name && problem));
    const profile = editingId ? findProfile(editingId) : null;
    const unchanged = profile && profile.name === name.trim() && profile.avatar === editAvatar;
    document.getElementById('btn-profile-save').disabled = Boolean(problem) || busy || Boolean(unchanged);
}

function setEditError(message, boxId = 'profile-edit-error') {
    const box = document.getElementById(boxId);
    if (!box) return;
    box.textContent = message || '';
    if (message) {
        box.classList.remove('is-shaking');
        void box.offsetWidth;
        box.classList.add('is-shaking');
    }
}

function setBusy(on) {
    busy = on;
    ['btn-profile-save', 'btn-profile-confirm-remove'].forEach(id => {
        const button = document.getElementById(id);
        if (!button) return;
        button.classList.toggle('is-busy', on);
        button.setAttribute('aria-busy', String(on));
    });
    const confirm = document.getElementById('btn-profile-confirm-remove');
    if (confirm) confirm.disabled = on;
    if (screen === 'edit') updateEditor();
}

async function saveProfile() {
    if (busy) return;
    updateEditor();
    if (document.getElementById('btn-profile-save').disabled) return;
    const name = document.getElementById('profile-name').value.trim();
    setEditError('');
    setBusy(true);
    const result = editingId ? await updateProfile(editingId, { name, avatar: editAvatar }) : await createProfile(name, editAvatar);
    setBusy(false);
    if (result.status !== 200 && result.status !== 201) {
        setEditError(MESSAGES[result.json && result.json.error] || 'Algo deu errado. Tente de novo.');
        return;
    }
    const createdId = result.json.created || null;
    showToast(createdId ? `Perfil ${name} criado` : 'Perfil salvo');
    showScreen('pick');
    const tile = document.querySelector(`#profile-grid [data-profile-id="${CSS.escape(createdId || editingId)}"]`);
    if (tile) tile.focus({ preventScroll: true });
}

function askRemove() {
    const profile = findProfile(editingId);
    if (!profile) return;
    document.getElementById('profile-confirm-title').textContent = `Excluir o perfil ${profile.name}?`;
    setEditError('', 'profile-confirm-error');
    showScreen('confirm');
    document.getElementById('btn-profile-confirm-cancel').focus({ preventScroll: true });
}

async function confirmRemove() {
    if (busy || !editingId) return;
    const id = editingId;
    setBusy(true);
    const result = await removeProfile(id);
    setBusy(false);
    if (result.status !== 200) {
        setEditError(MESSAGES[result.json && result.json.error] || 'Algo deu errado. Tente de novo.', 'profile-confirm-error');
        return;
    }
    removeProfileData(id);
    // The profile in use was removed: the site reads no profile until another one is chosen
    if (id === activeProfileId()) {
        setActiveProfile(null);
        required = true;
    }
    editingId = null;
    showToast('Perfil excluído');
    showScreen('pick');
}

// --- Back ---

/** Back (the arrow, the phone's Back, Esc): one step inside the page; it closes only when nothing must be chosen. */
function back() {
    // The browser's Back already took this page's history layer: put it back when the page stays
    const restoreLayer = () => {
        if (isHandlingBack()) pushNavLayer('profiles');
    };
    if (busy) {
        restoreLayer();
        return;
    }
    if (screen === 'confirm') {
        showScreen('edit');
        updateEditor();
        restoreLayer();
        return;
    }
    if (screen === 'edit') {
        showScreen('pick');
        restoreLayer();
        return;
    }
    if (screen === 'guest') {
        showToast('Escolha uma das opções para continuar.');
        restoreLayer();
        return;
    }
    if (managing) {
        setManaging(false);
        restoreLayer();
        return;
    }
    if (required) {
        showToast('Escolha um perfil para continuar.');
        restoreLayer();
        return;
    }
    closeProfilePage();
}

// --- When the picker opens by itself ---

// Read from the page (accountPage.js and settingsPage.js import this module: no import back)
function isOpen(id) {
    const el = document.getElementById(id);
    return Boolean(el) && !el.classList.contains('hidden');
}

function isAccountPageOpen() {
    return isOpen('account-page');
}

function playerOpen() {
    return ['movie-player-view', 'series-player-view'].some(id => {
        const view = document.getElementById(id);
        return view && !view.classList.contains('hidden');
    });
}

/** Signed in with no profile in use (or one removed elsewhere), or away for more than 3 hours: ask who is watching. */
function needsPick() {
    if (!getAccount().signedIn) return false;
    return !getActiveProfile() || timeSinceLastUse() > PICK_AFTER_MS;
}

/** Called once the app is up (main.js). */
export function checkProfileOnStart() {
    if (needsPick()) openProfilePicker({ required: true });
    else touchProfile();
}

export function setupProfilePage() {
    const el = page();
    if (!el || el.dataset.ready === '1') return;
    el.dataset.ready = '1';

    document.getElementById('btn-profile-back').addEventListener('click', back);
    document.getElementById('btn-profile-manage').addEventListener('click', () => setManaging(!managing));
    // Sending what is pending first; signed out, the account listener below closes the page
    document.getElementById('btn-profile-signout').addEventListener('click', async () => {
        if (await leaveAccount()) showToast('Você saiu da conta. A conta continua salva: é só entrar de novo.');
    });
    document.getElementById('profile-grid').addEventListener('click', (e) => {
        const tile = e.target.closest('.profile-tile');
        if (!tile) return;
        if (tile.dataset.profileAdd) openEditor(null);
        else if (managing) openEditor(tile.dataset.profileId);
        else choose(tile.dataset.profileId);
    });
    document.getElementById('profile-name').addEventListener('input', updateEditor);
    document.getElementById('profile-name').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveProfile();
        }
    });
    el.querySelectorAll('.profile-avatar-tab').forEach(tab => tab.addEventListener('click', () => {
        avatarSet = tab.dataset.avatarSet;
        renderAvatarSet();
    }));
    document.getElementById('profile-avatar-grid').addEventListener('click', (e) => {
        const option = e.target.closest('[data-avatar]');
        if (option) pickAvatar(option.dataset.avatar);
    });
    document.getElementById('btn-profile-save').addEventListener('click', saveProfile);
    document.getElementById('btn-profile-remove').addEventListener('click', askRemove);
    document.getElementById('btn-profile-confirm-remove').addEventListener('click', confirmRemove);
    document.getElementById('btn-profile-confirm-cancel').addEventListener('click', () => {
        showScreen('edit');
        updateEditor();
    });
    document.getElementById('btn-profile-guest-yes').addEventListener('click', () => answerGuest(true));
    document.getElementById('btn-profile-guest-no').addEventListener('click', () => answerGuest(false));

    window.addEventListener(ACCOUNT_EVENT, () => {
        if (!getAccount().signedIn) {
            if (isProfilePageOpen()) {
                required = false;
                closeProfilePage();
            }
            return;
        }
        if (isProfilePageOpen()) {
            if (screen === 'pick') renderGrid();
            return;
        }
        // The profile in use was removed on another device (seen when /me answers)
        if (!getActiveProfile() && !isAccountPageOpen()) openProfilePicker({ required: true });
    });

    // The last use, for the 3-hour rule: while the page is on screen, and on coming back to the tab
    setInterval(() => {
        if (!document.hidden) touchProfile();
    }, 60 * 1000);
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) return;
        if (needsPick() && !playerOpen() && !isProfilePageOpen() && !isAccountPageOpen()) openProfilePicker({ required: true });
        else touchProfile();
    });
}
