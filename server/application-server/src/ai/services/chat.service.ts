import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { ConversationChain } from 'langchain/chains';
import {
  BufferMemory,
  ConversationSummaryBufferMemory,
} from 'langchain/memory';
import { PromptTemplate } from '@langchain/core/prompts';
import { ConfigService } from '@nestjs/config';
import { MoonshotService } from './moonshot.service';
import { DatabaseService } from '../../database/database.service';

interface ChatSession {
  sessionId: string;
  userId: number;
  title: string;
  memory: BufferMemory | ConversationSummaryBufferMemory;
  chain: ConversationChain;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

export interface UserPreferences {
  language: string;
  responseStyle: string;
  maxResponseLength: number;
  preferredOptimizationTypes: string[];
  memoryType: 'buffer' | 'summary' | 'summary_buffer';
  maxTokens: number;
  maxHistoryMessages: number;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private sessions: Map<string, ChatSession> = new Map();
  private userPreferences: Map<number, UserPreferences> = new Map();

  constructor(
    private readonly moonshotService: MoonshotService,
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 发送消息并获取AI回复
   */
  async sendMessage(
    userId: number,
    message: string,
    sessionId?: string,
    context?: any,
  ): Promise<any> {
    try {
      // 获取或创建会话
      const session = sessionId 
        ? await this.getOrCreateSession(sessionId, userId)
        : await this.createNewSession(userId, '新对话');

      // 获取用户偏好
      const preferences = this.getUserPreferences(userId);

      // 构建增强的提示词
      const enhancedMessage = this.buildEnhancedPrompt(
        message,
        context,
        preferences,
      );

      // 使用LangChain进行对话
      const response = await session.chain.call({
        input: enhancedMessage,
      });

      // 更新会话信息
      session.updatedAt = new Date();
      session.messageCount++;

      // 保存到数据库（如果需要持久化）
      await this.saveMessageToDatabase(
        session.sessionId,
        userId,
        message,
        response.response,
      );

      // 返回响应
      return {
        response: response.response,
        sessionId: session.sessionId,
        messageCount: session.messageCount,
        usage: {
          promptTokens: this.estimateTokens(enhancedMessage),
          completionTokens: this.estimateTokens(response.response),
          totalTokens: this.estimateTokens(enhancedMessage + response.response),
    },
        context: {
          memoryType: preferences.memoryType,
          conversationLength: session.messageCount,
    },
      };
    } catch (error) {
      this.logger.error(`发送消息失败: ${error.message}`, error.stack);
      throw new Error(`AI服务暂时不可用: ${error.message}`);
    }
  }

  /**
   * 创建新会话
   */
  async createSession(
    userId: number,
    title?: string,
    initialMessage?: string,
  ): Promise<any> {
    const session = await this.createNewSession(userId, title || '新对话');

    if (initialMessage) {
      await this.sendMessage(userId, initialMessage, session.sessionId);
    }

    return {
      sessionId: session.sessionId,
      title: session.title,
      createdAt: session.createdAt,
      messageCount: session.messageCount,
    };
  }

  /**
   * 获取用户所有会话
   */
  async getUserSessions(userId: number): Promise<any[]> {
    const userSessions = Array.from(this.sessions.values())
      .filter((session) => session.userId === userId)
      .map((session) => ({
        sessionId: session.sessionId,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        messageCount: session.messageCount,
      }))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return userSessions;
  }

  /**
   * 获取指定会话详情
   */
  async getSession(sessionId: string): Promise<any> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('会话不存在');
    }

    // 获取会话历史
    const history = await this.getSessionHistory(sessionId);

    return {
      sessionId: session.sessionId,
      title: session.title,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messageCount: session.messageCount,
      history,
      memoryType: session.memory.constructor.name,
    };
  }

