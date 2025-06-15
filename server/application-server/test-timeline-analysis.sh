#!/bin/bash

echo "🕒 测试LangChain时间线分析功能"
echo "================================"
echo ""

echo "📋 测试说明:"
echo "• 🧠 智能数据预处理：基于语义的过滤和去重"
echo "• ⚡ 动态Token管理：根据模型上下文窗口自动优化"
echo "• 🕒 时间线分析：按时间展示多个主题和演进过程"
echo "• 📊 文档重要性评分：智能选择最有价值的内容"
echo "• 🚫 禁用深度思考模式：直接输出结构化结果"
echo ""

echo "🧪 测试1: 流式时间线分析"
echo "========================"

curl -X POST "http://localhost:3001/wechat-summary/langchain-summary-stream" \
  -H "Content-Type: application/json" \
  -H "Accept: text/plain" \
  -d '{
    "groupName": "VIP#独开+副业+自媒体| 陈随易",
    "specificDate": "2025-06-15",
    "summaryType": "daily",
    "customPrompt": "按时间线详细分析今日群聊，识别多个讨论主题，展示时间段、参与者和内容演进"
  }' \
  --no-buffer

echo ""
echo ""
echo "🧪 测试2: 普通时间线分析"
echo "========================"

curl -X POST "http://localhost:3001/wechat-summary/langchain-summary" \
  -H "Content-Type: application/json" \
  -d '{
    "groupName": "VIP#独开+副业+自媒体| 陈随易", 
    "specificDate": "2025-06-15",
    "summaryType": "daily",
    "customPrompt": "按时间线分析今日群聊，重点关注主题演进和参与者互动"
  }' | jq '.'

echo ""
echo "================================"
echo "✅ 时间线分析测试完成"
echo ""
echo "📊 期望结果格式:"
echo '{
  "summary": "一天聊天的整体概况",
  "timeline": [
    {
      "timeRange": "09:00-11:00",
      "topic": "主题名称",
      "participants": ["参与者1", "参与者2"],
      "content": "核心讨论内容",
      "keyPoints": ["要点1", "要点2"]
    }
  ],
  "mainTopics": ["主题1", "主题2", "主题3"],
  "activeParticipants": ["活跃参与者"],
  "insights": "深度分析",
  "actionItems": ["待办事项"],
  "topicConnections": "主题关联性"
}' 