// MIME 构造器。
//
// IMAP 的 FETCH 需要按「字节区间」返回邮件任意部分（整封 / 头 / 正文 / 某个附件），
// 所以这里自己拼装 RFC822 报文，并在拼装过程中记录每一段的字节偏移，
// 这样 BODY[1.2]、BODY[HEADER.FIELDS (TO)] 之类的请求都能精确切出来。

const CRLF = '\r\n';

class ByteWriter {
	constructor() {
		this.chunks = [];
		this.length = 0;
	}

	write(buf) {
		const b = Buffer.isBuffer(buf) ? buf : Buffer.from(String(buf), 'utf8');
		this.chunks.push(b);
		this.length += b.length;
		return this.length;
	}

	slice(start, end) {
		return Buffer.concat(this.chunks).slice(start, end);
	}

	toBuffer() {
		return Buffer.concat(this.chunks);
	}
}

export function encodeHeaderValue(value) {
	if (value === undefined || value === null) return '';
	const str = String(value);
	// 纯 ASCII 且不含换行时原样输出
	if (!/[\r\n]/.test(str) && /^[\x20-\x7E]*$/.test(str)) return str;
	return `=?UTF-8?B?${Buffer.from(str, 'utf8').toString('base64')}?=`;
}

function encodeParameterValue(value) {
	const str = String(value ?? '');
	if (!/[\r\n]/.test(str) && /^[\x20-\x7E]*$/.test(str)) {
		return `"${str.replace(/(["\\])/g, '\\$1')}"`;
	}
	return `UTF-8''${encodeURIComponent(str).replace(/'/g, '%27')}`;
}

export function formatAddress({ name, address }) {
	if (!address) return '';
	if (!name) return `<${address}>`;
	return `${encodeHeaderValue(name)} <${address}>`;
}

export function formatRfc822Date(date) {
	const d = date instanceof Date ? date : new Date(date);
	if (Number.isNaN(d.getTime())) return new Date(0).toUTCString();
	const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const pad = n => String(n).padStart(2, '0');
	return `${days[d.getUTCDay()]}, ${pad(d.getUTCDate())} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()} ` +
		`${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} +0000`;
}

export function formatImapDate(date) {
	const d = date instanceof Date ? date : new Date(date);
	if (Number.isNaN(d.getTime())) return '01-Jan-1970 00:00:00 +0000';
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const pad = n => String(n).padStart(2, '0');
	return `${pad(d.getUTCDate())}-${months[d.getUTCMonth()]}-${d.getUTCFullYear()} ` +
		`${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} +0000`;
}

/**
 * IMAP 参数列表，例如 ("CHARSET" "UTF-8")。
 * 之所以单独用一个类型，是因为结构里的参数是「扁平的键值对」，
 * 而普通数组会被序列化成嵌套列表。
 */
export class ImapParamList {
	constructor(pairs = []) {
		this.pairs = pairs;
	}
}

function base64Body(buf) {
	if (!buf || !buf.length) return Buffer.alloc(0);
	const b64 = buf.toString('base64');
	const lines = [];
	for (let i = 0; i < b64.length; i += 76) lines.push(b64.slice(i, i + 76));
	return Buffer.from(`${lines.join(CRLF)}${CRLF}`, 'utf8');
}

let boundaryCounter = 0;

function makeBoundary() {
	boundaryCounter += 1;
	const rand = Math.random().toString(36).slice(2, 12);
	return `----=_smail_${Date.now().toString(36)}_${boundaryCounter}_${rand}`;
}

function textNode(subtype, content) {
	return {
		type: 'single',
		subtype,
		contentType: `text/${subtype}`,
		content: Buffer.from(content || '', 'utf8'),
	};
}

function attachmentNode(att) {
	const filename = att.filename || 'attachment';
	const contentType = att.contentType || 'application/octet-stream';
	return {
		type: 'single',
		subtype: (contentType.split('/')[1] || 'octet-stream').split(';')[0],
		contentType,
		filename,
		contentId: att.contentId,
		content: Buffer.isBuffer(att.content) ? att.content : Buffer.from(att.content || ''),
		disposition: 'attachment',
	};
}

/**
 * 组装一封完整的邮件。
 *
 * @returns {{raw: Buffer, headers: Array, headerBlock: Buffer, bodyBlock: Buffer, parts: Map}}
 */
