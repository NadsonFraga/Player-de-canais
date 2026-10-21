"""
Runs tools/accounts_cases.json against tools/local_accounts.py (the local server's mirror of the account function),
with an in-memory SQLite. tools/accounts_api_check.mjs runs the same cases against the Cloudflare function.

    python tools/test_accounts_api.py
"""
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import local_accounts  # noqa: E402

CASES = json.loads(Path(__file__).with_name("accounts_cases.json").read_text(encoding="utf-8"))
SITE = "https://tvzinha.example"


def fill(value, saved):
    if isinstance(value, str):
        def sub(m):
            text = str(saved[m.group(1)])
            return text.lower().replace("-", "") if m.group(2) else text
        return re.sub(r"\{(\w+)(:loose)?\}", sub, value)
    if isinstance(value, dict):
        return {k: fill(v, saved) for k, v in value.items()}
    return value


def pick(data, dotted):
    value = data
    for part in dotted.split("."):
        if value is None:
            return None
        if part == "length" and isinstance(value, list):
            value = len(value)
        elif isinstance(value, list):
            value = value[int(part)] if int(part) < len(value) else None
        else:
            value = value.get(part)
    return value


def verify_captcha(token, action, ip):
    """Turnstile, faked: 'ok-<route>' passes, 'unavailable' is Cloudflare unreachable, anything else fails."""
    return "ok" if token == f"ok-{action}" else "unavailable" if token == "unavailable" else "failed"


def with_captcha(step, body):
    if step["path"] not in ("register", "recover", "login") or step.get("noCaptcha") or body is None or "turnstileToken" in body:
        return body
    return {**body, "turnstileToken": f"ok-{step['path']}"}


def main():
    db = local_accounts.SqliteDatabase(":memory:")
    cookies, saved = {}, {}
    clock = int(datetime(2026, 10, 21, 12, 0, 0, tzinfo=timezone.utc).timestamp() * 1000)
    failed = 0
    for step in CASES["steps"]:
        clock += step.get("advance", 0) + 1000
        origin = {"other": "https://outro-site.example", "none": None}.get(step.get("origin"), SITE)
        result = local_accounts.handle_account({
            "method": step.get("method", "POST"),
            "path": step["path"],
            "body": with_captcha(step, fill(step["body"], saved)) if "body" in step else None,
            "cookie": f"tvz_session={cookies[step['device']]}" if cookies.get(step["device"]) else "",
            "origin": origin,
            "requestOrigin": SITE,
            "customHeader": None if step.get("header") is False else "1",
            "ip": CASES["devices"][step["device"]],
            "now": clock,
            "secure": True,
            "pepper": "",
        }, db, verify_captcha=verify_captcha)
        if result["setCookie"]:
            value = re.match(r"tvz_session=([^;]*)", result["setCookie"]).group(1)
            max_age = int(re.search(r"Max-Age=(\d+)", result["setCookie"]).group(1))
            cookies[step["device"]] = value if max_age > 0 else ""

        expect, payload, problems = step["expect"], result["json"], []
        if result["status"] != expect["status"]:
            problems.append(f"status {result['status']} (expected {expect['status']})")
        if "error" in expect and payload.get("error") != expect["error"]:
            problems.append(f"error {payload.get('error')} (expected {expect['error']})")
        for field in expect.get("has", []):
            if payload.get(field) is None:
                problems.append(f"no {field}")
        for path, value in expect.get("json", {}).items():
            got = pick(payload, path)
            if got != value:
                problems.append(f"{path} = {got!r} (expected {value!r})")
        cookie = result["setCookie"] or ""
        if expect.get("cookie") == "set" and not re.search(r"Max-Age=[1-9]", cookie):
            problems.append("no session cookie")
        if expect.get("cookie") == "cleared" and "Max-Age=0" not in cookie:
            problems.append("cookie not cleared")
        if cookie and "HttpOnly" not in cookie:
            problems.append("cookie without HttpOnly")
        if re.search(r"hash|salt|token", json.dumps(payload), re.I):
            problems.append("a secret field in the answer")
        for name, field in step.get("save", {}).items():
            saved[name] = pick(payload, field)
        if problems:
            failed += 1
        print(f"{'FAIL' if problems else 'OK  '} {step['name']}" + (" -> " + "; ".join(problems) if problems else ""))
    total = len(CASES["steps"])
    print(f"\n{total - failed}/{total} passed (local server mirror)")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
