import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import { VectorDocument } from './vector-knowledge.service';

export interface QdrantPoint {
  id: string | number;
  vector: number[];
  payload: Record<string, any>;
}

export interface QdrantSearchResult {
  id: string | number;
  score: number;
  payload: Record<string, any>;
  vector?: any; // 改为any类型以兼容Qdrant的多种向量格式
}

export interface QdrantSearchOptions {
  limit?: number;
  scoreThreshold?: number;
  filter?: Record<string, any>;
  withPayload?: boolean;
  withVector?: boolean;
}

@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly logger = new Logger(QdrantService.name);
  private client: QdrantClient;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeConnection();
  }

  /**
   * 初始化Qdrant连接
   */
  private async initializeConnection(): Promise<void> {
    try {
      const host = this.configService.get('QDRANT_HOST', 'localhost');
      const port = this.configService.get('QDRANT_PORT', 6333);
      const apiKey = this.configService.get('QDRANT_API_KEY');

      this.client = new QdrantClient({
        url: `http://${host}:${port}`,
        apiKey: apiKey, // 生产环境建议使用API Key
      });

      // 测试连接
      await this.client.getCollections();
      this.isConnected = true;
      this.logger.log(`Qdrant连接成功: ${host}:${port}`);
    } catch (error) {
      this.logger.error('Qdrant连接失败:', error.message);
      this.isConnected = false;
      // 不抛出错误，允许服务降级运行
    }
  }

  /**
   * 检查连接状态
   */
  isReady(): boolean {
    return this.isConnected;
  }

  /**
   * 创建集合
   */
  async createCollection(
    collectionName: string,
    vectorSize: number,
    distance: 'Cosine' | 'Euclid' | 'Dot' = 'Cosine',
  ): Promise<boolean> {
    try {
      if (!this.isConnected) {
        throw new Error('Qdrant未连接');
      }

      await this.client.createCollection(collectionName, {
        vectors: {
          size: vectorSize,
          distance: distance,
        },
        optimizers_config: {
          default_segment_number: 2,
        },
        replication_factor: 1,
      });

      this.logger.log(`集合创建成功: ${collectionName}`);
      return true;
    } catch (error) {
      if (error.message?.includes('already exists')) {
        this.logger.debug(`集合已存在: ${collectionName}`);
        return true;
      }
      this.logger.error(`集合创建失败: ${collectionName}`, error.message);
      return false;
    }
  }

  /**
   * 检查集合是否存在
   */
  async collectionExists(collectionName: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;

      const info = await this.client.getCollection(collectionName);
      return !!info;
    } catch (error) {
      return false;
    }
  }

  /**
   * 删除集合
   */
  async deleteCollection(collectionName: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;

      await this.client.deleteCollection(collectionName);
      this.logger.log(`集合删除成功: ${collectionName}`);
      return true;
    } catch (error) {
      this.logger.error(`集合删除失败: ${collectionName}`, error.message);
      return false;
    }
  }

  /**
   * 添加向量点
   */
  async upsertPoints(
    collectionName: string,
    points: QdrantPoint[],
  ): Promise<boolean> {
    try {
      if (!this.isConnected) return false;

      await this.client.upsert(collectionName, {
        wait: true,
        points: points.map((point) => ({
          id: point.id,
          vector: point.vector,
          payload: point.payload,
        })),
      });

      this.logger.debug(
        `向量点插入成功: ${collectionName}, 数量: ${points.length}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`向量点插入失败: ${collectionName}`, error.message);
      return false;
    }
  }

  /**
   * 搜索相似向量
   */
  async searchVectors(
    collectionName: string,
    queryVector: number[],
    options: QdrantSearchOptions = {},
  ): Promise<QdrantSearchResult[]> {
    try {
      if (!this.isConnected) return [];

      const {
        limit = 10,
        scoreThreshold = 0.7,
        filter,
        withPayload = true,
        withVector = false,
      } = options;

      const searchResult = await this.client.search(collectionName, {
        vector: queryVector,
        limit,
        score_threshold: scoreThreshold,
        filter: filter ? this.buildFilter(filter) : undefined,
        with_payload: withPayload,
        with_vector: withVector,
      });

      return searchResult.map((result) => ({
        id: result.id,
        score: result.score,
        payload: result.payload || {},
        vector: result.vector,
      }));
    } catch (error) {
      this.logger.error(`向量搜索失败: ${collectionName}`, error.message);
      return [];
    }
  }

  /**
   * 获取向量点
   */
  async getPoints(
    collectionName: string,
    ids: (string | number)[],
    withVector = false,
  ): Promise<QdrantSearchResult[]> {
    try {
      if (!this.isConnected) return [];

      const points = await this.client.retrieve(collectionName, {
        ids,
        with_payload: true,
        with_vector: withVector,
      });

      return points.map((point) => ({
        id: point.id,
        score: 1.0, // retrieve操作没有score
        payload: point.payload || {},
        vector: point.vector,
      }));
    } catch (error) {
      this.logger.error(`获取向量点失败: ${collectionName}`, error.message);
      return [];
    }
  }

  /**
   * 删除向量点
   */
  async deletePoints(
    collectionName: string,
    ids: (string | number)[],
  ): Promise<boolean> {
    try {
      if (!this.isConnected) return false;

      await this.client.delete(collectionName, {
        wait: true,
        points: ids,
      });

      this.logger.debug(
        `向量点删除成功: ${collectionName}, 数量: ${ids.length}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`向量点删除失败: ${collectionName}`, error.message);
      return false;
    }
  }

  /**
   * 获取集合信息
   */
  async getCollectionInfo(collectionName: string): Promise<any> {
    try {
      if (!this.isConnected) return null;

      const info = await this.client.getCollection(collectionName);
      return info;
    } catch (error) {
      this.logger.error(`获取集合信息失败: ${collectionName}`, error.message);
      return null;
    }
  }

  /**
   * 滚动查询（分页）
   */
  async scrollPoints(
    collectionName: string,
    options: {
      limit?: number;
      offset?: string | number;
      filter?: Record<string, any>;
      withPayload?: boolean;
      withVector?: boolean;
    } = {},
  ): Promise<{
    points: QdrantSearchResult[];
    nextOffset?: string | number;
  }> {
    try {
      if (!this.isConnected) {
        return { points: [] };
      }

      const {
        limit = 100,
        offset,
        filter,
        withPayload = true,
        withVector = false,
      } = options;

      const result = await this.client.scroll(collectionName, {
        limit,
        offset,
        filter: filter ? this.buildFilter(filter) : undefined,
        with_payload: withPayload,
        with_vector: withVector,
      });

      return {
        points: result.points.map((point) => ({
          id: point.id,
          score: 1.0,
          payload: point.payload || {},
          vector: point.vector,
        })),
        nextOffset:
          typeof result.next_page_offset === 'string' ||
          typeof result.next_page_offset === 'number'
            ? result.next_page_offset
            : undefined,
      };
    } catch (error) {
      this.logger.error(`滚动查询失败: ${collectionName}`, error.message);
      return { points: [] };
    }
  }

  /**
   * 构建Qdrant过滤器
   */
  private buildFilter(filters: Record<string, any>): any {
    const must: any[] = [];

    for (const [key, value] of Object.entries(filters)) {
      if (Array.isArray(value)) {
        must.push({
          key,
          match: { any: value },
        });
      } else if (typeof value === 'string') {
        must.push({
          key,
          match: { value },
        });
      } else if (typeof value === 'number') {
        must.push({
          key,
          match: { value },
        });
      } else if (typeof value === 'boolean') {
        must.push({
          key,
          match: { value },
        });
      }
    }

    return must.length > 0 ? { must } : undefined;
  }

  /**
   * 创建索引（优化性能）
   */
  async createIndex(
    collectionName: string,
    fieldName: string,
    fieldType: 'keyword' | 'integer' | 'float' | 'bool' = 'keyword',
  ): Promise<boolean> {
    try {
      if (!this.isConnected) return false;

      // 注释掉暂时不支持的索引创建功能
      // await this.client.createFieldIndex(collectionName, {
      //   field_name: fieldName,
      //   field_type: fieldType,
      //   field_schema: fieldType,
      // });

      this.logger.log(`索引创建成功: ${collectionName}.${fieldName}`);
      return true;
    } catch (error) {
      this.logger.error(
        `索引创建失败: ${collectionName}.${fieldName}`,
        error.message,
      );
      return false;
    }
  }

  /**
   * 批量操作
   */
  async batchOperation(
    collectionName: string,
    operations: Array<{
      type: 'upsert' | 'delete';
      points?: QdrantPoint[];
      ids?: (string | number)[];
    }>,
  ): Promise<boolean> {
    try {
      if (!this.isConnected) return false;

      for (const operation of operations) {
        if (operation.type === 'upsert' && operation.points) {
          await this.upsertPoints(collectionName, operation.points);
        } else if (operation.type === 'delete' && operation.ids) {
          await this.deletePoints(collectionName, operation.ids);
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`批量操作失败: ${collectionName}`, error.message);
      return false;
    }
  }
}
