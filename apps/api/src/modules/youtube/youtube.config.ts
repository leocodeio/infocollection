export const YOUTUBE_CONFIG = {
  apiKey: process.env.YOUTUBE_API_KEY || '',
  baseUrl: 'https://www.googleapis.com/youtube/v3',
  defaultMaxResults: 50,
  maxResultsLimit: 50,
  minSubscribers: 1000,
};
