# 基于LangChain的通用AI服务指南

## 概述

本项目采用LangChain框架实现了通用的AI服务，支持多种模型提供商（Ollama、OpenAI、自定义API），具备自动降级、智能路由等高级功能。

## 架构设计

### 核心组件

1. **UniversalAIService** - 底层AI服务，基于LangChain统一接口
2. **LangChainAIProviderService** - 高级AI服务提供商，支持自动降级
3. **UniversalAIController** - RESTful API控制器

### 支持的模型提供商

- **Ollama** - 本地模型（主要推荐）
  - 优势：隐私保护、零成本、可定制
  - 支持模型：qwen2.5:14b, qwen2.5:7b, deepseek-coder:6.7b 等

- **OpenAI** - 云端模型
  - 优势：高质量、稳定性好
  - 支持模型：gpt-4o, gpt-4-turbo, gpt-3.5-turbo 等

- **Custom API** - 自定义API（兼容OpenAI格式）
  - 优势：灵活性高、支持第三方服务
  - 适用于：Moonshot、智谱AI、百川AI等

## 配置说明

### 环境变量配置

```bash
# AI服务提供商选择
AI_PROVIDER=ollama  # ollama | openai | custom-api

# Ollama配置（推荐）
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=qwen2.5:14b
OLLAMA_FAST_MODEL=qwen2.5:7b
OLLAMA_ANALYSIS_MODEL=deepseek-coder:6.7b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# OpenAI配置
OPENAI_API_KEY=your_openai_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo

# 自定义API配置
CUSTOM_API_KEY=your_custom_key
CUSTOM_BASE_URL=https://api.example.com/v1
CUSTOM_MODEL=custom-model
CUSTOM_MODELS=model1,model2,model3  # 可用模型列表

# 通用配置
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=2000
```

### 配置文件 (src/config/configuration.ts)

配置文件已自动读取环境变量，无需手动修改。

## API 使用指南

### 1. 基础对话

```bash
# 普通对话
curl -X POST http://localhost:3000/ai/universal/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "你好，请介绍一下自己"}
    ],
    "temperature": 0.7,
    "maxTokens": 1000
  }'

# 指定模型提供商
curl -X POST http://localhost:3000/ai/universal/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "解释一下什么是机器学习"}
    ],
    "provider": "ollama",
    "useAnalysisModel": true,
    "temperature": 0.3
  }'
```

### 2. 文本生成

```bash
# 基础文本生成
curl -X POST http://localhost:3000/ai/universal/completion \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "写一篇关于人工智能的简短文章",
    "systemPrompt": "你是一位专业的科技作家",
    "temperature": 0.8,
    "maxTokens": 2000
  }'

# 快速模式
curl -X POST http://localhost:3000/ai/universal/completion \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "总结今天的新闻要点",
    "fastMode": true,
    "maxTokens": 500
  }'
```

### 3. 批量处理

```bash
curl -X POST http://localhost:3000/ai/universal/batch \
  -H "Content-Type: application/json" \
  -d '{
    "prompts": [
      "翻译：Hello World",
      "解释：什么是REST API",
      "总结：人工智能的发展历程"
    ],
    "temperature": 0.5,
    "maxTokens": 800
  }'
```

### 4. 智能对话演示

```bash
# 代码审查场景
curl -X POST http://localhost:3000/ai/universal/demo/smart-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "function add(a, b) { return a + b }",
    "scenario": "code-review"
  }'

# 创意写作场景
curl -X POST http://localhost:3000/ai/universal/demo/smart-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "写一个关于未来城市的科幻故事开头",
    "scenario": "creative-writing"
  }'

# 快速问答场景
curl -X POST http://localhost:3000/ai/universal/demo/smart-chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "什么是TCP/IP协议？",
    "scenario": "quick-answer"
  }'
```

### 5. 系统管理

