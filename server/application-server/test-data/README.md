# AI日志分析测试数据说明

## 📋 概述

本目录包含为AI日志分析功能专门生成的1000条半结构化测试数据，涵盖了电商订单管理系统的各种业务场景和日志格式。

## 📁 文件结构

```
test-data/
├── structured-logs.json     # 1000条完整结构化日志数据
├── string-logs.json         # 1000条字符串格式日志数据
├── mixed-logs.json          # 1000条混合格式日志数据
├── test-cases.json          # 5个预定义测试用例
├── data-statistics.json     # 数据统计报告
└── README.md               # 本说明文档
```

## 📊 数据特征

### 日志级别分布
- **DEBUG**: 190条 (19%)
- **INFO**: 189条 (18.9%)
- **WARN**: 188条 (18.8%)
- **ERROR**: 210条 (21%)
- **FATAL**: 223条 (22.3%)

### 业务场景覆盖
1. **订单创建流程** - 订单创建、库存验证、价格计算
2. **支付处理** - 支付网关、第三方支付、交易验证
3. **用户认证** - 登录验证、权限检查、会话管理
4. **数据库操作** - 查询执行、连接管理、事务处理
5. **系统性能** - 资源监控、健康检查、异常检测

### 服务分布
- **order-service**: 221条 (22.1%)
- **payment-gateway**: 118条 (11.8%)
- **user-service**: 72条 (7.2%)
- **wechat-service**: 74条 (7.4%)
- **mysql**: 59条 (5.9%)
- **redis**: 62条 (6.2%)
- **auth-service**: 57条 (5.7%)
- **nginx**: 63条 (6.3%)
- **api-gateway**: 65条 (6.5%)
- **inventory-service**: 62条 (6.2%)

## 📄 数据格式说明

### 1. structured-logs.json
完整的结构化日志数据，每条记录包含：

```json
{
  "id": "log-000001",
  "timestamp": "2025-05-29T20:49:22.014Z",
  "level": "ERROR",
  "source": "backend",
  "service": "payment-gateway",
  "message": "支付网关连接异常",
  "stackTrace": "...", // ERROR/FATAL级别可能包含堆栈跟踪
  "metadata": {
    "userId": "user-00160",
    "sessionId": "session-xxx",
    "trace_id": "TRC-20250529-847571",
    "apiEndpoint": "/api/payment/process",
    "responseTime": 1576,
    "retCode": 44655,
    "httpStatus": 404,
    // 根据业务场景的特定字段
    "paymentMethod": "alipay",
    "amount": 279.85,
    "orderId": "ORDER-20250608-3451",
    "error_code": "PAY_TIMEOUT"
  }
}
```

### 2. string-logs.json
半结构化字符串格式日志：

```json
[
  "20:49:22 FATAL [auth-service] JWT验证失败 | userId=user-00160 | trace=TRC-20250529-847571",
  "21:49:48 INFO [wechat-service] 支付验证失败",
  "01:31:10 DEBUG [order-service] 用户创建订单成功"
]
```

### 3. mixed-logs.json
混合格式数据，包含：
- 1/3 完整结构化对象
- 1/3 简化结构化对象
- 1/3 字符串格式

### 4. test-cases.json
5个预定义的测试用例：

1. **支付系统故障分析** - 50条支付相关日志
2. **数据库性能问题诊断** - 60条数据库相关日志
3. **用户认证异常排查** - 40条认证相关日志
4. **系统整体健康状况评估** - 100条综合日志
5. **订单处理流程问题分析** - 45条订单相关日志

## 🚀 使用方法

### 快速开始

1. **生成测试数据**：
```bash
npx ts-node scripts/generate-test-logs.ts
```

2. **运行测试脚本**：
```bash
./test-log-analysis-with-generated-data.sh
```

### API测试示例

