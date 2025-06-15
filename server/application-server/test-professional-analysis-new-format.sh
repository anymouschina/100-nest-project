#!/bin/bash

echo "🔍 测试新格式专业群聊分析功能"
echo "================================"
echo ""

echo "📋 新格式特点:"
echo "• 📝 summary_title: 群聊总结标题"
echo "• 💬 style_comment: 详细的群聊风格评价"
echo "• 📊 message_length: 消息总数"
echo "• 🔥 topics: 5-9个详细话题，包含开始结束消息"
echo "• 📚 extra_topics: 其他值得关注的话题"
echo "• 🔗 articles: 文章链接提取"
echo "• 🛠️ tools: 工具推荐提取"
echo "• 👥 top_speakers: 热门发言者统计"
echo ""

echo "🧪 测试1: 标准专业分析（新格式）"
echo "========================"

curl -X POST "http://localhost:3001/wechat-summary/analyze-group-chat" \
  -H "Content-Type: application/json" \
  -d '{
    "talker": "47537114759@chatroom",
    "time": "2025-06-14"
  }' | jq '.'

echo ""
echo ""
echo "🧪 测试2: 流式专业分析（新格式）"
echo "========================"

curl -X POST "http://localhost:3001/wechat-summary/analyze-group-chat-stream" \
  -H "Content-Type: application/json" \
  -d '{
    "talker": "47537114759@chatroom", 
    "time": "2025-06-14"
  }' \
  --no-buffer

echo ""
echo ""
echo "================================"
echo "✅ 新格式专业分析测试完成"
echo ""
echo "📊 期望的新格式结构:"
echo '{
  "success": true,
  "data": {
    "summary_title": "2025-06-14 群聊总结：AI工具、知识付费与商业模式探讨",
    "style_comment": "群聊内容活跃，话题集中在AI工具、知识付费、商业模式探讨以及程序员副业等领域。讨论深入，信息量大，但部分关于\"割韭菜\"的讨论略显激烈，存在一些认知差异。",
    "message_length": 28705,
    "topics": [
      {
        "title": "1️⃣ AI工具Cursor制作名片与朋友圈营销 🔥🔥🔥",
        "participants": ["流年#智能体#AI编程#MCP", "汪七北", "麒麟子MrKylin"],
        "time_range": "11:26:23 - 12:57:47",
        "process": "群友流年分享了使用AI工具Cursor制作个人名片和发售海报的经验...",
        "comment": "AI工具在个人品牌和营销中的应用案例，讨论了朋友圈营销的有效策略。",
        "start_message": {
          "sender": "流年#智能体#AI编程#MCP",
          "time": "11:26:23",
          "content": "ai把个人名片和发售海报都搞好了"
        },
        "end_message": {
          "sender": "俊哥 主业突破20万",
          "time": "12:57:47",
          "content": "[强]有见地"
        }
      }
    ],
    "extra_topics": ["闲鱼标题与互联网套路", "Bun专属定制API接口框架项目进展"],
    "articles": [
      {
        "title": "3分钟搞定19种Linux发行版和Windows全版本的系统重装",
        "link": "https://mp.weixin.qq.com/s?__biz=...",
        "description": "文章介绍了如何通过简单步骤重装Linux和Windows系统。"
      }
    ],
    "tools": [
      {
        "name": "Cursor",
        "description": "一款AI编程工具，可用于代码生成、名片设计、海报制作等。",
        "comments": ["ai把个人名片和发售海报都搞好了", "这块做的我就很满意"]
      }
    ],
    "top_speakers": ["飞刀先生", "麒麟子MrKylin 副业增收100万", "农村程序员陈随易"],
    "metadata": {
      "talker": "47537114759@chatroom",
      "time": "2025-06-14",
      "messageCount": 463,
      "analysisTime": "2025-06-15T12:52:37.063Z",
      "version": "2.0"
    }
  }
}'

echo ""
echo "🔄 对比说明:"
echo "• 新格式更接近参考的外部分析服务"
echo "• 包含具体的开始和结束消息内容"
echo "• 提取文章链接、工具推荐等额外信息"
echo "• 统计热门发言者和话题数量"
echo "• 提供更详细的群聊风格评价" 