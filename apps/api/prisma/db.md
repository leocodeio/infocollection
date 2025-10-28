# Database Schema Documentation

## Overview

Multi-platform query engine database for storing user queries and results. One-to-many relationship between Query and QueryResult.

## Models

### User

Authentication and user management (from better-auth).

### Query

User search queries across multiple platforms.

- **keywords**: Search terms array
- **platforms**: Target platforms (YOUTUBE, INSTAGRAM, REDDIT, etc.)
- **status**: Query execution state (PENDING, PROCESSING, COMPLETED, FAILED)
- **filters**: JSON field for platform-specific filters
- **totalResults**: Count of profiles found across all platforms
- **results**: One-to-many relation with QueryResult

### QueryResult

Individual result records for each platform queried.

- **queryId**: Foreign key to Query
- **platform**: Which platform this result is from
- **attributes**: JSON schema mapping (field names, types, display labels) for the data
- **data**: JSON containing array of profiles/channels from that platform
- **createdAt**: When results were fetched

## Indexes

- User queries by date
- Query status for background job processing
- QueryResult by queryId for efficient fetching

## Usage Patterns

### Create Query

```typescript
const query = await prisma.query.create({
  data: {
    userId,
    keywords: ['tech', 'AI'],
    platforms: ['YOUTUBE', 'INSTAGRAM'],
    status: 'PENDING',
    filters: { minSubscribers: 1000, maxResults: 30 },
  },
});
```

### Store Results

```typescript
await prisma.queryResult.create({
  data: {
    queryId,
    platform: 'YOUTUBE',
    attributes: {
      channelId: { type: 'string', label: 'Channel ID' },
      channelTitle: { type: 'string', label: 'Channel Name' },
      subscriberCount: { type: 'number', label: 'Subscribers' },
      email: { type: 'string[]', label: 'Email' },
    },
    data: youtubeChannels, // Array of channel objects
  },
});

await prisma.query.update({
  where: { id: queryId },
  data: {
    status: 'COMPLETED',
    completedAt: new Date(),
    totalResults: youtubeChannels.length,
  },
});
```

### Fetch Query with Results

```typescript
const query = await prisma.query.findUnique({
  where: { id: queryId },
  include: { results: true },
});
```
