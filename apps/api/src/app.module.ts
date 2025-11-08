import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QueryModule } from './modules/query/query.module';
import Joi from 'joi';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Custom auth
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/users/user.module';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
      // Load environment variables - update with the path to your .env file
      envFilePath: ['.env.local', '.env'],
      // Add social media configuration variables
      validationSchema: Joi.object({
        // Needs
        PORT: Joi.number().required(),
        APP_NAME: Joi.string().required(),
        NODE_ENV: Joi.string().required(),
        API_BASE_URL: Joi.string().required(),
        APP_BASE_URL: Joi.string().required(),

        // Database
        DATABASE_URL: Joi.string().required(),
        DIRECT_URL: Joi.string().required(),

        // Youtube
        YOUTUBE_API_KEY: Joi.string().required(),

        // Swagger
        SWAGGER_ROUTE: Joi.string().required(),
        SWAGGER_PASSWORD: Joi.string().required(),

        // Cors
        CORS_ORIGIN: Joi.string().optional().default('*'),

        // Custom auth
        JWT_SECRET: Joi.string().required(),
        GOOGLE_CLIENT_ID: Joi.string().optional(),
        GOOGLE_CLIENT_SECRET: Joi.string().optional(),
      }),
    }),
    // Global rate limiter - 150 requests per minute for most endpoints
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute in milliseconds
        limit: 150, // 150 requests per minute
      },
    ]),
    QueryModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
