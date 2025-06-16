import { Injectable, Logger } from '@nestjs/common';
import { McpService } from './mcp.service';

export interface UserInfo {
  wxid: string;
  nickname: string;
  remark?: string;
  displayName?: string;
  avatar?: string;
}

export interface NicknameMapping {
  [wxid: string]: {
    nickname: string;
    remark?: string;
    displayName?: string;
    lastUpdated: Date;
  };
}

@Injectable()
export class NicknameService {
  private readonly logger = new Logger(NicknameService.name);
  private nicknameCache: NicknameMapping = {};
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24小时缓存

  constructor(private readonly mcpService: McpService) {}

  /**
   * 获取用户昵称
   */
  async getNickname(wxid: string): Promise<string> {
    try {
      // 检查缓存
      const cached = this.nicknameCache[wxid];
      if (cached && this.isCacheValid(cached.lastUpdated)) {
        return cached.nickname || cached.displayName || cached.remark || wxid;
      }

      // 从联系人API获取
      await this.refreshNicknameCache();

      const updated = this.nicknameCache[wxid];
      if (updated) {
        return (
          updated.nickname || updated.displayName || updated.remark || wxid
        );
      }

      // 如果找不到，返回微信ID
      return wxid;
    } catch (error) {
      this.logger.warn(`获取昵称失败 ${wxid}: ${error.message}`);
      return wxid;
    }
  }

  /**
   * 批量获取昵称
   */
  async getBatchNicknames(
    wxids: string[],
  ): Promise<{ [wxid: string]: string }> {
    try {
      // 检查哪些需要更新
      const needUpdate = wxids.some((wxid) => {
        const cached = this.nicknameCache[wxid];
        return !cached || !this.isCacheValid(cached.lastUpdated);
      });

      if (needUpdate) {
        await this.refreshNicknameCache();
      }

      const result: { [wxid: string]: string } = {};
      for (const wxid of wxids) {
        const cached = this.nicknameCache[wxid];
        result[wxid] =
          cached?.nickname || cached?.displayName || cached?.remark || wxid;
      }

      return result;
    } catch (error) {
      this.logger.warn(`批量获取昵称失败: ${error.message}`);
      // 返回原始微信ID
      const result: { [wxid: string]: string } = {};
      wxids.forEach((wxid) => {
        result[wxid] = wxid;
      });
      return result;
    }
  }

  /**
   * 增强消息数据，添加昵称信息
   */
  async enhanceMessagesWithNicknames(
    messages: Array<{
      sender: string;
      senderId?: string;
      time: string;
      content: string;
    }>,
  ): Promise<
    Array<{
      sender: string;
      senderId: string;
      nickname: string;
      time: string;
      content: string;
    }>
  > {
    try {
      // 提取所有唯一的发送者ID
      const senderIds = [
        ...new Set(messages.map((msg) => msg.senderId || msg.sender)),
      ];

      // 批量获取昵称
      const nicknameMap = await this.getBatchNicknames(senderIds);

      // 增强消息数据
      return messages.map((msg) => {
        const senderId = msg.senderId || msg.sender;
        const nickname = nicknameMap[senderId] || msg.sender;

        return {
          sender: msg.sender,
          senderId: senderId,
          nickname: nickname,
          time: msg.time,
          content: msg.content,
        };
      });
    } catch (error) {
      this.logger.error(`增强消息昵称失败: ${error.message}`, error.stack);
      // 返回原始数据，但添加昵称字段
      return messages.map((msg) => ({
        sender: msg.sender,
        senderId: msg.senderId || msg.sender,
        nickname: msg.sender,
        time: msg.time,
        content: msg.content,
      }));
    }
  }

