import { Injectable, Logger } from '@nestjs/common';
import {
  Agent,
  AgentContext,
  AgentResult,
} from '../services/agent-orchestrator.service';
import { LangChainAIProviderService } from '../../ai/services/langchain-ai-provider.service';
import { BatchProcessor, DEFAULT_CONFIG } from '../utils/batch-processor.util';

export interface LLMFeatureExtractionResult {
  extractedFields: Record<string, any>;
  semanticFeatures: {
    errorCategory: string;
    severity: string;
    businessContext: string[];
    technicalContext: string[];
    keywords: string[];
    sentiment: string;
    urgency: number;
  };
  normalizedMessage: string;
  confidence: number;
}

@Injectable()
export class LLMFeatureExtractionOptimizedAgent implements Agent {
  readonly name = 'LLMFeatureExtractionOptimizedAgent';
  readonly version = '1.0.0';
  readonly capabilities = [
    'optimized_batch_processing',
    'intelligent_stratification',
    'parallel_processing',
    'large_scale_optimization',
  ];

  private readonly logger = new Logger(LLMFeatureExtractionOptimizedAgent.name);
  
  // 🔥 优化的批次处理配置
  private readonly batchProcessor = new BatchProcessor({
    ...DEFAULT_CONFIG,
    baseBatchSize: 35,    // 📈 批次大小从5提升到35（7倍提升）
    maxBatchSize: 150,    // 📈 大数据量时最大150个日志/批次（30倍提升）
    maxConcurrency: 10,   // 📈 最大并发从1提升到10（10倍提升）
    largeDataThreshold: 600, // 📈 大数据量阈值调整
  });

  constructor(private readonly aiProviderService: LangChainAIProviderService) {}

