import { Injectable, Logger } from '@nestjs/common';
import { Agent, AgentContext, AgentResult } from '../services/agent-orchestrator.service';

export interface FeatureExtractionResult {
  features: {
    statistical: {
      totalLogs: number;
      errorRate: number;
      warnRate: number;
      avgMessageLength: number;
      uniqueErrors: number;
      logFrequency: number;
    };
    temporal: {
      timeSpan: number;
      peakHours: number[];
      eventDensity: number;
      seasonality: any;
      burstPatterns: any[];
    };
    textual: {
      keywords: string[];
      sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
      complexity: number;
      errorPatterns: string[];
      language: string;
    };
    behavioral: {
      userActionPatterns: any[];
      sessionCharacteristics: any;
      accessPatterns: any[];
      apiUsagePatterns: any[];
    };
    metadata: {
      sources: string[];
      services: string[];
      environments: string[];
      userAgents: string[];
      ipAddresses: string[];
    };
  };
  suspiciousPatterns: boolean;
  featureVector: number[];
  riskIndicators: string[];
}

@Injectable()
export class FeatureExtractionAgent implements Agent {
  readonly name = 'FeatureExtractionAgent';
  readonly version = '1.0.0';
  readonly capabilities = ['statistical_features', 'temporal_features', 'textual_features', 'behavioral_features', 'metadata_features'];
  private readonly logger = new Logger(FeatureExtractionAgent.name);

