import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔗 Seeding relations...');
  
  // Connect departments to roles (sys_dept <-> sys_role)
  await prisma.sysDept.update({
    where: { deptId: 100 },
    data: {
      roles: {
        connect: { roleId: 1 }
      }
    }
  });
  
  // Connect users to roles (sys_user <-> sys_role)
  await prisma.sysUser.update({
    where: { userId: 1 },
    data: {
      roles: {
        connect: { roleId: 1 }
      }
    }
  });
  
  // Connect user 2 to role 2 (普通用户关联普通角色)
  await prisma.sysUser.update({
    where: { userId: 2 },
    data: {
      roles: {
        connect: { roleId: 2 }
      }
    }
  });
  
  // Connect users to posts (sys_user <-> sys_post)
  await prisma.sysUser.update({
    where: { userId: 1 },
    data: {
      posts: {
        connect: { postId: 1 } // 管理员关联到董事长岗位
      }
    }
  });
  
  await prisma.sysUser.update({
    where: { userId: 2 },
    data: {
      posts: {
        connect: { postId: 4 } // 普通用户关联到普通员工岗位
      }
    }
  });
  
  // Connect roles to menus (sys_role <-> sys_menu)
  // 为超级管理员角色关联所有菜单
  const menuIds = await prisma.sysMenu.findMany({
    select: { menuId: true }
  });
  
  await prisma.sysRole.update({
    where: { roleId: 1 },
    data: {
      menus: {
        connect: menuIds.map(menu => ({ menuId: menu.menuId }))
      }
    }
  });
  
  // 为普通角色关联部分菜单（用户、部门、岗位等）
  await prisma.sysRole.update({
    where: { roleId: 2 },
    data: {
      menus: {
        connect: [
          { menuId: 1 }, // 系统管理
          { menuId: 100 }, // 用户管理
          { menuId: 103 }, // 部门管理
          { menuId: 104 }, // 岗位管理
          { menuId: 500 }, // 操作日志
          { menuId: 501 }  // 登录日志
        ]
      }
    }
  });
  
  console.log('✅ Relations seeded successfully');
}

export async function run() {
  await main()
    .catch((e) => {
      console.error('❌ Relations seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 