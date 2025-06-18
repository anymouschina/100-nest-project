import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../config/config.service';
import { Ollama } from '@langchain/community/llms/ollama';
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatPromptTemplate, PromptTemplate } from '@langchain/core/prompts';

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly ollama: Ollama;
  private readonly embeddings: OllamaEmbeddings;
  private readonly baseUrl: string;
  private readonly defaultModel: string;

  constructor(private configService: AppConfigService) {
    this.baseUrl = this.configService.get('llm.ollamaBaseUrl') || 'http://localhost:11434';
    this.defaultModel = this.configService.get('llm.defaultModel') || 'deepseek-r1';
    
    this.logger.log(`Initializing Ollama with base URL: ${this.baseUrl} and model: ${this.defaultModel}`);
    
    this.ollama = new Ollama({
      baseUrl: this.baseUrl,
      model: this.defaultModel,
      temperature: 0.7,
    });
    
    this.embeddings = new OllamaEmbeddings({
      baseUrl: this.baseUrl,
      model: this.defaultModel,
    });
  }
  
  /**
   * 获取Ollama LLM实例
   */
  getLLM(options?: { model?: string; temperature?: number }): Ollama {
    if (!options) {
      return this.ollama;
    }

    return new Ollama({
      baseUrl: this.baseUrl,
      model: options.model || this.defaultModel,
      temperature: options.temperature !== undefined ? options.temperature : 0.7,
    });
  }

  /**
   * 获取嵌入模型
   */
  getEmbeddings(): OllamaEmbeddings {
    return this.embeddings;
  }

  /**
   * 创建一个带提示的链
   */
  createChain(systemPrompt: string): RunnableSequence {
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      ['human', '{input}'],
    ]);

    return RunnableSequence.from([
      prompt,
      this.ollama,
      new StringOutputParser(),
    ]);
  }

  /**
   * 为RAG创建带提示的链
   */
  createRAGChain(systemPrompt: string): RunnableSequence {
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      ['human', '{question}'],
      ['system', 'Context information: {context}'],
      ['human', 'Based on the context provided, please answer my question: {question}'],
    ]);

    return RunnableSequence.from([
      prompt,
      this.ollama,
      new StringOutputParser(),
    ]);
  }

  /**
   * 调用模型生成嵌入向量
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.embeddings.embedQuery(text);
      return result;
    } catch (error) {
      this.logger.error(`Error generating embedding: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 与LLM进行对话
   */
  async chat(history: Array<{role: string; content: string}>, message: string): Promise<string> {
    try {
      const messages = [...history, { role: 'human', content: message }];
      const result = await this.ollama.invoke(messages);
      return result.toString().trim();
    } catch (error) {
      this.logger.error(`Chat error: ${error.message}`, error.stack);
      return `发生错误: ${error.message}`;
    }
  }
} 