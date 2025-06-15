# 微信总结服务迁移说明

## 概述

本次更新将微信聊天记录总结服务从 MCP 协议调用改为直接调用 Chatlog HTTP API，提高了系统的稳定性和易用性。

## 主要变化

### 1. 服务调用方式变更

**之前 (MCP 协议):**
```typescript
// 通过 MCP 协议调用工具
const response = await this.httpService.post(`${this.mcpBaseUrl}/tools/chatlog`, {
  name: 'chatlog',
  arguments: request,
});
```

**现在 (HTTP API):**
```typescript
// 直接调用 Chatlog HTTP API，包含完整的请求头
const response = await this.httpService.get(url, {
  headers: this.getCommonHeaders(),
  timeout: 30000,
});
```

### 2. 环境变量更新

**之前:**
```bash
MCP_BASE_URL=http://localhost:8080
```

**现在:**
```bash
CHATLOG_BASE_URL=http://localhost:5030
```

### 3. 请求头配置

新增了完整的浏览器兼容请求头：
```typescript
private getCommonHeaders() {
  return {
    'Accept': '*/*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Connection': 'keep-alive',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
  };
}
```

### 4. 新增功能

- **联系人查询**: 新增 `queryContact()` 方法
- **会话列表查询**: 新增 `querySession()` 方法
- **服务状态检查**: 新增 `checkChatlogStatus()` 方法
- **更灵活的参数支持**: 支持 limit、offset、format 等参数
- **增强的超时控制**: 所有请求设置 30 秒超时

### 5. 响应数据解析优化

- 支持多种数据格式的自动解析
- 更好的错误处理和容错机制
- 统一的数据格式转换
- 支持分页信息解析

## 部署要求

### 1. Chatlog 服务

```bash
# 下载 Chatlog
# 从 https://github.com/sjzar/chatlog/releases 下载

# 启动 HTTP 服务
./chatlog server

# 验证服务状态
curl http://localhost:5030/api/v1/session
```

### 2. 环境变量配置

```bash
# 必需的环境变量
CHATLOG_BASE_URL=http://localhost:5030
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3
```

### 3. 服务依赖

- ✅ Chatlog HTTP 服务 (端口 5030)
- ✅ Ollama 服务 (端口 11434)
- ❌ 不再需要 MCP 服务

## API 接口变化

### 新增接口

1. **联系人查询**
   ```http
   GET /api/v1/contact?keyword=张三
   ```

2. **会话列表**
   ```http
   GET /api/v1/session
   ```

### 参数增强

聊天记录查询现在支持更多参数：
```http
GET /api/v1/chatlog?time=2024-01-15&talker=工作群&limit=100&offset=0&format=json
```

### 请求头兼容性

所有请求现在包含完整的浏览器兼容请求头，确保与 Chatlog 服务的最佳兼容性。

## 错误处理改进

### 服务状态检查

现在会自动检查 Chatlog 服务状态：
```typescript
const isChatlogAvailable = await this.mcpService.checkChatlogStatus();
if (!isChatlogAvailable) {
  return {
    success: false,
    error: 'Chatlog服务不可用，请确保Chatlog HTTP服务正在运行',
  };
}
```

### 更好的错误信息

- 明确区分 Chatlog 服务错误和 Ollama 服务错误
- 提供具体的解决建议
- 更详细的日志记录
- 30 秒请求超时保护

## 测试验证

运行测试脚本验证功能：
```bash
node test-wechat-summary.js
```

测试覆盖：
- ✅ 健康检查
- ✅ 群聊列表获取
- ✅ 智能总结
- ✅ 普通总结
- ✅ 批量分析
- ✅ 对比分析

## 故障排除

### 1. Chatlog 服务不可用

**症状**: 返回 "Chatlog服务不可用" 错误

**解决方案**:
1. 检查 Chatlog 是否运行: `curl http://localhost:5030/api/v1/session`
2. 确认端口配置正确
3. 检查防火墙设置
4. 验证 Chatlog 数据已正确解密

### 2. 请求超时

**症状**: 请求超过 30 秒未响应

**解决方案**:
1. 减少查询时间范围
2. 使用 limit 参数限制返回数量
3. 检查 Chatlog 服务性能
4. 考虑分页查询

### 3. 数据格式解析错误

**症状**: 返回空的聊天记录或格式错误

**解决方案**:
1. 检查时间格式是否正确
2. 确认群聊名称存在
3. 验证 Chatlog 数据完整性
4. 查看服务日志获取详细错误信息

### 4. 请求头兼容性问题

**症状**: 403 或其他 HTTP 错误

**解决方案**:
1. 确认 Chatlog 版本兼容性
2. 检查是否有代理或防火墙拦截
3. 验证请求头配置是否正确

## 性能优化

1. **连接复用**: HTTP 连接自动复用
2. **超时控制**: 30 秒超时避免长时间等待
3. **错误重试**: 可以在应用层添加重试机制
4. **分页查询**: 支持 limit 和 offset 参数

## 优势总结

1. **更简单的部署**: 不再需要 MCP 服务
2. **更好的性能**: 直接 HTTP 调用，减少中间层
3. **更强的功能**: 支持更多查询参数和数据类型
4. **更好的错误处理**: 明确的错误信息和状态检查
5. **更易维护**: 标准的 REST API 调用方式
6. **更好的兼容性**: 完整的浏览器兼容请求头
7. **更强的稳定性**: 超时控制和错误处理

## 向后兼容性

- ✅ 所有现有 API 接口保持不变
- ✅ 响应格式完全兼容
- ✅ 配置文件只需更新环境变量
- ❌ 需要部署 Chatlog 服务替代 MCP 服务

## 实际测试示例

基于提供的 curl 请求，服务现在完全兼容 Chatlog 的 HTTP API：

```bash
# 测试群聊列表
curl 'http://localhost:5030/api/v1/chatroom' \
  -H 'Accept: */*' \
  -H 'Accept-Language: zh-CN,zh;q=0.9,en;q=0.8' \
  -H 'Connection: keep-alive'

# 测试聊天记录查询
curl 'http://localhost:5030/api/v1/chatlog?time=2024-01-15&talker=工作群' \
  -H 'Accept: */*' \
  -H 'Accept-Language: zh-CN,zh;q=0.9,en;q=0.8' \
  -H 'Connection: keep-alive'
```

服务会自动添加所有必要的请求头，确保与 Chatlog API 的完美兼容。 