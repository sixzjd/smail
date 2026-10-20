// SMTP 投递（发件）服务：让 iOS 邮件 / Outlook 等客户端可以直接用 smail 邮箱发信。
//
// 客户端提交邮件 → 这里解析成结构化内容 → 转成 smail 的 /api/email/send 调用，
// 于是「发件次数限制、角色权限、发件服务开关」这些规则依旧由 smail 统一裁决。
import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import { createLogger } from './logger.js';

const log = createLogger('smtp');

export class SmtpBridge {
	constructor({ client, config }) {
		this.client = client;
		this.config = config;
		this.servers = [];
	}

	start() {
		const { port, tlsPort, legacyPort, allowPlain, allowStartTls, disableSecure } = this.config.smtp;
		const hasCert = !!(this.config.tls.cert && this.config.tls.key);

		if (allowPlain && port > 0) {
			const server = new SMTPServer({
				// 587：先明文握手，客户端用 STARTTLS 升级
				secure: false,
				key: hasCert ? this.config.tls.key : undefined,
				cert: hasCert ? this.config.tls.cert : undefined,
				hideSTARTTLS: !hasCert || !allowStartTls,
				disableSecure: disableSecure || !hasCert,
				allowInsecureAuth: disableSecure || !hasCert,
				authOptional: false,
				size: this.config.smtp.maxMessageSize,
				banner: 'smail ESMTP ready',
				onAuth: (auth, session, callback) => this.handleAuth(auth, session, callback),
				onData: (stream, session, callback) => this.handleData(stream, session, callback),
			});
			server.on('error', err => log.error('SMTP 监听失败:', err.message));
			this.servers.push(server);
			server.listen(port, () => log.info(`SMTP (提交) 监听 ${port}`));
		}

		// 25：iOS 手动设置默认就是 25 + 关闭 SSL，保留这条兼容端口，
		// 用户忘了改端口也能登录（有证书时同样支持 STARTTLS 升级）。
		if (allowPlain && legacyPort > 0 && legacyPort !== port) {
			const server = new SMTPServer({
				secure: false,
				key: hasCert ? this.config.tls.key : undefined,
				cert: hasCert ? this.config.tls.cert : undefined,
				hideSTARTTLS: !hasCert || !allowStartTls,
				disableSecure: disableSecure || !hasCert,
				allowInsecureAuth: disableSecure || !hasCert,
				authOptional: false,
				size: this.config.smtp.maxMessageSize,
				banner: 'smail ESMTP ready',
				onAuth: (auth, session, callback) => this.handleAuth(auth, session, callback),
				onData: (stream, session, callback) => this.handleData(stream, session, callback),
			});
			server.on('error', err => {
				if (err.code === 'EACCES') {
					log.warn(`SMTP 监听 ${legacyPort} 失败：需要 root 或 CAP_NET_BIND_SERVICE，已跳过`);
				} else {
					log.warn(`SMTP (兼容口) 监听 ${legacyPort} 失败:`, err.message);
				}
			});
			this.servers.push(server);
			server.listen(legacyPort, () => log.info(`SMTP (兼容 25) 监听 ${legacyPort}`));
		}

		if (hasCert && tlsPort > 0) {
			const server = new SMTPServer({
				// 465：连接即 TLS
				secure: true,
				key: this.config.tls.key,
				cert: this.config.tls.cert,
				authOptional: false,
				size: this.config.smtp.maxMessageSize,
				banner: 'smail ESMTP ready',
				onAuth: (auth, session, callback) => this.handleAuth(auth, session, callback),
				onData: (stream, session, callback) => this.handleData(stream, session, callback),
			});
			server.on('error', err => log.error('SMTPS 监听失败:', err.message));
			this.servers.push(server);
			server.listen(tlsPort, () => log.info(`SMTPS (隐式 TLS) 监听 ${tlsPort}`));
		} else if (tlsPort > 0) {
			log.warn('未配置 TLS 证书，SMTPS(465) 不会启动');
		}

		return this;
	}

	stop() {
		for (const server of this.servers) server.close();
		this.servers = [];
	}

	async handleAuth(auth, session, callback) {
		try {
			const data = await this.client.login(auth.username, auth.password);
			// 注意：smtp-server 会用 callback 的第二个参数覆盖 session.user，
			// 所以自己的登录信息要放在别的字段上。
			session.smailUser = {
				token: data.token,
				email: data.email,
				account: data.account,
				accounts: data.accounts || [],
			};
			callback(null, { user: data.account.email });
		} catch (err) {
			log.warn(`SMTP 认证失败: ${auth.username}: ${err.message}`);
			callback(new Error('535 Authentication failed'));
		}
	}

	async handleData(stream, session, callback) {
		const chunks = [];
		let size = 0;

		stream.on('data', chunk => {
			size += chunk.length;
			chunks.push(chunk);
		});

		stream.on('error', err => {
			log.warn('SMTP 数据流错误:', err.message);
			callback(err);
		});

		stream.on('end', async () => {
			try {
				const raw = Buffer.concat(chunks);
				const parsed = await simpleParser(raw);

				const envelopeRecipients = (session.envelope?.rcptTo || [])
					.map(item => item.address)
					.filter(Boolean);

				const headerRecipients = [
					...addressList(parsed.to),
					...addressList(parsed.cc),
					...addressList(parsed.bcc),
				];

				const receiveEmail = [...new Set([...envelopeRecipients, ...headerRecipients])];

				if (!receiveEmail.length) {
					callback(new Error('550 No recipient'));
					return;
				}

				const attachments = (parsed.attachments || []).map(att => ({
					filename: att.filename || 'attachment',
					contentType: att.contentType || 'application/octet-stream',
					content: att.content ? att.content.toString('base64') : '',
				})).filter(att => att.content);

				const account = session.smailUser?.account;
				if (!account) throw new Error('未登录');

				await this.client.sendEmail(session.smailUser.token, {
					accountId: account.accountId,
					name: account.name || '',
					receiveEmail,
					subject: parsed.subject || '',
					text: parsed.text || '',
					content: typeof parsed.html === 'string' ? parsed.html : '',
					attachments,
				});

				log.info(`SMTP 投递成功: ${account.email} -> ${receiveEmail.join(', ')}`);
				callback(null, '250 Message queued');
			} catch (err) {
				log.warn('SMTP 投递失败:', err.message);
				callback(new Error(`550 ${err.message}`));
			}
		});
	}
}

/**
 * mailparser 的 to/cc/bcc 字段是 {value: [...], text, html} 这种结构，
 * 这里统一取出纯邮箱地址数组。
 */
function addressList(field) {
	if (!field) return [];
	const list = Array.isArray(field)
		? field
		: (Array.isArray(field.value) ? field.value : (field.value ? [field.value] : []));
	return list
		.map(item => (typeof item === 'string' ? item : item?.address))
		.filter(Boolean);
}

export default SmtpBridge;
