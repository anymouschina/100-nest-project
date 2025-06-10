import { Injectable, Logger } from '@nestjs/common';
import {
  Agent,
  AgentContext,
  AgentResult,
} from '../services/agent-orchestrator.service';
import { LangChainAIProviderService } from '../../ai/services/langchain-ai-provider.service';
import { BatchProcessor, DEFAULT_CONFIG } from '../utils/batch-processor.util';

export interface LLMFeatureExtractionResult {
  extractedFields: {
    timestamp?: string;
    level?: string;
    message?: string;
    source?: string;
    service?: string;
    userId?: string;
    sessionId?: string;
    responseTime?: number;
    errorCode?: string;
    [key: string]: any;
  };
  semanticFeatures: {
    errorCategory:
      | 'NETWORK'
      | 'DATABASE'
      | 'AUTHENTICATION'
      | 'BUSINESS_LOGIC'
      | 'SYSTEM'
      | 'UNKNOWN';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    businessContext: string[];
    technicalContext: string[];
    keywords: string[];
    sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    urgency: number;
  };
  normalizedMessage: string;
  confidence: number;
}

@Injectable()
export class LLMFeatureExtractionV2Agent implements Agent {
  readonly name = 'LLMFeatureExtractionV2Agent';
  readonly version = '2.0.0';
  readonly capabilities = [
    'adaptive_field_extraction',
    'semantic_understanding',
    'format_normalization',
    'intelligent_categorization',
    'context_awareness',
    'optimized_batch_processing',
    'parallel_processing',
    'large_scale_optimization',
  ];

  private readonly logger = new Logger(LLMFeatureExtractionV2Agent.name);
  private readonly batchProcessor = new BatchProcessor({
    ...DEFAULT_CONFIG,
    baseBatchSize: 30, // 🔥 进一步优化批次大小
    maxBatchSize: 120, // 🔥 大数据量时更大批次
    maxConcurrency: 8, // 🔥 更高并发
    largeDataThreshold: 800, // 🔥 调整大数据量阈值
  });

  constructor(private readonly aiProviderService: LangChainAIProviderService) {}

