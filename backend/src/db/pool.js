const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
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
  const sqliteDb = new sqlite3.Database(dbPath);

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
    return new Promise((resolve, reject) => {
      const cleanSql = transformSql(sql);
      const trimmed = cleanSql.trim();

      // Multi-statement DDL scripts
      if (trimmed.includes(';') && (trimmed.toLowerCase().includes('create table') || trimmed.toLowerCase().includes('create index'))) {
        sqliteDb.exec(cleanSql, (err) => {
          if (err) return reject(err);
          resolve({ rows: [] });
        });
        return;
      }

      const isSelect = trimmed.toLowerCase().startsWith('select');
      const isInsert = trimmed.toLowerCase().startsWith('insert');
      const isUpdate = trimmed.toLowerCase().startsWith('update');
      const isDelete = trimmed.toLowerCase().startsWith('delete');

      if (isSelect || (cleanSql.toLowerCase().includes('returning') && (isInsert || isUpdate || isDelete))) {
        sqliteDb.all(cleanSql, params, (err, rows) => {
          if (err) {
            const queryWithoutReturning = cleanSql.replace(/RETURNING .*/gi, '');
            sqliteDb.run(queryWithoutReturning, params, function (runErr) {
              if (runErr) return reject(runErr);
              resolve({ rows: [{ id: this.lastID }] });
            });
          } else {
            resolve({ rows: rows || [] });
          }
        });
      } else {
        sqliteDb.run(cleanSql, params, function (err) {
          if (err) return reject(err);
          resolve({ rows: [], lastInsertRowid: this.lastID, changes: this.changes });
        });
      }
    });
  }

  poolInstance = {
    isPg: false,
    query: (text, params) => executeSqliteQuery(text, params),
    connect: async () => {
      return {
        query: (text, params) => {
          if (text === 'BEGIN') return executeSqliteQuery('BEGIN TRANSACTION');
          if (text === 'COMMIT') return executeSqliteQuery('COMMIT');
          if (text === 'ROLLBACK') return executeSqliteQuery('ROLLBACK');
          return executeSqliteQuery(text, params);
        },
        release: () => {},
      };
    },
    end: () => {
      return new Promise((resolve) => sqliteDb.close(() => resolve()));
    },
  };
}

module.exports = poolInstance;
