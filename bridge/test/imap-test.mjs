// 本地联调脚本：用真实的 IMAP 客户端（imapflow）连一遍 bridge。
// 用法：node test/imap-test.mjs
import { ImapFlow } from 'imapflow';

const host = process.env.IMAP_TEST_HOST || '127.0.0.1';
const port = Number(process.env.IMAP_TEST_PORT || 1143);
const user = process.env.IMAP_TEST_USER;
const pass = process.env.IMAP_TEST_PASS;

if (!user || !pass) {
	console.error('缺少账号：请设置 IMAP_TEST_USER / IMAP_TEST_PASS（smail 里真实存在的账号）');
	process.exit(1);
}

const client = new ImapFlow({
	host,
	port,
	secure: false,
	auth: { user, pass },
	logger: false,
});

try {
	await client.connect();
	console.log('✓ 已连接并通过认证');

	const boxes = await client.list();
	console.log('✓ 文件夹列表:', boxes.map(b => b.path).join(', '));

	for (const box of boxes) {
		const lock = await client.getMailboxLock(box.path);
		try {
			const count = await client.status(box.path, { messages: true, unseen: true, uidNext: true });
			console.log(`\n[${box.path}] messages=${count.messages} unseen=${count.unseen} uidNext=${count.uidNext}`);

			if (!count.messages) continue;

			const uids = await client.search({ all: true }, { uid: true });
			console.log('  UIDs:', uids.join(', '));

			for (const uid of uids) {
				const msg = await client.fetchOne(uid, { source: true, envelope: true, flags: true, internalDate: true }, { uid: true });
				if (!msg) continue;
				console.log(`  - UID ${uid} | ${msg.envelope.subject} | from=${msg.envelope.from?.[0]?.address} | flags=${JSON.stringify(msg.flags)}`);
				console.log(`    正文首行: ${String(msg.source).split('\r\n').find(l => l.trim())?.slice(0, 60)}`);
			}

			// 结构体（多部分邮件）
			const first = uids[0];
			if (first) {
				const struct = await client.fetchOne(first, { bodyStructure: true }, { uid: true });
				console.log('  BODYSTRUCTURE:', JSON.stringify(struct?.bodyStructure).slice(0, 300));
				const hdr = await client.fetchOne(first, { headers: true }, { uid: true });
				console.log('  HEADER 首行:', String(hdr?.headers || '').split('\r\n')[0]);
			}
		} finally {
			lock.release();
		}
	}

	// 标记已读
	const inbox = await client.getMailboxLock('INBOX');
	try {
		const uids = await client.search({ unseen: true }, { uid: true });
		if (uids.length) {
			await client.messageFlagsAdd(uids, ['\\Seen'], { uid: true });
			console.log(`\n✓ 已把 INBOX 中 ${uids.length} 封未读邮件标记为已读`);
			const after = await client.status('INBOX', { unseen: true });
			console.log('  现在未读数:', after.unseen);
			await client.messageFlagsRemove(uids, ['\\Seen'], { uid: true });
			console.log('✓ 已撤销（恢复为未读）');
		}
	} finally {
		inbox.release();
	}

	await client.logout();
	console.log('\n全部通过 ✓');
} catch (err) {
	console.error('✗ 失败:', err);
	process.exitCode = 1;
} finally {
	try { await client.close(); } catch { /* ignore */ }
}
