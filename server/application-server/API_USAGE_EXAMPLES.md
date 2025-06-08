# API使用示例

本文档提供了认证和AI功能的完整使用示例。

## 快速开始

### 1. 游客登录（推荐用于快速体验）

```bash
curl -X POST http://localhost:3001/api/auth/guest-login \
  -H "Content-Type: application/json"
```

响应：
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 3600,
    "user": {
      "userId": 1,
      "name": "游客用户",
      "email": "guest@example.com",
      "isGuest": true
    }
  },
  "message": "游客登录成功，可以体验AI功能"
}
```

### 2. 使用AI聊天功能

```bash
curl -X POST http://localhost:3001/api/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "message": "你好，请帮我优化这个提示词：写一篇文章"
  }'
```

响应：
```json
{
  "success": true,
  "data": {
    "response": "您好！我很乐意帮您优化这个提示词。原始提示词"写一篇文章"确实比较简单，我来为您提供一个优化版本：\n\n**优化后的提示词：**\n你是一位经验丰富的内容创作专家。请为我写一篇关于[具体主题]的文章，要求如下：\n\n1. **目标受众**：[明确受众群体]\n2. **文章长度**：[具体字数要求]\n3. **写作风格**：[正式/轻松/专业/通俗等]\n4. **核心观点**：[要传达的主要信息]\n5. **结构要求**：包含引言、主体段落和结论\n6. **特殊要求**：[如需要案例、数据支撑等]\n\n请确保文章逻辑清晰、论证有力，并在适当位置加入具体例子来支撑观点。\n\n**优化要点说明：**\n- 明确了AI的角色定位\n- 提供了具体的写作框架\n- 包含了详细的要求清单\n- 指定了质量标准\n\n这样的提示词能够帮助AI生成更符合您期望的高质量文章。您可以根据实际需求填入具体的主题和要求。",
    "sessionId": "session_1703123456789_abc123def",
    "usage": {
      "promptTokens": 45,
      "completionTokens": 312,
      "totalTokens": 357
    }
  },
  "message": "消息发送成功"
}
```

### 3. 提示词优化

```bash
curl -X POST http://localhost:3001/api/ai/optimize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "originalPrompt": "帮我写代码",
    "optimizationType": "role-based",
    "domain": "软件开发",
    "requirements": ["使用TypeScript", "包含注释", "遵循最佳实践"]
  }'
```

## 完整认证流程

### 1. 用户注册

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "张三",
    "email": "zhangsan@example.com",
    "password": "password123",
    "address": "北京市朝阳区"
  }'
```

### 2. 用户登录

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "zhangsan@example.com",
    "password": "password123"
  }'
```

### 3. 获取用户信息

```bash
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. 修改密码

```bash
curl -X PUT http://localhost:3001/api/auth/password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "currentPassword": "password123",
    "newPassword": "newpassword456"
  }'
```

### 5. 用户登出

```bash
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## AI功能详细示例

### 1. 提示词质量分析

```bash
curl -X POST http://localhost:3001/api/ai/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "prompt": "你是一个专业的营销专家，请为我写一篇关于AI技术的营销文章，要求1000字左右，包含具体案例，面向企业决策者"
  }'
```

响应示例：
```json
{
  "success": true,
  "data": {
    "wordCount": 28,
    "sentenceCount": 1,
    "complexity": "high",
    "clarity": 8,
    "structure": "good",
    "missingElements": [],
    "strengths": ["要求具体明确", "信息充分"],
    "weaknesses": []
  },
  "message": "提示词分析成功"
}
```

### 2. 批量优化

```bash
curl -X POST http://localhost:3001/api/ai/batch-optimize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "prompts": [
      "写一篇文章",
      "分析数据",
      "制定计划"
    ],
    "optimizationType": "role-based",
    "domain": "商业分析"
  }'
```

### 3. 会话管理

#### 创建新会话
```bash
curl -X POST http://localhost:3001/api/ai/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "提示词优化咨询",
    "initialMessage": "我是专业的提示词优化助手"
  }'
