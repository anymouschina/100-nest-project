#!/bin/bash

# 测试新的AI代理编排API接口
# 注意：需要先启动服务器，并且要有有效的JWT token

BASE_URL="http://localhost:3000"
JWT_TOKEN="your-jwt-token-here"  # 需要替换为实际的JWT token

echo "🚀 开始测试AI代理编排API接口..."
echo "服务器地址: $BASE_URL"
echo ""

# 测试数据
TEST_LOG_DATA='[
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
  },
  {
    "id": "log-2",
    "timestamp": "2025-06-09T15:36:55.230Z",
    "level": "WARN",
    "source": "frontend",
    "service": "ui",
    "message": "Network request failed with timeout",
    "metadata": {
      "userId": "user-123",
      "sessionId": "session-456",
      "ip": "192.168.1.100",
      "userAgent": "Mozilla/5.0"
    }
  }
]'

echo "📋 测试数据准备完成"
echo ""

# 1. 测试获取代理列表
echo "🔍 测试1: 获取AI代理列表"
curl -X GET "$BASE_URL/api/agent-orchestrator/agents" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  | jq '.' || echo "请求失败或需要登录"
echo ""
echo "---"
echo ""

# 2. 测试快速日志分析 - 结构化对象格式
echo "⚡ 测试2: 快速日志分析 - 结构化对象格式"
curl -X POST "$BASE_URL/api/agent-orchestrator/analyze/quick" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"userFeedback\": \"我的系统出现了数据库连接超时的问题，需要快速分析原因\",
    \"logData\": $TEST_LOG_DATA,
    \"options\": {
      \"pipeline\": \"PARALLEL\",
      \"priority\": \"HIGH\"
    }
  }" \
  | jq '.' || echo "请求失败"
echo ""
echo "---"
echo ""

# 2.5. 测试快速日志分析 - string[]格式
echo "⚡ 测试2.5: 快速日志分析 - string[]格式"
curl -X POST "$BASE_URL/api/agent-orchestrator/analyze/quick" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userFeedback": "分析这些字符串格式的日志",
    "logData": [
      "2025-06-09T15:36:54.230Z ERROR [database] Connection timeout after 5000ms",
      "2025-06-09T15:36:55.230Z WARN [frontend] Network request failed",
      "2025-06-09T15:36:56.230Z INFO [backend] User login successful",
      "ERROR: Database connection pool exhausted",
      "FATAL: System critical failure detected"
    ],
    "options": {
      "pipeline": "PARALLEL",
      "priority": "HIGH"
    }
  }' \
  | jq '.' || echo "请求失败"
echo ""
echo "---"
echo ""

# 3. 测试错误专门分析
echo "🎯 测试3: 错误专门分析"
curl -X POST "$BASE_URL/api/agent-orchestrator/analyze/errors" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"userFeedback\": \"需要分析这些错误日志，找出根本原因\",
    \"logData\": $TEST_LOG_DATA
  }" \
  | jq '.' || echo "请求失败"
echo ""
echo "---"
echo ""

# 4. 测试综合分析
echo "📊 测试4: 综合AI分析"
curl -X POST "$BASE_URL/api/agent-orchestrator/analyze/comprehensive" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"userFeedback\": \"需要对这些日志进行全面的AI分析\",
    \"logData\": $TEST_LOG_DATA,
    \"pipeline\": \"SEQUENTIAL\",
    \"priority\": \"MEDIUM\",
    \"analysisType\": \"BATCH\"
  }" \
  | jq '.' || echo "请求失败"
echo ""
echo "---"
echo ""

# 5. 测试性能统计
echo "📈 测试5: 系统性能统计"
curl -X GET "$BASE_URL/api/agent-orchestrator/stats/performance" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  | jq '.' || echo "请求失败"
echo ""
echo "---"
echo ""

# 6. 测试代理健康检查
echo "🏥 测试6: 代理健康检查"
curl -X GET "$BASE_URL/api/agent-orchestrator/agents/AnomalyDetectionAgent/health" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  | jq '.' || echo "请求失败"
echo ""
echo "---"
echo ""

echo "🎉 API接口测试完成！"
echo ""
echo "📝 注意事项："
echo "1. 如果所有请求都失败，请检查："
echo "   - 服务器是否正在运行 (npm run start:dev)"
echo "   - JWT_TOKEN是否有效"
echo "   - 网络连接是否正常"
echo ""
echo "2. 新的API接口路径："
echo "   - 快速分析: POST /api/agent-orchestrator/analyze/quick"
echo "   - 错误分析: POST /api/agent-orchestrator/analyze/errors"
echo "   - 综合分析: POST /api/agent-orchestrator/analyze/comprehensive"
echo "   - 代理列表: GET /api/agent-orchestrator/agents"
echo "   - 性能统计: GET /api/agent-orchestrator/stats/performance"
echo ""
echo "3. 这些接口已替代旧的 /api/log-analysis/analyze/manual 接口" 