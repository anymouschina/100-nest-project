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

// 🔥 新增：批次处理配置接口
export interface BatchProcessingConfig {
  baseBatchSize: number;
  maxBatchSize: number;
  minBatchSize: number;
  maxConcurrency: number;
  intelligentSampling: boolean;
  prioritizedProcessing: boolean;
}

// 🔥 新增：日志分层接口
export interface LogTier {
  priority: number;
  logs: any[];
  batchSize: number;
  description: string;
}

@Injectable()
export class LLMFeatureExtractionAgent implements Agent {
  readonly name = 'LLMFeatureExtractionAgent';
  readonly version = '3.0.0'; // 升级版本号
  readonly capabilities = [
    'adaptive_field_extraction',
    'semantic_understanding',
    'format_normalization',
    'intelligent_categorization',
    'context_awareness',
    'dynamic_batch_processing', // 🔥 新增能力
    'parallel_processing',      // 🔥 新增能力
    'large_scale_optimization', // 🔥 新增能力
  ];

  private readonly logger = new Logger(LLMFeatureExtractionAgent.name);
  private readonly batchProcessor = new BatchProcessor(DEFAULT_CONFIG);
  // 添加批次配置属性
  private readonly batchConfig: BatchProcessingConfig = {
    baseBatchSize: 35,
    maxBatchSize: 150,
    minBatchSize: 10,
    maxConcurrency: 10,
    intelligentSampling: true,
    prioritizedProcessing: true,
  };

  constructor(private readonly aiProviderService: LangChainAIProviderService) {}

