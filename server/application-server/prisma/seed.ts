import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 引入聊天模块种子文件
import './seeds/chat.seed';
import { seedVectorKnowledge } from './seeds/vector-knowledge.seed';

async function main() {
  console.log('开始执行数据库初始化...');

  // 启用 pgvector 扩展
  try {
    await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('pgvector 扩展已成功启用');

    // 验证扩展是否已启用
    const result =
      await prisma.$queryRaw`SELECT * FROM pg_extension WHERE extname = 'vector';`;
    console.log('pgvector 扩展状态:', result);
  } catch (error) {
    console.error('启用 pgvector 扩展失败:', error);
    throw error;
  }

  // 初始化向量知识库
  try {
    await seedVectorKnowledge();
    console.log('向量知识库初始化成功');
  } catch (error) {
    console.error('向量知识库初始化失败:', error);
    // 不抛出错误，允许继续执行其他初始化
  }

  console.log('数据库初始化完成');
}

main()
  .catch((e) => {
    console.error('Seed 失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
