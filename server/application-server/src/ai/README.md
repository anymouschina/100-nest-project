# AI智能助手模块

基于《谷歌提示工程白皮书》的专业AI助手模块，集成Moonshot AI，提供提示词优化和智能对话功能。

## 功能特性

### 🎯 核心功能
- **智能对话**: 支持上下文记忆的多轮对话
- **提示词优化**: 基于谷歌提示工程白皮书的专业优化
- **质量分析**: 多维度提示词质量评估
- **知识库**: 可扩展的AI知识管理系统

### 🛠️ 优化策略
- **基础优化**: 明确性、结构化、上下文增强
- **角色扮演**: 专业角色定义和背景设定
- **Few-shot学习**: 示例驱动的格式指导
- **思维链推理**: 步骤化的推理过程
- **领域专业化**: 特定领域的专业优化
- **多模态支持**: 文本、图像等多种输入类型

## API接口

### 聊天对话
```http
POST /api/ai/chat
Content-Type: application/json
Authorization: Bearer <token>

{
  "message": "请帮我优化这个提示词：写一篇文章",
  "sessionId": "session_123", // 可选，不提供则创建新会话
  "context": "这是为了营销目的" // 可选
}
```

### 提示词优化
```http
POST /api/ai/optimize
Content-Type: application/json

{
  "originalPrompt": "写一篇文章",
  "optimizationType": "basic", // basic, role-based, few-shot, chain-of-thought, domain-specific, multimodal
  "domain": "营销", // 当optimizationType为domain-specific时必填
  "context": "面向B2B客户",
  "requirements": ["1000字以内", "包含案例"]
}
```

### 提示词分析
```http
POST /api/ai/analyze
Content-Type: application/json

{
  "prompt": "你是一个专业的营销专家，请为我写一篇关于AI技术的营销文章"
}
```

### 批量优化
```http
POST /api/ai/batch-optimize
Content-Type: application/json

{
  "prompts": [
    "写一篇文章",
    "分析数据",
    "制定计划"
  ],
  "optimizationType": "role-based",
  "domain": "商业分析"
}
```

## 使用示例

### 1. 基础对话
```typescript
// 发送消息
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    message: '你好，我需要帮助优化一个提示词'
  })
});

const result = await response.json();
console.log(result.data.response); // AI的回复
console.log(result.data.sessionId); // 会话ID，用于后续对话
```

### 2. 提示词优化
```typescript
// 优化提示词
const optimization = await fetch('/api/ai/optimize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    originalPrompt: '帮我写代码',
    optimizationType: 'role-based',
    domain: '软件开发',
    requirements: ['使用TypeScript', '包含注释', '遵循最佳实践']
  })
});

const result = await optimization.json();
console.log(result.data.optimizedPrompt); // 优化后的提示词
console.log(result.data.qualityScore); // 质量评分
console.log(result.data.suggestions); // 改进建议
```

### 3. 会话管理
```typescript
// 创建新会话
const session = await fetch('/api/ai/sessions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    title: '提示词优化咨询',
    initialMessage: '我是专业的提示词优化助手'
  })
});

// 获取用户所有会话
const sessions = await fetch('/api/ai/sessions', {
  headers: { 'Authorization': 'Bearer ' + token }
});
```

### 4. 用户偏好设置
```typescript
// 设置用户偏好
await fetch('/api/ai/preferences', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    language: 'zh',
    responseStyle: 'professional',
    maxResponseLength: 2000,
    preferredOptimizationTypes: ['role-based', 'few-shot']
  })
});
```

## 优化策略详解

### 基础优化 (basic)
基于谷歌提示工程白皮书的六大核心原则：
- 明确性：使用清晰、具体的语言
- 上下文：提供充分的背景信息
- 结构化：采用逻辑清晰的格式
- 示例驱动：使用Few-shot学习技术
- 迭代优化：基于结果反馈进行调整
- 角色定义：明确AI的角色和专业背景

### 角色扮演 (role-based)
为AI定义明确的专业角色：
```
你是一位拥有10年经验的高级软件架构师，专精于微服务架构设计...
```

### Few-shot学习 (few-shot)
通过示例指导AI的输出格式：
```
示例1：
输入：分析用户行为
输出：1. 数据收集 2. 行为模式识别 3. 趋势分析 4. 建议制定

示例2：
输入：优化性能
输出：1. 性能瓶颈识别 2. 优化方案设计 3. 实施计划 4. 效果评估
```

### 思维链推理 (chain-of-thought)
要求AI展示详细的推理过程：
```
请按以下步骤思考：
1. 理解和分析问题
2. 制定解决方案
3. 执行推理过程
4. 验证和总结
```

## 知识库系统

### 内置知识
- 谷歌提示工程白皮书核心原则
- 提示词优化技巧集合
- AI工具集合与应用场景

### 扩展知识
支持动态添加新的知识条目：
```http
GET /api/ai/knowledge/search?q=提示工程
GET /api/ai/knowledge/stats
GET /api/ai/knowledge/{id}
```

## 质量评分系统

提示词质量从以下维度进行评估：
- **清晰度** (1-10): 语言表达的清晰程度
- **具体性** (1-10): 要求的具体明确程度
- **完整性** (1-10): 信息的完整性
- **一致性** (1-10): 逻辑的一致性
- **有效性** (1-10): 预期效果的可达成性
- **综合评分**: 各维度的平均分

## 最佳实践

### 1. 提示词编写建议
- 明确定义任务目标
- 提供充分的上下文信息
- 使用具体的示例
- 设定清晰的输出格式
- 包含必要的约束条件

### 2. 对话交互建议
- 保持会话的连续性
- 适时提供反馈
- 利用上下文记忆
- 设置合适的用户偏好

### 3. 优化策略选择
- 简单任务：使用基础优化
- 专业领域：使用领域专业化
- 复杂推理：使用思维链推理
- 格式要求：使用Few-shot学习
- 角色扮演：使用角色定义

## 技术架构

```
AI模块
├── 服务层
│   ├── MoonshotService - Moonshot AI接口
│   ├── ChatService - 对话管理
│   ├── PromptOptimizationService - 提示词优化
│   └── KnowledgeBaseService - 知识库管理
├── 控制器层
│   └── AiController - API接口
├── 数据传输对象
│   └── chat.dto.ts - 请求响应格式
├── 接口定义
│   └── ai.interface.ts - 类型定义
└── 常量配置
    └── prompt-templates.ts - 优化模板
```

## 配置说明

### 环境变量
```env
# Moonshot AI配置
MOONSHOT_API_KEY=sk-jBeHas7PWHmKPEsbPkNOB9GaSyPJI8Z9QwEvTuJl0vHNDUUW
MOONSHOT_BASE_URL=https://api.moonshot.cn/v1
MOONSHOT_MODEL=moonshot-v1-8k
```

### 模块配置
AI模块已集成到主应用中，无需额外配置即可使用。

## 扩展开发

### 添加新的优化策略
1. 在 `prompt-templates.ts` 中添加新模板
2. 在 `OptimizationType` 中添加新类型
3. 在 `PromptOptimizationService` 中实现优化逻辑

### 集成新的AI服务
1. 创建新的服务类（如 `OpenAIService`）
2. 实现统一的 `AIResponse` 接口
3. 在控制器中添加服务选择逻辑

### 扩展知识库
1. 使用 `KnowledgeBaseService.addKnowledge()` 添加新知识
2. 支持从外部文件导入知识
3. 实现知识的版本管理和更新机制 