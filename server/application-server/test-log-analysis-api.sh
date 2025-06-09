#!/bin/bash

# 用户日志分析API测试脚本

echo "🚀 开始测试日志分析API..."

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

# 2. 测试手动日志分析
echo ""
echo "📝 步骤2: 测试手动日志分析..."
MANUAL_RESPONSE=$(curl -s -X POST "http://localhost:3001/api/log-analysis/analyze/manual" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userFeedback": "支付页面崩溃了",
    "logData": {
      "level": "ERROR",
      "source": "frontend",
      "message": "Cannot read property amount of null at PaymentComponent",
      "metadata": {
        "userId": 12345,
        "orderId": "ORD-001",
        "retCode": 500
      }
    },
    "analysisOptions": {
      "enableFeatureExtraction": true,
      "enableSimilarSearch": true,
      "enableAnomalyDetection": true
    }
  }')

echo "手动日志分析结果:"
echo $MANUAL_RESPONSE | python3 -m json.tool 2>/dev/null || echo $MANUAL_RESPONSE

# 3. 测试用户ID日志分析
echo ""
echo "📝 步骤3: 测试用户ID日志分析..."
USER_LOGS_RESPONSE=$(curl -s -X POST "http://localhost:3001/api/log-analysis/analyze/user-logs" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 12345,
    "timeRange": {
      "startTime": "2024-01-01T00:00:00Z",
      "endTime": "2024-01-31T23:59:59Z"
    },
    "logSources": ["backend", "frontend"],
    "priority": "HIGH",
    "userFeedback": "用户反馈无法完成订单支付"
  }')

echo "用户日志分析结果:"
echo $USER_LOGS_RESPONSE | python3 -m json.tool 2>/dev/null || echo $USER_LOGS_RESPONSE

# 4. 测试获取用户历史日志
echo ""
echo "📝 步骤4: 测试获取用户历史日志..."
HISTORY_RESPONSE=$(curl -s -X GET "http://localhost:3001/api/log-analysis/logs/user/12345?startDate=2024-01-01&endDate=2024-01-31&level=ERROR&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "用户历史日志结果:"
echo $HISTORY_RESPONSE | python3 -m json.tool 2>/dev/null || echo $HISTORY_RESPONSE

# 5. 测试快速日志健康检查
echo ""
echo "📝 步骤5: 测试快速日志健康检查..."
HEALTH_CHECK_RESPONSE=$(curl -s -X POST "http://localhost:3001/api/log-analysis/analyze/quick-check" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "logEntries": [
      {
        "level": "ERROR",
        "source": "backend",
        "message": "Database connection timeout",
        "metadata": {"service": "user-service"}
      },
      {
        "level": "ERROR",
        "source": "frontend",
        "message": "Cannot read property amount of null"
      },
      {
        "level": "WARN",
        "source": "frontend",
        "message": "API response delayed"
      }
    ],
    "checkOptions": {
      "checkSeverity": true,
      "checkPatterns": true,
      "checkAnomalies": true
    }
  }')

echo "快速健康检查结果:"
echo $HEALTH_CHECK_RESPONSE | python3 -m json.tool 2>/dev/null || echo $HEALTH_CHECK_RESPONSE

echo ""
echo "🎉 所有API测试完成！" 