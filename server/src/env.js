// Shared environment bindings - mimics Cloudflare Workers env
// Auto-initializes on first import, available to all modules
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { initDatabase } from './db/index.js';
import { KVCache } from './cache/kv.js';
import { LocalStorage } from './storage/local.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.resolve(__dirname, '../../data');

// Initialize core services
const dbPath = path.join(DATA_DIR, 'db', 'smail.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlite = initDatabase(dbPath);
const kv = new KVCache(path.join(DATA_DIR, 'cache'));
const storage = new LocalStorage(path.join(DATA_DIR, 'storage'));

const envBindings = {
  db: sqlite,
  kv,
  r2: storage,
  domain: (process.env.DOMAIN || 'localhost').split(','),
  admin: process.env.ADMIN || 'admin@localhost',
  jwt_secret: process.env.JWT_SECRET || 'smail-secret-change-me',
  smtp_host: process.env.SMTP_HOST || '',
  smtp_port: parseInt(process.env.SMTP_PORT || '587'),
  smtp_user: process.env.SMTP_USER || '',
  smtp_pass: process.env.SMTP_PASS || '',
  analysis_cache: process.env.ANALYSIS_CACHE === 'true',
  orm_log: process.env.ORM_LOG === 'true',
};

export { sqlite, kv, storage, envBindings };
export default envBindings;
