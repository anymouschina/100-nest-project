#!/usr/bin/env node

/**
 * LangChain智能总结功能测试脚本
 * 包含按日期查询的curl命令示例
 */

console.log('=== LangChain智能总结功能测试 ===\n');

// 基础配置
const BASE_URL = 'http://localhost:3000';
const HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

console.log('📋 可用的curl命令示例：\n');

// 1. 使用相对时间查询（今天，时间线分析）
console.log('1️⃣ 使用相对时间查询（今天，时间线分析）：');
console.log(`curl -X POST "${BASE_URL}/wechat-summary/langchain-summary" \\
  -H "Content-Type: application/json" \\
  -d '{
    "groupName": "工作群",
    "relativeTime": "today",
    "summaryType": "daily",
    "customPrompt": "按时间线分析今日群聊，识别多个讨论主题和时间段"
  }'`);
console.log('');

// 2. 使用指定日期查询（单日）
console.log('2️⃣ 使用指定日期查询（单日）：');
console.log(`curl -X POST "${BASE_URL}/wechat-summary/langchain-summary" \\
  -H "Content-Type: application/json" \\
  -d '{
    "groupName": "技术讨论群",
    "specificDate": "2024-01-15",
    "summaryType": "topic",
    "customPrompt": "分析技术讨论的主要话题"
  }'`);
console.log('');

// 3. 使用指定日期范围查询
console.log('3️⃣ 使用指定日期范围查询：');
console.log(`curl -X POST "${BASE_URL}/wechat-summary/langchain-summary" \\
  -H "Content-Type: application/json" \\
  -d '{
    "groupName": "项目组",
    "specificDate": "2024-01-10~2024-01-15",
    "summaryType": "participant",
    "customPrompt": "分析团队成员的参与度和贡献"
  }'`);
console.log('');

// 4. 使用指定时间段查询
console.log('4️⃣ 使用指定时间段查询（精确到小时）：');
console.log(`curl -X POST "${BASE_URL}/wechat-summary/langchain-summary" \\
  -H "Content-Type: application/json" \\
  -d '{
    "groupName": "客服群",
    "specificDate": "2024-01-15/09:00~2024-01-15/18:00",
    "summaryType": "sentiment_analysis",
    "customPrompt": "分析工作时间内的客户情绪变化"
  }'`);
console.log('');

// 5. 情感分析
console.log('5️⃣ 情感分析：');
console.log(`curl -X POST "${BASE_URL}/wechat-summary/langchain-summary" \\
  -H "Content-Type: application/json" \\
  -d '{
    "groupName": "用户反馈群",
    "specificDate": "2024-01-15",
    "summaryType": "sentiment_analysis",
    "customPrompt": "重点分析用户满意度和投诉情况"
  }'`);
console.log('');

// 6. 活跃度分析
console.log('6️⃣ 活跃度分析：');
console.log(`curl -X POST "${BASE_URL}/wechat-summary/langchain-summary" \\
  -H "Content-Type: application/json" \\
  -d '{
    "groupName": "社区群",
    "specificDate": "2024-01-10~2024-01-16",
    "summaryType": "activity_analysis",
    "customPrompt": "分析一周内的用户活跃度趋势"
  }'`);
console.log('');

// 7. 关键词提取
console.log('7️⃣ 关键词提取：');
console.log(`curl -X POST "${BASE_URL}/wechat-summary/langchain-summary" \\
  -H "Content-Type: application/json" \\
  -d '{
    "groupName": "产品讨论群",
    "specificDate": "2024-01-15",
    "summaryType": "keyword_extraction",
    "customPrompt": "提取产品功能相关的关键词和热点话题"
  }'`);
console.log('');

// 8. 流式查询（时间线分析）
console.log('8️⃣ 流式查询（时间线分析，实时返回）：');
console.log(`curl -X POST "${BASE_URL}/wechat-summary/langchain-summary-stream" \\
  -H "Content-Type: application/json" \\
  -d '{
    "groupName": "开发群",
    "specificDate": "2024-01-15",
    "summaryType": "daily",
    "customPrompt": "按时间线分析今日开发讨论，展示多个主题和时间段的演进"
  }' \\
  --no-buffer`);
console.log('');

// 9. 不指定群名（分析所有群聊）
console.log('9️⃣ 分析所有群聊：');
console.log(`curl -X POST "${BASE_URL}/wechat-summary/langchain-summary" \\
  -H "Content-Type: application/json" \\
  -d '{
    "specificDate": "2024-01-15",
    "summaryType": "daily",
    "customPrompt": "总结今日所有群聊的重要信息"
  }'`);
console.log('');

// 10. 自定义分析
console.log('🔟 自定义分析：');
console.log(`curl -X POST "${BASE_URL}/wechat-summary/langchain-summary" \\
  -H "Content-Type: application/json" \\
  -d '{
    "groupName": "销售团队",
    "specificDate": "2024-01-15",
    "summaryType": "custom",
    "customPrompt": "请分析销售业绩、客户反馈、团队协作情况，并给出改进建议。重点关注：1.成交情况 2.客户满意度 3.团队配合度"
  }'`);
console.log('');

console.log('📝 参数说明：');
console.log('• groupName: 群聊名称（可选，不填则分析所有群聊）');
console.log('• relativeTime: 相对时间（today, yesterday, thisWeek, lastWeek, thisMonth, lastMonth, thisQuarter, lastQuarter）');
console.log('• specificDate: 指定日期，支持格式：');
console.log('  - 单日：2024-01-15');
console.log('  - 日期范围：2024-01-10~2024-01-15');
console.log('  - 时间段：2024-01-15/09:00~2024-01-15/18:00');
console.log('• summaryType: 分析类型（daily, topic, participant, sentiment_analysis, activity_analysis, keyword_extraction, custom）');
console.log('• customPrompt: 自定义提示词（可选）');
console.log('');

console.log('⚠️  注意事项：');
console.log('• relativeTime 和 specificDate 必须提供其中一个');
console.log('• specificDate 优先级高于 relativeTime');
console.log('• 流式接口会实时返回分析结果');
console.log('• LangChain会自动优化消息数据，提升分析质量');
console.log('• 现在使用qwen3模型，性能更优');
console.log('');

console.log('🚀 快速测试命令（使用今天的数据）：');
console.log(`curl -X POST "${BASE_URL}/wechat-summary/langchain-summary" \\
  -H "Content-Type: application/json" \\
  -d '{"relativeTime": "today", "summaryType": "daily"}'`); 