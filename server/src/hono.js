// Main Hono app instance - Cloudflare Workers compatible
import { Hono } from 'hono';
import result from './model/result.js';

const app = new Hono();

//前端与 API 同域部署（Workers Assets），仅放行同源与本地开发端口
const allowedOrigins = ['http://localhost:3001', 'http://127.0.0.1:3001'];

app.use('*', async (c, next) => {
	const origin = c.req.header('Origin');
	if (origin && !allowedOrigins.includes(origin) && origin !== new URL(c.req.url).origin) {
		return c.text('Forbidden', 403);
	}
	await next();
	if (origin) {
		c.header('Access-Control-Allow-Origin', origin);
		c.header('Vary', 'Origin');
	}
});

app.onError((err, c) => {
	if (err.name === 'BizError') {
		console.log('[BizError]', err.message);
	} else {
		console.error('[Error]', err);
	}

	if (err.message?.includes(`Cannot read properties of undefined (reading 'get')`)) {
		return c.json(result.fail('KV数据库未绑定 KV database not bound', 502));
	}
	if (err.message?.includes(`Cannot read properties of undefined (reading 'put')`)) {
		return c.json(result.fail('KV数据库未绑定 KV database not bound', 502));
	}
	if (err.message?.includes(`Cannot read properties of undefined (reading 'prepare')`)) {
		return c.json(result.fail('D1数据库未绑定 D1 database not bound', 502));
	}

	return c.json(result.fail(err.message, err.code));
});

export default app;
