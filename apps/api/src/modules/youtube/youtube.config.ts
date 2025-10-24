import { ConfigService } from '@nestjs/config';

export const getYoutubeConfig = (configService: ConfigService) => {
  const apiKey = configService.getOrThrow<string>('YOUTUBE_API_KEY');
  const baseUrl = 'https://www.googleapis.com/youtube/v3';
  const defaultMaxResults = configService.getOrThrow<number>(
    'YOUTUBE_DEFAULT_MAX_RESULTS',
  );
  const maxResultsLimit = configService.getOrThrow<number>(
    'YOUTUBE_MAX_RESULTS_LIMIT',
  );
  const minSubscribers = configService.getOrThrow<number>(
    'YOUTUBE_MIN_SUBSCRIBERS',
  );

  return {
    apiKey,
    baseUrl,
    defaultMaxResults,
    maxResultsLimit,
    minSubscribers,
  };
};
