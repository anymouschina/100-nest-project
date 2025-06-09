import { Injectable, Logger } from '@nestjs/common';

export interface AnalysisResult {
  analysisResult: any;
  suggestions: string[];
  similarIssues: any[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface UserLogsResult {
  logs: any[];
  totalCount: number;
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface HealthCheckResult {
  overallHealth: 'GOOD' | 'WARNING' | 'CRITICAL';
  summary: {
    totalLogs: number;
    errorCount: number;
    warningCount: number;
    criticalIssues: number;
  };
  issues: Array<{
    type: string;
    severity: string;
    count: number;
    examples: string[];
  }>;
  recommendations: string[];
}

@Injectable()
export class LogAnalysisSimplifiedService {
  private readonly logger = new Logger(LogAnalysisSimplifiedService.name);

  /**
   * 通过用户ID分析日志
   */
  async analyzeUserLogs(options: {
    userId: number;
    timeRange?: {
      startTime: Date;
      endTime: Date;
    };
    logSources?: string[];
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    userFeedback?: string;
  }): Promise<{
    taskId: string;
    message: string;
    logCount: number;
  }> {
    const { userId, userFeedback } = options;

    try {
      // 模拟查询用户日志
      const simulatedLogs = this.generateUserLogs(userId);

      const taskId = this.generateTaskId();

      this.logger.log(`创建用户日志分析任务: ${taskId}, 用户ID: ${userId}`);

      // 模拟异步分析过程
      setTimeout(() => {
        this.logger.log(`用户日志分析完成: ${taskId}`);
      }, 1000);

      return {
        taskId,
        message: `已创建分析任务，正在分析用户${userId}的${simulatedLogs.length}条日志`,
        logCount: simulatedLogs.length,
      };
    } catch (error) {
      this.logger.error(`用户日志分析失败: userId=${userId}`, error.stack);
      throw error;
    }
  }

  /**
   * 手动输入日志进行即时分析
   */
  async analyzeManualLog(options: {
    userFeedback: string;
    logData:
      | string[]
      | {
          timestamp?: Date;
          level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
          source: string;
          service?: string;
          message: string;
          stackTrace?: string;
          metadata?: Record<string, any>;
        };
    analysisOptions?: {
      enableFeatureExtraction?: boolean;
      enableSimilarSearch?: boolean;
      enableAnomalyDetection?: boolean;
    };
  }): Promise<AnalysisResult> {
    const { userFeedback, logData, analysisOptions = {} } = options;

    try {
      // 1. 处理不同格式的日志数据
      let parsedLogData: {
        timestamp: Date;
        level: string;
        source: string;
        service: string;
        message: string;
        stackTrace?: string;
        metadata: Record<string, any>;
      };

      if (Array.isArray(logData)) {
        // 处理字符串数组格式
        parsedLogData = this.parseLogStrings(logData);
      } else {
        // 处理结构化对象格式
        parsedLogData = {
          timestamp: logData.timestamp || new Date(),
          level: logData.level,
          source: logData.source,
          service: logData.service || 'unknown',
          message: logData.message,
          stackTrace: logData.stackTrace,
          metadata: logData.metadata || {},
        };
      }

      // 2. 标准化日志数据
      const normalizedLog = {
        id: `manual_${Date.now()}`,
        ...parsedLogData,
        userFeedback,
      };

      // 2. 基础问题类型检测
      const issueType = this.detectIssueType(normalizedLog);

      // 3. 严重程度分析
      const riskLevel = this.analyzeSeverity(normalizedLog, issueType);

      // 4. 生成基础分析结果
      const analysisResult: any = {
        issueType,
        severity: riskLevel,
        timestamp: normalizedLog.timestamp,
        source: normalizedLog.source,
        detectedPatterns: this.detectErrorPatterns(parsedLogData.message),
      };

      const suggestions: string[] = [];
      let similarIssues: any[] = [];

      // 5. 可选功能处理
      if (analysisOptions.enableFeatureExtraction) {
        analysisResult.extractedFeatures =
          this.extractBasicFeatures(normalizedLog);
      }

      if (analysisOptions.enableSimilarSearch) {
        similarIssues = this.findSimilarIssues(normalizedLog);
      }

      if (analysisOptions.enableAnomalyDetection) {
        const anomalyScore = this.detectAnomaly(normalizedLog);
        analysisResult.anomalyScore = anomalyScore;

        if (anomalyScore > 0.8) {
          suggestions.unshift('⚠️ 检测到异常模式，建议立即调查');
        }
      }

      // 6. 生成建议
      suggestions.push(
        ...this.generateSuggestions(normalizedLog, issueType, similarIssues),
      );

      this.logger.log(`手动日志分析完成: ${issueType}, 风险等级: ${riskLevel}`);

      return {
        analysisResult,
        suggestions,
        similarIssues,
        riskLevel,
      };
    } catch (error) {
      this.logger.error('手动日志分析失败', error.stack);
      throw error;
    }
  }

  /**
   * 解析字符串数组格式的日志
   */
  private parseLogStrings(logStrings: string[]): {
    timestamp: Date;
    level: string;
    source: string;
    service: string;
    message: string;
    stackTrace?: string;
    metadata: Record<string, any>;
  } {
    // 将所有日志字符串合并
    const combinedLogs = logStrings.join('\n');

    // 尝试解析JSON格式的日志
    const parsedLogs: any[] = [];
    try {
      // 尝试解析为JSON数组
      const jsonString = combinedLogs.replace(/[\[\]]/g, '').replace(/,\s*}/g, '}');
      const lines = jsonString.split('\n').filter(line => line.trim());
      let currentObject = '';
      
      for (const line of lines) {
        currentObject += line.trim();
        if (line.trim().endsWith('},') || line.trim().endsWith('}')) {
          try {
            const cleanObj = currentObject.replace(/,$/, '');
            const parsed = JSON.parse(cleanObj);
            parsedLogs.push(parsed);
            currentObject = '';
          } catch (e) {
            // 继续累积行
          }
        }
      }
    } catch (e) {
      // JSON解析失败，使用文本解析
    }

    // 如果成功解析JSON，分析所有日志条目
    if (parsedLogs.length > 0) {
      return this.analyzeStructuredLogs(parsedLogs);
    }

    // 回退到原始的文本解析逻辑
    const result = {
      timestamp: new Date(),
      level: 'INFO', // 改为更合理的默认值
      source: 'unknown',
      service: 'unknown',
      message: combinedLogs,
      stackTrace: undefined as string | undefined,
      metadata: {} as Record<string, any>,
    };

    // 检测日志级别
    const levelMatch = combinedLogs.match(
      /\b(DEBUG|INFO|WARN|WARNING|ERROR|FATAL|CRITICAL)\b/i,
    );
    if (levelMatch) {
      result.level = levelMatch[1].toUpperCase();
    }

    // 检测来源
    if (
      combinedLogs.toLowerCase().includes('frontend') ||
      combinedLogs.toLowerCase().includes('react') ||
      combinedLogs.toLowerCase().includes('js')
    ) {
      result.source = 'frontend';
    } else if (
      combinedLogs.toLowerCase().includes('backend') ||
      combinedLogs.toLowerCase().includes('server') ||
      combinedLogs.toLowerCase().includes('api')
    ) {
      result.source = 'backend';
    } else if (
      combinedLogs.toLowerCase().includes('mobile') ||
      combinedLogs.toLowerCase().includes('app') ||
      combinedLogs.toLowerCase().includes('ios') ||
      combinedLogs.toLowerCase().includes('android')
    ) {
      result.source = 'mobile';
    }

    // 检测服务名
    const serviceMatch = combinedLogs.match(/service[:\s]+([a-zA-Z0-9-_]+)/i);
    if (serviceMatch) {
      result.service = serviceMatch[1];
    }

    // 提取时间戳
    const timestampMatch = combinedLogs.match(
      /(\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2})/,
    );
    if (timestampMatch) {
      try {
        result.timestamp = new Date(timestampMatch[1]);
      } catch (e) {
        // 保持默认时间戳
      }
    }

    // 检查是否有堆栈跟踪
    if (combinedLogs.includes('at ') && combinedLogs.includes('(')) {
      const stackStart = combinedLogs.indexOf('at ');
      if (stackStart !== -1) {
        result.stackTrace = combinedLogs.substring(stackStart);
      }
    }

    // 提取元数据
    try {
      // 查找JSON格式的数据
      const jsonMatch = combinedLogs.match(/\{[^{}]*\}/);
      if (jsonMatch) {
        result.metadata = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // JSON解析失败，保持空对象
    }

    // 简化消息，移除重复信息
    let cleanMessage = combinedLogs;
    if (result.stackTrace) {
      cleanMessage = cleanMessage.replace(result.stackTrace, '').trim();
    }

    // 限制消息长度
    if (cleanMessage.length > 500) {
      cleanMessage = cleanMessage.substring(0, 500) + '...';
    }

    result.message = cleanMessage || combinedLogs;

    return result;
  }

  /**
   * 分析结构化日志数据
   */
  private analyzeStructuredLogs(parsedLogs: any[]): {
    timestamp: Date;
    level: string;
    source: string;
    service: string;
    message: string;
    stackTrace?: string;
    metadata: Record<string, any>;
  } {
    // 找到最严重的日志级别
    const severityOrder = { DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4, FATAL: 5 };
    
    let mostSevereLog = parsedLogs[0];
    let maxSeverity = 0;

    // 收集所有重要信息
    const errorLogs: any[] = [];
    const allMessages: string[] = [];
    let combinedStackTrace = '';

    for (const log of parsedLogs) {
      const logLevel = (log.log_level || log.level || 'INFO').toUpperCase();
      const severity = severityOrder[logLevel] || 2;
      
      allMessages.push(`[${logLevel}] ${log.module || log.service || 'unknown'}: ${log.message}`);

      if (severity >= maxSeverity) {
        maxSeverity = severity;
        mostSevereLog = log;
      }

      if (logLevel === 'ERROR') {
        errorLogs.push(log);
        if (log.metadata?.stacktrace) {
          combinedStackTrace += log.metadata.stacktrace + '\n';
        }
      }
    }

    // 构建综合分析结果
    const result = {
      timestamp: new Date(mostSevereLog.timestamp || new Date()),
      level: (mostSevereLog.log_level || mostSevereLog.level || 'INFO').toUpperCase(),
      source: this.determineLogSource(mostSevereLog),
      service: mostSevereLog.module || mostSevereLog.service || 'unknown',
      message: errorLogs.length > 0 
        ? errorLogs.map(log => log.message).join('; ')
        : allMessages.join('; '),
      stackTrace: combinedStackTrace || undefined,
      metadata: {
        totalLogs: parsedLogs.length,
        errorCount: errorLogs.length,
        logSummary: allMessages,
        mostSevereLog: mostSevereLog,
        ...mostSevereLog.metadata,
      },
    };

    return result;
  }

  /**
   * 确定日志来源
   */
  private determineLogSource(log: any): string {
    const module = (log.module || log.service || '').toLowerCase();
    
    if (module.includes('auth') || module.includes('user')) {
      return 'auth-service';
    } else if (module.includes('order') || module.includes('payment')) {
      return 'order-service';
    } else if (module.includes('product') || module.includes('catalog')) {
      return 'product-service';
    } else if (module.includes('cart')) {
      return 'cart-service';
    } else if (module.includes('db') || module.includes('database')) {
      return 'database';
    }
    
    return 'backend';
  }

  /**
   * 获取用户历史日志
   */
  async getUserLogs(options: {
    userId: number;
    startDate?: Date;
    endDate?: Date;
    level?: string;
    source?: string;
    limit?: number;
    offset?: number;
  }): Promise<UserLogsResult> {
    const { userId, limit = 100, offset = 0 } = options;

    try {
      // 模拟数据库查询
      const allLogs = this.generateUserLogs(userId);
      const totalCount = allLogs.length;

      // 模拟分页
      const logs = allLogs.slice(offset, offset + limit);

      return {
        logs,
        totalCount,
        pagination: {
          limit,
          offset,
          hasMore: offset + logs.length < totalCount,
        },
      };
    } catch (error) {
      this.logger.error(`获取用户日志失败: userId=${userId}`, error.stack);
      throw error;
    }
  }

  /**
   * 快速日志健康检查
   */
  async quickLogCheck(options: {
    logEntries: Array<{
      level: string;
      source: string;
      message: string;
      metadata?: Record<string, any>;
    }>;
    checkOptions?: {
      checkSeverity?: boolean;
      checkPatterns?: boolean;
      checkAnomalies?: boolean;
    };
  }): Promise<HealthCheckResult> {
    const { logEntries, checkOptions = {} } = options;
    const { checkSeverity = true, checkPatterns = true } = checkOptions;

    try {
      const issues: Array<{
        type: string;
        severity: string;
        count: number;
        examples: string[];
      }> = [];

      let errorCount = 0;
      let warningCount = 0;
      let criticalIssues = 0;

      // 统计分析
      const patternCounts: Record<
        string,
        { count: number; examples: string[] }
      > = {};

      for (const logEntry of logEntries) {
        const level = logEntry.level.toUpperCase();

        if (level === 'ERROR') errorCount++;
        if (level === 'WARN') warningCount++;

        // 检查严重程度
        if (checkSeverity && this.isCriticalError(logEntry)) {
          criticalIssues++;
        }

        // 检查错误模式
        if (checkPatterns) {
          const detectedPatterns = this.detectErrorPatterns(logEntry.message);

          for (const pattern of detectedPatterns) {
            if (!patternCounts[pattern.type]) {
              patternCounts[pattern.type] = { count: 0, examples: [] };
            }
            patternCounts[pattern.type].count++;

            if (patternCounts[pattern.type].examples.length < 3) {
              patternCounts[pattern.type].examples.push(
                logEntry.message.substring(0, 100),
              );
            }
          }
        }
      }

      // 生成问题报告
      for (const [patternType, data] of Object.entries(patternCounts)) {
        if (data.count > 0) {
          issues.push({
            type: patternType,
            severity: this.getPatternSeverity(patternType),
            count: data.count,
            examples: data.examples,
          });
        }
      }

      // 计算整体健康状态
      let overallHealth: 'GOOD' | 'WARNING' | 'CRITICAL' = 'GOOD';

      if (criticalIssues > 0) {
        overallHealth = 'CRITICAL';
      } else if (
        errorCount > logEntries.length * 0.1 ||
        warningCount > logEntries.length * 0.3
      ) {
        overallHealth = 'WARNING';
      }

      // 生成建议
      const recommendations = this.generateHealthRecommendations({
        totalLogs: logEntries.length,
        errorCount,
        warningCount,
        criticalIssues,
        issues,
        overallHealth,
      });

      return {
        overallHealth,
        summary: {
          totalLogs: logEntries.length,
          errorCount,
          warningCount,
          criticalIssues,
        },
        issues,
        recommendations,
      };
    } catch (error) {
      this.logger.error('快速日志检查失败', error.stack);
      throw error;
    }
  }

  // ==================== 私有辅助方法 ====================

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private generateUserLogs(userId: number): any[] {
    // 模拟用户日志数据
    return [
      {
        id: `log_${userId}_1`,
        timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10分钟前
        level: 'ERROR',
        source: 'backend',
        service: 'payment-service',
        message: 'Payment processing failed: insufficient funds',
        userId,
        metadata: { orderId: 'ORD-001', retCode: 400 },
      },
      {
        id: `log_${userId}_2`,
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5分钟前
        level: 'WARN',
        source: 'frontend',
        service: 'ui-service',
        message: 'API response time exceeded threshold',
        userId,
        metadata: { responseTime: 5000 },
      },
      {
        id: `log_${userId}_3`,
        timestamp: new Date(),
        level: 'INFO',
        source: 'mobile',
        service: 'app-service',
        message: 'User login successful',
        userId,
        metadata: { deviceType: 'iOS' },
      },
    ];
  }

  private detectIssueType(logEntry: any): string {
    const { message, level, source, metadata, service } = logEntry;
    const lowerMessage = message.toLowerCase();

    // 数据库相关错误
    if (lowerMessage.includes('database') || lowerMessage.includes('connection') || 
        lowerMessage.includes('timeout') || metadata?.error_code?.includes('DB_')) {
      return 'DATABASE_ERROR';
    }

    // 订单服务错误
    if (service === 'order-service' || lowerMessage.includes('order') || lowerMessage.includes('订单')) {
      return 'ORDER_SERVICE_ERROR';
    }

    // 支付相关错误
    if (lowerMessage.includes('payment') || lowerMessage.includes('支付')) {
      return 'PAYMENT_ERROR';
    }

    // 认证服务错误
    if (service === 'auth-service' || lowerMessage.includes('auth') || lowerMessage.includes('login')) {
      return 'AUTH_SERVICE_ERROR';
    }

    // 网络/连接错误
    if (lowerMessage.includes('connection') || lowerMessage.includes('network') || 
        lowerMessage.includes('econnrefused') || lowerMessage.includes('timeout')) {
      return 'CONNECTION_ERROR';
    }

    // 前端错误
    if (source === 'frontend' || source.includes('frontend')) {
      return 'FRONTEND_ERROR';
    }

    // 后端API错误
    if (source === 'backend' && metadata?.retCode && metadata.retCode !== 0) {
      return 'BACKEND_API_ERROR';
    }

    // 基于错误级别的分类
    if (level === 'ERROR') {
      return 'GENERIC_ERROR';
    }

    if (level === 'WARN') {
      return 'WARNING_LOG';
    }

    return 'INFO_LOG';
  }

  private analyzeSeverity(
    logEntry: any,
    issueType: string,
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const severityMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> =
      {
        BACKEND_RET_ERROR: 'HIGH',
        FRONTEND_JS_ERROR: 'MEDIUM',
        PAYMENT_ERROR: 'CRITICAL',
        GENERIC_ERROR: 'MEDIUM',
        INFO_LOG: 'LOW',
      };

    let severity = severityMap[issueType] || 'LOW';

    // 支付相关问题提升优先级
    if (
      logEntry.metadata?.affectsPayment ||
      logEntry.message.toLowerCase().includes('payment')
    ) {
      severity = 'CRITICAL';
    }

    return severity;
  }

  private extractBasicFeatures(logEntry: any): any[] {
    return [
      {
        type: 'LOG_LEVEL',
        value: logEntry.level,
        importance: 0.8,
      },
      {
        type: 'SOURCE',
        value: logEntry.source,
        importance: 0.7,
      },
      {
        type: 'MESSAGE_LENGTH',
        value: logEntry.message.length,
        importance: 0.5,
      },
    ];
  }

  private findSimilarIssues(logEntry: any): any[] {
    // 模拟相似问题搜索
    return [
      {
        id: 'similar_1',
        similarity: 0.85,
        description: '类似的支付失败问题',
        metadata: {
          resolution: '检查支付网关配置',
          resolvedAt: '2024-01-15',
        },
      },
      {
        id: 'similar_2',
        similarity: 0.72,
        description: '用户余额不足错误',
        metadata: {
          resolution: '引导用户充值',
          resolvedAt: '2024-01-10',
        },
      },
    ];
  }

  private generateSuggestions(
    logEntry: any,
    issueType: string,
    similarIssues: any[],
  ): string[] {
    const suggestions: string[] = [];

    // 基于问题类型的建议
    const typeSuggestions: Record<string, string[]> = {
      DATABASE_ERROR: [
        '🔍 检查数据库连接配置',
        '📊 查看数据库连接池状态',
        '⚡ 检查数据库服务器负载',
        '🔧 验证数据库访问权限',
        '📈 监控数据库性能指标',
      ],
      ORDER_SERVICE_ERROR: [
        '📦 检查订单服务依赖状态',
        '💾 验证数据库连接和事务',
        '🔄 检查订单处理流程',
        '📝 查看订单服务日志',
        '⚡ 检查服务器资源使用情况',
      ],
      CONNECTION_ERROR: [
        '🌐 检查网络连接状态',
        '🔗 验证服务间通信配置',
        '⏱️ 检查连接超时设置',
        '🔄 考虑增加重试机制',
        '📡 检查防火墙和代理设置',
      ],
      PAYMENT_ERROR: [
        '💳 检查支付网关状态',
        '💰 验证用户账户余额',
        '🔐 确认支付参数正确性',
        '🏦 检查支付接口配置',
        '📋 查看支付流程日志',
      ],
      AUTH_SERVICE_ERROR: [
        '🔐 检查认证服务状态',
        '🔑 验证用户凭证',
        '⏰ 检查Token有效期',
        '🛡️ 查看权限配置',
        '📱 验证登录流程',
      ],
      FRONTEND_ERROR: [
        '🐛 检查前端错误处理',
        '📱 验证组件状态管理',
        '🔄 确认API调用逻辑',
        '📊 检查数据格式验证',
        '🎨 查看UI组件错误',
      ],
      BACKEND_API_ERROR: [
        '🔧 检查API返回码逻辑',
        '🔗 验证服务依赖状态',
        '📈 查看API性能指标',
        '🛡️ 检查请求参数验证',
        '📋 查看API访问日志',
      ],
      GENERIC_ERROR: [
        '📋 查看完整错误堆栈',
        '🔍 检查系统资源状态',
        '⚡ 确认操作前置条件',
        '📊 监控系统性能指标',
        '🔄 尝试重现问题场景',
      ],
      WARNING_LOG: [
        '⚠️ 关注警告信息趋势',
        '📊 监控相关性能指标',
        '🔍 预防性检查相关组件',
        '📈 分析警告出现频率',
      ],
      INFO_LOG: [
        '✅ 系统运行正常',
        '📊 可继续监控系统状态',
        '📈 关注业务指标变化',
      ],
    };

    if (typeSuggestions[issueType]) {
      suggestions.push(...typeSuggestions[issueType]);
    }

    // 基于相似问题的建议
    if (similarIssues.length > 0) {
      suggestions.push('参考相似问题的解决方案');

      const resolutions = similarIssues
        .map((issue) => issue.metadata?.resolution)
        .filter(Boolean);

      if (resolutions.length > 0) {
        suggestions.push(`历史解决方案：${resolutions[0]}`);
      }
    }

    return suggestions;
  }

  private detectAnomaly(logEntry: any): number {
    let score = 0;

    // 检查消息长度异常
    if (logEntry.message.length > 1000) {
      score += 0.3;
    }

    // 检查是否包含异常关键词
    const anomalyKeywords = [
      'crash',
      'panic',
      'fatal',
      'corruption',
      'memory leak',
    ];
    const hasAnomalyKeyword = anomalyKeywords.some((keyword) =>
      logEntry.message.toLowerCase().includes(keyword),
    );

    if (hasAnomalyKeyword) {
      score += 0.5;
    }

    // 检查元数据异常
    if (logEntry.metadata?.retCode && logEntry.metadata.retCode >= 500) {
      score += 0.4;
    }

    return Math.min(1.0, score);
  }

  private isCriticalError(logEntry: any): boolean {
    const criticalKeywords = [
      'fatal',
      'critical',
      'panic',
      'crash',
      'deadlock',
    ];

    return (
      logEntry.level === 'ERROR' &&
      criticalKeywords.some((keyword) =>
        logEntry.message.toLowerCase().includes(keyword),
      )
    );
  }

  private detectErrorPatterns(
    message: string,
  ): Array<{ type: string; confidence: number }> {
    const patterns = [
      {
        regex: /null.*reference|cannot.*read.*property.*null/i,
        type: 'NULL_POINTER_ERROR',
        confidence: 0.9,
      },
      {
        regex: /timeout|timed.*out/i,
        type: 'TIMEOUT_ERROR',
        confidence: 0.8,
      },
      {
        regex: /connection.*failed|connection.*refused/i,
        type: 'CONNECTION_ERROR',
        confidence: 0.8,
      },
      {
        regex: /memory.*error|out.*of.*memory/i,
        type: 'MEMORY_ERROR',
        confidence: 0.9,
      },
      {
        regex: /payment.*fail|insufficient.*fund/i,
        type: 'PAYMENT_ERROR',
        confidence: 0.9,
      },
    ];

    return patterns
      .filter((pattern) => pattern.regex.test(message))
      .map((pattern) => ({
        type: pattern.type,
        confidence: pattern.confidence,
      }));
  }

  private getPatternSeverity(patternType: string): string {
    const severityMap: Record<string, string> = {
      NULL_POINTER_ERROR: 'HIGH',
      TIMEOUT_ERROR: 'MEDIUM',
      CONNECTION_ERROR: 'HIGH',
      MEMORY_ERROR: 'CRITICAL',
      PAYMENT_ERROR: 'CRITICAL',
    };

    return severityMap[patternType] || 'MEDIUM';
  }

  private generateHealthRecommendations(healthData: {
    totalLogs: number;
    errorCount: number;
    warningCount: number;
    criticalIssues: number;
    issues: any[];
    overallHealth: string;
  }): string[] {
    const recommendations: string[] = [];

    if (healthData.overallHealth === 'CRITICAL') {
      recommendations.push('🚨 发现严重问题，建议立即处理');
    }

    if (healthData.errorCount > healthData.totalLogs * 0.1) {
      recommendations.push('⚠️ 错误率偏高，建议检查系统稳定性');
    }

    if (healthData.criticalIssues > 0) {
      recommendations.push('🔴 发现致命错误，优先处理critical级别问题');
    }

    // 基于具体问题类型的建议
    const memoryIssues = healthData.issues.filter(
      (issue) => issue.type === 'MEMORY_ERROR',
    );
    if (memoryIssues.length > 0) {
      recommendations.push('💾 检测到内存问题，建议检查内存泄漏');
    }

    const connectionIssues = healthData.issues.filter(
      (issue) => issue.type === 'CONNECTION_ERROR',
    );
    if (connectionIssues.length > 0) {
      recommendations.push('🔗 检测到连接问题，建议检查网络和服务依赖');
    }

    const paymentIssues = healthData.issues.filter(
      (issue) => issue.type === 'PAYMENT_ERROR',
    );
    if (paymentIssues.length > 0) {
      recommendations.push('💳 检测到支付问题，建议检查支付网关和用户账户');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ 系统运行正常，保持当前监控策略');
    }

    return recommendations;
  }
}
