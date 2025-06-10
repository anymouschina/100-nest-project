#!/bin/bash

# 快速场景测试脚本
# ==================

API_BASE="http://localhost:3000/api/agent-orchestrator"

echo "🚀 快速场景测试"
echo "================"

# 测试函数
test_scenario() {
    local name="$1"
    local data="$2"
    
    echo "🧪 测试: $name"
    echo "----------------------------------------"
    
    local result=$(echo "$data" | curl -X POST \
        -H "Content-Type: application/json" \
        -d @- \
        "$API_BASE/analyze/quick" \
        -s --max-time 60)
    
    if [ $? -eq 0 ]; then
        echo "📊 结果分析:"
        echo "$result" | jq -r '
            "   风险级别: " + .data.riskLevel,
            "   系统健康: " + .data.systemHealth,
            "   异常检测: " + (.data.agentResults[] | select(.agentName == "AnomalyDetectionAgent") | .data.anomalies | length | tostring) + " 个",
            "   UI阻塞模式: " + (.data.agentResults[] | select(.agentName == "BehaviorAnalysisAgent") | .data.userBehavior.uiBlockingPatterns | length | tostring) + " 个",
            "   LLM置信度: " + (.data.agentResults[] | select(.agentName == "LLMFeatureExtractionAgent") | .confidence | tostring),
            "   处理时间: " + (.data.agentResults[] | select(.agentName == "LLMFeatureExtractionAgent") | .processingTime | tostring) + "ms"
        ' 2>/dev/null || echo "   解析失败"
    else
        echo "❌ 请求失败"
    fi
    
    echo ""
}

# 1. 内存泄漏检测测试
test_scenario "内存泄漏检测" '{
  "logs": [
    {"id": "mem-01", "timestamp": "2025-01-10T14:30:01.000Z", "level": "INFO", "source": "monitor", "service": "system", "message": "内存使用率", "metadata": {"memoryUsage": "45%", "availableMemory": "4GB"}},
    {"id": "mem-02", "timestamp": "2025-01-10T14:31:01.000Z", "level": "WARN", "source": "monitor", "service": "system", "message": "内存使用率", "metadata": {"memoryUsage": "65%", "availableMemory": "2.8GB"}},
    {"id": "mem-03", "timestamp": "2025-01-10T14:32:01.000Z", "level": "WARN", "source": "monitor", "service": "system", "message": "内存使用率", "metadata": {"memoryUsage": "78%", "availableMemory": "1.8GB"}},
    {"id": "mem-04", "timestamp": "2025-01-10T14:33:01.000Z", "level": "ERROR", "source": "monitor", "service": "system", "message": "内存使用率", "metadata": {"memoryUsage": "89%", "availableMemory": "0.9GB"}},
    {"id": "mem-05", "timestamp": "2025-01-10T14:34:01.000Z", "level": "CRITICAL", "source": "monitor", "service": "system", "message": "内存使用率", "metadata": {"memoryUsage": "95%", "availableMemory": "0.4GB"}},
    {"id": "mem-06", "timestamp": "2025-01-10T14:35:01.000Z", "level": "FATAL", "source": "application", "service": "java", "message": "OutOfMemoryError", "metadata": {"heapSize": "8GB", "error": "Java heap space"}}
  ]
}'

# 2. API限流触发测试
test_scenario "API限流触发" '{
  "logs": [
    {"id": "rate-01", "timestamp": "2025-01-10T14:30:01.000Z", "level": "INFO", "source": "api", "service": "gateway", "message": "API请求", "metadata": {"endpoint": "/api/data", "userId": "user-999", "requestCount": 50}},
    {"id": "rate-02", "timestamp": "2025-01-10T14:30:02.000Z", "level": "INFO", "source": "api", "service": "gateway", "message": "API请求", "metadata": {"endpoint": "/api/data", "userId": "user-999", "requestCount": 100}},
    {"id": "rate-03", "timestamp": "2025-01-10T14:30:03.000Z", "level": "WARN", "source": "api", "service": "gateway", "message": "请求频率过高", "metadata": {"endpoint": "/api/data", "userId": "user-999", "requestCount": 150, "limit": 100}},
    {"id": "rate-04", "timestamp": "2025-01-10T14:30:04.000Z", "level": "ERROR", "source": "api", "service": "ratelimiter", "message": "触发限流", "metadata": {"endpoint": "/api/data", "userId": "user-999", "requestCount": 200, "action": "blocked"}},
    {"id": "rate-05", "timestamp": "2025-01-10T14:30:05.000Z", "level": "ERROR", "source": "api", "service": "ratelimiter", "message": "持续限流", "metadata": {"endpoint": "/api/data", "userId": "user-999", "blockedRequests": 50}}
  ]
}'

# 3. 数据库死锁检测
test_scenario "数据库死锁检测" '{
  "logs": [
    {"id": "db-01", "timestamp": "2025-01-10T14:30:01.000Z", "level": "INFO", "source": "database", "service": "mysql", "message": "事务开始", "metadata": {"transactionId": "tx-001", "table": "users", "operation": "UPDATE"}},
    {"id": "db-02", "timestamp": "2025-01-10T14:30:01.100Z", "level": "INFO", "source": "database", "service": "mysql", "message": "事务开始", "metadata": {"transactionId": "tx-002", "table": "orders", "operation": "INSERT"}},
    {"id": "db-03", "timestamp": "2025-01-10T14:30:02.000Z", "level": "WARN", "source": "database", "service": "mysql", "message": "锁等待", "metadata": {"transactionId": "tx-001", "waitingFor": "tx-002", "timeout": "5s"}},
    {"id": "db-04", "timestamp": "2025-01-10T14:30:02.100Z", "level": "WARN", "source": "database", "service": "mysql", "message": "锁等待", "metadata": {"transactionId": "tx-002", "waitingFor": "tx-001", "timeout": "5s"}},
    {"id": "db-05", "timestamp": "2025-01-10T14:30:07.000Z", "level": "ERROR", "source": "database", "service": "mysql", "message": "检测到死锁", "metadata": {"victim": "tx-001", "rollback": true, "error": "Deadlock found when trying to get lock"}},
    {"id": "db-06", "timestamp": "2025-01-10T14:30:07.100Z", "level": "INFO", "source": "database", "service": "mysql", "message": "事务回滚", "metadata": {"transactionId": "tx-001", "reason": "deadlock_victim"}}
  ]
}'

