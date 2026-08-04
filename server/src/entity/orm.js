import { drizzle } from 'drizzle-orm/better-sqlite3';

export default function orm(c) {
  // c.env.db is a D1Wrapper; drizzle needs the raw better-sqlite3 instance
  const sqlite = c.env.db.rawSqlite || c.env.db;
  return drizzle(sqlite, { logger: c.env.orm_log });
}
