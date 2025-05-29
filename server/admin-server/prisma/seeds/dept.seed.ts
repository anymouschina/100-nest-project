import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏢 Seeding sys_dept...');
  
  await prisma.sysDept.createMany({
    data: [
      { deptId: 100, parentId: null, ancestors: ',', deptName: '槑槑科技', orderNum: 0, leader: '小蒋', phone: '13006133172', email: '87789771@qq.com', status: '0', delFlag: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null },
      { deptId: 101, parentId: 100, ancestors: ',100,101,', deptName: '合肥总公司', orderNum: 1, leader: '小蒋', phone: '13006133172', email: '87789771@qq.com', status: '0', delFlag: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null },
      { deptId: 102, parentId: 100, ancestors: ',100,102,', deptName: '阜阳分公司', orderNum: 2, leader: '小蒋', phone: '13006133172', email: '87789771@qq.com', status: '0', delFlag: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null },
      { deptId: 103, parentId: 101, ancestors: ',100,101,103,', deptName: '研发部门', orderNum: 1, leader: '小蒋', phone: '13006133172', email: '87789771@qq.com', status: '0', delFlag: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null },
      { deptId: 104, parentId: 101, ancestors: ',100,101,104,', deptName: '市场部门', orderNum: 2, leader: '小蒋', phone: '13006133172', email: '87789771@qq.com', status: '0', delFlag: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null },
      { deptId: 105, parentId: 101, ancestors: ',100,101,105,', deptName: '测试部门', orderNum: 3, leader: '小蒋', phone: '13006133172', email: '87789771@qq.com', status: '0', delFlag: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null },
      { deptId: 106, parentId: 101, ancestors: ',100,101,106,', deptName: '财务部门', orderNum: 4, leader: '小蒋', phone: '13006133172', email: '87789771@qq.com', status: '0', delFlag: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null },
      { deptId: 107, parentId: 101, ancestors: ',100,101,107,', deptName: '运维部门', orderNum: 5, leader: '小蒋', phone: '13006133172', email: '87789771@qq.com', status: '0', delFlag: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null },
      { deptId: 108, parentId: 102, ancestors: ',100,102,108,', deptName: '市场部门', orderNum: 1, leader: '小蒋', phone: '13006133172', email: '87789771@qq.com', status: '0', delFlag: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null },
      { deptId: 109, parentId: 102, ancestors: ',100,102,109,', deptName: '财务部门', orderNum: 2, leader: '小蒋', phone: '13006133172', email: '87789771@qq.com', status: '0', delFlag: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null },
    ],
    skipDuplicates: true,
  });
  
  console.log('✅ sys_dept seeded successfully');
}

export async function run() {
  await main()
    .catch((e) => {
      console.error('❌ sys_dept seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 