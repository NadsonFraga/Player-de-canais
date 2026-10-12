"""
Offline test of the stream proxy (/api/stream) in both implementations: functions/api/stream.js (production, run in
Node by tools/test_stream_proxy.mjs with a fake fetch) and tools/local_server.py (local, run here with a fake
urlopen and no socket). Both get the same cases from tools/fixtures/stream_cases.json and are judged by the same rules.

Each case states the behavior wanted after the security work. "positive" cases (what must keep working) must pass
already; "negative" cases (what an attacker could do) document what is still open until the proxy is hardened.

Usage:
    python tools/test_stream_proxy.py            (exit 1 if a positive case fails)
    python tools/test_stream_proxy.py --strict   (exit 1 if any case fails)
"""
import email.message
import importlib.util
import io
import json
import pathlib
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")

ROOT = pathlib.Path(__file__).resolve().parent.parent
FIXTURES = json.loads((ROOT / "tools" / "fixtures" / "stream_cases.json").read_text(encoding="utf-8"))
STRICT = "--strict" in sys.argv


def upstream_body(up):
    if up.get("body_hex"):
        return bytes.fromhex(up["body_hex"])
    if up.get("body_repeat"):
        return (up["body_repeat"]["text"] * up["body_repeat"]["times"]).encode("utf-8")
    return (up.get("body") or "").encode("utf-8")


class FakeResponse:
    def __init__(self, status, headers, body, url):
        self.status = status
        self.headers = headers
        self._buf = io.BytesIO(body)
        self._url = url

    def read(self, n=-1):
        return self._buf.read(n)

    def geturl(self):
        return self._url

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False


def run_python():
    spec = importlib.util.spec_from_file_location("local_server", ROOT / "tools" / "local_server.py")
    ls = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ls)
    # Every upstream request of the proxy goes through one function (redirects not followed); older versions called
    # urllib.request.urlopen directly, so both are replaced
    real_urlopen = urllib.request.urlopen
    observations = []
    try:
        for case in FIXTURES["cases"]:
            up = case.get("upstream") or {}
            calls = []

            def fake_open(req, timeout=None, follows_redirects=False, **_):
                url = req.full_url if isinstance(req, urllib.request.Request) else str(req)
                headers = {k.lower(): v for k, v in req.header_items()} if isinstance(req, urllib.request.Request) else {}
                calls.append({"url": url, "headers": headers})
                if up.get("throw"):
                    raise urllib.error.URLError(up["throw"])
                if up.get("final_url") and url != up["final_url"] and not follows_redirects:
                    hop = email.message.Message()
                    hop["Location"] = up["final_url"]
                    raise urllib.error.HTTPError(url, 302, "Found", hop, io.BytesIO(b""))
                msg = email.message.Message()
                for k, v in (up.get("headers") or {}).items():
                    msg[k] = v
                body = upstream_body(up)
                status = up.get("status", 200)
                if status >= 400:
                    raise urllib.error.HTTPError(url, status, "upstream error", msg, io.BytesIO(body))
                return FakeResponse(status, msg, body, up.get("final_url") or url)

            urllib.request.urlopen = lambda req, timeout=None, **kw: fake_open(req, timeout, follows_redirects=True)
            if hasattr(ls, "upstream_open"):
                ls.upstream_open = fake_open
            method = (case["request"].get("method") or "GET").upper()
            query = urllib.parse.urlencode(case["request"].get("query") or {})
            handler = ls.DevAPIHandler.__new__(ls.DevAPIHandler)
            handler.path = "/api/stream" + (f"?{query}" if query else "")
            handler.command = method
            handler.request_version = "HTTP/1.1"
            handler.requestline = f"{method} {handler.path} HTTP/1.1"
            handler.client_address = ("127.0.0.1", 50000)
            handler.server = None
            handler.close_connection = True
            handler.log_message = lambda *a, **k: None
            handler.headers = email.message.Message()
            handler.headers["Host"] = "127.0.0.1:8787"
            for k, v in (case["request"].get("headers") or {}).items():
                handler.headers[k] = v
            handler.wfile = io.BytesIO()
            observation = {"name": case["name"]}
            try:
                (handler.do_HEAD if method == "HEAD" else handler.do_GET)()
                raw = handler.wfile.getvalue()
                head, _, body = raw.partition(b"\r\n\r\n")
                lines = head.decode("latin-1").split("\r\n")
                observation["status"] = int(lines[0].split(" ")[1]) if lines and lines[0] else None
                observation["headers"] = {}
                for line in lines[1:]:
                    name, _, value = line.partition(":")
                    observation["headers"][name.strip().lower()] = value.strip()
                observation["body"] = body.decode("utf-8", errors="replace")
            except Exception as e:  # noqa: BLE001
                observation["error"] = f"{type(e).__name__}: {e}"
            observation["upstream_calls"] = calls
            observations.append(observation)
    finally:
        urllib.request.urlopen = real_urlopen
    return observations


