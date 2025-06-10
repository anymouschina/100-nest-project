#!/bin/bash

# 🔍 Ollama AI服务健康检查脚本

echo "🔍 开始AI服务健康检查..."
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查结果统计
passed=0
failed=0

# 检查函数
check_service() {
    local service_name=$1
    local check_command=$2
    local description=$3
    
    echo -n "检查 $service_name: "
    
    if eval "$check_command" &> /dev/null; then
        echo -e "${GREEN}✅ 正常${NC} - $description"
        ((passed++))
        return 0
    else
        echo -e "${RED}❌ 异常${NC} - $description"
        ((failed++))
        return 1
    fi
}

# 1. 检查Ollama服务状态
echo "1. 🚀 Ollama服务检查"
echo "------------------------------------------"

check_service "Ollama进程" "pgrep ollama" "Ollama守护进程正在运行"
check_service "Ollama API" "curl -s http://localhost:11434/api/tags" "API接口响应正常"

# 2. 检查必需模型
echo ""
echo "2. 🤖 AI模型检查"
echo "------------------------------------------"

REQUIRED_MODELS=(
    "qwen2.5:14b:主要对话模型"
    "qwen2.5:7b:快速响应模型"
    "deepseek-coder:6.7b:技术分析模型"
    "nomic-embed-text:向量嵌入模型"
)

for model_info in "${REQUIRED_MODELS[@]}"; do
    IFS=':' read -r model_name model_desc <<< "$model_info"
    check_service "$model_name" "ollama list | grep -q '$model_name'" "$model_desc"
done

# 3. 检查模型功能
echo ""
echo "3. 🧪 模型功能测试"
echo "------------------------------------------"

# 测试对话模型
if ollama list | grep -q "qwen2.5:14b"; then
    echo -n "测试对话模型响应: "
    if timeout 30s bash -c 'echo "你好" | ollama run qwen2.5:14b' &> /dev/null; then
        echo -e "${GREEN}✅ 正常${NC} - 模型可以正常对话"
        ((passed++))
    else
        echo -e "${YELLOW}⚠️  超时${NC} - 模型响应较慢或有问题"
        ((failed++))
    fi
else
    echo -e "${RED}❌ 跳过${NC} - 对话模型未安装"
    ((failed++))
fi

# 测试嵌入模型
if ollama list | grep -q "nomic-embed-text"; then
    echo -n "测试嵌入模型API: "
    if curl -s -X POST http://localhost:11434/api/embeddings \
        -H "Content-Type: application/json" \
        -d '{"model": "nomic-embed-text", "prompt": "test"}' | grep -q "embedding"; then
        echo -e "${GREEN}✅ 正常${NC} - 向量化功能正常"
        ((passed++))
    else
        echo -e "${RED}❌ 异常${NC} - 向量化API响应异常"
        ((failed++))
    fi
else
    echo -e "${RED}❌ 跳过${NC} - 嵌入模型未安装"
    ((failed++))
fi

# 4. 检查系统资源
echo ""
echo "4. 💻 系统资源检查"
echo "------------------------------------------"

# 内存检查
total_mem=$(free -h | awk '/^Mem:/ {print $2}' 2>/dev/null || echo "未知")
available_mem=$(free -h | awk '/^Mem:/ {print $7}' 2>/dev/null || echo "未知")
echo "系统内存: 总计 $total_mem, 可用 $available_mem"

# 磁盘空间检查
ollama_dir="$HOME/.ollama"
if [ -d "$ollama_dir" ]; then
    disk_usage=$(du -sh "$ollama_dir" 2>/dev/null | cut -f1)
    echo "Ollama存储: $disk_usage (路径: $ollama_dir)"
else
    echo "Ollama存储: 未找到数据目录"
fi

# CPU负载检查
if command -v uptime &> /dev/null; then
    load_avg=$(uptime | awk -F'load average:' '{print $2}')
    echo "CPU负载: $load_avg"
fi

# 5. 检查项目服务
echo ""
echo "5. 🌐 项目服务检查"
echo "------------------------------------------"

# 检查项目是否运行
if curl -s http://localhost:3000/api/ai/health &> /dev/null; then
    echo -e "${GREEN}✅ 项目服务正常${NC} - AI API可访问"
    ((passed++))
else
    echo -e "${YELLOW}⚠️  项目服务未运行${NC} - 请启动: pnpm run start:dev"
fi

# 检查Qdrant向量数据库
if curl -s http://localhost:6333/health &> /dev/null; then
    echo -e "${GREEN}✅ Qdrant正常${NC} - 向量数据库可访问"
    ((passed++))
else
    echo -e "${YELLOW}⚠️  Qdrant未运行${NC} - 请启动: docker-compose up -d qdrant"
fi

# 6. 性能建议
echo ""
echo "6. 💡 性能建议"
echo "------------------------------------------"

# 检查是否有GPU
if command -v nvidia-smi &> /dev/null; then
    echo "🎮 检测到NVIDIA GPU，建议启用GPU加速"
    echo "   设置环境变量: export CUDA_VISIBLE_DEVICES=0"
else
    echo "⚡ 未检测到GPU，使用CPU推理"
    echo "   建议: 增加CPU核心数或使用较小模型"
fi

# 内存建议
available_mb=$(free -m | awk '/^Mem:/ {print $7}' 2>/dev/null || echo "0")
if [ "$available_mb" -lt 4096 ]; then
    echo "⚠️  可用内存较少 (<4GB)，建议:"
    echo "   - 使用轻量级模型: qwen2.5:1.5b"
    echo "   - 设置: export OLLAMA_MAX_LOADED_MODELS=1"
fi

# 总结
echo ""
echo "=========================================="
echo "🏁 健康检查完成"
echo "=========================================="
echo -e "通过: ${GREEN}$passed${NC} 项"
echo -e "失败: ${RED}$failed${NC} 项"

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}🎉 所有检查通过！系统运行正常${NC}"
    exit 0
elif [ $failed -le 2 ]; then
    echo -e "${YELLOW}⚠️  发现轻微问题，系统基本可用${NC}"
    exit 1
else
    echo -e "${RED}❌ 发现严重问题，需要修复后才能正常使用${NC}"
    echo ""
    echo "🔧 常见修复方法："
    echo "1. 启动Ollama: ollama serve"
    echo "2. 下载模型: ./scripts/download_models.sh"
    echo "3. 启动项目: pnpm run start:dev"
    echo "4. 启动向量数据库: docker-compose up -d qdrant"
    exit 2
fi 