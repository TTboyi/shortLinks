const Database = require('better-sqlite3')
const path = require('path')
const bcrypt = require('bcryptjs')

const DB_PATH = path.join(__dirname, '..', 'data.db')

const db = new Database(DB_PATH)

// Performance tuning
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ─── Schema ───────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    username  TEXT NOT NULL UNIQUE,
    password  TEXT NOT NULL,
    real_name TEXT NOT NULL DEFAULT '',
    phone     TEXT NOT NULL DEFAULT '',
    mail      TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS groups (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    gid        TEXT NOT NULL UNIQUE,
    username   TEXT NOT NULL,
    name       TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS links (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    domain          TEXT NOT NULL DEFAULT 'localhost:8000',
    short_uri       TEXT NOT NULL UNIQUE,
    full_short_url  TEXT NOT NULL UNIQUE,
    origin_url      TEXT NOT NULL,
    gid             TEXT NOT NULL,
    username        TEXT NOT NULL,
    created_type    INTEGER NOT NULL DEFAULT 0,
    valid_date_type INTEGER NOT NULL DEFAULT 0,
    valid_date      TEXT,
    describe        TEXT NOT NULL DEFAULT '',
    favicon         TEXT NOT NULL DEFAULT '',
    del_flag        INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_links_gid ON links(gid);
  CREATE INDEX IF NOT EXISTS idx_links_del_flag ON links(del_flag);
  CREATE INDEX IF NOT EXISTS idx_links_short_uri ON links(short_uri);

  CREATE TABLE IF NOT EXISTS visits (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    full_short_url TEXT NOT NULL,
    gid            TEXT NOT NULL,
    visit_date     TEXT NOT NULL,
    visit_hour     INTEGER NOT NULL DEFAULT 0,
    visit_weekday  INTEGER NOT NULL DEFAULT 0,
    ip             TEXT NOT NULL DEFAULT '0.0.0.0',
    locale         TEXT NOT NULL DEFAULT '其他',
    browser        TEXT NOT NULL DEFAULT '其他',
    os             TEXT NOT NULL DEFAULT '其他',
    device         TEXT NOT NULL DEFAULT 'PC',
    network        TEXT NOT NULL DEFAULT 'WIFI',
    session_id     TEXT NOT NULL DEFAULT '',
    created_at     TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_visits_full_short_url ON visits(full_short_url);
  CREATE INDEX IF NOT EXISTS idx_visits_gid ON visits(gid);
  CREATE INDEX IF NOT EXISTS idx_visits_date ON visits(visit_date);
`)

// Seed default admin user if no users exist
const userCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get()
if (userCount.cnt === 0) {
  const hash = bcrypt.hashSync('admin123', 10)
  db.prepare(`
    INSERT INTO users (username, password, real_name, phone, mail)
    VALUES (?, ?, ?, ?, ?)
  `).run('admin', hash, '管理员', '13800138000', 'admin@example.com')
  console.log('[DB] Default user created: admin / admin123')
}

module.exports = db
