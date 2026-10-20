#!/usr/bin/env bash
# 把本机当前的公网 IPv6 同步到 Cloudflare 的 imap.sixzjd.sbs AAAA 记录。
# 家宽前缀变化后，最多 5 分钟自动跟上；不需要 root。
set -euo pipefail

ZONE_ID=74978b97d92dbc515f5f0c637148cfec
RECORD_ID=6df09a2ec3d7a54f2ccc1e5afd3e7d84
TOKEN_FILE=/home/szn/.cf-dns-token
API=https://api.cloudflare.com/client/v4

TOKEN=$(cat "$TOKEN_FILE")
IP=$(ip -6 addr show scope global | awk '/inet6/ {print $2}' | cut -d/ -f1 | grep -v '^fe80' | head -1)
[[ -n "$IP" ]] || { echo "[$(date +%F\ %T)] 拿不到公网 IPv6，跳过"; exit 0; }

CUR=$(curl -s -H "Authorization: Bearer $TOKEN" \
	"$API/zones/$ZONE_ID/dns_records/$RECORD_ID" |
	python3 -c 'import sys,json; d=json.load(sys.stdin); print(d["result"]["content"] if d.get("success") else "")')

if [[ "$CUR" == "$IP" ]]; then
	exit 0
fi

echo "[$(date +%F\ %T)] 地址变化 $CUR -> $IP，更新中"
curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
	--data "{\"content\":\"$IP\",\"proxied\":false,\"ttl\":1}" \
	"$API/zones/$ZONE_ID/dns_records/$RECORD_ID" |
	python3 -c 'import sys,json; d=json.load(sys.stdin); print("  已更新" if d.get("success") else d.get("errors"))'
