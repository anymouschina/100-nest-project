#!/bin/bash

# 向量数据库功能测试脚本
echo "=== 向量数据库功能测试 ==="

# 检查Qdrant服务是否运行
echo "1. 检查Qdrant服务状态..."
if curl -s -f http://localhost:6333/health > /dev/null; then
    echo "✅ Qdrant服务正常运行"
else
    echo "❌ Qdrant服务未运行，请先启动服务："
    echo "   docker-compose up -d qdrant"
    exit 1
fi

# 检查Qdrant集合
echo ""
echo "2. 检查向量集合..."
collections=$(curl -s http://localhost:6333/collections | jq -r '.result.collections[].name' 2>/dev/null)
if [[ $collections == *"log_analysis_knowledge"* ]]; then
    echo "✅ log_analysis_knowledge 集合存在"
else
    echo "⚠️  log_analysis_knowledge 集合不存在，正在初始化..."
    npm run vector:init
fi

# 测试AI日志分析API
echo ""
echo "3. 测试AI日志分析功能..."
response=$(curl -s -X POST http://localhost:3000/api/log-analysis/real-ai \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "userFeedback": "数据库连接出现问题",
    "logData": [
      "ERROR: Database connection timeout after 30 seconds",
      "WARN: Connection pool exhausted, waiting for available connection",
      "ERROR: Failed to establish connection to PostgreSQL server"
    ],
    "aiOptions": {
      "useSemanticSearch": true,
      "useAnomalyDetection": true,
      "useFeatureExtraction": true
    }
  }' 2>/dev/null)

if [[ $? -eq 0 ]] && [[ -n "$response" ]]; then
    echo "✅ AI日志分析API响应正常"
    echo "响应数据:"
    echo "$response" | jq . 2>/dev/null || echo "$response"
else
    echo "⚠️  AI日志分析API测试失败，可能原因："
    echo "   - 服务器未启动 (请运行 npm run start:dev)"
    echo "   - 认证问题"
    echo "   - 向量数据库未正确初始化"
fi

# 测试向量搜索功能
echo ""
echo "4. 测试向量语义搜索..."
search_response=$(curl -s -X GET "http://localhost:3000/api/ai/knowledge/search?query=数据库连接超时&limit=3" \
  -H "Authorization: Bearer test-token" 2>/dev/null)

if [[ $? -eq 0 ]] && [[ -n "$search_response" ]]; then
    echo "✅ 向量语义搜索API响应正常"
    echo "搜索结果:"
    echo "$search_response" | jq . 2>/dev/null || echo "$search_response"
else
    echo "⚠️  向量语义搜索测试失败"
fi

# 显示Qdrant统计信息
echo ""
echo "5. Qdrant统计信息..."
stats=$(curl -s http://localhost:6333/collections/log_analysis_knowledge | jq . 2>/dev/null)
if [[ -n "$stats" ]]; then
    echo "集合统计:"
    echo "$stats" | jq '.result | {vectors_count, indexed_vectors_count, payload_schema}' 2>/dev/null
else
    echo "无法获取统计信息"
fi

echo ""
echo "=== 测试完成 ==="
echo ""
echo "如果测试失败，请检查："
echo "1. Qdrant服务是否正常启动: docker-compose up -d qdrant"
echo "2. 向量数据库是否已初始化: npm run vector:init"
echo "3. 应用服务器是否运行: npm run start:dev"
echo "4. 环境变量配置是否正确" 