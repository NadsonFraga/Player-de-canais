"""
Tvzinha Online - accounts for the local server: mirror of functions/api/account/[[path]].js (keep both identical).

handle_account(req, db) takes the same plain description of a request and returns the same {status, json, setCookie}
as handleAccount() in the function; tools/accounts_cases.json runs against both (tools/test_accounts_api.py here,
tools/accounts_api_check.mjs there). Database: sqlite3 with tools/accounts_schema.sql, in a file outside the project
folder (the local server publishes the project folder).
"""
import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import threading
import unicodedata
import uuid
from datetime import datetime, timezone
from pathlib import Path

PBKDF2_ITERATIONS = 100000
SESSION_DAYS = 90
SESSION_RENEW_MS = 24 * 3600 * 1000
MAX_PROFILES = 5
LIMITS = {
    "nickname": {"max": 5, "windowMs": 15 * 60 * 1000},
    "device": {"max": 30, "windowMs": 60 * 60 * 1000},
    "register": {"max": 10, "windowMs": 60 * 60 * 1000},
}
COOKIE_NAME = "tvz_session"
# Calls from one IP per minute (account and sync), counted in memory (same as IP_LIMIT in the function)
IP_LIMIT = {"max": 120, "windowMs": 60 * 1000}
# The avatars the site ships (assets/img/avatars/<id>.svg): illustrated faces (l, n) and our line icons (i)
AVATARS = [f"l{i:02d}" for i in range(1, 13)] + [f"n{i:02d}" for i in range(1, 13)] + [f"i{i:02d}" for i in range(1, 9)]
DEFAULT_AVATAR = "l01"
RECOVERY_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
# Wrong passwords (nickname or device, in its window) after which sign-in also asks for the Turnstile check
LOGIN_CAPTCHA_AFTER = 2
SCHEMA_PATH = Path(__file__).with_name("accounts_schema.sql")


# --- Rules ---

def check_nickname(nickname):
    if not isinstance(nickname, str):
        return "nickname_invalid"
    value = nickname.strip()
    if len(value) < 3:
        return "nickname_short"
    if len(value) > 20:
        return "nickname_long"
    if not re.fullmatch(r"[A-Za-z0-9._-]+", value):
        return "nickname_chars"
    return None


def check_password(password, nickname=""):
    if not isinstance(password, str) or len(password) < 8:
        return "password_short"
    if len(password) > 200:
        return "password_long"
    if not re.search(r"[A-Za-zÀ-ÿ]", password):
        return "password_letter"
    if not re.search(r"[0-9]", password):
        return "password_number"
    if nickname and password.strip().lower() == str(nickname).strip().lower():
        return "password_is_nickname"
    return None


def check_profile_name(name):
    if not isinstance(name, str):
        return "profile_name_invalid"
    value = name.strip()
    if not value:
        return "profile_name_short"
    if len(value) > 20:
        return "profile_name_long"
    # Same as /^[\p{L}\p{N} ._'-]+$/u in the function: letters and numbers of any language
    if not all(unicodedata.category(ch)[0] in "LN" or ch in " ._'-" for ch in value):
        return "profile_name_chars"
    return None


def new_recovery_code():
    raw = secrets.token_bytes(16)
    code = ""
    for i in range(16):
        code += RECOVERY_ALPHABET[raw[i] % len(RECOVERY_ALPHABET)]
        if i % 4 == 3 and i < 15:
            code += "-"
    return code


def normalize_recovery_code(code):
    return re.sub(r"[^A-Z0-9]", "", str(code or "").upper())


# --- Crypto helpers ---

