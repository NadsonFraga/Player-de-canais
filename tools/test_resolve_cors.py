#!/usr/bin/env python3
"""
Verification suite for /api/resolve CORS restriction (D5) and local_server binding (D9).
Tests both Python (local_server.py) and Node (functions/api/resolve.js) for strict parity.
"""
import importlib.util
import io
import json
import pathlib
import subprocess
import sys
import urllib.parse

ROOT = pathlib.Path(__file__).resolve().parent.parent

# 1. Test cases for Origin checking
ORIGIN_CASES = [
    (None, True, "no origin header (same-origin / direct)"),
    ("", True, "empty origin header"),
    ("http://localhost", True, "localhost standard"),
    ("http://localhost:8787", True, "localhost with dev port"),
    ("http://127.0.0.1", True, "loopback ipv4"),
    ("http://127.0.0.1:8787", True, "loopback ipv4 with port"),
    ("http://192.168.0.10:8787", True, "private LAN 192.168.x.x"),
    ("http://192.168.1.100", True, "private LAN 192.168.x.x no port"),
    ("http://10.0.0.5:8787", True, "private LAN 10.x.x.x"),
    ("http://172.16.0.1:8787", True, "private LAN 172.16-31.x.x"),
    ("http://172.31.255.255:8787", True, "private LAN 172.31.x.x upper"),
    ("https://tvzinhaonline.pages.dev", True, "production pages.dev domain"),
    ("https://feat-security.tvzinhaonline.pages.dev", True, "preview pages.dev subdomain"),
    ("https://other-branch.pages.dev", True, "any pages.dev branch preview"),
    ("https://tvzinha.online", True, "custom domain"),
    ("https://sub.tvzinha.online", True, "custom subdomain"),
    # Negative / unauthorized cases
    ("https://evil.com", False, "arbitrary external website"),
    ("https://attacker.pages.dev.evil.com", False, "evil domain spoofing pages.dev suffix"),
    ("https://evilpages.dev", False, "evil domain missing dot before pages.dev"),
    ("http://172.32.0.1:8787", False, "public ip outside 172.16-31 range"),
    ("http://1.1.1.1", False, "public internet IP"),
    ("ftp://localhost", False, "non-http scheme"),
    ("javascript:alert(1)", False, "javascript scheme"),
    ("data:text/html,test", False, "data scheme"),
]


def test_python_origins():
    spec = importlib.util.spec_from_file_location("local_server", ROOT / "tools" / "local_server.py")
    ls = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ls)

    failures = 0
    print("== Python is_allowed_origin (local_server.py)")
    for origin, expected, label in ORIGIN_CASES:
        actual = ls.is_allowed_origin(origin)
        ok = actual == expected
        if not ok:
            failures += 1
        print(f"  {'OK ' if ok else 'FAIL'} {label} ({origin}) -> {actual}")
    return failures, ls


def test_node_origins():
    failures = 0
    print("\n== Node isAllowedOrigin (functions/api/resolve.js)")
    node_script = r"""
    import { pathToFileURL } from "node:url";
    // resolve.js exports isAllowedOrigin (functions/api/tmdb.js uses it too)
    const m = await import(pathToFileURL(process.argv[1]).href);
    const cases = JSON.parse(process.argv[2]);
    const results = cases.map(([origin]) => m.isAllowedOrigin(origin));
    console.log(JSON.stringify(results));
    """
    cmd = ["node", "--input-type=module", "-e", node_script, str(ROOT / "functions" / "api" / "resolve.js"), json.dumps(ORIGIN_CASES)]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        print(f"Node execution failed: {proc.stderr}")
        return 1

    results = json.loads(proc.stdout.strip())
    for (origin, expected, label), actual in zip(ORIGIN_CASES, results):
        ok = actual == expected
        if not ok:
            failures += 1
        print(f"  {'OK ' if ok else 'FAIL'} {label} ({origin}) -> {actual}")
    return failures


