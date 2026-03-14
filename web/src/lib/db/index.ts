import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "driftguard.db");

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    migrate(db);
  }
  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      plan TEXT NOT NULL DEFAULT 'free',
      trial_ends_at TEXT,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      api_key TEXT DEFAULT '',
      connected INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1,
      last_polled_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (id, user_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      service_id TEXT NOT NULL,
      config TEXT NOT NULL,
      hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (service_id, user_id) REFERENCES services(id, user_id)
    );

    CREATE TABLE IF NOT EXISTS changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      service_id TEXT NOT NULL,
      diff TEXT NOT NULL,
      acknowledged INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (service_id, user_id) REFERENCES services(id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_services_user ON services(user_id);
    CREATE INDEX IF NOT EXISTS idx_snapshots_user_service ON snapshots(user_id, service_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_changes_user_service ON changes(user_id, service_id, created_at DESC);
  `);
}

export default getDb;
