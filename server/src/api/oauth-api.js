import app from '../hono.js';
import result from "../model/result.js";
import oauthService from "../service/oauth-service.js";

app.post('/api/oauth/linuxDo/login', async (c) => {
	const loginInfo = await oauthService.linuxDoLogin(c, await c.req.json());
	return c.json(result.ok(loginInfo))
});

app.put('/api/oauth/bindUser', async (c) => {
	const loginInfo = await oauthService.bindUser(c, await c.req.json());
	return c.json(result.ok(loginInfo))
})
