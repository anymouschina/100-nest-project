import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, Observable } from 'rxjs';
import { Response } from 'express';
import * as crypto from 'crypto';

export interface OllamaSummaryRequest {
  messages: Array<{
    sender: string;
    senderId?: string;
    nickname?: string;
    time: string;
    content: string;
  }>;
  summaryType:
    | 'daily'
    | 'topic'
    | 'participant'
    | 'custom'
    | 'style_analysis'
    | 'sentiment_analysis'
    | 'activity_analysis'
    | 'keyword_extraction';
  customPrompt?: string;
  groupName?: string;
  timeRange?: string;
}

export interface OllamaSummaryResponse {
  summary: string;
  keyPoints: string[];
  participants: string[];
  timeRange: string;
  messageCount: number;
}

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  private readonly defaultModel = process.env.OLLAMA_MODEL || 'qwen3';
  private readonly cache = new Map<string, OllamaSummaryResponse>();
  private readonly cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30分钟缓存

  // 添加优化配置常量
  private readonly MAX_MESSAGES = 500; // 最大消息数量
  private readonly MAX_CONTENT_LENGTH = 100; // 单条消息最大长度
  private readonly MIN_CONTENT_LENGTH = 5; // 单条消息最小长度
  private readonly DUPLICATE_THRESHOLD = 0.8; // 重复内容相似度阈值

  constructor(private readonly httpService: HttpService) {}

  /**
   * 使用Ollama模型总结聊天记录（支持缓存）
   */
  async summarizeChatLog(
    request: OllamaSummaryRequest,
  ): Promise<OllamaSummaryResponse> {
    try {
      this.logger.log(`开始总结聊天记录，原始消息数量: ${request.messages.length}`);

      // 数据预处理和优化
      const optimizedMessages = await this.optimizeMessages(request.messages);
      this.logger.log(`优化后消息数量: ${optimizedMessages.length}`);

      const optimizedRequest = { ...request, messages: optimizedMessages };

      // 生成缓存键
      const cacheKey = this.generateCacheKey(optimizedRequest);
      
      // 检查缓存
      const cachedResult = this.getCachedResult(cacheKey);
      if (cachedResult) {
        this.logger.log('使用缓存结果');
        return cachedResult;
      }

      const prompt = this.buildSummaryPrompt(optimizedRequest);
      const response = await this.callOllama(prompt);
      
      const result = this.parseSummaryResponse(response, optimizedRequest);
      
      // 缓存结果
      this.setCachedResult(cacheKey, result);
      
      return result;
    } catch (error) {
      this.logger.error(`聊天记录总结失败: ${error.message}`, error.stack);
      throw new Error(`Ollama总结失败: ${error.message}`);
    }
  }

  /**
   * 流式总结聊天记录（无缓存时使用）
   */
  async summarizeChatLogStream(
    request: OllamaSummaryRequest,
    response: Response,
  ): Promise<void> {
    try {
      this.logger.log(`开始流式总结聊天记录，原始消息数量: ${request.messages.length}`);

      // 数据预处理和优化
      const optimizedMessages = await this.optimizeMessages(request.messages);
      this.logger.log(`优化后消息数量: ${optimizedMessages.length}`);

      const optimizedRequest = { ...request, messages: optimizedMessages };

      // 生成缓存键
      const cacheKey = this.generateCacheKey(optimizedRequest);
      
      // 检查缓存
      const cachedResult = this.getCachedResult(cacheKey);
      if (cachedResult) {
        this.logger.log('使用缓存结果进行流式返回');
        // 模拟流式返回缓存结果
        response.writeHead(200, {
          'Content-Type': 'text/plain; charset=utf-8',
          'Transfer-Encoding': 'chunked',
        });
        
        const resultText = JSON.stringify(cachedResult, null, 2);
        const chunks = resultText.match(/.{1,50}/g) || [resultText];
        
        for (const chunk of chunks) {
          response.write(chunk);
          await new Promise(resolve => setTimeout(resolve, 50)); // 模拟延迟
        }
        response.end();
        return;
      }

      // 设置流式响应头
      response.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      });

      const prompt = this.buildSummaryPrompt(optimizedRequest);
      
      // 调用流式API
      await this.callOllamaStream(prompt, response, optimizedRequest, cacheKey);
      
    } catch (error) {
      this.logger.error(`流式总结失败: ${error.message}`, error.stack);
      if (!response.headersSent) {
        response.writeHead(500, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: `流式总结失败: ${error.message}` }));
      }
    }
  }

  /**
   * 优化消息数据 - 核心优化方法
   */
  private async optimizeMessages(messages: Array<{sender: string; time: string; content: string}>): Promise<Array<{sender: string; time: string; content: string}>> {
    this.logger.log('开始消息优化处理...');
    
    let optimizedMessages = [...messages];

    // 1. 基础过滤 - 移除无效消息
    optimizedMessages = this.filterInvalidMessages(optimizedMessages);
    this.logger.log(`基础过滤后: ${optimizedMessages.length} 条消息`);

    // 2. 去重处理 - 移除重复或相似消息
    optimizedMessages = this.removeDuplicateMessages(optimizedMessages);
    this.logger.log(`去重处理后: ${optimizedMessages.length} 条消息`);

    // 3. 内容优化 - 截断过长消息
    optimizedMessages = this.truncateMessages(optimizedMessages);
    this.logger.log(`内容优化后: ${optimizedMessages.length} 条消息`);

    // 4. 智能采样 - 如果消息仍然太多，进行智能采样
    if (optimizedMessages.length > this.MAX_MESSAGES) {
      optimizedMessages = this.intelligentSampling(optimizedMessages);
      this.logger.log(`智能采样后: ${optimizedMessages.length} 条消息`);
    }

    // 5. 按时间排序确保顺序正确
    optimizedMessages = this.sortMessagesByTime(optimizedMessages);

    return optimizedMessages;
  }

  /**
   * 基础过滤 - 移除无效消息
   */
  private filterInvalidMessages(messages: Array<{sender: string; time: string; content: string}>): Array<{sender: string; time: string; content: string}> {
    return messages.filter(msg => {
      // 过滤空消息
      if (!msg.content || msg.content.trim().length === 0) {
        return false;
      }

      // 过滤过短的消息（可能是表情或无意义内容）
      if (msg.content.trim().length < this.MIN_CONTENT_LENGTH) {
        return false;
      }

      // 过滤系统消息（如"xxx加入群聊"等）
      const systemMessagePatterns = [
        /加入了群聊/,
        /退出了群聊/,
        /修改群名为/,
        /撤回了一条消息/,
        /拍了拍/,
        /^@/,  // @消息可能包含重要信息，但如果只是@符号则过滤
      ];

      const isSystemMessage = systemMessagePatterns.some(pattern => 
        pattern.test(msg.content.trim())
      );

      // 过滤纯表情消息（连续的表情符号）
      const isOnlyEmoji = /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/u.test(msg.content.trim());

      // 过滤重复的简单回复（如"好的"、"是的"、"哈哈"等）
      const simpleReplies = ['好的', '是的', '哈哈', '嗯嗯', '👍', '👌', '😂', '😄', '😊'];
      const isSimpleReply = simpleReplies.includes(msg.content.trim());

      return !isSystemMessage && !isOnlyEmoji && !isSimpleReply;
    });
  }

  /**
   * 去重处理 - 移除重复或相似消息
   */
  private removeDuplicateMessages(messages: Array<{sender: string; time: string; content: string}>): Array<{sender: string; time: string; content: string}> {
    const uniqueMessages: Array<{sender: string; time: string; content: string}> = [];
    const seenContents = new Set<string>();

    for (const message of messages) {
      const normalizedContent = message.content.trim().toLowerCase();
      
      // 完全重复检查
      if (seenContents.has(normalizedContent)) {
        continue;
      }

      // 相似度检查 - 检查是否与已有消息过于相似
      let isSimilar = false;
      for (const existingContent of seenContents) {
        if (this.calculateSimilarity(normalizedContent, existingContent) > this.DUPLICATE_THRESHOLD) {
          isSimilar = true;
          break;
        }
      }

      if (!isSimilar) {
        uniqueMessages.push(message);
        seenContents.add(normalizedContent);
      }
    }

    return uniqueMessages;
  }

  /**
   * 计算两个字符串的相似度
   */
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.length === 0 || str2.length === 0) return 0;

    // 使用简单的编辑距离算法
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    const maxLength = Math.max(str1.length, str2.length);
    return 1 - matrix[str2.length][str1.length] / maxLength;
  }

  /**
   * 内容优化 - 截断过长消息
   */
  private truncateMessages(messages: Array<{sender: string; time: string; content: string}>): Array<{sender: string; time: string; content: string}> {
    return messages.map(msg => ({
      ...msg,
      content: msg.content.length > this.MAX_CONTENT_LENGTH 
        ? msg.content.substring(0, this.MAX_CONTENT_LENGTH) + '...'
        : msg.content
    }));
  }

  /**
   * 智能采样 - 保留重要消息
   */
  private intelligentSampling(messages: Array<{sender: string; time: string; content: string}>): Array<{sender: string; time: string; content: string}> {
    // 计算每条消息的重要性分数
    const scoredMessages = messages.map((msg, index) => ({
      ...msg,
      index,
      score: this.calculateMessageImportance(msg, messages)
    }));

    // 按重要性排序
    scoredMessages.sort((a, b) => b.score - a.score);

    // 选择前N条重要消息
    const selectedMessages = scoredMessages.slice(0, this.MAX_MESSAGES);

    // 按原始时间顺序重新排序
    selectedMessages.sort((a, b) => a.index - b.index);

    return selectedMessages.map(({ index, score, ...msg }) => msg);
  }

  /**
   * 计算消息重要性分数
   */
  private calculateMessageImportance(message: {sender: string; time: string; content: string}, allMessages: Array<{sender: string; time: string; content: string}>): number {
    let score = 0;

    // 1. 长度分数 - 较长的消息通常包含更多信息
    score += Math.min(message.content.length / 50, 3);

    // 2. 关键词分数 - 包含重要关键词的消息
    const importantKeywords = [
      '决定', '计划', '安排', '会议', '项目', '任务', '问题', '解决',
      '重要', '紧急', '通知', '公告', '总结', '结论', '建议', '意见'
    ];
    
    const keywordCount = importantKeywords.filter(keyword => 
      message.content.includes(keyword)
    ).length;
    score += keywordCount * 2;

    // 3. 问号分数 - 问题通常很重要
    const questionCount = (message.content.match(/[？?]/g) || []).length;
    score += questionCount * 1.5;

    // 4. 数字和时间分数 - 包含具体数据的消息
    const hasNumbers = /\d+/.test(message.content);
    const hasTime = /\d{1,2}[：:]\d{2}|\d{1,2}月\d{1,2}日/.test(message.content);
    if (hasNumbers) score += 1;
    if (hasTime) score += 1.5;

    // 5. 发言者活跃度 - 不太活跃的人发言可能更重要
    const senderMessageCount = allMessages.filter(msg => msg.sender === message.sender).length;
    const totalMessages = allMessages.length;
    const senderRatio = senderMessageCount / totalMessages;
    if (senderRatio < 0.1) score += 2; // 发言少的人的消息更重要

    return score;
  }

  /**
   * 按时间排序消息
   */
  private sortMessagesByTime(messages: Array<{sender: string; time: string; content: string}>): Array<{sender: string; time: string; content: string}> {
    return messages.sort((a, b) => {
      // 尝试解析时间字符串进行比较
      const timeA = new Date(a.time).getTime();
      const timeB = new Date(b.time).getTime();
      
      if (isNaN(timeA) || isNaN(timeB)) {
        // 如果时间解析失败，按字符串比较
        return a.time.localeCompare(b.time);
      }
      
      return timeA - timeB;
    });
  }

  /**
   * 构建总结提示词
   */
  private buildSummaryPrompt(request: OllamaSummaryRequest): string {
    const { messages, summaryType, customPrompt, groupName, timeRange } = request;

    // 格式化聊天记录 - 优先使用昵称
    const chatContent = messages
      .map(msg => {
        const displayName = msg.nickname || msg.sender;
        return `${msg.time} ${displayName}: ${msg.content}`;
      })
      .join('\n');

    let systemPrompt = '';
    
    switch (summaryType) {
      case 'daily':
        systemPrompt = `你是一个专业的聊天记录分析助手。请对以下${groupName ? `"${groupName}"群聊` : '聊天'}的${timeRange || ''}记录进行日常总结。

要求：
1. 提供简洁明了的整体总结
2. 列出3-5个关键讨论点
3. 识别主要参与者
4. 注意重要信息和决定
5. 使用中文回复

请按以下JSON格式回复：
{
  "summary": "整体总结内容",
  "keyPoints": ["关键点1", "关键点2", "关键点3"],
  "participants": ["参与者1", "参与者2"],
  "insights": "深度洞察"
}`;
        break;

      case 'topic':
        systemPrompt = `你是一个专业的聊天记录分析助手。请对以下聊天记录进行主题分析和总结。

要求：
1. 识别主要讨论主题
2. 分析每个主题的讨论深度
3. 总结关键观点和结论
4. 识别未解决的问题
5. 使用中文回复

请按以下JSON格式回复：
{
  "summary": "主题总结",
  "keyPoints": ["主要观点1", "主要观点2"],
  "participants": ["参与者列表"],
  "insights": "主题洞察"
}`;
        break;

      case 'participant':
        systemPrompt = `你是一个专业的聊天记录分析助手。请对以下聊天记录进行参与者行为分析。

要求：
1. 分析各参与者的发言特点
2. 识别活跃参与者和关键贡献
3. 总结互动模式
4. 分析群体动态
5. 使用中文回复

请按以下JSON格式回复：
{
  "summary": "参与者分析总结",
  "keyPoints": ["行为特点1", "行为特点2"],
  "participants": ["参与者分析"],
  "insights": "互动洞察"
}`;
        break;

      case 'custom':
        systemPrompt = customPrompt || '请总结以下聊天记录的主要内容。';
        break;

      case 'style_analysis':
        systemPrompt = `你是一个专业的群聊风格分析师。请对以下${groupName ? `"${groupName}"群聊` : '聊天'}进行风格评价和分析。

要求：
1. 分析群聊的整体氛围和风格特点
2. 评价讨论质量和深度
3. 识别群聊的主要特征（活跃度、专业性、娱乐性等）
4. 给出群聊风格评分（1-10分）
5. 提供改进建议
6. 使用中文回复

请按以下JSON格式回复：
{
  "summary": "群聊风格总体评价",
  "keyPoints": ["风格特点1", "风格特点2", "风格特点3"],
  "styleScore": 8,
  "atmosphere": "活跃友好",
  "characteristics": ["专业讨论", "信息量大", "互动频繁"],
  "suggestions": ["建议1", "建议2"]
}`;
        break;

      case 'sentiment_analysis':
        systemPrompt = `你是一个专业的情感分析师。请对以下聊天记录进行情感倾向分析。

要求：
1. 分析整体情感倾向（积极、消极、中性）
2. 识别情感变化趋势
3. 分析不同参与者的情感状态
4. 识别情感高峰和低谷时刻
5. 使用中文回复

请按以下JSON格式回复：
{
  "summary": "情感分析总结",
  "overallSentiment": "积极",
  "sentimentScore": 7.5,
  "keyPoints": ["情感特点1", "情感特点2"],
  "emotionalHighlights": ["高峰时刻", "低谷时刻"],
  "participantEmotions": {"张三": "积极", "李四": "中性"}
}`;
        break;

      case 'activity_analysis':
        systemPrompt = `你是一个专业的群聊活跃度分析师。请对以下聊天记录进行活跃度分析。

要求：
1. 分析群聊活跃度水平和模式
2. 识别最活跃的时间段和参与者
3. 分析消息类型分布（文字、表情、图片等）
4. 评估群聊健康度
5. 使用中文回复

请按以下JSON格式回复：
{
  "summary": "活跃度分析总结",
  "activityLevel": "高",
  "activityScore": 8.5,
  "keyPoints": ["活跃特点1", "活跃特点2"],
  "peakTimes": ["上午10点", "下午3点"],
  "topParticipants": ["张三", "李四"],
  "messageTypes": {"文字": 80, "表情": 15, "其他": 5}
}`;
        break;

      case 'keyword_extraction':
        systemPrompt = `你是一个专业的关键词提取分析师。请从以下聊天记录中提取和分析关键信息。

要求：
1. 提取最重要的关键词和短语
2. 识别讨论的核心主题
3. 分析关键词的重要性和频率
4. 归类不同类型的关键词
5. 使用中文回复

请按以下JSON格式回复：
{
  "summary": "关键词提取总结",
  "keyPoints": ["核心主题1", "核心主题2"],
  "topKeywords": ["关键词1", "关键词2", "关键词3"],
  "keywordCategories": {
    "技术": ["AI", "算法"],
    "商业": ["营收", "模式"],
    "人物": ["张三", "李四"]
  },
  "importantPhrases": ["重要短语1", "重要短语2"]
}`;
        break;
    }

    return `${systemPrompt}

聊天记录：
${chatContent}`;
  }

  /**
   * 调用Ollama API
   */
  private async callOllama(prompt: string): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.ollamaBaseUrl}/api/generate`, {
          model: this.defaultModel,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 2000,
          },
        }, {
          // timeout: 60000, // 60秒超时
        })
      );

      return response.data.response || '';
    } catch (error) {
      this.logger.error(`Ollama API调用失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 解析总结响应
   */
  private parseSummaryResponse(
    response: string,
    request: OllamaSummaryRequest,
  ): OllamaSummaryResponse {
    try {
      // 尝试解析JSON响应
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary || response,
          keyPoints: parsed.keyPoints || [],
          participants: parsed.participants || this.extractParticipants(request.messages),
          timeRange: request.timeRange || '',
          messageCount: request.messages.length,
        };
      }
    } catch (error) {
      this.logger.warn(`JSON解析失败，使用文本响应: ${error.message}`);
    }

    // 如果JSON解析失败，返回文本响应
    return {
      summary: response,
      keyPoints: this.extractKeyPoints(response),
      participants: this.extractParticipants(request.messages),
      timeRange: request.timeRange || '',
      messageCount: request.messages.length,
    };
  }

  /**
   * 提取关键点
   */
  private extractKeyPoints(text: string): string[] {
    const keyPoints: string[] = [];
    
    // 查找数字列表
    const numberListMatches = text.match(/\d+[.、]\s*([^\n]+)/g);
    if (numberListMatches) {
      keyPoints.push(...numberListMatches.map(match => 
        match.replace(/^\d+[.、]\s*/, '').trim()
      ));
    }

    // 查找破折号列表
    const dashListMatches = text.match(/[-•]\s*([^\n]+)/g);
    if (dashListMatches) {
      keyPoints.push(...dashListMatches.map(match => 
        match.replace(/^[-•]\s*/, '').trim()
      ));
    }

    return keyPoints.slice(0, 5); // 最多返回5个关键点
  }

  /**
   * 提取参与者
   */
  private extractParticipants(messages: OllamaSummaryRequest['messages']): string[] {
    const participants = new Set<string>();
    messages.forEach(msg => {
      const displayName = msg.nickname || msg.sender;
      participants.add(displayName);
    });
    return Array.from(participants);
  }

  /**
   * 检查Ollama服务状态
   */
  async checkOllamaStatus(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.ollamaBaseUrl}/api/tags`, {
          timeout: 5000,
        })
      );
      return response.status === 200;
    } catch (error) {
      this.logger.warn(`Ollama服务不可用: ${error.message}`);
      return false;
    }
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(request: OllamaSummaryRequest): string {
    const content = JSON.stringify({
      messages: request.messages.map(m => ({ sender: m.sender, content: m.content })),
      summaryType: request.summaryType,
      customPrompt: request.customPrompt,
      groupName: request.groupName,
    });
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * 获取缓存结果
   */
  private getCachedResult(cacheKey: string): OllamaSummaryResponse | null {
    const expiry = this.cacheExpiry.get(cacheKey);
    if (expiry && Date.now() > expiry) {
      // 缓存过期，清理
      this.cache.delete(cacheKey);
      this.cacheExpiry.delete(cacheKey);
      return null;
    }
    return this.cache.get(cacheKey) || null;
  }

  /**
   * 设置缓存结果
   */
  private setCachedResult(cacheKey: string, result: OllamaSummaryResponse): void {
    this.cache.set(cacheKey, result);
    this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);
  }

  /**
   * 流式调用Ollama API
   */
  private async callOllamaStream(
    prompt: string, 
    response: Response, 
    request: OllamaSummaryRequest,
    cacheKey: string
  ): Promise<void> {
    try {
      const streamResponse = await firstValueFrom(
        this.httpService.post(`${this.ollamaBaseUrl}/api/generate`, {
          model: this.defaultModel,
          prompt: prompt,
          stream: true,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 2000,
          },
        }, {
          timeout: 120000, // 2分钟超时
          responseType: 'stream',
        })
      );

      let fullResponse = '';
      
      streamResponse.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              fullResponse += data.response;
              response.write(data.response);
            }
            
            if (data.done) {
              // 流式传输完成，解析并缓存结果
              const result = this.parseSummaryResponse(fullResponse, request);
              this.setCachedResult(cacheKey, result);
              
              // 发送最终的JSON结果
              response.write('\n\n--- 总结完成 ---\n');
              response.write(JSON.stringify(result, null, 2));
              response.end();
            }
          } catch (parseError) {
            // 忽略JSON解析错误，继续处理
          }
        }
      });

      streamResponse.data.on('error', (error: Error) => {
        this.logger.error(`流式响应错误: ${error.message}`);
        if (!response.headersSent) {
          response.writeHead(500);
        }
        response.end(`\n错误: ${error.message}`);
      });

    } catch (error) {
      this.logger.error(`流式API调用失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 清理过期缓存
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, expiry] of this.cacheExpiry.entries()) {
      if (now > expiry) {
        this.cache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }
  }
} 