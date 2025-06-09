import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

// 核心接口定义
export interface AnalysisTask {
  id: string;
  type: 'REAL_TIME' | 'BATCH' | 'DEEP_ANALYSIS';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  logData: any[];
  userContext: any;
  requiredAgents: string[];
  pipeline: 'SEQUENTIAL' | 'PARALLEL' | 'CONDITIONAL';
  metadata?: Record<string, any>;
}

export interface AgentResult {
  agentName: string;
  success: boolean;
  data: any;
  error?: string;
  processingTime: number;
  confidence?: number;
}

export interface AnalysisResult {
  taskId: string;
  success: boolean;
  totalProcessingTime: number;
  agentResults: AgentResult[];
  aggregatedData: any;
  summary: {
    totalAgents: number;
    successfulAgents: number;
    failedAgents: number;
    overallConfidence: number;
  };
}

export interface Agent {
  name: string;
  version: string;
  capabilities: string[];
  execute(data: any, context: AgentContext): Promise<AgentResult>;
  healthCheck(): Promise<boolean>;
}

export interface AgentContext {
  taskId: string;
  userContext: any;
  previousResults?: AgentResult[];
  metadata?: Record<string, any>;
}

export interface TaskStatus {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  currentAgent?: string;
  startTime: Date;
  endTime?: Date;
  error?: string;
}

export interface PerformanceStats {
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  successRate: number;
  averageProcessingTime: number;
  lastUpdate: Date;
}

export interface RegisteredAgent {
  name: string;
  version: string;
  capabilities: string[];
  isActive: boolean;
  lastHealthCheck?: Date;
}

@Injectable()
export class AgentOrchestratorService {
  private readonly logger = new Logger(AgentOrchestratorService.name);
  private readonly agents = new Map<string, Agent>();
  private readonly taskStatuses = new Map<string, TaskStatus>();
  private readonly taskQueue: AnalysisTask[] = [];
  private readonly performanceStats: PerformanceStats = {
    totalTasks: 0,
    successfulTasks: 0,
    failedTasks: 0,
    successRate: 0,
    averageProcessingTime: 0,
    lastUpdate: new Date(),
  };
  private readonly processingTimes: number[] = [];

  constructor(private readonly databaseService: DatabaseService) {
    this.initializeOrchestrator();
  }

  /**
   * 初始化编排器
   */
  private async initializeOrchestrator(): Promise<void> {
    this.logger.log('初始化AI代理编排器');
    // 这里会在后续注册所有代理
  }

  /**
   * 编排分析任务 - 主入口方法（重载版本1）
   */
  async orchestrateAnalysis(task: AnalysisTask): Promise<AnalysisResult>;
  /**
   * 编排分析任务 - 主入口方法（重载版本2）
   */
  async orchestrateAnalysis(
    task: any,
    pipeline: string,
  ): Promise<AnalysisResult>;
  /**
   * 编排分析任务 - 主入口方法实现
   */
  async orchestrateAnalysis(
    taskOrData: any,
    pipeline?: string,
  ): Promise<AnalysisResult> {
    const startTime = Date.now();

    // 处理不同的调用方式
    let task: AnalysisTask;
    if (pipeline) {
      // 兼容测试脚本的调用方式
      task = {
        id: taskOrData.id,
        type: taskOrData.type as any,
        priority: taskOrData.priority as any,
        logData: taskOrData.logData,
        userContext: taskOrData.userContext,
        requiredAgents: this.getAvailableAgents(), // 使用所有可用代理
        pipeline: pipeline as any,
        metadata: taskOrData.metadata,
      };
    } else {
      task = taskOrData;
    }

    this.logger.log(
      `开始编排分析任务: ${task.id}, 类型: ${task.type}, 优先级: ${task.priority}`,
    );

    try {
      // 更新统计信息
      this.performanceStats.totalTasks++;

      // 1. 验证任务
      await this.validateTask(task);

      // 2. 初始化任务状态
      await this.initializeTaskStatus(task);

      // 3. 准备代理执行环境
      const agents = await this.prepareAgents(task.requiredAgents);

      // 4. 根据流水线类型执行
      let agentResults: AgentResult[];
      switch (task.pipeline) {
        case 'SEQUENTIAL':
          agentResults = await this.executeSequential(agents, task);
          break;
        case 'PARALLEL':
          agentResults = await this.executeParallel(agents, task);
          break;
        case 'CONDITIONAL':
          agentResults = await this.executeConditional(agents, task);
          break;
        default:
          throw new Error(`不支持的流水线类型: ${task.pipeline}`);
      }

      // 5. 聚合结果
      const aggregatedData = await this.aggregateResults(agentResults, task);

      // 6. 生成最终结果
      const totalProcessingTime = Date.now() - startTime;
      const result: AnalysisResult = {
        taskId: task.id,
        success: true,
        totalProcessingTime,
        agentResults,
        aggregatedData,
        summary: this.generateSummary(agentResults),
      };

      // 7. 更新任务状态
      await this.completeTask(task.id, result);

      // 8. 保存分析结果
      await this.saveAnalysisResult(result);

      // 9. 更新性能统计
      this.updatePerformanceStats(totalProcessingTime, true);

      this.logger.log(
        `任务编排完成: ${task.id}, 耗时: ${totalProcessingTime}ms`,
      );
      return result;

    } catch (error) {
      await this.failTask(task.id, error.message);
      this.updatePerformanceStats(Date.now() - startTime, false);
      this.logger.error(`任务编排失败: ${task.id}`, error.stack);
      throw error;
    }
  }

