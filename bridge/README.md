# smail bridge

让 **iOS 邮件 / Outlook / Foxmail / Thunderbird** 这类第三方客户端能用 `邮箱地址 + 密码`
直接登录 smail 邮箱的 IMAP / SMTP 网关。

```
┌──────────────┐   IMAP 993/143   ┌──────────────┐   HTTPS   ┌────────────────────┐
│ iOS 邮件     │ ───────────────► │              │ ────────► │ Cloudflare Worker  │
│ Outlook      │                  │ smail bridge │           │  (smail 主站 API)  │
│ Thunderbird  │ ◄─────────────── │  (本目录)     │ ◄──────── │  D1 / R2 / KV      │
└──────────────┘   SMTP 465/587   └──────────────┘           └────────────────────┘
```

Bridge 本身**不存任何邮件**：读信、标已读、加星标、删除、发信全部转成 smail 的 HTTP API 调用，
所以角色权限、发件数量限制、黑名单这些规则仍然由 smail 统一裁决。

## 为什么需要单独一个进程？

Cloudflare Workers 只处理 HTTP，**没法监听 143 / 993 / 465 / 587 这些 TCP 端口**，
而 IMAP / SMTP 都是长连接的裸 TCP 协议。所以需要一台能跑 TCP 服务的机器
（VPS、树莓派、家里的 NAS 都行）来把 TCP 协议翻译成 HTTPS 请求。

两种部署方式：