```bash
# 健康检查
curl http://localhost:3000/ai/universal/health

# 获取可用模型
curl http://localhost:3000/ai/universal/models
curl "http://localhost:3000/ai/universal/models?provider=ollama"

# 切换模型
curl -X POST http://localhost:3000/ai/universal/switch-model \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "ollama",
    "modelName": "qwen2.5:7b"
  }'

# 获取推荐配置
curl "http://localhost:3000/ai/universal/recommended-config?scenario=analysis"

# 获取统计信息
curl http://localhost:3000/ai/universal/stats
```

## 代码使用示例

### 在Service中使用

```typescript
import { Injectable } from '@nestjs/common';
import { LangChainAIProviderService } from '../ai/services/langchain-ai-provider.service';

@Injectable()
export class MyService {
  constructor(
    private readonly aiProvider: LangChainAIProviderService,
  ) {}

  // 基础对话
  async basicChat(userMessage: string): Promise<string> {
    const response = await this.aiProvider.chat([
      { role: 'user', content: userMessage }
    ]);
    return response.content;
  }

  // 代码分析
  async analyzeCode(code: string): Promise<string> {
    return await this.aiProvider.generateCompletion(
      `请分析这段代码的质量和性能：\n${code}`,
      {
        useAnalysisModel: true,
        temperature: 0.3,
        systemPrompt: '你是一位资深的代码审查专家',
      }
    );
  }

  // 快速回答
  async quickAnswer(question: string): Promise<string> {
    return await this.aiProvider.generateCompletion(question, {
      fastMode: true,
      temperature: 0.5,
      maxTokens: 500,
    });
  }

  // 批量翻译
  async batchTranslate(texts: string[]): Promise<string[]> {
    const prompts = texts.map(text => `翻译成英文：${text}`);
    return await this.aiProvider.batchProcess(prompts, {
      temperature: 0.3,
      maxTokens: 200,
    });
  }

  // 智能场景选择
  async smartProcess(content: string, type: 'code' | 'creative' | 'analysis'): Promise<string> {
    const configs = {
      code: {
        useAnalysisModel: true,
        temperature: 0.3,
        systemPrompt: '你是代码分析专家',
      },
      creative: {
        temperature: 0.9,
        maxTokens: 3000,
        systemPrompt: '你是创意写作专家',
      },
      analysis: {
        useAnalysisModel: true,
        temperature: 0.1,
        maxTokens: 4000,
        systemPrompt: '你是数据分析专家',
      },
    };

    return await this.aiProvider.generateCompletion(content, configs[type]);
  }
}
```

### 自动降级示例

```typescript
// 系统会自动尝试以下顺序：
// 1. 主要provider（从配置获取，默认ollama）
// 2. 第二选择（openai）
// 3. 第三选择（custom-api）

const response = await this.aiProvider.chat(messages, {
  // 不指定provider，系统自动选择并降级
  temperature: 0.7,
});

// 也可以手动指定降级顺序
const response = await this.aiProvider.chat(messages, {
  provider: 'ollama',
  fallbackProviders: ['openai', 'custom-api'],
});
```

## 高级特性

### 1. 智能模型选择

系统根据不同场景自动选择最适合的模型：

- **对话场景**：均衡的对话模型
- **分析场景**：专门的分析模型（如deepseek-coder）
- **快速场景**：轻量级模型
- **创意场景**：高温度设置的创意模型

### 2. 自动降级机制

当主要服务不可用时，系统自动切换到备用服务：

```
Ollama (本地) → OpenAI (云端) → Custom API (备用)
```

### 3. 模型缓存

系统缓存已初始化的模型实例，提高响应速度。

### 4. 健康监控

定期检查所有AI服务的健康状态，提供详细的监控信息。

## 部署建议

### 1. 本地开发环境

```bash
# 安装Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 下载推荐模型
ollama pull qwen2.5:14b
ollama pull qwen2.5:7b
ollama pull deepseek-coder:6.7b
ollama pull nomic-embed-text

# 设置环境变量
export AI_PROVIDER=ollama
export OLLAMA_BASE_URL=http://localhost:11434

# 启动项目
pnpm run start:dev
```

### 2. 生产环境

