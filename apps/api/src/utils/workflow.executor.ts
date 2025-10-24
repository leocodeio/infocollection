import { Logger } from '@nestjs/common';
import {
  SearchChannelsDto,
  ChannelSearchResult,
} from '../modules/youtube/dto/search-channels.dto';
import { YOUTUBE_WORKFLOW } from '../modules/youtube/youtube.workflow';

interface WorkflowNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  parameters: Record<string, unknown>;
}

interface ExecutionContext {
  data: unknown[];
  apiKey: string;
  logger: Logger;
}

export class WorkflowExecutor {
  private readonly logger = new Logger(WorkflowExecutor.name);

  async execute(
    searchDto: SearchChannelsDto,
    apiKey: string,
  ): Promise<ChannelSearchResult[]> {
    const context: ExecutionContext = {
      data: [{}],
      apiKey,
      logger: this.logger,
    };

    const nodeOrder = [
      'Webhook Trigger',
      'Split Keywords',
      'YouTube Search API',
      'Split Search Results',
      'Get Channel Details',
      'Extract Channel Data',
      'Apply Advanced Filters',
      'Remove Duplicate Channels',
      'Sort by Subscribers',
    ];

    for (const nodeName of nodeOrder) {
      const node = YOUTUBE_WORKFLOW.nodes.find(
        (n: WorkflowNode) => n.name === nodeName,
      );
      if (!node) continue;

      try {
        context.data = await this.executeNode(
          nodeName,
          node,
          context,
          searchDto,
        );
      } catch (error) {
        this.logger.error(`Workflow failed at ${nodeName}:`, error);
        throw error;
      }
    }

    const results = context.data.map(
      (item: Record<string, unknown>) => item.json || item,
    ) as ChannelSearchResult[];
    return results;
  }

  private async executeNode(
    nodeName: string,
    _node: WorkflowNode,
    context: ExecutionContext,
    searchDto: SearchChannelsDto,
  ): Promise<unknown[]> {
    this.logger.debug(`Executing: ${nodeName}`);

    switch (nodeName) {
      case 'Webhook Trigger':
        return [{ query: { apiKey: context.apiKey, ...searchDto } }];

      case 'Split Keywords':
        return this.splitKeywords(context.data, searchDto);

      case 'YouTube Search API':
        return await this.youtubeSearch(
          context.data,
          context.apiKey,
          searchDto,
        );

      case 'Split Search Results':
        return this.splitSearchResults(context.data);

      case 'Get Channel Details':
        return await this.getChannelDetails(context.data, context.apiKey);

      case 'Extract Channel Data':
        return this.extractChannelData(context.data);

      case 'Apply Advanced Filters':
        return this.applyFilters(context.data, searchDto);

      case 'Remove Duplicate Channels':
        return this.removeDuplicates(context.data);

      case 'Sort by Subscribers':
        return this.sortBySubscribers(context.data);

      default:
        return context.data;
    }
  }

  private splitKeywords(
    data: unknown[],
    searchDto: SearchChannelsDto,
  ): unknown[] {
    const results: unknown[] = [];
    for (const keyword of searchDto.keywords) {
      results.push({ keywords: keyword });
    }
    return results.length > 0 ? results : data;
  }

  private async youtubeSearch(
    data: unknown[],
    apiKey: string,
    searchDto: SearchChannelsDto,
  ): Promise<unknown[]> {
    const results: unknown[] = [];

    for (const item of data) {
      const itemRecord = item as Record<string, unknown>;
      const keywordValue = itemRecord.keywords;
      const keyword = typeof keywordValue === 'string' ? keywordValue : '';
      const maxResults = searchDto.maxResults || 50;
      const order = searchDto.order || 'viewCount';

      const params = new URLSearchParams({
        key: apiKey,
        part: 'snippet',
        type: 'channel',
        q: keyword,
        maxResults: String(maxResults),
        order,
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

      const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          this.logger.warn(
            `YouTube API error for keyword "${keyword}": ${response.statusText}`,
          );
          continue;
        }
        const searchData = (await response.json()) as Record<string, unknown>;
        results.push(searchData);
      } catch (error) {
        this.logger.warn(`Error searching for keyword "${keyword}":`, error);
      }
    }

    return results.length > 0 ? results : data;
  }

