import { Injectable, Logger } from '@nestjs/common';
import { ChatOllama } from '@langchain/ollama';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { VectorService, ContextWindow } from './vector.service';
import { DatabaseService } from '../database/database.service';

// 定义增强的分析请求接口
interface EnhancedAnalysisRequest {
  messages: Array<{
    sender: string;
    time: string;
    content: string;
  }>;
  summaryType: string;
  groupName?: string;
  timeRange?: string;
  specificDate?: string;
  customPrompt?: string;
  useInfiniteContext?: boolean;
  contextWindowType?: 'sliding' | 'semantic' | 'hybrid';
  maxContextTokens?: number;
  useKnowledgeBase?: boolean;
  knowledgeNamespaces?: string[];
}

interface EnhancedAnalysisResult {
  summary: string;
  keyPoints: string[];
  participants: string[];
  topics: string[];
  sentiment?: any;
  timeline?: any[];
  relatedKnowledge?: any[];
  contextUsed: {
    tokenCount: number;
    messageCount: number;
    relevanceScore: number;
    windowType: string;
  };
  metadata: {
    processingTime: number;
    vectorSearchResults: number;
    knowledgeBaseHits: number;
    originalMessageCount: number;
    optimizedMessageCount: number;
  };
}

@Injectable()
export class EnhancedLangChainService {
  private readonly logger = new Logger(EnhancedLangChainService.name);
  private readonly ollama: ChatOllama;

  // 配置参数
  private readonly MAX_CONTEXT_TOKENS = 16000; // 增加上下文窗口
  private readonly KNOWLEDGE_SEARCH_LIMIT = 20;
  private readonly VECTOR_SIMILARITY_THRESHOLD = 0.75;

  constructor(
    private readonly vectorService: VectorService,
    private readonly databaseService: DatabaseService
  ) {
    // 初始化Ollama模型
    this.ollama = new ChatOllama({
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'qwen3',
      temperature: 0.3,
    });
  }

