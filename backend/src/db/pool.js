const { Pool } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const isPgRequested = process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith('postgres://') || process.env.DATABASE_URL.startsWith('postgresql://'));

let poolInstance = null;

if (isPgRequested) {
  const pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  poolInstance = {
    isPg: true,
    query: (text, params) => pgPool.query(text, params),
    connect: async () => {
      const client = await pgPool.connect();
      return {
        query: (text, params) => client.query(text, params),
        release: () => client.release(),
      };
    },
    end: () => pgPool.end(),
  };
} else {
  const dbPath = path.join(__dirname, '..', '..', 'society_tracker.db');
  const sqliteDb = new Database(dbPath);
  sqliteDb.pragma('journal_mode = WAL');
  sqliteDb.pragma('foreign_keys = ON');

  sqliteDb.function('now', () => new Date().toISOString());

  function transformSql(sql) {
    let clean = sql
      .replace(/SERIAL PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
      .replace(/DEFAULT NOW\(\)/gi, 'DEFAULT CURRENT_TIMESTAMP')
      .replace(/NOW\(\)/gi, "datetime('now')")
      .replace(/::int/gi, '')
      .replace(/FOR UPDATE/gi, '');
    
    clean = clean.replace(/\$(\d+)/g, '?');
    return clean;
  }

  function executeSqliteQuery(sql, params = []) {
    const cleanSql = transformSql(sql);
    const trimmed = cleanSql.trim();

    // Multi-statement DDL scripts
    if (trimmed.includes(';') && (trimmed.toLowerCase().includes('create table') || trimmed.toLowerCase().includes('create index'))) {
      const statements = cleanSql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      sqliteDb.transaction(() => {
        for (const stmt of statements) {
          sqliteDb.prepare(stmt).run();
        }
      })();
      return { rows: [] };
    }

    const isSelect = trimmed.toLowerCase().startsWith('select');
    const isInsert = trimmed.toLowerCase().startsWith('insert');
    const isUpdate = trimmed.toLowerCase().startsWith('update');
    const isDelete = trimmed.toLowerCase().startsWith('delete');

    if (isSelect || (cleanSql.toLowerCase().includes('returning') && (isInsert || isUpdate || isDelete))) {
      try {
        const stmt = sqliteDb.prepare(cleanSql);
        const rows = stmt.all(...params);
        return { rows };
      } catch (err) {
        const queryWithoutReturning = cleanSql.replace(/RETURNING .*/gi, '');
        const stmt = sqliteDb.prepare(queryWithoutReturning);
        const info = stmt.run(...params);
        return { rows: [{ id: info.lastInsertRowid }] };
      }
    } else {
      const stmt = sqliteDb.prepare(cleanSql);
      const info = stmt.run(...params);
      return { rows: [], lastInsertRowid: info.lastInsertRowid, changes: info.changes };
    }
  }

  poolInstance = {
    isPg: false,
    query: async (text, params) => executeSqliteQuery(text, params),
    connect: async () => {
      return {
        query: async (text, params) => {
          if (text === 'BEGIN') {
            executeSqliteQuery('BEGIN IMMEDIATE');
            return { rows: [] };
          }
          if (text === 'COMMIT') {
            executeSqliteQuery('COMMIT');
            return { rows: [] };
          }
          if (text === 'ROLLBACK') {
            executeSqliteQuery('ROLLBACK');
            return { rows: [] };
          }
          return executeSqliteQuery(text, params);
        },
        release: () => {},
      };
    },
    end: async () => {
      sqliteDb.close();
    },
  };
}

module.exports = poolInstance;
