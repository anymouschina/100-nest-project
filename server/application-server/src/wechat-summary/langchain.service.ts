import { Injectable, Logger } from '@nestjs/common';
import { ChatOllama } from '@langchain/ollama';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { Document } from '@langchain/core/documents';

// 定义请求接口
interface AnalysisRequest {
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
}

@Injectable()
export class LangChainService {
  private readonly logger = new Logger(LangChainService.name);
  private readonly ollama: ChatOllama;
  private readonly outputParser = new StringOutputParser();

  // 智能配置 - 基于模型上下文窗口动态调整
  private readonly MODEL_CONTEXT_WINDOW = 32768; // qwen3的上下文窗口
  private readonly RESERVED_TOKENS = 2000; // 为输出和提示词预留的token
  private readonly AVERAGE_TOKENS_PER_CHAR = 0.75; // 中文平均token比例
  private readonly textSplitter: RecursiveCharacterTextSplitter;

  constructor() {
    // 初始化Ollama模型
    this.ollama = new ChatOllama({
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: process.env.OLLAMA_MODEL || 'qwen3',
      temperature: 0.3,
    });

    // 初始化智能文本分割器
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', '。', '！', '？', '；', '，', ' ', ''],
    });
  }

  /**
   * 执行聊天记录分析 - 主要入口方法
   */
  async analyzeChatLog(request: AnalysisRequest): Promise<any> {
    try {
      this.logger.log(`开始LangChain分析，原始消息数量: ${request.messages.length}`);

      // 1. 数据预处理和优化
      const optimizedMessages = await this.optimizeMessages(request.messages);
      this.logger.log(`优化后消息数量: ${optimizedMessages.length}`);

      // 2. 构建优化的提示词
      const prompt = await this.buildOptimizedPrompt(request, optimizedMessages);

      // 3. 直接调用模型（与流式保持一致）
      const messages = [
        new SystemMessage('你是一个专业的聊天记录分析助手。请直接分析聊天记录并返回结构化的JSON结果，不要使用深度思考模式，不要输出<think>标签。'),
        new HumanMessage(prompt)
      ];

      // 4. 执行分析
      const response = await this.ollama.invoke(messages);
      const result = typeof response.content === 'string' ? response.content : String(response.content);

      // 5. 解析和格式化结果
      const formattedResult = this.formatResult(result, optimizedMessages, request);

      this.logger.log('LangChain分析完成');
      return formattedResult;
    } catch (error) {
      this.logger.error(`LangChain分析失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 流式分析
   */
  async analyzeChatLogStream(request: AnalysisRequest, callback: (chunk: string) => void): Promise<any> {
    try {
      this.logger.log(`开始LangChain流式分析，原始消息数量: ${request.messages.length}`);

      callback('🔄 开始数据预处理...\n');
      
      // 1. 数据预处理
      const optimizedMessages = await this.optimizeMessages(request.messages);
      callback(`✅ 消息优化完成: ${request.messages.length} -> ${optimizedMessages.length}\n`);

      // 2. 构建提示词
      callback('🔄 构建智能提示词...\n');
      const prompt = await this.buildOptimizedPrompt(request, optimizedMessages);
      callback('✅ 提示词构建完成\n');

      // 3. 调用模型进行流式分析
      callback('🤖 开始AI分析...\n');
      
      const messages = [
        new SystemMessage('你是一个专业的聊天记录分析助手。请直接分析聊天记录并返回结构化的JSON结果，不要使用深度思考模式，不要输出<think>标签。'),
        new HumanMessage(prompt)
      ];

      let fullResponse = '';
      
      try {
        const stream = await this.ollama.stream(messages);
        
        for await (const chunk of stream) {
          const content = typeof chunk.content === 'string' ? chunk.content : String(chunk.content);
          if (content) {
            fullResponse += content;
            // 实时发送内容块
            callback(content);
          }
        }
      } catch (streamError) {
        this.logger.error(`流式处理失败，尝试非流式调用: ${streamError.message}`);
        callback('\n⚠️ 流式处理失败，切换到非流式模式...\n');
        
        // 如果流式失败，使用非流式调用
        const response = await this.ollama.invoke(messages);
        fullResponse = typeof response.content === 'string' ? response.content : String(response.content);
        callback(fullResponse);
      }

      // 4. 解析最终结果
      const formattedResult = this.formatResult(fullResponse, optimizedMessages, request);
      
      callback('\n✅ 分析完成\n');
      return formattedResult;
    } catch (error) {
      this.logger.error(`LangChain流式分析失败: ${error.message}`, error.stack);
      callback(`\n❌ 错误: ${error.message}\n`);
      throw error;
    }
  }

  /**
   * 智能消息预处理 - 使用现代LangChain方法
   */
  private async optimizeMessages(messages: Array<{sender: string; time: string; content: string}>): Promise<Array<{sender: string; time: string; content: string}>> {
    this.logger.log('🧠 开始智能数据预处理...');

    // 1. 转换为Document格式进行处理
    const documents = messages.map(msg => new Document({
      pageContent: `${msg.time} ${msg.sender}: ${msg.content}`,
      metadata: {
        sender: msg.sender,
        time: msg.time,
        originalContent: msg.content,
        timestamp: new Date(msg.time).getTime(),
      }
    }));

    // 2. 基于语义的智能过滤
    const filteredDocs = await this.semanticFiltering(documents);
    this.logger.log(`📝 语义过滤: ${documents.length} -> ${filteredDocs.length}`);

    // 3. 基于相似性的去重
    const deduplicatedDocs = await this.semanticDeduplication(filteredDocs);
    this.logger.log(`🔄 语义去重: ${filteredDocs.length} -> ${deduplicatedDocs.length}`);

    // 4. 动态Token管理
    const tokenOptimizedDocs = await this.dynamicTokenManagement(deduplicatedDocs);
    this.logger.log(`⚡ Token优化: ${deduplicatedDocs.length} -> ${tokenOptimizedDocs.length}`);

    // 5. 转换回原始格式
    const optimizedMessages = tokenOptimizedDocs.map(doc => ({
      sender: doc.metadata.sender,
      time: doc.metadata.time,
      content: doc.metadata.originalContent,
    }));

    // 6. 时间排序
    optimizedMessages.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    this.logger.log(`✅ 预处理完成: ${messages.length} -> ${optimizedMessages.length}`);
    return optimizedMessages;
  }

  /**
   * 基于语义的智能过滤
   */
  private async semanticFiltering(documents: Document[]): Promise<Document[]> {
    return documents.filter(doc => {
      const content = doc.metadata.originalContent;
      
      // 基本有效性检查
      if (!content || content.trim().length === 0) return false;
      if (content.trim().length < 3) return false;

      // 智能系统消息检测
      const systemPatterns = [
        /加入了群聊/, /退出了群聊/, /修改群名为/, 
        /撤回了一条消息/, /拍了拍/, /邀请.*加入了群聊/,
        /^系统消息/, /^微信团队/
      ];
      
      // 低价值内容检测
      const lowValuePatterns = [
        /^[👍👌😂😄😊🙏💪❤️🔥]+$/, // 纯表情
        /^[好是嗯哦啊呵哈]{1,3}[的了吧呀]?$/, // 简单回复
        /^[+1-9]{1,3}$/, // 纯数字
        /^收到$|^明白$|^知道了$/, // 确认消息
      ];

      const isSystemMessage = systemPatterns.some(pattern => pattern.test(content));
      const isLowValue = lowValuePatterns.some(pattern => pattern.test(content.trim()));

      // 计算信息密度
      const informationDensity = this.calculateInformationDensity(content);
      
      return !isSystemMessage && !isLowValue && informationDensity > 0.3;
    });
  }

  /**
   * 基于相似性的语义去重
   */
  private async semanticDeduplication(documents: Document[]): Promise<Document[]> {
    const uniqueDocs: Document[] = [];
    const seenContents = new Map<string, number>();

    for (const doc of documents) {
      const content = doc.metadata.originalContent.trim().toLowerCase();
      const normalizedContent = this.normalizeContent(content);
      
      // 检查是否存在高度相似的内容
      let isDuplicate = false;
      for (const [existingContent, similarity] of seenContents.entries()) {
        const currentSimilarity = this.calculateTextSimilarity(normalizedContent, existingContent);
        if (currentSimilarity > 0.85) { // 85%相似度阈值
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        uniqueDocs.push(doc);
        seenContents.set(normalizedContent, 1);
      }
    }

    return uniqueDocs;
  }

  /**
   * 动态Token管理
   */
  private async dynamicTokenManagement(documents: Document[]): Promise<Document[]> {
    // 计算可用的token预算
    const availableTokens = this.MODEL_CONTEXT_WINDOW - this.RESERVED_TOKENS;
    
    // 估算当前文档的token使用量
    let currentTokens = 0;
    const selectedDocs: Document[] = [];
    
    // 按重要性排序文档
    const scoredDocs = documents.map(doc => ({
      doc,
      score: this.calculateDocumentImportance(doc, documents)
    })).sort((a, b) => b.score - a.score);

    for (const { doc } of scoredDocs) {
      const docTokens = Math.ceil(doc.pageContent.length * this.AVERAGE_TOKENS_PER_CHAR);
      
      if (currentTokens + docTokens <= availableTokens) {
        selectedDocs.push(doc);
        currentTokens += docTokens;
      } else {
        // 如果单个文档太长，尝试分割
        if (docTokens > availableTokens * 0.1) { // 如果单个文档占用超过10%的预算
          const chunks = await this.textSplitter.splitDocuments([doc]);
          for (const chunk of chunks) {
            const chunkTokens = Math.ceil(chunk.pageContent.length * this.AVERAGE_TOKENS_PER_CHAR);
            if (currentTokens + chunkTokens <= availableTokens) {
              selectedDocs.push(chunk);
              currentTokens += chunkTokens;
            } else {
              break;
            }
          }
        }
      }
    }

    return selectedDocs;
  }

  /**
   * 计算信息密度
   */
  private calculateInformationDensity(content: string): number {
    const length = content.length;
    const uniqueChars = new Set(content.toLowerCase()).size;
    const wordCount = content.split(/\s+/).length;
    const punctuationCount = (content.match(/[。！？；，]/g) || []).length;
    
    // 综合评分：字符多样性 + 词汇密度 + 标点使用
    const charDiversity = uniqueChars / length;
    const wordDensity = wordCount / length;
    const punctuationDensity = punctuationCount / length;
    
    return (charDiversity * 0.4 + wordDensity * 0.4 + punctuationDensity * 0.2);
  }

  /**
   * 内容标准化
   */
  private normalizeContent(content: string): string {
    return content
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '') // 只保留中英文和数字
      .trim();
  }

  /**
   * 计算文本相似度（简化版Jaccard相似度）
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const set1 = new Set(text1.split(''));
    const set2 = new Set(text2.split(''));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  /**
   * 计算文档重要性
   */
  private calculateDocumentImportance(doc: Document, allDocs: Document[]): number {
    const content = doc.metadata.originalContent;
    let score = 0;

    // 1. 长度分数（适中长度更重要）
    const length = content.length;
    if (length >= 10 && length <= 200) {
      score += 0.3;
    } else if (length > 200) {
      score += 0.2;
    }

    // 2. 关键词分数
    const keywords = ['项目', '任务', '问题', '解决', '讨论', '决定', '计划', '重要', '紧急'];
    const keywordCount = keywords.filter(keyword => content.includes(keyword)).length;
    score += (keywordCount / keywords.length) * 0.3;

    // 3. 问号和感叹号（表示互动性）
    const interactionMarkers = (content.match(/[？！?!]/g) || []).length;
    score += Math.min(interactionMarkers * 0.1, 0.2);

    // 4. 时间新鲜度（越新越重要）
    const timestamp = doc.metadata.timestamp;
    const now = Date.now();
    const hoursDiff = (now - timestamp) / (1000 * 60 * 60);
    const freshnessScore = Math.max(0, 1 - hoursDiff / 24) * 0.2; // 24小时内线性衰减
    score += freshnessScore;

    return Math.min(score, 1); // 限制在0-1之间
  }

  /**
   * 构建优化的提示词
   */
  private async buildOptimizedPrompt(request: AnalysisRequest, messages: Array<{sender: string; time: string; content: string}>): Promise<string> {
    const chatContent = messages
      .map(msg => `${msg.time} ${msg.sender}: ${msg.content}`)
      .join('\n');

    let promptTemplate: PromptTemplate;

    switch (request.summaryType) {
      case 'daily':
        promptTemplate = PromptTemplate.fromTemplate(`
你是一个专业的聊天记录分析助手。请对以下{groupName}的{timeRange}聊天记录进行详细的日常分析。

聊天记录（共{messageCount}条消息）：
{chatContent}

分析要求：
1. 提供群聊风格评价，分析讨论氛围、话题质量、参与度等
2. 识别5-9个重点话题，每个话题包含：热度评级、参与者、时间段、讨论过程、评价
3. 按时间顺序展示话题演进，包含开始时间、结束时间、具体的开始和结束消息
4. 分析讨论的商业价值、学习价值或实用价值
5. 识别关键决定、待办事项和重要信息
6. 提取文章链接、工具推荐、热门发言者等额外信息
7. 识别用户的真实昵称，而不是id或杜撰

请严格按以下JSON格式回复，不要使用深度思考模式：
{{
  "summary_title": "{timeRange} 群聊总结：核心主题概括",
  "style_comment": "群聊风格评价，包括活跃度、话题质量、讨论氛围等详细描述（150-200字）",
  "message_length": {messageCount},
  "topics": [
    {{
      "title": "1️⃣ 话题标题 🔥🔥🔥",
      "participants": ["参与者1", "参与者2", "参与者3"],
      "time_range": "11:26:23 - 12:57:47",
      "process": "详细描述讨论过程，包括关键观点、争议点、解决方案等（200-300字）",
      "comment": "对该话题的价值评价和意义分析（80-120字）",
      "start_message": {{
        "sender": "参与者1",
        "time": "11:26:23",
        "content": "开始时的具体消息内容"
      }},
      "end_message": {{
        "sender": "参与者2",
        "time": "12:57:47",
        "content": "结束时的具体消息内容"
      }}
    }},
    {{
      "title": "2️⃣ 第二个话题 🔥🔥",
      "participants": ["参与者4", "参与者5"],
      "time_range": "14:30:15 - 15:45:20",
      "process": "讨论过程描述",
      "comment": "价值评价",
      "start_message": {{
        "sender": "参与者4",
        "time": "14:30:15",
        "content": "开始消息内容"
      }},
      "end_message": {{
        "sender": "参与者5",
        "time": "15:45:20",
        "content": "结束消息内容"
      }}
    }}
  ],
  "extra_topics": ["其他值得关注的话题1", "其他值得关注的话题2", "其他值得关注的话题3"],
  "articles": [
    {{
      "title": "文章标题",
      "link": "文章链接",
      "description": "文章描述"
    }}
  ],
  "tools": [
    {{
      "name": "工具名称",
      "description": "工具描述和用途",
      "comments": ["用户评价1", "用户评价2"]
    }}
  ],
  "top_speakers": ["最活跃发言者1", "最活跃发言者2", "最活跃发言者3", "最活跃发言者4", "最活跃发言者5"]
}}

注意事项：
- 必须从聊天记录中提取真实的开始和结束消息
- participants字段必须使用用户的真实昵称（如"流年#智能体#AI编程#MCP"），不要使用微信ID（如"wxid_xxx"）
- 话题数量应该在5-9个之间，根据实际内容调整
- 热度用🔥表示，1-4个火焰表示不同热度
- 识别聊天中提到的文章链接、工具推荐等信息
- 统计发言最多的用户作为热门发言者，使用真实昵称
- start_message和end_message中的sender字段也必须使用真实昵称
        `);
        break;

      case 'sentiment_analysis':
        promptTemplate = PromptTemplate.fromTemplate(`
你是一个专业的情感分析师。请对以下聊天记录进行深度情感分析。

聊天记录（共{messageCount}条消息）：
{chatContent}

分析要求：
1. 分析整体情感倾向（积极、消极、中性）并给出0-10分的情感分数
2. 识别情感变化趋势和转折点
3. 分析不同参与者的情感状态和互动模式
4. 识别情感高峰和低谷时刻
5. 提供情感改善建议

请严格按以下JSON格式回复：
{{
  "summary": "情感分析总结",
  "overallSentiment": "积极/中性/消极",
  "sentimentScore": 7.5,
  "keyPoints": ["情感特点1", "情感特点2"],
  "emotionalHighlights": ["高峰时刻", "低谷时刻"],
  "participantEmotions": {{"参与者1": "积极", "参与者2": "中性"}},
  "suggestions": ["改善建议1", "改善建议2"]
}}
        `);
        break;

      case 'topic':
        promptTemplate = PromptTemplate.fromTemplate(`
你是一个专业的主题分析师。请对以下聊天记录进行主题分析。

聊天记录（共{messageCount}条消息）：
{chatContent}

分析要求：
1. 识别主要讨论主题和子话题
2. 分析每个主题的讨论深度和参与度
3. 总结关键观点和结论
4. 识别未解决的问题和争议点
5. 评估讨论质量和价值

请严格按以下JSON格式回复：
{{
  "summary": "主题分析总结",
  "mainTopics": ["主题1", "主题2", "主题3"],
  "keyPoints": ["关键观点1", "关键观点2"],
  "participants": ["活跃参与者列表"],
  "unresolved": ["未解决问题1", "未解决问题2"],
  "insights": "主题洞察和建议"
}}
        `);
        break;

      case 'custom':
        promptTemplate = PromptTemplate.fromTemplate(`
{customPrompt}

聊天记录（共{messageCount}条消息）：
{chatContent}

请使用中文回复，并尽量按JSON格式组织结果，包含summary、keyPoints、participants、insights等字段。
        `);
        break;

      default:
        promptTemplate = PromptTemplate.fromTemplate(`
请对以下聊天记录进行智能分析和总结。

聊天记录（共{messageCount}条消息）：
{chatContent}

请提供结构化的分析结果，包括总结、关键点、参与者分析等，使用中文回复并按JSON格式组织。
        `);
    }

         const displayTimeRange = request.specificDate || request.timeRange || '';
     
     return await promptTemplate.format({
       groupName: request.groupName || '群聊',
       timeRange: displayTimeRange,
       chatContent,
       messageCount: messages.length,
       customPrompt: request.customPrompt || ''
     });
  }

  /**
   * 创建分析链
   */
  private createAnalysisChain() {
    return RunnableSequence.from([
      {
        prompt: (input: any) => input.prompt,
      },
      this.ollama,
      this.outputParser,
    ]);
  }

  /**
   * 格式化结果
   */
  private formatResult(result: string, messages: Array<{sender: string; time: string; content: string}>, request: AnalysisRequest): any {
    try {
      // 尝试解析JSON
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      let parsedResult;

      if (jsonMatch) {
        try {
          parsedResult = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          // JSON解析失败，创建基本结构
          parsedResult = this.createFallbackResult(result, messages);
        }
      } else {
        parsedResult = this.createFallbackResult(result, messages);
      }

      // 添加元数据
      parsedResult.messageCount = messages.length;
      parsedResult.timeRange = request.timeRange || '';
      parsedResult.analysisType = request.summaryType;
      parsedResult.processedAt = new Date().toISOString();

      return parsedResult;
    } catch (error) {
      this.logger.error(`结果格式化失败: ${error.message}`);
      return this.createFallbackResult(result, messages);
    }
  }

  /**
   * 创建备用结果结构
   */
  private createFallbackResult(result: string, messages: Array<{sender: string; time: string; content: string}>): any {
    return {
      summary: result,
      keyPoints: this.extractKeyPoints(result),
      participants: this.extractParticipants(messages),
      insights: '基于LangChain的智能分析结果',
      messageCount: messages.length,
      processedAt: new Date().toISOString()
    };
  }

  /**
   * 提取关键点
   */
  private extractKeyPoints(text: string): string[] {
    const sentences = text.split(/[。！？.!?]/).filter(s => s.trim().length > 10);
    return sentences.slice(0, 5).map(s => s.trim());
  }

  /**
   * 提取参与者
   */
  private extractParticipants(messages: Array<{sender: string; time: string; content: string}>): string[] {
    const participants = new Set(messages.map(msg => msg.sender));
    return Array.from(participants);
  }
} 