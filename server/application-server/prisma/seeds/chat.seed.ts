import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// 创建一个1536维度的模拟嵌入向量
async function createDummyEmbedding(text: string): Promise<number[]> {
  // 创建一个1536维度的随机向量
  return Array(1536).fill(0).map(() => Math.random() * 2 - 1);
}

async function seedChatAgents() {
  console.log('填充聊天Agent数据...');

  // 检查是否已经存在Agent
  const agentCount = await prisma.chatAgent.count();
  if (agentCount > 0) {
    console.log(`已存在${agentCount}个Agent，跳过填充`);
    return;
  }

  // 通用客服Agent
  await prisma.chatAgent.create({
    data: {
      id: 'general-support-agent',
      name: '通用客服助手',
      description: '处理一般问询和客户服务请求',
      type: 'general',
      systemPrompt: '你是一个友好的客服助手，可以回答关于产品、服务和订单的一般问题。如果用户问的问题超出你的知识范围，请礼貌地说明并提供可能的解决方案或联系方式。',
      capabilities: ['answer_faq', 'provide_information', 'handle_basic_requests'],
      modelConfig: {
        modelName: 'deepseek-r1',
        temperature: 0.7,
        maxTokens: 1000,
      },
      active: true,
    },
  });

  // 产品专家Agent
  await prisma.chatAgent.create({
    data: {
      id: 'product-expert-agent',
      name: '产品专家',
      description: '专门回答产品相关问题的助手',
      type: 'product',
      systemPrompt: '你是一个产品专家，精通所有产品的详细信息、规格和使用方法。请为用户提供准确的产品信息，并在可能的情况下推荐合适的产品。',
      capabilities: ['product_details', 'product_comparison', 'product_recommendation'],
      modelConfig: {
        modelName: 'deepseek-r1',
        temperature: 0.5,
        maxTokens: 1200,
      },
      active: true,
    },
  });

  // 预约服务Agent
  await prisma.chatAgent.create({
    data: {
      id: 'appointment-agent',
      name: '预约服务助手',
      description: '处理预约相关请求的专业助手',
      type: 'appointment',
      systemPrompt: '你是预约服务专家，可以帮助用户了解预约流程、查询预约状态并解答相关问题。对于具体的预约安排，你需要收集必要的信息，如服务类型、期望时间和地点等。',
      capabilities: ['appointment_info', 'appointment_status', 'appointment_guidance'],
      modelConfig: {
        modelName: 'deepseek-r1',
        temperature: 0.6,
        maxTokens: 1000,
      },
      active: true,
    },
  });

  console.log('Agent数据填充完成');
}

async function seedSemanticIntents() {
  console.log('填充语义意图数据...');
  
  // 检查是否已经存在意图
  const intentCount = await prisma.semanticIntent.count();
  if (intentCount > 0) {
    console.log(`已存在${intentCount}个语义意图，跳过填充`);
    return;
  }

  const productIntentExamples = [
    '这个产品有什么功能？',
    '能介绍下你们的产品吗？',
    '有哪些型号可以选择？',
    '产品多少钱？',
    '这个和那个产品有什么区别？',
    '你们卖什么产品？',
    '最受欢迎的产品是什么？',
    '有什么新产品推荐？',
  ];
  
  const productIntentEmbedding = await createDummyEmbedding(productIntentExamples.join(' '));
  
  // 使用原生SQL插入含embedding字段的数据
  const productIntentId = 'product-inquiry';
  const productPriority = 2;
  await prisma.$executeRaw`
    INSERT INTO "semantic_intents" (
      "id", "name", "description", "examples", "agent_type", "priority", 
      "embedding", "active", "created_at", "updated_at"
    ) VALUES (
      ${productIntentId}, '产品咨询', '关于产品信息、功能、价格等方面的咨询', 
      ${productIntentExamples}::text[], 'product', ${productPriority}, 
      ${productIntentEmbedding}::vector, true, now(), now()
    )
  `;
  
  const appointmentIntentExamples = [
    '怎么预约服务？',
    '我想预约一次上门安装',
    '能帮我查一下预约状态吗？',
    '预约需要准备什么材料？',
    '可以更改预约时间吗？',
    '想取消之前的预约',
    '上门服务怎么预约？',
    '预约流程是什么样的？',
  ];
  
  const appointmentIntentEmbedding = await createDummyEmbedding(appointmentIntentExamples.join(' '));
  
  // 使用原生SQL插入含embedding字段的数据
  const appointmentIntentId = 'appointment-inquiry';
  const appointmentPriority = 2;
  await prisma.$executeRaw`
    INSERT INTO "semantic_intents" (
      "id", "name", "description", "examples", "agent_type", "priority", 
      "embedding", "active", "created_at", "updated_at"
    ) VALUES (
      ${appointmentIntentId}, '预约咨询', '关于服务预约、预约状态查询等方面的咨询', 
      ${appointmentIntentExamples}::text[], 'appointment', ${appointmentPriority}, 
      ${appointmentIntentEmbedding}::vector, true, now(), now()
    )
  `;
  
  const generalIntentExamples = [
    '你好',
    '有人在吗',
    '我需要帮助',
    '联系方式是什么',
    '你们的服务时间',
    '怎么联系客服',
  ];
  
  const generalIntentEmbedding = await createDummyEmbedding(generalIntentExamples.join(' '));
  
  // 使用原生SQL插入含embedding字段的数据
  const generalIntentId = 'general-inquiry';
  const generalPriority = 1;
  await prisma.$executeRaw`
    INSERT INTO "semantic_intents" (
      "id", "name", "description", "examples", "agent_type", "priority", 
      "embedding", "active", "created_at", "updated_at"
    ) VALUES (
      ${generalIntentId}, '一般咨询', '一般性问候和咨询', 
      ${generalIntentExamples}::text[], 'general', ${generalPriority}, 
      ${generalIntentEmbedding}::vector, true, now(), now()
    )
  `;
  
  console.log('语义意图数据填充完成');
}

async function main() {
  console.log('开始填充聊天模块数据...');
  
  await seedChatAgents();
  await seedSemanticIntents();
  
  console.log('聊天模块数据填充完成！');
}

// 避免在导入时自动执行
if (require.main === module) {
  main()
    .catch((e) => {
      console.error('填充数据时出错:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 