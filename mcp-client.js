const { spawn } = require('child_process');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');

async function callListNodes() {
  console.log('启动n8n-mcp服务器...');
  
  // 启动n8n-mcp进程
  const mcpProcess = spawn('npx', ['n8n-mcp'], {
    stdio: ['pipe', 'pipe', 'inherit']
  });

  // 创建MCP客户端
  const transport = new StdioClientTransport({
    command: mcpProcess
  });

  const client = new Client({
    name: "n8n-mcp-client",
    version: "1.0.0"
  }, {
    capabilities: {
      tools: {}
    }
  });

  try {
    // 连接到服务器
    await client.connect(transport);
    console.log('已连接到n8n-mcp服务器');

    // 获取可用工具
    const tools = await client.listTools();
    console.log('可用工具:', tools.tools.map(t => t.name));

    // 调用list_nodes工具
    const result = await client.callTool({
      name: 'list_nodes',
      arguments: {}
    });

    console.log('\n=== list_nodes 结果 ===');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('错误:', error);
  } finally {
    // 清理
    await client.close();
    mcpProcess.kill();
  }
}

// 运行
callListNodes().catch(console.error); 