| 方式 | 适用场景 | 需要什么 |
| --- | --- | --- |
| [**A. 树莓派 + Tailscale**](#方案-a树莓派--tailscale不用公网-ip推荐自用) | 自用，没有公网 IP | 一台树莓派 + Tailscale，手机开着 VPN 即可 |
| [**B. VPS + 公网端口**](#方案-bvps--公网端口) | 要给任何人用、不装 VPN | 公网 IP、DNS A 记录（灰云）、开放 993/465 |

## 目录结构

| 文件 | 作用 |
| --- | --- |
| `src/index.js` | 入口：同时启动 IMAP / IMAPS / SMTP / SMTPS 与健康检查 |
| `src/imap-server.js` | 手写的 IMAP4rev1 服务端（CAPABILITY / LOGIN / SELECT / FETCH / SEARCH / STORE / COPY / APPEND / IDLE …） |
| `src/smtp-server.js` | SMTP 提交服务（基于 smtp-server），解析后用 `/api/email/send` 发出 |
| `src/mailbox.js` | smail 的「账号 / 邮件」到 IMAP「文件夹 / 邮件」的映射 |
| `src/mime.js` | 按 RFC822 现场拼出原始邮件、ENVELOPE、BODYSTRUCTURE |
| `src/smail-client.js` | smail HTTP API 客户端（登录、列邮件、改状态、发信、复制） |
| `src/config.js` | 环境变量 / `.env` 配置 |
| `deploy/install-pi.sh` | 树莓派 + Tailscale 一键安装脚本 |
| `deploy/setup-server.sh` | 公网服务器一键配置（证书 / ufw / systemd，需 root） |
| `deploy/sync-dns.sh` | 把当前公网 IPv6 同步到 Cloudflare 的 AAAA（放 cron 每 5 分钟） |
| `deploy/reload-bridge.sh` | 证书续期后重启 bridge（systemd 会自动拉起） |
| `deploy/HANDOVER.md` | 给运维审阅的交付说明（改什么、怎么回滚） |
| `deploy/smail-bridge.service` | systemd 服务单元 |
| `test/` | 本地联调脚本（IMAP 读、IMAP 写、SMTP 发信） |

文件夹映射关系：

| IMAP 文件夹 | smail 里的含义 |
| --- | --- |
| `INBOX` | 当前邮箱的收件箱 |
| `Sent` | 当前邮箱的已发送 |
| `Trash` | 当前邮箱的回收站 |
| `Starred` | 星标邮件 |
| `其它邮箱地址` | 同一个账号下其它自建邮箱的收件箱 |

## 本地跑起来

前置：Node.js ≥ 20，并且有一个能访问的 smail 站点（本地 `wrangler dev` 也行）。

```bash
cd bridge
npm install

# 配置（只填站点地址也能跑）
cp .env.example .env
vi .env       # 至少把 SMAIL_API_BASE 改成你的 smail 地址

npm start
```

启动后日志里会打印实际监听的端口。本地调试时建议改成高位端口，免得和系统服务打架：

```bash
SMAIL_API_BASE=http://127.0.0.1:8787 \
IMAP_PORT=1143 SMTP_PORT=1587 SMTP_LEGACY_PORT=12525 \
node src/index.js
```

跑一遍自检（读、写、发信三条链路，需要一个 smail 里真实存在的账号）：

```bash
npm install --include=dev            # imapflow / nodemailer 只在测试时用
export IMAP_TEST_PORT=1143 SMTP_TEST_PORT=1587
export IMAP_TEST_USER=you@example.com IMAP_TEST_PASS='你的密码'
npm test

# 或者单独跑某一条：
npm run test:imap     # 连接 / 文件夹 / 取信 / BODYSTRUCTURE
npm run test:write    # 星标 / 复制 / 删除 / APPEND
npm run test:smtp     # 发信后从 IMAP 里确认收到
```

> 这些脚本是用 imapflow / nodemailer 模拟真实客户端，比手敲协议可靠得多。
> 细节和调试技巧见 [`test/README.md`](test/README.md)。

## 方案 A：树莓派 + Tailscale（不用公网 IP，推荐自用）

家用宽带没有公网 IP、或者不想把 993/465 暴露到公网时，可以用 Tailscale：
设备之间组成加密的私有网络，手机只要开着 Tailscale 就能直接连到树莓派，
**不用端口映射、不用域名备案、不用改路由器**。`tailscale cert` 还能签发客户端信任的证书，
iOS / Outlook 都不会报证书错误。

> 代价：只有 tailnet 里的设备（你自己的手机、电脑）能连；别人用不了。

### 1. 树莓派上装好 Tailscale

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
tailscale status            # 记下这台机器的完整域名，例如 raspberrypi.tail1234.ts.net
```

然后在 Tailscale 控制台 → **DNS** 页面确认 **MagicDNS** 和 **HTTPS Certificates** 都是开启状态
（签发证书必须打开 HTTPS Certificates）。

### 2. 装 Node.js 20+

树莓派系统自带的 Node 往往是 18，版本不够：

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v      # 需要 v20 或更高
```

### 3. 一键安装

把整个仓库（或只把 `bridge/`）传到树莓派，然后：

```bash
cd ~/smail/bridge
sudo ./deploy/install-pi.sh raspberrypi.tail1234.ts.net https://mail.sixzjd.sbs
```

脚本会自动完成：装依赖 → 建 `smail` 用户 → 复制到 `/opt/smail-bridge` →
`tailscale cert` 签证书 → 写 `.env` → 装并启动 systemd 服务。

### 4. 手动安装（想看每一步做了什么）

```bash
sudo mkdir -p /opt/smail-bridge && sudo chown $USER /opt/smail-bridge
rsync -a ./src ./package.json ./package-lock.json /opt/smail-bridge/
cd /opt/smail-bridge && npm install --omit=dev

# 证书（90 天有效，记得续）
sudo tailscale cert \
  --cert-file /opt/smail-bridge/pi.crt \
  --key-file  /opt/smail-bridge/pi.key \
  raspberrypi.tail1234.ts.net
```

`.env`：

```ini
SMAIL_API_BASE=https://mail.sixzjd.sbs
IMAP_HOST=raspberrypi.tail1234.ts.net
SMTP_HOST=raspberrypi.tail1234.ts.net
TLS_CERT_PATH=/opt/smail-bridge/pi.crt
TLS_KEY_PATH=/opt/smail-bridge/pi.key
SMTP_LEGACY_PORT=0
LOG_LEVEL=info
```

> `IMAP_HOST` 和 `SMTP_HOST` 可以写成同一个域名：协议不同、端口不同，互不影响。
> Tailscale 方案下建议 `SMTP_LEGACY_PORT=0`，内网用不到 25 兼容口，还省得抢端口。

systemd：

```bash
sudo cp deploy/smail-bridge.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now smail-bridge
journalctl -u smail-bridge -f
```

### 5. 手机端

1. App Store 装 **Tailscale**，登录同一个账号，打开 VPN；
2. 「设置 → 邮件 → 账户 → 添加账户 → 其他 → 添加邮件账户」；
3. 收件服务器 `raspberrypi.tail1234.ts.net` / 993 / **SSL 打开**；
   发件服务器同一个域名 / 465 / **SSL 打开**；
4. 用户名填邮箱地址，密码填 smail 网页密码，点「登录」。

### 6. 证书续期

`tailscale cert` 签的证书 90 天过期，加个定时任务：

```bash
sudo crontab -e
# 每月 1 号凌晨 3 点续一次，然后重启服务
0 3 1 * * tailscale cert --cert-file /opt/smail-bridge/pi.crt --key-file /opt/smail-bridge/pi.key raspberrypi.tail1234.ts.net && systemctl restart smail-bridge
```

### 7. 树莓派带得动吗？

带得动。bridge 常驻内存大约 60–100 MB，单用户几乎没有 CPU 占用（收信时才请求一次 API）：

| 机型 | 是否够用 | 说明 |
| --- | --- | --- |
| Pi 3B / 3B+（1GB） | 够用 | 和别的服务一起跑时注意内存 |
| Pi 4 / 5（2GB+） | 很宽裕 | 可以顺便跑别的自建服务 |
| Zero 2W（512MB） | 勉强 | 只能单跑 bridge，别再加服务 |

装完可以用 `systemctl status smail-bridge` 看内存占用，`free -h` 看剩余内存。

两个小建议：

* 长期跑别用 SD 卡（容易坏），用 USB SSD 启动；
* 树莓派断电/重启后 Tailscale 自动重连，但手机端如果关了 Tailscale VPN，邮件就会连接失败——这是这种方案的固有限制。

## 方案 B：VPS + 公网端口

> 如果这台服务器不是你自己的（公司/朋友托管），可以直接把
> [`deploy/HANDOVER.md`](deploy/HANDOVER.md) 交给运维审阅：里面列了会新增/修改哪些文件、
> 完整的手工步骤、服务单元内容、验证方式和回滚命令。
> 应用侧（代码、依赖、`.env`）用普通用户装好之后，root 只需要跑一次
> `sudo ./deploy/setup-server.sh <邮件域名>`。

### 1. 准备域名解析

bridge 必须走 **DNS 解析（灰云，不能开 Cloudflare 代理）**，因为 Cloudflare 的橙云只代理 HTTP/HTTPS，
不会转发 IMAP/SMTP 的 TCP 流量。

| 类型 | 名称 | 值 | 代理状态 |
| --- | --- | --- | --- |
| A | `imap` | 你的 VPS 公网 IPv4 | **仅 DNS**（灰云） |
| AAAA | `imap` | 你的 VPS 公网 IPv6（如果有） | **仅 DNS**（灰云） |

> **一条记录就够**：IMAP 和 SMTP 填同一个主机名（例子里的 `imap.你的域名`），
> 不需要分别建 `imap` / `smtp` 两条。
>
> 只有 IPv6 的机器必须建 **AAAA**，纯 IPv4 的客户端连不上——这是地址族的限制，不是配置问题。
> 家宽的 IPv6 前缀会变，把 [`deploy/sync-dns.sh`](deploy/sync-dns.sh) 放进 cron 定时回写即可。

### 2. 开端口

| 端口 | 用途 | 是否必须 |
| --- | --- | --- |
| 993 | IMAPS（隐式 TLS） | **必须**，iOS/Outlook 首选 |
| 465 | SMTPS（隐式 TLS） | **必须**，发信首选 |
| 143 | IMAP 明文 + STARTTLS | 兼容老客户端（iOS 默认 143） |
| 587 | SMTP 提交 + STARTTLS | 兼容老客户端 |
| 25 | SMTP 明文 | 兼容 iOS 默认值；很多云厂商封 25，封了也不影响 |

```bash
# ufw 示例
sudo ufw allow 993/tcp
sudo ufw allow 465/tcp
sudo ufw allow 143/tcp
sudo ufw allow 587/tcp
sudo ufw allow 25/tcp    # 可省略
```

> 阿里云 / 腾讯云 / AWS / GCP 除了系统防火墙，还要在**安全组**里放行同样的端口。

### 3. 拉代码、装依赖

```bash
sudo mkdir -p /opt/smail-bridge && sudo chown $USER /opt/smail-bridge
# 只把 bridge/ 这个目录传上去（推荐 rsync / git）
rsync -av ./bridge/ user@vps:/opt/smail-bridge/

cd /opt/smail-bridge
npm install --omit=dev
```

### 4. 申请证书

客户端对证书校验很严，**不要用自签证书**。两种方式，推荐第一种：

**方式 A：acme.sh + DNS-01（不需要 root，不占端口，不碰服务器上已有的 nginx）**

```bash
# 装到当前用户家目录即可，普通用户权限够
curl https://get.acme.sh | sh -s email=you@example.com

# Cloudflare 面板：My Profile -> API Tokens -> Edit zone DNS，只授权这个 zone
export CF_Token=你的token
export CF_Zone_ID=你的zone_id

~/.acme.sh/acme.sh --set-default-ca --server letsencrypt
~/.acme.sh/acme.sh --issue --dns dns_cf -d imap.example.com --keylength ec-256

# 装到应用目录；续期后由 reload 脚本重启（见 deploy/reload-bridge.sh）
~/.acme.sh/acme.sh --install-cert -d imap.example.com --ecc \
  --key-file       ~/smail-bridge/certs/privkey.pem \
  --fullchain-file ~/smail-bridge/certs/fullchain.pem \
  --reloadcmd      ~/smail-bridge/deploy/reload-bridge.sh
```

**方式 B：certbot + HTTP-01（需要 root，临时占用 80 端口）**

```bash
sudo apt install -y certbot
sudo certbot certonly --standalone -d imap.example.com
sudo certbot renew --deploy-hook "systemctl restart smail-bridge"
```

> 如果服务器只有公网 IPv6、地址会变，把 `deploy/sync-dns.sh` 放进 cron 每 5 分钟同步一次
> AAAA 记录（`*/5 * * * * /opt/smail-bridge/deploy/sync-dns.sh >> /opt/smail-bridge/sync-dns.log 2>&1`），
> 否则地址一变客户端就连不上。

### 5. 配置 .env

```bash
cd /opt/smail-bridge
cp .env.example .env
vi .env
```

最少要填这几项：

```ini
SMAIL_API_BASE=https://mail.example.com
IMAP_HOST=imap.example.com
SMTP_HOST=smtp.example.com
# 方式 A（acme.sh）装到自己目录，用这个：
TLS_CERT_PATH=/opt/smail-bridge/certs/fullchain.pem
TLS_KEY_PATH=/opt/smail-bridge/certs/privkey.pem
# 方式 B（certbot）则用这个：
#TLS_CERT_PATH=/etc/letsencrypt/live/imap.example.com/fullchain.pem
#TLS_KEY_PATH=/etc/letsencrypt/live/imap.example.com/privkey.pem
LOG_LEVEL=info
```

> 读证书需要权限，让运行用户能读 `/etc/letsencrypt/live/...`（`live/` 下是软链接，
> 指向 `/etc/letsencrypt/archive/`，两个目录都要可读）。

### 6. 配 systemd

`/etc/systemd/system/smail-bridge.service`：

```ini
[Unit]
Description=smail bridge (IMAP/SMTP gateway)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=smail
WorkingDirectory=/opt/smail-bridge
EnvironmentFile=/opt/smail-bridge/.env
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=3

# 25 端口需要特权，普通用户启动时用这条给它单独授权
AmbientCapabilities=CAP_NET_BIND_SERVICE
CapabilityBoundingSet=CAP_NET_BIND_SERVICE

# 加固
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=/opt/smail-bridge

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now smail-bridge
sudo systemctl status smail-bridge
journalctl -u smail-bridge -f
```

健康检查：`curl http://127.0.0.1:8788/health`。

### 7. 告诉 smail 主机名和端口

网页上「客户端登录」页显示的服务器地址来自 Worker 的环境变量，改完记得重新部署 Worker：

```bash
# wrangler.toml 的 [vars] 里，或者在命令行写 secret
npx wrangler secret put imap_host   # imap.example.com
npx wrangler secret put smtp_host   # smtp.example.com
```

也可以一次性写 JSON：

```bash
npx wrangler secret put client_config
# 然后粘贴：
# {"imap":{"host":"imap.example.com","port":143,"tlsPort":993},"smtp":{"host":"smtp.example.com","port":587,"tlsPort":465}}
```

配置好之后（可选，效果更好）：

* Thunderbird / 雷鸟会自动读取 `https://mail.example.com/.well-known/autoconfig/mail/config.v1.xml`
* Outlook 会自动读取 `https://mail.example.com/Autodiscover/Autodiscover.xml`
* iOS 在填写邮箱后也会先尝试自动发现，失败才进手动设置

## 客户端怎么填

| 项目 | 收件（IMAP） | 发件（SMTP） |
| --- | --- | --- |
| 服务器 | `imap.example.com` | `smtp.example.com` |
| 端口 / 加密 | 993 + SSL（老客户端 143 + STARTTLS） | 465 + SSL（老客户端 587 / 25 + STARTTLS） |
| 用户名 | 完整邮箱地址 `you@example.com` | 同左 |
| 密码 | smail 网页端登录密码 | 同左 |

## 常见问题

**只有公网 IPv6、没有公网 IPv4 怎么办？**

能用，但有前提：客户端的网络必须支持 IPv6。手机 4G/5G、以及开了 IPv6 的宽带都没问题；
纯 IPv4 的办公网、酒店 WiFi 会连不上（域名只有 AAAA 记录时，这些网络连解析都拿不到地址）。

想让「任何网络」都能连，只有两条路：

1. 向宽带运营商申请公网 IPv4（联通/电信大多免费，打客服说「要公网 IP，做端口映射」）；
   拿到后给同一个域名再加一条 **A 记录**，客户端设置完全不用改；
2. 换一台双栈 VPS 跑 bridge（见方案 B），或者在 VPS 上做 TCP 转发（frp / socat）到内网机器。

检查自己是不是只有 IPv6：

```bash
dig +short A imap.example.com      # 空 = 没有 IPv4
dig +short AAAA imap.example.com   # 有值 = 走 IPv6
```

**连不上 / 一直转圈**

1. `nc -vz imap.example.com 993` 通不通；
2. 云厂商**安全组**放行没有（很多人只改了 ufw）；
3. DNS 是不是还在橙云代理状态——橙云下 993 端口是不会通的；
4. `journalctl -u smail-bridge -f` 看有没连进来的日志。

**提示「用户名或密码不正确」**

* 密码就是 smail 网页端登录密码，不是邮箱独立密码；
* 用户被封禁、邮箱被禁用时也会报认证失败，先回网页端确认能登录。

**提示「无法验证账户信息」（iOS）**

八成是端口没改：iOS 手动设置默认给的是 `143` 收件、`25` 发件且 SSL 关闭，
必须改成 `993` / `465` 并把 SSL 打开。

**25 端口起不来**

报 `EACCES` 就是没有绑定特权端口的权限：systemd 里加 `AmbientCapabilities=CAP_NET_BIND_SERVICE`（见上），
或者直接用 `SMTP_LEGACY_PORT=0` 关掉它——现代客户端用 465/587 就够。

**发出去的信收件人没收到**

bridge 只是把信交给 smail 的发信服务，实际投递仍走 smail 原来的通道（Resend / Cloudflare / 自建 SMTP），
去 smail 后台的「已发送」里看这封信的状态，或者看 Worker 日志。

## 安全建议

* 公网部署时把 `IMAP_ALLOW_PLAIN` / `SMTP_DISABLE_SECURE` 保持关闭，只留 993 / 465；
* 用普通用户（`User=smail`）跑，不要用 root；
* 定期 `certbot renew`，证书过期后客户端会直接拒绝连接；
* 密码就是网页端密码，建议引导用户设置足够复杂的密码；
* 想限制爆破可以给 993/465 挂 fail2ban，日志里认证失败会打印 `SMTP 认证失败 / 登录失败`。
