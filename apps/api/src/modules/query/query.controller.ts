import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { QueryService } from './query.service';
import {
  CreateQueryDto,
  CreateQueryResponseDto,
  GetQueryResponseDto,
  GetQueriesQueryDto,
  PaginatedQueriesResponseDto,
} from './dto/query.dto';

@ApiTags('query')
@ApiBearerAuth('Authorization')
@Controller('query')
export class QueryController {
  constructor(private readonly queryService: QueryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new query',
    description:
      'Create a new multi-platform search query. The query will be processed asynchronously.',
  })
  @ApiResponse({
    status: 201,
    description: 'Query created successfully',
    type: CreateQueryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createQuery(
    @Session() session: UserSession,
    @Body() createQueryDto: CreateQueryDto,
  ): Promise<CreateQueryResponseDto> {
    const query = await this.queryService.createQuery(
      session.user.id,
      createQueryDto,
    );

    return {
      success: true,
      message: 'Query created successfully',
      data: query,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all queries with pagination',
    description:
      'Retrieve all queries with pagination support for infinite scroll. Accessible by all authenticated users.',
  })
  @ApiResponse({
    status: 200,
    description: 'Queries retrieved successfully',
    type: PaginatedQueriesResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getQueries(
    @Session() session: UserSession,
    @Query() queryParams: GetQueriesQueryDto,
  ): Promise<PaginatedQueriesResponseDto> {
    const page = Number(queryParams.page) || 0;
    const limit = Number(queryParams.limit) || 12;

    const result = await this.queryService.getQueries(page, limit);

    return {
      success: true,
      data: result.queries,
      pagination: {
        total: result.total,
        page,
        limit,
        hasMore: (page + 1) * limit < result.total,
      },
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get query results',
    description:
      'Retrieve a query and its results by ID. Accessible by all authenticated users.',
  })
  @ApiResponse({
    status: 200,
    description: 'Query retrieved successfully',
    type: GetQueryResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Query not found' })
  async getQuery(
    @Session() session: UserSession,
    @Param('id') id: string,
  ): Promise<GetQueryResponseDto> {
    const query = await this.queryService.getQueryById(id);

    return {
      success: true,
      data: query,
    };
  }
}
