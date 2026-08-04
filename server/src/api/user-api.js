import app from '../hono.js';
import userService from '../service/user-service.js';
import result from '../model/result.js';
import userContext from '../security/user-context.js';
import accountService from '../service/account-service.js';

app.delete('/api/user/delete', async (c) => {
	await userService.physicsDelete(c, c.req.query());
	return c.json(result.ok());
});

app.put('/api/user/setPwd', async (c) => {
	await userService.setPwd(c, await c.req.json());
	return c.json(result.ok());
});

app.put('/api/user/setStatus', async (c) => {
	await userService.setStatus(c, await c.req.json());
	return c.json(result.ok());
});

app.put('/api/user/setType', async (c) => {
	await userService.setType(c, await c.req.json());
	return c.json(result.ok());
});

app.get('/api/user/list', async (c) => {
	const data = await userService.list(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.post('/api/user/add', async (c) => {
	await userService.add(c, await c.req.json());
	return c.json(result.ok());
});

app.put('/api/user/resetSendCount', async (c) => {
	await userService.resetSendCount(c, await c.req.json());
	return c.json(result.ok());
});

app.put('/api/user/restore', async (c) => {
	await userService.restore(c, await c.req.json());
	return c.json(result.ok());
});

app.get('/api/user/allAccount', async (c) => {
	const data = await accountService.allAccount(c, c.req.query());
	return c.json(result.ok(data));
});

app.delete('/api/user/deleteAccount', async (c) => {
	await accountService.physicsDelete(c, c.req.query());
	return c.json(result.ok());
});


