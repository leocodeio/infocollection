export const YOUTUBE_WORKFLOW = {
  name: 'YouTube Channel Search Workflow',
  nodes: [
    {
      parameters: {
        httpMethod: 'GET',
        path: 'youtube/search',
        options: {},
      },
      id: 'webhook-trigger',
      name: 'Webhook Trigger',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      position: [250, 300],
      webhookId: 'youtube-search',
    },
    {
      parameters: {
        operation: 'splitOutItems',
        fieldToSplitOut: 'keywords',
        options: {},
      },
      id: 'split-keywords',
      name: 'Split Keywords',
      type: 'n8n-nodes-base.itemLists',
      typeVersion: 3,
      position: [450, 300],
    },
    {
      parameters: {
        url: "=https://www.googleapis.com/youtube/v3/search?key={{$node['Webhook Trigger'].json.query.apiKey}}&part=snippet&type=channel&q={{$json.keywords}}&maxResults={{$node['Webhook Trigger'].json.query.maxResults || 50}}&order={{$node['Webhook Trigger'].json.query.order || 'viewCount'}}&channelType={{$node['Webhook Trigger'].json.query.channelType || 'any'}}{{$node['Webhook Trigger'].json.query.regionCode ? '&regionCode=' + $node['Webhook Trigger'].json.query.regionCode : ''}}{{$node['Webhook Trigger'].json.query.relevanceLanguage ? '&relevanceLanguage=' + $node['Webhook Trigger'].json.query.relevanceLanguage : ''}}{{$node['Webhook Trigger'].json.query.publishedAfter ? '&publishedAfter=' + $node['Webhook Trigger'].json.query.publishedAfter : ''}}{{$node['Webhook Trigger'].json.query.publishedBefore ? '&publishedBefore=' + $node['Webhook Trigger'].json.query.publishedBefore : ''}}",
        method: 'GET',
        options: {},
      },
      id: 'youtube-search',
      name: 'YouTube Search API',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4,
      position: [650, 300],
    },
    {
      parameters: {
        operation: 'splitOutItems',
        fieldToSplitOut: 'items',
        options: {},
      },
      id: 'split-results',
      name: 'Split Search Results',
      type: 'n8n-nodes-base.itemLists',
      typeVersion: 3,
      position: [850, 300],
    },
    {
      parameters: {
        url: "=https://www.googleapis.com/youtube/v3/channels?key={{$node['Webhook Trigger'].json.query.apiKey}}&part=snippet,statistics,brandingSettings,topicDetails&id={{$json.items.id.channelId}}",
        method: 'GET',
        options: {},
      },
      id: 'get-channel-details',
      name: 'Get Channel Details',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4,
      position: [1050, 300],
    },
    {
      parameters: {
        functionCode:
          "const channel = $json.items?.[0] || {};\nconst snippet = channel.snippet || {};\nconst stats = channel.statistics || {};\nconst branding = channel.brandingSettings?.channel || {};\nconst topics = channel.topicDetails?.topicCategories || [];\n\nconst getText = (str) => (str || '').trim().substring(0, 1000);\n\nconst extractEmails = (text) => {\n  const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/g;\n  return [...new Set(text.match(regex) || [])];\n};\n\nconst extractUrls = (text) => {\n  const regex = /(https?:\\/\\/[^\\s<>\"{}|\\\\^`\\[\\]]+)/g;\n  const urls = [...new Set(text.match(regex) || [])].slice(0, 10);\n  return urls.filter(u => !u.includes('youtube.com') && !u.includes('youtu.be'));\n};\n\nconst extractSocial = (text) => {\n  const instagram = text.match(/instagram\\.com\\/([a-zA-Z0-9._-]+)/i)?.[0];\n  const twitter = text.match(/twitter\\.com\\/([a-zA-Z0-9_]+)/i)?.[0] || text.match(/x\\.com\\/([a-zA-Z0-9_]+)/i)?.[0];\n  const tiktok = text.match(/tiktok\\.com\\/@([a-zA-Z0-9._-]+)/i)?.[0];\n  return { instagram: instagram || null, twitter: twitter || null, tiktok: tiktok || null };\n};\n\nconst allText = getText(snippet.description) + ' ' + getText(branding.description);\nconst emails = extractEmails(allText);\nconst urls = extractUrls(allText);\nconst social = extractSocial(allText);\nconst subscriberCount = parseInt(stats.subscriberCount) || 0;\nconst videoCount = parseInt(stats.videoCount) || 1;\nconst viewCount = parseInt(stats.viewCount) || 0;\nconst hasContact = emails.length > 0 || urls.length > 0 || social.instagram || social.twitter || social.tiktok;\nconst country = snippet.country || 'Unknown';\nconst keywords = topics.map(t => t.split('/').pop()).filter(Boolean);\nconst publishedAt = snippet.publishedAt || new Date().toISOString();\n\nreturn [{\n  json: {\n    channelId: channel.id,\n    channelTitle: snippet.title || 'N/A',\n    customUrl: snippet.customUrl || 'N/A',\n    youtubeUrl: `https://youtube.com/${snippet.customUrl || '@' + channel.id}`,\n    description: snippet.description || '',\n    emails,\n    websites: urls,\n    instagram: social.instagram,\n    twitter: social.twitter,\n    tiktok: social.tiktok,\n    subscriberCount,\n    videoCount,\n    viewCount,\n    avgViewsPerVideo: videoCount > 0 ? Math.round(viewCount / videoCount) : 0,\n    country,\n    keywords,\n    publishedAt,\n    extractedAt: new Date().toISOString(),\n    thumbnails: {\n      default: snippet.thumbnails?.default?.url,\n      medium: snippet.thumbnails?.medium?.url,\n      high: snippet.thumbnails?.high?.url,\n    },\n    hasContact,\n  },\n}];\n",
      },
      id: 'extract-data',
      name: 'Extract Channel Data',
      type: 'n8n-nodes-base.function',
      typeVersion: 1,
      position: [1250, 300],
    },
    {
      parameters: {
        conditions: {
          options: {
            version: 2,
            leftValue: '',
            caseSensitive: true,
            typeValidation: 'strict',
          },
          combinator: 'and',
          conditions: [
            {
              id: 'min-subscribers-filter',
              operator: {
                type: 'number',
                operation: 'gte',
              },
              leftValue: '={{$json.subscriberCount}}',
              rightValue:
                "={{$node['Webhook Trigger'].json.query.minSubscribers || 1000}}",
            },
            {
              id: 'max-subscribers-filter',
              operator: {
                type: 'number',
                operation: 'lte',
              },
              leftValue: '={{$json.subscriberCount}}',
              rightValue:
                "={{$node['Webhook Trigger'].json.query.maxSubscribers || 999999999}}",
            },
            {
              id: 'min-video-count-filter',
              operator: {
                type: 'number',
                operation: 'gte',
              },
              leftValue: '={{$json.videoCount}}',
              rightValue:
                "={{$node['Webhook Trigger'].json.query.minVideoCount || 0}}",
            },
            {
              id: 'max-video-count-filter',
              operator: {
                type: 'number',
                operation: 'lte',
              },
              leftValue: '={{$json.videoCount}}',
              rightValue:
                "={{$node['Webhook Trigger'].json.query.maxVideoCount || 999999999}}",
            },
            {
              id: 'min-view-count-filter',
              operator: {
                type: 'number',
                operation: 'gte',
              },
              leftValue: '={{$json.viewCount}}',
              rightValue:
                "={{$node['Webhook Trigger'].json.query.minViewCount || 0}}",
            },
            {
              id: 'max-view-count-filter',
              operator: {
                type: 'number',
                operation: 'lte',
              },
              leftValue: '={{$json.viewCount}}',
              rightValue:
                "={{$node['Webhook Trigger'].json.query.maxViewCount || 999999999}}",
            },
            {
              id: 'country-filter',
              operator: {
                type: 'string',
                operation: 'equals',
              },
              leftValue: '={{$json.country}}',
              rightValue:
                "={{$node['Webhook Trigger'].json.query.country || $json.country}}",
            },
            {
              id: 'contact-info-filter',
              operator: {
                type: 'boolean',
                operation: 'true',
                singleValue: true,
              },
              leftValue:
                "={{$node['Webhook Trigger'].json.query.hasContactInfo ? $json.hasContact : true}}",
              rightValue: '',
            },
          ],
        },
      },
      id: 'apply-filters',
      name: 'Apply Advanced Filters',
      type: 'n8n-nodes-base.if',
      typeVersion: 2,
      position: [1450, 300],
    },
    {
      parameters: {
        operation: 'removeDuplicates',
        compare: 'selectedFields',
        fieldsToCompare: 'channelId',
        options: {},
      },
      id: 'remove-duplicates',
      name: 'Remove Duplicate Channels',
      type: 'n8n-nodes-base.itemLists',
      typeVersion: 3,
      position: [1650, 300],
    },
    {
      parameters: {
        operation: 'sort',
        sortFieldsUi: {
          sortField: [
            {
              fieldName: 'subscriberCount',
              order: 'descending',
            },
          ],
        },
      },
      id: 'sort-results',
      name: 'Sort by Subscribers',
      type: 'n8n-nodes-base.itemLists',
      typeVersion: 3,
      position: [1850, 300],
    },
    {
      parameters: {
        respondWith: 'json',
        responseBody: '={{ { data: $items() } }}',
        options: {},
      },
      id: 'respond-webhook',
      name: 'Return Results',
      type: 'n8n-nodes-base.respondToWebhook',
      typeVersion: 1,
      position: [2050, 300],
    },
  ],
  connections: {
    'Webhook Trigger': {
      main: [
        [
          {
            node: 'Split Keywords',
            type: 'main',
            index: 0,
          },
        ],
      ],
    },
    'Split Keywords': {
      main: [
        [
          {
            node: 'YouTube Search API',
            type: 'main',
            index: 0,
          },
        ],
      ],
    },
    'YouTube Search API': {
      main: [
        [
          {
            node: 'Split Search Results',
            type: 'main',
            index: 0,
          },
        ],
      ],
    },
    'Split Search Results': {
      main: [
        [
          {
            node: 'Get Channel Details',
            type: 'main',
            index: 0,
          },
        ],
      ],
    },
    'Get Channel Details': {
      main: [
        [
          {
            node: 'Extract Channel Data',
            type: 'main',
            index: 0,
          },
        ],
      ],
    },
    'Extract Channel Data': {
      main: [
        [
          {
            node: 'Apply Advanced Filters',
            type: 'main',
            index: 0,
          },
        ],
      ],
    },
    'Apply Advanced Filters': {
      main: [
        [
          {
            node: 'Remove Duplicate Channels',
            type: 'main',
            index: 0,
          },
        ],
      ],
    },
    'Remove Duplicate Channels': {
      main: [
        [
          {
            node: 'Sort by Subscribers',
            type: 'main',
            index: 0,
          },
        ],
      ],
    },
    'Sort by Subscribers': {
      main: [
        [
          {
            node: 'Return Results',
            type: 'main',
            index: 0,
          },
        ],
      ],
    },
  },
  active: false,
  settings: {
    saveExecutionData: true,
    saveDataExcludeResolved: true,
    executionOrder: 'v1',
  },
  staticData: null,
  pinData: {},
  meta: {
    instanceId: 'youtube-channel-search',
  },
};
