"""
Anime title lookup test for /api/resolve (type=anime, lang=sub).

Sends the same parameters the frontend sends (pt-BR TMDB name, season name,
absolute episode) and checks which MyAnimeList id the resolver picked.

Usage:
    python tools/local_server.py                 (in another terminal)
    python tools/test_anime_lookup.py            (title only: what the frontend sends today)
    python tools/test_anime_lookup.py --original (also sends original_title and the first air year, what the frontend sends now)
    python tools/test_anime_lookup.py --mal      (also sends mal_id: server skips the MAL lookup)
    python tools/test_anime_lookup.py --only=frieren,jjk2 --base=http://127.0.0.1:8787
    python tools/test_anime_lookup.py --warm     (keep the server caches; default clears them before every case)
"""
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")

# key, pt-BR TMDB name, TMDB original_name, season, season name (as TMDB returns it), expected MAL id
CASES = [
    ("frieren",   "Frieren e a Jornada para o Além",     "葬送のフリーレン",                 1, "Temporada 1",                   52991),
    ("aot1",      "Attack on Titan",                     "進撃の巨人",                       1, "Temporada 1",                   16498),
    ("aot4",      "Attack on Titan",                     "進撃の巨人",                       4, "Temporada 4",                   40028),
    ("jjk1",      "Jujutsu Kaisen",                      "呪術廻戦",                         1, "Temporada 1",                   40748),
    ("jjk2",      "Jujutsu Kaisen",                      "呪術廻戦",                         2, "Temporada 2",                   51009),
    ("demon",     "Demon Slayer: Kimetsu no Yaiba",      "鬼滅の刃",                         1, "Demon Slayer: Kimetsu no Yaiba", 38000),
    ("naruto",    "Naruto",                              "ナルト",                           1, "Temporada 1",                   20),
    ("onepiece",  "One Piece",                           "ワンピース",                       1, "East Blue",                     21),
    # One Piece: every saga (TMDB season) is the same MAL entry (21, absolute episodes)
    ("op2",       "One Piece",                           "ワンピース",                       2, "Whiskey Peak & Little Garden",  21),
    ("op4",       "One Piece",                           "ワンピース",                       4, "Alabasta",                      21),
    ("op6",       "One Piece",                           "ワンピース",                       6, "Skypiea",                       21),
    ("op9",       "One Piece",                           "ワンピース",                       9, "Enies Lobby",                   21),
    ("op13",      "One Piece",                           "ワンピース",                      13, "Impel Down & Marineford",       21),
    ("op16",      "One Piece",                           "ワンピース",                      16, "Dressrosa (1)",                 21),
    ("op21",      "One Piece",                           "ワンピース",                      21, "País de Wano",                  21),
    ("op23",      "One Piece",                           "ワンピース",                      23, "Elbaph",                        21),
    # Naruto (TMDB seasons 1-4) and Naruto Shippuden (21 seasons): one MAL entry each (20 and 1735)
    ("naruto3",   "Naruto",                              "ナルト",                           3, "Temporada 3",                   20),
    ("naruto4",   "Naruto",                              "ナルト",                           4, "Temporada 4",                   20),
    ("shippu1",   "Naruto Shippuden",                    "ナルト 疾風伝",                    1, "Temporada 1",                   1735),
    ("shippu5",   "Naruto Shippuden",                    "ナルト 疾風伝",                    5, "Temporada 5",                   1735),
    ("shippu20",  "Naruto Shippuden",                    "ナルト 疾風伝",                   20, "Temporada 20",                  1735),
    # Held-out titles (not used while tuning the ranking): translated pt-BR name, same title in two eras, bracketed title
    ("zodiaco",   "Os Cavaleiros do Zodíaco",            "聖闘士星矢",                       1, "Temporada 1",                   1254),
    ("hxh2011",   "Hunter x Hunter",                     "HUNTER×HUNTER",                    1, "Temporada 1",                   11061),
    ("hxh1999",   "Hunter x Hunter",                     "HUNTER×HUNTER",                    1, "Temporada 1",                   136),
    ("oshinoko",  "【OSHI NO KO】",                      "【推しの子】",                     1, "Temporada 1",                   52034),
    ("deathnote", "Death Note",                         "DEATH NOTE",                       1, "Temporada 1",                   1535),
    ("fmab",      "Fullmetal Alchemist: Brotherhood",    "鋼の錬金術師 FULLMETAL ALCHEMIST", 1, "Temporada 1",                   5114),
    ("jojo5",     "JoJo's Bizarre Adventure",            "ジョジョの奇妙な冒険",             5, "Stone Ocean",                   48661),
]

