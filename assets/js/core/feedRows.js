/**
 * TVZINHA ONLINE - Catalog rows (the carousels of the Filmes, Séries and Animes tabs).
 *
 * A title shows in one row only: the first row that has it keeps it. Rows that overlap a lot (Fantasia & Isekai
 * against Em alta and Shonen) used to end with 4 to 7 cards out of one TMDB page, so a short row asks TMDB for its
 * next page, up to FEED_MAX_PAGES, and the rows are rebuilt in their original order.
 */

const FEED_ROW_SIZE = 20;
const FEED_MAX_PAGES = 3;

/** First `size` titles of each row, no title in two rows, in the order the rows are given. */
function splitRows(keys, items, size) {
    const seen = new Set();
    const rows = {};
    for (const key of keys) {
        rows[key] = [];
        for (const item of items[key]) {
            if (rows[key].length >= size) break;
            if (item && item.id && !seen.has(item.id)) {
                seen.add(item.id);
                rows[key].push(item);
            }
        }
    }
    return rows;
}

/**
 * Builds the rows of a catalog tab. `sources` maps each row name, in display order, to `fetchPage(n)` returning the
 * TMDB results of page n; `keep(item)` drops titles that must not show (not released yet). A failed page counts as
 * empty, so one bad row never blanks the others.
 */
export async function buildFeedRows(sources, keep = () => true) {
    const keys = Object.keys(sources);
    const items = Object.fromEntries(keys.map(key => [key, []]));
    const exhausted = new Set();
    const fetchInto = async (key, page) => {
        const results = await Promise.resolve(sources[key](page)).catch(() => []);
        if (!results || !results.length) exhausted.add(key);
        items[key].push(...(results || []).filter(keep));
    };

    await Promise.all(keys.map(key => fetchInto(key, 1)));
    let rows = splitRows(keys, items, FEED_ROW_SIZE);
    for (let page = 2; page <= FEED_MAX_PAGES; page++) {
        const short = keys.filter(key => rows[key].length < FEED_ROW_SIZE && !exhausted.has(key));
        if (!short.length) break;
        await Promise.all(short.map(key => fetchInto(key, page)));
        rows = splitRows(keys, items, FEED_ROW_SIZE);
    }
    return rows;
}
