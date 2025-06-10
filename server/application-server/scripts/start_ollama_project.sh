#!/bin/bash

# 🚀 一键启动Ollama AI项目脚本

set -e

echo "🦙 启动Ollama AI智能日志分析项目"
echo "============================================"

# 检查当前目录
if [ ! -f "package.json" ]; then
    echo "❌ 请在项目根目录运行此脚本"
    exit 1
fi

# 1. 检查并启动Ollama服务
echo "1. 🔍 检查Ollama服务..."
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama未安装，请先安装:"
    echo "   macOS: brew install ollama"
    echo "   Linux: curl -fsSL https://ollama.ai/install.sh | sh"
    exit 1
fi

if ! pgrep ollama > /dev/null; then
    echo "⚡ 启动Ollama服务..."
    ollama serve &
    sleep 3
fi

# 2. 检查模型是否已下载
echo "2. 🤖 检查AI模型..."
REQUIRED_MODELS=("qwen2.5:14b" "qwen2.5:7b" "deepseek-coder:6.7b" "nomic-embed-text")
missing_models=()

for model in "${REQUIRED_MODELS[@]}"; do
    if ! ollama list | grep -q "$model"; then
        missing_models+=("$model")
    fi
done

if [ ${#missing_models[@]} -gt 0 ]; then
    echo "⚠️  缺少以下模型:"
    for model in "${missing_models[@]}"; do
        echo "  - $model"
    done
    echo ""
    read -p "是否现在下载缺少的模型? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ./scripts/download_models.sh
    else
        echo "⚠️  跳过模型下载，某些功能可能不可用"
    fi
fi

# 3. 启动向量数据库
echo "3. 🗄️  启动向量数据库..."
if command -v docker-compose &> /dev/null; then
    if [ -f "docker-compose.yml" ]; then
        echo "启动Qdrant向量数据库..."
        docker-compose up -d qdrant
        sleep 2
    else
        echo "⚠️  未找到docker-compose.yml，跳过向量数据库启动"
    fi
else
    echo "⚠️  Docker Compose未安装，跳过向量数据库启动"
fi

# 4. 安装依赖
echo "4. 📦 安装项目依赖..."
if [ -f "pnpm-lock.yaml" ]; then
    pnpm install
elif [ -f "yarn.lock" ]; then
    yarn install
else
    npm install
fi

# 5. 数据库迁移
echo "5. 🗃️  数据库初始化..."
if [ -f "prisma/schema.prisma" ]; then
    echo "执行数据库迁移..."
    pnpm run db:init || npm run db:init
fi

# 6. 环境配置提醒
echo "6. ⚙️  环境配置检查..."
if [ ! -f ".env" ]; then
    echo "⚠️  未找到.env文件，请配置环境变量:"
    echo "   cp .env.example .env"
    echo "   然后编辑.env文件设置数据库连接等配置"
fi

# 7. 健康检查
echo "7. 🔍 系统健康检查..."
if [ -f "scripts/health_check.sh" ]; then
    ./scripts/health_check.sh
else
    echo "⚠️  健康检查脚本未找到"
fi

# 8. 启动项目
echo ""
echo "8. 🚀 启动项目服务..."
echo "============================================"
echo "项目将在以下地址启动:"
echo "🌐 主服务: http://localhost:3000"
echo "📚 API文档: http://localhost:3000/api-docs"
echo "🤖 AI健康检查: http://localhost:3000/api/ai/health"
echo "🦙 Ollama API: http://localhost:11434/api/tags"
echo ""
echo "按 Ctrl+C 停止服务"
echo "============================================"

# 启动开发服务器
if [ -f "pnpm-lock.yaml" ]; then
    pnpm run start:dev
elif [ -f "yarn.lock" ]; then
    yarn start:dev
else
    npm run start:dev
fi 