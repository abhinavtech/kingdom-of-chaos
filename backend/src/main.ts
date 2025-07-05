import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://192.168.178.81:3000', // Allow network IP access
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3000$/, // Allow any local network IP
    ],
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // API prefix
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`🚀 Kingdom of Chaos Backend running on port ${port}`);
  console.log(`📊 Database: ${process.env.DB_DATABASE || 'kingdom_of_chaos'}`);
}

bootstrap(); 