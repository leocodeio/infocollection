export class SearchChannelsDto {
  keywords: string[];
  maxResults?: number = 50;
  order?:
    | 'relevance'
    | 'date'
    | 'rating'
    | 'title'
    | 'viewCount'
    | 'videoCount' = 'viewCount';
  channelType?: 'any' | 'show' = 'any';
  regionCode?: string;
  relevanceLanguage?: string;
  minSubscribers?: number = 1000;
  maxSubscribers?: number;
  minVideoCount?: number;
  maxVideoCount?: number;
  minViewCount?: number;
  maxViewCount?: number;
  country?: string;
  hasContactInfo?: boolean = false;
  publishedAfter?: string;
  publishedBefore?: string;
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
