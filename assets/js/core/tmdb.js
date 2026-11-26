/**
 * TVZINHA ONLINE - TMDB reads through our /api/tmdb route, which adds the key kept as a server secret (D3).
 * `path`: a TMDB path with its query, e.g. "discover/movie?with_genres=16&page=2" (Portuguese is added here).
 */
import { TMDB_PROXY_URL } from './constants.js?v=20261126_1736';

const tmdbMemCache = new Map();
const inflightRequests = new Map();
const MAX_MEM_CACHE_ENTRIES = 150;

export async function fetchTmdb(path) {
    const relative = `/${String(path).replace(/^\/+/, '')}`;
    const separator = relative.includes('?') ? '&' : '?';
    const normalizedKey = `${relative}${separator}language=pt-BR`;

    if (tmdbMemCache.has(normalizedKey)) {
        return tmdbMemCache.get(normalizedKey);
    }

    if (inflightRequests.has(normalizedKey)) {
        return inflightRequests.get(normalizedKey);
    }

    const fetchPromise = (async () => {
        try {
            const res = await fetch(`${TMDB_PROXY_URL}?path=${encodeURIComponent(normalizedKey)}`);
            if (!res.ok) throw new Error(`TMDB HTTP error ${res.status}`);
            const data = await res.json();

            if (tmdbMemCache.size >= MAX_MEM_CACHE_ENTRIES) {
                const oldestKey = tmdbMemCache.keys().next().value;
                tmdbMemCache.delete(oldestKey);
            }
            tmdbMemCache.set(normalizedKey, data);
            return data;
        } finally {
            inflightRequests.delete(normalizedKey);
        }
    })();

    inflightRequests.set(normalizedKey, fetchPromise);
    return fetchPromise;
}
