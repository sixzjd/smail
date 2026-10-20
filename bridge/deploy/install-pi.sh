#!/usr/bin/env bash
# 树莓派 / 小主机一键装 smail bridge（配合 Tailscale）。
#
#   sudo ./deploy/install-pi.sh raspberrypi.tailxxxx.ts.net https://mail.sixzjd.sbs
#
# 参数 1：这台机器在 Tailscale 里的完整域名（tailscale status 里能看到）
# 参数 2：你的 smail 站点地址
#
# 脚本做的事：装 Node 20 → 建 smail 用户 → 复制到 /opt/smail-bridge →
#            生成 TLS 证书 → 写 .env → 装 systemd 服务并启动。
set -euo pipefail

TAIL_NAME="${1:-}"
SMAIL_URL="${2:-}"
APP_DIR=/opt/smail-bridge
SERVICE=smail-bridge

if [[ -z "$TAIL_NAME" || -z "$SMAIL_URL" ]]; then
	echo "用法: sudo $0 <tailscale完整域名> <smail站点地址>" >&2
	echo "例如: sudo $0 raspberrypi.tail1234.ts.net https://mail.sixzjd.sbs" >&2
	exit 1
fi

if [[ $EUID -ne 0 ]]; then
	echo "请用 sudo 运行" >&2
	exit 1
fi

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> 1/6 检查 Node.js"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -p 'process.versions.node.split(".")[0]')" -lt 20 ]]; then
	echo "    安装 Node.js 20 (NodeSource)…"
	curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
	apt-get install -y nodejs
fi
echo "    Node $(node -v)"

echo "==> 2/6 准备用户和目录"
id -u smail >/dev/null 2>&1 || useradd -r -s /usr/sbin/nologin -d "$APP_DIR" smail
mkdir -p "$APP_DIR"

echo "==> 3/6 复制代码"
rsync -a --delete \
	--exclude node_modules \
	--exclude .env \
	--exclude '*.crt' --exclude '*.key' \
	"$SRC_DIR"/src "$SRC_DIR"/package.json "$SRC_DIR"/package-lock.json "$APP_DIR"/

echo "==> 4/6 安装依赖"
cd "$APP_DIR"
npm install --omit=dev --no-audit --no-fund

echo "==> 5/6 申请 Tailscale 证书"
if [[ ! -f "$APP_DIR/$TAIL_NAME.crt" ]]; then
	tailscale cert --cert-file "$APP_DIR/$TAIL_NAME.crt" --key-file "$APP_DIR/$TAIL_NAME.key" "$TAIL_NAME"
fi
chown -R smail:smail "$APP_DIR"
chmod 640 "$APP_DIR/$TAIL_NAME.key"

echo "==> 6/6 写配置并启动服务"
cat >"$APP_DIR/.env" <<EOF
SMAIL_API_BASE=$SMAIL_URL
IMAP_HOST=$TAIL_NAME
SMTP_HOST=$TAIL_NAME
TLS_CERT_PATH=$APP_DIR/$TAIL_NAME.crt
TLS_KEY_PATH=$APP_DIR/$TAIL_NAME.key
# Tailscale 内网不需要 25 兼容口，关掉省得抢端口
SMTP_LEGACY_PORT=0
LOG_LEVEL=info
EOF
chown smail:smail "$APP_DIR/.env"
chmod 600 "$APP_DIR/.env"

install -m 644 "$SRC_DIR/deploy/$SERVICE.service" "/etc/systemd/system/$SERVICE.service"
systemctl daemon-reload
systemctl enable --now "$SERVICE"
sleep 2
systemctl --no-pager --lines=15 status "$SERVICE" || true

cat <<EOF

完成 ✅  客户端这样填：

  收件服务器  $TAIL_NAME   端口 993  SSL 开
  发件服务器  $TAIL_NAME   端口 465  SSL 开
  用户名      你的邮箱地址
  密码        smail 网页登录密码

手机需要装 Tailscale 并登录同一账号（VPN 打开）才能连上这台机器。

别忘了把 smail 的 Worker 变量也改成这个域名，然后重新部署：
  cd <smail仓库> && npx wrangler deploy
  （在 wrangler.toml 里设置 imap_host / smtp_host = "$TAIL_NAME"）
EOF
