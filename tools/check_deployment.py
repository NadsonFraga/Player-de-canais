"""
Checks a deployed copy of the site (a Cloudflare preview or production) over plain HTTP, with no browser.

  python tools/check_deployment.py https://feat-native-player-quality.tvzinhaonline.pages.dev
  python tools/check_deployment.py https://tvzinhaonline.pages.dev

It verifies that the site and its data are public, that internal files are not (including percent-encoded,
doubled-slash and dot-segment variants), and that the Cloudflare functions answer. It sends only a handful of
requests (one MyAnimeList search, one host lookup per anime case), so it is safe to run after every deploy.
"""
import http.client
import json
import sys
import time
import urllib.parse
import urllib.request
import urllib.error

sys.stdout.reconfigure(encoding="utf-8")
BASE = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else ""
if not BASE.startswith("http"):
    sys.exit("usage: python tools/check_deployment.py <https://site>")
HOST = urllib.parse.urlparse(BASE).netloc
failures = 0

# Strings that only appear in internal files, never in the public page
INTERNAL_MARKERS = [b"Archives & Documentation", b"Working rules", b"DevAPIHandler", b"update_matches", b"BLOCKED_PREFIXES", b"work-queue"]


def fetch(raw_path, timeout=60):
    """GET with the path exactly as given (no client-side normalization)."""
    started = time.time()
    conn = http.client.HTTPSConnection(HOST, timeout=timeout)
    try:
        conn.request("GET", raw_path, headers={"User-Agent": "Mozilla/5.0 DeploymentCheck", "Host": HOST})
        res = conn.getresponse()
        body = res.read()
        return res.status, body, dict(res.getheaders()), int((time.time() - started) * 1000)
    except Exception as err:
        return 0, str(err).encode(), {}, int((time.time() - started) * 1000)
    finally:
        conn.close()


def check(name, ok, detail=""):
    global failures
    failures += 0 if ok else 1
    print(f"  {'OK  ' if ok else 'FAIL'} {name} {detail}")


print("== site and data are public")
for path in ["/", "/assets/js/main.js", "/assets/css/10-player-v3.css", "/data/canais.json", "/assets/logos/fav/site.webmanifest"]:
    status, body, _, ms = fetch(path)
    check(path, status == 200 and len(body) > 100, f"HTTP {status}, {len(body) // 1024} KB, {ms} ms")

print("\n== internal files are not served (HTTP 404, or the plain home page, never the file)")
blocked = [
    "/CLAUDE.md", "/tools/local_server.py", "/tools/test_path_block.mjs", "/.archives/README.md", "/.archives/plans/work-queue.md",
    "/.github/workflows/update_matches.yml", "/.gitignore", "/_headers", "/docs/CHAT_HISTORY.md", "/.archives/history/CHAT_HISTORY.md",
    # encoded, doubled and dot-segment ways of asking for the same files
    "/%2Earchives/README.md", "/%2e%61rchives/README.md", "/.%61rchives/README.md", "/.archives%2FREADME.md",
    "/t%6Fols/local_server.py", "/tools%2Flocal_server.py", "/%43LAUDE.md", "/CLAUDE%2Emd", "/.%67ithub/workflows/update_matches.yml",
    "//tools/local_server.py", "///.archives/README.md", "/./tools/local_server.py", "/assets/../tools/local_server.py",
    "/assets/%2e%2e/tools/local_server.py", "/tools%5Clocal_server.py",
]
for path in blocked:
    status, body, _, _ = fetch(path)
    leaked = status == 200 and any(marker in body for marker in INTERNAL_MARKERS)
    # a 200 with the site's home page is Cloudflare's fallback for unknown addresses: harmless
    check(path, not leaked and status in (200, 404), f"HTTP {status}, {len(body)} bytes{' - LEAKED' if leaked else ''}")

print("\n== Cloudflare functions")
q = urllib.parse.urlencode({"type": "anime", "lang": "sub", "mal_id": 813, "season": 9, "episode": 31, "absolute_episode": 284, "total_episodes": 291, "title": "t"})
status, body, headers, ms = fetch("/api/resolve?" + q)
data = json.loads(body) if status == 200 else {}
check("anime resolve, whole-show entry uses the absolute number (284)", status == 200 and (data.get("aniskip") or {}).get("episode") == 284, f"HTTP {status}, {ms} ms")
stream_url = (data.get("primary_source") or {}).get("stream_url", "")
subs = [s.get("lang") for s in data.get("subtitles", [])]
check("subtitles are only Portuguese and English", all(lang in ("pt-BR", "pt", "en") for lang in subs), str(subs))
q = urllib.parse.urlencode({"type": "anime", "lang": "sub", "id": 209867, "season": 1, "episode": 1, "title": "Frieren e a Jornada para o Além",
                            "original_title": "葬送のフリーレン", "year": 2023, "season_name": "Temporada 1"})
status, body, headers, ms = fetch("/api/resolve?" + q)
data = json.loads(body) if body[:1] == b"{" else {}
check("pt-BR title resolves through the original name (MyAnimeList 52991)", status == 200 and (data.get("aniskip") or {}).get("mal_id") == 52991, f"HTTP {status}, {ms} ms")
if stream_url:
    path = "/" + stream_url.split("//", 1)[1].split("/", 1)[1]
    status, body, headers, ms = fetch(path)
    check("stream proxy returns a playlist", status == 200 and b"#EXTM3U" in body[:20], f"HTTP {status}, {len(body)} bytes")

print(f"\n{'ALL PASSED' if not failures else str(failures) + ' FAILED'}")
sys.exit(1 if failures else 0)
