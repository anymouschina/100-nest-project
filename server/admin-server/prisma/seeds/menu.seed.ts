import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📱 Seeding sys_menu...');
  
  // 由于菜单数据量较大且有父子关系，分批次插入
  // 首先插入顶级菜单
  await prisma.sysMenu.createMany({
    data: [
      { menuId: 1, menuName: '系统管理', parentId: null, orderNum: 1, path: 'system', component: null, query: null, isFrame: '1', isCache: '0', menuType: 'M', visible: '0', status: '0', perms: null, icon: 'system', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '系统管理目录' },
      { menuId: 2, menuName: '系统监控', parentId: null, orderNum: 2, path: 'monitor', component: null, query: null, isFrame: '1', isCache: '0', menuType: 'M', visible: '0', status: '0', perms: null, icon: 'monitor', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '系统监控目录' },
      { menuId: 3, menuName: '系统工具', parentId: null, orderNum: 3, path: 'tool', component: null, query: null, isFrame: '1', isCache: '0', menuType: 'M', visible: '0', status: '1', perms: null, icon: 'tool', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: 'admin', updateTime: new Date('2024-05-17T13:57:49Z'), remark: '系统工具目录' },
    ],
    skipDuplicates: true,
  });

  // 然后插入二级菜单
  await prisma.sysMenu.createMany({
    data: [
      { menuId: 100, menuName: '用户管理', parentId: 1, orderNum: 1, path: 'user', component: 'system/user/index', query: null, isFrame: '1', isCache: '0', menuType: 'C', visible: '0', status: '0', perms: 'system:user:list', icon: 'user', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '用户管理菜单' },
      { menuId: 101, menuName: '角色管理', parentId: 1, orderNum: 2, path: 'role', component: 'system/role/index', query: null, isFrame: '1', isCache: '0', menuType: 'C', visible: '0', status: '0', perms: 'system:role:list', icon: 'peoples', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '角色管理菜单' },
      { menuId: 102, menuName: '菜单管理', parentId: 1, orderNum: 3, path: 'menu', component: 'system/menu/index', query: null, isFrame: '1', isCache: '0', menuType: 'C', visible: '0', status: '0', perms: 'system:menu:list', icon: 'tree-table', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '菜单管理菜单' },
      { menuId: 103, menuName: '部门管理', parentId: 1, orderNum: 4, path: 'dept', component: 'system/dept/index', query: null, isFrame: '1', isCache: '0', menuType: 'C', visible: '0', status: '0', perms: 'system:dept:list', icon: 'tree', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '部门管理菜单' },
      { menuId: 104, menuName: '岗位管理', parentId: 1, orderNum: 5, path: 'post', component: 'system/post/index', query: null, isFrame: '1', isCache: '0', menuType: 'C', visible: '0', status: '0', perms: 'system:post:list', icon: 'post', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '岗位管理菜单' },
      { menuId: 105, menuName: '字典管理', parentId: 1, orderNum: 6, path: 'dict', component: 'system/dict/index', query: null, isFrame: '1', isCache: '0', menuType: 'C', visible: '0', status: '0', perms: 'system:dict:list', icon: 'dict', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '字典管理菜单' },
      { menuId: 106, menuName: '参数设置', parentId: 1, orderNum: 7, path: 'config', component: 'system/config/index', query: null, isFrame: '1', isCache: '0', menuType: 'C', visible: '0', status: '0', perms: 'system:config:list', icon: 'edit', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '参数设置菜单' },
      { menuId: 107, menuName: '通知公告', parentId: 1, orderNum: 8, path: 'notice', component: 'system/notice/index', query: null, isFrame: '1', isCache: '0', menuType: 'C', visible: '0', status: '0', perms: 'system:notice:list', icon: 'message', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '通知公告菜单' },
      { menuId: 108, menuName: '日志管理', parentId: 1, orderNum: 9, path: 'log', component: null, query: null, isFrame: '1', isCache: '0', menuType: 'M', visible: '0', status: '0', perms: null, icon: 'log', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '日志管理菜单' },
      
      { menuId: 109, menuName: '在线用户', parentId: 2, orderNum: 1, path: 'online', component: 'monitor/online/index', query: null, isFrame: '1', isCache: '0', menuType: 'C', visible: '0', status: '0', perms: 'monitor:online:list', icon: 'online', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '在线用户菜单' },
      { menuId: 110, menuName: '定时任务', parentId: 2, orderNum: 2, path: 'job', component: 'monitor/job/index', query: null, isFrame: '1', isCache: '0', menuType: 'C', visible: '0', status: '0', perms: 'monitor:job:list', icon: 'job', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '定时任务菜单' },
      { menuId: 112, menuName: '服务监控', parentId: 2, orderNum: 4, path: 'server', component: 'monitor/server/index', query: null, isFrame: '1', isCache: '0', menuType: 'C', visible: '0', status: '0', perms: 'monitor:server:list', icon: 'server', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '服务监控菜单' },
      { menuId: 113, menuName: '缓存监控', parentId: 2, orderNum: 5, path: 'cache', component: 'monitor/cache/index', query: null, isFrame: '1', isCache: '0', menuType: 'C', visible: '0', status: '0', perms: 'monitor:cache:list', icon: 'redis', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '缓存监控菜单' },
      { menuId: 114, menuName: '缓存列表', parentId: 2, orderNum: 6, path: 'cacheList', component: 'monitor/cache/list', query: null, isFrame: '1', isCache: '0', menuType: 'C', visible: '0', status: '0', perms: 'monitor:cache:list', icon: 'redis-list', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '缓存列表菜单' },
      
      { menuId: 115, menuName: '表单构建', parentId: 3, orderNum: 1, path: 'build', component: 'tool/build/index', query: null, isFrame: '1', isCache: '0', menuType: 'C', visible: '0', status: '1', perms: 'tool:build:list', icon: 'build', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: 'admin', updateTime: new Date('2024-05-17T13:57:27Z'), remark: '表单构建菜单' },
      { menuId: 116, menuName: '代码生成', parentId: 3, orderNum: 2, path: 'gen', component: 'tool/gen/index', query: null, isFrame: '1', isCache: '0', menuType: 'C', visible: '0', status: '1', perms: 'tool:gen:list', icon: 'code', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: 'admin', updateTime: new Date('2024-05-17T13:51:22Z'), remark: '代码生成菜单' },
      { menuId: 117, menuName: '系统接口', parentId: 3, orderNum: 3, path: 'swagger', component: 'tool/swagger/index', query: null, isFrame: '1', isCache: '0', menuType: 'C', visible: '0', status: '1', perms: 'tool:swagger:list', icon: 'swagger', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: 'admin', updateTime: new Date('2024-05-17T13:51:28Z'), remark: '系统接口菜单' },
      
      { menuId: 500, menuName: '操作日志', parentId: 108, orderNum: 1, path: 'operlog', component: 'monitor/operlog/index', query: null, isFrame: '1', isCache: '0', menuType: 'C', visible: '0', status: '0', perms: 'monitor:operlog:list', icon: 'form', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '操作日志菜单' },
      { menuId: 501, menuName: '登录日志', parentId: 108, orderNum: 2, path: 'logininfor', component: 'monitor/logininfor/index', query: null, isFrame: '1', isCache: '0', menuType: 'C', visible: '0', status: '0', perms: 'monitor:logininfor:list', icon: 'logininfor', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: '登录日志菜单' },
    ],
    skipDuplicates: true,
  });

  // 最后插入按钮权限菜单
  await prisma.sysMenu.createMany({
    data: [
      // 用户管理按钮
      { menuId: 1000, menuName: '用户查询', parentId: 100, orderNum: 1, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:user:query', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1001, menuName: '用户新增', parentId: 100, orderNum: 2, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:user:add', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1002, menuName: '用户修改', parentId: 100, orderNum: 3, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:user:edit', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1003, menuName: '用户删除', parentId: 100, orderNum: 4, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:user:remove', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1004, menuName: '用户导出', parentId: 100, orderNum: 5, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:user:export', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1005, menuName: '用户导入', parentId: 100, orderNum: 6, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:user:import', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1006, menuName: '重置密码', parentId: 100, orderNum: 7, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:user:resetPwd', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      
      // 角色管理按钮
      { menuId: 1007, menuName: '角色查询', parentId: 101, orderNum: 1, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:role:query', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1008, menuName: '角色新增', parentId: 101, orderNum: 2, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:role:add', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1009, menuName: '角色修改', parentId: 101, orderNum: 3, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:role:edit', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1010, menuName: '角色删除', parentId: 101, orderNum: 4, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:role:remove', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1011, menuName: '角色导出', parentId: 101, orderNum: 5, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:role:export', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      
      // 菜单管理按钮
      { menuId: 1012, menuName: '菜单查询', parentId: 102, orderNum: 1, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:menu:query', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1013, menuName: '菜单新增', parentId: 102, orderNum: 2, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:menu:add', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1014, menuName: '菜单修改', parentId: 102, orderNum: 3, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:menu:edit', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1015, menuName: '菜单删除', parentId: 102, orderNum: 4, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:menu:remove', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      
      // 部门管理按钮
      { menuId: 1016, menuName: '部门查询', parentId: 103, orderNum: 1, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:dept:query', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1017, menuName: '部门新增', parentId: 103, orderNum: 2, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:dept:add', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1018, menuName: '部门修改', parentId: 103, orderNum: 3, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:dept:edit', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1019, menuName: '部门删除', parentId: 103, orderNum: 4, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:dept:remove', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      
      // 岗位管理按钮
      { menuId: 1020, menuName: '岗位查询', parentId: 104, orderNum: 1, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:post:query', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1021, menuName: '岗位新增', parentId: 104, orderNum: 2, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:post:add', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1022, menuName: '岗位修改', parentId: 104, orderNum: 3, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:post:edit', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1023, menuName: '岗位删除', parentId: 104, orderNum: 4, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:post:remove', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1024, menuName: '岗位导出', parentId: 104, orderNum: 5, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:post:export', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      
      // 字典管理按钮
      { menuId: 1025, menuName: '字典查询', parentId: 105, orderNum: 1, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:dict:query', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1026, menuName: '字典新增', parentId: 105, orderNum: 2, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:dict:add', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1027, menuName: '字典修改', parentId: 105, orderNum: 3, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:dict:edit', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1028, menuName: '字典删除', parentId: 105, orderNum: 4, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:dict:remove', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1029, menuName: '字典导出', parentId: 105, orderNum: 5, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:dict:export', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      
      // 参数设置按钮
      { menuId: 1030, menuName: '参数查询', parentId: 106, orderNum: 1, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:config:query', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1031, menuName: '参数新增', parentId: 106, orderNum: 2, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:config:add', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1032, menuName: '参数修改', parentId: 106, orderNum: 3, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:config:edit', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1033, menuName: '参数删除', parentId: 106, orderNum: 4, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:config:remove', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1034, menuName: '参数导出', parentId: 106, orderNum: 5, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:config:export', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      
      // 通知公告按钮
      { menuId: 1035, menuName: '公告查询', parentId: 107, orderNum: 1, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:notice:query', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1036, menuName: '公告新增', parentId: 107, orderNum: 2, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:notice:add', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1037, menuName: '公告修改', parentId: 107, orderNum: 3, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:notice:edit', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1038, menuName: '公告删除', parentId: 107, orderNum: 4, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'system:notice:remove', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      
      // 日志相关按钮
      { menuId: 1039, menuName: '操作查询', parentId: 500, orderNum: 1, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'monitor:operlog:query', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1040, menuName: '操作删除', parentId: 500, orderNum: 2, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'monitor:operlog:remove', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1041, menuName: '日志导出', parentId: 500, orderNum: 3, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'monitor:operlog:export', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1042, menuName: '登录查询', parentId: 501, orderNum: 1, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'monitor:logininfor:query', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1043, menuName: '登录删除', parentId: 501, orderNum: 2, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'monitor:logininfor:remove', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1044, menuName: '日志导出', parentId: 501, orderNum: 3, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'monitor:logininfor:export', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1045, menuName: '在线查询', parentId: 109, orderNum: 1, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'monitor:online:query', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1046, menuName: '批量强退', parentId: 109, orderNum: 2, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'monitor:online:batchLogout', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1047, menuName: '单条强退', parentId: 109, orderNum: 3, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'monitor:online:forceLogout', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1048, menuName: '任务查询', parentId: 110, orderNum: 1, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'monitor:job:query', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      
      // 任务相关按钮
      { menuId: 1049, menuName: '任务查询', parentId: 110, orderNum: 1, path: '#', component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'monitor:job:query', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1050, menuName: '任务新增', parentId: 110, orderNum: 2, path: '#', component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'monitor:job:add', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1051, menuName: '任务修改', parentId: 110, orderNum: 3, path: '#', component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'monitor:job:edit', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1052, menuName: '任务删除', parentId: 110, orderNum: 4, path: '#', component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'monitor:job:remove', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1053, menuName: '状态修改', parentId: 110, orderNum: 5, path: '#', component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'monitor:job:changeStatus', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1054, menuName: '任务导出', parentId: 110, orderNum: 6, path: '#', component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'monitor:job:export', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      
      // 服务监控按钮
      { menuId: 1055, menuName: '服务查询', parentId: 112, orderNum: 1, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'monitor:server:query', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      
      // 缓存监控按钮
      { menuId: 1056, menuName: '缓存查询', parentId: 113, orderNum: 1, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'monitor:cache:query', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
      { menuId: 1057, menuName: '缓存列表查询', parentId: 114, orderNum: 1, path: null, component: null, query: null, isFrame: '1', isCache: '0', menuType: 'F', visible: '0', status: '0', perms: 'monitor:cache:list', icon: '#', createBy: 'admin', createTime: new Date('2024-04-18T16:07:17Z'), updateBy: '', updateTime: null, remark: null },
    ],
    skipDuplicates: true,
  });
  
  console.log('✅ sys_menu seeded successfully');
}

export async function run() {
  await main()
    .catch((e) => {
      console.error('❌ sys_menu seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 