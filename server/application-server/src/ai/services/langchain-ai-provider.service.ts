import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UniversalAIService, ModelProvider, UniversalAIOptions } from './universal-ai.service';
import { ChatMessage, AIResponse } from '../interfaces/ai.interface';

export interface LangChainAIOptions {
  provider?: ModelProvider;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  useAnalysisModel?: boolean;
  fastMode?: boolean;
  systemPrompt?: string;
  fallbackProviders?: ModelProvider[];
}

@Injectable()
export class LangChainAIProviderService {
  private readonly logger = new Logger(LangChainAIProviderService.name);
  private readonly defaultFallbackOrder: ModelProvider[] = ['ollama', 'openai', 'custom-api'];

  constructor(
    private readonly configService: ConfigService,
    private readonly universalAI: UniversalAIService,
  ) {
    this.logger.log('LangChain AI Provider 服务初始化完成');
  }

  /**
   * 智能对话 - 支持自动降级
   */
  async chat(
    messages: ChatMessage[],
    options: LangChainAIOptions = {},
  ): Promise<AIResponse> {
    const providers = this.getProviderOrder(options);
    let lastError: Error;

    for (const provider of providers) {
      try {
        this.logger.debug(`尝试使用 ${provider} 进行对话`);
        
        const universalOptions: UniversalAIOptions = {
          ...options,
          provider,
        };

        const response = await this.universalAI.chat(messages, universalOptions);
        
        this.logger.debug(`${provider} 对话成功`);
        return response;
        
      } catch (error) {
        lastError = error;
        this.logger.warn(`${provider} 对话失败: ${error.message}`);
        
        // 如果不是最后一个provider，继续尝试下一个
        if (provider !== providers[providers.length - 1]) {
          continue;
        }
      }
    }

    // 所有provider都失败了
    this.logger.error(`所有AI服务都不可用: ${lastError?.message}`);
    throw new Error(`AI服务暂时不可用: ${lastError?.message}`);
  }

  /**
   * 生成文本完成 - 支持自动降级
   */
  async generateCompletion(
    prompt: string,
    options: LangChainAIOptions = {},
  ): Promise<string> {
    const providers = this.getProviderOrder(options);
    let lastError: Error;

    for (const provider of providers) {
      try {
        this.logger.debug(`尝试使用 ${provider} 生成文本`);
        
        const universalOptions: UniversalAIOptions = {
          ...options,
          provider,
        };

        const result = await this.universalAI.generateCompletion(prompt, universalOptions);
        
        this.logger.debug(`${provider} 生成成功`);
        return result;
        
      } catch (error) {
        lastError = error;
        this.logger.warn(`${provider} 生成失败: ${error.message}`);
        
        if (provider !== providers[providers.length - 1]) {
          continue;
        }
      }
    }

    this.logger.error(`所有AI服务都不可用: ${lastError?.message}`);
    throw new Error(`AI服务暂时不可用: ${lastError?.message}`);
  }

  /**
   * 批量处理
   */
  async batchProcess(
    prompts: string[],
    options: LangChainAIOptions = {},
  ): Promise<string[]> {
    const provider = this.getPrimaryProvider(options);
    
    try {
      const universalOptions: UniversalAIOptions = {
        ...options,
        provider,
      };

      return await this.universalAI.batchProcess(prompts, universalOptions);
    } catch (error) {
      this.logger.warn(`批量处理失败，尝试逐个处理: ${error.message}`);
      
      // 降级到逐个处理
      const results: string[] = [];
      for (const prompt of prompts) {
        try {
          const result = await this.generateCompletion(prompt, options);
          results.push(result);
        } catch (err) {
          results.push(`处理失败: ${err.message}`);
        }
      }
      return results;
    }
  }

