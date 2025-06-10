import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { LangChainAIProviderService } from './langchain-ai-provider.service';
import { DatabaseService } from '../../database/database.service';
import { ChatMessage } from '../interfaces/ai.interface';

interface ChatSession {
  sessionId: string;
  userId: number;
  title: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
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
  maxTokens: number;
  maxHistoryMessages: number;
  useAnalysisModel?: boolean;
  fastMode?: boolean;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private sessions: Map<string, ChatSession> = new Map();
  private userPreferences: Map<number, UserPreferences> = new Map();
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24小时
  private readonly MAX_SESSIONS_PER_USER = 50;

  constructor(
    private readonly aiProviderService: LangChainAIProviderService,
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

        // 构建对话历史
        const conversationHistory = this.buildConversationHistory(session, preferences);
        
        // 添加当前用户消息
        conversationHistory.push({ role: 'user', content: enhancedMessage });

        // 使用AI提供商服务进行对话
        const aiResponse = await this.aiProviderService.chat(
          conversationHistory,
          {
            temperature: 0.7,
            maxTokens: preferences.maxTokens,
            useAnalysisModel: preferences.useAnalysisModel,
            fastMode: preferences.fastMode,
          },
        );

        // 添加消息到会话历史
        const timestamp = new Date();
        session.messages.push(
          { role: 'user', content: message, timestamp },
          { role: 'assistant', content: aiResponse.content, timestamp }
        );

        // 限制历史消息数量
        if (session.messages.length > preferences.maxHistoryMessages * 2) {
          session.messages = session.messages.slice(-preferences.maxHistoryMessages * 2);
        }

        // 更新会话信息
        session.updatedAt = new Date();
        session.lastAccessTime = new Date();
        session.messageCount++;

        // 保存到数据库
        await this.saveMessageToDatabase(
          session.sessionId,
          userId,
          message,
          aiResponse.content,
        );

        // 返回响应
        return {
          response: aiResponse.content,
          sessionId: session.sessionId,
          messageCount: session.messageCount,
          usage: {
            promptTokens: this.estimateTokens(enhancedMessage),
            completionTokens: this.estimateTokens(aiResponse.content),
            totalTokens: this.estimateTokens(enhancedMessage + aiResponse.content),
          },
          context: {
            conversationLength: session.messageCount,
            historyLength: session.messages.length,
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

      // 合并并去重
      const sessionMap = new Map();
      [...dbSessions, ...memorySessions].forEach((session) => {
        sessionMap.set(session.sessionId, session);
      });

      return Array.from(sessionMap.values()).sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
      );
    } catch (error) {
      this.logger.error(`获取用户会话失败: ${error.message}`, error.stack);
      throw new Error(`获取用户会话失败: ${error.message}`);
    }
  }

