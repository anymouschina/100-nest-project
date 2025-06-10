export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    url: process.env.DATABASE_URL,
  },
  wechat: {
    appId: process.env.WECHAT_APP_ID,
    appSecret: process.env.WECHAT_APP_SECRET,
  },
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      'your-secret-key-should-be-changed-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  ai: {
    // AI服务提供商选择 (ollama | openai | custom-api)
    aiProvider: process.env.AI_PROVIDER || 'ollama',
    
    // Ollama本地AI配置 (主要)
    ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    ollamaChatModel: process.env.OLLAMA_CHAT_MODEL || 'qwen2.5:14b',
    ollamaFastModel: process.env.OLLAMA_FAST_MODEL || 'qwen2.5:7b',
    ollamaAnalysisModel: process.env.OLLAMA_ANALYSIS_MODEL || 'deepseek-coder:6.7b',
    ollamaEmbeddingModel: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text',
    
    // OpenAI配置
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiBaseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    
    // 自定义API配置 (支持OpenAI兼容的API)
    customApiKey: process.env.CUSTOM_API_KEY,
    customBaseUrl: process.env.CUSTOM_BASE_URL,
    customModel: process.env.CUSTOM_MODEL || 'custom-model',
    customModels: process.env.CUSTOM_MODELS, // 逗号分隔的模型列表
    
    // Moonshot AI配置 (向后兼容)
    moonshotApiKey: process.env.MOONSHOT_API_KEY,
    moonshotBaseUrl: process.env.MOONSHOT_BASE_URL || 'https://api.moonshot.cn/v1',
    moonshotModel: process.env.MOONSHOT_MODEL || 'moonshot-v1-8k',
    
    // 通用配置
    defaultTemperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,
    defaultMaxTokens: parseInt(process.env.AI_MAX_TOKENS) || 2000,
  },
});
