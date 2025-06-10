import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatOllama } from '@langchain/ollama';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { BaseLanguageModel } from '@langchain/core/language_models/base';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { ChatMessage, AIResponse } from '../interfaces/ai.interface';

export type ModelProvider = 'openai' | 'ollama' | 'custom-api';

export interface ModelConfig {
  provider: ModelProvider;
  modelName: string;
  apiKey?: string;
  baseURL?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: any;
}

export interface UniversalAIOptions {
  provider?: ModelProvider;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  fastMode?: boolean;
  useAnalysisModel?: boolean;
}

@Injectable()
export class UniversalAIService {
  private readonly logger = new Logger(UniversalAIService.name);
  private modelCache = new Map<string, BaseChatModel>();
  private readonly defaultConfig: Record<ModelProvider, ModelConfig>;

  constructor(private readonly configService: ConfigService) {
    // 初始化默认配置
    this.defaultConfig = {
      openai: {
        provider: 'openai',
        modelName: this.configService.get('ai.openaiModel') || 'gpt-3.5-turbo',
        apiKey: this.configService.get('ai.openaiApiKey'),
        baseURL: this.configService.get('ai.openaiBaseUrl'),
        temperature: 0.7,
        maxTokens: 2000,
      },
      ollama: {
        provider: 'ollama',
        modelName: this.configService.get('ai.ollamaChatModel') || 'qwen2.5:14b',
        baseURL: this.configService.get('ai.ollamaBaseUrl') || 'http://localhost:11434',
        temperature: 0.7,
        maxTokens: 2000,
      },
      'custom-api': {
        provider: 'custom-api',
        modelName: this.configService.get('ai.customModel') || 'custom-model',
        apiKey: this.configService.get('ai.customApiKey'),
        baseURL: this.configService.get('ai.customBaseUrl'),
        temperature: 0.7,
        maxTokens: 2000,
      },
    };

    this.logger.log('UniversalAI服务初始化完成');
  }

  /**
   * 通用对话方法
   */
  async chat(
    messages: ChatMessage[],
    options: UniversalAIOptions = {},
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      const model = await this.getModel(options);
      const langchainMessages = this.convertToLangChainMessages(messages, options.systemPrompt);
      
      const response = await model.invoke(langchainMessages);
      
      return {
        content: response.content as string,
        usage: {
          promptTokens: this.estimateTokens(messages.map(m => m.content).join(' ')),
          completionTokens: this.estimateTokens(response.content as string),
          totalTokens: 0, // 会在后面计算
        },
        model: this.getModelIdentifier(options),
        provider: this.getProviderFromOptions(options),
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error(`AI对话失败: ${error.message}`, error.stack);
      throw new Error(`AI服务调用失败: ${error.message}`);
    }
  }

