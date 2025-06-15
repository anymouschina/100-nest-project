#!/bin/bash

echo "🚀 微信聊天记录AI分析可视化平台"
echo "================================"

# 检查Node.js版本
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js >= 18.0.0"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js 版本过低，当前版本: $NODE_VERSION，需要版本: >= $REQUIRED_VERSION"
    exit 1
fi

echo "✅ Node.js 版本检查通过: $NODE_VERSION"

# 检查pnpm
if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm 未安装，正在安装..."
    npm install -g pnpm
fi

echo "✅ pnpm 已就绪"

# 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装项目依赖..."
    pnpm install
else
    echo "✅ 依赖已安装"
fi

# 运行项目完整性检查
echo ""
echo "🔍 运行项目完整性检查..."
node test-project.cjs

if [ $? -ne 0 ]; then
    echo "❌ 项目完整性检查失败"
    exit 1
fi

echo ""
echo "🎉 项目准备就绪！"
echo ""
echo "🌐 启动开发服务器..."
echo "   访问地址: http://localhost:5173"
echo ""
echo "按 Ctrl+C 停止服务器"
echo "================================"

# 启动开发服务器
pnpm dev 