export function buildMessage({
	from,
	to = [],
	cc = [],
	bcc = [],
	subject = '',
	date = new Date(),
	messageId = '',
	inReplyTo = '',
	references = '',
	text = '',
	html = '',
	attachments = [],
} = {}) {
	const attachmentList = (attachments || []).filter(att => att && att.content && att.content.length);

	// 正文：有纯文本和 HTML 时用 multipart/alternative
	let bodyNode;
	const textContent = text ? String(text) : '';
	const htmlContent = html ? String(html) : '';

	if (textContent && htmlContent) {
		bodyNode = {
			type: 'multipart',
			subtype: 'alternative',
			boundary: makeBoundary(),
			children: [textNode('plain', textContent), textNode('html', htmlContent)],
		};
	} else if (htmlContent) {
		bodyNode = textNode('html', htmlContent);
	} else {
		bodyNode = textNode('plain', textContent);
	}

	let rootNode = bodyNode;
	if (attachmentList.length > 0) {
		rootNode = {
			type: 'multipart',
			subtype: 'mixed',
			boundary: makeBoundary(),
			children: [bodyNode, ...attachmentList.map(attachmentNode)],
		};
	}

	const out = new ByteWriter();
	const parts = new Map();

	const messageHeaders = [];
	messageHeaders.push({ name: 'From', value: formatAddress(from) });
	if (to.length) messageHeaders.push({ name: 'To', value: to.map(formatAddress).join(', ') });
	if (cc.length) messageHeaders.push({ name: 'Cc', value: cc.map(formatAddress).join(', ') });
	if (bcc.length) messageHeaders.push({ name: 'Bcc', value: bcc.map(formatAddress).join(', ') });
	messageHeaders.push({ name: 'Subject', value: encodeHeaderValue(subject || '') });
	messageHeaders.push({ name: 'Date', value: formatRfc822Date(date) });
	if (messageId) messageHeaders.push({ name: 'Message-ID', value: `<${messageId}>` });
	if (inReplyTo) messageHeaders.push({ name: 'In-Reply-To', value: `<${inReplyTo}>` });
	if (references) messageHeaders.push({ name: 'References', value: `<${references}>` });
	messageHeaders.push({ name: 'MIME-Version', value: '1.0' });

	for (const header of messageHeaders) {
		out.write(`${header.name}: ${header.value}${CRLF}`);
	}

	function nodeContentHeaders(node) {
		if (node.type === 'multipart') {
			return [`Content-Type: multipart/${node.subtype}; boundary="${node.boundary}"`];
		}
		const headers = [];
		if (node.filename) {
			headers.push(`Content-Type: ${node.contentType}; name=${encodeParameterValue(node.filename)}`);
		} else {
			headers.push(`Content-Type: ${node.contentType}; charset="utf-8"`);
		}
		headers.push('Content-Transfer-Encoding: base64');
		if (node.disposition) {
			headers.push(`Content-Disposition: ${node.disposition}; filename=${encodeParameterValue(node.filename || '')}`);
		}
		if (node.contentId) {
			headers.push(`Content-ID: <${node.contentId}>`);
		}
		return headers;
	}

	function writeNode(node, path) {
		const headerStart = out.length;
		for (const line of nodeContentHeaders(node)) {
			out.write(`${line}${CRLF}`);
		}
		const headerEnd = out.length;
		out.write(CRLF);

		const bodyStart = out.length;

		if (node.type === 'multipart') {
			node.children.forEach((child, index) => {
				out.write(`--${node.boundary}${CRLF}`);
				const childPath = path === null ? String(index + 1) : `${path}.${index + 1}`;
				writeNode(child, childPath);
				out.write(CRLF);
			});
			out.write(`--${node.boundary}--${CRLF}`);
		} else {
			out.write(base64Body(node.content));
		}

		const bodyEnd = out.length;

		node.headerStart = headerStart;
		node.headerEnd = headerEnd;
		node.bodyStart = bodyStart;
		node.bodyEnd = bodyEnd;

		if (path !== null) {
			parts.set(path, describePart(node, path, out));
		}
	}

	writeNode(rootNode, null);

	const raw = out.toBuffer();
	const headerBlock = raw.slice(0, rootNode.bodyStart);
	const bodyBlock = raw.slice(rootNode.bodyStart);

	// 顶层是单部分时，正文本身就是 part 1（RFC 3501 §6.4.5）
	if (rootNode.type === 'single') {
		parts.set('1', describePart(rootNode, '1', out));
	}

	return {
		raw,
		headers: messageHeaders,
		headerBlock,
		bodyBlock,
		parts,
		rootNode,
	};
}

