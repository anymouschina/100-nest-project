# 🦙 Ollama本地AI模型配置指南

## 🎯 项目模型架构

本项目已从云端API迁移到本地Ollama模型，实现：
- **零API成本** - 完全本地运行
- **数据隐私** - 敏感日志数据不出本地
- **高性能** - 减少网络延迟
- **高可用** - 不依赖外部服务

## 📦 推荐模型组合

### 1. **主要对话模型**
```bash
# 下载阿里千问2.5 14B参数版本 (推荐)
ollama pull qwen2.5:14b

# 轻量级快速响应版本
ollama pull qwen2.5:7b
```
**用途**: 智能聊天、提示词优化、业务咨询
**特点**: 中文友好、逻辑清晰、响应快速

### 2. **技术分析模型**
```bash
# 下载DeepSeek Coder (推荐日志分析)
ollama pull deepseek-coder:6.7b

# 备选: Code Llama (Meta开源)
ollama pull codellama:13b
```
**用途**: 日志分析、错误诊断、代码理解
**特点**: 专业技术理解、问题定位准确

### 3. **向量嵌入模型**
```bash
# 专业嵌入模型 (推荐)
ollama pull nomic-embed-text

# 高质量备选
ollama pull mxbai-embed-large

# 轻量级选择
ollama pull all-minilm
```
**用途**: 语义搜索、向量数据库、相似度匹配
**特点**: 高精度向量化、支持多语言

## 🚀 安装和启动步骤

### 1. 安装Ollama
```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# 下载 https://ollama.ai/download/OllamaSetup.exe
```

### 2. 启动Ollama服务
```bash
# 启动服务 (默认端口11434)
ollama serve

# 后台运行
nohup ollama serve > ollama.log 2>&1 &
```

### 3. 批量下载项目所需模型
```bash
#!/bin/bash
# 创建 download_models.sh 脚本

echo "🚀 开始下载AI模型..."

# 对话模型
echo "📥 下载对话模型..."
ollama pull qwen2.5:14b
ollama pull qwen2.5:7b

# 分析模型  
echo "📥 下载分析模型..."
ollama pull deepseek-coder:6.7b

# 嵌入模型
echo "📥 下载嵌入模型..."
ollama pull nomic-embed-text

echo "✅ 所有模型下载完成！"

# 验证模型
echo "🔍 验证模型列表..."
ollama list
```

```bash
# 执行脚本
chmod +x download_models.sh
./download_models.sh
```

### 4. 验证模型可用性
```bash
# 列出所有模型
ollama list

# 测试对话模型
ollama run qwen2.5:14b "你好，介绍一下自己"

# 测试分析模型
ollama run deepseek-coder:6.7b "分析这个错误: TypeError: Cannot read property 'id' of undefined"

# 测试嵌入模型
curl -X POST http://localhost:11434/api/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model": "nomic-embed-text", "prompt": "测试文本向量化"}'
```

## ⚙️ 项目配置更新

### 1. 环境变量配置
更新 `.env` 文件：
```env
# Ollama本地AI配置
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=qwen2.5:14b
OLLAMA_FAST_MODEL=qwen2.5:7b
OLLAMA_ANALYSIS_MODEL=deepseek-coder:6.7b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# AI服务优先级 (ollama优先)
AI_PROVIDER=ollama

# 备用云端服务 (可选)
MOONSHOT_API_KEY=your_backup_key
OPENAI_API_KEY=your_backup_key
```

### 2. 验证服务连接
```bash
# 启动项目
pnpm run start:dev

# 检查Ollama连接状态
curl http://localhost:3000/api/ai/health
```

## 🎛️ 模型性能调优

### 1. 内存优化
```bash
# 查看GPU内存使用
ollama ps

# 调整并发模型数量 (8GB RAM建议)
export OLLAMA_NUM_PARALLEL=2
export OLLAMA_MAX_LOADED_MODELS=3

# 调整上下文长度 (减少内存使用)
export OLLAMA_CONTEXT_SIZE=4096
```

### 2. CPU优化
```bash
# 设置线程数 (根据CPU核心数调整)
export OLLAMA_NUM_THREAD=8

# 启用CPU指令集优化
export OLLAMA_LLAMA_CPP_AVX=1
export OLLAMA_LLAMA_CPP_AVX2=1
```

### 3. 网络优化
```bash
# 设置请求超时 (本地模型响应较慢)
export OLLAMA_REQUEST_TIMEOUT=120

# 设置最大并发请求
export OLLAMA_MAX_QUEUE=10
```

## 📊 模型选择策略

### 基于场景的智能选择
项目已配置智能模型选择策略：

| 场景类型 | 选用模型 | 原因 |
|---------|----------|------|
| **日常对话** | `qwen2.5:14b` | 中文理解能力强，回答质量高 |
| **快速响应** | `qwen2.5:7b` | 响应速度快，资源占用少 |
| **日志分析** | `deepseek-coder:6.7b` | 专业技术理解，错误诊断准确 |
| **代码分析** | `deepseek-coder:6.7b` | 代码理解和分析能力强 |
| **向量搜索** | `nomic-embed-text` | 专业嵌入模型，精度高 |

