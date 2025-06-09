import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ChatService } from '../services/chat.service';
import { PromptOptimizationService } from '../services/prompt-optimization.service';
import { MoonshotService } from '../services/moonshot.service';
import { KnowledgeBaseService } from '../services/knowledge-base.service';
import {
  SendMessageDto,
  OptimizePromptDto,
  CreateSessionDto,
  UpdateSessionDto,
  AnalyzePromptDto,
  BatchOptimizeDto,
  SetPreferencesDto,
} from '../dto/chat.dto';

@ApiTags('AI助手')
@Controller('/api/ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(
    private readonly chatService: ChatService,
    private readonly promptOptimizationService: PromptOptimizationService,
    private readonly moonshotService: MoonshotService,
    private readonly knowledgeBaseService: KnowledgeBaseService,
  ) {}

  @Post('chat')
  @ApiOperation({ summary: '发送聊天消息' })
  @ApiResponse({ status: HttpStatus.OK, description: '聊天成功' })
  async sendMessage(
    @Request() req: any,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    const userId = req.user.userId;
    return await this.chatService.sendMessage(
      userId,
      sendMessageDto.message,
      sendMessageDto.sessionId,
      sendMessageDto.context,
    );
  }

  @Post('optimize')
  @ApiOperation({ summary: '优化提示词' })
  @ApiResponse({ status: HttpStatus.OK, description: '优化成功' })
  async optimizePrompt(@Body() optimizePromptDto: OptimizePromptDto) {
    return await this.promptOptimizationService.optimizePrompt(
      optimizePromptDto,
    );
  }

  @Post('analyze')
  @ApiOperation({ summary: '分析提示词质量' })
  @ApiResponse({ status: HttpStatus.OK, description: '分析成功' })
  async analyzePrompt(@Body() analyzePromptDto: AnalyzePromptDto) {
    return this.promptOptimizationService.analyzePrompt(
      analyzePromptDto.prompt,
    );
  }

  @Post('batch-optimize')
  @ApiOperation({ summary: '批量优化提示词' })
  @ApiResponse({ status: HttpStatus.OK, description: '批量优化成功' })
  async batchOptimize(@Body() batchOptimizeDto: BatchOptimizeDto) {
    return await this.promptOptimizationService.batchOptimize(
      batchOptimizeDto.prompts,
      batchOptimizeDto.optimizationType,
      batchOptimizeDto.domain,
    );
  }

  @Post('sessions')
  @ApiOperation({ summary: '创建新会话' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '会话创建成功' })
  async createSession(
    @Request() req: any,
    @Body() createSessionDto: CreateSessionDto,
  ) {
    const userId = req.user.userId;
    return await this.chatService.createSession(
      userId,
      createSessionDto.title,
      createSessionDto.initialMessage,
    );
  }

  @Get('sessions')
  @ApiOperation({ summary: '获取用户所有会话' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  async getUserSessions(@Request() req: any) {
    const userId = req.user.userId;
    return await this.chatService.getUserSessions(userId);
  }

  @Get('sessions/:sessionId')
  @ApiOperation({ summary: '获取指定会话详情' })
  @ApiParam({ name: 'sessionId', description: '会话ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  async getSession(@Param('sessionId') sessionId: string) {
    return await this.chatService.getSession(sessionId);
  }

  @Put('sessions/:sessionId')
  @ApiOperation({ summary: '更新会话信息' })
  @ApiParam({ name: 'sessionId', description: '会话ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '更新成功' })
  async updateSession(
    @Param('sessionId') sessionId: string,
    @Body() updateSessionDto: UpdateSessionDto,
  ) {
    return await this.chatService.updateSession(sessionId, updateSessionDto);
  }

  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: '删除会话' })
  @ApiParam({ name: 'sessionId', description: '会话ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '删除成功' })
  async deleteSession(@Param('sessionId') sessionId: string) {
    await this.chatService.deleteSession(sessionId);
    return { deleted: true };
  }

  @Delete('sessions')
  @ApiOperation({ summary: '清空用户所有会话' })
  @ApiResponse({ status: HttpStatus.OK, description: '清空成功' })
  async clearUserSessions(@Request() req: any) {
    const userId = req.user.userId;
    await this.chatService.clearUserSessions(userId);
    return { cleared: true };
  }

  @Post('preferences')
  @ApiOperation({ summary: '设置用户偏好' })
  @ApiResponse({ status: HttpStatus.OK, description: '设置成功' })
  async setPreferences(
    @Request() req: any,
    @Body() setPreferencesDto: SetPreferencesDto,
  ) {
    const userId = req.user.userId;
    await this.chatService.setUserPreferences(userId, setPreferencesDto);
    return { updated: true };
  }

  @Get('preferences')
  @ApiOperation({ summary: '获取用户偏好' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  async getPreferences(@Request() req: any) {
    const userId = req.user.userId;
    return await this.chatService.getUserPreferences(userId);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取用户使用统计' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  async getStats(@Request() req: any) {
    const userId = req.user.userId;
    return await this.chatService.getSessionStats(userId);
  }

  @Get('models')
  @ApiOperation({ summary: '获取可用AI模型列表' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  async getModels() {
    return await this.moonshotService.getModels();
  }

  @Get('health')
  @ApiOperation({ summary: '检查AI服务健康状态' })
  @ApiResponse({ status: HttpStatus.OK, description: '服务正常' })
  async checkHealth() {
    const isHealthy = await this.moonshotService.validateApiKey();
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date(),
    };
  }

  @Get('templates')
  @ApiOperation({ summary: '获取提示词模板' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  async getTemplates() {
    return {
      basic: {
        name: '基础模板',
        template: '你是一个专业的{role}，请{task}。要求：{requirements}',
        variables: ['role', 'task', 'requirements'],
      },
      rolePlay: {
        name: '角色扮演模板',
        template:
          '你是{role}，具有{expertise}的专业知识。现在需要你{task}。请以{tone}的语调回答，并确保{quality_requirements}。',
        variables: [
          'role',
          'expertise',
          'task',
          'tone',
          'quality_requirements',
        ],
      },
      fewShot: {
        name: 'Few-shot学习模板',
        template:
          '以下是一些{task}的示例：\n\n{examples}\n\n现在请按照相同的格式和质量标准{new_task}：',
        variables: ['task', 'examples', 'new_task'],
      },
      chainOfThought: {
        name: '思维链模板',
        template:
          '请按照以下步骤思考并解决问题：\n1. 理解问题：{problem}\n2. 分析要素：{analysis}\n3. 制定方案：{solution}\n4. 验证结果：{validation}\n\n请详细说明每个步骤的思考过程。',
        variables: ['problem', 'analysis', 'solution', 'validation'],
      },
      domainSpecific: {
        name: '领域专业模板',
        template:
          '作为{domain}领域的专家，请基于{context}，运用{methodology}方法，为{target_audience}提供{deliverable}。请确保内容{quality_criteria}。',
        variables: [
          'domain',
          'context',
          'methodology',
          'target_audience',
          'deliverable',
          'quality_criteria',
        ],
      },
    };
  }

  @Get('knowledge')
  @ApiOperation({ summary: '获取所有知识库条目' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  async getAllKnowledge() {
    return await this.knowledgeBaseService.getAllKnowledge();
  }

  @Get('knowledge/search')
  @ApiOperation({ summary: '搜索知识库' })
  @ApiQuery({ name: 'q', description: '搜索关键词' })
  @ApiResponse({ status: HttpStatus.OK, description: '搜索成功' })
  async searchKnowledge(@Query('q') query: string) {
    return await this.knowledgeBaseService.searchKnowledge(query);
  }

  @Get('knowledge/stats')
  @ApiOperation({ summary: '获取知识库统计信息' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  async getKnowledgeStats() {
    return await this.knowledgeBaseService.getStatistics();
  }

  @Get('knowledge/:id')
  @ApiOperation({ summary: '获取指定知识条目' })
  @ApiParam({ name: 'id', description: '知识条目ID' })
  @ApiResponse({ status: HttpStatus.OK, description: '获取成功' })
  async getKnowledge(@Param('id') id: string) {
    return await this.knowledgeBaseService.getKnowledge(id);
  }
}
