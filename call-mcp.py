#!/usr/bin/env python3

import subprocess
import json
import sys

def call_n8n_mcp_tool(tool_name, arguments=None):
    """调用n8n-mcp工具"""
    if arguments is None:
        arguments = {}
    
    # 启动n8n-mcp进程
    process = subprocess.Popen(
        ['npx', 'n8n-mcp'],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # 构建MCP请求
    request = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": tool_name,
            "arguments": arguments
        }
    }
    
    # 发送初始化请求
    init_request = {
        "jsonrpc": "2.0",
        "id": 0,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "tools": {}
            },
            "clientInfo": {
                "name": "python-mcp-client",
                "version": "1.0.0"
            }
        }
    }
    
    try:
        # 发送初始化请求
        process.stdin.write(json.dumps(init_request) + '\n')
        process.stdin.flush()
        
        # 读取初始化响应
        response = process.stdout.readline()
        print(f"初始化响应: {response.strip()}")
        
        # 发送工具调用请求
        process.stdin.write(json.dumps(request) + '\n')
        process.stdin.flush()
        
        # 读取响应
        response = process.stdout.readline()
        print(f"工具调用响应: {response.strip()}")
        
        # 解析响应
        if response:
            result = json.loads(response)
            return result
        
    except Exception as e:
        print(f"错误: {e}")
    finally:
        process.terminate()
        process.wait()
    
    return None

if __name__ == "__main__":
    print("正在调用n8n-mcp list_nodes工具...")
    result = call_n8n_mcp_tool("list_nodes")
    
    if result:
        print("\n=== list_nodes 结果 ===")
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print("未能获取结果") 