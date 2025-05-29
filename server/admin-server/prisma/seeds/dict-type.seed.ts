import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📚 Seeding sys_dict_type...');
  
  await prisma.sysDictType.createMany({
    data: [
      { dictId: 1, dictName: '用户性别', dictType: 'sys_user_sex', status: '0', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '用户性别列表' },
      { dictId: 2, dictName: '菜单状态', dictType: 'sys_show_hide', status: '0', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '菜单状态列表' },
      { dictId: 3, dictName: '系统开关', dictType: 'sys_normal_disable', status: '0', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '系统开关列表' },
      { dictId: 4, dictName: '任务状态', dictType: 'sys_job_status', status: '0', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '任务状态列表' },
      { dictId: 5, dictName: '任务分组', dictType: 'sys_job_group', status: '0', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '任务分组列表' },
      { dictId: 6, dictName: '系统是否', dictType: 'sys_yes_no', status: '0', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '系统是否列表' },
      { dictId: 7, dictName: '通知类型', dictType: 'sys_notice_type', status: '0', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '通知类型列表' },
      { dictId: 8, dictName: '通知状态', dictType: 'sys_notice_status', status: '0', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '通知状态列表' },
      { dictId: 9, dictName: '操作类型', dictType: 'sys_oper_type', status: '0', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '操作类型列表' },
      { dictId: 10, dictName: '系统状态', dictType: 'sys_common_status', status: '0', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '登录状态列表' },
    ],
    skipDuplicates: true,
  });
  
  console.log('✅ sys_dict_type seeded successfully');
}

export async function run() {
  await main()
    .catch((e) => {
      console.error('❌ sys_dict_type seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 