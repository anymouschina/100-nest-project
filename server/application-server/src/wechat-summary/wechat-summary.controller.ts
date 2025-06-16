import { Controller, Post, Get, Body, Query, Logger, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { WechatSummaryService } from './wechat-summary.service';
import { LangChainService } from './langchain.service';
import { EnhancedLangChainService } from './enhanced-langchain.service';
import { VectorService } from './vector.service';
import { 
  SummaryRequestDto, 
  SmartSummaryRequestDto, 
  BatchAnalysisRequestDto, 
  ComparisonAnalysisRequestDto 
} from './dto/summary-request.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('微信聊天总结')
@Controller('wechat-summary')
@Public()
export class WechatSummaryController {
  private readonly logger = new Logger(WechatSummaryController.name);

  constructor(
    private readonly wechatSummaryService: WechatSummaryService,
    private readonly langChainService: LangChainService,
    private readonly enhancedLangChainService: EnhancedLangChainService,
    private readonly vectorService: VectorService,
  ) {}

  @Post('summarize')
  @ApiOperation({ 
    summary: '总结微信群聊记录',
    description: '根据指定的时间范围和群组，使用AI模型总结聊天记录' 
  })
  @Public()
  @ApiBody({ 
    type: SummaryRequestDto,
    description: '总结请求参数',
    examples: {
      daily: {
        summary: '日常总结示例',
        value: {
          groupName: '工作群',
          timeRange: '2024-01-15',
          summaryType: 'daily'
        }
      },
      timeRange: {
        summary: '时间范围总结示例',
        value: {
          groupName: '朋友群',
          timeRange: '2024-01-15/09:00~2024-01-15/18:00',
          summaryType: 'topic',
          keyword: '聚餐'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: '总结成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            summary: { type: 'string', description: '总结内容' },
            keyPoints: { type: 'array', items: { type: 'string' }, description: '关键点' },
            participants: { type: 'array', items: { type: 'string' }, description: '参与者' },
            timeRange: { type: 'string', description: '时间范围' },
            messageCount: { type: 'number', description: '消息数量' },
            groupName: { type: 'string', description: '群组名称' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 500, description: '服务器内部错误' })
  async summarizeGroupChat(@Body() request: SummaryRequestDto) {
    this.logger.log(`收到群聊总结请求: ${JSON.stringify(request)}`);
    
    if (!request.timeRange) {
      return {
        success: false,
        error: '时间范围参数不能为空'
      };
    }

    return await this.wechatSummaryService.summarizeGroupChat(request);
  }

  @Post('smart-summary')
  @Public()
  @ApiOperation({ 
    summary: '智能时间范围总结',
    description: '使用相对时间（今天、昨天、本周等）进行智能总结' 
  })
  @ApiBody({ 
    type: SmartSummaryRequestDto,
    description: '智能总结请求参数',
    examples: {
      today: {
        summary: '今日总结',
        value: {
          groupName: '工作群',
          relativeTime: 'today',
          summaryType: 'daily'
        }
      },
      thisWeek: {
        summary: '本周总结',
        value: {
          groupName: '项目群',
          relativeTime: 'thisWeek',
          summaryType: 'topic'
        }
      }
    }
  })
  @ApiResponse({ status: 200, description: '智能总结成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  async smartSummary(@Body() request: SmartSummaryRequestDto) {
    this.logger.log(`收到智能总结请求: ${JSON.stringify(request)}`);
    
    if (!request.relativeTime && !request.specificDate) {
      return {
        success: false,
        error: '必须提供relativeTime或specificDate参数'
      };
    }

    return await this.wechatSummaryService.smartSummary(request);
  }

  @Post('smart-summary-stream')
  @Public()
  @ApiOperation({ 
    summary: '智能时间范围总结（流式返回）',
    description: '使用相对时间进行智能总结，如果没有缓存则使用流式返回，提供实时反馈' 
  })
  @ApiBody({ 
    type: SmartSummaryRequestDto,
    description: '智能总结请求参数'
  })
  @ApiResponse({ 
    status: 200, 
    description: '流式总结成功',
    headers: {
      'Content-Type': {
        description: 'text/plain; charset=utf-8',
        schema: { type: 'string' }
      },
      'Transfer-Encoding': {
        description: 'chunked',
        schema: { type: 'string' }
      }
    }
  })
  async smartSummaryStream(
    @Body() request: SmartSummaryRequestDto,
    @Res() response: Response
  ) {
    this.logger.log(`收到流式智能总结请求: ${JSON.stringify(request)}`);
    
    if (!request.relativeTime && !request.specificDate) {
      response.status(400).json({
        success: false,
        error: '必须提供relativeTime或specificDate参数'
      });
      return;
    }

    return await this.wechatSummaryService.smartSummaryStream(request, response);
  }

  @Get('groups')
  @Public()
  @ApiOperation({ 
    summary: '获取群聊列表',
    description: '获取可用的微信群聊列表，支持关键词搜索，默认返回JSON格式' 
  })
  @ApiQuery({ 
    name: 'keyword', 
    required: false, 
    description: '搜索关键词，留空或使用"+"获取所有群聊',
    example: '工作'
  })
  @ApiQuery({ 
    name: 'format', 
    required: false, 
    description: '返回格式',
    enum: ['json', 'csv', 'text'],
    example: 'json'
  })
  @ApiResponse({ 
    status: 200, 
    description: '获取群聊列表成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: '群聊ID' },
              name: { type: 'string', description: '群聊名称' },
              memberCount: { type: 'number', description: '成员数量' },
              description: { type: 'string', description: '群聊描述' }
            }
          }
        }
      }
    }
  })
  async getGroupList(
    @Query('keyword') keyword?: string,
    @Query('format') format: 'json' | 'csv' | 'text' = 'json'
  ) {
    this.logger.log(`获取群聊列表，关键词: ${keyword || '无'}, 格式: ${format}`);
    return await this.wechatSummaryService.getGroupList(keyword, format);
  }

  @Get('health')
  @Public()
  @ApiOperation({ 
    summary: '健康检查',
    description: '检查微信总结服务的健康状态' 
  })
  @ApiResponse({ 
    status: 200, 
    description: '服务健康',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        services: {
          type: 'object',
          properties: {
            ollama: { type: 'boolean', description: 'Ollama服务状态' },
            mcp: { type: 'boolean', description: 'MCP服务状态' }
          }
        }
      }
    }
  })
  async healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        ollama: true, // 这里可以添加实际的健康检查逻辑
        mcp: true
      }
    };
  }

  @Post('batch-analysis')
  @Public()
  @ApiOperation({ 
    summary: '批量群聊分析',
    description: '同时分析多个群聊的聊天记录' 
  })
  @ApiBody({ type: BatchAnalysisRequestDto })
  @ApiResponse({ status: 200, description: '批量分析成功' })
  async batchAnalysis(@Body() request: BatchAnalysisRequestDto) {
    this.logger.log(`收到批量分析请求: ${JSON.stringify(request)}`);
    return await this.wechatSummaryService.batchAnalysis(request);
  }

  @Post('comparison-analysis')
  @Public()
  @ApiOperation({ 
    summary: '群聊对比分析',
    description: '对比分析两个群聊的差异和特点' 
  })
  @ApiBody({ type: ComparisonAnalysisRequestDto })
  @ApiResponse({ status: 200, description: '对比分析成功' })
  async comparisonAnalysis(@Body() request: ComparisonAnalysisRequestDto) {
    this.logger.log(`收到对比分析请求: ${JSON.stringify(request)}`);
    return await this.wechatSummaryService.comparisonAnalysis(request);
  }

  @Get('trending-topics')
  @ApiOperation({ 
    summary: '获取热门话题',
    description: '分析最近的热门讨论话题' 
  })
  @ApiQuery({ name: 'days', required: false, description: '分析天数', example: 7 })
  @ApiQuery({ name: 'groupName', required: false, description: '指定群聊' })
  @ApiResponse({ status: 200, description: '获取热门话题成功' })
  async getTrendingTopics(
    @Query('days') days: number = 7,
    @Query('groupName') groupName?: string
  ) {
    this.logger.log(`获取热门话题，天数: ${days}, 群聊: ${groupName || '全部'}`);
    return await this.wechatSummaryService.getTrendingTopics(days, groupName);
  }

  @Get('activity-stats')
  @ApiOperation({ 
    summary: '获取活跃度统计',
    description: '获取群聊活跃度统计数据' 
  })
  @ApiQuery({ name: 'timeRange', required: false, description: '时间范围' })
  @ApiQuery({ name: 'groupName', required: false, description: '群聊名称' })
  @ApiResponse({ status: 200, description: '获取统计数据成功' })
  async getActivityStats(
    @Query('timeRange') timeRange?: string,
    @Query('groupName') groupName?: string
  ) {
    this.logger.log(`获取活跃度统计，时间: ${timeRange || '默认'}, 群聊: ${groupName || '全部'}`);
    return await this.wechatSummaryService.getActivityStats(timeRange, groupName);
  }

  @Post('export-summary')
  @ApiOperation({ 
    summary: '导出总结报告',
    description: '导出详细的分析报告（支持多种格式）' 
  })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        summaryId: { type: 'string', description: '总结ID' },
        format: { type: 'string', enum: ['json', 'markdown', 'pdf'], description: '导出格式' }
      }
    }
  })
  @Public()
  @ApiResponse({ status: 200, description: '导出成功' })
  async exportSummary(@Body() request: { summaryId: string; format: 'json' | 'markdown' | 'pdf' }) {
    this.logger.log(`导出总结报告: ${JSON.stringify(request)}`);
    return await this.wechatSummaryService.exportSummary(request.summaryId, request.format);
  }

  @Post('langchain-summary')
  @Public()
  @ApiOperation({ 
    summary: 'LangChain智能总结',
    description: '使用LangChain和优化的提示词进行智能聊天记录分析，包含数据预处理和优化' 
  })
  @ApiBody({ 
    type: SmartSummaryRequestDto,
    description: 'LangChain总结请求参数'
  })
  @ApiResponse({ status: 200, description: 'LangChain总结成功' })
  async langchainSummary(@Body() request: SmartSummaryRequestDto) {
    this.logger.log(`收到LangChain总结请求: ${JSON.stringify(request)}`);
    
    try {
      // 1. 获取聊天数据
      const chatData = await this.wechatSummaryService.getChatData(request);
      
      if (!chatData.success || !chatData.data || chatData.data.length === 0) {
        return {
          success: false,
          error: '未找到聊天数据或数据为空'
        };
      }

      // 2. 使用LangChain进行分析
      const result = await this.langChainService.analyzeChatLog({
        messages: chatData.data,
        summaryType: request.summaryType || 'daily',
        groupName: request.groupName,
        timeRange: request.relativeTime,
        specificDate: request.specificDate,
        customPrompt: request.customPrompt
      });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      this.logger.error(`LangChain总结失败: ${error.message}`, error.stack);
      return {
        success: false,
        error: `LangChain总结失败: ${error.message}`
      };
    }
  }

  @Post('langchain-summary-stream')
  @Public()
  @ApiOperation({ 
    summary: 'LangChain流式智能总结',
    description: '使用LangChain进行流式聊天记录分析，提供实时处理反馈和优化的数据处理' 
  })
  @ApiBody({ 
    type: SmartSummaryRequestDto,
    description: 'LangChain流式总结请求参数'
  })
  @ApiResponse({ status: 200, description: 'LangChain流式总结成功' })
  async langchainSummaryStream(
    @Body() request: SmartSummaryRequestDto,
    @Res() response: Response
  ) {
    this.logger.log(`收到LangChain流式总结请求: ${JSON.stringify(request)}`);
    
    try {
      // 1. 构建缓存请求
      const cacheRequest = {
        groupName: request.groupName || '',
        timeRange: request.specificDate || (request.relativeTime || 'today'),
        summaryType: request.summaryType || 'daily',
        specificDate: request.specificDate,
        relativeTime: request.relativeTime,
      };

      // 2. 获取缓存服务实例
      const summaryCacheService = this.wechatSummaryService.getSummaryCacheService();
      
      // 3. 检查是否应该使用缓存（非今天的数据）
      if (summaryCacheService && summaryCacheService.shouldCacheResult(cacheRequest)) {
        // 尝试从缓存中获取结果
        const cachedResult = await summaryCacheService.getCachedSummary(cacheRequest);
        
        if (cachedResult) {
          this.logger.log(`找到缓存结果，直接返回: ${cachedResult.id}`);
          
          // 设置响应头
          response.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
          });
          
          // 模拟流式返回缓存结果
          response.write('🔄 从缓存获取分析结果...\n');
          response.write('✅ 缓存命中，快速返回结果\n\n');
          
          // 构建返回格式
          const formattedResult = {
            summary_title: cachedResult.title,
            style_comment: `缓存结果 - ${cachedResult.summaryType}分析`,
            message_length: cachedResult.messageCount,
            topics: cachedResult.keyPoints.map((point, index) => ({
              title: `${index + 1}️⃣ ${point}`,
              participants: cachedResult.participants.slice(0, 3),
              time_range: cachedResult.timeRange,
              process: `缓存的分析结果 - ${point}`,
              comment: '来自历史分析缓存'
            })),
            extra_topics: cachedResult.topics,
            top_speakers: cachedResult.participants,
            cached: true,
            cacheId: cachedResult.id,
            cachedAt: cachedResult.createdAt,
          };

          // 分块发送结果
          const resultText = JSON.stringify(formattedResult, null, 2);
          const chunks = resultText.match(/.{1,100}/g) || [resultText];
          
          for (const chunk of chunks) {
            response.write(chunk);
            await new Promise(resolve => setTimeout(resolve, 20)); // 模拟延迟
          }

          response.write('\n\n=== 缓存结果 ===\n');
          response.write(JSON.stringify(formattedResult, null, 2));
          response.end();
          return;
        }
        
        this.logger.log('缓存未命中，执行实时分析');
      }

      // 4. 获取聊天数据
      const chatData = await this.wechatSummaryService.getChatData(request);
      
      if (!chatData.success || !chatData.data || chatData.data.length === 0) {
        response.status(400).json({
          success: false,
          error: '未找到聊天数据或数据为空'
        });
        return;
      }

      // 5. 设置流式响应头
      response.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      // 6. 使用LangChain进行流式分析
      let fullResponse = '';

      const result = await this.langChainService.analyzeChatLogStream({
        messages: chatData.data,
        summaryType: request.summaryType || 'daily',
        groupName: request.groupName,
        timeRange: request.relativeTime,
        specificDate: request.specificDate,
        customPrompt: request.customPrompt
      }, (chunk: string) => {
        fullResponse += chunk;
        response.write(chunk);
      });

      // 7. 发送最终结果
      response.write('\n\n=== 最终结果 ===\n');
      response.write(JSON.stringify(result, null, 2));

      // 8. 保存到知识库（异步执行，不阻塞响应）
      if (summaryCacheService && summaryCacheService.shouldCacheResult(cacheRequest)) {
        response.write('\n\n💾 正在保存分析结果到知识库...');
        
        // 异步保存到缓存（不阻塞响应）
        summaryCacheService.saveSummaryToCache(
          cacheRequest,
          result,
          chatData.data.length,
        ).then(() => {
          this.logger.log('分析结果已成功保存到知识库');
        }).catch(error => {
          this.logger.error(`保存到知识库失败: ${error.message}`);
        });
      } else {
        this.logger.log('当前结果不需要缓存（今天的数据或其他原因）');
      }

      response.end();

    } catch (error) {
      this.logger.error(`LangChain流式总结失败: ${error.message}`, error.stack);
      if (!response.headersSent) {
        response.status(500).json({
          success: false,
          error: `LangChain流式总结失败: ${error.message}`
        });
      } else {
        response.write(`\n\n❌ 错误: ${error.message}`);
        response.end();
      }
    }
  }

  /**
   * 专业群聊分析接口 - 参考外部分析服务设计
   */
  @Post('analyze-group-chat')
  async analyzeGroupChat(
    @Body() body: { talker: string; time: string },
    @Res() response: Response,
  ) {
    try {
      this.logger.log(`🔍 专业群聊分析请求: ${JSON.stringify(body)}`);

      const { talker, time } = body;

      if (!talker || !time) {
        return response.status(400).json({
          success: false,
          error: '参数错误：talker和time为必填项',
          code: 'INVALID_PARAMS'
        });
      }

      // 构建分析请求
      const analysisRequest = {
        groupName: talker,
        specificDate: time,
        summaryType: 'daily',
        customPrompt: '进行专业的群聊日报分析，按照参考格式输出，包含详细的话题分析、开始结束消息、文章链接、工具推荐等信息'
      };

      // 调用LangChain智能分析
      const result = await this.langChainService.analyzeChatLog({
        messages: [], // 这里需要从chatlog获取消息
        ...analysisRequest
      });

      // 但首先我们需要获取聊天数据
      const chatDataResponse = await this.wechatSummaryService.getChatData({
        groupName: talker,
        specificDate: time
      });

      if (!chatDataResponse.success || !chatDataResponse.data || chatDataResponse.data.length === 0) {
        return response.status(404).json({
          success: false,
          error: '未找到指定日期的聊天记录',
          code: 'NO_DATA_FOUND',
          details: {
            talker,
            time,
            messageCount: 0
          }
        });
      }

      const chatData = chatDataResponse.data;

      // 重新调用分析
      const analysisResult = await this.langChainService.analyzeChatLog({
        messages: chatData,
        ...analysisRequest
      });

      // 返回专业分析结果
      return response.status(200).json({
        success: true,
        data: {
          ...analysisResult,
          metadata: {
            talker,
            time,
            messageCount: chatData.length,
            analysisTime: new Date().toISOString(),
            version: '2.0'
          }
        }
      });

    } catch (error) {
      this.logger.error(`专业群聊分析失败: ${error.message}`, error.stack);
      return response.status(500).json({
        success: false,
        error: '分析服务暂时不可用',
        code: 'ANALYSIS_SERVICE_ERROR',
        details: error.message
      });
    }
  }

  /**
   * 专业群聊分析接口 - 流式版本
   */
  @Post('analyze-group-chat-stream')
  async analyzeGroupChatStream(
    @Body() body: { talker: string; time: string },
    @Res() response: Response,
  ) {
    try {
      this.logger.log(`🔍 专业群聊流式分析请求: ${JSON.stringify(body)}`);

      const { talker, time } = body;

      if (!talker || !time) {
        response.writeHead(400, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({
          success: false,
          error: '参数错误：talker和time为必填项'
        }));
        return;
      }

      // 设置流式响应头
      response.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });

      // 获取聊天数据
      response.write('🔍 正在获取聊天数据...\n');
      const chatDataResponse = await this.wechatSummaryService.getChatData({
        groupName: talker,
        specificDate: time
      });

      if (!chatDataResponse.success || !chatDataResponse.data || chatDataResponse.data.length === 0) {
        response.write('❌ 未找到指定日期的聊天记录\n');
        response.end();
        return;
      }

      const chatData = chatDataResponse.data;
      response.write(`📊 找到 ${chatData.length} 条消息，开始专业分析...\n`);

      // 构建分析请求
      const analysisRequest = {
        messages: chatData,
        groupName: talker,
        specificDate: time,
        summaryType: 'daily',
        customPrompt: '进行专业的群聊日报分析，按照参考格式输出，包含详细的话题分析、开始结束消息、文章链接、工具推荐等信息'
      };

      // 流式分析
      const result = await this.langChainService.analyzeChatLogStream(
        analysisRequest,
        (chunk: string) => {
          response.write(chunk);
        }
      );

      response.write('\n\n=== 专业分析报告 ===\n');
      response.write(JSON.stringify({
        success: true,
        data: {
          ...result,
          metadata: {
            talker,
            time,
            messageCount: chatData.length,
            analysisTime: new Date().toISOString(),
            version: '2.0'
          }
        }
      }, null, 2));

      response.end();

    } catch (error) {
      this.logger.error(`专业群聊流式分析失败: ${error.message}`, error.stack);
      response.write(`\n❌ 分析失败: ${error.message}\n`);
      response.end();
    }
  }

  /**
   * 增强版LangChain总结 - 支持无限上下文和向量知识库
   */
  @Post('enhanced-summary')
  @Public()
  @ApiOperation({ 
    summary: '增强版智能总结',
    description: '使用pgvector和无限上下文的聊天记录分析' 
  })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        groupName: { type: 'string', description: '群聊名称' },
        relativeTime: { 
          type: 'string', 
          enum: ['today', 'yesterday', 'thisWeek', 'lastWeek', 'thisMonth', 'lastMonth'],
          description: '相对时间范围' 
        },
        specificDate: { type: 'string', description: '指定日期 (YYYY-MM-DD)' },
        summaryType: { 
          type: 'string', 
          enum: ['daily', 'sentiment_analysis', 'topic', 'participant', 'timeline', 'activity_analysis', 'keyword_extraction', 'style_analysis'],
          default: 'daily',
          description: '分析类型' 
        },
        customPrompt: { type: 'string', description: '自定义分析提示词' },
        useInfiniteContext: { type: 'boolean', default: true, description: '启用无限上下文' },
        contextWindowType: { 
          type: 'string', 
          enum: ['sliding', 'semantic', 'hybrid'],
          default: 'hybrid',
          description: '上下文窗口类型' 
        },
        maxContextTokens: { type: 'number', default: 16000, description: '最大上下文token数' },
        useKnowledgeBase: { type: 'boolean', default: true, description: '启用向量知识库' },
        knowledgeNamespaces: { 
          type: 'array', 
          items: { type: 'string' },
          default: ['summaries', 'chat_history', 'topics'],
          description: '知识库命名空间' 
        }
      },
      required: ['groupName']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: '增强版总结成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            keyPoints: { type: 'array', items: { type: 'string' } },
            participants: { type: 'array', items: { type: 'string' } },
            topics: { type: 'array', items: { type: 'string' } },
            relatedKnowledge: { type: 'array' },
            contextUsed: {
              type: 'object',
              properties: {
                tokenCount: { type: 'number' },
                messageCount: { type: 'number' },
                relevanceScore: { type: 'number' },
                windowType: { type: 'string' }
              }
            },
            metadata: {
              type: 'object',
              properties: {
                processingTime: { type: 'number' },
                vectorSearchResults: { type: 'number' },
                knowledgeBaseHits: { type: 'number' },
                originalMessageCount: { type: 'number' },
                optimizedMessageCount: { type: 'number' }
              }
            }
          }
        }
      }
    }
  })
  async enhancedSummary(@Body() request: any): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    this.logger.log(`收到增强版总结请求: ${JSON.stringify(request)}`);
    
    try {
      // 1. 获取聊天数据
      const chatData = await this.wechatSummaryService.getChatData(request);
      
      if (!chatData.success || !chatData.data || chatData.data.length === 0) {
        return {
          success: false,
          error: '未找到聊天数据或数据为空'
        };
      }

      // 2. 执行增强版分析
      const result = await this.enhancedLangChainService.enhancedAnalyzeChatLog({
        messages: chatData.data,
        summaryType: request.summaryType || 'daily',
        groupName: request.groupName,
        timeRange: request.relativeTime,
        specificDate: request.specificDate,
        customPrompt: request.customPrompt,
        useInfiniteContext: request.useInfiniteContext !== false,
        contextWindowType: request.contextWindowType || 'hybrid',
        maxContextTokens: request.maxContextTokens || 16000,
        useKnowledgeBase: request.useKnowledgeBase !== false,
        knowledgeNamespaces: request.knowledgeNamespaces || ['summaries', 'chat_history', 'topics']
      });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      this.logger.error(`增强版总结失败: ${error.message}`, error.stack);
      return {
        success: false,
        error: `增强版总结失败: ${error.message}`
      };
    }
  }

  /**
   * 增强版LangChain流式总结
   */
  @Post('enhanced-summary-stream')
  @Public()
  @ApiOperation({ 
    summary: '增强版流式智能总结',
    description: '使用pgvector和无限上下文的流式分析，实时显示处理进度和结果' 
  })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        groupName: { type: 'string', description: '群聊名称' },
        relativeTime: { 
          type: 'string', 
          enum: ['today', 'yesterday', 'thisWeek', 'lastWeek', 'thisMonth', 'lastMonth'],
          description: '相对时间范围' 
        },
        specificDate: { type: 'string', description: '指定日期 (YYYY-MM-DD)' },
        summaryType: { 
          type: 'string', 
          enum: ['daily', 'sentiment_analysis', 'topic', 'participant', 'timeline', 'activity_analysis', 'keyword_extraction', 'style_analysis'],
          default: 'daily',
          description: '分析类型' 
        },
        customPrompt: { type: 'string', description: '自定义分析提示词' },
        useInfiniteContext: { type: 'boolean', default: true, description: '启用无限上下文' },
        contextWindowType: { 
          type: 'string', 
          enum: ['sliding', 'semantic', 'hybrid'],
          default: 'hybrid',
          description: '上下文窗口类型' 
        },
        maxContextTokens: { type: 'number', default: 16000, description: '最大上下文token数' },
        useKnowledgeBase: { type: 'boolean', default: true, description: '启用向量知识库' },
        knowledgeNamespaces: { 
          type: 'array', 
          items: { type: 'string' },
          default: ['summaries', 'chat_history', 'topics'],
          description: '知识库命名空间' 
        }
      },
      required: ['groupName']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: '增强版流式总结成功',
    headers: {
      'Content-Type': {
        description: 'text/plain; charset=utf-8',
        schema: { type: 'string' }
      },
      'Transfer-Encoding': {
        description: 'chunked',
        schema: { type: 'string' }
      }
    }
  })
  async enhancedSummaryStream(
    @Body() request: any,
    @Res() response: Response
  ) {
    this.logger.log(`收到增强版流式总结请求: ${JSON.stringify(request)}`);
    
    try {
      // 1. 获取聊天数据
      const chatData = await this.wechatSummaryService.getChatData(request);
      
      if (!chatData.success || !chatData.data || chatData.data.length === 0) {
        response.status(400).json({
          success: false,
          error: '未找到聊天数据或数据为空'
        });
        return;
      }

      // 2. 设置流式响应头
      response.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      // 3. 执行增强版流式分析
      const result = await this.enhancedLangChainService.enhancedAnalyzeChatLogStream({
        messages: chatData.data,
        summaryType: request.summaryType || 'daily',
        groupName: request.groupName,
        timeRange: request.relativeTime,
        specificDate: request.specificDate,
        customPrompt: request.customPrompt,
        useInfiniteContext: request.useInfiniteContext !== false,
        contextWindowType: request.contextWindowType || 'hybrid',
        maxContextTokens: request.maxContextTokens || 16000,
        useKnowledgeBase: request.useKnowledgeBase !== false,
        knowledgeNamespaces: request.knowledgeNamespaces || ['summaries', 'chat_history', 'topics']
      }, (chunk: string) => {
        response.write(chunk);
      });

      // 4. 发送最终结果
      response.write('\n\n=== 增强版分析结果 ===\n');
      response.write(JSON.stringify(result, null, 2));
      response.end();

    } catch (error) {
      this.logger.error(`增强版流式总结失败: ${error.message}`, error.stack);
      if (!response.headersSent) {
        response.status(500).json({
          success: false,
          error: `增强版流式总结失败: ${error.message}`
        });
      } else {
        response.write(`\n\n❌ 错误: ${error.message}`);
        response.end();
      }
    }
  }

  /**
   * 向量搜索API
   */
  @Post('vector-search')
  @Public()
  @ApiOperation({ 
    summary: '向量语义搜索',
    description: '在聊天记录和知识库中进行语义搜索' 
  })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '搜索查询' },
        groupName: { type: 'string', description: '群聊名称（可选）' },
        namespace: { type: 'string', description: '知识库命名空间（可选）' },
        limit: { type: 'number', default: 10, description: '返回结果数量' },
        threshold: { type: 'number', default: 0.7, description: '相似度阈值' },
        timeRange: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date-time' },
            end: { type: 'string', format: 'date-time' }
          },
          description: '时间范围（可选）'
        }
      },
      required: ['query']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: '搜索成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              content: { type: 'string' },
              similarity: { type: 'number' },
              metadata: { type: 'object' },
              source: { type: 'string' }
            }
          }
        }
      }
    }
  })
  async vectorSearch(@Body() request: any) {
    this.logger.log(`收到向量搜索请求: ${JSON.stringify(request)}`);
    
    try {
      const timeRange = request.timeRange ? {
        start: new Date(request.timeRange.start),
        end: new Date(request.timeRange.end)
      } : undefined;

      const results = await this.vectorService.semanticSearch(request.query, {
        groupName: request.groupName,
        namespace: request.namespace,
        limit: request.limit || 10,
        threshold: request.threshold || 0.7,
        timeRange
      });

      return {
        success: true,
        data: results
      };
    } catch (error) {
      this.logger.error(`向量搜索失败: ${error.message}`, error.stack);
      return {
        success: false,
        error: `向量搜索失败: ${error.message}`
      };
    }
  }

  /**
   * 知识库搜索API
   */
  @Post('knowledge-search')
  @Public()
  @ApiOperation({ 
    summary: '知识库搜索',
    description: '在向量知识库中搜索相关信息' 
  })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '搜索查询' },
        namespace: { type: 'string', description: '知识库命名空间（可选）' },
        tags: { type: 'array', items: { type: 'string' }, description: '标签过滤（可选）' },
        limit: { type: 'number', default: 10, description: '返回结果数量' },
        threshold: { type: 'number', default: 0.7, description: '相似度阈值' }
      },
      required: ['query']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: '搜索成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              content: { type: 'string' },
              similarity: { type: 'number' },
              metadata: { type: 'object' }
            }
          }
        }
      }
    }
  })
  async knowledgeSearch(@Body() request: any) {
    this.logger.log(`收到知识库搜索请求: ${JSON.stringify(request)}`);
    
    try {
      const results = await this.vectorService.searchKnowledge(request.query, {
        namespace: request.namespace,
        tags: request.tags,
        limit: request.limit || 10,
        threshold: request.threshold || 0.7
      });

      return {
        success: true,
        data: results
      };
    } catch (error) {
      this.logger.error(`知识库搜索失败: ${error.message}`, error.stack);
      return {
        success: false,
        error: `知识库搜索失败: ${error.message}`
      };
    }
  }

  /**
   * 构建上下文窗口API
   */
  @Post('build-context')
  @Public()
  @ApiOperation({ 
    summary: '构建无限上下文窗口',
    description: '为指定查询构建智能上下文窗口' 
  })
  @ApiBody({ 
    schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '查询内容' },
        groupName: { type: 'string', description: '群聊名称' },
        maxTokens: { type: 'number', default: 8000, description: '最大token数' },
        windowType: { 
          type: 'string', 
          enum: ['sliding', 'semantic', 'hybrid'],
          default: 'hybrid',
          description: '窗口类型' 
        },
        timeRange: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date-time' },
            end: { type: 'string', format: 'date-time' }
          },
          description: '时间范围（可选）'
        }
      },
      required: ['query', 'groupName']
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: '上下文构建成功',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            messages: { type: 'array' },
            relevanceScore: { type: 'number' },
            tokenCount: { type: 'number' }
          }
        }
      }
    }
  })
  async buildContext(@Body() request: any) {
    this.logger.log(`收到构建上下文请求: ${JSON.stringify(request)}`);
    
    try {
      const timeRange = request.timeRange ? {
        start: new Date(request.timeRange.start),
        end: new Date(request.timeRange.end)
      } : undefined;

      const contextWindow = await this.vectorService.buildInfiniteContext(
        request.query,
        request.groupName,
        {
          maxTokens: request.maxTokens || 8000,
          windowType: request.windowType || 'hybrid',
          timeRange
        }
      );

      return {
        success: true,
        data: contextWindow
      };
    } catch (error) {
      this.logger.error(`构建上下文失败: ${error.message}`, error.stack);
      return {
        success: false,
        error: `构建上下文失败: ${error.message}`
      };
    }
  }

  /**
   * 获取聊天数据（带昵称信息）
   */
  @Post('chat-data')
  async getChatData(@Body() request: {
    groupName?: string;
    relativeTime?: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'lastQuarter';
    specificDate?: string;
  }) {
    return await this.wechatSummaryService.getChatData(request);
  }

  /**
   * 获取缓存统计信息
   */
  @Get('cache-stats')
  @ApiOperation({ summary: '获取分析结果缓存统计' })
  @ApiResponse({ status: 200, description: '缓存统计信息' })
  async getCacheStats() {
    return await this.wechatSummaryService.getCacheStats();
  }

  /**
   * 清理过期缓存
   */
  @Post('cache-cleanup')
  @ApiOperation({ summary: '清理过期缓存' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        daysToKeep: { type: 'number', description: '保留天数', default: 90 }
      }
    }
  })
  async cleanupCache(@Body() body: { daysToKeep?: number }) {
    return await this.wechatSummaryService.cleanupCache(body.daysToKeep);
  }
} 