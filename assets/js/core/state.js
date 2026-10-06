/**
 * TVZINHA ONLINE - Reactive Core Store (Pure EventTarget)
 * Zero external imports to ensure absolute unidirectional data flow and avoid circular dependencies
 */

class TvzinhaStore extends EventTarget {
    constructor() {
        super();

        // Safely load initial favorites from localStorage
        let initialFavs = new Set();
        try {
            if (typeof localStorage !== 'undefined') {
                const saved = localStorage.getItem("tvzinha_favorites");
                if (saved) {
                    initialFavs = new Set(JSON.parse(saved));
                }
            }
        } catch (e) {
            console.warn("[Store] Error loading initial favorites:", e);
        }

        // Safely load initial favorite team (null by default until user explicitly picks one)
        let initialTeam = null;
        try {
            if (typeof localStorage !== 'undefined') {
                const savedTeam = localStorage.getItem("tvzinha_favorite_team");
                if (savedTeam) initialTeam = savedTeam;
            }
        } catch (e) {}

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

        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem("tvzinha_favorites", JSON.stringify(Array.from(favs)));
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
                localStorage.setItem("tvzinha_favorite_team", safeTeam);
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
export { TvzinhaStore };
