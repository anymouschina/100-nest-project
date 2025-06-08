# LangChain集成说明

本项目已成功集成LangChain框架，实现了高级的对话管理和会话记忆功能。

## 🚀 核心功能

### 1. 会话记忆管理

#### BufferMemory（缓冲记忆）
- **特点**：保存完整的对话历史
- **适用场景**：短期对话，需要完整上下文
- **优势**：保持对话的完整性和连贯性

#### ConversationSummaryBufferMemory（摘要缓冲记忆）
- **特点**：自动总结较早的对话，保留最近的完整消息
- **适用场景**：长期对话，需要控制token使用
- **优势**：平衡记忆容量和对话质量

### 2. 连续对话实现

```typescript
// 会话创建时自动初始化LangChain组件
const llm = new ChatOpenAI({
  openAIApiKey: process.env.MOONSHOT_API_KEY,
  modelName: 'moonshot-v1-8k',
  temperature: 0.7,
  configuration: {
    baseURL: 'https://api.moonshot.cn/v1',
  },
});

const chain = new ConversationChain({
  llm,
  memory,
  prompt: this.createPromptTemplate(preferences),
});
```

### 3. 智能提示词模板

系统会根据用户偏好动态生成提示词模板：

```typescript
const template = `你是一个专业的AI助手，具有以下特点：
- 语言风格：${preferences.responseStyle}
- 回复语言：${preferences.language}
- 回复长度：控制在${preferences.maxResponseLength}字符以内

请基于以下对话历史，为用户提供有帮助的回复：

{history}

用户: {input}
AI助手:`;
```

## 🔧 技术架构

### 依赖包
- `langchain`: 核心框架
- `@langchain/openai`: OpenAI兼容的LLM集成
- `@langchain/core`: 核心组件
- `@langchain/community`: 社区组件

### 核心组件

1. **ChatService**: 主要的聊天服务
2. **ConversationChain**: LangChain对话链
3. **Memory组件**: 记忆管理
4. **PromptTemplate**: 动态提示词模板

## 📊 用户偏好配置

用户可以通过API设置以下偏好：

```typescript
interface UserPreferences {
  language: string;                    // 语言偏好
  responseStyle: string;               // 回复风格
  maxResponseLength: number;           // 最大回复长度
  preferredOptimizationTypes: string[]; // 优化类型偏好
  memoryType: 'buffer' | 'summary_buffer'; // 记忆类型
  maxTokens: number;                   // 最大token数
  maxHistoryMessages: number;          // 最大历史消息数
}
```

## 🎯 使用示例

### 1. 创建会话并开始对话

```bash
# 1. 游客登录
curl -X POST http://localhost:3001/api/auth/guest-login

# 2. 开始对话
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "你好，我想学习提示词工程"
  }'

# 3. 继续对话（会自动记住上下文）
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "刚才我们说的是什么？",
    "sessionId": "session_xxx"
  }'
```

### 2. 设置记忆类型

```bash
curl -X POST http://localhost:3001/api/ai/preferences \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "memoryType": "summary_buffer",
    "maxHistoryMessages": 20,
    "responseStyle": "professional"
  }'
```

## 🔍 会话管理

### 查看会话历史
```bash
curl -X GET http://localhost:3001/api/ai/sessions/session_xxx \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 获取所有会话
```bash
curl -X GET http://localhost:3001/api/ai/sessions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 💡 最佳实践

### 1. 记忆类型选择
- **短期对话**（<10轮）：使用 `buffer` 记忆
- **长期对话**（>10轮）：使用 `summary_buffer` 记忆

### 2. Token管理
- 设置合理的 `maxTokens` 限制
- 使用 `maxHistoryMessages` 控制历史长度
- 定期清理不需要的会话

### 3. 性能优化
- 会话数据存储在内存中，重启后会丢失
- 可以实现数据库持久化（预留接口已提供）
- 建议定期清理过期会话

## 🚨 注意事项

1. **API密钥配置**：确保 `MOONSHOT_API_KEY` 环境变量正确设置
2. **内存使用**：长期运行时注意监控内存使用情况
3. **并发处理**：当前实现为单实例，集群部署需要考虑会话共享
4. **错误处理**：网络异常时会自动重试，但需要客户端处理超时

## 🔮 未来扩展

1. **数据库持久化**：实现会话和消息的数据库存储
2. **分布式会话**：支持Redis等外部存储
3. **更多记忆类型**：集成更多LangChain记忆组件
4. **插件系统**：支持自定义LangChain工具和代理
5. **多模态支持**：集成图像、音频等多模态能力

## 📈 监控和调试

### 查看会话统计
```bash
curl -X GET http://localhost:3001/api/ai/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 健康检查
```bash
curl -X GET http://localhost:3001/api/ai/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```

通过LangChain集成，我们的AI助手现在具备了真正的连续对话能力，能够记住之前的交流内容，提供更加智能和个性化的服务体验。 