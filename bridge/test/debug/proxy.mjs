// 调试用：TCP 透传代理，把 imapflow 与 bridge 之间的报文打印出来
// 用法：node test/proxy.mjs  然后把客户端连到 1144
import net from 'node:net';

const listen = Number(process.env.PROXY_PORT || 1144);
const target = { host: '127.0.0.1', port: Number(process.env.TARGET_PORT || 1143) };

net.createServer(client => {
	const server = net.connect(target.port, target.host);
	client.pipe(server);
	server.pipe(client);
	client.on('data', d => console.log('C>>', JSON.stringify(d.toString())));
	server.on('data', d => console.log('S<<', JSON.stringify(d.toString())));
	client.on('error', e => console.log('client err', e.message));
	server.on('error', e => console.log('server err', e.message));
}).listen(listen, () => console.log(`proxy ${listen} -> ${target.port}`));
