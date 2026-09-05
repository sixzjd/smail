// smail - Cloudflare Workers entry point
import app from './routes.js';
import { email } from './modules/email/email.js';
import kvObjService from './service/kv-obj-service.js';
import userService from './service/user-service.js';
import verifyRecordService from './service/verify-record-service.js';
import emailService from './service/email-service.js';
import oauthService from './service/oauth-service.js';
import analysisService from './service/analysis-service.js';

export default {
	async fetch(req, env, ctx) {

		const url = new URL(req.url);

		const host = req.headers.get('host') || '';

		// Domain‑specific placeholders (e.g. FakeGPS) – serve a lightweight HTML page
		if (host.startsWith('fakegps.')) {
			return new Response(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>FakeGPS（占位页面）</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { font-family: system-ui, sans-serif; display: flex; flex-direction: column;
           align-items: center; justify-content: center; height: 100vh;
           margin: 0; background: #f5f5f5; color: #333; }
    h1 { margin-bottom: 0.5rem; }
    p { max-width: 500px; text-align: center; line-height: 1.6; }
    a { color: #1e88e5; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>🚀 FakeGPS（占位页面）</h1>
  <p>该子域尚未部署完整的 FakeGPS 功能，官方源码请访问 GitHub：</p>
  <p><a href="https://github.com/sixzjd/fakegps" target="_blank">github.com/sixzjd/fakegps</a></p>
</body>
</html>
`, {
				status: 200,
				headers: { 'Content-Type': 'text/html; charset=UTF-8' },
			});
		}

		// Serve static files / attachments from KV
		if (['/static/', '/attachments/'].some(p => url.pathname.startsWith(p))) {
			return await kvObjService.toObjResp({ env }, url.pathname.substring(1));
		}

		// API requests go through Hono app
		if (url.pathname.startsWith('/api/')) {
			return app.fetch(req, env, ctx);
		}

		// Non-API, non-static paths: delegate to Workers Assets (SPA fallback)
		return env.assets.fetch(req);
	},

	email: email,

	async scheduled(c, env, ctx) {
		if (c.cron === '*/30 * * * *') {
			await analysisService.refreshEchartsCache({ env });
			return;
		}

		await verifyRecordService.clearRecord({ env });
		await userService.resetDaySendCount({ env });
		await emailService.completeReceiveAll({ env });
		await oauthService.clearNoBindOathUser({ env });
		await analysisService.refreshEchartsCache({ env });
	},
};
