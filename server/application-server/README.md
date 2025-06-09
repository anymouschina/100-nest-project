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
http://localhost:3001/api-docs
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
- 用户认证模块:
    - 用户登录: `POST /api/auth/login`
    - 用户注册: `POST /api/auth/register`
    - 用户登出: `POST /api/auth/logout`
    - 获取用户信息: `GET /api/auth/profile`
    - 修改密码: `PUT /api/auth/password`
    - 验证令牌: `GET /api/auth/verify`
    - 游客登录: `POST /api/auth/guest-login` (用于快速体验AI功能)
    - 支持JWT令牌认证，包含访问令牌和刷新令牌
    - 密码加密存储，使用bcrypt算法
    - 令牌黑名单机制，支持安全登出
    - 游客模式，无需注册即可体验AI功能
- AI智能助手模块:
    - 智能对话聊天: `POST /api/ai/chat`
    - 提示词优化: `POST /api/ai/optimize`
    - 提示词质量分析: `POST /api/ai/analyze`
    - 批量提示词优化: `POST /api/ai/batch-optimize`
    - 会话管理: `GET/POST/PUT/DELETE /api/ai/sessions`
    - 用户偏好设置: `GET/POST /api/ai/preferences`
    - 使用统计: `GET /api/ai/stats`
    - AI模型列表: `GET /api/ai/models`
    - 服务健康检查: `GET /api/ai/health`
    - 提示词模板: `GET /api/ai/templates`
    - 知识库管理: `GET /api/ai/knowledge`
    - 知识库搜索: `GET /api/ai/knowledge/search`
    - **LangChain集成**：使用LangChain框架实现高级对话管理
    - **会话记忆**：支持BufferMemory和ConversationSummaryBufferMemory
    - **连续对话**：自动维护对话上下文，实现真正的连续性交流
    - **智能记忆管理**：根据用户偏好选择不同的记忆策略
    - 基于《谷歌提示工程白皮书》的专业提示词优化
    - 支持多种优化策略：基础优化、角色扮演、Few-shot学习、思维链推理、领域专业化、多模态支持
    - 集成Moonshot AI，提供高质量的中文对话能力
    - 智能知识库系统，支持无限扩展依赖数据
    - 对话上下文管理，支持长期记忆和个性化偏好
    - 提示词质量评分系统，包含清晰度、具体性、完整性、一致性、有效性等维度
    - 需要用户认证，支持游客模式快速体验

## AI模块完善记录 (v2.0)

### 完善背景
在2024年12月的开发过程中，对AI智能助手模块进行了全面的架构升级和功能完善，从v1.0的基础版本升级到v2.0的企业级版本。

### 原有架构分析

**优点**:
- 架构设计优秀，职责分离明确
- 功能丰富完整，支持多轮对话和提示词优化
- 技术栈先进，使用LangChain框架
- 用户体验友好，支持会话管理

**缺点**:
- 数据持久化不完整，只有占位符实现
- 内存管理风险，会话数据完全在内存中
- 错误处理不够健壮，缺乏重试机制
- 性能优化空间，没有缓存机制
- 代码质量问题，存在格式错误

### 完善实施过程

#### 1. 数据库模型设计
在`prisma/schema.prisma`中新增三个核心模型：

```prisma
model ChatSession {
  id          String   @id @default(cuid())
  sessionId   String   @unique
  userId      String
  title       String?
  isActive    Boolean  @default(true)
  lastActiveAt DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages    ChatMessage[]
  
  @@map("chat_sessions")
}

model ChatMessage {
  id          String   @id @default(cuid())
  sessionId   String
  role        String   // 'user' | 'assistant' | 'system'
  content     String
  metadata    Json?    // 存储额外信息如模型、token数等
  createdAt   DateTime @default(now())
  
  session     ChatSession @relation(fields: [sessionId], references: [sessionId], onDelete: Cascade)
  
  @@map("chat_messages")
}

model UserPreference {
  id          String   @id @default(cuid())
  userId      String   @unique
  preferences Json     // 存储用户偏好设置
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  user        User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("user_preferences")
}
```

