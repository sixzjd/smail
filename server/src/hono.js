// Main Hono app instance - Cloudflare Workers compatible
import { Hono } from 'hono';
import result from './model/result.js';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('*', cors());

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
