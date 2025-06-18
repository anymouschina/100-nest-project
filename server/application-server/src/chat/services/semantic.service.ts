import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AppConfigService } from '../../config/config.service';
import { EmbeddingService } from './embedding.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SemanticService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: AppConfigService,
    private readonly embeddingService: EmbeddingService,
  ) {
    // 初始化时，检查并创建必要的语义意图
    this.ensureDefaultIntentsExist().catch(err => 
      console.error('初始化默认意图时出错:', err)
    );
  }

  /**
   * 确保默认的意图已经存在
   * 这通常应该在种子脚本中完成，但这里作为备份
   */
  private async ensureDefaultIntentsExist() {
    // 检查数据库中是否有意图
    const intentsCount = await this.databaseService.semanticIntent.count().catch(() => 0);

    // 如果没有意图，创建默认的意图
    if (intentsCount === 0) {
      try {
        const productEmbedding = await this.createDummyEmbedding('产品 功能 价格 介绍 型号 区别 推荐');
        const productExamples = [
          '这个产品有什么功能？',
          '能介绍下你们的产品吗？',
          '有哪些型号可以选择？',
          '产品多少钱？',
          '这个和那个产品有什么区别？',
          '你们卖什么产品？',
          '最受欢迎的产品是什么？',
          '有什么新产品推荐？'
        ];
        
        // 使用原生SQL插入含embedding字段的数据
        const productIntentId = 'product-inquiry';
        await this.databaseService.$executeRaw`
          INSERT INTO "semantic_intents" (
            "id", "name", "description", "examples", "agent_type", "priority", 
            "embedding", "active", "created_at", "updated_at"
          ) VALUES (
            ${productIntentId}, '产品咨询', '关于产品信息、功能、价格等方面的咨询', 
            ${productExamples}::text[], 'product', 2, 
            ${productEmbedding}::vector, true, now(), now()
          )
        `;

        const appointmentEmbedding = await this.createDummyEmbedding('预约 服务 安装 状态 查询 更改 流程');
        const appointmentExamples = [
          '怎么预约服务？',
          '我想预约一次上门安装',
          '能帮我查一下预约状态吗？',
          '预约需要准备什么材料？',
          '可以更改预约时间吗？',
          '想取消之前的预约',
          '上门服务怎么预约？',
          '预约流程是什么样的？'
        ];
        
        // 使用原生SQL插入含embedding字段的数据
        const appointmentIntentId = 'appointment-inquiry';
        await this.databaseService.$executeRaw`
          INSERT INTO "semantic_intents" (
            "id", "name", "description", "examples", "agent_type", "priority", 
            "embedding", "active", "created_at", "updated_at"
          ) VALUES (
            ${appointmentIntentId}, '预约咨询', '关于服务预约、预约状态查询等方面的咨询', 
            ${appointmentExamples}::text[], 'appointment', 2, 
            ${appointmentEmbedding}::vector, true, now(), now()
          )
        `;

        const generalEmbedding = await this.createDummyEmbedding('你好 帮助 联系 客服');
        const generalExamples = [
          '你好',
          '有人在吗',
          '我需要帮助',
          '联系方式是什么'
        ];
        
        // 使用原生SQL插入含embedding字段的数据
        const generalIntentId = 'general-inquiry';
        await this.databaseService.$executeRaw`
          INSERT INTO "semantic_intents" (
            "id", "name", "description", "examples", "agent_type", "priority", 
            "embedding", "active", "created_at", "updated_at"
          ) VALUES (
            ${generalIntentId}, '一般咨询', '一般性问候和咨询', 
            ${generalExamples}::text[], 'general', 1, 
            ${generalEmbedding}::vector, true, now(), now()
          )
        `;
        
        console.log('成功创建默认意图');
      } catch (error) {
        console.error('创建默认意图失败:', error);
      }
    }
  }

  // 创建一个1536维度的嵌入向量
  private async createDummyEmbedding(text: string): Promise<number[]> {
    try {
      // 尝试使用嵌入服务生成嵌入，嵌入服务已经处理了维度调整
      return await this.embeddingService.getEmbedding(text);
    } catch (e) {
      // 如果失败，创建一个随机向量
      console.warn('无法生成嵌入，使用随机向量');
      // 创建一个1536维度的随机向量
      return Array(1536).fill(0).map(() => Math.random() * 2 - 1);
    }
  }

  async analyzeIntent(userMessage: string) {
    // 1. 获取消息嵌入
    const messageEmbedding = await this.embeddingService.getEmbedding(userMessage);
    
    // 2. 从数据库获取所有活跃的意图
    const intents = await this.databaseService.semanticIntent.findMany({
      where: {
        active: true,
      },
    }).catch(() => []);
    
    // 3. 如果没有预定义意图，返回默认意图
    if (intents.length === 0) {
      return {
        name: 'general_inquiry',
        agentType: 'general',
        confidence: 1.0,
      };
    }
    
    // 4. 使用简单的关键词匹配
    let bestMatch = null;
    let highestScore = -1;
    
    for (const intent of intents) {
      // 计算简单的词汇重合度
      const examples = intent.examples.join(' ').toLowerCase();
      const message = userMessage.toLowerCase();
      let score = 0;
      
      const messageWords = message.split(/\s+/);
      const exampleWords = examples.split(/\s+/);
      
      for (const word of messageWords) {
        if (word.length > 1 && exampleWords.includes(word)) {
          score += 1;
        }
      }
      
      // 归一化评分
      const normalizedScore = score / Math.max(1, messageWords.length);
      
      if (normalizedScore > highestScore) {
        highestScore = normalizedScore;
        bestMatch = intent;
      }
    }
    
    // 5. 如果没有找到合适的匹配，或相似度低于阈值，返回默认意图
    if (!bestMatch || highestScore < 0.1) {
      return {
        name: 'general_inquiry',
        agentType: 'general',
        confidence: highestScore > 0 ? highestScore : 0.5,
      };
    }
    
    return {
      name: bestMatch.name,
      agentType: bestMatch.agentType,
      confidence: highestScore,
    };
  }
  
  // 简化的相似度计算函数
  private calculateSimpleSimilarity(message: string, examples: string[]): number {
    const messageWords = new Set(message.toLowerCase().split(/\s+/));
    let matchCount = 0;
    let totalWords = 0;
    
    for (const example of examples) {
      const exampleWords = example.toLowerCase().split(/\s+/);
      totalWords += exampleWords.length;
      
      for (const word of exampleWords) {
        if (messageWords.has(word)) {
          matchCount++;
        }
      }
    }
    
    return matchCount / Math.max(1, totalWords);
  }
} 