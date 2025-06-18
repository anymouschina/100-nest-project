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
    defaultModel: process.env.DEFAULT_LLM_MODEL || 'deepseek-r1',
  },
}); 