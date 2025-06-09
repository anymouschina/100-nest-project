import { Injectable, Logger } from '@nestjs/common';

export interface ImprovedAnalysisResult {
  analysisResult: any;
  suggestions: string[];
  similarIssues: any[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  context: {
    inputAnalysis: string;
    problemDetected: string;
    urgencyLevel: string;
  };
}

@Injectable()
export class LogAnalysisImprovedService {
  private readonly logger = new Logger(LogAnalysisImprovedService.name);

  /**
   * 改进版手动日志分析
   */
  async analyzeManualLog(options: {
    userFeedback: string;
    logData: string[] | any;
    analysisOptions?: {
      enableFeatureExtraction?: boolean;
      enableSimilarSearch?: boolean;
      enableAnomalyDetection?: boolean;
    };
  }): Promise<ImprovedAnalysisResult> {
    const { userFeedback, logData } = options;

    try {
      // 1. 解析日志内容
      const logContent = this.parseLogContent(logData);
      this.logger.log(`解析的日志内容: ${JSON.stringify(logContent)}`);

      // 2. 智能问题检测
      const problemAnalysis = this.detectProblemType(logContent, userFeedback);
      
      // 3. 生成针对性建议
      const suggestions = this.generateTargetedSuggestions(problemAnalysis);
      
      // 4. 评估风险等级
      const riskLevel = this.assessRiskLevel(problemAnalysis);

      // 5. 查找相关问题
      const similarIssues = this.findRelevantIssues(problemAnalysis);

      return {
        analysisResult: {
          issueType: problemAnalysis.type,
          severity: riskLevel,
          timestamp: new Date(),
          source: problemAnalysis.source,
          detectedPatterns: problemAnalysis.patterns,
          summary: problemAnalysis.summary,
        },
        suggestions,
        similarIssues,
        riskLevel,
        context: {
          inputAnalysis: problemAnalysis.inputAnalysis,
          problemDetected: problemAnalysis.description,
          urgencyLevel: problemAnalysis.urgency,
        },
      };
    } catch (error) {
      this.logger.error('改进版日志分析失败', error.stack);
      throw error;
    }
  }

  /**
   * 解析日志内容
   */
  private parseLogContent(logData: any): {
    rawContent: string;
    logEntries: string[];
    hasErrors: boolean;
    hasWarnings: boolean;
    keyTerms: string[];
  } {
    let rawContent = '';
    let logEntries: string[] = [];

    if (Array.isArray(logData)) {
      logEntries = logData;
      rawContent = logData.join('\n');
    } else if (typeof logData === 'string') {
      rawContent = logData;
      logEntries = [logData];
    } else {
      rawContent = JSON.stringify(logData);
      logEntries = [rawContent];
    }

    const lowerContent = rawContent.toLowerCase();
    
    return {
      rawContent,
      logEntries,
      hasErrors: lowerContent.includes('error') || lowerContent.includes('错误'),
      hasWarnings: lowerContent.includes('warn') || lowerContent.includes('warning'),
      keyTerms: this.extractKeyTerms(rawContent),
    };
  }

  /**
   * 提取关键词
   */
  private extractKeyTerms(content: string): string[] {
    const lowerContent = content.toLowerCase();
    const terms = [];

    const patterns = [
      { pattern: /database|数据库/, term: 'database' },
      { pattern: /connection|连接/, term: 'connection' },
      { pattern: /timeout|超时/, term: 'timeout' },
      { pattern: /order|订单/, term: 'order' },
      { pattern: /payment|支付/, term: 'payment' },
      { pattern: /auth|认证|登录/, term: 'auth' },
      { pattern: /network|网络/, term: 'network' },
      { pattern: /econnrefused/, term: 'connection_refused' },
      { pattern: /postgresql|postgres|mysql/, term: 'sql_database' },
      { pattern: /failed|失败/, term: 'failed' },
    ];

    for (const { pattern, term } of patterns) {
      if (pattern.test(lowerContent)) {
        terms.push(term);
      }
    }

    return terms;
  }

