import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { QueryController } from './query.controller';
import { QueryService } from './query.service';
import { YoutubeModule } from './youtube/youtube.module';

@Module({
  imports: [
    YoutubeModule,
    CacheModule.register({
      ttl: 300000, // 5 minutes in milliseconds
      max: 100, // maximum number of items in cache
    }),
  ],
  controllers: [QueryController],
  providers: [QueryService],
  exports: [QueryService],
})
export class QueryModule {}
