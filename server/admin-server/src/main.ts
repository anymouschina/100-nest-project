/*
 * @Author: jiang.sheng 87789771@qq.com
 * @Date: 2024-04-20 17:42:55
 * @LastEditors: jiang.sheng 87789771@qq.com
 * @LastEditTime: 2024-05-19 01:36:57
 * @FilePath: /meimei-admin/src/main.ts
 * @Description: 主入口
 *
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  /* 设置后，如果服务经过代理 req.ips 将是一个[]。可以获得真实ip  */
  app.set('trust proxy', true);

  /* 读取环境变量里是否允许跨域 */
  const cors = configService.get('cors');
  if (cors) {
    app.enableCors();
  }

  /* 设置 HTTP 标头来帮助保护应用免受一些众所周知的 Web 漏洞的影响 */
  app.use(
    helmet({
      contentSecurityPolicy: false, //取消https强制转换
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // 允许跨域访问资源
    }),
  );

  /* 设置静态资源目录 */
  app.useStaticAssets(join(__dirname, '../static'), {
    setHeaders: (res) => {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET');
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });

  /* 读取配置文件是否有配置的上传文件目录，也设置为静态资源目录,方便前端加载 */
  const uploadPath = configService.get('uploadPath');
  if (uploadPath) {
    app.useStaticAssets(uploadPath, {
      setHeaders: (res) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      },
    });
  }

  /* 创建微服务 */
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      host: configService.get('REDIS_HOST') || 'localhost',
      port: configService.get('REDIS_PORT') ? parseInt(configService.get('REDIS_PORT')) : 6379,
      password: configService.get('REDIS_PASSWORD') || '123456',
      retryAttempts: 2, // 最大重试次数
      retryDelay: 1000, // 重试间隔（毫秒）
    },
  });
  
  /* 启动微服务 */
  await app.startAllMicroservices();
  console.log(`Admin microservice is running on Redis at ${configService.get('REDIS_HOST') || 'localhost'}:${configService.get('REDIS_PORT') || 6379}`);

  /* 读取环境变量里的项目启动端口 */
  const port = configService.get('port');
  await app.listen(port);
  console.log(`Admin server is running on port ${port}`);
}
bootstrap();
