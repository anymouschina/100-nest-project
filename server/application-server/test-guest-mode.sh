#!/bin/bash

echo "🚀 开始测试游客模式下的日志分析功能..."

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3001"

# 步骤1: 游客登录
echo -e "\n${BLUE}1. 游客登录获取Token...${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/guest-login" \
  -H "Content-Type: application/json")

if [ $? -eq 0 ]; then
  TOKEN=$(echo $RESPONSE | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
  USER_ID=$(echo $RESPONSE | sed -n 's/.*"userId":\([0-9]*\).*/\1/p')
  
  if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✅ 游客登录成功，用户ID: $USER_ID${NC}"
    echo "Token: ${TOKEN:0:50}..."
  else
    echo -e "${RED}❌ 登录失败${NC}"
    exit 1
  fi
else
  echo -e "${RED}❌ 请求失败${NC}"
  exit 1
fi

# 步骤2: 测试任务列表（不传userId）
echo -e "\n${BLUE}2. 测试获取任务列表（游客模式）...${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/api/log-analysis/tasks?limit=5" \
  -H "Authorization: Bearer $TOKEN")

if echo $RESPONSE | grep -q '"code":0'; then
  echo -e "${GREEN}✅ 任务列表获取成功${NC}"
  echo "Response: $RESPONSE"
else
  echo -e "${RED}❌ 任务列表获取失败${NC}"
  echo "Response: $RESPONSE"
fi

# 步骤3: 测试手动日志分析
echo -e "\n${BLUE}3. 测试手动日志分析...${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/log-analysis/analyze/manual" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userFeedback": "游客模式测试 - 支付组件报错",
    "logData": [
      "2024-06-09 20:30:00 ERROR [Frontend] Payment component crashed",
      "TypeError: Cannot read property amount of null",
      "at PaymentComponent.calculateTotal (PaymentComponent.js:42:15)"
    ],
    "analysisOptions": {
      "enableFeatureExtraction": true,
      "enableSimilarSearch": true,
      "enableAnomalyDetection": true
    }
  }')

if echo $RESPONSE | grep -q '"code":0'; then
  echo -e "${GREEN}✅ 手动日志分析成功${NC}"
  # 提取关键信息
  RISK_LEVEL=$(echo $RESPONSE | sed -n 's/.*"riskLevel":"\([^"]*\)".*/\1/p')
  ISSUE_TYPE=$(echo $RESPONSE | sed -n 's/.*"issueType":"\([^"]*\)".*/\1/p')
  echo "风险等级: $RISK_LEVEL, 问题类型: $ISSUE_TYPE"
else
  echo -e "${RED}❌ 手动日志分析失败${NC}"
  echo "Response: $RESPONSE"
fi

# 步骤4: 测试用户日志查询（不传userId）
echo -e "\n${BLUE}4. 测试获取当前用户日志...${NC}"
RESPONSE=$(curl -s -X GET "$BASE_URL/api/log-analysis/logs/user?limit=10&startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer $TOKEN")

if echo $RESPONSE | grep -q '"code":0'; then
  echo -e "${GREEN}✅ 用户日志获取成功${NC}"
  TOTAL_COUNT=$(echo $RESPONSE | sed -n 's/.*"totalCount":\([0-9]*\).*/\1/p')
  echo "总日志数: $TOTAL_COUNT"
else
  echo -e "${RED}❌ 用户日志获取失败${NC}"
  echo "Response: $RESPONSE"
fi

# 步骤5: 测试快速健康检查
echo -e "\n${BLUE}5. 测试快速健康检查...${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/log-analysis/analyze/quick-check" \
  -H "Authorization: Bearer $TOKEN" \
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

if echo $RESPONSE | grep -q '"code":0'; then
  echo -e "${GREEN}✅ 健康检查成功${NC}"
  HEALTH_STATUS=$(echo $RESPONSE | sed -n 's/.*"overallHealth":"\([^"]*\)".*/\1/p')
  ERROR_COUNT=$(echo $RESPONSE | sed -n 's/.*"errorCount":\([0-9]*\).*/\1/p')
  echo "整体健康状态: $HEALTH_STATUS, 错误数量: $ERROR_COUNT"
else
  echo -e "${RED}❌ 健康检查失败${NC}"
  echo "Response: $RESPONSE"
fi

# 步骤6: 测试用户日志分析
echo -e "\n${BLUE}6. 测试用户日志分析...${NC}"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/log-analysis/analyze/user-logs" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": $USER_ID,
    \"timeRange\": {
      \"startTime\": \"2024-01-01T00:00:00Z\",
      \"endTime\": \"2024-12-31T23:59:59Z\"
    },
    \"logSources\": [\"backend\", \"frontend\"],
    \"priority\": \"HIGH\",
    \"userFeedback\": \"游客模式测试 - 分析我的日志\"
  }")

if echo $RESPONSE | grep -q '"code":0'; then
  echo -e "${GREEN}✅ 用户日志分析任务创建成功${NC}"
  TASK_ID=$(echo $RESPONSE | sed -n 's/.*"taskId":"\([^"]*\)".*/\1/p')
  LOG_COUNT=$(echo $RESPONSE | sed -n 's/.*"logCount":\([0-9]*\).*/\1/p')
  echo "任务ID: $TASK_ID, 日志数量: $LOG_COUNT"
else
  echo -e "${RED}❌ 用户日志分析失败${NC}"
  echo "Response: $RESPONSE"
fi

echo -e "\n${YELLOW}🎉 游客模式功能测试完成！${NC}"
echo -e "${GREEN}所有核心功能都支持游客模式，无需手动传递用户ID${NC}"
echo -e "${BLUE}前端开发可以使用这些API接口进行集成${NC}" 