# 微信聊天记录AI总结功能

## 功能概述

本模块提供微信群聊记录的AI智能总结功能，通过集成Chatlog HTTP API查询微信聊天记录，并使用本地Ollama模型进行智能分析和总结。

## 主要特性

- 🤖 **AI智能总结**: 使用本地qwen3模型进行聊天记录分析
- 📱 **Chatlog集成**: 通过Chatlog HTTP API查询微信聊天记录
- 🕐 **智能时间范围**: 支持相对时间查询（今天、昨天、本周等）
- 🎯 **多种总结类型**: 日常总结、主题分析、参与者分析、自定义总结
- 🔍 **灵活查询**: 支持关键词搜索、指定发送者等条件
- 📊 **多种格式**: 支持JSON、CSV、文本等多种输出格式
- 🚫 **无需鉴权**: 接口无需身份验证，可直接调用
- 🔄 **智能解析**: 自动适配Chatlog API的数据结构，支持完整的群成员信息
- 🕒 **时间线分析**: 按时间线展示一天中的多个讨论主题和演进过程
- ⚡ **流式响应**: 支持实时流式返回分析结果
- 🧠 **LangChain优化**: 智能数据预处理，提升分析质量和效率

## 环境要求

### 1. Chatlog服务
```bash
# 下载并运行Chatlog
# 从 https://github.com/sjzar/chatlog/releases 下载对应版本

# 启动Chatlog HTTP服务
./chatlog server

# 默认服务地址: http://localhost:5030
```

### 2. Ollama服务
```bash
# 安装Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 拉取推荐模型
ollama pull qwen3

# 启动Ollama服务
ollama serve
```

### 3. 环境变量配置
```bash
# Chatlog服务地址
CHATLOG_BASE_URL=http://localhost:5030

# Ollama服务地址
OLLAMA_BASE_URL=http://localhost:11434

# 使用的AI模型
OLLAMA_MODEL=qwen3
```

## API接口

### 1. 群聊记录总结
```http
POST /wechat-summary/summarize
Content-Type: application/json

{
  "groupName": "工作群",
  "timeRange": "2024-01-15",
  "summaryType": "daily",
  "keyword": "项目进度"
}
```

**参数说明:**
- `groupName`: 群聊名称或ID（可选）
- `timeRange`: 时间范围，支持格式：
  - `2024-01-15`: 单日
  - `2024-01-15/09:00~2024-01-15/18:00`: 时间段
  - `2024-01-01~2024-01-31`: 日期范围
- `summaryType`: 总结类型
  - `daily`: 日常总结
  - `topic`: 主题分析
  - `participant`: 参与者分析
  - `custom`: 自定义总结
- `keyword`: 搜索关键词（可选）
- `sender`: 指定发送者（可选）

### 2. 智能时间范围总结
```http
POST /wechat-summary/smart-summary
Content-Type: application/json

{
  "groupName": "工作群",
  "relativeTime": "today",
  "summaryType": "daily"
}
```

**参数说明:**
- `relativeTime`: 相对时间
  - `today`: 今天
  - `yesterday`: 昨天
  - `thisWeek`: 本周
  - `lastWeek`: 上周
  - `thisMonth`: 本月
  - `lastMonth`: 上月

### 3. 获取群聊列表
```http
GET /wechat-summary/groups?keyword=+&format=json
```

**参数说明:**
- `keyword`: 搜索关键词（可选）
  - 留空或使用 `+` 获取所有群聊
  - 使用具体关键词进行搜索，如 `工作`
- `format`: 返回格式（可选，默认为json）
  - `json`: JSON格式
  - `csv`: CSV格式
  - `text`: 纯文本格式

**返回数据结构:**
```json
{
  "success": true,
  "data": {
    "chatRooms": [
      {
        "id": "47537114759@chatroom",
        "name": "VIP#独开+副业+自媒体| 陈随易",
        "memberCount": 500,
        "description": "",
        "owner": "",
        "users": [
          {
            "userName": "wxid_56dptrocfvci22",
            "displayName": ""
          }
        ]
      }
    ]
  }
}
```

**字段说明:**
- `id`: 群聊唯一标识符
- `name`: 群聊显示名称（优先使用nickName）
- `memberCount`: 群成员数量（基于users数组长度）
- `description`: 群聊描述（来自remark字段）
- `owner`: 群主信息
- `users`: 群成员列表，包含userName和displayName

