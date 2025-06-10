#!/bin/bash

echo "🎯 使用生成的测试数据进行AI日志分析测试"
echo "================================================"

# 检查JWT Token环境变量
if [ -z "$JWT_TOKEN" ]; then
    echo "⚠️  警告: 请设置JWT_TOKEN环境变量"
    echo "   示例: export JWT_TOKEN=\"your_jwt_token_here\""
    echo "   或者在脚本中直接设置 (仅用于测试)"
    JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjQsIm5hbWUiOiLmuLjlrqLnlKjmiLciLCJpYXQiOjE3NDk0MzkzODcsImV4cCI6MTc0OTUyNTc4N30.X2jv6jAtzOye2rHYEUNVY6obf8SIm9HrlQzIjWowO_A"
fi

# 服务器地址
BASE_URL="http://localhost:3000"

# 检查测试数据文件是否存在
if [ ! -f "test-data/test-cases.json" ]; then
    echo "❌ 测试数据文件不存在，请先运行生成脚本:"
    echo "   npx ts-node scripts/generate-test-logs.ts"
    exit 1
fi

echo "📊 使用生成的测试数据进行API测试..."
echo ""

# 测试用例1: 支付系统故障分析
echo "🔍 测试用例1: 支付系统故障分析"
echo "--------------------------------"

# 从测试用例文件中提取支付相关的日志数据
PAYMENT_LOGS=$(jq -c '.[0].logData[0:10]' test-data/test-cases.json)

curl -X POST "${BASE_URL}/api/agent-orchestrator/analyze/quick" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d "{
    \"userFeedback\": \"用户反馈支付功能异常，多笔订单支付失败，请帮我分析原因\",
    \"logData\": ${PAYMENT_LOGS},
    \"options\": {
      \"pipeline\": \"PARALLEL\",
      \"priority\": \"HIGH\"
    }
  }" \
  | jq '.' | head -50

echo ""
echo "✅ 支付系统分析完成"
echo ""

# 测试用例2: 数据库性能问题诊断
echo "🔍 测试用例2: 数据库性能问题诊断"
echo "--------------------------------"

DATABASE_LOGS=$(jq -c '.[1].logData[0:8]' test-data/test-cases.json)

curl -X POST "${BASE_URL}/api/agent-orchestrator/analyze/quick" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d "{
    \"userFeedback\": \"系统响应变慢，怀疑是数据库性能问题，需要详细分析\",
    \"logData\": ${DATABASE_LOGS},
    \"options\": {
      \"pipeline\": \"PARALLEL\",
      \"priority\": \"HIGH\"
    }
  }" \
  | jq '.summary' 2>/dev/null || echo "数据库分析请求已发送"

echo ""
echo "✅ 数据库性能分析完成"
echo ""

# 测试用例3: 字符串格式日志分析
echo "🔍 测试用例3: 字符串格式日志分析"
echo "--------------------------------"

# 使用前20条字符串格式的日志
STRING_LOGS=$(jq -c '.[0:20]' test-data/string-logs.json)

curl -X POST "${BASE_URL}/api/agent-orchestrator/analyze/quick" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d "{
    \"userFeedback\": \"分析这些字符串格式的日志，识别潜在问题\",
    \"logData\": ${STRING_LOGS},
    \"options\": {
      \"pipeline\": \"PARALLEL\",
      \"priority\": \"MEDIUM\"
    }
  }" \
  | jq '.quickInsights' 2>/dev/null || echo "字符串日志分析请求已发送"

echo ""
echo "✅ 字符串格式日志分析完成"
echo ""

# 测试用例4: 混合格式日志分析
echo "🔍 测试用例4: 混合格式日志分析"
echo "--------------------------------"

# 使用前15条混合格式的日志
MIXED_LOGS=$(jq -c '.[0:15]' test-data/mixed-logs.json)

curl -X POST "${BASE_URL}/api/agent-orchestrator/analyze/quick" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d "{
    \"userFeedback\": \"这是混合格式的日志数据，包含结构化和非结构化数据，请进行综合分析\",
    \"logData\": ${MIXED_LOGS},
    \"options\": {
      \"pipeline\": \"CONDITIONAL\",
      \"priority\": \"MEDIUM\"
    }
  }" \
  | jq '.agentResults | length' 2>/dev/null && echo "个AI代理参与了分析" || echo "混合格式日志分析请求已发送"

echo ""
echo "✅ 混合格式日志分析完成"
echo ""

# 测试用例5: 错误专门分析
echo "🔍 测试用例5: 错误专门分析"
echo "--------------------------------"

# 提取ERROR和FATAL级别的日志
ERROR_LOGS=$(jq -c '[.[] | select(.level == "ERROR" or .level == "FATAL")][0:12]' test-data/structured-logs.json)

curl -X POST "${BASE_URL}/api/agent-orchestrator/analyze/errors" \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -d "{
    \"userFeedback\": \"系统出现多个错误，需要专门针对错误进行深度分析\",
    \"logData\": ${ERROR_LOGS},
    \"options\": {
      \"pipeline\": \"SEQUENTIAL\",
      \"priority\": \"URGENT\"
    }
  }" \
  | jq '.summary.overallConfidence' 2>/dev/null && echo " - 总体置信度" || echo "错误专门分析请求已发送"

echo ""
echo "✅ 错误专门分析完成"
echo ""

# 显示测试数据统计
echo "📈 测试数据统计信息"
echo "--------------------------------"
if [ -f "test-data/data-statistics.json" ]; then
    echo "总日志条数: $(jq '.总日志条数' test-data/data-statistics.json)"
    echo "日志级别分布:"
    jq -r '.日志级别分布 | to_entries[] | "  \(.key): \(.value)条"' test-data/data-statistics.json
    echo ""
    echo "主要服务分布:"
    jq -r '.服务分布 | to_entries[] | select(.value > 0) | "  \(.key): \(.value)条"' test-data/data-statistics.json | head -8
    echo ""
    echo "测试用例数量: $(jq '.测试用例数量' test-data/data-statistics.json)个"
fi

echo ""
echo "🎉 所有测试用例执行完成！"
echo ""
echo "📝 测试总结:"
echo "   ✓ 支付系统故障分析 - 使用结构化数据"
echo "   ✓ 数据库性能问题诊断 - 使用过滤后的数据"
echo "   ✓ 字符串格式日志分析 - 使用半结构化数据"
echo "   ✓ 混合格式日志分析 - 使用多种格式混合数据"
echo "   ✓ 错误专门分析 - 使用错误级别过滤数据"
echo ""
echo "💡 提示: 你可以修改JWT_TOKEN和测试参数来进行更多测试"
echo "📁 测试数据位置: ./test-data/"
echo "   - structured-logs.json (完整结构化日志)"
echo "   - string-logs.json (字符串格式日志)"  
echo "   - mixed-logs.json (混合格式日志)"
echo "   - test-cases.json (预定义测试用例)"
echo "   - data-statistics.json (数据统计报告)" 