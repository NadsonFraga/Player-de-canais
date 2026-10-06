/**
 * TVZINHA ONLINE - Application Core Constants
 * Central registry for API endpoints, static keys, and persistent configurations
 */

// TMDB Movies & Series Engine
export const TMDB_API_KEY = '2dca580c2a14b55200e784d157207b4d';
export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const TMDB_IMG_W500 = 'https://image.tmdb.org/t/p/w500';
export const TMDB_IMG_ORIGINAL = 'https://image.tmdb.org/t/p/original';

// LocalStorage Cache Keys & TTL
export const TMDB_CACHE_KEY = 'tvzinha_movies_cache_v4';
export const TMDB_CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
export const TMDB_SERIES_CACHE_KEY = 'tvzinha_series_cache_v4';
export const TMDB_ANIMES_CACHE_KEY = 'tvzinha_animes_cache_v4';
export const WATCH_PROGRESS_KEY = 'tvzinha_watch_progress_v1';
export const FAVORITES_STORAGE_KEY = 'tvzinha_favorites';
export const FAVORITE_TEAM_KEY = 'tvzinha_favorite_team';

// Native Stream Engine Proxy URL
export const STREAM_ENGINE_API_BASE = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port === '8787'))
    ? `${window.location.protocol}//${window.location.hostname}:${window.location.port || '8787'}`
    : '';

// Soccer / Matches Feed Endpoints
export const GITHUB_RAW_FEED_URL = 'https://raw.githubusercontent.com/NadsonFraga/Player-de-canais/data/proximos_jogos.json';

// Curated Masters of Cinema (Directors)
export const FAMOUS_DIRECTORS = [
    { id: 525, name: "Christopher Nolan", knownFor: "Ficção & Suspense", photo: "https://image.tmdb.org/t/p/w300/kWogkBJKzXFJSY8cZpuzanfsaFi.jpg" },
    { id: 138, name: "Quentin Tarantino", knownFor: "Ação & Diálogos", photo: "https://image.tmdb.org/t/p/w300/1gjcpAa99FAOWGnrUvHEXXsRs7o.jpg" },
    { id: 488, name: "Steven Spielberg", knownFor: "Aventura & Épicos", photo: "https://image.tmdb.org/t/p/w300/tZxcg19YQ3e8fJ0pOs7hjlnmmr6.jpg" },
    { id: 1032, name: "Martin Scorsese", knownFor: "Crime & Drama", photo: "https://image.tmdb.org/t/p/w300/g3DjfKsgZQWZiw30I20hZVk1oMX.jpg" },
    { id: 137427, name: "Denis Villeneuve", knownFor: "Ficção Científica", photo: "https://image.tmdb.org/t/p/w300/xzQYqb4nR8xT7Zdw5itbEL9K3fd.jpg" },
    { id: 608, name: "Hayao Miyazaki", knownFor: "Animação & Fantasia", photo: "https://image.tmdb.org/t/p/w300/ouhjt9KugzhWtdEyBPipihB3ic8.jpg" },
    { id: 2710, name: "James Cameron", knownFor: "Grandes Bilheterias", photo: "https://image.tmdb.org/t/p/w300/2Hh4Jos62luf90CCglP5K32qaWO.jpg" },
    { id: 240, name: "Stanley Kubrick", knownFor: "Clássicos & Cults", photo: "https://image.tmdb.org/t/p/w300/yFT0VyIelI9aegZrsAwOG5iVP4v.jpg" },
    { id: 7467, name: "David Fincher", knownFor: "Suspense Psicológico", photo: "https://image.tmdb.org/t/p/w300/tpEczFclQZeKAiCeKZZ0adRvtfz.jpg" },
    { id: 10828, name: "Guillermo del Toro", knownFor: "Fantasia & Monstros", photo: "https://image.tmdb.org/t/p/w300/cWvt8FdPAH0j3QtLzAN1j7ZJJrr.jpg" },
    { id: 510, name: "Tim Burton", knownFor: "Gótico & Fantasia", photo: "https://image.tmdb.org/t/p/w300/yHEHAHQpN9PfSEQx1UxZPczhcAi.jpg" },
    { id: 291263, name: "Jordan Peele", knownFor: "Terror & Crítica", photo: "https://image.tmdb.org/t/p/w300/kFUKn5g3ebpyZ3CSZZZo2HFWRNQ.jpg" }
];

// Curated Famous Studios & Universes
export const FAMOUS_STUDIOS = [
    { id: 420, name: "Marvel Studios", badge: "MCU", logo: "https://image.tmdb.org/t/p/w500/hUzeosd33nzE5MCNsZxCGEKTXaQ.png" },
    { id: 174, name: "Warner Bros", badge: "WB & DC", logo: "https://image.tmdb.org/t/p/w500/zhD3hhtKB5qyv7ZeL4uLpNxgMVU.png" },
    { id: 2, name: "Walt Disney", badge: "Disney", logo: "https://image.tmdb.org/t/p/w500/wdrCwmRnLFJhEoH8GSfymY85KHT.png" },
    { id: 3, name: "Pixar", badge: "Pixar Animation", logo: "https://image.tmdb.org/t/p/w500/1TjvGVDMYsj6JBxOAkUHpPEwLf7.png" },
    { id: 10342, name: "Studio Ghibli", badge: "Ghibli", logo: "https://image.tmdb.org/t/p/w500/uFuxPEZRUcBTEiYIxjHJq62Vr77.png" },
    { id: 41077, name: "A24", badge: "Cinema Cult", logo: "https://image.tmdb.org/t/p/w500/1ZXsGaFPgrgS6ZZGS37AqD5uU12.png" },
    { id: 33, name: "Universal Pictures", badge: "Universal", logo: "https://image.tmdb.org/t/p/w500/8lvHyhjr8oUKOOy2dKXoALWKdp0.png" },
    { id: 4, name: "Paramount", badge: "Paramount", logo: "https://image.tmdb.org/t/p/w500/jay6WcMgagAklUt7i9Euwj1pzTF.png" },
    { id: 5, name: "Columbia Pictures", badge: "Sony / Columbia", logo: "https://image.tmdb.org/t/p/w500/71BqEFAF4V3qjjMPCpLuyJFB9A.png" },
    { id: 3172, name: "Blumhouse", badge: "Terror & Suspense", logo: "https://image.tmdb.org/t/p/w500/rzKluDcRkIwHZK2pHsiT667A2Kw.png" },
    { id: 521, name: "DreamWorks", badge: "DreamWorks", logo: "https://image.tmdb.org/t/p/w500/3BPX5VGBov8SDqTV7wC1L1xShAS.png" }
];

