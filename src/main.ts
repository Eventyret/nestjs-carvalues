import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
const cookieSession = require('cookie-session');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    cookieSession({
      keys: ['carValues'],
    }),
  );
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.use;
  await app.listen(3000);
}
bootstrap();
