import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, SEED_DEFAULTS_SQL } from './schema';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDB(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync('expense_tracker.db');
  }
  return _db;
}

export async function initDB(): Promise<void> {
  const db = getDB();
  // PRAGMAs MUST be run separately — expo-sqlite v16 does not support
  // mixing PRAGMA statements inside a multi-statement execAsync block.
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync(CREATE_TABLES_SQL);
  await db.execAsync(SEED_DEFAULTS_SQL);
  console.log('[DB] Initialized successfully');
}
