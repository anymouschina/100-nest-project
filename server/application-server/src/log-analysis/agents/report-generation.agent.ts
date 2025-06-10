import { Injectable, Logger } from '@nestjs/common';
import { Agent, AgentContext, AgentResult } from '../services/agent-orchestrator.service';

export interface ReportGenerationResult {
  executiveSummary: {
    title: string;
    timeRange: string;
    totalLogs: number;
    analysisDate: string;
    overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    keyFindings: string[];
    priorityActions: string[];
  };
  detailedAnalysis: {
    logOverview: any;
    errorAnalysis: any;
    anomalyDetection: any;
    behaviorAnalysis: any;
    securityAssessment: any;
    performanceMetrics: any;
  };
  visualizationData: {
    charts: Array<{
      type: 'line' | 'bar' | 'pie' | 'heatmap';
      title: string;
      data: any;
      config: any;
    }>;
    metrics: Array<{
      name: string;
      value: string | number;
      trend: 'UP' | 'DOWN' | 'STABLE';
      severity: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
    }>;
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
    monitoring: string[];
  };
  appendix: {
    methodologyNotes: string[];
    dataQualityAssessment: string;
    limitations: string[];
    glossary: Record<string, string>;
  };
}

@Injectable()
export class ReportGenerationAgent implements Agent {
  readonly name = 'ReportGenerationAgent';
  readonly version = '1.0.0';
  readonly capabilities = ['report_generation', 'data_visualization', 'summary_creation', 'recommendation_synthesis'];
  private readonly logger = new Logger(ReportGenerationAgent.name);