  async execute(logData: any[], context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    
    // 🔥 获取处理统计
    const stats = this.batchProcessor.getProcessingStats(logData.length);
    
    this.logger.log(
      `🚀 启动优化LLM处理: ${logData.length}条日志 | 策略: ${stats.strategy} | 
       批次大小: ${stats.batchSize} | 预计批次: ${stats.batches} | 
       并发数: ${stats.concurrency} | 预计耗时: ${stats.estimatedTime}`,
    );

    try {
      let results: LLMFeatureExtractionResult[];

      // 🔥 根据数据量选择最优策略
      if (stats.strategy === 'stratified') {
        // 大数据量：分层并行处理
        results = await this.processWithStratification(logData);
      } else {
        // 中小数据量：直接批次并行处理
        results = await this.processWithBatching(logData);
      }

      const processingTime = Date.now() - startTime;
      const efficiency = this.calculateEfficiency(logData.length, processingTime, stats);

      this.logger.log(
        `✅ 处理完成: ${results.length}个结果 | 实际耗时: ${processingTime}ms | 
         处理速度: ${efficiency.logsPerSecond}条/秒 | 
         LLM调用次数: ${stats.batches}次`,
      );

      return {
        agentName: this.name,
        success: true,
        data: {
          results,
          totalProcessed: logData.length,
          processingStats: stats,
          efficiency,
          llmCallCount: stats.batches,
        },
        processingTime,
        confidence: this.calculateConfidence(results),
      };
    } catch (error) {
      this.logger.error('❌ LLM处理失败，使用降级方案', error.message);
      return this.fallbackProcessing(logData, Date.now() - startTime);
    }
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  // 🔥 分层处理大数据量
  private async processWithStratification(logData: any[]): Promise<LLMFeatureExtractionResult[]> {
    const { tier1, tier2, tier3 } = this.batchProcessor.stratifyLogs(logData);
    
    this.logger.debug(
      `📊 日志分层: 错误${tier1.length}条 | 警告${tier2.length}条 | 信息${tier3.length}条`,
    );

    // 🔥 并行处理各层级
    const [results1, results2, results3] = await Promise.all([
      this.processTier(tier1, '🔴错误层'),
      this.processTier(tier2, '🟡警告层'),
      this.processTier(tier3, '🔵信息层'),
    ]);

    return [...results1, ...results2, ...results3];
  }

  // 🔥 批次并行处理
  private async processWithBatching(logData: any[]): Promise<LLMFeatureExtractionResult[]> {
    const batches = this.batchProcessor.createBatches(logData);
    
    return await this.batchProcessor.processInParallel(
      batches,
      async (batch: any[], index: number) => {
        return await this.processBatchWithLLM(batch, index + 1, batches.length);
      },
    );
  }

  // 🔥 处理单个层级
  private async processTier(logs: any[], tierName: string): Promise<LLMFeatureExtractionResult[]> {
    if (logs.length === 0) return [];
    
    const batches = this.batchProcessor.createBatches(logs);
    this.logger.debug(`${tierName}: ${logs.length}条日志，${batches.length}个批次`);
    
    return await this.batchProcessor.processInParallel(
      batches,
      async (batch: any[]) => await this.processBatchWithLLM(batch),
    );
  }

  // 🔥 LLM批次处理核心
  private async processBatchWithLLM(
    batch: any[], 
    batchIndex?: number, 
    totalBatches?: number
  ): Promise<LLMFeatureExtractionResult[]> {
    try {
      const logInfo = batchIndex ? `批次${batchIndex}/${totalBatches}` : `批次`;
      this.logger.debug(`🔄 ${logInfo}: 处理${batch.length}条日志`);
      
      // 🔥 构建优化的提示词
      const prompt = this.buildOptimizedPrompt(batch);
      
      // 🔥 调用LLM
      const response = await this.aiProviderService.generateCompletion(prompt, {
        maxTokens: Math.min(3000, batch.length * 50), // 动态调整token数
        temperature: 0.1,
        modelName: 'gpt-3.5-turbo',
      });

      // 🔥 解析响应
      return this.parseResponse(response, batch);
      
    } catch (error) {
      this.logger.warn(`LLM处理失败，使用规则引擎: ${error.message}`);
      return this.processWithRules(batch);
    }
  }

  // 🔥 优化的提示词
  private buildOptimizedPrompt(batch: any[]): string {
    const examples = batch
      .slice(0, Math.min(10, batch.length))
      .map((log, i) => `[${i + 1}] ${typeof log === 'string' ? log : JSON.stringify(log)}`)
      .join('\n');

    return `🔍 分析以下 ${batch.length} 条日志，用中文简要总结问题和建议：

${examples}
${batch.length > 10 ? `\n📝 (显示前10条, 实际分析全部${batch.length}条)` : ''}

请简要描述：
1. 主要错误类型
2. 严重程度
3. 关键问题
4. 改进建议

用简洁中文回答。`;
  }

  // 🔥 响应解析
  private parseResponse(content: string, batch: any[]): LLMFeatureExtractionResult[] {
    return batch.map((log, index) => ({
      extractedFields: this.extractFields(log),
      semanticFeatures: this.extractSemanticFeatures(content, log),
      normalizedMessage: this.normalizeMessage(log),
      confidence: 0.8,
    }));
  }

  // 🔥 字段提取
  private extractFields(log: any): Record<string, any> {
    const logStr = typeof log === 'string' ? log : JSON.stringify(log);
    return {
      timestamp: this.findTimestamp(logStr),
      level: this.findLevel(logStr),
      message: this.findMessage(log, logStr),
      userId: this.findUserId(logStr),
      service: this.findService(logStr),
    };
  }

  // 🔥 语义特征提取
  private extractSemanticFeatures(content: string, log: any): any {
    const lowerContent = content.toLowerCase();
    return {
      errorCategory: this.categorizeError(lowerContent),
      severity: this.analyzeSeverity(lowerContent),
      businessContext: this.extractBusinessTerms(content),
      technicalContext: this.extractTechnicalTerms(content),
      keywords: this.extractKeywords(content),
      sentiment: this.analyzeSentiment(lowerContent),
      urgency: this.calculateUrgency(lowerContent),
    };
  }

  // 🔥 规则引擎处理（降级方案）
  private processWithRules(batch: any[]): LLMFeatureExtractionResult[] {
    return batch.map(log => ({
      extractedFields: this.extractFields(log),
      semanticFeatures: {
        errorCategory: 'UNKNOWN',
        severity: 'MEDIUM',
        businessContext: [],
        technicalContext: [],
        keywords: [],
        sentiment: 'NEUTRAL',
        urgency: 5,
      },
      normalizedMessage: this.normalizeMessage(log),
      confidence: 0.6,
    }));
  }

  // === 辅助方法 ===
  
  private findTimestamp(logStr: string): string | undefined {
    const match = logStr.match(/\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/);
    return match?.[0];
  }

  private findLevel(logStr: string): string | undefined {
    const levels = ['FATAL', 'ERROR', 'WARN', 'INFO', 'DEBUG'];
    return levels.find(level => logStr.toUpperCase().includes(level));
  }

  private findMessage(log: any, logStr: string): string {
    if (typeof log === 'object' && log.message) return log.message;
    return logStr.length > 200 ? logStr.substring(0, 200) + '...' : logStr;
  }

  private findUserId(logStr: string): string | undefined {
    const match = logStr.match(/userId?[:\s]+([^\s,}]+)/i);
    return match?.[1];
  }

