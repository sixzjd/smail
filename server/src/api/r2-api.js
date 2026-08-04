import r2Service from '../service/r2-service.js';
import app from '../hono.js';

app.get('/api/oss/*', async (c) => {
	const key = c.req.path.split('/api/oss/')[1];
	const obj = await r2Service.getObj(c, key);
	return new Response(obj.body, {
		headers: {
			'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
			'Content-Disposition': obj.httpMetadata?.contentDisposition || null
		}
	});
});


