// smail - Self-hosted email service
// Entry point: Hono on Node.js
import { serve } from '@hono/node-server';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Import shared env (auto-initializes services on import)
import envBindings, { storage } from './env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '8787');

// Import the app (routes + security middleware)
import app from './routes.js';

// Serve static files (attachments, backgrounds)
app.get('/static/*', async (c) => {
  const filePath = c.req.path.substring(1);
  return storage.serve(filePath);
});

app.get('/attachments/*', async (c) => {
  const filePath = c.req.path.substring(1);
  return storage.serve(filePath);
});

// Serve frontend in production (built to server/dist/)
const webDistPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(webDistPath)) {
  // Serve built assets (JS, CSS, images, etc.)
  app.get('/assets/*', async (c) => {
    const filePath = path.join(webDistPath, c.req.path);
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath);
      const mimeTypes = { '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff': 'font/woff', '.woff2': 'font/woff2' };
      return c.body(fs.readFileSync(filePath), 200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream', 'Cache-Control': 'public, max-age=31536000, immutable' });
    }
    return c.text('Not Found', 404);
  });

  // Serve PWA / root-level files
  for (const file of ['manifest.webmanifest', 'sw.js', 'registerSW.js']) {
    app.get(`/${file}`, async (c) => {
      const fp = path.join(webDistPath, file);
      if (fs.existsSync(fp)) {
        const ext = path.extname(file);
        const mime = { '.webmanifest': 'application/manifest+json', '.js': 'application/javascript' }[ext] || 'application/octet-stream';
        return c.body(fs.readFileSync(fp), 200, { 'Content-Type': mime });
      }
      return c.text('Not Found', 404);
    });
  }

  // Serve workbox and other root-level JS files from dist
  app.get('/workbox-:file', async (c) => {
    const fileName = `workbox-${c.req.param('file')}`;
    const fp = path.join(webDistPath, fileName);
    if (fs.existsSync(fp)) {
      return c.body(fs.readFileSync(fp), 200, { 'Content-Type': 'application/javascript' });
    }
    return c.text('Not Found', 404);
  });

  // SPA fallback: serve index.html for all other routes
  app.get('*', async (c) => {
    const indexPath = path.join(webDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      const html = fs.readFileSync(indexPath, 'utf-8');
      return c.html(html);
    }
    return c.text('Frontend not built. Run: npm run build', 404);
  });
}

// Error handling
app.onError((err, c) => {
  if (err.name === 'BizError') {
    return c.json({ code: err.code || 500, message: err.message });
  }
  console.error('[Server Error]', err);
  return c.json({ code: 500, message: 'Internal Server Error' });
});

// Start server
console.log(`
  ╔═══════════════════════════════════════╗
  ║       smail · 本地邮件服务             ║
  ║   http://localhost:${String(PORT).padEnd(5)}              ║
  ╚═══════════════════════════════════════╝
`);

serve({ fetch: app.fetch, port: PORT });
