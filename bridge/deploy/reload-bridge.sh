#!/usr/bin/env bash
# 证书续期后重启 bridge：杀掉主进程，systemd(Restart=always) 会自动拉起并加载新证书。
# 不需要 root —— systemctl show 普通用户可读。
set -euo pipefail

pid=$(systemctl show -p MainPID --value smail-bridge 2>/dev/null || echo "")
if [[ "$pid" =~ ^[1-9][0-9]*$ ]]; then
	kill -TERM "$pid"
	echo "[$(date +%F\ %T)] 已重启 bridge (PID $pid)"
else
	echo "[$(date +%F\ %T)] 没找到 bridge 进程，跳过"
fi
