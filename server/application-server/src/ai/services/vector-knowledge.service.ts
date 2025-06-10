import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';
import { QdrantService, QdrantPoint } from './qdrant.service';
import { OllamaUniversalEmbeddingService } from './ollama-universal-embedding.service';

// 向量数据库接口定义
export interface VectorDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  vector?: number[];
  similarity?: number;
}

export interface SearchResult {
  documents: VectorDocument[];
  totalCount: number;
  searchTime: number;
}

export interface EmbeddingRequest {
  text: string;
  type?: 'query' | 'document';
  model?: string;
}

/**
 * 向量知识库服务
 * 结合传统数据库和向量数据库的优势
 * 支持语义搜索、相似性匹配、多模态检索
 */
@Injectable()
export class VectorKnowledgeService {
  private readonly logger = new Logger(VectorKnowledgeService.name);
  private vectorStore: Map<string, VectorDocument> = new Map();
  private isRedisVectorEnabled: boolean = false;
  private isQdrantEnabled: boolean = false;

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly qdrantService: QdrantService,
    private readonly embeddingService: OllamaUniversalEmbeddingService,
  ) {
    this.initializeVectorStore();
  }

  /**
   * 初始化向量存储
   */
  private async initializeVectorStore(): Promise<void> {
    try {
      // 检查Redis Vector或Qdrant是否可用
      this.isRedisVectorEnabled = await this.checkRedisVector();
      this.isQdrantEnabled = await this.checkQdrant();

      if (!this.isRedisVectorEnabled && !this.isQdrantEnabled) {
        this.logger.warn('向量数据库不可用，使用内存向量存储');
        await this.initializeMemoryVectorStore();
      }

      this.logger.log('向量知识库服务初始化完成');
    } catch (error) {
      this.logger.error('向量知识库初始化失败', error.stack);
    }
  }

  /**
   * 添加文档到向量库
   */
  async addDocument(document: VectorDocument): Promise<void> {
    try {
      // 生成文档向量
      const vector = await this.generateEmbedding(document.content);
      document.vector = vector;

      if (this.isQdrantEnabled) {
        await this.addToQdrant(document);
      } else if (this.isRedisVectorEnabled) {
        await this.addToRedisVector(document);
      } else {
        // 使用内存存储
        this.vectorStore.set(document.id, document);
      }

      this.logger.debug(`添加文档到向量库: ${document.id}`);
    } catch (error) {
      this.logger.error(`添加文档失败: ${document.id}`, error.stack);
      throw error;
    }
  }

  /**
   * 批量添加文档
   */
  async addDocuments(documents: VectorDocument[]): Promise<void> {
    const promises = documents.map((doc) => this.addDocument(doc));
    await Promise.all(promises);
    this.logger.log(`批量添加 ${documents.length} 个文档到向量库`);
  }

  /**
   * 语义搜索
   */
  async semanticSearch(
    query: string,
    options?: {
      limit?: number;
      threshold?: number;
      filters?: Record<string, any>;
      includeMetadata?: boolean;
    },
  ): Promise<SearchResult> {
    const startTime = Date.now();
    const {
      limit = 10,
      threshold = 0.7,
      filters = {},
      includeMetadata = true,
    } = options || {};

    try {
      // 生成查询向量
      const queryVector = await this.generateEmbedding(query);

      let results: VectorDocument[];

      if (this.isQdrantEnabled) {
        results = await this.searchInQdrant(queryVector, {
          limit,
          threshold,
          filters,
        });
      } else if (this.isRedisVectorEnabled) {
        results = await this.searchInRedisVector(queryVector, {
          limit,
          threshold,
          filters,
        });
      } else {
        results = await this.searchInMemory(queryVector, {
          limit,
          threshold,
          filters,
        });
      }

      // 过滤元数据
      if (!includeMetadata) {
        results = results.map((doc) => ({ ...doc, metadata: {} }));
      }

      const searchTime = Date.now() - startTime;

      return {
        documents: results,
        totalCount: results.length,
        searchTime,
      };
    } catch (error) {
      this.logger.error(`语义搜索失败: ${query}`, error.stack);
      throw error;
    }
  }

  /**
   * 混合搜索（关键词 + 语义）
   */
  async hybridSearch(
    query: string,
    options?: {
      keywordWeight?: number;
      semanticWeight?: number;
      limit?: number;
      filters?: Record<string, any>;
    },
  ): Promise<SearchResult> {
    const {
      keywordWeight = 0.3,
      semanticWeight = 0.7,
      limit = 10,
      filters = {},
    } = options || {};

    try {
      // 关键词搜索
      const keywordResults = await this.keywordSearch(query, {
        limit: limit * 2,
        filters,
      });

      // 语义搜索
      const semanticResults = await this.semanticSearch(query, {
        limit: limit * 2,
        filters,
      });

      // 合并和重新排序结果
      const hybridResults = this.combineSearchResults(
        keywordResults.documents,
        semanticResults.documents,
        keywordWeight,
        semanticWeight,
      );

      return {
        documents: hybridResults.slice(0, limit),
        totalCount: hybridResults.length,
        searchTime: 0, // 复合搜索时间
      };
    } catch (error) {
      this.logger.error(`混合搜索失败: ${query}`, error.stack);
      throw error;
    }
  }

  /**
   * 相似文档推荐
   */
  async findSimilarDocuments(
    documentId: string,
    limit: number = 5,
  ): Promise<VectorDocument[]> {
    try {
      const document = await this.getDocument(documentId);
      if (!document || !document.vector) {
        return [];
      }

      if (this.isQdrantEnabled) {
        return await this.findSimilarInQdrant(document.vector, limit);
      } else if (this.isRedisVectorEnabled) {
        return await this.findSimilarInRedisVector(document.vector, limit);
      } else {
        return await this.findSimilarInMemory(document.vector, limit);
      }
    } catch (error) {
      this.logger.error(`查找相似文档失败: ${documentId}`, error.stack);
      return [];
    }
  }

  /**
   * 集群分析
   */
  async clusterDocuments(
    filters?: Record<string, any>,
    numClusters: number = 5,
  ): Promise<{
    clusters: Array<{
      id: string;
      center: number[];
      documents: VectorDocument[];
      keywords: string[];
    }>;
  }> {
    try {
      // 获取所有符合条件的文档
      const documents = await this.getDocuments(filters);

      if (documents.length < numClusters) {
        return { clusters: [] };
      }

      // 执行K-means聚类
      const clusters = await this.performKMeansClustering(
        documents,
        numClusters,
      );

      return { clusters };
    } catch (error) {
      this.logger.error('文档聚类分析失败', error.stack);
      throw error;
    }
  }

  /**
   * 生成文本嵌入向量 - 只使用Ollama，不使用模拟向量
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // 只使用Ollama embedding服务，失败时直接抛出错误
      const embeddingResult = await this.embeddingService.generateEmbedding(text);
      return embeddingResult.vector;
    } catch (error) {
      this.logger.error(`Ollama嵌入向量生成失败: ${error.message}`, error.stack);
      throw new Error(`嵌入服务不可用，请确保Ollama服务正常运行: ${error.message}`);
    }
  }

  /**
   * 计算余弦相似度
   */
  private calculateCosineSimilarity(
    vectorA: number[],
    vectorB: number[],
  ): number {
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

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * 向量归一化
   */
  private normalizeVector(vector: number[]): number[] {
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map((val) => val / norm);
  }

  /**
   * 简单哈希函数（用于模拟）
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * 内存向量搜索
   */
  private async searchInMemory(
    queryVector: number[],
    options: { limit: number; threshold: number; filters: Record<string, any> },
  ): Promise<VectorDocument[]> {
    const results: Array<VectorDocument & { similarity: number }> = [];

    for (const [id, document] of this.vectorStore) {
      if (!document.vector) continue;

      // 应用过滤器
      if (!this.matchesFilters(document, options.filters)) continue;

      const similarity = this.calculateCosineSimilarity(
        queryVector,
        document.vector,
      );

      if (similarity >= options.threshold) {
        results.push({ ...document, similarity });
      }
    }

    // 按相似度排序
    results.sort((a, b) => b.similarity - a.similarity);

    return results.slice(0, options.limit);
  }

  /**
   * 关键词搜索
   */
  private async keywordSearch(
    query: string,
    options: { limit: number; filters: Record<string, any> },
  ): Promise<SearchResult> {
    const results: VectorDocument[] = [];
    const queryLower = query.toLowerCase();

    for (const [id, document] of this.vectorStore) {
      if (!this.matchesFilters(document, options.filters)) continue;

      if (document.content.toLowerCase().includes(queryLower)) {
        results.push(document);
      }
    }

    return {
      documents: results.slice(0, options.limit),
      totalCount: results.length,
      searchTime: 0,
    };
  }

  /**
   * 过滤器匹配
   */
  private matchesFilters(
    document: VectorDocument,
    filters: Record<string, any>,
  ): boolean {
    for (const [key, value] of Object.entries(filters)) {
      if (document.metadata[key] !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * 合并搜索结果
   */
  private combineSearchResults(
    keywordResults: VectorDocument[],
    semanticResults: VectorDocument[],
    keywordWeight: number,
    semanticWeight: number,
  ): VectorDocument[] {
    const combined = new Map<string, VectorDocument & { score: number }>();

    // 处理关键词结果
    keywordResults.forEach((doc, index) => {
      const score =
        ((keywordResults.length - index) / keywordResults.length) *
        keywordWeight;
      combined.set(doc.id, { ...doc, score });
    });

    // 处理语义结果
    semanticResults.forEach((doc, index) => {
      const semanticScore = (doc.similarity || 0) * semanticWeight;
      const existing = combined.get(doc.id);

      if (existing) {
        existing.score += semanticScore;
      } else {
        combined.set(doc.id, { ...doc, score: semanticScore });
      }
    });

    // 按分数排序
    return Array.from(combined.values())
      .sort((a, b) => b.score - a.score)
      .map(({ score, ...doc }) => doc);
  }

  // 以下是向量数据库具体实现的占位符方法
  private async checkRedisVector(): Promise<boolean> {
    // 检查Redis Vector是否可用
    return false;
  }

  private async checkQdrant(): Promise<boolean> {
    // 检查Qdrant是否可用
    try {
      return this.qdrantService.isReady();
    } catch (error) {
      this.logger.warn('Qdrant检查失败', error.message);
      return false;
    }
  }

  private async initializeMemoryVectorStore(): Promise<void> {
    // 初始化内存向量存储
    this.logger.log('使用内存向量存储');
  }

  private async addToQdrant(document: VectorDocument): Promise<void> {
    try {
      const COLLECTION_NAME = 'log_analysis_knowledge';
      
      // 确保集合存在
      if (!(await this.qdrantService.collectionExists(COLLECTION_NAME))) {
        await this.qdrantService.createCollection(COLLECTION_NAME, document.vector!.length);
      }

      // 添加向量点
      await this.qdrantService.upsertPoints(COLLECTION_NAME, [{
        id: document.id,
        vector: document.vector!,
        payload: {
          content: document.content,
          metadata: document.metadata,
        }
      }]);
    } catch (error) {
      this.logger.error(`添加文档到Qdrant失败: ${document.id}`, error.message);
      throw error;
    }
  }

  private async addToRedisVector(document: VectorDocument): Promise<void> {
    // 添加到Redis Vector
    throw new Error('Redis Vector integration not implemented');
  }

  private async searchInQdrant(
    vector: number[],
    options: any,
  ): Promise<VectorDocument[]> {
    try {
      const COLLECTION_NAME = 'log_analysis_knowledge';
      const searchResults = await this.qdrantService.searchVectors(
        COLLECTION_NAME,
        vector,
        {
          limit: options.limit || 10,
          scoreThreshold: options.threshold || 0.7,
          filter: options.filters,
          withPayload: true,
        },
      );

      return searchResults.map((result) => ({
        id: String(result.id),
        content: result.payload.content,
        metadata: result.payload.metadata,
        vector: result.vector,
        similarity: result.score,
      }));
    } catch (error) {
      this.logger.error('Qdrant搜索失败', error.message);
      return [];
    }
  }

  private async searchInRedisVector(
    vector: number[],
    options: any,
  ): Promise<VectorDocument[]> {
    // 在Redis Vector中搜索
    throw new Error('Redis Vector search not implemented');
  }

  private async findSimilarInQdrant(
    vector: number[],
    limit: number,
  ): Promise<VectorDocument[]> {
    return this.searchInQdrant(vector, { limit, threshold: 0.5 });
  }

  private async findSimilarInRedisVector(
    vector: number[],
    limit: number,
  ): Promise<VectorDocument[]> {
    // 在Redis Vector中查找相似文档
    throw new Error('Redis Vector similarity search not implemented');
  }

  private async findSimilarInMemory(
    vector: number[],
    limit: number,
  ): Promise<VectorDocument[]> {
    // 在内存中查找相似文档
    const results: Array<VectorDocument & { similarity: number }> = [];

    for (const [id, document] of this.vectorStore) {
      if (!document.vector) continue;

      const similarity = this.calculateCosineSimilarity(
        vector,
        document.vector,
      );
      results.push({ ...document, similarity });
    }

    return results.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  }

  private async getDocument(id: string): Promise<VectorDocument | null> {
    return this.vectorStore.get(id) || null;
  }

  private async getDocuments(
    filters?: Record<string, any>,
  ): Promise<VectorDocument[]> {
    const documents = Array.from(this.vectorStore.values());

    if (!filters) return documents;

    return documents.filter((doc) => this.matchesFilters(doc, filters));
  }

  private async performKMeansClustering(
    documents: VectorDocument[],
    numClusters: number,
  ): Promise<
    Array<{
      id: string;
      center: number[];
      documents: VectorDocument[];
      keywords: string[];
    }>
  > {
    // K-means聚类实现
    // 这里是简化版实现，实际应该使用专业的机器学习库
    return [];
  }
}
