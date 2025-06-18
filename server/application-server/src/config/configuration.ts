export default () => ({
  port: parseInt(process.env.PORT, 10) || 3001,
  database: {
    url: process.env.DATABASE_URL,
  },
  wechat: {
    appId: process.env.WECHAT_APP_ID,
    appSecret: process.env.WECHAT_APP_SECRET,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  },
  llm: {
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    defaultModel: process.env.DEFAULT_LLM_MODEL || 'deepseek-r1',
    temperature: parseFloat(process.env.LLM_TEMPERATURE) || 0.7,
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS, 10) || 2048,
    streaming: process.env.LLM_STREAMING === 'true',
  },
  mcp: {
    search: {
      endpoint: process.env.MCP_SEARCH_ENDPOINT || 'http://localhost:3100/mcp',
      transport: 'streamable_http',
      tools: ['search_web', 'search_documents'],
    },
    weather: {
      endpoint: process.env.MCP_WEATHER_ENDPOINT || 'http://localhost:3200/mcp',
      transport: 'streamable_http',
      tools: ['get_weather', 'get_forecast'],
    },
    math: {
      endpoint: process.env.MCP_MATH_ENDPOINT || './tools/math_server.py',
      transport: 'stdio',
      tools: ['add', 'multiply', 'divide'],
    },
  },
  langgraph: {
    enabled: process.env.ENABLE_LANGGRAPH === 'true',
    defaultAgentType: process.env.DEFAULT_AGENT_TYPE || 'general',
    toolSelectionStrategy: process.env.TOOL_SELECTION_STRATEGY || 'auto',
  },
}); 