**示例:**
```bash
# 获取所有群聊（JSON格式）
curl "http://localhost:3000/wechat-summary/groups?keyword=+&format=json"

# 搜索包含"工作"的群聊
curl "http://localhost:3000/wechat-summary/groups?keyword=工作"

# 获取CSV格式的群聊列表
curl "http://localhost:3000/wechat-summary/groups?format=csv"
```

### 4. 批量分析
```http
POST /wechat-summary/batch-analysis
Content-Type: application/json

{
  "groupNames": ["工作群", "项目群"],
  "timeRange": "2024-01-15",
  "analysisType": "daily"
}
```

### 5. 对比分析
```http
POST /wechat-summary/comparison-analysis
Content-Type: application/json

{
  "groupA": "工作群A",
  "groupB": "工作群B",
  "timeRange": "2024-01-15",
  "comparisonDimension": "activity"
}
```

### 6. LangChain智能总结
```http
POST /wechat-summary/langchain-summary
Content-Type: application/json

{
  "groupName": "工作群",
  "relativeTime": "today",
  "summaryType": "daily",
  "customPrompt": "按时间线分析今日群聊，识别多个讨论主题"
}
```

**新增参数:**
- `specificDate`: 指定日期查询，支持格式：
  - `2024-01-15`: 单日
  - `2024-01-10~2024-01-15`: 日期范围
  - `2024-01-15/09:00~2024-01-15/18:00`: 精确时间段
- `customPrompt`: 自定义分析提示词

**详细分析返回格式:**
```json
{
  "success": true,
  "data": {
    "title": "2025-06-15 群聊总结：AI工具、知识付费与商业模式探讨",
    "groupStyleReview": {
      "description": "群聊内容活跃，话题集中在AI工具、知识付费、商业模式探讨等领域。讨论深入，信息量大，存在一些认知差异。",
      "activityLevel": "高",
      "topicQuality": "优秀",
      "discussionAtmosphere": "激烈"
    },
    "keyTopics": [
      {
        "rank": "1️⃣",
        "title": "AI工具Cursor制作名片与朋友圈营销",
        "heatLevel": "🔥🔥🔥",
        "participants": ["流年#智能体#AI编程#MCP", "汪七北", "麒麟子MrKylin"],
        "timeRange": {
          "start": "11:26:23",
          "end": "12:57:47",
          "startContent": "ai把个人名片和发售海报都搞好了",
          "endContent": "[强]有见地"
        },
        "process": "群友流年分享了使用AI工具Cursor制作个人名片和发售海报的经验，并表示效果令人满意，成功吸引了客户。大家讨论了AI在营销中的应用，以及朋友圈营销的策略。",
        "evaluation": "AI工具在个人品牌和营销中的应用案例，讨论了朋友圈营销的有效策略。",
        "businessValue": "实用价值高，为个人品牌建设和营销推广提供了具体可行的方案"
      }
    ],
    "insights": {
      "overallValue": "今日讨论聚焦于AI工具的实际应用和商业价值，为群友提供了具体的实践指导",
      "keyLearnings": ["AI工具在营销中的实际应用", "朋友圈营销策略", "个人品牌建设方法"],
      "actionItems": ["尝试使用AI工具制作营销素材", "优化朋友圈内容策略"],
      "trends": "AI工具与传统营销结合的趋势日益明显，个人品牌建设需求增长"
    },
    "statistics": {
      "totalMessages": 393,
      "activeParticipants": ["流年#智能体#AI编程#MCP", "汪七北", "麒麟子MrKylin"],
      "peakTime": "11:26-12:57",
      "topicCount": 3
    }
  }
}
```

### 7. LangChain流式总结
```http
POST /wechat-summary/langchain-summary-stream
Content-Type: application/json

{
  "groupName": "工作群",
  "specificDate": "2024-01-15",
  "summaryType": "daily"
}
```

**特性:**
- 实时流式返回分析过程和结果
- 显示数据预处理进度
- 支持所有LangChain总结的参数

### 8. 专业群聊分析（推荐）
```http
POST /wechat-summary/analyze-group-chat
Content-Type: application/json

{
  "talker": "47537114759@chatroom",
  "time": "2025-06-15"
}
```

**特性:**
- 🎯 **专业设计**: 参考外部分析服务标准
- 📊 **简洁参数**: 只需群聊ID和日期
- 🧠 **智能预处理**: 语义过滤 + 动态Token管理
- 📈 **详细报告**: 群聊风格评价 + 重点话题分析
- ⚡ **高性能**: 基于现代LangChain最佳实践

**参数说明:**
- `talker`: 群聊ID（如：47537114759@chatroom）
- `time`: 分析日期（格式：YYYY-MM-DD）

