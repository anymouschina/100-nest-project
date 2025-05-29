import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Seeding sys_login_infor...');
  
  await prisma.sysLoginInfor.createMany({
    data: [
      { infoId: 1, userName: 'admin', ipaddr: '127.0.0.1', loginLocation: '内网IP', browser: 'Edge124', os: 'Mac OS10.15.7', status: '1', msg: '用户名或密码错误', loginTime: new Date('2024-05-17T13:10:19Z') },
      { infoId: 2, userName: 'admin', ipaddr: '127.0.0.1', loginLocation: '内网IP', browser: 'Edge124', os: 'Mac OS10.15.7', status: '0', msg: '登录成功', loginTime: new Date('2024-05-17T13:43:47Z') },
      { infoId: 3, userName: 'meimei', ipaddr: '127.0.0.1', loginLocation: '内网IP', browser: 'Chrome124', os: 'Mac OS10.15.7', status: '0', msg: '登录成功', loginTime: new Date('2024-05-18T02:11:18Z') },
      { infoId: 4, userName: 'admin', ipaddr: '127.0.0.1', loginLocation: '内网IP', browser: 'Chrome124', os: 'Mac OS10.15.7', status: '0', msg: '登录成功', loginTime: new Date('2024-05-18T02:14:01Z') },
      { infoId: 5, userName: 'admin', ipaddr: '127.0.0.1', loginLocation: '内网IP', browser: 'Chrome124', os: 'Mac OS10.15.7', status: '0', msg: '登录成功', loginTime: new Date('2024-05-18T02:16:19Z') },
      { infoId: 6, userName: 'admin', ipaddr: '127.0.0.1', loginLocation: '内网IP', browser: 'Edge124', os: 'Mac OS10.15.7', status: '0', msg: '登录成功', loginTime: new Date('2024-05-18T02:16:28Z') },
      { infoId: 7, userName: 'admin', ipaddr: '127.0.0.1', loginLocation: '内网IP', browser: 'Edge124', os: 'Mac OS10.15.7', status: '1', msg: '验证码错误', loginTime: new Date('2024-05-18T02:16:27Z') },
      { infoId: 8, userName: 'admin', ipaddr: '127.0.0.1', loginLocation: '内网IP', browser: 'Edge124', os: 'Mac OS10.15.7', status: '0', msg: '登录成功', loginTime: new Date('2024-05-18T02:18:01Z') },
    ],
    skipDuplicates: true,
  });
  
  console.log('✅ sys_login_infor seeded successfully');
}

export async function run() {
  await main()
    .catch((e) => {
      console.error('❌ sys_login_infor seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 