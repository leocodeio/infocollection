import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SearchChannelsDto,
  ChannelSearchResult,
} from './dto/search-channels.dto';
import { WorkflowExecutor } from '../../../utils/workflow.executor';

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private readonly youtubeApiKey: string;
  private readonly workflowExecutor: WorkflowExecutor;

  constructor(private readonly configService: ConfigService) {
    this.youtubeApiKey =
      this.configService.get<string>('YOUTUBE_API_KEY') ?? '';
    this.workflowExecutor = new WorkflowExecutor();
  }

  async searchChannels(
    searchDto: SearchChannelsDto,
  ): Promise<ChannelSearchResult[]> {
    this.logger.log('Searching channels via workflow executor', {
      keywords: searchDto.keywords,
    });

    try {
      const results = await this.workflowExecutor.execute(
        searchDto,
        this.youtubeApiKey,
      );

      this.logger.log(`Found ${results.length} channels from workflow`);
      return results;
    } catch (error) {
      this.logger.error('Error executing workflow:', error);
      throw new Error(
        `Failed to search channels: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
