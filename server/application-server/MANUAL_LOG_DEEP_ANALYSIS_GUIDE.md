# 手动输入用户日志深度分析指南

## 🔍 概述

现在深度分析任务接口已全面支持手动输入用户日志！你可以直接提交日志数据进行AI深度分析，无需依赖数据库查询。

## 🚀 新增接口

### 1. 手动输入日志深度分析任务
**专门用于手动输入日志的深度分析**

```bash
POST /api/log-analysis/tasks/manual-deep-analysis
```

### 2. 任务列表查询（原有接口）
**查看所有分析任务的状态和结果**

```bash
GET /api/log-analysis/tasks
```

## 📝 接口详细说明

### 1. 创建手动深度分析任务

**接口地址**: `POST /api/log-analysis/tasks/manual-deep-analysis`

**请求示例**:
```bash
curl -X POST http://localhost:3000/api/log-analysis/tasks/manual-deep-analysis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "userFeedback": "用户反馈登录和支付功能都出现异常，系统响应很慢，希望深度分析这些错误日志",
    "manualLogData": [
      {
        "timestamp": "2024-01-20T10:30:15Z",
        "level": "ERROR",
        "source": "auth-service",
        "service": "user-login",
        "message": "Database connection timeout during user authentication",
        "stackTrace": "Error: Connection timeout\n    at Database.connect(db.js:45)\n    at AuthService.login(auth.js:123)",
        "metadata": {
          "userId": 12345,
          "endpoint": "/api/auth/login",
          "duration": "30s",
          "ip": "192.168.1.100"
        }
      },
      {
        "timestamp": "2024-01-20T10:32:20Z", 
        "level": "ERROR",
        "source": "payment-service",
        "service": "order-payment",
        "message": "Payment gateway timeout for order processing",
        "stackTrace": "PaymentError: Gateway timeout\n    at PaymentGateway.process(payment.js:87)\n    at OrderService.processPayment(order.js:234)",
        "metadata": {
          "orderId": "ORD-789123",
          "amount": 299.99,
          "gateway": "stripe",
          "userId": 12345
        }
      },
      {
        "timestamp": "2024-01-20T10:35:45Z",
        "level": "WARN",
        "source": "api-gateway", 
        "service": "load-balancer",
        "message": "High response time detected from backend services",
        "metadata": {
          "averageResponseTime": "2.5s",
          "threshold": "1s",
          "affectedServices": ["auth-service", "payment-service"]
        }
      }
    ],
    "priority": "HIGH",
    "analysisOptions": {
      "enableFeatureExtraction": true,
      "enableSimilarSearch": true,
      "enableAnomalyDetection": true,
      "enableDeepAnalysis": true,
      "enableSemanticAnalysis": true,
      "enableRootCauseAnalysis": true
    }
  }'
```

**响应示例**:
```json
{
  "taskId": "manual_deep_20240120_abc123",
  "message": "手动日志深度分析任务已创建，正在AI分析 3 条日志...",
  "analysisPreview": {
    "logCount": 3,
    "severityDistribution": {
      "DEBUG": 0,
      "INFO": 0, 
      "WARN": 1,
      "ERROR": 2,
      "FATAL": 0
    },
    "estimatedProcessingTime": "1-2分钟"
  }
}
```

### 2. 查询任务列表

**接口地址**: `GET /api/log-analysis/tasks`

**请求示例**:
```bash
curl -X GET "http://localhost:3000/api/log-analysis/tasks?status=COMPLETED&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**响应示例**:
```json
[
  {
    "taskId": "manual_deep_20240120_abc123",
    "userFeedback": "用户反馈登录和支付功能都出现异常，系统响应很慢",
    "status": "COMPLETED",
    "priority": "HIGH", 
    "createdAt": "2024-01-20T10:30:00Z",
    "completedAt": "2024-01-20T10:32:00Z"
  }
]
```

### 3. 获取分析结果

**接口地址**: `GET /api/log-analysis/tasks/{taskId}`

**请求示例**:
```bash
curl -X GET http://localhost:3000/api/log-analysis/tasks/manual_deep_20240120_abc123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**响应示例**:
```json
{
  "taskId": "manual_deep_20240120_abc123",
  "status": "COMPLETED",
  "summary": "检测到系统性能问题：数据库连接超时和支付网关延迟导致的用户体验下降",
  "findings": {
    "criticalIssues": 2,
    "warnings": 1,
    "totalLogEntries": 3,
    "analysisType": "MANUAL_INPUT",
    "rootCauses": [
      "数据库连接池配置不当",
      "支付网关网络延迟",
      "服务间通信超时"
    ]
  },
  "recommendations": [
    {
      "priority": "HIGH",
      "category": "DATABASE",
      "action": "优化数据库连接池配置，增加连接数量和超时重试机制",
      "impact": "解决登录超时问题"
    },
    {
      "priority": "HIGH", 
      "category": "PAYMENT",
      "action": "配置支付网关备用通道，设置合理的超时时间",
      "impact": "提高支付成功率"
    },
    {
      "priority": "MEDIUM",
      "category": "MONITORING",
      "action": "增加系统性能监控告警，实时检测响应时间异常",
      "impact": "及时发现和解决性能问题"
    }
  ],
  "agentResults": [
    {
      "agentType": "DatabaseAnalysisAgent",
      "findings": "检测到认证服务数据库连接超时，建议优化连接池配置",
      "confidence": 0.95,
      "recommendations": ["增加数据库连接池大小", "设置连接超时重试"]
    },
    {
      "agentType": "PaymentAnalysisAgent", 
      "findings": "支付网关响应时间超过阈值，可能影响订单处理",
      "confidence": 0.88,
      "recommendations": ["启用备用支付通道", "优化网关通信"]
    },
    {
      "agentType": "PerformanceAnalysisAgent",
      "findings": "系统整体响应时间超过正常范围，需要性能优化",
      "confidence": 0.92,
      "recommendations": ["服务级别监控", "负载均衡优化"]
    }
  ],
  "semanticAnalysis": {
    "commonPatterns": ["timeout", "connection", "gateway"],
    "clusterAnalysis": "错误日志聚类显示主要问题集中在网络连接和超时处理",
    "sentimentScore": -0.7,
    "urgencyScore": 0.9
  },
  "logEntries": [
    {
      "originalIndex": 0,
      "enhancedAnalysis": {
        "severity": "CRITICAL",
        "category": "DATABASE_CONNECTION",
        "impact": "用户无法登录",
        "relatedServices": ["auth-service", "database"]
      }
    }
  ],
  "createdAt": "2024-01-20T10:30:00Z",
  "completedAt": "2024-01-20T10:32:00Z"
}
```

