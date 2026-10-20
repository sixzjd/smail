# 本地联调脚本

这些脚本用**真实的邮件客户端库**去打 bridge，验证协议层是否合规。
它们不是单元测试，需要先在本机跑起一个 bridge 实例。

## 跑之前

```bash
# 1. 起一个连本地 Worker 的 bridge（不要占用正式端口）
cd bridge
SMAIL_API_BASE=http://127.0.0.1:8787 \
IMAP_HOST=127.0.0.1 IMAP_PORT=1143 IMAP_TLS_PORT=0 IMAP_ALLOW_PLAIN=true \
SMTP_HOST=127.0.0.1 SMTP_PORT=1587 SMTP_TLS_PORT=0 SMTP_LEGACY_PORT=0 SMTP_ALLOW_PLAIN=true \
SMTP_DOMAIN=localhost SMTP_MAX_SIZE=26214400 \
node src/index.js
```

```bash
# 2. 另开一个终端跑（需要先在 smail 里有一个真实账号）
cd bridge
npm install                 # 只装 devDependencies 里的 imapflow / nodemailer
IMAP_TEST_USER=you@example.com IMAP_TEST_PASS='密码' SMTP_TEST_USER=you@example.com SMTP_TEST_PASS='密码' npm test
```

## 三个脚本

| 脚本 | 验证什么 |
| --- | --- |
| `imap-test.mjs` | 登录 → LIST → SELECT → FETCH → SEARCH → 读附件，覆盖 iOS/Outlook 登录后会发的命令 |
| `imap-write-test.mjs` | 写操作：标记已读、加星标、移到回收站、删除并清空 |
| `smtp-test.mjs` | 通过 SMTP 提交一封信，再回 IMAP 确认收到 |

## debug/

`debug/` 里是开发期临时写的排查脚本，保留下来备查，**不需要执行**：

| 脚本 | 用途 |
| --- | --- |
| `proxy.mjs` | TCP 透传代理，把 imapflow 与 bridge 之间的原始报文打印出来 |
| `imap-dbg.mjs` | 单个命令的最小复现模板 |
| `inbox-count.mjs` | 对比 IMAP 的 EXISTS 数量与 API 实际返回数量 |
| `mailbox-test.mjs` | 绕过协议层，直接跑 mailbox 的取信流程 |
| `search-debug.mjs` | SUBJECT 搜索的排查 |

排查协议问题时最顺手的是 `proxy.mjs`：

```bash
PROXY_PORT=1144 TARGET_PORT=1143 node test/debug/proxy.mjs
# 然后把客户端连到 127.0.0.1:1144，终端里会打印双向明文
```
