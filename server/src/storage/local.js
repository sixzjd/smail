// Local filesystem storage adapter - replaces Cloudflare R2
// Supports both R2-compatible API and direct file serving
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

export class LocalStorage {
  constructor(baseDir) {
    this.baseDir = baseDir;
    fs.mkdirSync(baseDir, { recursive: true });
  }

  // R2-compatible put API
  async put(key, body, options) {
    const filePath = path.join(this.baseDir, key);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    let buffer;
    if (body instanceof ArrayBuffer) {
      buffer = Buffer.from(body);
    } else if (body instanceof Uint8Array) {
      buffer = Buffer.from(body);
    } else if (typeof body === 'string') {
      buffer = Buffer.from(body, 'utf-8');
    } else if (body && typeof body.arrayBuffer === 'function') {
      const ab = await body.arrayBuffer();
      buffer = Buffer.from(ab);
    } else {
      buffer = Buffer.from(body);
    }

    fs.writeFileSync(filePath, buffer);

    // Store metadata alongside the file
    if (options?.httpMetadata || options?.metadata) {
      const metaPath = filePath + '.meta.json';
      const meta = {
        httpMetadata: options.httpMetadata || {},
        metadata: options.metadata || {},
      };
      fs.writeFileSync(metaPath, JSON.stringify(meta));
    }
  }

  // R2-compatible get API
  async get(key) {
    const filePath = path.join(this.baseDir, key);
    if (!fs.existsSync(filePath)) return null;

    const body = fs.readFileSync(filePath);
    const meta = this._readMeta(filePath);

    return {
      body,
      httpMetadata: meta?.httpMetadata || { contentType: mime.lookup(filePath) || 'application/octet-stream' },
      metadata: meta?.metadata || {},
    };
  }

  // R2-compatible delete API
  async delete(key) {
    const filePath = path.join(this.baseDir, key);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    const metaPath = filePath + '.meta.json';
    if (fs.existsSync(metaPath)) {
      fs.unlinkSync(metaPath);
    }
  }

  async head(key) {
    const filePath = path.join(this.baseDir, key);
    if (!fs.existsSync(filePath)) return null;
    const stat = fs.statSync(filePath);
    return { size: stat.size, modified: stat.mtime };
  }

  // Serve file as HTTP Response (for static file serving)
  serve(filePath) {
    const fullPath = path.join(this.baseDir, filePath);
    if (!fs.existsSync(fullPath)) {
      return new Response('Not Found', { status: 404 });
    }
    const content = fs.readFileSync(fullPath);
    const contentType = mime.lookup(fullPath) || 'application/octet-stream';
    return new Response(content, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  _readMeta(filePath) {
    const metaPath = filePath + '.meta.json';
    try {
      if (fs.existsSync(metaPath)) {
        return JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      }
    } catch (e) { /* ignore */ }
    return null;
  }
}
