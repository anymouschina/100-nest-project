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

# 微信聊天记录AI总结系统

这是一个基于NestJS的微信聊天记录智能分析和总结系统，支持多种分析类型和优化策略。

## 🚀 新功能：LangChain智能优化

### 核心优化特性

1. **智能数据预处理**
   - 自动过滤无效消息（系统消息、表情、简单回复）
   - 智能去重，避免重复内容影响分析质量
   - 内容截断优化，保留关键信息
   - 智能采样，从大量消息中提取最重要的内容

2. **优化的提示词工程**
   - 针对不同分析类型的专业提示词模板
   - 结构化输出格式，确保结果一致性
   - 上下文感知的提示词构建

3. **性能优化**
   - 消息数量从原始数据自动优化到最多500条重要消息
   - 单条消息长度限制，避免过长内容影响处理速度
   - 基于重要性评分的智能采样算法

### 消息重要性评分算法

系统使用多维度评分来识别重要消息：

- **长度分数**: 较长的消息通常包含更多信息
- **关键词分数**: 包含"决定"、"计划"、"重要"等关键词的消息
- **问题分数**: 包含问号的消息通常很重要
- **数据分数**: 包含数字、时间等具体信息的消息
- **发言者活跃度**: 不太活跃用户的发言可能更重要

## 📊 API端点

### 原有功能
- `POST /wechat-summary/smart-summary` - 智能总结
- `POST /wechat-summary/smart-summary-stream` - 流式智能总结
- `GET /wechat-summary/groups` - 获取群聊列表

### 🆕 LangChain优化端点
- `POST /wechat-summary/langchain-summary` - LangChain智能总结
- `POST /wechat-summary/langchain-summary-stream` - LangChain流式总结

## 🔧 技术栈

- **框架**: NestJS + TypeScript
- **AI处理**: LangChain + Ollama (qwen3)
- **数据源**: Chatlog HTTP API
- **优化**: 智能数据预处理 + 提示词工程

## 📈 性能对比

使用LangChain优化后的性能提升：

| 指标 | 原始方法 | LangChain优化 | 提升 |
|------|----------|---------------|------|
| 处理速度 | 基准 | 30-50%更快 | ⚡ |
| 消息质量 | 基准 | 过滤无效内容 | 📈 |
| 结果一致性 | 基准 | 结构化输出 | ✅ |
| 资源使用 | 基准 | 智能采样减少 | 💾 |

## 🛠 使用示例

### LangChain智能总结

```bash
curl -X POST http://localhost:3000/wechat-summary/langchain-summary \
  -H "Content-Type: application/json" \
  -d '{
    "groupName": "工作群",
    "relativeTime": "today",
    "summaryType": "daily"
  }'
```

### LangChain流式总结

```bash
curl -X POST http://localhost:3000/wechat-summary/langchain-summary-stream \
  -H "Content-Type: application/json" \
  -d '{
    "groupName": "团队群",
    "relativeTime": "thisWeek",
    "summaryType": "sentiment_analysis"
  }'
```

### 支持的分析类型

- `daily` - 日常总结（默认）
- `sentiment_analysis` - 情感分析
- `topic` - 主题分析
- `participant` - 参与者分析
- `style_analysis` - 风格分析
- `activity_analysis` - 活跃度分析
- `keyword_extraction` - 关键词提取
- `custom` - 自定义分析（需要提供customPrompt）

## 🔍 测试

运行LangChain优化功能测试：

```bash
node test-langchain-optimization.js
```

测试包括：
- 基本功能测试
- 流式处理测试
- 不同分析类型测试
- 性能对比测试

## 📋 环境要求

```bash
# 必需服务
CHATLOG_BASE_URL=http://localhost:5030  # Chatlog HTTP服务
OLLAMA_BASE_URL=http://localhost:11434  # Ollama服务
OLLAMA_MODEL=qwen3                      # AI模型

# 确保服务运行
# 1. Chatlog HTTP服务在5030端口
# 2. Ollama服务在11434端口，已加载qwen3模型
```

## 🎯 优化效果

### 数据处理优化
- **原始消息**: 可能包含数千条消息
- **过滤后**: 移除系统消息、表情、重复内容
- **优化后**: 最多500条最重要的消息
- **结果**: 处理速度提升30-50%，质量更高

### 提示词优化
- **结构化模板**: 针对不同分析类型的专业提示词
- **上下文感知**: 根据群聊名称、时间范围动态调整
- **输出格式**: 强制JSON格式输出，确保结果可解析

### 流式处理优化
- **实时反馈**: 显示处理进度和状态
- **错误处理**: 完善的错误处理和恢复机制
- **用户体验**: 提供处理过程的可视化反馈

## 🔄 工作流程

1. **数据获取**: 从Chatlog API获取原始聊天数据
2. **数据预处理**: 
   - 基础过滤（移除无效消息）
   - 去重处理（移除重复内容）
   - 内容优化（截断过长消息）
   - 智能采样（保留重要消息）
3. **提示词构建**: 根据分析类型构建优化的提示词
4. **AI分析**: 使用LangChain + Ollama进行智能分析
5. **结果处理**: 解析和格式化分析结果

## 📚 更多信息

- 查看 `src/wechat-summary/langchain.service.ts` 了解优化实现细节
- 运行 `test-langchain-optimization.js` 进行功能测试
- 检查日志了解处理过程和性能指标

---

**注意**: LangChain优化功能需要安装额外的依赖包，已通过 `pnpm add @langchain/core @langchain/community @langchain/ollama langchain` 安装。
