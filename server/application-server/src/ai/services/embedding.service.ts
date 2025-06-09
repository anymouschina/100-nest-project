import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';

export interface EmbeddingOptions {
  model?: string;
  dimensions?: number;
  encodingFormat?: string;
}

export interface EmbeddingResult {
  vector: number[];
  tokenCount: number;
  model: string;
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private openaiClient: OpenAI | null = null;
  private readonly defaultModel = 'text-embedding-3-small';
  private readonly defaultDimensions = 384;

  constructor(private readonly configService: ConfigService) {
    this.initializeOpenAI();
  }

  /**
   * 初始化OpenAI客户端
   */
  private initializeOpenAI(): void {
    try {
      const apiKey = this.configService.get('OPENAI_API_KEY');
      const baseURL = this.configService.get('OPENAI_BASE_URL');

      if (apiKey) {
        this.openaiClient = new OpenAI({
          apiKey,
          baseURL: baseURL || 'https://api.openai.com/v1',
        });
        this.logger.log('OpenAI客户端初始化成功');
      } else {
        this.logger.warn('未配置OpenAI API Key，将使用模拟向量');
      }
    } catch (error) {
      this.logger.error('OpenAI客户端初始化失败:', error.message);
    }
  }

  /**
   * 生成文本嵌入向量
   */
  async generateEmbedding(
    text: string,
    options: EmbeddingOptions = {},
  ): Promise<EmbeddingResult> {
    const { model = this.defaultModel, dimensions = this.defaultDimensions } =
      options;

    try {
      if (this.openaiClient) {
        return await this.generateOpenAIEmbedding(text, model, dimensions);
      } else {
        return await this.generateSimulatedEmbedding(text, dimensions);
      }
    } catch (error) {
      this.logger.error(
        `生成嵌入向量失败: ${text.substring(0, 50)}...`,
        error.message,
      );
      // 降级到模拟向量
      return await this.generateSimulatedEmbedding(text, dimensions);
    }
  }

  /**
   * 批量生成嵌入向量
   */
  async generateBatchEmbeddings(
    texts: string[],
    options: EmbeddingOptions = {},
  ): Promise<EmbeddingResult[]> {
    const batchSize = 100; // OpenAI批量限制
    const results: EmbeddingResult[] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((text) => this.generateEmbedding(text, options)),
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * 使用OpenAI生成嵌入向量
   */
  private async generateOpenAIEmbedding(
    text: string,
    model: string,
    dimensions: number,
  ): Promise<EmbeddingResult> {
    if (!this.openaiClient) {
      throw new Error('OpenAI客户端未初始化');
    }

    const response = await this.openaiClient.embeddings.create({
      model,
      input: text,
      dimensions,
      encoding_format: 'float',
    });

    const embedding = response.data[0];

    return {
      vector: embedding.embedding,
      tokenCount: response.usage.total_tokens,
      model,
    };
  }

  /**
   * 生成模拟嵌入向量（用于开发和测试）
   */
  private async generateSimulatedEmbedding(
    text: string,
    dimensions: number,
  ): Promise<EmbeddingResult> {
    // 基于文本内容生成稳定的伪随机向量
    const hash = this.stringToHash(text);
    const vector: number[] = [];

    for (let i = 0; i < dimensions; i++) {
      const seed = hash + i;
      const value =
        (Math.sin(seed) * Math.cos(seed * 0.5)) / Math.sqrt(dimensions);
      vector.push(value);
    }

    // 归一化向量
    const normalizedVector = this.normalizeVector(vector);

    return {
      vector: normalizedVector,
      tokenCount: Math.ceil(text.length / 4), // 估算token数量
      model: 'simulated',
    };
  }

  /**
   * 字符串转哈希
   */
  private stringToHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash);
  }

  /**
   * 向量归一化
   */
  private normalizeVector(vector: number[]): number[] {
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (norm === 0) return vector;
    return vector.map((val) => val / norm);
  }

  /**
   * 计算余弦相似度
   */
  calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('向量维度不匹配');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * 获取支持的模型列表
   */
  getSupportedModels(): string[] {
    return [
      'text-embedding-3-small', // 1536维，性价比高
      'text-embedding-3-large', // 3072维，精度更高
      'text-embedding-ada-002', // 1536维，经典模型
    ];
  }

  /**
   * 获取模型信息
   */
  getModelInfo(model: string): {
    dimensions: number;
    maxTokens: number;
    description: string;
  } {
    const modelInfo = {
      'text-embedding-3-small': {
        dimensions: 1536,
        maxTokens: 8192,
        description: '高性价比的嵌入模型，适合大多数应用场景',
      },
      'text-embedding-3-large': {
        dimensions: 3072,
        maxTokens: 8192,
        description: '高精度嵌入模型，适合对精度要求高的场景',
      },
      'text-embedding-ada-002': {
        dimensions: 1536,
        maxTokens: 8192,
        description: '经典嵌入模型，稳定可靠',
      },
    };

    return (
      modelInfo[model] || {
        dimensions: 384,
        maxTokens: 4096,
        description: '未知模型',
      }
    );
  }

  /**
   * 预处理文本
   */
  preprocessText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // 规范化空白字符
      .replace(/[^\w\s\u4e00-\u9fff]/g, '') // 保留中英文和数字
      .substring(0, 8000); // 限制长度
  }

  /**
   * 分块处理长文本
   */
  chunkText(
    text: string,
    maxChunkSize: number = 1000,
    overlap: number = 100,
  ): string[] {
    const chunks: string[] = [];
    const sentences = text.split(/[.!?。！？]/);
    let currentChunk = '';

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length <= maxChunkSize) {
        currentChunk += sentence + '.';
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence + '.';
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    // 添加重叠部分
    if (overlap > 0 && chunks.length > 1) {
      for (let i = 1; i < chunks.length; i++) {
        const prevChunk = chunks[i - 1];
        const overlapText = prevChunk.substring(
          Math.max(0, prevChunk.length - overlap),
        );
        chunks[i] = overlapText + ' ' + chunks[i];
      }
    }

    return chunks.filter((chunk) => chunk.length > 0);
  }
}