  /**
   * 流式对话
   */
  async streamChat(
    messages: ChatMessage[],
    options: LangChainAIOptions = {},
  ): Promise<AsyncIterable<string>> {
    const provider = this.getPrimaryProvider(options);
    
    const universalOptions: UniversalAIOptions = {
      ...options,
      provider,
    };

    try {
      return await this.universalAI.streamChat(messages, universalOptions);
    } catch (error) {
      this.logger.error(`流式对话失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 健康检查所有可用的服务
   */
  async healthCheck(): Promise<{
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: Array<{
      provider: ModelProvider;
      status: 'healthy' | 'unhealthy';
      latency?: number;
      error?: string;
    }>;
  }> {
    const services = [];
    let healthyCount = 0;

    for (const provider of this.defaultFallbackOrder) {
      try {
        const health = await this.universalAI.healthCheck(provider);
        services.push({
          provider,
          status: health.status,
          latency: health.latency,
          error: health.error,
        });
        
        if (health.status === 'healthy') {
          healthyCount++;
        }
      } catch (error) {
        services.push({
          provider,
          status: 'unhealthy' as const,
          error: error.message,
        });
      }
    }

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === services.length) {
      overall = 'healthy';
    } else if (healthyCount > 0) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    return { overall, services };
  }

  /**
   * 获取可用模型列表
   */
  async getAvailableModels(provider?: ModelProvider): Promise<{
    [key in ModelProvider]?: string[];
  }> {
    const results: { [key in ModelProvider]?: string[] } = {};
    
    const providersToCheck = provider ? [provider] : this.defaultFallbackOrder;
    
    for (const p of providersToCheck) {
      try {
        const models = await this.universalAI.getAvailableModels(p);
        results[p] = models;
      } catch (error) {
        this.logger.warn(`获取 ${p} 模型列表失败: ${error.message}`);
        results[p] = [];
      }
    }

    return results;
  }

  /**
   * 动态切换模型
   */
  async switchModel(provider: ModelProvider, modelName: string): Promise<void> {
    await this.universalAI.switchModel(provider, modelName);
    this.logger.log(`已切换到 ${provider}:${modelName}`);
  }

  /**
   * 获取智能推荐的模型配置
   */
  getRecommendedConfig(scenario: 'chat' | 'analysis' | 'fast' | 'creative'): LangChainAIOptions {
    const baseConfig: LangChainAIOptions = {
      provider: this.getPrimaryProvider(),
    };

    switch (scenario) {
      case 'chat':
        return {
          ...baseConfig,
          temperature: 0.7,
          maxTokens: 2000,
        };
        
      case 'analysis':
        return {
          ...baseConfig,
          useAnalysisModel: true,
          temperature: 0.3,
          maxTokens: 4000,
        };
        
      case 'fast':
        return {
          ...baseConfig,
          fastMode: true,
          temperature: 0.5,
          maxTokens: 1000,
        };
        
      case 'creative':
        return {
          ...baseConfig,
          temperature: 0.9,
          maxTokens: 3000,
        };
        
      default:
        return baseConfig;
    }
  }

  /**
   * 获取服务统计信息
   */
  getStats(): Record<string, any> {
    return {
      primaryProvider: this.getPrimaryProvider(),
      fallbackOrder: this.defaultFallbackOrder,
      universalAIStats: this.universalAI.getModelStats(),
    };
  }

  // 私有方法

  private getPrimaryProvider(options?: LangChainAIOptions): ModelProvider {
    return options?.provider || 
           this.configService.get<ModelProvider>('ai.aiProvider') || 
           'ollama';
  }

  private getProviderOrder(options: LangChainAIOptions): ModelProvider[] {
    const primary = this.getPrimaryProvider(options);
    
    if (options.fallbackProviders) {
      return [primary, ...options.fallbackProviders];
    }
    
    // 默认降级顺序：将主要provider移到前面
    const fallbackOrder = [...this.defaultFallbackOrder];
    const primaryIndex = fallbackOrder.indexOf(primary);
    
    if (primaryIndex > 0) {
      fallbackOrder.splice(primaryIndex, 1);
      fallbackOrder.unshift(primary);
    }
    
    return fallbackOrder;
  }

  /**
   * 根据场景自动选择最佳provider
   */
  private getBestProviderForScenario(scenario: string): ModelProvider {
    switch (scenario) {
      case 'local-priority':
        return 'ollama';
      case 'cloud-priority':
        return 'openai';
      case 'cost-effective':
        return 'custom-api';
      default:
        return this.getPrimaryProvider();
    }
  }
} 