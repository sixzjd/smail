// smail - Cloudflare Workers entry point
import app from './routes.js';
import { email } from './modules/email/email.js';
import kvObjService from './service/kv-obj-service.js';
import userService from './service/user-service.js';
import verifyRecordService from './service/verify-record-service.js';
import emailService from './service/email-service.js';
import oauthService from './service/oauth-service.js';
import analysisService from './service/analysis-service.js';

/**
 * 请求的哈希资源已经不存在——几乎总是因为客户端缓存了旧版 index.html。
 *
 * 直接 404 的话，用户会永久卡死在加载遮罩上且看不出原因；这里对脚本请求返回一小段 JS，
 * 让它带 cache-buster 重新加载一次，从旧壳子里自救出来。样式/图片等非脚本请求老实 404。
 *
 * 防死循环：用 sessionStorage 标记只自救一次；前端挂载成功后会把该标记清掉
 * （见 web/src/main.js），所以下一次真的坏掉时仍能自救。
 */
function assetGone(req, url) {
	const headers = { 'Cache-Control': 'no-store' };
	const isScript = url.pathname.endsWith('.js') && req.headers.get('sec-fetch-dest') === 'script';

	if (isScript) {
		return new Response(
			`try{if(!sessionStorage.getItem('__smail_asset_heal')){` +
			`sessionStorage.setItem('__smail_asset_heal','1');` +
			`location.replace('/?_r='+Date.now())}}catch(e){}`,
			{ status: 200, headers: { ...headers, 'Content-Type': 'text/javascript; charset=utf-8' } },
		);
	}

	return new Response('资源已更新，请刷新页面 / Asset not found, please reload.', {
		status: 404,
		headers: { ...headers, 'Content-Type': 'text/plain; charset=utf-8' },
	});
}

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

		// 形如 /assets/xxx.js 或带文件后缀的请求，先取一次判断是否真的存在。
		// 原因：not_found_handling = "single-page-application" 会把「任何」找不到的路径
		// 都返回 index.html（content-type: text/html）。这对前端路由是正确的，但对
		// /assets/ 下的哈希文件是灾难——浏览器会把 HTML 当 ES module 解析并抛出
		// "'text/html' is not a valid JavaScript MIME type"，整个 SPA 起不来；
		// 而旧版 index.html 没有启动看门狗，页面就永久卡在加载遮罩上（手机端白屏成因之一）。
		const isAssetLike = url.pathname.startsWith('/assets/') || /\.[a-z0-9]{2,8}$/i.test(url.pathname);
		if (isAssetLike) {
			const resp = await env.assets.fetch(req);
			const type = resp.headers.get('content-type') || '';
			if (resp.ok && type.includes('text/html')) {
				return assetGone(req, url);
			}
			return resp;
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
