/* Tvzinha Online - accounts database (Cloudflare D1, and tools/local_accounts.py with sqlite3) */
/* Paste in the D1 console of each database (tvzinha-accounts and tvzinha-accounts-preview). Safe to run again. */
/* Comments are block comments: the D1 console joins the lines, and a line comment would hide everything after it. */
/* No e-mail is required; the column is there for an optional recovery e-mail later. No real name, no IP. */

CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    nickname TEXT NOT NULL,    /* as typed (shown) */
    nickname_key TEXT NOT NULL UNIQUE,    /* lower case (unique, used to sign in) */
    password_hash TEXT NOT NULL,    /* PBKDF2-SHA256, hex */
    password_salt TEXT NOT NULL,    /* 16 bytes, hex */
    password_iter INTEGER NOT NULL,    /* rounds used for this account (can be raised later) */
    peppered INTEGER NOT NULL DEFAULT 0,    /* 1 when the server secret ACCOUNTS_PEPPER took part in the hash */
    recovery_hash TEXT NOT NULL,    /* the recovery code, hashed like the password */
    recovery_salt TEXT NOT NULL,
    email TEXT,    /* optional recovery e-mail (not used yet) */
    created_at INTEGER NOT NULL,    /* milliseconds */
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,    /* SHA-256 of the cookie token (the token itself is never stored) */
    account_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    last_seen_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_account ON sessions(account_id);

CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted_at INTEGER    /* set when removed (the sync tells the other devices) */
);
CREATE INDEX IF NOT EXISTS profiles_account ON profiles(account_id);

/* Synced data of each profile (step 4c): one row per title, show, channel or preferences record */
CREATE TABLE IF NOT EXISTS records (
    profile_id TEXT NOT NULL,
    kind TEXT NOT NULL,    /* library | progress | favorite | prefs */
    key TEXT NOT NULL,
    data TEXT NOT NULL,    /* JSON, each field with the time it changed */
    updated_at INTEGER NOT NULL,
    rev INTEGER NOT NULL,    /* change number of the profile when it was written */
    PRIMARY KEY (profile_id, kind, key)
);
CREATE INDEX IF NOT EXISTS records_rev ON records(profile_id, rev);

CREATE TABLE IF NOT EXISTS counters (
    profile_id TEXT PRIMARY KEY,
    rev INTEGER NOT NULL
);

/* Wrong passwords and codes: per nickname and per device (a daily-salted hash of the IP) */
CREATE TABLE IF NOT EXISTS attempts (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    window_start INTEGER NOT NULL
);
