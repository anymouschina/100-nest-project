import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OllamaEmbeddings } from '@langchain/ollama';

export interface OllamaEmbeddingOptions {
  model?: string;
  dimensions?: number;
  batchSize?: number;
}

export interface OllamaEmbeddingResult {
  vector: number[];
  tokenCount: number;
  model: string;
  processingTime: number;
}

@Injectable()
export class OllamaUniversalEmbeddingService {
  private readonly logger = new Logger(OllamaUniversalEmbeddingService.name);
  private ollamaEmbeddings: OllamaEmbeddings;
  private readonly defaultModel: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get('ai.ollamaBaseUrl') || 'http://localhost:11434';
    this.defaultModel = this.configService.get('ai.ollamaEmbeddingModel') || 'nomic-embed-text';
    
    this.initializeOllama();
    this.logger.log('Ollama通用嵌入服务初始化完成');
  }

  private initializeOllama(): void {
    this.ollamaEmbeddings = new OllamaEmbeddings({
      model: this.defaultModel,
      baseUrl: this.baseUrl,
    });
  }

  /**
   * 生成单个文本的嵌入向量
   */
  async generateEmbedding(
    text: string,
    options: OllamaEmbeddingOptions = {},
  ): Promise<OllamaEmbeddingResult> {
    const startTime = Date.now();
    const model = options.model || this.defaultModel;

    try {
      // 确保Ollama服务可用
      await this.ensureOllamaAvailable();

      // 如果指定了不同的模型，创建新的实例
      let embeddings = this.ollamaEmbeddings;
      if (model !== this.defaultModel) {
        embeddings = new OllamaEmbeddings({
          model,
          baseUrl: this.baseUrl,
        });
      }

      const vector = await embeddings.embedQuery(text);
      const processingTime = Date.now() - startTime;

      this.logger.debug(`生成嵌入向量成功: ${text.substring(0, 50)}...`, {
        model,
        dimensions: vector.length,
        processingTime,
      });

      return {
        vector,
        tokenCount: this.estimateTokens(text),
        model,
        processingTime,
      };
    } catch (error) {
      this.logger.error(`Ollama嵌入向量生成失败: ${error.message}`, error.stack);
      throw new Error(`Ollama嵌入服务不可用: ${error.message}`);
    }
  }

  /**
   * 批量生成嵌入向量
   */
  async generateBatchEmbeddings(
    texts: string[],
    options: OllamaEmbeddingOptions = {},
  ): Promise<OllamaEmbeddingResult[]> {
    const startTime = Date.now();
    const model = options.model || this.defaultModel;
    const batchSize = options.batchSize || 5; // 控制并发数量

    try {
      await this.ensureOllamaAvailable();

      let embeddings = this.ollamaEmbeddings;
      if (model !== this.defaultModel) {
        embeddings = new OllamaEmbeddings({
          model,
          baseUrl: this.baseUrl,
        });
      }

      const results: OllamaEmbeddingResult[] = [];
      
      // 分批处理
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        
        const batchVectors = await embeddings.embedDocuments(batch);
        
        for (let j = 0; j < batch.length; j++) {
          results.push({
            vector: batchVectors[j],
            tokenCount: this.estimateTokens(batch[j]),
            model,
            processingTime: Date.now() - startTime,
          });
        }
      }

      const totalTime = Date.now() - startTime;
      this.logger.log(`批量生成嵌入向量完成`, {
        count: texts.length,
        model,
        totalTime,
        averageTime: Math.round(totalTime / texts.length),
      });

      return results;
    } catch (error) {
      this.logger.error(`批量嵌入向量生成失败: ${error.message}`, error.stack);
      throw new Error(`Ollama批量嵌入服务不可用: ${error.message}`);
    }
  }

  /**
   * 计算两个向量的余弦相似度
   */
  calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error(`向量维度不匹配: ${vectorA.length} vs ${vectorB.length}`);
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * 查找最相似的向量
   */
  findMostSimilar(
    queryVector: number[],
    candidateVectors: { id: string; vector: number[] }[],
    topK: number = 5,
  ): Array<{ id: string; similarity: number }> {
    const similarities = candidateVectors.map((candidate) => ({
      id: candidate.id,
      similarity: this.calculateCosineSimilarity(queryVector, candidate.vector),
    }));

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    model: string;
    baseUrl: string;
    latency?: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      await this.ensureOllamaAvailable();
      
      // 测试嵌入生成
      const testText = 'This is a health check test.';
      await this.generateEmbedding(testText);
      
      const latency = Date.now() - startTime;

      return {
        status: 'healthy',
        model: this.defaultModel,
        baseUrl: this.baseUrl,
        latency,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        model: this.defaultModel,
        baseUrl: this.baseUrl,
        error: error.message,
      };
    }
  }

  /**
   * 获取可用的嵌入模型列表
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      const data = await response.json();
      
      // 过滤出嵌入模型
      const embeddingModels = data.models?.filter((model: any) => 
        model.name.includes('embed') || 
        model.name.includes('nomic') ||
        model.name.includes('mxbai')
      ).map((model: any) => model.name) || [];

      return embeddingModels.length > 0 ? embeddingModels : [this.defaultModel];
    } catch (error) {
      this.logger.warn(`获取可用模型失败: ${error.message}`);
      return [this.defaultModel];
    }
  }

  /**
   * 切换嵌入模型
   */
  async switchModel(modelName: string): Promise<void> {
    try {
      // 测试新模型是否可用
      const testEmbeddings = new OllamaEmbeddings({
        model: modelName,
        baseUrl: this.baseUrl,
      });

      await testEmbeddings.embedQuery('test');
      
      // 如果成功，更新默认模型
      this.ollamaEmbeddings = testEmbeddings;
      
      this.logger.log(`已切换到嵌入模型: ${modelName}`);
    } catch (error) {
      this.logger.error(`切换模型失败: ${modelName}`, error.stack);
      throw new Error(`模型切换失败: ${error.message}`);
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    defaultModel: string;
    baseUrl: string;
    isInitialized: boolean;
  } {
    return {
      defaultModel: this.defaultModel,
      baseUrl: this.baseUrl,
      isInitialized: !!this.ollamaEmbeddings,
    };
  }

  // 私有方法

  private async ensureOllamaAvailable(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        timeout: 5000,
      } as any);
      
      if (!response.ok) {
        throw new Error(`Ollama服务不可用: ${response.status}`);
      }
    } catch (error) {
      throw new Error(`无法连接到Ollama服务 (${this.baseUrl}): ${error.message}`);
    }
  }

  private estimateTokens(text: string): number {
    // 简单的token估算
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = text.split(/\s+/).filter(word => /[a-zA-Z]/.test(word)).length;
    const symbols = text.length - chineseChars - englishWords;
    
    return Math.ceil(chineseChars * 1.5 + englishWords + symbols * 0.5);
  }
} 