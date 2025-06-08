# 前端API使用示例

本文档提供了前端项目中使用认证和AI功能的完整示例。

## 🚀 快速开始

### 1. 游客登录（推荐用于快速体验）

```typescript
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

function QuickStartExample() {
  const { guestLogin } = useAuth()

  const handleGuestLogin = async () => {
    try {
      await guestLogin()
      toast.success('游客登录成功，欢迎体验AI助手功能！')
      // 游客登录后不自动跳转，让用户自主选择功能
    } catch (error) {
      toast.error('游客登录失败，请稍后重试')
    }
  }

  return (
    <button onClick={handleGuestLogin}>
      游客登录
    </button>
  )
}
```

### 2. 使用AI聊天功能

```typescript
import { useChat } from '@/contexts/ChatContext'
import { useState } from 'react'

function ChatExample() {
  const [message, setMessage] = useState('')
  const { messages, sendMessage, isLoading, currentSession } = useChat()

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return

    try {
      // sendMessage会自动处理会话连续性
      // 第一次调用会创建新会话，后续调用会使用现有会话
      await sendMessage(message)
      setMessage('')
    } catch (error) {
      console.error('发送消息失败:', error)
    }
  }

  return (
    <div>
      {/* 会话信息 */}
      {currentSession && (
        <div className="text-sm text-gray-500 mb-2">
          当前会话: {currentSession.id}
        </div>
      )}
      
      {/* 消息列表 */}
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>
      
      {/* 输入框 */}
      <div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="请输入您的消息..."
        />
        <button onClick={handleSendMessage} disabled={!message.trim() || isLoading}>
          {isLoading ? '发送中...' : '发送'}
        </button>
      </div>
    </div>
  )
}
```

### 会话管理说明

- **自动会话创建**: 第一次发送消息时自动创建新会话
- **会话连续性**: 后续消息会自动使用当前会话ID，保持对话上下文
- **会话状态**: 可以通过 `currentSession` 获取当前会话信息
- **消息历史**: 所有消息都会保存在当前会话中

## 🔐 完整认证流程

### 1. 用户注册

```typescript
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'

function RegisterExample() {
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    address: ''
  })

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        address: formData.address
      })
      
      console.log('注册成功')
      // 自动登录并跳转
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || '注册失败'
      console.error(errorMessage)
    }
  }

  return (
    <form onSubmit={handleRegister}>
      <input
        type="text"
        placeholder="姓名"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required
      />
      <input
        type="email"
        placeholder="邮箱"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        required
      />
      <input
        type="password"
        placeholder="密码"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
        required
      />
      <input
        type="text"
        placeholder="地址（可选）"
        value={formData.address}
        onChange={(e) => setFormData({...formData, address: e.target.value})}
      />
      <button type="submit">注册</button>
    </form>
  )
}
```

### 2. 用户登录

```typescript
import { useAuth } from '@/contexts/AuthContext'
import { useState } from 'react'

function LoginExample() {
  const { login } = useAuth()
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await login(credentials)
      console.log('登录成功')
    } catch (error) {
      console.error('登录失败')
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="邮箱"
        value={credentials.email}
        onChange={(e) => setCredentials({...credentials, email: e.target.value})}
        required
      />
      <input
        type="password"
        placeholder="密码"
        value={credentials.password}
        onChange={(e) => setCredentials({...credentials, password: e.target.value})}
        required
      />
      <button type="submit">登录</button>
    </form>
  )
}
```

### 3. 用户状态检查

```typescript
import { useAuth } from '@/contexts/AuthContext'

function UserStatusExample() {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div>加载中...</div>
  }

  if (!isAuthenticated) {
    return <div>请先登录</div>
  }

  return (
    <div>
      <h2>用户信息</h2>
      <p>姓名: {user?.name}</p>
      <p>邮箱: {user?.email}</p>
      {user?.isGuest && (
        <div className="guest-notice">
          <p>您正在使用游客模式</p>
          <button>升级为正式账户</button>
        </div>
      )}
    </div>
  )
}
```

