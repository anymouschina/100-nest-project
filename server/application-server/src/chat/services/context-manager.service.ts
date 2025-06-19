import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { OllamaService } from './ollama.service';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface MessageContext {
  role: string;
  content: string;
  timestamp?: Date;
  id?: string;
  metadata?: any;
}

export interface ContextWindow {
  messages: MessageContext[];
  summary?: string;
  totalTokens: number;
  trimmed: boolean;
}

export interface ContextConfig {
  maxMessages: number;
  maxTokens: number;
  keepSystemMessage: boolean;
  enableSummary: boolean;
  summaryThreshold: number;
  preserveLastN: number;
}

@Injectable()
export class ContextManagerService {
  private readonly logger = new Logger(ContextManagerService.name);

  private readonly defaultConfig: ContextConfig = {
    maxMessages: 50,
    maxTokens: 4000,
    keepSystemMessage: true,
    enableSummary: true,
    summaryThreshold: 20,
    preserveLastN: 10,
  };

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly ollamaService: OllamaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 智能消息裁剪 - 基于LangGraph trimMessages最佳实践
   */
  async trimMessages(
    messages: MessageContext[],
    config: Partial<ContextConfig> = {},
  ): Promise<ContextWindow> {
    const finalConfig = { ...this.defaultConfig, ...config };

    this.logger.log(`开始消息裁剪，原始消息数: ${messages.length}`);

    // 如果消息数量在限制内，直接返回
    if (messages.length <= finalConfig.maxMessages) {
      const totalTokens = await this.estimateTokens(messages);
      if (totalTokens <= finalConfig.maxTokens) {
        return {
          messages,
          totalTokens,
          trimmed: false,
        };
      }
    }

    // 分离系统消息和其他消息
    const systemMessages = messages.filter((msg) => msg.role === 'system');
    const nonSystemMessages = messages.filter((msg) => msg.role !== 'system');

    let trimmedMessages: MessageContext[] = [];
    let summary: string | undefined;

    // 检查是否需要生成摘要
    if (
      finalConfig.enableSummary &&
      nonSystemMessages.length > finalConfig.summaryThreshold
    ) {
      // 获取需要摘要的消息（除了最后N条）
      const messagesToSummarize = nonSystemMessages.slice(
        0,
        -finalConfig.preserveLastN,
      );
      const recentMessages = nonSystemMessages.slice(
        -finalConfig.preserveLastN,
      );

      if (messagesToSummarize.length > 0) {
        summary = await this.generateSummary(messagesToSummarize);
        trimmedMessages = recentMessages;
        this.logger.log(
          `生成摘要，摘要消息数: ${messagesToSummarize.length}，保留消息数: ${recentMessages.length}`,
        );
      } else {
        trimmedMessages = nonSystemMessages;
      }
    } else {
      // 基于token限制裁剪
      trimmedMessages = await this.trimByTokens(
        nonSystemMessages,
        finalConfig.maxTokens,
      );
    }

    // 重新组合消息（系统消息 + 摘要 + 裁剪后的消息）
    const finalMessages: MessageContext[] = [];

    if (finalConfig.keepSystemMessage && systemMessages.length > 0) {
      finalMessages.push(...systemMessages);
    }

    if (summary) {
      finalMessages.push({
        role: 'system',
        content: `对话摘要: ${summary}`,
        metadata: { type: 'summary', generated: true },
      });
    }

    finalMessages.push(...trimmedMessages);

    const totalTokens = await this.estimateTokens(finalMessages);

    this.logger.log(
      `消息裁剪完成，最终消息数: ${finalMessages.length}，预估tokens: ${totalTokens}`,
    );

    return {
      messages: finalMessages,
      summary,
      totalTokens,
      trimmed: true,
    };
  }

  /**
   * 基于token数量裁剪消息
   */
  private async trimByTokens(
    messages: MessageContext[],
    maxTokens: number,
  ): Promise<MessageContext[]> {
    let currentTokens = 0;
    const result: MessageContext[] = [];

    // 从最新消息开始倒序处理
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const messageTokens = await this.estimateTokens([message]);

      if (currentTokens + messageTokens <= maxTokens) {
        result.unshift(message);
        currentTokens += messageTokens;
      } else {
        break;
      }
    }

