import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiProperty,
} from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Public } from '../../auth/decorators/public.decorator';
import { AgentOrchestratorService, AnalysisTask } from '../services/agent-orchestrator.service';

// DTO定义
export class AnalysisOptionsDto {
  @ApiProperty({ description: '执行管道类型', enum: ['SEQUENTIAL', 'PARALLEL', 'CONDITIONAL'], required: false })
  @IsOptional()
  @IsIn(['SEQUENTIAL', 'PARALLEL', 'CONDITIONAL'])
  pipeline?: 'SEQUENTIAL' | 'PARALLEL' | 'CONDITIONAL';

  @ApiProperty({ description: '优先级', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], required: false })
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export class CreateAnalysisTaskDto {
  @ApiProperty({ description: '用户反馈' })
  @IsString()
  userFeedback: string;

  @ApiProperty({ description: '日志数据，支持字符串数组或结构化对象数组' })
  @IsArray()
  logData: string[] | any[];

  @ApiProperty({ description: '用户上下文', required: false })
  @IsOptional()
  userContext?: any;

  @ApiProperty({ description: '执行管道类型', enum: ['SEQUENTIAL', 'PARALLEL', 'CONDITIONAL'], required: false })
  @IsOptional()
  @IsIn(['SEQUENTIAL', 'PARALLEL', 'CONDITIONAL'])
  pipeline?: 'SEQUENTIAL' | 'PARALLEL' | 'CONDITIONAL';

  @ApiProperty({ description: '优先级', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], required: false })
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @ApiProperty({ description: '分析类型', enum: ['REAL_TIME', 'BATCH', 'DEEP_ANALYSIS'], required: false })
  @IsOptional()
  @IsIn(['REAL_TIME', 'BATCH', 'DEEP_ANALYSIS'])
  analysisType?: 'REAL_TIME' | 'BATCH' | 'DEEP_ANALYSIS';

  @ApiProperty({ description: '需要的代理列表', required: false })
  @IsOptional()
  @IsArray()
  requiredAgents?: string[];

  @ApiProperty({ description: '元数据', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class QuickLogAnalysisDto {
  @ApiProperty({ description: '用户反馈' })
  @IsString()
  userFeedback: string;

  @ApiProperty({ description: '日志数据，支持字符串数组或结构化对象数组' })
  @IsArray()
  logData: string[] | Array<{
    id?: string;
    timestamp?: Date;
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
    source: string;
    service?: string;
    message: string;
    stackTrace?: string;
    metadata?: Record<string, any>;
  }>;

  @ApiProperty({ description: '分析选项', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => AnalysisOptionsDto)
  options?: AnalysisOptionsDto;
}

@ApiTags('AI代理编排系统')
@Controller('api/agent-orchestrator')
export class AgentOrchestratorController {
  constructor(
    private readonly agentOrchestrator: AgentOrchestratorService,
  ) {}

  /**
   * 创建分析任务 - 完整版
   */
  @Post('analyze/comprehensive')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '创建综合AI分析任务' })
  @ApiResponse({
    status: 200,
    description: '分析完成',
    schema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: '任务ID' },
        success: { type: 'boolean', description: '是否成功' },
        totalProcessingTime: { type: 'number', description: '总处理时间(ms)' },
        agentResults: { type: 'array', description: '代理执行结果' },
        aggregatedData: { type: 'object', description: '聚合数据' },
        summary: { type: 'object', description: '分析摘要' },
      },
    },
  })
  async createComprehensiveAnalysis(@Body() dto: CreateAnalysisTaskDto) {
    const task: AnalysisTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: dto.analysisType || 'BATCH',
      priority: dto.priority || 'MEDIUM',
      logData: dto.logData,
      userContext: dto.userContext || { userFeedback: dto.userFeedback },
      requiredAgents: dto.requiredAgents || this.agentOrchestrator.getAvailableAgents(),
      pipeline: dto.pipeline || 'SEQUENTIAL',
      metadata: dto.metadata,
    };

    return await this.agentOrchestrator.orchestrateAnalysis(task);
  }

  /**
   * 快速日志分析 - 简化版
   */
  @Post('analyze/quick')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '快速日志分析（使用AI代理编排）' })
  @ApiResponse({
    status: 200,
    description: '分析完成',
    schema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: '任务ID' },
        success: { type: 'boolean', description: '是否成功' },
        totalProcessingTime: { type: 'number', description: '总处理时间(ms)' },
        agentResults: { type: 'array', description: '代理执行结果' },
        summary: { type: 'object', description: '分析摘要' },
        quickInsights: { type: 'object', description: '快速洞察' },
      },
    },
  })
  async quickLogAnalysis(@Body() dto: QuickLogAnalysisDto) {
    // 处理不同格式的日志数据
    const processedLogData = this.processLogData(dto.logData, dto.userFeedback);

    const taskData = {
      id: `quick_${Date.now()}`,
      type: 'REAL_TIME',
      priority: dto.options?.priority || 'HIGH',
      logData: processedLogData,
      userContext: { userFeedback: dto.userFeedback, source: 'quick_analysis' },
    };

    const result = await this.agentOrchestrator.orchestrateAnalysis(
      taskData,
      dto.options?.pipeline || 'PARALLEL'
    );

    // 提取快速洞察
    const quickInsights = this.extractQuickInsights(result);

    return {
      ...result,
      quickInsights,
    };
  }

  /**
   * 获取注册的AI代理列表
   */
  @Get('agents')
  @Public()
  @ApiOperation({ summary: '获取已注册的AI代理列表' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        agents: { type: 'array', description: '代理列表' },
        totalCount: { type: 'number', description: '代理总数' },
        healthyCount: { type: 'number', description: '健康代理数' },
      },
    },
  })
  async getRegisteredAgents() {
    const agents = this.agentOrchestrator.getRegisteredAgents();
    let healthyCount = 0;

    // 并行检查所有代理的健康状态
    const healthChecks = await Promise.allSettled(
      agents.map(agent => this.agentOrchestrator.checkAgentHealth(agent.name))
    );

    healthChecks.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        healthyCount++;
      }
    });

    return {
      agents,
      totalCount: agents.length,
      healthyCount,
    };
  }

  /**
   * 检查特定代理健康状态
   */
  @Get('agents/:agentName/health')
  @Public()
  @ApiOperation({ summary: '检查特定代理健康状态' })
  @ApiResponse({
    status: 200,
    description: '健康检查完成',
    schema: {
      type: 'object',
      properties: {
        agentName: { type: 'string', description: '代理名称' },
        isHealthy: { type: 'boolean', description: '是否健康' },
        lastChecked: { type: 'string', description: '检查时间' },
      },
    },
  })
  async checkAgentHealth(@Param('agentName') agentName: string) {
    const isHealthy = await this.agentOrchestrator.checkAgentHealth(agentName);
    
    return {
      agentName,
      isHealthy,
      lastChecked: new Date().toISOString(),
    };
  }

  /**
   * 获取任务状态
   */
  @Get('tasks/:taskId/status')
  @ApiOperation({ summary: '获取分析任务状态' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: '任务ID' },
        status: { type: 'string', description: '任务状态' },
        progress: { type: 'number', description: '进度百分比' },
        currentAgent: { type: 'string', description: '当前执行代理' },
        startTime: { type: 'string', description: '开始时间' },
        endTime: { type: 'string', description: '结束时间' },
      },
    },
  })
  async getTaskStatus(@Param('taskId') taskId: string) {
    const status = this.agentOrchestrator.getTaskStatus(taskId);
    
    if (!status) {
      return {
        taskId,
        status: 'NOT_FOUND',
        message: '任务不存在或已过期',
      };
    }

    return status;
  }

  /**
   * 获取系统性能统计
   */
  @Get('stats/performance')
  @Public()
  @ApiOperation({ summary: '获取AI代理编排系统性能统计' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'object',
      properties: {
        totalTasks: { type: 'number', description: '总任务数' },
        successfulTasks: { type: 'number', description: '成功任务数' },
        failedTasks: { type: 'number', description: '失败任务数' },
        successRate: { type: 'number', description: '成功率' },
        averageProcessingTime: { type: 'number', description: '平均处理时间(ms)' },
        lastUpdate: { type: 'string', description: '最后更新时间' },
      },
    },
  })
  async getPerformanceStats() {
    return this.agentOrchestrator.getPerformanceStats();
  }

  /**
   * 错误专门分析
   */
  @Post('analyze/errors')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '专门针对错误日志的分析' })
  @ApiResponse({
    status: 200,
    description: '错误分析完成',
  })
  async analyzeErrors(@Body() dto: QuickLogAnalysisDto) {
    // 处理不同格式的日志数据
    const processedLogData = this.processLogData(dto.logData, dto.userFeedback);
    
    // 过滤出错误级别的日志
    const errorLogs = processedLogData.filter(log => 
      log.level === 'ERROR' || log.level === 'FATAL'
    );

    if (errorLogs.length === 0) {
      return {
        message: '未发现错误级别的日志',
        suggestion: '建议检查WARN级别的日志或调整日志级别',
      };
    }

    const taskData = {
      id: `error_analysis_${Date.now()}`,
      type: 'ERROR_FOCUSED_ANALYSIS',
      priority: 'HIGH',
      logData: errorLogs,
      userContext: { 
        userFeedback: dto.userFeedback,
        source: 'error_focused_analysis',
        errorCount: errorLogs.length,
      },
    };

    return await this.agentOrchestrator.orchestrateAnalysis(
      taskData,
      'CONDITIONAL' // 使用条件执行，重点关注错误相关代理
    );
  }

  /**
   * 提取快速洞察
   */
  private extractQuickInsights(result: any): any {
    const insights = {
      topIssues: [],
      riskLevel: 'LOW',
      urgentActions: [],
      systemHealth: 'GOOD',
    };

    // 从代理结果中提取关键信息
    if (result.agentResults) {
      // 提取异常检测结果
      const anomalyResult = result.agentResults.find(r => r.agentName === 'AnomalyDetectionAgent');
      if (anomalyResult?.data?.anomalies) {
        insights.topIssues = anomalyResult.data.anomalies.slice(0, 3);
      }

      // 提取错误分析结果
      const errorResult = result.agentResults.find(r => r.agentName === 'ErrorAnalysisAgent');
      if (errorResult?.data?.riskLevel) {
        insights.riskLevel = errorResult.data.riskLevel;
      }

      // 提取紧急建议
      const reportResult = result.agentResults.find(r => r.agentName === 'ReportGenerationAgent');
      if (reportResult?.data?.recommendations?.immediate) {
        insights.urgentActions = reportResult.data.recommendations.immediate;
      }

      // 评估系统健康度
      const avgConfidence = result.summary?.overallConfidence || 0;
      if (avgConfidence > 0.8) {
        insights.systemHealth = 'GOOD';
      } else if (avgConfidence > 0.6) {
        insights.systemHealth = 'MODERATE';
      } else {
        insights.systemHealth = 'POOR';
      }
    }

    return insights;
  }

  /**
   * 处理不同格式的日志数据
   * 支持 string[] 和结构化对象数组两种格式
   */
  private processLogData(
    logData: string[] | Array<any>,
    userFeedback: string,
  ): Array<any> {
    // 如果是string数组，转换为结构化对象
    if (Array.isArray(logData) && logData.length > 0 && typeof logData[0] === 'string') {
      return this.parseStringLogsToStructured(logData as string[], userFeedback);
    }

    // 如果已经是结构化对象数组，直接返回
    return logData as Array<any>;
  }

  /**
   * 将string[]格式的日志转换为结构化对象
   */
  private parseStringLogsToStructured(
    stringLogs: string[],
    userFeedback: string,
  ): Array<any> {
    return stringLogs.map((logString, index) => {
      const logData = {
        id: `string_log_${index + 1}`,
        timestamp: new Date(),
        level: 'INFO',
        source: 'unknown',
        service: 'unknown',
        message: logString,
        metadata: {
          originalFormat: 'string',
          userFeedback,
          parseIndex: index,
        },
      };

      // 尝试从字符串中提取日志级别
      const levelMatch = logString.match(/\b(DEBUG|INFO|WARN|WARNING|ERROR|FATAL|CRITICAL)\b/i);
      if (levelMatch) {
        logData.level = levelMatch[1].toUpperCase();
      }

      // 尝试提取时间戳
      const timestampMatch = logString.match(/(\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2})/);
      if (timestampMatch) {
        try {
          logData.timestamp = new Date(timestampMatch[1]);
        } catch (e) {
          // 保持默认时间戳
        }
      }

      // 根据内容推断来源
      const lowerLog = logString.toLowerCase();
      if (lowerLog.includes('frontend') || lowerLog.includes('react') || lowerLog.includes('js')) {
        logData.source = 'frontend';
      } else if (lowerLog.includes('backend') || lowerLog.includes('server') || lowerLog.includes('api')) {
        logData.source = 'backend';
      } else if (lowerLog.includes('mobile') || lowerLog.includes('app')) {
        logData.source = 'mobile';
      } else if (lowerLog.includes('database') || lowerLog.includes('db')) {
        logData.source = 'database';
      }

      // 尝试提取服务名
      const serviceMatch = logString.match(/service[:\s]+([a-zA-Z0-9-_]+)/i);
      if (serviceMatch) {
        logData.service = serviceMatch[1];
      }

      // 检查是否包含JSON数据并尝试解析
      try {
        const jsonMatch = logString.match(/\{[^{}]*\}/);
        if (jsonMatch) {
          const jsonData = JSON.parse(jsonMatch[0]);
          logData.metadata = { ...logData.metadata, ...jsonData };
        }
      } catch (e) {
        // JSON解析失败，忽略
      }

      return logData;
    });
  }
} 