# 4. 异常用户行为检测
test_scenario "异常用户行为" '{
  "logs": [
    {"id": "usr-01", "timestamp": "2025-01-10T14:30:01.000Z", "level": "INFO", "source": "frontend", "service": "auth", "message": "用户登录", "metadata": {"userId": "suspicious-user", "ip": "203.0.113.1", "location": "China"}},
    {"id": "usr-02", "timestamp": "2025-01-10T14:30:05.000Z", "level": "INFO", "source": "frontend", "service": "auth", "message": "用户登录", "metadata": {"userId": "suspicious-user", "ip": "198.51.100.1", "location": "USA"}},
    {"id": "usr-03", "timestamp": "2025-01-10T14:30:10.000Z", "level": "INFO", "source": "frontend", "service": "download", "message": "批量下载", "metadata": {"userId": "suspicious-user", "fileCount": 500, "totalSize": "10GB"}},
    {"id": "usr-04", "timestamp": "2025-01-10T14:30:15.000Z", "level": "WARN", "source": "security", "service": "behavior", "message": "异常下载行为", "metadata": {"userId": "suspicious-user", "downloadRate": "2GB/min", "threshold": "100MB/min"}},
    {"id": "usr-05", "timestamp": "2025-01-10T14:30:20.000Z", "level": "ERROR", "source": "security", "service": "behavior", "message": "可疑数据导出", "metadata": {"userId": "suspicious-user", "sensitiveData": true, "records": 100000}}
  ]
}'

# 5. 服务雪崩效应
test_scenario "服务雪崩效应" '{
  "logs": [
    {"id": "av-01", "timestamp": "2025-01-10T14:30:01.000Z", "level": "INFO", "source": "service-a", "service": "api", "message": "服务正常", "metadata": {"responseTime": "50ms", "successRate": "99.5%"}},
    {"id": "av-02", "timestamp": "2025-01-10T14:30:10.000Z", "level": "WARN", "source": "service-a", "service": "api", "message": "响应时间增加", "metadata": {"responseTime": "500ms", "successRate": "95%"}},
    {"id": "av-03", "timestamp": "2025-01-10T14:30:15.000Z", "level": "ERROR", "source": "service-a", "service": "api", "message": "服务超时", "metadata": {"responseTime": "30000ms", "successRate": "60%"}},
    {"id": "av-04", "timestamp": "2025-01-10T14:30:16.000Z", "level": "ERROR", "source": "service-b", "service": "api", "message": "依赖服务失败", "metadata": {"dependency": "service-a", "failureRate": "40%"}},
    {"id": "av-05", "timestamp": "2025-01-10T14:30:17.000Z", "level": "CRITICAL", "source": "service-c", "service": "api", "message": "连锁反应", "metadata": {"dependencies": ["service-a", "service-b"], "available": false}},
    {"id": "av-06", "timestamp": "2025-01-10T14:30:18.000Z", "level": "FATAL", "source": "system", "service": "orchestrator", "message": "系统不可用", "metadata": {"affectedServices": 3, "totalServices": 5, "availability": "40%"}}
  ]
}'

# 6. 正常业务流程对比
test_scenario "正常业务流程" '{
  "logs": [
    {"id": "norm-01", "timestamp": "2025-01-10T14:30:01.000Z", "level": "INFO", "source": "frontend", "service": "shop", "message": "用户浏览商品", "metadata": {"userId": "normal-user", "productId": "prod-123", "category": "electronics"}},
    {"id": "norm-02", "timestamp": "2025-01-10T14:30:30.000Z", "level": "INFO", "source": "frontend", "service": "shop", "message": "添加到购物车", "metadata": {"userId": "normal-user", "productId": "prod-123", "quantity": 1}},
    {"id": "norm-03", "timestamp": "2025-01-10T14:31:00.000Z", "level": "INFO", "source": "frontend", "service": "checkout", "message": "开始结账", "metadata": {"userId": "normal-user", "cartValue": 299.99}},
    {"id": "norm-04", "timestamp": "2025-01-10T14:31:30.000Z", "level": "INFO", "source": "backend", "service": "payment", "message": "处理支付", "metadata": {"userId": "normal-user", "amount": 299.99, "method": "credit_card"}},
    {"id": "norm-05", "timestamp": "2025-01-10T14:31:35.000Z", "level": "INFO", "source": "backend", "service": "payment", "message": "支付成功", "metadata": {"userId": "normal-user", "transactionId": "txn-abc123", "amount": 299.99}},
    {"id": "norm-06", "timestamp": "2025-01-10T14:31:36.000Z", "level": "INFO", "source": "backend", "service": "order", "message": "创建订单", "metadata": {"userId": "normal-user", "orderId": "order-456", "status": "confirmed"}}
  ]
}'

echo "✅ 快速场景测试完成！" 