  /**
   * 生成文本完成
   */
  async generateCompletion(
    prompt: string,
    options: UniversalAIOptions = {},
  ): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'user', content: prompt }
    ];

    if (options.systemPrompt) {
      messages.unshift({ role: 'system', content: options.systemPrompt });
    }

    const response = await this.chat(messages, options);
    return response.content;
  }

  /**
   * 批量处理
   */
  async batchProcess(
    prompts: string[],
    options: UniversalAIOptions = {},
  ): Promise<string[]> {
    const results: string[] = [];
    
    // 可以配置并发数量
    const batchSize = 3;
    
    for (let i = 0; i < prompts.length; i += batchSize) {
      const batch = prompts.slice(i, i + batchSize);
      const batchPromises = batch.map(prompt => 
        this.generateCompletion(prompt, options).catch(error => {
          this.logger.warn(`批量处理失败: ${error.message}`);
          return `处理失败: ${error.message}`;
        })
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * 流式对话（如果支持）
   */
  async streamChat(
    messages: ChatMessage[],
    options: UniversalAIOptions = {},
  ): Promise<AsyncIterable<string>> {
    const model = await this.getModel(options);
    const langchainMessages = this.convertToLangChainMessages(messages, options.systemPrompt);
    
    try {
      const stream = await model.stream(langchainMessages);
      
      return (async function* () {
        for await (const chunk of stream) {
          if (chunk.content) {
            yield chunk.content as string;
          }
        }
      })();
    } catch (error) {
      this.logger.error(`流式对话失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(provider?: ModelProvider): Promise<{
    status: 'healthy' | 'unhealthy';
    provider: ModelProvider;
    model: string;
    latency?: number;
    error?: string;
  }> {
    const targetProvider = provider || this.getDefaultProvider();
    const startTime = Date.now();

    try {
      const testMessage = 'Hello, this is a health check.';
      await this.generateCompletion(testMessage, { 
        provider: targetProvider,
        maxTokens: 10 
      });

      return {
        status: 'healthy',
        provider: targetProvider,
        model: this.defaultConfig[targetProvider].modelName,
        latency: Date.now() - startTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        provider: targetProvider,
        model: this.defaultConfig[targetProvider].modelName,
        error: error.message,
      };
    }
  }

  /**
   * 获取可用模型列表
   */
  async getAvailableModels(provider?: ModelProvider): Promise<string[]> {
    const targetProvider = provider || this.getDefaultProvider();
    
    switch (targetProvider) {
      case 'ollama':
        return this.getOllamaModels();
      case 'openai':
        return this.getOpenAIModels();
      case 'custom-api':
        return this.getCustomAPIModels();
      default:
        return [];
    }
  }

  /**
   * 动态切换模型
   */
  async switchModel(provider: ModelProvider, modelName: string): Promise<void> {
    const cacheKey = `${provider}:${modelName}`;
    
    // 清除旧的缓存
    this.modelCache.delete(cacheKey);
    
    // 更新配置
    this.defaultConfig[provider].modelName = modelName;
    
    this.logger.log(`切换到模型: ${provider}:${modelName}`);
  }

  /**
   * 获取模型使用统计
   */
  getModelStats(): Record<string, any> {
    return {
      cachedModels: Array.from(this.modelCache.keys()),
      defaultProvider: this.getDefaultProvider(),
      availableProviders: Object.keys(this.defaultConfig),
    };
  }

  // 私有方法

  private async getModel(options: UniversalAIOptions = {}): Promise<BaseChatModel> {
    const provider = options.provider || this.getDefaultProvider();
    const modelName = options.modelName || this.getDefaultModelName(provider, options);
    const cacheKey = `${provider}:${modelName}`;

    // 从缓存获取
    if (this.modelCache.has(cacheKey)) {
      return this.modelCache.get(cacheKey)!;
    }

    // 创建新模型实例
    const model = await this.createModel(provider, modelName, options);
    this.modelCache.set(cacheKey, model);
    
    return model;
  }

  private async createModel(
    provider: ModelProvider,
    modelName: string,
    options: UniversalAIOptions,
  ): Promise<BaseChatModel> {
    const config = { ...this.defaultConfig[provider] };
    
    // 合并选项
    if (options.temperature !== undefined) config.temperature = options.temperature;
    if (options.maxTokens !== undefined) config.maxTokens = options.maxTokens;

    switch (provider) {
      case 'openai':
        return new ChatOpenAI({
          modelName: modelName,
          openAIApiKey: config.apiKey,
          configuration: {
            baseURL: config.baseURL,
          },
          temperature: config.temperature,
          maxTokens: config.maxTokens,
        });

      case 'ollama':
        return new ChatOllama({
          model: modelName,
          baseUrl: config.baseURL,
          temperature: config.temperature,
          numPredict: config.maxTokens,
        });

      case 'custom-api':
        // 对于自定义API，可以使用OpenAI兼容的接口
        return new ChatOpenAI({
          modelName: modelName,
          openAIApiKey: config.apiKey || 'custom-key',
          configuration: {
            baseURL: config.baseURL,
          },
          temperature: config.temperature,
          maxTokens: config.maxTokens,
        });

      default:
        throw new Error(`不支持的模型提供商: ${provider}`);
    }
  }

  private convertToLangChainMessages(
    messages: ChatMessage[],
    systemPrompt?: string,
  ) {
    const langchainMessages = [];

    // 添加系统提示词
    if (systemPrompt) {
      langchainMessages.push(new SystemMessage(systemPrompt));
    }

    // 转换消息
    for (const message of messages) {
      switch (message.role) {
        case 'system':
          if (!systemPrompt) { // 避免重复添加系统消息
            langchainMessages.push(new SystemMessage(message.content));
          }
          break;
        case 'user':
          langchainMessages.push(new HumanMessage(message.content));
          break;
        case 'assistant':
          langchainMessages.push(new AIMessage(message.content));
          break;
      }
    }

    return langchainMessages;
  }

  private getDefaultProvider(): ModelProvider {
    return this.configService.get('ai.aiProvider') || 'ollama';
  }

  private getDefaultModelName(provider: ModelProvider, options: UniversalAIOptions): string {
    // 根据选项选择特定的模型
    if (options.fastMode) {
      switch (provider) {
        case 'ollama':
          return this.configService.get('ai.ollamaFastModel') || 'qwen2.5:7b';
        case 'openai':
          return 'gpt-3.5-turbo';
        default:
          return this.defaultConfig[provider].modelName;
      }
    }

    if (options.useAnalysisModel) {
      switch (provider) {
        case 'ollama':
          return this.configService.get('ai.ollamaAnalysisModel') || 'deepseek-coder:6.7b';
        case 'openai':
          return 'gpt-4';
        default:
          return this.defaultConfig[provider].modelName;
      }
    }

    return this.defaultConfig[provider].modelName;
  }

  private getProviderFromOptions(options: UniversalAIOptions): string {
    return options.provider || this.getDefaultProvider();
  }

  private getModelIdentifier(options: UniversalAIOptions): string {
    const provider = this.getProviderFromOptions(options);
    const modelName = options.modelName || this.getDefaultModelName(provider as ModelProvider, options);
    return `${provider}:${modelName}`;
  }

  private estimateTokens(text: string): number {
    // 简单的token估算
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const englishWords = text.split(/\s+/).filter(word => /[a-zA-Z]/.test(word)).length;
    return Math.ceil(chineseChars * 1.5 + englishWords);
  }

  private async getOllamaModels(): Promise<string[]> {
    try {
      const baseUrl = this.configService.get('ai.ollamaBaseUrl') || 'http://localhost:11434';
      const response = await fetch(`${baseUrl}/api/tags`);
      const data = await response.json();
      return data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      this.logger.warn(`获取Ollama模型列表失败: ${error.message}`);
      return [];
    }
  }

  private getOpenAIModels(): string[] {
    // OpenAI常用模型列表
    return [
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
    ];
  }

  private getCustomAPIModels(): string[] {
    // 可以从配置或API获取
    const customModels = this.configService.get('ai.customModels');
    return customModels ? customModels.split(',') : [];
  }
} 