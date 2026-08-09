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
