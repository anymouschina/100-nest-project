import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';
import { ToolRegistryService } from './tool-registry.service';
import { OllamaService } from './ollama.service';
import { DynamicTool } from 'langchain/tools';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { HumanMessage } from '@langchain/core/messages';

// 定义代理接口
interface Agent {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  capabilities: string[];
  type: string;
  active: boolean;
}

@Injectable()
export class AgentFactoryService implements OnModuleInit {
  private readonly logger = new Logger(AgentFactoryService.name);
  private registeredAgents = new Map<string, { agent: Agent; graph: any }>();

  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
    private readonly toolRegistryService: ToolRegistryService,
    private readonly ollamaService: OllamaService,
  ) {}

  /**
   * 初始化默认代理
   */
  async onModuleInit() {
    try {
      await this.initializeDefaultAgents();
    } catch (err) {
      this.logger.error(
        `Failed to initialize default agents: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * 初始化默认代理
   */
  private async initializeDefaultAgents() {
    // 检查并创建默认客服代理
    await this.ensureAgentExists({
      name: 'Customer Service',
      description: '客户服务代理，处理订单查询、退款和一般问题',
      systemPrompt:
        '你是一个专业的客户服务代理。你的任务是帮助用户解决与订单、产品和服务相关的问题。' +
        '如果你需要查询订单信息，可以使用 {{tool:search_order}}订单号{{/tool}} 工具。' +
        '如果你需要处理退款请求，可以使用 {{tool:process_refund}}订单号{{/tool}} 工具。' +
        '请保持专业、友好的态度，并尽可能提供有用的信息。',
      capabilities: [
        'search_order',
        'process_refund',
        'product_information',
        'product_comparison',
        'product_recommendations',
      ],
      type: 'customer_service',
      isActive: true,
    });

    // 检查并创建默认客户支持代理
    await this.ensureAgentExists({
      name: 'Customer Support',
      description: '客户支持代理，处理技术问题和投诉',
      systemPrompt:
        '你是一个专业的客户支持代理。你的任务是帮助用户解决技术问题，处理投诉，并回答有关公司政策的问题。' +
        '如果你需要查询知识库，可以使用 {{tool:search_knowledge}}关键词{{/tool}} 工具。' +
        '请保持耐心和理解，尽可能详细地解释解决方案。',
      capabilities: [
        'search_knowledge',
        'handle_complaints',
        'process_returns',
        'answer_policy_questions',
      ],
      type: 'technical_support',
      isActive: true,
    });

    // 检查并创建默认预约助手代理
    await this.ensureAgentExists({
      name: 'Appointment Assistant',
      description: '预约助手代理，帮助用户安排、修改和取消预约',
      systemPrompt:
        '你是一个预约助手。你的任务是帮助用户安排、修改和取消预约。' +
        '如果你需要查看可用时间，可以使用 {{tool:check_availability}}日期{{/tool}} 工具。' +
        '如果你需要创建预约，可以使用 {{tool:create_appointment}}详情{{/tool}} 工具。' +
        '请确保获取所有必要的信息，如日期、时间、联系方式等。',
      capabilities: [
        'check_availability',
        'schedule_appointments',
        'modify_appointments',
        'cancel_appointments',
      ],
      type: 'appointment',
      isActive: true,
    });

    this.logger.log('Default agents initialized successfully');
  }

  /**
   * 确保代理存在，如果不存在则创建
   */
  private async ensureAgentExists(agentData: {
    name: string;
    description: string;
    systemPrompt: string;
    capabilities: string[];
    type: string;
    isActive: boolean;
  }) {
    try {
      const existingAgent = await this.databaseService.chatAgent.findFirst({
        where: { name: agentData.name },
      });

      if (!existingAgent) {
        const newAgent = await this.databaseService.chatAgent.create({
          data: {
            name: agentData.name,
            description: agentData.description,
            systemPrompt: agentData.systemPrompt,
            capabilities: agentData.capabilities,
            type: agentData.type,
            active: agentData.isActive,
          },
        });
        this.logger.log(`Created agent: ${newAgent.name}`);
        return newAgent;
      }

      return existingAgent;
    } catch (error) {
      this.logger.error(
        `Error ensuring agent exists: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 获取代理
   */
  async getAgent(agentId: string) {
    // 如果代理已经加载，直接返回
    if (this.registeredAgents.has(agentId)) {
      return this.registeredAgents.get(agentId);
    }

    // 从数据库加载代理
    const agent = await this.databaseService.chatAgent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }

    // 创建代理图
    const graph = await this.createAgentGraph(agent as Agent);
    
    return { agent, graph };
  }

  /**
   * 根据能力获取工具
   */
  private getToolsForAgent(capabilities: string[]) {
    return capabilities
      .map((capability) => this.toolRegistryService.getTool(capability))
      .filter((tool): tool is DynamicTool => !!tool);
  }

  /**
   * 为代理创建LLM对话流程
   */
  private async createAgentGraph(agent: Agent): Promise<any> {
    // 获取代理可用的工具
    const capabilities = agent.capabilities || [];
    const tools = this.getToolsForAgent(capabilities);

    // 使用Annotation定义代理状态 - 参考官方文档
    const AgentStateAnnotation = Annotation.Root({
      messages: Annotation<
        Array<{ role: string; content: string; name?: string }>
      >({
        reducer: (x, y) => x.concat(y),
        default: () => [],
      }),
      documents: Annotation<string[]>({
        reducer: (x, y) => x.concat(y),
        default: () => [],
      }),
      activeTool: Annotation<string | null>(),
      toolInput: Annotation<string | undefined>(),
      toolResults: Annotation<Record<string, any>>(),
      agentId: Annotation<string>(),
      query: Annotation<string | undefined>(),
    });

    /**
     * 检索节点 - 如果需要，从知识库检索相关文档
     */
    const retrieveDocuments = async (
      state: typeof AgentStateAnnotation.State,
    ) => {
      // 如果没有查询，则跳过
      if (!state.query) {
        return { documents: [] };
      }

      try {
        // 这里可以实现向量数据库检索
        // 简单模拟检索结果
        const docs = [`关于"${state.query}"的文档1`, `关于"${state.query}"的文档2`];
        return { documents: docs };
      } catch (error) {
        this.logger.error(`Retrieval error: ${error.message}`, error.stack);
        return { documents: [] };
      }
    };

    /**
     * 代理节点 - 处理用户输入和生成回应
     */
    const agentNode = async (
      state: typeof AgentStateAnnotation.State,
    ) => {
      try {
        // 获取用户最新的消息
        const userMessages = state.messages.filter(m => m.role === 'user');
        if (userMessages.length === 0) {
          return {}; // 没有用户消息，不处理
        }
        
        const latestUserMessage = userMessages[userMessages.length - 1].content;
        
        // 设置查询，用于文档检索
        const query = latestUserMessage;
        
        // 构建系统提示信息
        const systemPrompt = agent.systemPrompt || '你是一个有用的AI助手。';
        
        // 构建上下文信息，包括检索到的文档
        let contextPrompt = '';
        if (state.documents && state.documents.length > 0) {
          contextPrompt = `\n\n参考信息:\n${state.documents.join('\n')}\n\n`;
        }
        
        // 构建对话历史
        const messages = [
          { role: 'system', content: systemPrompt + contextPrompt },
          ...state.messages.slice(0, -1) // 不包括最新的用户消息，因为我们会单独处理
        ];
        
        // 调用Ollama服务生成回复
        const content = await this.ollamaService.chat(messages, latestUserMessage);
        
        // 检查是否有工具调用
        const toolRegex = /\{\{tool:([a-zA-Z0-9_]+)\}\}(.*?)\{\{\/tool\}\}/s;
        const match = content.match(toolRegex);
        
        if (match && tools.some(tool => tool.name === match[1])) {
          const toolName = match[1];
          const toolInput = match[2].trim();
          
          return {
            messages: [{ role: 'ai', content }],
            activeTool: toolName,
            toolInput,
            query,
          };
        }
        
        return { 
          messages: [{ role: 'ai', content }],
          query,
        };
      } catch (error) {
        this.logger.error(`Agent error: ${error.message}`, error.stack);
        return { 
          messages: [{ role: 'ai', content: '抱歉，处理您的请求时出现错误' }],
        };
      }
    };

    /**
     * 工具执行节点 - 处理工具调用
     */
    const toolNode = async (
      state: typeof AgentStateAnnotation.State,
    ) => {
      if (!state.activeTool) {
        return {};
      }

      const tool = tools.find(t => t.name === state.activeTool);
      if (!tool) {
        return {
          toolResults: {
            [state.activeTool]: { error: 'Tool not found' }
          },
          activeTool: null,
          messages: [{ role: 'tool', name: state.activeTool, content: 'Tool not found' }]
        };
      }

      try {
        // 从状态获取工具输入
        const toolArg = state.toolInput || '';
        const result = await tool.invoke(toolArg);
        
        return {
          toolResults: {
            [state.activeTool]: { result }
          },
          activeTool: null,
          messages: [
            { 
              role: 'tool', 
              name: state.activeTool, 
              content: typeof result === 'string' ? result : JSON.stringify(result) 
            }
          ]
        };
      } catch (error) {
        return {
          toolResults: {
            [state.activeTool]: { error: error.message }
          },
          activeTool: null,
          messages: [
            { role: 'tool', name: state.activeTool, content: `Error: ${error.message}` }
          ]
        };
      }
    };

    /**
     * 条件路由函数 - 决定下一步执行哪个节点
     */
    const routeNode = (state: typeof AgentStateAnnotation.State) => {
      // 如果有工具需要执行，路由到工具节点
      if (state.activeTool) {
        return 'tool';
      }
      
      // 如果有查询但没有检索过文档，路由到检索节点
      if (state.query && (!state.documents || state.documents.length === 0)) {
        return 'retrieve';
      }
      
      // 否则结束
      return END;
    };

    // 创建StateGraph - 使用正确的Annotation API
    const builder = new StateGraph(AgentStateAnnotation)
      .addNode('agent', agentNode)
      .addNode('retrieve', retrieveDocuments)
      .addNode('tool', toolNode)
      .addEdge(START, 'agent')
      .addConditionalEdges('agent', routeNode, {
        tool: 'tool',
        retrieve: 'retrieve',
        [END]: END,
      })
      .addEdge('tool', 'agent')
      .addEdge('retrieve', 'agent');

    // 编译图
    const graph = builder.compile();
    const logger = this.logger
    // 创建一个包装器，使调用更简单
    const wrapper = {
      async invoke(messageHistory: Array<{role: string; content: string}> = [], userMessage: string): Promise<any> {
        try {
          // 简单的消息历史管理（限制最近20条消息）
          const recentMessages = messageHistory.slice(-20);
          
          // 构建最终的消息列表
          const finalMessages = recentMessages;

          logger.log(
            `Agent ${agent.name} processing ${finalMessages.length} messages`
          );

          // 准备初始状态
          const initialState = {
            messages: finalMessages,
            documents: [],
            activeTool: null,
            toolInput: undefined,
            toolResults: {},
            agentId: agent.id,
            query: undefined,
          };
          
          // 调用图并确保返回正确的格式
          const result = await graph.invoke(initialState);
          
          // 详细日志记录返回结果
          logger.log(`Graph execution result: ${JSON.stringify(result, null, 2)}`);
          
          // 确保返回值有正确的格式
          if (!result || typeof result !== 'object') {
            logger.warn(`Graph returned unexpected result: ${typeof result}`);
            return {
              messages: [{ role: 'ai', content: '抱歉，处理您的请求时出现了问题。' }],
              error: 'Invalid graph result'
            };
          }
          
          // 确保messages数组存在
          if (!result.messages || !Array.isArray(result.messages)) {
            logger.warn(`Graph result missing messages array. Result keys: ${Object.keys(result)}`);
            logger.warn(`Messages value: ${JSON.stringify(result.messages)}`);
            return {
              messages: [{ role: 'ai', content: '抱歉，处理您的请求时出现了问题。' }],
              error: 'Missing messages in result'
            };
          }
          
          return result;
        } catch (error) {
          logger.error(`Error in agent wrapper: ${error.message}`, error.stack);
          // 返回一个安全的错误响应
          return {
            messages: [{ role: 'ai', content: '抱歉，处理您的请求时出现错误。' }],
            error: error.message
          };
        }
      }
    };

    // 注册代理图
    this.registeredAgents.set(agent.id, { agent, graph: wrapper });
    return wrapper;
  }

  /**
   * 获取所有代理
   */
  async getAllAgents() {
    const agents = await this.databaseService.chatAgent.findMany({
      where: { active: true },
    });
    
    return agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      type: agent.type,
      capabilities: agent.capabilities,
    }));
  }

  /**
   * 根据类型获取代理
   */
  async getAgentByType(type: string) {
    const agent = await this.databaseService.chatAgent.findFirst({
      where: { type, active: true },
    });
    
    if (!agent) {
      throw new Error(`No active agent found for type: ${type}`);
    }
    
    return this.getAgent(agent.id);
  }
} 