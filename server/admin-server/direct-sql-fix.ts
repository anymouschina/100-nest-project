import { run } from './prisma/seeds/direct-sql-fix';

run()
  .catch((e) => {
    console.error('❌ 序列修复失败:', e);
    process.exit(1);
  }); 