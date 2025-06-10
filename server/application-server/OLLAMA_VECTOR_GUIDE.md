# Ollama本地向量服务使用指南

## 概述

项目已完全迁移到使用本地Ollama服务进行向量嵌入生成，完全移除了模拟向量功能。现在所有的嵌入向量生成都通过Ollama的真实AI模型完成，确保向量质量和语义准确性。

## 核心优势

### ✅ 已完成的迁移工作

1. **完全移除模拟向量**
   - 删除了所有fallback到模拟向量的代码
   - 确保所有向量都由真实AI模型生成
   - 失败时直接抛出错误，而不是降级到模拟

2. **统一的Ollama服务**
   - `OllamaUniversalEmbeddingService` - 基于LangChain的核心服务
   - `OllamaEmbeddingService` - 兼容性包装器
   - 所有相关服务都已更新使用Ollama

3. **更新的服务列表**
   - ✅ `VectorKnowledgeService` - 向量知识库
   - ✅ `EmbeddingService` - 嵌入服务（优先Ollama）
   - ✅ `FeatureExtractionService` - 特征提取
   - ✅ `LogAnalysisRealAIService` - 日志分析
   - ✅ `AIProviderService` - AI提供商管理

## 架构设计

```
┌─────────────────────────────────────┐
│          应用层服务                  │
├─────────────────────────────────────┤
│  VectorKnowledgeService             │
│  FeatureExtractionService           │
│  LogAnalysisRealAIService           │
├─────────────────────────────────────┤
│          统一接口层                  │
├─────────────────────────────────────┤
│  OllamaUniversalEmbeddingService    │  ← 核心服务
│  (基于 LangChain OllamaEmbeddings)  │
├─────────────────────────────────────┤
│          Ollama引擎                 │
├─────────────────────────────────────┤
│  nomic-embed-text (默认)            │
│  mxbai-embed-large                  │
│  其他embedding模型                   │
└─────────────────────────────────────┘
```

## 环境配置

### 必需的环境变量

```bash
# Ollama服务配置
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# 可选的AI服务配置
AI_PROVIDER=ollama
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=2000
```

### Ollama模型安装

```bash
# 安装推荐的embedding模型
ollama pull nomic-embed-text      # 768维，高质量通用模型
ollama pull mxbai-embed-large     # 1024维，专业级模型
ollama pull all-minilm            # 384维，轻量级模型

# 验证模型安装
ollama list
```

## API使用指南

### 1. 基础向量生成

使用UniversalAI控制器的embedding功能：

```bash
# 生成单个文本的向量
curl -X POST http://localhost:3000/ai/universal/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "生成这段文本的向量表示"},
      {"role": "user", "content": "人工智能技术的发展"}
    ],
    "provider": "ollama",
    "modelName": "nomic-embed-text"
  }'
```

### 2. 向量知识库操作

```typescript
import { VectorKnowledgeService } from './ai/services/vector-knowledge.service';

@Injectable()
export class MyService {
  constructor(
    private readonly vectorService: VectorKnowledgeService,
  ) {}

  async addDocument() {
    // 添加文档到向量库
    await this.vectorService.addDocument({
      id: 'doc-1',
      content: '这是一个关于人工智能的文档内容',
      metadata: { 
        title: 'AI技术介绍',
        category: 'technology',
        author: 'AI专家'
      },
    });
  }

  async searchSimilar() {
    // 语义搜索
    const results = await this.vectorService.semanticSearch(
      '机器学习算法', 
      {
        limit: 5,
        threshold: 0.7,
        includeMetadata: true,
      }
    );
    
    return results.documents;
  }
}
```

### 3. 特征提取服务

```typescript
import { FeatureExtractionService } from './log-analysis/services/feature-extraction.service';

@Injectable()
export class LogService {
  constructor(
    private readonly featureService: FeatureExtractionService,
  ) {}

  async analyzeLogFeatures() {
    const logData = [
      {
        message: 'Database connection failed',
        level: 'error',
        source: 'api-server',
        timestamp: new Date(),
      },
      // ... 更多日志
    ];

    // 提取特征，包括语义向量
    const features = await this.featureService.extractFeatures(logData);
    return features;
  }
}
```

### 4. 实时AI日志分析

