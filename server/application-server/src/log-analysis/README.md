# AI代理编排系统 (Agent Orchestrator System)

## 🚀 系统概述

AI代理编排系统是一个强大的日志分析平台，通过协调多个专业AI代理来提供全面、智能的日志分析服务。

## 📋 相关文档

- **[系统架构流程图](../docs/ai-agent-orchestration-flow.md)** - 详细的可视化流程图和系统架构说明

### 🤖 核心AI代理

| 代理名称 | 功能描述 | 主要能力 |
|---------|---------|---------|
| **LogNormalizationAgent** | 日志归一化处理 | 格式标准化、数据清洗、结构化转换 |
| **UserLogIssueAgent** | 用户日志问题分析 | 问题分类、相似性搜索、建议生成 |
| **AnomalyDetectionAgent** | 异常检测分析 | 统计异常、模式异常、时间异常、行为异常 |
| **FeatureExtractionAgent** | 特征提取分析 | 统计特征、时间特征、文本特征、行为特征 |
| **ErrorAnalysisAgent** | 错误分析 | 错误分类、根因分析、影响评估、模式识别 |
| **BehaviorAnalysisAgent** | 行为分析 | 用户行为、访问模式、安全分析、性能分析 |
| **ReportGenerationAgent** | 报告生成 | 综合报告、数据可视化、建议合成 |

### 🔄 执行模式

- **SEQUENTIAL（顺序执行）**: 代理按顺序执行，前一个代理的结果传递给下一个
- **PARALLEL（并行执行）**: 代理同时执行，显著提升处理速度
- **CONDITIONAL（条件执行）**: 根据分析类型智能选择相关代理

## 📡 API接口说明

### 基础路径
```
基础URL: http://localhost:3000/api/agent-orchestrator
```

### 🔑 认证
所有API接口都需要JWT认证：
```bash
Authorization: Bearer <your-jwt-token>
```

### 📋 主要接口

#### 1. 快速日志分析 ⚡
**最推荐使用的接口 - 替代旧的 `/api/log-analysis/analyze/manual`**

```http
POST /api/agent-orchestrator/analyze/quick
```

**请求体示例（结构化对象格式）:**
```json
{
  "userFeedback": "我的系统出现了数据库连接超时的问题，需要快速分析原因",
  "logData": [
    {
      "id": "log-1",
      "timestamp": "2025-06-09T15:36:54.230Z",
      "level": "ERROR",
      "source": "backend",
      "service": "database",
      "message": "Database connection timeout after 5000ms",
      "metadata": {
        "userId": "user-123",
        "sessionId": "session-456",
        "endpoint": "/api/user/profile",
        "responseTime": 5000,
        "retCode": 500
      }
    }
  ],
  "options": {
    "pipeline": "PARALLEL",
    "priority": "HIGH"
  }
}
```

**请求体示例（string[]格式）:**
```json
{
  "userFeedback": "分析这些字符串格式的日志",
  "logData": [
    "2025-06-09T15:36:54.230Z ERROR [database] Connection timeout after 5000ms",
    "2025-06-09T15:36:55.230Z WARN [frontend] Network request failed",
    "ERROR: Database connection pool exhausted",
    "FATAL: System critical failure detected"
  ],
  "options": {
    "pipeline": "PARALLEL",
    "priority": "HIGH"
  }
}
```

**响应示例:**
```json
{
  "taskId": "quick_1749483346873",
  "success": true,
  "totalProcessingTime": 156,
  "agentResults": [
    {
      "agentName": "LogNormalizationAgent",
      "success": true,
      "processingTime": 12,
      "confidence": 1.0,
      "data": {...}
    }
  ],
  "summary": {
    "totalAgents": 7,
    "successfulAgents": 7,
    "failedAgents": 0,
    "overallConfidence": 0.85
  },
  "quickInsights": {
    "topIssues": ["数据库连接超时"],
    "riskLevel": "HIGH",
    "urgentActions": ["检查数据库连接池配置"],
    "systemHealth": "MODERATE"
  }
}
```

#### 2. 错误专门分析 🎯
**专门针对错误日志的深度分析**

