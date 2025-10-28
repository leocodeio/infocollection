import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQueryDto {
  @ApiProperty({
    description: 'Search keywords',
    type: [String],
    example: ['technology', 'programming'],
  })
  keywords: string[];

  @ApiProperty({
    description: 'Platforms to search',
    enum: [
      'YOUTUBE',
      'INSTAGRAM',
      'REDDIT',
      'TWITTER',
      'TIKTOK',
      'LINKEDIN',
      'FACEBOOK',
      'OTHER',
    ],
    isArray: true,
    example: ['YOUTUBE'],
  })
  platforms: string[];

  @ApiPropertyOptional({
    description: 'Platform-specific filters',
    example: { minSubscribers: 1000, maxResults: 30 },
  })
  filters?: Record<string, any>;
}

export class QueryResponseDto {
  @ApiProperty({ description: 'Query ID', example: 'clx123abc' })
  id: string;

  @ApiProperty({ description: 'User ID', example: 'user123' })
  userId: string;

  @ApiProperty({ description: 'Search keywords', type: [String] })
  keywords: string[];

  @ApiProperty({ description: 'Platforms queried', type: [String] })
  platforms: string[];

  @ApiProperty({ description: 'Query status', example: 'COMPLETED' })
  status: string;

  @ApiProperty({ description: 'Total results count', example: 25 })
  totalResults: number;

  @ApiProperty({ description: 'Applied filters', required: false })
  filters?: Record<string, any>;

  @ApiProperty({ description: 'Query created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Query completed at', required: false })
  completedAt?: Date;

  @ApiProperty({ description: 'Error message if failed', required: false })
  errorMessage?: string;

  @ApiProperty({
    description: 'Query results by platform',
    type: 'array',
    required: false,
  })
  results?: QueryResultDto[];
}

export class QueryResultDto {
  @ApiProperty({ description: 'Result ID', example: 'clx456def' })
  id: string;

  @ApiProperty({ description: 'Platform', example: 'YOUTUBE' })
  platform: string;

  @ApiProperty({ description: 'Attribute schema' })
  attributes: Record<string, any>;

  @ApiProperty({ description: 'Result data', isArray: true })
  data: any[];

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;
}

export class GetQueryResponseDto {
  @ApiProperty({ description: 'Success status', example: true })
  success: boolean;

  @ApiProperty({ description: 'Query data', type: QueryResponseDto })
  data: QueryResponseDto;
}

export class CreateQueryResponseDto {
  @ApiProperty({ description: 'Success status', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Message',
    example: 'Query created successfully',
  })
  message: string;

  @ApiProperty({ description: 'Query data', type: QueryResponseDto })
  data: QueryResponseDto;
}
