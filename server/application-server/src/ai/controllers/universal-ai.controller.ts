import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { LangChainAIProviderService } from '../services/langchain-ai-provider.service';
import { UniversalAIService, ModelProvider } from '../services/universal-ai.service';
import { ChatMessage } from '../interfaces/ai.interface';

interface ChatRequest {
  messages: ChatMessage[];
  provider?: ModelProvider;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  fastMode?: boolean;
  useAnalysisModel?: boolean;
}

interface CompletionRequest {
  prompt: string;
  provider?: ModelProvider;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  fastMode?: boolean;
  useAnalysisModel?: boolean;
}

interface BatchRequest {
  prompts: string[];
  provider?: ModelProvider;
  maxConcurrency?: number;
  temperature?: number;
  maxTokens?: number;
}

@Controller('ai/universal')
export class UniversalAIController {
  private readonly logger = new Logger(UniversalAIController.name);

  constructor(
    private readonly langchainAI: LangChainAIProviderService,
    private readonly universalAI: UniversalAIService,
  ) {}

  /**
   * 对话接口 - 支持多种模型提供商
   */
  @Post('chat')
  async chat(@Body() request: ChatRequest) {
    try {
      this.logger.log('开始AI对话', { provider: request.provider, modelName: request.modelName });

      const response = await this.langchainAI.chat(request.messages, {
        provider: request.provider,
        modelName: request.modelName,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        systemPrompt: request.systemPrompt,
        fastMode: request.fastMode,
        useAnalysisModel: request.useAnalysisModel,
      });

      this.logger.log('AI对话完成', { 
        processingTime: response.processingTime,
        provider: response.provider,
        model: response.model
      });

      return {
        success: true,
        data: response,
        meta: {
          totalMessages: request.messages.length,
          provider: response.provider,
          model: response.model,
        },
      };
    } catch (error) {
      this.logger.error('AI对话失败', error.stack);
      throw new HttpException(
        {
          success: false,
          message: '对话失败',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 文本生成接口
   */
  @Post('completion')
  async completion(@Body() request: CompletionRequest) {
    try {
      this.logger.log('开始文本生成', { provider: request.provider });

      const result = await this.langchainAI.generateCompletion(request.prompt, {
        provider: request.provider,
        modelName: request.modelName,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        systemPrompt: request.systemPrompt,
        fastMode: request.fastMode,
        useAnalysisModel: request.useAnalysisModel,
      });

      return {
        success: true,
        data: {
          result,
          originalPrompt: request.prompt,
        },
      };
    } catch (error) {
      this.logger.error('文本生成失败', error.stack);
      throw new HttpException(
        {
          success: false,
          message: '文本生成失败',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 批量处理接口
   */
  @Post('batch')
  async batchProcess(@Body() request: BatchRequest) {
    try {
      this.logger.log('开始批量处理', { 
        promptCount: request.prompts.length,
        provider: request.provider 
      });

      const startTime = Date.now();
      const results = await this.langchainAI.batchProcess(request.prompts, {
        provider: request.provider,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
      });
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          results,
          statistics: {
            totalPrompts: request.prompts.length,
            successCount: results.filter(r => !r.startsWith('处理失败')).length,
            failureCount: results.filter(r => r.startsWith('处理失败')).length,
            processingTime,
            averageTimePerPrompt: Math.round(processingTime / request.prompts.length),
          },
        },
      };
    } catch (error) {
      this.logger.error('批量处理失败', error.stack);
      throw new HttpException(
        {
          success: false,
          message: '批量处理失败',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 健康检查接口
   */
  @Get('health')
  async healthCheck() {
    try {
      const health = await this.langchainAI.healthCheck();
      
      return {
        success: true,
        data: health,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('健康检查失败', error.stack);
      throw new HttpException(
        {
          success: false,
          message: '健康检查失败',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取可用模型列表
   */
  @Get('models')
  async getModels(@Query('provider') provider?: ModelProvider) {
    try {
      const models = await this.langchainAI.getAvailableModels(provider);
      
      return {
        success: true,
        data: models,
      };
    } catch (error) {
      this.logger.error('获取模型列表失败', error.stack);
      throw new HttpException(
        {
          success: false,
          message: '获取模型列表失败',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 切换模型
   */
  @Post('switch-model')
  async switchModel(
    @Body() request: { provider: ModelProvider; modelName: string },
  ) {
    try {
      await this.langchainAI.switchModel(request.provider, request.modelName);
      
      return {
        success: true,
        message: `已切换到 ${request.provider}:${request.modelName}`,
      };
    } catch (error) {
      this.logger.error('切换模型失败', error.stack);
      throw new HttpException(
        {
          success: false,
          message: '切换模型失败',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取推荐配置
   */
  @Get('recommended-config')
  async getRecommendedConfig(
    @Query('scenario') scenario: 'chat' | 'analysis' | 'fast' | 'creative' = 'chat',
  ) {
    try {
      const config = this.langchainAI.getRecommendedConfig(scenario);
      
      return {
        success: true,
        data: {
          scenario,
          config,
          description: this.getScenarioDescription(scenario),
        },
      };
    } catch (error) {
      this.logger.error('获取推荐配置失败', error.stack);
      throw new HttpException(
        {
          success: false,
          message: '获取推荐配置失败',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 获取服务统计信息
   */
  @Get('stats')
  async getStats() {
    try {
      const stats = this.langchainAI.getStats();
      
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      this.logger.error('获取统计信息失败', error.stack);
      throw new HttpException(
        {
          success: false,
          message: '获取统计信息失败',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 智能对话演示
   */
  @Post('demo/smart-chat')
  async smartChatDemo(@Body() request: { message: string; scenario?: string }) {
    try {
      const scenarios = {
        'code-review': {
          systemPrompt: '你是一位资深的代码审查专家，请帮助分析代码质量和提出改进建议。',
          useAnalysisModel: true,
          temperature: 0.3,
        },
        'creative-writing': {
          systemPrompt: '你是一位富有创造力的作家，请帮助用户进行创意写作。',
          temperature: 0.9,
          maxTokens: 3000,
        },
        'quick-answer': {
          systemPrompt: '请提供简洁准确的答案。',
          fastMode: true,
          temperature: 0.5,
          maxTokens: 500,
        },
      };

      const scenarioConfig = scenarios[request.scenario] || {};
      
      const response = await this.langchainAI.chat(
        [{ role: 'user', content: request.message }],
        scenarioConfig,
      );

      return {
        success: true,
        data: {
          response: response.content,
          scenario: request.scenario || 'default',
          config: scenarioConfig,
          meta: {
            provider: response.provider,
            model: response.model,
            processingTime: response.processingTime,
          },
        },
      };
    } catch (error) {
      this.logger.error('智能对话演示失败', error.stack);
      throw new HttpException(
        {
          success: false,
          message: '智能对话演示失败',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private getScenarioDescription(scenario: string): string {
    const descriptions = {
      chat: '通用对话场景，适合日常交流和问答',
      analysis: '深度分析场景，适合代码审查、文档分析等需要深度思考的任务',
      fast: '快速响应场景，适合简单问答和实时交互',
      creative: '创意场景，适合创作、头脑风暴等需要高创造性的任务',
    };
    
    return descriptions[scenario] || '未知场景';
  }
} 