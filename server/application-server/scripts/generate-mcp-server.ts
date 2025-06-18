/**
 * MCP服务器生成脚本
 * 
 * 该脚本根据配置生成Model Context Protocol (MCP) 服务器模板代码
 * 用于创建工具服务，供LangGraph代理调用
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';

const exec = promisify(execCallback);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// MCP服务器模板
const MCPServerTemplate = (serviceName: string, tools: string[]) => `
import { FastMCP } from "langchain/mcp";

const mcp = new FastMCP("${serviceName}");

${tools.map(tool => `
@mcp.tool()
async function ${tool}(input: string): Promise<string> {
  /**
   * 实现${tool}工具的逻辑
   * 实际使用时应根据工具功能实现具体逻辑
   */
  console.log("Tool ${tool} called with input:", input);
  return "这是${tool}工具的模拟结果：" + input;
}`).join('\n')}

// 启动MCP服务器
if (require.main === module) {
  const port = process.env.PORT || 3100;
  console.log(\`Starting ${serviceName} MCP server on port \${port}...\`);
  mcp.run("streamable-http", { port: Number(port) });
}

export default mcp;
`.trim();

// 主函数：生成MCP服务器
async function generateMCPServer() {
  try {
    console.log('开始生成MCP服务器...');
    
    // 创建tools目录（如果不存在）
    const toolsDir = path.join(process.cwd(), 'tools');
    if (!fs.existsSync(toolsDir)) {
      await mkdir(toolsDir);
      console.log('Created tools directory.');
    }
    
    // 定义MCP服务和工具
    const services = [
      {
        name: 'Search',
        tools: ['search_web', 'search_documents'],
        port: 3100
      },
      {
        name: 'Weather',
        tools: ['get_weather', 'get_forecast'],
        port: 3200
      }
    ];
    
    // 为每个服务生成文件
    for (const service of services) {
      const fileName = `${service.name.toLowerCase()}_server.ts`;
      const filePath = path.join(toolsDir, fileName);
      
      await writeFile(
        filePath,
        MCPServerTemplate(service.name, service.tools)
      );
      
      console.log(`生成文件: ${filePath}`);
    }
    
    // 生成math服务的Python文件
    const mathServerPath = path.join(toolsDir, 'math_server.py');
    await writeFile(
      mathServerPath,
      `
# Math MCP Server
import os

try:
    from mcp.server.fastmcp import FastMCP
except ImportError:
    print("MCP库未安装，请运行: pip install langchain-mcp-adapters")
    exit(1)

mcp = FastMCP("Math")

@mcp.tool()
def add(a: int, b: int) -> int:
    """Add two numbers"""
    return a + b

@mcp.tool()
def multiply(a: int, b: int) -> int:
    """Multiply two numbers"""
    return a * b

@mcp.tool()
def divide(a: int, b: int) -> float:
    """Divide two numbers"""
    return a / b

if __name__ == "__main__":
    print("Starting Math MCP server (stdio transport)...")
    mcp.run(transport="stdio")
`.trim()
    );
    
    console.log(`生成文件: ${mathServerPath}`);
    console.log('MCP服务器生成完成！');
    
    // 提示安装命令
    console.log('\n要运行这些服务器，您需要:');
    console.log('1. 安装需要的包: npm install langchain axios');
    console.log('2. 对于Python服务: pip install langchain-mcp-adapters');
    console.log('3. 运行TypeScript服务: ts-node tools/search_server.ts');
    console.log('4. 运行Python服务: python tools/math_server.py');
    
  } catch (error) {
    console.error('生成MCP服务器失败:', error);
    process.exit(1);
  }
}

// 执行主函数
generateMCPServer().catch(console.error); 