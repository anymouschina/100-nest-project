import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { VectorKnowledgeService } from '../../ai/services/vector-knowledge.service';
import { UserLogIssueAgent } from '../agents/user-log-issue.agent';

export interface CreateAnalysisTaskDto {
  userId: number;
  userFeedback: string;
  timeRange?: {
    startTime: Date;
    endTime: Date;
  };
  logSources?: string[];
  keywords?: string[];
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface AnalysisTaskResult {
  taskId: string;
  status: string;
  summary?: string;
  findings?: any;
  recommendations?: any;
  agentResults: any[];
  logEntries: any[];
  createdAt: Date;
  completedAt?: Date;
}

@Injectable()
export class LogAnalysisService {
  private readonly logger = new Logger(LogAnalysisService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly vectorService: VectorKnowledgeService,
    private readonly userLogIssueAgent: UserLogIssueAgent,
  ) {}

  /**
   * 创建日志分析任务
   */
  async createAnalysisTask(dto: CreateAnalysisTaskDto): Promise<string> {
    try {
      const taskId = this.generateTaskId();

      // 创建任务记录
      await this.databaseService.logAnalysisTask.create({
        data: {
          taskId,
          userId: dto.userId,
          userFeedback: dto.userFeedback,
          status: 'PENDING',
          priority: dto.priority || 'MEDIUM',
          timeRange: dto.timeRange || {},
          logSources: dto.logSources || [],
          keywords: dto.keywords || [],
        },
      });

      // 异步启动分析
      this.startAnalysisAsync(taskId).catch((error) => {
        this.logger.error(`异步分析任务失败: ${taskId}`, error.stack);
      });

      return taskId;
    } catch (error) {
      this.logger.error('创建分析任务失败', error.stack);
      throw error;
    }
  }

  /**
   * 异步启动分析流程
   */
  private async startAnalysisAsync(taskId: string): Promise<void> {
    try {
      // 更新状态为处理中
      await this.updateTaskStatus(taskId, 'PROCESSING');

      // 1. 模拟获取日志数据（实际应该从日志系统获取）
      await this.collectLogData(taskId);

      // 2. 启动用户日志问题分析Agent
      await this.userLogIssueAgent.analyzeUserLogIssue(taskId);

      // 3. 生成综合分析结果
      await this.generateFinalResults(taskId);

      // 4. 更新状态为完成
      await this.updateTaskStatus(taskId, 'COMPLETED');

      this.logger.log(`分析任务完成: ${taskId}`);
    } catch (error) {
      this.logger.error(`分析任务失败: ${taskId}`, error.stack);
      await this.updateTaskStatus(taskId, 'FAILED');
    }
  }

  /**
   * 获取分析结果
   */
  async getAnalysisResult(taskId: string): Promise<AnalysisTaskResult> {
    const task = await this.databaseService.logAnalysisTask.findUnique({
      where: { taskId },
      include: {
        user: true,
        logEntries: true,
        agentResults: true,
        userLogIssues: true,
      },
    });

    if (!task) {
      throw new Error(`任务不存在: ${taskId}`);
    }

    return {
      taskId: task.taskId,
      status: task.status,
      summary: task.summary,
      findings: task.findings,
      recommendations: task.recommendations,
      agentResults: task.agentResults,
      logEntries: task.logEntries,
      createdAt: task.createdAt,
      completedAt: task.completedAt,
    };
  }

  /**
   * 获取用户的分析任务列表
   */
  async getUserAnalysisTasks(
    userId: number,
    options: {
      status?: string;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<any[]> {
    const { status, limit = 20, offset = 0 } = options;

    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    return await this.databaseService.logAnalysisTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        taskId: true,
        userFeedback: true,
        status: true,
        priority: true,
        createdAt: true,
        completedAt: true,
        summary: true,
      },
    });
  }

  /**
   * 添加白名单规则
   */
  async addWhitelistRule(dto: {
    ruleType: string;
    ruleName: string;
    description?: string;
    conditions: Record<string, any>;
    createdBy: number;
  }): Promise<any> {
    return await this.databaseService.issueWhitelistRule.create({
      data: {
        ruleType: dto.ruleType as any,
        ruleName: dto.ruleName,
        description: dto.description,
        conditions: dto.conditions,
        createdBy: dto.createdBy,
      },
    });
  }