// Verified Legacy Movie Servers
export const MOVIE_SERVERS = [
    { id: 'native_direct', name: 'Player Nativo - Sem Anúncios (BETA)', isNative: true },
    { id: 'mgeb',      name: 'Servidor 1 (MGEB - Principal)', buildUrl: (id) => `https://mgeb.top/embed/${id}` },
    { id: 'superflix', name: 'Servidor 2 (SuperFlix)', buildUrl: (id) => `https://superflixapi.quest/filme/${id}` },
    { id: 'myembed',   name: 'Servidor 3 (MyEmbed)', buildUrl: (id) => `https://myembed.biz/filme/${id}` },
    { id: 'vsembed',   name: 'Servidor 4 (VSEmbed - Multi-Áudio)', buildUrl: (id) => `https://vsembed.ru/embed/movie/${id}?ds_lang=pob,pt,en` },
    { id: 'embedplay', name: 'Servidor 5 (EmbedPlay)', buildUrl: (id) => `https://www.embedplay.one/filme/${id}` },
    { id: 'fembed',    name: 'Servidor 6 (FEmbed)', buildUrl: (id) => `https://fembed.lol/filme/e/${id}` }
];

// Verified Series & Animes Servers
export const SERIES_SERVERS = {
    mgeb: {
        name: "MGEB",
        buildUrl: (id, s, e) => `https://mgeb.top/embed/serie/${id}/${s}/${e}`
    },
    superflix: {
        name: "Superflix",
        buildUrl: (id, s, e) => `https://superflixapi.quest/serie/${id}/${s}/${e}`
    },
    myembed: {
        name: "MyEmbed",
        buildUrl: (id, s, e) => `https://myembed.biz/embed/tv/${id}/${s}/${e}`
    },
    warezcdn: {
        name: "WarezCDN",
        buildUrl: (id, s, e) => `https://embed.warezcdn.net/serie/${id}/${s}/${e}`
    },
    vsembed: {
        name: "VsEmbed",
        buildUrl: (id, s, e) => `https://vsembed.ru/embed/tv/${id}/${s}/${e}`
    }
};

// Known Soccer Club Crests Map
export const KNOWN_TEAM_CRESTS = {
    "athletico-pr": "https://s.sde.globo.com/media/organizations/2026/01/07/Athletico-PR.svg",
    "atletico-mg": "https://s.sde.globo.com/media/organizations/2018/03/10/atletico-mg.svg",
    "bahia": "https://s.sde.globo.com/media/organizations/2018/03/11/bahia.svg",
    "botafogo": "https://s.sde.globo.com/media/organizations/2019/02/04/botafogo-svg.svg",
    "corinthians": "https://s.sde.globo.com/media/organizations/2024/10/09/Corinthians_2024_Q4ahot4.svg",
    "criciuma": "https://s.sde.globo.com/media/teams/2026/01/16/criciuma-2026-svg-79692.svg",
    "cruzeiro": "https://s.sde.globo.com/media/organizations/2021/02/13/cruzeiro_2021.svg",
    "cuiaba": "https://s.sde.globo.com/media/organizations/2018/12/26/Cuiaba_EC.svg",
    "flamengo": "https://s.sde.globo.com/media/organizations/2018/04/10/Flamengo-2018.svg",
    "fluminense": "https://s.sde.globo.com/media/organizations/2018/03/11/fluminense.svg",
    "fortaleza": "https://s.sde.globo.com/media/organizations/2021/09/19/Fortaleza_2021_1.svg",
    "gremio": "https://s.sde.globo.com/media/organizations/2018/03/12/gremio.svg",
    "internacional": "https://s.sde.globo.com/media/organizations/2018/03/11/internacional.svg",
    "juventude": "https://s.sde.globo.com/media/organizations/2021/04/29/Juventude-2021-01.svg",
    "palmeiras": "https://s.sde.globo.com/media/organizations/2019/07/06/Palmeiras.svg",
    "red-bull-bragantino": "https://s.sde.globo.com/media/organizations/2021/06/28/bragantino.svg",
    "santos": "https://s.sde.globo.com/media/organizations/2018/03/12/santos.svg",
    "sao-paulo": "https://s.sde.globo.com/media/organizations/2018/03/11/sao-paulo.svg",
    "vasco": "https://s.sde.globo.com/media/organizations/2021/09/04/vasco_SVG.svg",
    "vitoria": "https://s.sde.globo.com/media/organizations/2025/12/18/Vitoria_2025.svg",
    "brasil": "https://s.sde.globo.com/media/organizations/2019/07/16/Brasil_rgYHF6Z.svg"
};
