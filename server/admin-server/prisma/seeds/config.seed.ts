import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📝 Seeding sys_config...');
  
  await prisma.sysConfig.createMany({
    data: [
      {
        configId: 1,
        configName: '用户管理-账号初始密码',
        configKey: 'sys.user.initPassword',
        configValue: '123456',
        configType: 'Y',
        createBy: 'admin',
        createTime: new Date('2024-05-17T16:07:16Z'),
        updateBy: '',
        updateTime: null,
        remark: '初始化密码 123456',
      },
    ],
    skipDuplicates: true,
  });
  
  console.log('✅ sys_config seeded successfully');
}

export async function run() {
  await main()
    .catch((e) => {
      console.error('❌ sys_config seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 