  private splitSearchResults(data: unknown[]): unknown[] {
    const results: unknown[] = [];

    for (const item of data) {
      const items =
        ((item as Record<string, unknown>).items as Array<
          Record<string, unknown>
        >) || [];
      for (const searchItem of items) {
        results.push({ items: searchItem });
      }
    }

    return results.length > 0 ? results : data;
  }

  private async getChannelDetails(
    data: unknown[],
    apiKey: string,
  ): Promise<unknown[]> {
    const results: unknown[] = [];

    for (const item of data) {
      const searchItem =
        ((item as Record<string, unknown>).items as Record<string, unknown>) ||
        {};
      const idValue = (searchItem.id as Record<string, unknown>)?.channelId;
      const channelId = typeof idValue === 'string' ? idValue : '';

      if (!channelId) {
        this.logger.debug('Skipping item without channelId');
        continue;
      }

      const params = new URLSearchParams({
        key: apiKey,
        part: 'snippet,statistics,brandingSettings,topicDetails',
        id: channelId,
      });

      const url = `https://www.googleapis.com/youtube/v3/channels?${params.toString()}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          this.logger.warn(`Failed to get channel details for ${channelId}`);
          continue;
        }
        const channelData = (await response.json()) as Record<string, unknown>;
        results.push(channelData);
      } catch (error) {
        this.logger.warn(
          `Error fetching channel details for ${channelId}:`,
          error,
        );
      }
    }

    return results.length > 0 ? results : data;
  }

  private extractChannelData(data: unknown[]): unknown[] {
    const results: unknown[] = [];

    for (const item of data) {
      const channelData = item as Record<string, unknown>;
      const items = (channelData.items as Array<Record<string, unknown>>) || [];

      for (const channel of items) {
        const snippet = (channel.snippet || {}) as Record<string, unknown>;
        const stats = (channel.statistics || {}) as Record<string, unknown>;
        const branding = ((channel.brandingSettings as Record<string, unknown>)
          ?.channel || {}) as Record<string, unknown>;
        const topics =
          ((channel.topicDetails as Record<string, unknown>)
            ?.topicCategories as string[]) || [];

        const subscriberCount = parseInt(String(stats.subscriberCount)) || 0;
        const videoCount = parseInt(String(stats.videoCount)) || 1;
        const viewCount = parseInt(String(stats.viewCount)) || 0;

        const descriptionValue = snippet.description;
        const brandingDescValue = branding.description;
        const descriptionStr =
          typeof descriptionValue === 'string' ? descriptionValue : '';
        const brandingDescStr =
          typeof brandingDescValue === 'string' ? brandingDescValue : '';
        const allText = `${descriptionStr} ${brandingDescStr}`.substring(
          0,
          1000,
        );
        const emails = this.extractEmails(allText);
        const websites = this.extractUrls(allText);
        const social = this.extractSocial(allText);

        const hasContact =
          emails.length > 0 ||
          websites.length > 0 ||
          social.instagram ||
          social.twitter ||
          social.tiktok;

        const customUrlValue = snippet.customUrl;
        const channelIdValue = channel.id;
        const customUrl =
          typeof customUrlValue === 'string' ? customUrlValue : '';
        const channelId =
          typeof channelIdValue === 'string' ? channelIdValue : '';
        const youtubeUrl = `https://youtube.com/${customUrl || '@' + channelId}`;

        results.push({
          json: {
            channelId,
            channelTitle: snippet.title || 'N/A',
            customUrl: customUrl || 'N/A',
            youtubeUrl,
            description: descriptionStr,
            emails,
            websites,
            instagram: social.instagram,
            twitter: social.twitter,
            tiktok: social.tiktok,
            subscriberCount,
            videoCount,
            viewCount,
            avgViewsPerVideo:
              videoCount > 0 ? Math.round(viewCount / videoCount) : 0,
            country: snippet.country || 'Unknown',
            keywords: topics.map((t) => t.split('/').pop()).filter(Boolean),
            publishedAt: snippet.publishedAt || new Date().toISOString(),
            extractedAt: new Date().toISOString(),
            thumbnails: {
              default: (
                (snippet.thumbnails as Record<string, unknown>)
                  ?.default as Record<string, unknown>
              )?.url,
              medium: (
                (snippet.thumbnails as Record<string, unknown>)
                  ?.medium as Record<string, unknown>
              )?.url,
              high: (
                (snippet.thumbnails as Record<string, unknown>)?.high as Record<
                  string,
                  unknown
                >
              )?.url,
            },
            hasContact,
          },
        });
      }
    }

