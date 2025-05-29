import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌐 Seeding sys_web...');
  
  // 虽然SQL文件中没有记录，但需要提供一个默认的系统配置
  await prisma.sysWeb.createMany({
    data: [
      {
        webId: 1,
        theme: '#409EFF', // 默认主题色
        sideTheme: 'theme-dark', // 侧边栏主题
        topNav: false, // 是否启用顶部导航
        tagsView: true, // 是否启用标签栏
        fixedHeader: true, // 是否固定头部
        sidebarLogo: true, // 是否显示侧边栏Logo
        dynamicTitle: true, // 是否显示动态标题
        createBy: 'admin',
        createTime: new Date('2024-05-17T16:07:16Z'),
        updateBy: '',
        updateTime: null,
      },
    ],
    skipDuplicates: true,
  });
  
  console.log('✅ sys_web seeded successfully');
}

export async function run() {
  await main()
    .catch((e) => {
      console.error('❌ sys_web seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 