  /**
   * 执行报告生成
   */
  async execute(logData: any[], context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    this.logger.debug(`开始生成分析报告: ${context.taskId}`);

    try {
      // 获取其他代理的分析结果
      const analysisResults = this.extractAnalysisResults(context);
      
      // 1. 生成执行摘要
      const executiveSummary = this.generateExecutiveSummary(logData, analysisResults);
      
      // 2. 整理详细分析
      const detailedAnalysis = this.compileDetailedAnalysis(logData, analysisResults);
      
      // 3. 准备可视化数据
      const visualizationData = this.prepareVisualizationData(logData, analysisResults);
      
      // 4. 综合建议
      const recommendations = this.synthesizeRecommendations(analysisResults);
      
      // 5. 生成附录
      const appendix = this.generateAppendix(logData, analysisResults);

      const result: ReportGenerationResult = {
        executiveSummary,
        detailedAnalysis,
        visualizationData,
        recommendations,
        appendix,
      };

      const processingTime = Date.now() - startTime;

      this.logger.debug(`报告生成完成: ${result.visualizationData.charts.length} 个图表, ${result.recommendations.immediate.length} 个紧急建议, 耗时: ${processingTime}ms`);

      return {
        agentName: this.name,
        success: true,
        data: result,
        processingTime,
        confidence: this.calculateConfidence(result),
      };

    } catch (error) {
      this.logger.error('报告生成失败', error.stack);
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
   * 提取其他代理的分析结果
   */
  private extractAnalysisResults(context: AgentContext): any {
    return {
      anomalyDetection: context.previousResults?.find(r => r.agentName === 'AnomalyDetectionAgent')?.data,
      featureExtraction: context.previousResults?.find(r => r.agentName === 'FeatureExtractionAgent')?.data,
      errorAnalysis: context.previousResults?.find(r => r.agentName === 'ErrorAnalysisAgent')?.data,
      behaviorAnalysis: context.previousResults?.find(r => r.agentName === 'BehaviorAnalysisAgent')?.data,
      userLogIssue: context.previousResults?.find(r => r.agentName === 'UserLogIssueAgent')?.data,
    };
  }

  /**
   * 生成执行摘要
   */
  private generateExecutiveSummary(logData: any[], analysisResults: any): any {
    const timeRange = this.calculateTimeRange(logData);
    const overallRiskLevel = this.determineOverallRiskLevel(analysisResults);
    const keyFindings = this.extractKeyFindings(analysisResults);
    const priorityActions = this.identifyPriorityActions(analysisResults);

    return {
      title: `日志分析报告 - ${new Date().toLocaleDateString('zh-CN')}`,
      timeRange,
      totalLogs: logData.length,
      analysisDate: new Date().toISOString(),
      overallRiskLevel,
      keyFindings,
      priorityActions,
    };
  }

  /**
   * 编译详细分析
   */
  private compileDetailedAnalysis(logData: any[], analysisResults: any): any {
    return {
      logOverview: this.generateLogOverview(logData),
      errorAnalysis: analysisResults.errorAnalysis || null,
      anomalyDetection: analysisResults.anomalyDetection || null,
      behaviorAnalysis: analysisResults.behaviorAnalysis || null,
      securityAssessment: this.generateSecurityAssessment(analysisResults),
      performanceMetrics: this.generatePerformanceMetrics(logData, analysisResults),
    };
  }

  /**
   * 准备可视化数据
   */
  private prepareVisualizationData(logData: any[], analysisResults: any): any {
    const charts = [];
    const metrics = [];

    // 1. 日志级别分布图
    charts.push(this.createLogLevelChart(logData));
    
    // 2. 时间分布图
    charts.push(this.createTimeDistributionChart(logData));
    
    // 3. 错误趋势图
    if (analysisResults.errorAnalysis) {
      charts.push(this.createErrorTrendChart(analysisResults.errorAnalysis));
    }
    
    // 4. 异常检测结果图
    if (analysisResults.anomalyDetection) {
      charts.push(this.createAnomalyChart(analysisResults.anomalyDetection));
    }
    
    // 5. 行为分析图
    if (analysisResults.behaviorAnalysis) {
      charts.push(this.createBehaviorChart(analysisResults.behaviorAnalysis));
    }

    // 关键指标
    metrics.push(...this.generateKeyMetrics(logData, analysisResults));

    return {
      charts: charts.filter(chart => chart !== null),
      metrics,
    };
  }

  /**
   * 综合建议
   */
  private synthesizeRecommendations(analysisResults: any): any {
    const immediate = [];
    const shortTerm = [];
    const longTerm = [];
    const monitoring = [];

    // 🔥 UI阻塞问题检测和建议（新增）
    if (analysisResults.behaviorAnalysis?.uiBlockingPatterns?.length > 0) {
      const uiPatterns = analysisResults.behaviorAnalysis.uiBlockingPatterns;
      
      // 紧急修复建议
      immediate.push('立即修复前端UI响应问题，添加按钮防抖机制');
      immediate.push('为所有异步操作添加Loading状态指示');
      
      // 短期优化建议
      shortTerm.push('检查前端JavaScript错误处理逻辑');
      shortTerm.push('优化API响应时间，确保UI及时更新');
      shortTerm.push('实现用户操作反馈机制（成功/失败提示）');
      shortTerm.push('添加前端网络请求重试机制');
      
      // 具体代码修复建议
      uiPatterns.forEach(pattern => {
        if (pattern.action === 'login_attempt') {
          immediate.push('修复登录按钮：添加disabled状态和loading指示');
        } else if (pattern.action === 'get_profile') {
          shortTerm.push('优化用户信息获取：缓存机制避免重复请求');
        } else if (pattern.action === 'refresh_token') {
          shortTerm.push('令牌刷新优化：自动重试机制和错误处理');
        }
      });
    }

    // 从各个分析结果中提取建议
    if (analysisResults.errorAnalysis?.recommendations) {
      immediate.push(...analysisResults.errorAnalysis.recommendations.filter(r => r.includes('立即') || r.includes('紧急')));
      shortTerm.push(...analysisResults.errorAnalysis.recommendations.filter(r => !r.includes('立即') && !r.includes('紧急')));
    }

    if (analysisResults.anomalyDetection?.riskLevel === 'CRITICAL') {
      immediate.push('立即调查检测到的关键异常情况');
    }

    if (analysisResults.behaviorAnalysis?.riskScore > 70) {
      immediate.push('立即评估高风险行为模式');
    }

    // 长期建议
    longTerm.push('建立完善的日志监控和告警机制');
    longTerm.push('定期进行日志分析和安全评估');
    longTerm.push('优化日志收集和存储策略');
    
    // UI阻塞相关的长期建议
    if (analysisResults.behaviorAnalysis?.uiBlockingPatterns?.length > 0) {
      longTerm.push('建立前端性能监控体系');
      longTerm.push('实施自动化UI测试，防止回归问题');
      longTerm.push('建立用户体验监控和反馈机制');
    }

    // 监控建议
    monitoring.push('设置异常检测告警阈值');
    monitoring.push('定期检查日志质量和完整性');
    monitoring.push('监控关键性能指标趋势');
    
    // UI阻塞相关的监控建议
    if (analysisResults.behaviorAnalysis?.uiBlockingPatterns?.length > 0) {
      monitoring.push('监控前端按钮重复点击模式');
      monitoring.push('设置API响应时间告警');
      monitoring.push('追踪用户交互成功率指标');
    }

    return {
      immediate: [...new Set(immediate)],
      shortTerm: [...new Set(shortTerm)],
      longTerm: [...new Set(longTerm)],
      monitoring: [...new Set(monitoring)],
    };
  }

  /**
   * 生成附录
   */
  private generateAppendix(logData: any[], analysisResults: any): any {
    return {
      methodologyNotes: [
        '本分析采用多代理AI系统进行综合日志分析',
        '包括异常检测、错误分析、行为分析等多个维度',
        '使用统计分析、模式识别和机器学习等技术',
        '分析结果基于历史数据和预设阈值',
      ],
      dataQualityAssessment: this.assessDataQuality(logData),
      limitations: [
        '分析结果依赖于日志数据的质量和完整性',
        '某些异常可能需要结合业务上下文进行判断',
        '建议与实际业务情况相结合进行决策',
      ],
      glossary: {
        '异常': '偏离正常模式的事件或行为',
        '风险评分': '基于多个因素计算的综合风险指标',
        '置信度': '分析结果的可信程度',
        '阈值': '触发告警或异常检测的临界值',
      },
    };
  }

  // ========== 辅助方法 ==========

  private calculateTimeRange(logData: any[]): string {
    if (logData.length === 0) return '无数据';
    
    const timestamps = logData.map(log => new Date(log.timestamp)).sort();
    const start = timestamps[0];
    const end = timestamps[timestamps.length - 1];
    
    return `${start.toLocaleString('zh-CN')} 至 ${end.toLocaleString('zh-CN')}`;
  }

  private determineOverallRiskLevel(analysisResults: any): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const riskLevels = [];
    
    if (analysisResults.errorAnalysis?.riskLevel) {
      riskLevels.push(analysisResults.errorAnalysis.riskLevel);
    }
    
    if (analysisResults.anomalyDetection?.riskLevel) {
      riskLevels.push(analysisResults.anomalyDetection.riskLevel);
    }
    
    if (analysisResults.behaviorAnalysis?.riskScore > 80) {
      riskLevels.push('CRITICAL');
    } else if (analysisResults.behaviorAnalysis?.riskScore > 60) {
      riskLevels.push('HIGH');
    } else if (analysisResults.behaviorAnalysis?.riskScore > 30) {
      riskLevels.push('MEDIUM');
    } else {
      riskLevels.push('LOW');
    }

    // 取最高风险等级
    if (riskLevels.includes('CRITICAL')) return 'CRITICAL';
    if (riskLevels.includes('HIGH')) return 'HIGH';
    if (riskLevels.includes('MEDIUM')) return 'MEDIUM';
    return 'LOW';
  }

  private extractKeyFindings(analysisResults: any): string[] {
    const findings = [];

    // 🔥 UI阻塞问题关键发现（新增优先级最高）
    if (analysisResults.behaviorAnalysis?.uiBlockingPatterns?.length > 0) {
      const uiPatterns = analysisResults.behaviorAnalysis.uiBlockingPatterns;
      const totalPatterns = uiPatterns.length;
      const highConfidencePatterns = uiPatterns.filter(p => p.confidence > 0.8).length;
      
      findings.push(`🚨 检测到 ${totalPatterns} 个UI阻塞问题，其中 ${highConfidencePatterns} 个高置信度`);
      
      // 具体问题描述
      uiPatterns.forEach(pattern => {
        if (pattern.confidence > 0.7) {
          findings.push(`用户在${Math.round(pattern.timeWindow/1000)}秒内重复执行"${pattern.action}"操作${pattern.repeatCount}次`);
        }
      });
    }

    if (analysisResults.errorAnalysis) {
      const errorSummary = analysisResults.errorAnalysis.errorSummary;
      if (errorSummary?.totalErrors > 0) {
        findings.push(`检测到 ${errorSummary.totalErrors} 个错误事件`);
      }
      if (errorSummary?.errorRate > 0.1) {
        findings.push(`错误率较高: ${(errorSummary.errorRate * 100).toFixed(1)}%`);
      }
    }

    if (analysisResults.anomalyDetection) {
      const summary = analysisResults.anomalyDetection.summary;
      if (summary?.totalAnomalies > 0) {
        findings.push(`发现 ${summary.totalAnomalies} 个异常模式`);
      }
    }

    if (analysisResults.behaviorAnalysis) {
      const riskScore = analysisResults.behaviorAnalysis.riskScore;
      if (riskScore > 50) {
        findings.push(`行为分析风险评分: ${riskScore}`);
      }
    }

    return findings.length > 0 ? findings : ['未发现显著异常'];
  }

  private identifyPriorityActions(analysisResults: any): string[] {
    const actions = [];

    if (analysisResults.errorAnalysis?.riskLevel === 'CRITICAL') {
      actions.push('立即处理关键错误');
    }

    if (analysisResults.anomalyDetection?.riskLevel === 'CRITICAL') {
      actions.push('紧急调查异常活动');
    }

    if (analysisResults.behaviorAnalysis?.riskScore > 80) {
      actions.push('评估安全威胁');
    }

    return actions.length > 0 ? actions : ['继续监控系统状态'];
  }

  private generateLogOverview(logData: any[]): any {
    const levels = new Map<string, number>();
    const sources = new Set<string>();
    
    logData.forEach(log => {
      levels.set(log.level, (levels.get(log.level) || 0) + 1);
      if (log.source) sources.add(log.source);
    });

    return {
      totalLogs: logData.length,
      logLevels: Object.fromEntries(levels),
      uniqueSources: sources.size,
      timeSpan: this.calculateTimeSpan(logData),
    };
  }

  private generateSecurityAssessment(analysisResults: any): any {
    const assessment = {
      overallRating: 'GOOD',
      threats: [],
      vulnerabilities: [],
      recommendations: [],
    };

    if (analysisResults.behaviorAnalysis?.securityIndicators) {
      const security = analysisResults.behaviorAnalysis.securityIndicators;
      
      if (security.failedLogins > 20) {
        assessment.threats.push(`高失败登录次数: ${security.failedLogins}`);
        assessment.overallRating = 'POOR';
      }
      
      if (security.bruteForceAttempts?.length > 0) {
        assessment.threats.push(`暴力破解尝试: ${security.bruteForceAttempts.length} 次`);
        assessment.overallRating = 'POOR';
      }
    }

    return assessment;
  }

  private generatePerformanceMetrics(logData: any[], analysisResults: any): any {
    const errorRate = logData.filter(log => log.level === 'ERROR').length / logData.length;
    
    return {
      errorRate: (errorRate * 100).toFixed(2) + '%',
      totalEvents: logData.length,
      avgProcessingTime: this.calculateAvgProcessingTime(logData),
      systemHealth: errorRate < 0.05 ? 'GOOD' : errorRate < 0.1 ? 'WARNING' : 'CRITICAL',
    };
  }

  private createLogLevelChart(logData: any[]): any {
    const levels = new Map<string, number>();
    logData.forEach(log => {
      levels.set(log.level, (levels.get(log.level) || 0) + 1);
    });

    return {
      type: 'pie',
      title: '日志级别分布',
      data: {
        labels: Array.from(levels.keys()),
        datasets: [{
          data: Array.from(levels.values()),
          backgroundColor: ['#28a745', '#ffc107', '#fd7e14', '#dc3545'],
        }],
      },
      config: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
        },
      },
    };
  }

  private createTimeDistributionChart(logData: any[]): any {
    const hourlyData = new Array(24).fill(0);
    
    logData.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      hourlyData[hour]++;
    });

    return {
      type: 'line',
      title: '24小时日志分布',
      data: {
        labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        datasets: [{
          label: '日志数量',
          data: hourlyData,
          borderColor: '#007bff',
          tension: 0.1,
        }],
      },
      config: {
        responsive: true,
        scales: {
          y: { beginAtZero: true },
        },
      },
    };
  }

  private createErrorTrendChart(errorAnalysis: any): any | null {
    if (!errorAnalysis?.errorSummary?.mostFrequentErrors) return null;

    const errors = errorAnalysis.errorSummary.mostFrequentErrors.slice(0, 5);

    return {
      type: 'bar',
      title: '最频繁错误类型',
      data: {
        labels: errors.map(e => e.pattern.substring(0, 30) + '...'),
        datasets: [{
          label: '出现次数',
          data: errors.map(e => e.count),
          backgroundColor: '#dc3545',
        }],
      },
      config: {
        responsive: true,
        scales: {
          y: { beginAtZero: true },
        },
      },
    };
  }

  private createAnomalyChart(anomalyDetection: any): any | null {
    if (!anomalyDetection?.anomalies) return null;

    const severityCount = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    anomalyDetection.anomalies.forEach(a => {
      severityCount[a.severity]++;
    });

    return {
      type: 'bar',
      title: '异常严重程度分布',
      data: {
        labels: Object.keys(severityCount),
        datasets: [{
          label: '异常数量',
          data: Object.values(severityCount),
          backgroundColor: ['#28a745', '#ffc107', '#fd7e14', '#dc3545'],
        }],
      },
      config: {
        responsive: true,
        scales: {
          y: { beginAtZero: true },
        },
      },
    };
  }

  private createBehaviorChart(behaviorAnalysis: any): any | null {
    if (!behaviorAnalysis?.userBehavior) return null;

    return {
      type: 'pie',
      title: '用户活动分布',
      data: {
        labels: ['活跃用户', '非活跃用户'],
        datasets: [{
          data: [
            behaviorAnalysis.userBehavior.activeUsers,
            behaviorAnalysis.userBehavior.totalUsers - behaviorAnalysis.userBehavior.activeUsers,
          ],
          backgroundColor: ['#28a745', '#6c757d'],
        }],
      },
      config: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
        },
      },
    };
  }

  private generateKeyMetrics(logData: any[], analysisResults: any): any[] {
    const metrics = [];

    // 总日志数
    metrics.push({
      name: '总日志数',
      value: logData.length.toLocaleString(),
      trend: 'STABLE',
      severity: 'INFO',
    });

    // 错误率
    const errorRate = logData.filter(log => log.level === 'ERROR').length / logData.length;
    metrics.push({
      name: '错误率',
      value: (errorRate * 100).toFixed(1) + '%',
      trend: 'STABLE',
      severity: errorRate > 0.1 ? 'ERROR' : errorRate > 0.05 ? 'WARNING' : 'SUCCESS',
    });

    // 异常数量
    if (analysisResults.anomalyDetection?.summary?.totalAnomalies) {
      metrics.push({
        name: '检测异常',
        value: analysisResults.anomalyDetection.summary.totalAnomalies,
        trend: 'STABLE',
        severity: analysisResults.anomalyDetection.summary.totalAnomalies > 5 ? 'WARNING' : 'SUCCESS',
      });
    }

    // 风险评分
    if (analysisResults.behaviorAnalysis?.riskScore) {
      const riskScore = analysisResults.behaviorAnalysis.riskScore;
      metrics.push({
        name: '风险评分',
        value: riskScore,
        trend: 'STABLE',
        severity: riskScore > 70 ? 'ERROR' : riskScore > 40 ? 'WARNING' : 'SUCCESS',
      });
    }

    return metrics;
  }

  private assessDataQuality(logData: any[]): string {
    let quality = '良好';
    const issues = [];

    if (logData.length < 100) {
      issues.push('数据量较少');
      quality = '一般';
    }

    const withTimestamp = logData.filter(log => log.timestamp).length;
    if (withTimestamp / logData.length < 0.9) {
      issues.push('部分日志缺少时间戳');
      quality = '一般';
    }

    const withLevel = logData.filter(log => log.level).length;
    if (withLevel / logData.length < 0.8) {
      issues.push('部分日志缺少级别信息');
      quality = '差';
    }

    return issues.length > 0 ? `${quality} (${issues.join(', ')})` : quality;
  }

  private calculateTimeSpan(logData: any[]): number {
    if (logData.length < 2) return 0;
    
    const timestamps = logData.map(log => new Date(log.timestamp).getTime()).sort();
    return timestamps[timestamps.length - 1] - timestamps[0];
  }

  private calculateAvgProcessingTime(logData: any[]): string {
    const withResponseTime = logData.filter(log => log.metadata?.responseTime);
    if (withResponseTime.length === 0) return '无数据';
    
    const avg = withResponseTime.reduce((sum, log) => sum + log.metadata.responseTime, 0) / withResponseTime.length;
    return `${avg.toFixed(0)}ms`;
  }

  private calculateConfidence(result: ReportGenerationResult): number {
    let score = 0;
    let maxScore = 0;

    // 执行摘要完整性
    if (result.executiveSummary.keyFindings.length > 0) score += 25;
    maxScore += 25;

    // 详细分析完整性
    const analysisCount = Object.values(result.detailedAnalysis).filter(v => v !== null).length;
    score += (analysisCount / 6) * 25;
    maxScore += 25;

    // 可视化数据完整性
    if (result.visualizationData.charts.length > 0) score += 25;
    maxScore += 25;

    // 建议完整性
    const recommendationCount = result.recommendations.immediate.length + 
                               result.recommendations.shortTerm.length + 
                               result.recommendations.longTerm.length;
    if (recommendationCount > 0) score += 25;
    maxScore += 25;

    return maxScore > 0 ? score / maxScore : 0;
  }
}
