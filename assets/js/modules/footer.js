/**
 * TVZINHA ONLINE - Site footer (Início, Filmes, Séries, Animes) and the legal panel (Privacidade, Termos de uso, DMCA)
 */
import { switchAppView } from '../navigation/router.js?v=20261020_1311';
import { pushNavLayer, popNavLayer } from '../navigation/historyManager.js?v=20261020_1311';

// Plain text only, written here so the panel needs no other request. Keep the wording accurate: the proxy passes
// video through our servers without storing it, so "não armazena nem envia" is true and "não hospeda" is not said.
const LEGAL_SECTIONS = {
    privacy: {
        title: 'Privacidade',
        paragraphs: [
            'O Tvzinha Online não pede cadastro. Suas preferências, favoritos e o progresso do que você assiste ficam guardados apenas no seu navegador e não são enviados para nós.',
            'Não usamos cookies de rastreamento nem publicidade própria. As visitas são contadas pelo Web Analytics da Cloudflare, de forma anônima e sem cookies.',
            'Para exibir títulos e vídeos, o seu navegador se comunica com serviços de terceiros (TMDB, MyAnimeList, AniSkip e os provedores de vídeo), que têm as próprias políticas. Os servidores externos, abertos em quadro, podem exibir anúncios e usar cookies próprios.',
            'Para apagar tudo o que o site guardou, limpe os dados deste site nas configurações do seu navegador.'
        ]
    },
    terms: {
        title: 'Termos de uso',
        paragraphs: [
            'O Tvzinha Online é gratuito e oferecido como está, sem garantia de disponibilidade de títulos, canais ou fontes.',
            'O site não armazena nem envia arquivos de mídia. Os vídeos são exibidos a partir de provedores de terceiros, responsáveis pelo conteúdo que publicam.',
            'Títulos, imagens e marcas pertencem aos seus respectivos donos. Dados de filmes e séries: TMDB.',
            'Ao usar o site, você concorda em não utilizá-lo para fins ilegais nem para prejudicar o serviço ou outras pessoas.'
        ]
    },
    dmca: {
        title: 'DMCA e pedidos de remoção',
        paragraphs: [
            'O Tvzinha Online não armazena nem envia arquivos de mídia. Os vídeos são exibidos a partir de provedores de terceiros.',
            'Se você é titular dos direitos de uma obra e deseja que ela seja removida do site, envie um pedido com: a identificação da obra, o endereço da página no Tvzinha Online e um meio de contato. Todos os pedidos são analisados, e o que for procedente é retirado do catálogo.',
            'Você também pode pedir a remoção diretamente ao provedor que hospeda o vídeo.',
            'O e-mail para pedidos será publicado aqui em breve.'
        ]
    }
};

function legalModal() {
    return document.getElementById('legal-modal');
}

function isLegalOpen() {
    const modal = legalModal();
    return Boolean(modal) && !modal.classList.contains('hidden');
}

export function openLegalSection(key) {
    const section = LEGAL_SECTIONS[key];
    const modal = legalModal();
    if (!section || !modal) return;
    const wasOpen = isLegalOpen();
    document.getElementById('legal-modal-title').textContent = section.title;
    const body = document.getElementById('legal-modal-body');
    body.textContent = '';
    section.paragraphs.forEach(text => {
        const p = document.createElement('p');
        p.className = 'legal-modal-paragraph';
        p.textContent = text;
        body.appendChild(p);
    });
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.getElementById('btn-close-legal-modal')?.focus();
    if (!wasOpen) pushNavLayer('modal-legal');
}

export function closeLegalModal() {
    const modal = legalModal();
    if (!modal || !isLegalOpen()) return;
    modal.classList.add('hidden');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    popNavLayer();
}

export function setupSiteFooter() {
    const footer = document.getElementById('site-footer');
    if (!footer) return;
    footer.addEventListener('click', (e) => {
        const viewBtn = e.target.closest('[data-footer-view]');
        if (viewBtn) {
            switchAppView(viewBtn.getAttribute('data-footer-view'));
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        const legalBtn = e.target.closest('[data-legal]');
        if (legalBtn) {
            openLegalSection(legalBtn.getAttribute('data-legal'));
            return;
        }
        if (e.target.closest('#btn-footer-top')) window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    const modal = legalModal();
    document.getElementById('btn-close-legal-modal')?.addEventListener('click', closeLegalModal);
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) closeLegalModal();
    });
}
