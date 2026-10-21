/**
 * TVZINHA ONLINE - What an image shows when it fails to load, without inline handlers (the CSP allows no inline script).
 *
 *   <img data-fallback-src="assets/logos/fav/icon-detailed.svg">  -> that image instead (once)
 *   <img data-fallback="show-next">                               -> hidden, and the element after it shown
 *
 * One listener on the document (load errors do not bubble, so it listens in the capture phase).
 */
export function installImageFallbacks() {
    document.addEventListener('error', (e) => {
        const img = e.target;
        if (!(img instanceof HTMLImageElement)) return;
        const fallback = img.dataset.fallbackSrc;
        if (fallback && img.dataset.fellBack !== '1') {
            // Once: a missing fallback must not loop
            img.dataset.fellBack = '1';
            img.src = fallback;
            return;
        }
        if (img.dataset.fallback === 'show-next') {
            img.style.display = 'none';
            if (img.nextElementSibling) img.nextElementSibling.style.display = 'inline-block';
        }
    }, true);
}
