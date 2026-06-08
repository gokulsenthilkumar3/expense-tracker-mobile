/**
 * SQLite schema initialization
 * Run once on app launch via initDB()
 */

export const CREATE_TABLES_SQL = `
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY,
    name            TEXT NOT NULL,
    pin_hash        TEXT,
    security_q      TEXT,
    security_a_hash TEXT,
    currency        TEXT DEFAULT 'INR',
    locale          TEXT DEFAULT 'en-IN',
    created_at      TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    icon       TEXT,
    color      TEXT,
    parent_id  INTEGER REFERENCES categories(id),
    is_system  INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS payment_modes (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT NOT NULL,
    is_system INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    amount          REAL NOT NULL,
    date            TEXT NOT NULL,
    category_id     INTEGER REFERENCES categories(id),
    subcategory_id  INTEGER REFERENCES categories(id),
    payment_mode_id INTEGER REFERENCES payment_modes(id),
    note            TEXT,
    tags            TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS recurring_templates (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL CHECK(type IN ('fixed','installment','variable')),
    category_id     INTEGER REFERENCES categories(id),
    payment_mode_id INTEGER REFERENCES payment_modes(id),
    amount          REAL,
    total_periods   INTEGER,
    paid_periods    INTEGER DEFAULT 0,
    installment_amt REAL,
    min_amount      REAL,
    max_amount      REAL,
    frequency       TEXT NOT NULL CHECK(frequency IN ('daily','weekly','monthly','yearly')),
    start_date      TEXT NOT NULL,
    end_date        TEXT,
    next_due_date   TEXT NOT NULL,
    reminder_days   INTEGER DEFAULT 1,
    reminder_on_due INTEGER DEFAULT 1,
    status          TEXT DEFAULT 'active' CHECK(status IN ('active','paused','completed')),
    note            TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS recurring_entries (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id     INTEGER NOT NULL REFERENCES recurring_templates(id),
    due_date        TEXT NOT NULL,
    actual_amount   REAL,
    status          TEXT DEFAULT 'pending' CHECK(status IN ('pending','paid','missed','skipped')),
    paid_date       TEXT,
    note            TEXT,
    notification_id TEXT,
    created_at      TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    month       TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    amount      REAL NOT NULL,
    alert_pct   INTEGER DEFAULT 80,
    created_at  TEXT DEFAULT (datetime('now')),
    UNIQUE(month, category_id)
  );

  CREATE TABLE IF NOT EXISTS notifications_log (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    type     TEXT NOT NULL,
    ref_id   INTEGER,
    ref_type TEXT,
    message  TEXT,
    sent_at  TEXT DEFAULT (datetime('now')),
    action   TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_expenses_date     ON expenses(date);
  CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category_id);
  CREATE INDEX IF NOT EXISTS idx_recurring_due     ON recurring_entries(due_date);
  CREATE INDEX IF NOT EXISTS idx_recurring_status  ON recurring_entries(status);
  CREATE INDEX IF NOT EXISTS idx_budgets_month     ON budgets(month);
`;

export const SEED_DEFAULTS_SQL = `
  INSERT OR IGNORE INTO payment_modes (id, name, is_system) VALUES
    (1, 'Cash', 1),
    (2, 'UPI', 1),
    (3, 'Debit Card', 1),
    (4, 'Credit Card', 1),
    (5, 'Net Banking', 1),
    (6, 'Cheque', 1);

  INSERT OR IGNORE INTO categories (id, name, icon, color, is_system) VALUES
    (1,  'Food & Dining',       '🍽️',  '#e67e22', 1),
    (2,  'Transport',           '🚗',  '#2980b9', 1),
    (3,  'Utilities',           '💡',  '#f1c40f', 1),
    (4,  'Rent & Housing',      '🏠',  '#27ae60', 1),
    (5,  'Healthcare',          '🏥',  '#e74c3c', 1),
    (6,  'Education',           '📚',  '#8e44ad', 1),
    (7,  'Entertainment',       '🎬',  '#16a085', 1),
    (8,  'Loan / EMI',          '🏦',  '#c0392b', 1),
    (9,  'Chit Fund',           '💰',  '#d35400', 1),
    (10, 'Subscriptions',       '📱',  '#2c3e50', 1),
    (11, 'Groceries',           '🛒',  '#7f8c8d', 1),
    (12, 'Personal Care',       '🧴',  '#f39c12', 1),
    (13, 'Savings / Investment','💹',  '#1abc9c', 1),
    (14, 'Miscellaneous',       '📦',  '#95a5a6', 1);
`;
