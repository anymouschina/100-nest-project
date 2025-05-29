import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('⚙️ Seeding sys_job...');
  
  await prisma.sysJob.createMany({
    data: [
      {
        jobId: 1,
        jobName: '测试任务',
        jobGroup: 'DEFAULT',
        invokeTarget: 'JobService.demo(1,2,3,true)',
        cronExpression: '0/10 * * * * ?',
        misfirePolicy: '1',
        concurrent: '1',
        status: '1',
        createBy: 'admin',
        createTime: new Date('2024-05-17T14:02:53Z'),
        updateBy: '',
        updateTime: null,
        remark: '',
      },
    ],
    skipDuplicates: true,
  });
  
  console.log('✅ sys_job seeded successfully');
}

export async function run() {
  await main()
    .catch((e) => {
      console.error('❌ sys_job seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 