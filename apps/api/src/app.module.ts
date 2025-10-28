import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QueryModule } from './modules/query/query.module';
import Joi from 'joi';

// Better auth
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './modules/better-auth/auth';
import { UserModule } from './modules/better-auth/user/user.module';

@Module({
  imports: [
    AuthModule.forRoot({ auth }),
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

        // better auth
        BETTER_AUTH_SECRET: Joi.string().required().default('sosec'),
        BETTER_AUTH_GOOGLE_ID: Joi.string().required().default('sosec'),
        BETTER_AUTH_GOOGLE_SECRET: Joi.string().required().default('sosec'),
      }),
    }),
    QueryModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
