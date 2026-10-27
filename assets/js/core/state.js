/**
 * TVZINHA ONLINE - Reactive Core Store (Pure EventTarget)
 * Only leaf imports (constants and the profile key, which import nothing else) to keep the data flow one-way
 * and avoid circular dependencies
 */
import { FAVORITES_STORAGE_KEY, FAVORITE_TEAM_KEY } from './constants.js?v=20261027_1439';
import { storageKey, stampFavorite, stampTime, PROFILE_EVENT } from './profileStore.js?v=20261027_1439';

/** Channel favorites and the favorite team of the guest or the active profile. */
function readPersonalChoices() {
    let favorites = new Set();
    let favoriteTeam = null;
    try {
        if (typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem(storageKey(FAVORITES_STORAGE_KEY));
            if (saved) favorites = new Set(JSON.parse(saved));
            // null by default until the person explicitly picks one
            favoriteTeam = localStorage.getItem(storageKey(FAVORITE_TEAM_KEY)) || null;
        }
    } catch (e) {
        console.warn("[Store] Error loading favorites:", e);
    }
    return { favorites, favoriteTeam };
}

class TvzinhaStore extends EventTarget {
    constructor() {
        super();

        const { favorites: initialFavs, favoriteTeam: initialTeam } = readPersonalChoices();

        this._state = {
            currentView: 'tv',
            activeChannel: null,
            channelsData: {},
            activeFilter: 'all',
            searchQuery: '',
            favorites: initialFavs,
            favoriteTeam: initialTeam,
            cachedScheduleFeed: null
        };
    }

    // --- State Accessors (Pure Getters) ---
    getState() {
        return {
            ...this._state,
            favorites: new Set(this._state.favorites)
        };
    }

    get currentView() {
        return this._state.currentView;
    }

    get activeChannel() {
        return this._state.activeChannel;
    }

    get channelsData() {
        return this._state.channelsData;
    }

    get activeFilter() {
        return this._state.activeFilter;
    }

    get searchQuery() {
        return this._state.searchQuery;
    }

    get favorites() {
        return this._state.favorites;
    }

    get favoriteTeam() {
        return this._state.favoriteTeam;
    }

    get cachedScheduleFeed() {
        return this._state.cachedScheduleFeed;
    }

    isFavorite(channelName, category = '') {
        if (!channelName) return false;
        if (category && this._state.favorites.has(`${category}:${channelName}`)) return true;
        if (this._state.favorites.has(channelName)) return true;
        for (const fav of this._state.favorites) {
            if (fav === channelName || fav.endsWith(`:${channelName}`)) {
                return true;
            }
        }
        return false;
    }

    // --- Mutation Actions with Event Dispatch ---

    setCurrentView(view) {
        if (!view || this._state.currentView === view) return;
        const previousView = this._state.currentView;
        this._state.currentView = view;
        this.dispatchEvent(new CustomEvent('view:change', {
            detail: { current: view, previous: previousView }
        }));
    }

    setActiveChannel(channel) {
        this._state.activeChannel = channel ? { ...channel } : null;
        this.dispatchEvent(new CustomEvent('channel:change', {
            detail: { channel: this._state.activeChannel }
        }));
    }

    setChannelsData(data) {
        this._state.channelsData = data || {};
        this.dispatchEvent(new CustomEvent('channels:loaded', {
            detail: { channelsData: this._state.channelsData }
        }));
    }

    setActiveFilter(filter) {
        const safeFilter = filter || 'all';
        if (this._state.activeFilter === safeFilter) return;
        this._state.activeFilter = safeFilter;
        this.dispatchEvent(new CustomEvent('filter:change', {
            detail: { filter: safeFilter }
        }));
    }

    setSearchQuery(query) {
        const safeQuery = (query || '').toLowerCase().trim();
        this._state.searchQuery = safeQuery;
        this.dispatchEvent(new CustomEvent('search:change', {
            detail: { query: safeQuery }
        }));
    }

    toggleFavorite(channelKey) {
        if (!channelKey) return false;
        const favs = this._state.favorites;
        let isNowFav = false;

        // Check exact match or composite key match
        let existingMatch = null;
        if (favs.has(channelKey)) {
            existingMatch = channelKey;
        } else {
            for (const f of favs) {
                if (f === channelKey || f.endsWith(`:${channelKey}`) || channelKey.endsWith(`:${f}`)) {
                    existingMatch = f;
                    break;
                }
            }
        }

        if (existingMatch) {
            favs.delete(existingMatch);
            isNowFav = false;
        } else {
            favs.add(channelKey);
            isNowFav = true;
        }
        // Its time, so a removal reaches the other devices too
        stampFavorite(existingMatch || channelKey, isNowFav);

        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(storageKey(FAVORITES_STORAGE_KEY), JSON.stringify(Array.from(favs)));
            }
        } catch (e) {
            console.warn("[Store] Error saving favorites to storage:", e);
        }

        this.dispatchEvent(new CustomEvent('favorites:change', {
            detail: {
                channelKey,
                isFavorite: isNowFav,
                favorites: new Set(favs)
            }
        }));

        return isNowFav;
    }

    setFavoriteTeam(teamId) {
        const safeTeam = teamId || 'vasco';
        this._state.favoriteTeam = safeTeam;
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(storageKey(FAVORITE_TEAM_KEY), safeTeam);
                stampTime('team');
            }
        } catch (e) {}

        this.dispatchEvent(new CustomEvent('team:change', {
            detail: { favoriteTeam: safeTeam }
        }));
    }

    setCachedScheduleFeed(feed) {
        this._state.cachedScheduleFeed = feed;
        this.dispatchEvent(new CustomEvent('schedule:change', {
            detail: { feed }
        }));
    }

    // --- Subscription Helper ---
    on(eventName, handler) {
        const listener = (event) => handler(event.detail);
        this.addEventListener(eventName, listener);
        return () => this.removeEventListener(eventName, listener);
    }
}

export const store = new TvzinhaStore();

// Another profile: its favorites and team, and the screens that show them redraw
if (typeof window !== 'undefined') {
    window.addEventListener(PROFILE_EVENT, () => {
        const { favorites, favoriteTeam } = readPersonalChoices();
        store._state.favorites = favorites;
        store._state.favoriteTeam = favoriteTeam;
        store.dispatchEvent(new CustomEvent('favorites:change', { detail: { channelKey: null, isFavorite: false, favorites: new Set(favorites) } }));
        store.dispatchEvent(new CustomEvent('team:change', { detail: { favoriteTeam } }));
    });
}
export { TvzinhaStore };
