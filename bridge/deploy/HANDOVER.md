# juice 服务器交付说明（给运维）

> 2026-10-20 更新：证书已改为业务方自己的域名 `imap.sixzjd.sbs`，
> 由 `acme.sh` 以普通用户 `szn` 自助签发/续期，**不再使用 `ssh.redjuiceeee.com`，
> 也不再需要 root、不碰 nginx、不占用 80 端口**。
> 管理员侧已经完成的配置（ufw / systemd）保持不变。

## 1. 这是什么

smail 是自建邮件系统，主体在 Cloudflare（Worker + D1 + R2），网页端 `https://mail.sixzjd.sbs` 正常使用。
但 Cloudflare Worker 只能处理 HTTP，**无法监听 993 / 465 这类 TCP 端口**，所以 iPhone、Outlook 等
IMAP/SMTP 客户端需要一台机器做协议网关。本机跑的就是这个网关：

```
iPhone ── IMAP 993 / SMTP 465 (TLS) ──> 本机 bridge ── HTTPS ──> mail.sixzjd.sbs
```

**bridge 不存任何邮件**。正文、附件、已读状态都在 smail 的云端数据库里，
本进程只把 IMAP 命令翻译成 HTTPS 请求。内存占用约 35–100 MB。

## 2. 当前实际形态

| 项目 | 状态 |
| --- | --- |
| 代码 / 依赖 | `/home/szn/smail-bridge`（属主 `szn`），`npm install --omit=dev` 已装 |
| 配置 | `/home/szn/smail-bridge/.env`（600，`szn`） |
| 证书 | `/home/szn/smail-bridge/certs/`，由 `acme.sh` 签发，Let's Encrypt，ECC P-256 |
| 服务 | `/etc/systemd/system/smail-bridge.service`，`User=szn`，已 `enable --now` |
| 防火墙 | ufw 放行 `993/tcp`、`465/tcp`、`587/tcp`；`143`、`25` 不对公网开放 |
| 域名 | `imap.sixzjd.sbs`，Cloudflare **AAAA → 本机 IPv6**，灰云（仅 DNS） |
| Node | `/usr/bin/node`（v24） |

管理员侧需要的东西已经全部就位，后续业务方可以完全自助运维。

## 3. root 侧做过什么（已完成，供核对）

| 动作 | 位置 |
| --- | --- |
| 新增 systemd 单元 | `/etc/systemd/system/smail-bridge.service`（启用并启动） |
| ufw 放行 | 993 / 465 / 587 tcp |
| ~~certbot 证书~~ | 已由管理员删除；现在由 acme.sh 以 `szn` 身份管理，不涉及 root |
| 遗留可清理项 | `/etc/letsencrypt/renewal-hooks/deploy/smail-bridge.sh`（旧 certbot 钩子，已无用） |

清理遗留钩子：

```bash
rm -f /etc/letsencrypt/renewal-hooks/deploy/smail-bridge.sh
```

## 4. 服务单元

```ini
[Unit]
Description=smail bridge (IMAP/SMTP gateway)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=szn
Group=szn
WorkingDirectory=/home/szn/smail-bridge
EnvironmentFile=/home/szn/smail-bridge/.env
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=5

# 993 / 465 是特权端口，只给这一项能力，服务本身不以 root 运行
AmbientCapabilities=CAP_NET_BIND_SERVICE
CapabilityBoundingSet=CAP_NET_BIND_SERVICE

NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=read-only

StandardOutput=journal
StandardError=journal
SyslogIdentifier=smail-bridge

[Install]
WantedBy=multi-user.target
```

监听：`143`（明文，仅内网调试）、`993`（IMAPS）、`587`（STARTTLS）、`465`（SMTPS）、
`127.0.0.1:8788`（仅本机的 `/health`）。不监听 `25`。

## 5. 证书与续期（业务方自助，不需要 root）

- 工具：`acme.sh`（安装在 `/home/szn/.acme.sh`）
- 方式：**DNS-01**，用 Cloudflare API Token 写 TXT 记录，不占 80 端口、不改 nginx
- Token 文件：`/home/szn/.cf-dns-token`（600），仅该 zone `sixzjd.sbs` 的 DNS 编辑权限
- 续期：`acme.sh` 自带 cron（每天 0/6/12/18 点检查）
- 续期后重启：`--reloadcmd /home/szn/smail-bridge/deploy/reload-bridge.sh`
  （读 `systemctl show MainPID` 后 `kill -TERM`，systemd `Restart=always` 自动拉起）

手工检查：

```bash
openssl x509 -in /home/szn/smail-bridge/certs/fullchain.pem -noout -subject -dates
~/.acme.sh/acme.sh --list
```

## 6. IPv6 地址同步

家宽 IPv6 前缀会变，`imap.sixzjd.sbs` 的 AAAA 由 cron 每 5 分钟同步：

```bash
*/5 * * * * /home/szn/smail-bridge/deploy/sync-dns.sh >> /home/szn/smail-bridge/sync-dns.log 2>&1
```

## 7. 怎么确认它活着

```bash
systemctl status smail-bridge --no-pager
ss -lnt | grep -E ':993|:465|:587'
curl -s http://127.0.0.1:8788/health     # {"status":"ok",...}
journalctl -u smail-bridge -f            # 需要 adm / systemd-journal 组，或 sudo
```

外部验证（任意机器）：

```bash
openssl s_client -connect imap.sixzjd.sbs:993 -servername imap.sixzjd.sbs -brief
```

## 8. 回滚

```bash
systemctl disable --now smail-bridge
rm -f /etc/systemd/system/smail-bridge.service
systemctl daemon-reload

ufw delete allow 993/tcp
ufw delete allow 465/tcp
ufw delete allow 587/tcp

rm -f /etc/letsencrypt/renewal-hooks/deploy/smail-bridge.sh   # 旧钩子（若还在）
```

业务方自己清理：`~/.acme.sh/acme.sh --remove -d imap.sixzjd.sbs`、
删除 `/home/szn/.acme.sh`、`/home/szn/.cf-dns-token`、`/home/szn/smail-bridge/certs`。

## 9. 常见问题

**为什么不监听 25？**
家宽普遍封锁 25；客户端用 465（隐式 TLS）即可，开 25 只多一份明文风险。

**密码怎么处理？**
客户端提交的邮箱密码只在登录瞬间用于向 smail 换取 JWT，不落盘、不写日志。
bridge 没有数据库，进程重启后所有会话重新认证。

**这台机器只有 IPv6，会影响吗？**
只有 IPv6 网络的客户端能连（手机流量、多数家宽都支持）；纯 IPv4 的办公网/酒店 WiFi 连不上。

**为什么之前是 `ssh.redjuiceeee.com`？**
早期为了省一条 DNS 记录，借用了本机已有的 DDNS 记录签证书。现在已改为业务方自有域名
`imap.sixzjd.sbs`，与本机其他域名的证书体系完全解耦。
