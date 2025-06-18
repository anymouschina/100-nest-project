import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SemanticService } from './services/semantic.service';
import { AgentService } from './services/agent.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { AppConfigService } from '../config/config.service';
import { v4 as uuidv4 } from 'uuid';
import { ChatAgent } from './models/agent.model';

@Injectable()
export class ChatService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly semanticService: SemanticService,
    private readonly agentService: AgentService,
    private readonly configService: AppConfigService,
  ) {}

  async createSession(userId: number, createSessionDto: CreateSessionDto) {
    // 如果没有指定agentId，则根据用户消息分析最佳Agent
    let agentId = createSessionDto.agentId;
    
    if (!agentId && createSessionDto.initialMessage) {
      const intent = await this.semanticService.analyzeIntent(
        createSessionDto.initialMessage
      );
      const agent = await this.agentService.getAgentByType(intent.agentType);
      agentId = agent.id;
    }
    
    if (!agentId) {
      // 获取默认Agent
      const defaultAgent = await this.agentService.getDefaultAgent();
      agentId = defaultAgent.id;
    }

    // 创建新会话
    const session = await this.databaseService.chatSession.create({
      data: {
        id: uuidv4(),
        userId,
        agentId,
        status: 'active',
        title: createSessionDto.title || '新的会话',
        startTime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 如果有初始消息，则处理
    if (createSessionDto.initialMessage) {
      await this.processUserMessage(
        userId,
        session.id,
        createSessionDto.initialMessage
      );
    }

    return this.getSessionWithMessages(userId, session.id);
  }

  async getUserSessions(userId: number) {
    return this.databaseService.chatSession.findMany({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        agent: {
          select: {
            name: true,
            description: true,
            type: true,
          },
        },
      },
    });
  }

  async getSessionWithMessages(userId: number, sessionId: string) {
    const session = await this.databaseService.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      include: {
        agent: true,
        messages: {
          orderBy: {
            timestamp: 'asc',
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('聊天会话不存在');
    }

    return session;
  }

  async processUserMessage(userId: number, sessionId: string, message: string) {
    // 1. 验证会话存在且属于该用户
    const session = await this.databaseService.chatSession.findFirst({
      where: {
        id: sessionId,
        userId,
        status: 'active',
      },
      include: {
        agent: true,
      },
    });

    if (!session) {
      throw new NotFoundException('聊天会话不存在或已结束');
    }
    
    // 2. 分析用户意图
    const intent = await this.semanticService.analyzeIntent(message);
    
    // 3. 检查是否需要切换Agent
    let currentAgent = session.agent as unknown as ChatAgent;
    if (intent.agentType !== currentAgent.type && intent.confidence > 0.8) {
      const betterAgent = await this.agentService.getAgentByType(intent.agentType);
      
      // 记录Agent切换事件
      await this.databaseService.chatSessionMessage.create({
        data: {
          id: uuidv4(),
          sessionId,
          role: 'system',
          content: `切换到${betterAgent.name}以更好地回答您的问题`,
          timestamp: new Date(),
          metadata: {
            eventType: 'agent_switch',
            previousAgentId: currentAgent.id,
            newAgentId: betterAgent.id,
            intentName: intent.name,
            confidence: intent.confidence,
          },
        },
      });
      
      // 更新会话中的Agent
      await this.databaseService.chatSession.update({
        where: { id: sessionId },
        data: { 
          agentId: betterAgent.id,
          updatedAt: new Date()
        },
      });
      
      // 更新当前Agent
      currentAgent = betterAgent as unknown as ChatAgent;
    }

    // 4. 保存用户消息
    await this.databaseService.chatSessionMessage.create({
      data: {
        id: uuidv4(),
        sessionId,
        role: 'user',
        content: message,
        timestamp: new Date(),
        metadata: {
          detectedIntent: intent.name,
          confidence: intent.confidence,
        }
      },
    });

    // 5. 获取会话历史
    const history = await this.databaseService.chatSessionMessage.findMany({
      where: {
        sessionId,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    // 6. 让Agent处理消息并返回响应
    const response = await this.agentService.processMessage(
      currentAgent,
      message,
      history,
      intent,
    );

    // 7. 保存Agent响应
    const agentMessage = await this.databaseService.chatSessionMessage.create({
      data: {
        id: uuidv4(),
        sessionId,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        metadata: response.metadata || {},
      },
    });

    // 8. 更新会话时间戳
    await this.databaseService.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    return agentMessage;
  }

  async analyzeUserIntent(userId: number, message: string) {
    const intent = await this.semanticService.analyzeIntent(message);
    const agent = await this.agentService.getAgentByType(intent.agentType);
    
    return {
      intent,
      recommendedAgent: agent,
    };
  }
} 