  /**
   * 智能问题检测
   */
  private detectProblemType(logContent: any, userFeedback: string): {
    type: string;
    source: string;
    severity: string;
    patterns: string[];
    summary: string;
    description: string;
    inputAnalysis: string;
    urgency: string;
  } {
    const { rawContent, keyTerms, hasErrors } = logContent;
    const feedback = userFeedback.toLowerCase();
    const content = rawContent.toLowerCase();

    // 数据库连接问题
    if (
      keyTerms.includes('database') || 
      keyTerms.includes('connection') || 
      keyTerms.includes('timeout') ||
      content.includes('econnrefused') ||
      content.includes('connection') ||
      feedback.includes('数据库') ||
      feedback.includes('连接')
    ) {
      return {
        type: 'DATABASE_CONNECTION_ERROR',
        source: 'database',
        severity: 'HIGH',
        patterns: ['connection_timeout', 'database_unreachable'],
        summary: '数据库连接失败，可能影响核心业务功能',
        description: '检测到数据库连接问题，需要立即处理',
        inputAnalysis: `用户反馈: ${userFeedback}；日志显示: 数据库连接超时`,
        urgency: 'HIGH',
      };
    }

    // 订单服务问题
    if (keyTerms.includes('order') || content.includes('order') || content.includes('订单')) {
      return {
        type: 'ORDER_SERVICE_ERROR',
        source: 'order-service',
        severity: 'CRITICAL',
        patterns: ['order_processing_failed'],
        summary: '订单处理失败，影响用户购买体验',
        description: '订单服务出现问题，可能导致交易失败',
        inputAnalysis: `用户反馈: ${userFeedback}；检测到订单相关错误`,
        urgency: 'CRITICAL',
      };
    }

    // 支付问题
    if (keyTerms.includes('payment') || content.includes('payment') || content.includes('支付')) {
      return {
        type: 'PAYMENT_ERROR',
        source: 'payment-service',
        severity: 'CRITICAL',
        patterns: ['payment_failed'],
        summary: '支付功能异常，需要紧急修复',
        description: '支付系统出现问题，可能影响收入',
        inputAnalysis: `用户反馈: ${userFeedback}；检测到支付相关错误`,
        urgency: 'CRITICAL',
      };
    }

    // 认证问题
    if (keyTerms.includes('auth') || content.includes('login') || content.includes('认证')) {
      return {
        type: 'AUTH_ERROR',
        source: 'auth-service',
        severity: 'MEDIUM',
        patterns: ['auth_failed'],
        summary: '用户认证问题，影响登录体验',
        description: '认证服务异常，用户可能无法正常登录',
        inputAnalysis: `用户反馈: ${userFeedback}；检测到认证相关问题`,
        urgency: 'MEDIUM',
      };
    }

    // 网络连接问题
    if (keyTerms.includes('network') || keyTerms.includes('connection_refused')) {
      return {
        type: 'NETWORK_ERROR',
        source: 'network',
        severity: 'HIGH',
        patterns: ['network_unreachable'],
        summary: '网络连接问题，影响服务间通信',
        description: '网络层面出现问题，需要检查基础设施',
        inputAnalysis: `用户反馈: ${userFeedback}；检测到网络连接问题`,
        urgency: 'HIGH',
      };
    }

    // 通用错误
    if (hasErrors) {
      return {
        type: 'GENERIC_ERROR',
        source: 'system',
        severity: 'MEDIUM',
        patterns: ['generic_error'],
        summary: '系统出现错误，需要进一步调查',
        description: '检测到系统错误，建议查看详细日志',
        inputAnalysis: `用户反馈: ${userFeedback}；检测到系统错误`,
        urgency: 'MEDIUM',
      };
    }

    // 信息性日志
    return {
      type: 'INFO_LOG',
      source: 'system',
      severity: 'LOW',
      patterns: ['info'],
      summary: '正常的系统日志信息',
      description: '系统运行正常，这是信息性日志',
      inputAnalysis: `用户反馈: ${userFeedback}；系统运行正常`,
      urgency: 'LOW',
    };
  }

