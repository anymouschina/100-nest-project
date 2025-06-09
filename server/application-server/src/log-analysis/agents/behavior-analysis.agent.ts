import { Injectable, Logger } from '@nestjs/common';
import { Agent, AgentContext, AgentResult } from '../services/agent-orchestrator.service';

export interface BehaviorAnalysisResult {
  userBehavior: {
    totalUsers: number;
    activeUsers: number;
    userSessionStats: {
      avgSessionDuration: number;
      avgActionsPerSession: number;
      maxConcurrentSessions: number;
    };
    behaviorPatterns: Array<{
      pattern: string;
      frequency: number;
      users: string[];
      isAnomaly: boolean;
    }>;
  };
  accessPatterns: {
    ipAnalysis: {
      uniqueIPs: number;
      suspiciousIPs: string[];
      geoDistribution: any[];
    };
    endpointUsage: Array<{
      endpoint: string;
      hitCount: number;
      uniqueUsers: number;
      avgResponseTime: number;
    }>;
    timePatterns: {
      peakHours: number[];
      weekdayDistribution: number[];
    };
  };
  securityIndicators: {
    failedLogins: number;
    suspiciousActivities: any[];
    bruteForceAttempts: any[];
    abnormalAccess: any[];
  };
  performanceIndicators: {
    slowRequests: any[];
    errorPatterns: any[];
    resourceUsage: any;
  };
  anomalies: any[];
  riskScore: number;
}

@Injectable()
export class BehaviorAnalysisAgent implements Agent {
  readonly name = 'BehaviorAnalysisAgent';
  readonly version = '1.0.0';
  readonly capabilities = ['user_behavior_analysis', 'access_pattern_analysis', 'security_analysis', 'performance_analysis'];
  private readonly logger = new Logger(BehaviorAnalysisAgent.name);

