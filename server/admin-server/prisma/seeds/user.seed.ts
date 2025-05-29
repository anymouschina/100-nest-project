import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('👤 Seeding sys_user...');
  
  await prisma.sysUser.createMany({
    data: [
      { userId: 1, avatar: null, createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), delFlag: '0', deptId: 103, email: '87789771@qq.com', loginDate: null, loginIp: '', nickName: '小蒋', password: '$2b$10$dfDByASRziLltpJ9OQ8cTuSeaz3Kqv.BR1MWQoQ1bR3UfgEKYE0w6', phonenumber: '15888888888', remark: '管理员', sex: '1', status: '0', updateBy: 'admin', updateTime: null, userName: 'admin', userType: '00' },
      { userId: 2, avatar: null, createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), delFlag: '0', deptId: 105, email: '87789771@qq.com', loginDate: null, loginIp: '', nickName: '槑槑', password: '$2b$10$eOA3TW08QKta3zRSlhY6f.RXnOuzDwM0OGWAYh8zwVYMFwCkF.dme', phonenumber: '15666666666', remark: '测试员', sex: '1', status: '0', updateBy: 'admin', updateTime: new Date('2024-05-18T02:16:37Z'), userName: 'meimei', userType: '00' },
    ],
    skipDuplicates: true,
  });
  
  console.log('✅ sys_user seeded successfully');
}

export async function run() {
  await main()
    .catch((e) => {
      console.error('❌ sys_user seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 