```typescript
import { LogAnalysisRealAIService } from './log-analysis/services/log-analysis-real-ai.service';

@Injectable()
export class LogAnalysisService {
  constructor(
    private readonly aiAnalysis: LogAnalysisRealAIService,
  ) {}

  async analyzeLogWithAI() {
    const analysisResult = await this.aiAnalysis.analyzeLogWithAI(
      'Database timeout error in user authentication',
      'Please focus on database performance issues'
    );

    return {
      insights: analysisResult.insights,
      recommendations: analysisResult.recommendations,
      semanticVector: analysisResult.semanticVector, // Ollama生成的向量
    };
  }
}
```

## 模型选择指南

### 推荐模型配置

| 模型 | 维度 | 用途 | 性能 | 内存需求 |
|------|------|------|------|----------|
| `nomic-embed-text` | 768 | 通用语义嵌入 | 均衡 | 中等 |
| `mxbai-embed-large` | 1024 | 高精度任务 | 高 | 高 |
| `all-minilm` | 384 | 快速处理 | 快 | 低 |

### 动态模型切换

```typescript
import { OllamaUniversalEmbeddingService } from './ai/services/ollama-universal-embedding.service';

@Injectable()
export class EmbeddingManagerService {
  constructor(
    private readonly embeddingService: OllamaUniversalEmbeddingService,
  ) {}

  async switchToHighQualityModel() {
    // 切换到高质量模型
    await this.embeddingService.switchModel('mxbai-embed-large');
  }

  async switchToFastModel() {
    // 切换到快速模型
    await this.embeddingService.switchModel('all-minilm');
  }

  async getModelStatus() {
    // 获取当前模型状态
    const health = await this.embeddingService.healthCheck();
    const stats = this.embeddingService.getStats();
    
    return { health, stats };
  }
}
```

## 性能优化

### 1. 批量处理

```typescript
// 批量生成向量，自动优化并发
const texts = [
  '文本1：人工智能的发展历程',
  '文本2：机器学习的核心算法',
  '文本3：深度学习的应用场景',
  // ... 更多文本
];

const results = await this.embeddingService.generateBatchEmbeddings(texts, {
  model: 'nomic-embed-text',
  batchSize: 5, // 控制并发数量
});
```

### 2. 向量相似度计算

```typescript
// 高效的向量相似度计算
const queryVector = await this.embeddingService.generateEmbedding('查询文本');

const candidates = [
  { id: 'doc1', vector: doc1Vector },
  { id: 'doc2', vector: doc2Vector },
  // ... 更多候选
];

const similar = this.embeddingService.findMostSimilar(
  queryVector.vector,
  candidates,
  5 // 返回top-5
);
```

### 3. 缓存策略

```typescript
// 系统自动缓存模型实例
// 相同模型的后续调用会复用已加载的实例

const result1 = await this.embeddingService.generateEmbedding('文本1');
const result2 = await this.embeddingService.generateEmbedding('文本2'); // 复用模型实例
```

## 监控和诊断

### 1. 健康检查

```bash
# 检查Ollama服务状态
curl http://localhost:11434/api/tags

# 检查应用embedding服务状态
curl http://localhost:3000/ai/universal/health
```

### 2. 性能监控

```typescript
// 获取详细的性能指标
const health = await this.embeddingService.healthCheck();
console.log(`服务状态: ${health.status}`);
console.log(`响应延迟: ${health.latency}ms`);
console.log(`当前模型: ${health.model}`);

// 获取服务统计
const stats = this.embeddingService.getStats();
console.log('服务统计:', stats);
```

### 3. 错误处理

```typescript
try {
  const vector = await this.embeddingService.generateEmbedding('测试文本');
} catch (error) {
  if (error.message.includes('Ollama服务不可用')) {
    // Ollama服务离线
    this.logger.error('Ollama服务不可用，请检查服务状态');
    // 可以尝试重启Ollama服务
  } else if (error.message.includes('模型不存在')) {
    // 模型未安装
    this.logger.error('所需模型未安装，请运行: ollama pull nomic-embed-text');
  } else {
    // 其他错误
    this.logger.error('嵌入向量生成失败:', error.message);
  }
}
```

## 部署建议

### 1. 本地开发环境

```bash
# 1. 安装Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 2. 启动Ollama服务
ollama serve

# 3. 安装embedding模型
ollama pull nomic-embed-text

# 4. 验证服务
curl http://localhost:11434/api/tags

# 5. 启动应用
pnpm run start:dev
```

