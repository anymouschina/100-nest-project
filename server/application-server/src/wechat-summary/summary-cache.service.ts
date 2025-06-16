import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { VectorService } from './vector.service';
import * as crypto from 'crypto';

export interface SummaryRequest {
  groupName: string;
  timeRange: string;
  summaryType: string;
  specificDate?: string;
  relativeTime?: string;
}

export interface CachedSummaryResult {
  id: string;
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
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SummaryCacheService {
  private readonly logger = new Logger(SummaryCacheService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly vectorService: VectorService,
  ) {}

  /**
   * 检查是否应该缓存分析结果
   * 规则：今天的不缓存，昨天及以前的缓存
   */
  shouldCacheResult(request: SummaryRequest): boolean {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 如果指定了具体日期
      if (request.specificDate) {
        const targetDate = new Date(request.specificDate);
        targetDate.setHours(0, 0, 0, 0);
        return targetDate < today; // 只有过去的日期才缓存
      }

      // 如果使用相对时间
      if (request.relativeTime) {
        switch (request.relativeTime) {
          case 'today':
            return false; // 今天不缓存
          case 'yesterday':
          case 'thisWeek':
          case 'lastWeek':
          case 'thisMonth':
          case 'lastMonth':
          case 'thisQuarter':
          case 'lastQuarter':
            return true; // 其他时间范围都缓存
          default:
            return false;
        }
      }

      return false;
    } catch (error) {
      this.logger.warn(`判断缓存策略失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 生成缓存键
   */
  generateCacheKey(request: SummaryRequest): string {
    const keyData = {
      groupName: request.groupName,
      timeRange: request.timeRange,
      summaryType: request.summaryType,
      specificDate: request.specificDate,
      relativeTime: request.relativeTime,
    };
    return crypto.createHash('md5').update(JSON.stringify(keyData)).digest('hex');
  }

  /**
   * 检查缓存中是否存在分析结果
   */
  async getCachedSummary(request: SummaryRequest): Promise<CachedSummaryResult | null> {
    try {
      if (!this.shouldCacheResult(request)) {
        return null; // 不应该缓存的请求直接返回null
      }

      const cacheKey = this.generateCacheKey(request);
      this.logger.log(`查找缓存结果: ${cacheKey}`);

      const cachedResult = await this.databaseService.chatSummary.findFirst({
        where: {
          groupName: request.groupName,
          summaryType: request.summaryType,
          timeRange: request.timeRange,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      if (cachedResult) {
        this.logger.log(`找到缓存结果: ${cachedResult.id}`);
        return {
          id: cachedResult.id,
          groupName: cachedResult.groupName,
          summaryType: cachedResult.summaryType,
          timeRange: cachedResult.timeRange,
          title: cachedResult.title,
          content: cachedResult.content,
          keyPoints: cachedResult.keyPoints,
          participants: cachedResult.participants,
          topics: cachedResult.topics,
          messageCount: cachedResult.messageCount,
          startTime: cachedResult.startTime,
          endTime: cachedResult.endTime,
          metadata: cachedResult.metadata,
          createdAt: cachedResult.createdAt,
          updatedAt: cachedResult.updatedAt,
        };
      }

      return null;
    } catch (error) {
      this.logger.error(`获取缓存结果失败: ${error.message}`, error.stack);
      return null;
    }
  }

  /**
   * 保存分析结果到缓存
   */
  async saveSummaryToCache(
    request: SummaryRequest,
    summaryResult: any,
    messageCount: number,
  ): Promise<void> {
    try {
      if (!this.shouldCacheResult(request)) {
        this.logger.log('当前请求不需要缓存，跳过保存');
        return;
      }

      this.logger.log(`保存分析结果到缓存: ${request.groupName} - ${request.timeRange}`);

      // 解析时间范围
      const { startTime, endTime } = this.parseTimeRange(request);

      // 提取分析结果的关键信息
      const title = this.extractTitle(summaryResult);
      const content = this.extractContent(summaryResult);
      const keyPoints = this.extractKeyPoints(summaryResult);
      const participants = this.extractParticipants(summaryResult);
      const topics = this.extractTopics(summaryResult);

      // 生成向量嵌入
      let embedding = null;
      try {
        embedding = await this.vectorService.generateEmbedding(content);
      } catch (embeddingError) {
        this.logger.warn(`生成向量嵌入失败: ${embeddingError.message}`);
      }

      // 保存到数据库
      const savedSummary = await this.databaseService.chatSummary.create({
        data: {
          groupName: request.groupName,
          summaryType: request.summaryType,
          timeRange: request.timeRange,
          title,
          content,
          keyPoints,
          participants,
          topics,
          messageCount,
          startTime,
          endTime,
          metadata: JSON.stringify({
            request,
            summaryResult,
            cacheKey: this.generateCacheKey(request),
            cachedAt: new Date().toISOString(),
            embedding: embedding ? embedding.join(',') : null,
          }),
        },
      });

      this.logger.log(`分析结果已保存到缓存: ${savedSummary.id}`);

      // 同时保存到向量知识库
      await this.saveToVectorKnowledge(savedSummary, summaryResult);

    } catch (error) {
      this.logger.error(`保存分析结果到缓存失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 保存到向量知识库
   */
  private async saveToVectorKnowledge(
    summary: any,
    summaryResult: any,
  ): Promise<void> {
    try {
      // 保存摘要到知识库
      await this.vectorService.storeKnowledge({
        namespace: 'summaries',
        title: summary.title,
        content: summary.content,
        tags: [
          summary.groupName,
          summary.summaryType,
          ...summary.topics,
        ],
        source: 'chat_summary',
        sourceId: summary.id,
        importance: this.calculateImportance(summaryResult),
        metadata: {
          groupName: summary.groupName,
          timeRange: summary.timeRange,
          messageCount: summary.messageCount,
          participants: summary.participants,
        },
      });

      // 保存关键话题到知识库
      if (summaryResult.topics && Array.isArray(summaryResult.topics)) {
        for (const topic of summaryResult.topics) {
          if (topic.title && topic.process) {
            await this.vectorService.storeKnowledge({
              namespace: 'topics',
              title: topic.title,
              content: topic.process,
              tags: [
                summary.groupName,
                'topic',
                ...topic.participants || [],
              ],
              source: 'chat_topic',
              sourceId: `${summary.id}_topic_${topic.title}`,
              importance: this.calculateTopicImportance(topic),
              metadata: {
                groupName: summary.groupName,
                timeRange: topic.time_range || summary.timeRange,
                participants: topic.participants,
              },
            });
          }
        }
      }

      this.logger.log(`向量知识库更新完成: ${summary.id}`);
    } catch (error) {
      this.logger.error(`保存到向量知识库失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 解析时间范围
   */
  private parseTimeRange(request: SummaryRequest): { startTime: Date; endTime: Date } {
    const now = new Date();
    let startTime = new Date(now);
    let endTime = new Date(now);

    if (request.specificDate) {
      startTime = new Date(request.specificDate);
      endTime = new Date(request.specificDate);
      endTime.setHours(23, 59, 59, 999);
    } else if (request.relativeTime) {
      switch (request.relativeTime) {
        case 'yesterday':
          startTime.setDate(startTime.getDate() - 1);
          endTime.setDate(endTime.getDate() - 1);
          startTime.setHours(0, 0, 0, 0);
          endTime.setHours(23, 59, 59, 999);
          break;
        case 'thisWeek':
          const dayOfWeek = startTime.getDay();
          const diff = startTime.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
          startTime.setDate(diff);
          startTime.setHours(0, 0, 0, 0);
          endTime.setHours(23, 59, 59, 999);
          break;
        case 'lastWeek':
          const lastWeekStart = new Date(startTime);
          lastWeekStart.setDate(lastWeekStart.getDate() - 7);
          const dayOfLastWeek = lastWeekStart.getDay();
          const lastWeekDiff = lastWeekStart.getDate() - dayOfLastWeek + (dayOfLastWeek === 0 ? -6 : 1);
          startTime.setDate(lastWeekDiff);
          endTime.setDate(lastWeekDiff + 6);
          startTime.setHours(0, 0, 0, 0);
          endTime.setHours(23, 59, 59, 999);
          break;
        // 可以继续添加其他时间范围的解析
      }
    }

    return { startTime, endTime };
  }

  /**
   * 提取分析结果的标题
   */
  private extractTitle(summaryResult: any): string {
    return summaryResult.summary_title || 
           summaryResult.title || 
           summaryResult.summary?.substring(0, 100) || 
           '聊天记录分析';
  }

  /**
   * 提取分析结果的内容
   */
  private extractContent(summaryResult: any): string {
    if (typeof summaryResult === 'string') {
      return summaryResult;
    }
    
    return JSON.stringify(summaryResult, null, 2);
  }

  /**
   * 提取关键点
   */
  private extractKeyPoints(summaryResult: any): string[] {
    if (summaryResult.keyPoints && Array.isArray(summaryResult.keyPoints)) {
      return summaryResult.keyPoints;
    }
    
    if (summaryResult.topics && Array.isArray(summaryResult.topics)) {
      return summaryResult.topics.map((topic: any) => topic.title || topic).slice(0, 10);
    }
    
    return [];
  }

  /**
   * 提取参与者
   */
  private extractParticipants(summaryResult: any): string[] {
    if (summaryResult.top_speakers && Array.isArray(summaryResult.top_speakers)) {
      return summaryResult.top_speakers;
    }
    
    if (summaryResult.participants && Array.isArray(summaryResult.participants)) {
      return summaryResult.participants;
    }
    
    return [];
  }

  /**
   * 提取话题标签
   */
  private extractTopics(summaryResult: any): string[] {
    const topics = [];
    
    if (summaryResult.extra_topics && Array.isArray(summaryResult.extra_topics)) {
      topics.push(...summaryResult.extra_topics);
    }
    
    if (summaryResult.topics && Array.isArray(summaryResult.topics)) {
      topics.push(...summaryResult.topics.map((topic: any) => topic.title || topic));
    }
    
    return [...new Set(topics)].slice(0, 20); // 去重并限制数量
  }

  /**
   * 计算重要性评分
   */
  private calculateImportance(summaryResult: any): number {
    let importance = 1.0;
    
    // 根据消息数量调整重要性
    if (summaryResult.message_length) {
      importance += Math.min(summaryResult.message_length / 100, 2.0);
    }
    
    // 根据话题数量调整重要性
    if (summaryResult.topics && Array.isArray(summaryResult.topics)) {
      importance += summaryResult.topics.length * 0.2;
    }
    
    // 根据参与者数量调整重要性
    if (summaryResult.top_speakers && Array.isArray(summaryResult.top_speakers)) {
      importance += summaryResult.top_speakers.length * 0.1;
    }
    
    return Math.min(importance, 10.0); // 最大重要性为10
  }

  /**
   * 计算话题重要性
   */
  private calculateTopicImportance(topic: any): number {
    let importance = 1.0;
    
    // 根据参与者数量
    if (topic.participants && Array.isArray(topic.participants)) {
      importance += topic.participants.length * 0.3;
    }
    
    // 根据内容长度
    if (topic.process) {
      importance += Math.min(topic.process.length / 200, 2.0);
    }
    
    // 根据热度标识
    if (topic.title && topic.title.includes('🔥')) {
      const fireCount = (topic.title.match(/🔥/g) || []).length;
      importance += fireCount * 0.5;
    }
    
    return Math.min(importance, 10.0);
  }

  /**
   * 获取缓存统计信息
   */
  async getCacheStats(): Promise<{
    totalCached: number;
    byGroup: { [groupName: string]: number };
    byType: { [summaryType: string]: number };
    recentCached: number;
  }> {
    try {
      const totalCached = await this.databaseService.chatSummary.count();
      
      const byGroup = await this.databaseService.chatSummary.groupBy({
        by: ['groupName'],
        _count: true,
      });
      
      const byType = await this.databaseService.chatSummary.groupBy({
        by: ['summaryType'],
        _count: true,
      });
      
      const recentCached = await this.databaseService.chatSummary.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 最近7天
          },
        },
      });
      
      return {
        totalCached,
        byGroup: Object.fromEntries(byGroup.map(g => [g.groupName, g._count])),
        byType: Object.fromEntries(byType.map(t => [t.summaryType, t._count])),
        recentCached,
      };
    } catch (error) {
      this.logger.error(`获取缓存统计失败: ${error.message}`, error.stack);
      return {
        totalCached: 0,
        byGroup: {},
        byType: {},
        recentCached: 0,
      };
    }
  }

  /**
   * 清理过期缓存
   */
  async cleanExpiredCache(daysToKeep: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
      
      const result = await this.databaseService.chatSummary.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });
      
      this.logger.log(`清理了 ${result.count} 个过期缓存记录`);
      return result.count;
    } catch (error) {
      this.logger.error(`清理过期缓存失败: ${error.message}`, error.stack);
      return 0;
    }
  }
} 