  /**
   * 执行行为分析
   */
  async execute(logData: any[], context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    this.logger.debug(`开始行为分析: ${context.taskId}`);

    try {
      // 1. 用户行为分析
      const userBehavior = this.analyzeUserBehavior(logData, context);
      
      // 2. 访问模式分析
      const accessPatterns = this.analyzeAccessPatterns(logData);
      
      // 3. 安全指标分析
      const securityIndicators = this.analyzeSecurityIndicators(logData);
      
      // 4. 性能指标分析
      const performanceIndicators = this.analyzePerformanceIndicators(logData);
      
      // 5. 异常检测
      const anomalies = this.detectBehaviorAnomalies(
        userBehavior,
        accessPatterns,
        securityIndicators,
        performanceIndicators
      );
      
      // 6. 计算风险评分
      const riskScore = this.calculateRiskScore(
        userBehavior,
        accessPatterns,
        securityIndicators,
        performanceIndicators,
        anomalies
      );

      const result: BehaviorAnalysisResult = {
        userBehavior,
        accessPatterns,
        securityIndicators,
        performanceIndicators,
        anomalies,
        riskScore,
      };

      const processingTime = Date.now() - startTime;

      this.logger.debug(`行为分析完成: 风险评分 ${riskScore}, 发现 ${anomalies.length} 个异常, 耗时: ${processingTime}ms`);

      return {
        agentName: this.name,
        success: true,
        data: result,
        processingTime,
        confidence: this.calculateConfidence(result),
      };

    } catch (error) {
      this.logger.error('行为分析失败', error.stack);
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
   * 分析用户行为
   */
  private analyzeUserBehavior(logData: any[], context: AgentContext): any {
    const userLogs = logData.filter(log => log.metadata?.userId);
    const userIds = new Set(userLogs.map(log => log.metadata.userId));
    const totalUsers = userIds.size;

    // 分析会话
    const sessions = this.extractSessions(userLogs);
    const userSessionStats = this.calculateSessionStats(sessions);

    // 分析行为模式
    const behaviorPatterns = this.extractBehaviorPatterns(userLogs);

    // 活跃用户计算（最近一小时有活动的用户）
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentUserIds = new Set(
      userLogs
        .filter(log => new Date(log.timestamp) > oneHourAgo)
        .map(log => log.metadata.userId)
    );
    const activeUsers = recentUserIds.size;

    return {
      totalUsers,
      activeUsers,
      userSessionStats,
      behaviorPatterns,
    };
  }

  /**
   * 分析访问模式
   */
  private analyzeAccessPatterns(logData: any[]): any {
    // IP分析
    const ipAnalysis = this.analyzeIPPatterns(logData);
    
    // 端点使用分析
    const endpointUsage = this.analyzeEndpointUsage(logData);
    
    // 时间模式分析
    const timePatterns = this.analyzeTimePatterns(logData);

    return {
      ipAnalysis,
      endpointUsage,
      timePatterns,
    };
  }

  /**
   * 分析安全指标
   */
  private analyzeSecurityIndicators(logData: any[]): any {
    // 失败登录
    const failedLogins = this.countFailedLogins(logData);
    
    // 可疑活动
    const suspiciousActivities = this.detectSuspiciousActivities(logData);
    
    // 暴力破解尝试
    const bruteForceAttempts = this.detectBruteForceAttempts(logData);
    
    // 异常访问
    const abnormalAccess = this.detectAbnormalAccess(logData);

    return {
      failedLogins,
      suspiciousActivities,
      bruteForceAttempts,
      abnormalAccess,
    };
  }

  /**
   * 分析性能指标
   */
  private analyzePerformanceIndicators(logData: any[]): any {
    // 慢请求
    const slowRequests = this.identifySlowRequests(logData);
    
    // 错误模式
    const errorPatterns = this.analyzeErrorPatterns(logData);
    
    // 资源使用情况
    const resourceUsage = this.analyzeResourceUsage(logData);

    return {
      slowRequests,
      errorPatterns,
      resourceUsage,
    };
  }

  /**
   * 检测行为异常
   */
  private detectBehaviorAnomalies(
    userBehavior: any,
    accessPatterns: any,
    securityIndicators: any,
    performanceIndicators: any
  ): any[] {
    const anomalies = [];

    // 用户行为异常
    if (userBehavior.userSessionStats.avgSessionDuration > 10800000) { // 3小时
      anomalies.push({
        type: 'LONG_SESSION',
        severity: 'MEDIUM',
        description: `异常长会话时间: 平均 ${(userBehavior.userSessionStats.avgSessionDuration / 1000 / 60).toFixed(1)} 分钟`,
      });
    }

    // 安全异常
    if (securityIndicators.failedLogins > 50) {
      anomalies.push({
        type: 'HIGH_FAILED_LOGINS',
        severity: 'HIGH',
        description: `异常高失败登录次数: ${securityIndicators.failedLogins}`,
      });
    }

    if (securityIndicators.bruteForceAttempts.length > 0) {
      anomalies.push({
        type: 'BRUTE_FORCE_DETECTED',
        severity: 'CRITICAL',
        description: `检测到 ${securityIndicators.bruteForceAttempts.length} 次暴力破解尝试`,
      });
    }

    // 访问模式异常
    if (accessPatterns.ipAnalysis.suspiciousIPs.length > 0) {
      anomalies.push({
        type: 'SUSPICIOUS_IPS',
        severity: 'HIGH',
        description: `发现 ${accessPatterns.ipAnalysis.suspiciousIPs.length} 个可疑IP地址`,
      });
    }

    // 性能异常
    if (performanceIndicators.slowRequests.length > 10) {
      anomalies.push({
        type: 'PERFORMANCE_DEGRADATION',
        severity: 'MEDIUM',
        description: `检测到 ${performanceIndicators.slowRequests.length} 个慢请求`,
      });
    }

    return anomalies;
  }

  /**
   * 计算风险评分
   */
  private calculateRiskScore(
    userBehavior: any,
    accessPatterns: any,
    securityIndicators: any,
    performanceIndicators: any,
    anomalies: any[]
  ): number {
    let score = 0;

    // 安全风险评分 (0-40)
    score += Math.min(securityIndicators.failedLogins / 10, 10); // 失败登录
    score += securityIndicators.bruteForceAttempts.length * 5; // 暴力破解
    score += securityIndicators.suspiciousActivities.length * 2; // 可疑活动
    score += accessPatterns.ipAnalysis.suspiciousIPs.length * 3; // 可疑IP

    // 异常风险评分 (0-30)
    const criticalAnomalies = anomalies.filter(a => a.severity === 'CRITICAL').length;
    const highAnomalies = anomalies.filter(a => a.severity === 'HIGH').length;
    const mediumAnomalies = anomalies.filter(a => a.severity === 'MEDIUM').length;
    
    score += criticalAnomalies * 10;
    score += highAnomalies * 5;
    score += mediumAnomalies * 2;

    // 性能风险评分 (0-20)
    score += Math.min(performanceIndicators.slowRequests.length / 5, 10);
    score += Math.min(performanceIndicators.errorPatterns.length / 2, 10);

    // 行为风险评分 (0-10)
    if (userBehavior.userSessionStats.avgSessionDuration > 7200000) score += 5; // 2小时
    if (userBehavior.activeUsers / userBehavior.totalUsers < 0.1) score += 5; // 活跃度低

    return Math.min(score, 100); // 最大100分
  }

  // ========== 辅助方法 ==========

  private extractSessions(userLogs: any[]): any[] {
    const sessionMap = new Map<string, any[]>();
    
    userLogs.forEach(log => {
      const sessionId = log.metadata?.sessionId || `${log.metadata.userId}_default`;
      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, []);
      }
      sessionMap.get(sessionId)!.push(log);
    });

    return Array.from(sessionMap.entries()).map(([sessionId, logs]) => ({
      sessionId,
      userId: logs[0].metadata.userId,
      logs: logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
      startTime: logs[0].timestamp,
      endTime: logs[logs.length - 1].timestamp,
      duration: new Date(logs[logs.length - 1].timestamp).getTime() - new Date(logs[0].timestamp).getTime(),
      actionCount: logs.length,
    }));
  }

