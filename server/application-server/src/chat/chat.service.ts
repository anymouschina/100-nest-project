import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AppConfigService } from '../config/config.service';
import { OllamaService } from './services/ollama.service';
import { AgentFactoryService } from './services/agent-factory.service';
import { ToolRegistryService } from './services/tool-registry.service';
import { ContextManagerService } from './services/context-manager.service';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateSessionDto,
  MessageRole,
  SendMessageDto,
  AgentType,
} from './types';
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
        const defaultAgent =
          agents.find((agent) => agent.type === 'customer_service') ||
          agents[0];
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
   * 发送消息到聊天会话 - 2025年优化版本
   * 集成智能上下文压缩、RAG检索增强、消息修剪等最佳实践
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

      // 先保存用户消息
      const userMessage = await this.databaseService.chatSessionMessage.create({
        data: {
          sessionId,
          role,
          content,
          metadata: {},
        },
      });

      // 获取会话消息历史（增加限制到50条以进行智能压缩）
      const allMessages =
        await this.databaseService.chatSessionMessage.findMany({
          where: { sessionId },
          orderBy: { timestamp: 'asc' },
          take: 50, // 增加取样数量用于智能压缩
        });

      // 智能消息压缩 - 基于LangGraphJS 2025最佳实践
      const compressedMessages = await this.intelligentMessageCompression(
        allMessages,
        content,
        agent,
      );

      // RAG检索增强 - 基于用户查询检索相关上下文
      const retrievedContext = await this.performRAGRetrieval(
        content,
        sessionId,
        agent,
      );

      // 构建增强的消息历史
      const enhancedMessageHistory = this.buildEnhancedMessageHistory(
        compressedMessages,
        retrievedContext,
        agent,
      );

      this.logger.debug(
        `Enhanced message history: ${enhancedMessageHistory.length} messages`,
      );

      // 调用代理图处理消息，传入增强的上下文
      const result = await graph.invoke(enhancedMessageHistory, content, {
        configurable: {
          sessionId,
          userId: session.userId,
          retrievedContext,
        },
      });

      // 提取AI回复 - 改进的提取逻辑
      let aiResponse = '抱歉，我无法处理您的请求。';
      if (result && result.messages && Array.isArray(result.messages)) {
        this.logger.debug(
          `Total messages in result: ${result.messages.length}`,
        );

        // 从后往前查找最后一条有内容的AI消息
        for (let i = result.messages.length - 1; i >= 0; i--) {
          const message = result.messages[i];
          this.logger.debug(
            `Message ${i}: role=${message?.role}, content length=${message?.content?.length || 0}`,
          );

          if (
            message &&
            message.role === 'ai' &&
            message.content &&
            message.content.trim()
          ) {
            aiResponse = message.content;
            this.logger.debug(`Found AI response at index ${i}`);
            break;
          }
        }
      }

      // 如果有错误，记录但继续处理
      if (result && result.error) {
        this.logger.warn(`Agent returned error: ${result.error}`);
      }

      // 保存AI回复，包含检索到的上下文信息
      const aiMessage = await this.databaseService.chatSessionMessage.create({
        data: {
          sessionId,
          role: 'assistant',
          content: aiResponse,
          metadata: {
            ...result,
            retrievedContext: retrievedContext
              ? {
                  documentsCount: retrievedContext.documents?.length || 0,
                  contextSummary: retrievedContext.summary,
                }
              : null,
            compressionStats: {
              originalMessageCount: allMessages.length,
              compressedMessageCount: compressedMessages.length,
            },
          },
        },
      });

      return {
        sessionId,
        userMessage: { role, content },
        aiMessage: { role: 'assistant', content: aiResponse },
        metadata: {
          ...result,
          compressionApplied: allMessages.length > compressedMessages.length,
          ragEnhanced: !!retrievedContext,
          contextStats: {
            originalMessages: allMessages.length,
            compressedMessages: compressedMessages.length,
            retrievedDocuments: retrievedContext?.documents?.length || 0,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 智能消息压缩 - 基于LangGraphJS 2025最佳实践
   * 使用消息修剪和上下文重要性评估
   */
  private async intelligentMessageCompression(
    messages: any[],
    currentQuery: string,
    agent: any,
  ): Promise<any[]> {
    try {
      // 转换为LangChain消息格式
      const langchainMessages = messages.map((msg) => ({
        role: msg.role === 'assistant' ? 'ai' : msg.role,
        content: msg.content,
        id: msg.id,
      }));

      // 如果消息数量少于10条，直接返回
      if (langchainMessages.length <= 10) {
        return langchainMessages;
      }

      // 智能消息修剪策略
      const maxMessages = this.calculateOptimalMessageCount(
        agent,
        currentQuery,
      );

      // 保留系统消息、最近的人类消息和AI回复
      const systemMessages = langchainMessages.filter(
        (msg) => msg.role === 'system',
      );
      const conversationMessages = langchainMessages.filter(
        (msg) => msg.role !== 'system',
      );

      // 应用sliding window策略，保留最近的重要对话
      const recentMessages = conversationMessages.slice(-maxMessages);

      // 确保消息序列的完整性（人类-AI配对）
      const balancedMessages =
        this.ensureMessageSequenceIntegrity(recentMessages);

      // 合并系统消息和平衡的对话消息
      const compressedMessages = [...systemMessages, ...balancedMessages];

      this.logger.debug(
        `Message compression: ${langchainMessages.length} -> ${compressedMessages.length}`,
      );

      return compressedMessages;
    } catch (error) {
      this.logger.warn(`Message compression failed: ${error.message}`);
      // 降级策略：返回最近的20条消息
      return messages.slice(-20).map((msg) => ({
        role: msg.role === 'assistant' ? 'ai' : msg.role,
        content: msg.content,
        id: msg.id,
      }));
    }
  }

  /**
   * RAG检索增强 - 基于用户查询检索相关上下文
   */
  private async performRAGRetrieval(
    query: string,
    sessionId: string,
    agent: any,
  ): Promise<any> {
    try {
      this.logger.log(`=== 开始RAG检索 ===`);
      this.logger.log(`查询: ${query}`);
      this.logger.log(`会话ID: ${sessionId}`);
      this.logger.log(`代理ID: ${agent.id}`);
      this.logger.log(`代理能力: ${JSON.stringify(agent.capabilities)}`);

      // 检查代理是否支持RAG功能
      if (
        !agent.capabilities?.includes('rag') &&
        !agent.capabilities?.includes('retrieval')
      ) {
        this.logger.log(`代理不支持RAG功能，跳过检索`);
        return null;
      }

      this.logger.log(`代理支持RAG功能，开始检索相关文档...`);

      // 使用上下文管理器检索相关文档
      const retrievedDocs = await this.contextManager.retrieveRelevantContext(
        query,
        {
          sessionId,
          agentId: agent.id,
          maxDocuments: 5,
          similarityThreshold: 0.7,
        },
      );

      this.logger.log(`检索完成，找到 ${retrievedDocs?.length || 0} 个文档`);

      if (!retrievedDocs || retrievedDocs.length === 0) {
        this.logger.log(`没有找到相关文档，返回null`);
        return null;
      }

      // 记录检索到的文档详情
      retrievedDocs.forEach((doc, index) => {
        this.logger.log(`文档${index + 1}: ${doc.title} (${doc.namespace}) - 相似度: ${doc.similarity}`);
        this.logger.log(`内容预览: ${doc.content?.substring(0, 100)}...`);
      });

      // 格式化检索到的上下文
      const formattedContext = retrievedDocs
        .map((doc, index) => `文档${index + 1}: ${doc.content}`)
        .join('\n\n');

      // 生成上下文摘要
      const contextSummary = this.generateContextSummary(retrievedDocs);

      this.logger.log(`RAG检索成功完成，返回 ${retrievedDocs.length} 个文档`);
      this.logger.log(`=== RAG检索结束 ===`);

      return {
        documents: retrievedDocs,
        formattedContext,
        summary: contextSummary,
        retrievalQuery: query,
      };
    } catch (error) {
      this.logger.error(`RAG检索失败: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * 构建增强的消息历史
   */
  private buildEnhancedMessageHistory(
    compressedMessages: any[],
    retrievedContext: any,
    agent: any,
  ): any[] {
    this.logger.log(`=== 构建增强消息历史 ===`);
    this.logger.log(`压缩消息数量: ${compressedMessages.length}`);
    this.logger.log(`是否有检索上下文: ${!!retrievedContext}`);

    const enhancedMessages = [...compressedMessages];

    // 如果有检索到的上下文，添加到系统消息中
    if (retrievedContext && retrievedContext.formattedContext) {
      this.logger.log(`添加检索上下文到系统消息...`);
      this.logger.log(`格式化上下文长度: ${retrievedContext.formattedContext.length} 字符`);
      
      const contextSystemMessage = {
        role: 'system',
        content: `参考信息:\n${retrievedContext.formattedContext}\n\n请基于以上参考信息回答用户问题。`,
      };

      // 查找现有的系统消息并更新，或者在开头添加
      const systemMessageIndex = enhancedMessages.findIndex(
        (msg) => msg.role === 'system',
      );
      if (systemMessageIndex >= 0) {
        this.logger.log(`更新现有系统消息 (索引: ${systemMessageIndex})`);
        enhancedMessages[systemMessageIndex] = {
          ...enhancedMessages[systemMessageIndex],
          content: `${enhancedMessages[systemMessageIndex].content}\n\n${contextSystemMessage.content}`,
        };
      } else {
        this.logger.log(`添加新的系统消息到开头`);
        enhancedMessages.unshift(contextSystemMessage);
      }
    } else {
      this.logger.log(`没有检索上下文，保持原始消息历史`);
    }

    this.logger.log(`最终消息历史数量: ${enhancedMessages.length}`);
    this.logger.log(`=== 消息历史构建完成 ===`);

    return enhancedMessages;
  }

  /**
   * 计算最优消息数量
   */
  private calculateOptimalMessageCount(agent: any, query: string): number {
    // 基于代理类型和查询复杂度动态调整
    let baseCount = 20;

    // 技术支持代理需要更多上下文
    if (agent.type === 'technical_support') {
      baseCount = 30;
    }

    // 客服代理保持中等上下文
    if (agent.type === 'customer_service') {
      baseCount = 25;
    }

    // 预约代理需要较少上下文
    if (agent.type === 'appointment') {
      baseCount = 15;
    }

    // 基于查询长度调整
    const queryComplexity = query.length > 100 ? 1.2 : 1.0;

    return Math.floor(baseCount * queryComplexity);
  }

  /**
   * 确保消息序列完整性
   */
  private ensureMessageSequenceIntegrity(messages: any[]): any[] {
    if (messages.length === 0) return messages;

    const result = [];
    let i = 0;

    while (i < messages.length) {
      const currentMsg = messages[i];

      // 如果是用户消息，尝试找到对应的AI回复
      if (currentMsg.role === 'user' || currentMsg.role === 'human') {
        result.push(currentMsg);

        // 查找下一条AI消息
        if (
          i + 1 < messages.length &&
          (messages[i + 1].role === 'assistant' ||
            messages[i + 1].role === 'ai')
        ) {
          result.push(messages[i + 1]);
          i += 2;
        } else {
          i += 1;
        }
      } else {
        result.push(currentMsg);
        i += 1;
      }
    }

    return result;
  }

  /**
   * 生成上下文摘要
   */
  private generateContextSummary(documents: any[]): string {
    if (!documents || documents.length === 0) {
      return '';
    }

    const totalLength = documents.reduce(
      (sum, doc) => sum + (doc.content?.length || 0),
      0,
    );
    const avgLength = Math.floor(totalLength / documents.length);

    return `检索到${documents.length}个相关文档，平均长度${avgLength}字符`;
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
      this.logger.error(`Error switching agent: ${error.message}`, error.stack);
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
        userId,
      },
    });

    if (!session) {
      throw new NotFoundException('会话不存在');
    }

    return this.databaseService.chatSession.update({
      where: { id: sessionId },
      data: {
        status: 'ended',
        updatedAt: new Date(),
      },
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
      if (
        queryLower.includes('订单') ||
        queryLower.includes('order') ||
        queryLower.includes('退款')
      ) {
        const matchingAgent = agents.find(
          (agent) => agent.type === 'customer_service',
        );
        return matchingAgent || agents[0];
      }

      // 技术支持相关
      if (
        queryLower.includes('问题') ||
        queryLower.includes('故障') ||
        queryLower.includes('技术')
      ) {
        const matchingAgent = agents.find(
          (agent) => agent.type === 'technical_support',
        );
        return matchingAgent || agents[0];
      }

      // 预约相关
      if (
        queryLower.includes('预约') ||
        queryLower.includes('约') ||
        queryLower.includes('时间')
      ) {
        const matchingAgent = agents.find(
          (agent) => agent.type === 'appointment',
        );
        return matchingAgent || agents[0];
      }

      // 默认返回客服代理
      const defaultAgent =
        agents.find((agent) => agent.type === 'customer_service') || agents[0];
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
    const toolMessages = await this.databaseService.chatSessionMessage.findMany(
      {
        where: {
          role: 'tool',
          session: {
            agentId,
          },
        },
        select: {
          id: true,
          metadata: true,
        },
      },
    );

    // 手动聚合结果
    const toolUsage = toolMessages.reduce(
      (acc, message) => {
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
      },
      {} as Record<string, number>,
    );

    // 转换为数组并排序
    const result = Object.entries(toolUsage)
      .map(([toolName, count]) => ({ toolName, count: Number(count) }))
      .sort((a, b) => Number(b.count) - Number(a.count))
      .slice(0, 10);

    return result;
  }
}
