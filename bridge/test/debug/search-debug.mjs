// 临时排查：SUBJECT 搜索
import { ImapFlow } from 'imapflow';

const user = process.env.IMAP_TEST_USER;
const pass = process.env.IMAP_TEST_PASS;
if (!user || !pass) {
	console.error('请设置 IMAP_TEST_USER / IMAP_TEST_PASS');
	process.exit(1);
}

const client = new ImapFlow({
	host: '127.0.0.1',
	port: 1143,
	secure: false,
	auth: { user, pass },
});

await client.connect();
const lock = await client.getMailboxLock('INBOX');
try {
	const uids = await client.search({ subject: 'APPEND 测试邮件' }, { uid: true });
	console.log('SUBJECT 搜索命中:', uids);
	for (const uid of uids) {
		const m = await client.fetchOne(uid, { envelope: true }, { uid: true });
		console.log('  UID', uid, '→', JSON.stringify(m?.envelope?.subject));
	}
} finally {
	lock.release();
}
await client.logout();