  private calculateSessionStats(sessions: any[]): any {
    if (sessions.length === 0) {
      return {
        avgSessionDuration: 0,
        avgActionsPerSession: 0,
        maxConcurrentSessions: 0,
      };
    }

    const totalDuration = sessions.reduce((sum, session) => sum + session.duration, 0);
    const totalActions = sessions.reduce((sum, session) => sum + session.actionCount, 0);
    
    // 计算最大并发会话数（简化版）
    const maxConcurrentSessions = Math.max(...sessions.map(s => s.actionCount));

    return {
      avgSessionDuration: totalDuration / sessions.length,
      avgActionsPerSession: totalActions / sessions.length,
      maxConcurrentSessions,
    };
  }

  private extractBehaviorPatterns(userLogs: any[]): any[] {
    const patterns = new Map<string, Set<string>>();
    
    userLogs.forEach(log => {
      const action = log.metadata?.action || 'unknown';
      if (!patterns.has(action)) {
        patterns.set(action, new Set());
      }
      patterns.get(action)!.add(log.metadata.userId);
    });

    return Array.from(patterns.entries()).map(([pattern, userSet]) => {
      const frequency = userSet.size;
      const isAnomaly = frequency > userLogs.length * 0.1; // 超过10%的用户执行某个动作认为异常
      
      return {
        pattern,
        frequency,
        users: Array.from(userSet),
        isAnomaly,
      };
    });
  }