  /**
   * 从群聊成员信息中提取昵称映射
   */
  async extractNicknamesFromGroupInfo(groupName: string): Promise<void> {
    try {
      const chatRoomResponse = await this.mcpService.queryChatRoom({
        keyword: groupName,
      });

      for (const room of chatRoomResponse.chatRooms) {
        if (room.users && Array.isArray(room.users)) {
          for (const user of room.users) {
            if (user.userName) {
              this.nicknameCache[user.userName] = {
                nickname: user.displayName || user.userName,
                displayName: user.displayName,
                lastUpdated: new Date(),
              };
            }
          }
        }
      }

      this.logger.log(
        `从群聊 ${groupName} 提取了 ${Object.keys(this.nicknameCache).length} 个昵称映射`,
      );
    } catch (error) {
      this.logger.warn(`从群聊信息提取昵称失败: ${error.message}`);
    }
  }

  /**
   * 刷新昵称缓存
   */
  private async refreshNicknameCache(): Promise<void> {
    try {
      this.logger.log('刷新昵称缓存...');

      // 获取联系人信息
      const contactData = await this.mcpService.queryContact();

      if (Array.isArray(contactData)) {
        this.processContactArray(contactData);
      } else if (contactData.data && Array.isArray(contactData.data)) {
        this.processContactArray(contactData.data);
      } else if (contactData.items && Array.isArray(contactData.items)) {
        this.processContactArray(contactData.items);
      } else if (contactData.contacts && Array.isArray(contactData.contacts)) {
        this.processContactArray(contactData.contacts);
      }

      this.logger.log(
        `昵称缓存已更新，共 ${Object.keys(this.nicknameCache).length} 个联系人`,
      );
    } catch (error) {
      this.logger.error(`刷新昵称缓存失败: ${error.message}`, error.stack);
    }
  }

  /**
   * 处理联系人数组
   */
  private processContactArray(contacts: any[]): void {
    for (const contact of contacts) {
      const wxid =
        contact.wxid || contact.userName || contact.id || contact.userId;
      if (wxid) {
        this.nicknameCache[wxid] = {
          nickname:
            contact.nickname ||
            contact.nickName ||
            contact.name ||
            contact.displayName ||
            wxid,
          remark: contact.remark || contact.remarkName,
          displayName:
            contact.displayName || contact.nickname || contact.nickName,
          lastUpdated: new Date(),
        };
      }
    }
  }

  /**
   * 检查缓存是否有效
   */
  private isCacheValid(lastUpdated: Date): boolean {
    return Date.now() - lastUpdated.getTime() < this.cacheExpiry;
  }

  /**
   * 清理过期缓存
   */
  cleanExpiredCache(): void {
    const now = Date.now();
    const expiredKeys = Object.keys(this.nicknameCache).filter((key) => {
      return (
        now - this.nicknameCache[key].lastUpdated.getTime() > this.cacheExpiry
      );
    });

    expiredKeys.forEach((key) => {
      delete this.nicknameCache[key];
    });

    if (expiredKeys.length > 0) {
      this.logger.log(`清理了 ${expiredKeys.length} 个过期的昵称缓存`);
    }
  }

  /**
   * 手动添加昵称映射
   */
  addNicknameMapping(wxid: string, nickname: string, remark?: string): void {
    this.nicknameCache[wxid] = {
      nickname,
      remark,
      displayName: nickname,
      lastUpdated: new Date(),
    };
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): {
    totalCount: number;
    validCount: number;
    expiredCount: number;
  } {
    const now = Date.now();
    let validCount = 0;
    let expiredCount = 0;

    Object.values(this.nicknameCache).forEach((item) => {
      if (now - item.lastUpdated.getTime() < this.cacheExpiry) {
        validCount++;
      } else {
        expiredCount++;
      }
    });

    return {
      totalCount: Object.keys(this.nicknameCache).length,
      validCount,
      expiredCount,
    };
  }

  /**
   * 智能昵称显示
   * 优先级：备注 > 昵称 > 显示名 > 微信ID
   */
  getDisplayName(wxid: string): string {
    const cached = this.nicknameCache[wxid];
    if (!cached) return wxid;

    return cached.remark || cached.nickname || cached.displayName || wxid;
  }

  /**
   * 格式化发送者信息
   */
  formatSenderInfo(wxid: string, includeId: boolean = false): string {
    const displayName = this.getDisplayName(wxid);

    if (includeId && displayName !== wxid) {
      return `${displayName}(${wxid})`;
    }

    return displayName;
  }
}