  /**
   * 增强版聊天记录分析 - 支持无限上下文和向量知识库
   */
  async enhancedAnalyzeChatLog(request: EnhancedAnalysisRequest): Promise<EnhancedAnalysisResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`🚀 开始增强版LangChain分析，原始消息数量: ${request.messages.length}`);

      // 1. 存储消息到向量数据库（如果启用）
      let vectorSearchResults = 0;
      let knowledgeBaseHits = 0;
      
      if (request.useInfiniteContext || request.useKnowledgeBase) {
        await this.storeMessagesToVector(request.messages, request.groupName || 'unknown');
      }

      // 2. 构建无限上下文窗口
      let contextWindow: ContextWindow | null = null;
      if (request.useInfiniteContext) {
        contextWindow = await this.buildEnhancedContext(request);
        vectorSearchResults = contextWindow.messages.length;
      }

      // 3. 搜索相关知识
      let relatedKnowledge: any[] = [];
      if (request.useKnowledgeBase) {
        relatedKnowledge = await this.searchRelevantKnowledge(request);
        knowledgeBaseHits = relatedKnowledge.length;
      }

      // 4. 构建增强提示词
      const enhancedPrompt = await this.buildEnhancedPrompt(
        request,
        contextWindow,
        relatedKnowledge
      );

      // 5. 执行AI分析
      const messages = [
        new SystemMessage(this.buildEnhancedSystemPrompt()),
        new HumanMessage(enhancedPrompt)
      ];

      const response = await this.ollama.invoke(messages);
      const result = typeof response.content === 'string' ? response.content : String(response.content);

      // 6. 解析和格式化结果
      const analysisResult = this.parseEnhancedResult(result);

      // 7. 存储分析结果到向量知识库
      if (request.useKnowledgeBase) {
        await this.storeSummaryToKnowledge(analysisResult, request);
      }

      const processingTime = Date.now() - startTime;

      const enhancedResult: EnhancedAnalysisResult = {
        ...analysisResult,
        relatedKnowledge: relatedKnowledge.slice(0, 5), // 只返回前5个相关知识
        contextUsed: {
          tokenCount: contextWindow?.tokenCount || 0,
          messageCount: contextWindow?.messages.length || request.messages.length,
          relevanceScore: contextWindow?.relevanceScore || 1.0,
          windowType: request.contextWindowType || 'none'
        },
        metadata: {
          processingTime,
          vectorSearchResults,
          knowledgeBaseHits,
          originalMessageCount: request.messages.length,
          optimizedMessageCount: contextWindow?.messages.length || request.messages.length
        }
      };

      this.logger.log(`✅ 增强版分析完成，耗时: ${processingTime}ms`);
      return enhancedResult;
    } catch (error) {
      this.logger.error(`增强版分析失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 增强版流式分析
   */
  async enhancedAnalyzeChatLogStream(
    request: EnhancedAnalysisRequest,
    callback: (chunk: string) => void
  ): Promise<EnhancedAnalysisResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`🚀 开始增强版流式分析，原始消息数量: ${request.messages.length}`);

      callback('🔄 初始化增强版分析系统...\n');

      // 1. 存储消息到向量数据库
      let vectorSearchResults = 0;
      let knowledgeBaseHits = 0;
      
      if (request.useInfiniteContext || request.useKnowledgeBase) {
        callback('📊 存储消息到向量数据库...\n');
        await this.storeMessagesToVector(request.messages, request.groupName || 'unknown');
        callback('✅ 向量存储完成\n');
      }

      // 2. 构建无限上下文窗口
      let contextWindow: ContextWindow | null = null;
      if (request.useInfiniteContext) {
        callback('🧠 构建无限上下文窗口...\n');
        contextWindow = await this.buildEnhancedContext(request);
        vectorSearchResults = contextWindow.messages.length;
        callback(`✅ 上下文窗口构建完成: ${contextWindow.messages.length} 条消息, ${contextWindow.tokenCount} tokens\n`);
      }

      // 3. 搜索相关知识
      let relatedKnowledge: any[] = [];
      if (request.useKnowledgeBase) {
        callback('🔍 搜索相关知识...\n');
        relatedKnowledge = await this.searchRelevantKnowledge(request);
        knowledgeBaseHits = relatedKnowledge.length;
        callback(`✅ 找到 ${relatedKnowledge.length} 条相关知识\n`);
      }

      // 4. 构建增强提示词
      callback('📝 构建增强提示词...\n');
      const enhancedPrompt = await this.buildEnhancedPrompt(
        request,
        contextWindow,
        relatedKnowledge
      );
      callback('✅ 提示词构建完成\n');

      // 5. 执行流式AI分析
      callback('🤖 开始AI分析...\n');
      
      const messages = [
        new SystemMessage(this.buildEnhancedSystemPrompt()),
        new HumanMessage(enhancedPrompt)
      ];

      let fullResponse = '';
      
      try {
        const stream = await this.ollama.stream(messages);
        
        for await (const chunk of stream) {
          const content = typeof chunk.content === 'string' ? chunk.content : String(chunk.content);
          if (content) {
            fullResponse += content;
            callback(content);
          }
        }
      } catch (streamError) {
        this.logger.error(`流式处理失败，尝试非流式调用: ${streamError.message}`);
        callback('\n⚠️ 流式处理失败，切换到非流式模式...\n');
        
        const response = await this.ollama.invoke(messages);
        fullResponse = typeof response.content === 'string' ? response.content : String(response.content);
        callback(fullResponse);
      }

      // 6. 解析结果
      callback('\n🔄 解析分析结果...\n');
      const analysisResult = this.parseEnhancedResult(fullResponse);

      // 7. 存储结果到知识库
      if (request.useKnowledgeBase) {
        callback('💾 存储结果到知识库...\n');
        await this.storeSummaryToKnowledge(analysisResult, request);
        callback('✅ 知识库存储完成\n');
      }

      const processingTime = Date.now() - startTime;

      const enhancedResult: EnhancedAnalysisResult = {
        ...analysisResult,
        relatedKnowledge: relatedKnowledge.slice(0, 5),
        contextUsed: {
          tokenCount: contextWindow?.tokenCount || 0,
          messageCount: contextWindow?.messages.length || request.messages.length,
          relevanceScore: contextWindow?.relevanceScore || 1.0,
          windowType: request.contextWindowType || 'none'
        },
        metadata: {
          processingTime,
          vectorSearchResults,
          knowledgeBaseHits,
          originalMessageCount: request.messages.length,
          optimizedMessageCount: contextWindow?.messages.length || request.messages.length
        }
      };

      callback(`\n✅ 增强版分析完成，总耗时: ${processingTime}ms\n`);
      return enhancedResult;
    } catch (error) {
      this.logger.error(`增强版流式分析失败: ${error.message}`, error.stack);
      callback(`\n❌ 错误: ${error.message}\n`);
      throw error;
    }
  }

  /**
   * 存储消息到向量数据库
   */
  private async storeMessagesToVector(
    messages: Array<{
      sender: string;
      time: string;
      content: string;
    }>,
    groupName: string
  ): Promise<void> {
    try {
      const vectorMessages = messages.map(msg => ({
        groupName,
        sender: msg.sender,
        content: msg.content,
        timestamp: new Date(msg.time),
        metadata: {
          originalTime: msg.time
        }
      }));

      await this.vectorService.storeBatchChatMessages(vectorMessages);
    } catch (error) {
      this.logger.warn(`存储消息到向量数据库失败: ${error.message}`);
    }
  }

  /**
   * 构建增强上下文
   */
  private async buildEnhancedContext(request: EnhancedAnalysisRequest): Promise<ContextWindow> {
    const query = this.extractQueryFromRequest(request);
    const timeRange = this.parseTimeRange(request);
    
    return await this.vectorService.buildInfiniteContext(
      query,
      request.groupName || 'unknown',
      {
        maxTokens: request.maxContextTokens || this.MAX_CONTEXT_TOKENS,
        windowType: request.contextWindowType || 'hybrid',
        timeRange
      }
    );
  }

  /**
   * 搜索相关知识
   */
  private async searchRelevantKnowledge(request: EnhancedAnalysisRequest): Promise<any[]> {
    const query = this.extractQueryFromRequest(request);
    const namespaces = request.knowledgeNamespaces || ['summaries', 'chat_history', 'topics'];
    
    const allResults: any[] = [];
    
    for (const namespace of namespaces) {
      try {
        const results = await this.vectorService.searchKnowledge(query, {
          namespace,
          limit: Math.ceil(this.KNOWLEDGE_SEARCH_LIMIT / namespaces.length),
          threshold: this.VECTOR_SIMILARITY_THRESHOLD
        });
        
        allResults.push(...results.map(result => ({
          ...result,
          namespace
        })));
      } catch (error) {
        this.logger.warn(`搜索知识库 ${namespace} 失败: ${error.message}`);
      }
    }
    
    // 按相似度排序并返回前N个
    return allResults
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, this.KNOWLEDGE_SEARCH_LIMIT);
  }

  /**
   * 构建增强提示词
   */
  private async buildEnhancedPrompt(
    request: EnhancedAnalysisRequest,
    contextWindow: ContextWindow | null,
    relatedKnowledge: any[]
  ): Promise<string> {
    let prompt = `# 聊天记录分析任务\n\n`;

    // 基本信息
    prompt += `## 分析参数\n`;
    prompt += `- 群聊名称: ${request.groupName || '未知'}\n`;
    prompt += `- 分析类型: ${request.summaryType}\n`;
    prompt += `- 时间范围: ${request.timeRange || request.specificDate || '未指定'}\n`;
    
    if (request.customPrompt) {
      prompt += `- 自定义要求: ${request.customPrompt}\n`;
    }
    
    prompt += `\n`;

    // 相关知识（如果有）
    if (relatedKnowledge.length > 0) {
      prompt += `## 相关历史知识\n`;
      prompt += `以下是从知识库中找到的相关信息，可以作为分析的参考：\n\n`;
      
      relatedKnowledge.slice(0, 5).forEach((knowledge, index) => {
        prompt += `### 相关知识 ${index + 1} (相似度: ${(knowledge.similarity * 100).toFixed(1)}%)\n`;
        prompt += `**来源**: ${knowledge.metadata.title || knowledge.namespace}\n`;
        prompt += `**内容**: ${knowledge.content.substring(0, 500)}${knowledge.content.length > 500 ? '...' : ''}\n\n`;
      });
    }

    // 聊天记录
    prompt += `## 聊天记录\n`;
    
    if (contextWindow) {
      prompt += `以下是通过智能上下文窗口筛选的相关消息 (${contextWindow.messages.length} 条消息, 约 ${contextWindow.tokenCount} tokens, 相关性评分: ${(contextWindow.relevanceScore * 100).toFixed(1)}%)：\n\n`;
      prompt += contextWindow.content;
    } else {
      prompt += `以下是原始聊天记录：\n\n`;
      const messagesText = request.messages
        .map(msg => `${msg.time} ${msg.sender}: ${msg.content}`)
        .join('\n');
      prompt += messagesText;
    }

    // 分析要求
    prompt += `\n\n## 分析要求\n`;
    prompt += this.getAnalysisInstructions(request.summaryType);

    // 输出格式要求
    prompt += `\n\n## 输出格式\n`;
    prompt += `请以JSON格式返回分析结果，包含以下字段：\n`;
    prompt += `- summary: 总结内容\n`;
    prompt += `- keyPoints: 关键点数组\n`;
    prompt += `- participants: 参与者数组\n`;
    prompt += `- topics: 主题标签数组\n`;
    
    if (request.summaryType === 'sentiment_analysis') {
      prompt += `- sentiment: 情感分析结果\n`;
    }
    
    if (request.summaryType === 'timeline') {
      prompt += `- timeline: 时间线事件数组\n`;
    }

    return prompt;
  }

  /**
   * 构建增强系统提示词
   */
  private buildEnhancedSystemPrompt(): string {
    return `你是一个专业的聊天记录分析助手，具备以下能力：

1. **上下文理解**: 能够理解长期对话历史和上下文关系
2. **知识整合**: 能够结合历史知识和当前对话进行综合分析
3. **多维分析**: 支持情感分析、主题分析、时间线分析等多种分析类型
4. **结构化输出**: 始终返回格式化的JSON结果

分析原则：
- 基于提供的相关知识进行深度分析
- 注重上下文的连贯性和逻辑性
- 提取有价值的洞察和模式
- 保持客观和准确性

请直接分析聊天记录并返回结构化的JSON结果，不要使用深度思考模式，不要输出<think>标签。`;
  }

  /**
   * 获取分析指令
   */
  private getAnalysisInstructions(summaryType: string): string {
    const instructions = {
      daily: '进行日常总结，重点关注主要讨论话题、重要决定、关键信息等',
      sentiment_analysis: '进行情感分析，识别对话中的情感倾向、氛围变化、情感关键词等',
      topic: '进行主题分析，识别主要讨论主题、话题演进、相关性分析等',
      participant: '进行参与者分析，分析发言频率、互动模式、影响力等',
      timeline: '进行时间线分析，按时间顺序梳理重要事件和话题发展',
      activity_analysis: '进行活跃度分析，分析发言时间分布、活跃时段、参与度等',
      keyword_extraction: '进行关键词提取，识别高频词汇、重要术语、核心概念等',
      style_analysis: '进行风格分析，分析对话风格、语言特点、交流模式等'
    };

    return instructions[summaryType] || instructions.daily;
  }

  /**
   * 解析增强结果
   */
  private parseEnhancedResult(result: string): Omit<EnhancedAnalysisResult, 'relatedKnowledge' | 'contextUsed' | 'metadata'> {
    try {
      // 尝试解析JSON
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || '分析结果解析失败',
          keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
          participants: Array.isArray(parsed.participants) ? parsed.participants : [],
          topics: Array.isArray(parsed.topics) ? parsed.topics : [],
          sentiment: parsed.sentiment,
          timeline: parsed.timeline
        };
      }
    } catch (error) {
      this.logger.warn(`解析JSON结果失败: ${error.message}`);
    }

    // 回退到文本解析
    return this.parseTextResult(result);
  }

  /**
   * 文本结果解析（回退方案）
   */
  private parseTextResult(result: string): Omit<EnhancedAnalysisResult, 'relatedKnowledge' | 'contextUsed' | 'metadata'> {
    const lines = result.split('\n');
    
    return {
      summary: result.substring(0, 500) + (result.length > 500 ? '...' : ''),
      keyPoints: this.extractListFromText(result, ['关键点', '要点', '重点']),
      participants: this.extractListFromText(result, ['参与者', '发言人', '用户']),
      topics: this.extractListFromText(result, ['主题', '话题', '讨论'])
    };
  }

  /**
   * 从文本中提取列表
   */
  private extractListFromText(text: string, keywords: string[]): string[] {
    const items: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (keywords.some(keyword => line.includes(keyword))) {
        const matches = line.match(/[：:]\s*(.+)/);
        if (matches) {
          const content = matches[1].trim();
          if (content.includes('、') || content.includes(',')) {
            items.push(...content.split(/[、,]/).map(item => item.trim()).filter(Boolean));
          } else {
            items.push(content);
          }
        }
      }
    }
    
    return [...new Set(items)].slice(0, 10); // 去重并限制数量
  }

  /**
   * 存储摘要到知识库
   */
  private async storeSummaryToKnowledge(
    result: Omit<EnhancedAnalysisResult, 'relatedKnowledge' | 'contextUsed' | 'metadata'>,
    request: EnhancedAnalysisRequest
  ): Promise<void> {
    try {
      const timeRange = request.timeRange || request.specificDate || new Date().toISOString().split('T')[0];
      
      await this.vectorService.storeSummary({
        groupName: request.groupName || 'unknown',
        summaryType: request.summaryType,
        timeRange,
        title: `${request.groupName || '群聊'} - ${request.summaryType} - ${timeRange}`,
        content: result.summary,
        keyPoints: result.keyPoints,
        participants: result.participants,
        topics: result.topics,
        messageCount: request.messages.length,
        startTime: new Date(request.messages[0]?.time || new Date()),
        endTime: new Date(request.messages[request.messages.length - 1]?.time || new Date()),
        metadata: {
          summaryType: request.summaryType,
          customPrompt: request.customPrompt,
          useInfiniteContext: request.useInfiniteContext,
          useKnowledgeBase: request.useKnowledgeBase
        }
      });
    } catch (error) {
      this.logger.warn(`存储摘要到知识库失败: ${error.message}`);
    }
  }

  /**
   * 从请求中提取查询关键词
   */
  private extractQueryFromRequest(request: EnhancedAnalysisRequest): string {
    const parts: string[] = [];
    
    if (request.groupName) parts.push(request.groupName);
    if (request.summaryType) parts.push(request.summaryType);
    if (request.customPrompt) parts.push(request.customPrompt);
    
    // 从消息中提取关键词
    const recentMessages = request.messages.slice(-10);
    const keywords = recentMessages
      .map(msg => msg.content)
      .join(' ')
      .match(/[\u4e00-\u9fff]{2,}/g) || []; // 提取中文关键词
    
    parts.push(...keywords.slice(0, 5));
    
    return parts.join(' ');
  }

  /**
   * 解析时间范围
   */
  private parseTimeRange(request: EnhancedAnalysisRequest): { start: Date; end: Date } | undefined {
    if (request.specificDate) {
      const date = new Date(request.specificDate);
      return {
        start: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
      };
    }
    
    if (request.timeRange) {
      const now = new Date();
      switch (request.timeRange) {
        case 'today':
          return {
            start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          };
        case 'yesterday':
          return {
            start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
            end: new Date(now.getFullYear(), now.getMonth(), now.getDate())
          };
        case 'thisWeek':
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          return {
            start: startOfWeek,
            end: now
          };
        // 可以添加更多时间范围
      }
    }
    
    return undefined;
  }
} 