import { Injectable, Logger } from '@nestjs/common';
import { Agent, AgentContext, AgentResult } from '../services/agent-orchestrator.service';

export interface ErrorAnalysisResult {
  errorSummary: {
    totalErrors: number;
    uniqueErrors: number;
    errorRate: number;
    mostFrequentErrors: Array<{
      pattern: string;
      count: number;
      percentage: number;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    }>;
  };
  errorCategories: {
    systemErrors: any[];
    applicationErrors: any[];
    userErrors: any[];
    networkErrors: any[];
    databaseErrors: any[];
  };
  rootCauseAnalysis: {
    suspectedCauses: string[];
    correlations: any[];
    patterns: any[];
  };
  impactAssessment: {
    affectedUsers: number;
    affectedServices: string[];
    businessImpact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    downtime: number;
  };
  recommendations: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

@Injectable()
export class ErrorAnalysisAgent implements Agent {
  readonly name = 'ErrorAnalysisAgent';
  readonly version = '1.0.0';
  readonly capabilities = ['error_classification', 'root_cause_analysis', 'impact_assessment', 'error_pattern_recognition'];
  private readonly logger = new Logger(ErrorAnalysisAgent.name);

  /**
   * 执行错误分析
   */
  async execute(logData: any[], context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    this.logger.debug(`开始错误分析: ${context.taskId}`);

    try {
      const errorLogs = logData.filter(log => log.level === 'ERROR');
      
      if (errorLogs.length === 0) {
        return {
          agentName: this.name,
          success: true,
          data: this.createEmptyResult(),
          processingTime: Date.now() - startTime,
          confidence: 1.0,
        };
      }

      // 1. 错误摘要分析
      const errorSummary = this.analyzeErrorSummary(errorLogs, logData);
      
      // 2. 错误分类
      const errorCategories = this.categorizeErrors(errorLogs);
      
      // 3. 根因分析
      const rootCauseAnalysis = this.performRootCauseAnalysis(errorLogs, logData);
      
      // 4. 影响评估
      const impactAssessment = this.assessImpact(errorLogs, logData, context);
      
      // 5. 生成建议
      const recommendations = this.generateRecommendations(errorCategories, rootCauseAnalysis, impactAssessment);
      
      // 6. 评估风险等级
      const riskLevel = this.calculateRiskLevel(errorSummary, impactAssessment);

      const result: ErrorAnalysisResult = {
        errorSummary,
        errorCategories,
        rootCauseAnalysis,
        impactAssessment,
        recommendations,
        riskLevel,
      };

      const processingTime = Date.now() - startTime;

      this.logger.debug(`错误分析完成: 分析了 ${errorLogs.length} 个错误, 风险等级: ${riskLevel}, 耗时: ${processingTime}ms`);

      return {
        agentName: this.name,
        success: true,
        data: result,
        processingTime,
        confidence: this.calculateConfidence(result),
      };

    } catch (error) {
      this.logger.error('错误分析失败', error.stack);
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
   * 分析错误摘要
   */
  private analyzeErrorSummary(errorLogs: any[], allLogs: any[]): any {
    const totalErrors = errorLogs.length;
    const totalLogs = allLogs.length;
    const errorRate = totalLogs > 0 ? totalErrors / totalLogs : 0;

    // 统计错误模式
    const errorPatterns = new Map<string, any[]>();
    errorLogs.forEach(log => {
      const pattern = this.normalizeErrorMessage(log.message);
      if (!errorPatterns.has(pattern)) {
        errorPatterns.set(pattern, []);
      }
      errorPatterns.get(pattern)!.push(log);
    });

    const uniqueErrors = errorPatterns.size;

    // 找出最频繁的错误
    const mostFrequentErrors = Array.from(errorPatterns.entries())
      .map(([pattern, logs]) => ({
        pattern,
        count: logs.length,
        percentage: (logs.length / totalErrors) * 100,
        severity: this.classifyErrorSeverity(pattern, logs),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors,
      uniqueErrors,
      errorRate,
      mostFrequentErrors,
    };
  }

  /**
   * 错误分类
   */
  private categorizeErrors(errorLogs: any[]): any {
    const categories = {
      systemErrors: [],
      applicationErrors: [],
      userErrors: [],
      networkErrors: [],
      databaseErrors: [],
    };

    for (const log of errorLogs) {
      const category = this.classifyError(log);
      const errorInfo = {
        timestamp: log.timestamp,
        message: log.message,
        stack: log.metadata?.stack,
        context: log.metadata?.context,
      };

      switch (category) {
        case 'SYSTEM':
          categories.systemErrors.push(errorInfo);
          break;
        case 'APPLICATION':
          categories.applicationErrors.push(errorInfo);
          break;
        case 'USER':
          categories.userErrors.push(errorInfo);
          break;
        case 'NETWORK':
          categories.networkErrors.push(errorInfo);
          break;
        case 'DATABASE':
          categories.databaseErrors.push(errorInfo);
          break;
      }
    }

    return categories;
  }

  /**
   * 根因分析
   */
  private performRootCauseAnalysis(errorLogs: any[], allLogs: any[]): any {
    const suspectedCauses = [];
    const correlations = [];
    const patterns = [];

    // 1. 分析错误时间相关性
    const timeCorrelations = this.analyzeTimeCorrelations(errorLogs);
    correlations.push(...timeCorrelations);

    // 2. 分析错误模式
    const errorPatterns = this.analyzeErrorPatterns(errorLogs);
    patterns.push(...errorPatterns);

    // 3. 识别可能的根因
    if (this.hasHighDatabaseErrorRate(errorLogs)) {
      suspectedCauses.push('数据库连接问题或性能瓶颈');
    }

    if (this.hasNetworkRelatedErrors(errorLogs)) {
      suspectedCauses.push('网络连接不稳定或超时');
    }

    if (this.hasMemoryRelatedErrors(errorLogs)) {
      suspectedCauses.push('内存不足或内存泄漏');
    }

    if (this.hasAuthenticationErrors(errorLogs)) {
      suspectedCauses.push('认证服务异常或配置错误');
    }

    if (this.hasExternalServiceErrors(errorLogs)) {
      suspectedCauses.push('外部服务依赖异常');
    }

    return {
      suspectedCauses,
      correlations,
      patterns,
    };
  }

  /**
   * 影响评估
   */
  private assessImpact(errorLogs: any[], allLogs: any[], context: AgentContext): any {
    // 受影响用户数
    const affectedUsers = this.countAffectedUsers(errorLogs);
    
    // 受影响服务
    const affectedServices = this.identifyAffectedServices(errorLogs);
    
    // 业务影响程度
    const businessImpact = this.assessBusinessImpact(errorLogs, affectedUsers, affectedServices);
    
    // 停机时间估算
    const downtime = this.estimateDowntime(errorLogs);

    return {
      affectedUsers,
      affectedServices,
      businessImpact,
      downtime,
    };
  }

  /**
   * 生成建议
   */
  private generateRecommendations(
    errorCategories: any,
    rootCauseAnalysis: any,
    impactAssessment: any
  ): string[] {
    const recommendations = [];

    // 基于错误类型的建议
    if (errorCategories.databaseErrors.length > 0) {
      recommendations.push('检查数据库连接池配置和查询性能');
    }

    if (errorCategories.networkErrors.length > 0) {
      recommendations.push('检查网络连接稳定性和超时配置');
    }

    if (errorCategories.systemErrors.length > 0) {
      recommendations.push('检查系统资源使用情况（CPU、内存、磁盘）');
    }

    // 基于根因分析的建议
    for (const cause of rootCauseAnalysis.suspectedCauses) {
      if (cause.includes('数据库')) {
        recommendations.push('优化数据库查询和连接管理');
      }
      if (cause.includes('内存')) {
        recommendations.push('进行内存泄漏检查和资源清理');
      }
      if (cause.includes('网络')) {
        recommendations.push('增加重试机制和超时处理');
      }
    }

    // 基于影响程度的建议
    if (impactAssessment.businessImpact === 'CRITICAL' || impactAssessment.businessImpact === 'HIGH') {
      recommendations.push('立即启动应急响应流程');
      recommendations.push('通知相关业务团队和用户');
    }

    if (impactAssessment.downtime > 300000) { // 5分钟
      recommendations.push('考虑实施服务降级或熔断机制');
    }

    return [...new Set(recommendations)]; // 去重
  }

  /**
   * 计算风险等级
   */
  private calculateRiskLevel(errorSummary: any, impactAssessment: any): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    let score = 0;

    // 错误率评分
    if (errorSummary.errorRate > 0.5) score += 4;
    else if (errorSummary.errorRate > 0.3) score += 3;
    else if (errorSummary.errorRate > 0.1) score += 2;
    else score += 1;

    // 业务影响评分
    switch (impactAssessment.businessImpact) {
      case 'CRITICAL': score += 4; break;
      case 'HIGH': score += 3; break;
      case 'MEDIUM': score += 2; break;
      case 'LOW': score += 1; break;
    }

    // 根据总分确定风险等级
    if (score >= 7) return 'CRITICAL';
    if (score >= 5) return 'HIGH';
    if (score >= 3) return 'MEDIUM';
    return 'LOW';
  }

  // ========== 辅助方法 ==========

  private createEmptyResult(): ErrorAnalysisResult {
    return {
      errorSummary: {
        totalErrors: 0,
        uniqueErrors: 0,
        errorRate: 0,
        mostFrequentErrors: [],
      },
      errorCategories: {
        systemErrors: [],
        applicationErrors: [],
        userErrors: [],
        networkErrors: [],
        databaseErrors: [],
      },
      rootCauseAnalysis: {
        suspectedCauses: [],
        correlations: [],
        patterns: [],
      },
      impactAssessment: {
        affectedUsers: 0,
        affectedServices: [],
        businessImpact: 'LOW',
        downtime: 0,
      },
      recommendations: [],
      riskLevel: 'LOW',
    };
  }

  private normalizeErrorMessage(message: string): string {
    return message
      .replace(/\d+/g, 'NUM')
      .replace(/[a-fA-F0-9-]{36}/g, 'UUID')
      .replace(/\b\w+@\w+\.\w+\b/g, 'EMAIL')
      .replace(/https?:\/\/[^\s]+/g, 'URL')
      .toLowerCase()
      .trim();
  }

  private classifyErrorSeverity(pattern: string, logs: any[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    // 基于错误模式和频率确定严重程度
    if (pattern.includes('critical') || pattern.includes('fatal')) return 'CRITICAL';
    if (pattern.includes('database') || pattern.includes('connection')) return 'HIGH';
    if (logs.length > 10) return 'HIGH';
    if (logs.length > 5) return 'MEDIUM';
    return 'LOW';
  }

  private classifyError(log: any): 'SYSTEM' | 'APPLICATION' | 'USER' | 'NETWORK' | 'DATABASE' {
    const message = log.message.toLowerCase();
    
    if (message.includes('database') || message.includes('sql') || message.includes('connection pool')) {
      return 'DATABASE';
    }
    if (message.includes('network') || message.includes('timeout') || message.includes('connection refused')) {
      return 'NETWORK';
    }
    if (message.includes('out of memory') || message.includes('disk full') || message.includes('cpu')) {
      return 'SYSTEM';
    }
    if (message.includes('authentication') || message.includes('authorization') || message.includes('validation')) {
      return 'USER';
    }
    
    return 'APPLICATION';
  }

  private analyzeTimeCorrelations(errorLogs: any[]): any[] {
    // 简化的时间相关性分析
    const correlations = [];
    
    // 检查是否有错误爆发
    const timeWindows = this.groupErrorsByTimeWindow(errorLogs, 60000); // 1分钟窗口
    const avgErrorsPerWindow = errorLogs.length / timeWindows.length;
    
    for (const window of timeWindows) {
      if (window.count > avgErrorsPerWindow * 3) {
        correlations.push({
          type: 'ERROR_BURST',
          timestamp: window.timestamp,
          count: window.count,
          description: `错误爆发: ${new Date(window.timestamp).toISOString()} 时刻出现 ${window.count} 个错误`,
        });
      }
    }
    
    return correlations;
  }

  private analyzeErrorPatterns(errorLogs: any[]): any[] {
    // 简化的错误模式分析
    const patterns = [];
    const errorTypes = new Map<string, number>();
    
    errorLogs.forEach(log => {
      const type = this.extractErrorType(log.message);
      errorTypes.set(type, (errorTypes.get(type) || 0) + 1);
    });
    
    for (const [type, count] of errorTypes.entries()) {
      if (count > 3) {
        patterns.push({
          type: 'RECURRING_ERROR',
          pattern: type,
          count,
          description: `重复错误模式: "${type}" 出现 ${count} 次`,
        });
      }
    }
    
    return patterns;
  }

  private hasHighDatabaseErrorRate(errorLogs: any[]): boolean {
    const dbErrors = errorLogs.filter(log => 
      log.message.toLowerCase().includes('database') ||
      log.message.toLowerCase().includes('sql') ||
      log.message.toLowerCase().includes('connection')
    );
    return dbErrors.length / errorLogs.length > 0.3;
  }

  private hasNetworkRelatedErrors(errorLogs: any[]): boolean {
    const networkErrors = errorLogs.filter(log =>
      log.message.toLowerCase().includes('network') ||
      log.message.toLowerCase().includes('timeout') ||
      log.message.toLowerCase().includes('connection refused')
    );
    return networkErrors.length > 0;
  }

  private hasMemoryRelatedErrors(errorLogs: any[]): boolean {
    const memoryErrors = errorLogs.filter(log =>
      log.message.toLowerCase().includes('memory') ||
      log.message.toLowerCase().includes('heap') ||
      log.message.toLowerCase().includes('oom')
    );
    return memoryErrors.length > 0;
  }

  private hasAuthenticationErrors(errorLogs: any[]): boolean {
    const authErrors = errorLogs.filter(log =>
      log.message.toLowerCase().includes('authentication') ||
      log.message.toLowerCase().includes('authorization') ||
      log.message.toLowerCase().includes('unauthorized')
    );
    return authErrors.length > 0;
  }

  private hasExternalServiceErrors(errorLogs: any[]): boolean {
    const serviceErrors = errorLogs.filter(log =>
      log.message.toLowerCase().includes('service') ||
      log.message.toLowerCase().includes('api') ||
      log.message.toLowerCase().includes('external')
    );
    return serviceErrors.length > 0;
  }

  private countAffectedUsers(errorLogs: any[]): number {
    const userIds = new Set();
    errorLogs.forEach(log => {
      if (log.metadata?.userId) {
        userIds.add(log.metadata.userId);
      }
    });
    return userIds.size;
  }

  private identifyAffectedServices(errorLogs: any[]): string[] {
    const services = new Set<string>();
    errorLogs.forEach(log => {
      if (log.metadata?.service) {
        services.add(log.metadata.service);
      }
    });
    return Array.from(services);
  }

  private assessBusinessImpact(errorLogs: any[], affectedUsers: number, affectedServices: string[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    let score = 0;

    // 用户影响评分
    if (affectedUsers > 1000) score += 4;
    else if (affectedUsers > 100) score += 3;
    else if (affectedUsers > 10) score += 2;
    else if (affectedUsers > 0) score += 1;

    // 服务影响评分
    if (affectedServices.length > 5) score += 3;
    else if (affectedServices.length > 2) score += 2;
    else if (affectedServices.length > 0) score += 1;

    // 错误频率评分
    if (errorLogs.length > 100) score += 2;
    else if (errorLogs.length > 50) score += 1;

    if (score >= 7) return 'CRITICAL';
    if (score >= 5) return 'HIGH';
    if (score >= 3) return 'MEDIUM';
    return 'LOW';
  }

  private estimateDowntime(errorLogs: any[]): number {
    if (errorLogs.length === 0) return 0;
    
    const timestamps = errorLogs.map(log => new Date(log.timestamp).getTime()).sort();
    const firstError = timestamps[0];
    const lastError = timestamps[timestamps.length - 1];
    
    return lastError - firstError;
  }

  private groupErrorsByTimeWindow(errorLogs: any[], windowMs: number): any[] {
    const windows = new Map<number, number>();
    
    errorLogs.forEach(log => {
      const timestamp = new Date(log.timestamp).getTime();
      const windowStart = Math.floor(timestamp / windowMs) * windowMs;
      windows.set(windowStart, (windows.get(windowStart) || 0) + 1);
    });
    
    return Array.from(windows.entries()).map(([timestamp, count]) => ({
      timestamp,
      count,
    }));
  }

  private extractErrorType(message: string): string {
    // 提取错误类型
    const patterns = [
      /(\w+Exception)/,
      /(\w+Error)/,
      /(timeout)/i,
      /(connection)/i,
      /(unauthorized)/i,
    ];
    
    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return match[1].toLowerCase();
      }
    }
    
    return 'unknown';
  }

  private calculateConfidence(result: ErrorAnalysisResult): number {
    let score = 0;
    let maxScore = 0;

    // 基于数据完整性
    if (result.errorSummary.totalErrors > 0) score += 30;
    maxScore += 30;

    if (result.rootCauseAnalysis.suspectedCauses.length > 0) score += 25;
    maxScore += 25;

    if (result.recommendations.length > 0) score += 25;
    maxScore += 25;

    if (result.impactAssessment.affectedUsers > 0 || result.impactAssessment.affectedServices.length > 0) score += 20;
    maxScore += 20;

    return maxScore > 0 ? score / maxScore : 0;
  }
}
