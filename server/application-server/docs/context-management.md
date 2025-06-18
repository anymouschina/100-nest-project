# 聊天上下文管理系统

## 概述

基于LangChain/LangGraph官方最佳实践实现的智能上下文管理系统，解决长对话中的上下文窗口限制问题。

## 核心功能

### 1. 智能消息裁剪 (trimMessages)
- **基于token限制**: 自动计算消息token数量，保持在模型限制内
- **基于消息数量**: 限制消息历史的最大条数
- **保留重要消息**: 优先保留系统消息和最近的用户交互

### 2. 自动对话摘要 (Auto-Summarization)
- **触发条件**: 当消息数量超过阈值时自动生成摘要
- **保留策略**: 保留最近N条消息，对历史消息生成摘要
- **摘要质量**: 保留关键信息、用户需求、解决方案和待处理事项

### 3. 上下文压缩 (Context Compression)
- **混合策略**: 摘要 + 最近消息的组合模式
- **智能过滤**: 移除冗余信息，保留核心上下文
- **动态调整**: 根据对话复杂度动态调整压缩策略

## 配置参数

```typescript
interface ContextConfig {
  maxMessages: number;        // 最大消息数量 (默认: 50)
  maxTokens: number;         // 最大token数量 (默认: 4000)
  keepSystemMessage: boolean; // 保留系统消息 (默认: true)
  enableSummary: boolean;    // 启用摘要功能 (默认: true)
  summaryThreshold: number;  // 摘要触发阈值 (默认: 20)
  preserveLastN: number;     // 保留最后N条消息 (默认: 10)
}
```

## API使用示例

### 基本使用

```typescript
// 获取会话的优化上下文
const contextWindow = await contextManager.getSessionContext(sessionId, {
  maxMessages: 30,
  maxTokens: 3000,
  enableSummary: true,
  summaryThreshold: 15,
});

console.log(`消息数: ${contextWindow.messages.length}`);
console.log(`是否裁剪: ${contextWindow.trimmed}`);
console.log(`摘要: ${contextWindow.summary}`);
```

### 高级使用

```typescript
// 获取优化的消息历史用于LLM调用
const optimizedHistory = await contextManager.getOptimizedHistory(
  sessionId,
  '你是一个专业的客服代理', // 系统提示
  {
    maxMessages: 25,
    maxTokens: 2500,
    enableSummary: true,
    summaryThreshold: 12,
    preserveLastN: 8,
  }
);

// 直接用于LLM调用
const response = await llm.chat(optimizedHistory, userMessage);
```

## 实现原理

### 1. 消息分类和优先级

```
优先级排序:
1. 系统消息 (最高优先级)
2. 生成的摘要消息
3. 最近的用户-AI交互
4. 历史消息 (可被摘要替换)
```

### 2. Token估算算法

```typescript
// 简化的token估算 (中文优化)
const estimateTokens = (text: string) => {
  return Math.ceil(text.length * 0.75); // 中文字符约0.75 token
};
```

### 3. 摘要生成策略

```
摘要内容包括:
- 用户的核心需求和问题
- AI提供的解决方案
- 重要的业务信息 (联系方式、价格等)
- 未完成的任务或待处理事项
- 用户的个人信息 (姓名、偏好等)
```

## 性能优化

### 1. 缓存策略
- 会话摘要缓存到数据库
- 避免重复生成相同的摘要
- 增量更新摘要内容

### 2. 异步处理
- 摘要生成采用异步模式
- 不阻塞主要的对话流程
- 后台清理过期会话数据

### 3. 内存管理
- 自动清理超过30天的会话
- 压缩历史消息存储
- 优化数据库查询性能

## 监控和调试

### 1. 日志记录
```typescript
// 详细的上下文处理日志
this.logger.log(`开始消息裁剪，原始消息数: ${messages.length}`);
this.logger.log(`生成摘要，摘要消息数: ${summarized.length}，保留消息数: ${recent.length}`);
this.logger.log(`消息裁剪完成，最终消息数: ${final.length}，预估tokens: ${tokens}`);
```

### 2. 性能指标
- 消息处理时间
- 摘要生成耗时
- Token使用统计
- 内存使用情况

### 3. 错误处理
- 摘要生成失败的降级策略
- Token估算错误的容错机制
- 数据库操作异常处理

## 最佳实践

### 1. 配置建议

```typescript
// 客服场景
const customerServiceConfig = {
  maxMessages: 30,
  maxTokens: 3000,
  summaryThreshold: 15,
  preserveLastN: 10,
};

// 技术支持场景
const technicalSupportConfig = {
  maxMessages: 40,
  maxTokens: 4000,
  summaryThreshold: 20,
  preserveLastN: 12,
};

// 销售咨询场景
const salesConfig = {
  maxMessages: 35,
  maxTokens: 3500,
  summaryThreshold: 18,
  preserveLastN: 15,
};
```

### 2. 集成建议

1. **在ChatService中集成**:
   ```typescript
   // 获取优化的消息历史
   const optimizedHistory = await this.contextManager.getOptimizedHistory(
     sessionId,
     agent.systemPrompt,
     agentSpecificConfig
   );
   ```

2. **在AgentFactory中集成**:
   ```typescript
   // 在代理调用前优化上下文
   const context = await this.contextManager.trimMessages(messageHistory);
   const result = await agent.invoke(context.messages, userMessage);
   ```

3. **定期维护**:
   ```typescript
   // 定时清理旧会话
   await this.contextManager.cleanupOldSessions(30); // 保留30天
   ```

## 测试验证

运行测试脚本验证功能:

```bash
# 编译TypeScript
npm run build

# 运行上下文管理测试
npx ts-node scripts/test-context-management.ts
```

测试将验证:
- ✅ 消息裁剪功能
- ✅ 自动摘要生成
- ✅ 上下文压缩效果
- ✅ 长对话处理能力
- ✅ 记忆保持效果

## 未来改进

### 1. 智能摘要
- 使用更先进的摘要模型
- 基于重要性的内容筛选
- 多轮对话的语义理解

### 2. 个性化配置
- 基于用户行为的动态调整
- 不同代理类型的专用配置
- 业务场景的自适应优化

### 3. 高级压缩
- 语义相似性去重
- 关键信息提取
- 上下文相关性分析

---

*本系统基于LangChain/LangGraph官方最佳实践构建，确保了生产环境的稳定性和可扩展性。* 