"""
Tvzinha Online - account sync for the local server: mirror of assets/js/core/syncMerge.js and functions/api/sync.js
(keep them identical). tools/sync_cases.json runs against both (tools/test_sync_api.py here, tools/sync_api_check.mjs
there).
"""
import json
import math
import re

from local_accounts import (SESSION_DAYS, add_attempt, blocked_for, cookie_header, current_session, ip_blocked_for)

SYNC_KINDS = ["library", "progress", "favorite", "prefs"]
MAX_RECORD_BYTES = 16 * 1024
MAX_POSITIONS = 40
SYNC_LIMITS = {
    "secondMs": 1000,
    "hour": {"max": 120, "windowMs": 60 * 60 * 1000},
    "writes": {"max": 10000, "windowMs": 24 * 60 * 60 * 1000},
    "changes": 300,
    "records": 5000,
    "answer": 500,
    "bodyBytes": 256 * 1024,
}

_LAST_SYNC_AT = {}


# --- JavaScript number and text behavior (Number(), Math.round, String.slice) ---

# A missing field (JavaScript's undefined): Number(undefined) is NaN, Number(null) is 0
_UNDEF = object()


def _g(data, key):
    return data[key] if key in data else _UNDEF


def _number(value):
    if value is _UNDEF:
        return math.nan
    if isinstance(value, bool):
        return 1.0 if value else 0.0
    if isinstance(value, (int, float)):
        return float(value)
    if value is None:
        return 0.0
    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return 0.0
        try:
            return float(stripped)
        except ValueError:
            return math.nan
    return math.nan


def _js_round(n):
    return int(math.floor(n + 0.5))


def _time(value, now):
    n = _number(value)
    if not math.isfinite(n) or n <= 0:
        return 0
    return min(_js_round(n), now)


def _text(value, limit):
    if not isinstance(value, str):
        return ""
    trimmed = value.strip()
    # JavaScript counts UTF-16 units
    units = trimmed.encode("utf-16-le")
    if len(units) <= limit * 2:
        return trimmed
    return units[:limit * 2].decode("utf-16-le", errors="ignore")


def _int(value, low, high):
    n = _number(value)
    if not math.isfinite(n) or n != math.floor(n) or n < low or n > high:
        return None
    return int(n)


def _num(value, low, high):
    n = _number(value)
    if not math.isfinite(n) or n < low or n > high:
        return None
    return int(n) if n == math.floor(n) else n


def _image_path(value):
    return value if isinstance(value, str) and re.fullmatch(r"/[A-Za-z0-9._-]{1,100}", value) else None


def _is_object(value):
    return isinstance(value, dict)


def _js_string(value):
    if value is True:
        return "true"
    if value is False:
        return "false"
    if isinstance(value, float) and value == math.floor(value):
        return str(int(value))
    return str(value)


def valid_key(kind, key):
    if not isinstance(key, str):
        return False
    if kind == "library":
        return bool(re.fullmatch(r"(movie|tv):\d{1,9}", key))
    if kind == "progress":
        return bool(re.fullmatch(r"(movie:)?\d{1,9}", key))
    if kind == "favorite":
        return 1 <= len(key.encode("utf-16-le")) // 2 <= 120 and not re.search(r"[\x00-\x1f\x7f]", key)
    if kind == "prefs":
        return key in ("player", "team")
    return False


def _flag(value, now):
    if not _is_object(value):
        return None
    return {"on": bool(value.get("on")), "at": _time(_g(value, "at"), now)}


def _or(value, fallback):
    return fallback if value is None else value


def _position(value, now):
    if not _is_object(value):
        return None
    return {
        "position": _or(_num(_g(value, "position"), 0, 1e6), 0),
        "duration": _or(_num(_g(value, "duration"), 0, 1e6), 0),
        "finished": bool(value.get("finished")),
        "server": _text(value.get("server"), 40),
        "at": _time(_g(value, "at"), now),
    }


def _cap_positions(positions):
    keys = sorted(positions.keys(), key=lambda k: (-positions[k]["at"], k))
    return {k: positions[k] for k in keys[:MAX_POSITIONS]}


