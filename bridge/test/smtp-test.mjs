// 本地联调脚本：用 nodemailer 通过 SMTP 提交一封邮件，再去 IMAP 里确认收到。
// 用法：node test/smtp-test.mjs
import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';

const smtpPort = Number(process.env.SMTP_TEST_PORT || 1587);
const imapPort = Number(process.env.IMAP_TEST_PORT || 1143);
const user = process.env.IMAP_TEST_USER;
const pass = process.env.IMAP_TEST_PASS;
const to = process.env.SMTP_TEST_TO || user;

if (!user || !pass) {
	console.error('缺少账号：请设置 IMAP_TEST_USER / IMAP_TEST_PASS（smail 里真实存在的账号）');
	process.exit(1);
}

const transport = nodemailer.createTransport({
	host: '127.0.0.1',
	port: smtpPort,
	secure: false,
	ignoreTLS: true,
	auth: { user, pass },
});

const info = await transport.sendMail({
	from: `${user}`,
	to,
	subject: '来自 SMTP 的测试邮件',
	text: '这封邮件是通过 SMTP 提交的。',
	html: '<p>这封邮件是通过 <b>SMTP</b> 提交的。</p>',
});

console.log('✓ SMTP 投递成功:', info.response);

// 再用 IMAP 去收件箱确认
const client = new ImapFlow({
	host: '127.0.0.1',
	port: imapPort,
	secure: false,
	auth: { user, pass },
});
await client.connect();
const lock = await client.getMailboxLock(to);
try {
	const uids = await client.search({ subject: '来自 SMTP 的测试邮件' }, { uid: true });
	console.log('✓ 收件箱里找到邮件, UID =', uids.join(','));
	if (!uids.length) throw new Error('收件箱没有找到刚发的邮件');
	const msg = await client.fetchOne(uids[uids.length - 1], { source: true, envelope: true }, { uid: true });
	console.log('  主题:', msg.envelope.subject);
	console.log('  发件人:', msg.envelope.from?.[0]?.address);
	console.log('  收件人:', msg.envelope.to?.[0]?.address);
	console.log('  原文片段:', String(msg.source).split('\r\n\r\n')[1]?.slice(0, 80));
} finally {
	lock.release();
}
await client.logout();
console.log('\nSMTP → 收件箱 全链路通过 ✓');
