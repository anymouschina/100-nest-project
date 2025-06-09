import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { AIResponse, ChatMessage } from '../interfaces/ai.interface';

@Injectable()
export class MoonshotService {
  private readonly logger = new Logger(MoonshotService.name);
  private readonly httpClient: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ai.moonshotApiKey');
    this.baseUrl = this.configService.get<string>('ai.moonshotBaseUrl');
    this.model = this.configService.get<string>('ai.moonshotModel');

    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.httpClient.interceptors.request.use(
      (config) => {
        this.logger.debug(`发送请求到: ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('请求拦截器错误:', error);
        return Promise.reject(error);
      },
    );

    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.debug(`收到响应: ${response.status}`);
        return response;
      },
      (error) => {
        this.logger.error(
          '响应拦截器错误:',
          error.response?.data || error.message,
        );
        return Promise.reject(error);
      },
    );
  }

  async chat(
    messages: ChatMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    },
  ): Promise<AIResponse> {
    try {
      const requestData = {
        model: this.model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 2000,
        stream: options?.stream || false,
      };

      this.logger.debug('发送聊天请求:', JSON.stringify(requestData, null, 2));

      const response = await this.httpClient.post(
        '/chat/completions',
        requestData,
      );

      const choice = response.data.choices[0];
      const usage = response.data.usage;

      return {
        content: choice.message.content,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
        model: response.data.model,
        finishReason: choice.finish_reason,
      };
    } catch (error) {
      this.logger.error('聊天请求失败:', error);

      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.error?.message || '未知错误';

        switch (status) {
          case 401:
            throw new HttpException('API密钥无效', HttpStatus.UNAUTHORIZED);
          case 429:
            throw new HttpException(
              '请求频率过高，请稍后重试',
              HttpStatus.TOO_MANY_REQUESTS,
            );
          case 500:
            throw new HttpException(
              'AI服务暂时不可用',
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          default:
            throw new HttpException(
              `AI服务错误: ${message}`,
              HttpStatus.BAD_REQUEST,
            );
        }
      }

      throw new HttpException('网络连接错误', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  async generateCompletion(
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
    },
  ): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'user',
        content: prompt,
      },
    ];

    const response = await this.chat(messages, options);
    return response.content;
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const testMessages: ChatMessage[] = [
        {
          role: 'user',
          content: '你好',
        },
      ];

      await this.chat(testMessages, { maxTokens: 10 });
      return true;
    } catch (error) {
      this.logger.error('API密钥验证失败:', error);
      return false;
    }
  }

  async getModels(): Promise<string[]> {
    try {
      const response = await this.httpClient.get('/models');
      return response.data.data.map((model: any) => model.id);
    } catch (error) {
      this.logger.error('获取模型列表失败:', error);
      return [this.model];
    }
  }

  getUsageStats() {
    // 这里可以实现使用统计功能
    return {
      totalRequests: 0,
      totalTokens: 0,
      averageResponseTime: 0,
    };
  }
}
