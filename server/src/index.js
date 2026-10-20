// smail - Cloudflare Workers entry point
import app from './routes.js';
import { email } from './modules/email/email.js';
import kvObjService from './service/kv-obj-service.js';
import userService from './service/user-service.js';
import verifyRecordService from './service/verify-record-service.js';
import emailService from './service/email-service.js';
import oauthService from './service/oauth-service.js';
import analysisService from './service/analysis-service.js';
import clientService from './service/client-service.js';

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

/**
 * 第三方邮件客户端的自动配置。
 *
 * Thunderbird / iOS 邮件 / Outlook 会按固定路径来找配置：
 *   /.well-known/autoconfig/mail/config.v1.xml?emailaddress=xxx
 *   /Autodiscover/Autodiscover.xml            (POST，XML body)
 * 这里直接返回 IMAP / SMTP 的主机与端口，客户端就能自动填表。
 */
async function clientAutoconfig(req, url, env) {

	const isJson = url.pathname.endsWith('.json');
	let emailAddress = url.searchParams.get('emailaddress') || url.searchParams.get('email') || '';

	if (!emailAddress && req.method === 'POST') {
		const body = await req.text();
		const match = /<EMailAddress>([^<]+)<\/EMailAddress>/i.exec(body);
		if (match) emailAddress = match[1];
	}

	const ctx = { env };

	if (isJson) {
		const config = clientService.config(ctx);
		return new Response(JSON.stringify({
			version: '1.1',
			emailProvider: [{
				id: 'smail',
				domain: emailAddress.split('@')[1] || '',
				displayName: 'smail',
				incomingServer: [
					{ type: 'imap', hostname: config.imap.host, port: config.imap.tlsPort, socketType: 'SSL', authentication: 'password-cleartext', username: '%EMAILADDRESS%' },
				],
				outgoingServer: [
					{ type: 'smtp', hostname: config.smtp.host, port: config.smtp.tlsPort, socketType: 'SSL', authentication: 'password-cleartext', username: '%EMAILADDRESS%' },
				],
			}],
		}), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
	}

	const xml = url.pathname.toLowerCase().includes('autodiscover')
		? clientService.autodiscoverXml(ctx, emailAddress)
		: clientService.autoconfigXml(ctx, emailAddress);

	return new Response(xml, { headers: { 'Content-Type': 'text/xml; charset=utf-8' } });
}

export default {
	async fetch(req, env, ctx) {

		const url = new URL(req.url);

		// 第三方邮件客户端自动配置（Thunderbird / Outlook）
		if (url.pathname.startsWith('/.well-known/autoconfig/') || url.pathname.toLowerCase() === '/autodiscover/autodiscover.xml') {
			return await clientAutoconfig(req, url, env);
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