#### 2. ChatService核心升级

**新增功能特性**:
- **完整数据持久化**: 所有会话和消息数据保存到PostgreSQL数据库
- **智能缓存机制**: 内存+数据库双层缓存，热数据在内存，冷数据在数据库
- **自动会话管理**: 定时清理过期会话（每6小时执行一次）
- **重试机制**: 指数退避重试策略，最多3次重试
- **会话限制**: 每用户最多50个会话，自动清理最旧会话
- **错误恢复**: 服务重启后自动恢复活跃会话到内存

**架构改进**:
```typescript
// 核心常量配置
private readonly SESSION_TIMEOUT = 6 * 60 * 60 * 1000; // 6小时
private readonly MAX_SESSIONS_PER_USER = 50;

// 定时清理任务
@Cron('0 */6 * * *') // 每6小时执行一次
async cleanupExpiredSessions() {
  // 自动清理过期会话逻辑
}

// 服务初始化
async onModuleInit() {
  await this.initializeService();
}
```

**核心方法重构**:
- `sendMessage()`: 添加重试机制和会话限制检查
- `getUserPreferences()`: 改为异步方法，支持数据库持久化
- `setUserPreferences()`: 支持upsert操作，自动创建或更新
- 新增多个私有方法处理数据库操作和缓存管理

#### 3. 数据库迁移执行
```bash
npx prisma migrate dev --name add-ai-models
```
成功创建并应用数据库迁移，生成新的Prisma客户端。

#### 4. 模块配置更新
在`ai.module.ts`中添加定时任务支持：
```typescript
@Module({
  imports: [
    ScheduleModule.forRoot(), // 支持定时任务
    // ... 其他导入
  ],
  // ...
})
```

#### 5. 类型安全处理
解决TypeScript类型识别问题，使用类型断言确保新Prisma模型的正确访问：
```typescript
(this.databaseService as any).chatSession
(this.databaseService as any).chatMessage  
(this.databaseService as any).userPreference
```

#### 6. 代码质量优化
- 修复所有ESLint警告
- 优化未使用变量处理
- 统一代码格式
- 简化参数传递

### v2.0版本新特性

#### 数据持久化
- **PostgreSQL存储**: 所有聊天数据持久化存储
- **关联设计**: 用户-会话-消息三层关联
- **级联删除**: 用户删除时自动清理相关数据

#### 智能缓存系统
- **双层缓存**: 内存缓存热数据，数据库存储全量数据
- **自动同步**: 内存和数据库数据自动同步
- **性能优化**: 减少数据库查询，提升响应速度

#### 自动资源管理
- **定时清理**: 每6小时自动清理过期会话
- **会话限制**: 防止单用户占用过多资源
- **内存管理**: 智能管理内存中的会话数据

#### 高可靠性保障
- **重试机制**: 指数退避算法，最多3次重试
- **错误恢复**: 服务重启后自动恢复活跃会话
- **异常处理**: 完善的错误处理和日志记录

#### 性能监控
- **详细日志**: 记录所有关键操作
- **统计信息**: 会话数量、消息数量等统计
- **健康检查**: 服务状态实时监控

### 提示词优化API完整示例

#### 1. 基础优化
```bash
curl -X POST http://localhost:3001/api/ai/optimize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prompt": "写一篇关于人工智能的文章",
    "optimizationType": "basic",
    "context": "技术博客"
  }'
```

#### 2. 角色扮演优化
```bash
curl -X POST http://localhost:3001/api/ai/optimize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prompt": "解释量子计算的原理",
    "optimizationType": "rolePlay",
    "context": "面向高中生的科普文章",
    "additionalParams": {
      "role": "资深物理学教授",
      "audience": "高中生",
      "tone": "通俗易懂"
    }
  }'
```

