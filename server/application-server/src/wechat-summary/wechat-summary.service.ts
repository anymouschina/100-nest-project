import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';
import { McpService, McpChatLogRequest } from './mcp.service';
import { OllamaService, OllamaSummaryRequest } from './ollama.service';
import { BatchAnalysisRequestDto, ComparisonAnalysisRequestDto } from './dto/summary-request.dto';

export interface WechatSummaryRequest {
  groupName?: string;
  timeRange: string;
  summaryType?: 'daily' | 'topic' | 'participant' | 'custom' | 'style_analysis' | 'sentiment_analysis' | 'activity_analysis' | 'keyword_extraction';
  customPrompt?: string;
  keyword?: string;
  sender?: string;
}

export interface WechatSummaryResponse {
  success: boolean;
  data?: {
    summary: string;
    keyPoints: string[];
    participants: string[];
    timeRange: string;
    messageCount: number;
    groupName?: string;
  };
  error?: string;
}

@Injectable()
export class WechatSummaryService {
  private readonly logger = new Logger(WechatSummaryService.name);

  constructor(
    private readonly mcpService: McpService,
    private readonly ollamaService: OllamaService,
  ) {}

  /**
   * 总结微信群聊记录
   */
  async summarizeGroupChat(request: WechatSummaryRequest): Promise<WechatSummaryResponse> {
    try {
      this.logger.log(`开始总结群聊记录: ${JSON.stringify(request)}`);

      // 1. 检查Chatlog服务状态
      const isChatlogAvailable = await this.mcpService.checkChatlogStatus();
      if (!isChatlogAvailable) {
        return {
          success: false,
          error: 'Chatlog服务不可用，请确保Chatlog HTTP服务正在运行',
        };
      }

      // 2. 检查Ollama服务状态
      const isOllamaAvailable = await this.ollamaService.checkOllamaStatus();
      if (!isOllamaAvailable) {
        return {
          success: false,
          error: 'Ollama服务不可用，请确保Ollama正在运行',
        };
      }

      // 3. 查询聊天记录
      const chatLogRequest: McpChatLogRequest = {
        time: request.timeRange,
        talker: request.groupName || '',
        keyword: request.keyword,
        sender: request.sender,
      };

      const chatLogResponse = await this.mcpService.queryChatLog(chatLogRequest);

      if (!chatLogResponse.messages || chatLogResponse.messages.length === 0) {
        return {
          success: false,
          error: '未找到符合条件的聊天记录',
        };
      }

      // 4. 准备Ollama总结请求
      const summaryRequest: OllamaSummaryRequest = {
        messages: chatLogResponse.messages.map(msg => ({
          sender: msg.sender,
          time: msg.time,
          content: msg.content,
        })),
        summaryType: request.summaryType || 'daily',
        customPrompt: request.customPrompt,
        groupName: request.groupName,
        timeRange: request.timeRange,
      };

      // 5. 使用Ollama进行总结
      const summaryResponse = await this.ollamaService.summarizeChatLog(summaryRequest);

      return {
        success: true,
        data: {
          summary: summaryResponse.summary,
          keyPoints: summaryResponse.keyPoints,
          participants: summaryResponse.participants,
          timeRange: summaryResponse.timeRange,
          messageCount: summaryResponse.messageCount,
          groupName: request.groupName,
        },
      };
    } catch (error) {
      this.logger.error(`群聊总结失败: ${error.message}`, error.stack);
      return {
        success: false,
        error: `总结失败: ${error.message}`,
      };
    }
  }

  /**
   * 获取群聊列表
   */
  async getGroupList(keyword?: string, format: 'json' | 'csv' | 'text' = 'json'): Promise<any> {
    try {
      const response = await this.mcpService.queryChatRoom({ 
        keyword,
        format // 使用传入的格式参数
      });
      return response.chatRooms
    } catch (error) {
      this.logger.error(`获取群聊列表失败: ${error.message}`, error.stack);
      return {
        success: false,
        error: `获取群聊列表失败: ${error.message}`,
      };
    }
  }

