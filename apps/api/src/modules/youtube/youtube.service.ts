import { Injectable, Logger } from '@nestjs/common';
import {
  SearchChannelsDto,
  ChannelSearchResult,
  YoutubeSearchResponse,
  YoutubeChannelResponse,
  YoutubeChannelItem,
} from './dto/search-channels.dto';
import { YOUTUBE_CONFIG } from './youtube.config';

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);

  async searchChannels(
    searchDto: SearchChannelsDto,
  ): Promise<ChannelSearchResult[]> {
    const results: ChannelSearchResult[] = [];

    for (const keyword of searchDto.keywords) {
      this.logger.log(`Searching for keyword: ${keyword}`);
      const channelResults = await this.searchByKeyword(keyword, searchDto);
      results.push(...channelResults);
    }

    return this.removeDuplicates(results);
  }

  private async searchByKeyword(
    keyword: string,
    searchDto: SearchChannelsDto,
  ): Promise<ChannelSearchResult[]> {
    const searchUrl = this.buildSearchUrl(keyword, searchDto);

    try {
      const response = await fetch(searchUrl);
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.statusText}`);
      }

      const searchData: YoutubeSearchResponse = await response.json();

      if (!searchData.items || searchData.items.length === 0) {
        this.logger.warn(`No results found for keyword: ${keyword}`);
        return [];
      }

      const channelIds = searchData.items
        .map((item) => item.id?.channelId)
        .filter((id): id is string => Boolean(id));

      if (channelIds.length === 0) {
        return [];
      }

      const channelDetails = await this.getChannelDetails(channelIds);

      return this.processChannelDetails(channelDetails, searchDto);
    } catch (error) {
      this.logger.error(`Error searching for keyword ${keyword}:`, error);
      return [];
    }
  }

  private buildSearchUrl(
    keyword: string,
    searchDto: SearchChannelsDto,
  ): string {
    const params = new URLSearchParams({
      key: YOUTUBE_CONFIG.apiKey,
      part: 'snippet',
      type: 'channel',
      q: keyword,
      maxResults: String(
        Math.min(
          searchDto.maxResults || YOUTUBE_CONFIG.defaultMaxResults,
          YOUTUBE_CONFIG.maxResultsLimit,
        ),
      ),
      order: searchDto.order || 'viewCount',
    });

    if (searchDto.channelType && searchDto.channelType !== 'any') {
      params.append('channelType', searchDto.channelType);
    }

    if (searchDto.regionCode) {
      params.append('regionCode', searchDto.regionCode);
    }

    if (searchDto.relevanceLanguage) {
      params.append('relevanceLanguage', searchDto.relevanceLanguage);
    }

    if (searchDto.publishedAfter) {
      params.append('publishedAfter', searchDto.publishedAfter);
    }

    if (searchDto.publishedBefore) {
      params.append('publishedBefore', searchDto.publishedBefore);
    }

    return `${YOUTUBE_CONFIG.baseUrl}/search?${params.toString()}`;
  }

  private async getChannelDetails(
    channelIds: string[],
  ): Promise<YoutubeChannelResponse> {
    const url = `${YOUTUBE_CONFIG.baseUrl}/channels?key=${YOUTUBE_CONFIG.apiKey}&part=snippet,statistics,brandingSettings,topicDetails&id=${channelIds.join(',')}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.statusText}`);
    }

    return response.json();
  }

  private processChannelDetails(
    channelData: YoutubeChannelResponse,
    searchDto: SearchChannelsDto,
  ): ChannelSearchResult[] {
    return channelData.items
      .map((channel) => this.extractChannelData(channel))
      .filter((channel) => this.applyFilters(channel, searchDto));
  }

  private extractChannelData(channel: YoutubeChannelItem): ChannelSearchResult {
    const snippet = channel.snippet;
    const stats = channel.statistics;
    const branding = channel.brandingSettings?.channel;
    const topics = channel.topicDetails?.topicCategories || [];

    const allText =
      `${snippet.description || ''} ${branding?.description || ''}`.substring(
        0,
        1000,
      );
    const emails = this.extractEmails(allText);
    const urls = this.extractUrls(allText);
    const social = this.extractSocial(allText);

    const subscriberCount = parseInt(stats.subscriberCount) || 0;
    const videoCount = parseInt(stats.videoCount) || 1;
    const viewCount = parseInt(stats.viewCount) || 0;

    return {
      channelId: channel.id,
      channelTitle: snippet.title || 'N/A',
      customUrl: snippet.customUrl || 'N/A',
      youtubeUrl: `https://youtube.com/${snippet.customUrl || '@' + channel.id}`,
      description: snippet.description || '',
      emails: emails,
      websites: urls,
      instagram: social.instagram,
      twitter: social.twitter,
      tiktok: social.tiktok,
      subscriberCount: subscriberCount,
      videoCount: videoCount,
      viewCount: viewCount,
      avgViewsPerVideo: videoCount > 0 ? Math.round(viewCount / videoCount) : 0,
      country: snippet.country || 'Unknown',
      keywords: topics
        .map((t: string) => t.split('/').pop())
        .filter(Boolean) as string[],
      publishedAt: snippet.publishedAt || new Date().toISOString(),
      extractedAt: new Date().toISOString(),
      thumbnails: {
        default: snippet.thumbnails?.default?.url,
        medium: snippet.thumbnails?.medium?.url,
        high: snippet.thumbnails?.high?.url,
      },
    };
  }

  private applyFilters(
    channel: ChannelSearchResult,
    searchDto: SearchChannelsDto,
  ): boolean {
    if (
      searchDto.minSubscribers &&
      channel.subscriberCount < searchDto.minSubscribers
    ) {
      return false;
    }

    if (
      searchDto.maxSubscribers &&
      channel.subscriberCount > searchDto.maxSubscribers
    ) {
      return false;
    }

    if (
      searchDto.minVideoCount &&
      channel.videoCount < searchDto.minVideoCount
    ) {
      return false;
    }

    if (
      searchDto.maxVideoCount &&
      channel.videoCount > searchDto.maxVideoCount
    ) {
      return false;
    }

    if (searchDto.minViewCount && channel.viewCount < searchDto.minViewCount) {
      return false;
    }

    if (searchDto.maxViewCount && channel.viewCount > searchDto.maxViewCount) {
      return false;
    }

    if (searchDto.country && channel.country !== searchDto.country) {
      return false;
    }

    if (searchDto.hasContactInfo) {
      const hasContact =
        channel.emails.length > 0 ||
        channel.websites.length > 0 ||
        channel.instagram ||
        channel.twitter ||
        channel.tiktok;
      if (!hasContact) {
        return false;
      }
    }

    return true;
  }

  private extractEmails(text: string): string[] {
    const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return [...new Set(text.match(regex) || [])];
  }

  private extractUrls(text: string): string[] {
    const regex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/g;
    const urls = [...new Set(text.match(regex) || [])].slice(0, 10);
    return urls.filter(
      (u) => !u.includes('youtube.com') && !u.includes('youtu.be'),
    );
  }

  private extractSocial(text: string): {
    instagram: string | null;
    twitter: string | null;
    tiktok: string | null;
  } {
    const instagram = text.match(/instagram\.com\/([a-zA-Z0-9._-]+)/i)?.[0];
    const twitter =
      text.match(/twitter\.com\/([a-zA-Z0-9_]+)/i)?.[0] ||
      text.match(/x\.com\/([a-zA-Z0-9_]+)/i)?.[0];
    const tiktok = text.match(/tiktok\.com\/@([a-zA-Z0-9._-]+)/i)?.[0];

    return {
      instagram: instagram || null,
      twitter: twitter || null,
      tiktok: tiktok || null,
    };
  }

  private removeDuplicates(
    results: ChannelSearchResult[],
  ): ChannelSearchResult[] {
    const seen = new Set<string>();
    return results.filter((channel) => {
      if (seen.has(channel.channelId)) {
        return false;
      }
      seen.add(channel.channelId);
      return true;
    });
  }
}
