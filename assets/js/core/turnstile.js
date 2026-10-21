/**
 * TVZINHA ONLINE - Cloudflare Turnstile, the robot check of the account forms (Criar conta, Esqueci a senha, and Entrar
 * after 2 wrong passwords). The script loads only when a form needs it; the check stays invisible unless Cloudflare
 * wants a click ("interaction-only"). The server checks the token (functions/api/account turnstileVerifier).
 */
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
// The site key is public (the secret lives in Cloudflare as TURNSTILE_SECRET)
const SITE_KEY = '0x4AAAAAAFfciGghsW-ECPd-';
// Local development: Cloudflare's test key that always passes without showing anything
const TEST_SITE_KEY = '1x00000000000000000000BB';

let loading = null;

function isLocal() {
    const host = location.hostname;
    return host === 'localhost' || host === '127.0.0.1' || /^(192\.168|10)\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host);
}

/** Our key, or a Cloudflare test key on this computer (a test can force another one through localStorage). */
function siteKey() {
    if (!isLocal()) return SITE_KEY;
    try {
        return localStorage.getItem('tvz_turnstile_test_key') || TEST_SITE_KEY;
    } catch (e) {
        return TEST_SITE_KEY;
    }
}

function loadScript() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (!loading) {
        loading = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = SCRIPT_URL;
            script.async = true;
            script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile')));
            script.onerror = () => {
                loading = null;
                reject(new Error('turnstile'));
            };
            document.head.appendChild(script);
        });
    }
    return loading;
}

/**
 * A check drawn in `container` for `action` ('register', 'recover', 'login').
 * { token(timeoutMs) -> Promise<string|null>, unavailable, failed, reset(), remove() }: a token is good for one try.
 * `onToken(token)`: each new token (for example once the person ticks the box Cloudflare showed).
 */
export function createCheck(container, action, { onToken = null } = {}) {
    let widgetId = null;
    let current = null;
    let failed = false;
    let unavailable = false;
    let removed = false;
    const waiters = [];
    const settle = (value) => waiters.splice(0).forEach(resolve => resolve(value));

    loadScript().then(turnstile => {
        // Removed (the form changed) while the script was loading
        if (removed || !container.isConnected) return;
        widgetId = turnstile.render(container, {
            sitekey: siteKey(),
            action,
            theme: 'dark',
            language: 'pt-br',
            appearance: 'interaction-only',
            size: 'flexible',
            callback: (token) => {
                current = token;
                failed = false;
                settle(token);
                if (onToken) onToken(token);
            },
            'error-callback': () => {
                failed = true;
                settle(null);
                // Handled here (the page shows its own message)
                return true;
            },
            'expired-callback': () => {
                current = null;
            },
        });
    }).catch(() => {
        unavailable = true;
        settle(null);
    });

    return {
        get unavailable() {
            return unavailable;
        },
        get failed() {
            return failed;
        },
        /** The token, waiting for it up to `timeoutMs`; null when the check failed or did not answer. */
        token(timeoutMs = 10000) {
            if (current) return Promise.resolve(current);
            if (failed || unavailable) return Promise.resolve(null);
            return new Promise(resolve => {
                waiters.push(resolve);
                setTimeout(() => resolve(current), timeoutMs);
            });
        },
        /** A new token for the next try (each is accepted once by the server). */
        reset() {
            current = null;
            failed = false;
            if (widgetId !== null && window.turnstile) window.turnstile.reset(widgetId);
        },
        remove() {
            removed = true;
            if (widgetId !== null && window.turnstile) window.turnstile.remove(widgetId);
            widgetId = null;
            current = null;
            settle(null);
        },
    };
}
