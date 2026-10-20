// 本地联调脚本：IMAP 的写操作（标记已读/星标、复制到回收站、删除并清空）。
// 用法：node test/imap-write-test.mjs
import { ImapFlow } from 'imapflow';

const host = '127.0.0.1';
const port = Number(process.env.IMAP_TEST_PORT || 1143);
const user = process.env.IMAP_TEST_USER;
const pass = process.env.IMAP_TEST_PASS;

if (!user || !pass) {
	console.error('缺少账号：请设置 IMAP_TEST_USER / IMAP_TEST_PASS（smail 里真实存在的账号）');
	process.exit(1);
}

const client = new ImapFlow({ host, port, secure: false, auth: { user, pass } });
await client.connect();

// ---------- 1. 星标 ----------
{
	const lock = await client.getMailboxLock('INBOX');
	try {
		const uids = await client.search({ all: true }, { uid: true });
		if (uids.length) {
			await client.messageFlagsAdd(uids, ['\\Flagged'], { uid: true });
			console.log('✓ 已加星标 UID', uids.join(','));
		}
	} finally { lock.release(); }
}
{
	const lock = await client.getMailboxLock('Starred');
	try {
		const uids = await client.search({ all: true }, { uid: true });
		console.log('✓ 星标文件夹里有', uids.length, '封邮件');
		if (!uids.length) throw new Error('星标没有生效');
	} finally { lock.release(); }
}
{
	// 取消星标，避免污染后续用例
	const lock = await client.getMailboxLock('INBOX');
	try {
		const uids = await client.search({ all: true }, { uid: true });
		if (uids.length) await client.messageFlagsRemove(uids, ['\\Flagged'], { uid: true });
		console.log('✓ 已取消星标');
	} finally { lock.release(); }
}

// ---------- 2. 复制到回收站 ----------
let copyUid = null;
{
	const lock = await client.getMailboxLock('INBOX');
	try {
		const uids = await client.search({ all: true }, { uid: true });
		if (!uids.length) throw new Error('收件箱没有邮件可复制');
		copyUid = uids[uids.length - 1];
		await client.messageCopy(copyUid, 'Trash', { uid: true });
		console.log('✓ 已把 UID', copyUid, '复制到 Trash');
	} finally { lock.release(); }
}
{
	const lock = await client.getMailboxLock('Trash');
	try {
		const uids = await client.search({ all: true }, { uid: true });
		console.log('✓ 回收站里有', uids.length, '封邮件');
		if (!uids.length) throw new Error('复制到回收站没生效');
	} finally { lock.release(); }
}

// ---------- 3. 标记删除 + EXPUNGE（= 彻底删除）----------
{
	const lock = await client.getMailboxLock('Trash');
	try {
		const uids = await client.search({ all: true }, { uid: true });
		if (!uids.length) throw new Error('回收站里没有邮件可删除');
		await client.messageFlagsAdd(uids, ['\\Deleted'], { uid: true });
		console.log('✓ 已标记 \\Deleted');
		await client.messageDelete(uids, { uid: true });
		console.log('✓ 已 EXPUNGE');
	} finally { lock.release(); }
}
{
	const lock = await client.getMailboxLock('Trash');
	try {
		const uids = await client.search({ all: true }, { uid: true });
		console.log('✓ 回收站现在剩', uids.length, '封邮件');
		if (uids.length) throw new Error('彻底删除没生效');
	} finally { lock.release(); }
}

// ---------- 4. APPEND（把一封原始邮件塞进收件箱）----------
{
	const raw = Buffer.from([
		'From: append@test.sixzjd.sbs',
		'To: test@sixzjd.sbs',
		'Subject: APPEND 测试邮件',
		'Date: Mon, 19 Oct 2026 10:00:00 +0800',
		'Message-ID: <append-test-1@sixzjd.sbs>',
		'',
		'这是一封通过 IMAP APPEND 存进来的邮件。',
		'',
	].join('\r\n'));

	const lock = await client.getMailboxLock('INBOX');
	try {
		const before = (await client.search({ all: true }, { uid: true })).length;
		await client.append('INBOX', raw, [], new Date('2026-10-19T10:00:00Z'));
		const after = (await client.search({ all: true }, { uid: true })).length;
		console.log(`✓ APPEND 后收件箱邮件数 ${before} → ${after}`);
		if (after !== before + 1) throw new Error('APPEND 没有生效');
	} finally { lock.release(); }
}
{
	// 确认 APPEND 进来的邮件能被读到（标题正确）
	const lock = await client.getMailboxLock('INBOX');
	try {
		const uids = await client.search({ subject: 'APPEND 测试邮件' }, { uid: true });
		if (!uids.length) throw new Error('APPEND 进来的邮件搜不到');
		const message = await client.fetchOne(uids[0], { source: true }, { uid: true });
		const source = Buffer.isBuffer(message.source) ? message.source.toString('utf8') : String(message.source);
		console.log('✓ APPEND 邮件已可读取：', source.split('\r\n')[0]);
	} finally { lock.release(); }
}

await client.logout();
console.log('\nIMAP 写操作全部通过 ✓');