def sha256_hex(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def hash_secret(secret, salt_hex, iterations, pepper=""):
    value = hmac.new(pepper.encode("utf-8"), secret.encode("utf-8"), hashlib.sha256).hexdigest() if pepper else secret
    return hashlib.pbkdf2_hmac("sha256", value.encode("utf-8"), bytes.fromhex(salt_hex), iterations, 32).hex()


def safe_equal(a, b):
    return isinstance(a, str) and isinstance(b, str) and hmac.compare_digest(a, b)


# --- Attempt limits ---

_IP_WINDOWS = {}


def ip_blocked_for(ip, now):
    key = ip or "unknown"
    entry = _IP_WINDOWS.get(key)
    if not entry or now - entry["start"] > IP_LIMIT["windowMs"]:
        entry = {"start": now, "count": 0}
        _IP_WINDOWS[key] = entry
    entry["count"] += 1
    if len(_IP_WINDOWS) > 5000:
        for k in [k for k, v in _IP_WINDOWS.items() if now - v["start"] > IP_LIMIT["windowMs"]]:
            del _IP_WINDOWS[k]
    if entry["count"] > IP_LIMIT["max"]:
        return -(-(entry["start"] + IP_LIMIT["windowMs"] - now) // 1000)
    return 0


def blocked_for(db, key, rule, now):
    row = db.first("SELECT count, window_start FROM attempts WHERE key = ?", [key])
    if not row or now - row["window_start"] > rule["windowMs"] or row["count"] < rule["max"]:
        return 0
    return -(-(row["window_start"] + rule["windowMs"] - now) // 1000)


def attempts_in(db, key, rule, now):
    row = db.first("SELECT count, window_start FROM attempts WHERE key = ?", [key])
    return row["count"] if row and now - row["window_start"] <= rule["windowMs"] else 0


def add_attempt(db, key, rule, now):
    row = db.first("SELECT count, window_start FROM attempts WHERE key = ?", [key])
    if not row or now - row["window_start"] > rule["windowMs"]:
        db.run("INSERT OR REPLACE INTO attempts (key, count, window_start) VALUES (?, 1, ?)", [key, now])
    else:
        db.run("UPDATE attempts SET count = count + 1 WHERE key = ?", [key])
    db.run("DELETE FROM attempts WHERE window_start < ?", [now - 24 * 3600 * 1000])


# --- Sessions and the cookie ---

def cookie_header(token, max_age_seconds, secure):
    return f"{COOKIE_NAME}={token}; Path=/api; HttpOnly; SameSite=Lax; Max-Age={max_age_seconds}" + ("; Secure" if secure else "")


def read_cookie(cookie_text, name=COOKIE_NAME):
    for part in str(cookie_text or "").split(";"):
        key, _, value = part.strip().partition("=")
        if key == name:
            return value
    return ""


def create_session(db, account_id, now):
    token = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode("ascii").rstrip("=")
    expires = now + SESSION_DAYS * 24 * 3600 * 1000
    db.run("INSERT INTO sessions (token_hash, account_id, created_at, last_seen_at, expires_at) VALUES (?, ?, ?, ?, ?)",
           [sha256_hex(token), account_id, now, now, expires])
    return token


def current_session(db, cookie_text, now):
    token = read_cookie(cookie_text)
    # Only what create_session makes (32 random bytes, base64url): anything else is refused without a database read
    if not re.fullmatch(r"[A-Za-z0-9_-]{43}", token or ""):
        return None
    token_hash = sha256_hex(token)
    session = db.first("SELECT account_id, last_seen_at, expires_at FROM sessions WHERE token_hash = ?", [token_hash])
    if not session:
        return None
    if session["expires_at"] <= now:
        db.run("DELETE FROM sessions WHERE token_hash = ?", [token_hash])
        return None
    account = db.first("SELECT * FROM accounts WHERE id = ?", [session["account_id"]])
    if not account:
        return None
    renewed = False
    if now - session["last_seen_at"] > SESSION_RENEW_MS:
        db.run("UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE token_hash = ?",
               [now, now + SESSION_DAYS * 24 * 3600 * 1000, token_hash])
        renewed = True
    return {"account": account, "token": token, "tokenHash": token_hash, "renewed": renewed}


# --- Shapes sent to the page ---

def profiles_of(db, account_id):
    rows = db.all("SELECT id, name, avatar, position FROM profiles WHERE account_id = ? AND deleted_at IS NULL ORDER BY position, created_at", [account_id])
    # Profiles from before the avatar set (4a saved 'a01') show the default
    return [{"id": p["id"], "name": p["name"], "avatar": p["avatar"] if p["avatar"] in AVATARS else DEFAULT_AVATAR} for p in rows]


def account_view(db, account):
    return {
        "account": {"nickname": account["nickname"], "createdAt": account["created_at"]},
        "profiles": profiles_of(db, account["id"]),
    }


def verify_password(account, password, pepper):
    if not isinstance(password, str) or not password:
        return False
    digest = hash_secret(password, account["password_salt"], account["password_iter"], pepper if account["peppered"] else "")
    return safe_equal(digest, account["password_hash"])


def new_secret_hash(secret, pepper):
    salt = secrets.token_bytes(16).hex()
    return {"salt": salt, "hash": hash_secret(secret, salt, PBKDF2_ITERATIONS, pepper), "iterations": PBKDF2_ITERATIONS}


# --- The handler ---

def handle_account(req, db, verify_captcha=None):
    """verify_captcha(token, action, ip) -> 'ok' | 'failed' | 'unavailable' (Turnstile); None when the check is off."""
    now = req["now"]

    def reply(status, payload, set_cookie=None):
        return {"status": status, "json": payload, "setCookie": set_cookie}

    def fail(status, error, extra=None):
        return reply(status, {"error": error, **(extra or {})})

    method, path = req["method"], req["path"]
    is_write = method == "POST"
    if method not in ("GET", "POST"):
        return fail(405, "method_not_allowed")
    if (method != "GET") if path == "me" else (method != "POST"):
        return fail(405, "method_not_allowed")
    if is_write and (req.get("origin") != req.get("requestOrigin") or req.get("customHeader") != "1"):
        return fail(403, "origin_forbidden")
    ip_wait = ip_blocked_for(req.get("ip"), now)
    if ip_wait:
        return fail(429, "too_many_attempts", {"retryAfter": ip_wait})

    body = req.get("body") if isinstance(req.get("body"), dict) else {}
    pepper = req.get("pepper") or ""
    day = datetime.fromtimestamp(now / 1000, tz=timezone.utc).strftime("%Y-%m-%d")
    device_key = "ip:" + sha256_hex(f"{req.get('ip') or 'unknown'}|{day}|{pepper}")
    clear_cookie = cookie_header("", 0, req.get("secure"))

    def session_cookie(token):
        return cookie_header(token, SESSION_DAYS * 24 * 3600, req.get("secure"))

    def captcha_problem(action):
        if not verify_captcha:
            return None
        token = body.get("turnstileToken") if isinstance(body.get("turnstileToken"), str) else ""
        if not token or len(token) > 2048:
            return fail(400, "captcha_required")
        outcome = verify_captcha(token, action, req.get("ip"))
        if outcome == "ok":
            return None
        return fail(503, "captcha_unavailable") if outcome == "unavailable" else fail(403, "captcha_failed")

    if path == "register":
        captcha = captcha_problem("register")
        if captcha:
            return captcha
        nickname_error = check_nickname(body.get("nickname"))
        if nickname_error:
            return fail(400, nickname_error)
        nickname = body["nickname"].strip()
        password_error = check_password(body.get("password"), nickname)
        if password_error:
            return fail(400, password_error)
        register_key = "reg:" + device_key
        wait = blocked_for(db, register_key, LIMITS["register"], now)
        if wait:
            return fail(429, "too_many_attempts", {"retryAfter": wait})
        key = nickname.lower()
        if db.first("SELECT id FROM accounts WHERE nickname_key = ?", [key]):
            return fail(409, "nickname_taken")
        password = new_secret_hash(body["password"], pepper)
        recovery_code = new_recovery_code()
        recovery = new_secret_hash(normalize_recovery_code(recovery_code), pepper)
        account_id = str(uuid.uuid4())
        db.run("""INSERT INTO accounts (id, nickname, nickname_key, password_hash, password_salt, password_iter, peppered,
                  recovery_hash, recovery_salt, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
               [account_id, nickname, key, password["hash"], password["salt"], password["iterations"], 1 if pepper else 0,
                recovery["hash"], recovery["salt"], now, now])
        db.run("INSERT INTO profiles (id, account_id, name, avatar, position, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)",
               [str(uuid.uuid4()), account_id, nickname, DEFAULT_AVATAR, now, now])
        add_attempt(db, register_key, LIMITS["register"], now)
        token = create_session(db, account_id, now)
        account = db.first("SELECT * FROM accounts WHERE id = ?", [account_id])
        return reply(201, {**account_view(db, account), "recoveryCode": recovery_code}, session_cookie(token))

    if path == "login":
        if not isinstance(body.get("nickname"), str) or not isinstance(body.get("password"), str):
            return fail(400, "missing_fields")
        key = body["nickname"].strip().lower()
        nickname_key = "nick:" + key
        wait = max(blocked_for(db, nickname_key, LIMITS["nickname"], now), blocked_for(db, device_key, LIMITS["device"], now))
        if wait:
            return fail(429, "too_many_attempts", {"retryAfter": wait})
        failures = max(attempts_in(db, nickname_key, LIMITS["nickname"], now), attempts_in(db, device_key, LIMITS["device"], now))
        if failures >= LOGIN_CAPTCHA_AFTER:
            captcha = captcha_problem("login")
            if captcha:
                return captcha
        account = db.first("SELECT * FROM accounts WHERE nickname_key = ?", [key])
        if not account or not verify_password(account, body["password"], pepper):
            add_attempt(db, nickname_key, LIMITS["nickname"], now)
            add_attempt(db, device_key, LIMITS["device"], now)
            return fail(401, "wrong_credentials")
        db.run("DELETE FROM attempts WHERE key = ?", [nickname_key])
        token = create_session(db, account["id"], now)
        return reply(200, account_view(db, account), session_cookie(token))

    if path == "logout":
        token = read_cookie(req.get("cookie"))
        if token:
            db.run("DELETE FROM sessions WHERE token_hash = ?", [sha256_hex(token)])
        return reply(200, {"ok": True}, clear_cookie)

    if path == "me":
        session = current_session(db, req.get("cookie"), now)
        if not session:
            return reply(401, {"error": "not_signed_in"}, clear_cookie if read_cookie(req.get("cookie")) else None)
        return reply(200, account_view(db, session["account"]), session_cookie(session["token"]) if session["renewed"] else None)

    if path == "recover":
        captcha = captcha_problem("recover")
        if captcha:
            return captcha
        if not isinstance(body.get("nickname"), str) or not isinstance(body.get("recoveryCode"), str):
            return fail(400, "missing_fields")
        key = body["nickname"].strip().lower()
        nickname_key = "nick:" + key
        wait = max(blocked_for(db, nickname_key, LIMITS["nickname"], now), blocked_for(db, device_key, LIMITS["device"], now))
        if wait:
            return fail(429, "too_many_attempts", {"retryAfter": wait})
        account = db.first("SELECT * FROM accounts WHERE nickname_key = ?", [key])
        code = normalize_recovery_code(body["recoveryCode"])
        valid = bool(account) and len(code) == 16 and safe_equal(
            hash_secret(code, account["recovery_salt"], account["password_iter"], pepper if account["peppered"] else ""), account["recovery_hash"])
        if not valid:
            add_attempt(db, nickname_key, LIMITS["nickname"], now)
            add_attempt(db, device_key, LIMITS["device"], now)
            return fail(401, "wrong_recovery")
        password_error = check_password(body.get("newPassword"), account["nickname"])
        if password_error:
            return fail(400, password_error)
        password = new_secret_hash(body["newPassword"], pepper)
        recovery_code = new_recovery_code()
        recovery = new_secret_hash(normalize_recovery_code(recovery_code), pepper)
        db.run("""UPDATE accounts SET password_hash = ?, password_salt = ?, password_iter = ?, peppered = ?, recovery_hash = ?,
                  recovery_salt = ?, updated_at = ? WHERE id = ?""",
               [password["hash"], password["salt"], password["iterations"], 1 if pepper else 0, recovery["hash"], recovery["salt"], now, account["id"]])
        db.run("DELETE FROM sessions WHERE account_id = ?", [account["id"]])
        db.run("DELETE FROM attempts WHERE key = ?", [nickname_key])
        token = create_session(db, account["id"], now)
        updated = db.first("SELECT * FROM accounts WHERE id = ?", [account["id"]])
        return reply(200, {**account_view(db, updated), "recoveryCode": recovery_code}, session_cookie(token))

    if path in ("password", "recovery-code", "delete"):
        session = current_session(db, req.get("cookie"), now)
        if not session:
            return fail(401, "not_signed_in")
        account = session["account"]
        nickname_key = "nick:" + account["nickname_key"]
        wait = blocked_for(db, nickname_key, LIMITS["nickname"], now)
        if wait:
            return fail(429, "too_many_attempts", {"retryAfter": wait})
        given = body.get("currentPassword") if path == "password" else body.get("password")
        if not verify_password(account, given, pepper):
            add_attempt(db, nickname_key, LIMITS["nickname"], now)
            return fail(401, "wrong_password")
        if path == "password":
            password_error = check_password(body.get("newPassword"), account["nickname"])
            if password_error:
                return fail(400, password_error)
            password = new_secret_hash(body["newPassword"], pepper)
            db.run("UPDATE accounts SET password_hash = ?, password_salt = ?, password_iter = ?, peppered = ?, updated_at = ? WHERE id = ?",
                   [password["hash"], password["salt"], password["iterations"], 1 if pepper else 0, now, account["id"]])
            db.run("DELETE FROM sessions WHERE account_id = ? AND token_hash <> ?", [account["id"], session["tokenHash"]])
            return reply(200, {"ok": True})
        if path == "recovery-code":
            recovery_code = new_recovery_code()
            salt = secrets.token_bytes(16).hex()
            digest = hash_secret(normalize_recovery_code(recovery_code), salt, account["password_iter"], pepper if account["peppered"] else "")
            db.run("UPDATE accounts SET recovery_hash = ?, recovery_salt = ?, updated_at = ? WHERE id = ?", [digest, salt, now, account["id"]])
            return reply(200, {"recoveryCode": recovery_code})
        for profile in db.all("SELECT id FROM profiles WHERE account_id = ?", [account["id"]]):
            db.run("DELETE FROM records WHERE profile_id = ?", [profile["id"]])
            db.run("DELETE FROM counters WHERE profile_id = ?", [profile["id"]])
        db.run("DELETE FROM profiles WHERE account_id = ?", [account["id"]])
        db.run("DELETE FROM sessions WHERE account_id = ?", [account["id"]])
        db.run("DELETE FROM attempts WHERE key = ?", [nickname_key])
        db.run("DELETE FROM accounts WHERE id = ?", [account["id"]])
        return reply(200, {"ok": True}, clear_cookie)

    if path == "profiles":
        session = current_session(db, req.get("cookie"), now)
        if not session:
            return fail(401, "not_signed_in")
        account_id = session["account"]["id"]
        rows = db.all("SELECT id, name, position FROM profiles WHERE account_id = ? AND deleted_at IS NULL", [account_id])

        def name_taken(name, except_id):
            return any(p["id"] != except_id and p["name"].lower() == name.lower() for p in rows)

        def check_avatar(avatar):
            return None if avatar in AVATARS else "avatar_unknown"

        renew_cookie = session_cookie(session["token"]) if session["renewed"] else None
        created_id = None
        action = body.get("action")

        if action == "create":
            if len(rows) >= MAX_PROFILES:
                return fail(409, "profiles_full")
            error = check_profile_name(body.get("name")) or check_avatar(body.get("avatar"))
            if error:
                return fail(400, error)
            name = body["name"].strip()
            if name_taken(name, None):
                return fail(409, "profile_name_taken")
            created_id = str(uuid.uuid4())
            position = max([p["position"] for p in rows], default=-1) + 1
            db.run("INSERT INTO profiles (id, account_id, name, avatar, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                   [created_id, account_id, name, body["avatar"], position, now, now])
        elif action in ("update", "remove"):
            profile = next((p for p in rows if p["id"] == body.get("id")), None)
            if not profile:
                return fail(404, "not_found")
            if action == "remove":
                if len(rows) <= 1:
                    return fail(409, "profile_last")
                db.run("UPDATE profiles SET deleted_at = ?, updated_at = ? WHERE id = ?", [now, now, profile["id"]])
                db.run("DELETE FROM records WHERE profile_id = ?", [profile["id"]])
                db.run("DELETE FROM counters WHERE profile_id = ?", [profile["id"]])
            else:
                has_name = "name" in body
                has_avatar = "avatar" in body
                if not has_name and not has_avatar:
                    return fail(400, "missing_fields")
                error = (has_name and check_profile_name(body["name"])) or (has_avatar and check_avatar(body["avatar"]))
                if error:
                    return fail(400, error)
                if has_name and name_taken(body["name"].strip(), profile["id"]):
                    return fail(409, "profile_name_taken")
                if has_name:
                    db.run("UPDATE profiles SET name = ?, updated_at = ? WHERE id = ?", [body["name"].strip(), now, profile["id"]])
                if has_avatar:
                    db.run("UPDATE profiles SET avatar = ?, updated_at = ? WHERE id = ?", [body["avatar"], now, profile["id"]])
        else:
            return fail(400, "unknown_action")
        view = account_view(db, session["account"])
        return reply(201 if created_id else 200, {**view, "created": created_id} if created_id else view, renew_cookie)

    return fail(404, "not_found")


# --- sqlite3 behind the same small interface (first, all, run) ---

class SqliteDatabase:
    def __init__(self, path):
        self.lock = threading.Lock()
        self.conn = sqlite3.connect(str(path), check_same_thread=False, isolation_level=None)
        self.conn.row_factory = sqlite3.Row
        self.conn.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))

    def first(self, sql, params=()):
        with self.lock:
            row = self.conn.execute(sql, list(params)).fetchone()
        return dict(row) if row else None

    def all(self, sql, params=()):
        with self.lock:
            return [dict(r) for r in self.conn.execute(sql, list(params)).fetchall()]

    def run(self, sql, params=()):
        with self.lock:
            self.conn.execute(sql, list(params))

    def batch(self, statements):
        """Several writes at once, all or none (D1's batch)."""
        with self.lock:
            self.conn.execute("BEGIN")
            try:
                for statement in statements:
                    self.conn.execute(statement["sql"], list(statement["params"]))
                self.conn.execute("COMMIT")
            except Exception:
                self.conn.execute("ROLLBACK")
                raise


def default_database_path():
    """Outside the project folder: the local server publishes everything inside it."""
    base = Path(os.environ.get("LOCALAPPDATA") or Path.home()) / "tvzinha-local"
    base.mkdir(parents=True, exist_ok=True)
    return base / "accounts.sqlite3"


_DATABASE = None


def local_database():
    global _DATABASE
    if _DATABASE is None:
        _DATABASE = SqliteDatabase(default_database_path())
    return _DATABASE


def parse_body(raw, limit=4096):
    """(body, error): the POST body as a dict, or the same errors as the function."""
    if len(raw) > limit:
        return None, "too_large"
    try:
        return (json.loads(raw.decode("utf-8")) if raw else {}), None
    except Exception:
        return None, "invalid_json"