  async execute(logData: any[], context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    this.logger.debug(
      `🔥 开始优化LLM特征提取: ${context.taskId}, 日志数量: ${logData.length}`,
    );

    try {
      // 🔥 获取处理统计信息
      const stats = this.batchProcessor.getProcessingStats(logData.length);
      this.logger.log(
        `处理策略: ${stats.strategy}, 批次大小: ${stats.batchSize}, 
         预计批次数: ${stats.batches}, 并发数: ${stats.concurrency}, 
         预计时间: ${stats.estimatedTime}`,
      );

      let results: LLMFeatureExtractionResult[] = [];

      // 🔥 根据数据量选择最优处理策略
      if (stats.strategy === 'stratified') {
        // 大数据量: 分层处理
        results = await this.processWithStratification(logData);
      } else {
        // 中小数据量: 并行批次处理
        results = await this.processWithBatching(logData);
      }

      const aggregatedFeatures = this.aggregateFeatures(results);
      const processingTime = Date.now() - startTime;

      this.logger.log(
        `✅ LLM特征提取完成: 处理${logData.length}条日志, 
         实际耗时${processingTime}ms, 生成${results.length}个结果`,
      );

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
        },
        processingTime,
        confidence: this.calculateOverallConfidence(results),
      };
    } catch (error) {
      this.logger.error('LLM特征提取失败', error.stack);
      return {
        agentName: this.name,
        success: false,
        data: await this.fallbackExtraction(logData),
        processingTime: Date.now() - startTime,
        confidence: 0.6,
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }

  // 🔥 新增：分层处理方法
  private async processWithStratification(logData: any[]): Promise<LLMFeatureExtractionResult[]> {
    const { tier1, tier2, tier3 } = this.batchProcessor.stratifyLogs(logData);
    const results: LLMFeatureExtractionResult[] = [];

    // 并行处理各层级
    const tierPromises = [
      this.processLogTier(tier1, '关键错误层'),
      this.processLogTier(tier2, '警告信息层'),
      this.processLogTier(tier3, '一般信息层'),
    ];

    const tierResults = await Promise.all(tierPromises);
    return tierResults.flat();
  }

  // 🔥 新增：批次处理方法
  private async processWithBatching(logData: any[]): Promise<LLMFeatureExtractionResult[]> {
    const batches = this.batchProcessor.createBatches(logData);
    
    return await this.batchProcessor.processInParallel(
      batches,
      async (batch: any[], index: number) => {
        this.logger.debug(`处理批次 ${index + 1}/${batches.length}`);
        return await this.processBatch(batch);
      },
    );
  }

  // 🔥 新增：层级处理方法
  private async processLogTier(logs: any[], tierName: string): Promise<LLMFeatureExtractionResult[]> {
    if (logs.length === 0) return [];
    
    this.logger.debug(`处理${tierName}: ${logs.length}条日志`);
    const batches = this.batchProcessor.createBatches(logs);
    
    return await this.batchProcessor.processInParallel(
      batches,
      async (batch: any[]) => await this.processBatch(batch),
    );
  }

  // 🔥 优化LLM提示词生成
  private buildLLMPrompt(logEntries: any[]): string {
    const maxExamples = Math.min(logEntries.length, 8); 
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

  // 🔥 新增：智能采样
  private intelligentSample(logs: any[], targetSize: number): any[] {
    if (logs.length <= targetSize) return logs;

    const sampled: any[] = [];
    const step = Math.floor(logs.length / targetSize);
    
    // 均匀采样 + 关键日志保留
    for (let i = 0; i < logs.length; i += step) {
      sampled.push(logs[i]);
      if (sampled.length >= targetSize) break;
    }

    // 确保包含一些关键日志
    const criticalLogs = logs.filter(log => {
      const logStr = typeof log === 'string' ? log : JSON.stringify(log);
      return logStr.toLowerCase().includes('error') || 
             logStr.toLowerCase().includes('fail') || 
             logStr.toLowerCase().includes('timeout');
    });

    // 替换一些普通日志为关键日志
    const replacementCount = Math.min(criticalLogs.length, Math.floor(targetSize * 0.3));
    for (let i = 0; i < replacementCount; i++) {
      if (i < sampled.length) {
        sampled[i] = criticalLogs[i];
      }
    }

    return sampled.slice(0, targetSize);
  }

  // 🔥 新增：并行批次处理
  private async processWithParallelBatches(logData: any[]): Promise<LLMFeatureExtractionResult[]> {
    const optimalBatchSize = this.calculateOptimalBatchSize(logData.length);
    const batches = this.createDynamicBatches(logData, optimalBatchSize);
    
    return await this.processParallelBatches(batches, 'ParallelProcessing');
  }

  // 🔥 新增：优化的批次处理
  private async processWithOptimizedBatches(logData: any[]): Promise<LLMFeatureExtractionResult[]> {
    const batchSize = Math.max(
      this.batchConfig.minBatchSize,
      Math.min(this.batchConfig.baseBatchSize, logData.length)
    );
    
    const batches = this.createDynamicBatches(logData, batchSize);
    const results: LLMFeatureExtractionResult[] = [];

    for (const batch of batches) {
      const batchResults = await this.processBatch(batch);
      results.push(...batchResults);
    }

    return results;
  }

  // 🔥 新增：并行批次执行器
  private async processParallelBatches(
    batches: any[][],
    context: string
  ): Promise<LLMFeatureExtractionResult[]> {
    const results: LLMFeatureExtractionResult[] = [];
    
    // 控制并发数量
    for (let i = 0; i < batches.length; i += this.batchConfig.maxConcurrency) {
      const batchGroup = batches.slice(i, i + this.batchConfig.maxConcurrency);
      
      this.logger.debug(`${context}: 并行处理批次组 ${Math.floor(i / this.batchConfig.maxConcurrency) + 1}/${Math.ceil(batches.length / this.batchConfig.maxConcurrency)}`);
      
      const groupPromises = batchGroup.map(async (batch, index) => {
        try {
          return await this.processBatch(batch);
        } catch (error) {
          this.logger.warn(`批次 ${i + index + 1} 处理失败: ${error.message}`);
          return this.processWithRules(batch); // 降级处理
        }
      });

      const groupResults = await Promise.all(groupPromises);
      results.push(...groupResults.flat());
    }

    return results;
  }

  // 🔥 新增：动态批次大小计算
  private calculateOptimalBatchSize(totalLogs: number): number {
    if (totalLogs < 50) {
      return this.batchConfig.minBatchSize;
    } else if (totalLogs < 200) {
      return this.batchConfig.baseBatchSize;
    } else if (totalLogs < 1000) {
      return this.batchConfig.baseBatchSize * 2;
    } else {
      return this.batchConfig.maxBatchSize;
    }
  }

  // 🔥 新增：动态批次创建
  private createDynamicBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  // 🔥 新增：辅助方法
  private extractLogLevel(log: any, logStr: string): string {
    return this.smartExtractLevel(log, logStr) || 'INFO';
  }

  private isImportantInfo(logStr: string): boolean {
    const importantKeywords = [
      'user', 'login', 'logout', 'payment', 'order', 
      'critical', 'important', 'significant', 'alert'
    ];
    const lowerStr = logStr.toLowerCase();
    return importantKeywords.some(keyword => lowerStr.includes(keyword));
  }

  private getProcessingStrategy(logCount: number): string {
    if (logCount > 1000) return 'large_dataset_stratified';
    if (logCount > 100) return 'medium_dataset_parallel';
    return 'small_dataset_standard';
  }

  private getBatchingStats(logCount: number): any {
    const strategy = this.getProcessingStrategy(logCount);
    const optimalBatchSize = this.calculateOptimalBatchSize(logCount);
    const estimatedBatches = Math.ceil(logCount / optimalBatchSize);
    
    return {
      strategy,
      optimalBatchSize,
      estimatedBatches,
      maxConcurrency: this.batchConfig.maxConcurrency,
      estimatedLLMCalls: estimatedBatches,
      estimatedProcessingTime: `${Math.ceil(estimatedBatches / this.batchConfig.maxConcurrency * 2)}秒`,
    };
  }

  // 批量处理日志
  private async processBatch(
    logEntries: any[],
  ): Promise<LLMFeatureExtractionResult[]> {
    try {
      return await this.processWithLLM(logEntries);
    } catch (error) {
      this.logger.warn(`LLM处理失败，降级到规则引擎: ${error.message}`);
      return this.processWithRules(logEntries);
    }
  }

  // 使用LLM处理
  private async processWithLLM(
    logEntries: any[],
  ): Promise<LLMFeatureExtractionResult[]> {
    const prompt = this.buildLLMPrompt(logEntries);

    const systemPrompt = `你是专业的日志分析专家。请用中文分析日志内容，重点关注：

1. 错误模式识别 - 网络、数据库、认证、业务逻辑、系统类型
2. 严重程度评估 - 根据影响范围和紧急程度判断
3. 用户行为分析 - 识别异常操作模式和重复行为
4. 技术指标评估 - 响应时间、错误率、系统状态
5. 情感倾向分析 - 正面、负面、中性

请用自然语言描述你的发现，包括问题描述、原因分析和建议措施。`;

    try {
      // 使用AI提供商服务（优先Ollama分析模型）
      const responseContent = await this.aiProviderService.generateCompletion(
        prompt,
        {
          useAnalysisModel: true,
          systemPrompt,
          temperature: 0.1,
          maxTokens: 1500,
        },
      );

      return this.parseLLMResponse(responseContent, logEntries);
    } catch (error) {
      this.logger.warn(`LLM处理失败: ${error.message}`);
      throw error;
    }
  }

  // 解析LLM响应 - 优化为支持字符串响应
  private parseLLMResponse(
    content: string,
    originalLogs: any[],
  ): LLMFeatureExtractionResult[] {
    try {
      // 🔥 优先尝试解析字符串响应，而非强制要求JSON
      this.logger.debug(`LLM原始响应: ${content.substring(0, 200)}...`);
      
      // 方法1: 尝试直接解析JSON
      let parsed: any;
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/) || content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      } catch (jsonError) {
        this.logger.debug(`JSON解析失败，转为字符串分析: ${jsonError.message}`);
      }

      // 方法2: 如果JSON解析失败，使用字符串分析
      if (!parsed) {
        return this.parseStringResponse(content, originalLogs);
      }

      // 方法3: 成功解析JSON，格式化结果
      const results = Array.isArray(parsed) ? parsed : [parsed];
      return results.map((result, index) => ({
        extractedFields: result.extractedFields || {},
        semanticFeatures: {
          errorCategory: result.semanticFeatures?.errorCategory || 'UNKNOWN',
          severity: result.semanticFeatures?.severity || 'MEDIUM',
          businessContext: result.semanticFeatures?.businessContext || [],
          technicalContext: result.semanticFeatures?.technicalContext || [],
          keywords: result.semanticFeatures?.keywords || [],
          sentiment: result.semanticFeatures?.sentiment || 'NEUTRAL',
          urgency: result.semanticFeatures?.urgency || 5,
        },
        normalizedMessage:
          result.normalizedMessage ||
          result.extractedFields?.message ||
          'Unknown',
        confidence: result.confidence || 0.8,
      }));
    } catch (error) {
      this.logger.warn(`解析LLM响应失败: ${error.message}`);
      // 降级到规则处理
      return this.processWithRules(originalLogs);
    }
  }

  // 🔥 新增：解析字符串响应的方法
  private parseStringResponse(
    content: string,
    originalLogs: any[],
  ): LLMFeatureExtractionResult[] {
    this.logger.debug('使用字符串解析模式处理LLM响应');
    
    const results: LLMFeatureExtractionResult[] = [];
    
    // 按行分析，尝试提取关键信息
    const lines = content.split('\n').filter(line => line.trim());
    
    for (let i = 0; i < originalLogs.length; i++) {
      const log = originalLogs[i];
      const logStr = typeof log === 'string' ? log : JSON.stringify(log);
      
      // 从LLM响应中提取对应的分析结果
      const analysis = this.extractAnalysisFromText(content, logStr, i);
      
      // 结合规则引擎和LLM文本分析
      const ruleResult = this.extractWithRules(log);
      
      // 合并结果，LLM分析为主，规则引擎补充
      results.push({
        extractedFields: {
          ...ruleResult.extractedFields,
          ...analysis.extractedFields,
        },
        semanticFeatures: {
          ...ruleResult.semanticFeatures,
          ...analysis.semanticFeatures,
        },
        normalizedMessage: analysis.normalizedMessage || ruleResult.normalizedMessage,
        confidence: Math.max(analysis.confidence, ruleResult.confidence - 0.1),
      });
    }
    
    return results;
  }

  // 🔥 新增：从文本中提取分析结果
  private extractAnalysisFromText(content: string, logStr: string, index: number): Partial<LLMFeatureExtractionResult> {
    const result: Partial<LLMFeatureExtractionResult> = {
      extractedFields: {},
      semanticFeatures: {
        errorCategory: 'UNKNOWN' as const,
        severity: 'MEDIUM' as const,
        businessContext: [],
        technicalContext: [],
        keywords: [],
        sentiment: 'NEUTRAL' as const,
        urgency: 5,
      },
      confidence: 0.6,
    };

    // 提取错误类别
    if (content.toLowerCase().includes('network') || content.toLowerCase().includes('网络')) {
      result.semanticFeatures.errorCategory = 'NETWORK';
    } else if (content.toLowerCase().includes('database') || content.toLowerCase().includes('数据库')) {
      result.semanticFeatures.errorCategory = 'DATABASE';
    } else if (content.toLowerCase().includes('auth') || content.toLowerCase().includes('登录') || content.toLowerCase().includes('认证')) {
      result.semanticFeatures.errorCategory = 'AUTHENTICATION';
    } else if (content.toLowerCase().includes('business') || content.toLowerCase().includes('业务')) {
      result.semanticFeatures.errorCategory = 'BUSINESS_LOGIC';
    } else if (content.toLowerCase().includes('system') || content.toLowerCase().includes('系统')) {
      result.semanticFeatures.errorCategory = 'SYSTEM';
    }

    // 提取严重程度
    if (content.toLowerCase().includes('critical') || content.toLowerCase().includes('严重') || content.toLowerCase().includes('关键')) {
      result.semanticFeatures.severity = 'CRITICAL';
    } else if (content.toLowerCase().includes('high') || content.toLowerCase().includes('高')) {
      result.semanticFeatures.severity = 'HIGH';
    } else if (content.toLowerCase().includes('medium') || content.toLowerCase().includes('中等')) {
      result.semanticFeatures.severity = 'MEDIUM';
    } else if (content.toLowerCase().includes('low') || content.toLowerCase().includes('低')) {
      result.semanticFeatures.severity = 'LOW';
    }

    // 提取关键词
    const keywords = [];
    const keywordPatterns = [
      /错误|error/gi,
      /登录|login/gi,
      /用户|user/gi,
      /网络|network/gi,
      /数据库|database/gi,
      /超时|timeout/gi,
      /失败|fail/gi,
      /成功|success/gi,
    ];

    keywordPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        keywords.push(...matches.map(m => m.toLowerCase()));
      }
    });

    result.semanticFeatures.keywords = [...new Set(keywords)];

    // 情感分析
    if (content.toLowerCase().includes('error') || content.toLowerCase().includes('错误') || 
        content.toLowerCase().includes('fail') || content.toLowerCase().includes('失败')) {
      result.semanticFeatures.sentiment = 'NEGATIVE';
    } else if (content.toLowerCase().includes('success') || content.toLowerCase().includes('成功') ||
               content.toLowerCase().includes('ok') || content.toLowerCase().includes('正常')) {
      result.semanticFeatures.sentiment = 'POSITIVE';
    } else {
      result.semanticFeatures.sentiment = 'NEUTRAL';
    }

    // 提取紧急程度
    if (result.semanticFeatures.severity === 'CRITICAL') {
      result.semanticFeatures.urgency = 9;
    } else if (result.semanticFeatures.severity === 'HIGH') {
      result.semanticFeatures.urgency = 7;
    } else if (result.semanticFeatures.severity === 'MEDIUM') {
      result.semanticFeatures.urgency = 5;
    } else {
      result.semanticFeatures.urgency = 3;
    }

    return result;
  }

  // 规则引擎处理（备用方案）
  private processWithRules(logEntries: any[]): LLMFeatureExtractionResult[] {
    return logEntries.map((log) => this.extractWithRules(log));
  }

  private extractWithRules(log: any): LLMFeatureExtractionResult {
    const logStr = typeof log === 'string' ? log : JSON.stringify(log);

    // 基础字段提取
    const extractedFields = {
      timestamp: this.smartExtractField(log, logStr, [
        'timestamp',
        'time',
        'ts',
        'dt',
        'date',
      ]),
      level: this.smartExtractLevel(log, logStr),
      message: this.smartExtractField(log, logStr, [
        'message',
        'msg',
        'desc',
        'text',
        'description',
      ]),
      source: this.smartExtractField(log, logStr, [
        'source',
        'src',
        'logger',
        'component',
      ]),
      service: this.smartExtractField(log, logStr, [
        'service',
        'svc',
        'app',
        'application',
      ]),
      userId: this.smartExtractField(log, logStr, [
        'user',
        'uid',
        'userid',
        'user_id',
      ]),
      sessionId: this.smartExtractField(log, logStr, [
        'session',
        'sess',
        'sessionid',
        'session_id',
      ]),
      responseTime: this.smartExtractNumber(log, logStr, [
        'response_time',
        'duration',
        'elapsed',
        'latency',
      ]),
      errorCode: this.smartExtractField(log, logStr, [
        'error_code',
        'errcode',
        'code',
        'status_code',
      ]),
    };

    // 语义特征分析
    const message = extractedFields.message || logStr;
    const semanticFeatures = {
      errorCategory: this.categorizeError(message),
      severity: this.analyzeSeverity(extractedFields.level, message),
      businessContext: this.extractContext(message, [
        'order',
        'payment',
        'user',
        'product',
        'cart',
      ]),
      technicalContext: this.extractContext(message, [
        'database',
        'network',
        'api',
        'server',
        'cache',
      ]),
      keywords: this.extractKeywords(message),
      sentiment: this.analyzeSentiment(message),
      urgency: this.calculateUrgency(extractedFields.level, message),
    };

    return {
      extractedFields,
      semanticFeatures,
      normalizedMessage: this.normalizeMessage(message),
      confidence: 0.7, // 规则引擎的基础信心度
    };
  }

  // 智能字段提取
  private smartExtractField(
    log: any,
    logStr: string,
    fieldNames: string[],
  ): string | undefined {
    // 从对象属性中查找
    if (typeof log === 'object' && log !== null) {
      for (const fieldName of fieldNames) {
        if (log[fieldName] !== undefined) {
          return String(log[fieldName]);
        }
      }
    }

    // 从字符串中正则匹配
    for (const fieldName of fieldNames) {
      const patterns = [
        new RegExp(`${fieldName}[:\\s=]+([^\\s,}]+)`, 'i'),
        new RegExp(`"${fieldName}"[:\\s]*"([^"]+)"`, 'i'),
        new RegExp(`${fieldName}\\s*=\\s*([^\\s,]+)`, 'i'),
      ];

      for (const pattern of patterns) {
        const match = logStr.match(pattern);
        if (match && match[1]) {
          return match[1].trim();
        }
      }
    }

    return undefined;
  }

  // 智能日志级别提取
  private smartExtractLevel(log: any, logStr: string): string | undefined {
    const levelPatterns = [
      /level[:\s=]+(\w+)/i,
      /\b(DEBUG|INFO|WARN|ERROR|FATAL)\b/i,
      /\[(DEBUG|INFO|WARN|ERROR|FATAL)\]/i,
    ];

    for (const pattern of levelPatterns) {
      const match = logStr.match(pattern);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }

    return undefined;
  }

  // 智能数字字段提取
  private smartExtractNumber(
    log: any,
    logStr: string,
    fieldNames: string[],
  ): number | undefined {
    const value = this.smartExtractField(log, logStr, fieldNames);
    if (value) {
      const num = parseFloat(value);
      return isNaN(num) ? undefined : num;
    }
    return undefined;
  }

  // 错误分类
  private categorizeError(message: string): any {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('network') || lowerMessage.includes('connection'))
      return 'NETWORK';
    if (lowerMessage.includes('database') || lowerMessage.includes('sql'))
      return 'DATABASE';
    if (lowerMessage.includes('auth') || lowerMessage.includes('permission'))
      return 'AUTHENTICATION';
    if (lowerMessage.includes('business') || lowerMessage.includes('validation'))
      return 'BUSINESS_LOGIC';
    if (lowerMessage.includes('system') || lowerMessage.includes('memory'))
      return 'SYSTEM';
    return 'UNKNOWN';
  }

  // 严重性分析
  private analyzeSeverity(level?: string, message?: string): any {
    if (level === 'FATAL' || level === 'ERROR') return 'HIGH';
    if (level === 'WARN') return 'MEDIUM';
    if (message?.toLowerCase().includes('critical')) return 'CRITICAL';
    return 'LOW';
  }

  // 上下文提取
  private extractContext(message: string, terms: string[]): string[] {
    return terms.filter((term) =>
      message.toLowerCase().includes(term.toLowerCase()),
    );
  }

  // 关键词提取
  private extractKeywords(message: string): string[] {
    const words = message
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 3);
    const importantWords = words.filter(
      (word) =>
        !['the', 'and', 'but', 'for', 'with', 'this', 'that'].includes(word),
    );
    return [...new Set(importantWords)].slice(0, 10);
  }

  // 情感分析
  private analyzeSentiment(message: string): any {
    const lowerMessage = message.toLowerCase();
    const negativeWords = ['error', 'fail', 'problem', 'issue', 'crash'];
    const positiveWords = ['success', 'complete', 'ok', 'good', 'working'];

    const negativeCount = negativeWords.filter((word) =>
      lowerMessage.includes(word),
    ).length;
    const positiveCount = positiveWords.filter((word) =>
      lowerMessage.includes(word),
    ).length;

    if (negativeCount > positiveCount) return 'NEGATIVE';
    if (positiveCount > negativeCount) return 'POSITIVE';
    return 'NEUTRAL';
  }

  // 紧急程度计算
  private calculateUrgency(level?: string, message?: string): number {
    let urgency = 5; // 基础值
    if (level === 'FATAL') urgency += 4;
    else if (level === 'ERROR') urgency += 3;
    else if (level === 'WARN') urgency += 1;

    if (message?.toLowerCase().includes('critical')) urgency += 2;
    if (message?.toLowerCase().includes('urgent')) urgency += 2;

    return Math.min(urgency, 10);
  }

  // 消息标准化
  private normalizeMessage(message: string): string {
    return message
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-_.]/g, '')
      .trim()
      .substring(0, 200);
  }

  // 聚合特征
  private aggregateFeatures(results: LLMFeatureExtractionResult[]): any {
    const errorCategories = results.map((r) => r.semanticFeatures.errorCategory);
    const severities = results.map((r) => r.semanticFeatures.severity);

    return {
      totalLogs: results.length,
      errorCategoryDistribution: this.getDistribution(errorCategories),
      severityDistribution: this.getDistribution(severities),
      averageConfidence:
        results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
    };
  }

  private getDistribution(values: string[]): Record<string, number> {
    return values.reduce((acc, value) => {
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  // 计算整体信心度
  private calculateOverallConfidence(
    results: LLMFeatureExtractionResult[],
  ): number {
    if (results.length === 0) return 0;
    return (
      results.reduce((sum, result) => sum + result.confidence, 0) /
      results.length
    );
  }

  // 备用提取方案
  private async fallbackExtraction(logData: any[]): Promise<any> {
    return {
      message: '使用规则引擎进行基础特征提取',
      results: this.processWithRules(logData.slice(0, 10)),
      totalProcessed: Math.min(logData.length, 10),
    };
  }

  // 修复分层策略方法
  private buildLLMPromptStratified(logEntries: any[]): string {
    const tiers: LogTier[] = [
      {
        priority: 1,
        logs: [],
        batchSize: this.batchConfig.maxBatchSize,
        description: '关键错误和异常 (CRITICAL/ERROR)',
      },
      {
        priority: 2,
        logs: [],
        batchSize: this.batchConfig.baseBatchSize * 2,
        description: '警告和重要信息 (WARN/重要INFO)',
      },
      {
        priority: 3,
        logs: [],
        batchSize: this.batchConfig.baseBatchSize * 3,
        description: '一般信息 (INFO/DEBUG/TRACE)',
      },
    ];

    // 分类日志
    logEntries.forEach(log => {
      const logStr = typeof log === 'string' ? log : JSON.stringify(log);
      const level = this.extractLogLevel(log, logStr).toUpperCase();
      
      if (level.includes('ERROR') || level.includes('CRITICAL') || level.includes('SEVERE')) {
        tiers[0].logs.push(log);
      } else if (level.includes('WARN') || this.isImportantInfo(logStr)) {
        tiers[1].logs.push(log);
      } else {
        tiers[2].logs.push(log);
      }
    });

    // 对大量日志进行智能采样
    if (tiers[2].logs.length > 500 && this.batchConfig.intelligentSampling) {
      tiers[2].logs = this.intelligentSample(tiers[2].logs, 200);
    }
    
    return this.buildLLMPrompt(logEntries);
  }
} 