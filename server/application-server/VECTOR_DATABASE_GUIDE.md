# 向量数据库使用指南

## 概述

本项目集成了 **Qdrant** 向量数据库，用于支持AI智能日志分析和语义搜索功能。向量数据库使得系统能够：

- 🔍 **语义搜索**：基于内容含义而非关键词匹配进行搜索
- 🤖 **AI日志分析**：智能识别日志中的问题模式和异常
- 📊 **相似性匹配**：找到语义相似的历史问题和解决方案
- 🧠 **知识库管理**：存储和检索结构化知识数据

## 架构设计

### 服务层级

```
Application Layer
    ↓
AI Service Layer (LogAnalysisRealAIService)
    ↓
Vector Knowledge Service (VectorKnowledgeService)
    ↓
Qdrant Service (QdrantService)
    ↓
Qdrant Vector Database
```

### 核心组件

1. **QdrantService**: 底层向量数据库操作服务
2. **VectorKnowledgeService**: 向量知识库管理服务
3. **EmbeddingService**: 文本向量化服务
4. **LogAnalysisRealAIService**: AI日志分析服务

## 快速开始

### 1. 启动向量数据库

```bash
# 使用Docker Compose启动（推荐）
docker-compose up -d qdrant

# 或单独启动Qdrant
docker run -p 6333:6333 -p 6334:6334 -v qdrant_data:/qdrant/storage qdrant/qdrant:latest
```

### 2. 配置环境变量

```bash
# .env 文件
QDRANT_HOST=localhost
QDRANT_PORT=6333
QDRANT_API_KEY=

# AI服务配置
OPENAI_API_KEY=your_openai_api_key
MOONSHOT_API_KEY=your_moonshot_api_key
```

### 3. 初始化向量数据库

```bash
# 构建项目并初始化向量数据库
npm run vector:init
```

### 4. 验证安装

```bash
# 运行测试脚本
./test-vector-db.sh
```

## 功能特性

### 1. 智能日志分析

**API端点**: `POST /api/log-analysis/real-ai`

**功能**:
- 日志归一化处理
- AI特征提取
- 语义相似性搜索
- 异常模式检测
- 智能问题分类
- 风险等级评估

**示例请求**:
```json
{
  "userFeedback": "数据库连接出现问题",
  "logData": [
    "ERROR: Database connection timeout after 30 seconds",
    "WARN: Connection pool exhausted"
  ],
  "aiOptions": {
    "useSemanticSearch": true,
    "useAnomalyDetection": true,
    "useFeatureExtraction": true
  }
}
```

### 2. 语义搜索

**API端点**: `GET /api/ai/knowledge/search`

**功能**:
- 基于向量相似度的语义搜索
- 支持过滤器和阈值设置
- 返回相似度分数

**示例**:
```bash
curl "http://localhost:3000/api/ai/knowledge/search?query=数据库连接超时&limit=5"
```

### 3. 知识库管理

**功能**:
- 添加文档到向量库
- 批量文档处理
- 文档相似性查找
- 聚类分析

## 数据模型

### 向量文档结构

```typescript
interface VectorDocument {
  id: string;              // 文档唯一ID
  content: string;         // 文档内容
  metadata: {              // 元数据
    category: string;      // 分类
    type: string;          // 类型
    severity: string;      // 严重程度
    solution: string;      // 解决方案
    impact: string;        // 影响描述
  };
  vector?: number[];       // 向量表示
  similarity?: number;     // 相似度分数
}
```

### 初始化数据

系统初始化时会添加以下类型的数据：

1. **常见错误知识库**
   - 数据库连接超时
   - 内存溢出错误
   - HTTP服务器错误
   - 磁盘空间不足
   - Redis连接失败

2. **问题分类数据**
   - 数据库类错误
   - 内存类错误
   - 网络类错误
   - 安全类错误

## 集合配置

### log_analysis_knowledge

- **用途**: 存储日志分析相关的知识数据
- **向量维度**: 1536 (OpenAI text-embedding-3-small)
- **距离度量**: 余弦相似度
- **数据类型**: 错误解决方案、最佳实践

### issue_classification

- **用途**: 存储问题分类数据
- **向量维度**: 1536
- **距离度量**: 余弦相似度
- **数据类型**: 问题类型标签、分类规则

## 使用示例

