import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 Seeding sys_oper_log...');
  
  await prisma.sysOperLog.createMany({
    data: [
      { operId: 1, title: '菜单管理', businessType: '3', method: 'SysMenuController.delete()', requestMethod: 'DELETE', operatorType: 0, operName: 'admin', deptName: '研发部门', operUrl: '/system/menu/4', operIp: '127.0.0.1', operLocation: '内网IP', operParam: '{\"params\":{\"menuIds\":\"4\"},\"query\":{},\"body\":{}}', jsonResult: '{\"code\":200,\"msg\":\"操作成功\"}', status: '0', errorMsg: null, operTime: new Date('2024-05-17T13:44:03Z'), costTime: 323 },
      { operId: 2, title: '菜单管理', businessType: '3', method: 'SysMenuController.delete()', requestMethod: 'DELETE', operatorType: 0, operName: 'admin', deptName: '研发部门', operUrl: '/system/menu/111', operIp: '127.0.0.1', operLocation: '内网IP', operParam: '{\"params\":{\"menuIds\":\"111\"},\"query\":{},\"body\":{}}', jsonResult: '{\"code\":200,\"msg\":\"操作成功\"}', status: '0', errorMsg: null, operTime: new Date('2024-05-17T13:44:13Z'), costTime: 326 },
      { operId: 3, title: '系统参数', businessType: '3', method: 'SysConfigController.delete()', requestMethod: 'DELETE', operatorType: 0, operName: 'admin', deptName: '研发部门', operUrl: '/system/config/1,3,5,6', operIp: '127.0.0.1', operLocation: '内网IP', operParam: '{\"params\":{\"configIds\":\"1,3,5,6\"},\"query\":{},\"body\":{}}', jsonResult: '{\"code\":200,\"msg\":\"操作成功\"}', status: '0', errorMsg: null, operTime: new Date('2024-05-17T13:47:25Z'), costTime: 113 },
      { operId: 4, title: '公告管理', businessType: '1', method: 'SysNoticeController.add()', requestMethod: 'POST', operatorType: 0, operName: 'admin', deptName: '研发部门', operUrl: '/system/notice', operIp: '127.0.0.1', operLocation: '内网IP', operParam: null, jsonResult: '{\"code\":200,\"msg\":\"操作成功\"}', status: '0', errorMsg: null, operTime: new Date('2024-05-17T13:50:01Z'), costTime: 260 },
      { operId: 5, title: '菜单管理', businessType: '2', method: 'SysMenuController.uplate()', requestMethod: 'PUT', operatorType: 0, operName: 'admin', deptName: '研发部门', operUrl: '/system/menu', operIp: '127.0.0.1', operLocation: '内网IP', operParam: '{\"params\":{},\"query\":{},\"body\":{\"menuId\":115,\"menuName\":\"表单构建\",\"parentId\":3,\"orderNum\":1,\"path\":\"build\",\"component\":\"tool/build/index\",\"query\":null,\"isFrame\":\"1\",\"isCache\":\"0\",\"menuType\":\"C\",\"visible\":\"0\",\"status\":\"1\",\"perms\":\"tool:build:list\",\"icon\":\"build\",\"createBy\":\"admin\",\"createTime\":\"2024-04-18T16:07:17.000Z\",\"updateBy\":\"\",\"updateTime\":null,\"remark\":\"表单构建菜单\"}}', jsonResult: '{\"code\":200,\"msg\":\"操作成功\"}', status: '0', errorMsg: null, operTime: new Date('2024-05-17T13:51:17Z'), costTime: 361 },
    ],
    skipDuplicates: true,
  });
  
  console.log('✅ sys_oper_log seeded successfully');
}

export async function run() {
  await main()
    .catch((e) => {
      console.error('❌ sys_oper_log seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 