import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { BootstrapConfig } from './api_utils/bootstrap.config';
import { INestApplication } from '@nestjs/common';
import express, { Request, Response } from 'express';

// Cached NestJS app instance for serverless
let cachedApp: INestApplication | null = null;

async function createApp(
  expressInstance?: express.Express,
): Promise<INestApplication> {
  const app = expressInstance
    ? await NestFactory.create(AppModule, new ExpressAdapter(expressInstance), {
        bodyParser: false,
      })
    : await NestFactory.create(AppModule, { bodyParser: false });

  const configService = app.get(ConfigService);
  const bootstrapConfig = new BootstrapConfig(configService);

  bootstrapConfig.setupHelmet(app);
  bootstrapConfig.setupCors(app);
  bootstrapConfig.setupSwagger(app);

  await app.init();

  return app;
}

// Traditional server bootstrap for local/non-serverless deployments
async function bootstrap() {
  const app = await createApp();

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') || 3000;
  const nodeEnv = configService.get<string>('NODE_ENV');

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

// Serverless handler for Vercel
const expressApp = express();

async function getApp(): Promise<INestApplication> {
  if (!cachedApp) {
    cachedApp = await createApp(expressApp);
  }
  return cachedApp;
}

// Export handler for Vercel serverless
export default async function handler(req: Request, res: Response) {
  await getApp();
  return expressApp(req, res);
}

// Start server if not in serverless environment
if (require.main === module || !process.env.VERCEL) {
  void bootstrap();
}
