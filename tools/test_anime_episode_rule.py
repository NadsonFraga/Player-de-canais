"""
Checks the anime episode numbering rule, the subtitle filter and the fast failure of /api/resolve.

Each case sends both numberings (season-relative and absolute, as the frontend does) with a known
MyAnimeList id, so MyAnimeList is not queried. The numbering the server really used is read back from
`aniskip.episode`.

Usage:
    python tools/local_server.py                    (in another terminal)
    python tools/test_anime_episode_rule.py [--base=http://127.0.0.1:8787]
"""
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")

base = next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--base=")), "http://127.0.0.1:8787")

# name, mal_id, season, relative, absolute, total episodes of the show (TMDB), expected number sent to the host
EPISODE_CASES = [
    # Whole-show MAL entries: the absolute number is the right one
    ("DBZ S9E31 (single entry)",         813,   9, 31,  284, 291,  284),
    ("DBZ S2E1",                         813,   2,  1,   40, 291,   40),
    ("One Piece S2E1 (single entry)",    21,    2,  1,   62, 1155,  62),
    ("Naruto S3E3 (single entry)",       20,    3,  3,  107, 220,  107),
    ("Shippuden S5E2 (single entry)",    1735,  5,  2,   90, 500,   90),
    # One MAL entry per season: the relative number is the right one
    ("Jujutsu Kaisen S2E5 (own entry)",  51009, 2,  5,   29, 47,     5),
    ("Attack on Titan S2E3 (own entry)", 25777, 2,  3,   28, 87,     3),
    # Season 1 or equal numbers: nothing to decide
    ("DBZ S1E5",                         813,   1,  5,    5, 291,    5),
    ("Attack on Titan S1E25",            16498, 1, 25,   25, 87,    25),
]

failures = 0


def resolve(params):
    url = f"{base}/api/resolve?{urllib.parse.urlencode(params)}"
    started = time.time()
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "TestClient/1.0"}), timeout=90) as res:
            return res.status, json.loads(res.read().decode("utf-8")), int((time.time() - started) * 1000)
    except urllib.error.HTTPError as err:
        return err.code, json.loads(err.read().decode("utf-8")), int((time.time() - started) * 1000)


def clear_caches():
    urllib.request.urlopen(f"{base}/__dev/clear-cache", timeout=10).read()


def check(name, ok, detail=""):
    global failures
    failures += 0 if ok else 1
    print(f"  {'OK  ' if ok else 'FAIL'} {name} {detail}")


print("== Episode numbering rule")
for name, mal_id, season, relative, absolute, total, expected in EPISODE_CASES:
    clear_caches()
    status, data, ms = resolve({"type": "anime", "lang": "sub", "mal_id": mal_id, "season": season, "episode": relative,
                                "absolute_episode": absolute, "total_episodes": total, "title": "t"})
    used = (data.get("aniskip") or {}).get("episode")
    check(name, status == 200 and used == expected, f"sent {used}, expected {expected}, HTTP {status}, {ms} ms")

print("\n== Subtitle filter (Fullmetal Alchemist: Brotherhood has 18 tracks at the host)")
clear_caches()
status, data, _ = resolve({"type": "anime", "lang": "sub", "mal_id": 5114, "season": 1, "episode": 1, "title": "t"})
subs = data.get("subtitles", [])
print("  tracks returned:", [(s["lang"], s["label"], s["default"]) for s in subs])
check("only Portuguese and English", [s["lang"] for s in subs] in (["pt-BR", "en"], ["pt", "en"], ["pt-BR"], ["pt"], ["en"]))
check("Brazilian Portuguese first and default", bool(subs) and subs[0]["lang"] == "pt-BR" and subs[0]["default"] is True)
check("exactly one default", sum(1 for s in subs if s["default"]) == 1)

print("\n== Failure is fast and explicit (title that MyAnimeList cannot match)")
clear_caches()
status, data, ms = resolve({"type": "anime", "lang": "sub", "id": 1, "season": 1, "episode": 1, "title": "zzqx nonexistent anime 9981"})
check("404 with reason anime_not_found", status == 404 and data.get("reason") == "anime_not_found", f"HTTP {status}, reason={data.get('reason')}")
check("answers within 6 s", ms <= 6000, f"{ms} ms")

print(f"\n{'ALL PASSED' if not failures else str(failures) + ' FAILED'}")
sys.exit(1 if failures else 0)
