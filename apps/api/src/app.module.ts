import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { YoutubeModule } from './modules/youtube/youtube.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), YoutubeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
