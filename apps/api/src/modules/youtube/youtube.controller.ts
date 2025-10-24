import { Controller, Get, Query, Logger } from '@nestjs/common';
import { YoutubeService } from './youtube.service';
import { SearchChannelsDto } from './dto/search-channels.dto';
import type {
  SearchChannelsResponse,
  WorkflowResponse,
} from './dto/search-channels.dto';
import { readFileSync } from 'fs';

@Controller('youtube')
export class YoutubeController {
  private readonly logger = new Logger(YoutubeController.name);

  constructor(private readonly youtubeService: YoutubeService) {}

  @Get('search')
  async searchChannels(
    @Query() query: Record<string, string>,
  ): Promise<SearchChannelsResponse> {
    this.logger.log('Received search request:', query);

    const searchDto = new SearchChannelsDto();

    searchDto.keywords = query.keywords
      ? query.keywords.split(',').map((k) => k.trim())
      : [];

    if (query.maxResults) {
      searchDto.maxResults = parseInt(query.maxResults, 10);
    }

    if (query.order) {
      searchDto.order = query.order as SearchChannelsDto['order'];
    }

    if (query.channelType) {
      searchDto.channelType =
        query.channelType as SearchChannelsDto['channelType'];
    }

    if (query.regionCode) {
      searchDto.regionCode = query.regionCode;
    }

    if (query.relevanceLanguage) {
      searchDto.relevanceLanguage = query.relevanceLanguage;
    }

    if (query.minSubscribers) {
      searchDto.minSubscribers = parseInt(query.minSubscribers, 10);
    }

    if (query.maxSubscribers) {
      searchDto.maxSubscribers = parseInt(query.maxSubscribers, 10);
    }

    if (query.minVideoCount) {
      searchDto.minVideoCount = parseInt(query.minVideoCount, 10);
    }

    if (query.maxVideoCount) {
      searchDto.maxVideoCount = parseInt(query.maxVideoCount, 10);
    }

    if (query.minViewCount) {
      searchDto.minViewCount = parseInt(query.minViewCount, 10);
    }

    if (query.maxViewCount) {
      searchDto.maxViewCount = parseInt(query.maxViewCount, 10);
    }

    if (query.country) {
      searchDto.country = query.country;
    }

    if (query.hasContactInfo !== undefined) {
      searchDto.hasContactInfo = query.hasContactInfo === 'true';
    }

    if (query.publishedAfter) {
      searchDto.publishedAfter = query.publishedAfter;
    }

    if (query.publishedBefore) {
      searchDto.publishedBefore = query.publishedBefore;
    }

    const results = await this.youtubeService.searchChannels(searchDto);

    return {
      success: true,
      count: results.length,
      filters: searchDto,
      data: results,
    };
  }

  @Get('workflow')
  getWorkflow(): WorkflowResponse {
    const workflow = JSON.parse(
      readFileSync('./youtube.workflow.json', 'utf8'),
    ) as Record<string, unknown>;
    return {
      success: true,
      workflow,
      description:
        'n8n workflow for YouTube channel search with advanced filters',
    };
  }
}
