"""
Checks the /api/tmdb rules (D3) in both implementations, offline:
  - functions/api/tmdb.js (Cloudflare) through Node, with a fake TMDB and a fake key
  - tools/local_server.py (local development)
Same allowed and refused paths, the key added and never taken from the request, 503 without a key, origins refused,
and no TMDB key string left in the site's code.

    python tools/test_tmdb_route.py
"""
import importlib.util
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
FAKE_KEY = "TESTKEY0000000000000000000000000"
failures = 0


def check(name, ok, detail=""):
    global failures
    if not ok:
        failures += 1
    print(f"  {'OK  ' if ok else 'FAIL'} {name}{(' ' + detail) if detail else ''}")


# path -> True when it must be allowed
CASES = {
    "/discover/movie?with_genres=16&page=1&language=pt-BR": True,
    "/movie/123/images": True,
    "/tv/1396/season/2?language=pt-BR": True,
    "/trending/movie/week?language=pt-BR": True,
    "/search/multi?query=matrix&language=pt-BR": True,
    "/tv/1396?api_key=someone-else": True,
    "/account": False,
    "/authentication/token/new": False,
    "/movie/../account": False,
    "movie/1": False,
    "/movie\\x": False,
    "/search/multi?query=a b": False,
    "": False,
}


def python_targets():
    spec = importlib.util.spec_from_file_location("local_server", ROOT / "tools" / "local_server.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return {path: module.tmdb_target(path, FAKE_KEY) for path in CASES}


def node_targets():
    script = f"""
    import {{ tmdbTarget }} from {json.dumps((ROOT / 'functions' / 'api' / 'tmdb.js').as_uri())};
    const cases = {json.dumps(list(CASES))};
    const out = {{}};
    for (const p of cases) {{ const t = tmdbTarget(p, {json.dumps(FAKE_KEY)}); out[p] = t ? t.toString() : null; }}
    console.log(JSON.stringify(out));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], capture_output=True, text=True, cwd=ROOT)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip())
    return json.loads(result.stdout)


def node_handler():
    """Runs onRequestGet with a fake TMDB: answers for a good path, a refused origin and a missing key."""
    script = f"""
    import {{ onRequestGet }} from {json.dumps((ROOT / 'functions' / 'api' / 'tmdb.js').as_uri())};
    const seen = [];
    globalThis.fetch = async (url) => {{ seen.push(String(url)); return new Response('{{"page":1}}', {{ status: 200 }}); }};
    const call = async (origin, env, path) => {{
      const headers = origin ? {{ Origin: origin }} : {{}};
      const request = new Request('https://site.test/api/tmdb?path=' + encodeURIComponent(path), {{ headers }});
      const res = await onRequestGet({{ request, env, waitUntil: () => {{}} }});
      return {{ status: res.status, cors: res.headers.get('Access-Control-Allow-Origin'), cache: res.headers.get('Cache-Control'), body: await res.text() }};
    }};
    const out = {{
      ok: await call('https://tvzinhaonline.pages.dev', {{ TMDB_API_KEY: {json.dumps(FAKE_KEY)} }}, '/movie/1'),
      origin: await call('https://evil.example', {{ TMDB_API_KEY: {json.dumps(FAKE_KEY)} }}, '/movie/1'),
      nokey: await call('https://tvzinhaonline.pages.dev', {{}}, '/movie/1'),
      refused: await call('https://tvzinhaonline.pages.dev', {{ TMDB_API_KEY: {json.dumps(FAKE_KEY)} }}, '/account'),
      seen,
    }};
    console.log(JSON.stringify(out));
    """
    result = subprocess.run(["node", "--input-type=module", "-e", script], capture_output=True, text=True, cwd=ROOT)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip())
    return json.loads(result.stdout)


print("== Path rules (Python and Node)")
py = python_targets()
js = node_targets()
for path, allowed in CASES.items():
    p, j = py[path], js[path]
    same = (p is None) == (j is None)
    right = (p is not None) == allowed
    key_ok = p is None or (p.count("api_key=") == 1 and f"api_key={FAKE_KEY}" in p and "someone-else" not in p)
    check(f"{path!r} {'allowed' if allowed else 'refused'}", same and right and key_ok, "" if same and right and key_ok else f"py={p} js={j}")

print("== Cloudflare handler (fake TMDB)")
h = node_handler()
check("allowed path: 200, TMDB's body, our origin echoed, cached 30 min",
      h["ok"]["status"] == 200 and h["ok"]["body"] == '{"page":1}' and h["ok"]["cors"] == "https://tvzinhaonline.pages.dev" and "max-age=1800" in (h["ok"]["cache"] or ""),
      json.dumps(h["ok"]))
check("other origin: 403", h["origin"]["status"] == 403, json.dumps(h["origin"]))
check("no key configured: 503 tmdb_key_missing", h["nokey"]["status"] == 503 and "tmdb_key_missing" in h["nokey"]["body"], json.dumps(h["nokey"]))
check("refused path: 400 and TMDB not called for it", h["refused"]["status"] == 400 and len(h["seen"]) == 1, json.dumps({"refused": h["refused"], "calls": len(h["seen"])}))
check("TMDB called with the configured key", len(h["seen"]) == 1 and f"api_key={FAKE_KEY}" in h["seen"][0], json.dumps(h["seen"]))

print("== No TMDB key in the code")
leaks = []
for folder in ("assets", "functions"):
    for file in (ROOT / folder).rglob("*.js"):
        text = file.read_text(encoding="utf-8", errors="ignore")
        if re.search(r"api_key=[0-9a-f]{32}|TMDB_API_KEY\s*=\s*['\"][0-9a-f]{32}", text):
            leaks.append(str(file.relative_to(ROOT)))
server = (ROOT / "tools" / "local_server.py").read_text(encoding="utf-8")
if re.search(r"TMDB_API_KEY\s*=\s*['\"][0-9a-f]{32}", server):
    leaks.append("tools/local_server.py")
check("no 32-hex key written in assets/, functions/ or local_server.py", not leaks, ", ".join(leaks))

print(f"\nResult: {failures} failure(s)")
sys.exit(1 if failures else 0)
