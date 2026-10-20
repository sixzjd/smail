// 极简 IMAP4rev1 服务端。
//
// 为什么自己实现？npm 上没有成熟可用的 IMAP *服务端* 库，而客户端（iOS 邮件 / Outlook /
// Thunderbird）对 IMAP 的期待很具体：LOGIN、SELECT、UID FETCH、STORE、SEARCH、EXPUNGE……
// 这里按 RFC 3501 / 3501bis 实现出客户端真正会用到的那部分。
//
// 协议与实现参考：
//   RFC 3501 IMAP4rev1
//   RFC 6855 UTF-8=ACCEPT
//   RFC 7888 LITERAL+ / IMAP4rev2
import net from 'node:net';
import tls from 'node:tls';
import { createHash } from 'node:crypto';
import { createLogger } from './logger.js';
import { formatImapDate, ImapParamList } from './mime.js';

const log = createLogger('imap');

const CAPABILITIES = [
	'IMAP4rev1',
	'AUTH=PLAIN',
	'AUTH=LOGIN',
	'SASL-IR',
	'ID',
	'LITERAL+',
	'NAMESPACE',
	'IDLE',
	'UNSELECT',
	'UIDPLUS',
	'MOVE',
	'UTF-8=ACCEPT',
];

function capabilityString() {
	return CAPABILITIES.join(' ');
}

const SYSTEM_FLAGS = ['\\Answered', '\\Flagged', '\\Deleted', '\\Seen', '\\Draft'];

const MAX_LITERAL_SIZE = 32 * 1024 * 1024;

