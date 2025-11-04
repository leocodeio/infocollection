import { Injectable, Logger, NotFoundException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Platform, PrismaClient } from '@prisma/client';
import { CreateQueryDto, QueryResponseDto } from './dto/query.dto';
import { YoutubeService } from './youtube/youtube.service';

const prisma = new PrismaClient();

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);

  constructor(
    private readonly youtubeService: YoutubeService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

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

  async getQueries(
    page: number = 0,
    limit: number = 12,
  ): Promise<{ queries: QueryResponseDto[]; total: number }> {
    const skip = page * limit;

    const [queries, total] = await Promise.all([
      prisma.query.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.query.count(),
    ]);

    return {
      queries: queries.map((query) => this.mapQueryToDto(query)),
      total,
    };
  }

  async getQueryById(queryId: string): Promise<QueryResponseDto> {
    const cacheKey = `query:${queryId}`;

    // Try to get from cache first
    const cached = await this.cacheManager.get<QueryResponseDto>(cacheKey);
    if (cached) {
      this.logger.log(`Cache hit for query ${queryId}`);
      return cached;
    }

    this.logger.log(`Cache miss for query ${queryId}, fetching from database`);

    const query = await prisma.query.findUnique({
      where: { id: queryId },
      include: {
        results: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!query) {
      throw new NotFoundException('Query not found');
    }

    const dto = this.mapQueryToDto(query);

    // Cache only completed queries (they won't change)
    if (query.status === 'COMPLETED') {
      await this.cacheManager.set(cacheKey, dto, 300000); // 5 minutes
      this.logger.log(`Cached query ${queryId}`);
    }

    return dto;
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

      // Invalidate cache for this query so fresh data is fetched
      await this.cacheManager.del(`query:${queryId}`);
      this.logger.log(`Invalidated cache for completed query ${queryId}`);
    } catch (error) {
      await prisma.query.update({
        where: { id: queryId },
        data: {
          status: 'FAILED',
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
        },
      });

      // Invalidate cache for this query
      await this.cacheManager.del(`query:${queryId}`);
      this.logger.log(`Invalidated cache for failed query ${queryId}`);
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