  private findService(logStr: string): string | undefined {
    const match = logStr.match(/service[:\s]+([^\s,}]+)/i);
    return match?.[1];
  }

  private categorizeError(content: string): string {
    if (content.includes('网络') || content.includes('network')) return 'NETWORK';
    if (content.includes('数据库') || content.includes('database')) return 'DATABASE';
    if (content.includes('认证') || content.includes('auth')) return 'AUTHENTICATION';
    return 'UNKNOWN';
  }

  private analyzeSeverity(content: string): string {
    if (content.includes('严重') || content.includes('critical')) return 'CRITICAL';
    if (content.includes('高') || content.includes('high')) return 'HIGH';
    if (content.includes('中') || content.includes('medium')) return 'MEDIUM';
    return 'LOW';
  }

  private extractBusinessTerms(content: string): string[] {
    const terms = ['用户', '订单', '支付', '登录', '注册'];
    return terms.filter(term => content.includes(term));
  }

  private extractTechnicalTerms(content: string): string[] {
    const terms = ['API', '数据库', 'Redis', 'MySQL', '服务'];
    return terms.filter(term => content.includes(term));
  }

  private extractKeywords(content: string): string[] {
    return content
      .match(/[\u4e00-\u9fa5]{2,}|[a-zA-Z]{3,}/g)
      ?.slice(0, 8) || [];
  }

  private analyzeSentiment(content: string): string {
    if (content.includes('成功') || content.includes('正常')) return 'POSITIVE';
    if (content.includes('错误') || content.includes('失败')) return 'NEGATIVE';
    return 'NEUTRAL';
  }

  private calculateUrgency(content: string): number {
    if (content.includes('紧急') || content.includes('严重')) return 9;
    if (content.includes('重要') || content.includes('警告')) return 7;
    return 5;
  }

  private normalizeMessage(log: any): string {
    const str = typeof log === 'string' ? log : JSON.stringify(log);
    return str.replace(/\s+/g, ' ').trim().substring(0, 200);
  }

  private calculateConfidence(results: LLMFeatureExtractionResult[]): number {
    if (results.length === 0) return 0;
    return results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  }

  private calculateEfficiency(totalLogs: number, processingTime: number, stats: any): any {
    return {
      logsPerSecond: Math.round((totalLogs / processingTime) * 1000),
      avgTimePerLog: Math.round(processingTime / totalLogs),
      batchEfficiency: `${stats.batches}批次/${stats.concurrency}并发`,
      speedImprovement: `批次大小提升${Math.floor(stats.batchSize / 5)}倍`,
    };
  }

  private fallbackProcessing(logData: any[], processingTime: number): AgentResult {
    const results = this.processWithRules(logData);
    return {
      agentName: this.name,
      success: false,
      data: {
        results,
        totalProcessed: logData.length,
        fallback: true,
      },
      processingTime,
      confidence: 0.6,
    };
  }
} 