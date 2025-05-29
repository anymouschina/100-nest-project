import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('👥 Seeding sys_role...');
  
  await prisma.sysRole.createMany({
    data: [
      { roleId: 1, createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), dataScope: '1', delFlag: '0', deptCheckStrictly: true, menuCheckStrictly: true, remark: '超级管理员', roleKey: 'admin', roleName: '超级管理员', roleSort: 1, status: '0', updateBy: '', updateTime: null },
      { roleId: 2, createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), dataScope: '2', delFlag: '0', deptCheckStrictly: true, menuCheckStrictly: true, remark: '普通角色', roleKey: 'common', roleName: '普通角色', roleSort: 2, status: '0', updateBy: '', updateTime: null },
    ],
    skipDuplicates: true,
  });
  
  console.log('✅ sys_role seeded successfully');
}

export async function run() {
  await main()
    .catch((e) => {
      console.error('❌ sys_role seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 