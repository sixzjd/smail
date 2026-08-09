import app from '../hono.js';
import emailService from '../service/email-service.js';
import result from '../model/result.js';
import userContext from '../security/user-context.js';
import attService from '../service/att-service.js';

app.get('/api/email/list', async (c) => {
	const data = await emailService.list(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.get('/api/email/latest', async (c) => {
	const list = await emailService.latest(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok(list));
});

app.delete('/api/email/delete', async (c) => {
	await emailService.delete(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok());
});

app.get('/api/email/attList', async (c) => {
	const attList = await attService.list(c, c.req.query(), userContext.getUserId(c));
	return c.json(result.ok(attList));
});

app.post('/api/email/send', async (c) => {
	const email = await emailService.send(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok(email));
});

app.get('/api/email/detail', async (c) => {
	const emailId = Number(c.req.query('emailId'));
	const curUser = userContext.getUser(c);
	const emailRow = await emailService.selectById(c, emailId);
	if (!emailRow) {
		return c.json(result.ok(null));
	}
	if (emailRow.userId !== curUser.userId && curUser.email !== c.env.admin) {
		return c.json(result.ok(null));
	}
	await emailService.emailAddAtt(c, [emailRow]);
	return c.json(result.ok(emailRow));
});

app.put('/api/email/read', async (c) => {
	await emailService.read(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok());
})

