import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import * as crypto from 'crypto';
import { Pool } from 'pg';

export interface VectorSearchResult {
  id: string;
  content: string;
  similarity: number;
  metadata: any;
  source?: string;
}

export interface EmbeddingRequest {
  content: string;
  metadata?: any;
  namespace?: string;
  tags?: string[];
}

export interface ContextWindow {
  content: string;
  messages: Array<{
    sender: string;
    time: string;
    content: string;
  }>;
  relevanceScore: number;
  tokenCount: number;
}

@Injectable()
export class VectorService {
  private readonly logger = new Logger(VectorService.name);
  private readonly textSplitter: RecursiveCharacterTextSplitter;
  private readonly pgPool: Pool;

  // 配置参数
  private readonly EMBEDDING_DIMENSION = 1536; // OpenAI text-embedding-3-small
  private readonly CHUNK_SIZE = 1000;
  private readonly CHUNK_OVERLAP = 200;
  private readonly SIMILARITY_THRESHOLD = 0.7;
  private readonly MAX_CONTEXT_TOKENS = 8000;

  constructor(private readonly databaseService: DatabaseService) {
    // 初始化文本分割器
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.CHUNK_SIZE,
      chunkOverlap: this.CHUNK_OVERLAP,
      separators: ['\n\n', '\n', '。', '！', '？', '；', '，', ' ', ''],
    });

    // 初始化PostgreSQL连接池
    this.pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    this.initializeVectorStore();
  }

  /**
   * 初始化向量存储
   */
  private async initializeVectorStore() {
    try {
      // 确保pgvector扩展已启用
      await this.pgPool.query('CREATE EXTENSION IF NOT EXISTS vector');
      this.logger.log('✅ 向量存储初始化完成');
    } catch (error) {
      this.logger.error(`向量存储初始化失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 生成内容的向量嵌入
   */
  async generateEmbedding(content: string): Promise<number[]> {
    try {
      // 检查缓存
      const contentHash = this.generateContentHash(content);
      const cached = await this.getCachedEmbedding(contentHash);
      
      if (cached) {
        await this.updateEmbeddingCache(contentHash);
        return this.parseEmbeddingString(cached.embedding);
      }

      // TODO: 使用OpenAI API生成嵌入
      // 这里需要直接调用OpenAI API而不是使用LangChain
      const embedding = await this.callOpenAIEmbedding(content);
      
      // 缓存结果
      await this.cacheEmbedding(contentHash, content, embedding);
      
      return embedding;
    } catch (error) {
      this.logger.error(`生成嵌入失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 调用OpenAI API生成嵌入
   */
  private async callOpenAIEmbedding(content: string): Promise<number[]> {
    // 这里使用OpenAI API直接调用
    // 临时返回一个空数组，需要实现实际的API调用
    return new Array(1536).fill(0);
  }

  /**
   * 解析嵌入字符串为数组
   */
  private parseEmbeddingString(embeddingStr: string): number[] {
    if (!embeddingStr) return [];
    try {
      const cleanedStr = embeddingStr.replace(/^\[|\]$/g, '');
      const parts = cleanedStr.split(',');
      return parts.map(n => parseFloat(n.trim()));
    } catch (e) {
      this.logger.error(`解析嵌入字符串失败: ${e.message}`);
      return [];
    }
  }

  /**
   * 批量生成嵌入
   */
  async generateBatchEmbeddings(contents: string[]): Promise<number[][]> {
    try {
      const embeddings: number[][] = [];
      
      for (const content of contents) {
        embeddings.push(await this.generateEmbedding(content));
      }
      
      return embeddings;
    } catch (error) {
      this.logger.error(`批量生成嵌入失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 存储聊天消息到向量数据库
   */
  async storeChatMessage(message: {
    groupName: string;
    sender: string;
    content: string;
    timestamp: Date;
    metadata?: any;
  }): Promise<string> {
    try {
      const messageHash = this.generateContentHash(`${message.sender}:${message.content}:${message.timestamp.toISOString()}`);
      
      // 检查是否已存在
      const existing = await this.databaseService.chatMessage.findUnique({
        where: { messageHash }
      });
      
      if (existing) {
        return existing.id;
      }

      // 生成嵌入
      const embedding = await this.generateEmbedding(message.content);
      
      // 存储消息
      const chatMessage = await this.databaseService.chatMessage.create({
        data: {
          groupName: message.groupName,
          sender: message.sender,
          content: message.content,
          timestamp: message.timestamp,
          messageHash,
          metadata: message.metadata || {},
        }
      });

      // 如果消息较长，进行分块处理
      if (message.content.length > this.CHUNK_SIZE) {
        await this.createMessageChunks(chatMessage.id, message.content);
      }

      this.logger.log(`✅ 消息已存储到向量数据库: ${chatMessage.id}`);
      return chatMessage.id;
    } catch (error) {
      this.logger.error(`存储聊天消息失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 批量存储聊天消息
   */
  async storeBatchChatMessages(messages: Array<{
    groupName: string;
    sender: string;
    content: string;
    timestamp: Date;
    metadata?: any;
  }>): Promise<string[]> {
    try {
      this.logger.log(`开始批量存储 ${messages.length} 条消息`);
      
      const results: string[] = [];
      const batchSize = 50; // 批处理大小
      
      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(message => this.storeChatMessage(message))
        );
        results.push(...batchResults);
        
        this.logger.log(`批量存储进度: ${Math.min(i + batchSize, messages.length)}/${messages.length}`);
      }
      
      this.logger.log(`✅ 批量存储完成: ${results.length} 条消息`);
      return results;
    } catch (error) {
      this.logger.error(`批量存储失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 语义搜索相关消息
   */
  async semanticSearch(
    query: string,
    options: {
      groupName?: string;
      namespace?: string;
      limit?: number;
      threshold?: number;
      timeRange?: { start: Date; end: Date };
    } = {}
  ): Promise<VectorSearchResult[]> {
    try {
      const {
        groupName,
        namespace = 'chat_history',
        limit = 10,
        threshold = this.SIMILARITY_THRESHOLD,
        timeRange
      } = options;

      // 生成查询向量
      const queryEmbedding = await this.generateEmbedding(query);
      
      // 构建SQL查询
      let sql = `
        SELECT 
          id,
          content,
          metadata,
          group_name,
          sender,
          timestamp,
          1 - (embedding <=> $1::vector) as similarity
        FROM chat_messages
        WHERE 1 - (embedding <=> $1::vector) > $2
      `;
      
      const params: any[] = [`[${queryEmbedding.join(',')}]`, threshold];
      let paramIndex = 2;
      
      if (groupName) {
        sql += ` AND group_name = $${++paramIndex}`;
        params.push(groupName);
      }
      
      if (timeRange) {
        sql += ` AND timestamp BETWEEN $${++paramIndex} AND $${++paramIndex}`;
        params.push(timeRange.start, timeRange.end);
      }
      
      sql += ` ORDER BY similarity DESC LIMIT $${++paramIndex}`;
      params.push(limit);

      const result = await this.pgPool.query(sql, params);
      
      return result.rows.map(row => ({
        id: row.id,
        content: row.content,
        similarity: row.similarity,
        metadata: {
          ...row.metadata,
          groupName: row.group_name,
          sender: row.sender,
          timestamp: row.timestamp,
        }
      }));
    } catch (error) {
      this.logger.error(`语义搜索失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 构建无限上下文窗口
   */
  async buildInfiniteContext(
    query: string,
    groupName: string,
    options: {
      maxTokens?: number;
      windowType?: 'sliding' | 'semantic' | 'hybrid';
      timeRange?: { start: Date; end: Date };
    } = {}
  ): Promise<ContextWindow> {
    try {
      const {
        maxTokens = this.MAX_CONTEXT_TOKENS,
        windowType = 'hybrid',
        timeRange
      } = options;

      this.logger.log(`构建无限上下文窗口: ${windowType}, 最大tokens: ${maxTokens}`);

      let contextMessages: Array<{
        sender: string;
        time: string;
        content: string;
        relevance?: number;
      }> = [];

      switch (windowType) {
        case 'semantic':
          contextMessages = await this.buildSemanticContext(query, groupName, maxTokens, timeRange);
          break;
        case 'sliding':
          contextMessages = await this.buildSlidingContext(groupName, maxTokens, timeRange);
          break;
        case 'hybrid':
        default:
          contextMessages = await this.buildHybridContext(query, groupName, maxTokens, timeRange);
          break;
      }

      // 计算上下文内容和token数量
      const content = contextMessages
        .map(msg => `${msg.time} ${msg.sender}: ${msg.content}`)
        .join('\n');
      
      const tokenCount = this.estimateTokenCount(content);
      const relevanceScore = this.calculateContextRelevance(contextMessages, query);

      return {
        content,
        messages: contextMessages.map(msg => ({
          sender: msg.sender,
          time: msg.time,
          content: msg.content
        })),
        relevanceScore,
        tokenCount
      };
    } catch (error) {
      this.logger.error(`构建无限上下文失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 构建语义上下文
   */
  private async buildSemanticContext(
    query: string,
    groupName: string,
    maxTokens: number,
    timeRange?: { start: Date; end: Date }
  ): Promise<Array<{
    sender: string;
    time: string;
    content: string;
    relevance: number;
  }>> {
    // 语义搜索相关消息
    const searchResults = await this.semanticSearch(query, {
      groupName,
      limit: 100,
      timeRange
    });

    const messages = [];
    let currentTokens = 0;

    for (const result of searchResults) {
      const messageTokens = this.estimateTokenCount(result.content);
      if (currentTokens + messageTokens > maxTokens) break;

      messages.push({
        sender: result.metadata.sender,
        time: result.metadata.timestamp.toISOString(),
        content: result.content,
        relevance: result.similarity
      });

      currentTokens += messageTokens;
    }

    return messages.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }

  /**
   * 构建滑动窗口上下文
   */
  private async buildSlidingContext(
    groupName: string,
    maxTokens: number,
    timeRange?: { start: Date; end: Date }
  ): Promise<Array<{
    sender: string;
    time: string;
    content: string;
    relevance: number;
  }>> {
    // 获取最近的消息
    const whereClause: any = { groupName };
    if (timeRange) {
      whereClause.timestamp = {
        gte: timeRange.start,
        lte: timeRange.end
      };
    }

    const recentMessages = await this.databaseService.chatMessage.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      take: 200
    });

    const messages = [];
    let currentTokens = 0;

    for (const message of recentMessages.reverse()) {
      const messageTokens = this.estimateTokenCount(message.content);
      if (currentTokens + messageTokens > maxTokens) break;

      messages.push({
        sender: message.sender,
        time: message.timestamp.toISOString(),
        content: message.content,
        relevance: 1.0 // 滑动窗口中所有消息权重相等
      });

      currentTokens += messageTokens;
    }

    return messages;
  }

  /**
   * 构建混合上下文（语义 + 时间）
   */
  private async buildHybridContext(
    query: string,
    groupName: string,
    maxTokens: number,
    timeRange?: { start: Date; end: Date }
  ): Promise<Array<{
    sender: string;
    time: string;
    content: string;
    relevance: number;
  }>> {
    // 50% token用于语义相关内容
    const semanticTokens = Math.floor(maxTokens * 0.5);
    const slidingTokens = maxTokens - semanticTokens;

    // 获取语义相关消息
    const semanticMessages = await this.buildSemanticContext(query, groupName, semanticTokens, timeRange);
    
    // 获取最近消息（排除已包含的语义消息）
    const semanticIds = new Set(semanticMessages.map(msg => 
      this.generateContentHash(`${msg.sender}:${msg.content}:${msg.time}`)
    ));

    const recentMessages = await this.buildSlidingContext(groupName, slidingTokens + semanticTokens, timeRange);
    const filteredRecentMessages = recentMessages.filter(msg => 
      !semanticIds.has(this.generateContentHash(`${msg.sender}:${msg.content}:${msg.time}`))
    );

    // 合并并按时间排序
    const allMessages = [...semanticMessages, ...filteredRecentMessages.slice(0, Math.floor(slidingTokens / 50))];
    return allMessages.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }

  /**
   * 存储摘要到向量数据库
   */
  async storeSummary(summary: {
    groupName: string;
    summaryType: string;
    timeRange: string;
    title: string;
    content: string;
    keyPoints: string[];
    participants: string[];
    topics: string[];
    messageCount: number;
    startTime: Date;
    endTime: Date;
    metadata?: any;
  }): Promise<string> {
    try {
      // 生成嵌入
      const embedding = await this.generateEmbedding(summary.content);
      
      // 存储摘要
      const chatSummary = await this.databaseService.chatSummary.create({
        data: {
          groupName: summary.groupName,
          summaryType: summary.summaryType,
          timeRange: summary.timeRange,
          title: summary.title,
          content: summary.content,
          keyPoints: summary.keyPoints,
          participants: summary.participants,
          topics: summary.topics,
          messageCount: summary.messageCount,
          startTime: summary.startTime,
          endTime: summary.endTime,
          metadata: JSON.stringify({
            ...summary.metadata,
            embedding: embedding.join(','),
          }),
        }
      });

      this.logger.log(`✅ 摘要已存储到向量数据库: ${chatSummary.id}`);
      return chatSummary.id;
    } catch (error) {
      this.logger.error(`存储摘要失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 存储知识到向量数据库
   */
  async storeKnowledge(knowledge: {
    namespace: string;
    title: string;
    content: string;
    tags?: string[];
    source?: string;
    sourceId?: string;
    importance?: number;
    metadata?: any;
  }): Promise<string> {
    try {
      // 生成嵌入
      const embedding = await this.generateEmbedding(knowledge.content);
      
      // 存储知识
      const vectorKnowledge = await this.databaseService.vectorKnowledge.create({
        data: {
          namespace: knowledge.namespace,
          title: knowledge.title,
          content: knowledge.content,
          tags: knowledge.tags || [],
          source: knowledge.source,
          sourceId: knowledge.sourceId,
          importance: knowledge.importance || 1.0,
          metadata: JSON.stringify({
            ...knowledge.metadata,
            embedding: embedding.join(','),
          }),
        }
      });

      this.logger.log(`✅ 知识已存储到向量数据库: ${vectorKnowledge.id}`);
      return vectorKnowledge.id;
    } catch (error) {
      this.logger.error(`存储知识失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 搜索向量知识库
   */
  async searchKnowledge(
    query: string,
    options: {
      namespace?: string;
      tags?: string[];
      limit?: number;
      threshold?: number;
    } = {}
  ): Promise<VectorSearchResult[]> {
    try {
      const {
        namespace,
        tags,
        limit = 10,
        threshold = this.SIMILARITY_THRESHOLD
      } = options;

      const queryEmbedding = await this.generateEmbedding(query);
      
      let sql = `
        SELECT 
          id,
          title,
          content,
          tags,
          source,
          source_id,
          importance,
          metadata,
          1 - (embedding <=> $1::vector) as similarity
        FROM vector_knowledge
        WHERE 1 - (embedding <=> $1::vector) > $2
      `;
      
      const params: any[] = [`[${queryEmbedding.join(',')}]`, threshold];
      let paramIndex = 2;
      
      if (namespace) {
        sql += ` AND namespace = $${++paramIndex}`;
        params.push(namespace);
      }
      
      if (tags && tags.length > 0) {
        sql += ` AND tags && $${++paramIndex}`;
        params.push(tags);
      }
      
      sql += ` ORDER BY similarity DESC, importance DESC LIMIT $${++paramIndex}`;
      params.push(limit);

      const result = await this.pgPool.query(sql, params);
      
      // 更新访问统计
      const ids = result.rows.map(row => row.id);
      if (ids.length > 0) {
        await this.updateKnowledgeAccess(ids);
      }
      
      return result.rows.map(row => ({
        id: row.id,
        content: row.content,
        similarity: row.similarity,
        metadata: {
          ...row.metadata,
          title: row.title,
          tags: row.tags,
          source: row.source,
          sourceId: row.source_id,
          importance: row.importance
        }
      }));
    } catch (error) {
      this.logger.error(`搜索知识库失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  // 私有辅助方法

  private generateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * 从缓存获取嵌入
   */
  private async getCachedEmbedding(contentHash: string): Promise<{ embedding: string } | null> {
    try {
      const cached = await this.databaseService.embeddingCache.findUnique({
        where: { contentHash }
      });
      
      if (cached) {
        return {
          embedding: cached.content // 临时使用 content 字段代替 embedding
        };
      }
      
      return null;
    } catch (error) {
      this.logger.error(`获取缓存嵌入失败: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * 缓存嵌入
   */
  private async cacheEmbedding(contentHash: string, content: string, embedding: number[]): Promise<void> {
    try {
      // 检查是否已存在缓存
      const existingCache = await this.databaseService.embeddingCache.findUnique({
        where: { contentHash }
      });

      if (existingCache) {
        // 更新现有缓存
        await this.databaseService.embeddingCache.update({
          where: { contentHash },
          data: {
            lastUsed: new Date(),
            useCount: { increment: 1 }
          }
        });
      } else {
        // 创建新缓存 - 使用 Prisma 的 $executeRaw 方法直接执行 SQL
        await this.databaseService.$executeRaw`
          INSERT INTO embedding_cache (
            id, content_hash, content, model, token_count, embedding, created_at, last_used, use_count
          ) VALUES (
            ${crypto.randomUUID()}, 
            ${contentHash}, 
            ${content}, 
            'text-embedding-3-small', 
            ${this.estimateTokenCount(content)}, 
            ${`[${embedding.join(',')}]`}::vector, 
            NOW(), 
            NOW(), 
            1
          )
        `;
      }
    } catch (error) {
      this.logger.error(`缓存嵌入失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 更新嵌入缓存使用计数
   */
  private async updateEmbeddingCache(contentHash: string): Promise<void> {
    try {
      await this.databaseService.embeddingCache.update({
        where: { contentHash },
        data: {
          lastUsed: new Date(),
          useCount: { increment: 1 }
        }
      });
    } catch (error) {
      this.logger.warn(`更新嵌入缓存失败: ${error.message}`);
    }
  }

  private async createMessageChunks(messageId: string, content: string): Promise<void> {
    try {
      const chunks = await this.textSplitter.splitText(content);
      const chunkEmbeddings = await this.generateBatchEmbeddings(chunks);

      const chunkData = chunks.map((chunk, index) => ({
        messageId,
        chunkIndex: index,
        content: chunk,
        embedding: `[${chunkEmbeddings[index].join(',')}]`,
        tokenCount: this.estimateTokenCount(chunk),
        metadata: {}
      }));

      await this.databaseService.messageChunk.createMany({
        data: chunkData
      });
    } catch (error) {
      this.logger.error(`创建消息块失败: ${error.message}`, error.stack);
    }
  }

  private estimateTokenCount(text: string): number {
    // 简单的token估算，中文约1.5字符/token，英文约4字符/token
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars / 1.5 + otherChars / 4);
  }

  private calculateContextRelevance(
    messages: Array<{ relevance?: number }>,
    query: string
  ): number {
    if (messages.length === 0) return 0;
    
    const totalRelevance = messages.reduce((sum, msg) => sum + (msg.relevance || 1), 0);
    return totalRelevance / messages.length;
  }

  private calculateSummaryImportance(summary: {
    messageCount: number;
    keyPoints: string[];
    participants: string[];
    topics: string[];
  }): number {
    let importance = 1.0;
    
    // 基于消息数量
    importance += Math.log10(summary.messageCount) * 0.2;
    
    // 基于关键点数量
    importance += summary.keyPoints.length * 0.1;
    
    // 基于参与者数量
    importance += summary.participants.length * 0.05;
    
    // 基于主题数量
    importance += summary.topics.length * 0.05;
    
    return Math.min(importance, 5.0); // 最大重要性为5.0
  }

  private async updateKnowledgeAccess(ids: string[]): Promise<void> {
    try {
      await this.databaseService.vectorKnowledge.updateMany({
        where: { id: { in: ids } },
        data: {
          accessCount: { increment: 1 },
          lastAccessed: new Date()
        }
      });
    } catch (error) {
      this.logger.warn(`更新知识访问统计失败: ${error.message}`);
    }
  }
} 