/**
 * TVZINHA ONLINE - Player and server groups of the movie and series/anime selectors
 *
 * Names, from the top down (the same words everywhere the viewer reads them):
 *   Players (sem anúncios)  "Player Principal", "Player Animes": our own players
 *     Fonte                 each link a player tries, "fonte 2 de 5"
 *       Qualidade           the resolutions of a fonte (1080p, 720p...)
 *   Servidores externos     other sites' players in an iframe, "Servidor 1 (MGEB)"...
 * Live TV uses the same words: its Player Principal lists its fontes, and its iframes are servidores externos.
 */
import { escapeHtml } from './sanitize.js?v=20261028_1919';

/**
 * How a live channel's direct link reads: a fonte of its Player Principal. `data/canais.json` names them
 * "Servidor 1 (Principal)", "Sinal 2 (Backup)" or "SP (Principal)": "Fonte 1 (Principal)", "Fonte 2 (Backup)",
 * "Fonte 1 · SP (Principal)".
 */
export function liveSourceLabel(source, index) {
    const name = String((source && source.name) || '').trim();
    const detail = name.replace(/^(servidor|sinal|fonte)\s*\d+\s*/i, '').trim();
    if (!detail) return `Fonte ${index + 1}`;
    return detail.startsWith('(') ? `Fonte ${index + 1} ${detail}` : `Fonte ${index + 1} · ${detail}`;
}

/** Title of one group: the name and a short neutral tag. */
function groupBlock(title, tag) {
    const block = document.createElement('div');
    block.className = 'server-group-block';
    block.innerHTML = `
        <div class="servers-section-title">
            <span>${escapeHtml(title)}</span>
            <span class="server-group-tag">${escapeHtml(tag)}</span>
        </div>
        <div class="movie-servers-grid"></div>
    `;
    return block;
}

/**
 * Fills `container` with the "Players" group (servers with `isNative`) and the "Servidores externos" group, each one
 * only when it has servers. `buildButton(server)` returns the button for one server.
 */
export function renderServerGroups(container, servers, buildButton) {
    if (!container) return;
    container.innerHTML = '';
    const groups = [
        { title: 'Players', tag: 'Sem anúncios', list: servers.filter(s => s.isNative) },
        { title: 'Servidores externos', tag: 'Iframe', list: servers.filter(s => !s.isNative) }
    ];
    groups.forEach(({ title, tag, list }) => {
        if (!list.length) return;
        const block = groupBlock(title, tag);
        const grid = block.querySelector('.movie-servers-grid');
        list.forEach(server => grid.appendChild(buildButton(server)));
        container.appendChild(block);
    });
}
