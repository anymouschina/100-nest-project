import { PrismaClient } from '@prisma/client';
import { Ollama } from 'ollama';

const prisma = new PrismaClient();
const ollama = new Ollama({
  host: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
});

async function generateEmbeddings() {
  console.log('开始为知识库生成向量嵌入...');

  // 获取所有知识条目（暂时不过滤embedding字段）
  const knowledgeItems = await prisma.vectorKnowledge.findMany();

  console.log(`找到 ${knowledgeItems.length} 个知识条目`);

  const model = process.env.LLM_DEFAULT_MODEL || 'deepseek-r1';
  let successCount = 0;
  let failCount = 0;

  for (const item of knowledgeItems) {
    try {
      console.log(`正在处理: ${item.title}`);

      // 组合标题和内容作为嵌入文本
      const textToEmbed = `${item.title}\n${item.content}`;

      // 生成嵌入向量
      const response = await ollama.embeddings({
        model: model,
        prompt: textToEmbed,
      });

      if (response.embedding && response.embedding.length > 0) {
        // 将向量格式化为PostgreSQL向量格式
        const embeddingStr = `[${response.embedding.join(',')}]`;

        // 更新数据库
        await prisma.$executeRawUnsafe(
          `UPDATE "vector_knowledge" SET embedding = $1::vector WHERE id = $2`,
          embeddingStr,
          item.id,
        );

        console.log(
          `✓ ${item.title} - 生成 ${response.embedding.length} 维向量`,
        );
        successCount++;
      } else {
        console.error(`✗ ${item.title} - 生成嵌入失败：空向量`);
        failCount++;
      }

      // 添加延迟避免请求过快
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`✗ ${item.title} - 生成嵌入失败:`, error.message);
      failCount++;
    }
  }

  console.log('\n向量生成完成！');
  console.log(`成功: ${successCount} 个`);
  console.log(`失败: ${failCount} 个`);

  // 验证生成的向量
  const updatedItems = await prisma.vectorKnowledge.findMany();

  console.log(`数据库中现有 ${updatedItems.length} 个知识条目`);
}

// 如果直接运行此文件
if (require.main === module) {
  generateEmbeddings()
    .catch((e) => {
      console.error('生成嵌入失败:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { generateEmbeddings };
