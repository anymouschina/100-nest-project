/**
 * 聊天代理模型接口定义
 */
export interface ChatAgent {
  id: string;
  name: string;
  description: string;
  type: string;
  systemPrompt: string;
  capabilities: string[];
  modelConfig: Record<string, any>; // 将modelConfig定义为Record<string, any>
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 聊天意图响应接口
 */
export interface IntentResponse {
  name: string;
  agentType: string;
  confidence: number;
}

/**
 * 聊天代理响应接口
 */
export interface AgentResponse {
  content: string;
  metadata?: Record<string, any>;
} 