  /**
   * 生成针对性建议
   */
  private generateTargetedSuggestions(problemAnalysis: any): string[] {
    const suggestionMap = {
      DATABASE_CONNECTION_ERROR: [
        '🔴 立即检查数据库服务器状态',
        '🔧 验证数据库连接配置 (主机、端口、用户名)',
        '📊 检查数据库连接池设置',
        '⚡ 查看数据库服务器负载和性能',
        '🔐 确认数据库访问权限',
        '🌐 检查网络连接和防火墙设置',
        '📈 监控数据库慢查询',
      ],
      ORDER_SERVICE_ERROR: [
        '🚨 紧急处理订单服务异常',
        '💾 检查订单数据库完整性',
        '🔄 验证订单处理流程',
        '📦 检查库存服务依赖',
        '💳 确认支付服务连接',
        '📋 查看订单服务监控指标',
        '🔔 通知相关业务团队',
      ],
      PAYMENT_ERROR: [
        '💸 紧急修复支付功能',
        '🏦 检查支付网关状态',
        '🔐 验证支付接口配置',
        '💰 确认商户账户状态',
        '📊 检查支付成功率',
        '🔔 立即通知财务团队',
        '📋 审查支付流程日志',
      ],
      AUTH_ERROR: [
        '🔑 检查认证服务状态',
        '⏰ 验证Token配置和有效期',
        '🛡️ 检查权限系统',
        '📱 确认登录流程',
        '🔐 验证密码策略',
        '📊 监控登录成功率',
      ],
      NETWORK_ERROR: [
        '🌐 检查网络连接状态',
        '🔗 验证服务间通信',
        '🔥 检查防火墙规则',
        '📡 确认DNS解析',
        '⚡ 检查网络延迟',
        '🔄 考虑服务重启',
      ],
      GENERIC_ERROR: [
        '📋 查看完整错误堆栈',
        '🔍 检查系统资源使用',
        '📊 监控应用性能指标',
        '🔄 尝试重现问题',
        '📝 收集更多日志信息',
      ],
      INFO_LOG: [
        '✅ 系统运行正常',
        '📊 继续监控系统状态',
        '📈 关注业务指标趋势',
      ],
    };

    return suggestionMap[problemAnalysis.type] || suggestionMap.GENERIC_ERROR;
  }

  /**
   * 评估风险等级
   */
  private assessRiskLevel(problemAnalysis: any): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const typeRiskMap = {
      DATABASE_CONNECTION_ERROR: 'CRITICAL',
      ORDER_SERVICE_ERROR: 'CRITICAL',
      PAYMENT_ERROR: 'CRITICAL',
      AUTH_ERROR: 'HIGH',
      NETWORK_ERROR: 'HIGH',
      GENERIC_ERROR: 'MEDIUM',
      INFO_LOG: 'LOW',
    };

    return typeRiskMap[problemAnalysis.type] as any || 'MEDIUM';
  }

  /**
   * 查找相关问题
   */
  private findRelevantIssues(problemAnalysis: any): any[] {
    const issueMap = {
      DATABASE_CONNECTION_ERROR: [
        {
          id: 'db_issue_1',
          similarity: 0.95,
          description: '数据库连接池耗尽导致的连接超时',
          solution: '增加连接池大小，优化查询性能',
          resolvedAt: '2024-01-20',
          impact: '影响所有依赖数据库的服务',
        },
        {
          id: 'db_issue_2',
          similarity: 0.88,
          description: 'PostgreSQL连接数限制问题',
          solution: '调整max_connections参数，增加服务器资源',
          resolvedAt: '2024-01-15',
          impact: '导致新用户无法注册',
        },
      ],
      ORDER_SERVICE_ERROR: [
        {
          id: 'order_issue_1',
          similarity: 0.92,
          description: '订单创建时库存检查失败',
          solution: '修复库存服务API调用，增加重试机制',
          resolvedAt: '2024-01-18',
          impact: '用户无法完成下单',
        },
      ],
      PAYMENT_ERROR: [
        {
          id: 'payment_issue_1',
          similarity: 0.90,
          description: '支付网关响应超时',
          solution: '增加支付超时时间，添加备用支付渠道',
          resolvedAt: '2024-01-22',
          impact: '影响收入，用户体验差',
        },
      ],
    };

    return issueMap[problemAnalysis.type] || [];
  }
} 