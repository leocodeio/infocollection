import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
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
} from './dto/query.dto';

@ApiTags('query')
@ApiBearerAuth()
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

  @Get(':id')
  @ApiOperation({
    summary: 'Get query results',
    description:
      'Retrieve a query and its results by ID. Only accessible by the query owner.',
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
    const query = await this.queryService.getQuery(id, session.user.id);

    return {
      success: true,
      data: query,
    };
  }
}