## 🎯 请求参数详解

### manualLogData 数组字段

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `timestamp` | Date | 可选 | 日志时间戳 |
| `level` | string | 必需 | 日志级别: DEBUG/INFO/WARN/ERROR/FATAL |
| `source` | string | 必需 | 日志来源: backend/frontend/mobile |
| `service` | string | 可选 | 具体服务名称 |
| `message` | string | 必需 | 日志消息内容 |
| `stackTrace` | string | 可选 | 错误堆栈信息 |
| `metadata` | object | 可选 | 额外的元数据 |

### analysisOptions 配置项

| 选项 | 默认值 | 说明 |
|------|-------|------|
| `enableFeatureExtraction` | true | 启用特征提取分析 |
| `enableSimilarSearch` | true | 搜索相似历史问题 |
| `enableAnomalyDetection` | true | 异常检测分析 |
| `enableDeepAnalysis` | true | 深度AI分析 |
| `enableSemanticAnalysis` | false | 语义分析（可选） |
| `enableRootCauseAnalysis` | false | 根因分析（可选） |

## 📋 使用场景示例

### 场景1: 用户登录问题分析

```json
{
  "userFeedback": "用户反馈无法登录，多次尝试都失败",
  "manualLogData": [
    {
      "level": "ERROR",
      "source": "auth-service",
      "message": "Invalid credentials for user login attempt",
      "metadata": {"userId": 12345, "attempts": 3, "ip": "192.168.1.100"}
    },
    {
      "level": "WARN", 
      "source": "security-service",
      "message": "Multiple failed login attempts detected",
      "metadata": {"userId": 12345, "timeWindow": "5min"}
    }
  ],
  "priority": "HIGH"
}
```

### 场景2: 系统性能问题分析

```json
{
  "userFeedback": "系统整体响应缓慢，页面加载时间过长",
  "manualLogData": [
    {
      "level": "WARN",
      "source": "api-gateway", 
      "message": "Slow response time detected: 2.5s",
      "metadata": {"endpoint": "/api/orders", "threshold": "1s"}
    },
    {
      "level": "ERROR",
      "source": "database",
      "message": "Query execution timeout",
      "metadata": {"query": "SELECT * FROM orders", "duration": "10s"}
    }
  ],
  "analysisOptions": {
    "enableDeepAnalysis": true,
    "enableRootCauseAnalysis": true
  }
}
```

### 场景3: 支付流程错误分析

```json
{
  "userFeedback": "用户支付失败，订单状态异常",
  "manualLogData": [
    {
      "level": "ERROR",
      "source": "payment-service",
      "message": "Payment processing failed: gateway timeout",
      "stackTrace": "PaymentError: Timeout\n    at PaymentGateway.process(...)",
      "metadata": {"orderId": "ORD-123", "amount": 199.99, "gateway": "paypal"}
    },
    {
      "level": "ERROR",
      "source": "order-service", 
      "message": "Failed to update order status after payment failure",
      "metadata": {"orderId": "ORD-123", "previousStatus": "PENDING_PAYMENT"}
    }
  ],
  "priority": "CRITICAL"
}
```

## 🔧 最佳实践

### 1. 日志数据质量

**✅ 推荐做法**:
```json
{
  "level": "ERROR",
  "source": "auth-service",
  "service": "user-authentication", 
  "message": "Database connection timeout during login validation",
  "stackTrace": "详细的错误堆栈...",
  "metadata": {
    "userId": 12345,
    "endpoint": "/api/auth/login",
    "duration": "30s",
    "database": "user_db",
    "connectionPool": "pool_1"
  }
}
```

