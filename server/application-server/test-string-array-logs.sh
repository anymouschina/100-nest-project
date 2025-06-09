#!/bin/bash

# 测试字符串数组格式的日志分析API

echo "🚀 开始测试字符串数组格式的日志分析..."

# 1. 先获取访问Token
echo "📝 步骤1: 获取访问Token..."
AUTH_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/guest-login \
  -H "Content-Type: application/json")

# 提取token
ACCESS_TOKEN=$(echo $AUTH_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ 获取访问Token失败"
  echo "响应: $AUTH_RESPONSE"
  exit 1
fi

echo "✅ 访问Token获取成功: ${ACCESS_TOKEN:0:50}..."

# 2. 测试字符串数组格式的日志分析
echo ""
echo "📝 步骤2: 测试字符串数组格式日志分析..."

# 示例1：前端错误日志
echo "测试1: 前端错误日志数组"
FRONTEND_RESPONSE=$(curl -s -X POST "http://localhost:3001/api/log-analysis/analyze/manual" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userFeedback": "支付页面出现错误",
    "logData": [
      "2024-01-15 14:30:25 ERROR [Frontend] Payment component crashed",
      "TypeError: Cannot read property amount of null",
      "at PaymentComponent.calculateTotal (PaymentComponent.js:42:15)",
      "at PaymentComponent.render (PaymentComponent.js:108:9)",
      "User ID: 12345, Session: sess_abc123"
    ],
    "analysisOptions": {
      "enableFeatureExtraction": true,
      "enableSimilarSearch": true,
      "enableAnomalyDetection": true
    }
  }')

echo "前端错误日志分析结果:"
echo $FRONTEND_RESPONSE | python3 -m json.tool 2>/dev/null || echo $FRONTEND_RESPONSE

echo ""
echo "测试2: 后端服务错误日志数组"
BACKEND_RESPONSE=$(curl -s -X POST "http://localhost:3001/api/log-analysis/analyze/manual" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userFeedback": "API调用失败",
    "logData": [
      "2024-01-15T14:30:25.123Z INFO [backend] API request received",
      "2024-01-15T14:30:25.456Z ERROR [payment-service] Database connection timeout",
      "2024-01-15T14:30:25.789Z FATAL [payment-service] Transaction rollback failed",
      "Stack trace:",
      "at DatabaseConnection.query (db.js:156:12)",
      "at PaymentService.processPayment (payment.js:89:7)",
      "Metadata: {\"userId\": 12345, \"orderId\": \"ORD-001\", \"retCode\": 500}"
    ],
    "analysisOptions": {
      "enableFeatureExtraction": true,
      "enableSimilarSearch": true,
      "enableAnomalyDetection": true
    }
  }')

echo "后端服务错误日志分析结果:"
echo $BACKEND_RESPONSE | python3 -m json.tool 2>/dev/null || echo $BACKEND_RESPONSE

echo ""
echo "测试3: 移动端应用日志数组"
MOBILE_RESPONSE=$(curl -s -X POST "http://localhost:3001/api/log-analysis/analyze/manual" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userFeedback": "App崩溃了",
    "logData": [
      "2024-01-15 14:30:25 DEBUG [iOS App] User login attempt",
      "2024-01-15 14:30:26 WARN [iOS App] Network connection unstable",
      "2024-01-15 14:30:27 ERROR [iOS App] Memory warning received",
      "2024-01-15 14:30:28 CRITICAL [iOS App] Application terminated unexpectedly",
      "Device: iPhone 14 Pro, iOS 17.1",
      "Free memory: 45MB"
    ],
    "analysisOptions": {
      "enableFeatureExtraction": false,
      "enableSimilarSearch": false,
      "enableAnomalyDetection": true
    }
  }')

echo "移动端应用日志分析结果:"
echo $MOBILE_RESPONSE | python3 -m json.tool 2>/dev/null || echo $MOBILE_RESPONSE

echo ""
echo "测试4: 混合格式日志数组"
MIXED_RESPONSE=$(curl -s -X POST "http://localhost:3001/api/log-analysis/analyze/manual" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userFeedback": "系统出现多个问题",
    "logData": [
      "[2024-01-15 14:30:25] WARN nginx: upstream timeout",
      "Jan 15 14:30:26 server01 ERROR: Redis connection lost",
      "2024/01/15 14:30:27 FATAL database: connection pool exhausted",
      "Exception in thread main java.lang.OutOfMemoryError: Java heap space"
    ],
    "analysisOptions": {
      "enableFeatureExtraction": true,
      "enableSimilarSearch": true,
      "enableAnomalyDetection": true
    }
  }')

echo "混合格式日志分析结果:"
echo $MIXED_RESPONSE | python3 -m json.tool 2>/dev/null || echo $MIXED_RESPONSE

echo ""
echo "🎉 字符串数组格式日志分析测试完成！" 