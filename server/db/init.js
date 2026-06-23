const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'unhook.db');
let db = null;

function initDb() {
  if (db) return db;

  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(dbPath);

  // Enable WAL mode for better concurrent access
  db.pragma('journal_mode = WAL');
  // Secure delete to prevent data recovery from free pages
  db.pragma('secure_delete = 1');

  // Add columns for existing databases (migration)
  try { db.exec('ALTER TABLE cuts ADD COLUMN filter_id TEXT'); } catch (e) {}
  try { db.exec('ALTER TABLE cuts ADD COLUMN trashed_count INTEGER DEFAULT 0'); } catch (e) {}

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      google_id TEXT UNIQUE,
      email TEXT UNIQUE,
      access_token TEXT,
      refresh_token TEXT,
      token_expiry INTEGER,
      language TEXT DEFAULT 'en',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cuts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      sender_email TEXT,
      sender_name TEXT,
      filter_id TEXT,
      trashed_count INTEGER DEFAULT 0,
      cut_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS snoozes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      sender_email TEXT,
      snooze_until DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS streaks (
      user_id TEXT PRIMARY KEY,
      current_streak INTEGER DEFAULT 0,
      last_use_date TEXT,
      total_cuts INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
  `);

  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = initDb;
module.exports.getDb = getDb;
module.exports.closeDb = closeDb;
