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
import { OllamaUniversalEmbeddingService } from '../services/ollama-universal-embedding.service';

interface EmbeddingRequest {
  text: string;
  model?: string;
  dimensions?: number;
}

interface BatchEmbeddingRequest {
  texts: string[];
  model?: string;
  dimensions?: number;
  batchSize?: number;
}

interface SimilarityRequest {
  text1: string;
  text2: string;
  model?: string;
}

@Controller('ai/embedding')
export class EmbeddingController {
  private readonly logger = new Logger(EmbeddingController.name);

  constructor(
    private readonly embeddingService: OllamaUniversalEmbeddingService,
  ) {}

  /**
   * 生成单个文本的嵌入向量
   */
  @Post('generate')
  async generateEmbedding(@Body() request: EmbeddingRequest) {
    try {
      this.logger.log('生成嵌入向量', {
        textLength: request.text.length,
        model: request.model,
      });

      const result = await this.embeddingService.generateEmbedding(request.text, {
        model: request.model,
        dimensions: request.dimensions,
      });

      return {
        success: true,
        data: {
          vector: result.vector,
          dimensions: result.vector.length,
          tokenCount: result.tokenCount,
          model: result.model,
          processingTime: result.processingTime,
        },
        meta: {
          inputLength: request.text.length,
          textPreview: request.text.substring(0, 100) + (request.text.length > 100 ? '...' : ''),
        },
      };
    } catch (error) {
      this.logger.error('生成嵌入向量失败', error.stack);
      throw new HttpException(
        {
          success: false,
          message: '嵌入向量生成失败',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 计算两个文本的相似度
   */
  @Post('similarity')
  async calculateSimilarity(@Body() request: SimilarityRequest) {
    try {
      this.logger.log('计算文本相似度', {
        text1Length: request.text1.length,
        text2Length: request.text2.length,
      });

      const [result1, result2] = await Promise.all([
        this.embeddingService.generateEmbedding(request.text1, {
          model: request.model,
        }),
        this.embeddingService.generateEmbedding(request.text2, {
          model: request.model,
        }),
      ]);

      const similarity = this.embeddingService.calculateCosineSimilarity(
        result1.vector,
        result2.vector,
      );

      return {
        success: true,
        data: {
          similarity,
          similarityPercentage: Math.round(similarity * 100),
          text1Info: {
            preview: request.text1.substring(0, 100) + '...',
            tokenCount: result1.tokenCount,
            dimensions: result1.vector.length,
          },
          text2Info: {
            preview: request.text2.substring(0, 100) + '...',
            tokenCount: result2.tokenCount,
            dimensions: result2.vector.length,
          },
          model: result1.model,
        },
      };
    } catch (error) {
      this.logger.error('计算相似度失败', error.stack);
      throw new HttpException(
        {
          success: false,
          message: '相似度计算失败',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 健康检查
   */
  @Get('health')
  async healthCheck() {
    try {
      const health = await this.embeddingService.healthCheck();

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
  async getAvailableModels() {
    try {
      const models = await this.embeddingService.getAvailableModels();

      return {
        success: true,
        data: {
          models,
          defaultModel: this.embeddingService.getStats().defaultModel,
          count: models.length,
        },
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
   * 获取服务统计信息
   */
  @Get('stats')
  async getStats() {
    try {
      const stats = this.embeddingService.getStats();

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
} 