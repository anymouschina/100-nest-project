import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { AIResponse, ChatMessage } from '../interfaces/ai.interface';

export interface OllamaModel {
  name: string;
  size: string;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
  modified_at: string;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  system?: string;
  template?: string;
  context?: number[];
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    repeat_penalty?: number;
    seed?: number;
    num_predict?: number;
    stop?: string[];
  };
  stream?: boolean;
}

export interface OllamaEmbedRequest {
  model: string;
  prompt: string;
}

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly httpClient: AxiosInstance;
  private readonly baseUrl: string;
  
  // 模型配置
  private readonly models = {
    chat: {
      primary: 'qwen2.5:14b', // 主要对话模型
      fast: 'qwen2.5:7b', // 快速响应模型
    },
    analysis: {
      code: 'deepseek-coder:6.7b', // 代码分析模型
      log: 'deepseek-coder:6.7b', // 日志分析模型
    },
    embedding: 'nomic-embed-text', // 向量嵌入模型
  };

  constructor(private configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('ai.ollamaBaseUrl') ||
      'http://localhost:11434';

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 120000, // 2分钟超时，本地模型可能较慢
    });

    this.setupInterceptors();
    this.checkOllamaStatus();
  }

  private setupInterceptors() {
    this.httpClient.interceptors.request.use(
      (config) => {
        this.logger.debug(`发送Ollama请求到: ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('Ollama请求拦截器错误:', error);
        return Promise.reject(error);
      },
    );

    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.debug(`Ollama响应: ${response.status}`);
        return response;
      },
      (error) => {
        this.logger.error('Ollama响应错误:', error.response?.data || error.message);
        return Promise.reject(error);
      },
    );
  }

  /**
   * 检查Ollama服务状态
   */
  private async checkOllamaStatus(): Promise<void> {
    try {
      await this.httpClient.get('/api/tags');
      this.logger.log('Ollama服务连接成功');
    } catch (error) {
      this.logger.warn('Ollama服务连接失败，请确保Ollama正在运行', error.message);
    }
  }

  /**
   * 智能对话
   */
  async chat(
    messages: ChatMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      useAnalysisModel?: boolean; // 是否使用分析模型
      fastMode?: boolean; // 是否使用快速模式
    },
  ): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // 选择合适的模型
      let model = this.models.chat.primary;
      if (options?.fastMode) {
        model = this.models.chat.fast;
      } else if (options?.useAnalysisModel) {
        model = this.models.analysis.code;
      }

      // 构建对话上下文
      const systemMessage = messages.find(m => m.role === 'system')?.content || '';
      const userMessages = messages.filter(m => m.role !== 'system');
      
      // 构建完整的prompt
      let prompt = '';
      for (const message of userMessages) {
        if (message.role === 'user') {
          prompt += `Human: ${message.content}\n`;
        } else if (message.role === 'assistant') {
          prompt += `Assistant: ${message.content}\n`;
        }
      }
      prompt += 'Assistant: ';

      const requestData: OllamaGenerateRequest = {
        model,
        prompt,
        system: systemMessage,
        options: {
          temperature: options?.temperature || 0.7,
          num_predict: options?.maxTokens || 2000,
          top_p: 0.9,
          repeat_penalty: 1.1,
        },
        stream: false,
      };

      this.logger.debug(`使用模型: ${model}`, { prompt: prompt.substring(0, 100) + '...' });

      const response = await this.httpClient.post('/api/generate', requestData);
      const processingTime = Date.now() - startTime;

      this.logger.debug(`模型响应完成，耗时: ${processingTime}ms`);

      return {
        content: response.data.response,
        usage: {
          promptTokens: this.estimateTokens(prompt),
          completionTokens: this.estimateTokens(response.data.response),
          totalTokens: this.estimateTokens(prompt + response.data.response),
        },
        model,
        finishReason: response.data.done ? 'stop' : 'length',
      };

    } catch (error) {
      this.logger.error('Ollama聊天请求失败:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 生成文本完成
   */
  async generateCompletion(
    prompt: string,
    options?: {
      model?: 'chat' | 'analysis';
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    },
  ): Promise<string> {
    const modelType = options?.model || 'chat';
    const model = modelType === 'analysis' 
      ? this.models.analysis.code 
      : this.models.chat.primary;

    const requestData: OllamaGenerateRequest = {
      model,
      prompt,
      system: options?.systemPrompt,
      options: {
        temperature: options?.temperature || 0.7,
        num_predict: options?.maxTokens || 1000,
      },
      stream: false,
    };

    try {
      const response = await this.httpClient.post('/api/generate', requestData);
      return response.data.response;
    } catch (error) {
      this.logger.error('Ollama生成完成失败:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 生成向量嵌入
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const requestData: OllamaEmbedRequest = {
        model: this.models.embedding,
        prompt: text,
      };

      const response = await this.httpClient.post('/api/embeddings', requestData);
      return response.data.embedding;
    } catch (error) {
      this.logger.error('Ollama向量生成失败:', error);
      throw this.handleError(error);
    }
  }

  /**
   * 批量生成向量嵌入
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    
    // 并发控制，避免同时请求过多
    const batchSize = 5;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchPromises = batch.map(text => this.generateEmbedding(text));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * 获取可用模型列表
   */
  async getModels(): Promise<OllamaModel[]> {
    try {
      const response = await this.httpClient.get('/api/tags');
      return response.data.models || [];
    } catch (error) {
      this.logger.error('获取Ollama模型列表失败:', error);
      return [];
    }
  }

  /**
   * 检查模型是否可用
   */
  async isModelAvailable(modelName: string): Promise<boolean> {
    try {
      const models = await this.getModels();
      return models.some(model => model.name === modelName);
    } catch (error) {
      return false;
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    models: string[];
    error?: string;
  }> {
    try {
      const models = await this.getModels();
      const modelNames = models.map(m => m.name);
      
      // 检查关键模型是否存在
      const requiredModels = [
        this.models.chat.primary,
        this.models.chat.fast,
        this.models.analysis.code,
        this.models.embedding,
      ];
      
      const missingModels = requiredModels.filter(model => 
        !modelNames.includes(model)
      );

      if (missingModels.length > 0) {
        this.logger.warn('缺少模型:', missingModels);
      }

      return {
        status: 'healthy',
        models: modelNames,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        models: [],
        error: error.message,
      };
    }
  }

  /**
   * 获取模型配置
   */
  getModelConfig() {
    return this.models;
  }

  /**
   * 估算token数量 (粗略估算)
   */
  private estimateTokens(text: string): number {
    // 中文字符按1.5个token计算，英文单词按1个token计算
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = text.split(/\s+/).length;
    return Math.ceil(chineseChars * 1.5 + englishWords);
  }

  /**
   * 错误处理
   */
  private handleError(error: any): HttpException {
    if (error.code === 'ECONNREFUSED') {
      throw new HttpException(
        'Ollama服务未启动，请运行 ollama serve',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error || '未知错误';

      switch (status) {
        case 404:
          throw new HttpException('模型未找到，请先下载模型', HttpStatus.NOT_FOUND);
        case 400:
          throw new HttpException(`请求参数错误: ${message}`, HttpStatus.BAD_REQUEST);
        default:
          throw new HttpException(`Ollama服务错误: ${message}`, status);
      }
    }

    throw new HttpException('Ollama网络连接错误', HttpStatus.SERVICE_UNAVAILABLE);
  }
} 