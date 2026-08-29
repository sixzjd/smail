import resendService from '../service/resend-service.js';
import app from '../hono.js';

//校验 Resend(Svix) webhook 签名，未配置 resend_webhook_secret 时跳过校验
async function verifySvixSignature(c, rawBody) {

	const secret = c.env.resend_webhook_secret;

	if (!secret) {
		return true;
	}

	const id = c.req.header('svix-id');
	const timestamp = c.req.header('svix-timestamp');
	const signatures = c.req.header('svix-signature');

	if (!id || !timestamp || !signatures) {
		return false;
	}

	//拒绝超过 5 分钟的请求，防重放
	const timestampInt = parseInt(timestamp, 10);
	if (Number.isNaN(timestampInt) || Math.abs(Date.now() / 1000 - timestampInt) > 300) {
		return false;
	}

	const key = atob(secret.replace(/^whsec_/, ''));
	const cryptoKey = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(key),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);

	const signedContent = `${id}.${timestamp}.${rawBody}`;
	const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(signedContent));
	const expected = btoa(String.fromCharCode(...new Uint8Array(signature)));

	return signatures.split(' ').some(sig => sig.replace(/^v1,/, '') === expected);
}

app.post('/api/webhooks', async (c) => {
	try {
		const rawBody = await c.req.text();

		if (!await verifySvixSignature(c, rawBody)) {
			return c.text('invalid signature', 401)
		}

		await resendService.webhooks(c, JSON.parse(rawBody));
		return c.text('success', 200)
	} catch (e) {
		return c.text(e.message, 500)
	}
})
