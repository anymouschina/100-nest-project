# Simple Order Management System

An implementation for an Order Management System (OMS) for an e-commerce mobile app.
It allows users to manage their carts, place orders, view order details, and apply coupons.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Additional Features](#additional-features)
- [Dummy Data](#dummy-data)
- [Postman Collection](#postman-collection)

## Prerequisites

Make sure you have the following installed:

- [nodejs](https://nodejs.org/en/download/package-manager/current)
- npm
- [PostgreSQL](https://www.postgresql.org/download/)

## Getting Started

Follow these commands to install any dependency and setting up the Database.
Also filling some tables with dummy data.

```bash
git clone https://github.com/LORDyyyyy/simple-orderManagementSystem
npm install
```

Next you need to change the Database connection URL in the [.env](./.env) file

```bash
DATABASE_URL="postgresql://USERNAME:PASSWORD@HOST:PORT/DB_NAME?schema=public"
```

You can leave everything the same as it is in the file except the `USERNAME` and the `PASSWORD`.

Also you can change the Database provider from PostgreSQL to any other DBMS.
See [Prisma Documentation - Data sources](https://www.prisma.io/docs/orm/prisma-schema/overview/data-sources).
Don't forget to change the provider name in [prisma/schema.prisma](./prisma/schema.prisma).

---

Building the application and the Database:

```bash
npm run db:init
npm run build
npm run db:seed
```

Running the application:

```bash
npm run start:dev
```

Or in one step:

```bash
npm run start:all
```

Be careful from running this command multiple times, you will add the dummy data more than once.

## API Documentation

API endpoints are documented using Swagger. Once the server is running locally, access the documentation at:

```bash
http://localhost:3000/api-docs
```

## Additional Features

Here are the additional features that has been added to the application:

- Order History Retrieval for a specific users
  - Endpoint: `GET /api/users/:userId/orders`
- Applying Discounts and Coupons to orders
  - Endpoint: `POST /api/orders/apply-coupon`
- 一键预约功能
  - 提交预约申请: `POST /api/appointment/submit`
  - 获取用户所有预约: `GET /api/appointment/user`
  - 获取预约详情: `GET /api/appointment/:id`
- 订单取消与退款: `POST /api/orders/:id/cancel`
- 订单统计功能: 
  - 微服务模式: `order.getStatistics`
  - 支持按日、周、月、年维度统计: `timeRange` 参数可选值为 `day`, `week`, `month`, `year`
  - 支持自定义时间范围: `startDate` 和 `endDate` 参数
  - 返回数据格式适配echarts图表展示
- 小程序跳转二维码生成功能:
  - 生成二维码图片流: `GET /wechat/qrcode?page=pages/index/index&scene=ref%3D123456`
  - 生成二维码并返回URL: `POST /wechat/qrcode/url`
  - 支持携带ref参数作为场景，方便用于推广、分享、数据追踪等场景
- 用户登录认证功能:
  - 微信小程序登录: `POST /user/wxLogin`
  - Web端邮箱密码登录: `POST /user/webLogin`
  - Web端用户注册: `POST /user/register`
  - 用户退出登录: `GET /user/logout`
  - 获取用户信息: `GET /user/info`
  - 支持JWT Token认证
  - 完美兼容两种登录方式，统一的Token认证体系
  - 用户注册自动密码哈希保护
  - Web注册增强功能:
    - 严格的密码策略（大小写+数字组合）
    - 密码确认验证
    - 手机号格式验证
    - 注册时支持关联引荐码
    - 注册成功后自动登录
    - 详细的错误提示
    - 字段验证中文提示
- 用户引荐功能:
  - 关联引荐用户: `POST /api/user/referral`
  - 获取引荐用户统计: `GET /api/user/referral/stats?onlySelf=true`
  - 支持引荐码关联，记录引荐关系
  - 防止重复关联，避免关联自己
  - 通过UserReferral表记录完整引荐关系数据
  - 提供引荐数据统计，包括每个引荐码关联的用户数及下单用户数
  - 支持记录引荐来源和元数据，便于营销分析
  - 三表关联设计:
    - User: 用户基本信息，通过ref字段记录引荐码
    - ReferralCode: 系统管理的引荐码，支持描述和激活状态管理
    - UserReferral: 引荐关系记录，关联用户与引荐码，支持来源和元数据
  - 后台管理引荐码: `POST /admin/referral/code`
  - 引荐码微服务:
    - 创建引荐码: `referral.createCode`
    - 获取所有引荐码: `referral.getAllCodes`
    - 更新引荐码状态: `referral.updateCodeStatus`
    - 获取引荐统计数据: `referral.getStats`
- 微信聊天记录AI总结功能:
  - 基础功能:
    - 群聊记录总结: `POST /wechat-summary/summarize`
    - 智能时间范围总结: `POST /wechat-summary/smart-summary`
    - 获取群聊列表: `GET /wechat-summary/groups`
    - 健康检查: `GET /wechat-summary/health`
  - 高级分析功能:
    - 批量群聊分析: `POST /wechat-summary/batch-analysis`
    - 群聊对比分析: `POST /wechat-summary/comparison-analysis`
    - 热门话题分析: `GET /wechat-summary/trending-topics`
    - 活跃度统计: `GET /wechat-summary/activity-stats`
    - 导出总结报告: `POST /wechat-summary/export-summary`
  - 分析类型支持:
    - 日常总结 (daily): 整体聊天内容概览
    - 主题分析 (topic): 深度话题挖掘
    - 参与者分析 (participant): 用户行为分析
    - 群聊风格评价 (style_analysis): 氛围和风格分析
    - 情感分析 (sentiment_analysis): 情感倾向识别
    - 活跃度分析 (activity_analysis): 互动模式分析
    - 关键词提取 (keyword_extraction): 核心信息提取
    - 自定义分析 (custom): 用户自定义提示词
  - 技术特性:
    - 集成本地Ollama模型进行AI分析
    - 支持MCP协议查询微信聊天记录
    - 支持扩展时间范围：今天、昨天、本周、上周、本月、上月、本季度、上季度
    - 支持多语言分析（中文/英文）
    - 支持批量处理和对比分析
    - 支持多格式导出（JSON、Markdown、PDF）
    - 无需鉴权，可直接调用
- 智能聊天助手功能:
  - 基础功能:
    - 创建聊天会话: `POST /chat/session`
    - 发送聊天消息: `POST /chat/session/:sessionId/message`
    - 获取用户会话: `GET /chat/sessions`
    - 获取会话消息: `GET /chat/session/:sessionId`
    - 分析用户意图: `POST /chat/analyze`
    - 切换代理: `POST /chat/session/:sessionId/switch-agent`
  - 智能特性:
    - 语义理解: 基于向量相似度的用户意图分析
    - 多Agent支持: 根据意图自动选择最合适的Agent
    - 会话上下文管理: 保持连贯对话体验
    - 向量存储: 使用pgvector高效存储和检索消息语义
    - **智能上下文管理**: 基于LangChain/LangGraph最佳实践的上下文窗口管理
  - Agent类型:
    - 客服代理 (Customer Service): 处理订单查询、退款和一般问题
    - 技术支持代理 (Technical Support): 处理技术问题和投诉
    - 预约助手代理 (Appointment Assistant): 帮助用户安排、修改和取消预约
  - 上下文管理特性:
    - **智能消息裁剪**: 基于token限制和消息数量自动裁剪历史消息
    - **自动对话摘要**: 当消息超过阈值时自动生成对话摘要，保留关键信息
    - **上下文压缩**: 摘要+最近消息的混合策略，保持对话连贯性
    - **动态配置**: 不同Agent类型可配置不同的上下文管理策略
    - **性能优化**: 缓存摘要、异步处理、自动清理过期会话
  - 技术特性:
    - 基于LangGraph的多代理工作流
    - 集成Ollama本地LLM模型 (deepseek-r1)
    - RAG功能和条件路由支持
    - 工具调用和检索功能
    - 详细的LLM上下文打印和监控
    - 完整的错误处理和性能统计

## Dummy Data

Here are the dummy data that has been added to the tables `User`, `Product`, and `Coupons`.

### Product Table:

| name      | price | stock | description               | createdAt           |
| --------- | ----- | ----- | ------------------------- | ------------------- |
| Product A | 19.99 | 100   | Description for Product A | [Current Date/Time] |
| Product B | 29.99 | 150   | Description for Product B | [Current Date/Time] |
| Product C | 9.99  | 200   | Description for Product C | [Current Date/Time] |
| Product D | 39.99 | 120   | Description for Product D | [Current Date/Time] |
| Product E | 49.99 | 80    | Description for Product E | [Current Date/Time] |
| Product F | 59.99 | 60    | Description for Product F | [Current Date/Time] |
| Product G | 69.99 | 40    | Description for Product G | [Current Date/Time] |
| Product H | 79.99 | 30    | Description for Product H | [Current Date/Time] |
| Product I | 89.99 | 20    | Description for Product I | [Current Date/Time] |
| Product J | 99.99 | 10    | Description for Product J | [Current Date/Time] |

### User Table:

| name    | email               | password    | address                         | createdAt           |
| ------- | ------------------- | ----------- | ------------------------------- | ------------------- |
| Alice   | alice@example.com   | password123 | 123 Main St, City, Country      | 2023-01-01 10:00:00 |
| Bob     | bob@example.com     | password456 | 456 Elm St, Town, Country       | 2023-01-05 12:00:00 |
| Charlie | charlie@example.com | password789 | 789 Oak St, Village, Country    | 2023-01-10 15:00:00 |
| David   | david@example.com   | passwordabc | 321 Pine St, City, Country      | 2023-02-01 09:00:00 |
| Eve     | eve@example.com     | passwordefg | 654 Cedar St, Town, Country     | 2023-02-15 11:00:00 |
| Frank   | frank@example.com   | passwordxyz | 987 Birch St, Village, Country  | 2024-03-01 14:00:00 |
| Grace   | grace@example.com   | password123 | 246 Maple St, City, Country     | 2024-03-15 16:00:00 |
| Hannah  | hannah@example.com  | password456 | 135 Walnut St, Town, Country    | 2024-04-01 18:00:00 |
| Ian     | ian@example.com     | password789 | 864 Spruce St, Village, Country | 2024-04-15 19:00:00 |
| Jasmine | jasmine@example.com | passwordabc | 579 Fir St, City, Country       | 2024-05-01 20:00:00 |

#### Coupons Table:

| code          | discount | expireAt            | createdAt           |
| ------------- | -------- | ------------------- | ------------------- |
| SAVE10        | 10.0     | 2023-12-31 23:59:59 | 2023-01-01 10:00:00 |
| DISCOUNT20    | 20.0     | 2023-11-30 23:59:59 | 2023-01-05 12:00:00 |
| WELCOME15     | 15.0     | 2023-10-31 23:59:59 | 2023-01-10 15:00:00 |
| HOLIDAY30     | 30.0     | 2023-12-25 23:59:59 | 2023-02-01 09:00:00 |
| SPRING5       | 5.0      | 2024-03-01 23:59:59 | 2023-02-15 11:00:00 |
| SUMMER25      | 25.0     | 2024-09-01 23:59:59 | 2024-03-01 14:00:00 |
| FALL10        | 10.0     | 2024-11-01 23:59:59 | 2024-03-15 16:00:00 |
| WINTER50      | 50.0     | 2025-01-01 23:59:59 | 2024-04-01 18:00:00 |
| BLACKFRIDAY40 | 40.0     | 2024-11-29 23:59:59 | 2024-04-15 19:00:00 |
| CYBERMONDAY35 | 35.0     | 2024-12-02 23:59:59 | 2024-05-01 20:00:00 |

> Note: the first 5 coupons are expired.

## Postman Collection

A Postman collection is included to facilitate API testing.
To use it:

- Import the [OMS.postman_collection.json](./OMS.postman_collection.json) file into Postman.
- Ensure your local server is running.
- Execute the API requests defined in the collection to test the endpoints.

# 微信聊天总结系统

一个基于NestJS + LangChain + pgvector的智能聊天记录分析系统，支持无限上下文和向量知识库。

## 🚀 核心功能

### 📊 智能分析能力
- **多维度分析**: 日常总结、情感分析、主题分析、参与者分析、时间线分析等
- **语义理解**: 基于LangChain的深度语义分析
- **流式处理**: 实时反馈分析进度和结果

### 🧠 增强版功能 (NEW)
- **🔍 pgvector向量数据库**: 高性能向量存储和相似性搜索
- **♾️ 无限上下文窗口**: 突破token限制，支持长期对话历史
- **📚 向量知识库**: 自动存储和检索历史分析结果
- **🎯 智能上下文选择**: 语义相关性 + 时间相关性的混合策略
- **⚡ 嵌入缓存**: 避免重复计算，提升性能

## 🏗️ 技术架构

### 核心技术栈
- **后端框架**: NestJS + TypeScript
- **AI处理**: LangChain + Ollama (qwen3)
- **向量数据库**: PostgreSQL + pgvector
- **数据库ORM**: Prisma
- **嵌入模型**: OpenAI text-embedding-3-small (1536维)
- **数据源**: Chatlog HTTP API

### 向量数据库架构
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   聊天消息      │    │   向量知识库     │    │   上下文窗口    │
│ ChatMessage     │    │ VectorKnowledge  │    │ ContextWindow   │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ • 消息内容      │    │ • 摘要内容       │    │ • 智能筛选      │
│ • 向量嵌入      │    │ • 历史知识       │    │ • 相关性评分    │
│ • 语义搜索      │    │ • 主题标签       │    │ • Token管理     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📋 数据模型

### 向量数据库表结构
- **chat_messages**: 聊天消息向量存储
- **message_chunks**: 长消息分块处理
- **chat_summaries**: 分析结果向量存储
- **vector_knowledge**: 通用向量知识库
- **context_windows**: 上下文窗口缓存
- **embedding_cache**: 嵌入向量缓存

## 🔧 环境配置

### 必需服务
```bash
# PostgreSQL + pgvector
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Chatlog HTTP服务
CHATLOG_BASE_URL=http://localhost:5030

# Ollama服务
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3

# OpenAI API (用于向量嵌入)
OPENAI_API_KEY=your_openai_api_key
```

### 数据库初始化
```bash
# 安装依赖
pnpm install

# 启用pgvector扩展
psql -d your_database -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 运行数据库迁移
pnpm prisma db push

# 启动服务
pnpm start:dev
```

## 📊 API端点

### 🆕 增强版API (推荐)

#### 1. 增强版智能总结
```http
POST /wechat-summary/enhanced-summary
Content-Type: application/json

{
  "groupName": "工作群",
  "specificDate": "2024-01-15",
  "summaryType": "daily",
  "useInfiniteContext": true,
  "contextWindowType": "hybrid",
  "maxContextTokens": 16000,
  "useKnowledgeBase": true,
  "knowledgeNamespaces": ["summaries", "chat_history", "topics"]
}
```

**特性:**
- 🧠 **无限上下文**: 最大支持16K tokens上下文窗口
- 📚 **知识库整合**: 自动检索相关历史知识
- 🎯 **智能筛选**: 混合语义和时间相关性
- 📊 **详细元数据**: 处理时间、向量搜索结果等统计信息

#### 2. 增强版流式总结
```http
POST /wechat-summary/enhanced-summary-stream
Content-Type: application/json

{
  "groupName": "团队群",
  "relativeTime": "today",
  "summaryType": "sentiment_analysis",
  "useInfiniteContext": true,
  "useKnowledgeBase": true
}
```

**特性:**
- ⚡ **实时反馈**: 显示向量存储、上下文构建、知识检索进度
- 🔄 **流式输出**: 实时显示AI分析过程
- 💾 **自动存储**: 分析结果自动存储到向量知识库

#### 3. 向量语义搜索
```http
POST /wechat-summary/vector-search
Content-Type: application/json

{
  "query": "今天讨论了什么重要话题",
  "groupName": "工作群",
  "limit": 10,
  "threshold": 0.7,
  "timeRange": {
    "start": "2024-01-15T00:00:00Z",
    "end": "2024-01-15T23:59:59Z"
  }
}
```

#### 4. 知识库搜索
```http
POST /wechat-summary/knowledge-search
Content-Type: application/json

{
  "query": "项目进展 总结",
  "namespace": "summaries",
  "tags": ["工作", "项目"],
  "limit": 5,
  "threshold": 0.75
}
```

#### 5. 构建无限上下文窗口
```http
POST /wechat-summary/build-context
Content-Type: application/json

{
  "query": "今天的主要讨论内容",
  "groupName": "工作群",
  "maxTokens": 8000,
  "windowType": "hybrid"
}
```

### 传统API (兼容)
- `POST /wechat-summary/langchain-summary` - 原版LangChain总结
- `POST /wechat-summary/langchain-summary-stream` - 原版流式总结

## 🎯 上下文窗口类型

### 1. 语义窗口 (semantic)
- 基于向量相似性选择最相关的消息
- 适合主题集中的分析场景
- 高相关性，但可能缺失时间连续性

### 2. 滑动窗口 (sliding)
- 选择最近的消息，保持时间连续性
- 适合时间敏感的分析场景
- 时间连续，但可能包含不相关内容

### 3. 混合窗口 (hybrid) - 推荐
- 50%语义相关 + 50%时间相关
- 平衡相关性和连续性
- 适合大多数分析场景

## 📈 性能优化

### 向量嵌入优化
- **嵌入缓存**: 避免重复计算相同内容的向量
- **批量处理**: 支持批量生成嵌入向量
- **智能去重**: 基于内容哈希的去重机制

### 上下文管理
- **动态Token管理**: 根据模型上下文窗口自动调整
- **智能采样**: 基于重要性评分的消息筛选
- **分块处理**: 长消息自动分块存储和检索

### 数据库优化
- **向量索引**: pgvector的HNSW索引加速相似性搜索
- **复合索引**: 群聊名称、时间戳、标签的复合索引
- **连接池**: PostgreSQL连接池管理

## 🧪 测试

### 运行增强版功能测试
```bash
node test-enhanced-langchain.js
```

### 测试覆盖
- ✅ 增强版智能总结
- ✅ 增强版流式总结  
- ✅ 向量语义搜索
- ✅ 知识库搜索
- ✅ 无限上下文窗口构建
- ✅ 多种分析类型 (情感、时间线等)

## 🔍 使用示例

### 基础增强版总结
```bash
curl -X POST "http://localhost:3001/wechat-summary/enhanced-summary" \
  -H "Content-Type: application/json" \
  -d '{
    "groupName": "工作群",
    "relativeTime": "today",
    "summaryType": "daily",
    "useInfiniteContext": true,
    "useKnowledgeBase": true
  }'
```

### 流式分析
```bash
curl -X POST "http://localhost:3001/wechat-summary/enhanced-summary-stream" \
  -H "Content-Type: application/json" \
  -d '{
    "groupName": "团队群",
    "specificDate": "2024-01-15",
    "summaryType": "sentiment_analysis",
    "contextWindowType": "hybrid",
    "maxContextTokens": 16000
  }' \
  --no-buffer
```

### 向量搜索
```bash
curl -X POST "http://localhost:3001/wechat-summary/vector-search" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "项目进展讨论",
    "groupName": "工作群",
    "limit": 5,
    "threshold": 0.7
  }'
```

## 🎨 响应格式

### 增强版分析结果
```json
{
  "success": true,
  "data": {
    "summary": "今日群聊主要讨论了...",
    "keyPoints": ["关键点1", "关键点2"],
    "participants": ["张三", "李四"],
    "topics": ["项目", "技术"],
    "relatedKnowledge": [
      {
        "id": "knowledge_id",
        "content": "相关历史知识...",
        "similarity": 0.85,
        "namespace": "summaries"
      }
    ],
    "contextUsed": {
      "tokenCount": 8500,
      "messageCount": 150,
      "relevanceScore": 0.92,
      "windowType": "hybrid"
    },
    "metadata": {
      "processingTime": 3500,
      "vectorSearchResults": 25,
      "knowledgeBaseHits": 8,
      "originalMessageCount": 300,
      "optimizedMessageCount": 150
    }
  }
}
```

## 🔧 故障排除

### 常见问题

1. **pgvector扩展未安装**
   ```bash
   # Ubuntu/Debian
   sudo apt install postgresql-14-pgvector
   
   # 在数据库中启用
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. **OpenAI API配置**
   ```bash
   # 设置环境变量
   export OPENAI_API_KEY="your_api_key_here"
   ```

3. **向量维度不匹配**
   - 确保使用text-embedding-3-small模型 (1536维)
   - 检查数据库中的向量字段定义

4. **内存不足**
   - 调整maxContextTokens参数
   - 使用更小的批处理大小

## 🚀 部署建议

### 生产环境配置
- **数据库**: 使用专用PostgreSQL实例，启用pgvector
- **向量索引**: 创建适当的HNSW索引
- **缓存**: 配置Redis缓存嵌入结果
- **监控**: 监控向量搜索性能和准确性

### 扩展性考虑
- **水平扩展**: 支持多个Ollama实例负载均衡
- **向量分片**: 大规模数据可考虑向量数据分片
- **异步处理**: 长时间分析任务使用队列异步处理

## 📚 技术文档

- [Prisma Schema设计](./prisma/schema.prisma)
- [向量服务实现](./src/wechat-summary/vector.service.ts)
- [增强版LangChain服务](./src/wechat-summary/enhanced-langchain.service.ts)
- [API控制器](./src/wechat-summary/wechat-summary.controller.ts)

## 🤝 贡献指南

欢迎提交Issue和Pull Request来改进这个项目！

## 📄 许可证

MIT License

# Application Server

这是一个基于NestJS框架的应用服务器，支持多种功能包括用户管理、订单处理、聊天机器人等。

## 功能列表

- 用户管理（注册、登录、个人信息管理）
- 订单管理（创建、更新、查询）
- 产品目录（产品信息、库存管理）
- 购物车功能（添加、删除、更新）
- 微信登录集成
- 预约服务管理
- 优惠券系统
- 推荐系统（用户推荐与跟踪）
- 聊天机器人系统（多代理智能对话）

## LangGraph多代理聊天机器人

该项目实现了基于LangGraph和LangChain的多代理对话系统，主要特点包括：

### 系统架构

- **多代理协作**：根据用户问题智能切换不同专业领域的代理
- **工具调用能力**：支持代理通过工具API获取实时信息
- **MCP协议支持**：通过Model Context Protocol与外部工具和服务通信
- **Ollama集成**：使用本地Ollama运行deepseek-r1模型，提供低延迟响应

### 代理类型

系统内置了多种专业代理：

- **通用客服助手**：处理一般性问题
- **产品专家**：提供详细产品信息和建议
- **预约服务助手**：处理与预约相关的请求和问题
- **客户服务代表**：处理投诉和售后服务问题

### 简化版实现

由于TypeScript与LangGraph的类型系统兼容性问题，我们提供了两个版本的实现：

1. **完整版实现** - NestJS服务集成版，支持多代理和完整功能
2. **简化版实现** - 命令行测试版，演示基本工具调用和对话功能

简化版可以通过以下命令运行：

```bash
npx ts-node scripts/simple-chat.ts
```

这个简化版实现具有以下功能：

- 使用Ollama的deepseek-r1模型
- 支持基本工具调用(当前时间、计算器)
- 完整对话历史管理
- 流程化的工具执行和结果处理

## 安装与运行

```bash
# 安装依赖
pnpm install

# 数据库迁移
npx prisma migrate dev

# 启动服务
pnpm start:dev

# 测试聊天脚本(简化版)
npx ts-node scripts/simple-chat.ts
```

## 环境变量

创建一个`.env`文件，包含以下环境变量：

```
DATABASE_URL="postgresql://username:password@localhost:5432/mydatabase?schema=public"
PORT=3001
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=30d
WECHAT_APP_ID=your-wechat-app-id
WECHAT_APP_SECRET=your-wechat-app-secret
OLLAMA_BASE_URL=http://localhost:11434
DEFAULT_LLM_MODEL=deepseek-r1
ENABLE_LANGGRAPH=true
```

## API接口

### 聊天接口

- `POST /chat/sessions` - 创建新的聊天会话
- `GET /chat/sessions` - 获取用户的所有会话
- `GET /chat/sessions/:id` - 获取单个会话详情
- `POST /chat/sessions/:id/messages` - 发送消息到会话
- `PUT /chat/sessions/:id/end` - 结束会话

## 已知问题和解决方案

当前实现中存在以下已知问题：

1. **TypeScript类型系统与LangGraph兼容性**：LangGraph的TypeScript类型定义与我们的实现存在兼容性问题，导致编译错误。为解决此问题，我们提供了简化版实现，稍后将完善类型定义。

2. **工具调用格式**：当前工具调用依赖于文本模式匹配，未来将迁移到更结构化的工具调用格式。

3. **MCP协议集成**：当前MCP协议支持处于模拟状态，将在后续版本中完善实际调用逻辑。

## 开发指南

### 添加新代理

在`src/chat/services/agent-factory.service.ts`中的`initializeDefaultAgents`方法中添加新的代理定义：

```typescript
{
  id: 'your-agent-id',
  name: '代理名称',
  description: '代理描述',
  type: 'your_type',
  systemPrompt: '系统提示...',
  capabilities: ['capability1', 'capability2']
}
```

### 添加新工具

在`src/chat/services/tool-registry.service.ts`中的`registerBuiltInTools`方法中注册新工具：

```typescript
this.registerTool(
  new DynamicTool({
    name: 'tool_name',
    description: '工具描述',
    func: async (args) => {
      // 工具实现
      return result;
    }
  }),
  'category'
);
```
