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
      this.startAnalysisAsync(taskId).catch(error => {
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
    } = {}
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
  async getWhitelistRules(options: {
    ruleType?: string;
    isActive?: boolean;
  } = {}): Promise<any[]> {
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
  async getBusinessParamFeatures(options: {
    apiEndpoint?: string;
    isAnomalous?: boolean;
    limit?: number;
  } = {}): Promise<any[]> {
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
        isAnomalous
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
  async getAnalysisStats(options: {
    userId?: number;
    timeRange?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<any> {
    const { userId, timeRange, startDate, endDate } = options;

    // 构建时间过滤条件
    const dateFilter = this.buildDateFilter(timeRange, startDate, endDate);
    const where: any = { ...dateFilter };

    if (userId) {
      where.userId = userId;
    }

    // 获取基础统计
    const [totalTasks, completedTasks, failedTasks, avgCompletionTime] = await Promise.all([
      this.databaseService.logAnalysisTask.count({ where }),
      this.databaseService.logAnalysisTask.count({ where: { ...where, status: 'COMPLETED' } }),
      this.databaseService.logAnalysisTask.count({ where: { ...where, status: 'FAILED' } }),
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
  async getIssueTypeStats(options: {
    timeRange?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<any> {
    const { timeRange, startDate, endDate } = options;
    const dateFilter = this.buildDateFilter(timeRange, startDate, endDate);

    const issueStats = await this.databaseService.userLogIssue.groupBy({
      by: ['issueType', 'severity'],
      where: dateFilter,
      _count: true,
    });

    // 转换为更友好的格式
    const result = {};
    issueStats.forEach(stat => {
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
    format: 'json' | 'csv' | 'pdf' = 'json'
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

  private async updateTaskStatus(taskId: string, status: string): Promise<void> {
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
    const agentResults = await this.databaseService.agentAnalysisResult.findMany({
      where: { taskId },
    });

    // 获取用户日志问题
    const userLogIssues = await this.databaseService.userLogIssue.findMany({
      where: { taskId },
    });

    // 生成综合分析
    const summary = this.generateSummary(agentResults, userLogIssues);
    const recommendations = this.generateRecommendations(agentResults, userLogIssues);

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
    const criticalIssues = userLogIssues.filter(issue => issue.severity === 'CRITICAL').length;
    const highIssues = userLogIssues.filter(issue => issue.severity === 'HIGH').length;

    if (totalIssues === 0) {
      return '未发现明显问题';
    }

    return `发现${totalIssues}个问题，其中${criticalIssues}个严重问题，${highIssues}个高优先级问题`;
  }

  private generateRecommendations(agentResults: any[], userLogIssues: any[]): string[] {
    const recommendations = new Set<string>();

    // 从Agent结果中提取建议
    agentResults.forEach(result => {
      if (result.recommendations) {
        const agentRecs = Array.isArray(result.recommendations) 
          ? result.recommendations 
          : result.recommendations.recommendations || [];
        agentRecs.forEach(rec => recommendations.add(rec));
      }
    });

    // 根据问题类型生成通用建议
    const issueTypes = [...new Set(userLogIssues.map(issue => issue.issueType))];
    issueTypes.forEach(type => {
      const typeRecommendations = this.getRecommendationsByIssueType(type);
      typeRecommendations.forEach(rec => recommendations.add(rec));
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

    issues.forEach(issue => {
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

      return results.documents.map(doc => ({
        id: doc.id,
        similarity: doc.similarity,
        ...doc.metadata,
      }));
    } catch (error) {
      this.logger.error('查找相似参数模式失败', error.stack);
      return [];
    }
  }

  private async detectParamAnomalies(input: any, similarPatterns: any[]): Promise<boolean> {
    // 简单的异常检测逻辑
    if (similarPatterns.length === 0) {
      return false; // 没有历史数据，不判定为异常
    }

    // 如果有高相似度的异常模式，则判定为异常
    return similarPatterns.some(pattern => 
      pattern.similarity > 0.8 && pattern.isAnomalous
    );
  }

  private calculateAnomalyConfidence(input: any, similarPatterns: any[]): number {
    if (similarPatterns.length === 0) {
      return 0;
    }

    const avgSimilarity = similarPatterns.reduce((sum, pattern) => 
      sum + pattern.similarity, 0) / similarPatterns.length;
    
    return Math.min(avgSimilarity, 1.0);
  }

  private async generateParamRecommendations(
    input: any,
    similarPatterns: any[],
    isAnomalous: boolean
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
    similarPatterns.forEach(pattern => {
      if (pattern.recommendations) {
        recommendations.push(`参考历史解决方案: ${pattern.recommendations}`);
      }
    });

    return recommendations;
  }

  private buildDateFilter(timeRange?: string, startDate?: Date, endDate?: Date): any {
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
    const values = Object.values(data).map(v => 
      typeof v === 'object' ? JSON.stringify(v) : String(v)
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
} 