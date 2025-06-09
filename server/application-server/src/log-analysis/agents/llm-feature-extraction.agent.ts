import { Injectable, Logger } from '@nestjs/common';
import { Agent, AgentContext, AgentResult } from '../services/agent-orchestrator.service';
import { EmbeddingService } from '../../ai/services/embedding.service';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';

export interface LLMFeatureExtractionResult {
  extractedFields: {
    timestamp?: string;
    level?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
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
    errorCategory: 'NETWORK' | 'DATABASE' | 'AUTHENTICATION' | 'BUSINESS_LOGIC' | 'SYSTEM' | 'UNKNOWN';
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
export class LLMFeatureExtractionAgent implements Agent {
  readonly name = 'LLMFeatureExtractionAgent';
  readonly version = '2.0.0';
  readonly capabilities = [
    'adaptive_field_extraction',
    'semantic_understanding', 
    'format_normalization',
    'intelligent_categorization',
    'context_awareness'
  ];
  
  private readonly logger = new Logger(LLMFeatureExtractionAgent.name);
  private openaiClient: OpenAI | null = null;

  constructor(
    private readonly embeddingService: EmbeddingService,
    private readonly configService: ConfigService,
  ) {
    this.initializeOpenAI();
  }

  private initializeOpenAI(): void {
    try {
      const apiKey = this.configService.get('OPENAI_API_KEY');
      if (apiKey) {
        this.openaiClient = new OpenAI({
          apiKey,
          baseURL: 'https://api.openai.com/v1',
        });
        this.logger.log('LLM特征提取 - OpenAI客户端初始化成功');
      } else {
        this.logger.warn('未配置OpenAI API Key，将使用规则引擎');
      }
    } catch (error) {
      this.logger.error('OpenAI客户端初始化失败:', error.message);
    }
  }

  async execute(logData: any[], context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    this.logger.debug(`开始LLM智能特征提取: ${context.taskId}`);

    try {
      const results: LLMFeatureExtractionResult[] = [];

      // 批量处理（减少API调用）
      const batches = this.createBatches(logData, 5);
      
      for (const batch of batches) {
        const batchResults = await this.processBatch(batch);
        results.push(...batchResults);
      }

      const aggregatedFeatures = this.aggregateFeatures(results);
      const processingTime = Date.now() - startTime;

      return {
        agentName: this.name,
        success: true,
        data: {
          individualResults: results,
          aggregatedFeatures,
          totalProcessed: logData.length,
          llmEnabled: this.openaiClient !== null,
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

  // 批量处理日志
  private async processBatch(logEntries: any[]): Promise<LLMFeatureExtractionResult[]> {
    if (this.openaiClient) {
      return await this.processWithLLM(logEntries);
    } else {
      return this.processWithRules(logEntries);
    }
  }

  // 使用LLM处理
  private async processWithLLM(logEntries: any[]): Promise<LLMFeatureExtractionResult[]> {
    const prompt = this.buildLLMPrompt(logEntries);
    
    try {
      const response = await this.openaiClient!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `你是专业的日志分析专家。从各种格式的日志中提取结构化信息。

字段映射规则：
- timestamp/time/ts/dt -> timestamp
- level/lvl/severity/sev -> level  
- message/msg/desc/text -> message
- source/src/logger -> source
- service/svc/app -> service
- user/uid/userid -> userId
- session/sess/sessionid -> sessionId
- response_time/duration -> responseTime
- error_code/errcode -> errorCode

错误分类：NETWORK, DATABASE, AUTHENTICATION, BUSINESS_LOGIC, SYSTEM, UNKNOWN

返回JSON数组格式。`
          },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.1,
      });

      return this.parseLLMResponse(response.choices[0]?.message?.content || '', logEntries);
      
    } catch (error) {
      this.logger.warn(`LLM处理失败，降级: ${error.message}`);
      return this.processWithRules(logEntries);
    }
  }

  // 构建LLM提示词
  private buildLLMPrompt(logEntries: any[]): string {
    const examples = logEntries.slice(0, 3).map((log, index) => {
      const logStr = typeof log === 'string' ? log : JSON.stringify(log);
      return `Log ${index + 1}: ${logStr}`;
    }).join('\n\n');

    return `分析日志，提取结构化信息：

${examples}

返回JSON数组，每条日志包含：
{
  "extractedFields": {"timestamp": "", "level": "", "message": "", "source": "", "service": "", "userId": "", "errorCode": ""},
  "semanticFeatures": {"errorCategory": "", "severity": "", "keywords": [], "sentiment": "", "urgency": 0.5},
  "confidence": 0.8
}`;
  }

  // 解析LLM响应
  private parseLLMResponse(content: string, originalLogs: any[]): LLMFeatureExtractionResult[] {
    try {
      const cleanContent = content.replace(/```json\s*|\s*```/g, '').trim();
      const results = JSON.parse(cleanContent);
      
      if (Array.isArray(results)) {
        return results.map(result => ({
          extractedFields: result.extractedFields || {},
          semanticFeatures: {
            errorCategory: result.semanticFeatures?.errorCategory || 'UNKNOWN',
            severity: result.semanticFeatures?.severity || 'LOW',
            businessContext: result.semanticFeatures?.businessContext || [],
            technicalContext: result.semanticFeatures?.technicalContext || [],
            keywords: result.semanticFeatures?.keywords || [],
            sentiment: result.semanticFeatures?.sentiment || 'NEUTRAL',
            urgency: result.semanticFeatures?.urgency || 0.0,
          },
          normalizedMessage: result.normalizedMessage || '',
          confidence: result.confidence || 0.8,
        }));
      }
    } catch (error) {
      this.logger.warn(`解析LLM响应失败: ${error.message}`);
    }
    
    return this.processWithRules(originalLogs);
  }

  // 规则引擎处理
  private processWithRules(logEntries: any[]): LLMFeatureExtractionResult[] {
    return logEntries.map(log => this.extractWithRules(log));
  }

  // 智能字段提取
  private extractWithRules(log: any): LLMFeatureExtractionResult {
    const logStr = typeof log === 'string' ? log : JSON.stringify(log);
    const logObj = typeof log === 'object' ? log : {};

    const extractedFields: any = {
      timestamp: this.smartExtractField(log, logStr, ['timestamp', 'time', 'ts', 'dt']),
      level: this.smartExtractLevel(log, logStr),
      message: this.smartExtractField(log, logStr, ['message', 'msg', 'desc', 'text']),
      source: this.smartExtractField(log, logStr, ['source', 'src', 'logger']),
      service: this.smartExtractField(log, logStr, ['service', 'svc', 'app']),
      userId: this.smartExtractField(log, logStr, ['user', 'uid', 'userid', 'user_id']),
      sessionId: this.smartExtractField(log, logStr, ['session', 'sess', 'sessionid']),
      responseTime: this.smartExtractNumber(log, logStr, ['response_time', 'duration', 'latency']),
      errorCode: this.smartExtractField(log, logStr, ['error_code', 'errcode', 'code']),
    };

    const message = extractedFields.message || logStr;
    
    return {
      extractedFields,
      semanticFeatures: {
        errorCategory: this.categorizeError(message),
        severity: this.analyzeSeverity(extractedFields.level, message),
        businessContext: this.extractContext(message, ['order', 'payment', 'user', 'product']),
        technicalContext: this.extractContext(message, ['api', 'database', 'network', 'system']),
        keywords: this.extractKeywords(message),
        sentiment: this.analyzeSentiment(message),
        urgency: this.calculateUrgency(extractedFields.level, message),
      },
      normalizedMessage: this.normalizeMessage(message),
      confidence: 0.7,
    };
  }

  // 智能字段提取
  private smartExtractField(log: any, logStr: string, fieldNames: string[]): string | undefined {
    // 首先尝试对象字段
    for (const field of fieldNames) {
      if (log[field]) return log[field].toString();
    }

    // 然后尝试从字符串提取
    for (const field of fieldNames) {
      const pattern = new RegExp(`${field}[\\s:]+([^\\s,]+)`, 'i');
      const match = logStr.match(pattern);
      if (match) return match[1];
    }

    // 特殊模式匹配
    if (fieldNames.includes('timestamp')) {
      const timeMatch = logStr.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      if (timeMatch) return timeMatch[0];
    }

    if (fieldNames.includes('source')) {
      const sourceMatch = logStr.match(/\[([^\]]+)\]/);
      if (sourceMatch) return sourceMatch[1];
    }

    return undefined;
  }

  private smartExtractLevel(log: any, logStr: string): string | undefined {
    const levelFields = ['level', 'lvl', 'severity', 'sev'];
    
    for (const field of levelFields) {
      if (log[field]) return log[field].toString().toUpperCase();
    }

    const levelMatch = logStr.match(/\b(DEBUG|INFO|WARN|WARNING|ERROR|FATAL)\b/i);
    return levelMatch ? levelMatch[1].toUpperCase() : undefined;
  }

  private smartExtractNumber(log: any, logStr: string, fieldNames: string[]): number | undefined {
    for (const field of fieldNames) {
      if (log[field] && !isNaN(Number(log[field]))) {
        return Number(log[field]);
      }
    }

    const timeMatch = logStr.match(/(\d+)ms/);
    return timeMatch ? parseInt(timeMatch[1]) : undefined;
  }

  // 语义分析方法
  private categorizeError(message: string): any {
    const lower = message.toLowerCase();
    if (lower.includes('network') || lower.includes('timeout')) return 'NETWORK';
    if (lower.includes('database') || lower.includes('sql')) return 'DATABASE';
    if (lower.includes('auth') || lower.includes('login')) return 'AUTHENTICATION';
    if (lower.includes('business') || lower.includes('validation')) return 'BUSINESS_LOGIC';
    if (lower.includes('system') || lower.includes('memory')) return 'SYSTEM';
    return 'UNKNOWN';
  }

  private analyzeSeverity(level?: string, message?: string): any {
    if (level === 'FATAL' || level === 'ERROR') return 'HIGH';
    if (level === 'WARN') return 'MEDIUM';
    return 'LOW';
  }

  private extractContext(message: string, terms: string[]): string[] {
    return terms.filter(term => message.toLowerCase().includes(term));
  }

  private extractKeywords(message: string): string[] {
    return message.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5);
  }

  private analyzeSentiment(message: string): any {
    const negative = ['error', 'fail', 'crash', 'timeout'];
    const positive = ['success', 'complete', 'ok'];
    
    const negCount = negative.filter(word => message.toLowerCase().includes(word)).length;
    const posCount = positive.filter(word => message.toLowerCase().includes(word)).length;
    
    if (negCount > posCount) return 'NEGATIVE';
    if (posCount > negCount) return 'POSITIVE';
    return 'NEUTRAL';
  }

  private calculateUrgency(level?: string, message?: string): number {
    let urgency = 0.0;
    if (level === 'ERROR' || level === 'FATAL') urgency += 0.5;
    if (message && message.toLowerCase().includes('critical')) urgency += 0.3;
    return Math.min(urgency, 1.0);
  }

  private normalizeMessage(message: string): string {
    return message
      .replace(/\d+/g, '[NUM]')
      .replace(/[a-fA-F0-9-]{36}/g, '[UUID]')
      .trim();
  }

  // 辅助方法
  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  private aggregateFeatures(results: LLMFeatureExtractionResult[]): any {
    const categories = new Map();
    results.forEach(r => {
      const cat = r.semanticFeatures.errorCategory;
      categories.set(cat, (categories.get(cat) || 0) + 1);
    });

    return {
      errorCategoryDistribution: Object.fromEntries(categories),
      totalLogs: results.length,
      avgConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
    };
  }

  private calculateOverallConfidence(results: LLMFeatureExtractionResult[]): number {
    if (results.length === 0) return 0;
    return results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  }

  private async fallbackExtraction(logData: any[]): Promise<any> {
    return {
      mode: 'fallback',
      processedLogs: logData.length,
      message: '使用规则引擎处理'
    };
  }
} 