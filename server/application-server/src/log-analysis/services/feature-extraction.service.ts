import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { VectorKnowledgeService } from '../../ai/services/vector-knowledge.service';
import { OllamaUniversalEmbeddingService } from '../../ai/services/ollama-universal-embedding.service';

export interface ExtractedFeature {
  featureType: string;
  featureName: string;
  description: string;
  importance: number; // 0-1
  confidence: number; // 0-1
  examples: string[];
  pattern: string;
  metadata: Record<string, any>;
}

export interface PatternAnalysisResult {
  isNewPattern: boolean;
  similarityScore: number;
  clusterType: string;
  suggestedName: string;
  characteristics: string[];
  recommendedAction: 'MONITOR' | 'INVESTIGATE' | 'ALERT' | 'IGNORE';
}

@Injectable()
export class FeatureExtractionService {
  private readonly logger = new Logger(FeatureExtractionService.name);

  // 已知问题类型的特征向量缓存
  private knownPatternVectors: Map<string, number[]> = new Map();

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly vectorService: VectorKnowledgeService,
    private readonly embeddingService: OllamaUniversalEmbeddingService,
  ) {
    this.initializeKnownPatterns();
  }

  /**
   * 智能特征提取 - 自动发现新问题模式
   */
  async extractFeaturesFromLog(logEntry: any): Promise<{
    knownFeatures: ExtractedFeature[];
    unknownPatterns: PatternAnalysisResult[];
  }> {
    this.logger.debug(`开始特征提取: ${logEntry.id}`);

    try {
      // 1. 提取基础特征
      const basicFeatures = await this.extractBasicFeatures(logEntry);

      // 2. 提取文本特征
      const textFeatures = await this.extractTextFeatures(logEntry);

      // 3. 提取结构化特征
      const structuredFeatures = await this.extractStructuredFeatures(logEntry);

      // 4. 合并所有特征
      const allFeatures = [
        ...basicFeatures,
        ...textFeatures,
        ...structuredFeatures,
      ];

      // 5. 分析是否为新模式
      const patternAnalysis = await this.analyzePatterns(logEntry, allFeatures);

      // 6. 分离已知和未知特征
      const knownFeatures = allFeatures.filter(
        (f) => !patternAnalysis.some((p) => p.isNewPattern),
      );
      const unknownPatterns = patternAnalysis.filter((p) => p.isNewPattern);

      // 7. 学习新模式
      if (unknownPatterns.length > 0) {
        await this.learnNewPatterns(logEntry, unknownPatterns);
      }

      return { knownFeatures, unknownPatterns };
    } catch (error) {
      this.logger.error(`特征提取失败: ${logEntry.id}`, error.stack);
      return { knownFeatures: [], unknownPatterns: [] };
    }
  }

  /**
   * 基础特征提取
   */
  private async extractBasicFeatures(
    logEntry: any,
  ): Promise<ExtractedFeature[]> {
    const features: ExtractedFeature[] = [];

    // 1. 错误级别特征
    if (logEntry.level) {
      features.push({
        featureType: 'LOG_LEVEL',
        featureName: `LEVEL_${logEntry.level}`,
        description: `日志级别: ${logEntry.level}`,
        importance: this.calculateLogLevelImportance(logEntry.level),
        confidence: 1.0,
        examples: [logEntry.level],
        pattern: `level === "${logEntry.level}"`,
        metadata: { level: logEntry.level },
      });
    }

    // 2. 来源特征
    if (logEntry.source) {
      features.push({
        featureType: 'LOG_SOURCE',
        featureName: `SOURCE_${logEntry.source.toUpperCase()}`,
        description: `日志来源: ${logEntry.source}`,
        importance: 0.7,
        confidence: 1.0,
        examples: [logEntry.source],
        pattern: `source === "${logEntry.source}"`,
        metadata: { source: logEntry.source },
      });
    }

    // 3. 时间特征
    if (logEntry.timestamp) {
      const hour = new Date(logEntry.timestamp).getHours();
      const timeRange = this.getTimeRange(hour);

      features.push({
        featureType: 'TIME_PATTERN',
        featureName: `TIME_${timeRange}`,
        description: `发生时间段: ${timeRange}`,
        importance: 0.3,
        confidence: 0.8,
        examples: [timeRange],
        pattern: `timeRange === "${timeRange}"`,
        metadata: { hour, timeRange },
      });
    }

    // 4. 服务特征
    if (logEntry.service) {
      features.push({
        featureType: 'SERVICE',
        featureName: `SERVICE_${logEntry.service.toUpperCase()}`,
        description: `服务名称: ${logEntry.service}`,
        importance: 0.8,
        confidence: 1.0,
        examples: [logEntry.service],
        pattern: `service === "${logEntry.service}"`,
        metadata: { service: logEntry.service },
      });
    }

    return features;
  }

  /**
   * 文本特征提取 - 使用向量化技术
   */
  private async extractTextFeatures(
    logEntry: any,
  ): Promise<ExtractedFeature[]> {
    const features: ExtractedFeature[] = [];

    if (!logEntry.message) return features;

    try {
      // 1. 关键词提取
      const keywords = this.extractKeywords(logEntry.message);

      // 2. 错误模式提取
      const errorPatterns = this.extractErrorPatterns(logEntry.message);

      // 3. API端点提取
      const apiPatterns = this.extractApiPatterns(logEntry.message);

      // 4. 错误代码提取
      const errorCodes = this.extractErrorCodes(logEntry.message);

      // 5. 生成文本向量
      const embeddingResult = await this.embeddingService.generateEmbedding(
        logEntry.message,
      );
      const messageVector = embeddingResult.vector;

      // 添加关键词特征
      keywords.forEach((keyword) => {
        features.push({
          featureType: 'KEYWORD',
          featureName: `KEYWORD_${keyword.toUpperCase()}`,
          description: `关键词: ${keyword}`,
          importance: 0.6,
          confidence: 0.8,
          examples: [keyword],
          pattern: `message.includes("${keyword}")`,
          metadata: { keyword, messageVector },
        });
      });

      // 添加错误模式特征
      errorPatterns.forEach((pattern) => {
        features.push({
          featureType: 'ERROR_PATTERN',
          featureName: `ERROR_${pattern.type}`,
          description: `错误模式: ${pattern.description}`,
          importance: 0.9,
          confidence: pattern.confidence,
          examples: [pattern.example],
          pattern: pattern.regex,
          metadata: { errorPattern: pattern, messageVector },
        });
      });

      return features;
    } catch (error) {
      this.logger.error('文本特征提取失败', error.stack);
      return features;
    }
  }

  /**
   * 结构化特征提取
   */
  private async extractStructuredFeatures(
    logEntry: any,
  ): Promise<ExtractedFeature[]> {
    const features: ExtractedFeature[] = [];

    if (!logEntry.metadata) return features;

    // 1. API端点特征
    if (logEntry.metadata.apiEndpoint) {
      const endpoint = logEntry.metadata.apiEndpoint;
      const endpointCategory = this.categorizeApiEndpoint(endpoint);

      features.push({
        featureType: 'API_ENDPOINT',
        featureName: `API_${endpointCategory}`,
        description: `API端点类型: ${endpointCategory}`,
        importance: 0.8,
        confidence: 0.9,
        examples: [endpoint],
        pattern: `apiEndpoint.includes("${endpointCategory.toLowerCase()}")`,
        metadata: { endpoint, category: endpointCategory },
      });
    }

    // 2. 返回码特征
    if (logEntry.metadata.retCode !== undefined) {
      const retCode = logEntry.metadata.retCode;
      const codeCategory = this.categorizeReturnCode(retCode);

      features.push({
        featureType: 'RETURN_CODE',
        featureName: `RET_${codeCategory}`,
        description: `返回码类型: ${codeCategory}`,
        importance: 0.9,
        confidence: 1.0,
        examples: [retCode.toString()],
        pattern: `retCode >= ${Math.floor(retCode / 100) * 100} && retCode < ${Math.floor(retCode / 100) * 100 + 100}`,
        metadata: { retCode, category: codeCategory },
      });
    }

    // 3. 业务参数特征
    if (logEntry.metadata.inputParams) {
      const paramFeatures = await this.extractParameterFeatures(
        logEntry.metadata.inputParams,
      );
      features.push(...paramFeatures);
    }

    // 4. 用户特征
    if (logEntry.metadata.userId) {
      features.push({
        featureType: 'USER_CONTEXT',
        featureName: 'HAS_USER_CONTEXT',
        description: '包含用户上下文',
        importance: 0.5,
        confidence: 1.0,
        examples: ['user_context'],
        pattern: 'metadata.userId !== undefined',
        metadata: { hasUserContext: true },
      });
    }

    return features;
  }

  /**
   * 模式分析 - 检测是否为新模式
   */
  private async analyzePatterns(
    logEntry: any,
    features: ExtractedFeature[],
  ): Promise<PatternAnalysisResult[]> {
    const results: PatternAnalysisResult[] = [];

    try {
      // 1. 生成日志条目的综合向量
      const logVector = await this.generateLogVector(logEntry, features);

      // 2. 与已知模式比较
      const similarityResults = await this.compareWithKnownPatterns(logVector);

      // 3. 如果相似度低于阈值，认为是新模式
      const NEW_PATTERN_THRESHOLD = 0.7;

      if (similarityResults.maxSimilarity < NEW_PATTERN_THRESHOLD) {
        // 4. 分析新模式特征
        const newPattern = await this.analyzeNewPattern(
          logEntry,
          features,
          logVector,
        );
        results.push(newPattern);

        // 5. 保存新模式到向量库
        await this.saveNewPatternToVectorDB(newPattern, logVector);
      }

      return results;
    } catch (error) {
      this.logger.error('模式分析失败', error.stack);
      return [];
    }
  }

  /**
   * 分析新模式
   */
  private async analyzeNewPattern(
    logEntry: any,
    features: ExtractedFeature[],
    logVector: number[],
  ): Promise<PatternAnalysisResult> {
    // 1. 分析特征重要性
    const importantFeatures = features
      .filter((f) => f.importance > 0.7)
      .sort((a, b) => b.importance - a.importance);

    // 2. 生成模式名称
    const suggestedName = this.generatePatternName(importantFeatures, logEntry);

    // 3. 提取关键特征
    const characteristics = importantFeatures
      .slice(0, 5) // 取前5个重要特征
      .map((f) => f.description);

    // 4. 确定推荐行动
    const recommendedAction = this.determineRecommendedAction(
      logEntry,
      importantFeatures,
    );

    return {
      isNewPattern: true,
      similarityScore: 0.0, // 新模式，相似度为0
      clusterType: 'NEW_UNKNOWN',
      suggestedName,
      characteristics,
      recommendedAction,
    };
  }

  /**
   * 学习新模式
   */
  private async learnNewPatterns(
    logEntry: any,
    patterns: PatternAnalysisResult[],
  ): Promise<void> {
    for (const pattern of patterns) {
      try {
        // 1. 保存新模式到数据库
        await this.databaseService.businessParamFeature.create({
          data: {
            featureName: pattern.suggestedName,
            apiEndpoint: logEntry.metadata?.apiEndpoint || 'unknown',
            paramPath: 'auto_extracted',
            paramSource: 'feature_extraction',
            totalCount: 1,
            errorCount: logEntry.level === 'ERROR' ? 1 : 0,
            isAnomalous: pattern.recommendedAction === 'ALERT',
            anomalyScore: 1.0 - pattern.similarityScore,
          },
        });

        // 2. 添加到向量知识库
        await this.vectorService.addDocument({
          id: `pattern_${Date.now()}_${pattern.suggestedName}`,
          content: `新问题模式: ${pattern.suggestedName}. 特征: ${pattern.characteristics.join(', ')}`,
          metadata: {
            category: 'auto_pattern',
            patternType: pattern.clusterType,
            logLevel: logEntry.level,
            source: logEntry.source,
            action: pattern.recommendedAction,
            extractedAt: new Date().toISOString(),
          },
        });

        this.logger.log(`学习新模式: ${pattern.suggestedName}`);
      } catch (error) {
        this.logger.error(
          `保存新模式失败: ${pattern.suggestedName}`,
          error.stack,
        );
      }
    }
  }

  /**
   * 批量特征提取 - 用于历史数据分析
   */
  async extractFeaturesFromBatch(logEntries: any[]): Promise<{
    newPatterns: PatternAnalysisResult[];
    featureStats: Record<string, number>;
  }> {
    this.logger.log(`开始批量特征提取: ${logEntries.length} 条日志`);

    const allNewPatterns: PatternAnalysisResult[] = [];
    const featureCount: Record<string, number> = {};

    for (const logEntry of logEntries) {
      const result = await this.extractFeaturesFromLog(logEntry);

      // 统计特征出现次数
      result.knownFeatures.forEach((feature) => {
        featureCount[feature.featureName] =
          (featureCount[feature.featureName] || 0) + 1;
      });

      // 收集新模式
      allNewPatterns.push(...result.unknownPatterns);
    }

    // 聚类分析新模式
    const clusteredPatterns = await this.clusterNewPatterns(allNewPatterns);

    return {
      newPatterns: clusteredPatterns,
      featureStats: featureCount,
    };
  }

  // ==================== 辅助方法 ====================

  private async initializeKnownPatterns(): Promise<void> {
    // 初始化已知问题类型的向量表示
    const knownPatterns = [
      'BACKEND_RET_ERROR',
      'FRONTEND_JS_ERROR',
      'BLOCKING_ERROR',
      'KEY_FLOW_ERROR',
      'PAGE_UNLOAD_ERROR',
      'BUSINESS_PARAM_ERROR',
      'VEHICLE_SPEC_ERROR',
    ];

    for (const pattern of knownPatterns) {
      try {
        const embeddingResult =
          await this.embeddingService.generateEmbedding(pattern);
        this.knownPatternVectors.set(pattern, embeddingResult.vector);
      } catch (error) {
        this.logger.error(`初始化模式向量失败: ${pattern}`, error.stack);
      }
    }
  }

  private extractKeywords(message: string): string[] {
    // 简单的关键词提取 - 可以用更复杂的NLP算法
    const commonWords = new Set([
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
    ]);

    return message
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !commonWords.has(word))
      .slice(0, 10); // 限制数量
  }

  private extractErrorPatterns(message: string): Array<{
    type: string;
    description: string;
    confidence: number;
    example: string;
    regex: string;
  }> {
    const patterns = [
      {
        regex: /TypeError:.*?cannot read prop.*?of (null|undefined)/i,
        type: 'NULL_REFERENCE',
        description: '空值引用错误',
        confidence: 0.9,
      },
      {
        regex: /Network Error|ERR_NETWORK/i,
        type: 'NETWORK_ERROR',
        description: '网络连接错误',
        confidence: 0.8,
      },
      {
        regex: /timeout|timed out/i,
        type: 'TIMEOUT_ERROR',
        description: '超时错误',
        confidence: 0.8,
      },
      {
        regex: /401|unauthorized/i,
        type: 'AUTH_ERROR',
        description: '认证错误',
        confidence: 0.9,
      },
    ];

    return patterns
      .filter((pattern) => pattern.regex.test(message))
      .map((pattern) => ({
        ...pattern,
        example: message.match(pattern.regex)?.[0] || '',
        regex: pattern.regex.toString(),
      }));
  }

  private extractApiPatterns(message: string): string[] {
    const apiRegex = /\/api\/[^\s]+/g;
    return message.match(apiRegex) || [];
  }

  private extractErrorCodes(message: string): string[] {
    const codeRegex = /\b\d{3,4}\b/g;
    return message.match(codeRegex) || [];
  }

  private categorizeApiEndpoint(endpoint: string): string {
    const categories: Record<string, string> = {
      '/api/auth': 'AUTHENTICATION',
      '/api/user': 'USER_MANAGEMENT',
      '/api/order': 'ORDER_MANAGEMENT',
      '/api/payment': 'PAYMENT',
      '/api/pricing': 'PRICING',
      '/api/cart': 'CART',
    };

    for (const [prefix, category] of Object.entries(categories)) {
      if (endpoint.startsWith(prefix)) {
        return category;
      }
    }

    return 'OTHER';
  }

  private categorizeReturnCode(retCode: number): string {
    if (retCode >= 200 && retCode < 300) return 'SUCCESS';
    if (retCode >= 300 && retCode < 400) return 'REDIRECT';
    if (retCode >= 400 && retCode < 500) return 'CLIENT_ERROR';
    if (retCode >= 500) return 'SERVER_ERROR';
    if (retCode === 0) return 'SUCCESS';
    return 'BUSINESS_ERROR';
  }

  private async extractParameterFeatures(
    inputParams: any,
  ): Promise<ExtractedFeature[]> {
    const features: ExtractedFeature[] = [];

    // 分析参数结构
    const paramKeys = Object.keys(inputParams);

    features.push({
      featureType: 'PARAM_STRUCTURE',
      featureName: `PARAM_COUNT_${paramKeys.length}`,
      description: `参数数量: ${paramKeys.length}`,
      importance: 0.4,
      confidence: 1.0,
      examples: [paramKeys.length.toString()],
      pattern: `Object.keys(inputParams).length === ${paramKeys.length}`,
      metadata: { paramCount: paramKeys.length, paramKeys },
    });

    return features;
  }

  private calculateLogLevelImportance(level: string): number {
    const importance: Record<string, number> = {
      FATAL: 1.0,
      ERROR: 0.9,
      WARN: 0.6,
      INFO: 0.3,
      DEBUG: 0.1,
    };

    return importance[level] || 0.5;
  }

  private getTimeRange(hour: number): string {
    if (hour >= 0 && hour < 6) return 'NIGHT';
    if (hour >= 6 && hour < 12) return 'MORNING';
    if (hour >= 12 && hour < 18) return 'AFTERNOON';
    return 'EVENING';
  }

  private async generateLogVector(
    logEntry: any,
    features: ExtractedFeature[],
  ): Promise<number[]> {
    // 生成综合向量表示 - 使用Ollama
    const text = `${logEntry.message} ${logEntry.source} ${logEntry.level}`;
    const embeddingResult = await this.embeddingService.generateEmbedding(text);
    return embeddingResult.vector;
  }

  private async compareWithKnownPatterns(logVector: number[]): Promise<{
    maxSimilarity: number;
    bestMatch: string | null;
  }> {
    let maxSimilarity = 0;
    let bestMatch: string | null = null;

    for (const [pattern, patternVector] of this.knownPatternVectors) {
      const similarity = this.cosineSimilarity(logVector, patternVector);

      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        bestMatch = pattern;
      }
    }

    return { maxSimilarity, bestMatch };
  }

  private cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    const dotProduct = vectorA.reduce((sum, a, i) => sum + a * vectorB[i], 0);
    const magnitudeA = Math.sqrt(vectorA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vectorB.reduce((sum, b) => sum + b * b, 0));

    return dotProduct / (magnitudeA * magnitudeB);
  }

  private generatePatternName(
    features: ExtractedFeature[],
    logEntry: any,
  ): string {
    const topFeatures = features.slice(0, 2);
    const parts = topFeatures.map((f) => f.featureName);

    if (logEntry.metadata?.apiEndpoint) {
      const endpoint = logEntry.metadata.apiEndpoint.split('/').pop();
      parts.unshift(endpoint.toUpperCase());
    }

    return `AUTO_${parts.join('_')}`;
  }

  private determineRecommendedAction(
    logEntry: any,
    features: ExtractedFeature[],
  ): 'MONITOR' | 'INVESTIGATE' | 'ALERT' | 'IGNORE' {
    // 基于特征重要性和日志级别决定行动
    const maxImportance = Math.max(...features.map((f) => f.importance));

    if (logEntry.level === 'ERROR' && maxImportance > 0.8) {
      return 'ALERT';
    }

    if (logEntry.level === 'ERROR' || maxImportance > 0.6) {
      return 'INVESTIGATE';
    }

    if (maxImportance > 0.4) {
      return 'MONITOR';
    }

    return 'IGNORE';
  }

  private async saveNewPatternToVectorDB(
    pattern: PatternAnalysisResult,
    vector: number[],
  ): Promise<void> {
    // 这里可以保存到向量数据库中，供后续比较使用
    this.knownPatternVectors.set(pattern.suggestedName, vector);
  }

  private async clusterNewPatterns(
    patterns: PatternAnalysisResult[],
  ): Promise<PatternAnalysisResult[]> {
    // 简单的聚类实现 - 可以用更复杂的聚类算法
    return patterns; // 暂时直接返回，可以后续优化
  }
}
