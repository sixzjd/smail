// 邮箱模型：把 smail 的「账号 / 邮件」映射成 IMAP 的「文件夹 / 邮件」。
//
// 目录结构：
//   INBOX            登录邮箱的收件箱
//   Sent             登录邮箱的发件箱
//   Trash            登录邮箱的回收站
//   Starred          登录邮箱的星标邮件
//   <其它邮箱地址>   同一用户下其它自建邮箱的收件箱
import { buildMessage, buildEnvelope, buildStructure } from './mime.js';
import { simpleParser } from 'mailparser';
import { createLogger } from './logger.js';

const log = createLogger('mailbox');

export const FOLDER_INBOX = 'INBOX';
export const FOLDER_SENT = 'Sent';
export const FOLDER_TRASH = 'Trash';
export const FOLDER_STARRED = 'Starred';

function parseJsonArray(value) {
	if (!value) return [];
	try {
		const parsed = typeof value === 'string' ? JSON.parse(value) : value;
		return Array.isArray(parsed) ? parsed.filter(item => item && item.address) : [];
	} catch {
		return [];
	}
}

/**
 * smail 存的时间是 D1 的 UTC 'YYYY-MM-DD HH:mm:ss'。
 */
export function parseCreateTime(value) {
	if (!value) return new Date(0);
	if (value instanceof Date) return value;
	const str = String(value);
	const iso = str.includes('T') ? str : str.replace(' ', 'T');
	const date = new Date(`${iso}Z`);
	return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

export class Mailbox {
	constructor(client, { maxMessages = 300 } = {}) {
		this.client = client;
		this.maxMessages = maxMessages;
		this._r2Base = null;
	}

	async r2Base() {
		if (this._r2Base !== null) return this._r2Base;
		try {
			const config = await this.client.websiteConfig();
			const domain = config?.r2Domain || '';
			if (!domain) {
				this._r2Base = `${this.client.baseUrl}/attachments/`;
			} else {
				this._r2Base = domain.startsWith('http') ? domain.replace(/\/+$/, '') + '/' : `https://${domain.replace(/\/+$/, '')}/`;
			}
		} catch (err) {
			log.warn('读取站点配置失败，附件将不可用：', err.message);
			this._r2Base = `${this.client.baseUrl}/attachments/`;
		}
		return this._r2Base;
	}

	/**
	 * 当前会话可见的文件夹列表。
	 */
	async listFolders(session) {
		const folders = [
			{ name: FOLDER_INBOX, kind: 'inbox', type: 0, isDel: 0, accountId: session.account.accountId, special: '\\Inbox' },
			{ name: FOLDER_SENT, kind: 'sent', type: 1, isDel: 0, accountId: session.account.accountId, special: '\\Sent' },
			{ name: FOLDER_TRASH, kind: 'trash', type: 'trash', isDel: 1, accountId: session.account.accountId, special: '\\Trash' },
			{ name: FOLDER_STARRED, kind: 'starred', type: 'starred', isDel: 0, accountId: session.account.accountId, special: null },
		];

		for (const account of session.accounts || []) {
			if (account.accountId === session.account.accountId) continue;
			folders.push({
				name: account.email,
				kind: 'account',
				type: 0,
				isDel: 0,
				accountId: account.accountId,
				special: null,
			});
		}

		return folders;
	}

	async findFolder(session, name) {
		if (!name) return null;
		const folders = await this.listFolders(session);
		const lower = String(name).toLowerCase();
		return folders.find(folder => folder.name.toLowerCase() === lower) || null;
	}

	/**
	 * 列出文件夹中的邮件（按到达顺序升序）。
	 */
	async listMessages(session, folder) {
		if (folder.kind === 'starred') {
			const starred = await this.client.listStarred(session.token, this.maxMessages);
			return starred
				.filter(row => row.accountId === folder.accountId)
				.sort((a, b) => a.emailId - b.emailId);
		}

		return this.client.listAllEmails(session.token, {
			type: folder.type === 'trash' ? 'trash' : folder.type,
			accountId: folder.accountId,
			max: this.maxMessages,
		});
	}

	/**
	 * 构造一封完整邮件（含附件），供 FETCH 返回。
	 */
	async buildMessage(session, emailId) {
		const row = await this.client.getEmail(session.token, emailId);
		if (!row) return null;

		const isSend = row.type === 1;
		const to = parseJsonArray(row.recipient);
		const cc = parseJsonArray(row.cc);
		const bcc = parseJsonArray(row.bcc);

		if (!to.length && row.toEmail) {
			to.push({ address: row.toEmail, name: row.toName || '' });
		}

		const base = await this.r2Base();
		const html = (row.content || '').replace(/\{\{domain\}\}/g, base);
		const text = row.text || '';

		const attachments = [];
		for (const att of row.attList || []) {
			if (!att?.key) continue;
			try {
				const content = await this.fetchAttachment(`${base}${att.key}`);
				if (!content) continue;
				attachments.push({
					filename: att.filename || 'attachment',
					contentType: att.mimeType || 'application/octet-stream',
					content,
				});
			} catch (err) {
				log.warn(`附件下载失败 (${att.key}):`, err.message);
			}
		}

		const date = parseCreateTime(row.createTime);
		const messageId = row.messageId || `${emailId}.${Date.now()}@smail`;
		const from = {
			name: row.name || '',
			address: row.sendEmail || (isSend ? session.account.email : ''),
		};

		const built = buildMessage({
			from,
			to,
			cc,
			bcc: [],
			subject: row.subject || '',
			date,
			messageId,
			inReplyTo: row.inReplyTo || '',
			references: row.relation || '',
			text,
			html,
			attachments,
		});

		return {
			row,
			built,
			structure: buildStructure(built.rootNode, built.parts),
			envelope: buildEnvelope({
				date,
				subject: row.subject || '',
				from: [from],
				sender: [from],
				replyTo: [],
				to,
				cc,
				bcc,
				inReplyTo: row.inReplyTo || '',
				messageId,
			}),
			date,
		};
	}

	async fetchAttachment(url) {
		const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}`);
		}
		return Buffer.from(await response.arrayBuffer());
	}

	/**
	 * 把一封邮件复制到目标文件夹（IMAP COPY）。
	 * 复用同一个 R2 附件对象，不会重复上传。
	 */
	async copyMessage(session, emailId, target, sourceType = 0, unread = 0) {
		const type = target.kind === 'trash' ? sourceType
			: (target.kind === 'sent' ? 1 : 0);

		return this.client.append(session.token, {
			accountId: target.accountId,
			type,
			isDel: target.isDel || 0,
			unread,
			sourceEmailId: emailId,
		});
	}

	/**
	 * IMAP APPEND：把客户端提交的一封原始邮件存进目标文件夹。
	 * 原始报文由 bridge 解析（mailparser），smail 侧只存结构化字段。
	 */
	async appendRaw(session, target, raw) {
		const parsed = await simpleParser(raw);

		const toList = (parsed.to?.value || []).map(item => ({
			name: item.name || '',
			address: item.address || '',
		}));
		const ccList = (parsed.cc?.value || []).map(item => ({
			name: item.name || '',
			address: item.address || '',
		}));
		const bccList = (parsed.bcc?.value || []).map(item => ({
			name: item.name || '',
			address: item.address || '',
		}));

		const fromItem = parsed.from?.value?.[0];

		const attachments = (parsed.attachments || []).map(att => ({
			filename: att.filename || 'attachment',
			contentType: att.contentType || 'application/octet-stream',
			content: att.content ? att.content.toString('base64') : '',
		})).filter(att => att.content);

		const message = {
			from: {
				name: fromItem?.name || '',
				address: fromItem?.address || session.account.email,
			},
			to: toList,
			cc: ccList,
			bcc: bccList,
			subject: parsed.subject || '',
			text: parsed.text || '',
			html: typeof parsed.html === 'string' ? parsed.html : '',
			date: parsed.date ? parsed.date.toISOString() : new Date().toISOString(),
			messageId: parsed.messageId || '',
			inReplyTo: parsed.inReplyTo || '',
			references: parsed.references || '',
			attachments,
		};

		return this.client.append(session.token, {
			accountId: target.accountId,
			type: target.kind === 'sent' ? 1 : 0,
			isDel: target.isDel || 0,
			unread: 0,
			message,
		});
	}
}

export default Mailbox;