### 添加新知识

```typescript
import { VectorKnowledgeService } from './ai/services/vector-knowledge.service';

// 注入服务
constructor(private readonly vectorService: VectorKnowledgeService) {}

// 添加新文档
await this.vectorService.addDocument({
  id: 'custom-error-1',
  content: '新发现的错误类型及其解决方案描述',
  metadata: {
    category: 'custom',
    type: 'new_error_type',
    severity: 'MEDIUM',
    solution: '具体的解决步骤',
    impact: '对系统的影响描述'
  }
});
```

### 执行语义搜索

```typescript
// 搜索相似问题
const searchResults = await this.vectorService.semanticSearch(
  '用户反馈的问题描述',
  {
    limit: 5,
    threshold: 0.7,
    filters: { category: 'database' }
  }
);

console.log('找到相似问题:', searchResults.documents);
```

## 性能优化

### 1. 向量维度选择

- **384维**: 较快的搜索速度，适合简单场景
- **1536维**: OpenAI标准，平衡性能和质量
- **自定义维度**: 根据具体需求调整

### 2. 索引优化

```typescript
// 创建集合时设置优化参数
await qdrantService.createCollection('collection_name', 1536, 'Cosine', {
  optimizers_config: {
    default_segment_number: 4,    // 增加段数
    max_segment_size: 20000,      // 控制段大小
  },
  replication_factor: 1,
  write_consistency_factor: 1
});
```

### 3. 搜索优化

- 设置合适的相似度阈值（0.7-0.8）
- 限制返回结果数量
- 使用过滤器减少搜索范围

## 监控和维护

### 1. 健康检查

```bash
# 检查Qdrant服务状态
curl http://localhost:6333/health

# 查看集合信息
curl http://localhost:6333/collections
```

### 2. 性能监控

```bash
# 查看集合统计
curl http://localhost:6333/collections/log_analysis_knowledge

# 监控索引状态
curl http://localhost:6333/collections/log_analysis_knowledge/cluster
```

### 3. 数据备份

```bash
# 备份Qdrant数据
docker exec oms-qdrant tar -czf /tmp/qdrant-backup.tar.gz /qdrant/storage
docker cp oms-qdrant:/tmp/qdrant-backup.tar.gz ./qdrant-backup.tar.gz
```

## 故障排除

### 常见问题

1. **Qdrant连接失败**
   ```bash
   # 检查服务状态
   docker-compose ps qdrant
   
   # 查看日志
   docker-compose logs qdrant
   ```

2. **向量搜索无结果**
   - 检查相似度阈值设置
   - 验证文档是否已正确添加
   - 确认向量维度匹配

3. **性能问题**
   - 增加Qdrant内存分配
   - 优化向量维度
   - 调整段配置参数

### 调试模式

```typescript
// 启用详细日志
const logger = new Logger('VectorService');
logger.setLevel('debug');

// 查看向量生成过程
const embedding = await this.embeddingService.generateEmbedding(text);
logger.debug('生成向量:', embedding.slice(0, 5));
```

## 扩展功能

### 1. 多语言支持

```typescript
// 配置不同语言的嵌入模型
const embeddingModel = language === 'zh' 
  ? 'text-embedding-ada-002-zh' 
  : 'text-embedding-ada-002';
```

### 2. 实时索引

```typescript
// 监听数据变化，实时更新向量库
@EventPattern('knowledge.updated')
async handleKnowledgeUpdate(data: any) {
  await this.vectorService.addDocument(data);
}
```

### 3. 混合搜索

```typescript
// 结合关键词和语义搜索
const results = await this.vectorService.hybridSearch(query, {
  keywordWeight: 0.3,
  semanticWeight: 0.7
});
```

## 最佳实践

1. **数据质量**: 确保输入文档的质量和一致性
2. **向量维度**: 根据数据规模选择合适的维度
3. **阈值设置**: 根据业务需求调整相似度阈值
4. **定期维护**: 清理过期数据，更新知识库
5. **监控告警**: 设置性能和错误监控

## 参考资料

- [Qdrant官方文档](https://qdrant.tech/documentation/)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [向量数据库最佳实践](https://www.pinecone.io/learn/vector-database/)

---

**注意**: 本指南随项目发展会持续更新。如有问题，请查看项目日志或联系开发团队。 