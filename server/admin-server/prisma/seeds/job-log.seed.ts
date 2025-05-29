import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📋 Seeding sys_job_log...');
  
  await prisma.sysJobLog.createMany({
    data: [
      {
        jobLogId: 1,
        jobName: '测试任务',
        jobGroup: 'DEFAULT',
        invokeTarget: 'JobService.demo(1,2,3,true)',
        jobMessage: '执行成功',
        status: '0',
        exceptionInfo: '',
        createTime: new Date('2024-05-17T14:03:05Z'),
      },
    ],
    skipDuplicates: true,
  });
  
  console.log('✅ sys_job_log seeded successfully');
}

export async function run() {
  await main()
    .catch((e) => {
      console.error('❌ sys_job_log seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 