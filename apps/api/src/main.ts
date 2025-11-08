import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { BootstrapConfig } from './api_utils/bootstrap.config';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  const nodeEnv = configService.get<string>('NODE_ENV');

  const bootstrapConfig = new BootstrapConfig(configService);

  // Enable cookie parser BEFORE other middleware
  app.use(cookieParser());

  bootstrapConfig.setupHelmet(app);
  bootstrapConfig.setupCors(app);
  bootstrapConfig.setupSwagger(app);

  await app.listen(port).then(() => {
    if (nodeEnv === 'development') {
      console.log(`server running at http://localhost:${port}`);
    } else {
      console.log(
        `server running at ${configService.get<string>('API_BASE_URL')}`,
      );
    }
  });
}

void bootstrap();
