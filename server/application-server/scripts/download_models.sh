#!/bin/bash

# 🦙 Ollama模型批量下载脚本
# 用于AI日志分析和智能对话项目

set -e  # 遇到错误立即退出

echo "🚀 开始下载AI模型..."
echo "======================================"

# 检查Ollama是否已安装
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollama未安装，请先安装Ollama"
    echo "macOS: brew install ollama"
    echo "Linux: curl -fsSL https://ollama.ai/install.sh | sh"
    exit 1
fi

# 检查Ollama服务是否运行
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Ollama服务未运行，尝试启动..."
    ollama serve &
    sleep 5
    
    if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "❌ 无法启动Ollama服务，请手动运行: ollama serve"
        exit 1
    fi
fi

echo "✅ Ollama服务正在运行"

# 定义需要下载的模型
declare -A MODELS=(
    ["qwen2.5:14b"]="主要对话模型 (3.97GB)"
    ["qwen2.5:7b"]="快速响应模型 (4.37GB)" 
    ["deepseek-coder:6.7b"]="技术分析模型 (3.83GB)"
    ["nomic-embed-text"]="向量嵌入模型 (274MB)"
)

# 下载模型函数
download_model() {
    local model=$1
    local description=$2
    
    echo ""
    echo "📥 下载 $model - $description"
    echo "--------------------------------------"
    
    # 检查模型是否已存在
    if ollama list | grep -q "$model"; then
        echo "✅ 模型 $model 已存在，跳过下载"
        return 0
    fi
    
    # 开始下载
    echo "⏳ 正在下载 $model..."
    if ollama pull "$model"; then
        echo "✅ $model 下载完成"
    else
        echo "❌ $model 下载失败"
        return 1
    fi
}

# 显示下载计划
echo ""
echo "📋 下载计划:"
for model in "${!MODELS[@]}"; do
    echo "  - $model: ${MODELS[$model]}"
done

echo ""
read -p "是否继续下载? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "取消下载"
    exit 0
fi

# 开始下载所有模型
failed_models=()
for model in "${!MODELS[@]}"; do
    if ! download_model "$model" "${MODELS[$model]}"; then
        failed_models+=("$model")
    fi
done

echo ""
echo "======================================"

# 显示下载结果
if [ ${#failed_models[@]} -eq 0 ]; then
    echo "🎉 所有模型下载完成！"
else
    echo "⚠️  以下模型下载失败:"
    for model in "${failed_models[@]}"; do
        echo "  - $model"
    done
    echo ""
    echo "你可以稍后手动下载: ollama pull <model_name>"
fi

echo ""
echo "🔍 当前已安装的模型:"
ollama list

echo ""
echo "📊 存储空间使用情况:"
echo "模型存储路径: ~/.ollama/models"
du -sh ~/.ollama/models 2>/dev/null || echo "无法检测存储使用情况"

echo ""
echo "🧪 快速测试模型是否工作正常..."

# 测试对话模型
if ollama list | grep -q "qwen2.5:14b"; then
    echo "测试对话模型..."
    echo "你好" | timeout 30s ollama run qwen2.5:14b > /dev/null 2>&1 && echo "✅ 对话模型正常" || echo "⚠️  对话模型可能有问题"
fi

# 测试嵌入模型
if ollama list | grep -q "nomic-embed-text"; then
    echo "测试嵌入模型..."
    curl -s -X POST http://localhost:11434/api/embeddings \
        -H "Content-Type: application/json" \
        -d '{"model": "nomic-embed-text", "prompt": "test"}' > /dev/null 2>&1 && \
        echo "✅ 嵌入模型正常" || echo "⚠️  嵌入模型可能有问题"
fi

echo ""
echo "🚀 模型下载和测试完成！"
echo "现在可以启动项目: pnpm run start:dev" 