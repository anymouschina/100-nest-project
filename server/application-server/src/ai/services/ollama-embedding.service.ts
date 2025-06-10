import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OllamaUniversalEmbeddingService } from './ollama-universal-embedding.service';

export interface OllamaEmbeddingResult {
  vector: number[];
  tokenCount: number;
  model: string;
}

export interface EmbeddingOptions {
  model?: string;
  dimensions?: number;
}

@Injectable()
export class OllamaEmbeddingService {
  private readonly logger = new Logger(OllamaEmbeddingService.name);
  private readonly defaultModel: string;
  private readonly defaultDimensions: number = 384;

  constructor(
    private readonly configService: ConfigService,
    private readonly ollamaUniversal: OllamaUniversalEmbeddingService,
  ) {
    this.defaultModel = this.configService.get('ai.ollamaEmbeddingModel') || 'nomic-embed-text';
    this.logger.log('Ollama嵌入服务初始化完成 (基于Universal服务)');
  }

  /**
   * 生成单个文本的嵌入向量
   */
  async generateEmbedding(
    text: string,
    options: EmbeddingOptions = {},
  ): Promise<OllamaEmbeddingResult> {
    try {
      const result = await this.ollamaUniversal.generateEmbedding(text, {
        model: options.model || this.defaultModel,
        dimensions: options.dimensions || this.defaultDimensions,
      });

      return {
        vector: result.vector,
        tokenCount: result.tokenCount,
        model: result.model,
      };
    } catch (error) {
      this.logger.error(`嵌入向量生成失败: ${error.message}`, error.stack);
      throw new Error(`Ollama嵌入服务不可用: ${error.message}`);
    }
  }

  /**
   * 批量生成嵌入向量
   */
  async generateBatchEmbeddings(
    texts: string[],
    options: EmbeddingOptions = {},
  ): Promise<OllamaEmbeddingResult[]> {
    try {
      const results = await this.ollamaUniversal.generateBatchEmbeddings(texts, {
        model: options.model || this.defaultModel,
        dimensions: options.dimensions || this.defaultDimensions,
      });

      return results.map(result => ({
        vector: result.vector,
        tokenCount: result.tokenCount,
        model: result.model,
      }));
    } catch (error) {
      this.logger.error(`批量嵌入向量生成失败: ${error.message}`, error.stack);
      throw new Error(`Ollama批量嵌入服务不可用: ${error.message}`);
    }
  }

  /**
   * 健康检查
   */
  async isHealthy(): Promise<boolean> {
    try {
      const health = await this.ollamaUniversal.healthCheck();
      return health.status === 'healthy';
    } catch (error) {
      this.logger.warn(`健康检查失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 计算余弦相似度
   */
  calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    return this.ollamaUniversal.calculateCosineSimilarity(vectorA, vectorB);
  }

  /**
   * 获取支持的模型列表
   */
  async getSupportedModels(): Promise<string[]> {
    try {
      return await this.ollamaUniversal.getAvailableModels();
    } catch (error) {
      this.logger.warn(`获取支持模型列表失败: ${error.message}`);
      return [this.defaultModel];
    }
  }

  /**
   * Token数量估算
   */
  private estimateTokens(text: string): number {
    // 简单的token估算
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = text.split(/\s+/).filter(word => /[a-zA-Z]/.test(word)).length;
    return Math.ceil(chineseChars * 1.5 + englishWords);
  }

  /**
   * 简单哈希函数
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash);
  }
} 