// 调试：直接跑一遍 mailbox 的取信流程
import { SmailClient } from '../src/smail-client.js';
import { Mailbox } from '../src/mailbox.js';

const user = process.env.IMAP_TEST_USER;
const pass = process.env.IMAP_TEST_PASS;
if (!user || !pass) {
	console.error('请设置 IMAP_TEST_USER / IMAP_TEST_PASS');
	process.exit(1);
}

const client = new SmailClient({ baseUrl: process.env.SMAIL_API_BASE || 'http://127.0.0.1:8787' });
const mailbox = new Mailbox(client, { maxMessages: 50 });

const data = await client.login(user, pass);
console.log('登录成功, accountId =', data.account.accountId);

const session = { token: data.token, email: data.email, account: data.account, accounts: data.accounts };
const folders = await mailbox.listFolders(session);
console.log('文件夹:', folders.map(f => `${f.name}[${f.kind}]`).join(', '));

const inbox = folders[0];
const messages = await mailbox.listMessages(session, inbox);
console.log('INBOX 邮件数:', messages.length, messages.map(m => m.emailId));

for (const row of messages) {
	try {
		const detail = await mailbox.buildMessage(session, row.emailId);
		console.log(`邮件 ${row.emailId}: detail = ${detail ? '有' : 'null'}`);
		if (detail) {
			console.log('  raw 长度:', detail.built.raw.length);
			console.log('  raw 前 200 字节:', JSON.stringify(detail.built.raw.subarray(0, 200).toString()));
			console.log('  parts:', [...detail.built.parts.keys()].join(','));
			console.log('  envelope:', JSON.stringify(detail.envelope).slice(0, 200));
			console.log('  structure:', JSON.stringify(detail.structure).slice(0, 300));
		}
	} catch (err) {
		console.log(`邮件 ${row.emailId} 构建失败:`, err.message, err.stack?.split('\n')[1]);
	}
}
