import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { VectorKnowledgeService } from '../../ai/services/vector-knowledge.service';
import { EmbeddingService } from '../../ai/services/embedding.service';

export interface LogIssueAnalysisResult {
  issueType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  similarIssues: Array<{
    id: string;
    similarity: number;
    resolution?: string;
    apiEndpoint?: string;
    errorMessage?: string;
  }>;
  rootCause?: string;
  recommendations: string[];
  isWhitelisted: boolean;
}

@Injectable()
export class UserLogIssueAgent {
  private readonly logger = new Logger(UserLogIssueAgent.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly vectorService: VectorKnowledgeService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /**
   * 分析用户日志问题
   */
  async analyzeUserLogIssue(taskId: string): Promise<void> {
    this.logger.log(`开始用户日志问题分析: ${taskId}`);

    try {
      // 创建Agent结果记录
      await this.createAgentResult(taskId);

      // 获取任务和日志数据
      const task = await this.getTaskWithLogs(taskId);
      if (!task) {
        throw new Error(`任务不存在: ${taskId}`);
      }

      const issues: LogIssueAnalysisResult[] = [];

      // 分析每个日志条目
      for (const logEntry of task.logEntries) {
        const analysisResult = await this.analyzeSingleLogEntry(logEntry, taskId);
        if (analysisResult) {
          issues.push(analysisResult);
          
          // 保存问题到数据库
          await this.saveUserLogIssue(taskId, logEntry.id, analysisResult);
        }
      }

      // 综合分析结果
      const summary = await this.generateSummary(issues);

      // 更新Agent结果
      await this.updateAgentResult(taskId, {
        totalIssues: issues.length,
        issueTypes: this.extractIssueTypes(issues),
        severityDistribution: this.calculateSeverityDistribution(issues),
        recommendations: summary.recommendations,
        confidence: summary.confidence,
      });

      this.logger.log(`用户日志问题分析完成: ${taskId}, 发现问题: ${issues.length}`);
    } catch (error) {
      this.logger.error(`用户日志问题分析失败: ${taskId}`, error.stack);
      await this.markAgentFailed(taskId, error.message);
      throw error;
    }
  }

  /**
   * 分析单个日志条目
   */
  private async analyzeSingleLogEntry(
    logEntry: any,
    taskId: string,
  ): Promise<LogIssueAnalysisResult | null> {
    try {
      // 1. 检查白名单
      const isWhitelisted = await this.checkWhitelist(logEntry);
      if (isWhitelisted) {
        this.logger.debug(`日志条目已在白名单中，跳过: ${logEntry.id}`);
        return null;
      }

      // 2. 确定问题类型
      const issueType = await this.determineIssueType(logEntry);
      if (!issueType) {
        return null;
      }

      // 3. 查找相似问题
      const similarIssues = await this.findSimilarIssues(logEntry);

      // 4. 分析严重程度
      const severity = await this.analyzeSeverity(logEntry, issueType);

      // 5. 生成根因分析
      const rootCause = await this.analyzeRootCause(logEntry, similarIssues);

      // 6. 生成建议
      const recommendations = await this.generateRecommendations(
        logEntry,
        issueType,
        similarIssues,
      );

      // 7. 计算置信度
      const confidence = this.calculateConfidence(logEntry, similarIssues);

      return {
        issueType,
        severity,
        confidence,
        similarIssues,
        rootCause,
        recommendations,
        isWhitelisted: false,
      };
    } catch (error) {
      this.logger.error(`分析日志条目失败: ${logEntry.id}`, error.stack);
      return null;
    }
  }

  /**
   * 确定问题类型
   */
  private async determineIssueType(logEntry: any): Promise<string | null> {
    const { message, level, source, metadata } = logEntry;

    // 后端返回码错误
    if (source === 'backend' && metadata?.retCode && metadata.retCode !== 0) {
      return 'BACKEND_RET_ERROR';
    }

    // 前端JS错误
    if (source === 'frontend' && level === 'ERROR' && message.includes('Error')) {
      return 'FRONTEND_JS_ERROR';
    }

    // 阻塞性错误检测
    if (await this.isBlockingError(logEntry)) {
      return 'BLOCKING_ERROR';
    }

    // 关键流程错误检测
    if (await this.isKeyFlowError(logEntry)) {
      return 'KEY_FLOW_ERROR';
    }

    // 页面卸载错误（小程序特性）
    if (await this.isPageUnloadError(logEntry)) {
      return 'PAGE_UNLOAD_ERROR';
    }

    // 业务参数错误
    if (await this.isBusinessParamError(logEntry)) {
      return 'BUSINESS_PARAM_ERROR';
    }

    // 车型规格错误
    if (await this.isVehicleSpecError(logEntry)) {
      return 'VEHICLE_SPEC_ERROR';
    }

    return null;
  }

  /**
   * 检查是否为阻塞性错误
   */
  private async isBlockingError(logEntry: any): Promise<boolean> {
    const blockingPatterns = [
      /connection.*timeout/i,
      /network.*error/i,
      /server.*unavailable/i,
      /service.*down/i,
      /database.*error/i,
    ];

    return blockingPatterns.some(pattern => pattern.test(logEntry.message));
  }

  /**
   * 检查是否影响关键流程
   */
  private async isKeyFlowError(logEntry: any): Promise<boolean> {
    const keyFlowApis = [
      '/api/orders',
      '/api/payment',
      '/api/cart',
      '/api/auth/login',
      '/api/user/register',
    ];

    const apiEndpoint = logEntry.metadata?.apiEndpoint || logEntry.metadata?.endpoint;
    if (!apiEndpoint) return false;

    return keyFlowApis.some(api => apiEndpoint.includes(api));
  }

  /**
   * 检查是否为页面卸载错误
   */
  private async isPageUnloadError(logEntry: any): Promise<boolean> {
    const unloadPatterns = [
      /page.*unload/i,
      /component.*unmount/i,
      /route.*change/i,
      /navigation.*away/i,
    ];

    return (
      logEntry.source === 'frontend' &&
      unloadPatterns.some(pattern => pattern.test(logEntry.message))
    );
  }

  /**
   * 检查是否为业务参数错误
   */
  private async isBusinessParamError(logEntry: any): Promise<boolean> {
    const { metadata } = logEntry;
    if (!metadata?.inputParams) return false;

    // 检查计价相关参数
    const pricingParams = ['vehicleModel', 'specifications', 'serviceType'];
    const hasUnexpectedParams = pricingParams.some(param => {
      const value = metadata.inputParams[param];
      return value && this.isUnexpectedParamValue(param, value);
    });

    return hasUnexpectedParams;
  }

  /**
   * 检查是否为车型规格错误
   */
  private async isVehicleSpecError(logEntry: any): Promise<boolean> {
    const { metadata } = logEntry;
    if (!metadata?.vehicleModel || !metadata?.specifications) return false;

    // 检查车型是否具备指定规格
    return await this.checkVehicleSpecificationValidity(
      metadata.vehicleModel,
      metadata.specifications,
    );
  }

  /**
   * 检查参数值是否符合预期
   */
  private isUnexpectedParamValue(paramName: string, value: any): boolean {
    // 这里可以接入业务规则引擎
    const expectedValues = {
      vehicleModel: ['ModelA', 'ModelB', 'ModelC'],
      serviceType: ['basic', 'premium', 'vip'],
    };

    if (expectedValues[paramName]) {
      return !expectedValues[paramName].includes(value);
    }

    return false;
  }

  /**
   * 检查车型规格有效性
   */
  private async checkVehicleSpecificationValidity(
    vehicleModel: string,
    specifications: any,
  ): Promise<boolean> {
    // 这里可以查询车型配置数据库
    // 模拟检查逻辑
    const validSpecs = await this.getValidSpecifications(vehicleModel);
    const inputSpecs = Object.keys(specifications);

    return inputSpecs.some(spec => !validSpecs.includes(spec));
  }

  /**
   * 获取有效规格列表
   */
  private async getValidSpecifications(vehicleModel: string): Promise<string[]> {
    // 模拟数据，实际应该从配置库获取
    const specMapping = {
      ModelA: ['engine', 'transmission', 'color'],
      ModelB: ['engine', 'wheels', 'interior'],
      ModelC: ['battery', 'range', 'charging'],
    };

    return specMapping[vehicleModel] || [];
  }

  /**
   * 查找相似问题
   */
  private async findSimilarIssues(logEntry: any): Promise<any[]> {
    try {
      // 构建搜索文本
      const searchText = this.buildSearchText(logEntry);

      // 向量语义搜索
      const vectorResults = await this.vectorService.semanticSearch(searchText, {
        limit: 5,
        threshold: 0.7,
        filters: { category: 'log_issue' },
      });

      // 转换为相似问题格式
      return vectorResults.documents.map(doc => ({
        id: doc.id,
        similarity: doc.similarity || 0,
        resolution: doc.metadata.resolution,
        apiEndpoint: doc.metadata.apiEndpoint,
        errorMessage: doc.metadata.errorMessage,
      }));
    } catch (error) {
      this.logger.error('查找相似问题失败', error.stack);
      return [];
    }
  }

  /**
   * 构建搜索文本
   */
  private buildSearchText(logEntry: any): string {
    const parts = [
      logEntry.message,
      logEntry.metadata?.apiEndpoint,
      logEntry.metadata?.errorType,
      logEntry.stackTrace,
    ].filter(Boolean);

    return parts.join(' ');
  }

  /**
   * 分析严重程度
   */
  private async analyzeSeverity(
    logEntry: any,
    issueType: string,
  ): Promise<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> {
    // 基于问题类型的基础严重程度
    const baseSeverity = {
      BACKEND_RET_ERROR: 'MEDIUM',
      FRONTEND_JS_ERROR: 'LOW',
      BLOCKING_ERROR: 'CRITICAL',
      KEY_FLOW_ERROR: 'HIGH',
      PAGE_UNLOAD_ERROR: 'LOW',
      BUSINESS_PARAM_ERROR: 'MEDIUM',
      VEHICLE_SPEC_ERROR: 'MEDIUM',
    };

    let severity = baseSeverity[issueType] || 'LOW';

    // 调整因子
    if (logEntry.metadata?.retCode >= 500) {
      severity = 'HIGH';
    }

    if (logEntry.metadata?.affectsPayment) {
      severity = 'CRITICAL';
    }

    return severity as any;
  }

  /**
   * 分析根因
   */
  private async analyzeRootCause(logEntry: any, similarIssues: any[]): Promise<string> {
    const commonCauses = this.extractCommonCauses(similarIssues);
    
    if (commonCauses.length > 0) {
      return `基于相似问题分析，可能的根因：${commonCauses.join('; ')}`;
    }

    // 基于日志内容推断
    return this.inferRootCause(logEntry);
  }

  /**
   * 提取常见原因
   */
  private extractCommonCauses(similarIssues: any[]): string[] {
    const causes = similarIssues
      .map(issue => issue.rootCause)
      .filter(Boolean);

    return [...new Set(causes)];
  }

  /**
   * 推断根因
   */
  private inferRootCause(logEntry: any): string {
    if (logEntry.message.includes('timeout')) {
      return '网络超时或服务响应慢';
    }

    if (logEntry.message.includes('invalid')) {
      return '输入参数验证失败';
    }

    if (logEntry.message.includes('unauthorized')) {
      return '用户认证或权限问题';
    }

    return '需要进一步调查';
  }

  /**
   * 生成建议
   */
  private async generateRecommendations(
    logEntry: any,
    issueType: string,
    similarIssues: any[],
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // 基于问题类型的通用建议
    const typeRecommendations = {
      BACKEND_RET_ERROR: [
        '检查API返回码的业务逻辑',
        '确认是否需要添加到白名单',
        '验证用户输入参数的有效性',
      ],
      FRONTEND_JS_ERROR: [
        '检查前端错误边界处理',
        '验证组件生命周期管理',
        '确认异步操作的错误处理',
      ],
      BLOCKING_ERROR: [
        '立即检查系统可用性',
        '启动故障转移机制',
        '通知运维团队',
      ],
      KEY_FLOW_ERROR: [
        '优先修复关键业务流程',
        '检查依赖服务状态',
        '启用降级方案',
      ],
      BUSINESS_PARAM_ERROR: [
        '检查业务规则配置',
        '验证前端参数校验逻辑',
        '更新API文档和参数说明',
      ],
    };

    if (typeRecommendations[issueType]) {
      recommendations.push(...typeRecommendations[issueType]);
    }

    // 基于相似问题的建议
    const resolutions = similarIssues
      .map(issue => issue.resolution)
      .filter(Boolean);

    if (resolutions.length > 0) {
      recommendations.push('参考历史解决方案：' + resolutions.join('; '));
    }

    return recommendations;
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(logEntry: any, similarIssues: any[]): number {
    let confidence = 0.5; // 基础置信度

    // 有相似问题提升置信度
    if (similarIssues.length > 0) {
      const avgSimilarity = similarIssues.reduce((sum, issue) => sum + issue.similarity, 0) / similarIssues.length;
      confidence += avgSimilarity * 0.3;
    }

    // 有明确错误码提升置信度
    if (logEntry.metadata?.retCode) {
      confidence += 0.2;
    }

    // 有堆栈信息提升置信度
    if (logEntry.stackTrace) {
      confidence += 0.1;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * 检查白名单
   */
  private async checkWhitelist(logEntry: any): Promise<boolean> {
    try {
      const whitelistRules = await this.databaseService.issueWhitelistRule.findMany({
        where: { isActive: true },
      });

      for (const rule of whitelistRules) {
        if (await this.matchesWhitelistRule(logEntry, rule)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      this.logger.error('检查白名单失败', error.stack);
      return false;
    }
  }

  /**
   * 匹配白名单规则
   */
  private async matchesWhitelistRule(logEntry: any, rule: any): Promise<boolean> {
    const conditions = rule.conditions;

    for (const [key, value] of Object.entries(conditions)) {
      const logValue = this.getLogValue(logEntry, key);
      if (logValue !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * 获取日志值
   */
  private getLogValue(logEntry: any, key: string): any {
    if (key.includes('.')) {
      const parts = key.split('.');
      let value = logEntry;
      for (const part of parts) {
        value = value?.[part];
      }
      return value;
    }

    return logEntry[key] || logEntry.metadata?.[key];
  }

  /**
   * 保存用户日志问题
   */
  private async saveUserLogIssue(
    taskId: string,
    logEntryId: string,
    analysis: LogIssueAnalysisResult,
  ): Promise<void> {
    try {
      await this.databaseService.userLogIssue.create({
        data: {
          taskId,
          logEntryId,
          issueType: analysis.issueType as any,
          title: this.generateIssueTitle(analysis),
          description: this.generateIssueDescription(analysis),
          severity: analysis.severity,
          confidence: analysis.confidence,
          rootCause: analysis.rootCause,
          isBlocking: analysis.issueType === 'BLOCKING_ERROR',
          affectsKeyFlow: analysis.issueType === 'KEY_FLOW_ERROR',
        },
      });
    } catch (error) {
      this.logger.error('保存用户日志问题失败', error.stack);
    }
  }

  /**
   * 生成问题标题
   */
  private generateIssueTitle(analysis: LogIssueAnalysisResult): string {
    const titles = {
      BACKEND_RET_ERROR: '后端返回码异常',
      FRONTEND_JS_ERROR: '前端JavaScript错误',
      BLOCKING_ERROR: '阻塞性系统错误',
      KEY_FLOW_ERROR: '关键业务流程错误',
      PAGE_UNLOAD_ERROR: '页面卸载错误',
      BUSINESS_PARAM_ERROR: '业务参数异常',
      VEHICLE_SPEC_ERROR: '车型规格配置错误',
    };

    return titles[analysis.issueType] || '未知问题类型';
  }

  /**
   * 生成问题描述
   */
  private generateIssueDescription(analysis: LogIssueAnalysisResult): string {
    const parts = [
      `问题类型: ${analysis.issueType}`,
      `严重程度: ${analysis.severity}`,
      `置信度: ${(analysis.confidence * 100).toFixed(1)}%`,
    ];

    if (analysis.rootCause) {
      parts.push(`根因分析: ${analysis.rootCause}`);
    }

    if (analysis.recommendations.length > 0) {
      parts.push(`建议措施: ${analysis.recommendations.join('; ')}`);
    }

    return parts.join('\n');
  }

  // 辅助方法
  private async getTaskWithLogs(taskId: string): Promise<any> {
    return await this.databaseService.logAnalysisTask.findUnique({
      where: { taskId },
      include: {
        logEntries: true,
      },
    });
  }

  private async createAgentResult(taskId: string): Promise<void> {
    await this.databaseService.agentAnalysisResult.create({
      data: {
        taskId,
        agentType: 'USER_LOG_ISSUE' as any,
        status: 'RUNNING' as any,
        findings: {},
      },
    });
  }

  private async updateAgentResult(taskId: string, findings: any): Promise<void> {
    await this.databaseService.agentAnalysisResult.updateMany({
      where: {
        taskId,
        agentType: 'USER_LOG_ISSUE',
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        findings,
        confidence: findings.confidence,
      },
    });
  }

  private async markAgentFailed(taskId: string, error: string): Promise<void> {
    await this.databaseService.agentAnalysisResult.updateMany({
      where: {
        taskId,
        agentType: 'USER_LOG_ISSUE',
      },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        findings: { error },
      },
    });
  }

  private extractIssueTypes(issues: LogIssueAnalysisResult[]): string[] {
    return [...new Set(issues.map(issue => issue.issueType))];
  }

  private calculateSeverityDistribution(issues: LogIssueAnalysisResult[]): any {
    const distribution = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    issues.forEach(issue => {
      distribution[issue.severity]++;
    });
    return distribution;
  }

  private async generateSummary(issues: LogIssueAnalysisResult[]): Promise<{
    recommendations: string[];
    confidence: number;
  }> {
    const allRecommendations = issues.flatMap(issue => issue.recommendations);
    const uniqueRecommendations = [...new Set(allRecommendations)];
    
    const avgConfidence = issues.length > 0 
      ? issues.reduce((sum, issue) => sum + issue.confidence, 0) / issues.length
      : 0;

    return {
      recommendations: uniqueRecommendations.slice(0, 10), // 限制推荐数量
      confidence: avgConfidence,
    };
  }
} 