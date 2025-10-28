import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Platform, PrismaClient } from '@prisma/client';
import { CreateQueryDto, QueryResponseDto } from './dto/query.dto';
import { YoutubeService } from './youtube/youtube.service';

const prisma = new PrismaClient();

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);

  constructor(private readonly youtubeService: YoutubeService) {}

  async createQuery(
    userId: string,
    createQueryDto: CreateQueryDto,
  ): Promise<QueryResponseDto> {
    this.logger.log(`Creating query for user ${userId}`);

    const query = await prisma.query.create({
      data: {
        userId,
        keywords: createQueryDto.keywords,
        platforms: createQueryDto.platforms as Platform[],
        filters: createQueryDto.filters || {},
        status: 'PENDING',
      },
    });

    this.processQuery(query.id).catch((error) => {
      this.logger.error(`Error processing query ${query.id}:`, error);
    });

    return this.mapQueryToDto(query);
  }

  async getQuery(queryId: string, userId: string): Promise<QueryResponseDto> {
    const query = await prisma.query.findFirst({
      where: { id: queryId, userId },
      include: { results: true },
    });

    if (!query) {
      throw new NotFoundException('Query not found');
    }

    return this.mapQueryToDto(query);
  }

  private async processQuery(queryId: string): Promise<void> {
    await prisma.query.update({
      where: { id: queryId },
      data: { status: 'PROCESSING' },
    });

    const query = await prisma.query.findUnique({
      where: { id: queryId },
    });

    if (!query) return;

    try {
      let totalResults = 0;

      for (const platform of query.platforms) {
        if (platform === 'YOUTUBE') {
          const youtubeResults = await this.youtubeService.searchChannels({
            keywords: query.keywords,
            ...(query.filters as any),
          });

          await prisma.queryResult.create({
            data: {
              queryId: query.id,
              platform: 'YOUTUBE',
              attributes: {
                channelId: { type: 'string', label: 'Channel ID' },
                channelTitle: { type: 'string', label: 'Channel Name' },
                customUrl: { type: 'string', label: 'Custom URL' },
                youtubeUrl: { type: 'string', label: 'YouTube URL' },
                description: { type: 'string', label: 'Description' },
                subscriberCount: { type: 'number', label: 'Subscribers' },
                videoCount: { type: 'number', label: 'Videos' },
                viewCount: { type: 'number', label: 'Total Views' },
                emails: { type: 'array', label: 'Emails' },
                websites: { type: 'array', label: 'Websites' },
                country: { type: 'string', label: 'Country' },
              },
              data: youtubeResults.map((result) => JSON.stringify(result)),
            },
          });

          totalResults += youtubeResults.length;
        }
      }

      await prisma.query.update({
        where: { id: queryId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          totalResults,
        },
      });
    } catch (error) {
      await prisma.query.update({
        where: { id: queryId },
        data: {
          status: 'FAILED',
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  private mapQueryToDto(query: any): QueryResponseDto {
    return {
      id: query.id,
      userId: query.userId,
      keywords: query.keywords,
      platforms: query.platforms,
      status: query.status,
      totalResults: query.totalResults,
      filters: query.filters,
      createdAt: query.createdAt,
      completedAt: query.completedAt,
      errorMessage: query.errorMessage,
      results: query.results?.map((r: any) => ({
        id: r.id,
        platform: r.platform,
        attributes: r.attributes,
        data: r.data,
        createdAt: r.createdAt,
      })),
    };
  }
}
