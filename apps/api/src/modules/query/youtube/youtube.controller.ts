import { Controller, Get, Query, Logger, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiOkResponse,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards';
import { CurrentUser } from '../../auth/decorators';
import type { RequestUser } from '../../auth/types/auth.types';
import { YoutubeService } from './youtube.service';
import { SearchChannelsDto } from './dto/search-channels.dto';
import type {
  SearchChannelsResponse,
  WorkflowResponse,
} from './dto/search-channels.dto';
import {
  SearchChannelsResponseDto,
  WorkflowResponseDto,
} from './dto/search-channels.dto';
import { YOUTUBE_WORKFLOW } from './youtube.workflow';

@ApiTags('youtube')
@ApiBearerAuth('Authorization')
@UseGuards(JwtAuthGuard)
@Controller('youtube')
export class YoutubeController {
  private readonly logger = new Logger(YoutubeController.name);

  constructor(private readonly youtubeService: YoutubeService) {}

  @Get('search')
  @ApiOperation({
    summary: 'Search YouTube channels',
    description:
      'Search for YouTube channels with advanced filtering options including subscriber count, view count, video count, and more.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({
    name: 'keywords',
    type: String,
    required: true,
    description: 'Search keywords (comma-separated)',
    example: 'technology,programming',
  })
  @ApiQuery({
    name: 'maxResults',
    type: Number,
    required: false,
    description: 'Maximum number of results',
    example: 25,
  })
  @ApiQuery({
    name: 'order',
    enum: ['relevance', 'date', 'rating', 'title', 'viewCount', 'videoCount'],
    required: false,
    description: 'Sort order for results',
  })
  @ApiQuery({
    name: 'minSubscribers',
    type: Number,
    required: false,
    description: 'Minimum subscriber count',
  })
  @ApiQuery({
    name: 'maxSubscribers',
    type: Number,
    required: false,
    description: 'Maximum subscriber count',
  })
  @ApiQuery({
    name: 'minVideoCount',
    type: Number,
    required: false,
    description: 'Minimum video count',
  })
  @ApiQuery({
    name: 'maxVideoCount',
    type: Number,
    required: false,
    description: 'Maximum video count',
  })
  @ApiQuery({
    name: 'regionCode',
    type: String,
    required: false,
    description: 'Region code (ISO 3166-1 alpha-2)',
    example: 'US',
  })
  @ApiQuery({
    name: 'country',
    type: String,
    required: false,
    description: 'Country filter',
    example: 'US',
  })
  @ApiOkResponse({
    description: 'Successful channel search',
    type: SearchChannelsResponseDto,
  })
  async searchChannels(
    @CurrentUser() user: RequestUser,
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
  @ApiOperation({
    summary: 'Get n8n workflow',
    description:
      'Retrieve the n8n workflow configuration for YouTube channel search',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiOkResponse({
    description: 'Workflow configuration retrieved successfully',
    type: WorkflowResponseDto,
  })
  getWorkflow(@CurrentUser() user: RequestUser): WorkflowResponse {
    // User required for authentication
    void user;
    return {
      success: true,
      workflow: YOUTUBE_WORKFLOW,
      description:
        'n8n workflow for YouTube channel search with advanced filters',
    };
  }
}
