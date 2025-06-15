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
  "title": "2025-06-15 群聊总结：核心主题概括",
  "groupStyleReview": {
    "description": "群聊风格评价，包括活跃度、话题质量、讨论氛围等",
    "activityLevel": "高",
    "topicQuality": "优秀",
    "discussionAtmosphere": "和谐"
  },
  "keyTopics": [
    {
      "rank": "1️⃣",
      "title": "AI工具应用与商业模式探讨",
      "heatLevel": "🔥🔥🔥",
      "participants": ["参与者1", "参与者2", "参与者3"],
      "timeRange": {
        "start": "11:26:23",
        "end": "12:57:47",
        "startContent": "开始时的关键内容",
        "endContent": "结束时的关键内容"
      },
      "process": "详细描述讨论过程，包括关键观点、争议点、解决方案等",
      "evaluation": "对该话题的价值评价和意义分析",
      "businessValue": "商业价值评估"
    }
  ],
  "insights": {
    "overallValue": "今日讨论的整体价值和意义",
    "keyLearnings": ["学习要点1", "学习要点2"],
    "actionItems": ["待办事项1", "待办事项2"],
    "trends": "话题趋势和发展方向分析"
  },
  "statistics": {
    "totalMessages": 393,
    "activeParticipants": ["最活跃参与者列表"],
    "peakTime": "讨论最活跃的时间段",
    "topicCount": "讨论话题总数"
  }
}' 