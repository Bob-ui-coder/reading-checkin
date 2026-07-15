#!/bin/bash
# 读书打卡服务器启动脚本
# 使用方法: bash /Users/zhanghaodong/WorkBuddy/2026-07-15-20-08-35/server/start.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
NODE="/Users/zhanghaodong/.workbuddy/binaries/node/versions/22.22.2/bin/node"
CLOUDFLARED="/opt/homebrew/opt/cloudflared/bin/cloudflared"

echo "📖 启动读书打卡服务器..."

# 启动 Node.js 服务器
cd "$SCRIPT_DIR"
$NODE server.js &
SERVER_PID=$!
sleep 2

# 检查服务器
if curl -s http://localhost:3000/api/records > /dev/null 2>&1; then
  echo "✅ 服务器已启动 (PID: $SERVER_PID)"
else
  echo "❌ 服务器启动失败"
  exit 1
fi

# 启动 Cloudflare Tunnel
echo "🌐 正在建立公网隧道..."
$CLOUDFLARED tunnel --url http://localhost:3000 2>&1 | while read line; do
  echo "$line"
  if echo "$line" | grep -q "trycloudflare.com"; then
    URL=$(echo "$line" | grep -o 'https://[^ ]*trycloudflare\.com')
    echo ""
    echo "============================================"
    echo "  🔗 分享链接: $URL"
    echo "  把这个链接发给所有小伙伴！"
    echo "  按 Ctrl+C 停止服务"
    echo "============================================"
  fi
done

# Cleanup on exit
kill $SERVER_PID 2>/dev/null
echo "👋 服务器已停止"
