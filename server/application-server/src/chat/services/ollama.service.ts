import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ollama } from 'ollama';

@Injectable()
export class OllamaService implements OnModuleInit {
  private readonly logger = new Logger(OllamaService.name);
  private ollama: Ollama;
  private model: string;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const baseUrl = this.configService.get<string>('llm.ollamaBaseUrl');
    this.model = this.configService.get<string>('llm.defaultModel');
    
    this.ollama = new Ollama({
      host: baseUrl,
    });

    this.logger.log(
      `Initializing Ollama with base URL: ${baseUrl} and model: ${this.model}`,
    );
    
    try {
      // 测试连接
      await this.ollama.list();
      this.logger.log('Successfully connected to Ollama');
    } catch (error) {
      this.logger.error(`Failed to connect to Ollama: ${error.message}`);
    }
  }

  /**
   * 发送聊天消息到Ollama
   */
  async chat(
    messages: Array<{ role: string; content: string }>,
    userMessage: string,
  ): Promise<string> {
    try {
      // 构建完整的消息历史
      const fullMessages = [
        ...messages
      ];

      // 打印详细的请求上下文
      this.logger.log('=== LLM Request Context ===');
      this.logger.log(`Model: ${this.model}`);
      this.logger.log(`Total messages in context: ${fullMessages.length}`);
      
      // 打印每条消息的详细信息
      fullMessages.forEach((msg, index) => {
        this.logger.log(`Message ${index + 1}:`);
        this.logger.log(`  Role: ${msg.role}`);
        this.logger.log(`  Content length: ${msg.content.length} characters`);
        this.logger.log(
          `  Content preview: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`,
        );
        
        // 如果是系统消息或较短的消息，打印完整内容
        if (msg.role === 'system' || msg.content.length <= 200) {
          this.logger.log(`  Full content: ${msg.content}`);
        }
      });

      // 记录请求开始时间
      const startTime = Date.now();
      this.logger.log(`Sending request to Ollama at ${new Date().toISOString()}`,fullMessages);

      // 发送请求到Ollama
      const response = await this.ollama.chat({
        model: this.model,
        messages: fullMessages.map(msg => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        })),
        stream: false,
      });

      // 计算响应时间
      const responseTime = Date.now() - startTime;

      // 打印详细的响应上下文
      this.logger.log('=== LLM Response Context ===');
      this.logger.log(`Response time: ${responseTime}ms`);
      this.logger.log(`Response received at: ${new Date().toISOString()}`);
      
      if (response.message) {
        this.logger.log(`Response role: ${response.message.role}`);
        this.logger.log(`Response content length: ${response.message.content.length} characters`);
        this.logger.log(
          `Response content preview: ${response.message.content.substring(0, 200)}${response.message.content.length > 200 ? '...' : ''}`,
        );
        
        // 如果响应较短，打印完整内容
        if (response.message.content.length <= 500) {
          this.logger.log(`Full response content: ${response.message.content}`);
        }
      }

      // 打印模型统计信息（如果可用）
      if (response.eval_count) {
        this.logger.log(`Tokens evaluated: ${response.eval_count}`);
      }
      if (response.eval_duration) {
        this.logger.log(`Evaluation duration: ${response.eval_duration}ns`);
      }
      if (response.prompt_eval_count) {
        this.logger.log(`Prompt tokens: ${response.prompt_eval_count}`);
      }

      this.logger.log('=== End LLM Context ===');

      return response.message.content;
    } catch (error) {
      this.logger.error('=== LLM Error Context ===');
      this.logger.error(`Error occurred at: ${new Date().toISOString()}`);
      this.logger.error(`Error message: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      
      // 打印请求上下文以便调试
      this.logger.error(`Failed request context:`);
      this.logger.error(`  Model: ${this.model}`);
      this.logger.error(`  Messages count: ${messages.length + 1}`);
      this.logger.error(
        `  User message: ${userMessage.substring(0, 100)}${userMessage.length > 100 ? '...' : ''}`,
      );
      
      this.logger.error('=== End Error Context ===');
      throw error;
    }
  }

  /**
   * 生成文本嵌入向量
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      this.logger.log('=== Embedding Request Context ===');
      this.logger.log(`Text length: ${text.length} characters`);
      this.logger.log(
        `Text preview: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`,
      );
      
      const startTime = Date.now();
      
      const response = await this.ollama.embeddings({
        model: this.model,
        prompt: text,
      });

      const responseTime = Date.now() - startTime;

      this.logger.log('=== Embedding Response Context ===');
      this.logger.log(`Response time: ${responseTime}ms`);
      this.logger.log(`Embedding dimensions: ${response.embedding?.length || 0}`);
      this.logger.log('=== End Embedding Context ===');

      return response.embedding || [];
    } catch (error) {
      this.logger.error('=== Embedding Error Context ===');
      this.logger.error(`Error message: ${error.message}`);
      this.logger.error(
        `Text that failed: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`,
      );
      this.logger.error('=== End Embedding Error Context ===');
      throw error;
    }
  }

  /**
   * 检查模型是否可用
   */
  async isModelAvailable(): Promise<boolean> {
    try {
      const models = await this.ollama.list();
      const isAvailable = models.models.some(model => model.name.includes(this.model));
      
      this.logger.log(`Model ${this.model} availability check: ${isAvailable}`);
      if (!isAvailable) {
        this.logger.warn(`Available models: ${models.models.map(m => m.name).join(', ')}`);
      }
      
      return isAvailable;
    } catch (error) {
      this.logger.error(`Failed to check model availability: ${error.message}`);
      return false;
    }
  }

  /**
   * 获取当前模型信息
   */
  getModelInfo(): { model: string; baseUrl: string } {
    return {
      model: this.model,
      baseUrl: this.configService.get<string>('llm.ollamaBaseUrl'),
    };
  }
} 