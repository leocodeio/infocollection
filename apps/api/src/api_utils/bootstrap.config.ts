import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import basicAuth from 'express-basic-auth';

export class BootstrapConfig {
  constructor(private readonly configService: ConfigService) {}

  setupSwagger = (app: INestApplication) => {
    const swaggerRoute =
      this.configService.get<string>('SWAGGER_ROUTE') ?? '/api';
    const swaggerPassword =
      this.configService.get<string>('SWAGGER_PASSWORD') ?? 'admin';

    app.use(
      [swaggerRoute],
      basicAuth({
        challenge: true,
        users: {
          admin: swaggerPassword,
        },
      }),
    );

    const appName =
      this.configService.get<string>('APP_NAME') ?? 'Default App Name';
    const config = new DocumentBuilder()
      .setTitle(appName)
      .setDescription(`API for managing ${appName}s`)
      .setVersion('1.0')
      .addApiKey(
        {
          type: 'apiKey',
          name: 'x-api-key',
          in: 'header',
          description: 'API key for authentication',
        },
        'x-api-key',
      )
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Enter your Bearer token',
          in: 'header',
        },
        'Authorization',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(swaggerRoute, app, document);
  };

  setupHelmet = (app: INestApplication) => {
    app.use(helmet());
    app.use(helmet.noSniff());
    app.use(helmet.frameguard({ action: 'deny' }));
    app.use(helmet.contentSecurityPolicy());
  };

  setupCors = (app: INestApplication) => {
    const corsOrigin =
      this.configService.get<string>('CORS_ORIGIN') ?? 'http://localhost:5173';
    const corsOptions = {
      origin: corsOrigin === '*' ? true : corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      exposedHeaders: ['Set-Cookie'],
    };
    app.enableCors(corsOptions);
  };
}
