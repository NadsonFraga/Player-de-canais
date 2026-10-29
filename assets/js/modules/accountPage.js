/**
 * TVZINHA ONLINE - Account page: Entrar, Criar conta, Esqueci a senha, and the recovery code shown once.
 *
 * A full-screen page over everything else (a history layer: Back closes it). The rules are checked while the person
 * types (core/account.js has the same rules as the server) so mistakes show before the button is pressed; the server
 * still decides. After creating the account or recovering it, the new recovery code is shown and the page only closes
 * through "Guardei o código". Signed in, "Quem está assistindo?" follows (modules/profilePage.js).
 * Robots: Criar conta and Esqueci a senha carry the Turnstile check (core/turnstile.js); Entrar adds it when the server
 * asks (after 2 wrong passwords) and then sends again by itself.
 */
import { register, signIn, recoverAccount, nicknameProblem, passwordRules, passwordStrength } from '../core/account.js?v=20261028_2249';
import { showToast } from '../core/toast.js?v=20261028_2249';
import { syncPageLock } from '../core/activity.js?v=20261028_2249';
import { pushNavLayer, popNavLayer, isHandlingBack, runNavBatch } from '../navigation/historyManager.js?v=20261028_2249';
import { openLegalSection } from './footer.js?v=20261028_2249';
import { openProfilePicker } from './profilePage.js?v=20261028_2249';
import { createCheck } from '../core/turnstile.js?v=20261028_2249';

const MESSAGES = {
    nickname_short: 'O apelido precisa ter pelo menos 3 caracteres.',
    nickname_long: 'O apelido pode ter até 20 caracteres.',
    nickname_chars: 'Use só letras sem acento, números, ponto, hífen ou sublinhado (sem espaços).',
    nickname_invalid: 'Digite um apelido.',
    nickname_taken: 'Esse apelido já está em uso. Escolha outro.',
    password_short: 'A senha precisa ter pelo menos 8 caracteres.',
    password_long: 'A senha pode ter até 200 caracteres.',
    password_letter: 'A senha precisa ter pelo menos uma letra.',
    password_number: 'A senha precisa ter pelo menos um número.',
    password_is_nickname: 'A senha não pode ser igual ao apelido.',
    missing_fields: 'Preencha o apelido e a senha.',
    wrong_credentials: 'Apelido ou senha incorretos.',
    wrong_recovery: 'Apelido ou código de recuperação incorretos.',
    accounts_unavailable: 'As contas estão fora do ar agora. Tente de novo mais tarde.',
    captcha_required: 'Confirme a verificação para continuar.',
    captcha_failed: 'Não deu para confirmar que você é uma pessoa. Tente de novo.',
    captcha_unavailable: 'A verificação está fora do ar agora. Tente de novo em instantes.',
    network: 'Sem conexão com o servidor. Verifique a internet e tente de novo.'
};

const VIEWS = {
    signin: { title: 'Entrar', lead: 'Sua Coleção e seu progresso em qualquer aparelho.', submit: 'Entrar', passwordLabel: 'Senha', autocomplete: 'current-password' },
    signup: { title: 'Criar conta', lead: 'Sem e-mail: só um apelido e uma senha.', submit: 'Criar conta', passwordLabel: 'Senha', autocomplete: 'new-password' },
    recover: { title: 'Recuperar a conta', lead: 'Use o código de recuperação que apareceu quando você criou a conta.', submit: 'Salvar senha nova', passwordLabel: 'Senha nova', autocomplete: 'new-password' }
};

let view = 'signin';
let busy = false;
// The robot check on screen, and the action it is for ('register' | 'recover' | 'login')
let check = null;
let checkAction = null;
// Entrar needs the check after 2 wrong passwords (the server says so)
let loginNeedsCheck = false;
// A try stopped because the box Cloudflare showed was not ticked yet: it goes by itself once it is
let retryWhenChecked = false;

