// bridge 配置：全部来自环境变量，方便用 systemd EnvironmentFile 管理。
// 同时也支持项目根目录下的 .env（真实环境变量优先，不会被 .env 覆盖）。
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 极简 .env 读取：KEY=VALUE、支持 # 注释与成对引号，不覆盖已存在的环境变量。
 * 不想引入 dotenv 依赖，这点逻辑够用了。
 */
function loadEnvFile() {
	const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
	const file = process.env.ENV_FILE || resolve(root, '.env');
	if (!existsSync(file)) return;

	let text = '';
	try {
		text = readFileSync(file, 'utf8');
	} catch {
		return;
	}

	for (const rawLine of text.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#')) continue;
		const eq = line.indexOf('=');
		if (eq === -1) continue;
		const key = line.slice(0, eq).trim();
		if (!key || key in process.env) continue;
		let value = line.slice(eq + 1).trim();
		if (value.length >= 2) {
			const first = value[0];
			const last = value[value.length - 1];
			if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
				value = value.slice(1, -1);
			}
		}
		process.env[key] = value;
	}
}

loadEnvFile();

const env = process.env;

function str(value, fallback = '') {
	if (value === undefined || value === null) return fallback;
	const trimmed = String(value).trim();
	return trimmed === '' ? fallback : trimmed;
}

function num(value, fallback) {
	const n = Number(value);
	return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** 允许写 0 表示「关掉这个监听」（TLS 端口、25 兼容口用得到）。 */
function numAllowZero(value, fallback) {
	if (value === undefined || value === null || String(value).trim() === '') return fallback;
	const n = Number(value);
	return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function bool(value, fallback = false) {
	if (value === undefined || value === null || value === '') return fallback;
	return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

/**
 * 读取证书。优先使用路径，其次直接内联 PEM（方便 docker secrets）。
 */
function readMaybeFile(pathOrPem) {
	if (!pathOrPem) return null;
	if (pathOrPem.includes('-----BEGIN')) return pathOrPem;
	if (existsSync(pathOrPem)) return readFileSync(pathOrPem, 'utf8');
	return null;
}

const tlsCert = readMaybeFile(env.TLS_CERT_PATH || env.TLS_CERT);
const tlsKey = readMaybeFile(env.TLS_KEY_PATH || env.TLS_KEY);

export const config = {
	smail: {
		// smail 站点地址，例如 https://mail.sixzjd.sbs
		baseUrl: str(env.SMAIL_API_BASE, 'https://mail.sixzjd.sbs').replace(/\/+$/, ''),
		timeout: num(env.SMAIL_API_TIMEOUT, 30000),
		// 预热连接复用，减少每次 IMAP FETCH 的握手开销
		keepAlive: bool(env.SMAIL_KEEP_ALIVE, true),
	},
	imap: {
		// 对外公布的 IMAP 主机名（写进 autoconfig / 客户端配置）
		host: str(env.IMAP_HOST, 'localhost'),
		port: num(env.IMAP_PORT, 143),
		tlsPort: numAllowZero(env.IMAP_TLS_PORT, 993),
		// 允许明文 143（局域网调试用）；公网建议只开 993
		allowPlain: bool(env.IMAP_ALLOW_PLAIN, true),
		// 单个文件夹最多同步多少封邮件
		maxMessages: num(env.IMAP_MAX_MESSAGES, 300),
		// 空闲连接超时（毫秒）
		idleTimeout: num(env.IMAP_IDLE_TIMEOUT, 30 * 60 * 1000),
	},
	smtp: {
		host: str(env.SMTP_HOST, 'localhost'),
		port: num(env.SMTP_PORT, 587),
		tlsPort: numAllowZero(env.SMTP_TLS_PORT, 465),
		// 老客户端（iOS 手动设置默认就是 25）会先连 25；填 0 表示不监听。
		legacyPort: numAllowZero(env.SMTP_LEGACY_PORT, 25),
		allowPlain: bool(env.SMTP_ALLOW_PLAIN, true),
		// 允许「明文连接后再 STARTTLS」；关闭后只允许隐式 TLS(465)
		allowStartTls: bool(env.SMTP_ALLOW_STARTTLS, true),
		// 允许不加密直接投递（仅内网调试）
		disableSecure: bool(env.SMTP_DISABLE_SECURE, false),
		maxMessageSize: num(env.SMTP_MAX_MESSAGE_SIZE, 25 * 1024 * 1024),
	},
	tls: {
		cert: tlsCert,
		key: tlsKey,
		// 证书签发给哪个域名，用于自检
		domain: str(env.TLS_DOMAIN, ''),
	},
	logLevel: str(env.LOG_LEVEL, 'info'),
};

export default config;