  /**
   * 智能时间范围总结
   */
  async smartSummary(request: {
    groupName?: string;
    relativeTime?: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'lastQuarter';
    specificDate?: string;
    summaryType?: 'daily' | 'topic' | 'participant' | 'custom' | 'style_analysis' | 'sentiment_analysis' | 'activity_analysis' | 'keyword_extraction';
    includeDetailedAnalysis?: boolean;
    customPrompt?: string;
  }): Promise<WechatSummaryResponse> {
    try {
      this.logger.log(`开始智能总结: ${JSON.stringify(request)}`);

      // 1. 检查服务状态
      const isChatlogAvailable = await this.mcpService.checkChatlogStatus();
      if (!isChatlogAvailable) {
        return {
          success: false,
          error: 'Chatlog服务不可用，请确保Chatlog HTTP服务正在运行',
        };
      }

      const isOllamaAvailable = await this.ollamaService.checkOllamaStatus();
      if (!isOllamaAvailable) {
        return {
          success: false,
          error: 'Ollama服务不可用，请确保Ollama正在运行',
        };
      }

      // 2. 获取当前时间并计算时间范围
      const now = new Date();
      const timeRange = this.calculateTimeRange(now, request.relativeTime);

      // 3. 通过Chatlog查询聊天记录
      const chatLogRequest = {
        time: timeRange,
        talker: request.groupName || '',
        format: 'json' as const,
      };

      const chatLogResponse = await this.mcpService.queryChatLog(chatLogRequest);

      if (!chatLogResponse.messages || chatLogResponse.messages.length === 0) {
        return {
          success: false,
          error: '未找到符合条件的聊天记录',
        };
      }

      // 4. 准备Ollama总结请求
      const summaryRequest = {
        messages: chatLogResponse.messages.map(msg => ({
          sender: msg.sender,
          time: msg.time,
          content: msg.content,
        })),
        summaryType: request.summaryType || 'daily',
        customPrompt: request.customPrompt,
        groupName: request.groupName,
        timeRange: timeRange,
      };

      // 5. 直接使用Ollama进行总结
      const summaryResponse = await this.ollamaService.summarizeChatLog(summaryRequest);

      return {
        success: true,
        data: {
          summary: summaryResponse.summary,
          keyPoints: summaryResponse.keyPoints,
          participants: summaryResponse.participants,
          timeRange: summaryResponse.timeRange,
          messageCount: summaryResponse.messageCount,
          groupName: request.groupName,
        },
      };
    } catch (error) {
      this.logger.error(`智能总结失败: ${error.message}`, error.stack);
      return {
        success: false,
        error: `智能总结失败: ${error.message}`,
      };
    }
  }

  /**
   * 获取聊天数据 - 为LangChain服务提供数据
   */
  async getChatData(request: {
    groupName?: string;
    relativeTime?: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'lastQuarter';
    specificDate?: string;
  }): Promise<{
    success: boolean;
    data?: Array<{
      sender: string;
      time: string;
      content: string;
    }>;
    error?: string;
  }> {
    try {
      this.logger.log(`获取聊天数据: ${JSON.stringify(request)}`);

      // 1. 检查Chatlog服务状态
      const isChatlogAvailable = await this.mcpService.checkChatlogStatus();
      if (!isChatlogAvailable) {
        return {
          success: false,
          error: 'Chatlog服务不可用，请确保Chatlog HTTP服务正在运行',
        };
      }

      // 2. 计算时间范围
      let timeRange: string;
      if (request.specificDate) {
        // 使用指定日期
        timeRange = request.specificDate;
        this.logger.log(`使用指定日期: ${timeRange}`);
      } else if (request.relativeTime) {
        // 使用相对时间
        const now = new Date();
        timeRange = this.calculateTimeRange(now, request.relativeTime);
        this.logger.log(`使用相对时间 ${request.relativeTime}: ${timeRange}`);
      } else {
        return {
          success: false,
          error: '必须提供relativeTime或specificDate参数',
        };
      }

      // 3. 查询聊天记录
      const chatLogRequest = {
        time: timeRange,
        talker: request.groupName || '',
        format: 'json' as const,
      };

      const chatLogResponse = await this.mcpService.queryChatLog(chatLogRequest);

      if (!chatLogResponse.messages || chatLogResponse.messages.length === 0) {
        return {
          success: false,
          error: '未找到符合条件的聊天记录',
        };
      }

      // 4. 转换数据格式
      const chatData = chatLogResponse.messages.map(msg => ({
        sender: msg.sender,
        time: msg.time,
        content: msg.content,
      }));

      return {
        success: true,
        data: chatData,
      };
    } catch (error) {
      this.logger.error(`获取聊天数据失败: ${error.message}`, error.stack);
      return {
        success: false,
        error: `获取聊天数据失败: ${error.message}`,
      };
    }
  }