  private analyzeIPPatterns(logData: any[]): any {
    const ipLogs = logData.filter(log => log.metadata?.ip);
    const ipCounts = new Map<string, number>();
    
    ipLogs.forEach(log => {
      const ip = log.metadata.ip;
      ipCounts.set(ip, (ipCounts.get(ip) || 0) + 1);
    });

    const uniqueIPs = ipCounts.size;
    const totalRequests = ipLogs.length;
    const avgRequestsPerIP = totalRequests / uniqueIPs;

    // 识别可疑IP（请求次数异常高的IP）
    const suspiciousIPs = Array.from(ipCounts.entries())
      .filter(([ip, count]) => count > avgRequestsPerIP * 10)
      .map(([ip]) => ip);

    // 简化的地理分布（实际应该使用地理位置服务）
    const geoDistribution = Array.from(ipCounts.entries()).map(([ip, count]) => ({
      ip,
      count,
      country: 'Unknown', // 实际项目中应该查询IP地理位置
    }));

    return {
      uniqueIPs,
      suspiciousIPs,
      geoDistribution,
    };
  }

  private analyzeEndpointUsage(logData: any[]): any[] {
    const endpointLogs = logData.filter(log => log.metadata?.endpoint);
    const endpointStats = new Map<string, any>();

    endpointLogs.forEach(log => {
      const endpoint = log.metadata.endpoint;
      if (!endpointStats.has(endpoint)) {
        endpointStats.set(endpoint, {
          hitCount: 0,
          users: new Set(),
          responseTimes: [],
        });
      }

      const stats = endpointStats.get(endpoint)!;
      stats.hitCount++;
      if (log.metadata?.userId) {
        stats.users.add(log.metadata.userId);
      }
      if (log.metadata?.responseTime) {
        stats.responseTimes.push(log.metadata.responseTime);
      }
    });

    return Array.from(endpointStats.entries()).map(([endpoint, stats]) => ({
      endpoint,
      hitCount: stats.hitCount,
      uniqueUsers: stats.users.size,
      avgResponseTime: stats.responseTimes.length > 0
        ? stats.responseTimes.reduce((sum, time) => sum + time, 0) / stats.responseTimes.length
        : 0,
    }));
  }

  private analyzeTimePatterns(logData: any[]): any {
    const timestamps = logData.map(log => new Date(log.timestamp));
    
    // 按小时统计
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

    // 按星期几统计
    const weekdayDistribution = new Array(7).fill(0);
    timestamps.forEach(ts => {
      weekdayDistribution[ts.getDay()]++;
    });

    return {
      peakHours,
      weekdayDistribution,
    };
  }

  private countFailedLogins(logData: any[]): number {
    return logData.filter(log =>
      log.message.toLowerCase().includes('login') &&
      log.message.toLowerCase().includes('failed')
    ).length;
  }

  private detectSuspiciousActivities(logData: any[]): any[] {
    const suspicious = [];
    
    // 检测SQL注入尝试
    const sqlInjectionLogs = logData.filter(log =>
      log.message.toLowerCase().includes('sql') &&
      (log.message.includes("'") || log.message.includes('union') || log.message.includes('select'))
    );
    
    if (sqlInjectionLogs.length > 0) {
      suspicious.push({
        type: 'SQL_INJECTION_ATTEMPT',
        count: sqlInjectionLogs.length,
        description: `检测到 ${sqlInjectionLogs.length} 次SQL注入尝试`,
      });
    }

    // 检测XSS尝试
    const xssLogs = logData.filter(log =>
      log.message.includes('<script>') ||
      log.message.includes('javascript:') ||
      log.message.includes('onerror=')
    );
    
    if (xssLogs.length > 0) {
      suspicious.push({
        type: 'XSS_ATTEMPT',
        count: xssLogs.length,
        description: `检测到 ${xssLogs.length} 次XSS攻击尝试`,
      });
    }

    return suspicious;
  }

