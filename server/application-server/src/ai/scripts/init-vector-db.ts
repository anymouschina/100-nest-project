import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { QdrantService } from '../services/qdrant.service';
import { VectorKnowledgeService } from '../services/vector-knowledge.service';
import { Logger } from '@nestjs/common';

/**
 * 向量数据库初始化脚本
 * 用于创建必要的集合和添加初始知识数据
 */
async function initVectorDatabase() {
  const logger = new Logger('VectorDBInit');
  
  try {
    logger.log('开始初始化向量数据库...');
    
    // 创建NestJS应用
    const app = await NestFactory.createApplicationContext(AppModule);
    
    const qdrantService = app.get(QdrantService);
    const vectorService = app.get(VectorKnowledgeService);
    
    // 等待Qdrant连接
    if (!qdrantService.isReady()) {
      logger.warn('等待Qdrant连接...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    if (!qdrantService.isReady()) {
      throw new Error('Qdrant服务不可用，请确保Qdrant正在运行');
    }
    
    // 创建日志分析知识库集合
    const LOG_ANALYSIS_COLLECTION = 'log_analysis_knowledge';
    logger.log(`创建集合: ${LOG_ANALYSIS_COLLECTION}`);
    
    await qdrantService.createCollection(LOG_ANALYSIS_COLLECTION, 1536); // OpenAI embedding维度
    
    // 添加初始知识数据
    await addInitialKnowledgeData(vectorService, logger);
    
    // 创建问题分类集合
    const CLASSIFICATION_COLLECTION = 'issue_classification';
    logger.log(`创建集合: ${CLASSIFICATION_COLLECTION}`);
    
    await qdrantService.createCollection(CLASSIFICATION_COLLECTION, 1536);
    
    // 添加分类数据
    await addClassificationData(vectorService, logger);
    
    logger.log('向量数据库初始化完成');
    
    await app.close();
  } catch (error) {
    logger.error('向量数据库初始化失败', error.stack);
    process.exit(1);
  }
}

/**
 * 添加初始知识数据
 */
async function addInitialKnowledgeData(
  vectorService: VectorKnowledgeService,
  logger: Logger,
) {
  logger.log('添加初始知识数据...');
  
  const knowledgeData = [
    {
      id: 'common-error-1',
      content: '数据库连接超时错误通常是由于网络延迟或数据库负载过高引起的',
      metadata: {
        category: 'database',
        type: 'connection_timeout',
        severity: 'HIGH',
        solution: '检查数据库连接池配置，增加超时时间，或优化数据库查询',
        impact: '可能导致用户无法访问服务'
      }
    },
    {
      id: 'common-error-2', 
      content: '内存溢出OutOfMemoryError通常表示应用程序内存使用超过了JVM堆大小限制',
      metadata: {
        category: 'memory',
        type: 'out_of_memory',
        severity: 'CRITICAL',
        solution: '增加JVM堆内存大小，检查内存泄露，优化内存使用',
        impact: '应用程序崩溃，服务不可用'
      }
    },
    {
      id: 'common-error-3',
      content: 'HTTP 500内部服务器错误通常是由于代码异常或配置问题引起的',
      metadata: {
        category: 'http',
        type: 'internal_server_error',
        severity: 'HIGH',
        solution: '检查应用程序日志，修复代码bug，验证配置文件',
        impact: '用户请求失败'
      }
    },
    {
      id: 'common-error-4',
      content: '文件系统磁盘空间不足会导致无法写入新文件或日志',
      metadata: {
        category: 'filesystem',
        type: 'disk_full',
        severity: 'CRITICAL',
        solution: '清理不必要的文件，增加磁盘容量，设置日志轮转',
        impact: '系统无法正常运行'
      }
    },
    {
      id: 'common-error-5',
      content: 'Redis连接失败通常是由于Redis服务未启动或网络不通',
      metadata: {
        category: 'cache',
        type: 'redis_connection_failed',
        severity: 'MEDIUM',
        solution: '检查Redis服务状态，验证网络连接，检查Redis配置',
        impact: '缓存功能不可用，性能下降'
      }
    }
  ];
  
  for (const data of knowledgeData) {
    try {
      await vectorService.addDocument(data);
      logger.debug(`添加知识数据: ${data.id}`);
    } catch (error) {
      logger.warn(`添加知识数据失败: ${data.id}`, error.message);
    }
  }
  
  logger.log(`完成添加 ${knowledgeData.length} 条知识数据`);
}

/**
 * 添加分类数据
 */
async function addClassificationData(
  vectorService: VectorKnowledgeService,
  logger: Logger,
) {
  logger.log('添加分类数据...');
  
  const classificationData = [
    {
      id: 'classification-database',
      content: '数据库相关错误包括连接超时、查询超时、死锁、主键冲突等',
      metadata: {
        category: 'issue_classification',
        issueType: 'DATABASE_ERROR',
        severity: 'HIGH',
        keywords: ['database', 'connection', 'timeout', 'deadlock', 'sql']
      }
    },
    {
      id: 'classification-memory',
      content: '内存相关错误包括内存溢出、内存泄露、垃圾回收异常等',
      metadata: {
        category: 'issue_classification',
        issueType: 'MEMORY_ERROR',
        severity: 'CRITICAL',
        keywords: ['memory', 'heap', 'oom', 'gc', 'outofmemory']
      }
    },
    {
      id: 'classification-network',
      content: '网络相关错误包括连接被拒绝、超时、DNS解析失败等',
      metadata: {
        category: 'issue_classification',
        issueType: 'NETWORK_ERROR',
        severity: 'MEDIUM',
        keywords: ['network', 'connection', 'timeout', 'dns', 'refused']
      }
    },
    {
      id: 'classification-security',
      content: '安全相关错误包括认证失败、权限不足、SQL注入尝试等',
      metadata: {
        category: 'issue_classification',
        issueType: 'SECURITY_ERROR',
        severity: 'HIGH',
        keywords: ['auth', 'permission', 'security', 'unauthorized', 'forbidden']
      }
    }
  ];
  
  for (const data of classificationData) {
    try {
      await vectorService.addDocument(data);
      logger.debug(`添加分类数据: ${data.id}`);
    } catch (error) {
      logger.warn(`添加分类数据失败: ${data.id}`, error.message);
    }
  }
  
  logger.log(`完成添加 ${classificationData.length} 条分类数据`);
}

// 如果直接运行此脚本
if (require.main === module) {
  initVectorDatabase();
}

export { initVectorDatabase }; 