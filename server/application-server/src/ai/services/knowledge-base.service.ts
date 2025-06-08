import { Injectable, Logger } from '@nestjs/common';
import { KnowledgeBase } from '../interfaces/ai.interface';

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);
  private readonly knowledgeBase = new Map<string, KnowledgeBase>();

  constructor() {
    this.initializeDefaultKnowledge();
  }

  private initializeDefaultKnowledge() {
    // 初始化谷歌提示工程白皮书相关知识
    this.addKnowledge({
      id: 'google-prompt-engineering',
      title: '谷歌提示工程白皮书核心原则',
      content: `
# 谷歌提示工程白皮书核心原则

## 1. 明确性原则 (Clarity)
- 使用清晰、具体的语言
- 避免模糊和歧义的表达
- 明确指定任务目标和期望输出

## 2. 上下文原则 (Context)
- 提供充分的背景信息
- 包含相关的领域知识
- 设定适当的场景和约束条件

## 3. 结构化原则 (Structure)
- 使用逻辑清晰的格式
- 采用分层次的信息组织
- 利用标题、列表等结构化元素

## 4. 示例驱动原则 (Example-driven)
- 提供高质量的输入输出示例
- 使用Few-shot学习技术
- 展示期望的格式和风格

## 5. 迭代优化原则 (Iterative)
- 基于结果反馈进行调整
- 持续改进提示词质量
- 测试不同的表达方式

## 6. 角色定义原则 (Role Definition)
- 为AI明确定义角色和专业背景
- 设定工作方式和行为准则
- 建立专业权威性
      `,
      category: '提示工程',
      tags: ['谷歌', '白皮书', '核心原则', '最佳实践'],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
    });

    // 添加提示词优化技巧
    this.addKnowledge({
      id: 'prompt-optimization-techniques',
      title: '提示词优化技巧集合',
      content: `
# 提示词优化技巧集合

## Chain-of-Thought (思维链) 技巧
- 要求AI展示推理步骤
- 使用"让我们一步步思考"等引导语
- 适用于复杂问题解决

## Few-shot Learning 技巧
- 提供2-3个高质量示例
- 示例要涵盖不同场景
- 保持输入输出格式一致

## 角色扮演技巧
- 定义专业角色身份
- 设定专业背景和经验
- 明确工作风格和方法

## 约束条件技巧
- 明确输出格式要求
- 设定长度和结构限制
- 指定禁止的内容类型

## 上下文增强技巧
- 提供相关背景信息
- 包含领域特定知识
- 设定使用场景
      `,
      category: '优化技巧',
      tags: ['技巧', '方法', '实践'],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
    });

    // 添加AI工具集合知识
    this.addKnowledge({
      id: 'ai-tools-collection',
      title: 'AI工具集合与应用场景',
      content: `
# AI工具集合与应用场景

## 文本生成工具
- GPT系列：通用文本生成
- Claude：长文本理解和生成
- Moonshot：中文优化的对话模型

## 代码生成工具
- GitHub Copilot：代码补全
- CodeT5：代码理解和生成
- Codex：自然语言转代码

## 图像生成工具
- DALL-E：文本到图像
- Midjourney：艺术风格图像
- Stable Diffusion：开源图像生成

## 多模态工具
- GPT-4V：图像理解
- CLIP：图像文本匹配
- BLIP：图像描述生成

## 专业领域工具
- AlphaCode：编程竞赛
- Copilot for Science：科学研究
- Med-PaLM：医疗领域
      `,
      category: 'AI工具',
      tags: ['工具', '应用', '场景'],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0',
    });
  }

  addKnowledge(knowledge: KnowledgeBase): void {
    this.knowledgeBase.set(knowledge.id, knowledge);
    this.logger.debug(`添加知识条目: ${knowledge.title}`);
  }

  getKnowledge(id: string): KnowledgeBase | undefined {
    return this.knowledgeBase.get(id);
  }

  getAllKnowledge(): KnowledgeBase[] {
    return Array.from(this.knowledgeBase.values());
  }

  searchKnowledge(query: string): KnowledgeBase[] {
    const results: KnowledgeBase[] = [];
    const queryLower = query.toLowerCase();

    for (const knowledge of this.knowledgeBase.values()) {
      if (
        knowledge.title.toLowerCase().includes(queryLower) ||
        knowledge.content.toLowerCase().includes(queryLower) ||
        knowledge.tags.some(tag => tag.toLowerCase().includes(queryLower)) ||
        knowledge.category.toLowerCase().includes(queryLower)
      ) {
        results.push(knowledge);
      }
    }

    return results;
  }

  getKnowledgeByCategory(category: string): KnowledgeBase[] {
    return Array.from(this.knowledgeBase.values())
      .filter(knowledge => knowledge.category === category);
  }

  getKnowledgeByTags(tags: string[]): KnowledgeBase[] {
    return Array.from(this.knowledgeBase.values())
      .filter(knowledge => 
        tags.some(tag => knowledge.tags.includes(tag))
      );
  }

  updateKnowledge(id: string, updates: Partial<KnowledgeBase>): boolean {
    const existing = this.knowledgeBase.get(id);
    if (!existing) {
      return false;
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    this.knowledgeBase.set(id, updated);
    this.logger.debug(`更新知识条目: ${updated.title}`);
    return true;
  }

  deleteKnowledge(id: string): boolean {
    const deleted = this.knowledgeBase.delete(id);
    if (deleted) {
      this.logger.debug(`删除知识条目: ${id}`);
    }
    return deleted;
  }

  getRelevantKnowledge(prompt: string, maxResults: number = 3): KnowledgeBase[] {
    // 简单的相关性匹配算法
    const results = this.searchKnowledge(prompt);
    
    // 按相关性排序（这里使用简单的匹配度计算）
    results.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(prompt, a);
      const scoreB = this.calculateRelevanceScore(prompt, b);
      return scoreB - scoreA;
    });

    return results.slice(0, maxResults);
  }

  private calculateRelevanceScore(query: string, knowledge: KnowledgeBase): number {
    let score = 0;
    const queryLower = query.toLowerCase();
    const titleLower = knowledge.title.toLowerCase();
    const contentLower = knowledge.content.toLowerCase();

    // 标题匹配权重更高
    if (titleLower.includes(queryLower)) score += 10;
    
    // 标签匹配
    knowledge.tags.forEach(tag => {
      if (tag.toLowerCase().includes(queryLower)) score += 5;
    });

    // 内容匹配
    const contentMatches = (contentLower.match(new RegExp(queryLower, 'g')) || []).length;
    score += contentMatches;

    return score;
  }

  exportKnowledge(): string {
    const data = Array.from(this.knowledgeBase.values());
    return JSON.stringify(data, null, 2);
  }

  importKnowledge(jsonData: string): number {
    try {
      const data: KnowledgeBase[] = JSON.parse(jsonData);
      let imported = 0;

      data.forEach(knowledge => {
        this.addKnowledge(knowledge);
        imported++;
      });

      this.logger.log(`成功导入 ${imported} 条知识条目`);
      return imported;
    } catch (error) {
      this.logger.error('导入知识失败:', error);
      return 0;
    }
  }

  getStatistics(): {
    totalKnowledge: number;
    categories: Record<string, number>;
    tags: Record<string, number>;
  } {
    const knowledge = Array.from(this.knowledgeBase.values());
    const categories: Record<string, number> = {};
    const tags: Record<string, number> = {};

    knowledge.forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + 1;
      
      item.tags.forEach(tag => {
        tags[tag] = (tags[tag] || 0) + 1;
      });
    });

    return {
      totalKnowledge: knowledge.length,
      categories,
      tags,
    };
  }
} 