    return results;
  }

  private applyFilters(
    data: unknown[],
    searchDto: SearchChannelsDto,
  ): unknown[] {
    return data.filter((item) => {
      const channel = ((item as Record<string, unknown>).json ||
        item) as Record<string, unknown>;

      if (
        searchDto.minSubscribers &&
        (channel.subscriberCount as number) < searchDto.minSubscribers
      ) {
        return false;
      }
      if (
        searchDto.maxSubscribers &&
        (channel.subscriberCount as number) > searchDto.maxSubscribers
      ) {
        return false;
      }
      if (
        searchDto.minVideoCount &&
        (channel.videoCount as number) < searchDto.minVideoCount
      ) {
        return false;
      }
      if (
        searchDto.maxVideoCount &&
        (channel.videoCount as number) > searchDto.maxVideoCount
      ) {
        return false;
      }
      if (
        searchDto.minViewCount &&
        (channel.viewCount as number) < searchDto.minViewCount
      ) {
        return false;
      }
      if (
        searchDto.maxViewCount &&
        (channel.viewCount as number) > searchDto.maxViewCount
      ) {
        return false;
      }
      if (searchDto.country && channel.country !== searchDto.country) {
        return false;
      }
      if (searchDto.hasContactInfo && !(channel.hasContact as boolean)) {
        return false;
      }

      return true;
    });
  }

  private removeDuplicates(data: unknown[]): unknown[] {
    const seen = new Set<string>();
    return data.filter((item) => {
      const channel = ((item as Record<string, unknown>).json ||
        item) as Record<string, unknown>;
      const channelId = channel.channelId as string;

      if (seen.has(channelId)) {
        return false;
      }
      seen.add(channelId);
      return true;
    });
  }

  private sortBySubscribers(data: unknown[]): unknown[] {
    return [...data].sort((a, b) => {
      const channelA = ((a as Record<string, unknown>).json || a) as Record<
        string,
        unknown
      >;
      const channelB = ((b as Record<string, unknown>).json || b) as Record<
        string,
        unknown
      >;
      return (
        (channelB.subscriberCount as number) -
        (channelA.subscriberCount as number)
      );
    });
  }

  private extractEmails(text: string): string[] {
    const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return [...new Set(text.match(regex) || [])];
  }

  private extractUrls(text: string): string[] {
    const regex = /(https?:\/\/[^\s<>"{}|\\^`[]]+)/g;
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
    const instagram =
      text.match(/instagram\.com\/([a-zA-Z0-9._-]+)/i)?.[0] || null;
    const twitter =
      text.match(/twitter\.com\/([a-zA-Z0-9_]+)/i)?.[0] ||
      text.match(/x\.com\/([a-zA-Z0-9_]+)/i)?.[0] ||
      null;
    const tiktok = text.match(/tiktok\.com\/@([a-zA-Z0-9._-]+)/i)?.[0] || null;

    return { instagram, twitter, tiktok };
  }
}
