import resendService from '../service/resend-service.js';
import app from '../hono.js';
app.post('/api/webhooks',async (c) => {
	try {
		await resendService.webhooks(c, await c.req.json());
		return c.text('success', 200)
	} catch (e) {
		return  c.text(e.message, 500)
	}
})
