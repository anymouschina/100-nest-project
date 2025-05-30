import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import Config from 'src/config';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const options = new DocumentBuilder()
    .setTitle('OMS API')
    .setDescription('Order Management System API')
    .setVersion('1.0')
    .addServer('http://localhost:3000', 'Local environment')
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

  await app.listen(Config.PORT);
}
bootstrap();