  private detectBruteForceAttempts(logData: any[]): any[] {
    const failedLogins = logData.filter(log =>
      log.message.toLowerCase().includes('login') &&
      log.message.toLowerCase().includes('failed')
    );

    // 按IP分组统计失败登录
    const ipFailures = new Map<string, any[]>();
    failedLogins.forEach(log => {
      const ip = log.metadata?.ip || 'unknown';
      if (!ipFailures.has(ip)) {
        ipFailures.set(ip, []);
      }
      ipFailures.get(ip)!.push(log);
    });

    // 识别暴力破解（短时间内多次失败登录）
    const bruteForceAttempts = [];
    for (const [ip, failures] of ipFailures.entries()) {
      if (failures.length > 10) { // 超过10次失败登录
        bruteForceAttempts.push({
          ip,
          attempts: failures.length,
          timespan: this.calculateTimespan(failures),
          description: `IP ${ip} 在短时间内尝试登录 ${failures.length} 次`,
        });
      }
    }

    return bruteForceAttempts;
  }

  private detectAbnormalAccess(logData: any[]): any[] {
    const abnormal = [];
    
    // 检测异常访问时间（非工作时间的大量访问）
    const nightLogs = logData.filter(log => {
      const hour = new Date(log.timestamp).getHours();
      return hour < 6 || hour > 22; // 晚上10点到早上6点
    });

    if (nightLogs.length > logData.length * 0.3) { // 超过30%的日志在非工作时间
      abnormal.push({
        type: 'OFF_HOURS_ACCESS',
        count: nightLogs.length,
        percentage: (nightLogs.length / logData.length * 100).toFixed(1),
        description: `${nightLogs.length} 次非工作时间访问 (${(nightLogs.length / logData.length * 100).toFixed(1)}%)`,
      });
    }

    return abnormal;
  }

  private identifySlowRequests(logData: any[]): any[] {
    const requestLogs = logData.filter(log => log.metadata?.responseTime);
    return requestLogs
      .filter(log => log.metadata.responseTime > 5000) // 超过5秒的请求
      .map(log => ({
        timestamp: log.timestamp,
        endpoint: log.metadata?.endpoint,
        responseTime: log.metadata.responseTime,
        userId: log.metadata?.userId,
      }));
  }

  private analyzeErrorPatterns(logData: any[]): any[] {
    const errorLogs = logData.filter(log => log.level === 'ERROR');
    const patterns = new Map<string, number>();

    errorLogs.forEach(log => {
      const pattern = this.extractErrorPattern(log.message);
      patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
    });

    return Array.from(patterns.entries())
      .filter(([pattern, count]) => count > 1)
      .map(([pattern, count]) => ({
        pattern,
        count,
        frequency: count / errorLogs.length,
      }));
  }

  private analyzeResourceUsage(logData: any[]): any {
    // 简化的资源使用分析
    const resourceLogs = logData.filter(log => log.metadata?.resource);
    
    return {
      totalResourceRequests: resourceLogs.length,
      avgResourceUsage: resourceLogs.length > 0 
        ? resourceLogs.reduce((sum, log) => sum + (log.metadata.resource || 0), 0) / resourceLogs.length
        : 0,
    };
  }

  private calculateTimespan(logs: any[]): number {
    if (logs.length < 2) return 0;
    
    const timestamps = logs.map(log => new Date(log.timestamp).getTime()).sort();
    return timestamps[timestamps.length - 1] - timestamps[0];
  }

  private extractErrorPattern(message: string): string {
    // 标准化错误模式
    return message
      .replace(/\d+/g, 'NUM')
      .replace(/[a-fA-F0-9-]{36}/g, 'UUID')
      .toLowerCase()
      .substring(0, 100); // 截取前100个字符
  }

  private calculateConfidence(result: BehaviorAnalysisResult): number {
    let score = 0;
    let maxScore = 0;

    // 用户行为数据完整性
    if (result.userBehavior.totalUsers > 0) score += 25;
    maxScore += 25;

    // 访问模式数据完整性
    if (result.accessPatterns.endpointUsage.length > 0) score += 25;
    maxScore += 25;

    // 安全指标数据完整性
    if (result.securityIndicators.failedLogins >= 0) score += 25;
    maxScore += 25;

    // 性能指标数据完整性
    if (result.performanceIndicators.slowRequests.length >= 0) score += 25;
    maxScore += 25;

    return maxScore > 0 ? score / maxScore : 0;
  }
}
