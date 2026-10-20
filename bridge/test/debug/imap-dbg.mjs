import { ImapFlow } from 'imapflow';

const user = process.env.IMAP_TEST_USER;
const pass = process.env.IMAP_TEST_PASS;
if (!user || !pass) {
	console.error('请设置 IMAP_TEST_USER / IMAP_TEST_PASS');
	process.exit(1);
}
const client = new ImapFlow({
  host: '127.0.0.1', port: 1147, secure: false,
  auth: { user, pass },
});
await client.connect();
const lock = await client.getMailboxLock('INBOX');
try {
  const msg = await client.fetchOne(4, { envelope: true, headers: true }, { uid: true });
  console.log('ENVELOPE:', JSON.stringify(msg.envelope, null, 1));
  console.log('HEADERS TEXT:', String(msg.headers).slice(0, 200));
} finally { lock.release(); }
await client.logout();
process.exit(0);
