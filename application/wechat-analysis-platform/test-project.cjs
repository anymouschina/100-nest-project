#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 微信分析平台项目完整性检查');
console.log('================================');

// 检查必要的文件
const requiredFiles = [
  'package.json',
  'src/main.tsx',
  'src/App.tsx',
  'src/index.css',
  'src/components/layout/MainLayout.tsx',
  'src/pages/Dashboard/index.tsx',
  'src/pages/TrendingTopics.tsx',
  'src/pages/ActivityStats.tsx',
  'src/pages/History.tsx',
  'src/pages/Settings.tsx',
  'src/services/api.ts',
  'src/types/api.ts',
  'postcss.config.js',
  'tailwind.config.js',
  'vite.config.ts',
];

let allFilesExist = true;

console.log('\n📁 检查必要文件:');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

// 检查package.json中的依赖
console.log('\n📦 检查关键依赖:');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = [
  'react',
  'react-dom',
  'antd',
  '@ant-design/icons',
  'react-router-dom',
  '@tanstack/react-query',
  'axios',
  'dayjs',
  'zustand',
  'recharts',
];

const requiredDevDeps = [
  'typescript',
  'vite',
  '@vitejs/plugin-react',
  'tailwindcss',
  '@tailwindcss/postcss',
];

requiredDeps.forEach(dep => {
  const exists = packageJson.dependencies && packageJson.dependencies[dep];
  console.log(`${exists ? '✅' : '❌'} ${dep} ${exists ? `(${exists})` : '(缺失)'}`);
  if (!exists) allFilesExist = false;
});

requiredDevDeps.forEach(dep => {
  const exists = packageJson.devDependencies && packageJson.devDependencies[dep];
  console.log(`${exists ? '✅' : '❌'} ${dep} ${exists ? `(${exists})` : '(缺失)'}`);
  if (!exists) allFilesExist = false;
});

// 检查脚本命令
console.log('\n🔧 检查npm脚本:');
const requiredScripts = ['dev', 'build', 'preview'];
requiredScripts.forEach(script => {
  const exists = packageJson.scripts && packageJson.scripts[script];
  console.log(`${exists ? '✅' : '❌'} ${script}: ${exists || '(缺失)'}`);
  if (!exists) allFilesExist = false;
});

console.log('\n================================');
if (allFilesExist) {
  console.log('🎉 项目检查完成！所有必要文件和依赖都已就绪。');
  console.log('\n🚀 启动项目:');
  console.log('   pnpm install  # 安装依赖');
  console.log('   pnpm dev      # 启动开发服务器');
  console.log('\n🌐 访问地址: http://localhost:5173');
} else {
  console.log('❌ 项目检查发现问题，请修复上述缺失的文件或依赖。');
  process.exit(1);
}

console.log('\n📋 功能模块:');
console.log('   📊 仪表板 - 数据概览和实时统计');
console.log('   🔍 群聊分析 - 单群聊深度分析');
console.log('   📦 批量分析 - 多群聊批量处理');
console.log('   ⚖️ 群聊对比 - 多群聊对比分析');
console.log('   🔥 热门话题 - 话题趋势分析');
console.log('   📈 活跃度统计 - 用户活跃度分析');
console.log('   📝 历史记录 - 分析历史管理');
console.log('   ⚙️ 设置中心 - 系统配置管理'); 