  /**
   * 注册代理
   */
  registerAgent(agent: Agent): void {
    this.agents.set(agent.name, agent);
    this.logger.log(`注册代理: ${agent.name} v${agent.version}`);
  }

  /**
   * 获取可用代理列表
   */
  getAvailableAgents(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * 获取已注册代理详细信息
   */
  getRegisteredAgents(): RegisteredAgent[] {
    return Array.from(this.agents.entries()).map(([name, agent]) => ({
      name: agent.name,
      version: agent.version,
      capabilities: agent.capabilities,
      isActive: true, // 简化实现，假设所有注册的代理都是活跃的
      lastHealthCheck: new Date(),
    }));
  }

  /**
   * 检查代理健康状态
   */
  async checkAgentHealth(agentName: string): Promise<boolean> {
    const agent = this.agents.get(agentName);
    if (!agent) {
      this.logger.warn(`代理不存在: ${agentName}`);
      return false;
    }

    try {
      return await agent.healthCheck();
    } catch (error) {
      this.logger.error(`代理健康检查失败: ${agentName}`, error.stack);
      return false;
    }
  }

  /**
   * 获取性能统计信息
   */
  getPerformanceStats(): PerformanceStats {
    this.performanceStats.lastUpdate = new Date();
    return { ...this.performanceStats };
  }

  /**
   * 获取任务状态
   */
  getTaskStatus(taskId: string): TaskStatus | null {
    return this.taskStatuses.get(taskId) || null;
  }

  /**
   * 更新性能统计
   */
  private updatePerformanceStats(
    processingTime: number,
    success: boolean,
  ): void {
    if (success) {
      this.performanceStats.successfulTasks++;
    } else {
      this.performanceStats.failedTasks++;
    }

    this.processingTimes.push(processingTime);
    
    // 保持最近100次的处理时间记录
    if (this.processingTimes.length > 100) {
      this.processingTimes.shift();
    }

    // 计算成功率和平均处理时间
    this.performanceStats.successRate = 
      this.performanceStats.successfulTasks / this.performanceStats.totalTasks;
    this.performanceStats.averageProcessingTime = 
      this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length;
  }

  /**
   * 顺序执行代理
   */
  private async executeSequential(agents: Agent[], task: AnalysisTask): Promise<AgentResult[]> {
    this.logger.debug(`顺序执行 ${agents.length} 个代理`);
    const results: AgentResult[] = [];
    const context: AgentContext = {
      taskId: task.id,
      userContext: task.userContext,
      metadata: task.metadata,
    };

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      
      try {
        await this.updateTaskProgress(task.id, agent.name, (i / agents.length) * 100);
        
        this.logger.debug(`执行代理: ${agent.name}`);
        context.previousResults = results; // 传递前面代理的结果
        
        const result = await agent.execute(task.logData, context);
        results.push(result);

        if (!result.success) {
          this.logger.warn(`代理执行失败: ${agent.name}, 错误: ${result.error}`);
        }

      } catch (error) {
        this.logger.error(`代理执行异常: ${agent.name}`, error.stack);
        results.push({
          agentName: agent.name,
          success: false,
          data: null,
          error: error.message,
          processingTime: 0,
        });
      }
    }

    return results;
  }

  /**
   * 并行执行代理
   */
  private async executeParallel(agents: Agent[], task: AnalysisTask): Promise<AgentResult[]> {
    this.logger.debug(`并行执行 ${agents.length} 个代理`);
    const context: AgentContext = {
      taskId: task.id,
      userContext: task.userContext,
      metadata: task.metadata,
    };

    await this.updateTaskProgress(task.id, 'parallel_execution', 0);

    const promises = agents.map(async (agent) => {
      try {
        this.logger.debug(`并行执行代理: ${agent.name}`);
        return await agent.execute(task.logData, context);
      } catch (error) {
        this.logger.error(`并行代理执行异常: ${agent.name}`, error.stack);
        return {
          agentName: agent.name,
          success: false,
          data: null,
          error: error.message,
          processingTime: 0,
        };
      }
    });

    const results = await Promise.all(promises);
    await this.updateTaskProgress(task.id, 'parallel_execution', 100);

    return results;
  }

