import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchChannelsDto {
  @ApiProperty({
    description: 'Search keywords to find YouTube channels',
    type: [String],
    example: ['technology', 'programming'],
  })
  keywords: string[];

  @ApiPropertyOptional({
    description: 'Maximum number of results to return',
    type: Number,
    default: 50,
    minimum: 1,
    maximum: 50,
    example: 25,
  })
  maxResults?: number = 50;

  @ApiPropertyOptional({
    description: 'Sort order for search results',
    enum: ['relevance', 'date', 'rating', 'title', 'viewCount', 'videoCount'],
    default: 'viewCount',
    example: 'viewCount',
  })
  order?:
    | 'relevance'
    | 'date'
    | 'rating'
    | 'title'
    | 'viewCount'
    | 'videoCount' = 'viewCount';

  @ApiPropertyOptional({
    description: 'Type of channel to search for',
    enum: ['any', 'show'],
    default: 'any',
    example: 'any',
  })
  channelType?: 'any' | 'show' = 'any';

  @ApiPropertyOptional({
    description: 'Region code for regional results (ISO 3166-1 alpha-2)',
    type: String,
    example: 'US',
  })
  regionCode?: string;

  @ApiPropertyOptional({
    description: 'Language for relevance (ISO 639-1)',
    type: String,
    example: 'en',
  })
  relevanceLanguage?: string;

  @ApiPropertyOptional({
    description: 'Minimum subscriber count filter',
    type: Number,
    default: 1000,
    minimum: 0,
    example: 10000,
  })
  minSubscribers?: number = 1000;

  @ApiPropertyOptional({
    description: 'Maximum subscriber count filter',
    type: Number,
    minimum: 0,
    example: 1000000,
  })
  maxSubscribers?: number;

  @ApiPropertyOptional({
    description: 'Minimum video count filter',
    type: Number,
    minimum: 0,
    example: 100,
  })
  minVideoCount?: number;

  @ApiPropertyOptional({
    description: 'Maximum video count filter',
    type: Number,
    minimum: 0,
    example: 5000,
  })
  maxVideoCount?: number;

  @ApiPropertyOptional({
    description: 'Minimum total view count filter',
    type: Number,
    minimum: 0,
    example: 100000,
  })
  minViewCount?: number;

  @ApiPropertyOptional({
    description: 'Maximum total view count filter',
    type: Number,
    minimum: 0,
    example: 1000000000,
  })
  maxViewCount?: number;

  @ApiPropertyOptional({
    description: 'Country filter (ISO 3166-1 alpha-2)',
    type: String,
    example: 'US',
  })
  country?: string;

  @ApiPropertyOptional({
    description: 'Filter channels with contact information',
    type: Boolean,
    default: false,
    example: false,
  })
  hasContactInfo?: boolean = false;

  @ApiPropertyOptional({
    description: 'Published after date (RFC 3339 format)',
    type: String,
    format: 'date-time',
    example: '2023-01-01T00:00:00Z',
  })
  publishedAfter?: string;

  @ApiPropertyOptional({
    description: 'Published before date (RFC 3339 format)',
    type: String,
    format: 'date-time',
    example: '2024-01-01T00:00:00Z',
  })
  publishedBefore?: string;
}

export class ChannelSearchResultDto {
  @ApiProperty({
    description: 'Unique YouTube channel ID',
    example: 'UCddiUEpYJcSLw1woTm1R_jw',
  })
  channelId: string;

  @ApiProperty({ description: 'Channel title', example: 'Example Channel' })
  channelTitle: string;

  @ApiProperty({
    description: 'Custom channel URL',
    example: 'example-channel',
  })
  customUrl: string;

  @ApiProperty({
    description: 'YouTube channel URL',
    example: 'https://www.youtube.com/@example-channel',
  })
  youtubeUrl: string;

  @ApiProperty({ description: 'Channel description' })
  description: string;

  @ApiProperty({
    description: 'Channel email addresses',
    type: [String],
    example: ['contact@example.com'],
  })
  emails: string[];

  @ApiProperty({
    description: 'Official websites',
    type: [String],
    example: ['https://example.com'],
  })
  websites: string[];

  @ApiPropertyOptional({ description: 'Instagram handle', example: '@example' })
  instagram: string | null;

  @ApiPropertyOptional({ description: 'Twitter handle', example: '@example' })
  twitter: string | null;

