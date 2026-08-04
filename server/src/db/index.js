// D1-compatible wrapper for better-sqlite3
// Cloudflare D1 has a different API from better-sqlite3's raw interface
// This wrapper makes c.env.db.prepare() work exactly like D1
import Database from 'better-sqlite3';

export class D1Wrapper {
  constructor(sqlite) {
    this._sqlite = sqlite;
  }

  // Expose raw better-sqlite3 instance for drizzle-orm
  get rawSqlite() {
    return this._sqlite;
  }

  prepare(sql) {
    const stmt = this._sqlite.prepare(sql);
    const self = this;

    return {
      bind(...params) {
        // D1 bind can be called with individual args or a single array
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        return {
          async run() {
            const result = stmt.run(...flatParams);
            return {
              success: true,
              results: [],
              meta: { changed: result.changes, duration: 0, last_row_id: result.lastInsertRowid }
            };
          },
          async first(col) {
            const row = stmt.get(...flatParams);
            if (!row) return null;
            if (col) return row[col];
            return row;
          },
          async all() {
            const rows = stmt.all(...flatParams);
            return { results: rows };
          },
          async raw() {
            const rows = stmt.all(...flatParams);
            if (rows.length === 0) return [];
            return Object.values(rows[0]);
          }
        };
      },

      async run() {
        const result = stmt.run();
        return {
          success: true,
          results: [],
          meta: { changed: result.changes, duration: 0, last_row_id: result.lastInsertRowid }
        };
      },

      async first(col) {
        const row = stmt.get();
        if (!row) return null;
        if (col) return row[col];
        return row;
      },

      async all() {
        const rows = stmt.all();
        return { results: rows };
      },

      async raw() {
        const rows = stmt.all();
        if (rows.length === 0) return [];
        return Object.values(rows[0]);
      }
    };
  }

  async batch(statements) {
    const results = [];
    const transaction = this._sqlite.transaction(() => {
      for (const stmt of statements) {
        // Each statement is a prepared statement with bind already called
        // In D1 batch, you pass promises from prepare().run() etc.
        results.push(stmt);
      }
    });
    transaction();
    return results;
  }

  async exec(sql) {
    this._sqlite.exec(sql);
    return { success: true, duration: 0 };
  }
}

export function initDatabase(dbPath) {
  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  return new D1Wrapper(sqlite);
}
