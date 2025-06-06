/**
 * 直接使用SQL语句修复PostgreSQL序列问题
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 开始修复数据库序列问题...');

  try {
    // 直接使用SQL修复sys_dict_type表的序列
    await prisma.$executeRawUnsafe(`
      -- 先查询sys_dict_type表中最大的dictId值
      DO $$ 
      DECLARE
        max_id INT;
      BEGIN
        -- 获取当前最大ID
        SELECT COALESCE(MAX("dictId"), 0) + 10 INTO max_id FROM "sys_dict_type";
        
        -- 重置序列
        EXECUTE 'ALTER SEQUENCE "sys_dict_type_dictId_seq" RESTART WITH ' || max_id;
        
        -- 输出结果
        RAISE NOTICE 'Sequence sys_dict_type_dictId_seq has been reset to %', max_id;
      END $$;
    `);
    
    console.log('✅ 成功修复 sys_dict_type_dictId_seq 序列');
    
    // 修复其他可能有问题的序列
    await prisma.$executeRawUnsafe(`
      DO $$ 
      DECLARE
        max_id INT;
      BEGIN
        -- sys_dict_data
        SELECT COALESCE(MAX("dictCode"), 0) + 10 INTO max_id FROM "sys_dict_data";
        EXECUTE 'ALTER SEQUENCE "sys_dict_data_dictCode_seq" RESTART WITH ' || max_id;
        RAISE NOTICE 'Sequence sys_dict_data_dictCode_seq has been reset to %', max_id;
        
        -- sys_oper_log
        SELECT COALESCE(MAX("operId"), 0) + 10 INTO max_id FROM "sys_oper_log";
        EXECUTE 'ALTER SEQUENCE "sys_oper_log_operId_seq" RESTART WITH ' || max_id;
        RAISE NOTICE 'Sequence sys_oper_log_operId_seq has been reset to %', max_id;
        
        -- sys_user
        SELECT COALESCE(MAX("userId"), 0) + 10 INTO max_id FROM "sys_user";
        EXECUTE 'ALTER SEQUENCE "sys_user_userId_seq" RESTART WITH ' || max_id;
        RAISE NOTICE 'Sequence sys_user_userId_seq has been reset to %', max_id;
        
        -- sys_role
        SELECT COALESCE(MAX("roleId"), 0) + 10 INTO max_id FROM "sys_role";
        EXECUTE 'ALTER SEQUENCE "sys_role_roleId_seq" RESTART WITH ' || max_id;
        RAISE NOTICE 'Sequence sys_role_roleId_seq has been reset to %', max_id;
        
        -- sys_menu
        SELECT COALESCE(MAX("menuId"), 0) + 10 INTO max_id FROM "sys_menu";
        EXECUTE 'ALTER SEQUENCE "sys_menu_menuId_seq" RESTART WITH ' || max_id;
        RAISE NOTICE 'Sequence sys_menu_menuId_seq has been reset to %', max_id;
      END $$;
    `);
    
    console.log('✅ 成功修复所有主要表的序列');
    
  } catch (error) {
    console.error('❌ 序列修复失败:', error);
  }

  console.log('✅ 序列修复完成');
}

export async function run() {
  await main()
    .catch((e) => {
      console.error('❌ 序列修复失败:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 