class DummyWFile(io.BytesIO):
    pass


class FakeServer:
    pass


def test_handler_dispatch(ls):
    print("\n== Handler Dispatch & HTTP Response Check")
    failures = 0

    class DummySocket:
        def makefile(self, *args, **kwargs):
            return io.BytesIO()

    class TestHandler(ls.DevAPIHandler):
        def __init__(self, method, path, headers=None):
            self.rfile = io.BytesIO()
            self.wfile = io.BytesIO()
            self.command = method
            self.path = path
            self.request_version = "HTTP/1.1"
            self.headers = headers or {}
            self.server = FakeServer()
            self.client_address = ("127.0.0.1", 12345)
            self._headers_buffer = []

        def send_response(self, code, message=None):
            self.status_code = code
            self.response_headers = {}

        def send_header(self, keyword, value):
            self.response_headers[keyword.lower()] = value

        def end_headers(self):
            pass

    # 1. Disallowed origin on GET /api/resolve
    h1 = TestHandler("GET", "/api/resolve?id=123", {"Origin": "https://evil.com"})
    h1.do_GET()
    ok1 = h1.status_code == 403 and b"CORS origin forbidden" in h1.wfile.getvalue()
    if not ok1:
        failures += 1
    print(f"  {'OK ' if ok1 else 'FAIL'} GET /api/resolve from https://evil.com -> 403 Forbidden")

    # 2. Allowed origin on GET /api/resolve
    h2 = TestHandler("GET", "/api/resolve?id=", {"Origin": "https://tvzinhaonline.pages.dev"})
    h2.do_GET()
    ok2 = h2.status_code == 400 and h2.response_headers.get("access-control-allow-origin") == "https://tvzinhaonline.pages.dev"
    if not ok2:
        failures += 1
    print(f"  {'OK ' if ok2 else 'FAIL'} GET /api/resolve from pages.dev -> 400 with reflected Origin header")

    # 3. Disallowed origin on OPTIONS /api/resolve
    h3 = TestHandler("OPTIONS", "/api/resolve", {"Origin": "https://evil.com"})
    h3.do_OPTIONS()
    ok3 = h3.status_code == 403
    if not ok3:
        failures += 1
    print(f"  {'OK ' if ok3 else 'FAIL'} OPTIONS /api/resolve from https://evil.com -> 403 Forbidden")

    # 4. Disallowed origin on /api/stream -> must STILL BE ALLOWED (*) for TV casting
    h4 = TestHandler("OPTIONS", "/api/stream?url=https://test.m3u8", {"Origin": "https://any-tv-app.com"})
    h4.do_OPTIONS()
    ok4 = h4.status_code == 204 and h4.response_headers.get("access-control-allow-origin") == "*"
    if not ok4:
        failures += 1
    print(f"  {'OK ' if ok4 else 'FAIL'} OPTIONS /api/stream maintains open CORS (*) for TV casting")

    return failures


def test_cli_flags():
    print("\n== CLI Arguments Check (local_server.py --help)")
    proc = subprocess.run([sys.executable, str(ROOT / "tools" / "local_server.py"), "--help"], capture_output=True, text=True)
    has_lan = "--lan" in proc.stdout
    has_port = "--port" in proc.stdout
    ok = proc.returncode == 0 and has_lan and has_port
    print(f"  {'OK ' if ok else 'FAIL'} local_server.py accepts --lan and --port flags")
    return 0 if ok else 1


def main():
    py_fails, ls = test_python_origins()
    node_fails = test_node_origins()
    dispatch_fails = test_handler_dispatch(ls)
    cli_fails = test_cli_flags()

    total_failures = py_fails + node_fails + dispatch_fails + cli_fails
    print(f"\nResult: {total_failures} failure(s)")
    sys.exit(1 if total_failures > 0 else 0)


if __name__ == "__main__":
    main()
