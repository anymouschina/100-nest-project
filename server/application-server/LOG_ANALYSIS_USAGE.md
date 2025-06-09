# 日志分析Agent系统使用指南

## 🚀 快速开始

### 1. 环境准备

#### Docker容器启动
```bash
# 启动完整服务栈
docker-compose up -d

# 查看服务状态
docker-compose ps
```

**服务列表：**
- `postgres:15-alpine` - PostgreSQL数据库 (端口: 5432)
- `redis:7-alpine` - Redis缓存 (端口: 6379)
- `qdrant/qdrant:v1.7.4` - Qdrant向量数据库 (端口: 6333, 6334)

#### 依赖安装
```bash
# 安装新依赖
pnpm install

# 或者单独安装向量数据库相关依赖
pnpm add @qdrant/js-client-rest openai ml-matrix compromise
```

#### 环境配置
复制 `.env.example` 到 `.env` 并配置：

```env
# 数据库配置
DATABASE_URL="postgresql://oms_user:oms_password@localhost:5432/oms_db?schema=public"

# Qdrant向量数据库配置
QDRANT_HOST="localhost"
QDRANT_PORT=6333
QDRANT_API_KEY=""  # 生产环境建议启用

# OpenAI配置（用于生成向量）
OPENAI_API_KEY="your-openai-api-key"
OPENAI_BASE_URL="https://api.openai.com/v1"

# 向量搜索配置
VECTOR_DEFAULT_MODEL="text-embedding-3-small"
VECTOR_DEFAULT_DIMENSIONS=384
VECTOR_SEARCH_THRESHOLD=0.7
```

#### 数据库迁移
```bash
# 推送数据库模式
pnpm run db:init

# 构建项目
pnpm run build

# 播种数据（可选）
pnpm run db:seed
```

### 2. 启动服务

```bash
# 开发模式启动
pnpm run start:dev

# 或一键启动（包含数据库初始化）
pnpm run start:all
```

## 📖 功能概览

### 核心Agent功能

1. **日志归一化Agent** - 统一不同格式的日志
2. **错误分析Agent** - 智能分析和分类错误
3. **用户日志问题Agent** - 专门处理用户反馈的问题
4. **特征提取Agent** - 提取业务关键指标
5. **异常检测Agent** - 实时监控异常行为
6. **向量语义搜索** - 基于AI的智能搜索

### 具体问题处理能力

✅ **后端返回码错误** - 明显的ret值非0错误
✅ **前端JS错误** - 是否阻塞流程，是否影响关键链路
✅ **页面卸载错误** - 小程序特性，页面卸载后的方法调用
✅ **业务参数异常** - 计价开发常反馈的规格问题
✅ **车型规格错误** - 不具备的规格参数检测
✅ **白名单管理** - 支持手动打标忽略正常case

## 🔧 API使用指南

### 1. 创建日志分析任务

```http
POST /api/log-analysis/tasks
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "userId": 123,
  "userFeedback": "用户反馈无法下单，点击支付按钮没有反应",
  "timeRange": {
    "startTime": "2024-12-26T00:00:00Z",
    "endTime": "2024-12-26T23:59:59Z"
  },
  "logSources": ["backend", "frontend", "mobile"],
  "keywords": ["payment", "order", "error"],
  "priority": "HIGH"
}
```

**响应：**
```json
{
  "taskId": "task_1703577600000_abc123",
  "message": "日志分析任务已创建，正在后台处理中..."
}
```

### 2. 查询分析结果

```http
GET /api/log-analysis/tasks/task_1703577600000_abc123
Authorization: Bearer <your-jwt-token>
```

