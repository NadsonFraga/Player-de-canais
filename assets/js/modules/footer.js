/**
 * TVZINHA ONLINE - Site footer (Início, Filmes, Séries, Animes) and the legal panel (Privacidade, Termos de uso, DMCA)
 */
import { switchAppView } from '../navigation/router.js?v=20261028_1625';
import { pushNavLayer, popNavLayer } from '../navigation/historyManager.js?v=20261028_1625';

// Plain text only, written here so the panel needs no other request. Keep the wording accurate: the proxy passes
// video through our servers without storing it, so "não armazena nem envia" is true and "não hospeda" is not said.
// The account paragraphs follow functions/api/account and functions/api/sync.js: change them together.
const LEGAL_SECTIONS = {
    privacy: {
        title: 'Privacidade',
        paragraphs: [
            'O Tvzinha Online pode ser usado sem conta. Sem conta, suas preferências, favoritos e o progresso do que você assiste ficam guardados apenas no seu navegador e não são enviados para nós.',
            'A conta é opcional e não pede e-mail nem nome real. Com uma conta, guardamos: o apelido; a senha e o código de recuperação, apenas de forma embaralhada e sem volta (ninguém consegue lê-los, nem nós); os perfis, com nome e avatar; e, de cada perfil, o que é sincronizado entre aparelhos: Coleção e notas, Continuar assistindo, canais e time favoritos e preferências do player.',
            'Para manter você conectado, usamos um único cookie de sessão, essencial e que a página não consegue ler. Ele é renovado enquanto você usa o site e termina depois de 90 dias sem uso, ou quando você sai da conta. Não guardamos seu endereço IP: para limitar tentativas de senha, usamos um código feito a partir dele, que muda todo dia e não permite descobrir o IP. Os formulários da conta usam o Cloudflare Turnstile para barrar robôs: ele analisa sinais do navegador para confirmar que há uma pessoa, sem uso para publicidade.',
            'Os dados da conta ficam em servidores da Cloudflare. Você pode apagar a conta e tudo o que ela guarda a qualquer momento, em Configurações, Conta, Apagar conta: a exclusão é imediata. Sair da conta remove as cópias dela do aparelho.',
            'Não usamos cookies de rastreamento nem publicidade própria. As visitas são contadas pelo Web Analytics da Cloudflare, de forma anônima e sem cookies.',
            'Para exibir títulos e vídeos, o seu navegador se comunica com serviços de terceiros (TMDB, MyAnimeList, AniSkip e os provedores de vídeo), que têm as próprias políticas. Os servidores externos, abertos em quadro, podem exibir anúncios e usar cookies próprios.',
            'Para apagar o que o site guardou neste aparelho sem conta, limpe os dados deste site nas configurações do seu navegador.'
        ]
    },
    terms: {
        title: 'Termos de uso',
        paragraphs: [
            'O Tvzinha Online é gratuito e oferecido como está, sem garantia de disponibilidade de títulos, canais ou fontes.',
            'O site não armazena nem envia arquivos de mídia. Os vídeos são exibidos a partir de provedores de terceiros, responsáveis pelo conteúdo que publicam.',
            'A conta é gratuita e opcional. Guarde bem a senha e o código de recuperação: como não pedimos e-mail, sem eles não há como recuperar a conta.',
            'Contas usadas para abusar do serviço, atacar o site ou prejudicar outras pessoas podem ser removidas. As contas, os perfis e a sincronização podem mudar ou deixar de existir; quando possível, avisaremos no site com antecedência.',
            'Títulos, imagens e marcas pertencem aos seus respectivos donos. Dados de filmes e séries: TMDB. Avatares: Lorelei, de Lisa Wischofsky, e Notionists, de Zoish (CC0).',
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
