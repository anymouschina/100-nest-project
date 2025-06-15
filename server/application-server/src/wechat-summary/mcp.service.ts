import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface McpChatLogRequest {
  time: string;
  talker: string;
  sender?: string;
  keyword?: string;
  limit?: number;
  offset?: number;
  format?: 'json' | 'csv' | 'text';
}

export interface McpChatLogResponse {
  messages: Array<{
    sender: string;
    senderId: string;
    time: string;
    content: string;
    talker: string;
  }>;
  totalCount: number;
}

export interface McpChatRoomRequest {
  keyword?: string;
  format?: 'json' | 'csv' | 'text';
}

export interface McpChatRoomResponse {
  chatRooms: Array<{
    id: string;
    name: string;
    memberCount: number;
    description?: string;
    owner?: string;
    users?: Array<{
      userName: string;
      displayName: string;
    }>;
  }>;
}

@Injectable()
export class McpService {
  private readonly logger = new Logger(McpService.name);
  private readonly chatlogBaseUrl =
    process.env.CHATLOG_BASE_URL || 'http://localhost:5030';

  constructor(private readonly httpService: HttpService) {}

  /**
   * 获取通用请求头
   */
  private getCommonHeaders() {
    return {
      Accept: '*/*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      Connection: 'keep-alive',
      Referer: `${this.chatlogBaseUrl}/`,
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'sec-ch-ua':
        '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
    };
  }

