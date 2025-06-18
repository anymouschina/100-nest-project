import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AppConfigService } from '../config/config.service';
import { OllamaService } from './services/ollama.service';
import { AgentFactoryService } from './services/agent-factory.service';
import { ToolRegistryService } from './services/tool-registry.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateSessionDto, MessageRole, SendMessageDto, AgentType } from './types';
import { StructuredTool } from '@langchain/core/tools';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: AppConfigService,
    private readonly ollamaService: OllamaService,
    private readonly agentFactory: AgentFactoryService,
    private readonly toolRegistry: ToolRegistryService,
  ) {}

  /**
   * 创建新的聊天会话
   */
  async createSession(createSessionDto: CreateSessionDto) {
    try {
      // 确定最适合的代理
      let agentId = createSessionDto.agentId;
      
      if (!agentId && createSessionDto.initialMessage) {
        // 如果没有指定代理但有初始消息，根据消息内容选择代理
        const agent = await this.selectBestAgentForMessage(createSessionDto.initialMessage);
        agentId = agent.id;
      }
      
      if (!agentId) {
        // 如果仍未确定代理，使用默认代理
        const defaultAgent = await this.agentFactory.getDefaultAgent();
        agentId = defaultAgent.id;
      }
      
      // 创建会话记录
      const session = await this.databaseService.chatSession.create({
        data: {
          id: uuidv4(),
          userId: createSessionDto.userId,
          agentId: agentId,
          title: createSessionDto.title || '新的会话',
          status: 'active',
          startTime: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: {}
        }
      });
      
      this.logger.log(`Created new chat session: ${session.id} with agent: ${agentId}`);
      
      // 如果有初始消息，处理它
      if (createSessionDto.initialMessage) {
        await this.sendMessage({
          userId: createSessionDto.userId,
          sessionId: session.id,
          message: createSessionDto.initialMessage
        });
      }
      
      return this.getSessionDetails(createSessionDto.userId, session.id);
    } catch (error) {
      this.logger.error(`Error creating session: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 发送消息到会话
   */
  async sendMessage(sendMessageDto: SendMessageDto) {
    try {
      const { userId, sessionId, message } = sendMessageDto;
      
      // 验证会话存在且属于该用户
      const session = await this.databaseService.chatSession.findFirst({
        where: {
          id: sessionId,
          userId,
          status: 'active'
        },
        include: {
          agent: true
        }
      });

      if (!session) {
        throw new NotFoundException('会话不存在或已结束');
      }

      // 保存用户消息
      const userMessageId = uuidv4();
      await this.databaseService.chatSessionMessage.create({
        data: {
          id: userMessageId,
          sessionId,
          role: 'user',
          content: message,
          timestamp: new Date(),
        }
      });
      
      // 获取会话历史
      const history = await this.getSessionHistory(sessionId);
      
      // 获取代理图
      const agent = await this.agentFactory.getAgentById(session.agentId);
      
      // 选择合适的工具
      const tools = await this.getToolsForAgent(agent);
      
      // 准备提交到LangGraph的状态
      const initialState = {
        messages: history.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        tools,
        agentId: agent.id
      };
      
      // 执行代理工作流
      const agentGraph = this.agentFactory.getAgentGraph(agent.id);
      const result = await agentGraph.invoke(initialState);
      
      // 从结果中提取代理的回复
      const assistantMessages = result.messages.filter(msg => msg.role === 'ai')
        .slice(-1)[0]; // 取最后一条代理消息
      
      // 检查是否需要切换代理
      let newAgentId = null;
      if (result.suggestedAgent && result.suggestedAgent !== agent.id) {
        newAgentId = result.suggestedAgent;
        
        // 保存系统消息，记录代理切换
        const newAgent = await this.agentFactory.getAgentById(newAgentId);
        await this.databaseService.chatSessionMessage.create({
          data: {
            id: uuidv4(),
            sessionId,
            role: 'system',
            content: `切换到${newAgent.name}以更好地回答您的问题`,
            timestamp: new Date(),
            metadata: {
              eventType: 'agent_switch',
              previousAgentId: agent.id,
              newAgentId,
            }
          }
        });
        
        // 更新会话代理
        await this.databaseService.chatSession.update({
          where: { id: sessionId },
          data: {
            agentId: newAgentId,
            updatedAt: new Date()
          }
        });
      }
      
      // 保存代理回复
      const assistantMessageId = uuidv4();
      await this.databaseService.chatSessionMessage.create({
        data: {
          id: assistantMessageId,
          sessionId,
          role: 'assistant',
          content: assistantMessages.content,
          timestamp: new Date(),
          metadata: {
            toolsUsed: result.toolsUsed || [],
            suggestedAgent: newAgentId
          }
        }
      });
      
      // 保存任何工具调用结果
      if (result.toolResults) {
        for (const [toolName, toolResult] of Object.entries(result.toolResults)) {
          await this.databaseService.chatSessionMessage.create({
            data: {
              id: uuidv4(),
              sessionId,
              role: 'tool',
              content: JSON.stringify(toolResult),
              timestamp: new Date(),
              metadata: {
                toolName,
                parentMessageId: assistantMessageId
              }
            }
          });
        }
      }
      
      // 更新会话时间
      await this.databaseService.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() }
      });
      
      return {
        sessionId,
        messageId: assistantMessageId,
        content: assistantMessages.content,
        agentId: newAgentId || agent.id
      };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取会话详情
   */
  async getSessionDetails(userId: number, sessionId: string) {
    const session = await this.databaseService.chatSession.findFirst({
      where: {
        id: sessionId,
        userId
      },
      include: {
        agent: true,
        messages: {
          orderBy: {
            timestamp: 'asc'
          }
        }
      }
    });
    
    if (!session) {
      throw new NotFoundException('会话不存在');
    }
    
    return session;
  }

  /**
   * 获取用户的所有会话
   */
  async getUserSessions(userId: number) {
    return this.databaseService.chatSession.findMany({
      where: {
        userId
      },
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        agent: {
          select: {
            name: true,
            description: true,
            type: true
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      }
    });
  }

  /**
   * 结束会话
   */
  async endSession(userId: number, sessionId: string) {
    const session = await this.databaseService.chatSession.findFirst({
      where: {
        id: sessionId,
        userId
      }
    });
    
    if (!session) {
      throw new NotFoundException('会话不存在');
    }
    
    return this.databaseService.chatSession.update({
      where: { id: sessionId },
      data: {
        status: 'ended',
        updatedAt: new Date()
      }
    });
  }

  /**
   * 为消息选择最佳代理
   */
  private async selectBestAgentForMessage(message: string): Promise<any> {
    try {
      // 生成消息的嵌入向量
      const embedding = await this.ollamaService.generateEmbedding(message);
      
      // 获取所有代理
      const agents = await this.agentFactory.getAllAgents();
      
      // 分析消息内容，选择最适合的代理
      // 简化版实现：基于关键词匹配
      const keywords = {
        [AgentType.PRODUCT]: ['产品', '商品', '购买', '价格', '规格', '特点'],
        [AgentType.APPOINTMENT]: ['预约', '安排', '时间', '日期', '取消', '修改'],
        [AgentType.CUSTOMER_SERVICE]: ['客服', '投诉', '退款', '问题', '售后', '服务']
      };
      
      let bestAgentType = AgentType.GENERAL;
      let maxMatches = 0;
      
      for (const [type, words] of Object.entries(keywords)) {
        const matches = words.filter(word => message.includes(word)).length;
        if (matches > maxMatches) {
          maxMatches = matches;
          bestAgentType = type as AgentType;
        }
      }
      
      // 找到对应类型的代理
      const matchingAgent = agents.find(agent => agent.type === bestAgentType);
      
      return matchingAgent || await this.agentFactory.getDefaultAgent();
    } catch (error) {
      this.logger.error(`Error selecting agent: ${error.message}`, error.stack);
      return this.agentFactory.getDefaultAgent();
    }
  }

  /**
   * 获取会话历史消息
   */
  private async getSessionHistory(sessionId: string) {
    return this.databaseService.chatSessionMessage.findMany({
      where: {
        sessionId
      },
      orderBy: {
        timestamp: 'asc'
      }
    });
  }

  /**
   * 为代理获取适合的工具
   */
  private async getToolsForAgent(agent: any): Promise<StructuredTool[]> {
    // 基于代理的能力获取工具
    const capabilities = agent.capabilities || [];
    return this.toolRegistry.getToolsByCapabilities(capabilities);
  }

  /**
   * 获取代理的工具使用情况
   */
  async getAgentToolUsage(agentId: string) {
    // 使用findMany和普通查询替代problematic的groupBy
    const toolMessages = await this.databaseService.chatSessionMessage.findMany({
      where: {
        role: 'tool',
        session: {
          agentId
        }
      },
      select: {
        id: true,
        metadata: true
      }
    });
    
    // 手动聚合结果
    const toolUsage = toolMessages.reduce((acc, message) => {
      // 正确处理metadata的类型
      const metadata = message.metadata as Record<string, any> | null;
      const toolName = metadata?.toolName;
      
      if (toolName) {
        if (!acc[toolName]) {
          acc[toolName] = 0;
        }
        acc[toolName]++;
      }
      return acc;
    }, {} as Record<string, number>);
    
    // 转换为数组并排序
    const result = Object.entries(toolUsage)
      .map(([toolName, count]) => ({ toolName, count: Number(count) }))
      .sort((a, b) => Number(b.count) - Number(a.count))
      .slice(0, 10);
    
    return result;
  }
} 