#### 3. Few-shot学习优化
```bash
curl -X POST http://localhost:3001/api/ai/optimize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prompt": "分析这个产品的优缺点",
    "optimizationType": "fewShot",
    "context": "电商产品评价",
    "additionalParams": {
      "examples": [
        {
          "input": "iPhone 15 Pro",
          "output": "优点：性能强劲、拍照优秀、生态完善；缺点：价格昂贵、充电速度一般"
        }
      ]
    }
  }'
```

#### 4. 思维链推理优化
```bash
curl -X POST http://localhost:3001/api/ai/optimize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prompt": "计算复合利率问题",
    "optimizationType": "chainOfThought",
    "context": "数学解题",
    "additionalParams": {
      "stepByStep": true,
      "showReasoning": true
    }
  }'
```

#### 5. 领域专业化优化
```bash
curl -X POST http://localhost:3001/api/ai/optimize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prompt": "诊断网络连接问题",
    "optimizationType": "domainSpecific",
    "context": "IT技术支持",
    "additionalParams": {
      "domain": "网络技术",
      "expertiseLevel": "高级",
      "technicalTerms": true
    }
  }'
```

#### 6. 多模态支持优化
```bash
curl -X POST http://localhost:3001/api/ai/optimize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prompt": "描述这张图片的内容",
    "optimizationType": "multiModal",
    "context": "图像分析",
    "additionalParams": {
      "modalities": ["text", "image"],
      "detailLevel": "detailed"
    }
  }'
```

#### 7. 提示词质量分析
```bash
curl -X POST http://localhost:3001/api/ai/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prompt": "写一篇关于人工智能的文章",
    "context": "技术博客"
  }'
```

#### 8. 批量优化
```bash
curl -X POST http://localhost:3001/api/ai/batch-optimize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prompts": [
      {
        "prompt": "解释机器学习",
        "optimizationType": "basic",
        "context": "教育"
      },
      {
        "prompt": "分析市场趋势",
        "optimizationType": "domainSpecific",
        "context": "商业分析"
      }
    ]
  }'
```

#### 9. 获取优化模板
```bash
curl -X GET "http://localhost:3001/api/ai/templates?category=optimization&type=rolePlay" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 10. 知识库搜索
```bash
curl -X GET "http://localhost:3001/api/ai/knowledge/search?query=提示词优化&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 11. 智能对话
```bash
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "请帮我优化这个提示词：写一篇文章",
    "sessionId": "session_123",
    "model": "moonshot-v1-8k"
  }'
```

#### 12. 服务健康检查
```bash
curl -X GET http://localhost:3001/api/ai/health \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 技术栈升级

#### 核心依赖
- **NestJS**: 企业级Node.js框架
- **Prisma**: 现代化ORM，类型安全
- **LangChain**: AI应用开发框架
- **Moonshot AI**: 高质量中文对话模型
- **PostgreSQL**: 可靠的关系型数据库
- **JWT**: 安全的用户认证
- **Cron**: 定时任务调度

#### 开发工具
- **TypeScript**: 类型安全的JavaScript
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化
- **Swagger**: API文档生成

### 部署和监控

#### 环境变量配置
```env
# AI服务配置
MOONSHOT_API_KEY=your_moonshot_api_key
AI_MODEL_DEFAULT=moonshot-v1-8k
AI_SESSION_TIMEOUT=21600000
AI_MAX_SESSIONS_PER_USER=50

# 数据库配置
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

#### 性能监控指标
- 会话数量统计
- 消息处理延迟
- 数据库查询性能
- 内存使用情况
- API调用成功率

#### 日志记录
- 用户操作日志
- 系统错误日志
- 性能监控日志
- 安全审计日志

### 版本历史
- **v1.0** (2024-11): 基础AI对话功能，内存存储
- **v2.0** (2024-12): 企业级升级，数据持久化，智能缓存，自动管理

### 未来规划
- 支持更多AI模型接入
- 实现分布式会话管理
- 添加实时对话功能
- 增强安全防护机制
- 优化大规模并发处理

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
