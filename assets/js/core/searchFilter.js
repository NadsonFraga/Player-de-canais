/**
 * TVZINHA ONLINE - Text search with the catalog filters (genre, period, order).
 *
 * TMDB's search endpoint takes only the text: genre, period and order are ignored there, so a search for "2000" with
 * "Anos 90" listed films from 2007 and 2021. When text and a filter are both active, the first pages of the search
 * are gathered, filtered and sorted here, and paginated locally. The result has the same shape as a TMDB page.
 */

const SEARCH_MAX_PAGES = 5;
const SEARCH_PAGE_SIZE = 20;

let lastKey = '';
let lastItems = null;

/** Year range "1990-1999" -> [1990, 1999], or null. */
export function parseYearRange(range) {
    const parts = String(range || '').split('-').map(Number);
    return parts.length === 2 && parts.every(Number.isFinite) ? parts : null;
}

/** True when the item's date (YYYY-MM-DD) falls inside the year range; items without a date are left out. */
export function inYearRange(dateText, range) {
    const years = parseYearRange(range);
    if (!years) return true;
    const year = parseInt(String(dateText || '').slice(0, 4), 10);
    return Number.isFinite(year) && year >= years[0] && year <= years[1];
}

function sortItems(items, sort, dateField) {
    const [field, direction] = String(sort || '').split('.');
    // The default order of a text search is relevance, which matches what people typed better than popularity
    if (!field || field === 'popularity') return items;
    const value = item => field.includes('date') ? String(item[dateField] || '') : Number(item[field] || 0);
    const sign = direction === 'asc' ? 1 : -1;
    return [...items].sort((a, b) => (value(a) > value(b) ? sign : value(a) < value(b) ? -sign : 0));
}

/**
 * One page of filtered search results, shaped like a TMDB response ({ page, results, total_pages, total_results }).
 * `fetchPage(n)` returns TMDB page n of the search; `keep(item)` applies the filters; `key` identifies the search
 * (text + filters) so changing pages reuses what was already fetched.
 */
export async function filteredSearchPage({ key, fetchPage, keep, sort, dateField, page = 1 }) {
    if (key !== lastKey || !lastItems) {
        const first = await fetchPage(1);
        const pages = Math.min(SEARCH_MAX_PAGES, first.total_pages || 1);
        const rest = await Promise.all(Array.from({ length: pages - 1 }, (_, i) => fetchPage(i + 2).catch(() => ({ results: [] }))));
        const seen = new Set();
        const items = [first, ...rest].flatMap(data => data.results || []).filter(item => {
            if (!item || seen.has(item.id)) return false;
            seen.add(item.id);
            return keep(item);
        });
        lastItems = sortItems(items, sort, dateField);
        lastKey = key;
    }
    const totalPages = Math.max(1, Math.ceil(lastItems.length / SEARCH_PAGE_SIZE));
    const current = Math.min(Math.max(1, page), totalPages);
    return {
        filtered: true,
        page: current,
        results: lastItems.slice((current - 1) * SEARCH_PAGE_SIZE, current * SEARCH_PAGE_SIZE),
        total_pages: totalPages,
        total_results: lastItems.length,
    };
}
