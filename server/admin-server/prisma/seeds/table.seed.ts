import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📋 Seeding sys_table...');
  
  await prisma.sysTable.createMany({
    data: [
      {
        tableId: 'system_user_1',
        createBy: 'admin',
        createTime: new Date('2024-05-17T14:11:38Z'),
        updateBy: '',
        updateTime: null,
        tableJsonConfig: '[{\"minWidth\":40,\"showOverflowTooltip\":false,\"align\":\"center\",\"hide\":false,\"noExport\":false,\"sort\":0,\"prop\":\"勾选框\",\"label\":\"勾选框\",\"type\":\"selection\"},{\"minWidth\":100,\"showOverflowTooltip\":true,\"align\":\"center\",\"hide\":false,\"noExport\":false,\"sort\":1,\"prop\":\"userId\",\"label\":\"用户编号\"},{\"minWidth\":100,\"showOverflowTooltip\":true,\"align\":\"left\",\"hide\":false,\"noExport\":false,\"sort\":2,\"prop\":\"userName\",\"label\":\"用户名称\"},{\"minWidth\":100,\"showOverflowTooltip\":true,\"align\":\"left\",\"hide\":false,\"noExport\":false,\"sort\":3,\"prop\":\"nickName\",\"label\":\"用户昵称\"},{\"minWidth\":140,\"showOverflowTooltip\":true,\"align\":\"left\",\"hide\":false,\"noExport\":false,\"sort\":4,\"prop\":\"dept.deptName\",\"label\":\"部门\"},{\"minWidth\":80,\"showOverflowTooltip\":true,\"align\":\"center\",\"hide\":false,\"noExport\":false,\"sort\":5,\"prop\":\"status\",\"label\":\"状态\",\"slot\":\"status\"},{\"minWidth\":160,\"showOverflowTooltip\":true,\"align\":\"center\",\"hide\":false,\"noExport\":false,\"sort\":6,\"prop\":\"createTime\",\"label\":\"创建时间\",\"slot\":\"createTime\"},{\"minWidth\":160,\"showOverflowTooltip\":false,\"align\":\"center\",\"hide\":false,\"noExport\":false,\"sort\":7,\"prop\":\"操作\",\"label\":\"操作\",\"slot\":\"operate\"}]',
      },
    ],
    skipDuplicates: true,
  });
  
  console.log('✅ sys_table seeded successfully');
}

export async function run() {
  await main()
    .catch((e) => {
      console.error('❌ sys_table seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 