def sanitize_record(kind, key, data, now):
    if kind not in SYNC_KINDS or not valid_key(kind, key) or not _is_object(data):
        return None
    if kind == "library":
        clean = {
            "kind": data.get("kind") if data.get("kind") in ("movie", "tv", "anime") else ("movie" if key.startswith("movie:") else "tv"),
            "id": int(key.split(":")[1]),
            "title": _text(data.get("title"), 200),
            "poster_path": _image_path(data.get("poster_path")),
            "backdrop_path": _image_path(data.get("backdrop_path")),
            "year": _js_string(data.get("year")) if data.get("year") and re.fullmatch(r"\d{4}", _js_string(data.get("year"))) else "",
        }
        for field in ("watchlist", "watched"):
            value = _flag(data.get(field), now)
            if value:
                clean[field] = value
        if _is_object(data.get("rating")):
            clean["rating"] = {"value": _int(_g(data["rating"], "value"), 1, 10), "at": _time(_g(data["rating"], "at"), now)}
    elif kind == "progress":
        is_movie = key.startswith("movie:")
        clean = {
            "id": int(key.split(":")[1]) if is_movie else int(key),
            "title": _text(data.get("title"), 200),
            "poster_path": _image_path(data.get("poster_path")),
            "backdrop_path": _image_path(data.get("backdrop_path")),
            "mediaType": "movie" if is_movie else ("anime" if data.get("mediaType") == "anime" else "tv"),
            "timestamp": _time(_g(data, "timestamp"), now),
        }
        hidden_at = _time(_g(data, "hiddenAt"), now)
        if hidden_at:
            clean["hidden"] = bool(data.get("hidden"))
            clean["hiddenAt"] = hidden_at
        if is_movie:
            saved = _position(data, now)
            clean.update({k: saved[k] for k in ("position", "duration", "finished", "server", "at")})
        else:
            clean["season"] = _or(_int(_g(data, "season"), 0, 1000), 1)
            clean["episode"] = _or(_int(_g(data, "episode"), 0, 100000), 1)
            clean["episodeTitle"] = _text(data.get("episodeTitle"), 200)
            clean["absolute"] = _int(_g(data, "absolute"), 1, 100000)
            positions = {}
            if _is_object(data.get("positions")):
                for episode_key, value in data["positions"].items():
                    if not re.fullmatch(r"\d{1,4}:\d{1,6}", episode_key):
                        continue
                    saved = _position(value, now)
                    if saved:
                        positions[episode_key] = saved
            clean["positions"] = _cap_positions(positions)
    elif kind == "favorite":
        clean = {"on": bool(data.get("on")), "at": _time(_g(data, "at"), now)}
    elif key == "player":
        quality = "auto" if data.get("quality") == "auto" else _or(_int(_g(data, "quality"), 100, 5000), "auto")
        clean = {
            "volume": _or(_num(_g(data, "volume"), 0, 1), 0.9),
            "muted": bool(data.get("muted")),
            "playbackRate": _or(_num(_g(data, "playbackRate"), 0.25, 4), 1),
            "subtitle": None if data.get("subtitle") is None else _text(_js_string(data.get("subtitle")), 10),
            "quality": quality,
            "fit": "cover" if data.get("fit") == "cover" else "contain",
            "at": _time(_g(data, "at"), now),
        }
    else:
        team = data.get("team")
        clean = {"team": None if team is None else (_text(_js_string(team), 40) or None), "at": _time(_g(data, "at"), now)}
    return clean if len(stable_stringify(clean).encode("utf-16-le")) // 2 <= MAX_RECORD_BYTES else None


# --- Merge ---

def _at(value):
    return (value or {}).get("at") or 0


def _pick(a, b, time):
    ta, tb = time(a), time(b)
    if ta != tb:
        return b if tb > ta else a
    return b if stable_stringify(b) > stable_stringify(a) else a


def _newer(a, b):
    if not a:
        return b or None
    if not b:
        return a
    return _pick(a, b, _at)


def _newest_field_time(entry):
    return max([0] + [_at(entry.get(f)) for f in ("watchlist", "watched", "rating")])