  /**
   * 查询聊天记录
   */
  async queryChatLog(request: McpChatLogRequest): Promise<McpChatLogResponse> {
    try {
      this.logger.log(`查询聊天记录: ${request.talker}`);

      // 构建查询参数
      const params = new URLSearchParams();
      params.append('time', request.time);
      params.append('talker', request.talker);
      if (request.sender) params.append('sender', request.sender);
      if (request.keyword) params.append('keyword', request.keyword);
      if (request.limit) params.append('limit', request.limit.toString());
      if (request.offset) params.append('offset', request.offset.toString());
      params.append('format', request.format || 'json');

      const url = `${this.chatlogBaseUrl}/api/v1/chatlog${params.toString() ? '?' + params.toString() : ''}`;

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: this.getCommonHeaders(),
          timeout: 30000, // 30秒超时
        }),
      );

      return this.parseChatLogResponse(response.data);
    } catch (error) {
      this.logger.error(`查询聊天记录失败: ${error.message}`, error.stack);
      throw new Error(`Chatlog查询失败: ${error.message}`);
    }
  }

  /**
   * 查询群聊列表
   */
  async queryChatRoom(
    request: McpChatRoomRequest,
  ): Promise<McpChatRoomResponse> {
    try {
      this.logger.log(`查询群聊列表: ${request.keyword || '全部'}`);

      // 构建查询参数
      const params = new URLSearchParams();
      if (request.keyword !== undefined) {
        const cleanKeyword = request.keyword.trim();
        params.append('keyword', cleanKeyword || '+');
      } else {
        params.append('keyword', '+');
      }
      params.append('format', request.format || 'json');

      const url = `${this.chatlogBaseUrl}/api/v1/chatroom${params.toString() ? '?' + params.toString() : ''}`;

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: this.getCommonHeaders(),
          timeout: 30000, // 30秒超时
        }),
      );

      return this.parseChatRoomResponse(response.data);
    } catch (error) {
      this.logger.error(`查询群聊列表失败: ${error.message}`, error.stack);
      throw new Error(`Chatlog群聊查询失败: ${error.message}`);
    }
  }

  /**
   * 查询联系人信息
   */
  async queryContact(
    keyword?: string,
    format: 'json' | 'csv' | 'text' = 'json',
  ): Promise<any> {
    try {
      this.logger.log(`查询联系人信息: ${keyword}`);

      // 构建查询参数
      const params = new URLSearchParams();
      if (keyword !== undefined) {
        const cleanKeyword = keyword.trim();
        params.append('keyword', cleanKeyword || '+');
      } else {
        params.append('keyword', '+');
      }
      params.append('format', format);

      const url = `${this.chatlogBaseUrl}/api/v1/contact${params.toString() ? '?' + params.toString() : ''}`;

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: this.getCommonHeaders(),
          timeout: 30000, // 30秒超时
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`查询联系人信息失败: ${error.message}`, error.stack);
      throw new Error(`Chatlog联系人查询失败: ${error.message}`);
    }
  }

  /**
   * 查询会话列表
   */
  async querySession(format: 'json' | 'csv' | 'text' = 'json'): Promise<any> {
    try {
      this.logger.log('查询会话列表');

      const params = new URLSearchParams();
      params.append('format', format);

      const url = `${this.chatlogBaseUrl}/api/v1/session${params.toString() ? '?' + params.toString() : ''}`;

      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: this.getCommonHeaders(),
          timeout: 30000, // 30秒超时
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`查询会话列表失败: ${error.message}`, error.stack);
      throw new Error(`Chatlog会话查询失败: ${error.message}`);
    }
  }

  /**
   * 获取当前时间
   */
  async getCurrentTime(): Promise<string> {
    try {
      // 直接返回本地时间，不再依赖外部服务
      return new Date().toISOString();
    } catch (error) {
      this.logger.warn(`获取当前时间失败，使用本地时间: ${error.message}`);
      return new Date().toISOString();
    }
  }

  /**
   * 解析聊天记录响应
   */
  private parseChatLogResponse(rawData: any): McpChatLogResponse {
    if (typeof rawData === 'string') {
      // 解析格式："昵称(ID) 时间\n消息内容\n昵称(ID) 时间\n消息内容"
      const messages = this.parseTextChatLog(rawData);
      return {
        messages,
        totalCount: messages.length,
      };
    }

    // 如果是结构化数据，需要转换为我们的格式
    if (Array.isArray(rawData)) {
      const messages = rawData.map((item) => ({
        sender:
          item.sender ||
          item.nickname ||
          item.remark ||
          item.name ||
          '未知用户',
        senderId: item.senderId || item.wxid || item.id || item.userId || '',
        time: item.time || item.timestamp || item.createTime || item.msgTime || '',
        content: item.content || item.message || item.text || item.msg || '',
        talker: item.talker || item.chatroom || item.groupName || item.roomName || '',
      }));

      return {
        messages,
        totalCount: messages.length,
      };
    }

    // 如果有data字段，提取data
    if (rawData.data && Array.isArray(rawData.data)) {
      return this.parseChatLogResponse(rawData.data);
    }

    // 如果是对象格式，可能包含分页信息
    if (rawData.messages && Array.isArray(rawData.messages)) {
      return {
        messages: this.parseChatLogResponse(rawData.messages).messages,
        totalCount: rawData.total || rawData.totalCount || rawData.messages.length,
      };
    }

    // 默认返回空结果
    return {
      messages: [],
      totalCount: 0,
    };
  }

  /**
   * 解析群聊响应
   */
  private parseChatRoomResponse(rawData: any): McpChatRoomResponse {
    let chatRooms = [];

    // 处理新的数据结构：{ items: [...] }
    if (rawData.items && Array.isArray(rawData.items)) {
      chatRooms = rawData.items;
    } else if (Array.isArray(rawData)) {
      chatRooms = rawData;
    } else if (rawData.data && Array.isArray(rawData.data)) {
      chatRooms = rawData.data;
    } else if (rawData.chatRooms && Array.isArray(rawData.chatRooms)) {
      chatRooms = rawData.chatRooms;
    } else if (rawData.rooms && Array.isArray(rawData.rooms)) {
      chatRooms = rawData.rooms;
    }

    const formattedChatRooms = chatRooms.map((room) => ({
      id: room.name || room.id || room.wxid || room.chatroomId || room.roomId || '',
      name:
        room.nickName ||
        room.nickname ||
        room.name ||
        room.remark ||
        room.displayName ||
        room.roomName ||
        '未知群聊',
      memberCount: room.users?.length || room.memberCount || room.member_count || room.count || 0,
      description: room.remark || room.description || room.desc || room.topic || '',
      owner: room.owner || '',
      users: room.users || [],
    }));

    return {
      chatRooms: formattedChatRooms,
    };
  }

  /**
   * 解析文本格式的聊天记录
   */
  private parseTextChatLog(text: string): McpChatLogResponse['messages'] {
    const messages: McpChatLogResponse['messages'] = [];
    const lines = text.split('\n').filter((line) => line.trim());

    for (let i = 0; i < lines.length; i += 2) {
      const headerLine = lines[i];
      const contentLine = lines[i + 1];

      if (!headerLine || !contentLine) continue;

      // 解析格式："昵称(ID) 时间" 或 "[TalkerName(Talker)] 时间"
      const match =
        headerLine.match(/^(.+?)\((.+?)\)\s+(.+)$/) ||
        headerLine.match(/^\[(.+?)\((.+?)\)\]\s+(.+)$/);

      if (match) {
        const [, sender, senderId, time] = match;
        messages.push({
          sender: sender.trim(),
          senderId: senderId.trim(),
          time: time.trim(),
          content: contentLine.trim(),
          talker: '', // 需要从上下文获取
        });
      }
    }

    return messages;
  }

  /**
   * 检查Chatlog服务状态
   */
  async checkChatlogStatus(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.chatlogBaseUrl}/api/v1/session?format=json`, {
          headers: this.getCommonHeaders(),
          timeout: 5000,
        }),
      );
      return response.status === 200;
    } catch (error) {
      this.logger.warn(`Chatlog服务不可用: ${error.message}`);
      return false;
    }
  }
}