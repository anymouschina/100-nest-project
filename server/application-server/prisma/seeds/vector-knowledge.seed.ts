import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedVectorKnowledge() {
  console.log('开始初始化向量知识库...');

  const knowledgeData = [
    {
      namespace: 'customer_service',
      title: '订单查询帮助',
      content:
        '用户可以通过订单号查询订单状态。订单状态包括：待接单、已接单、施工中、已完成、已取消、已交付。用户可以在个人中心查看所有历史订单。',
      tags: ['订单', '查询', '状态'],
      source: 'help_document',
      importance: 0.9,
    },
    {
      namespace: 'customer_service',
      title: '退款政策',
      content:
        '用户可以在订单完成前申请取消订单。取消订单后会自动退款到原支付方式。退款通常在3-5个工作日内到账。如有特殊情况需要退款，请联系客服。',
      tags: ['退款', '取消', '政策'],
      source: 'help_document',
      importance: 0.9,
    },
    {
      namespace: 'customer_service',
      title: '优惠券使用',
      content:
        '用户可以在下单时使用优惠券。优惠券有有效期限制，过期后无法使用。每个订单只能使用一张优惠券。优惠券不能与其他促销活动叠加使用。',
      tags: ['优惠券', '折扣', '促销'],
      source: 'help_document',
      importance: 0.8,
    },
    {
      namespace: 'appointment',
      title: '预约服务流程',
      content:
        '用户可以通过预约功能安排服务。预约时需要提供服务类型、联系方式、地址等信息。预约提交后会有专人联系确认具体服务时间。',
      tags: ['预约', '服务', '流程'],
      source: 'help_document',
      importance: 0.9,
    },
    {
      namespace: 'appointment',
      title: '预约修改和取消',
      content:
        '用户可以在服务开始前24小时修改或取消预约。取消预约不收取任何费用。如需紧急修改，请直接联系客服。',
      tags: ['预约', '修改', '取消'],
      source: 'help_document',
      importance: 0.8,
    },
    {
      namespace: 'technical_support',
      title: '常见技术问题',
      content:
        '如果遇到登录问题，请检查网络连接和账号密码。如果支付失败，请确认银行卡余额和支付限额。如果页面加载慢，请清理浏览器缓存。',
      tags: ['技术', '问题', '解决'],
      source: 'help_document',
      importance: 0.8,
    },
    {
      namespace: 'technical_support',
      title: '账号安全',
      content:
        '为保护账号安全，请定期修改密码。不要在公共场所登录账号。发现异常登录请及时联系客服。建议开启双因素认证。',
      tags: ['安全', '账号', '保护'],
      source: 'help_document',
      importance: 0.9,
    },
    {
      namespace: 'general',
      title: '联系方式',
      content:
        '客服热线：400-123-4567，工作时间：周一至周日 9:00-21:00。在线客服：通过APP内聊天功能联系。邮箱：support@example.com。',
      tags: ['联系', '客服', '支持'],
      source: 'contact_info',
      importance: 1.0,
    },
  ];

  for (const knowledge of knowledgeData) {
    try {
      await prisma.vectorKnowledge.create({
        data: {
          ...knowledge,
          // 注意：embedding字段暂时为空，需要后续通过向量化服务填充
        },
      });
      console.log(`✓ 创建知识条目: ${knowledge.title}`);
    } catch (error) {
      console.error(`✗ 创建知识条目失败: ${knowledge.title}`, error.message);
    }
  }

  console.log('向量知识库初始化完成！');
}

// 如果直接运行此文件
if (require.main === module) {
  seedVectorKnowledge()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