# TMDB first_air_date year per case (matched by key prefix); sent together with original_title
YEARS = {"frieren": 2023, "aot": 2013, "jjk": 2020, "demon": 2019, "naruto": 2002, "onepiece": 1999, "op": 1999,
         "shippu": 2007, "deathnote": 2006, "fmab": 2009, "jojo": 2012, "zodiaco": 1986, "hxh2011": 2011,
         "hxh1999": 1999, "oshinoko": 2023}


def year_for(key):
    for prefix in sorted(YEARS, key=len, reverse=True):
        if key.startswith(prefix):
            return YEARS[prefix]
    return 0


args = {a.lstrip("-").split("=")[0]: (a.split("=", 1)[1] if "=" in a else True) for a in sys.argv[1:]}
base = args.get("base", "http://127.0.0.1:8787")
only = set(str(args["only"]).split(",")) if "only" in args else None
send_original = "original" in args
send_mal = "mal" in args
warm = "warm" in args
TIMEOUT_S = 60


def timing(headers, name):
    match = re.search(rf"{name};dur=(\d+)", headers.get("Server-Timing", ""))
    return int(match.group(1)) if match else None


rows = []
for key, title, original, season, season_name, expected in CASES:
    if only and key not in only:
        continue
    params = {"id": "0", "type": "anime", "lang": "sub", "season": season, "episode": 1,
              "title": title, "season_name": season_name}
    if send_original:
        params["original_title"] = original
        if year_for(key):
            params["year"] = year_for(key)
    if send_mal:
        params["mal_id"] = expected
    url = f"{base}/api/resolve?{urllib.parse.urlencode(params)}"
    if not warm:
        urllib.request.urlopen(f"{base}/__dev/clear-cache", timeout=10).read()
    started = time.time()
    status, mal_id, mal_ms, ok = None, None, None, False
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "TestClient/1.0"}), timeout=TIMEOUT_S) as res:
            status = res.status
            mal_ms = timing(res.headers, "mal")
            data = json.loads(res.read().decode("utf-8"))
            mal_id = (data.get("aniskip") or {}).get("mal_id")
            ok = bool(data.get("success"))
    except urllib.error.HTTPError as err:
        status = err.code
        mal_ms = timing(err.headers, "mal")
    except Exception as err:  # timeout, connection refused
        status = type(err).__name__
    total_ms = int((time.time() - started) * 1000)
    rows.append((key, ok, mal_id == expected, mal_id, expected, mal_ms, total_ms, status))

print(f"mode: original_title={'yes' if send_original else 'no'}  mal_id={'yes' if send_mal else 'no'}  base={base}\n")
print(f"{'case':<10} {'resolved':<9} {'right id':<9} {'mal_id':<8} {'expected':<9} {'mal ms':<8} {'total ms':<9} http")
for key, ok, right, mal_id, expected, mal_ms, total_ms, status in rows:
    print(f"{key:<10} {'yes' if ok else 'NO':<9} {'yes' if right else 'NO':<9} {str(mal_id):<8} {expected:<9} {str(mal_ms):<8} {total_ms:<9} {status}")

total = len(rows)
good = sum(1 for r in rows if r[1] and r[2])
times = sorted(r[6] for r in rows if r[1])
median = times[len(times) // 2] if times else None
fail_times = [r[6] for r in rows if not r[1]]
print(f"\ncorrect: {good}/{total}  median success: {median} ms  slowest failure: {max(fail_times) if fail_times else '-'} ms")
sys.exit(0 if good == total else 1)
