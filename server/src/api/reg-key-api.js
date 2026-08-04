import app from '../hono.js';
import result from '../model/result.js';
import regKeyService from '../service/reg-key-service.js';
import userContext from '../security/user-context.js';

app.post('/api/regKey/add', async (c) => {
	await regKeyService.add(c, await c.req.json(), await userContext.getUserId(c));
	return c.json(result.ok());
})

app.get('/api/regKey/list', async (c) => {
	const list = await regKeyService.list(c, c.req.query());
	 return c.json(result.ok(list));
})

app.delete('/api/regKey/delete', async (c) => {
	await regKeyService.delete(c, c.req.query());
	return c.json(result.ok());
})

app.delete('/api/regKey/clearNotUse', async (c) => {
	await regKeyService.clearNotUse(c);
	return c.json(result.ok());
})

app.get('/api/regKey/history', async (c) => {
	const list = await regKeyService.history(c, c.req.query());
	return c.json(result.ok(list));
})
