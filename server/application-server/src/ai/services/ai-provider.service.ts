import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OllamaService } from './ollama.service';
import { MoonshotService } from './moonshot.service';
import { OllamaUniversalEmbeddingService } from './ollama-universal-embedding.service';
import { EmbeddingService } from './embedding.service';
import { AIResponse, ChatMessage } from '../interfaces/ai.interface';

export type AIProvider = 'ollama' | 'moonshot' | 'openai';

export interface AIProviderConfig {
  primary: AIProvider;
  fallback: AIProvider[];
}

@Injectable()
export class AIProviderService {
  private readonly logger = new Logger(AIProviderService.name);
  private readonly config: AIProviderConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly ollamaService: OllamaService,
    private readonly moonshotService: MoonshotService,
    private readonly ollamaEmbeddingService: OllamaUniversalEmbeddingService,
    private readonly embeddingService: EmbeddingService,
  ) {
    const primaryProvider =
      this.configService.get<AIProvider>('ai.aiProvider') || 'ollama';

    this.config = {
      primary: primaryProvider,
      fallback: this.getFallbackProviders(primaryProvider),
    };

    this.logger.log(
      `AI服务配置: 主要=${this.config.primary}, 备用=${this.config.fallback.join(',')}`,
    );
  }

  async chat(
    messages: ChatMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      useAnalysisModel?: boolean;
      fastMode?: boolean;
      forceProvider?: AIProvider;
    },
  ): Promise<AIResponse> {
    const provider = options?.forceProvider || this.config.primary;

    try {
      switch (provider) {
        case 'ollama':
          return await this.ollamaService.chat(messages, {
            temperature: options?.temperature,
            maxTokens: options?.maxTokens,
            useAnalysisModel: options?.useAnalysisModel,
            fastMode: options?.fastMode,
          });

        case 'moonshot':
          return await this.moonshotService.chat(messages, {
            temperature: options?.temperature,
            maxTokens: options?.maxTokens,
          });

        default:
          throw new Error(`不支持的AI服务提供商: ${provider}`);
      }
    } catch (error) {
      this.logger.warn(`${provider}服务失败，尝试备用服务: ${error.message}`);
      return await this.chatWithFallback(messages, options, provider);
    }
  }

  async generateCompletion(
    prompt: string,
    options?: {
      model?: 'chat' | 'analysis';
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
      forceProvider?: AIProvider;
    },
  ): Promise<string> {
    const provider = options?.forceProvider || this.config.primary;

    try {
      switch (provider) {
        case 'ollama':
          return await this.ollamaService.generateCompletion(prompt, {
            model: options?.model,
            temperature: options?.temperature,
            maxTokens: options?.maxTokens,
            systemPrompt: options?.systemPrompt,
          });

        case 'moonshot':
          return await this.moonshotService.generateCompletion(prompt, {
            temperature: options?.temperature,
            maxTokens: options?.maxTokens,
          });

        default:
          throw new Error(`不支持的AI服务提供商: ${provider}`);
      }
    } catch (error) {
      this.logger.warn(`${provider}生成失败，尝试备用服务: ${error.message}`);
      return await this.generateCompletionWithFallback(
        prompt,
        options,
        provider,
      );
    }
  }

  async generateEmbedding(
    text: string,
    options?: {
      model?: string;
      dimensions?: number;
      forceProvider?: AIProvider;
    },
  ): Promise<{
    vector: number[];
    tokenCount: number;
    model: string;
  }> {
    const provider = options?.forceProvider || this.config.primary;

    try {
      switch (provider) {
        case 'ollama':
          return await this.ollamaEmbeddingService.generateEmbedding(text, {
            model: options?.model,
            dimensions: options?.dimensions,
          });

        case 'openai':
          const result = await this.embeddingService.generateEmbedding(text, {
            model: options?.model,
            dimensions: options?.dimensions,
          });
          return {
            vector: result.vector,
            tokenCount: result.tokenCount,
            model: result.model,
          };

        default:
          throw new Error(`不支持的嵌入服务提供商: ${provider}`);
      }
    } catch (error) {
      this.logger.warn(`${provider}嵌入失败，尝试备用服务: ${error.message}`);
      return await this.generateEmbeddingWithFallback(text, options, provider);
    }
  }

  async generateBatchEmbeddings(
    texts: string[],
    options?: {
      model?: string;
      dimensions?: number;
      forceProvider?: AIProvider;
    },
  ): Promise<
    Array<{
      vector: number[];
      tokenCount: number;
      model: string;
    }>
  > {
    const provider = options?.forceProvider || this.config.primary;

    try {
      switch (provider) {
        case 'ollama':
          return await this.ollamaEmbeddingService.generateBatchEmbeddings(
            texts,
            {
              model: options?.model,
              dimensions: options?.dimensions,
            },
          );

        case 'openai':
          const results = await this.embeddingService.generateBatchEmbeddings(
            texts,
            {
              model: options?.model,
              dimensions: options?.dimensions,
            },
          );
          return results.map((result) => ({
            vector: result.vector,
            tokenCount: result.tokenCount,
            model: result.model,
          }));

        default:
          throw new Error(`不支持的批量嵌入服务提供商: ${provider}`);
      }
    } catch (error) {
      this.logger.warn(
        `${provider}批量嵌入失败，尝试备用服务: ${error.message}`,
      );
      return await this.generateBatchEmbeddingsWithFallback(
        texts,
        options,
        provider,
      );
    }
  }

  /**
   * 获取可用模型列表
   */
  async getAvailableModels(provider?: AIProvider): Promise<string[]> {
    const targetProvider = provider || this.config.primary;
    
    try {
      switch (targetProvider) {
        case 'ollama':
          const models = await this.ollamaService.getModels();
          return models.map(m => m.name);
          
        case 'moonshot':
          return await this.moonshotService.getModels();
          
        default:
          return [];
      }
    } catch (error) {
      this.logger.error(`获取${targetProvider}模型列表失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    primary: { provider: AIProvider; status: 'healthy' | 'unhealthy'; error?: string };
    fallback: Array<{ provider: AIProvider; status: 'healthy' | 'unhealthy'; error?: string }>;
  }> {
    const results = {
      primary: { provider: this.config.primary, status: 'unhealthy' as 'healthy' | 'unhealthy', error: undefined as string | undefined },
      fallback: [] as Array<{ provider: AIProvider; status: 'healthy' | 'unhealthy'; error?: string }>,
    };

    // 检查主要服务
    try {
      await this.checkProviderHealth(this.config.primary);
      results.primary.status = 'healthy';
    } catch (error) {
      results.primary.error = error.message;
    }

    // 检查备用服务
    for (const provider of this.config.fallback) {
      try {
        await this.checkProviderHealth(provider);
        results.fallback.push({ provider, status: 'healthy' });
      } catch (error) {
        results.fallback.push({ provider, status: 'unhealthy', error: error.message });
      }
    }

    return results;
  }

  /**
   * 获取当前配置
   */
  getConfig(): AIProviderConfig {
    return { ...this.config };
  }

  // 私有方法
  
  private getFallbackProviders(primary: AIProvider): AIProvider[] {
    const allProviders: AIProvider[] = ['ollama', 'moonshot', 'openai'];
    return allProviders.filter((p) => p !== primary);
  }

  private async chatWithFallback(
    messages: ChatMessage[],
    options: any,
    failedProvider: AIProvider,
  ): Promise<AIResponse> {
    for (const provider of this.config.fallback) {
      if (provider === failedProvider) continue;
      
      try {
        this.logger.log(`尝试备用服务: ${provider}`);
        return await this.chat(messages, { ...options, forceProvider: provider });
      } catch (error) {
        this.logger.warn(`备用服务${provider}也失败: ${error.message}`);
      }
    }
    
    throw new Error('所有AI服务都不可用');
  }

  private async generateCompletionWithFallback(
    prompt: string,
    options: any,
    failedProvider: AIProvider,
  ): Promise<string> {
    for (const provider of this.config.fallback) {
      if (provider === failedProvider) continue;
      
      try {
        this.logger.log(`尝试备用服务: ${provider}`);
        return await this.generateCompletion(prompt, { ...options, forceProvider: provider });
      } catch (error) {
        this.logger.warn(`备用服务${provider}也失败: ${error.message}`);
      }
    }
    
    throw new Error('所有AI服务都不可用');
  }

  private async generateEmbeddingWithFallback(
    text: string,
    options: any,
    failedProvider: AIProvider,
  ): Promise<{ vector: number[]; tokenCount: number; model: string }> {
    for (const provider of this.config.fallback) {
      if (provider === failedProvider || provider === 'moonshot') continue;
      
      try {
        this.logger.log(`尝试备用嵌入服务: ${provider}`);
        return await this.generateEmbedding(text, { ...options, forceProvider: provider });
      } catch (error) {
        this.logger.warn(`备用嵌入服务${provider}也失败: ${error.message}`);
      }
    }
    
    throw new Error('所有嵌入服务都不可用');
  }

  private async generateBatchEmbeddingsWithFallback(
    texts: string[],
    options: any,
    failedProvider: AIProvider,
  ): Promise<Array<{ vector: number[]; tokenCount: number; model: string }>> {
    for (const provider of this.config.fallback) {
      if (provider === failedProvider || provider === 'moonshot') continue;
      
      try {
        this.logger.log(`尝试备用批量嵌入服务: ${provider}`);
        return await this.generateBatchEmbeddings(texts, { ...options, forceProvider: provider });
      } catch (error) {
        this.logger.warn(`备用批量嵌入服务${provider}也失败: ${error.message}`);
      }
    }
    
    throw new Error('所有批量嵌入服务都不可用');
  }

  private async checkProviderHealth(provider: AIProvider): Promise<void> {
    switch (provider) {
      case 'ollama':
        const ollamaHealth = await this.ollamaService.healthCheck();
        if (ollamaHealth.status === 'unhealthy') {
          throw new Error(ollamaHealth.error || 'Ollama服务不健康');
        }
        break;
        
      case 'moonshot':
        const isValid = await this.moonshotService.validateApiKey();
        if (!isValid) {
          throw new Error('Moonshot API密钥无效');
        }
        break;
        
              case 'openai':
          // OpenAI嵌入服务健康检查 - 尝试生成一个测试嵌入
          try {
            await this.embeddingService.generateEmbedding('health check');
          } catch {
            throw new Error('OpenAI嵌入服务不可用');
          }
          break;
        
      default:
        throw new Error(`未知的服务提供商: ${provider}`);
    }
  }
} 