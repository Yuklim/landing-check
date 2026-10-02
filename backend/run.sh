#!/bin/sh
# 本机启动后端：优先读 backend/.env，没有就从 ~/.claude-deepseek.env 取 DeepSeek 密钥
cd "$(dirname "$0")"
if [ -f .env ]; then set -a; . ./.env; set +a; fi
if [ -z "$DEEPSEEK_API_KEY" ] && [ -f "$HOME/.claude-deepseek.env" ]; then
  set -a; . "$HOME/.claude-deepseek.env"; set +a; export DEEPSEEK_API_KEY="$ANTHROPIC_AUTH_TOKEN"
fi
[ -n "$DEEPSEEK_API_KEY" ] || echo "警告：没有 DEEPSEEK_API_KEY，识别会走规则兜底"
echo "测试台  http://127.0.0.1:${PORT:-8000}/test"
echo "接口文档 http://127.0.0.1:${PORT:-8000}/docs"
exec python3 -m uvicorn app:app --port "${PORT:-8000}" --reload