**响应示例：**
```json
{
  "taskId": "task_1703577600000_abc123",
  "status": "COMPLETED",
  "summary": "发现3个关键问题，包括1个阻塞性错误和2个业务参数异常",
  "findings": {
    "totalIssues": 3,
    "issueTypes": ["BLOCKING_ERROR", "BUSINESS_PARAM_ERROR"],
    "severityDistribution": {
      "LOW": 0,
      "MEDIUM": 2,
      "HIGH": 0,
      "CRITICAL": 1
    }
  },
  "recommendations": [
    "立即检查支付服务可用性",
    "验证前端参数校验逻辑",
    "检查车型配置数据库"
  ],
  "agentResults": [
    {
      "agentType": "USER_LOG_ISSUE",
      "status": "COMPLETED",
      "confidence": 0.85,
      "findings": {
        "detectedIssues": [
          {
            "issueType": "BLOCKING_ERROR",
            "severity": "CRITICAL",
            "apiEndpoint": "/api/payment/create",
            "errorMessage": "Payment service unavailable",
            "rootCause": "支付服务连接超时",
            "recommendations": [
              "立即检查支付服务状态",
              "启动降级支付方案"
            ]
          }
        ]
      }
    }
  ],
  "createdAt": "2024-12-26T10:00:00Z",
  "completedAt": "2024-12-26T10:02:30Z"
}
```

### 3. 搜索相似历史问题

```http
POST /api/log-analysis/search/similar-issues
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "query": "支付按钮点击无反应",
  "limit": 5,
  "threshold": 0.7,
  "filters": {
    "severity": "HIGH"
  }
}
```

### 4. 分析参数异常

```http
POST /api/log-analysis/analyze/param-anomaly
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "apiEndpoint": "/api/pricing/calculate",
  "inputParams": {
    "vehicleModel": "ModelX",
    "specifications": {
      "engine": "V8",
      "transmission": "automatic",
      "sunroof": true
    }
  },
  "vehicleModel": "ModelX"
}
```

**响应：**
```json
{
  "isAnomalous": true,
  "confidence": 0.92,
  "similarPatterns": [
    {
      "id": "pattern_001",
      "similarity": 0.89,
      "apiEndpoint": "/api/pricing/calculate",
      "errorMessage": "Invalid specification for ModelX"
    }
  ],
  "recommendations": [
    "ModelX不支持sunroof配置",
    "请检查车型配置表",
    "更新前端选项过滤逻辑"
  ]
}
```

### 5. 添加白名单规则

```http
POST /api/log-analysis/whitelist
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "ruleType": "RET_CODE_IGNORE",
  "ruleName": "用户手机号注销忽略",
  "description": "用户手机号注销且不可用的情况，返回码1001为正常",
  "conditions": {
    "metadata.retCode": 1001,
    "metadata.apiEndpoint": "/api/user/check",
    "metadata.reason": "phone_deactivated"
  },
  "createdBy": 123
}
```

### 6. 向量文档管理

#### 添加文档到向量库
```http
POST /api/log-analysis/vector/documents
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "id": "error_solution_001",
  "content": "支付服务超时问题解决方案：1. 检查网络连接 2. 重启支付服务 3. 切换备用支付渠道",
  "metadata": {
    "category": "log_issue",
    "issueType": "PAYMENT_ERROR",
    "severity": "HIGH",
    "resolution": "restart_service_and_fallback",
    "tags": ["payment", "timeout", "solution"]
  }
}
```

#### 语义搜索
```http
POST /api/log-analysis/vector/search
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "query": "支付超时怎么处理",
  "limit": 5,
  "threshold": 0.7,
  "filters": {
    "category": "log_issue",
    "issueType": "PAYMENT_ERROR"
  },
  "includeMetadata": true
}
```

## 🎯 实际使用场景

### 场景1：用户下单失败问题排查

**用户反馈：** "我点击下单按钮后，页面一直转圈，最后提示系统错误"

**操作步骤：**

1. **创建分析任务**
```bash
curl -X POST "http://localhost:3001/api/log-analysis/tasks" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 123,
    "userFeedback": "点击下单按钮后页面一直转圈，最后提示系统错误",
    "timeRange": {
      "startTime": "2024-12-26T14:00:00Z",
      "endTime": "2024-12-26T15:00:00Z"
    },
    "logSources": ["backend", "frontend"],
    "keywords": ["order", "create", "error"],
    "priority": "HIGH"
  }'
```