  @ApiPropertyOptional({ description: 'TikTok handle', example: '@example' })
  tiktok: string | null;

  @ApiProperty({
    description: 'Subscriber count',
    type: Number,
    example: 100000,
  })
  subscriberCount: number;

  @ApiProperty({
    description: 'Total number of videos',
    type: Number,
    example: 500,
  })
  videoCount: number;

  @ApiProperty({
    description: 'Total view count',
    type: Number,
    example: 5000000,
  })
  viewCount: number;

  @ApiProperty({
    description: 'Average views per video',
    type: Number,
    example: 10000,
  })
  avgViewsPerVideo: number;

  @ApiProperty({ description: 'Channel country', example: 'US' })
  country: string;

  @ApiProperty({
    description: 'Channel keywords',
    type: [String],
    example: ['tech', 'tutorial'],
  })
  keywords: string[];

  @ApiProperty({
    description: 'Channel published date',
    type: String,
    format: 'date-time',
  })
  publishedAt: string;

  @ApiProperty({
    description: 'Data extraction timestamp',
    type: String,
    format: 'date-time',
  })
  extractedAt: string;

  @ApiProperty({
    description: 'Channel thumbnails',
    type: 'object',
    properties: {
      default: { type: 'string' },
      medium: { type: 'string' },
      high: { type: 'string' },
    },
  })
  thumbnails: {
    default?: string;
    medium?: string;
    high?: string;
  };
}

export class SearchChannelsResponseDto {
  @ApiProperty({ description: 'Response success status', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Number of results returned',
    type: Number,
    example: 10,
  })
  count: number;

  @ApiProperty({ description: 'Applied search filters' })
  filters: SearchChannelsDto;

  @ApiProperty({
    description: 'Search results',
    type: [ChannelSearchResultDto],
  })
  data: ChannelSearchResultDto[];
}

export class WorkflowResponseDto {
  @ApiProperty({ description: 'Response success status', example: true })
  success: boolean;

  @ApiProperty({ description: 'n8n workflow configuration' })
  workflow: Record<string, unknown>;

  @ApiProperty({
    description: 'Workflow description',
    example: 'n8n workflow for YouTube channel search with advanced filters',
  })
  description: string;
}

export interface ChannelSearchResult {
  channelId: string;
  channelTitle: string;
  customUrl: string;
  youtubeUrl: string;
  description: string;
  emails: string[];
  websites: string[];
  instagram: string | null;
  twitter: string | null;
  tiktok: string | null;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  avgViewsPerVideo: number;
  country: string;
  keywords: string[];
  publishedAt: string;
  extractedAt: string;
  thumbnails: {
    default?: string;
    medium?: string;
    high?: string;
  };
}

export interface YoutubeSearchResponse {
  kind: string;
  etag: string;
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: YoutubeSearchItem[];
}

export interface YoutubeSearchItem {
  kind: string;
  etag: string;
  id?: {
    kind: string;
    channelId?: string;
  };
  snippet?: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: YoutubeThumbnails;
    channelTitle: string;
  };
}

export interface YoutubeChannelResponse {
  kind: string;
  etag: string;
  items: YoutubeChannelItem[];
}

export interface YoutubeChannelItem {
  kind: string;
  etag: string;
  id: string;
  snippet: {
    title: string;
    description: string;
    customUrl?: string;
    publishedAt: string;
    thumbnails: YoutubeThumbnails;
    country?: string;
  };
  statistics: {
    viewCount: string;
    subscriberCount: string;
    hiddenSubscriberCount: boolean;
    videoCount: string;
  };
  brandingSettings?: {
    channel?: {
      title?: string;
      description?: string;
      keywords?: string;
      country?: string;
    };
  };
  topicDetails?: {
    topicCategories?: string[];
  };
}

export interface YoutubeThumbnails {
  default?: {
    url: string;
    width?: number;
    height?: number;
  };
  medium?: {
    url: string;
    width?: number;
    height?: number;
  };
  high?: {
    url: string;
    width?: number;
    height?: number;
  };
}

export interface SearchChannelsResponse {
  success: boolean;
  count: number;
  filters: SearchChannelsDto;
  data: ChannelSearchResult[];
}

export interface WorkflowResponse {
  success: boolean;
  workflow: Record<string, unknown>;
  description: string;
}