/** The check for `action` under the password (made once per form). */
function ensureCheck(action) {
    if (check && checkAction === action) return check;
    dropCheck();
    check = createCheck(document.getElementById('account-turnstile'), action, {
        onToken: () => {
            if (!retryWhenChecked || !isAccountPageOpen()) return;
            retryWhenChecked = false;
            document.getElementById('account-form').requestSubmit();
        },
    });
    checkAction = action;
    return check;
}

function dropCheck() {
    if (check) check.remove();
    check = null;
    checkAction = null;
}

/** What the current form needs: the action of its check, or null. */
function checkActionFor(current) {
    if (current === 'signup') return 'register';
    if (current === 'recover') return 'recover';
    return loginNeedsCheck ? 'login' : null;
}
// After the code: what the closing toast says ('signup' or 'recover')
let codeReason = null;

function page() {
    return document.getElementById('account-page');
}

export function isAccountPageOpen() {
    const el = page();
    return Boolean(el) && !el.classList.contains('hidden');
}

function codeShowing() {
    const codeView = document.getElementById('account-code-view');
    return Boolean(codeView) && !codeView.hidden;
}

export function openAccountPage(initialView = 'signin') {
    const el = page();
    if (!el) return;
    if (!isAccountPageOpen()) {
        el.classList.remove('hidden');
        el.classList.remove('is-entering');
        void el.offsetWidth;
        el.classList.add('is-entering');
        syncPageLock();
        pushNavLayer('account');
    }
    showFormView();
    setView(initialView, { focus: true, reset: true });
}

/** Closes the page. `keepHistory`: its history layer was already taken (Back). */
export function closeAccountPage({ keepHistory = false } = {}) {
    if (!isAccountPageOpen()) return;
    page().classList.add('hidden');
    syncPageLock();
    resetForm();
    if (!keepHistory) popNavLayer();
}

function resetForm() {
    ['account-nickname', 'account-password', 'account-code-input'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });
    setPasswordVisible(false);
    setError('');
    setBusy(false);
    codeReason = null;
    loginNeedsCheck = false;
    retryWhenChecked = false;
    dropCheck();
}

function showFormView() {
    document.getElementById('account-form-view').hidden = false;
    document.getElementById('account-code-view').hidden = true;
}

function setView(next, { focus = false, reset = false } = {}) {
    view = VIEWS[next] ? next : 'signin';
    const conf = VIEWS[view];
    const el = page();
    el.dataset.view = view;
    document.getElementById('account-title').textContent = conf.title;
    document.getElementById('account-lead').textContent = conf.lead;
    document.getElementById('account-submit-label').textContent = conf.submit;
    document.getElementById('account-password-label').textContent = conf.passwordLabel;
    const password = document.getElementById('account-password');
    password.autocomplete = conf.autocomplete;
    if (reset) password.value = '';
    document.getElementById('account-code-field').hidden = view !== 'recover';
    document.getElementById('account-terms').hidden = view !== 'signup';
    document.getElementById('btn-account-forgot').hidden = view !== 'signin';
    document.getElementById('btn-account-remembered').hidden = view !== 'recover';
    const newPassword = view !== 'signin';
    document.getElementById('account-strength').hidden = !newPassword;
    document.getElementById('account-rules').hidden = !newPassword;
    document.querySelectorAll('#account-page .account-switch-option').forEach(option => {
        const on = option.dataset.accountView === view;
        option.classList.toggle('active', on);
        option.setAttribute('aria-selected', String(on));
    });
    el.querySelector('.account-switch').classList.toggle('is-signup', view === 'signup');
    el.querySelector('.account-switch').hidden = view === 'recover';
    // A soft fade between the forms
    const form = document.getElementById('account-form');
    form.classList.remove('is-switching');
    void form.offsetWidth;
    form.classList.add('is-switching');
    setError('');
    updateLiveChecks();
    // The robot check loads with the form that needs it (it is usually done before the person finishes typing)
    const action = checkActionFor(view);
    if (action) ensureCheck(action);
    else dropCheck();
    if (focus) {
        const nickname = document.getElementById('account-nickname');
        (nickname.value ? (view === 'recover' ? document.getElementById('account-code-input') : password) : nickname).focus({ preventScroll: true });
    }
}

