// smail bridge 入口：同时起 IMAP、IMAPS、SMTP、SMTPS 四个服务。
//
//   IMAP  143  明文（可 STARTTLS）
//   IMAPS 993  隐式 TLS
//   SMTP  587  提交端口（STARTTLS）
//   SMTPS 465  隐式 TLS
//
// 数据全部走 smail 的 HTTP API，bridge 本身不存任何邮件数据。
import http from 'node:http';
import { config } from './config.js';
import { SmailClient } from './smail-client.js';
import { Mailbox } from './mailbox.js';
import { ImapServer } from './imap-server.js';
import { SmtpBridge } from './smtp-server.js';
import { createLogger } from './logger.js';

const log = createLogger('bridge');
log.setLevel(config.logLevel);

const client = new SmailClient(config.smail);
const mailbox = new Mailbox(client, { maxMessages: config.imap.maxMessages });

const imapServer = new ImapServer({ client, mailbox, config });
const smtpBridge = new SmtpBridge({ client, config });

imapServer.start();
smtpBridge.start();

// 健康检查：给 systemd / 负载均衡探活用
// 默认只绑回环地址，别把探活接口暴露到公网；需要外部探活时设 HEALTH_HOST=0.0.0.0
const healthPort = Number(process.env.HEALTH_PORT || 8788);
const healthHost = process.env.HEALTH_HOST || '127.0.0.1';
if (healthPort > 0) {
	const health = http.createServer((req, res) => {
		if (req.url === '/health') {
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify({ status: 'ok', time: new Date().toISOString() }));
			return;
		}
		res.writeHead(404);
		res.end('not found');
	});
	health.listen(healthPort, healthHost, () =>
		log.info(`健康检查监听 ${healthHost}:${healthPort}/health`),
	);
}

log.info(`smail bridge 已启动，smail 站点: ${config.smail.baseUrl}`);

function shutdown(signal) {
	log.info(`收到 ${signal}，正在退出…`);
	imapServer.stop();
	smtpBridge.stop();
	setTimeout(() => process.exit(0), 200).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', err => {
	log.error('未处理的 Promise 拒绝:', err);
});
