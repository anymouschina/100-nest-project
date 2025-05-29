import { run as configSeed } from './seeds/config.seed';
import { run as deptSeed } from './seeds/dept.seed';
import { run as dictTypeSeed } from './seeds/dict-type.seed';
import { run as dictDataSeed } from './seeds/dict-data.seed';
import { run as jobSeed } from './seeds/job.seed';
import { run as jobLogSeed } from './seeds/job-log.seed';
import { run as loginInforSeed } from './seeds/login-infor.seed';
import { run as menuSeed } from './seeds/menu.seed';
import { run as noticeSeed } from './seeds/notice.seed';
import { run as operLogSeed } from './seeds/oper-log.seed';
import { run as postSeed } from './seeds/post.seed';
import { run as roleSeed } from './seeds/role.seed';
import { run as tableSeed } from './seeds/table.seed';
import { run as userSeed } from './seeds/user.seed';
import { run as webSeed } from './seeds/web.seed';
import { run as relationSeed } from './seeds/relation.seed';

async function main() {
  console.log('🌱 Starting database seeding...');
  
  // Seed base tables first
  await configSeed();
  await deptSeed();
  await dictTypeSeed();
  await dictDataSeed();
  await jobSeed();
  await jobLogSeed();
  await loginInforSeed();
  await menuSeed();
  await noticeSeed();
  await operLogSeed();
  await postSeed();
  await roleSeed();
  await tableSeed();
  await userSeed();
  await webSeed();
  
  // Seed relations last
  await relationSeed();
  
  console.log('✅ Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Database seeding failed:', e);
    process.exit(1);
  }); 