### 动态选择逻辑
```typescript
// 智能模型选择示例
const selectModel = (task: string, priority: 'speed' | 'quality') => {
  if (task.includes('日志') || task.includes('错误')) {
    return 'deepseek-coder:6.7b'; // 技术分析
  }
  
  if (priority === 'speed') {
    return 'qwen2.5:7b'; // 快速响应
  }
  
  return 'qwen2.5:14b'; // 默认高质量
};
```

## 🔧 性能监控和优化

### 1. 性能指标监控
```bash
# 监控系统资源
htop

# 监控GPU使用 (如果有)
nvidia-smi

# 监控Ollama进程
ps aux | grep ollama

# 查看模型内存占用
ollama ps
```

### 2. 日志监控
```bash
# 查看Ollama日志
tail -f ~/.ollama/logs/server.log

# 查看项目AI服务日志
tail -f logs/ai-service.log
```

### 3. 性能基准测试
```bash
# 创建性能测试脚本
cat > benchmark_models.sh << 'EOF'
#!/bin/bash

echo "🚀 开始模型性能测试..."

# 测试对话模型响应时间
echo "测试 qwen2.5:14b 响应时间..."
time ollama run qwen2.5:14b "简单介绍人工智能"

echo "测试 qwen2.5:7b 响应时间..."
time ollama run qwen2.5:7b "简单介绍人工智能"

# 测试分析模型
echo "测试 deepseek-coder:6.7b 分析能力..."
time ollama run deepseek-coder:6.7b "分析这个错误: TypeError: Cannot read property 'id' of undefined"

echo "✅ 性能测试完成！"
EOF

chmod +x benchmark_models.sh
./benchmark_models.sh
```

## 🛠️ 故障排除

### 1. 常见问题

#### 模型下载失败
```bash
# 问题：网络连接超时
# 解决：使用镜像源
export OLLAMA_HOST=0.0.0.0:11434
ollama pull qwen2.5:14b
```

#### 内存不足
```bash
# 问题：OOM killed
# 解决：使用更小的模型
ollama pull qwen2.5:1.5b  # 轻量版本
```

#### 响应缓慢
```bash
# 问题：CPU使用率过高
# 解决：调整并发数
export OLLAMA_NUM_PARALLEL=1
export OLLAMA_NUM_THREAD=4
```

### 2. 健康检查脚本
```bash
#!/bin/bash
# health_check.sh

echo "🔍 Ollama健康检查..."

# 检查服务状态
if pgrep ollama > /dev/null; then
    echo "✅ Ollama服务正在运行"
else
    echo "❌ Ollama服务未运行"
    exit 1
fi

# 检查API可用性
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "✅ API接口正常"
else
    echo "❌ API接口异常"
    exit 1
fi

# 检查模型可用性
REQUIRED_MODELS=("qwen2.5:14b" "qwen2.5:7b" "deepseek-coder:6.7b" "nomic-embed-text")

for model in "${REQUIRED_MODELS[@]}"; do
    if ollama list | grep -q "$model"; then
        echo "✅ 模型 $model 已安装"
    else
        echo "❌ 模型 $model 未安装"
        echo "请运行: ollama pull $model"
    fi
done

echo "🎉 健康检查完成！"
```

## 📈 预期性能提升

### 成本节省
- **API费用**: 从 $0.001/1K tokens → $0 (100%节省)
- **流量费用**: 本地网络传输
- **维护成本**: 一次性部署

### 性能提升
- **响应延迟**: 200-500ms → 50-200ms (60%改善)
- **并发处理**: 不受API限制
- **可用性**: 99.9% → 99.99% (本地服务)

### 数据安全
- **隐私保护**: 日志数据完全本地处理
- **合规性**: 满足数据本地化要求
- **审计**: 完整的本地操作记录

## 🎯 后续优化计划

### 短期优化 (1-2周)
1. **模型微调**: 基于业务日志数据训练专用模型
2. **缓存优化**: 实现智能结果缓存机制
3. **负载均衡**: 多实例部署提高并发能力

### 中期规划 (1-2月)
1. **GPU加速**: 部署GPU版本提升性能
2. **集群部署**: 多节点分布式推理
3. **模型压缩**: 量化模型减少资源占用

### 长期愿景 (3-6月)
1. **专用模型**: 训练领域专用的日志分析模型
2. **边缘部署**: 支持边缘设备部署
3. **智能调度**: 根据负载自动选择最优模型

---

## 🚀 快速启动命令

```bash
# 一键启动所有服务
./scripts/start_ollama_project.sh

# 或分步执行
ollama serve &                    # 启动Ollama服务
./download_models.sh             # 下载模型
pnpm run start:dev               # 启动项目
./health_check.sh                # 健康检查
```

**🎉 恭喜！你的AI项目现在完全运行在本地，享受零成本、高性能的AI服务吧！** 