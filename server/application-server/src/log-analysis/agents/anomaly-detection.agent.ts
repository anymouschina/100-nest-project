import { Injectable, Logger } from '@nestjs/common';
import { Agent, AgentContext, AgentResult } from '../services/agent-orchestrator.service';

export interface AnomalyDetectionResult {
  anomalies: Array<{
    id: string;
    type: 'STATISTICAL' | 'PATTERN' | 'TEMPORAL' | 'BEHAVIORAL';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    affectedLogs: any[];
    confidence: number;
    metrics: {
      threshold: number;
      actualValue: number;
      deviation: number;
    };
  }>;
  summary: {
    totalAnomalies: number;
    criticalCount: number;
    highCount: number;
    overallRiskScore: number;
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

@Injectable()
export class AnomalyDetectionAgent implements Agent {
  readonly name = 'AnomalyDetectionAgent';
  readonly version = '1.0.0';
  readonly capabilities = ['statistical_anomaly', 'pattern_anomaly', 'temporal_anomaly', 'behavioral_anomaly'];
  private readonly logger = new Logger(AnomalyDetectionAgent.name);

  /**
   * 执行异常检测
   */
  async execute(logData: any[], context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    this.logger.debug(`开始异常检测分析: ${context.taskId}`);

    try {
      const anomalies = [];

      // 1. 统计异常检测
      const statisticalAnomalies = await this.detectStatisticalAnomalies(logData);
      anomalies.push(...statisticalAnomalies);

      // 2. 模式异常检测
      const patternAnomalies = await this.detectPatternAnomalies(logData);
      anomalies.push(...patternAnomalies);

      // 3. 时序异常检测
      const temporalAnomalies = await this.detectTemporalAnomalies(logData);
      anomalies.push(...temporalAnomalies);

      // 4. 行为异常检测
      const behavioralAnomalies = await this.detectBehavioralAnomalies(logData, context);
      anomalies.push(...behavioralAnomalies);

      // 生成汇总结果
      const summary = this.generateSummary(anomalies);
      const riskLevel = this.calculateRiskLevel(anomalies);

      const result: AnomalyDetectionResult = {
        anomalies,
        summary,
        riskLevel,
      };

      const processingTime = Date.now() - startTime;

      this.logger.debug(`异常检测完成: 发现 ${anomalies.length} 个异常, 耗时: ${processingTime}ms`);

      return {
        agentName: this.name,
        success: true,
        data: result,
        processingTime,
        confidence: this.calculateOverallConfidence(anomalies),
      };

    } catch (error) {
      this.logger.error('异常检测分析失败', error.stack);
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
      // 简单的健康检查
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 统计异常检测
   */
  private async detectStatisticalAnomalies(logData: any[]): Promise<any[]> {
    const anomalies = [];

    try {
      // 1. 错误率异常
      const errorRate = this.calculateErrorRate(logData);
      if (errorRate > 0.2) { // 超过20%错误率
        anomalies.push({
          id: `stat_error_rate_${Date.now()}`,
          type: 'STATISTICAL',
          severity: errorRate > 0.5 ? 'CRITICAL' : errorRate > 0.3 ? 'HIGH' : 'MEDIUM',
          description: `错误率异常高: ${(errorRate * 100).toFixed(1)}%`,
          affectedLogs: logData.filter(log => log.level === 'ERROR'),
          confidence: 0.9,
          metrics: {
            threshold: 0.2,
            actualValue: errorRate,
            deviation: errorRate - 0.2,
          },
        });
      }

      // 2. 日志频率异常
      const logFrequency = this.calculateLogFrequency(logData);
      if (logFrequency.isAnomalous) {
        anomalies.push({
          id: `stat_frequency_${Date.now()}`,
          type: 'STATISTICAL',
          severity: logFrequency.deviation > 100 ? 'HIGH' : 'MEDIUM',
          description: `日志频率异常: ${logFrequency.actualRate.toFixed(1)} logs/min (正常: ${logFrequency.expectedRate.toFixed(1)})`,
          affectedLogs: logData,
          confidence: 0.8,
          metrics: {
            threshold: logFrequency.expectedRate,
            actualValue: logFrequency.actualRate,
            deviation: logFrequency.deviation,
          },
        });
      }

      // 3. 响应时间异常
      const responseTimeAnomaly = this.detectResponseTimeAnomaly(logData);
      if (responseTimeAnomaly) {
        anomalies.push(responseTimeAnomaly);
      }

    } catch (error) {
      this.logger.warn('统计异常检测失败', error.message);
    }

    return anomalies;
  }

  /**
   * 模式异常检测
   */
  private async detectPatternAnomalies(logData: any[]): Promise<any[]> {
    const anomalies = [];

    try {
      // 1. 异常错误消息模式
      const errorPatterns = this.analyzeErrorPatterns(logData);
      for (const pattern of errorPatterns) {
        if (pattern.isAnomalous) {
          anomalies.push({
            id: `pattern_error_${Date.now()}_${pattern.id}`,
            type: 'PATTERN',
            severity: pattern.frequency > 10 ? 'HIGH' : 'MEDIUM',
            description: `异常错误模式: "${pattern.pattern}" 出现 ${pattern.frequency} 次`,
            affectedLogs: pattern.logs,
            confidence: 0.85,
            metrics: {
              threshold: 3,
              actualValue: pattern.frequency,
              deviation: pattern.frequency - 3,
            },
          });
        }
      }

      // 2. 用户行为模式异常
      const behaviorPatterns = this.analyzeBehaviorPatterns(logData);
      if (behaviorPatterns.isAnomalous) {
        anomalies.push({
          id: `pattern_behavior_${Date.now()}`,
          type: 'PATTERN',
          severity: 'MEDIUM',
          description: `用户行为模式异常: ${behaviorPatterns.description}`,
          affectedLogs: behaviorPatterns.logs,
          confidence: 0.75,
          metrics: {
            threshold: behaviorPatterns.threshold,
            actualValue: behaviorPatterns.actualValue,
            deviation: behaviorPatterns.deviation,
          },
        });
      }

    } catch (error) {
      this.logger.warn('模式异常检测失败', error.message);
    }

    return anomalies;
  }

  /**
   * 时序异常检测
   */
  private async detectTemporalAnomalies(logData: any[]): Promise<any[]> {
    const anomalies = [];

    try {
      // 1. 突发事件检测
      const burstEvents = this.detectBurstEvents(logData);
      for (const burst of burstEvents) {
        anomalies.push({
          id: `temporal_burst_${Date.now()}_${burst.id}`,
          type: 'TEMPORAL',
          severity: burst.intensity > 10 ? 'HIGH' : 'MEDIUM',
          description: `突发事件检测: ${burst.timeWindow} 时间窗口内 ${burst.eventCount} 个事件`,
          affectedLogs: burst.logs,
          confidence: 0.8,
          metrics: {
            threshold: burst.expectedCount,
            actualValue: burst.eventCount,
            deviation: burst.intensity,
          },
        });
      }

      // 2. 时间间隔异常
      const intervalAnomalies = this.detectIntervalAnomalies(logData);
      for (const interval of intervalAnomalies) {
        anomalies.push({
          id: `temporal_interval_${Date.now()}_${interval.id}`,
          type: 'TEMPORAL',
          severity: 'MEDIUM',
          description: `时间间隔异常: ${interval.description}`,
          affectedLogs: interval.logs,
          confidence: 0.7,
          metrics: {
            threshold: interval.expectedInterval,
            actualValue: interval.actualInterval,
            deviation: interval.deviation,
          },
        });
      }

    } catch (error) {
      this.logger.warn('时序异常检测失败', error.message);
    }

    return anomalies;
  }

  /**
   * 行为异常检测
   */
  private async detectBehavioralAnomalies(logData: any[], context: AgentContext): Promise<any[]> {
    const anomalies = [];

    try {
      // 1. 用户会话异常
      const sessionAnomalies = this.detectSessionAnomalies(logData, context.userContext);
      anomalies.push(...sessionAnomalies);

      // 2. API调用模式异常
      const apiAnomalies = this.detectApiCallAnomalies(logData);
      anomalies.push(...apiAnomalies);

      // 3. 数据访问异常
      const dataAccessAnomalies = this.detectDataAccessAnomalies(logData);
      anomalies.push(...dataAccessAnomalies);

    } catch (error) {
      this.logger.warn('行为异常检测失败', error.message);
    }

    return anomalies;
  }

  // ========== 辅助方法 ==========

  private calculateErrorRate(logData: any[]): number {
    const totalLogs = logData.length;
    const errorLogs = logData.filter(log => log.level === 'ERROR').length;
    return totalLogs > 0 ? errorLogs / totalLogs : 0;
  }

  private calculateLogFrequency(logData: any[]): any {
    if (logData.length < 2) return { isAnomalous: false };

    const timestamps = logData.map(log => new Date(log.timestamp).getTime()).sort();
    const timeSpan = (timestamps[timestamps.length - 1] - timestamps[0]) / 1000 / 60; // minutes
    const actualRate = logData.length / timeSpan;
    const expectedRate = 10; // 假设正常频率为每分钟10条

    const deviation = Math.abs(actualRate - expectedRate);
    const isAnomalous = deviation > expectedRate * 0.5; // 偏差超过50%

    return {
      isAnomalous,
      actualRate,
      expectedRate,
      deviation,
    };
  }

  private detectResponseTimeAnomaly(logData: any[]): any | null {
    const responseTimes = logData
      .filter(log => log.metadata?.responseTime)
      .map(log => log.metadata.responseTime);

    if (responseTimes.length === 0) return null;

    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const threshold = 5000; // 5秒阈值

    if (avgResponseTime > threshold) {
      return {
        id: `stat_response_time_${Date.now()}`,
        type: 'STATISTICAL',
        severity: avgResponseTime > 10000 ? 'CRITICAL' : 'HIGH',
        description: `响应时间异常: 平均 ${avgResponseTime.toFixed(0)}ms`,
        affectedLogs: logData.filter(log => log.metadata?.responseTime > threshold),
        confidence: 0.9,
        metrics: {
          threshold,
          actualValue: avgResponseTime,
          deviation: avgResponseTime - threshold,
        },
      };
    }

    return null;
  }

  private analyzeErrorPatterns(logData: any[]): any[] {
    const errorLogs = logData.filter(log => log.level === 'ERROR');
    const patternCount = new Map<string, any[]>();

    // 提取错误模式
    for (const log of errorLogs) {
      const pattern = this.extractErrorPattern(log.message);
      if (!patternCount.has(pattern)) {
        patternCount.set(pattern, []);
      }
      patternCount.get(pattern)!.push(log);
    }

    // 识别异常模式
    const patterns = [];
    for (const [pattern, logs] of patternCount.entries()) {
      if (logs.length >= 3) { // 出现3次以上认为是模式
        patterns.push({
          id: this.hashString(pattern),
          pattern,
          frequency: logs.length,
          logs,
          isAnomalous: logs.length > 5, // 超过5次认为异常
        });
      }
    }

    return patterns;
  }

  private analyzeBehaviorPatterns(logData: any[]): any {
    // 简化的行为模式分析
    const userActions = logData.filter(log => log.metadata?.userId);
    const actionCount = userActions.length;
    const expectedActions = 50; // 假设正常用户行为数量

    const deviation = Math.abs(actionCount - expectedActions);
    const isAnomalous = deviation > expectedActions * 0.3;

    return {
      isAnomalous,
      description: `用户行为数量: ${actionCount} (期望: ${expectedActions})`,
      logs: userActions,
      threshold: expectedActions,
      actualValue: actionCount,
      deviation,
    };
  }

  private detectBurstEvents(logData: any[]): any[] {
    const bursts = [];
    const timeWindows = this.groupLogsByTimeWindow(logData, 60000); // 1分钟窗口

    for (const window of timeWindows) {
      const expectedCount = 20; // 正常情况下每分钟20条日志
      const actualCount = window.logs.length;
      const intensity = actualCount / expectedCount;

      if (intensity > 2) { // 超过正常2倍
        bursts.push({
          id: window.timestamp,
          timeWindow: new Date(window.timestamp).toISOString(),
          eventCount: actualCount,
          expectedCount,
          intensity,
          logs: window.logs,
        });
      }
    }

    return bursts;
  }

  private detectIntervalAnomalies(logData: any[]): any[] {
    // 简化实现
    return [];
  }

  private detectSessionAnomalies(logData: any[], userContext: any): any[] {
    // 简化实现
    return [];
  }

  private detectApiCallAnomalies(logData: any[]): any[] {
    // 简化实现
    return [];
  }

  private detectDataAccessAnomalies(logData: any[]): any[] {
    // 简化实现
    return [];
  }

  private groupLogsByTimeWindow(logData: any[], windowSize: number): any[] {
    const windows = new Map<number, any[]>();

    for (const log of logData) {
      const timestamp = new Date(log.timestamp).getTime();
      const windowStart = Math.floor(timestamp / windowSize) * windowSize;

      if (!windows.has(windowStart)) {
        windows.set(windowStart, []);
      }
      windows.get(windowStart)!.push(log);
    }

    return Array.from(windows.entries()).map(([timestamp, logs]) => ({
      timestamp,
      logs,
    }));
  }

  private extractErrorPattern(message: string): string {
    // 简化的模式提取：移除数字和变量部分
    return message
      .replace(/\d+/g, 'NUM')
      .replace(/[a-fA-F0-9-]{36}/g, 'UUID')
      .replace(/\b\w+@\w+\.\w+\b/g, 'EMAIL')
      .toLowerCase();
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  }

  private generateSummary(anomalies: any[]): any {
    const criticalCount = anomalies.filter(a => a.severity === 'CRITICAL').length;
    const highCount = anomalies.filter(a => a.severity === 'HIGH').length;
    
    const riskScores = anomalies.map(a => {
      switch (a.severity) {
        case 'CRITICAL': return 4;
        case 'HIGH': return 3;
        case 'MEDIUM': return 2;
        case 'LOW': return 1;
        default: return 0;
      }
    });

    const overallRiskScore = riskScores.length > 0 
      ? riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length
      : 0;

    return {
      totalAnomalies: anomalies.length,
      criticalCount,
      highCount,
      overallRiskScore,
    };
  }

  private calculateRiskLevel(anomalies: any[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const criticalCount = anomalies.filter(a => a.severity === 'CRITICAL').length;
    const highCount = anomalies.filter(a => a.severity === 'HIGH').length;

    if (criticalCount > 0) return 'CRITICAL';
    if (highCount > 2) return 'HIGH';
    if (anomalies.length > 5) return 'MEDIUM';
    return 'LOW';
  }

  private calculateOverallConfidence(anomalies: any[]): number {
    if (anomalies.length === 0) return 0;
    
    const confidenceSum = anomalies.reduce((sum, a) => sum + a.confidence, 0);
    return confidenceSum / anomalies.length;
  }
}
