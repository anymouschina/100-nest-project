#!/bin/bash

echo "🤖 AI日志智能分析测试"
echo "============================"

# 设置JWT Token (请替换为您的有效token)
JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjQsIm5hbWUiOiLmuLjlrqLnlKjmiLciLCJpYXQiOjE3NDk0MzkzODcsImV4cCI6MTc0OTUyNTc4N30.X2jv6jAtzOye2rHYEUNVY6obf8SIm9HrlQzIjWowO_A"

echo "📊 正在发送AI分析请求..."

curl -X POST 'http://localhost:3000/api/agent-orchestrator/analyze/quick' \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d '{
    "userFeedback": "系统最近出现多次支付失败，用户反馈无法完成订单，请帮我分析一下原因",
    "logData": [
      {
        "id": "log-001",
        "timestamp": "2025-01-10T15:25:02.678Z",
        "level": "ERROR",
        "source": "order-service",
        "service": "payment-gateway",
        "message": "创建订单失败",
        "metadata": {
          "userId": "user-12345",
          "sessionId": "session-abc123",
          "trace_id": "TRC-20250110-152500",
          "error_code": "ORDER_003",
          "error_type": "business_logic_error",
          "cause": "课程库存不足（库存=0）",
          "http_status": 400,
          "retCode": 40001,
          "apiEndpoint": "/api/order/create",
          "responseTime": 1250,
          "related_services": ["inventory-service", "payment-gateway"]
        }
      },
      {
        "id": "log-002", 
        "timestamp": "2025-01-10T15:25:05.123Z",
        "level": "ERROR",
        "source": "backend",
        "service": "payment-gateway",
        "message": "第三方支付请求超时",
        "metadata": {
          "userId": "user-12345",
          "sessionId": "session-abc123",
          "trace_id": "TRC-20250110-152505",
          "error_code": "PAY_TIMEOUT",
          "paymentMethod": "wechat_pay",
          "amount": 199.00,
          "orderId": "ORDER-20250110-001",
          "retCode": 50003,
          "responseTime": 30000,
          "apiEndpoint": "/api/payment/process"
        }
      },
      {
        "id": "log-003",
        "timestamp": "2025-01-10T15:25:08.456Z", 
        "level": "ERROR",
        "source": "frontend",
        "service": "web-client",
        "message": "支付按钮点击无响应，JavaScript错误",
        "metadata": {
          "userId": "user-12345",
          "sessionId": "session-abc123",
          "errorType": "TypeError",
          "errorMessage": "Cannot read property '\''amount'\'' of undefined",
          "stackTrace": "at PaymentButton.onClick (payment.js:125:15)",
          "pageUrl": "/checkout",
          "userAgent": "Chrome/120.0.0.0",
          "retCode": 0
        }
      },
      {
        "id": "log-004",
        "timestamp": "2025-01-10T15:25:12.789Z",
        "level": "WARN", 
        "source": "database",
        "service": "mysql",
        "message": "数据库连接池接近饱和",
        "metadata": {
          "activeConnections": 48,
          "maxConnections": 50,
          "queueLength": 15,
          "avgResponseTime": 2500,
          "database": "order_management_system"
        }
      }
    ],
    "options": {
      "pipeline": "PARALLEL",
      "priority": "HIGH"
    }
  }' | jq '.'

echo ""
echo "✅ AI分析完成！" 