  /**
   * 获取白名单规则
   */
  async getWhitelistRules(
    options: {
      ruleType?: string;
      isActive?: boolean;
    } = {},
  ): Promise<any[]> {
    const { ruleType, isActive } = options;
    const where: any = {};

    if (ruleType) {
      where.ruleType = ruleType;
    }
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return await this.databaseService.issueWhitelistRule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { userId: true, name: true },
        },
      },
    });
  }

  /**
   * 获取业务参数特征分析
   */
  async getBusinessParamFeatures(
    options: {
      apiEndpoint?: string;
      isAnomalous?: boolean;
      limit?: number;
    } = {},
  ): Promise<any[]> {
    const { apiEndpoint, isAnomalous, limit = 50 } = options;
    const where: any = {};

    if (apiEndpoint) {
      where.apiEndpoint = { contains: apiEndpoint };
    }

    const issues = await this.databaseService.userLogIssue.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        apiEndpoint: true,
        inputParams: true,
        paramSource: true,
        vehicleModel: true,
        specification: true,
        issueType: true,
        severity: true,
        createdAt: true,
      },
    });

    // 分析参数特征
    return this.analyzeParamFeatures(issues);
  }

  /**
   * 分析参数异常
   */
  async analyzeParamAnomaly(input: {
    apiEndpoint: string;
    inputParams: Record<string, any>;
    vehicleModel?: string;
    specifications?: Record<string, any>;
  }): Promise<{
    isAnomalous: boolean;
    confidence: number;
    similarPatterns: any[];
    recommendations: string[];
  }> {
    try {
      // 查找相似的历史参数模式
      const similarIssues = await this.findSimilarParamPatterns(input);

      // 检测是否异常
      const isAnomalous = await this.detectParamAnomalies(input, similarIssues);

      // 计算置信度
      const confidence = this.calculateAnomalyConfidence(input, similarIssues);

      // 生成建议
      const recommendations = await this.generateParamRecommendations(
        input,
        similarIssues,
        isAnomalous,
      );

      return {
        isAnomalous,
        confidence,
        similarPatterns: similarIssues,
        recommendations,
      };
    } catch (error) {
      this.logger.error('参数异常分析失败', error.stack);
      return {
        isAnomalous: false,
        confidence: 0,
        similarPatterns: [],
        recommendations: ['分析失败，请稍后重试'],
      };
    }
  }

  /**
   * 获取分析统计
   */
  async getAnalysisStats(
    options: {
      userId?: number;
      timeRange?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ): Promise<any> {
    const { userId, timeRange, startDate, endDate } = options;

    // 构建时间过滤条件
    const dateFilter = this.buildDateFilter(timeRange, startDate, endDate);
    const where: any = { ...dateFilter };

    if (userId) {
      where.userId = userId;
    }

    // 获取基础统计
    const [totalTasks, completedTasks, failedTasks, avgCompletionTime] =
      await Promise.all([
        this.databaseService.logAnalysisTask.count({ where }),
        this.databaseService.logAnalysisTask.count({
          where: { ...where, status: 'COMPLETED' },
        }),
        this.databaseService.logAnalysisTask.count({
          where: { ...where, status: 'FAILED' },
        }),
        this.calculateAvgCompletionTime(where),
      ]);

    return {
      totalTasks,
      completedTasks,
      failedTasks,
      successRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      avgCompletionTime,
    };
  }

  /**
   * 获取问题分类统计
   */
  async getIssueTypeStats(
    options: {
      timeRange?: string;
      startDate?: Date;
      endDate?: Date;
    } = {},
  ): Promise<any> {
    const { timeRange, startDate, endDate } = options;
    const dateFilter = this.buildDateFilter(timeRange, startDate, endDate);

    const issueStats = await this.databaseService.userLogIssue.groupBy({
      by: ['issueType', 'severity'],
      where: dateFilter,
      _count: true,
    });

    // 转换为更友好的格式
    const result = {};
    issueStats.forEach((stat) => {
      if (!result[stat.issueType]) {
        result[stat.issueType] = {};
      }
      result[stat.issueType][stat.severity] = stat._count;
    });

    return result;
  }

  /**
   * 导出分析报告
   */
  async exportAnalysisReport(
    taskId: string,
    format: 'json' | 'csv' | 'pdf' = 'json',
  ): Promise<any> {
    const result = await this.getAnalysisResult(taskId);

    switch (format) {
      case 'json':
        return result;
      case 'csv':
        return this.convertToCSV(result);
      case 'pdf':
        return this.generatePDFReport(result);
      default:
        return result;
    }
  }

  // 私有辅助方法
  private generateTaskId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `task_${timestamp}_${random}`;
  }

  private async updateTaskStatus(
    taskId: string,
    status: string,
  ): Promise<void> {
    const updateData: any = { status };
    if (status === 'COMPLETED' || status === 'FAILED') {
      updateData.completedAt = new Date();
    }

    await this.databaseService.logAnalysisTask.update({
      where: { taskId },
      data: updateData,
    });
  }

  private async collectLogData(taskId: string): Promise<void> {
    // 模拟日志数据收集
    // 实际环境中应该从日志系统（如ELK、Loki等）获取数据
    const mockLogEntries = [
      {
        timestamp: new Date(),
        level: 'ERROR',
        source: 'backend',
        service: 'payment-service',
        message: 'Payment service connection timeout',
        metadata: {
          apiEndpoint: '/api/payment/create',
          retCode: 500,
          userId: 123,
        },
      },
      {
        timestamp: new Date(),
        level: 'ERROR',
        source: 'frontend',
        service: 'web-app',
        message: 'Uncaught TypeError: Cannot read property of null',
        metadata: {
          pageUrl: '/checkout',
          userId: 123,
        },
      },
    ];

    for (const entry of mockLogEntries) {
      await this.databaseService.logEntry.create({
        data: {
          taskId,
          timestamp: entry.timestamp,
          level: entry.level as any,
          source: entry.source,
          service: entry.service,
          message: entry.message,
          metadata: entry.metadata,
        },
      });
    }
  }

  private async generateFinalResults(taskId: string): Promise<void> {
    // 获取所有Agent结果
    const agentResults =
      await this.databaseService.agentAnalysisResult.findMany({
        where: { taskId },
      });

    // 获取用户日志问题
    const userLogIssues = await this.databaseService.userLogIssue.findMany({
      where: { taskId },
    });

    // 生成综合分析
    const summary = this.generateSummary(agentResults, userLogIssues);
    const recommendations = this.generateRecommendations(
      agentResults,
      userLogIssues,
    );

    // 更新任务结果
    await this.databaseService.logAnalysisTask.update({
      where: { taskId },
      data: {
        summary,
        findings: {
          totalAgents: agentResults.length,
          totalIssues: userLogIssues.length,
          agentResults,
          userLogIssues,
        },
        recommendations,
      },
    });
  }

  private generateSummary(agentResults: any[], userLogIssues: any[]): string {
    const totalIssues = userLogIssues.length;
    const criticalIssues = userLogIssues.filter(
      (issue) => issue.severity === 'CRITICAL',
    ).length;
    const highIssues = userLogIssues.filter(
      (issue) => issue.severity === 'HIGH',
    ).length;

    if (totalIssues === 0) {
      return '未发现明显问题';
    }

    return `发现${totalIssues}个问题，其中${criticalIssues}个严重问题，${highIssues}个高优先级问题`;
  }

  private generateRecommendations(
    agentResults: any[],
    userLogIssues: any[],
  ): string[] {
    const recommendations = new Set<string>();

    // 从Agent结果中提取建议
    agentResults.forEach((result) => {
      if (result.recommendations) {
        const agentRecs = Array.isArray(result.recommendations)
          ? result.recommendations
          : result.recommendations.recommendations || [];
        agentRecs.forEach((rec) => recommendations.add(rec));
      }
    });

    // 根据问题类型生成通用建议
    const issueTypes = [
      ...new Set(userLogIssues.map((issue) => issue.issueType)),
    ];
    issueTypes.forEach((type) => {
      const typeRecommendations = this.getRecommendationsByIssueType(type);
      typeRecommendations.forEach((rec) => recommendations.add(rec));
    });

    return Array.from(recommendations);
  }

  private getRecommendationsByIssueType(issueType: string): string[] {
    const typeRecommendations = {
      BACKEND_RET_ERROR: ['检查API返回码逻辑', '验证错误处理机制'],
      FRONTEND_JS_ERROR: ['检查前端错误边界', '验证组件生命周期'],
      BLOCKING_ERROR: ['立即检查系统可用性', '启动故障转移'],
      KEY_FLOW_ERROR: ['优先修复关键业务流程', '检查依赖服务'],
      BUSINESS_PARAM_ERROR: ['检查业务规则配置', '验证参数校验逻辑'],
    };

    return typeRecommendations[issueType] || [];
  }

  private analyzeParamFeatures(issues: any[]): any[] {
    // 参数特征分析逻辑
    const features = new Map();

    issues.forEach((issue) => {
      const key = `${issue.apiEndpoint}_${issue.vehicleModel}`;
      if (!features.has(key)) {
        features.set(key, {
          apiEndpoint: issue.apiEndpoint,
          vehicleModel: issue.vehicleModel,
          paramCombinations: [],
          issueCount: 0,
          severities: [],
        });
      }

      const feature = features.get(key);
      feature.issueCount++;
      feature.severities.push(issue.severity);
      if (issue.inputParams) {
        feature.paramCombinations.push(issue.inputParams);
      }
    });

    return Array.from(features.values());
  }

  private async findSimilarParamPatterns(input: any): Promise<any[]> {
    // 基于向量搜索查找相似参数模式
    const searchText = `${input.apiEndpoint} ${JSON.stringify(input.inputParams)}`;

    try {
      const results = await this.vectorService.semanticSearch(searchText, {
        limit: 5,
        threshold: 0.7,
        filters: { category: 'param_pattern' },
      });

      return results.documents.map((doc) => ({
        id: doc.id,
        similarity: doc.similarity,
        ...doc.metadata,
      }));
    } catch (error) {
      this.logger.error('查找相似参数模式失败', error.stack);
      return [];
    }
  }

  private async detectParamAnomalies(
    input: any,
    similarPatterns: any[],
  ): Promise<boolean> {
    // 简单的异常检测逻辑
    if (similarPatterns.length === 0) {
      return false; // 没有历史数据，不判定为异常
    }

    // 如果有高相似度的异常模式，则判定为异常
    return similarPatterns.some(
      (pattern) => pattern.similarity > 0.8 && pattern.isAnomalous,
    );
  }

  private calculateAnomalyConfidence(
    input: any,
    similarPatterns: any[],
  ): number {
    if (similarPatterns.length === 0) {
      return 0;
    }

    const avgSimilarity =
      similarPatterns.reduce((sum, pattern) => sum + pattern.similarity, 0) /
      similarPatterns.length;

    return Math.min(avgSimilarity, 1.0);
  }

  private async generateParamRecommendations(
    input: any,
    similarPatterns: any[],
    isAnomalous: boolean,
  ): Promise<string[]> {
    const recommendations = [];

    if (isAnomalous) {
      recommendations.push('检测到异常参数模式');
      recommendations.push('建议检查前端参数校验逻辑');
      recommendations.push('验证业务规则配置');
    } else {
      recommendations.push('参数模式正常');
    }

    // 基于相似模式添加建议
    similarPatterns.forEach((pattern) => {
      if (pattern.recommendations) {
        recommendations.push(`参考历史解决方案: ${pattern.recommendations}`);
      }
    });

    return recommendations;
  }

  private buildDateFilter(
    timeRange?: string,
    startDate?: Date,
    endDate?: Date,
  ): any {
    const filter: any = {};

    if (startDate && endDate) {
      filter.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    } else if (timeRange) {
      const now = new Date();
      let start: Date;

      switch (timeRange) {
        case 'day':
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          return filter;
      }

      filter.createdAt = {
        gte: start,
        lte: now,
      };
    }

    return filter;
  }

  private async calculateAvgCompletionTime(where: any): Promise<number> {
    const completedTasks = await this.databaseService.logAnalysisTask.findMany({
      where: { ...where, status: 'COMPLETED', completedAt: { not: null } },
      select: { createdAt: true, completedAt: true },
    });

    if (completedTasks.length === 0) {
      return 0;
    }

    const totalTime = completedTasks.reduce((sum, task) => {
      const duration = task.completedAt.getTime() - task.createdAt.getTime();
      return sum + duration;
    }, 0);

    return totalTime / completedTasks.length / 1000; // 转换为秒
  }

  private convertToCSV(data: any): string {
    // 简单的CSV转换实现
    const headers = Object.keys(data);
    const values = Object.values(data).map((v) =>
      typeof v === 'object' ? JSON.stringify(v) : String(v),
    );

    return `${headers.join(',')}\n${values.join(',')}`;
  }

  private async generatePDFReport(data: any): Promise<any> {
    // PDF生成逻辑（可以使用puppeteer或其他PDF库）
    return {
      message: 'PDF报告生成功能待实现',
      data,
    };
  }

  private async clusterNewPatterns(patterns: any[]): Promise<any[]> {
    // 简单的聚类实现 - 可以用更复杂的聚类算法
    return patterns; // 暂时直接返回，可以后续优化
  }

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
    const { userId, timeRange, logSources, priority, userFeedback } = options;

    try {
      // 1. 查询用户相关的历史日志
      const existingLogs = await this.getUserLogsFromDatabase({
        userId,
        startDate: timeRange?.startTime,
        endDate: timeRange?.endTime,
        sources: logSources,
        limit: 500, // 限制查询数量
      });

      if (existingLogs.length === 0) {
        return {
          taskId: '',
          message: '未找到该用户的相关日志',
          logCount: 0,
        };
      }

      // 2. 创建分析任务
      const taskId = this.generateTaskId();

      // 创建分析任务记录 - 使用实际的Prisma模型
      // 注意：这里需要根据实际的数据库schema调整
      // 暂时跳过数据库写入，直接进行分析

      const analysisRecord = {
        taskId,
        userId: userId,
        userFeedback: userFeedback || `分析用户${userId}的日志问题`,
        status: 'PENDING',
        priority: priority || 'MEDIUM',
        timeRange: timeRange || {},
        logSources: logSources || [],
        keywords: [`user:${userId}`],
        createdAt: new Date(),
      };

      // 3. 将现有日志添加到任务中
      for (const log of existingLogs) {
        await this.databaseService.logEntry.create({
          data: {
            taskId,
            timestamp: log.timestamp,
            level: log.level,
            source: log.source,
            service: log.service,
            message: log.message,
            stackTrace: log.stackTrace,
            userId: log.userId,
            sessionId: log.sessionId,
            requestId: log.requestId,
            metadata: log.metadata,
          },
        });
      }

      // 4. 异步启动分析
      this.startAnalysisAsync(taskId).catch((error) => {
        this.logger.error(`用户日志分析任务失败: ${taskId}`, error.stack);
      });

      return {
        taskId,
        message: `已创建分析任务，正在分析用户${userId}的${existingLogs.length}条日志`,
        logCount: existingLogs.length,
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
    logData: {
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
  }): Promise<{
    analysisResult: any;
    suggestions: string[];
    similarIssues: any[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }> {
    const { userFeedback, logData, analysisOptions = {} } = options;

    try {
      // 1. 标准化日志数据
      const normalizedLog = {
        id: `manual_${Date.now()}`,
        timestamp: logData.timestamp || new Date(),
        level: logData.level,
        source: logData.source,
        service: logData.service || 'unknown',
        message: logData.message,
        stackTrace: logData.stackTrace,
        metadata: logData.metadata || {},
        userFeedback,
      };

      // 2. 基础问题类型检测
      const issueType = await this.detectIssueType(normalizedLog);

      // 3. 严重程度分析
      const riskLevel = this.analyzeSeverity(normalizedLog, issueType);

      // 4. 生成基础分析结果
      let analysisResult: any = {
        issueType,
        severity: riskLevel,
        timestamp: normalizedLog.timestamp,
        source: normalizedLog.source,
        detectedPatterns: [],
      };

      let suggestions: string[] = [];
      let similarIssues: any[] = [];

      // 5. 可选功能：特征提取
      if (analysisOptions.enableFeatureExtraction) {
        try {
          const features = await this.extractBasicFeatures(normalizedLog);
          analysisResult.extractedFeatures = features;
        } catch (error) {
          this.logger.warn('特征提取失败', error.message);
        }
      }

      // 6. 可选功能：相似问题搜索
      if (analysisOptions.enableSimilarSearch) {
        try {
          const searchText = `${normalizedLog.message} ${normalizedLog.source} ${issueType}`;
          const searchResults = await this.vectorService.semanticSearch(
            searchText,
            {
              limit: 5,
              threshold: 0.6,
              filters: { category: 'log_issue' },
            },
          );

          similarIssues = searchResults.documents.map((doc) => ({
            id: doc.id,
            similarity: doc.similarity,
            description: doc.content,
            metadata: doc.metadata,
          }));
        } catch (error) {
          this.logger.warn('相似问题搜索失败', error.message);
        }
      }

      // 7. 生成建议
      suggestions = this.generateSuggestions(
        normalizedLog,
        issueType,
        similarIssues,
      );

      // 8. 可选功能：异常检测
      if (analysisOptions.enableAnomalyDetection) {
        try {
          const anomalyScore = await this.detectAnomaly(normalizedLog);
          analysisResult.anomalyScore = anomalyScore;

          if (anomalyScore > 0.8) {
            suggestions.unshift('⚠️ 检测到异常模式，建议立即调查');
          }
        } catch (error) {
          this.logger.warn('异常检测失败', error.message);
        }
      }

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
  }): Promise<{
    logs: any[];
    totalCount: number;
    pagination: {
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    const {
      userId,
      startDate,
      endDate,
      level,
      source,
      limit = 100,
      offset = 0,
    } = options;

    try {
      // 构建查询条件
      const where: any = { userId };

      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = startDate;
        if (endDate) where.timestamp.lte = endDate;
      }

      if (level) {
        where.level = level.toUpperCase();
      }

      if (source) {
        where.source = source.toLowerCase();
      }

      // 查询日志
      const [logs, totalCount] = await Promise.all([
        this.databaseService.logEntry.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          take: limit,
          skip: offset,
          select: {
            id: true,
            timestamp: true,
            level: true,
            source: true,
            service: true,
            message: true,
            metadata: true,
            normalizedType: true,
            severity: true,
            category: true,
          },
        }),
        this.databaseService.logEntry.count({ where }),
      ]);

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
  }): Promise<{
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
  }> {
    const { logEntries, checkOptions = {} } = options;
    const {
      checkSeverity = true,
      checkPatterns = true,
      checkAnomalies = false,
    } = checkOptions;

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

      // 统计日志级别分布
      const levelCounts: Record<string, number> = {};
      const patternCounts: Record<
        string,
        { count: number; examples: string[] }
      > = {};

      for (const logEntry of logEntries) {
        const level = logEntry.level.toUpperCase();
        levelCounts[level] = (levelCounts[level] || 0) + 1;

        if (level === 'ERROR') errorCount++;
        if (level === 'WARN') warningCount++;

        // 检查严重程度
        if (checkSeverity) {
          if (this.isCriticalError(logEntry)) {
            criticalIssues++;
          }
        }

        // 检查常见错误模式
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

  // ==================== 辅助方法 ====================

  private async getUserLogsFromDatabase(options: {
    userId: number;
    startDate?: Date;
    endDate?: Date;
    sources?: string[];
    limit: number;
  }): Promise<any[]> {
    // 这里应该从实际的日志系统查询
    // 暂时返回模拟数据
    return [
      {
        timestamp: new Date(),
        level: 'ERROR',
        source: 'backend',
        service: 'payment-service',
        message: 'Payment failed for user order',
        userId: options.userId,
        metadata: { orderId: '12345', retCode: 500 },
      },
    ];
  }

  private async detectIssueType(logEntry: any): Promise<string> {
    // 复用现有的问题类型检测逻辑
    const { message, level, source, metadata } = logEntry;

    if (source === 'backend' && metadata?.retCode && metadata.retCode !== 0) {
      return 'BACKEND_RET_ERROR';
    }

    if (source === 'frontend' && level === 'ERROR') {
      return 'FRONTEND_JS_ERROR';
    }

    if (level === 'ERROR') {
      return 'GENERIC_ERROR';
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

  private async extractBasicFeatures(logEntry: any): Promise<any[]> {
    // 简化的特征提取
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
      BACKEND_RET_ERROR: [
        '检查API返回码的业务逻辑',
        '验证服务依赖是否正常',
        '查看相关服务的健康状态',
      ],
      FRONTEND_JS_ERROR: [
        '检查前端代码的错误处理',
        '验证组件的生命周期管理',
        '确认数据格式是否正确',
      ],
      GENERIC_ERROR: [
        '查看完整的错误堆栈',
        '检查相关的系统资源',
        '确认操作的前置条件',
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

  private async detectAnomaly(logEntry: any): Promise<number> {
    // 简化的异常检测 - 可以集成更复杂的机器学习模型
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

    if (recommendations.length === 0) {
      recommendations.push('✅ 系统运行正常，保持当前监控策略');
    }

    return recommendations;
  }
}