    return result;
  }

  /**
   * 生成对话摘要
   */
  private async generateSummary(messages: MessageContext[]): Promise<string> {
    try {
      // 构建摘要提示
      const conversationText = messages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n');

      const summaryPrompt = `请对以下对话内容生成一个简洁的摘要，保留关键信息和上下文：

${conversationText}

摘要要求：
1. 保留重要的用户需求和问题
2. 保留已提供的解决方案或答案
3. 保留任何未完成的任务或待处理事项
4. 使用简洁明了的语言
5. 不超过200字

摘要：`;

      const summaryResponse = await this.ollamaService.chat(
        [{ role: 'system', content: '你是一个专业的对话摘要助手。' }],
        summaryPrompt,
      );

      return summaryResponse || '无法生成摘要';
    } catch (error) {
      this.logger.error(`生成摘要失败: ${error.message}`, error.stack);
      return '对话摘要生成失败';
    }
  }

  /**
   * 估算消息的token数量
   */
  private async estimateTokens(messages: MessageContext[]): Promise<number> {
    // 简单估算：平均每个字符约0.75个token（中文）
    const totalChars = messages.reduce((sum, msg) => {
      return sum + (msg.content?.length || 0) + (msg.role?.length || 0);
    }, 0);

    return Math.ceil(totalChars * 0.75);
  }

  /**
   * 获取会话的上下文窗口
   */
  async getSessionContext(
    sessionId: string,
    config: Partial<ContextConfig> = {},
  ): Promise<ContextWindow> {
    try {
      // 从数据库获取消息历史
      const messages = await this.databaseService.chatSessionMessage.findMany({
        where: { sessionId },
        orderBy: { timestamp: 'asc' },
        take: 200, // 最多取200条消息进行处理
      });

      const messageContexts: MessageContext[] = messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        metadata: msg.metadata,
      }));

      return await this.trimMessages(messageContexts, config);
    } catch (error) {
      this.logger.error(`获取会话上下文失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 保存会话摘要到数据库
   */
  async saveSessionSummary(sessionId: string, summary: string): Promise<void> {
    try {
      await this.databaseService.chatSession.update({
        where: { id: sessionId },
        data: {
          metadata: {
            summary,
            summaryGeneratedAt: new Date().toISOString(),
          },
        },
      });

      this.logger.log(`会话摘要已保存: ${sessionId}`);
    } catch (error) {
      this.logger.error(`保存会话摘要失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 检查是否需要上下文压缩
   */
  shouldCompressContext(
    messageCount: number,
    config: Partial<ContextConfig> = {},
  ): boolean {
    const finalConfig = { ...this.defaultConfig, ...config };
    return messageCount > finalConfig.summaryThreshold;
  }

  /**
   * 获取优化的消息历史用于LLM调用
   */
  async getOptimizedHistory(
    sessionId: string,
    includeSystemPrompt?: string,
    config: Partial<ContextConfig> = {},
  ): Promise<MessageContext[]> {
    const contextWindow = await this.getSessionContext(sessionId, config);

    const optimizedMessages = [...contextWindow.messages];

    // 如果提供了系统提示，添加到开头
    if (includeSystemPrompt) {
      const hasSystemMessage = optimizedMessages.some(
        (msg) => msg.role === 'system',
      );
      if (!hasSystemMessage) {
        optimizedMessages.unshift({
          role: 'system',
          content: includeSystemPrompt,
          metadata: { type: 'agent_prompt' },
        });
      }
    }

    // 确保消息序列符合LLM要求（以human消息结尾）
    const lastMessage = optimizedMessages[optimizedMessages.length - 1];
    if (
      lastMessage &&
      lastMessage.role !== 'user' &&
      lastMessage.role !== 'human'
    ) {
      // 添加一个占位符用户消息，这将在实际调用时被替换
      optimizedMessages.push({
        role: 'user',
        content: '[PLACEHOLDER_USER_MESSAGE]',
        metadata: { placeholder: true },
      });
    }

    this.logger.log(
      `优化消息历史完成，最终消息数: ${optimizedMessages.length}`,
    );

    return optimizedMessages;
  }

  /**
   * 清理旧的会话数据
   */
  async cleanupOldSessions(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const deletedSessions = await this.databaseService.chatSession.deleteMany(
        {
          where: {
            updatedAt: { lt: cutoffDate },
            status: 'ended',
          },
        },
      );

      this.logger.log(`清理了 ${deletedSessions.count} 个旧会话`);
    } catch (error) {
      this.logger.error(`清理旧会话失败: ${error.message}`, error.stack);
    }
  }

  /**
   * RAG检索相关上下文 - 使用PostgreSQL向量数据库
   */
  async retrieveRelevantContext(
    query: string,
    options: {
      sessionId: string;
      agentId: string;
      maxDocuments?: number;
      similarityThreshold?: number;
    },
  ): Promise<any[]> {
    try {
      const {
        sessionId,
        agentId,
        maxDocuments = 5,
        similarityThreshold = 0.7,
      } = options;

      this.logger.debug(
        `RAG检索查询: ${query}, 会话: ${sessionId}, 代理: ${agentId}`,
      );

      // 1. 生成查询向量
      const queryEmbedding = await this.generateEmbedding(query);
      if (!queryEmbedding) {
        this.logger.warn('Failed to generate query embedding');
        return [];
      }

      // 2. 从向量知识库检索相关文档
      const knowledgeResults = await this.searchVectorKnowledge(
        queryEmbedding,
        maxDocuments,
        similarityThreshold,
        agentId,
      );

      // 3. 从聊天历史中检索相关上下文
      const historyResults = await this.searchChatHistory(
        queryEmbedding,
        sessionId,
        Math.ceil(maxDocuments / 2),
        similarityThreshold,
      );

      // 4. 合并和排序结果
      const allResults = [...knowledgeResults, ...historyResults];

      // 按相似度排序并去重
      const sortedResults = allResults
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxDocuments);

      this.logger.debug(
        `RAG检索完成: 知识库${knowledgeResults.length}条, 历史${historyResults.length}条, 最终${sortedResults.length}条`,
      );

      return sortedResults;
    } catch (error) {
      this.logger.error(`RAG检索失败: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * 生成文本嵌入向量
   */
  private async generateEmbedding(text: string): Promise<number[] | null> {
    try {
      // 直接使用Ollama生成嵌入，暂时不使用缓存以避免类型问题
      const embedding = await this.ollamaService.generateEmbedding(text);

      if (embedding && embedding.length > 0) {
        this.logger.debug(
          `Generated embedding with ${embedding.length} dimensions`,
        );
        return embedding;
      }

      return null;
    } catch (error) {
      this.logger.error(`生成嵌入失败: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * 搜索向量知识库
   */
  private async searchVectorKnowledge(
    queryEmbedding: number[],
    limit: number,
    threshold: number,
    agentId: string,
  ): Promise<any[]> {
    try {
      const embeddingStr = this.formatEmbeddingVector(queryEmbedding);

      // 使用PostgreSQL的向量相似度搜索
      const results = await this.databaseService.$queryRaw`
        SELECT 
          id,
          title,
          content,
          namespace,
          tags,
          source,
          importance,
          1 - (embedding <=> ${embeddingStr}::vector) as similarity
        FROM "vector_knowledge"
        WHERE embedding IS NOT NULL
          AND 1 - (embedding <=> ${embeddingStr}::vector) > ${threshold}
        ORDER BY embedding <=> ${embeddingStr}::vector
        LIMIT ${limit}
      `;

      return (results as any[]).map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        similarity: parseFloat(row.similarity),
        source: 'knowledge_base',
        namespace: row.namespace,
        tags: row.tags,
        importance: row.importance,
      }));
    } catch (error) {
      this.logger.error(`向量知识库搜索失败: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * 搜索聊天历史
   */
  private async searchChatHistory(
    queryEmbedding: number[],
    sessionId: string,
    limit: number,
    threshold: number,
  ): Promise<any[]> {
    try {
      const embeddingStr = this.formatEmbeddingVector(queryEmbedding);

      // 搜索当前会话的历史消息
      const results = await this.databaseService.$queryRaw`
        SELECT 
          cm.id,
          cm.content,
          cm.sender,
          cm.timestamp,
          cm.groupName,
          1 - (cm.embedding <=> ${embeddingStr}::vector) as similarity
        FROM "chat_messages" cm
        WHERE cm.embedding IS NOT NULL
          AND 1 - (cm.embedding <=> ${embeddingStr}::vector) > ${threshold}
          AND cm."groupName" = ${sessionId}
        ORDER BY cm.embedding <=> ${embeddingStr}::vector
        LIMIT ${limit}
      `;

      return (results as any[]).map((row) => ({
        id: row.id,
        content: row.content,
        similarity: parseFloat(row.similarity),
        source: 'chat_history',
        sender: row.sender,
        timestamp: row.timestamp,
        groupName: row.groupName,
      }));
    } catch (error) {
      this.logger.error(`聊天历史搜索失败: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * 内容哈希
   */
  private hashContent(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * 格式化嵌入向量为PostgreSQL向量格式
   */
  private formatEmbeddingVector(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
  }

  /**
   * 解析PostgreSQL向量为数组
   */
  private parseEmbeddingVector(vectorStr: any): number[] {
    if (typeof vectorStr === 'string') {
      // 移除方括号并分割
      return vectorStr
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map(Number);
    }
    return vectorStr;
  }

  /**
   * 估算token数量
   */
  private estimateTokenCount(text: string): number {
    // 简单估算：中文按字符数，英文按单词数 * 1.3
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = text
      .replace(/[\u4e00-\u9fa5]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    return Math.ceil(chineseChars + englishWords * 1.3);
  }
}
