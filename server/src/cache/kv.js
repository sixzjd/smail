// KV Cache adapter - replaces Cloudflare KV with in-memory Map + JSON persistence
import fs from 'fs';
import path from 'path';

export class KVCache {
  constructor(persistDir) {
    this.store = new Map();
    this.persistDir = persistDir;
    this.persistPath = path.join(persistDir, 'kv-store.json');
    fs.mkdirSync(persistDir, { recursive: true });
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.persistPath)) {
        const data = JSON.parse(fs.readFileSync(this.persistPath, 'utf-8'));
        for (const [key, value] of Object.entries(data)) {
          if (value.expiration && Date.now() > value.expiration) continue;
          this.store.set(key, value);
        }
      }
    } catch (e) {
      console.warn('[KV] Failed to load persisted data:', e.message);
    }
  }

  _persist() {
    try {
      const obj = {};
      for (const [key, value] of this.store) {
        obj[key] = value;
      }
      fs.writeFileSync(this.persistPath, JSON.stringify(obj));
    } catch (e) {
      console.warn('[KV] Failed to persist data:', e.message);
    }
  }

  async get(key, options) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiration && Date.now() > entry.expiration) {
      this.store.delete(key);
      return null;
    }
    if (options?.type === 'json') {
      return typeof entry.value === 'string' ? JSON.parse(entry.value) : entry.value;
    }
    if (options?.type === 'arrayBuffer') {
      if (typeof entry.value === 'string') {
        return new TextEncoder().encode(entry.value).buffer;
      }
      return entry.value;
    }
    return entry.value;
  }

  async getWithMetadata(key, options) {
    const entry = this.store.get(key);
    if (!entry) return { value: null, metadata: null };
    if (entry.expiration && Date.now() > entry.expiration) {
      this.store.delete(key);
      return { value: null, metadata: null };
    }
    let value = entry.value;
    if (options?.type === 'arrayBuffer' && typeof value === 'string') {
      value = new TextEncoder().encode(value).buffer;
    }
    return { value, metadata: entry.metadata || null };
  }

  async put(key, value, options) {
    const entry = {
      value,
      metadata: options?.metadata || null,
      expiration: options?.expirationTtl ? Date.now() + options.expirationTtl * 1000 : null
    };
    this.store.set(key, entry);
    this._persist();
  }

  async delete(key) {
    this.store.delete(key);
    this._persist();
  }

  async list(options) {
    const prefix = options?.prefix || '';
    const keys = [];
    for (const [name] of this.store) {
      if (name.startsWith(prefix)) {
        keys.push({ name });
      }
    }
    return { keys };
  }
}