  async execute(logData: any[], context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    this.logger.log(
      `🚀 开始批量优化LLM特征提取: 任务${context.taskId}, 日志数量: ${logData.length}`,
    );

    try {
      // 🔥 获取最优处理策略
      const stats = this.batchProcessor.getProcessingStats(logData.length);
      this.logger.log(
        `📊 处理方案: ${stats.strategy} | 批次: ${stats.batchSize} | 
         预计批次数: ${stats.batches} | 并发: ${stats.concurrency} | 
         预计时间: ${stats.estimatedTime}`,
      );

      let results: LLMFeatureExtractionResult[] = [];

      // 🔥 智能策略选择
      if (stats.strategy === 'stratified') {
        // 大数据量: 分层 + 并行处理
        results = await this.processWithStratification(logData);
      } else {
        // 中小数据量: 直接并行批次处理
        results = await this.processWithBatching(logData);
      }

      const aggregatedFeatures = this.aggregateFeatures(results);
      const processingTime = Date.now() - startTime;

      this.logger.log(
        `✅ LLM特征提取完成！处理 ${logData.length} 条日志，
         生成 ${results.length} 个结果，耗时 ${processingTime}ms`,
      );

      // 🔥 计算效率指标
      const efficiency = {
        logsPerSecond: Math.round((logData.length / processingTime) * 1000),
        avgProcessingTimePerLog: Math.round(processingTime / logData.length),
        actualVsPredicted: `${processingTime}ms vs ${stats.estimatedTime}`,
        llmCallCount: stats.batches,
        parallelEfficiency: Math.round((stats.batches / stats.concurrency) * 100),
      };

      return {
        agentName: this.name,
        success: true,
        data: {
          individualResults: results,
          aggregatedFeatures,
          totalProcessed: logData.length,
          llmEnabled: true,
          processingStats: stats,
          actualProcessingTime: processingTime,
          efficiency,
        },
        processingTime,
        confidence: this.calculateOverallConfidence(results),
      };
    } catch (error) {
      this.logger.error('❌ LLM特征提取失败', error.stack);
      return {
        agentName: this.name,
        success: false,
        data: await this.fallbackExtraction(logData),
        processingTime: Date.now() - startTime,
        confidence: 0.6,
        error: error.message,
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  // 🔥 分层处理：针对大数据量进行智能分层
  private async processWithStratification(
    logData: any[],
  ): Promise<LLMFeatureExtractionResult[]> {
    const { tier1, tier2, tier3 } = this.batchProcessor.stratifyLogs(logData);

    this.logger.debug(
      `📑 日志分层完成: 错误层${tier1.length}条, 警告层${tier2.length}条, 
       信息层${tier3.length}条`,
    );

    // 🔥 并行处理各层级，重要层级优先
    const tierPromises = [
      this.processLogTier(tier1, '🔴 关键错误层', 1),
      this.processLogTier(tier2, '🟡 警告信息层', 2),
      this.processLogTier(tier3, '🔵 一般信息层', 3),
    ];

    const tierResults = await Promise.all(tierPromises);
    return tierResults.flat();
  }

  // 🔥 批次处理：中小数据量的高效处理
  private async processWithBatching(
    logData: any[],
  ): Promise<LLMFeatureExtractionResult[]> {
    const batches = this.batchProcessor.createBatches(logData);

    return await this.batchProcessor.processInParallel(
      batches,
      async (batch: any[], index: number) => {
        this.logger.debug(`📦 处理批次 ${index + 1}/${batches.length}`);
        return await this.processBatch(batch);
      },
    );
  }

  // 🔥 层级处理：处理单个层级的日志
  private async processLogTier(
    logs: any[],
    tierName: string,
    priority: number,
  ): Promise<LLMFeatureExtractionResult[]> {
    if (logs.length === 0) {
      this.logger.debug(`${tierName}: 无日志需要处理`);
      return [];
    }

    this.logger.debug(`${tierName}: 开始处理 ${logs.length} 条日志`);
    const batches = this.batchProcessor.createBatches(logs);

    return await this.batchProcessor.processInParallel(
      batches,
      async (batch: any[], index: number) => {
        this.logger.debug(
          `${tierName} 批次 ${index + 1}/${batches.length}: ${batch.length}条日志`,
        );
        return await this.processBatch(batch);
      },
    );
  }

  // 🔥 批次处理核心逻辑
  private async processBatch(
    logEntries: any[],
  ): Promise<LLMFeatureExtractionResult[]> {
    try {
      // 优先尝试LLM处理
      return await this.processWithLLM(logEntries);
    } catch (error) {
      this.logger.warn(`LLM处理失败，降级到规则处理: ${error.message}`);
      // 降级到规则引擎
      return this.processWithRules(logEntries);
    }
  }

  // 🔥 LLM处理核心
  private async processWithLLM(
    logEntries: any[],
  ): Promise<LLMFeatureExtractionResult[]> {
    const prompt = this.buildOptimizedPrompt(logEntries);

    const response = await this.aiProviderService.generateCompletion({
      prompt,
      maxTokens: 2000,
      temperature: 0.1, // 更低温度提高一致性
      model: 'gpt-3.5-turbo',
    });

    return this.parseLLMResponse(response.content, logEntries);
  }

  // 🔥 优化的提示词生成
  private buildOptimizedPrompt(logEntries: any[]): string {
    const maxExamples = Math.min(logEntries.length, 8); // 最多展示8个示例
    const examples = logEntries
      .slice(0, maxExamples)
      .map((log, index) => {
        const logStr = typeof log === 'string' ? log : JSON.stringify(log);
        return `[${index + 1}] ${logStr}`;
      })
      .join('\n');

    const batchInfo =
      logEntries.length > maxExamples
        ? `\n\n📝 注意: 此批次包含 ${logEntries.length} 条日志，上面仅显示前 ${maxExamples} 条作为示例，请基于全部日志进行分析。`
        : '';

    return `🔍 请分析以下 ${logEntries.length} 条日志，用中文简要描述发现的问题和建议：

${examples}${batchInfo}

📋 重点分析内容：
1. 🏷️ 错误类别识别（网络/数据库/认证/业务逻辑/系统）
2. 🚨 严重程度评估（低/中/高/严重）
3. 👤 用户行为模式分析
4. ⚙️ 技术问题定位
5. 😊 整体情感倾向
6. ⏰ 紧急程度判断

🎯 请用简洁的中文描述您的发现和改进建议。`;
  }

  // 🔥 解析LLM响应
  private parseLLMResponse(
    content: string,
    originalLogs: any[],
  ): LLMFeatureExtractionResult[] {
    try {
      // 尝试JSON解析
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return this.parseJsonResponse(jsonMatch[0], originalLogs);
      }
    } catch (error) {
      this.logger.debug('JSON解析失败，使用文本解析');
    }

    // 使用文本解析
    return this.parseStringResponse(content, originalLogs);
  }

  // 🔥 JSON响应解析
  private parseJsonResponse(
    jsonContent: string,
    originalLogs: any[],
  ): LLMFeatureExtractionResult[] {
    const parsed = JSON.parse(jsonContent);
    // 简化的JSON解析逻辑
    return originalLogs.map((log, index) => ({
      extractedFields: this.extractBasicFields(log),
      semanticFeatures: {
        errorCategory: parsed.errorCategory || 'UNKNOWN',
        severity: parsed.severity || 'MEDIUM',
        businessContext: parsed.businessContext || [],
        technicalContext: parsed.technicalContext || [],
        keywords: parsed.keywords || [],
        sentiment: parsed.sentiment || 'NEUTRAL',
        urgency: parsed.urgency || 5,
      },
      normalizedMessage: this.normalizeMessage(
        typeof log === 'string' ? log : JSON.stringify(log),
      ),
      confidence: 0.8,
    }));
  }

  // 🔥 文本响应解析
  private parseStringResponse(
    content: string,
    originalLogs: any[],
  ): LLMFeatureExtractionResult[] {
    const lowerContent = content.toLowerCase();

    // 智能关键词提取
    const errorCategory = this.extractErrorCategory(lowerContent);
    const severity = this.extractSeverity(lowerContent);
    const sentiment = this.extractSentiment(lowerContent);
    const urgency = this.extractUrgency(lowerContent);

    return originalLogs.map((log) => ({
      extractedFields: this.extractBasicFields(log),
      semanticFeatures: {
        errorCategory,
        severity,
        businessContext: this.extractBusinessContext(content),
        technicalContext: this.extractTechnicalContext(content),
        keywords: this.extractKeywords(content),
        sentiment,
        urgency,
      },
      normalizedMessage: this.normalizeMessage(
        typeof log === 'string' ? log : JSON.stringify(log),
      ),
      confidence: 0.75,
    }));
  }

  // 🔥 规则引擎处理（降级方案）
  private processWithRules(
    logEntries: any[],
  ): LLMFeatureExtractionResult[] {
    return logEntries.map((log) => this.extractWithRules(log));
  }

  // 🔥 规则提取单条日志
  private extractWithRules(log: any): LLMFeatureExtractionResult {
    const logStr = typeof log === 'string' ? log : JSON.stringify(log);
    const extractedFields = this.extractBasicFields(log);

    return {
      extractedFields,
      semanticFeatures: {
        errorCategory: this.categorizeErrorByRules(logStr),
        severity: this.analyzeSeverityByRules(
          extractedFields.level,
          logStr,
        ),
        businessContext: this.extractBusinessContext(logStr),
        technicalContext: this.extractTechnicalContext(logStr),
        keywords: this.extractKeywords(logStr),
        sentiment: this.analyzeSentimentByRules(logStr),
        urgency: this.calculateUrgencyByRules(
          extractedFields.level,
          logStr,
        ),
      },
      normalizedMessage: this.normalizeMessage(logStr),
      confidence: 0.6,
    };
  }

  // === 工具方法 ===

  private extractBasicFields(log: any): any {
    const logStr = typeof log === 'string' ? log : JSON.stringify(log);
    return {
      timestamp: this.extractTimestamp(log, logStr),
      level: this.extractLevel(log, logStr),
      message: this.extractMessage(log, logStr),
      source: this.extractSource(log, logStr),
      service: this.extractService(log, logStr),
      userId: this.extractUserId(log, logStr),
      sessionId: this.extractSessionId(log, logStr),
      responseTime: this.extractResponseTime(log, logStr),
      errorCode: this.extractErrorCode(log, logStr),
    };
  }

  private extractErrorCategory(content: string): any {
    if (content.includes('网络') || content.includes('network')) return 'NETWORK';
    if (content.includes('数据库') || content.includes('database')) return 'DATABASE';
    if (content.includes('认证') || content.includes('auth')) return 'AUTHENTICATION';
    if (content.includes('业务') || content.includes('business')) return 'BUSINESS_LOGIC';
    if (content.includes('系统') || content.includes('system')) return 'SYSTEM';
    return 'UNKNOWN';
  }

  private extractSeverity(content: string): any {
    if (content.includes('严重') || content.includes('critical')) return 'CRITICAL';
    if (content.includes('高') || content.includes('high')) return 'HIGH';
    if (content.includes('中') || content.includes('medium')) return 'MEDIUM';
    return 'LOW';
  }

  private extractSentiment(content: string): any {
    if (content.includes('积极') || content.includes('positive')) return 'POSITIVE';
    if (content.includes('消极') || content.includes('negative')) return 'NEGATIVE';
    return 'NEUTRAL';
  }

  private extractUrgency(content: string): number {
    if (content.includes('紧急') || content.includes('urgent')) return 9;
    if (content.includes('重要') || content.includes('important')) return 7;
    if (content.includes('一般') || content.includes('normal')) return 5;
    return 3;
  }

  private extractBusinessContext(content: string): string[] {
    const contexts: string[] = [];
    const businessTerms = ['用户', '订单', '支付', '登录', '注册', '购买'];
    businessTerms.forEach((term) => {
      if (content.includes(term)) contexts.push(term);
    });
    return contexts;
  }

  private extractTechnicalContext(content: string): string[] {
    const contexts: string[] = [];
    const techTerms = ['API', '数据库', '缓存', '队列', '服务', '接口'];
    techTerms.forEach((term) => {
      if (content.includes(term)) contexts.push(term);
    });
    return contexts;
  }

  private extractKeywords(content: string): string[] {
    const keywords = content
      .match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g)
      ?.filter((word) => word.length > 1)
      .slice(0, 10) || [];
    return keywords;
  }

  // 简化的字段提取方法
  private extractTimestamp(log: any, logStr: string): string | undefined {
    if (typeof log === 'object' && log.timestamp) return log.timestamp;
    const match = logStr.match(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/);
    return match ? match[0] : undefined;
  }

  private extractLevel(log: any, logStr: string): string | undefined {
    if (typeof log === 'object' && log.level) return log.level;
    const levels = ['FATAL', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];
    return levels.find((level) => logStr.toUpperCase().includes(level));
  }

  private extractMessage(log: any, logStr: string): string | undefined {
    if (typeof log === 'object' && log.message) return log.message;
    return logStr.length > 200 ? logStr.substring(0, 200) + '...' : logStr;
  }

  private extractSource(log: any, logStr: string): string | undefined {
    if (typeof log === 'object' && log.source) return log.source;
    return undefined;
  }

  private extractService(log: any, logStr: string): string | undefined {
    if (typeof log === 'object' && log.service) return log.service;
    return undefined;
  }

  private extractUserId(log: any, logStr: string): string | undefined {
    if (typeof log === 'object' && log.userId) return log.userId;
    const match = logStr.match(/userId?[:\s]+([^\s,}]+)/i);
    return match ? match[1] : undefined;
  }

