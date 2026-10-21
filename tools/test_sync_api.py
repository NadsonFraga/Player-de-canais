"""
Runs tools/sync_cases.json against tools/local_sync.py (the local server's mirror of the sync rules and route), with an
in-memory SQLite. tools/sync_api_check.mjs runs the same cases against the Cloudflare function.

    python tools/test_sync_api.py
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import local_accounts  # noqa: E402
import local_sync  # noqa: E402

CASES = json.loads(Path(__file__).with_name("sync_cases.json").read_text(encoding="utf-8"))
SITE = "https://tvzinha.example"


def fill(value, now, saved):
    if isinstance(value, str):
        many = re.fullmatch(r"\{many:(\d+)(?::(\d+))?\}", value)
        if many:
            start = int(many.group(2) or 0)
            return [{"kind": "favorite", "key": f"ch{start + i}", "data": {"on": True, "at": CASES["now"]}} for i in range(int(many.group(1)))]
        moment = re.fullmatch(r"\{now(?:-(\d+))?\}", value)
        if moment:
            return now - int(moment.group(1) or 0)
        whole = re.fullmatch(r"\{(\w+)\}", value)
        if whole and whole.group(1) in saved:
            return saved[whole.group(1)]
        return value
    if isinstance(value, list):
        return [fill(v, now, saved) for v in value]
    if isinstance(value, dict):
        return {k: fill(v, now, saved) for k, v in value.items()}
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
        elif isinstance(value, dict):
            value = value.get(part)
        else:
            return None
    return value


def main():
    total, failed = 0, 0

    def report(name, problems):
        nonlocal total, failed
        total += 1
        if problems:
            failed += 1
        print(f"{'FAIL' if problems else 'OK  '} {name}" + (" -> " + "; ".join(problems) if problems else ""))

    for c in CASES["sanitize"]:
        got = local_sync.sanitize_record(c["kind"], c["key"], c["data"], c["now"])
        same = local_sync.stable_stringify(got) == local_sync.stable_stringify(c["expect"])
        report("sanitize: " + c["name"], [] if same else ["got " + local_sync.stable_stringify(got)])

    for c in CASES["merge"]:
        stored = local_sync.sanitize_record(c["kind"], c["key"], c["stored"], c["now"])
        incoming = local_sync.sanitize_record(c["kind"], c["key"], c["incoming"], c["now"])
        got = local_sync.merge_record(c["kind"], stored, incoming)
        again = local_sync.merge_record(c["kind"], got, incoming)
        problems = []
        if local_sync.stable_stringify(got) != local_sync.stable_stringify(c["expect"]):
            problems.append("got " + local_sync.stable_stringify(got))
        if local_sync.stable_stringify(again) != local_sync.stable_stringify(got):
            problems.append("merging the same copy again changed it")
        if local_sync.stable_stringify(local_sync.merge_record(c["kind"], incoming, stored)) != local_sync.stable_stringify(got):
            problems.append("the other order gives another answer")
        report("merge: " + c["name"], problems)

    db = local_accounts.SqliteDatabase(":memory:")
    cookies, saved = {}, {}
    clock = CASES["now"]
    for step in CASES["steps"]:
        clock += step.get("advance", 1100)
        origin = {"other": "https://outro-site.example", "none": None}.get(step.get("origin"), SITE)
        req = {
            "method": step.get("method", "POST"),
            "body": fill(step["body"], clock, saved) if "body" in step else None,
            "cookie": f"tvz_session={cookies[step['device']]}" if cookies.get(step["device"]) else "",
            "origin": origin,
            "requestOrigin": SITE,
            "customHeader": None if step.get("header") is False else "1",
            "ip": CASES["devices"][step["device"]],
            "now": clock,
            "secure": True,
            "pepper": "",
        }
        if step["route"] == "sync":
            result = local_sync.handle_sync(req, db)
        else:
            result = local_accounts.handle_account({**req, "path": step["route"][len("account/"):]}, db)
        if result["setCookie"]:
            value = re.match(r"tvz_session=([^;]*)", result["setCookie"]).group(1)
            cookies[step["device"]] = value if int(re.search(r"Max-Age=(\d+)", result["setCookie"]).group(1)) > 0 else ""

        expect, payload, problems = fill(step["expect"], clock, saved), result["json"], []
        if result["status"] != expect["status"]:
            problems.append(f"status {result['status']} (expected {expect['status']})")
        if "error" in expect and payload.get("error") != expect["error"]:
            problems.append(f"error {payload.get('error')} (expected {expect['error']})")
        for path, value in expect.get("json", {}).items():
            got = pick(payload, path)
            if got != value or type(got) is not type(value):
                problems.append(f"{path} = {got!r} (expected {value!r})")
        for r in expect.get("record", []):
            record = next((c for c in payload.get("changes", []) if c["kind"] == r["kind"] and c["key"] == r["key"]), None)
            got = pick(record, r["path"]) if record else "(no record)"
            if got != r["value"]:
                problems.append(f"{r['kind']} {r['key']} {r['path']} = {got!r} (expected {r['value']!r})")
        if re.search(r"hash|salt|token|password", json.dumps(payload), re.I):
            problems.append("a secret field in the answer")
        for name, field in step.get("save", {}).items():
            saved[name] = pick(payload, field)
        report(step["name"], problems)

    print(f"\n{total - failed}/{total} passed (local server mirror)")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