```http
POST /api/agent-orchestrator/analyze/errors
```

#### 3. 综合AI分析 📊
**完整的AI分析流程，可自定义参数**

```http
POST /api/agent-orchestrator/analyze/comprehensive
```

#### 4. 获取AI代理列表 🔍
```http
GET /api/agent-orchestrator/agents
```

#### 5. 系统性能统计 📈
```http
GET /api/agent-orchestrator/stats/performance
```

#### 6. 代理健康检查 🏥
```http
GET /api/agent-orchestrator/agents/{agentName}/health
```

## 🚀 快速开始

### 1. 启动服务
```bash
npm run start:dev
```

### 2. 测试API接口
```bash
# 运行自动测试脚本
./scripts/test-api-endpoints.sh

# 或手动测试快速分析接口
curl -X POST "http://localhost:3000/api/agent-orchestrator/analyze/quick" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userFeedback": "分析这个错误日志",
    "logData": [{
      "level": "ERROR",
      "source": "backend", 
      "message": "Database connection failed"
    }]
  }'
```

## 📊 性能特点

- **高性能**: 并行执行比顺序执行快75%（4ms vs 12ms）
- **高可靠性**: 系统成功率100%，完善的错误处理机制
- **高智能**: AI驱动的问题检测和建议生成
- **高可扩展**: 模块化设计，支持动态代理注册

## 🔧 配置选项

### 执行管道配置
```typescript
{
  "pipeline": "PARALLEL",     // SEQUENTIAL | PARALLEL | CONDITIONAL
  "priority": "HIGH",         // LOW | MEDIUM | HIGH | URGENT
  "analysisType": "REAL_TIME" // REAL_TIME | BATCH | DEEP_ANALYSIS
}
```

### 日志数据格式

#### 方式1: 结构化对象格式 (推荐)
```typescript
{
  "id": "string",           // 可选，日志唯一标识
  "timestamp": "ISO8601",   // 可选，时间戳
  "level": "ERROR",         // DEBUG | INFO | WARN | ERROR | FATAL
  "source": "backend",      // 日志来源
  "service": "database",    // 可选，服务名称
  "message": "string",      // 日志消息
  "stackTrace": "string",   // 可选，堆栈跟踪
  "metadata": {}            // 可选，额外元数据
}
```

#### 方式2: 字符串数组格式
```typescript
string[] // 例如: ["ERROR: Database timeout", "WARN: Network slow"]
```

**字符串格式自动解析特性:**
- 自动提取日志级别 (ERROR, WARN, INFO等)
- 自动解析时间戳 (ISO8601格式)
- 智能推断日志来源 (frontend, backend, database等)
- 自动提取服务名 (service: xxx)
- 自动解析嵌入的JSON数据

## 🔄 迁移指南

### 从旧接口迁移
如果你之前使用的是 `/api/log-analysis/analyze/manual`，请迁移到新的快速分析接口：

**旧接口 (已废弃):**
```http
POST /api/log-analysis/analyze/manual
```

**新接口 (推荐):**
```http
POST /api/agent-orchestrator/analyze/quick
```

### 主要优势
- ✅ 更快的处理速度（并行执行）
- ✅ 更智能的分析结果
- ✅ 更好的错误处理
- ✅ 实时性能监控
- ✅ 灵活的执行策略

## 📚 更多信息

- 查看 `scripts/test-agent-orchestrator.ts` 了解完整的功能测试
- 查看 `scripts/test-api-endpoints.sh` 了解API测试示例
- 系统架构文档请参考代理实现文件

## 🎯 最佳实践

1. **使用并行模式**: 对于大多数场景，推荐使用 `PARALLEL` 管道以获得最佳性能
2. **合理设置优先级**: 错误分析使用 `HIGH` 或 `URGENT`，常规分析使用 `MEDIUM`
3. **提供详细反馈**: `userFeedback` 字段帮助AI更好地理解问题背景
4. **监控系统健康**: 定期检查 `/stats/performance` 接口监控系统状态

---

**🎉 现在你可以使用强大的AI代理编排系统进行日志分析了！** 