  private extractSessionId(log: any, logStr: string): string | undefined {
    if (typeof log === 'object' && log.sessionId) return log.sessionId;
    const match = logStr.match(/sessionId?[:\s]+([^\s,}]+)/i);
    return match ? match[1] : undefined;
  }

  private extractResponseTime(log: any, logStr: string): number | undefined {
    if (typeof log === 'object' && log.responseTime) return log.responseTime;
    const match = logStr.match(/(\d+)ms|responseTime[:\s]+(\d+)/i);
    return match ? parseInt(match[1] || match[2]) : undefined;
  }

  private extractErrorCode(log: any, logStr: string): string | undefined {
    if (typeof log === 'object' && log.errorCode) return log.errorCode;
    const match = logStr.match(/error[Cc]ode[:\s]+([^\s,}]+)/);
    return match ? match[1] : undefined;
  }

  // 规则引擎方法
  private categorizeErrorByRules(message: string): any {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('connection') || lowerMessage.includes('timeout'))
      return 'NETWORK';
    if (lowerMessage.includes('database') || lowerMessage.includes('sql'))
      return 'DATABASE';
    if (lowerMessage.includes('auth') || lowerMessage.includes('login'))
      return 'AUTHENTICATION';
    if (lowerMessage.includes('business') || lowerMessage.includes('validation'))
      return 'BUSINESS_LOGIC';
    if (lowerMessage.includes('system') || lowerMessage.includes('memory'))
      return 'SYSTEM';
    return 'UNKNOWN';
  }

  private analyzeSeverityByRules(level?: string, message?: string): any {
    if (level === 'FATAL' || level === 'ERROR') return 'HIGH';
    if (level === 'WARN') return 'MEDIUM';
    if (message?.toLowerCase().includes('critical')) return 'CRITICAL';
    return 'LOW';
  }

  private analyzeSentimentByRules(message: string): any {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('success') || lowerMessage.includes('completed'))
      return 'POSITIVE';
    if (
      lowerMessage.includes('error') ||
      lowerMessage.includes('fail') ||
      lowerMessage.includes('exception')
    )
      return 'NEGATIVE';
    return 'NEUTRAL';
  }

  private calculateUrgencyByRules(level?: string, message?: string): number {
    if (level === 'FATAL') return 10;
    if (level === 'ERROR') return 8;
    if (level === 'WARN') return 6;
    if (message?.toLowerCase().includes('critical')) return 9;
    return 4;
  }

  private normalizeMessage(message: string): string {
    return message
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\u4e00-\u9fa5]/g, '')
      .trim()
      .substring(0, 200);
  }

  // 聚合特征
  private aggregateFeatures(results: LLMFeatureExtractionResult[]): any {
    if (results.length === 0) return {};

    const categories = results.map((r) => r.semanticFeatures.errorCategory);
    const severities = results.map((r) => r.semanticFeatures.severity);
    const sentiments = results.map((r) => r.semanticFeatures.sentiment);

    return {
      totalResults: results.length,
      errorCategoryDistribution: this.getDistribution(categories),
      severityDistribution: this.getDistribution(severities),
      sentimentDistribution: this.getDistribution(sentiments),
      averageUrgency:
        results.reduce((sum, r) => sum + r.semanticFeatures.urgency, 0) /
        results.length,
      averageConfidence:
        results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
    };
  }

  private getDistribution(values: string[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    values.forEach((value) => {
      distribution[value] = (distribution[value] || 0) + 1;
    });
    return distribution;
  }

  private calculateOverallConfidence(
    results: LLMFeatureExtractionResult[],
  ): number {
    if (results.length === 0) return 0;
    return (
      results.reduce((sum, result) => sum + result.confidence, 0) /
      results.length
    );
  }

  private async fallbackExtraction(logData: any[]): Promise<any> {
    this.logger.log('执行降级特征提取');
    const results = this.processWithRules(logData);
    return {
      individualResults: results,
      aggregatedFeatures: this.aggregateFeatures(results),
      totalProcessed: logData.length,
      llmEnabled: false,
      fallback: true,
    };
  }
} 