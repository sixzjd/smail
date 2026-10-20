// 临时排查：收件箱里到底有几封邮件（IMAP 的 EXISTS 数量 vs 实际 API 数量）
import { ImapFlow } from 'imapflow';

const user = process.env.IMAP_TEST_USER;
const pass = process.env.IMAP_TEST_PASS;
if (!user || !pass) {
	console.error('请设置 IMAP_TEST_USER / IMAP_TEST_PASS');
	process.exit(1);
}

const client = new ImapFlow({
	host: '127.0.0.1',
	port: Number(process.env.IMAP_TEST_PORT || 1143),
	secure: false,
	auth: { user, pass },
	logger: false,
});

client.on('exists', (data) => console.log('[exists 事件]', JSON.stringify(data)));
client.on('expunge', (data) => console.log('[expunge 事件]', JSON.stringify(data)));

await client.connect();
const lock = await client.getMailboxLock('INBOX');
try {
	const box = await client.status('INBOX', { messages: true, unseen: true, uidNext: true });
	console.log('STATUS:', JSON.stringify(box));
	const uids = await client.search({ all: true }, { uid: true });
	console.log('SEARCH ALL:', uids);
	for (const uid of uids) {
		const m = await client.fetchOne(uid, { envelope: true }, { uid: true });
		console.log('  UID', uid, '→', m?.envelope?.subject);
	}
} finally {
	lock.release();
}
await client.logout();
