import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AppConfigService } from '../config/config.service';
import { OllamaService } from './services/ollama.service';
import { AgentFactoryService } from './services/agent-factory.service';
import { ToolRegistryService } from './services/tool-registry.service';
import { ContextManagerService } from './services/context-manager.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateSessionDto, MessageRole, SendMessageDto, AgentType } from './types';
import { StructuredTool } from '@langchain/core/tools';
import { ChatSession } from '@prisma/client';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: AppConfigService,
    private readonly ollamaService: OllamaService,
    private readonly agentFactory: AgentFactoryService,
    private readonly toolRegistry: ToolRegistryService,
    private readonly contextManager: ContextManagerService,
  ) {}

  /**
   * 创建新的聊天会话
   */
  async createChatSession(
    userId: number,
    agentId?: string,
    title?: string,
  ): Promise<ChatSession> {
    try {
      // 如果没有指定代理，使用默认代理
      if (!agentId) {
        const agents = await this.agentFactory.getAllAgents();
        const defaultAgent = agents.find(agent => agent.type === 'customer_service') || agents[0];
        if (!defaultAgent) {
          throw new Error('No agents available');
        }
        agentId = defaultAgent.id;
      }

      // 创建聊天会话
      const session = await this.databaseService.chatSession.create({
        data: {
          userId,
          agentId,
          title: title || '新的对话',
          status: 'active',
          metadata: {},
        },
      });

      return session;
    } catch (error) {
      this.logger.error(
        `Error creating chat session: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 发送消息到聊天会话
   */
  async sendMessage(
    sessionId: string,
    content: string,
    role: string = 'user',
  ): Promise<any> {
    try {
      // 获取会话信息
      const session = await this.databaseService.chatSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

   

      // 获取代理
      const agentResult = await this.agentFactory.getAgent(session.agentId);
      if (!agentResult) {
        throw new Error(`Agent not found: ${session.agentId}`);
      }

      const { agent, graph } = agentResult;
      
      // 获取会话消息历史（限制最近30条）
      const messages = await this.databaseService.chatSessionMessage.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
        take: 30,
      });

      // 转换为LangGraph需要的格式
      const messageHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // 调用代理图处理消息
      const result = await graph.invoke(messageHistory, content);

      // 提取AI回复
      let aiResponse = '抱歉，我无法处理您的请求。';
      if (result && result.messages && Array.isArray(result.messages)) {
        const lastMessage = result.messages[result.messages.length - 1];
        if (lastMessage && lastMessage.role === 'ai') {
          aiResponse = lastMessage.content;
        }
      }
      
      // 如果有错误，记录但继续处理
      if (result && result.error) {
        this.logger.warn(`Agent returned error: ${result.error}`);
      }

      // 保存AI回复
      const aiMessage = await this.databaseService.chatSessionMessage.create({
        data: {
          sessionId,
          role: 'assistant',
          content: aiResponse,
          metadata: result || {},
        },
      });
         // 保存用户消息
        await this.databaseService.chatSessionMessage.create({
        data: {
          sessionId,
          role,
          content,
          metadata: {},
        },
      });
      return {
        sessionId,
        userMessage: { role, content },
        aiMessage: { role: 'assistant', content: aiResponse },
        metadata: result,
      };
    } catch (error) {
      this.logger.error(
        `Error sending message: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 切换代理
   */
  async switchAgent(sessionId: string, newAgentId: string): Promise<any> {
    try {
      // 验证新代理存在
      const agentResult = await this.agentFactory.getAgent(newAgentId);
      if (!agentResult) {
        throw new Error(`Agent not found: ${newAgentId}`);
      }

      // 更新会话的代理
      const updatedSession = await this.databaseService.chatSession.update({
        where: { id: sessionId },
        data: { agentId: newAgentId },
      });

      // 添加系统消息通知切换
      await this.databaseService.chatSessionMessage.create({
        data: {
          sessionId,
          role: 'system',
          content: `已切换到代理: ${agentResult.agent.name}`,
          metadata: { agentSwitch: true, newAgentId },
        },
      });

      return {
        sessionId,
        newAgent: agentResult.agent,
        message: `已切换到代理: ${agentResult.agent.name}`,
      };
    } catch (error) {
      this.logger.error(
        `Error switching agent: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 获取会话详情
   */
  async getSessionDetails(sessionId: string): Promise<any> {
    try {
      const session = await this.databaseService.chatSession.findUnique({
        where: { id: sessionId },
        include: {
          agent: true,
          user: {
            select: { userId: true, name: true, email: true },
          },
          messages: {
            orderBy: { timestamp: 'desc' },
            take: 1, // 只获取最新消息
          },
        },
      });

      if (!session) {
        throw new Error(`Session not found: ${sessionId}`);
      }

      return {
        id: session.id,
        title: session.title,
        status: session.status,
        startTime: session.startTime,
        endTime: session.endTime,
        agent: {
          id: session.agent.id,
          name: session.agent.name,
          type: session.agent.type,
        },
        user: session.user,
        lastMessage: session.messages[0] || null,
        metadata: session.metadata,
      };
    } catch (error) {
      this.logger.error(
        `Error getting session details: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 获取会话消息历史
   */
  async getSessionHistory(
    sessionId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<any> {
    try {
      // 确保参数是有效的数字
      const validLimit = Math.max(1, Math.min(200, Number(limit) || 50));
      const validOffset = Math.max(0, Number(offset) || 0);

      const messages = await this.databaseService.chatSessionMessage.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
        skip: validOffset,
        take: validLimit,
      });

      const totalCount = await this.databaseService.chatSessionMessage.count({
        where: { sessionId },
      });

      return {
        sessionId,
        messages: messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          metadata: msg.metadata,
        })),
        pagination: {
          total: totalCount,
          limit: validLimit,
          offset: validOffset,
          hasMore: validOffset + validLimit < totalCount,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error getting session history: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 获取可用代理
   */
  async getAvailableAgents(): Promise<any> {
    try {
      const agents = await this.agentFactory.getAllAgents();
      return agents;
    } catch (error) {
      this.logger.error(
        `Error getting available agents: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 获取用户会话列表
   */
  async getUserSessions(
    userId: number,
    limit: number = 20,
    offset: number = 0,
  ): Promise<any> {
    try {
      // 确保参数是有效的数字
      const validLimit = Math.max(1, Math.min(100, Number(limit) || 20));
      const validOffset = Math.max(0, Number(offset) || 0);

      const sessions = await this.databaseService.chatSession.findMany({
        where: { userId },
        include: {
          agent: {
            select: { id: true, name: true, type: true },
          },
          messages: {
            orderBy: { timestamp: 'desc' },
            take: 1, // 只获取最新消息
          },
        },
        orderBy: { startTime: 'desc' },
        skip: validOffset,
        take: validLimit,
      });

      const totalCount = await this.databaseService.chatSession.count({
        where: { userId },
      });

      return {
        sessions: sessions.map((session) => ({
          id: session.id,
          title: session.title,
          status: session.status,
          startTime: session.startTime,
          endTime: session.endTime,
          agent: session.agent,
          lastMessage: session.messages[0] || null,
          metadata: session.metadata,
        })),
        pagination: {
          total: totalCount,
          limit: validLimit,
          offset: validOffset,
          hasMore: validOffset + validLimit < totalCount,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error getting user sessions: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 结束会话
   */
  async endSession(userId: number, sessionId: string) {
    const session = await this.databaseService.chatSession.findFirst({
      where: {
        id: sessionId,
        userId
      }
    });
    
    if (!session) {
      throw new NotFoundException('会话不存在');
    }
    
    return this.databaseService.chatSession.update({
      where: { id: sessionId },
      data: {
        status: 'ended',
        updatedAt: new Date()
      }
    });
  }

  /**
   * 智能选择代理
   */
  private async selectAgentForQuery(query: string): Promise<any> {
    try {
      // 获取所有可用代理
      const agents = await this.agentFactory.getAllAgents();

      // 简单的关键词匹配逻辑
      const queryLower = query.toLowerCase();
      
      // 订单相关
      if (queryLower.includes('订单') || queryLower.includes('order') || queryLower.includes('退款')) {
        const matchingAgent = agents.find(agent => agent.type === 'customer_service');
        return matchingAgent || agents[0];
      }
      
      // 技术支持相关
      if (queryLower.includes('问题') || queryLower.includes('故障') || queryLower.includes('技术')) {
        const matchingAgent = agents.find(agent => agent.type === 'technical_support');
        return matchingAgent || agents[0];
      }
      
      // 预约相关
      if (queryLower.includes('预约') || queryLower.includes('约') || queryLower.includes('时间')) {
        const matchingAgent = agents.find(agent => agent.type === 'appointment');
        return matchingAgent || agents[0];
      }

      // 默认返回客服代理
      const defaultAgent = agents.find(agent => agent.type === 'customer_service') || agents[0];
      return defaultAgent;
    } catch (error) {
      this.logger.error(`Error selecting agent: ${error.message}`, error.stack);
      const agents = await this.agentFactory.getAllAgents();
      return agents[0]; // 返回第一个可用代理
    }
  }

  /**
   * 为代理获取适合的工具
   */
  private async getToolsForAgent(agent: any): Promise<StructuredTool[]> {
    // 基于代理的能力获取工具
    const capabilities = agent.capabilities || [];
    return this.toolRegistry.getToolsByCapabilities(capabilities);
  }

  /**
   * 获取代理的工具使用情况
   */
  async getAgentToolUsage(agentId: string) {
    // 使用findMany和普通查询替代problematic的groupBy
    const toolMessages = await this.databaseService.chatSessionMessage.findMany({
      where: {
        role: 'tool',
        session: {
          agentId
        }
      },
      select: {
        id: true,
        metadata: true
      }
    });
    
    // 手动聚合结果
    const toolUsage = toolMessages.reduce((acc, message) => {
      // 正确处理metadata的类型
      const metadata = message.metadata as Record<string, any> | null;
      const toolName = metadata?.toolName;
      
      if (toolName) {
        if (!acc[toolName]) {
          acc[toolName] = 0;
        }
        acc[toolName]++;
      }
      return acc;
    }, {} as Record<string, number>);
    
    // 转换为数组并排序
    const result = Object.entries(toolUsage)
      .map(([toolName, count]) => ({ toolName, count: Number(count) }))
      .sort((a, b) => Number(b.count) - Number(a.count))
      .slice(0, 10);
    
    return result;
  }
} 