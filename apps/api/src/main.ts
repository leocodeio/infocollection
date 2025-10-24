import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  const nodeEnv = configService.get<string>('NODE_ENV');

  await app.listen(port).then(() => {
    if (nodeEnv === 'development') {
      console.log(`server running at http://localhost:${port}`);
    } else {
      console.log(`server running at ${configService.get<string>('BASE_URL')}`);
    }
  });
}
bootstrap();
