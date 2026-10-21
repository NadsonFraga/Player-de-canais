/**
 * TVZINHA ONLINE - Anti-popup and anti-hijack guard, loaded first and synchronously in <head> (before any module).
 * Kept as its own file so the CSP needs no 'unsafe-inline' for scripts.
 */
(function() {
  'use strict';
  const _nativeOpen = window.open ? window.open.bind(window) : null;
  let _contingencyActive = false;
  let _userInteractingWithIframe = false;
  let _touchTimer = null;

  // 1. Canal seguro e imutável para ações intencionais (ex: "Abrir em Nova Aba")
  Object.defineProperty(window, 'tvzinhaSafeOpen', {
    value: function(url, target, features) {
      if (_nativeOpen && url) {
        return _nativeOpen(url, target || '_blank', features || 'noopener,noreferrer');
      }
      return null;
    },
    writable: false,
    configurable: false
  });

  // 2. Interceptador de popups com bypass para Artplayer e bloqueio silencioso
  window.open = function(url, target, features) {
    try {
      const stack = (new Error()).stack || '';
      if (stack.includes('artplayer') || stack.includes('Artplayer')) {
        return _nativeOpen ? _nativeOpen(url, target, features) : null;
      }
    } catch (e) {}
    console.warn('[Tvzinha Shield] Popup externo bloqueado em background:', url);
    return null;
  };

  // 3. Controle imutável do estado de contingência/iframes
  Object.defineProperty(window, 'tvzinhaSetContingencyState', {
    value: function(isActive) {
      _contingencyActive = Boolean(isActive);
      if (!isActive) {
        _userInteractingWithIframe = false;
        if (_touchTimer) {
          clearTimeout(_touchTimer);
          _touchTimer = null;
        }
      }
    },
    writable: false,
    configurable: false
  });

  // 4. Guarda imutável e idempotente para iframes (Desktop + Mobile/Touch)
  Object.defineProperty(window, 'tvzinhaArmIframeGuard', {
    value: function(iframeEl) {
      if (!iframeEl || iframeEl._tvzinhaGuarded) return;
      iframeEl._tvzinhaGuarded = true;

      // Desktop (Mouse Hover)
      iframeEl.addEventListener('mouseenter', function() {
        _userInteractingWithIframe = true;
      });
      iframeEl.addEventListener('mouseleave', function() {
        _userInteractingWithIframe = false;
      });

      // Mobile / Touch / Smart TV
      iframeEl.addEventListener('touchstart', function() {
        _userInteractingWithIframe = true;
        if (_touchTimer) clearTimeout(_touchTimer);
      }, { passive: true });

      iframeEl.addEventListener('touchend', function() {
        if (_touchTimer) clearTimeout(_touchTimer);
        _touchTimer = setTimeout(function() {
          _userInteractingWithIframe = false;
        }, 3000);
      }, { passive: true });
    },
    writable: false,
    configurable: false
  });

  // Reset imediato se o usuário clicar na interface nativa da Tvzinha
  document.addEventListener('click', function() {
    _userInteractingWithIframe = false;
    if (_touchTimer) {
      clearTimeout(_touchTimer);
      _touchTimer = null;
    }
  }, true);

  // Bloqueio estrito de sequestro: só desarma saída se estiver em contingência + interagindo com o iframe
  window.addEventListener('beforeunload', function(e) {
    if (_contingencyActive && _userInteractingWithIframe) {
      e.preventDefault();
      e.returnValue = '';
      return '';
    }
  });
})();
