import initSqlJs, { Database } from "sql.js";

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (!db) {
    const SQL = await initSqlJs();
    db = new SQL.Database();
    migrate(db);
  }
  return db;
}

function migrate(db: Database) {
  db.run(`
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
    )
  `);

  db.run(`
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
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      service_id TEXT NOT NULL,
      diff TEXT NOT NULL,
      acknowledged INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_services_user ON services(user_id)
  `);
  db.run(`
    CREATE INDEX IF NOT EXISTS idx_changes_user_service ON changes(user_id, service_id, created_at DESC)
  `);
}

// Helper: run a query and return all rows as objects
export async function queryAll(
  sql: string,
  params: (string | number | null)[] = []
): Promise<Record<string, unknown>[]> {
  const database = await getDb();
  const stmt = database.prepare(sql);
  stmt.bind(params);
  const rows: Record<string, unknown>[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: run a query and return one row
export async function queryOne(
  sql: string,
  params: (string | number | null)[] = []
): Promise<Record<string, unknown> | undefined> {
  const rows = await queryAll(sql, params);
  return rows[0];
}

// Helper: run a statement (insert/update/delete)
export async function run(
  sql: string,
  params: (string | number | null)[] = []
): Promise<{ changes: number; lastInsertRowid: number }> {
  const database = await getDb();
  const stmt = database.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
  return {
    changes: database.getRowsModified(),
    lastInsertRowid: 0, // sql.js doesn't expose this easily
  };
}

// Helper: get last insert row id
export async function lastInsertRowId(): Promise<number> {
  const result = await queryOne("SELECT last_insert_rowid() as id");
  return (result?.id as number) || 0;
}

export default getDb;