### 9. 专业群聊分析（流式版）
```http
POST /wechat-summary/analyze-group-chat-stream
Content-Type: application/json

{
  "talker": "47537114759@chatroom",
  "time": "2025-06-15"
}
```

**特性:**
- 实时显示分析进度
- 专业日报格式输出
- 完整的错误处理机制

## 响应格式

### 成功响应
```json
{
  "success": true,
  "data": {
    "summary": "今日群聊主要讨论了项目进度...",
    "keyPoints": [
      "项目按计划推进",
      "需要解决技术难题",
      "下周进行测试"
    ],
    "participants": ["张三", "李四", "王五"],
    "timeRange": "2024-01-15",
    "messageCount": 45,
    "groupName": "工作群"
  }
}
```

### 错误响应
```json
{
  "success": false,
  "error": "Chatlog服务不可用，请确保Chatlog HTTP服务正在运行"
}
```

## 故障排除

### 1. Chatlog服务不可用
- 检查Chatlog是否正在运行：访问 `http://localhost:5030/api/v1/session`
- 确认Chatlog已正确解密微信数据
- 检查CHATLOG_BASE_URL配置是否正确

### 2. Ollama服务不可用
- 检查Ollama是否正在运行：`ollama list`
- 确认模型已下载：`ollama pull qwen3`
- 检查服务地址配置是否正确

### 3. 未找到聊天记录
- 检查时间范围格式是否正确
- 确认群聊名称是否存在
- 验证Chatlog中是否有对应的聊天数据

## 更新日志

### v1.1.0 (2024-01-XX)
- ✅ **数据解析优化**: 修复了`parseChatRoomResponse`方法，正确处理Chatlog API返回的`{items: [...]}` 数据结构
- ✅ **字段映射增强**: 优化了群聊数据字段映射，支持`nickName`、`users`数组等新字段
- ✅ **成员统计准确**: 群成员数量现在基于实际的`users`数组长度计算
- ✅ **完整用户信息**: 返回数据包含完整的群成员列表和用户信息
- ✅ **向后兼容**: 保持对旧数据格式的兼容性支持

### v1.0.0 (2024-01-XX)
- 🎉 **初始版本**: 从MCP协议迁移到Chatlog HTTP API
- 🔧 **环境配置**: 支持CHATLOG_BASE_URL环境变量配置
- 📡 **HTTP集成**: 完整的Chatlog HTTP API集成
- 🤖 **AI总结**: 集成Ollama本地AI模型进行智能总结

### 4. 群聊列表为空
- 使用 `keyword=+` 参数获取所有群聊
- 确认Chatlog已正确解析微信数据
- 检查是否有群聊数据存在

## 技术架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   NestJS API    │    │  Chatlog HTTP   │    │  Ollama Model   │
│                 │    │      API        │    │                 │
│ WechatSummary   │───▶│                 │    │   AI Analysis   │
│   Controller    │    │ - /api/v1/      │    │                 │
│                 │    │   chatlog       │    │ - qwen3         │
│ - summarize     │    │ - /api/v1/      │◀───│ - Summary       │
│ - smart-summary │    │   chatroom      │    │ - Key Points    │
│ - groups        │    │ - /api/v1/      │    │ - Participants  │
└─────────────────┘    │   contact       │    └─────────────────┘
                       └─────────────────┘
```

## 开发说明

### 添加新的总结类型
1. 在 `OllamaService` 中添加新的提示词模板
2. 更新 `SummaryType` 枚举
3. 在控制器中添加相应的API文档

### 扩展Chatlog API支持
1. 在 `McpService` 中添加新的API调用方法
2. 更新接口定义和响应解析逻辑
3. 在服务层集成新的功能

### 优化AI模型
1. 调整Ollama模型参数（temperature、top_p等）
2. 优化提示词模板
3. 添加更多的响应解析逻辑

## 注意事项

1. **数据隐私**: 所有聊天记录处理都在本地进行，不会上传到外部服务
2. **服务依赖**: 需要同时运行Chatlog和Ollama服务
3. **性能考虑**: 大量聊天记录的总结可能需要较长时间
4. **模型选择**: 推荐使用qwen3模型，平衡了性能和准确性
5. **请求头配置**: 服务会自动添加必要的HTTP请求头以确保与Chatlog API的兼容性
6. **格式支持**: 所有查询接口都支持JSON、CSV、文本等多种格式输出
7. **关键词搜索**: 使用 `+` 作为通配符可以获取所有数据，空字符串会被自动转换为 `+` 