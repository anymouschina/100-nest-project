import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { ConversationChain } from 'langchain/chains';
import {
  BufferMemory,
  ConversationSummaryBufferMemory,
} from 'langchain/memory';
import { PromptTemplate } from '@langchain/core/prompts';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
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
  lastAccessTime: Date;
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
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24小时
  private readonly MAX_SESSIONS_PER_USER = 50;

  constructor(
    private readonly moonshotService: MoonshotService,
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {
    this.initializeService();
  }

  /**
   * 初始化服务
   */
  private async initializeService(): Promise<void> {
    try {
      // 从数据库恢复活跃会话
      await this.restoreActiveSessions();
      this.logger.log('ChatService 初始化完成');
    } catch (error) {
      this.logger.error('ChatService 初始化失败', error.stack);
    }
  }

  /**
   * 发送消息并获取AI回复
   */
  async sendMessage(
    userId: number,
    message: string,
    sessionId?: string,
    context?: any,
  ): Promise<any> {
    const maxRetries = 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // 获取或创建会话
        const session = sessionId
          ? await this.getOrCreateSession(sessionId, userId)
          : await this.createNewSession(userId, '新对话');

        // 检查用户会话数量限制
        await this.checkUserSessionLimit(userId);

        // 获取用户偏好
        const preferences = await this.getUserPreferences(userId);

        // 构建增强的提示词
        const enhancedMessage = this.buildEnhancedPrompt(message, context);

        // 使用LangChain进行对话
        const response = await session.chain.call({
          input: enhancedMessage,
        });

        // 更新会话信息
        session.updatedAt = new Date();
        session.lastAccessTime = new Date();
        session.messageCount++;

        // 保存到数据库
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
            totalTokens: this.estimateTokens(
              enhancedMessage + response.response,
            ),
          },
          context: {
            memoryType: preferences.memoryType,
            conversationLength: session.messageCount,
          },
        };
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `发送消息失败 (尝试 ${attempt}/${maxRetries}): ${error.message}`,
        );

        if (attempt < maxRetries) {
          // 指数退避重试
          await this.delay(1000 * Math.pow(2, attempt - 1));
        }
      }
    }

    this.logger.error(
      `发送消息最终失败: ${lastError.message}`,
      lastError.stack,
    );
    throw new Error(`AI服务暂时不可用，请稍后重试: ${lastError.message}`);
  }

  /**
   * 创建新会话
   */
  async createSession(
    userId: number,
    title?: string,
    initialMessage?: string,
  ): Promise<any> {
    try {
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
    } catch (error) {
      this.logger.error(`创建会话失败: ${error.message}`, error.stack);
      throw new Error(`创建会话失败: ${error.message}`);
    }
  }

  /**
   * 获取用户所有会话
   */
  async getUserSessions(userId: number): Promise<any[]> {
    try {
      // 从数据库获取会话列表
      const dbSessions = await (
        this.databaseService as any
      ).chatSession.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: {
          sessionId: true,
          title: true,
          createdAt: true,
          updatedAt: true,
          messageCount: true,
        },
      });

      // 合并内存中的会话信息
      const memorySessions = Array.from(this.sessions.values())
        .filter((session) => session.userId === userId)
        .map((session) => ({
          sessionId: session.sessionId,
          title: session.title,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          messageCount: session.messageCount,
        }));

      // 去重并合并
      const sessionMap = new Map();
      [...dbSessions, ...memorySessions].forEach((session) => {
        sessionMap.set(session.sessionId, session);
      });

      return Array.from(sessionMap.values()).sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
      );
    } catch (error) {
      this.logger.error(`获取用户会话失败: ${error.message}`, error.stack);
      throw new Error(`获取会话列表失败: ${error.message}`);
    }
  }

  /**
   * 获取指定会话详情
   */
  async getSession(sessionId: string): Promise<any> {
    try {
      let session = this.sessions.get(sessionId);

      if (!session) {
        // 尝试从数据库恢复
        const dbSession = await (
          this.databaseService as any
        ).chatSession.findUnique({
          where: { sessionId },
          include: { messages: { orderBy: { createdAt: 'asc' } } },
        });

        if (!dbSession) {
          throw new NotFoundException('会话不存在');
        }

        // 恢复会话到内存
        session = await this.restoreSessionFromDatabase(
          sessionId,
          dbSession.userId,
        );
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
    } catch (error) {
      this.logger.error(`获取会话详情失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 更新会话信息
   */
  async updateSession(sessionId: string, updateData: any): Promise<any> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new NotFoundException('会话不存在');
      }

      if (updateData.title) {
        session.title = updateData.title;

        // 更新数据库
        await (this.databaseService as any).chatSession.update({
          where: { sessionId },
          data: { title: updateData.title, updatedAt: new Date() },
        });
      }

      session.updatedAt = new Date();

      return {
        sessionId: session.sessionId,
        title: session.title,
        updatedAt: session.updatedAt,
      };
    } catch (error) {
      this.logger.error(`更新会话失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 删除会话
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);

      if (session) {
        // 清理内存
        await session.memory.clear();
        this.sessions.delete(sessionId);
      }

      // 从数据库删除
      await this.deleteSessionFromDatabase(sessionId);
    } catch (error) {
      this.logger.error(`删除会话失败: ${error.message}`, error.stack);
      throw new Error(`删除会话失败: ${error.message}`);
    }
  }

  /**
   * 清空用户所有会话
   */
  async clearUserSessions(userId: number): Promise<void> {
    try {
      const userSessions = Array.from(this.sessions.entries()).filter(
        ([, session]) => session.userId === userId,
      );

      for (const [sessionId, session] of userSessions) {
        await session.memory.clear();
        this.sessions.delete(sessionId);
      }

      // 从数据库清理
      await this.clearUserSessionsFromDatabase(userId);
    } catch (error) {
      this.logger.error(`清空用户会话失败: ${error.message}`, error.stack);
      throw new Error(`清空会话失败: ${error.message}`);
    }
  }

  /**
   * 设置用户偏好
   */
  async setUserPreferences(
    userId: number,
    preferences: Partial<UserPreferences>,
  ): Promise<void> {
    try {
      const currentPreferences = await this.getUserPreferences(userId);
      const updatedPreferences = { ...currentPreferences, ...preferences };

      this.userPreferences.set(userId, updatedPreferences);

      // 保存到数据库
      await (this.databaseService as any).userPreference.upsert({
        where: { userId },
        update: { preferences: updatedPreferences, updatedAt: new Date() },
        create: { userId, preferences: updatedPreferences },
      });
    } catch (error) {
      this.logger.error(`设置用户偏好失败: ${error.message}`, error.stack);
      throw new Error(`设置偏好失败: ${error.message}`);
    }
  }

  /**
   * 获取用户偏好
   */
  async getUserPreferences(userId: number): Promise<UserPreferences> {
    try {
      // 先从内存获取
      let preferences = this.userPreferences.get(userId);

      if (!preferences) {
        // 从数据库获取
        const dbPreferences = await (
          this.databaseService as any
        ).userPreference.findUnique({
          where: { userId },
        });

        preferences = (dbPreferences?.preferences as UserPreferences) || {
          language: 'zh',
          responseStyle: 'professional',
          maxResponseLength: 2000,
          preferredOptimizationTypes: ['basic', 'role-based'],
          memoryType: 'buffer',
          maxTokens: 4000,
          maxHistoryMessages: 20,
        };

        this.userPreferences.set(userId, preferences);
      }

      return preferences;
    } catch (error) {
      this.logger.error(`获取用户偏好失败: ${error.message}`, error.stack);
      // 返回默认偏好
      return {
        language: 'zh',
        responseStyle: 'professional',
        maxResponseLength: 2000,
        preferredOptimizationTypes: ['basic', 'role-based'],
        memoryType: 'buffer',
        maxTokens: 4000,
        maxHistoryMessages: 20,
      };
    }
  }

  /**
   * 获取会话统计
   */
  async getSessionStats(userId: number): Promise<any> {
    try {
      const stats = await (this.databaseService as any).chatSession.aggregate({
        where: { userId },
        _count: { sessionId: true },
        _sum: { messageCount: true },
        _avg: { messageCount: true },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayStats = await (this.databaseService as any).chatSession.count({
        where: {
          userId,
          createdAt: { gte: today },
        },
      });

      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const activeSessionsCount = Array.from(this.sessions.values()).filter(
        (session) =>
          session.userId === userId && session.lastAccessTime >= hourAgo,
      ).length;

      return {
        totalSessions: stats._count.sessionId || 0,
        totalMessages: stats._sum.messageCount || 0,
        avgMessagesPerSession:
          Math.round((stats._avg.messageCount || 0) * 100) / 100,
        todaySessions: todayStats,
        activeSessionsCount,
      };
    } catch (error) {
      this.logger.error(`获取会话统计失败: ${error.message}`, error.stack);
      throw new Error(`获取统计信息失败: ${error.message}`);
    }
  }

  /**
   * 定期清理过期会话
   */
  @Cron('0 */6 * * *') // 每6小时执行一次
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const expiredTime = new Date(Date.now() - this.SESSION_TIMEOUT);
      let cleanedCount = 0;

      // 清理内存中的过期会话
      for (const [sessionId, session] of this.sessions.entries()) {
        if (session.lastAccessTime < expiredTime) {
          await session.memory.clear();
          this.sessions.delete(sessionId);
          cleanedCount++;
        }
      }

      // 清理数据库中的过期会话
      const dbCleanResult = await (
        this.databaseService as any
      ).chatSession.deleteMany({
        where: {
          updatedAt: { lt: expiredTime },
        },
      });

      this.logger.log(
        `清理过期会话完成: 内存清理 ${cleanedCount} 个，数据库清理 ${dbCleanResult.count} 个`,
      );
    } catch (error) {
      this.logger.error(`清理过期会话失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 检查用户会话数量限制
   */
  private async checkUserSessionLimit(userId: number): Promise<void> {
    const userSessionCount = Array.from(this.sessions.values()).filter(
      (session) => session.userId === userId,
    ).length;

    if (userSessionCount >= this.MAX_SESSIONS_PER_USER) {
      // 删除最旧的会话
      const oldestSession = Array.from(this.sessions.values())
        .filter((session) => session.userId === userId)
        .sort(
          (a, b) => a.lastAccessTime.getTime() - b.lastAccessTime.getTime(),
        )[0];

      if (oldestSession) {
        await this.deleteSession(oldestSession.sessionId);
      }
    }
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
        throw new NotFoundException('会话不存在');
      }
    }

    // 更新最后访问时间
    session.lastAccessTime = new Date();
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
    const preferences = await this.getUserPreferences(userId);

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

    const now = new Date();
    const session: ChatSession = {
      sessionId,
      userId,
      title,
      memory,
      chain,
      createdAt: now,
      updatedAt: now,
      lastAccessTime: now,
      messageCount: 0,
    };

    this.sessions.set(sessionId, session);

    // 保存到数据库
    await (this.databaseService as any).chatSession.create({
      data: {
        sessionId,
        userId,
        title,
        createdAt: now,
        updatedAt: now,
        messageCount: 0,
      },
    });

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
  private buildEnhancedPrompt(message: string, context?: any): string {
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
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 恢复活跃会话
   */
  private async restoreActiveSessions(): Promise<void> {
    try {
      const recentTime = new Date(Date.now() - 60 * 60 * 1000); // 1小时内的会话
      const activeSessions = await (
        this.databaseService as any
      ).chatSession.findMany({
        where: {
          updatedAt: { gte: recentTime },
        },
        take: 100, // 限制恢复数量
      });

      for (const dbSession of activeSessions) {
        try {
          await this.restoreSessionFromDatabase(
            dbSession.sessionId,
            dbSession.userId,
          );
        } catch (error) {
          this.logger.warn(
            `恢复会话失败 ${dbSession.sessionId}: ${error.message}`,
          );
        }
      }

      this.logger.log(`恢复了 ${activeSessions.length} 个活跃会话`);
    } catch (error) {
      this.logger.error(`恢复活跃会话失败: ${error.message}`, error.stack);
    }
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
      await (this.databaseService as any).chatMessage.create({
        data: {
          sessionId,
          userId,
          userMessage,
          aiResponse,
          createdAt: new Date(),
        },
      });

      // 更新会话的消息计数
      await (this.databaseService as any).chatSession.update({
        where: { sessionId },
        data: {
          messageCount: { increment: 1 },
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`保存消息失败: ${error.message}`, error.stack);
      // 不抛出异常，避免影响用户体验
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
      const dbSession = await (
        this.databaseService as any
      ).chatSession.findUnique({
        where: { sessionId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 50, // 限制恢复的消息数量
          },
        },
      });

      if (!dbSession || dbSession.userId !== userId) {
        return null;
      }

      const userPreferences = await this.getUserPreferences(userId);
      const memory = this.createMemory(userPreferences);

      // 恢复对话历史到内存
      for (const message of dbSession.messages) {
        await memory.saveContext(
          { input: message.userMessage },
          { output: message.aiResponse },
        );
      }

      const apiKey = this.configService.get<string>('ai.moonshotApiKey');
      const llm = new ChatOpenAI({
        apiKey,
        modelName: 'moonshot-v1-8k',
        temperature: 0.7,
        maxTokens: userPreferences.maxTokens,
        configuration: {
          baseURL: 'https://api.moonshot.cn/v1',
        },
      });

      const chain = new ConversationChain({
        llm,
        memory,
        prompt: this.createPromptTemplate(userPreferences),
      });

      const session: ChatSession = {
        sessionId: dbSession.sessionId,
        userId: dbSession.userId,
        title: dbSession.title,
        memory,
        chain,
        createdAt: dbSession.createdAt,
        updatedAt: dbSession.updatedAt,
        lastAccessTime: new Date(),
        messageCount: dbSession.messageCount,
      };

      this.sessions.set(sessionId, session);
      return session;
    } catch (error) {
      this.logger.error(`恢复会话失败: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * 获取会话历史
   */
  private async getSessionHistory(sessionId: string): Promise<any[]> {
    try {
      const messages = await (this.databaseService as any).chatMessage.findMany(
        {
          where: { sessionId },
          orderBy: { createdAt: 'asc' },
          take: 100, // 限制返回数量
        },
      );

      return messages.map((msg) => ({
        userMessage: msg.userMessage,
        aiResponse: msg.aiResponse,
        createdAt: msg.createdAt,
      }));
    } catch (error) {
      this.logger.error(`获取会话历史失败: ${error.message}`, error.stack);

      // 尝试从内存获取
      const session = this.sessions.get(sessionId);
      if (session) {
        try {
          const memoryVariables = await session.memory.loadMemoryVariables({});
          const history = memoryVariables.history || [];
          return Array.isArray(history) ? history : [];
        } catch (memError) {
          this.logger.error(`从内存获取历史失败: ${memError.message}`);
        }
      }

      return [];
    }
  }

  /**
   * 从数据库删除会话
   */
  private async deleteSessionFromDatabase(sessionId: string): Promise<void> {
    try {
      // 删除会话相关的消息
      await (this.databaseService as any).chatMessage.deleteMany({
        where: { sessionId },
      });

      // 删除会话
      await (this.databaseService as any).chatSession.delete({
        where: { sessionId },
      });
    } catch (error) {
      this.logger.error(`删除会话失败: ${error.message}`, error.stack);
      // 不抛出异常，避免影响用户体验
    }
  }

  /**
   * 清空用户会话
   */
  private async clearUserSessionsFromDatabase(userId: number): Promise<void> {
    try {
      // 获取用户所有会话ID
      const userSessions = await (
        this.databaseService as any
      ).chatSession.findMany({
        where: { userId },
        select: { sessionId: true },
      });

      const sessionIds = userSessions.map((s) => s.sessionId);

      // 删除所有消息
      await (this.databaseService as any).chatMessage.deleteMany({
        where: { sessionId: { in: sessionIds } },
      });

      // 删除所有会话
      await (this.databaseService as any).chatSession.deleteMany({
        where: { userId },
      });
    } catch (error) {
      this.logger.error(`清空用户会话失败: ${error.message}`, error.stack);
      throw error;
    }
  }
}
