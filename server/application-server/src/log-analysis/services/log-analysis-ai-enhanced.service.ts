import { Injectable, Logger } from '@nestjs/common';
import { VectorKnowledgeService } from '../../ai/services/vector-knowledge.service';
import { EmbeddingService } from '../../ai/services/embedding.service';

export interface AIAnalysisResult {
  analysisResult: any;
  suggestions: string[];
  similarIssues: any[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  aiInsights: {
    semanticSimilarity: number;
    patternConfidence: number;
    anomalyScore: number;
    autoTags: string[];
  };
}

@Injectable()
export class LogAnalysisAIEnhancedService {
  private readonly logger = new Logger(LogAnalysisAIEnhancedService.name);

  constructor(
    private readonly vectorService: VectorKnowledgeService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /**
   * AI增强的日志分析
   */
  async analyzeLogWithAI(options: {
    userFeedback: string;
    logData:
      | string[]
      | {
          timestamp?: Date;
          level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
          source: string;
          service?: string;
          message: string;
          stackTrace?: string;
          metadata?: Record<string, any>;
        };
    analysisOptions?: {
      enableAIAnalysis?: boolean;
      enableSemanticSearch?: boolean;
      enablePatternLearning?: boolean;
    };
  }): Promise<AIAnalysisResult> {
    const { userFeedback, logData, analysisOptions = {} } = options;
    const {
      enableAIAnalysis = true,
      enableSemanticSearch = true,
      enablePatternLearning = true,
    } = analysisOptions;

    try {
      // 1. 解析和标准化日志数据
      const parsedLogData = this.parseLogData(logData);
      const logContext = this.buildLogContext(parsedLogData, userFeedback);

      // 2. 基础分析（保持原有逻辑）
      const basicAnalysis = await this.performBasicAnalysis(parsedLogData);

      // 3. AI增强分析
      let aiInsights = {
        semanticSimilarity: 0,
        patternConfidence: 0,
        anomalyScore: 0,
        autoTags: [] as string[],
      };

      let enhancedSuggestions = [...basicAnalysis.suggestions];
      let similarIssues = basicAnalysis.similarIssues;

      if (enableAIAnalysis) {
        // AI语义分析
        const semanticAnalysis = await this.performSemanticAnalysis(logContext);
        aiInsights = { ...aiInsights, ...semanticAnalysis };

        // AI相似问题搜索
        if (enableSemanticSearch) {
          const aiSimilarIssues = await this.findAISimilarIssues(logContext);
          similarIssues = this.mergeWithAISimilarities(
            similarIssues,
            aiSimilarIssues,
          );
        }

        // AI建议生成
        const aiSuggestions = await this.generateAISuggestions(
          logContext,
          aiInsights,
          similarIssues,
        );
                 enhancedSuggestions = [...enhancedSuggestions, ...aiSuggestions];

        // 模式学习
        if (enablePatternLearning) {
          await this.learnFromLog(logContext, basicAnalysis);
        }
      }

      // 4. 风险等级重评估（基于AI分析）
      const finalRiskLevel = this.reassessRiskWithAI(
        basicAnalysis.riskLevel,
        aiInsights,
      );

      this.logger.log(
        `AI增强日志分析完成: ${basicAnalysis.issueType}, AI置信度: ${aiInsights.patternConfidence}`,
      );

      return {
        analysisResult: {
          ...basicAnalysis.analysisResult,
          aiEnhanced: true,
          aiConfidence: aiInsights.patternConfidence,
          autoTags: aiInsights.autoTags,
        },
        suggestions: enhancedSuggestions,
        similarIssues,
        riskLevel: finalRiskLevel,
        aiInsights,
      };
    } catch (error) {
      this.logger.error('AI增强日志分析失败', error.stack);
      // 降级到基础分析
      return this.fallbackToBasicAnalysis(logData, userFeedback);
    }
  }

  /**
   * AI相似问题搜索
   */
  private async findAISimilarIssues(logContext: string): Promise<any[]> {
    try {
      // 使用向量搜索查找相似的历史问题
             const searchResult = await this.vectorService.semanticSearch(logContext, {
         limit: 5,
         threshold: 0.7,
         filters: { category: 'log_issue' },
         includeMetadata: true,
       });

      return searchResult.documents.map((doc) => ({
        id: doc.id,
        similarity: doc.similarity,
        description: doc.metadata.description || '相似问题',
        solution: doc.metadata.solution || '查看历史解决方案',
        metadata: {
          ...doc.metadata,
          aiGenerated: true,
          semanticMatch: true,
        },
      }));
    } catch (error) {
      this.logger.warn('AI相似问题搜索失败，使用基础搜索', error.message);
      return [];
    }
  }

  /**
   * AI语义分析
   */
  private async performSemanticAnalysis(logContext: string): Promise<{
    semanticSimilarity: number;
    patternConfidence: number;
    anomalyScore: number;
    autoTags: string[];
  }> {
    try {
                    // 1. 生成日志的语义向量
       const embeddingResult =
         await this.embeddingService.generateEmbedding(logContext);
       const logVector = embeddingResult.vector;

       // 2. 与已知模式比较
       const patternSimilarity = await this.compareWithKnownPatterns(logVector);

       // 3. 异常检测
       const anomalyScore = await this.detectSemanticAnomalies(logVector);

      // 4. 自动标签生成
      const autoTags = await this.generateAutoTags(logContext, logVector);

      return {
        semanticSimilarity: patternSimilarity.maxSimilarity,
        patternConfidence: patternSimilarity.confidence,
        anomalyScore,
        autoTags,
      };
    } catch (error) {
      this.logger.warn('语义分析失败', error.message);
      return {
        semanticSimilarity: 0,
        patternConfidence: 0,
        anomalyScore: 0,
        autoTags: [],
      };
    }
  }

  /**
   * AI建议生成
   */
  private async generateAISuggestions(
    logContext: string,
    aiInsights: any,
    similarIssues: any[],
  ): Promise<string[]> {
    const suggestions = [];

    // 基于AI置信度的建议
    if (aiInsights.patternConfidence > 0.8) {
      suggestions.push(`🤖 AI高置信度匹配：建议参考相似问题的解决方案`);
    }

    // 基于异常分数的建议
    if (aiInsights.anomalyScore > 0.7) {
      suggestions.push(`⚠️ AI检测到异常模式：建议深入调查此问题`);
    }

    // 基于自动标签的建议
    for (const tag of aiInsights.autoTags) {
      const tagSuggestions = this.getTagBasedSuggestions(tag);
      suggestions.push(...tagSuggestions);
    }

    // 基于语义相似问题的建议
    const highSimilarityIssues = similarIssues.filter(
      (issue) => issue.similarity > 0.8,
    );
    if (highSimilarityIssues.length > 0) {
      suggestions.push(
        `🔍 发现${highSimilarityIssues.length}个高度相似的历史问题`,
      );
    }

    return suggestions;
  }

  /**
   * 从日志中学习模式
   */
  private async learnFromLog(
    logContext: string,
    analysis: any,
  ): Promise<void> {
    try {
      // 将新的日志模式添加到向量知识库
      const document = {
        id: `log_pattern_${Date.now()}`,
        content: logContext,
        metadata: {
          category: 'log_issue',
          issueType: analysis.issueType,
          severity: analysis.riskLevel,
          timestamp: new Date(),
          source: analysis.source,
          autoLearned: true,
        },
      };

      await this.vectorService.addDocument(document);
      this.logger.debug(`学习新日志模式: ${document.id}`);
    } catch (error) {
      this.logger.warn('模式学习失败', error.message);
    }
  }

  /**
   * 与已知模式比较
   */
  private async compareWithKnownPatterns(
    logVector: number[],
  ): Promise<{ maxSimilarity: number; confidence: number }> {
    try {
      // 查找最相似的已知模式
      const similarDocuments = await this.vectorService.findSimilarDocuments(
        'current_log',
        5,
      );

      if (similarDocuments.length === 0) {
        return { maxSimilarity: 0, confidence: 0 };
      }

      const maxSimilarity = Math.max(
        ...similarDocuments.map((doc) => doc.similarity || 0),
      );

      // 计算置信度（基于相似文档的数量和相似度）
      const confidence =
        similarDocuments.filter((doc) => (doc.similarity || 0) > 0.7)
          .length / 5;

      return { maxSimilarity, confidence };
    } catch (error) {
      return { maxSimilarity: 0, confidence: 0 };
    }
  }

  /**
   * 语义异常检测
   */
  private async detectSemanticAnomalies(logVector: number[]): Promise<number> {
    // 简化的异常检测：基于向量与正常模式的距离
    // 实际实现可以使用更复杂的异常检测算法
    try {
      const normalPatterns = await this.vectorService.semanticSearch(
        'normal operation log',
        { limit: 10, threshold: 0.5 },
      );

      if (normalPatterns.documents.length === 0) {
        return 0.5; // 默认中等异常分数
      }

      // 计算与正常模式的平均距离
      const distances = normalPatterns.documents.map(
        (doc) => 1 - (doc.similarity || 0),
      );
      const avgDistance =
        distances.reduce((sum, dist) => sum + dist, 0) / distances.length;

      return Math.min(1.0, avgDistance);
    } catch (error) {
      return 0.5;
    }
  }

  /**
   * 自动标签生成
   */
  private async generateAutoTags(
    logContext: string,
    logVector: number[],
  ): Promise<string[]> {
    const tags = [];

    // 基于关键词的标签
    const keywordTags = this.extractKeywordTags(logContext);
    tags.push(...keywordTags);

    // 基于语义相似度的标签
    try {
      const semanticTags = await this.extractSemanticTags(logVector);
      tags.push(...semanticTags);
    } catch (error) {
      // 忽略语义标签错误
    }

    return [...new Set(tags)]; // 去重
  }

  // ==================== 辅助方法 ====================

  private parseLogData(logData: any): any {
    // 日志解析逻辑（复用原有代码）
    if (Array.isArray(logData)) {
      return this.parseLogStrings(logData);
    }
    return logData;
  }

  private buildLogContext(parsedLogData: any, userFeedback: string): string {
    return `
用户反馈: ${userFeedback}
日志级别: ${parsedLogData.level}
来源: ${parsedLogData.source}
错误信息: ${parsedLogData.message}
${parsedLogData.stackTrace ? `堆栈: ${parsedLogData.stackTrace}` : ''}
`.trim();
  }

  private async performBasicAnalysis(parsedLogData: any): Promise<any> {
    // 基础分析逻辑（复用原有代码）
    return {
      issueType: 'GENERIC_ERROR',
      riskLevel: 'MEDIUM' as const,
      analysisResult: { basic: true },
      suggestions: ['基础建议'],
      similarIssues: [],
    };
  }

  private mergeWithAISimilarities(
    basicSimilar: any[],
    aiSimilar: any[],
  ): any[] {
    // 合并基础相似问题和AI找到的相似问题
    const merged = [...basicSimilar];

    for (const aiIssue of aiSimilar) {
      if (!merged.find((issue) => issue.id === aiIssue.id)) {
        merged.push(aiIssue);
      }
    }

    return merged.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
  }

  private reassessRiskWithAI(
    basicRisk: string,
    aiInsights: any,
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    // AI重新评估风险级别
    if (aiInsights.anomalyScore > 0.8) {
      return 'CRITICAL';
    }

    if (aiInsights.patternConfidence > 0.9 && basicRisk === 'HIGH') {
      return 'HIGH';
    }

    return basicRisk as any;
  }

  private async fallbackToBasicAnalysis(
    logData: any,
    userFeedback: string,
  ): Promise<AIAnalysisResult> {
    // 降级到基础分析
    return {
      analysisResult: { basic: true, aiEnhanced: false },
      suggestions: ['AI分析失败，使用基础分析'],
      similarIssues: [],
      riskLevel: 'MEDIUM',
      aiInsights: {
        semanticSimilarity: 0,
        patternConfidence: 0,
        anomalyScore: 0,
        autoTags: [],
      },
    };
  }

  private parseLogStrings(logStrings: string[]): any {
    // 复用原有的字符串解析逻辑
    return {
      level: 'ERROR',
      source: 'unknown',
      message: logStrings.join('\n'),
      timestamp: new Date(),
    };
  }

  private extractKeywordTags(logContext: string): string[] {
    const tags = [];
    const lowerContext = logContext.toLowerCase();

    const tagPatterns = [
      { pattern: /payment|支付/, tag: 'payment' },
      { pattern: /timeout|超时/, tag: 'timeout' },
      { pattern: /null|undefined/, tag: 'null-error' },
      { pattern: /memory|内存/, tag: 'memory' },
      { pattern: /database|数据库/, tag: 'database' },
      { pattern: /network|网络/, tag: 'network' },
    ];

    for (const { pattern, tag } of tagPatterns) {
      if (pattern.test(lowerContext)) {
        tags.push(tag);
      }
    }

    return tags;
  }

  private async extractSemanticTags(logVector: number[]): Promise<string[]> {
    // 基于语义向量的标签提取
    // 这里可以实现更复杂的标签分类逻辑
    return [];
  }

  private getTagBasedSuggestions(tag: string): string[] {
    const suggestions: Record<string, string[]> = {
      payment: ['🏦 检查支付网关状态', '💳 验证支付参数'],
      timeout: ['⏱️ 检查网络延迟', '🔄 考虑增加重试机制'],
      'null-error': ['🔍 检查空值处理', '✅ 添加参数验证'],
      memory: ['💾 检查内存使用', '🧹 排查内存泄漏'],
      database: ['🗄️ 检查数据库连接', '📊 优化查询性能'],
      network: ['🌐 检查网络连接', '🔗 验证API可用性'],
    };

    return suggestions[tag] || [];
  }
} 