  /**
   * 执行特征提取
   */
  async execute(logData: any[], context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    this.logger.debug(`开始特征提取分析: ${context.taskId}`);

    try {
      // 1. 统计特征提取
      const statisticalFeatures = this.extractStatisticalFeatures(logData);
      
      // 2. 时序特征提取
      const temporalFeatures = this.extractTemporalFeatures(logData);
      
      // 3. 文本特征提取
      const textualFeatures = this.extractTextualFeatures(logData);
      
      // 4. 行为特征提取
      const behavioralFeatures = this.extractBehavioralFeatures(logData, context);
      
      // 5. 元数据特征提取
      const metadataFeatures = this.extractMetadataFeatures(logData);

      // 6. 生成特征向量
      const featureVector = this.generateFeatureVector({
        statistical: statisticalFeatures,
        temporal: temporalFeatures,
        textual: textualFeatures,
        behavioral: behavioralFeatures,
        metadata: metadataFeatures,
      });

      // 7. 检测可疑模式
      const suspiciousPatterns = this.detectSuspiciousPatterns({
        statistical: statisticalFeatures,
        temporal: temporalFeatures,
        textual: textualFeatures,
        behavioral: behavioralFeatures,
        metadata: metadataFeatures,
      });

      // 8. 识别风险指标
      const riskIndicators = this.identifyRiskIndicators({
        statistical: statisticalFeatures,
        temporal: temporalFeatures,
        textual: textualFeatures,
        behavioral: behavioralFeatures,
        metadata: metadataFeatures,
      });

      const result: FeatureExtractionResult = {
        features: {
          statistical: statisticalFeatures,
          temporal: temporalFeatures,
          textual: textualFeatures,
          behavioral: behavioralFeatures,
          metadata: metadataFeatures,
        },
        suspiciousPatterns,
        featureVector,
        riskIndicators,
      };

      const processingTime = Date.now() - startTime;

      this.logger.debug(`特征提取完成: 提取了 ${featureVector.length} 维特征向量, 耗时: ${processingTime}ms`);

      return {
        agentName: this.name,
        success: true,
        data: result,
        processingTime,
        confidence: this.calculateConfidence(result),
      };

    } catch (error) {
      this.logger.error('特征提取分析失败', error.stack);
      return {
        agentName: this.name,
        success: false,
        data: null,
        error: error.message,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 提取统计特征
   */
  private extractStatisticalFeatures(logData: any[]): any {
    const totalLogs = logData.length;
    const errorLogs = logData.filter(log => log.level === 'ERROR');
    const warnLogs = logData.filter(log => log.level === 'WARN');
    
    const errorRate = totalLogs > 0 ? errorLogs.length / totalLogs : 0;
    const warnRate = totalLogs > 0 ? warnLogs.length / totalLogs : 0;
    
    const messageLengths = logData.map(log => (log.message || '').length);
    const avgMessageLength = messageLengths.length > 0 
      ? messageLengths.reduce((sum, len) => sum + len, 0) / messageLengths.length 
      : 0;

    const uniqueErrors = new Set(errorLogs.map(log => log.message)).size;
    
    // 计算日志频率
    const timeSpan = this.calculateTimeSpan(logData);
    const logFrequency = timeSpan > 0 ? totalLogs / (timeSpan / 1000 / 60) : 0; // logs per minute

    return {
      totalLogs,
      errorRate,
      warnRate,
      avgMessageLength,
      uniqueErrors,
      logFrequency,
    };
  }

  /**
   * 提取时序特征
   */
  private extractTemporalFeatures(logData: any[]): any {
    if (logData.length < 2) {
      return {
        timeSpan: 0,
        peakHours: [],
        eventDensity: 0,
        seasonality: {},
        burstPatterns: [],
      };
    }

    const timestamps = logData.map(log => new Date(log.timestamp));
    const timeSpan = this.calculateTimeSpan(logData);
    
    // 按小时分组统计
    const hourlyDistribution = new Array(24).fill(0);
    timestamps.forEach(ts => {
      hourlyDistribution[ts.getHours()]++;
    });

    // 找出峰值小时
    const avgPerHour = logData.length / 24;
    const peakHours = hourlyDistribution
      .map((count, hour) => ({ hour, count }))
      .filter(item => item.count > avgPerHour * 1.5)
      .map(item => item.hour);

    // 事件密度
    const eventDensity = timeSpan > 0 ? logData.length / (timeSpan / 1000 / 60) : 0;

    // 突发模式检测
    const burstPatterns = this.detectBurstPatterns(logData);

    // 季节性分析（简化版）
    const seasonality = this.analyzeSeasonality(timestamps);

    return {
      timeSpan,
      peakHours,
      eventDensity,
      seasonality,
      burstPatterns,
    };
  }

  /**
   * 提取文本特征
   */
  private extractTextualFeatures(logData: any[]): any {
    const allText = logData.map(log => log.message || '').join(' ');
    
    // 关键词提取
    const keywords = this.extractKeywords(allText);
    
    // 情感分析（简化版）
    const sentiment = this.analyzeSentiment(allText);
    
    // 文本复杂度
    const complexity = this.calculateTextComplexity(allText);
    
    // 错误模式提取
    const errorPatterns = this.extractErrorPatterns(logData);
    
    // 语言检测
    const language = this.detectLanguage(allText);

    return {
      keywords,
      sentiment,
      complexity,
      errorPatterns,
      language,
    };
  }

  /**
   * 提取行为特征
   */
  private extractBehavioralFeatures(logData: any[], context: AgentContext): any {
    // 用户行为模式
    const userActionPatterns = this.extractUserActionPatterns(logData);
    
    // 会话特征
    const sessionCharacteristics = this.analyzeSessionCharacteristics(logData, context);
    
    // 访问模式
    const accessPatterns = this.extractAccessPatterns(logData);
    
    // API使用模式
    const apiUsagePatterns = this.extractApiUsagePatterns(logData);

    return {
      userActionPatterns,
      sessionCharacteristics,
      accessPatterns,
      apiUsagePatterns,
    };
  }

  /**
   * 提取元数据特征
   */
  private extractMetadataFeatures(logData: any[]): any {
    const sources = [...new Set(logData.map(log => log.source).filter(Boolean))];
    const services = [...new Set(logData.map(log => log.metadata?.service).filter(Boolean))];
    const environments = [...new Set(logData.map(log => log.metadata?.environment).filter(Boolean))];
    const userAgents = [...new Set(logData.map(log => log.metadata?.userAgent).filter(Boolean))];
    const ipAddresses = [...new Set(logData.map(log => log.metadata?.ip).filter(Boolean))];

    return {
      sources,
      services,
      environments,
      userAgents,
      ipAddresses,
    };
  }

  /**
   * 生成特征向量
   */
  private generateFeatureVector(features: any): number[] {
    const vector = [];

    // 统计特征
    vector.push(
      features.statistical.totalLogs / 1000, // 归一化
      features.statistical.errorRate,
      features.statistical.warnRate,
      features.statistical.avgMessageLength / 100, // 归一化
      features.statistical.uniqueErrors / 10, // 归一化
      features.statistical.logFrequency / 100, // 归一化
    );

    // 时序特征
    vector.push(
      features.temporal.timeSpan / (24 * 60 * 60 * 1000), // 归一化到天
      features.temporal.peakHours.length / 24,
      features.temporal.eventDensity / 100, // 归一化
      features.temporal.burstPatterns.length / 10, // 归一化
    );

    // 文本特征
    vector.push(
      features.textual.keywords.length / 50, // 归一化
      features.textual.complexity / 10, // 归一化
      features.textual.errorPatterns.length / 20, // 归一化
      features.textual.sentiment === 'POSITIVE' ? 1 : features.textual.sentiment === 'NEGATIVE' ? -1 : 0,
    );

    // 行为特征
    vector.push(
      features.behavioral.userActionPatterns.length / 10, // 归一化
      features.behavioral.accessPatterns.length / 10, // 归一化
      features.behavioral.apiUsagePatterns.length / 10, // 归一化
    );

    // 元数据特征
    vector.push(
      features.metadata.sources.length / 5, // 归一化
      features.metadata.services.length / 5, // 归一化
      features.metadata.environments.length / 3, // 归一化
      features.metadata.userAgents.length / 10, // 归一化
      features.metadata.ipAddresses.length / 10, // 归一化
    );

    return vector;
  }

  /**
   * 检测可疑模式
   */
  private detectSuspiciousPatterns(features: any): boolean {
    // 高错误率
    if (features.statistical.errorRate > 0.3) return true;
    
    // 异常高的日志频率
    if (features.statistical.logFrequency > 1000) return true;
    
    // 大量突发事件
    if (features.temporal.burstPatterns.length > 5) return true;
    
    // 负面情感
    if (features.textual.sentiment === 'NEGATIVE') return true;
    
    // 多个异常来源
    if (features.metadata.sources.length > 10) return true;

    return false;
  }

  /**
   * 识别风险指标
   */
  private identifyRiskIndicators(features: any): string[] {
    const indicators = [];

    if (features.statistical.errorRate > 0.2) {
      indicators.push(`高错误率: ${(features.statistical.errorRate * 100).toFixed(1)}%`);
    }

    if (features.statistical.logFrequency > 500) {
      indicators.push(`异常日志频率: ${features.statistical.logFrequency.toFixed(1)} logs/min`);
    }

    if (features.temporal.burstPatterns.length > 3) {
      indicators.push(`检测到 ${features.temporal.burstPatterns.length} 个突发模式`);
    }

    if (features.textual.errorPatterns.length > 10) {
      indicators.push(`发现 ${features.textual.errorPatterns.length} 种错误模式`);
    }

    if (features.metadata.sources.length > 5) {
      indicators.push(`涉及 ${features.metadata.sources.length} 个日志源`);
    }

    return indicators;
  }

  // ========== 辅助方法 ==========

  private calculateTimeSpan(logData: any[]): number {
    if (logData.length < 2) return 0;
    
    const timestamps = logData.map(log => new Date(log.timestamp).getTime()).sort();
    return timestamps[timestamps.length - 1] - timestamps[0];
  }

  private detectBurstPatterns(logData: any[]): any[] {
    // 简化的突发检测
    const timeWindows = this.groupByTimeWindow(logData, 60000); // 1分钟窗口
    const avgCount = logData.length / timeWindows.length;
    
    return timeWindows.filter(window => window.count > avgCount * 2);
  }

  private analyzeSeasonality(timestamps: Date[]): any {
    // 简化的季节性分析
    const weekdayDistribution = new Array(7).fill(0);
    timestamps.forEach(ts => {
      weekdayDistribution[ts.getDay()]++;
    });

    return {
      weekdayDistribution,
      hasWeekendPattern: weekdayDistribution[0] + weekdayDistribution[6] > 0,
    };
  }

  private extractKeywords(text: string): string[] {
    // 简化的关键词提取
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);

    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);
  }

  private analyzeSentiment(text: string): 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' {
    // 简化的情感分析
    const positiveWords = ['success', 'complete', 'ok', 'good', 'done'];
    const negativeWords = ['error', 'fail', 'exception', 'timeout', 'crash', 'dead'];

    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.reduce((count, word) => 
      count + (lowerText.split(word).length - 1), 0);
    const negativeCount = negativeWords.reduce((count, word) => 
      count + (lowerText.split(word).length - 1), 0);

    if (negativeCount > positiveCount * 2) return 'NEGATIVE';
    if (positiveCount > negativeCount * 2) return 'POSITIVE';
    return 'NEUTRAL';
  }