function atomSafe(str) {
	return str.length > 0 && /^[^\s(){}\[\]%"\\]+$/.test(str);
}

function toImap(value) {
	if (value === null || value === undefined) return 'NIL';
	if (Array.isArray(value)) return `(${value.map(toImap).join(' ')})`;
	const str = String(value);
	if (str === '') return '""';
	if (atomSafe(str)) return str;
	return `"${str.replace(/(["\\])/g, '\\$1')}"`;
}

/**
 * 严格序列化：所有字符串都加引号。
 * ENVELOPE / BODYSTRUCTURE 里的字段按 RFC 都是 quoted string，
 * 用宽松的 atom 写法有些客户端（Apple Mail、Outlook）会解析失败。
 */
function toImapStrict(value) {
	if (value === null || value === undefined) return 'NIL';
	if (value instanceof ImapParamList) {
		const pairs = value.pairs.map(([key, val]) => `${imapQuote(key)} ${imapQuote(val)}`);
		return `(${pairs.join(' ')})`;
	}
	if (Array.isArray(value)) return `(${value.map(toImapStrict).join(' ')})`;
	return imapQuote(String(value));
}

function imapQuote(str) {
	return `"${String(str).replace(/(["\\])/g, '\\$1')}"`;
}

/**
 * 把一行命令切成 token：支持引号串、括号列表、BODY[...] 片段。
 */
function tokenize(str) {
	const tokens = [];
	let i = 0;

	while (i < str.length) {
		const ch = str[i];

		if (ch === ' ') { i += 1; continue; }

		if (ch === '(') {
			let depth = 1;
			let j = i + 1;
			let inner = '';
			while (j < str.length && depth > 0) {
				if (str[j] === '(') depth += 1;
				else if (str[j] === ')') {
					depth -= 1;
					if (depth === 0) break;
				}
				if (str[j] === '"') {
					inner += str[j]; j += 1;
					while (j < str.length && str[j] !== '"') { inner += str[j]; j += 1; }
					inner += '"'; j += 1;
					continue;
				}
				inner += str[j];
				j += 1;
			}
			tokens.push(tokenize(inner));
			i = j + 1;
			continue;
		}

		if (ch === '"') {
			let j = i + 1;
			let val = '';
			while (j < str.length && str[j] !== '"') {
				if (str[j] === '\\') { j += 1; val += str[j]; j += 1; continue; }
				val += str[j];
				j += 1;
			}
			tokens.push(val);
			i = j + 1;
			continue;
		}

		// 原子，可能紧跟 BODY[...] 形式的取件段
		let j = i;
		while (j < str.length && !' ()"['.includes(str[j])) j += 1;
		let token = str.slice(i, j);
		i = j;

		if (str[i] === '[') {
			let depth = 0;
			const start = i;
			while (i < str.length) {
				if (str[i] === '[') depth += 1;
				else if (str[i] === ']') {
					depth -= 1;
					if (depth === 0) { i += 1; break; }
				}
				i += 1;
			}
			token += str.slice(start, i);
		}

		tokens.push(token);
	}

	return tokens;
}

function parseSequenceSet(spec, max) {
	// 返回 1..max 的序号数组
	const result = new Set();
	if (!spec) return [];

	const parts = String(spec).split(',');
	for (const part of parts) {
		const trimmed = part.trim();
		if (!trimmed) continue;
		if (trimmed === '*') {
			if (max > 0) result.add(max);
			continue;
		}
		const [startStr, endStr] = trimmed.split(':');
		let start = startStr === '*' ? max : Number(startStr);
		let end = endStr === undefined ? start : (endStr === '*' ? max : Number(endStr));
		if (Number.isNaN(start) || Number.isNaN(end)) continue;
		if (start > end) [start, end] = [end, start];
		if (start < 1) start = 1;
		if (end > max) end = max;
		for (let n = start; n <= end; n += 1) result.add(n);
	}

	return [...result].sort((a, b) => a - b);
}

function uidValidityOf(seed) {
	const hash = createHash('sha1').update(String(seed)).digest();
	return hash.readUInt32BE(0) || 1;
}

export class ImapServer {
	constructor({ client, mailbox, config }) {
		this.client = client;
		this.mailbox = mailbox;
		this.config = config;
		this.servers = [];
		this.connections = new Set();
	}

	capabilities() {
		return capabilityString();
	}

	start() {
		const { port, tlsPort, allowPlain } = this.config.imap;

		if (allowPlain && port > 0) {
			const plain = net.createServer(socket => this.handleConnection(socket, false));
			plain.on('error', err => log.error('IMAP 监听失败:', err.message));
			this.servers.push(plain);
			plain.listen(port, () => log.info(`IMAP (明文) 监听 ${port}`));
		}

		if (this.config.tls.cert && this.config.tls.key && tlsPort > 0) {
			const secure = tls.createServer(
				{ cert: this.config.tls.cert, key: this.config.tls.key },
				socket => this.handleConnection(socket, true),
			);
			secure.on('error', err => log.error('IMAPS 监听失败:', err.message));
			this.servers.push(secure);
			secure.listen(tlsPort, () => log.info(`IMAPS (隐式 TLS) 监听 ${tlsPort}`));
		} else if (tlsPort > 0) {
			log.warn('未配置 TLS 证书，IMAPS(993) 不会启动');
		}

		return this;
	}

	stop() {
		for (const server of this.servers) server.close();
		this.servers = [];
		for (const connection of this.connections) connection.destroy();
		this.connections.clear();
	}

	handleConnection(socket, secure) {
		const connection = new ImapConnection(socket, {
			client: this.client,
			mailbox: this.mailbox,
			config: this.config,
			secure,
		});
		this.connections.add(connection);
		connection.onClose = () => this.connections.delete(connection);
		connection.start();
	}
}

class ImapConnection {
	constructor(socket, { client, mailbox, config, secure }) {
		this.socket = socket;
		this.client = client;
		this.mailbox = mailbox;
		this.config = config;
		this.secure = secure;

		this.buffer = Buffer.alloc(0);
		this.pendingCommand = '';
		this.literalRemaining = 0;
		this.literalNonSync = false;
		this.pendingLiteral = null;
		this.closed = false;

		this.state = 'notauthenticated';
		this.session = null;

		// AUTHENTICATE 状态机
		this.authState = null;

		// 当前选中的文件夹
		this.selected = null;
		this.idleTimer = null;
		this.idlePolling = false;

		this.socket.setTimeout(config.imap.idleTimeout, () => {
			log.debug('连接空闲超时，关闭');
			this.destroy();
		});
		this.socket.on('data', chunk => this.onData(chunk));
		this.socket.on('timeout', () => this.destroy());
		this.socket.on('error', err => {
			log.debug('socket 错误:', err.message);
			this.destroy();
		});
		this.socket.on('close', () => this.onClose?.());
	}

	start() {
		this.write(`* OK [CAPABILITY ${this.capabilities()}] smail IMAP ready`);
	}

	capabilities() {
		return capabilityString();
	}

	write(line) {
		if (this.closed) return;
		this.socket.write(`${line}\r\n`);
	}

	writeRaw(buffer) {
		if (this.closed) return;
		this.socket.write(buffer);
	}

	destroy() {
		if (this.closed) return;
		this.closed = true;
		this.stopIdle();
		try {
			this.socket.destroy();
		} catch {
			/* ignore */
		}
	}

	onData(chunk) {
		if (this.closed) return;
		this.buffer = Buffer.concat([this.buffer, chunk]);
		this.processBuffer();
	}

	processBuffer() {
		for (;;) {
			if (this.literalRemaining > 0) {
				if (this.buffer.length < this.literalRemaining) return;
				const literal = this.buffer.subarray(0, this.literalRemaining);
				this.buffer = this.buffer.subarray(this.literalRemaining);
				this.literalRemaining = 0;

				if (/^\S+\s+APPEND\s/i.test(this.pendingCommand)) {
					// APPEND 的字面量是邮件正文，单独存着给处理函数用
					this.pendingLiteral = literal;
					this.pendingCommand += ' ';
				} else {
					// 其它命令里的字面量按带引号的字符串接回命令
					this.pendingCommand += `"${literal.toString('utf8').replace(/(["\\])/g, '\\$1')}"`;
				}
				continue;
			}

			const idx = this.buffer.indexOf('\r\n');
			if (idx === -1) return;

			const line = this.buffer.subarray(0, idx).toString('utf8');
			this.buffer = this.buffer.subarray(idx + 2);

			const literalMatch = /~?\{(\d+)(\+?)\}\s*$/.exec(line);
			if (literalMatch) {
				const size = Number(literalMatch[1]);
				if (size > MAX_LITERAL_SIZE) {
					this.write('* BYE Literal too large');
					this.destroy();
					return;
				}
				this.pendingCommand += line.slice(0, literalMatch.index);
				this.literalRemaining = size;
				// LITERAL+（RFC 7888）的字面量不用等服务器回 "+"，立刻就跟着命令发过来。
				this.literalNonSync = literalMatch[2] === '+';
				if (!this.literalNonSync) {
					this.write('+ Ready for literal data');
				}
				continue;
			}

			const full = this.pendingCommand + line;
			this.pendingCommand = '';
			this.handleLine(full);
		}
	}

	async handleLine(line) {
		const trimmed = line.trim();
		if (!trimmed) return;

		// IDLE 期间只等 DONE
		if (this.idleTimer && trimmed.toUpperCase() === 'DONE') {
			this.stopIdle();
			this.write(`${this.idleTag} OK IDLE terminated`);
			return;
		}

		// AUTHENTICATE 的续行：这一行没有 tag，直接就是 base64 数据，
		// 必须在拆 tag 之前拦截，否则会被当成一条没有参数的命令。
		if (this.authState) {
			await this.continueAuth(this.authState.tag, trimmed);
			return;
		}

		const spaceIdx = trimmed.indexOf(' ');
		const tag = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
		const rest = spaceIdx === -1 ? '' : trimmed.slice(spaceIdx + 1).trim();

		if (!rest) {
			this.write(`${tag} BAD Missing command`);
			return;
		}

		const spaceIdx2 = rest.indexOf(' ');
		const command = (spaceIdx2 === -1 ? rest : rest.slice(0, spaceIdx2)).toUpperCase();
		const args = spaceIdx2 === -1 ? '' : rest.slice(spaceIdx2 + 1).trim();

		try {
			await this.dispatch(tag, command, args);
		} catch (err) {
			log.error(`命令 ${command} 执行失败:`, err);
			this.write(`${tag} NO Internal error: ${err.message}`);
		}
	}

	async dispatch(tag, command, args) {
		switch (command) {
			case 'CAPABILITY':
				this.write(`* CAPABILITY ${this.capabilities()}`);
				this.write(`${tag} OK CAPABILITY completed`);
				return;
			case 'NOOP':
				this.write(`${tag} OK NOOP completed`);
				return;
			case 'LOGOUT':
				this.write('* BYE smail IMAP signing off');
				this.write(`${tag} OK LOGOUT completed`);
				this.destroy();
				return;
			case 'ID':
				this.write('* ID ("name" "smail" "version" "1.0")');
				this.write(`${tag} OK ID completed`);
				return;
			case 'ENABLE':
				this.write(`${tag} OK ENABLE completed`);
				return;
			case 'NAMESPACE':
				this.write('* NAMESPACE (("" "/")) NIL NIL');
				this.write(`${tag} OK NAMESPACE completed`);
				return;
			case 'LOGIN':
				return this.handleLogin(tag, args);
			case 'AUTHENTICATE':
				return this.handleAuthenticate(tag, args);
			case 'LIST':
				return this.handleList(tag, args, false);
			case 'LSUB':
				return this.handleList(tag, args, true);
			case 'STATUS':
				return this.handleStatus(tag, args);
			case 'SELECT':
				return this.handleSelect(tag, args, false);
			case 'EXAMINE':
				return this.handleSelect(tag, args, true);
			case 'UNSELECT':
				this.selected = null;
				this.write(`${tag} OK UNSELECT completed`);
				return;
			case 'CLOSE':
				return this.handleClose(tag);
			case 'CHECK':
				this.write(`${tag} OK CHECK completed`);
				return;
			case 'EXPUNGE':
				return this.handleExpunge(tag, false);
			case 'APPEND':
				return this.handleAppend(tag, args);
			case 'FETCH':
				return this.handleFetch(tag, args, false);
			case 'UID':
				return this.handleUid(tag, args);
			case 'STORE':
				return this.handleStore(tag, args, false);
			case 'COPY':
				return this.handleCopy(tag, args, false);
			case 'MOVE':
				return this.handleCopy(tag, args, true);
			case 'SEARCH':
				return this.handleSearch(tag, args, false);
			case 'IDLE':
				return this.handleIdle(tag);
			default:
				this.write(`${tag} BAD Command not recognized`);
		}
	}

	/* ------------------------------------------------------------------ */
	/* 认证                                                                */
	/* ------------------------------------------------------------------ */

	parseAuthArgs(args) {
		const tokens = tokenize(args);
		return { username: tokens[0] ?? '', password: tokens[1] ?? '' };
	}

	async handleLogin(tag, args) {
		if (this.state !== 'notauthenticated') {
			this.write(`${tag} BAD Already authenticated`);
			return;
		}
		const { username, password } = this.parseAuthArgs(args);
		await this.authenticate(tag, username, password);
	}

	// SASL 的 base64 解码：非法数据返回空串，按认证失败处理
	decodeSasl(line) {
		try {
			return Buffer.from((line || '').trim(), 'base64').toString('utf8');
		} catch {
			return '';
		}
	}

	// RFC 4959：AUTHENTICATE <mechanism> 后面可以直接跟初始响应（SASL-IR）
	async beginSasl(tag, mechanism, initial) {
		const mech = (mechanism || '').trim().toUpperCase();

		if (mech === 'PLAIN') {
			if (initial !== null && initial !== '=') {
				await this.finishPlain(tag, initial);
			} else {
				this.authState = { stage: 'plain', tag };
				this.write('+ ');
			}
			return;
		}

		if (mech === 'LOGIN') {
			if (initial !== null && initial !== '=') {
				this.authState = { stage: 'login-password', tag, username: this.decodeSasl(initial) };
				this.write('+ Password');
			} else {
				this.authState = { stage: 'login-username', tag };
				this.write('+ Username');
			}
			return;
		}

		this.write(`${tag} NO Unsupported authentication mechanism`);
	}

	// PLAIN 的载荷是 \0user\0password，个别客户端会带 authzid：authzid\0user\0password
	async finishPlain(tag, payload) {
		const parts = this.decodeSasl(payload).split('\0');
		const username = parts.length >= 3 ? parts[1] : parts[0];
		const password = parts.length >= 3 ? parts[2] : parts[1];
		await this.authenticate(tag, username ?? '', password ?? '');
	}

	async handleAuthenticate(tag, args) {
		if (this.state !== 'notauthenticated') {
			this.write(`${tag} BAD Already authenticated`);
			return;
		}

		const raw = (args || '').trim();
		if (!raw) {
			this.authState = { stage: 'mechanism', tag };
			this.write('+ PLAIN LOGIN');
			return;
		}

		const [mechanism, ...rest] = raw.split(/\s+/);
		await this.beginSasl(tag, mechanism, rest.length ? rest.join(' ') : null);
	}

	async continueAuth(tag, line) {
		const state = this.authState;
		this.authState = null;

		if (!state) {
			this.write(`${tag} BAD Unexpected continuation`);
			return;
		}

		// 客户端用 * 取消认证（RFC 3501 6.2.2）
		if ((line || '').trim() === '*') {
			this.write(`${tag} BAD Authentication cancelled`);
			return;
		}

		if (state.stage === 'mechanism') {
			await this.beginSasl(tag, line, null);
			return;
		}

		if (state.stage === 'plain') {
			await this.finishPlain(tag, line);
			return;
		}

		if (state.stage === 'login-username') {
			this.authState = { stage: 'login-password', tag, username: this.decodeSasl(line) };
			this.write('+ Password');
			return;
		}

		if (state.stage === 'login-password') {
			await this.authenticate(tag, state.username ?? '', this.decodeSasl(line));
			return;
		}
	}

	async authenticate(tag, username, password) {
		if (!username || !password) {
			this.write(`${tag} NO Invalid credentials`);
			return;
		}

		try {
			const data = await this.client.login(username, password);
			this.session = {
				token: data.token,
				email: data.email,
				account: data.account,
				accounts: data.accounts || [],
			};
			this.state = 'authenticated';
			log.info(`登录成功: ${username} (${this.session.account.email})`);
			this.write(`${tag} OK [CAPABILITY ${this.capabilities()}] Logged in`);
		} catch (err) {
			log.warn(`登录失败: ${username}: ${err.message}`);
			this.write(`${tag} NO [AUTHENTICATIONFAILED] ${err.message}`);
		}
	}

	requireSession(tag) {
		if (this.state !== 'authenticated' && this.state !== 'selected') {
			this.write(`${tag} NO Not authenticated`);
			return false;
		}
		return true;
	}

	/* ------------------------------------------------------------------ */
	/* 文件夹                                                              */
	/* ------------------------------------------------------------------ */

	async handleList(tag, args, lsub) {
		if (!this.requireSession(tag)) return;

		const tokens = tokenize(args);
		const reference = tokens[0] ?? '';
		const pattern = tokens[1] ?? '*';
		const folders = await this.mailbox.listFolders(this.session);

		const regex = this.patternToRegex(pattern);

		for (const folder of folders) {
			if (!regex.test(folder.name)) continue;
			const flags = ['\\HasNoChildren'];
			if (folder.special) flags.push(folder.special);
			this.write(`* ${lsub ? 'LSUB' : 'LIST'} (${flags.join(' ')}) "/" ${toImap(folder.name)}`);
		}

		this.write(`${tag} OK ${lsub ? 'LSUB' : 'LIST'} completed`);
	}

	patternToRegex(pattern) {
		const escaped = String(pattern)
			.replace(/[.+?^${}()|[\]\\]/g, '\\$&')
			.replace(/\*/g, '.*')
			.replace(/%/g, '[^/]*');
		return new RegExp(`^${escaped}$`, 'i');
	}

	async handleStatus(tag, args) {
		if (!this.requireSession(tag)) return;

		const tokens = tokenize(args);
		const folderName = tokens[0] ?? '';
		const folder = await this.mailbox.findFolder(this.session, folderName);
		if (!folder) {
			this.write(`${tag} NO Mailbox does not exist`);
			return;
		}

		const messages = await this.mailbox.listMessages(this.session, folder);
		const unseen = messages.filter(row => row.unread === 0).length;
		const uidNext = messages.length ? Math.max(...messages.map(row => row.emailId)) + 1 : 1;

		const requested = (tokens[1] || []).map(item => String(item).toUpperCase());
		const values = {
			MESSAGES: messages.length,
			UNSEEN: unseen,
			RECENT: 0,
			UIDNEXT: uidNext,
			UIDVALIDITY: uidValidityOf(folder.accountId),
		};

		const parts = requested
			.filter(key => key in values)
			.map(key => `${key} ${values[key]}`);

		this.write(`* STATUS ${toImap(folder.name)} (${parts.join(' ')})`);
		this.write(`${tag} OK STATUS completed`);
	}

	async handleSelect(tag, args, readOnly) {
		if (!this.requireSession(tag)) return;

		const tokens = tokenize(args);
		const folderName = tokens[0] ?? '';
		const folder = await this.mailbox.findFolder(this.session, folderName);
		if (!folder) {
			this.write(`${tag} NO Mailbox does not exist`);
			return;
		}

		const messages = await this.mailbox.listMessages(this.session, folder);
		const uidValidity = uidValidityOf(folder.accountId);
		const uidNext = messages.length ? Math.max(...messages.map(row => row.emailId)) + 1 : 1;
		const firstUnseen = messages.find(row => row.unread === 0);

		this.selected = {
			folder,
			messages,
			readOnly,
			uidValidity,
			uidNext,
			deleted: new Set(),
			detailCache: new Map(),
		};
		this.state = 'selected';

		this.write('* FLAGS (\\Answered \\Flagged \\Deleted \\Seen \\Draft)');
		this.write(`* OK [PERMANENTFLAGS (${SYSTEM_FLAGS.join(' ')} \\*)] Flags permitted`);
		this.write(`* ${messages.length} EXISTS`);
		this.write('* 0 RECENT');
		this.write(`* OK [UIDVALIDITY ${uidValidity}] UIDs valid`);
		this.write(`* OK [UIDNEXT ${uidNext}] Predicted next UID`);
		if (firstUnseen) {
			this.write(`* OK [UNSEEN ${firstUnseen.emailId}] First unseen message`);
		}
		this.write(`${tag} OK [${readOnly ? 'READ-ONLY' : 'READ-WRITE'}] ${readOnly ? 'EXAMINE' : 'SELECT'} completed`);
	}

	/* ------------------------------------------------------------------ */
	/* 邮件取件                                                            */
	/* ------------------------------------------------------------------ */

	async ensureSelected(tag) {
		if (this.state !== 'selected' || !this.selected) {
			this.write(`${tag} NO No mailbox selected`);
			return false;
		}
		return true;
	}

	async getDetail(emailId) {
		const cache = this.selected.detailCache;
		if (cache.has(emailId)) return cache.get(emailId);
		const detail = await this.mailbox.buildMessage(this.session, emailId);
		cache.set(emailId, detail);
		return detail;
	}

	flagsOf(row) {
		const flags = [];
		if (row.unread === 1) flags.push('\\Seen');
		if (row.isStar === 1) flags.push('\\Flagged');
		if (this.selected?.deleted?.has(row.emailId)) flags.push('\\Deleted');
		return flags;
	}

	async handleUid(tag, args) {
		const spaceIdx = args.indexOf(' ');
		const sub = (spaceIdx === -1 ? args : args.slice(0, spaceIdx)).toUpperCase();
		const rest = spaceIdx === -1 ? '' : args.slice(spaceIdx + 1).trim();

		switch (sub) {
			case 'FETCH':
				return this.handleFetch(tag, rest, true);
			case 'STORE':
				return this.handleStore(tag, rest, true);
			case 'COPY':
				return this.handleCopy(tag, rest, false, true);
			case 'MOVE':
				return this.handleCopy(tag, rest, true, true);
			case 'SEARCH':
				return this.handleSearch(tag, rest, true);
			case 'EXPUNGE':
				return this.handleExpunge(tag, true);
			default:
				this.write(`${tag} BAD Invalid UID command`);
		}
	}

	async handleFetch(tag, args, isUid) {
		if (!await this.ensureSelected(tag)) return;

		const tokens = tokenize(args);
		if (tokens.length < 2) {
			this.write(`${tag} BAD Invalid FETCH arguments`);
			return;
		}

		const setSpec = tokens[0];
		const itemTokens = Array.isArray(tokens[1]) ? tokens[1] : tokens.slice(1);
		const items = itemTokens.filter(token => typeof token === 'string');
		const parsedItems = items.map(parseFetchItem).filter(Boolean);

		const messages = this.selected.messages;
		let indexes;

		if (isUid) {
			const uids = parseSequenceSet(setSpec, this.selected.uidNext - 1);
			indexes = uids
				.map(uid => messages.findIndex(row => row.emailId === uid))
				.filter(index => index >= 0);
		} else {
			indexes = parseSequenceSet(setSpec, messages.length);
		}

		for (const index of indexes) {
			const row = messages[index];
			const detail = await this.getDetail(row.emailId);
			if (!detail) continue;
			await this.respondFetch(index + 1, row, detail, parsedItems);
		}

		this.write(`${tag} OK ${isUid ? 'UID ' : ''}FETCH completed`);
	}

	async respondFetch(seq, row, detail, items) {
		const built = detail.built;
		const { raw } = built;

		let markSeen = false;
		const parts = [];

		for (const item of items) {
			switch (item.name) {
				case 'UID':
					parts.push({ text: `UID ${row.emailId}` });
					break;
				case 'FLAGS':
					parts.push({ text: `FLAGS (${this.flagsOf(row).join(' ')})` });
					break;
				case 'INTERNALDATE':
					parts.push({ text: `INTERNALDATE "${formatImapDate(detail.date)}"` });
					break;
				case 'RFC822.SIZE':
					parts.push({ text: `RFC822.SIZE ${raw.length}` });
					break;
				case 'ENVELOPE':
					parts.push({ text: `ENVELOPE ${toImapStrict(detail.envelope)}` });
					break;
				case 'BODYSTRUCTURE':
					parts.push({ text: `BODYSTRUCTURE ${toImapStrict(detail.structure)}` });
					break;
				case 'BODY':
				case 'BODY.PEEK': {
					const buffer = this.resolveSection(built, item.section);
					// 响应里的标签不带 .PEEK，PEEK 只是给服务端看的修饰符
					const label = `BODY${item.section === null ? '' : `[${item.section}]`}`;
					if (!buffer) {
						parts.push({ text: `${label} NIL` });
						break;
					}
					if (!item.peek) markSeen = true;
					parts.push({ text: label, literal: buffer });
					break;
				}
				case 'RFC822':
					parts.push({ text: 'RFC822', literal: raw });
					break;
				case 'RFC822.HEADER':
					parts.push({ text: 'RFC822.HEADER', literal: built.headerBlock });
					break;
				case 'RFC822.TEXT':
					parts.push({ text: 'RFC822.TEXT', literal: built.bodyBlock });
					break;
				default:
					break;
			}
		}

		if (markSeen) {
			row.unread = 1;
			this.client.setRead(this.session.token, [row.emailId], 1).catch(err => {
				log.warn('标记已读失败:', err.message);
			});
		}

		// 注意：FETCH 响应必须写成一整行，字面量数据不能被换行拆开，
		// 所以这里全部用 writeRaw 手动拼，不走会自动追加 \r\n 的 write()。
		this.writeRaw(Buffer.from(`* ${seq} FETCH (`));
		let first = true;
		for (const part of parts) {
			if (!first) this.writeRaw(Buffer.from(' '));
			first = false;
			if (part.literal) {
				this.writeRaw(Buffer.from(`${part.text} {${part.literal.length}}\r\n`));
				this.writeRaw(part.literal);
			} else {
				this.writeRaw(Buffer.from(part.text));
			}
		}
		this.writeRaw(Buffer.from(')\r\n'));
	}

	/**
	 * 解析 BODY[...] 请求段，返回对应的字节区间。
	 */
	resolveSection(built, section) {
		const raw = built.raw;
		if (!section) return raw;

		const upper = section.toUpperCase();

		if (upper === 'HEADER') return built.headerBlock;
		if (upper === 'TEXT') return built.bodyBlock;

		if (upper.startsWith('HEADER.FIELDS.NOT')) {
			const fields = this.parseHeaderFields(section);
			return this.filterHeaders(built, fields, true);
		}
		if (upper.startsWith('HEADER.FIELDS')) {
			const fields = this.parseHeaderFields(section);
			return this.filterHeaders(built, fields, false);
		}

		// 形如 1 / 1.2 / 1.MIME / 1.TEXT
		const match = /^(\d+(?:\.\d+)*)(\.(MIME|TEXT|HEADER))?$/i.exec(section.trim());
		if (!match) return null;

		const path = match[1];
		const part = built.parts.get(path);
		if (!part) return null;

		const suffix = (match[2] || '').toUpperCase();
		if (suffix === 'MIME') return raw.slice(part.headerStart, part.bodyStart);
		if (suffix === 'TEXT') return raw.slice(part.bodyStart, part.bodyEnd);
		if (suffix === 'HEADER') return raw.slice(part.headerStart, part.bodyStart);
		return raw.slice(part.bodyStart, part.bodyEnd);
	}

	parseHeaderFields(section) {
		const match = /HEADER\.FIELDS(?:\.NOT)?\s*\(([^)]*)\)/i.exec(section);
		if (!match) return [];
		return match[1].trim().split(/\s+/).filter(Boolean);
	}

	filterHeaders(built, fields, invert) {
		const wanted = fields.map(field => field.toLowerCase());
		const lines = [];
		for (const header of built.headers) {
			const name = header.name.toLowerCase();
			const hit = wanted.includes(name);
			if (invert ? !hit : hit) {
				lines.push(`${header.name}: ${header.value}`);
			}
		}
		if (!lines.length) return Buffer.alloc(0);
		return Buffer.from(`${lines.join('\r\n')}\r\n\r\n`, 'utf8');
	}

	/* ------------------------------------------------------------------ */
	/* 标记                                                                */
	/* ------------------------------------------------------------------ */

	async handleStore(tag, args, isUid) {
		if (!await this.ensureSelected(tag)) return;

		if (this.selected.readOnly) {
			this.write(`${tag} NO Mailbox is read-only`);
			return;
		}

		const tokens = tokenize(args);
		if (tokens.length < 3) {
			this.write(`${tag} BAD Invalid STORE arguments`);
			return;
		}

		const setSpec = tokens[0];
		const action = String(tokens[1]).toUpperCase();
		const flagTokens = Array.isArray(tokens[2]) ? tokens[2] : [tokens[2]];
		const flags = flagTokens.filter(token => typeof token === 'string');
		const silent = action.includes('.SILENT');

		const messages = this.selected.messages;
		const targets = isUid
			? parseSequenceSet(setSpec, this.selected.uidNext - 1)
				.map(uid => messages.findIndex(row => row.emailId === uid))
				.filter(index => index >= 0)
			: parseSequenceSet(setSpec, messages.length);

		const add = action.startsWith('+');
		const readIds = [];
		const unreadIds = [];
		const starIds = [];
		const unstarIds = [];

		for (const index of targets) {
			const row = messages[index];

			for (const flag of flags) {
				const name = flag.toUpperCase();
				if (name === '\\SEEN') {
					if (add) readIds.push(row.emailId);
					else unreadIds.push(row.emailId);
				} else if (name === '\\FLAGGED') {
					if (add) starIds.push(row.emailId);
					else unstarIds.push(row.emailId);
				} else if (name === '\\DELETED') {
					if (add) this.selected.deleted.add(row.emailId);
					else this.selected.deleted.delete(row.emailId);
				}
			}

			if (readIds.includes(row.emailId)) row.unread = 1;
			if (unreadIds.includes(row.emailId)) row.unread = 0;
		}

		try {
			if (readIds.length) await this.client.setRead(this.session.token, readIds, 1);
			if (unreadIds.length) await this.client.setRead(this.session.token, unreadIds, 0);
			for (const emailId of starIds) await this.client.addStar(this.session.token, emailId);
			for (const emailId of unstarIds) await this.client.cancelStar(this.session.token, emailId);
		} catch (err) {
			log.warn('STORE 写入失败:', err.message);
			this.write(`${tag} NO ${err.message}`);
			return;
		}

		if (!silent) {
			for (const index of targets) {
				const row = messages[index];
				this.write(`* ${index + 1} FETCH (FLAGS (${this.flagsOf(row).join(' ')}))`);
			}
		}

		this.write(`${tag} OK ${isUid ? 'UID ' : ''}STORE completed`);
	}

	async handleExpunge(tag, isUid) {
		if (!await this.ensureSelected(tag)) return;

		if (this.selected.readOnly) {
			this.write(`${tag} NO Mailbox is read-only`);
			return;
		}

		const deleted = [...this.selected.deleted];
		if (!deleted.length) {
			this.write(`${tag} OK EXPUNGE completed`);
			return;
		}

		const messages = this.selected.messages;
		const indexes = deleted
			.map(emailId => messages.findIndex(row => row.emailId === emailId))
			.filter(index => index >= 0)
			.sort((a, b) => b - a);

		try {
			await this.client.permanentDelete(this.session.token, deleted);
		} catch (err) {
			log.warn('彻底删除失败:', err.message);
			this.write(`${tag} NO ${err.message}`);
			return;
		}

		for (const index of indexes) {
			this.write(`* ${index + 1} EXPUNGE`);
			const removed = messages[index];
			messages.splice(index, 1);
			this.selected.deleted.delete(removed?.emailId);
		}

		this.write(`${tag} OK ${isUid ? 'UID ' : ''}EXPUNGE completed`);
	}

	async handleClose(tag) {
		if (!await this.ensureSelected(tag)) return;
		await this.handleExpunge(tag, false);
		this.selected = null;
		this.state = 'authenticated';
		this.write(`${tag} OK CLOSE completed`);
	}

	/**
	 * 重新拉取当前选中文件夹的邮件列表。
	 * APPEND / COPY 之后必须刷新，否则客户端看到的还是旧的 EXISTS 数量。
	 */
	async refreshSelected() {
		if (!this.selected) return;
		const before = this.selected.messages.length;
		const messages = await this.mailbox.listMessages(this.session, this.selected.folder);
		this.selected.messages = messages;
		this.selected.uidNext = messages.length ? Math.max(...messages.map(row => row.emailId)) + 1 : 1;
		if (messages.length !== before) {
			this.write(`* ${messages.length} EXISTS`);
		}
	}

	async handleCopy(tag, args, isMove, isUid) {
		if (!await this.ensureSelected(tag)) return;

		const tokens = tokenize(args);
		if (tokens.length < 2) {
			this.write(`${tag} BAD Invalid COPY arguments`);
			return;
		}

		const setSpec = tokens[0];
		const targetName = tokens[1];
		const target = await this.mailbox.findFolder(this.session, targetName);
		if (!target) {
			this.write(`${tag} NO [TRYCREATE] Mailbox does not exist`);
			return;
		}

		if (target.kind === 'inbox') {
			this.write(`${tag} NO Copying into INBOX is not supported`);
			return;
		}

		const messages = this.selected.messages;
		const indexes = isUid
			? parseSequenceSet(setSpec, this.selected.uidNext - 1)
				.map(uid => messages.findIndex(row => row.emailId === uid))
				.filter(index => index >= 0)
			: parseSequenceSet(setSpec, messages.length);

		const rows = indexes.map(index => messages[index]);
		const emailIds = rows.map(row => row.emailId);

		try {
			if (target.kind === 'starred') {
				// 「星标」是个虚拟文件夹，复制进去 = 给邮件加星标
				for (const emailId of emailIds) {
					await this.client.addStar(this.session.token, emailId);
				}
			} else if (isMove && target.kind === 'trash') {
				// 移到回收站 = 直接标记删除
				await this.client.moveToTrash(this.session.token, emailIds);
			} else {
				// 其它情况统一走「复制一封」的接口
				for (const row of rows) {
					await this.mailbox.copyMessage(
						this.session,
						row.emailId,
						target,
						row.type,
						row.unread === 1 ? 0 : 1,
					);
				}

				if (isMove) {
					// MOVE = 复制后把原件删掉
					await this.client.moveToTrash(this.session.token, emailIds);
				}
			}
		} catch (err) {
			this.write(`${tag} NO ${err.message}`);
			return;
		}

		if (isMove) {
			for (const index of indexes.sort((a, b) => b - a)) {
				this.write(`* ${index + 1} EXPUNGE`);
				messages.splice(index, 1);
			}
		}

		try {
			await this.refreshSelected();
		} catch (err) {
			log.warn('刷新邮件列表失败:', err.message);
		}

		this.write(`${tag} OK ${isMove ? 'MOVE' : 'COPY'} completed`);
	}

	async handleAppend(tag, args) {
		if (!this.requireSession(tag)) return;

		// APPEND <mailbox> [(<flags>)] ["<date-time>"] {<literal>}
		const tokens = tokenize(args);
		if (!tokens.length) {
			this.write(`${tag} BAD Invalid APPEND arguments`);
			return;
		}

		const targetName = tokens[0];
		const target = await this.mailbox.findFolder(this.session, targetName);
		if (!target) {
			this.write(`${tag} NO [TRYCREATE] Mailbox does not exist`);
			return;
		}

		const literal = this.pendingLiteral;
		this.pendingLiteral = null;

		if (!literal) {
			this.write(`${tag} BAD APPEND requires a message literal`);
			return;
		}

		try {
			const inserted = await this.mailbox.appendRaw(this.session, target, literal);
			await this.refreshSelected();
			const uid = inserted?.emailId || 0;
			this.write(`${tag} OK [APPENDUID ${uidValidityOf(target.accountId)} ${uid}] APPEND completed`);
		} catch (err) {
			log.warn('APPEND 失败:', err.message);
			this.write(`${tag} NO ${err.message}`);
			return;
		}
	}

	/* ------------------------------------------------------------------ */
	/* 搜索                                                                */
	/* ------------------------------------------------------------------ */

	async handleSearch(tag, args, isUid) {
		if (!await this.ensureSelected(tag)) return;

		const tokens = tokenize(args);
		const criteria = tokens.filter(token => typeof token === 'string');
		const messages = this.selected.messages;

		const matched = [];
		for (let index = 0; index < messages.length; index += 1) {
			const row = messages[index];
			if (await this.matchCriteria(row, criteria, tokens)) {
				matched.push(isUid ? row.emailId : index + 1);
			}
		}

		this.write(`* SEARCH${matched.length ? ` ${matched.join(' ')}` : ''}`);
		this.write(`${tag} OK ${isUid ? 'UID ' : ''}SEARCH completed`);
	}

	async matchCriteria(row, criteria, allTokens) {
		let index = 0;
		const evaluate = async () => {
			if (index >= criteria.length) return true;
			const criterion = criteria[index].toUpperCase();
			index += 1;

			switch (criterion) {
				case 'ALL':
					return true;
				case 'UNSEEN':
					return row.unread === 0;
				case 'SEEN':
					return row.unread === 1;
				case 'FLAGGED':
					return row.isStar === 1;
				case 'UNFLAGGED':
					return row.isStar !== 1;
				case 'DELETED':
					return this.selected.deleted.has(row.emailId);
				case 'UNDELETED':
					return !this.selected.deleted.has(row.emailId);
				case 'NEW':
				case 'RECENT':
					return row.unread === 0;
				case 'OLD':
					return row.unread === 1;
				case 'DRAFT':
					return false;
				case 'ANSWERED':
					return false;
				case 'UNANSWERED':
					return true;
				case 'NOT': {
					const result = await evaluate();
					return !result;
				}
				case 'OR': {
					const left = await evaluate();
					const right = await evaluate();
					return left || right;
				}
				case 'FROM':
				case 'TO':
				case 'CC':
				case 'BCC':
				case 'SUBJECT':
				case 'BODY':
				case 'TEXT': {
					const needle = String(criteria[index] ?? '');
					index += 1;
					return this.matchText(row, criterion, needle);
				}
				case 'HEADER': {
					const field = String(criteria[index] ?? '');
					index += 1;
					const needle = String(criteria[index] ?? '');
					index += 1;
					return this.matchHeader(row, field, needle);
				}
				case 'KEYWORD':
				case 'UNKEYWORD':
					index += 1;
					return false;
				case 'SINCE':
				case 'BEFORE':
				case 'ON':
				case 'SENTSINCE':
				case 'SENTBEFORE':
				case 'SENTON': {
					const value = String(criteria[index] ?? '');
					index += 1;
					return this.matchDate(row, criterion, value);
				}
				case 'LARGER':
				case 'SMALLER': {
					const value = Number(criteria[index] ?? 0);
					index += 1;
					const size = row.contentLength ?? 0;
					return criterion === 'LARGER' ? size > value : size < value;
				}
				case 'CHARSET': {
					// CHARSET UTF-8 之类的引导条件：跳过字符集名，继续判断后面的条件
					index += 1;
					return evaluate();
				}
				default:
					// 序号集合
					if (/^[\d,:*]+$/.test(criterion)) {
						const seqs = parseSequenceSet(criterion, this.selected.messages.length);
						const pos = this.selected.messages.indexOf(row) + 1;
						return seqs.includes(pos);
					}
					// 未知条件直接跳过（RFC 允许忽略不认识的搜索条件），
					// 不能当成「匹配」，否则 CHARSET 之类会让所有邮件都命中。
					return evaluate();
			}
		};

		return evaluate();
	}

	async matchText(row, criterion, needle) {
		if (!needle) return false;
		const target = needle.toLowerCase();

		if (criterion === 'SUBJECT') {
			return (row.subject || '').toLowerCase().includes(target);
		}
		if (criterion === 'FROM') {
			return `${row.name || ''} ${row.sendEmail || ''}`.toLowerCase().includes(target);
		}
		if (criterion === 'TO') {
			return `${row.toName || ''} ${row.toEmail || ''}`.toLowerCase().includes(target);
		}

		const detail = await this.getDetail(row.emailId);
		if (!detail) return false;
		const haystack = `${detail.row.content || ''} ${detail.row.text || ''}`.toLowerCase();
		return haystack.includes(target);
	}

	async matchHeader(row, field, needle) {
		const detail = await this.getDetail(row.emailId);
		if (!detail) return false;
		const name = field.toLowerCase();
		const target = (needle || '').toLowerCase();
		for (const header of detail.built.headers) {
			if (header.name.toLowerCase() === name && header.value.toLowerCase().includes(target)) {
				return true;
			}
		}
		return false;
	}

	matchDate(row, criterion, value) {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return false;
		const rowDate = new Date(String(row.createTime || '').replace(' ', 'T') + 'Z');
		if (Number.isNaN(rowDate.getTime())) return false;

		const day = value => value.slice(0, 10);
		if (criterion === 'SINCE') return day(rowDate.toISOString()) >= day(date.toISOString());
		if (criterion === 'BEFORE') return day(rowDate.toISOString()) < day(date.toISOString());
		return day(rowDate.toISOString()) === day(date.toISOString());
	}

	/* ------------------------------------------------------------------ */
	/* IDLE                                                                */
	/* ------------------------------------------------------------------ */

	async handleIdle(tag) {
		if (!await this.ensureSelected(tag)) return;

		this.idleTag = tag;
		this.write('+ idling');
		this.idleTimer = setInterval(() => this.pollIdle(), 30000);
	}

	stopIdle() {
		if (this.idleTimer) {
			clearInterval(this.idleTimer);
			this.idleTimer = null;
		}
	}

	async pollIdle() {
		if (!this.selected || this.idlePolling) return;
		this.idlePolling = true;
		try {
			const messages = await this.mailbox.listMessages(this.session, this.selected.folder);
			if (messages.length !== this.selected.messages.length) {
				this.selected.messages = messages;
				this.write(`* ${messages.length} EXISTS`);
			}
		} catch {
			// 轮询失败保持安静，客户端会在下次 SELECT 时拿到最新数据
		} finally {
			this.idlePolling = false;
		}
	}
}

/**
 * 解析 FETCH 取件项：BODY / BODY.PEEK / RFC822 / FLAGS ...
 */
function parseFetchItem(token) {
	const match = /^(BODY\.PEEK|BODY|RFC822\.HEADER|RFC822\.TEXT|RFC822\.SIZE|RFC822|UID|FLAGS|INTERNALDATE|ENVELOPE|BODYSTRUCTURE)(?:\[(.*)\])?$/i.exec(String(token).trim());
	if (!match) return null;
	const name = match[1].toUpperCase();
	return {
		name,
		peek: name === 'BODY.PEEK',
		// section 为 null 表示没写取件段；空字符串表示 BODY[]（整封）
		section: match[2] === undefined ? null : match[2],
	};
}

export default ImapServer;