def merge_record(kind, stored, incoming):
    if not stored:
        return incoming
    if not incoming:
        return stored
    if kind == "library":
        base = _pick(stored, incoming, _newest_field_time)
        other = stored if base is incoming else incoming
        merged = {
            "kind": base.get("kind"),
            "id": base.get("id"),
            "title": base.get("title") or other.get("title") or "",
            "poster_path": base.get("poster_path") or other.get("poster_path") or None,
            "backdrop_path": base.get("backdrop_path") or other.get("backdrop_path") or None,
            "year": base.get("year") or other.get("year") or "",
        }
        for field in ("watchlist", "watched", "rating"):
            value = _newer(stored.get(field), incoming.get(field))
            if value:
                merged[field] = value
        return merged
    if kind == "progress":
        head = _pick(stored, incoming, lambda v: v.get("timestamp") or 0)
        merged = dict(head)
        merged["timestamp"] = max(stored.get("timestamp") or 0, incoming.get("timestamp") or 0)
        hidden_at = max(stored.get("hiddenAt") or 0, incoming.get("hiddenAt") or 0)
        merged.pop("hidden", None)
        merged.pop("hiddenAt", None)
        if hidden_at:
            merged["hiddenAt"] = hidden_at
            merged["hidden"] = hidden_at >= merged["timestamp"]
        if head.get("mediaType") == "movie":
            saved = _newer(stored, incoming)
            merged["position"] = saved.get("position")
            merged["duration"] = saved.get("duration")
            merged["server"] = saved.get("server")
            merged["at"] = saved.get("at") or 0
            merged["finished"] = bool(saved.get("finished")) and (saved.get("at") or 0) >= merged["timestamp"]
        else:
            positions = dict(stored.get("positions") or {})
            for k, value in (incoming.get("positions") or {}).items():
                positions[k] = _newer(positions.get(k), value)
            merged["positions"] = _cap_positions(positions)
        return merged
    return _newer(stored, incoming)


def stable_stringify(value):
    if value is True:
        return "true"
    if value is False:
        return "false"
    if value is None:
        return "null"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        if not math.isfinite(value):
            return "null"
        return str(int(value)) if value == math.floor(value) else repr(value)
    if isinstance(value, str):
        return json.dumps(value, ensure_ascii=False)
    if isinstance(value, list):
        return "[" + ",".join(stable_stringify(v) for v in value) + "]"
    if isinstance(value, dict):
        return "{" + ",".join(json.dumps(k, ensure_ascii=False) + ":" + stable_stringify(value[k]) for k in sorted(value.keys())) + "}"
    return "null"


def same_record(a, b):
    return stable_stringify(a) == stable_stringify(b)


# --- The route ---

def _parse(text):
    try:
        return json.loads(text)
    except (TypeError, ValueError):
        return None


