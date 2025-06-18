import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AppConfigService } from '../../config/config.service';
import { OllamaService } from './ollama.service';
import { MCPServiceConfig } from '../types';
import { DynamicTool, StructuredTool } from '@langchain/core/tools';

@Injectable()
export class ToolRegistryService implements OnModuleInit {
  private readonly logger = new Logger(ToolRegistryService.name);
  private tools: Map<string, StructuredTool> = new Map();
  private categories: Map<string, string[]> = new Map();
  private mcpServices: MCPServiceConfig[] = [];
  private mcpTools: Map<string, any> = new Map();

  constructor(
    private readonly configService: AppConfigService,
    private readonly ollamaService: OllamaService,
  ) {}

  /**
   * 初始化时加载所有工具
   */
  async onModuleInit() {
    this.logger.log('Initializing tool registry');
    await this.registerBuiltInTools();
    await this.loadMCPServices();
    this.logger.log(`Initialized ${this.tools.size} tools`);
  }

  /**
   * 注册内置工具
   */
  private async registerBuiltInTools() {
    // 日期和时间工具
    this.registerTool(
      new DynamicTool({
        name: 'get_current_time',
        description: '获取当前的日期和时间',
        func: async () => {
          const now = new Date();
          return now.toLocaleString('zh-CN');
        },
      }),
      'utilities',
    );

    // 计算器工具
    this.registerTool(
      new DynamicTool({
        name: 'calculate',
        description: '执行数学计算',
        func: async (input: string) => {
          try {
            // 安全解析输入内容
            const parts = input.split('=');
            const expression = parts[parts.length - 1].trim();
            
            // 注意: 在生产环境中应该使用安全的计算方法，而不是eval
            const result = eval(expression);
            return result.toString();
          } catch (error) {
            return `计算错误: ${error.message}`;
          }
        },
      }),
      'utilities',
    );
  }

  /**
   * 从配置加载MCP服务
   */
  private async loadMCPServices() {
    try {
      const mcpConfig = this.configService.get('mcp');
      
      if (!mcpConfig) {
        this.logger.warn('No MCP services configured');
        return;
      }

      // 遍历配置的每个MCP服务
      for (const [name, config] of Object.entries(mcpConfig)) {
        const serviceConfig = config as any;
        
        this.mcpServices.push({
          name,
          endpoint: serviceConfig.endpoint,
          transport: serviceConfig.transport,
          tools: serviceConfig.tools || [],
        });

        this.logger.log(`Registered MCP service: ${name} at ${serviceConfig.endpoint}`);
        
        // 为每个工具创建一个代理
        for (const toolName of serviceConfig.tools || []) {
          this.registerMCPTool(name, toolName);
        }
      }
    } catch (error) {
      this.logger.error(`Error loading MCP services: ${error.message}`, error.stack);
    }
  }

  /**
   * 注册MCP工具
   */
  private registerMCPTool(serviceName: string, toolName: string) {
    const tool = new DynamicTool({
      name: toolName,
      description: `MCP服务 ${serviceName} 提供的 ${toolName} 工具`,
      func: async (input: string) => {
        try {
          // 这里应该是实际调用MCP服务的逻辑
          // 现在先返回模拟数据
          return `[MCP工具] ${toolName} 服务 ${serviceName} 的模拟调用结果: ${input}`;
        } catch (error) {
          return `调用MCP工具失败: ${error.message}`;
        }
      },
    });

    this.registerTool(tool, 'mcp');
    this.mcpTools.set(toolName, { service: serviceName, tool });
  }

  /**
   * 注册工具
   */
  registerTool(tool: StructuredTool, category: string = 'general') {
    this.tools.set(tool.name, tool);
    
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    
    this.categories.get(category).push(tool.name);
    this.logger.log(`Registered tool: ${tool.name} in category ${category}`);
  }

  /**
   * 获取工具
   */
  getTool(name: string): StructuredTool | null {
    return this.tools.get(name) || null;
  }

  /**
   * 获取所有工具
   */
  getAllTools(): StructuredTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * 按类别获取工具
   */
  getToolsByCategory(category: string): StructuredTool[] {
    const toolNames = this.categories.get(category) || [];
    return toolNames.map(name => this.tools.get(name)).filter(Boolean);
  }

  /**
   * 获取与能力相关的工具
   */
  getToolsByCapabilities(capabilities: string[]): StructuredTool[] {
    // 这个实现可能需要更复杂的映射逻辑
    // 现在先简单地返回包含这些关键字的工具
    return this.getAllTools().filter(tool => {
      return capabilities.some(cap => tool.name.includes(cap));
    });
  }
} 