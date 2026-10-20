#!/usr/bin/env bash
# 在服务器上一次性完成 root 侧的配置：证书 → 防火墙 → systemd 服务。
# 应用本身（代码、依赖、.env）应该已经用普通用户装好了，见 README。
#
#   sudo ./deploy/setup-server.sh ssh.redjuiceeee.com
#   sudo ./deploy/setup-server.sh mail.example.com /home/szn/smail-bridge szn
#
# 做完之后 setcap/systemd 会让普通用户也能监听 993/465 这类特权端口。
set -euo pipefail

HOST_NAME="${1:?用法: sudo $0 <邮件域名> [应用目录] [运行用户]}"
APP_DIR="${2:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
RUN_USER="${3:-$(stat -c %U "$APP_DIR")}"
SERVICE=smail-bridge
CERT_DIR="/etc/letsencrypt/live/$HOST_NAME"
LOCAL_CERT_DIR="$APP_DIR/certs"

if [[ $EUID -ne 0 ]]; then
	echo "请用 sudo 运行" >&2
	exit 1
fi
if [[ ! -f "$APP_DIR/src/index.js" ]]; then
	echo "找不到 $APP_DIR/src/index.js，先在 $APP_DIR 里装好依赖" >&2
	exit 1
fi

# root 的 PATH 里可能没有 nvm 装的 node，这里显式找一下
NODE_BIN="$(command -v node || true)"
for candidate in /usr/bin/node /usr/local/bin/node; do
	[[ -n "$NODE_BIN" ]] && break
	[[ -x "$candidate" ]] && NODE_BIN="$candidate"
done
if [[ -z "$NODE_BIN" ]]; then
	echo "找不到 node，先装 Node.js 20+" >&2
	exit 1
fi

echo "==> 域名: $HOST_NAME"
echo "==> 目录: $APP_DIR (用户 $RUN_USER)"

# ---------------------------------------------------------------- 1. 证书
echo "==> 1/4 准备 TLS 证书"
if [[ -f "$CERT_DIR/fullchain.pem" ]]; then
	echo "    已有证书，跳过签发"
else
	# nginx 占着 80，用 nginx 插件做 HTTP-01 校验
	certbot certonly --nginx -d "$HOST_NAME" \
		--non-interactive --agree-tos --register-unsafely-without-email \
		--keep-until-expiring
fi

# certbot 的私钥只有 root 能读，复制一份给服务用户，并挂一个续期钩子
echo "==> 2/4 复制证书并安装续期钩子"
install -d -o "$RUN_USER" -g "$RUN_USER" -m 750 "$LOCAL_CERT_DIR"
install -o "$RUN_USER" -g "$RUN_USER" -m 640 "$CERT_DIR/fullchain.pem" "$LOCAL_CERT_DIR/fullchain.pem"
install -o "$RUN_USER" -g "$RUN_USER" -m 600 "$CERT_DIR/privkey.pem" "$LOCAL_CERT_DIR/privkey.pem"

mkdir -p /etc/letsencrypt/renewal-hooks/deploy
cat >"/etc/letsencrypt/renewal-hooks/deploy/$SERVICE.sh" <<EOF
#!/usr/bin/env bash
# 由 setup-server.sh 生成：续期成功后同步证书并重启
set -e
install -o $RUN_USER -g $RUN_USER -m 640 $CERT_DIR/fullchain.pem $LOCAL_CERT_DIR/fullchain.pem
install -o $RUN_USER -g $RUN_USER -m 600 $CERT_DIR/privkey.pem  $LOCAL_CERT_DIR/privkey.pem
systemctl restart $SERVICE
EOF
chmod 755 "/etc/letsencrypt/renewal-hooks/deploy/$SERVICE.sh"

# ---------------------------------------------------------------- 2. 防火墙
echo "==> 3/4 放行 993 / 465 / 587（不开放 143、25 明文端口）"
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
	for p in 993 465 587; do ufw allow "$p/tcp" >/dev/null && echo "    ufw allow $p/tcp"; done
else
	echo "    ufw 未启用，跳过（云服务器记得配安全组）"
fi

# ---------------------------------------------------------------- 3. systemd
echo "==> 4/4 安装 systemd 服务"
cat >"/etc/systemd/system/$SERVICE.service" <<EOF
[Unit]
Description=smail bridge (IMAP/SMTP gateway)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$RUN_USER
Group=$RUN_USER
WorkingDirectory=$APP_DIR
EnvironmentFile=$APP_DIR/.env
ExecStart=$NODE_BIN src/index.js
Restart=always
RestartSec=5

# 993 / 465 是特权端口，给普通用户这个能力就够了，不用整个服务跑 root
AmbientCapabilities=CAP_NET_BIND_SERVICE
CapabilityBoundingSet=CAP_NET_BIND_SERVICE

NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=read-only

StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now "$SERVICE"
sleep 2
systemctl --no-pager --lines=15 status "$SERVICE" || true

echo
echo "完成。检查一下端口："
ss -lntp | grep -E ":993|:465|:587" || echo "（没看到 993/465，看看上面的报错）"
echo "健康检查：curl -s http://127.0.0.1:8788/health"