def run_node():
    res = subprocess.run(["node", str(ROOT / "tools" / "test_stream_proxy.mjs")], capture_output=True, text=True, encoding="utf-8")
    if res.returncode != 0:
        print(res.stderr)
        raise SystemExit("Node runner failed")
    return json.loads(res.stdout)


def judge(expect, obs):
    """Reasons the observation misses the expected behavior (empty list: pass)."""
    if obs.get("error"):
        return [f"handler raised {obs['error']}"]
    problems = []
    headers = obs.get("headers") or {}
    body = obs.get("body") or ""
    calls = obs.get("upstream_calls") or []
    status = obs.get("status")
    if "status" in expect and status != expect["status"]:
        problems.append(f"status {status} (want {expect['status']})")
    if "status_in" in expect and status not in expect["status_in"]:
        problems.append(f"status {status} (want one of {expect['status_in']})")
    if "content_type_prefix_in" in expect:
        ctype = headers.get("content-type", "").lower()
        if not any(ctype.startswith(p.lower()) for p in expect["content_type_prefix_in"]):
            problems.append(f"Content-Type '{ctype}'")
    for name in expect.get("headers_present", []):
        if name not in headers:
            problems.append(f"missing {name}")
    for name in expect.get("headers_absent", []):
        if name in headers:
            problems.append(f"passes {name}")
    for name, part in (expect.get("header_contains") or {}).items():
        if part.lower() not in headers.get(name, "").lower():
            problems.append(f"{name} without '{part}'")
    for part in expect.get("body_contains", []):
        if part not in body:
            problems.append(f"body lacks '{part}'")
    for part in expect.get("body_not_contains", []):
        if part in body:
            problems.append(f"body has '{part}'")
    for url in expect.get("body_contains_proxied", []):
        if "api/stream?url=" + urllib.parse.quote(url, safe="") not in body:
            problems.append(f"no proxied {url}")
    if expect.get("body_empty") and body:
        problems.append(f"body not empty ({len(body)} chars)")
    if "upstream_calls" in expect and len(calls) != expect["upstream_calls"]:
        problems.append(f"{len(calls)} upstream requests (want {expect['upstream_calls']})")
    if "upstream_called" in expect and bool(calls) != expect["upstream_called"]:
        problems.append("upstream was called" if calls else "upstream not called")
    for name, value in (expect.get("upstream_header") or {}).items():
        sent = calls[0]["headers"].get(name) if calls else None
        if sent != value:
            problems.append(f"upstream {name}={sent!r}")
    return problems


py_obs = run_python()
node_obs = run_node()
totals = {"positive": [0, 0, 0], "negative": [0, 0, 0]}  # cases, edge passes, local passes
failed_positive = 0
failed_any = 0
print("Case                                                                    Prod (stream.js)  Local (local_server.py)")
for case, edge, local in zip(FIXTURES["cases"], node_obs, py_obs):
    kind = case["kind"]
    edge_problems = judge(case["expect"], edge)
    local_problems = judge(case["expect"], local)
    totals[kind][0] += 1
    totals[kind][1] += not edge_problems
    totals[kind][2] += not local_problems
    failed_any += bool(edge_problems) + bool(local_problems)
    if kind == "positive":
        failed_positive += bool(edge_problems) + bool(local_problems)
    label = f"[{kind[:3]}] {case['name']}"
    print(f"{label[:72]:<72}  {'OK  ' if not edge_problems else 'OPEN' if kind == 'negative' else 'FAIL'}              "
          f"{'OK  ' if not local_problems else 'OPEN' if kind == 'negative' else 'FAIL'}")
    for side, problems in (("prod", edge_problems), ("local", local_problems)):
        if problems:
            print(f"      {side}: {'; '.join(problems)}")

print()
for kind, (count, edge_ok, local_ok) in totals.items():
    print(f"{kind}: {count} cases | production {edge_ok}/{count} | local {local_ok}/{count}")
if STRICT:
    sys.exit(1 if failed_any else 0)
sys.exit(1 if failed_positive else 0)