  /**
   * 更新会话信息
   */
  async updateSession(sessionId: string, updateData: any): Promise<any> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('会话不存在');
    }

    if (updateData.title) {
      session.title = updateData.title;
    }

    session.updatedAt = new Date();

    return {
      sessionId: session.sessionId,
      title: session.title,
      updatedAt: session.updatedAt,
    };
  }

  /**
   * 删除会话
   */
  async deleteSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('会话不存在');
    }

    // 清理内存
    await session.memory.clear();
    this.sessions.delete(sessionId);

    // 从数据库删除（如果有持久化）
    await this.deleteSessionFromDatabase(sessionId);
  }

  /**
   * 清空用户所有会话
   */
  async clearUserSessions(userId: number): Promise<void> {
    const userSessions = Array.from(this.sessions.entries())
      .filter(([_, session]) => session.userId === userId);

    for (const [sessionId, session] of userSessions) {
      await session.memory.clear();
      this.sessions.delete(sessionId);
    }

    // 从数据库清理
    await this.clearUserSessionsFromDatabase(userId);
  }

  /**
   * 设置用户偏好
   */
  setUserPreferences(
    userId: number,
    preferences: Partial<UserPreferences>,
  ): void {
    const currentPreferences = this.getUserPreferences(userId);
    const updatedPreferences = { ...currentPreferences, ...preferences };
    this.userPreferences.set(userId, updatedPreferences);
  }

  /**
   * 获取用户偏好
   */
  getUserPreferences(userId: number): UserPreferences {
    return (
      this.userPreferences.get(userId) || {
        language: 'zh',
        responseStyle: 'professional',
        maxResponseLength: 2000,
        preferredOptimizationTypes: ['basic', 'role-based'],
        memoryType: 'buffer',
        maxTokens: 4000,
        maxHistoryMessages: 20,
      }
    );
  }

  /**
   * 获取会话统计
   */
  async getSessionStats(userId: number): Promise<any> {
    const userSessions = Array.from(this.sessions.values()).filter(
      (session) => session.userId === userId,
    );

    const totalSessions = userSessions.length;
    const totalMessages = userSessions.reduce(
      (sum, session) => sum + session.messageCount,
      0,
    );
    const avgMessagesPerSession =
      totalSessions > 0 ? totalMessages / totalSessions : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySessions = userSessions.filter(
      (session) => session.createdAt >= today,
    ).length;

    return {
      totalSessions,
      totalMessages,
      avgMessagesPerSession: Math.round(avgMessagesPerSession * 100) / 100,
      todaySessions,
      activeSessionsCount: userSessions.filter((session) => {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return session.updatedAt >= hourAgo;
      }).length,
    };
  }

  /**
   * 获取或创建会话
   */
  private async getOrCreateSession(
    sessionId: string,
    userId: number,
  ): Promise<ChatSession> {
    let session = this.sessions.get(sessionId);
    if (!session) {
      // 尝试从数据库恢复会话
      session = await this.restoreSessionFromDatabase(sessionId, userId);
      if (!session) {
        throw new Error('会话不存在');
      }
    }
    return session;
  }

  /**
   * 创建新会话
   */
  private async createNewSession(
    userId: number,
    title: string,
  ): Promise<ChatSession> {
    const sessionId = this.generateSessionId();
    const preferences = this.getUserPreferences(userId);

    // 创建记忆组件
    const memory = this.createMemory(preferences);

    // 获取API密钥
    const apiKey = this.configService.get<string>('ai.moonshotApiKey');

    // 创建LangChain聊天模型
    const llm = new ChatOpenAI({
      apiKey,
      modelName: 'moonshot-v1-8k',
      temperature: 0.7,
      maxTokens: preferences.maxTokens,
      configuration: {
        baseURL: 'https://api.moonshot.cn/v1',
      },
    });

    // 创建对话链
    const chain = new ConversationChain({
      llm,
      memory,
      prompt: this.createPromptTemplate(preferences),
    });

    const session: ChatSession = {
      sessionId,
      userId,
      title,
      memory,
      chain,
      createdAt: new Date(),
      updatedAt: new Date(),
      messageCount: 0,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * 创建记忆组件
   */
  private createMemory(
    preferences: UserPreferences,
  ): BufferMemory | ConversationSummaryBufferMemory {
    switch (preferences.memoryType) {
      case 'buffer':
        return new BufferMemory({
          returnMessages: true,
          memoryKey: 'history',
    });

      case 'summary_buffer':
        // 获取API密钥
        const apiKey = this.configService.get<string>('ai.moonshotApiKey');

        const llm = new ChatOpenAI({
          apiKey,
          modelName: 'moonshot-v1-8k',
          temperature: 0.3,
          configuration: {
            baseURL: 'https://api.moonshot.cn/v1',
      },
    });

        return new ConversationSummaryBufferMemory({
          llm,
          maxTokenLimit: 2000,
          returnMessages: true,
          memoryKey: 'history',
    });

      default:
        return new BufferMemory({
          returnMessages: true,
          memoryKey: 'history',
    });
    }
  }

  /**
   * 创建提示词模板
   */
  private createPromptTemplate(preferences: UserPreferences): PromptTemplate {
    const template = `你是一个专业的AI助手，具有以下特点：
- 语言风格：${preferences.responseStyle === 'professional' ? '专业严谨' : preferences.responseStyle === 'casual' ? '轻松友好' : '平衡适中'}
- 回复语言：${preferences.language === 'zh' ? '中文' : '英文'}
- 回复长度：控制在${preferences.maxResponseLength}字符以内

请基于以下对话历史，为用户提供有帮助的回复：

{history}

用户: {input}
AI助手:`;

    return PromptTemplate.fromTemplate(template);
  }

  /**
   * 构建增强的提示词
   */
  private buildEnhancedPrompt(
    message: string,
    context?: any,
    preferences?: UserPreferences,
  ): string {
    let enhancedMessage = message;

    if (context) {
      enhancedMessage = `上下文信息：${JSON.stringify(context)}\n\n用户问题：${message}`;
    }

    return enhancedMessage;
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 估算token数量
   */
  private estimateTokens(text: string): number {
    // 简单估算：中文字符约1.5个token，英文单词约1个token
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = text
      .split(/\s+/)
      .filter((word) => /[a-zA-Z]/.test(word)).length;
    return Math.ceil(chineseChars * 1.5 + englishWords);
  }

  /**
   * 保存消息到数据库
   */
  private async saveMessageToDatabase(
    sessionId: string,
    userId: number,
    userMessage: string,
    aiResponse: string,
  ): Promise<void> {
    try {
      // 这里可以实现数据库持久化逻辑
      this.logger.debug(`保存消息到数据库: ${sessionId}`);
    } catch (error) {
      this.logger.error(`保存消息失败: ${error.message}`);
    }
  }

  /**
   * 从数据库恢复会话
   */
  private async restoreSessionFromDatabase(
    sessionId: string,
    userId: number,
  ): Promise<ChatSession | null> {
    try {
      // 这里可以实现从数据库恢复会话的逻辑
      this.logger.debug(`尝试从数据库恢复会话: ${sessionId}`);
      return null;
    } catch (error) {
      this.logger.error(`恢复会话失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 获取会话历史
   */
  private async getSessionHistory(sessionId: string): Promise<any[]> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return [];
      }

      // 从内存中获取历史记录
      const memoryVariables = await session.memory.loadMemoryVariables({});
      const history = memoryVariables.history || [];

      return Array.isArray(history) ? history : [];
    } catch (error) {
      this.logger.error(`获取会话历史失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 从数据库删除会话
   */
  private async deleteSessionFromDatabase(sessionId: string): Promise<void> {
    try {
      this.logger.debug(`从数据库删除会话: ${sessionId}`);
    } catch (error) {
      this.logger.error(`删除会话失败: ${error.message}`);
    }
  }

  /**
   * 清空用户会话
   */
  private async clearUserSessionsFromDatabase(userId: number): Promise<void> {
    try {
      this.logger.debug(`清空用户会话: ${userId}`);
    } catch (error) {
      this.logger.error(`清空用户会话失败: ${error.message}`);
    }
  }
}