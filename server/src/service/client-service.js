// 第三方邮件客户端（IMAP / SMTP）相关服务。
//
// 客户端配置放在 Worker 环境变量里，而不是数据库里——因为这套配置必须和
// bridge 进程的监听端口保持一致，运维时改一次 wrangler secret / vars 即可。
import orm from '../entity/orm.js';
import email from '../entity/email.js';
import account from '../entity/account.js';
import { att } from '../entity/att.js';
import { star } from '../entity/star.js';
import { eq, and } from 'drizzle-orm';
import attService from './att-service.js';
import loginService from './login-service.js';
import emailUtils from '../utils/email-utils.js';
import BizError from '../error/biz-error.js';

const DEFAULT_CONFIG = {
	enabled: false,
	imap: {
		host: '',
		port: 143,
		tlsPort: 993,
	},
	smtp: {
		host: '',
		port: 587,
		tlsPort: 465,
	},
};

function toNumber(value, fallback) {
	const num = Number(value);
	return Number.isFinite(num) && num > 0 ? num : fallback;
}

/**
 * 地址对象统一成 {address, name}。
 */
function toAddress(item) {
	if (typeof item === 'string') {
		return { address: item, name: '' };
	}
	return { address: item?.address || '', name: item?.name || '' };
}

/**
 * 数据库里的时间格式是 'YYYY-MM-DD HH:mm:ss'（UTC）。
 */
function formatDbTime(value) {
	const date = value ? new Date(value) : new Date();
	const safe = Number.isNaN(date.getTime()) ? new Date() : date;
	return safe.toISOString().slice(0, 19).replace('T', ' ');
}