def _count_wait(db, key, rule, now, amount):
    row = db.first("SELECT count, window_start FROM attempts WHERE key = ?", [key])
    if not row or now - row["window_start"] > rule["windowMs"] or row["count"] + amount <= rule["max"]:
        return 0
    return -(-(row["window_start"] + rule["windowMs"] - now) // 1000)


def _add_count(db, key, rule, now, amount):
    row = db.first("SELECT count, window_start FROM attempts WHERE key = ?", [key])
    if not row or now - row["window_start"] > rule["windowMs"]:
        db.run("INSERT OR REPLACE INTO attempts (key, count, window_start) VALUES (?, ?, ?)", [key, amount, now])
    else:
        db.run("UPDATE attempts SET count = count + ? WHERE key = ?", [amount, key])


def handle_sync(req, db):
    now = req["now"]

    def reply(status, payload, set_cookie=None):
        return {"status": status, "json": payload, "setCookie": set_cookie}

    def fail(status, error, extra=None):
        return reply(status, {"error": error, **(extra or {})})

    if req["method"] != "POST":
        return fail(405, "method_not_allowed")
    if req.get("origin") != req.get("requestOrigin") or req.get("customHeader") != "1":
        return fail(403, "origin_forbidden")
    ip_wait = ip_blocked_for(req.get("ip"), now)
    if ip_wait:
        return fail(429, "too_many_attempts", {"retryAfter": ip_wait})
    body = req.get("body") if isinstance(req.get("body"), dict) else {}
    profile_id, since, changes = body.get("profileId"), body.get("since"), body.get("changes")
    if (not isinstance(profile_id, str) or not profile_id or len(profile_id) > 64 or isinstance(since, bool)
            or not isinstance(since, int) or since < 0 or not isinstance(changes, list)):
        return fail(400, "invalid_request")
    if len(changes) > SYNC_LIMITS["changes"]:
        return fail(413, "too_many_changes")

    session = current_session(db, req.get("cookie"), now)
    if not session:
        return fail(401, "not_signed_in")
    account_id = session["account"]["id"]
    if now - _LAST_SYNC_AT.get(account_id, 0) < SYNC_LIMITS["secondMs"]:
        return fail(429, "too_many_attempts", {"retryAfter": 1})
    _LAST_SYNC_AT[account_id] = now
    if len(_LAST_SYNC_AT) > 5000:
        for k in [k for k, at in _LAST_SYNC_AT.items() if now - at > 60 * 1000]:
            del _LAST_SYNC_AT[k]
    hour_key = "sync-h:" + account_id
    hour_wait = blocked_for(db, hour_key, SYNC_LIMITS["hour"], now)
    if hour_wait:
        return fail(429, "too_many_attempts", {"retryAfter": hour_wait})
    if not db.first("SELECT id FROM profiles WHERE id = ? AND account_id = ? AND deleted_at IS NULL", [profile_id, account_id]):
        return fail(404, "not_found")
    add_attempt(db, hour_key, SYNC_LIMITS["hour"], now)

    incoming = {}
    for change in changes:
        if not isinstance(change, dict):
            continue
        clean = sanitize_record(change.get("kind"), change.get("key"), change.get("data"), now)
        if clean:
            incoming[change["kind"] + "\t" + change["key"]] = {"kind": change["kind"], "key": change["key"], "data": clean}
    items = list(incoming.values())

    stored = {}
    for i in range(0, len(items), 45):
        part = items[i:i + 45]
        where = " OR ".join("(kind = ? AND key = ?)" for _ in part)
        params = [profile_id] + [v for c in part for v in (c["kind"], c["key"])]
        for row in db.all(f"SELECT kind, key, data FROM records WHERE profile_id = ? AND ({where})", params):
            stored[row["kind"] + "\t" + row["key"]] = _parse(row["data"])

    writes, corrections = [], {}
    for change in items:
        record_id = change["kind"] + "\t" + change["key"]
        before = stored.get(record_id)
        merged = merge_record(change["kind"], before, change["data"])
        if not before or not same_record(before, merged):
            writes.append({"kind": change["kind"], "key": change["key"], "data": merged, "isNew": not before})
        if not same_record(merged, change["data"]):
            corrections[record_id] = {"kind": change["kind"], "key": change["key"], "data": merged}

    if writes:
        added = len([w for w in writes if w["isNew"]])
        if added:
            count = db.first("SELECT COUNT(*) AS n FROM records WHERE profile_id = ?", [profile_id])
            if (count["n"] if count else 0) + added > SYNC_LIMITS["records"]:
                return fail(413, "profile_full")
        writes_key = "sync-w:" + account_id
        writes_wait = _count_wait(db, writes_key, SYNC_LIMITS["writes"], now, len(writes))
        if writes_wait:
            return fail(429, "too_many_attempts", {"retryAfter": writes_wait})
        n = len(writes)
        statements = [{
            "sql": "INSERT INTO counters (profile_id, rev) VALUES (?, ?) ON CONFLICT(profile_id) DO UPDATE SET rev = rev + ?",
            "params": [profile_id, n, n],
        }]
        for i, w in enumerate(writes):
            statements.append({
                "sql": "INSERT OR REPLACE INTO records (profile_id, kind, key, data, updated_at, rev) VALUES (?, ?, ?, ?, ?, (SELECT rev FROM counters WHERE profile_id = ?) - ?)",
                "params": [profile_id, w["kind"], w["key"], stable_stringify(w["data"]), now, profile_id, n - 1 - i],
            })
        db.batch(statements)
        _add_count(db, writes_key, SYNC_LIMITS["writes"], now, n)

    rows = db.all("SELECT kind, key, data, rev FROM records WHERE profile_id = ? AND rev > ? ORDER BY rev LIMIT ?",
                  [profile_id, since, SYNC_LIMITS["answer"] + 1])
    more = len(rows) > SYNC_LIMITS["answer"]
    page = rows[:SYNC_LIMITS["answer"]]
    counter = db.first("SELECT rev FROM counters WHERE profile_id = ?", [profile_id])
    rev = page[-1]["rev"] if more else max(since, counter["rev"] if counter else 0)
    answer = {}
    for row in page:
        data = _parse(row["data"])
        if data is not None:
            answer[row["kind"] + "\t" + row["key"]] = {"kind": row["kind"], "key": row["key"], "data": data}
    for record_id, record in corrections.items():
        answer.setdefault(record_id, record)

    renew = cookie_header(session["token"], SESSION_DAYS * 24 * 3600, req.get("secure")) if session["renewed"] else None
    return reply(200, {"rev": rev, "changes": list(answer.values()), "more": more}, renew)
