/**
 * 聊天消息类型
 */
export enum MessageRole {
  HUMAN = 'human',
  AI = 'ai',
  SYSTEM = 'system',
  TOOL = 'tool'
}

/**
 * 聊天消息接口
 */
export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * 代理类型枚举
 */
export enum AgentType {
  GENERAL = 'general',
  PRODUCT = 'product',
  APPOINTMENT = 'appointment',
  CUSTOMER_SERVICE = 'customer_service'
}

/**
 * 代理接口
 */
export interface Agent {
  id: string;
  name: string;
  description: string;
  type: AgentType | string;
  systemPrompt: string;
  capabilities: string[];
}

/**
 * 会话状态接口
 */
export interface SessionState {
  sessionId: string;
  userId: number;
  messages: ChatMessage[];
  activeAgentId: string;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 工具调用输入
 */
export interface ToolCallInput {
  name: string;
  arguments: Record<string, any>;
}

/**
 * 工具调用结果
 */
export interface ToolCallResult {
  name: string;
  success: boolean;
  result?: any;
  error?: string;
}

/**
 * MCP服务配置
 */
export interface MCPServiceConfig {
  name: string;
  endpoint: string;
  transport: 'streamable_http' | 'stdio';
  tools: string[];
}

/**
 * 创建会话DTO
 */
export interface CreateSessionDto {
  userId: number;
  agentId?: string;
  title?: string;
  initialMessage?: string;
}

/**
 * 发送消息DTO
 */
export interface SendMessageDto {
  userId: number;
  sessionId: string;
  message: string;
} 