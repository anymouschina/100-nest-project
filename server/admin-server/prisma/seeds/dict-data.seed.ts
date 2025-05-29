import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📖 Seeding sys_dict_data...');
  
  await prisma.sysDictData.createMany({
    data: [
      { dictCode: 1, dictSort: 1, dictLabel: '男', dictValue: '0', dictType: 'sys_user_sex', cssClass: null, listClass: null, isDefault: 'Y', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '性别男' },
      { dictCode: 2, dictSort: 2, dictLabel: '女', dictValue: '1', dictType: 'sys_user_sex', cssClass: null, listClass: null, isDefault: 'N', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '性别女' },
      { dictCode: 3, dictSort: 3, dictLabel: '未知', dictValue: '2', dictType: 'sys_user_sex', cssClass: null, listClass: null, isDefault: 'N', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '性别未知' },
      { dictCode: 4, dictSort: 1, dictLabel: '显示', dictValue: '0', dictType: 'sys_show_hide', cssClass: null, listClass: 'primary', isDefault: 'Y', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '显示菜单' },
      { dictCode: 5, dictSort: 2, dictLabel: '隐藏', dictValue: '1', dictType: 'sys_show_hide', cssClass: null, listClass: 'danger', isDefault: 'N', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '隐藏菜单' },
      { dictCode: 6, dictSort: 1, dictLabel: '正常', dictValue: '0', dictType: 'sys_normal_disable', cssClass: null, listClass: 'primary', isDefault: 'Y', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '正常状态' },
      { dictCode: 7, dictSort: 2, dictLabel: '停用', dictValue: '1', dictType: 'sys_normal_disable', cssClass: null, listClass: 'danger', isDefault: 'N', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '停用状态' },
      { dictCode: 8, dictSort: 1, dictLabel: '正常', dictValue: '0', dictType: 'sys_job_status', cssClass: null, listClass: 'primary', isDefault: 'Y', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '正常状态' },
      { dictCode: 9, dictSort: 2, dictLabel: '暂停', dictValue: '1', dictType: 'sys_job_status', cssClass: null, listClass: 'danger', isDefault: 'N', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '停用状态' },
      { dictCode: 10, dictSort: 1, dictLabel: '默认', dictValue: 'DEFAULT', dictType: 'sys_job_group', cssClass: null, listClass: null, isDefault: 'Y', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '默认分组' },
      { dictCode: 11, dictSort: 2, dictLabel: '系统', dictValue: 'SYSTEM', dictType: 'sys_job_group', cssClass: null, listClass: null, isDefault: 'N', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '系统分组' },
      { dictCode: 12, dictSort: 1, dictLabel: '是', dictValue: 'Y', dictType: 'sys_yes_no', cssClass: null, listClass: 'primary', isDefault: 'Y', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '系统默认是' },
      { dictCode: 13, dictSort: 2, dictLabel: '否', dictValue: 'N', dictType: 'sys_yes_no', cssClass: null, listClass: 'danger', isDefault: 'N', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '系统默认否' },
      { dictCode: 14, dictSort: 1, dictLabel: '通知', dictValue: '1', dictType: 'sys_notice_type', cssClass: null, listClass: 'warning', isDefault: 'Y', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '通知' },
      { dictCode: 15, dictSort: 2, dictLabel: '公告', dictValue: '2', dictType: 'sys_notice_type', cssClass: null, listClass: 'success', isDefault: 'N', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '公告' },
      { dictCode: 16, dictSort: 1, dictLabel: '正常', dictValue: '0', dictType: 'sys_notice_status', cssClass: null, listClass: 'primary', isDefault: 'Y', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '正常状态' },
      { dictCode: 17, dictSort: 2, dictLabel: '关闭', dictValue: '1', dictType: 'sys_notice_status', cssClass: null, listClass: 'danger', isDefault: 'N', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '关闭状态' },
      { dictCode: 18, dictSort: 99, dictLabel: '其他', dictValue: '0', dictType: 'sys_oper_type', cssClass: null, listClass: 'info', isDefault: 'N', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '其他操作' },
      { dictCode: 19, dictSort: 1, dictLabel: '新增', dictValue: '1', dictType: 'sys_oper_type', cssClass: null, listClass: 'info', isDefault: 'N', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '新增操作' },
      { dictCode: 20, dictSort: 2, dictLabel: '修改', dictValue: '2', dictType: 'sys_oper_type', cssClass: null, listClass: 'info', isDefault: 'N', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '修改操作' },
      { dictCode: 21, dictSort: 3, dictLabel: '删除', dictValue: '3', dictType: 'sys_oper_type', cssClass: null, listClass: 'danger', isDefault: 'N', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '删除操作' },
      { dictCode: 22, dictSort: 4, dictLabel: '授权', dictValue: '4', dictType: 'sys_oper_type', cssClass: null, listClass: 'primary', isDefault: 'N', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '授权操作' },
      { dictCode: 23, dictSort: 5, dictLabel: '导出', dictValue: '5', dictType: 'sys_oper_type', cssClass: null, listClass: 'warning', isDefault: 'N', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '导出操作' },
      { dictCode: 24, dictSort: 6, dictLabel: '导入', dictValue: '6', dictType: 'sys_oper_type', cssClass: null, listClass: 'warning', isDefault: 'N', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '导入操作' },
      { dictCode: 25, dictSort: 7, dictLabel: '强退', dictValue: '7', dictType: 'sys_oper_type', cssClass: null, listClass: 'danger', isDefault: 'N', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '强退操作' },
      { dictCode: 26, dictSort: 8, dictLabel: '生成代码', dictValue: '8', dictType: 'sys_oper_type', cssClass: null, listClass: 'warning', isDefault: 'N', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '生成操作' },
      { dictCode: 27, dictSort: 9, dictLabel: '清空数据', dictValue: '9', dictType: 'sys_oper_type', cssClass: null, listClass: 'danger', isDefault: 'N', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '清空操作' },
      { dictCode: 28, dictSort: 1, dictLabel: '成功', dictValue: '0', dictType: 'sys_common_status', cssClass: null, listClass: 'primary', isDefault: 'N', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '正常状态' },
      { dictCode: 29, dictSort: 2, dictLabel: '失败', dictValue: '1', dictType: 'sys_common_status', cssClass: null, listClass: 'danger', isDefault: 'N', status: '0', createBy: 'admin', createTime: new Date('2024-05-17T16:07:16Z'), updateBy: '', updateTime: null, remark: '停用状态' },
    ],
    skipDuplicates: true,
  });
  
  console.log('✅ sys_dict_data seeded successfully');
}

export async function run() {
  await main()
    .catch((e) => {
      console.error('❌ sys_dict_data seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 