  private calculateTextComplexity(text: string): number {
    // 简化的复杂度计算：基于单词长度和句子长度
    const words = text.split(/\s+/).filter(word => word.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    const avgWordLength = words.length > 0 
      ? words.reduce((sum, word) => sum + word.length, 0) / words.length 
      : 0;
    const avgSentenceLength = sentences.length > 0 
      ? words.length / sentences.length 
      : 0;

    return (avgWordLength * 0.5 + avgSentenceLength * 0.5) / 2;
  }

  private extractErrorPatterns(logData: any[]): string[] {
    const errorLogs = logData.filter(log => log.level === 'ERROR');
    const patterns = new Set<string>();

    errorLogs.forEach(log => {
      const pattern = this.normalizeErrorMessage(log.message);
      patterns.add(pattern);
    });

    return Array.from(patterns);
  }

  private detectLanguage(text: string): string {
    // 简化的语言检测
    const chineseRegex = /[\u4e00-\u9fff]/;
    return chineseRegex.test(text) ? 'zh' : 'en';
  }

  private extractUserActionPatterns(logData: any[]): any[] {
    // 简化实现
    const userActions = logData.filter(log => log.metadata?.userId);
    const actionTypes = new Map<string, number>();

    userActions.forEach(log => {
      const action = log.metadata?.action || 'unknown';
      actionTypes.set(action, (actionTypes.get(action) || 0) + 1);
    });

    return Array.from(actionTypes.entries()).map(([action, count]) => ({
      action,
      count,
      frequency: count / userActions.length,
    }));
  }

  private analyzeSessionCharacteristics(logData: any[], context: AgentContext): any {
    // 简化实现
    const sessionLogs = logData.filter(log => log.metadata?.sessionId);
    const uniqueSessions = new Set(sessionLogs.map(log => log.metadata.sessionId)).size;

    return {
      totalSessions: uniqueSessions,
      avgLogsPerSession: uniqueSessions > 0 ? sessionLogs.length / uniqueSessions : 0,
      sessionDuration: this.calculateTimeSpan(sessionLogs),
    };
  }

  private extractAccessPatterns(logData: any[]): any[] {
    // 简化实现
    const accessLogs = logData.filter(log => log.metadata?.ip);
    const ipCounts = new Map<string, number>();

    accessLogs.forEach(log => {
      const ip = log.metadata.ip;
      ipCounts.set(ip, (ipCounts.get(ip) || 0) + 1);
    });

    return Array.from(ipCounts.entries()).map(([ip, count]) => ({
      ip,
      count,
      isFrequent: count > accessLogs.length * 0.1,
    }));
  }

  private extractApiUsagePatterns(logData: any[]): any[] {
    // 简化实现
    const apiLogs = logData.filter(log => log.metadata?.endpoint);
    const endpointCounts = new Map<string, number>();

    apiLogs.forEach(log => {
      const endpoint = log.metadata.endpoint;
      endpointCounts.set(endpoint, (endpointCounts.get(endpoint) || 0) + 1);
    });

    return Array.from(endpointCounts.entries()).map(([endpoint, count]) => ({
      endpoint,
      count,
      usage: count / apiLogs.length,
    }));
  }

  private groupByTimeWindow(logData: any[], windowMs: number): any[] {
    const windows = new Map<number, number>();
    
    logData.forEach(log => {
      const timestamp = new Date(log.timestamp).getTime();
      const windowStart = Math.floor(timestamp / windowMs) * windowMs;
      windows.set(windowStart, (windows.get(windowStart) || 0) + 1);
    });

    return Array.from(windows.entries()).map(([timestamp, count]) => ({
      timestamp,
      count,
    }));
  }

  private normalizeErrorMessage(message: string): string {
    // 标准化错误消息模式
    return message
      .replace(/\d+/g, 'NUM')
      .replace(/[a-fA-F0-9-]{36}/g, 'UUID')
      .replace(/\b\w+@\w+\.\w+\b/g, 'EMAIL')
      .replace(/https?:\/\/[^\s]+/g, 'URL')
      .toLowerCase()
      .trim();
  }

  private calculateConfidence(result: FeatureExtractionResult): number {
    // 基于特征完整性计算置信度
    let score = 0;
    let maxScore = 0;

    // 统计特征完整性
    const stats = result.features.statistical;
    if (stats.totalLogs > 0) score += 20;
    if (stats.errorRate >= 0) score += 10;
    if (stats.avgMessageLength > 0) score += 10;
    maxScore += 40;

    // 时序特征完整性
    const temporal = result.features.temporal;
    if (temporal.timeSpan > 0) score += 15;
    if (temporal.peakHours.length > 0) score += 15;
    maxScore += 30;

    // 文本特征完整性
    const textual = result.features.textual;
    if (textual.keywords.length > 0) score += 10;
    if (textual.errorPatterns.length > 0) score += 10;
    maxScore += 20;

    // 其他特征
    if (result.featureVector.length > 0) score += 10;
    maxScore += 10;

    return maxScore > 0 ? score / maxScore : 0;
  }
}