## 🤖 AI功能详细示例

### 1. 提示词优化

```typescript
import { aiClient } from '@/utils/aiClient'
import { useState } from 'react'

function OptimizeExample() {
  const [originalPrompt, setOriginalPrompt] = useState('')
  const [optimizedResult, setOptimizedResult] = useState(null)

  const handleOptimize = async () => {
    try {
      const result = await aiClient.optimize({
        originalPrompt: originalPrompt,
        optimizationType: 'role-based',
        domain: '软件开发',
        requirements: ['使用TypeScript', '包含注释', '遵循最佳实践']
      })
      
      setOptimizedResult(result)
      console.log('优化后的提示词:', result.optimizedPrompt)
      console.log('质量评分:', result.qualityScore)
      console.log('建议:', result.suggestions)
    } catch (error) {
      console.error('优化失败:', error)
    }
  }

  return (
    <div>
      <textarea
        value={originalPrompt}
        onChange={(e) => setOriginalPrompt(e.target.value)}
        placeholder="请输入原始提示词..."
      />
      <button onClick={handleOptimize}>优化提示词</button>
      
      {optimizedResult && (
        <div>
          <h3>优化结果:</h3>
          <p>{optimizedResult.optimizedPrompt}</p>
          <h4>质量评分:</h4>
          <ul>
            <li>清晰度: {optimizedResult.qualityScore.clarity}/10</li>
            <li>具体性: {optimizedResult.qualityScore.specificity}/10</li>
            <li>完整性: {optimizedResult.qualityScore.completeness}/10</li>
            <li>一致性: {optimizedResult.qualityScore.consistency}/10</li>
            <li>有效性: {optimizedResult.qualityScore.effectiveness}/10</li>
            <li>综合评分: {optimizedResult.qualityScore.overall}/10</li>
          </ul>
        </div>
      )}
    </div>
  )
}
```

### 2. 提示词质量分析

```typescript
import { aiClient } from '@/utils/aiClient'
import { useState } from 'react'

function AnalyzeExample() {
  const [prompt, setPrompt] = useState('')
  const [analysis, setAnalysis] = useState(null)

  const handleAnalyze = async () => {
    try {
      const result = await aiClient.analyze({
        prompt: prompt
      })
      
      setAnalysis(result)
      console.log('分析结果:', result)
    } catch (error) {
      console.error('分析失败:', error)
    }
  }

  return (
    <div>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="请输入要分析的提示词..."
      />
      <button onClick={handleAnalyze}>分析质量</button>
      
      {analysis && (
        <div>
          <h3>分析结果:</h3>
          <h4>优势:</h4>
          <ul>
            {analysis.strengths.map((strength, index) => (
              <li key={index}>{strength}</li>
            ))}
          </ul>
          <h4>不足:</h4>
          <ul>
            {analysis.weaknesses.map((weakness, index) => (
              <li key={index}>{weakness}</li>
            ))}
          </ul>
          <h4>建议:</h4>
          <ul>
            {analysis.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
```

### 3. 会话管理