```bash
# 1. 配置环境变量
export AI_PROVIDER=ollama
export OLLAMA_BASE_URL=http://ollama-server:11434
export OPENAI_API_KEY=backup_key  # 作为备用

# 2. 部署Ollama服务器
docker run -d \
  --name ollama \
  -p 11434:11434 \
  -v ollama:/root/.ollama \
  ollama/ollama

# 3. 启动应用
pnpm run build
pnpm run start:prod
```

### 3. 云端部署

如果需要云端服务作为主要provider：

```bash
export AI_PROVIDER=openai
export OPENAI_API_KEY=your_openai_key
export CUSTOM_BASE_URL=http://backup-api:8080  # 备用API
```

## 性能优化

### 1. 模型选择策略

- **聊天**：使用中等大小模型 (qwen2.5:14b)
- **快速响应**：使用小模型 (qwen2.5:7b)
- **深度分析**：使用专业模型 (deepseek-coder:6.7b)

### 2. 并发控制

```typescript
// 批量处理自动限制并发数
const results = await this.aiProvider.batchProcess(prompts, {
  maxConcurrency: 3,  // 系统自动管理
});
```

### 3. 缓存优化

- 模型实例缓存
- 配置缓存
- 结果缓存（可选）

## 故障排查

### 常见问题

1. **Ollama连接失败**
   ```bash
   # 检查Ollama状态
   curl http://localhost:11434/api/tags
   
   # 重启Ollama
   ollama serve
   ```

2. **模型不存在**
   ```bash
   # 查看已安装模型
   ollama list
   
   # 下载模型
   ollama pull qwen2.5:14b
   ```

3. **API密钥无效**
   ```bash
   # 检查环境变量
   echo $OPENAI_API_KEY
   echo $CUSTOM_API_KEY
   ```

### 调试技巧

```bash
# 查看健康状态
curl http://localhost:3000/ai/universal/health

# 查看统计信息
curl http://localhost:3000/ai/universal/stats

# 测试模型切换
curl -X POST http://localhost:3000/ai/universal/switch-model \
  -H "Content-Type: application/json" \
  -d '{"provider": "ollama", "modelName": "qwen2.5:7b"}'
```

## 最佳实践

### 1. 模型选择

- 开发环境：优先使用Ollama
- 生产环境：Ollama + OpenAI备用
- 高负载场景：使用fastMode

### 2. 提示词优化

```typescript
// 好的做法
const systemPrompt = '你是一位专业的软件工程师，专注于代码质量和最佳实践。';
const userPrompt = '请审查以下TypeScript代码并提出具体的改进建议：\n\n' + code;

// 避免的做法
const prompt = '看看这个代码有什么问题：' + code;
```

### 3. 错误处理

```typescript
try {
  const response = await this.aiProvider.chat(messages);
  return response.content;
} catch (error) {
  // 系统已经自动降级，这里是最后的错误
  this.logger.error('所有AI服务都不可用', error);
  return '抱歉，AI服务暂时不可用，请稍后再试。';
}
```

### 4. 监控和日志

```typescript
// 记录使用统计
const startTime = Date.now();
const response = await this.aiProvider.chat(messages);
this.logger.log(`AI调用完成`, {
  provider: response.provider,
  model: response.model,
  processingTime: response.processingTime,
  inputTokens: response.usage?.promptTokens,
  outputTokens: response.usage?.completionTokens,
});
```

## 更新日志

### v2.0.0 - LangChain集成
- ✅ 集成LangChain框架
- ✅ 支持多种模型提供商
- ✅ 自动降级机制
- ✅ 智能模型选择
- ✅ 统一API接口
- ✅ 健康监控
- ✅ 批量处理优化

### 后续计划
- 🚧 流式响应支持
- 🚧 结果缓存优化
- 🚧 更多模型提供商支持
- 🚧 性能监控面板
- 🚧 A/B测试功能

---

通过这个通用的AI服务架构，你可以轻松地在不同的AI模型提供商之间切换，享受本地模型的隐私优势和云端模型的高质量服务，同时具备完善的降级和监控机制。 