function setError(message) {
    const box = document.getElementById('account-error');
    box.textContent = message || '';
    box.classList.toggle('is-visible', Boolean(message));
    if (message) {
        box.classList.remove('is-shaking');
        void box.offsetWidth;
        box.classList.add('is-shaking');
    }
}

function setBusy(on) {
    busy = on;
    const button = document.getElementById('btn-account-submit');
    if (button) {
        button.classList.toggle('is-busy', on);
        button.setAttribute('aria-busy', String(on));
    }
    updateLiveChecks();
}

function setPasswordVisible(visible) {
    const password = document.getElementById('account-password');
    const eye = document.getElementById('btn-account-eye');
    if (!password || !eye) return;
    password.type = visible ? 'text' : 'password';
    eye.classList.toggle('is-on', visible);
    eye.setAttribute('aria-pressed', String(visible));
    eye.setAttribute('aria-label', visible ? 'Esconder senha' : 'Mostrar senha');
}

/** Rules ticked, strength bar, nickname hint and the button state, on every keystroke. */
function updateLiveChecks() {
    const nickname = document.getElementById('account-nickname').value;
    const password = document.getElementById('account-password').value;
    const code = document.getElementById('account-code-input').value;
    const hint = document.getElementById('account-nickname-hint');
    let ready = Boolean(nickname.trim()) && Boolean(password);

    if (view === 'signup' && nickname) {
        const problem = nicknameProblem(nickname);
        hint.textContent = problem ? MESSAGES[problem] : '';
        hint.classList.toggle('is-problem', Boolean(problem));
        ready = ready && !problem;
    } else {
        hint.textContent = '';
        hint.classList.remove('is-problem');
    }

    if (view !== 'signin') {
        const rules = passwordRules(password, nickname);
        document.querySelectorAll('#account-rules [data-rule]').forEach(item => item.classList.toggle('is-met', Boolean(rules[item.dataset.rule])));
        const strength = passwordStrength(password);
        const box = document.getElementById('account-strength');
        box.dataset.level = strength.level;
        box.style.setProperty('--strength', `${Math.min(100, Math.round((strength.score / 6) * 100))}%`);
        document.getElementById('account-strength-label').textContent = strength.level === 'forte' ? 'Forte' : strength.level === 'media' ? 'Média' : strength.level === 'fraca' ? 'Fraca' : '';
        ready = ready && rules.length && rules.letter && rules.number && rules.notNickname;
    }
    if (view === 'recover') ready = ready && code.replace(/[^A-Za-z0-9]/g, '').length === 16;

    const button = document.getElementById('btn-account-submit');
    button.disabled = !ready || busy;
}

function messageFor(result) {
    const error = result.json && result.json.error;
    if (error === 'too_many_attempts') {
        const minutes = Math.max(1, Math.ceil((Number(result.json.retryAfter) || 60) / 60));
        return `Muitas tentativas. Tente de novo em ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}.`;
    }
    return MESSAGES[error] || 'Algo deu errado. Tente de novo.';
}

