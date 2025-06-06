import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import Config from 'src/config';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 创建微服务
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
      password: process.env.REDIS_PASSWORD || '123456',
    },
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

  app.useGlobalPipes(new ValidationPipe());
  
  // Apply global interceptor to wrap all responses in a data property
  app.useGlobalInterceptors(new TransformInterceptor());
  
  // Apply global exception filter for consistent error responses
  app.useGlobalFilters(new HttpExceptionFilter());

  // 启动微服务
  await app.startAllMicroservices();
  console.log(`Microservice is running on Redis at ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`);

  // 启动HTTP服务
  await app.listen(Config.PORT);
  console.log(`HTTP server is running on port ${Config.PORT}`);
}
bootstrap();
