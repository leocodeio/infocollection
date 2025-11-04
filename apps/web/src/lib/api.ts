// API base URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

// Types
export type Platform =
  | "YOUTUBE"
  | "INSTAGRAM"
  | "REDDIT"
  | "TWITTER"
  | "TIKTOK"
  | "LINKEDIN"
  | "FACEBOOK"
  | "OTHER";

export type QueryStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export interface QueryResult {
  id: string;
  platform: Platform;
  attributes: Record<string, any>;
  data: any[];
  createdAt: string;
}

export interface Query {
  id: string;
  userId: string;
  keywords: string[];
  platforms: Platform[];
  status: QueryStatus;
  totalResults: number;
  filters?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  errorMessage?: string;
  results?: QueryResult[];
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PaginatedQueriesResponse {
  success: boolean;
  data: Query[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface CreateQueryRequest {
  keywords: string[];
  platforms: Platform[];
  filters?: Record<string, any>;
}

export interface CreateQueryResponse {
  success: boolean;
  message: string;
  data: Query;
}

export interface GetQueryResponse {
  success: boolean;
  data: Query;
}

/**
 * Fetch all queries with pagination
 */
export async function getQueries(
  page: number = 0,
  limit: number = 12,
): Promise<PaginatedQueriesResponse> {
  const response = await fetch(
    `${API_BASE_URL}/query?page=${page}&limit=${limit}`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch queries");
  }

  return response.json();
}

/**
 * Fetch a single query by ID with results
 */
export async function getQuery(id: string): Promise<GetQueryResponse> {
  const response = await fetch(`${API_BASE_URL}/query/${id}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch query");
  }

  return response.json();
}

/**
 * Create a new query
 */
export async function createQuery(
  request: CreateQueryRequest,
): Promise<CreateQueryResponse> {
  const response = await fetch(`${API_BASE_URL}/query`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error("Failed to create query");
  }

  return response.json();
}

/**
 * Poll query status until completed or failed
 */
export async function pollQueryStatus(
  queryId: string,
  onUpdate?: (query: Query) => void,
  maxAttempts: number = 60,
): Promise<Query> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await getQuery(queryId);
    const query = response.data;

    if (onUpdate) {
      onUpdate(query);
    }

    if (query.status === "COMPLETED" || query.status === "FAILED") {
      return query;
    }

    // Wait 2 seconds before next poll
    await new Promise((resolve) => setTimeout(resolve, 2000));
    attempts++;
  }

  throw new Error("Query polling timeout");
}