**❌ 避免的做法**:
```json
{
  "level": "ERROR",
  "source": "backend",
  "message": "error"  // 信息过于简单
}
```

### 2. 分析选项配置

**快速分析**（适合简单问题）:
```json
{
  "analysisOptions": {
    "enableFeatureExtraction": true,
    "enableSimilarSearch": false,
    "enableAnomalyDetection": false
  }
}
```

**深度分析**（适合复杂问题）:
```json
{
  "analysisOptions": {
    "enableFeatureExtraction": true,
    "enableSimilarSearch": true,
    "enableAnomalyDetection": true,
    "enableDeepAnalysis": true,
    "enableSemanticAnalysis": true,
    "enableRootCauseAnalysis": true
  }
}
```

### 3. 批量日志处理

**适中数量**（推荐）:
```json
{
  "manualLogData": [
    // 5-20条日志，便于深度分析
  ]
}
```

**大批量处理**:
```json
{
  "manualLogData": [
    // 超过50条日志时，考虑分批提交
  ]
}
```

## 📊 响应时间参考

| 日志数量 | 预计处理时间 | 建议配置 |
|----------|-------------|----------|
| 1-10条 | 1-2分钟 | 全功能启用 |
| 11-50条 | 3-5分钟 | 选择性启用高级功能 |
| 51-100条 | 5-10分钟 | 基础分析 + 关键功能 |
| 100+条 | 10-30分钟 | 考虑分批处理 |

## 🔍 错误处理

### 常见错误及解决方案

1. **认证失败**
```bash
# 确保JWT token有效
curl -X POST /auth/login -d '{"username":"user","password":"pass"}'
```

2. **日志格式错误**
```json
{
  "error": "Invalid log level",
  "message": "level字段必须是: DEBUG/INFO/WARN/ERROR/FATAL"
}
```

3. **请求体过大**
```json
{
  "error": "Request entity too large", 
  "message": "单次请求日志数量建议不超过500条"
}
```

## 🚀 集成示例

### JavaScript/TypeScript
```typescript
async function analyzeUserLogs(logs: LogEntry[], feedback: string) {
  const response = await fetch('/api/log-analysis/tasks/manual-deep-analysis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getJwtToken()}`
    },
    body: JSON.stringify({
      userFeedback: feedback,
      manualLogData: logs,
      priority: 'HIGH',
      analysisOptions: {
        enableDeepAnalysis: true,
        enableRootCauseAnalysis: true
      }
    })
  });
  
  const result = await response.json();
  return result.taskId;
}

// 查询分析结果
async function getAnalysisResult(taskId: string) {
  const response = await fetch(`/api/log-analysis/tasks/${taskId}`, {
    headers: {
      'Authorization': `Bearer ${getJwtToken()}`
    }
  });
  
  return await response.json();
}
```

### Python
```python
import requests

def analyze_user_logs(logs, feedback, token):
    url = "http://localhost:3000/api/log-analysis/tasks/manual-deep-analysis"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    data = {
        "userFeedback": feedback,
        "manualLogData": logs,
        "priority": "HIGH",
        "analysisOptions": {
            "enableDeepAnalysis": True,
            "enableRootCauseAnalysis": True
        }
    }
    
    response = requests.post(url, json=data, headers=headers)
    return response.json()["taskId"]

def get_analysis_result(task_id, token):
    url = f"http://localhost:3000/api/log-analysis/tasks/{task_id}"
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(url, headers=headers)
    return response.json()
```

## 📈 高级功能

### 1. 实时状态查询
```bash
# 轮询任务状态
while true; do
  status=$(curl -s -H "Authorization: Bearer $TOKEN" \
    "http://localhost:3000/api/log-analysis/tasks/$TASK_ID" | \
    jq -r '.status')
  
  if [ "$status" = "COMPLETED" ]; then
    echo "分析完成!"
    break
  fi
  
  echo "当前状态: $status"
  sleep 10
done
```

### 2. 批量任务管理
```bash
# 获取所有进行中的任务
curl -X GET "http://localhost:3000/api/log-analysis/tasks?status=PROCESSING" \
  -H "Authorization: Bearer $TOKEN"

# 获取最近完成的任务
curl -X GET "http://localhost:3000/api/log-analysis/tasks?status=COMPLETED&limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎉 总结

现在你可以使用两个核心接口来实现完整的手动用户日志深度分析工作流：

1. **`POST /api/log-analysis/tasks/manual-deep-analysis`** - 创建手动输入日志的深度分析任务
2. **`GET /api/log-analysis/tasks`** - 查询任务列表和状态

这样的设计让你能够：
- ✅ 直接提交用户日志进行AI深度分析
- ✅ 获得详细的问题诊断和解决建议  
- ✅ 追踪分析任务的处理状态
- ✅ 查看历史分析记录
- ✅ 支持多种分析选项和优先级

**立即开始使用，体验AI驱动的智能日志分析！** 🚀 