async function submit(e) {
    e.preventDefault();
    if (busy) return;
    updateLiveChecks();
    if (document.getElementById('btn-account-submit').disabled) return;
    const nickname = document.getElementById('account-nickname').value.trim();
    const password = document.getElementById('account-password').value;
    setError('');
    setBusy(true);
    let token = '';
    const action = checkActionFor(view);
    if (action) {
        const current = ensureCheck(action);
        token = await current.token();
        if (!token) {
            setBusy(false);
            if (current.unavailable) {
                setError(MESSAGES.captcha_unavailable);
            } else if (current.failed) {
                setError(MESSAGES.captcha_failed);
                current.reset();
            } else {
                // Cloudflare showed its box: the try goes on by itself once it is ticked
                setError(MESSAGES.captcha_required);
                retryWhenChecked = true;
            }
            return;
        }
    }
    let result;
    if (view === 'signin') result = await signIn(nickname, password, token);
    else if (view === 'signup') result = await register(nickname, password, token);
    else result = await recoverAccount(nickname, document.getElementById('account-code-input').value, password, token);
    setBusy(false);
    // Each token is accepted once: a fresh one for the next try
    if (check) check.reset();

    // After 2 wrong passwords the server asks for the check: show it and send again by itself
    if (view === 'signin' && !loginNeedsCheck && result.json && result.json.error === 'captcha_required') {
        loginNeedsCheck = true;
        ensureCheck('login');
        submit(e);
        return;
    }

    const ok = view === 'signup' ? result.status === 201 : result.status === 200;
    if (!ok) {
        setError(messageFor(result));
        return;
    }
    if (view === 'signin') {
        closeIntoProfiles();
        return;
    }
    showCode(result.json.recoveryCode, view);
}

function showCode(code, reason) {
    codeReason = reason;
    document.getElementById('account-code').textContent = code || '';
    document.getElementById('account-form-view').hidden = true;
    const codeView = document.getElementById('account-code-view');
    codeView.hidden = false;
    codeView.classList.remove('is-switching');
    void codeView.offsetWidth;
    codeView.classList.add('is-switching');
    document.getElementById('btn-account-copy').focus({ preventScroll: true });
}

function finishCode() {
    if (codeReason === 'recover') showToast('Senha nova salva. Você entrou na conta.');
    closeIntoProfiles();
}

/** Signed in: the page gives way to "Quem está assistindo?" (its history layer goes in after this page's has left). */
function closeIntoProfiles() {
    runNavBatch(() => closeAccountPage(), () => openProfilePicker({ required: true }));
}

async function copyCode() {
    const code = document.getElementById('account-code').textContent;
    try {
        await navigator.clipboard.writeText(code);
        showToast('Código copiado');
    } catch (e) {
        // No clipboard permission: select it so the person can copy by hand
        const range = document.createRange();
        range.selectNodeContents(document.getElementById('account-code'));
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        showToast('Selecionei o código: copie com Ctrl+C ou segurando o dedo.');
    }
}

/** Back (the button, the phone's Back, Esc). While the code shows, the page stays: it is shown only once. */
function back() {
    // The browser's Back already took this page's history layer: put it back when the page stays
    const restoreLayer = () => {
        if (isHandlingBack()) pushNavLayer('account');
    };
    if (codeShowing()) {
        showToast('Guarde o código e toque em "Guardei o código" para continuar.');
        restoreLayer();
        return;
    }
    if (view === 'recover') {
        setView('signin', { focus: true });
        restoreLayer();
        return;
    }
    closeAccountPage();
}

export function setupAccountPage() {
    const el = page();
    if (!el || el.dataset.ready === '1') return;
    el.dataset.ready = '1';

    document.getElementById('account-form').addEventListener('submit', submit);
    document.getElementById('account-form').addEventListener('input', updateLiveChecks);
    // The press keeps the focus (and the phone keyboard) in the password field
    document.getElementById('btn-account-eye').addEventListener('mousedown', e => e.preventDefault());
    document.getElementById('btn-account-eye').addEventListener('click', () => {
        const password = document.getElementById('account-password');
        setPasswordVisible(password.type === 'password');
        password.focus({ preventScroll: true });
    });
    document.getElementById('btn-account-copy').addEventListener('click', copyCode);
    document.getElementById('btn-account-code-done').addEventListener('click', finishCode);
    document.getElementById('btn-account-back').addEventListener('click', back);
    el.addEventListener('click', (e) => {
        const switcher = e.target.closest('[data-account-view]');
        if (switcher) {
            setView(switcher.dataset.accountView, { focus: true });
            return;
        }
        const legal = e.target.closest('[data-legal]');
        if (legal) openLegalSection(legal.dataset.legal);
    });
}
