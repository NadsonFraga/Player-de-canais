/**
 * TVZINHA ONLINE - TMDB reads through our /api/tmdb route, which adds the key kept as a server secret (D3).
 * `path`: a TMDB path with its query, e.g. "discover/movie?with_genres=16&page=2" (Portuguese is added here).
 */
import { TMDB_PROXY_URL } from './constants.js?v=20261027_1713';

export async function fetchTmdb(path) {
    const relative = `/${String(path).replace(/^\/+/, '')}`;
    const separator = relative.includes('?') ? '&' : '?';
    const res = await fetch(`${TMDB_PROXY_URL}?path=${encodeURIComponent(`${relative}${separator}language=pt-BR`)}`);
    if (!res.ok) throw new Error(`TMDB HTTP error ${res.status}`);
    return res.json();
}