  /**
   * 流式智能总结
   */
  async smartSummaryStream(request: {
    groupName?: string;
    relativeTime?: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'lastQuarter';
    specificDate?: string;
    summaryType?: 'daily' | 'topic' | 'participant' | 'custom' | 'style_analysis' | 'sentiment_analysis' | 'activity_analysis' | 'keyword_extraction';
    includeDetailedAnalysis?: boolean;
    customPrompt?: string;
  }, response: Response): Promise<void> {
    try {
      this.logger.log(`开始流式智能总结: ${JSON.stringify(request)}`);

      // 1. 检查服务状态
      const isChatlogAvailable = await this.mcpService.checkChatlogStatus();
      if (!isChatlogAvailable) {
        response.status(500).json({
          success: false,
          error: 'Chatlog服务不可用，请确保Chatlog HTTP服务正在运行',
        });
        return;
      }

      const isOllamaAvailable = await this.ollamaService.checkOllamaStatus();
      if (!isOllamaAvailable) {
        response.status(500).json({
          success: false,
          error: 'Ollama服务不可用，请确保Ollama正在运行',
        });
        return;
      }

      // 2. 计算时间范围
      let timeRange: string;
      if (request.specificDate) {
        // 使用指定日期
        timeRange = request.specificDate;
        this.logger.log(`使用指定日期: ${timeRange}`);
      } else if (request.relativeTime) {
        // 使用相对时间
        const now = new Date();
        timeRange = this.calculateTimeRange(now, request.relativeTime);
        this.logger.log(`使用相对时间 ${request.relativeTime}: ${timeRange}`);
      } else {
        response.status(400).json({
          success: false,
          error: '必须提供relativeTime或specificDate参数',
        });
        return;
      }

      // 3. 通过Chatlog查询聊天记录
      const chatLogRequest = {
        time: timeRange,
        talker: request.groupName || '',
        format: 'json' as const,
      };

      const chatLogResponse = await this.mcpService.queryChatLog(chatLogRequest);

      if (!chatLogResponse.messages || chatLogResponse.messages.length === 0) {
        response.status(404).json({
          success: false,
          error: '未找到符合条件的聊天记录',
        });
        return;
      }

      // 4. 准备Ollama总结请求
      const summaryRequest = {
        messages: chatLogResponse.messages.map(msg => ({
          sender: msg.sender,
          time: msg.time,
          content: msg.content,
        })),
        summaryType: request.summaryType || 'daily',
        customPrompt: request.customPrompt,
        groupName: request.groupName,
        timeRange: timeRange,
      };

      // 5. 使用流式Ollama进行总结
      await this.ollamaService.summarizeChatLogStream(summaryRequest, response);

    } catch (error) {
      this.logger.error(`流式智能总结失败: ${error.message}`, error.stack);
      if (!response.headersSent) {
        response.status(500).json({
          success: false,
          error: `流式智能总结失败: ${error.message}`,
        });
      }
    }
  }

  /**
   * 计算相对时间范围
   */
  private calculateTimeRange(now: Date, relativeTime: string): string {
    const formatDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };

    const formatDateTime = (date: Date): string => {
      return date.toISOString().split('T')[0] + '/' + 
             date.toTimeString().split(' ')[0].substring(0, 5);
    };