2. **等待2-3分钟后查询结果**
```bash
curl -X GET "http://localhost:3001/api/log-analysis/tasks/TASK_ID" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

3. **根据分析结果采取行动**
- 如果是数据库连接问题 → 检查数据库状态
- 如果是业务参数问题 → 检查前端表单验证
- 如果是第三方服务问题 → 启用降级方案

### 场景2：业务参数异常检测

**问题：** 计价接口收到了当前车型不支持的规格参数

**操作步骤：**

1. **实时参数检测**
```bash
curl -X POST "http://localhost:3001/api/log-analysis/analyze/param-anomaly" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "apiEndpoint": "/api/pricing/calculate",
    "inputParams": {
      "vehicleModel": "ModelA",
      "specifications": {
        "engine": "electric",
        "wheels": "20inch"
      }
    },
    "vehicleModel": "ModelA"
  }'
```

2. **查看检测结果**
```json
{
  "isAnomalous": true,
  "confidence": 0.95,
  "recommendations": [
    "ModelA为燃油车型，不支持electric引擎配置",
    "请更新前端选项过滤逻辑",
    "建议添加服务端参数校验"
  ]
}
```

### 场景3：白名单规则管理

**场景：** 用户手机号注销导致的1001错误码是正常情况，需要忽略

**操作步骤：**

1. **添加白名单规则**
```bash
curl -X POST "http://localhost:3001/api/log-analysis/whitelist" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ruleType": "RET_CODE_IGNORE",
    "ruleName": "手机号注销正常错误",
    "description": "用户手机号注销时返回1001为正常业务逻辑",
    "conditions": {
      "metadata.retCode": 1001,
      "metadata.apiEndpoint": "/api/user/verify",
      "message": "phone number deactivated"
    },
    "createdBy": 123
  }'
```

2. **验证规则生效**
再次分析包含该条件的日志时，将被自动忽略。

## 📊 监控和统计

### 获取分析统计
```http
GET /api/log-analysis/stats?timeRange=week&userId=123
```

### 获取问题分类统计
```http
GET /api/log-analysis/stats/issue-types?timeRange=day
```

### 导出分析报告
```http
GET /api/log-analysis/tasks/TASK_ID/report?format=json
```

## 🔍 向量数据库Web界面

Qdrant提供了Web UI来可视化管理向量数据：

1. **访问地址：** http://localhost:6333/dashboard
2. **查看集合：** 可以看到创建的向量集合
3. **搜索测试：** 可以直接测试向量搜索功能
4. **数据统计：** 查看向量数据的统计信息

## ⚡ 性能优化建议

### 1. 向量搜索优化
- 调整`VECTOR_SEARCH_THRESHOLD`以平衡精度和召回率
- 使用合适的向量维度（384维适合大多数场景）
- 为常用字段创建索引

### 2. 批处理优化
- 大量日志分析时使用批处理API
- 设置合理的`LOG_ANALYSIS_BATCH_SIZE`
- 异步处理长时间任务

### 3. 缓存优化
- 相似查询结果会被Redis缓存
- 调整缓存过期时间以平衡性能和实时性

## 🚨 故障排查

### 常见问题

1. **Qdrant连接失败**
```bash
# 检查Qdrant服务状态
docker-compose ps qdrant

# 查看Qdrant日志
docker-compose logs qdrant

# 测试连接
curl http://localhost:6333/health
```

2. **向量生成失败**
- 检查OpenAI API Key配置
- 确认网络连接正常
- 查看应用日志中的错误信息

3. **分析任务一直处理中**
- 检查数据库连接
- 查看后台任务日志
- 验证日志数据格式是否正确

### 日志查看
```bash
# 查看应用日志
docker-compose logs app

# 查看Qdrant日志
docker-compose logs qdrant

# 查看数据库日志
docker-compose logs postgres
```

## 🎉 恭喜！

您现在已经拥有了一个完整的智能日志分析系统，它可以：

✅ 自动分析用户反馈的日志问题
✅ 智能检测业务参数异常
✅ 提供基于AI的相似问题搜索
✅ 支持白名单规则管理
✅ 生成详细的分析报告和建议

开始使用这个强大的系统来提升您的问题排查效率吧！ 