import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, SEED_DEFAULTS_SQL } from './schema';

let _db: SQLite.SQLiteDatabase | null = null;

import { Platform } from 'react-native';

export function getDB(): SQLite.SQLiteDatabase {
  if (!_db) {
    if (Platform.OS === 'web') {
      console.warn('SQLite is not supported on web. Using mock DB.');
      _db = {
        execAsync: async () => {},
        runAsync: async () => ({ lastInsertRowId: 1, changes: 1 }),
        getAllAsync: async () => [],
        getFirstAsync: async () => null,
      } as any;
    } else {
      _db = SQLite.openDatabaseSync('expense_tracker.db');
    }
  }
  return _db;
}

export async function initDB(): Promise<void> {
  const db = getDB();
  await db.execAsync(CREATE_TABLES_SQL);
  await db.execAsync(SEED_DEFAULTS_SQL);
  console.log('[DB] Initialized successfully');
}