```

#### 获取所有会话
```bash
curl -X GET http://localhost:3001/api/ai/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 获取指定会话
```bash
curl -X GET http://localhost:3001/api/ai/sessions/session_123 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 更新会话
```bash
curl -X PUT http://localhost:3001/api/ai/sessions/session_123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "新的会话标题"
  }'
```

#### 删除会话
```bash
curl -X DELETE http://localhost:3001/api/ai/sessions/session_123 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. 用户偏好设置

```bash
curl -X POST http://localhost:3001/api/ai/preferences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "language": "zh",
    "responseStyle": "professional",
    "maxResponseLength": 2000,
    "preferredOptimizationTypes": ["role-based", "few-shot"]
  }'
```

### 5. 知识库功能

#### 搜索知识库
```bash
curl -X GET "http://localhost:3001/api/ai/knowledge/search?q=提示工程" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 获取知识库统计
```bash
curl -X GET http://localhost:3001/api/ai/knowledge/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 获取所有知识条目
```bash
curl -X GET http://localhost:3001/api/ai/knowledge \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 6. 系统功能

#### 检查AI服务健康状态
```bash
curl -X GET http://localhost:3001/api/ai/health \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 获取可用模型列表
```bash
curl -X GET http://localhost:3001/api/ai/models \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 获取提示词模板
```bash
curl -X GET http://localhost:3001/api/ai/templates \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 获取使用统计
```bash
curl -X GET http://localhost:3001/api/ai/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## JavaScript/TypeScript 示例

### 基础封装类

```typescript
class AIClient {
  private baseUrl: string;
  private accessToken: string;

  constructor(baseUrl: string = 'http://localhost:3001/api') {
    this.baseUrl = baseUrl;
    this.accessToken = '';
  }

  // 游客登录
  async guestLogin(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/auth/guest-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const result = await response.json();
    if (result.success) {
      this.accessToken = result.data.accessToken;
    }
    return result;
  }

  // 用户登录
  async login(email: string, password: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const result = await response.json();
    if (result.success) {
      this.accessToken = result.data.accessToken;
    }
    return result;
  }

  // 发送聊天消息
  async chat(message: string, sessionId?: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: JSON.stringify({ message, sessionId })
    });
    return response.json();
  }

  // 优化提示词
  async optimizePrompt(
    originalPrompt: string,
    optimizationType: string = 'basic',
    domain?: string
  ): Promise<any> {
    const response = await fetch(`${this.baseUrl}/ai/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: JSON.stringify({ originalPrompt, optimizationType, domain })
    });
    return response.json();
  }
}

// 使用示例
async function example() {
  const client = new AIClient();
  
  // 游客登录
  await client.guestLogin();
  
  // 发送聊天消息
  const chatResult = await client.chat('你好，请帮我优化提示词');
  console.log(chatResult.data.response);
  
  // 优化提示词
  const optimizeResult = await client.optimizePrompt(
    '写一篇文章',
    'role-based',
    '内容创作'
  );
  console.log(optimizeResult.data.optimizedPrompt);
}
```

## 错误处理

### 常见错误码

- `401 Unauthorized`: 令牌无效或已过期
- `403 Forbidden`: 权限不足
- `404 Not Found`: 资源不存在
- `409 Conflict`: 资源冲突（如邮箱已存在）
- `429 Too Many Requests`: 请求频率过高
- `500 Internal Server Error`: 服务器内部错误

### 错误响应格式

```json
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息",
  "statusCode": 401
}
```

## 注意事项

1. **令牌管理**: 访问令牌有效期为1小时，过期后需要重新登录
2. **游客模式**: 游客用户可以体验所有AI功能，但数据不会持久化
3. **请求频率**: 建议控制请求频率，避免触发限流
4. **数据安全**: 生产环境中请使用HTTPS协议
5. **错误重试**: 建议实现指数退避的重试机制

## Swagger文档

启动服务后，可以访问 `http://localhost:3001/api-docs` 查看完整的API文档和在线测试界面。 