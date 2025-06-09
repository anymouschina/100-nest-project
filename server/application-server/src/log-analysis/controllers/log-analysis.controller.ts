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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { LogAnalysisService } from '../services/log-analysis.service';
import { LogAnalysisSimplifiedService } from '../services/log-analysis-simplified.service';
import { VectorKnowledgeService } from '../../ai/services/vector-knowledge.service';

// DTO定义
export class CreateLogAnalysisTaskDto {
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

export class LogAnalysisResultDto {
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

export class AddWhitelistRuleDto {
  ruleType:
    | 'RET_CODE_IGNORE'
    | 'JS_ERROR_IGNORE'
    | 'PARAM_VALUE_IGNORE'
    | 'API_ENDPOINT_IGNORE';
  ruleName: string;
  description?: string;
  conditions: Record<string, any>;
  createdBy: number;
}

export class AnalyzeUserLogDto {
  userId: number;
  timeRange?: {
    startTime: Date;
    endTime: Date;
  };
  logSources?: string[];
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userFeedback?: string;
}

export class ManualLogAnalysisDto {
  userFeedback: string;
  logData: {
    timestamp?: Date;
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
    source: string; // backend, frontend, mobile
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
}

@ApiTags('日志分析')
@Controller('api/log-analysis')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LogAnalysisController {
  constructor(
    private readonly logAnalysisService: LogAnalysisService,
    private readonly logAnalysisSimplifiedService: LogAnalysisSimplifiedService,
    private readonly vectorService: VectorKnowledgeService,
  ) {}

  /**
   * 创建日志分析任务
   */
  @Post('tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建日志分析任务' })
  @ApiResponse({
    status: 201,
    description: '任务创建成功',
    schema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: '任务ID' },
        message: { type: 'string', description: '返回消息' },
      },
    },
  })
  async createAnalysisTask(@Body() dto: CreateLogAnalysisTaskDto) {
    const taskId = await this.logAnalysisService.createAnalysisTask(dto);

    return {
      taskId,
      message: '日志分析任务已创建，正在后台处理中...',
    };
  }

  /**
   * 获取分析结果
   */
  @Get('tasks/:taskId')
  @ApiOperation({ summary: '获取日志分析结果' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: LogAnalysisResultDto,
  })
  async getAnalysisResult(@Param('taskId') taskId: string) {
    return await this.logAnalysisService.getAnalysisResult(taskId);
  }

  /**
   * 获取用户的所有分析任务
   */
  @Get('tasks')
  @ApiOperation({ summary: '获取用户的日志分析任务列表' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          taskId: { type: 'string' },
          userFeedback: { type: 'string' },
          status: { type: 'string' },
          priority: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          completedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  async getUserAnalysisTasks(
    @Request() req: any,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('limit') limit: string = '20',
    @Query('offset') offset: string = '0',
  ) {
    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);

    // 优先使用查询参数中的userId，如果没有则使用JWT token中的用户ID
    let targetUserId: number;
    if (userId) {
      targetUserId = parseInt(userId, 10);
      if (isNaN(targetUserId)) {
        throw new Error('Invalid userId parameter');
      }
    } else {
      // 从JWT token中获取当前用户ID
      targetUserId = req.user?.sub || req.user?.userId;
      if (!targetUserId) {
        throw new Error('Unable to determine user ID from authentication');
      }
    }

    return await this.logAnalysisService.getUserAnalysisTasks(targetUserId, {
      status,
      limit: isNaN(parsedLimit) ? 20 : parsedLimit,
      offset: isNaN(parsedOffset) ? 0 : parsedOffset,
    });
  }

  /**
   * 添加白名单规则
   */
  @Post('whitelist')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '添加问题白名单规则' })
  @ApiResponse({
    status: 201,
    description: '规则添加成功',
  })
  async addWhitelistRule(@Body() dto: AddWhitelistRuleDto) {
    return await this.logAnalysisService.addWhitelistRule(dto);
  }

  /**
   * 获取白名单规则
   */
  @Get('whitelist')
  @ApiOperation({ summary: '获取白名单规则列表' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
  })
  async getWhitelistRules(
    @Query('ruleType') ruleType?: string,
    @Query('isActive') isActive?: boolean,
  ) {
    return await this.logAnalysisService.getWhitelistRules({
      ruleType,
      isActive,
    });
  }

  /**
   * 语义搜索相似问题
   */
  @Post('search/similar-issues')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '搜索相似的历史问题' })
  @ApiResponse({
    status: 200,
    description: '搜索成功',
  })
  async searchSimilarIssues(
    @Body()
    body: {
      query: string;
      limit?: number;
      threshold?: number;
      filters?: Record<string, any>;
    },
  ) {
    const { query, limit = 10, threshold = 0.7, filters = {} } = body;

    return await this.vectorService.semanticSearch(query, {
      limit,
      threshold,
      filters: { ...filters, category: 'log_issue' },
    });
  }

  /**
   * 获取业务参数特征分析
   */
  @Get('features/business-params')
  @ApiOperation({ summary: '获取业务参数特征分析' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
  })
  async getBusinessParamFeatures(
    @Query('apiEndpoint') apiEndpoint?: string,
    @Query('isAnomalous') isAnomalous?: boolean,
    @Query('limit') limit: number = 50,
  ) {
    return await this.logAnalysisService.getBusinessParamFeatures({
      apiEndpoint,
      isAnomalous,
      limit,
    });
  }

  /**
   * 分析参数异常
   */
  @Post('analyze/param-anomaly')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '分析参数是否异常' })
  @ApiResponse({
    status: 200,
    description: '分析完成',
    schema: {
      type: 'object',
      properties: {
        isAnomalous: { type: 'boolean' },
        confidence: { type: 'number' },
        similarPatterns: { type: 'array' },
        recommendations: { type: 'array' },
      },
    },
  })
  async analyzeParamAnomaly(
    @Body()
    body: {
      apiEndpoint: string;
      inputParams: Record<string, any>;
      vehicleModel?: string;
      specifications?: Record<string, any>;
    },
  ) {
    return await this.logAnalysisService.analyzeParamAnomaly(body);
  }

  /**
   * 获取分析统计
   */
  @Get('stats')
  @ApiOperation({ summary: '获取日志分析统计信息' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
  })
  async getAnalysisStats(
    @Query('userId') userId?: number,
    @Query('timeRange') timeRange?: string, // 'day' | 'week' | 'month'
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.logAnalysisService.getAnalysisStats({
      userId,
      timeRange,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  /**
   * 获取问题分类统计
   */
  @Get('stats/issue-types')
  @ApiOperation({ summary: '获取问题分类统计' })
  @ApiResponse({
    status: 200,
    description: '统计数据获取成功',
  })
  async getIssueTypeStats(
    @Query('timeRange') timeRange?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return await this.logAnalysisService.getIssueTypeStats({
      timeRange,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  /**
   * 导出分析报告
   */
  @Get('tasks/:taskId/report')
  @ApiOperation({ summary: '导出分析报告' })
  @ApiResponse({
    status: 200,
    description: '报告生成成功',
  })
  async exportAnalysisReport(
    @Param('taskId') taskId: string,
    @Query('format') format: 'json' | 'csv' | 'pdf' = 'json',
  ) {
    return await this.logAnalysisService.exportAnalysisReport(taskId, format);
  }

  /**
   * 向量知识库管理
   */
  @Post('vector/documents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '添加向量文档' })
  @ApiResponse({
    status: 201,
    description: '文档添加成功',
  })
  async addVectorDocument(
    @Body()
    body: {
      id: string;
      content: string;
      metadata: Record<string, any>;
    },
  ) {
    await this.vectorService.addDocument(body);
    return { message: '文档添加成功' };
  }

  /**
   * 批量添加向量文档
   */
  @Post('vector/documents/batch')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '批量添加向量文档' })
  @ApiResponse({
    status: 201,
    description: '批量添加成功',
  })
  async addVectorDocuments(
    @Body()
    body: {
      documents: Array<{
        id: string;
        content: string;
        metadata: Record<string, any>;
      }>;
    },
  ) {
    await this.vectorService.addDocuments(body.documents);
    return {
      message: '批量添加成功',
      count: body.documents.length,
    };
  }

  /**
   * 搜索向量文档
   */
  @Post('vector/search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '向量语义搜索' })
  @ApiResponse({
    status: 200,
    description: '搜索完成',
  })
  async searchVectorDocuments(
    @Body()
    body: {
      query: string;
      limit?: number;
      threshold?: number;
      filters?: Record<string, any>;
      includeMetadata?: boolean;
    },
  ) {
    return await this.vectorService.semanticSearch(body.query, body);
  }

  /**
   * 混合搜索
   */
  @Post('vector/hybrid-search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '混合搜索（关键词+语义）' })
  @ApiResponse({
    status: 200,
    description: '搜索完成',
  })
  async hybridSearch(
    @Body()
    body: {
      query: string;
      keywordWeight?: number;
      semanticWeight?: number;
      limit?: number;
      filters?: Record<string, any>;
    },
  ) {
    return await this.vectorService.hybridSearch(body.query, body);
  }

  /**
   * 获取相似文档
   */
  @Get('vector/documents/:documentId/similar')
  @ApiOperation({ summary: '获取相似文档' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
  })
  async findSimilarDocuments(
    @Param('documentId') documentId: string,
    @Query('limit') limit: number = 5,
  ) {
    return await this.vectorService.findSimilarDocuments(documentId, limit);
  }

  /**
   * 文档聚类分析
   */
  @Post('vector/cluster')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '文档聚类分析' })
  @ApiResponse({
    status: 200,
    description: '聚类分析完成',
  })
  async clusterDocuments(
    @Body() body: { filters?: Record<string, any>; numClusters?: number },
  ) {
    const { filters, numClusters = 5 } = body;
    return await this.vectorService.clusterDocuments(filters, numClusters);
  }

  /**
   * 通过用户ID分析日志
   */
  @Post('analyze/user-logs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '通过用户ID查询并分析日志' })
  @ApiResponse({
    status: 201,
    description: '分析任务创建成功',
    schema: {
      type: 'object',
      properties: {
        taskId: { type: 'string', description: '任务ID' },
        message: { type: 'string', description: '返回消息' },
        logCount: { type: 'number', description: '找到的日志条数' },
      },
    },
  })
  async analyzeUserLogs(
    @Body()
    body: {
      userId: number;
      timeRange?: {
        startTime: Date;
        endTime: Date;
      };
      logSources?: string[];
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      userFeedback?: string;
    },
  ) {
    return await this.logAnalysisSimplifiedService.analyzeUserLogs(body);
  }

  /**
   * 手动输入日志进行即时分析
   */
  @Post('analyze/manual')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '手动输入日志进行即时分析' })
  @ApiResponse({
    status: 200,
    description: '分析完成',
    schema: {
      type: 'object',
      properties: {
        analysisResult: { type: 'object', description: '分析结果' },
        suggestions: { type: 'array', description: '建议措施' },
        similarIssues: { type: 'array', description: '相似问题' },
        riskLevel: { type: 'string', description: '风险等级' },
      },
    },
  })
  async analyzeManualLog(
    @Body()
    body: {
      userFeedback: string;
      logData:
        | string[]
        | {
            timestamp?: Date;
            level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
            source: string; // backend, frontend, mobile
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
    },
  ) {
    return await this.logAnalysisSimplifiedService.analyzeManualLog(body);
  }

  /**
   * 获取当前用户的历史日志
   */
  @Get('logs/user')
  @ApiOperation({ summary: '获取当前登录用户的历史日志' })
  @ApiResponse({
    status: 200,
    description: '日志获取成功',
  })
  async getCurrentUserLogs(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('level') level?: string,
    @Query('source') source?: string,
    @Query('limit') limit: number = 100,
    @Query('offset') offset: number = 0,
  ) {
    // 从JWT token中获取当前用户ID
    const targetUserId = req.user?.sub || req.user?.userId;
    if (!targetUserId) {
      throw new Error('Unable to determine user ID from authentication');
    }

    return await this.logAnalysisSimplifiedService.getUserLogs({
      userId: targetUserId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      level,
      source,
      limit,
      offset,
    });
  }

  /**
   * 获取指定用户的历史日志
   */
  @Get('logs/user/:userId')
  @ApiOperation({ summary: '获取指定用户的历史日志' })
  @ApiResponse({
    status: 200,
    description: '日志获取成功',
  })
  async getUserLogs(
    @Param('userId') userIdParam: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('level') level?: string,
    @Query('source') source?: string,
    @Query('limit') limit: number = 100,
    @Query('offset') offset: number = 0,
  ) {
    const targetUserId = parseInt(userIdParam, 10);
    if (isNaN(targetUserId)) {
      throw new Error('Invalid userId parameter');
    }

    return await this.logAnalysisSimplifiedService.getUserLogs({
      userId: targetUserId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      level,
      source,
      limit,
      offset,
    });
  }

  /**
   * 快速日志健康检查
   */
  @Post('analyze/quick-check')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '快速日志健康检查' })
  @ApiResponse({
    status: 200,
    description: '检查完成',
  })
  async quickLogCheck(
    @Body()
    body: {
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
    },
  ) {
    return await this.logAnalysisSimplifiedService.quickLogCheck(body);
  }
}
