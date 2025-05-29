import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📢 Seeding sys_notice...');
  
  await prisma.sysNotice.createMany({
    data: [
      {
        noticeId: 1,
        noticeTitle: '测试一个小公告',
        noticeType: '1',
        noticeContent: Buffer.from('<p>测试一下公告.....  </p>'), // 转换为二进制数据，匹配 longblob 类型
        status: '0',
        createBy: 'admin',
        createTime: new Date('2024-05-17T13:50:01Z'),
        updateBy: '',
        updateTime: null,
        remark: null,
      },
    ],
    skipDuplicates: true,
  });
  
  console.log('✅ sys_notice seeded successfully');
}

export async function run() {
  await main()
    .catch((e) => {
      console.error('❌ sys_notice seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 