### 2. 生产环境

```bash
# 使用Docker部署Ollama
docker run -d \
  --name ollama \
  -p 11434:11434 \
  -v ollama:/root/.ollama \
  ollama/ollama

# 进入容器安装模型
docker exec -it ollama ollama pull nomic-embed-text
docker exec -it ollama ollama pull mxbai-embed-large

# 配置应用环境变量
export OLLAMA_BASE_URL=http://localhost:11434
export OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# 启动应用
pnpm run build
pnpm run start:prod
```

### 3. 高可用部署

```yaml
# docker-compose.yml
version: '3.8'
services:
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    restart: unless-stopped
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
      - OLLAMA_EMBEDDING_MODEL=nomic-embed-text
    depends_on:
      - ollama
    restart: unless-stopped

volumes:
  ollama_data:
```

## 故障排查

### 常见问题及解决方案

1. **Ollama服务连接失败**
   ```bash
   # 检查服务状态
   curl http://localhost:11434/api/tags
   
   # 重启服务
   pkill ollama
   ollama serve
   ```

2. **模型未找到错误**
   ```bash
   # 查看已安装模型
   ollama list
   
   # 安装缺失模型
   ollama pull nomic-embed-text
   ```

3. **内存不足错误**
   ```bash
   # 切换到较小的模型
   curl -X POST http://localhost:3000/ai/embedding/switch-model \
     -H "Content-Type: application/json" \
     -d '{"model": "all-minilm"}'
   ```

4. **向量维度不匹配**
   ```typescript
   // 确保使用相同模型生成的向量进行比较
   const model = 'nomic-embed-text';
   const vector1 = await embeddingService.generateEmbedding('文本1', { model });
   const vector2 = await embeddingService.generateEmbedding('文本2', { model });
   const similarity = embeddingService.calculateCosineSimilarity(
     vector1.vector, 
     vector2.vector
   );
   ```

## 最佳实践

### 1. 模型选择策略

- **开发阶段**: 使用 `all-minilm` (快速调试)
- **测试阶段**: 使用 `nomic-embed-text` (标准质量)
- **生产环境**: 使用 `mxbai-embed-large` (高质量)

### 2. 性能优化

```typescript
// 好的做法：批量处理
const vectors = await embeddingService.generateBatchEmbeddings(texts);

// 避免：逐个处理
// texts.forEach(async text => await embeddingService.generateEmbedding(text));

// 好的做法：复用模型实例
const options = { model: 'nomic-embed-text' };
const vector1 = await embeddingService.generateEmbedding('文本1', options);
const vector2 = await embeddingService.generateEmbedding('文本2', options);

// 好的做法：错误处理
try {
  const vector = await embeddingService.generateEmbedding(text);
} catch (error) {
  logger.error('向量生成失败', { text: text.substring(0, 100), error: error.message });
  throw error; // 不要静默忽略错误
}
```

### 3. 监控和日志

```typescript
// 记录性能指标
const startTime = Date.now();
const result = await embeddingService.generateEmbedding(text);
const processingTime = Date.now() - startTime;

logger.log('向量生成完成', {
  textLength: text.length,
  dimensions: result.vector.length,
  model: result.model,
  processingTime,
  tokenCount: result.tokenCount,
});
```

## 更新日志

### v3.0.0 - 纯Ollama向量服务
- ✅ 完全移除模拟向量功能
- ✅ 统一使用Ollama embedding服务
- ✅ 基于LangChain的架构重构
- ✅ 智能错误处理和监控
- ✅ 批量处理优化
- ✅ 模型动态切换支持
- ✅ 完整的类型安全保障

### 技术优势

1. **质量保证**: 所有向量都由真实AI模型生成
2. **性能优化**: 基于LangChain的高效实现
3. **可扩展性**: 支持多种embedding模型
4. **监控完善**: 全面的健康检查和性能监控
5. **错误透明**: 失败时提供明确的错误信息

---

通过这次完整的迁移，你的项目现在拥有了一个完全基于本地Ollama的高质量向量服务，无需依赖云端API，确保了数据隐私和服务稳定性。所有的向量生成都通过真实的AI模型完成，为语义搜索、文档相似性分析等功能提供了可靠的基础。 