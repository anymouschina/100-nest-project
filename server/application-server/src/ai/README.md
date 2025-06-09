# AI智能助手模块

基于《谷歌提示工程白皮书》的专业AI助手模块，集成Moonshot AI，提供提示词优化和智能对话功能。

## 🚀 最新更新 (v2.0)

### 新增功能
- **完整数据持久化**: 会话和消息数据完全持久化到PostgreSQL数据库
- **智能缓存机制**: 内存+数据库双层缓存，提升响应速度
- **自动会话管理**: 定时清理过期会话，防止内存泄漏
- **重试机制**: 指数退避重试策略，提高服务可靠性
- **会话限制**: 用户会话数量限制，自动清理最旧会话
- **错误恢复**: 服务重启后自动恢复活跃会话
- **性能监控**: 详细的日志记录和错误追踪

### 架构改进
- **分层数据存储**: 热数据在内存，冷数据在数据库
- **异步处理**: 所有数据库操作异步化，不阻塞用户体验
- **优雅降级**: 数据库异常时不影响核心对话功能
- **资源管理**: 自动清理过期资源，优化内存使用

## 功能特性

### 🎯 核心功能
- **智能对话**: 支持上下文记忆的多轮对话
- **提示词优化**: 基于谷歌提示工程白皮书的专业优化
- **质量分析**: 多维度提示词质量评估
- **知识库**: 可扩展的AI知识管理系统
- **会话管理**: 完整的会话生命周期管理
- **用户偏好**: 个性化设置和偏好记忆

### 🛠️ 优化策略
- **基础优化**: 明确性、结构化、上下文增强
- **角色扮演**: 专业角色定义和背景设定
- **Few-shot学习**: 示例驱动的格式指导
- **思维链推理**: 步骤化的推理过程
- **领域专业化**: 特定领域的专业优化
- **多模态支持**: 文本、图像等多种输入类型

### 🔧 技术特性
- **数据持久化**: PostgreSQL + Prisma ORM
- **内存管理**: 智能缓存 + 定时清理
- **错误处理**: 重试机制 + 优雅降级
- **性能优化**: 异步处理 + 批量操作
- **监控日志**: 详细的操作日志和错误追踪
- **定时任务**: 自动清理过期数据

## 数据库设计

### 表结构
```sql
-- 聊天会话表
ChatSession {
  sessionId    String   @id
  userId       Int
  title        String
  createdAt    DateTime
  updatedAt    DateTime
  messageCount Int
}

-- 聊天消息表
ChatMessage {
  id          Int      @id
  sessionId   String
  userId      Int
  userMessage String
  aiResponse  String
  createdAt   DateTime
}

-- 用户偏好表
UserPreference {
  id          Int  @id
  userId      Int  @unique
  preferences Json
  createdAt   DateTime
  updatedAt   DateTime
}
```

### 索引优化
- `ChatSession`: userId, updatedAt
- `ChatMessage`: sessionId, userId, createdAt
- `UserPreference`: userId (unique)

## API接口

### 聊天对话
```http
POST /api/ai/chat
Content-Type: application/json
Authorization: Bearer <token>

{
  "message": "请帮我优化这个提示词：写一篇文章",
  "sessionId": "session_123", // 可选，不提供则创建新会话
  "context": "这是为了营销目的" // 可选
}
```

**响应示例:**
```json
{
  "response": "我来帮您优化这个提示词...",
  "sessionId": "session_1701234567890_abc123",
  "messageCount": 5,
  "usage": {
    "promptTokens": 150,
    "completionTokens": 300,
    "totalTokens": 450
  },
  "context": {
    "memoryType": "buffer",
    "conversationLength": 5
  }
}
```

### 会话管理
```http
# 创建新会话
POST /api/ai/sessions
{
  "title": "提示词优化咨询",
  "initialMessage": "你好，我需要优化提示词"
}

# 获取用户所有会话
GET /api/ai/sessions

# 获取会话详情
GET /api/ai/sessions/{sessionId}

# 更新会话
PUT /api/ai/sessions/{sessionId}
{
  "title": "新的会话标题"
}

# 删除会话
DELETE /api/ai/sessions/{sessionId}

# 清空所有会话
DELETE /api/ai/sessions
```

