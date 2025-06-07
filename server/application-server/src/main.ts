import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import Config from 'src/config';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  // 创建全局日志实例
  const logger = new Logger('Application');
  
  // 设置日志级别
  process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'debug';
  
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    
    // 创建微服务
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.REDIS,
      options: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
        password: process.env.REDIS_PASSWORD || '123456',
      },
    });
  
    // 配置静态资源服务
    const uploadsPath = path.join(process.cwd(), 'uploads');
    app.useStaticAssets(uploadsPath, {
      prefix: '/uploads/',
    });
  
    const options = new DocumentBuilder()
      .setTitle('OMS API')
      .setDescription('Order Management System API')
      .setVersion('1.0')
      .addServer(`http://localhost:${Config.PORT}`, 'Local environment')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      }, 'JWT-auth')
      .build();
  
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('api-docs', app, document);
  
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));
    
    // Apply global interceptor to wrap all responses in a data property
    app.useGlobalInterceptors(new TransformInterceptor());
    
    // Apply global exception filter for consistent error responses
    app.useGlobalFilters(new HttpExceptionFilter());
  
    // 启动微服务
    await app.startAllMicroservices();
    logger.log(`Microservice is running on Redis at ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);
  
    // 启动HTTP服务
    await app.listen(Config.PORT);
    logger.log(`HTTP server is running on port ${Config.PORT}`);
    logger.log(`Swagger documentation is available at http://localhost:${Config.PORT}/api-docs`);
  } catch (error) {
    logger.error(`Failed to start application: ${error.message}`, error.stack);
    process.exit(1);
  }
}
bootstrap();
