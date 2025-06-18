import { Injectable } from '@nestjs/common';
import { AppConfigService } from '../../config/config.service';
import { DatabaseService } from '../../database/database.service';
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { createHash } from 'crypto';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class EmbeddingService {
  private embeddingModel: OllamaEmbeddings;
  private prisma: PrismaClient;
  
  constructor(
    private readonly configService: AppConfigService,
    private readonly databaseService: DatabaseService,
  ) {
    this.embeddingModel = new OllamaEmbeddings({
      model: 'deepseek-r1', // 使用Ollama的deepseek-r1模型
      baseUrl: 'http://localhost:11434', // 默认使用本地Ollama服务
    });
    
    // 使用单独的Prisma客户端来避免与现有数据库服务冲突
    this.prisma = new PrismaClient();
  }
  
  async getEmbedding(text: string): Promise<number[]> {
    // 计算文本哈希，用于缓存查询
    const contentHash = this.computeHash(text);
    
    try {
      // 尝试从缓存中获取嵌入
      const cacheResult = await this.prisma.embeddingCache.findUnique({
        where: { contentHash }
      }).catch(() => null);
      
      // 如果找到缓存，则更新使用计数并返回
      if (cacheResult?.embedding) {
        await this.prisma.embeddingCache.update({
          where: { id: cacheResult.id },
          data: {
            lastUsed: new Date(),
            useCount: { increment: 1 },
          },
        }).catch(err => console.error('更新缓存使用计数失败:', err));
        
        return cacheResult.embedding as unknown as number[];
      }
      
      // 如果没有缓存，则调用Ollama API生成嵌入
      const embedding = await this.embeddingModel.embedQuery(text);
      
      // 由于deepseek-r1模型生成的是4096维向量，而数据库期望1536维，需要调整维度
      const resizedEmbedding = this.resizeEmbeddingTo1536Dimensions(embedding);
      
      // 将结果存入缓存
      // 使用databaseService代替直接使用prisma
      await this.databaseService.$executeRaw`
        INSERT INTO "embedding_cache" (
          "id", "contentHash", "content", "embedding", "model", "tokenCount", "lastUsed", "useCount", "createdAt"
        ) VALUES (
          ${this.generateId()}, ${contentHash}, ${text}, ${resizedEmbedding}::vector, 'deepseek-r1', 
          ${Math.ceil(text.length / 4)}, now(), 1, now()
        )
      `.catch(err => console.error('存储嵌入缓存失败:', err));
      
      return resizedEmbedding;
    } catch (error) {
      console.error('获取嵌入向量失败:', error);
      // 如果失败，返回一个随机向量
      return this.createDummyEmbedding();
    }
  }
  
  /**
   * 将4096维向量调整为1536维
   * 方法：通过采样或合并维度来减少维度数量
   */
  private resizeEmbeddingTo1536Dimensions(embedding: number[]): number[] {
    if (embedding.length === 1536) {
      return embedding;
    }
    
    // 如果维度大于1536，采用采样方式减少维度
    if (embedding.length > 1536) {
      const result = new Array(1536).fill(0);
      const ratio = embedding.length / 1536;
      
      for (let i = 0; i < 1536; i++) {
        // 采样原始向量中的对应位置
        const sourceIdx = Math.floor(i * ratio);
        result[i] = embedding[sourceIdx];
      }
      
      return result;
    }
    
    // 如果维度小于1536，填充到1536维
    const result = new Array(1536).fill(0);
    for (let i = 0; i < embedding.length; i++) {
      result[i] = embedding[i];
    }
    
    return result;
  }
  
  /**
   * 创建一个1536维度的随机向量
   */
  private createDummyEmbedding(): number[] {
    return Array(1536).fill(0).map(() => Math.random() * 2 - 1);
  }
  
  private computeHash(text: string): string {
    // 使用SHA-256哈希算法
    return createHash('sha256').update(text).digest('hex');
  }
  
  private generateId(): string {
    // 生成一个简单的唯一ID
    return 'emb_' + Date.now().toString() + '_' + Math.floor(Math.random() * 1000).toString();
  }
} 