### 用户偏好设置
```http
# 设置偏好
POST /api/ai/preferences
{
  "language": "zh",
  "responseStyle": "professional",
  "maxResponseLength": 2000,
  "preferredOptimizationTypes": ["role-based", "few-shot"],
  "memoryType": "summary_buffer",
  "maxTokens": 4000,
  "maxHistoryMessages": 20
}

# 获取偏好
GET /api/ai/preferences
```

### 统计信息
```http
# 获取使用统计
GET /api/ai/stats

# 检查服务健康状态
GET /api/ai/health
```

## 配置说明

### 环境变量
```env
# Moonshot AI配置
AI_MOONSHOT_API_KEY=your_api_key
AI_MOONSHOT_BASE_URL=https://api.moonshot.cn/v1
AI_MOONSHOT_MODEL=moonshot-v1-8k

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/database
```

### 服务配置
```typescript
// 会话配置
SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24小时
MAX_SESSIONS_PER_USER = 50; // 每用户最大会话数

// 定时任务
@Cron('0 */6 * * *') // 每6小时清理一次过期会话
```

## 性能优化

### 内存管理
- **会话缓存**: 活跃会话保存在内存中，提升响应速度
- **自动清理**: 定时清理过期会话，防止内存泄漏
- **数量限制**: 限制每用户最大会话数，自动清理最旧会话

### 数据库优化
- **异步操作**: 所有数据库操作异步化，不阻塞用户体验
- **批量处理**: 支持批量删除和更新操作
- **索引优化**: 针对查询模式优化数据库索引

### 错误处理
- **重试机制**: 指数退避重试策略，最多重试3次
- **优雅降级**: 数据库异常时不影响核心对话功能
- **错误恢复**: 服务重启后自动恢复活跃会话

## 监控和日志

### 日志级别
- **DEBUG**: 详细的操作日志
- **INFO**: 重要的状态变更
- **WARN**: 可恢复的错误
- **ERROR**: 严重错误和异常

### 监控指标
- 会话创建/删除数量
- 消息发送成功率
- 平均响应时间
- 错误率统计
- 内存使用情况

## 部署说明

### 数据库迁移
```bash
# 生成Prisma客户端
npx prisma generate

# 应用数据库迁移
npx prisma migrate deploy

# 查看数据库状态
npx prisma migrate status
```

### 服务启动
```bash
# 开发环境
npm run start:dev

# 生产环境
npm run start:prod
```

### 健康检查
```bash
# 检查AI服务状态
curl http://localhost:3000/api/ai/health

# 检查数据库连接
curl http://localhost:3000/api/ai/stats
```

## 故障排除

### 常见问题

1. **会话丢失**
   - 检查数据库连接
   - 查看服务重启日志
   - 验证会话ID格式

2. **响应缓慢**
   - 检查数据库性能
   - 查看内存使用情况
   - 优化查询索引

3. **API调用失败**
   - 验证API密钥
   - 检查网络连接
   - 查看重试日志

### 日志查看
```bash
# 查看服务日志
docker logs application-server

# 查看特定模块日志
grep "ChatService" logs/application.log

# 查看错误日志
grep "ERROR" logs/application.log
```

## 开发指南

### 添加新功能
1. 更新Prisma schema
2. 生成数据库迁移
3. 实现服务层逻辑
4. 添加控制器接口
5. 更新文档

### 测试
```bash
# 单元测试
npm run test

# 集成测试
npm run test:e2e

# 测试覆盖率
npm run test:cov
```

### 代码规范
- 使用TypeScript严格模式
- 遵循ESLint规则
- 添加适当的注释
- 编写单元测试

## 版本历史

### v2.0.0 (2024-12-08)
- ✅ 完整数据持久化实现
- ✅ 智能缓存机制
- ✅ 自动会话管理
- ✅ 重试机制和错误处理
- ✅ 性能监控和日志

### v1.0.0 (2024-12-01)
- ✅ 基础对话功能
- ✅ 提示词优化
- ✅ 知识库系统
- ✅ 用户偏好设置

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License 