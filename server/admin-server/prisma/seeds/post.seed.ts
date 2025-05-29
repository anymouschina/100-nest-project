import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('💼 Seeding sys_post...');
  
  await prisma.sysPost.createMany({
    data: [
      { postId: 1, postCode: 'ceo', postName: '董事长', postSort: 1, status: '0', createBy: 'admin', createTime: new Date('2024-04-18T16:07:16Z'), updateBy: '', updateTime: null, remark: null },
      { postId: 2, postCode: 'se', postName: '项目经理', postSort: 2, status: '0', createBy: 'admin', createTime: new Date('2024-04-18T16:07:16Z'), updateBy: '', updateTime: null, remark: null },
      { postId: 3, postCode: 'hr', postName: '人力资源', postSort: 3, status: '0', createBy: 'admin', createTime: new Date('2024-04-18T16:07:16Z'), updateBy: '', updateTime: null, remark: null },
      { postId: 4, postCode: 'user', postName: '普通员工', postSort: 4, status: '0', createBy: 'admin', createTime: new Date('2024-04-18T16:07:16Z'), updateBy: '', updateTime: null, remark: null },
    ],
    skipDuplicates: true,
  });
  
  console.log('✅ sys_post seeded successfully');
}

export async function run() {
  await main()
    .catch((e) => {
      console.error('❌ sys_post seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 