const clientService = {

	/**
	 * 解析客户端配置。
	 * 支持两种写法：
	 *   1) client_config = '{"imap":{"host":"imap.example.com"},"smtp":{...}}'
	 *   2) imap_host / imap_port / imap_tls_port / smtp_host / smtp_port / smtp_tls_port
	 */
	config(c) {

		let config = {
			enabled: DEFAULT_CONFIG.enabled,
			imap: { ...DEFAULT_CONFIG.imap },
			smtp: { ...DEFAULT_CONFIG.smtp },
		};

		const raw = c.env.client_config;

		if (raw) {
			try {
				const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
				config = {
					enabled: parsed.enabled !== undefined ? !!parsed.enabled : config.enabled,
					imap: { ...config.imap, ...(parsed.imap || {}) },
					smtp: { ...config.smtp, ...(parsed.smtp || {}) },
				};
			} catch (e) {
				console.error('client_config 解析失败：', e.message);
			}
		}

		if (c.env.imap_host) config.imap.host = c.env.imap_host;
		if (c.env.imap_port) config.imap.port = toNumber(c.env.imap_port, config.imap.port);
		if (c.env.imap_tls_port) config.imap.tlsPort = toNumber(c.env.imap_tls_port, config.imap.tlsPort);
		if (c.env.smtp_host) config.smtp.host = c.env.smtp_host;
		if (c.env.smtp_port) config.smtp.port = toNumber(c.env.smtp_port, config.smtp.port);
		if (c.env.smtp_tls_port) config.smtp.tlsPort = toNumber(c.env.smtp_tls_port, config.smtp.tlsPort);

		config.imap.port = toNumber(config.imap.port, 143);
		config.imap.tlsPort = toNumber(config.imap.tlsPort, 993);
		config.smtp.port = toNumber(config.smtp.port, 587);
		config.smtp.tlsPort = toNumber(config.smtp.tlsPort, 465);

		config.enabled = !!(config.imap.host || config.smtp.host);

		return config;
	},

	async login(c, params) {
		return await loginService.loginByAccount(c, params);
	},

	/**
	 * 取一封邮件的完整内容（含回收站里的）。
	 * 网页端的 /api/email/detail 过滤掉了 isDel=1 的邮件，
	 * 但 IMAP 的 Trash 文件夹需要能读到它们，所以单独开一个接口。
	 */
	async getEmail(c, emailId, userId) {
		const emailIdNum = Number(emailId);
		if (!emailIdNum) {
			return null;
		}

		const row = await orm(c).select().from(email).where(eq(email.emailId, emailIdNum)).get();

		if (!row || row.userId !== userId) {
			return null;
		}

		const attList = await attService.selectByEmailIds(c, [row.emailId]);
		row.attList = attList;

		return row;
	},

	/**
	 * IMAP COPY / APPEND 的落点。
	 *
	 * COPY   = 把已有邮件复制一份到目标文件夹（sourceEmailId）
	 * APPEND = 把客户端提交的一封信直接存进目标文件夹（message）
	 *
	 * 目标文件夹由 bridge 解析成 accountId + type + isDel：
	 *   INBOX        → 收件箱（type=0）
	 *   Sent         → 已发送（type=1）
	 *   Trash        → 回收站（isDel=1）
	 *   其它账号邮箱 → 那个账号的收件箱
	 */
	async append(c, params, userId) {

		const {
			accountId,
			type = 0,
			isDel = 0,
			unread = 0,
			sourceEmailId,
			message,
			star: wantStar = false,
		} = params;

		const accountIdNum = Number(accountId);
		if (!accountIdNum) {
			throw new BizError('账号不存在');
		}

		const accountRow = await orm(c).select().from(account)
			.where(eq(account.accountId, accountIdNum)).get();

		if (!accountRow || accountRow.userId !== userId || accountRow.isDel === 1) {
			throw new BizError('账号不存在');
		}

		let inserted;

		if (sourceEmailId) {
			inserted = await this.copyEmail(c, Number(sourceEmailId), userId, {
				accountId: accountIdNum,
				type: Number(type),
				isDel: Number(isDel),
				unread: Number(unread),
			});
		} else if (message) {
			inserted = await this.insertEmail(c, message, userId, {
				accountId: accountIdNum,
				type: Number(type),
				isDel: Number(isDel),
				unread: Number(unread),
			});
		} else {
			throw new BizError('缺少邮件内容');
		}

		if (wantStar) {
			const exist = await orm(c).select().from(star).where(
				and(eq(star.userId, userId), eq(star.emailId, inserted.emailId))
			).get();
			if (!exist) {
				await orm(c).insert(star).values({ userId, emailId: inserted.emailId }).run();
			}
		}

		return inserted;
	},

	/**
	 * 复制一封已有邮件（附件复用同一份 R2 对象，不重复上传）。
	 */
	async copyEmail(c, sourceEmailId, userId, target) {

		const source = await orm(c).select().from(email)
			.where(eq(email.emailId, sourceEmailId)).get();

		if (!source || source.userId !== userId) {
			throw new BizError('邮件不存在');
		}

		const inserted = await orm(c).insert(email).values({
			sendEmail: source.sendEmail,
			name: source.name,
			accountId: target.accountId,
			userId,
			subject: source.subject,
			text: source.text,
			content: source.content,
			cc: source.cc,
			bcc: source.bcc,
			recipient: source.recipient,
			toEmail: source.toEmail,
			toName: source.toName,
			inReplyTo: source.inReplyTo,
			relation: source.relation,
			messageId: source.messageId,
			type: target.type,
			status: source.status,
			unread: target.unread,
			isDel: target.isDel,
		}).returning().get();

		const attList = await attService.selectByEmailIds(c, [source.emailId]);

		if (attList.length) {
			await orm(c).insert(att).values(attList.map(item => ({
				userId,
				accountId: target.accountId,
				emailId: inserted.emailId,
				key: item.key,
				filename: item.filename,
				mimeType: item.mimeType,
				size: item.size,
				status: item.status,
				type: item.type,
				disposition: item.disposition,
				related: item.related,
				contentId: item.contentId,
				encoding: item.encoding,
			}))).run();
		}

		return inserted;
	},

	/**
	 * 新插入一封邮件（IMAP APPEND 用），内容由 bridge 解析好传过来。
	 */
	async insertEmail(c, message, userId, target) {

		const from = message.from || {};
		const to = Array.isArray(message.to) ? message.to : [];
		const cc = Array.isArray(message.cc) ? message.cc : [];
		const bcc = Array.isArray(message.bcc) ? message.bcc : [];

		const inserted = await orm(c).insert(email).values({
			sendEmail: from.address || '',
			name: from.name || '',
			accountId: target.accountId,
			userId,
			subject: message.subject || '',
			text: message.text || '',
			content: message.html || '',
			cc: JSON.stringify(cc.map(toAddress)),
			bcc: JSON.stringify(bcc.map(toAddress)),
			recipient: JSON.stringify([...to, ...cc, ...bcc].map(toAddress)),
			toEmail: to[0]?.address || '',
			toName: to[0]?.name || '',
			inReplyTo: message.inReplyTo || '',
			relation: message.references || '',
			messageId: message.messageId || '',
			type: target.type,
			status: target.type === 1 ? 1 : 0,
			unread: target.unread,
			isDel: target.isDel,
			createTime: formatDbTime(message.date),
		}).returning().get();

		const attachments = Array.isArray(message.attachments) ? message.attachments : [];

		if (attachments.length) {
			await attService.saveSendAtt(c, attachments.map(item => ({
				filename: item.filename || 'attachment',
				type: item.contentType || 'application/octet-stream',
				content: item.content || '',
			})), userId, target.accountId, inserted.emailId);
		}

		return inserted;
	},

	escapeXml(value) {
		return String(value ?? '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&apos;');
	},

	/**
	 * Thunderbird / iOS 邮件 / Outlook 通用的 autoconfig 配置。
	 * 请求路径：/.well-known/autoconfig/mail/config.v1.xml?emailaddress=xxx
	 */
	autoconfigXml(c, emailAddress) {

		const config = this.config(c);
		const domain = emailUtils.getDomain(emailAddress) || (c.env.domain?.[0] || '');

		const imapHost = config.imap.host;
		const smtpHost = config.smtp.host;

		return `<?xml version="1.0" encoding="UTF-8"?>
<clientConfig version="1.1">
  <emailProvider id="smail">
    <domain>${this.escapeXml(domain)}</domain>
    <displayName>smail</displayName>
    <displayShortName>smail</displayShortName>
    <incomingServer type="imap">
      <hostname>${this.escapeXml(imapHost)}</hostname>
      <port>${config.imap.tlsPort}</port>
      <socketType>SSL</socketType>
      <authentication>password-cleartext</authentication>
      <username>%EMAILADDRESS%</username>
    </incomingServer>
    <incomingServer type="imap">
      <hostname>${this.escapeXml(imapHost)}</hostname>
      <port>${config.imap.port}</port>
      <socketType>STARTTLS</socketType>
      <authentication>password-cleartext</authentication>
      <username>%EMAILADDRESS%</username>
    </incomingServer>
    <outgoingServer type="smtp">
      <hostname>${this.escapeXml(smtpHost)}</hostname>
      <port>${config.smtp.tlsPort}</port>
      <socketType>SSL</socketType>
      <authentication>password-cleartext</authentication>
      <username>%EMAILADDRESS%</username>
    </outgoingServer>
    <outgoingServer type="smtp">
      <hostname>${this.escapeXml(smtpHost)}</hostname>
      <port>${config.smtp.port}</port>
      <socketType>STARTTLS</socketType>
      <authentication>password-cleartext</authentication>
      <username>%EMAILADDRESS%</username>
    </outgoingServer>
  </emailProvider>
</clientConfig>`;
	},

	/**
	 * Microsoft Outlook Autodiscover 响应。
	 * 请求路径：/Autodiscover/Autodiscover.xml
	 */
	autodiscoverXml(c, emailAddress) {

		const config = this.config(c);

		return `<?xml version="1.0" encoding="utf-8"?>
<Autodiscover xmlns="http://schemas.microsoft.com/exchange/autodiscover/responseschema/2006">
  <Response xmlns="http://schemas.microsoft.com/exchange/autodiscover/outlook/responseschema/2006a">
    <Account>
      <AccountType>email</AccountType>
      <Action>settings</Action>
      <Protocol>
        <Type>IMAP</Type>
        <Server>${this.escapeXml(config.imap.host)}</Server>
        <Port>${config.imap.tlsPort}</Port>
        <SSL>on</SSL>
        <AuthRequired>on</AuthRequired>
        <LoginName>${this.escapeXml(emailAddress || '')}</LoginName>
      </Protocol>
      <Protocol>
        <Type>SMTP</Type>
        <Server>${this.escapeXml(config.smtp.host)}</Server>
        <Port>${config.smtp.tlsPort}</Port>
        <SSL>on</SSL>
        <AuthRequired>on</AuthRequired>
        <LoginName>${this.escapeXml(emailAddress || '')}</LoginName>
      </Protocol>
    </Account>
  </Response>
</Autodiscover>`;
	}
};

export default clientService;
