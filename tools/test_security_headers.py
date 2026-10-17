#!/usr/bin/env python3
"""
Verification suite for Subresource Integrity (D7) and HTTP Security Headers / CSP (D6).
Verifies index.html script tags, _headers directives, and local_server.py response headers.
"""
import io
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent

KNOWN_SRI = {
    "hls.js": {
        "url_pattern": r"cdn\.jsdelivr\.net/npm/hls\.js@1\.5\.8",
        "expected_hash": "sha384-xLhS5rbIdhv65H3GLX+caQgMSiEK/Hkw8Z6HITolgRxvXs0omcbeYD639tkJ2Wu6",
    },
    "artplayer": {
        "url_pattern": r"cdn\.jsdelivr\.net/npm/artplayer@5\.1\.7",
        "expected_hash": "sha384-LjKKmyj09xPIr/srcAiLFrPjAMi28Sz1pQNHGLknpHAebKxQXQb/UtuCeMBPbl2P",
    },
}

REQUIRED_CSP_DIRECTIVES = [
    ("default-src", ["'self'"]),
    ("script-src", ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"]),
    ("style-src", ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"]),
    ("font-src", ["'self'", "https://fonts.gstatic.com"]),
    ("img-src", ["'self'", "data:", "blob:", "https://image.tmdb.org"]),
    ("media-src", ["'self'", "blob:", "http:", "https:"]),
    ("connect-src", ["'self'", "https://api.themoviedb.org", "https://api.aniskip.com"]),
    ("frame-src", ["'self'", "https://embedplayer2.xyz", "https://superflixapi.top", "https://mgeb.top"]),
    ("frame-ancestors", ["'self'"]),
    ("worker-src", ["'self'", "blob:"]),
    ("object-src", ["'none'"]),
    ("base-uri", ["'self'"]),
]


def test_sri_tags():
    print("== 1. Subresource Integrity (SRI) in index.html (D7)")
    failures = 0
    html = (ROOT / "index.html").read_text(encoding="utf-8")

    for lib, spec in KNOWN_SRI.items():
        # Find script tag matching the url pattern
        pattern = rf'<script\s+[^>]*src=[\'"][^\'"]*{spec["url_pattern"]}[^\'"]*[\'"][^>]*>'
        m = re.search(pattern, html, re.I)
        if not m:
            print(f"  FAIL {lib}: script tag not found in index.html")
            failures += 1
            continue

        tag = m.group(0)
        # Check integrity
        im = re.search(r'integrity=[\'"]([^\'"]+)[\'"]', tag, re.I)
        if not im:
            print(f"  FAIL {lib}: missing integrity attribute in {tag}")
            failures += 1
            continue
        actual_hash = im.group(1).strip()
        hash_ok = actual_hash == spec["expected_hash"]
        if not hash_ok:
            print(f"  FAIL {lib}: integrity hash mismatch: expected {spec['expected_hash']}, got {actual_hash}")
            failures += 1
        else:
            print(f"  OK   {lib}: integrity hash verified ({actual_hash[:24]}...)")

        # Check crossorigin="anonymous"
        cors_ok = bool(re.search(r'crossorigin=[\'"]anonymous[\'"]', tag, re.I))
        if not cors_ok:
            print(f"  FAIL {lib}: missing crossorigin=\"anonymous\" in {tag}")
            failures += 1
        else:
            print(f"  OK   {lib}: crossorigin=\"anonymous\" present")

    return failures


def test_headers_file():
    print("\n== 2. Cloudflare _headers Configuration (D6)")
    failures = 0
    headers_text = (ROOT / "_headers").read_text(encoding="utf-8")

    # Check global /* block
    global_block = re.search(r'/\*\s*\n((?:\s+[^\n]+\n)+)', headers_text)
    if not global_block:
        print("  FAIL: missing global '/*' rule block in _headers")
        return 1

    lines = [line.strip() for line in global_block.group(1).splitlines() if line.strip() and not line.strip().startswith("#")]
    headers_dict = {}
    for line in lines:
        if ":" in line:
            k, v = line.split(":", 1)
            headers_dict[k.strip().lower()] = v.strip()

    # Check standard security headers
    expected_headers = {
        "x-content-type-options": "nosniff",
        "referrer-policy": "strict-origin-when-cross-origin",
        "x-frame-options": "SAMEORIGIN",
    }
    for h, expected in expected_headers.items():
        actual = headers_dict.get(h)
        if actual == expected:
            print(f"  OK   _headers has {h}: {actual}")
        else:
            print(f"  FAIL _headers missing or incorrect {h}: expected '{expected}', got '{actual}'")
            failures += 1

    if "permissions-policy" in headers_dict:
        print(f"  OK   _headers has permissions-policy: {headers_dict['permissions-policy'][:40]}...")
    else:
        print("  FAIL _headers missing permissions-policy")
        failures += 1

    # Check CSP directives
    csp = headers_dict.get("content-security-policy", "")
    if not csp:
        print("  FAIL: missing Content-Security-Policy in _headers /*")
        return failures + 1

    print("  OK   Content-Security-Policy present, verifying directives:")
    for directive, required_tokens in REQUIRED_CSP_DIRECTIVES:
        dir_match = re.search(rf'\b{directive}\s+([^;]+)', csp)
        if not dir_match:
            print(f"    FAIL missing directive '{directive}'")
            failures += 1
            continue
        tokens = dir_match.group(1).split()
        missing = [t for t in required_tokens if t not in tokens]
        if missing:
            print(f"    FAIL directive '{directive}' missing required tokens: {missing}")
            failures += 1
        else:
            print(f"    OK   directive '{directive}' ({len(tokens)} tokens)")

    return failures


def test_local_server_headers():
    print("\n== 3. Local Server HTTP Headers Parity (local_server.py)")
    failures = 0
    import importlib.util
    spec = importlib.util.spec_from_file_location("local_server", ROOT / "tools" / "local_server.py")
    ls = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ls)

    class TestHandler(ls.DevAPIHandler):
        def __init__(self, method, path, headers=None):
            self.rfile = io.BytesIO()
            self.wfile = io.BytesIO()
            self.command = method
            self.path = path
            self.request_version = "HTTP/1.1"
            self.headers = headers or {}
            self.server = type("Server", (), {})()
            self.client_address = ("127.0.0.1", 12345)
            self._headers_buffer = []

        def send_response(self, code, message=None):
            self.status_code = code
            self.response_headers = {}

        def send_header(self, keyword, value):
            self.response_headers.setdefault(keyword.lower(), []).append(value)

        def end_headers(self):
            super().end_headers()

    h = TestHandler("GET", "/health")
    h.do_GET()

    # Check security headers on /health response
    for name in ["x-content-type-options", "referrer-policy", "x-frame-options", "permissions-policy"]:
        vals = h.response_headers.get(name)
        if vals and len(vals) == 1:
            print(f"  OK   local_server sends {name}: {vals[0]}")
        else:
            print(f"  FAIL local_server missing or duplicated {name}: {vals}")
            failures += 1

    return failures


def main():
    sri_fails = test_sri_tags()
    headers_fails = test_headers_file()
    local_fails = test_local_server_headers()

    total = sri_fails + headers_fails + local_fails
    print(f"\nResult: {total} failure(s)")
    sys.exit(1 if total > 0 else 0)


if __name__ == "__main__":
    main()
