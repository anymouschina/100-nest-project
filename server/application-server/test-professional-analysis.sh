#!/bin/bash

echo "🏢 专业群聊分析服务测试"
echo "================================"
echo ""

echo "📋 接口说明:"
echo "• 🎯 专业分析接口：/wechat-summary/analyze-group-chat"
echo "• 📊 简洁参数设计：talker + time"
echo "• 🔄 流式分析版本：/wechat-summary/analyze-group-chat-stream"
echo "• 📈 专业日报格式：参考外部分析服务标准"
echo "• 🧠 智能预处理：语义过滤 + 动态Token管理"
echo ""

echo "🧪 测试1: 专业群聊分析（标准版）"
echo "================================"

curl -X POST "http://localhost:3001/wechat-summary/analyze-group-chat" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "talker": "47537114759@chatroom",
    "time": "2025-06-15"
  }' | jq '.'

echo ""
echo ""
echo "🧪 测试2: 专业群聊分析（流式版）"
echo "================================"

curl -X POST "http://localhost:3001/wechat-summary/analyze-group-chat-stream" \
  -H "Content-Type: application/json" \
  -H "Accept: text/plain" \
  -d '{
    "talker": "47537114759@chatroom", 
    "time": "2025-06-15"
  }' \
  --no-buffer

echo ""
echo ""
echo "🧪 测试3: 错误处理测试"
echo "====================="

echo "测试缺少参数："
curl -X POST "http://localhost:3001/wechat-summary/analyze-group-chat" \
  -H "Content-Type: application/json" \
  -d '{"talker": "test"}' | jq '.'

echo ""
echo "测试无效日期："
curl -X POST "http://localhost:3001/wechat-summary/analyze-group-chat" \
  -H "Content-Type: application/json" \
  -d '{
    "talker": "nonexistent@chatroom",
    "time": "2025-01-01"
  }' | jq '.'

echo ""
echo "================================"
echo "✅ 专业分析服务测试完成"
echo ""

echo "📊 API对比："
echo "外部服务: https://chat-analysis.870003719.xyz/api/analyze-group-chat"
echo "本地服务: http://localhost:3001/wechat-summary/analyze-group-chat"
echo ""

echo "🔧 参数格式："
echo '{
  "talker": "群聊ID（如：47537114759@chatroom）",
  "time": "分析日期（如：2025-06-15）"
}'

echo ""
echo "📈 返回格式："
echo '{
  "success": true,
  "data": {
    "title": "群聊总结标题",
    "groupStyleReview": {...},
    "keyTopics": [...],
    "insights": {...},
    "statistics": {...},
    "metadata": {
      "talker": "群聊ID",
      "time": "分析日期",
      "messageCount": 消息数量,
      "analysisTime": "分析时间",
      "version": "2.0"
    }
  }
}' 