function describePart(node, path, out) {
	return {
		path,
		type: node.type === 'multipart' ? 'multipart' : (node.contentType.split('/')[0] || '').toUpperCase(),
		subtype: node.type === 'multipart' ? node.subtype.toUpperCase() : (node.contentType.split('/')[1] || '').toUpperCase(),
		filename: node.filename || null,
		contentId: node.contentId || null,
		disposition: node.disposition || null,
		encoding: node.type === 'multipart' ? '7BIT' : 'BASE64',
		size: node.bodyEnd - node.bodyStart,
		lines: countLines(out.slice(node.bodyStart, node.bodyEnd)),
		bodyStart: node.bodyStart,
		bodyEnd: node.bodyEnd,
		headerStart: node.headerStart,
		headerEnd: node.headerEnd,
	};
}

function countLines(buf) {
	if (!buf || !buf.length) return 0;
	let count = 0;
	for (let i = 0; i < buf.length; i++) {
		if (buf[i] === 0x0a) count += 1;
	}
	if (buf[buf.length - 1] !== 0x0a) count += 1;
	return count;
}

/**
 * 生成 BODYSTRUCTURE（RFC 3501 §7.4.2）。
 * 依赖 parts 里记录好的字节数/行数，保证与实际报文一致。
 *
 * 结构：
 *   单部分  ("TEXT" "PLAIN" ("CHARSET" "UTF-8") NIL NIL "BASE64" 18 1)
 *   多部分  (子部分... "ALTERNATIVE" ("BOUNDARY" "xxx") NIL NIL NIL 长度)
 * 注意多部分里「子部分在前、子类型在后」，这是 RFC 规定的顺序。
 */
export function buildStructure(rootNode, parts) {
	function build(node, path) {
		const part = parts.get(path);

		if (node.type === 'multipart') {
			const children = node.children.map((child, index) => {
				const childPath = path === null ? String(index + 1) : `${path}.${index + 1}`;
				return build(child, childPath);
			});
			const params = new ImapParamList([['BOUNDARY', node.boundary || '']]);
			return [
				...children,
				node.subtype.toUpperCase(),
				params,
				null, // body-fld-id
				null, // body-fld-desc
				null, // body-fld-enc
				part ? part.size : 0,
			];
		}

		const params = node.filename
			? new ImapParamList([['NAME', node.filename]])
			: new ImapParamList([['CHARSET', 'UTF-8']]);

		const type = (node.contentType.split('/')[0] || '').toUpperCase();
		const subtype = (node.contentType.split('/')[1] || '').toUpperCase();

		const structure = [
			type,
			subtype,
			params,
			null, // body-fld-id
			null, // body-fld-desc
			'BASE64', // body-fld-enc
			part ? part.size : 0,
		];

		// body-fld-lines 只有文本类型才有
		if (type === 'TEXT') {
			structure.push(part ? part.lines : 0);
		}

		if (node.disposition) {
			structure.push([
				node.disposition.toUpperCase(),
				new ImapParamList(node.filename ? [['FILENAME', node.filename]] : []),
			]);
		}

		return structure;
	}

	return build(rootNode, null);
}

/**
 * 生成 ENVELOPE（RFC 3501 §7.4.2）。
 */
export function buildEnvelope({
	date = new Date(),
	subject = '',
	from = [],
	sender = null,
	replyTo = [],
	to = [],
	cc = [],
	bcc = [],
	inReplyTo = '',
	messageId = '',
}) {
	return [
		formatImapDate(date),
		subject ? encodeHeaderValue(subject) : null,
		from.map(addressStructure),
		// sender 一般是 NIL，只有和 from 不同时才有值
		sender ? sender.map(addressStructure) : null,
		replyTo.map(addressStructure),
		to.map(addressStructure),
		cc.map(addressStructure),
		bcc.map(addressStructure),
		inReplyTo || null,
		messageId || null,
	];
}

/**
 * 地址结构：(personal-name adl mailbox host)，四个字段都不能少，顺序不能错。
 */
function addressStructure(addr) {
	const address = addr?.address || '';
	const at = address.lastIndexOf('@');
	const mailbox = at > 0 ? address.slice(0, at) : address;
	const host = at > 0 ? address.slice(at + 1) : null;
	return [addr?.name || null, null, mailbox, host];
}