```typescript
import { aiClient } from '@/utils/aiClient'
import { useState, useEffect } from 'react'

function SessionManagementExample() {
  const [sessions, setSessions] = useState([])
  const [currentSession, setCurrentSession] = useState(null)

  // 获取所有会话
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const sessionList = await aiClient.sessions.getAll()
        setSessions(sessionList)
      } catch (error) {
        console.error('获取会话列表失败:', error)
      }
    }

    fetchSessions()
  }, [])

  // 创建新会话
  const createNewSession = async () => {
    try {
      const newSession = await aiClient.sessions.create({
        title: '新的对话',
        initialMessage: '你好，我是AI助手'
      })
      
      setSessions([...sessions, newSession])
      setCurrentSession(newSession)
    } catch (error) {
      console.error('创建会话失败:', error)
    }
  }

  // 删除会话
  const deleteSession = async (sessionId: string) => {
    try {
      await aiClient.sessions.delete(sessionId)
      setSessions(sessions.filter(s => s.id !== sessionId))
      
      if (currentSession?.id === sessionId) {
        setCurrentSession(null)
      }
    } catch (error) {
      console.error('删除会话失败:', error)
    }
  }

  return (
    <div>
      <h2>会话管理</h2>
      <button onClick={createNewSession}>创建新会话</button>
      
      <div>
        <h3>会话列表:</h3>
        {sessions.map(session => (
          <div key={session.id}>
            <span>{session.title}</span>
            <button onClick={() => setCurrentSession(session)}>
              选择
            </button>
            <button onClick={() => deleteSession(session.id)}>
              删除
            </button>
          </div>
        ))}
      </div>
      
      {currentSession && (
        <div>
          <h3>当前会话: {currentSession.title}</h3>
          <div>
            {currentSession.messages?.map(message => (
              <div key={message.id}>
                <strong>{message.role}:</strong> {message.content}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

### 4. 用户偏好设置

```typescript
import { aiClient } from '@/utils/aiClient'
import { useState, useEffect } from 'react'

function PreferencesExample() {
  const [preferences, setPreferences] = useState({
    language: 'zh',
    responseStyle: 'professional',
    maxResponseLength: 2000,
    preferredOptimizationTypes: ['role-based', 'few-shot'],
    theme: 'light'
  })

  // 获取用户偏好
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const userPrefs = await aiClient.preferences.get()
        setPreferences(userPrefs)
      } catch (error) {
        console.error('获取偏好设置失败:', error)
      }
    }

    fetchPreferences()
  }, [])

  // 保存偏好设置
  const savePreferences = async () => {
    try {
      const updatedPrefs = await aiClient.preferences.set(preferences)
      setPreferences(updatedPrefs)
      console.log('偏好设置已保存')
    } catch (error) {
      console.error('保存偏好设置失败:', error)
    }
  }

  return (
    <div>
      <h2>偏好设置</h2>
      
      <div>
        <label>语言:</label>
        <select
          value={preferences.language}
          onChange={(e) => setPreferences({...preferences, language: e.target.value})}
        >
          <option value="zh">中文</option>
          <option value="en">English</option>
        </select>
      </div>

      <div>
        <label>回复风格:</label>
        <select
          value={preferences.responseStyle}
          onChange={(e) => setPreferences({...preferences, responseStyle: e.target.value})}
        >
          <option value="professional">专业</option>
          <option value="casual">轻松</option>
          <option value="detailed">详细</option>
        </select>
      </div>

      <div>
        <label>最大回复长度:</label>
        <input
          type="number"
          value={preferences.maxResponseLength}
          onChange={(e) => setPreferences({...preferences, maxResponseLength: parseInt(e.target.value)})}
        />
      </div>

      <button onClick={savePreferences}>保存设置</button>
    </div>
  )
}
```

## 🔧 错误处理

### 统一错误处理

```typescript
import { AxiosError } from 'axios'
import toast from 'react-hot-toast'

function handleApiError(error: AxiosError) {
  if (error.response) {
    const { status, data } = error.response
    
    switch (status) {
      case 401:
        toast.error('登录已过期，请重新登录')
        // 跳转到登录页
        break
      case 403:
        toast.error('权限不足')
        break
      case 404:
        toast.error('请求的资源不存在')
        break
      case 409:
        toast.error(data.message || '资源冲突')
        break
      case 429:
        toast.error('请求过于频繁，请稍后重试')
        break
      case 500:
        toast.error('服务器内部错误')
        break
      default:
        toast.error(data.message || '请求失败')
    }
  } else if (error.request) {
    toast.error('网络连接失败，请检查网络')
  } else {
    toast.error('请求配置错误')
  }
}

