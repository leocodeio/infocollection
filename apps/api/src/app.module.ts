import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { YoutubeModule } from './modules/youtube/youtube.module';
import Joi from 'joi';

@Module({
  imports: [
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
        BASE_URL: Joi.string().required(),

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
      }),
    }),
    YoutubeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
