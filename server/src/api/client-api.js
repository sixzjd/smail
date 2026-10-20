// 第三方邮件客户端（IMAP / SMTP）接口。
//
// /api/client/login   —— bridge 用「邮箱地址 + 密码」换取访问令牌（公开接口，已在 security.js 白名单）
// /api/client/email   —— 取一封邮件的完整内容（IMAP FETCH 用，包含回收站里的邮件）
// /api/client/append  —— IMAP COPY / APPEND 的落点（把邮件放进某个文件夹）
// /api/client/config  —— 客户端连接参数（IMAP/SMTP 主机与端口），前端「客户端登录」页读取
import app from '../hono.js';
import clientService from '../service/client-service.js';
import accountService from '../service/account-service.js';
import result from '../model/result.js';
import userContext from '../security/user-context.js';

app.post('/api/client/login', async (c) => {
	const data = await clientService.login(c, await c.req.json());
	return c.json(result.ok(data));
});

app.get('/api/client/email', async (c) => {
	const emailId = Number(c.req.query('emailId'));
	const row = await clientService.getEmail(c, emailId, userContext.getUserId(c));
	return c.json(result.ok(row));
});

app.post('/api/client/append', async (c) => {
	const data = await clientService.append(c, await c.req.json(), userContext.getUserId(c));
	return c.json(result.ok(data));
});

app.get('/api/client/config', async (c) => {
	const config = clientService.config(c);
	const accounts = await accountService.listByUserId(c, userContext.getUserId(c));
	return c.json(result.ok({
		...config,
		accounts: accounts.map(item => ({
			accountId: item.accountId,
			email: item.email,
			name: item.name
		}))
	}));
});
