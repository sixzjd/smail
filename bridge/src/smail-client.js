// smail HTTP API 客户端。
//
// bridge 不直接连 D1（那样要额外维护一套数据库凭据），而是走 smail 自己的 REST 接口：
// 登录、发件、标记已读、删除、还原、星标都复用线上同一套权限与业务规则，
// 管理员在后台关掉「发件」或「收件」时，IMAP/SMTP 端会同步失效。
import { createLogger } from './logger.js';

const log = createLogger('smail-client');

export class SmailError extends Error {
	constructor(message, status = 0, code = 0) {
		super(message);
		this.name = 'SmailError';
		this.status = status;
		this.code = code;
	}
}

export class SmailClient {
	constructor({ baseUrl, timeout = 30000, keepAlive = true }) {
		this.baseUrl = String(baseUrl).replace(/\/+$/, '');
		this.timeout = timeout;
		this.keepAlive = keepAlive;
		// 站点配置（r2Domain 等）只取一次
		this._websiteConfig = null;
	}

	async request(method, path, { query, body, token } = {}) {
		const url = new URL(path.startsWith('/') ? path : `/${path}`, `${this.baseUrl}/`);

		if (query) {
			for (const [key, value] of Object.entries(query)) {
				if (value === undefined || value === null || value === '') continue;
				url.searchParams.set(key, String(value));
			}
		}

		const headers = { Accept: 'application/json' };
		if (body !== undefined) headers['Content-Type'] = 'application/json';
		if (token) headers['Authorization'] = token;

		let response;
		try {
			response = await fetch(url, {
				method,
				headers,
				body: body === undefined ? undefined : JSON.stringify(body),
				signal: AbortSignal.timeout(this.timeout),
			});
		} catch (err) {
			throw new SmailError(`无法连接 smail 服务 (${url.origin}${url.pathname}): ${err.message}`);
		}

		const text = await response.text();
		let payload;
		try {
			payload = JSON.parse(text);
		} catch {
			throw new SmailError(`smail 返回了非 JSON 响应 (HTTP ${response.status})`, response.status);
		}

		if (!response.ok || payload.code !== 200) {
			throw new SmailError(payload.message || `HTTP ${response.status}`, response.status, payload.code);
		}

		return payload.data;
	}

	/**
	 * 用「邮箱地址 + 密码」登录。
	 * 走 /api/client/login：它允许用任意一个自建邮箱地址登录（而不是只能用注册时的主邮箱），
	 * 这样用户在 iOS 邮件里填哪个邮箱地址都能登进来。
	 */
	async login(email, password) {
		const data = await this.request('POST', '/api/client/login', { body: { email, password } });
		return data;
	}

	async websiteConfig() {
		if (this._websiteConfig) return this._websiteConfig;
		this._websiteConfig = await this.request('GET', '/api/setting/websiteConfig');
		return this._websiteConfig;
	}

	async listEmails(token, { type, accountId, emailId = 9999999999, size = 50, timeSort = 0, allReceive = 0 }) {
		return this.request('GET', '/api/email/list', {
			query: { type, accountId, emailId, size, timeSort, allReceive },
			token,
		});
	}

	/**
	 * 拉取某个账号的全部邮件（按 emailId 倒序分页，最后翻正成升序）。
	 * IMAP 的 sequence number 必须是「到达顺序」，而 smail 的 emailId 单调递增，
	 * 所以按 emailId 升序排列即等价于到达顺序。
	 */
	async listAllEmails(token, { type, accountId, max = 300 }) {
		const collected = [];
		let cursor = 9999999999;

		while (collected.length < max) {
			const size = Math.min(50, max - collected.length);
			const data = await this.listEmails(token, { type, accountId, emailId: cursor, size });
			const list = data?.list || [];
			if (list.length === 0) break;

			collected.push(...list);

			if (list.length < size) break;
			cursor = list[list.length - 1].emailId;
			if (cursor <= 1) break;
		}

		collected.sort((a, b) => a.emailId - b.emailId);
		return collected;
	}

	async getEmail(token, emailId) {
		return this.request('GET', '/api/client/email', { query: { emailId }, token });
	}

	async listAccounts(token) {
		return this.request('GET', '/api/account/list', {
			query: { accountId: 0, size: 30, lastSort: 9999999999 },
			token,
		});
	}

	async listStarred(token, size = 200) {
		const data = await this.request('GET', '/api/star/list', { query: { emailId: 9999999999, size }, token });
		return data?.list || [];
	}

	async setRead(token, emailIds, targetUnread = 1) {
		if (!emailIds.length) return;
		// 注意：/api/email/read 期望 emailIds 是数组（其余的 read/restore/delete 接口才是逗号串）
		return this.request('PUT', '/api/email/read', {
			body: { emailIds: emailIds.map(Number), targetUnread },
			token,
		});
	}

	async moveToTrash(token, emailIds) {
		if (!emailIds.length) return;
		return this.request('DELETE', '/api/email/delete', {
			query: { emailIds: emailIds.join(',') },
			token,
		});
	}

	async restore(token, emailIds) {
		if (!emailIds.length) return;
		return this.request('POST', '/api/email/restore', {
			body: { emailIds: emailIds.join(',') },
			token,
		});
	}

	async permanentDelete(token, emailIds) {
		if (!emailIds.length) return;
		return this.request('POST', '/api/email/permanent-delete', {
			body: { emailIds: emailIds.join(',') },
			token,
		});
	}

	async addStar(token, emailId) {
		return this.request('POST', '/api/star/add', { body: { emailId }, token });
	}

	async cancelStar(token, emailId) {
		return this.request('DELETE', '/api/star/cancel', { query: { emailId }, token });
	}

	async sendEmail(token, payload) {
		return this.request('POST', '/api/email/send', { body: payload, token });
	}

	/**
	 * IMAP COPY / APPEND 的落点。
	 * sourceEmailId = 复制已有邮件；message = 直接写入一封新邮件。
	 */
	async append(token, payload) {
		return this.request('POST', '/api/client/append', { body: payload, token });
	}
}

export default SmailClient;
