import { Injectable, Logger } from '@nestjs/common';
import { MoonshotService } from './moonshot.service';
import {
  PromptOptimizationRequest,
  PromptOptimizationResponse,
  QualityScore,
  PromptAnalysis,
  OptimizationType,
} from '../interfaces/ai.interface';
import { PROMPT_TEMPLATES } from '../constants/prompt-templates';

@Injectable()
export class PromptOptimizationService {
  private readonly logger = new Logger(PromptOptimizationService.name);

  constructor(private readonly moonshotService: MoonshotService) {}

  async optimizePrompt(request: PromptOptimizationRequest): Promise<PromptOptimizationResponse> {
    try {
      this.logger.debug(`开始优化提示词，类型: ${request.optimizationType}`);

      // 选择合适的优化模板
      const template = this.getOptimizationTemplate(request.optimizationType, request.domain);
      
      // 构建优化提示词
      const optimizationPrompt = this.buildOptimizationPrompt(template, request);
      
      // 调用AI进行优化
      const optimizedContent = await this.moonshotService.generateCompletion(optimizationPrompt, {
        temperature: 0.3, // 较低的温度确保一致性
        maxTokens: 3000,
      });

      // 解析优化结果
      const parsedResult = this.parseOptimizationResult(optimizedContent);
      
      // 分析原始提示词质量
      const originalAnalysis = this.analyzePrompt(request.originalPrompt);
      
      // 分析优化后提示词质量
      const optimizedAnalysis = this.analyzePrompt(parsedResult.optimizedPrompt);
      
      // 计算质量评分
      const qualityScore = this.calculateQualityScore(originalAnalysis, optimizedAnalysis);

      return {
        optimizedPrompt: parsedResult.optimizedPrompt,
        optimizationExplanation: parsedResult.explanation,
        expectedEffects: parsedResult.expectedEffects,
        qualityScore,
        suggestions: this.generateSuggestions(optimizedAnalysis),
      };
    } catch (error) {
      this.logger.error('提示词优化失败:', error);
      throw error;
    }
  }

  async batchOptimize(prompts: string[], optimizationType: OptimizationType, domain?: string): Promise<PromptOptimizationResponse[]> {
    const results: PromptOptimizationResponse[] = [];
    
    for (const prompt of prompts) {
      try {
        const result = await this.optimizePrompt({
          originalPrompt: prompt,
          optimizationType,
          domain,
        });
        results.push(result);
      } catch (error) {
        this.logger.error(`批量优化失败，提示词: ${prompt.substring(0, 50)}...`, error);
        // 继续处理其他提示词
      }
    }
    
    return results;
  }