    switch (relativeTime) {
      case 'today': {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        return `${formatDateTime(startOfDay)}~${formatDateTime(endOfDay)}`;
      }

      case 'yesterday': {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const startOfDay = new Date(yesterday);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(yesterday);
        endOfDay.setHours(23, 59, 59, 999);
        return `${formatDateTime(startOfDay)}~${formatDateTime(endOfDay)}`;
      }

      case 'thisWeek': {
        const startOfWeek = new Date(now);
        const dayOfWeek = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);
        return `${formatDate(startOfWeek)}~${formatDate(now)}`;
      }

      case 'lastWeek': {
        const lastWeek = new Date(now);
        lastWeek.setDate(lastWeek.getDate() - 7);
        const startOfWeek = new Date(lastWeek);
        const dayOfWeek = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        return `${formatDate(startOfWeek)}~${formatDate(endOfWeek)}`;
      }

      case 'thisMonth': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return `${formatDate(startOfMonth)}~${formatDate(now)}`;
      }

      case 'lastMonth': {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return `${formatDate(lastMonth)}~${formatDate(endOfLastMonth)}`;
      }

      case 'thisQuarter': {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
        return `${formatDate(startOfQuarter)}~${formatDate(now)}`;
      }

      case 'lastQuarter': {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
        const lastQuarterYear = currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
        const startOfLastQuarter = new Date(lastQuarterYear, lastQuarter * 3, 1);
        const endOfLastQuarter = new Date(lastQuarterYear, lastQuarter * 3 + 3, 0);
        return `${formatDate(startOfLastQuarter)}~${formatDate(endOfLastQuarter)}`;
      }

      default:
        return formatDate(now);
    }
  }

  /**
   * 批量分析多个群聊
   */
  async batchAnalysis(request: BatchAnalysisRequestDto): Promise<any> {
    try {
      this.logger.log(`开始批量分析: ${request.groupNames.length}个群聊`);

      const results = await Promise.allSettled(
        request.groupNames.map(async (groupName) => {
          const summaryRequest: WechatSummaryRequest = {
            groupName,
            timeRange: request.timeRange,
            summaryType: request.analysisType || 'daily',
          };
          return await this.summarizeGroupChat(summaryRequest);
        })
      );

      const successful = results
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value);

      const failed = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason);

      return {
        success: true,
        data: {
          successful,
          failed,
          summary: {
            total: request.groupNames.length,
            successful: successful.length,
            failed: failed.length,
          }
        }
      };
    } catch (error) {
      this.logger.error(`批量分析失败: ${error.message}`, error.stack);
      return {
        success: false,
        error: `批量分析失败: ${error.message}`,
      };
    }
  }

  /**
   * 对比分析两个群聊
   */
  async comparisonAnalysis(request: ComparisonAnalysisRequestDto): Promise<any> {
    try {
      this.logger.log(`开始对比分析: ${request.groupA} vs ${request.groupB}`);

      // 分别获取两个群聊的数据
      const [groupAResult, groupBResult] = await Promise.allSettled([
        this.summarizeGroupChat({
          groupName: request.groupA,
          timeRange: request.timeRange,
          summaryType: 'activity_analysis',
        }),
        this.summarizeGroupChat({
          groupName: request.groupB,
          timeRange: request.timeRange,
          summaryType: 'activity_analysis',
        })
      ]);

      if (groupAResult.status === 'rejected' || groupBResult.status === 'rejected') {
        throw new Error('获取群聊数据失败');
      }

      const comparison = this.generateComparison(
        groupAResult.value,
        groupBResult.value,
        request.comparisonDimension || 'activity'
      );

      return {
        success: true,
        data: {
          groupA: groupAResult.value,
          groupB: groupBResult.value,
          comparison,
        }
      };
    } catch (error) {
      this.logger.error(`对比分析失败: ${error.message}`, error.stack);
      return {
        success: false,
        error: `对比分析失败: ${error.message}`,
      };
    }
  }

  /**
   * 获取热门话题
   */
  async getTrendingTopics(days: number, groupName?: string): Promise<any> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const timeRange = `${this.formatDate(startDate)}~${this.formatDate(endDate)}`;

      const result = await this.summarizeGroupChat({
        groupName,
        timeRange,
        summaryType: 'keyword_extraction',
      });

      return {
        success: true,
        data: {
          timeRange: `最近${days}天`,
          groupName: groupName || '全部群聊',
          trendingTopics: result.data?.keyPoints || [],
          analysisDate: new Date().toISOString(),
        }
      };
    } catch (error) {
      this.logger.error(`获取热门话题失败: ${error.message}`, error.stack);
      return {
        success: false,
        error: `获取热门话题失败: ${error.message}`,
      };
    }
  }

  /**
   * 获取活跃度统计
   */
  async getActivityStats(timeRange?: string, groupName?: string): Promise<any> {
    try {
      const actualTimeRange = timeRange || this.calculateTimeRange(new Date(), 'today');

      const result = await this.summarizeGroupChat({
        groupName,
        timeRange: actualTimeRange,
        summaryType: 'activity_analysis',
      });

      return {
        success: true,
        data: {
          timeRange: actualTimeRange,
          groupName: groupName || '全部群聊',
          stats: result.data,
          generatedAt: new Date().toISOString(),
        }
      };
    } catch (error) {
      this.logger.error(`获取活跃度统计失败: ${error.message}`, error.stack);
      return {
        success: false,
        error: `获取活跃度统计失败: ${error.message}`,
      };
    }
  }

  /**
   * 导出总结报告
   */
  async exportSummary(summaryId: string, format: 'json' | 'markdown' | 'pdf'): Promise<any> {
    try {
      // 这里应该从数据库或缓存中获取总结数据
      // 暂时返回示例数据
      const summaryData = {
        id: summaryId,
        title: '群聊总结报告',
        generatedAt: new Date().toISOString(),
        content: '这是一个示例总结报告...',
      };

      switch (format) {
        case 'json':
          return {
            success: true,
            data: summaryData,
            downloadUrl: `/downloads/${summaryId}.json`,
          };
        case 'markdown':
          return {
            success: true,
            data: this.convertToMarkdown(summaryData),
            downloadUrl: `/downloads/${summaryId}.md`,
          };
        case 'pdf':
          return {
            success: true,
            message: 'PDF生成功能开发中',
            downloadUrl: `/downloads/${summaryId}.pdf`,
          };
        default:
          throw new Error('不支持的导出格式');
      }
    } catch (error) {
      this.logger.error(`导出总结失败: ${error.message}`, error.stack);
      return {
        success: false,
        error: `导出总结失败: ${error.message}`,
      };
    }
  }

  /**
   * 生成对比分析
   */
  private generateComparison(groupAData: any, groupBData: any, dimension: string): any {
    return {
      dimension,
      groupA: {
        name: groupAData.data?.groupName || 'Group A',
        score: this.extractScore(groupAData.data),
        highlights: groupAData.data?.keyPoints?.slice(0, 3) || [],
      },
      groupB: {
        name: groupBData.data?.groupName || 'Group B',
        score: this.extractScore(groupBData.data),
        highlights: groupBData.data?.keyPoints?.slice(0, 3) || [],
      },
      winner: this.determineWinner(groupAData.data, groupBData.data),
      insights: [
        '群聊A在活跃度方面表现更好',
        '群聊B的讨论质量更高',
        '两个群聊都有各自的特色'
      ]
    };
  }

  /**
   * 提取评分
   */
  private extractScore(data: any): number {
    return data?.messageCount ? Math.min(data.messageCount / 10, 10) : 5;
  }

  /**
   * 确定获胜者
   */
  private determineWinner(dataA: any, dataB: any): string {
    const scoreA = this.extractScore(dataA);
    const scoreB = this.extractScore(dataB);
    
    if (scoreA > scoreB) return 'groupA';
    if (scoreB > scoreA) return 'groupB';
    return 'tie';
  }

  /**
   * 转换为Markdown格式
   */
  private convertToMarkdown(data: any): string {
    return `# ${data.title}

生成时间: ${data.generatedAt}

## 总结内容

${data.content}

---
*此报告由AI自动生成*
`;
  }

  /**
   * 格式化日期
   */
  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
} 