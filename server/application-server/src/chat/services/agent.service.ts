import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { AppConfigService } from '../../config/config.service';
import { Ollama } from '@langchain/community/llms/ollama';
import { ChatAgent, AgentResponse, IntentResponse } from '../models/agent.model';

@Injectable()
export class AgentService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: AppConfigService,
  ) {
    // 初始化时，检查并创建必要的Agent
    this.ensureDefaultAgentsExist().catch(err => 
      console.error('初始化默认Agent时出错:', err)
    );
  }

  /**
   * 确保默认的Agent已经存在
   * 这通常应该在种子脚本中完成，但这里作为备份
   */
  private async ensureDefaultAgentsExist() {
    // 检查数据库中是否有一般类型的Agent
    const generalAgent = await this.databaseService.chatAgent.findFirst({
      where: { type: 'general', active: true }
    }).catch(() => null);

    // 如果没有通用Agent，创建一个
    if (!generalAgent) {
      try {
        await this.databaseService.chatAgent.create({
          data: {
            id: 'general-support-agent',
            name: '通用客服助手',
            description: '处理一般问询和客户服务请求',
            type: 'general',
            systemPrompt: '你是一个友好的客服助手，可以回答关于产品、服务和订单的一般问题。如果用户问的问题超出你的知识范围，请礼貌地说明并提供可能的解决方案或联系方式。',
            capabilities: ['answer_faq', 'provide_information', 'handle_basic_requests'],
            modelConfig: {
              modelName: 'deepseek-r1',
              temperature: 0.7,
              maxTokens: 1000,
            },
            active: true,
          }
        });
        
        // 创建产品专家Agent
        await this.databaseService.chatAgent.create({
          data: {
            id: 'product-expert-agent',
            name: '产品专家',
            description: '专门回答产品相关问题的助手',
            type: 'product',
            systemPrompt: '你是一个产品专家，精通所有产品的详细信息、规格和使用方法。请为用户提供准确的产品信息，并在可能的情况下推荐合适的产品。',
            capabilities: ['product_details', 'product_comparison', 'product_recommendation'],
            modelConfig: {
              modelName: 'deepseek-r1',
              temperature: 0.5,
              maxTokens: 1200,
            },
            active: true,
          }
        });
        
        // 创建预约服务Agent
        await this.databaseService.chatAgent.create({
          data: {
            id: 'appointment-agent',
            name: '预约服务助手',
            description: '处理预约相关请求的专业助手',
            type: 'appointment',
            systemPrompt: '你是预约服务专家，可以帮助用户了解预约流程、查询预约状态并解答相关问题。对于具体的预约安排，你需要收集必要的信息，如服务类型、期望时间和地点等。',
            capabilities: ['appointment_info', 'appointment_status', 'appointment_guidance'],
            modelConfig: {
              modelName: 'deepseek-r1',
              temperature: 0.6,
              maxTokens: 1000,
            },
            active: true,
          }
        });
        console.log('成功创建默认Agent');
      } catch (error) {
        console.error('创建默认Agent失败:', error);
      }
    }
  }

  async getDefaultAgent(): Promise<ChatAgent> {
    // 获取默认的通用Agent
    const defaultAgent = await this.databaseService.chatAgent.findFirst({
      where: {
        type: 'general',
        active: true,
      },
    });

    if (!defaultAgent) {
      throw new Error('未找到默认Agent');
    }

    return defaultAgent as unknown as ChatAgent;
  }

  async getAgentByType(type: string): Promise<ChatAgent> {
    const agent = await this.databaseService.chatAgent.findFirst({
      where: {
        type,
        active: true,
      },
    });

    if (!agent) {
      // 返回默认Agent
      return this.getDefaultAgent();
    }

    return agent as unknown as ChatAgent;
  }

  async processMessage(
    agent: ChatAgent,
    userMessage: string,
    history: any[],
    intent?: IntentResponse,
  ): Promise<AgentResponse> {
    // 1. 根据Agent的配置创建大语言模型实例
    const modelConfig = agent.modelConfig;
    const llm = new Ollama({
      model: modelConfig.modelName || 'deepseek-r1',
      temperature: modelConfig.temperature || 0.7,
      baseUrl: 'http://localhost:11434', // 使用本地Ollama服务
    });

    // 2. 构建提示词
    let prompt = `${agent.systemPrompt}\n\n`;
    
    // 3. 添加历史聊天记录
    for (const msg of history) {
      if (msg.role === 'user') {
        prompt += `用户: ${msg.content}\n`;
      } else if (msg.role === 'assistant') {
        prompt += `助手: ${msg.content}\n`;
      }
    }
    
    // 4. 添加当前用户问题
    prompt += `用户: ${userMessage}\n助手: `;
    
    // 5. 调用LLM获取响应
    try {
      const response = await llm.call(prompt);
      
      // 6. 返回格式化的响应
      return {
        content: response,
        metadata: {
          agentId: agent.id,
          agentType: agent.type,
          model: modelConfig.modelName,
          intent: intent ? intent.name : null,
          confidence: intent ? intent.confidence : null,
        },
      };
    } catch (error) {
      console.error('LLM调用失败:', error);
      return {
        content: '抱歉，我遇到了问题，无法回答您的问题。请稍后再试或联系客服。',
        metadata: {
          agentId: agent.id,
          agentType: agent.type,
          error: true,
        },
      };
    }
  }
} 