  analyzePrompt(prompt: string): PromptAnalysis {
    const words = prompt.split(/\s+/).filter(word => word.length > 0);
    const sentences = prompt.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    
    // 计算复杂度
    const avgWordsPerSentence = words.length / Math.max(sentences.length, 1);
    let complexity: 'low' | 'medium' | 'high' = 'low';
    if (avgWordsPerSentence > 20) complexity = 'high';
    else if (avgWordsPerSentence > 10) complexity = 'medium';

    // 分析清晰度（基于关键词和结构）
    const clarityScore = this.calculateClarityScore(prompt);
    
    // 分析结构
    const structure = this.analyzeStructure(prompt);
    
    // 识别缺失元素
    const missingElements = this.identifyMissingElements(prompt);
    
    // 识别优势
    const strengths = this.identifyStrengths(prompt);
    
    // 识别弱点
    const weaknesses = this.identifyWeaknesses(prompt);

    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      complexity,
      clarity: clarityScore,
      structure,
      missingElements,
      strengths,
      weaknesses,
    };
  }

  private getOptimizationTemplate(type: OptimizationType, domain?: string): string {
    switch (type) {
      case 'basic':
        return PROMPT_TEMPLATES.BASIC_OPTIMIZATION;
      case 'role-based':
        return PROMPT_TEMPLATES.ROLE_BASED_OPTIMIZATION;
      case 'few-shot':
        return PROMPT_TEMPLATES.FEW_SHOT_OPTIMIZATION;
      case 'chain-of-thought':
        return PROMPT_TEMPLATES.CHAIN_OF_THOUGHT_OPTIMIZATION;
      case 'domain-specific':
        return PROMPT_TEMPLATES.DOMAIN_SPECIFIC_OPTIMIZATION;
      case 'multimodal':
        return PROMPT_TEMPLATES.MULTIMODAL_OPTIMIZATION;
      default:
        return PROMPT_TEMPLATES.BASIC_OPTIMIZATION;
    }
  }

  private buildOptimizationPrompt(template: string, request: PromptOptimizationRequest): string {
    let prompt = template.replace('{originalPrompt}', request.originalPrompt);
    
    if (request.domain) {
      prompt = prompt.replace('{domain}', request.domain);
    }
    
    if (request.context) {
      prompt += `\n\n## 额外上下文：\n${request.context}`;
    }
    
    if (request.requirements && request.requirements.length > 0) {
      prompt += `\n\n## 特殊要求：\n${request.requirements.map(req => `- ${req}`).join('\n')}`;
    }
    
    return prompt;
  }

  private parseOptimizationResult(content: string): {
    optimizedPrompt: string;
    explanation: string;
    expectedEffects: string;
  } {
    // 解析AI返回的结构化内容
    const optimizedPromptMatch = content.match(/### 优化后的提示词：\s*([\s\S]*?)(?=###|$)/);
    const explanationMatch = content.match(/### 优化说明：\s*([\s\S]*?)(?=###|$)/);
    const effectsMatch = content.match(/### 预期效果：\s*([\s\S]*?)(?=###|$)/);

    return {
      optimizedPrompt: optimizedPromptMatch?.[1]?.trim() || content,
      explanation: explanationMatch?.[1]?.trim() || '优化说明未找到',
      expectedEffects: effectsMatch?.[1]?.trim() || '预期效果未找到',
    };
  }

  private calculateClarityScore(prompt: string): number {
    let score = 5; // 基础分数
    
    // 检查是否有明确的指令词
    const instructionWords = ['请', '帮助', '分析', '生成', '创建', '解释', '总结'];
    if (instructionWords.some(word => prompt.includes(word))) score += 1;
    
    // 检查是否有具体的要求
    if (prompt.includes('要求') || prompt.includes('需要') || prompt.includes('必须')) score += 1;
    
    // 检查是否有示例
    if (prompt.includes('例如') || prompt.includes('比如') || prompt.includes('示例')) score += 1;
    
    // 检查是否有格式要求
    if (prompt.includes('格式') || prompt.includes('输出') || prompt.includes('返回')) score += 1;
    
    // 检查长度合理性
    if (prompt.length > 50 && prompt.length < 1000) score += 1;
    
    return Math.min(score, 10);
  }

  private analyzeStructure(prompt: string): 'poor' | 'fair' | 'good' | 'excellent' {
    let score = 0;
    
    // 检查是否有标题或分段
    if (prompt.includes('#') || prompt.includes('##')) score += 1;
    
    // 检查是否有列表
    if (prompt.includes('-') || prompt.includes('1.') || prompt.includes('•')) score += 1;
    
    // 检查是否有明确的任务描述
    if (prompt.includes('任务') || prompt.includes('目标') || prompt.includes('要求')) score += 1;
    
    // 检查是否有上下文
    if (prompt.includes('背景') || prompt.includes('上下文') || prompt.includes('场景')) score += 1;
    
    if (score >= 3) return 'excellent';
    if (score >= 2) return 'good';
    if (score >= 1) return 'fair';
    return 'poor';
  }

  private identifyMissingElements(prompt: string): string[] {
    const missing: string[] = [];
    
    if (!prompt.includes('角色') && !prompt.includes('你是')) {
      missing.push('角色定义');
    }
    
    if (!prompt.includes('例如') && !prompt.includes('示例')) {
      missing.push('具体示例');
    }
    
    if (!prompt.includes('格式') && !prompt.includes('输出')) {
      missing.push('输出格式要求');
    }
    
    if (!prompt.includes('背景') && !prompt.includes('上下文')) {
      missing.push('背景上下文');
    }
    
    return missing;
  }

  private identifyStrengths(prompt: string): string[] {
    const strengths: string[] = [];
    
    if (prompt.includes('具体') || prompt.includes('详细')) {
      strengths.push('要求具体明确');
    }
    
    if (prompt.includes('步骤') || prompt.includes('流程')) {
      strengths.push('包含步骤指导');
    }
    
    if (prompt.includes('例如') || prompt.includes('示例')) {
      strengths.push('提供了示例');
    }
    
    if (prompt.length > 100) {
      strengths.push('信息充分');
    }
    
    return strengths;
  }

  private identifyWeaknesses(prompt: string): string[] {
    const weaknesses: string[] = [];
    
    if (prompt.length < 20) {
      weaknesses.push('信息过于简单');
    }
    
    if (!prompt.includes('?') && !prompt.includes('请') && !prompt.includes('帮助')) {
      weaknesses.push('缺乏明确指令');
    }
    
    if (prompt.split('.').length < 2) {
      weaknesses.push('结构过于简单');
    }
    
    return weaknesses;
  }

  private calculateQualityScore(original: PromptAnalysis, optimized: PromptAnalysis): QualityScore {
    const clarity = Math.min(optimized.clarity, 10);
    const specificity = Math.min(10 - optimized.missingElements.length, 10);
    const completeness = optimized.wordCount > original.wordCount ? 
      Math.min(8 + (optimized.wordCount - original.wordCount) / 50, 10) : 
      Math.max(optimized.wordCount / original.wordCount * 8, 5);
    const consistency = optimized.structure === 'excellent' ? 10 : 
                       optimized.structure === 'good' ? 8 : 
                       optimized.structure === 'fair' ? 6 : 4;
    const effectiveness = Math.min(optimized.strengths.length * 2, 10);
    
    const overall = (clarity + specificity + completeness + consistency + effectiveness) / 5;
    
    return {
      clarity: Math.round(clarity),
      specificity: Math.round(specificity),
      completeness: Math.round(completeness),
      consistency: Math.round(consistency),
      effectiveness: Math.round(effectiveness),
      overall: Math.round(overall),
    };
  }

  private generateSuggestions(analysis: PromptAnalysis): string[] {
    const suggestions: string[] = [];
    
    if (analysis.missingElements.includes('角色定义')) {
      suggestions.push('建议添加明确的角色定义，如"你是一位专业的..."');
    }
    
    if (analysis.missingElements.includes('具体示例')) {
      suggestions.push('建议添加具体示例来说明期望的输出格式');
    }
    
    if (analysis.clarity < 7) {
      suggestions.push('建议使用更清晰、具体的语言描述需求');
    }
    
    if (analysis.structure === 'poor') {
      suggestions.push('建议使用标题、列表等方式改善提示词结构');
    }
    
    if (analysis.complexity === 'low' && analysis.wordCount < 50) {
      suggestions.push('建议增加更多上下文信息和具体要求');
    }
    
    return suggestions;
  }
} 