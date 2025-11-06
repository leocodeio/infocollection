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
    const appBaseUrl = this.configService.get<string>('APP_BASE_URL');

    // Support multiple origins for development
    const allowedOrigins = [
      corsOrigin,
      appBaseUrl,
      'http://localhost:5173',
      'http://localhost:3001',
    ].filter(Boolean);

    const corsOptions = {
      origin: (
        origin: string,
        callback: (err: Error | null, allow?: boolean) => void,
      ) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
      ],
      exposedHeaders: ['Set-Cookie'],
      maxAge: 86400, // 24 hours
    };
    app.enableCors(corsOptions);
  };
}