#### 1. 结构化日志分析
```bash
curl -X POST "http://localhost:3000/api/agent-orchestrator/analyze/quick" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userFeedback": "分析支付系统问题",
    "logData": [结构化日志数据],
    "options": {
      "pipeline": "PARALLEL",
      "priority": "HIGH"
    }
  }'
```

#### 2. 字符串日志分析
```bash
curl -X POST "http://localhost:3000/api/agent-orchestrator/analyze/quick" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userFeedback": "分析这些文本日志",
    "logData": [字符串日志数据],
    "options": {
      "pipeline": "PARALLEL"
    }
  }'
```

#### 3. 错误专门分析
```bash
curl -X POST "http://localhost:3000/api/agent-orchestrator/analyze/errors" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userFeedback": "深度分析系统错误",
    "logData": [错误级别日志],
    "options": {
      "pipeline": "SEQUENTIAL",
      "priority": "URGENT"
    }
  }'
```

## 🔧 自定义测试

### 数据过滤示例

```bash
# 提取ERROR级别的日志
jq '[.[] | select(.level == "ERROR")]' test-data/structured-logs.json

# 提取支付相关的日志
jq '[.[] | select(.service | contains("payment"))]' test-data/structured-logs.json

# 提取特定时间范围的日志
jq '[.[] | select(.timestamp >= "2025-06-01" and .timestamp <= "2025-06-10")]' test-data/structured-logs.json

# 提取高响应时间的日志
jq '[.[] | select(.metadata.responseTime > 3000)]' test-data/structured-logs.json
```

### 自定义测试用例

```javascript
// 创建自定义测试用例
const customTestCase = {
  name: "自定义测试场景",
  userFeedback: "描述你的测试目标",
  logData: filteredLogs, // 你过滤后的日志数据
  options: {
    pipeline: "PARALLEL", // SEQUENTIAL | PARALLEL | CONDITIONAL
    priority: "HIGH"      // LOW | MEDIUM | HIGH | URGENT
  }
};
```

## 📈 数据质量特点

### 1. 真实性
- 基于真实电商业务场景
- 包含合理的错误分布和异常模式
- 时间戳覆盖最近30天

### 2. 多样性
- 5种核心业务场景
- 14个不同服务来源
- 5个日志级别均匀分布
- 多种数据格式支持

### 3. 完整性
- 每条日志包含完整的上下文信息
- 关联的用户会话和追踪ID
- 业务相关的元数据字段
- 错误级别包含堆栈跟踪

### 4. 可扩展性
- 模块化的生成脚本
- 可配置的业务场景
- 支持新增服务和字段
- 灵活的数据格式输出

## 🎯 测试建议

### 性能测试
- 使用不同大小的数据集（10条、100条、1000条）
- 测试不同的执行管道（并行vs顺序）
- 比较不同数据格式的处理速度

### 功能测试
- 验证各种业务场景的识别准确性
- 测试异常检测和模式识别
- 验证不同优先级的处理差异

### 压力测试
- 并发请求测试
- 大批量数据处理测试
- 长时间运行稳定性测试

## 🔍 故障排查

### 常见问题

1. **JWT Token过期**
   - 更新test脚本中的JWT_TOKEN
   - 或设置环境变量: `export JWT_TOKEN="your_token"`

2. **数据文件不存在**
   - 运行: `npx ts-node scripts/generate-test-logs.ts`

3. **API连接失败**
   - 确保服务器运行: `npm run start:dev`
   - 检查端口配置: 默认3000

4. **JSON解析错误**
   - 检查数据文件格式
   - 验证jq命令可用性

## 📞 支持

如需帮助或发现问题，请查看：
- [AI代理编排系统文档](../src/log-analysis/README.md)
- [API使用示例](../API_USAGE_EXAMPLES.md)
- [日志分析使用指南](../LOG_ANALYSIS_USAGE.md)

---

*生成时间: 2025-06-10*  
*数据版本: v1.0*  
*总计: 1000条测试日志 + 5个测试用例* 