  /**
   * 条件执行代理
   */
  private async executeConditional(agents: Agent[], task: AnalysisTask): Promise<AgentResult[]> {
    this.logger.debug(`条件执行 ${agents.length} 个代理`);
    const results: AgentResult[] = [];
    const context: AgentContext = {
      taskId: task.id,
      userContext: task.userContext,
      metadata: task.metadata,
    };

    // 简化的条件逻辑：先执行特征提取，根据结果决定后续流程
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      
      // 条件判断逻辑
      if (i > 0 && !this.shouldExecuteAgent(agent, results)) {
        this.logger.debug(`跳过代理执行: ${agent.name}`);
        continue;
      }

      try {
        await this.updateTaskProgress(task.id, agent.name, (i / agents.length) * 100);
        
        context.previousResults = results;
        const result = await agent.execute(task.logData, context);
        results.push(result);

      } catch (error) {
        this.logger.error(`条件代理执行异常: ${agent.name}`, error.stack);
        results.push({
          agentName: agent.name,
          success: false,
          data: null,
          error: error.message,
          processingTime: 0,
        });
      }
    }

    return results;
  }

  /**
   * 聚合代理结果
   */
  private async aggregateResults(agentResults: AgentResult[], task: AnalysisTask): Promise<any> {
    this.logger.debug('开始聚合代理结果');

         const aggregated = {
       taskId: task.id,
       taskType: task.type,
       logAnalysis: {
         userIssues: null,
         anomalies: null,
         features: null,
         errors: null,
         behaviors: null,
       },
       issues: [],
       anomalies: [],
       features: {},
       recommendations: [],
       riskLevel: 'LOW',
       confidence: 0,
     };

    // 聚合各代理的结果
    for (const result of agentResults) {
      if (!result.success) continue;

      switch (result.agentName) {
        case 'UserLogIssueAgent':
          aggregated.issues = result.data?.issues || [];
          aggregated.logAnalysis.userIssues = result.data;
          break;

        case 'AnomalyDetectionAgent':
          aggregated.anomalies = result.data?.anomalies || [];
          aggregated.logAnalysis.anomalies = result.data;
          break;

        case 'FeatureExtractionAgent':
          aggregated.features = result.data?.features || {};
          aggregated.logAnalysis.features = result.data;
          break;

        case 'ErrorAnalysisAgent':
          aggregated.logAnalysis.errors = result.data;
          break;

        case 'BehaviorAnalysisAgent':
          aggregated.logAnalysis.behaviors = result.data;
          break;

        case 'ReportGenerationAgent':
          aggregated.recommendations = result.data?.recommendations || [];
          break;
      }
    }

    // 计算整体风险等级
    aggregated.riskLevel = this.calculateOverallRiskLevel(agentResults);
    
    // 计算整体置信度
    aggregated.confidence = this.calculateOverallConfidence(agentResults);

    return aggregated;
  }

  /**
   * 验证任务
   */
  private async validateTask(task: AnalysisTask): Promise<void> {
    if (!task.id) {
      throw new Error('任务ID不能为空');
    }

    if (!task.logData || task.logData.length === 0) {
      throw new Error('日志数据不能为空');
    }

    if (!task.requiredAgents || task.requiredAgents.length === 0) {
      throw new Error('必须指定至少一个代理');
    }

    // 检查代理是否存在
    for (const agentName of task.requiredAgents) {
      if (!this.agents.has(agentName)) {
        throw new Error(`代理不存在: ${agentName}`);
      }
    }
  }

  /**
   * 准备代理
   */
  private async prepareAgents(agentNames: string[]): Promise<Agent[]> {
    const agents: Agent[] = [];

    for (const name of agentNames) {
      const agent = this.agents.get(name);
      if (!agent) {
        throw new Error(`代理不存在: ${name}`);
      }

      // 健康检查
      try {
        const isHealthy = await agent.healthCheck();
        if (!isHealthy) {
          this.logger.warn(`代理健康检查失败: ${name}`);
        }
      } catch (error) {
        this.logger.warn(`代理健康检查异常: ${name}`, error.message);
      }

      agents.push(agent);
    }

    return agents;
  }

  /**
   * 初始化任务状态
   */
  private async initializeTaskStatus(task: AnalysisTask): Promise<void> {
    const status: TaskStatus = {
      id: task.id,
      status: 'RUNNING',
      progress: 0,
      startTime: new Date(),
    };

    this.taskStatuses.set(task.id, status);

         // 保存到数据库 (暂时注释掉，等数据库模型完善后再启用)
     // try {
     //   await this.databaseService.logAnalysisTask.upsert({
     //     where: { id: task.id },
     //     update: { status: 'RUNNING', startedAt: new Date() },
     //     create: {
     //       id: task.id, type: task.type, priority: task.priority,
     //       status: 'RUNNING', startedAt: new Date(),
     //       logData: JSON.stringify(task.logData),
     //       userContext: JSON.stringify(task.userContext),
     //     },
     //   });
     // } catch (error) {
     //   this.logger.warn('保存任务状态到数据库失败', error.message);
     // }
  }

  /**
   * 更新任务进度
   */
  private async updateTaskProgress(taskId: string, currentAgent: string, progress: number): Promise<void> {
    const status = this.taskStatuses.get(taskId);
    if (status) {
      status.progress = progress;
      status.currentAgent = currentAgent;
      this.taskStatuses.set(taskId, status);
    }
  }

  /**
   * 完成任务
   */
  private async completeTask(taskId: string, result: AnalysisResult): Promise<void> {
    const status = this.taskStatuses.get(taskId);
    if (status) {
      status.status = 'COMPLETED';
      status.progress = 100;
      status.endTime = new Date();
      this.taskStatuses.set(taskId, status);
    }

         // 更新数据库 (暂时注释)
     // try {
     //   await this.databaseService.logAnalysisTask.update({
     //     where: { id: taskId },
     //     data: { status: 'COMPLETED', completedAt: new Date() },
     //   });
     // } catch (error) {
     //   this.logger.warn('更新任务完成状态失败', error.message);
     // }
  }

  /**
   * 任务失败
   */
  private async failTask(taskId: string, error: string): Promise<void> {
    const status = this.taskStatuses.get(taskId);
    if (status) {
      status.status = 'FAILED';
      status.error = error;
      status.endTime = new Date();
      this.taskStatuses.set(taskId, status);
    }

         // 更新数据库 (暂时注释)
     // try {
     //   await this.databaseService.logAnalysisTask.update({
     //     where: { id: taskId },
     //     data: { status: 'FAILED', completedAt: new Date() },
     //   });
     // } catch (error) {
     //   this.logger.warn('更新任务失败状态失败', error.message);
     // }
  }

  /**
   * 保存分析结果
   */
  private async saveAnalysisResult(result: AnalysisResult): Promise<void> {
    try {
      // 这里可以保存到专门的结果表
      this.logger.debug(`保存分析结果: ${result.taskId}`);
    } catch (error) {
      this.logger.warn('保存分析结果失败', error.message);
    }
  }

  /**
   * 生成结果摘要
   */
  private generateSummary(agentResults: AgentResult[]): any {
    const totalAgents = agentResults.length;
    const successfulAgents = agentResults.filter(r => r.success).length;
    const failedAgents = totalAgents - successfulAgents;
    
    const confidenceValues = agentResults
      .filter(r => r.success && r.confidence !== undefined)
      .map(r => r.confidence!);
    
    const overallConfidence = confidenceValues.length > 0 
      ? confidenceValues.reduce((sum, c) => sum + c, 0) / confidenceValues.length 
      : 0;

    return {
      totalAgents,
      successfulAgents,
      failedAgents,
      overallConfidence,
    };
  }

  /**
   * 计算整体风险等级
   */
  private calculateOverallRiskLevel(agentResults: AgentResult[]): string {
    const riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    let maxRiskIndex = 0;

    for (const result of agentResults) {
      if (result.success && result.data?.riskLevel) {
        const riskIndex = riskLevels.indexOf(result.data.riskLevel);
        if (riskIndex > maxRiskIndex) {
          maxRiskIndex = riskIndex;
        }
      }
    }

    return riskLevels[maxRiskIndex];
  }

  /**
   * 计算整体置信度
   */
  private calculateOverallConfidence(agentResults: AgentResult[]): number {
    const confidenceValues = agentResults
      .filter(r => r.success && r.confidence !== undefined)
      .map(r => r.confidence!);

    if (confidenceValues.length === 0) return 0;

    return confidenceValues.reduce((sum, c) => sum + c, 0) / confidenceValues.length;
  }

  /**
   * 判断是否应该执行代理（条件执行逻辑）
   */
  private shouldExecuteAgent(agent: Agent, previousResults: AgentResult[]): boolean {
    // 简化的条件逻辑示例
    if (agent.name === 'AnomalyDetectionAgent') {
      // 只有当特征提取发现可疑模式时才执行异常检测
      const featureResult = previousResults.find(r => r.agentName === 'FeatureExtractionAgent');
      return featureResult?.success && featureResult?.data?.suspiciousPatterns;
    }

    if (agent.name === 'BehaviorAnalysisAgent') {
      // 只有当发现用户问题时才执行行为分析
      const issueResult = previousResults.find(r => r.agentName === 'UserLogIssueAgent');
      return issueResult?.success && issueResult?.data?.issues?.length > 0;
    }

    return true; // 默认执行
  }
}