// 在API调用中使用
async function safeApiCall() {
  try {
    const result = await aiClient.chat({ message: 'Hello' })
    return result
  } catch (error) {
    handleApiError(error as AxiosError)
    throw error
  }
}
```

## 📱 React Hooks 封装

### 自定义Hook示例

```typescript
import { useState, useCallback } from 'react'
import { aiClient } from '@/utils/aiClient'

// 聊天Hook
export function useChat() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const sendMessage = useCallback(async (message: string, sessionId?: string) => {
    setLoading(true)
    try {
      const response = await aiClient.chat({ message, sessionId })
      
      setMessages(prev => [
        ...prev,
        { role: 'user', content: message },
        { role: 'assistant', content: response.response }
      ])
      
      return response
    } catch (error) {
      console.error('发送消息失败:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return { messages, loading, sendMessage }
}

// 优化Hook
export function useOptimization() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const optimize = useCallback(async (data) => {
    setLoading(true)
    try {
      const optimizationResult = await aiClient.optimize(data)
      setResult(optimizationResult)
      return optimizationResult
    } catch (error) {
      console.error('优化失败:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, result, optimize }
}
```

## 🎯 最佳实践

### 1. 组件设计模式

```typescript
// 容器组件 + 展示组件模式
function ChatContainer() {
  const { messages, loading, sendMessage } = useChat()
  const { user } = useAuth()

  return (
    <ChatPresentation
      messages={messages}
      loading={loading}
      onSendMessage={sendMessage}
      user={user}
    />
  )
}

function ChatPresentation({ messages, loading, onSendMessage, user }) {
  return (
    <div>
      {user?.isGuest && <GuestModeInfo />}
      <MessageList messages={messages} />
      <MessageInput onSend={onSendMessage} disabled={loading} />
    </div>
  )
}
```

### 2. 状态管理

```typescript
// 使用Context进行全局状态管理
const AppStateContext = createContext()

function AppStateProvider({ children }) {
  const [globalState, setGlobalState] = useState({
    currentSession: null,
    preferences: null,
    notifications: []
  })

  return (
    <AppStateContext.Provider value={{ globalState, setGlobalState }}>
      {children}
    </AppStateContext.Provider>
  )
}
```

### 3. 性能优化

```typescript
// 使用React.memo优化组件渲染
const MessageItem = React.memo(({ message }) => {
  return (
    <div className="message">
      <strong>{message.role}:</strong>
      <span>{message.content}</span>
    </div>
  )
})

// 使用useMemo缓存计算结果
function QualityScoreDisplay({ scores }) {
  const averageScore = useMemo(() => {
    const values = Object.values(scores)
    return values.reduce((sum, score) => sum + score, 0) / values.length
  }, [scores])

  return <div>平均分: {averageScore.toFixed(1)}</div>
}
```

## 📝 注意事项

1. **Token管理**: 访问令牌会自动存储在localStorage中，过期后需要重新登录
2. **游客模式**: 游客用户的数据不会持久化，建议及时提醒用户升级账户
3. **错误处理**: 
   - 避免在API拦截器中强制跳转页面，防止页面刷新
   - 在组件中根据具体错误状态码提供友好的用户反馈
   - 使用console.error记录详细错误信息便于调试
4. **性能优化**: 对于大量数据的渲染，使用虚拟滚动或分页加载
5. **安全性**: 敏感信息不要存储在localStorage中，使用HTTPS协议
6. **网络错误**: 妥善处理网络连接失败的情况，提供重试机制

## 🐛 调试指南

### 聊天功能调试

如果聊天消息没有显示，请按以下步骤排查：

1. **检查浏览器控制台**
   - 查看是否有网络请求错误
   - 查看是否有JavaScript错误
   - 查看调试日志输出

2. **检查API响应**
   ```javascript
   // 在浏览器控制台中查看这些日志
   console.log('发送聊天请求:', chatRequest)
   console.log('aiRequest.post response:', response)
   console.log('收到AI响应:', response)
   console.log('添加AI消息:', aiMessage)
   ```

3. **检查状态管理**
   ```javascript
   // 查看ChatReducer的日志
   console.log('ChatReducer - action:', action.type)
   console.log('ChatReducer - current state messages:', state.messages.length)
   console.log('ChatPage - messages:', messages)
   ```

4. **常见问题解决**
   - **消息不显示**: 检查messages数组是否为空，查看ADD_MESSAGE action是否被正确触发
   - **API请求失败**: 检查网络连接，确认后端服务正常运行
   - **认证问题**: 确认用户已登录，token有效
   - **数据结构不匹配**: 确认API响应格式与前端类型定义一致

## 📋 API响应格式

### 统一响应结构

所有API响应都遵循以下统一格式：

```typescript
interface ApiResponse<T> {
  code: number          // 业务状态码，0表示成功
  data: {
    success: boolean
    data: T             // 实际数据
    message?: string    // 业务消息
  }
  message: string       // HTTP状态消息
  timestamp: string     // 响应时间戳
  path: string         // 请求路径
}
```

### 实际响应示例

#### 认证接口响应（三层嵌套结构）

```json
{
  "code": 0,
  "data": {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "tokenType": "Bearer",
      "expiresIn": 3600,
      "user": {
        "userId": 4,
        "name": "游客用户",
        "email": "guest@example.com",
        "isGuest": true
      }
    },
    "message": "游客登录成功，可以体验AI功能"
  },
  "message": "Success",
  "timestamp": "2025-06-08T02:53:20.082Z",
  "path": "/api/auth/guest-login"
}
```

#### AI接口响应（两层结构）

```json
{
  "code": 0,
  "data": {
    "response": "你好，我是一位人工智能助手，可以帮助你完成多种任务...",
    "sessionId": "session_1749354031325_ls9in5nzl",
    "usage": {
      "promptTokens": 52,
      "completionTokens": 126,
      "totalTokens": 178
    }
  },
  "message": "Success",
  "timestamp": "2025-06-08T03:40:34.061Z",
  "path": "/api/ai/chat"
}
```

#### 错误响应示例

```json
{
  "code": 400,
  "data": {
    "success": false,
    "data": null,
    "message": "邮箱格式不正确"
  },
  "message": "Bad Request",
  "timestamp": "2025-06-08T02:53:20.082Z",
  "path": "/api/auth/login"
}
```

### 前端数据处理

前端提供了两套请求工具来处理不同的响应结构：

#### 认证相关接口（三层嵌套）
```typescript
import { request } from '@/utils/api'

// API返回: { code: 0, data: { success: true, data: actualData } }
// request工具返回: actualData

const userData = await request.post('/auth/login', credentials)
// userData 直接是用户数据，无需再次解构
```

#### AI相关接口（两层结构）
```typescript
import { aiRequest } from '@/utils/api'

// API返回: { code: 0, data: actualData }
// aiRequest工具返回: actualData

const chatResponse = await aiRequest.post('/ai/chat', { message: 'Hello' })
// chatResponse 直接是聊天响应数据
console.log(chatResponse.response) // AI回复内容
console.log(chatResponse.sessionId) // 会话ID
console.log(chatResponse.usage) // Token使用统计
```

### 登录跳转逻辑

#### 普通用户登录
- 登录成功后立即跳转到首页
- 显示成功提示信息

#### 游客登录
- 登录成功后延迟1.5秒跳转到首页
- 让用户看到成功提示后再跳转
- 提供更好的用户体验

```typescript
// 普通登录
await login({ email, password })
toast.success('登录成功')
navigate('/')

// 游客登录
await guestLogin()
toast.success('游客登录成功，欢迎体验AI助手功能！')
setTimeout(() => {
  navigate('/')
}, 1500)
```

## 🔗 相关链接

- [API文档](http://localhost:3001/api-docs)
- [项目README](../README.md)
- [组件文档](./COMPONENTS.md)
- [部署指南](./DEPLOYMENT.md) 