  /**
   * 获取会话详情
   */
  async getSession(sessionId: string): Promise<any> {
    try {
      const session = this.sessions.get(sessionId);
      if (session) {
        return {
          sessionId: session.sessionId,
          title: session.title,
          userId: session.userId,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          messageCount: session.messageCount,
          messages: session.messages.slice(-20), // 返回最近20条消息
        };
      }

      // 从数据库查询
      const dbSession = await (this.databaseService as any).chatSession.findUnique({
        where: { sessionId },
      });

      if (!dbSession) {
        throw new NotFoundException(`会话 ${sessionId} 不存在`);
      }

      // 恢复会话到内存
      const restoredSession = await this.restoreSessionFromDatabase(
        sessionId,
        dbSession.userId,
      );

      if (restoredSession) {
        return {
          sessionId: restoredSession.sessionId,
          title: restoredSession.title,
          userId: restoredSession.userId,
          createdAt: restoredSession.createdAt,
          updatedAt: restoredSession.updatedAt,
          messageCount: restoredSession.messageCount,
          messages: restoredSession.messages.slice(-20),
        };
      }

      return dbSession;
    } catch (error) {
      this.logger.error(`获取会话失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 更新会话
   */
  async updateSession(sessionId: string, updateData: any): Promise<any> {
    try {
      const session = this.sessions.get(sessionId);
      if (session) {
        if (updateData.title) {
          session.title = updateData.title;
          session.updatedAt = new Date();
        }
      }

      // 更新数据库
      const updatedSession = await (this.databaseService as any).chatSession.update({
        where: { sessionId },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });

      return updatedSession;
    } catch (error) {
      this.logger.error(`更新会话失败: ${error.message}`, error.stack);
      throw new Error(`更新会话失败: ${error.message}`);
    }
  }

  /**
   * 删除会话
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      // 从内存中删除
      this.sessions.delete(sessionId);

      // 从数据库删除
      await this.deleteSessionFromDatabase(sessionId);
    } catch (error) {
      this.logger.error(`删除会话失败: ${error.message}`, error.stack);
      throw new Error(`删除会话失败: ${error.message}`);
    }
  }

  /**
   * 清除用户所有会话
   */
  async clearUserSessions(userId: number): Promise<void> {
    try {
      // 从内存中删除该用户的所有会话
      const userSessions = Array.from(this.sessions.values()).filter(
        (session) => session.userId === userId,
      );
      userSessions.forEach((session) => {
        this.sessions.delete(session.sessionId);
      });

      // 从数据库删除
      await this.clearUserSessionsFromDatabase(userId);
    } catch (error) {
      this.logger.error(`清除用户会话失败: ${error.message}`, error.stack);
      throw new Error(`清除用户会话失败: ${error.message}`);
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
        update: { preferences: updatedPreferences },
        create: { userId, preferences: updatedPreferences },
      });
    } catch (error) {
      this.logger.error(`设置用户偏好失败: ${error.message}`, error.stack);
      throw new Error(`设置用户偏好失败: ${error.message}`);
    }
  }

  /**
   * 获取用户偏好
   */
  async getUserPreferences(userId: number): Promise<UserPreferences> {
    try {
      // 优先从内存获取
      const cached = this.userPreferences.get(userId);
      if (cached) {
        return cached;
      }

      // 从数据库获取
      const dbPreferences = await (this.databaseService as any).userPreference.findUnique({
        where: { userId },
      });

      const defaultPreferences: UserPreferences = {
        language: this.configService.get<string>('app.defaultLanguage') || 'zh',
        responseStyle: 'balanced',
        maxResponseLength: 2000,
        preferredOptimizationTypes: ['performance', 'security'],
        maxTokens: 2000,
        maxHistoryMessages: 10,
        useAnalysisModel: false,
        fastMode: false,
      };

      const preferences = dbPreferences
        ? { ...defaultPreferences, ...dbPreferences.preferences }
        : defaultPreferences;

      // 缓存到内存
      this.userPreferences.set(userId, preferences);

      return preferences;
    } catch (error) {
      this.logger.error(`获取用户偏好失败: ${error.message}`, error.stack);
      // 返回默认偏好
      return {
        language: 'zh',
        responseStyle: 'balanced',
        maxResponseLength: 2000,
        preferredOptimizationTypes: ['performance', 'security'],
        maxTokens: 2000,
        maxHistoryMessages: 10,
        useAnalysisModel: false,
        fastMode: false,
      };
    }
  }

  /**
   * 获取会话统计信息
   */
  async getSessionStats(userId: number): Promise<any> {
    try {
      const userSessions = Array.from(this.sessions.values()).filter(
        (session) => session.userId === userId,
      );

      const dbStats = await (this.databaseService as any).chatSession.aggregate({
        where: { userId },
        _count: { sessionId: true },
        _sum: { messageCount: true },
      });

      const totalMessages = userSessions.reduce(
        (sum, session) => sum + session.messageCount,
        0,
      );

      const activeSessionsToday = userSessions.filter(
        (session) =>
          session.lastAccessTime.getTime() > Date.now() - 24 * 60 * 60 * 1000,
      ).length;

      return {
        totalSessions: Math.max(userSessions.length, dbStats._count.sessionId || 0),
        totalMessages: Math.max(totalMessages, dbStats._sum.messageCount || 0),
        activeSessions: userSessions.length,
        activeSessionsToday,
        averageMessagesPerSession:
          userSessions.length > 0
            ? Math.round(totalMessages / userSessions.length)
            : 0,
      };
    } catch (error) {
      this.logger.error(`获取会话统计失败: ${error.message}`, error.stack);
      return {
        totalSessions: 0,
        totalMessages: 0,
        activeSessions: 0,
        activeSessionsToday: 0,
        averageMessagesPerSession: 0,
      };
    }
  }

  /**
   * 定时清理过期会话
   */
  @Cron('0 2 * * *') // 每天凌晨2点执行
  async cleanupExpiredSessions(): Promise<void> {
    try {
      const expiredTime = new Date(Date.now() - this.SESSION_TIMEOUT);
      let cleanedCount = 0;

      // 清理内存中的过期会话
      for (const [sessionId, session] of this.sessions.entries()) {
        if (session.lastAccessTime < expiredTime) {
          this.sessions.delete(sessionId);
          cleanedCount++;
        }
      }

      // 清理数据库中的过期会话
      const dbResult = await (this.databaseService as any).chatSession.deleteMany({
        where: {
          updatedAt: { lt: expiredTime },
        },
      });

      this.logger.log(
        `清理过期会话完成: 内存${cleanedCount}个, 数据库${dbResult.count}个`,
      );
    } catch (error) {
      this.logger.error(`清理过期会话失败: ${error.message}`, error.stack);
    }
  }

  // 私有方法

  private async checkUserSessionLimit(userId: number): Promise<void> {
    const userSessions = Array.from(this.sessions.values()).filter(
      (session) => session.userId === userId,
    );

    if (userSessions.length >= this.MAX_SESSIONS_PER_USER) {
      // 删除最老的会话
      const oldestSession = userSessions.sort(
        (a, b) => a.lastAccessTime.getTime() - b.lastAccessTime.getTime(),
      )[0];

      await this.deleteSession(oldestSession.sessionId);
      this.logger.log(
        `用户 ${userId} 达到会话数量限制，删除最老会话 ${oldestSession.sessionId}`,
      );
    }
  }

  private async getOrCreateSession(
    sessionId: string,
    userId: number,
  ): Promise<ChatSession> {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = await this.restoreSessionFromDatabase(sessionId, userId);
      if (!session) {
        throw new NotFoundException(`会话 ${sessionId} 不存在`);
      }
    }

    // 更新最后访问时间
    session.lastAccessTime = new Date();
    return session;
  }

  private async createNewSession(
    userId: number,
    title: string,
  ): Promise<ChatSession> {
    const sessionId = this.generateSessionId();

    const now = new Date();
    const session: ChatSession = {
      sessionId,
      userId,
      title,
      messages: [],
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

  private buildConversationHistory(
    session: ChatSession,
    preferences: UserPreferences,
  ): ChatMessage[] {
    // 构建系统提示词
    const systemPrompt = this.buildSystemPrompt(preferences);
    const history: ChatMessage[] = [
      { role: 'system', content: systemPrompt }
    ];

    // 添加历史消息（限制数量）
    const recentMessages = session.messages.slice(-preferences.maxHistoryMessages * 2);
    recentMessages.forEach(msg => {
      history.push({ role: msg.role, content: msg.content });
    });

    return history;
  }

  private buildSystemPrompt(preferences: UserPreferences): string {
    return `你是一个专业的AI助手，具有以下特点：
- 语言风格：${preferences.responseStyle === 'professional' ? '专业严谨' : preferences.responseStyle === 'casual' ? '轻松友好' : '平衡适中'}
- 回复语言：${preferences.language === 'zh' ? '中文' : '英文'}
- 回复长度：控制在${preferences.maxResponseLength}字符以内

请为用户提供有帮助、准确、友好的回复。`;
  }

  private buildEnhancedPrompt(message: string, context?: any): string {
    let enhancedMessage = message;

    if (context) {
      enhancedMessage = `上下文信息：${JSON.stringify(context)}\n\n用户问题：${message}`;
    }

    return enhancedMessage;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private estimateTokens(text: string): number {
    // 简单估算：中文字符约1.5个token，英文单词约1个token
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = text
      .split(/\s+/)
      .filter((word) => /[a-zA-Z]/.test(word)).length;
    return Math.ceil(chineseChars * 1.5 + englishWords);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

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

  private async saveMessageToDatabase(
    sessionId: string,
    userId: number,
    userMessage: string,
    aiResponse: string,
  ): Promise<void> {
    try {
      const now = new Date();

      // 保存用户消息
      await (this.databaseService as any).chatMessage.create({
        data: {
          sessionId,
          userId,
          role: 'user',
          content: userMessage,
          createdAt: now,
        },
      });

      // 保存AI回复
      await (this.databaseService as any).chatMessage.create({
        data: {
          sessionId,
          userId,
          role: 'assistant',
          content: aiResponse,
          createdAt: now,
        },
      });

      // 更新会话统计
      await (this.databaseService as any).chatSession.update({
        where: { sessionId },
        data: {
          messageCount: { increment: 1 },
          updatedAt: now,
        },
      });
    } catch (error) {
      this.logger.error(`保存消息到数据库失败: ${error.message}`, error.stack);
      // 不抛出错误，避免影响用户体验
    }
  }

  private async restoreSessionFromDatabase(
    sessionId: string,
    userId: number,
  ): Promise<ChatSession | null> {
    try {
      const dbSession = await (this.databaseService as any).chatSession.findUnique({
        where: { sessionId },
      });

      if (!dbSession || dbSession.userId !== userId) {
        return null;
      }

      // 获取会话历史消息
      const messages = await this.getSessionHistory(sessionId);

      const session: ChatSession = {
        sessionId: dbSession.sessionId,
        userId: dbSession.userId,
        title: dbSession.title,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.createdAt,
        })),
        createdAt: dbSession.createdAt,
        updatedAt: dbSession.updatedAt,
        lastAccessTime: new Date(),
        messageCount: dbSession.messageCount,
      };

      this.sessions.set(sessionId, session);
      return session;
    } catch (error) {
      this.logger.error(
        `从数据库恢复会话失败 ${sessionId}: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  private async getSessionHistory(sessionId: string): Promise<any[]> {
    try {
      return await (this.databaseService as any).chatMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'asc' },
        select: {
          role: true,
          content: true,
          createdAt: true,
        },
      });
    } catch (error) {
      this.logger.error(
        `获取会话历史失败 ${sessionId}: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  private async deleteSessionFromDatabase(sessionId: string): Promise<void> {
    try {
      // 删除会话消息
      await (this.databaseService as any).chatMessage.deleteMany({
        where: { sessionId },
      });

      // 删除会话
      await (this.databaseService as any).chatSession.delete({
        where: { sessionId },
      });
    } catch (error) {
      this.logger.error(
        `从数据库删除会话失败 ${sessionId}: ${error.message}`,
        error.stack,
      );
    }
  }

  private async clearUserSessionsFromDatabase(userId: number): Promise<void> {
    try {
      // 删除用户所有消息
      await (this.databaseService as any).chatMessage.deleteMany({
        where: { userId },
      });

      // 删除用户所有会话
      await (this.databaseService as any).chatSession.deleteMany({
        where: { userId },
      });
    } catch (error) {
      this.logger.error(
        `从数据库清除用户会话失败 ${userId}: ${error.message}`,
        error.stack,
      );
    }
  }
}
