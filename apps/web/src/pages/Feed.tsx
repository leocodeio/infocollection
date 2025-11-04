import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Layout } from "../components/Layout";
import { getQueries } from "../lib/api";
import type { Query } from "../lib/api";
import { Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";

function CardSkeleton() {
  return (
    <div className="bg-accent/40 border border-border rounded-lg p-6 animate-pulse">
      <div className="h-4 bg-foreground/10 rounded w-3/4 mb-4" />
      <div className="h-20 bg-foreground/10 rounded w-full mb-4" />
      <div className="h-3 bg-foreground/10 rounded w-1/3" />
    </div>
  );
}

function QueryCard({ query }: { query: Query }) {
  const navigate = useNavigate();

  const getStatusIcon = () => {
    switch (query.status) {
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "FAILED":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "PROCESSING":
        return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusColor = () => {
    switch (query.status) {
      case "COMPLETED":
        return "bg-green-500/20 text-green-300";
      case "FAILED":
        return "bg-red-500/20 text-red-300";
      case "PROCESSING":
        return "bg-blue-500/20 text-blue-300";
      default:
        return "bg-yellow-500/20 text-yellow-300";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  return (
    <button
      onClick={() => navigate(`/feed/${query.id}`)}
      className="bg-accent/40 border border-border rounded-lg p-6 hover:bg-accent/60 hover:border-foreground/20 transition-all duration-300 cursor-pointer group text-left"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold group-hover:text-cyan-400 transition-colors">
          {query.keywords.join(", ")}
        </h3>
        <div className="flex items-center gap-2">{getStatusIcon()}</div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {query.platforms.map((platform) => (
          <span
            key={platform}
            className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full"
          >
            {platform}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-foreground/50">
            {formatDate(query.createdAt)}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor()}`}
          >
            {query.status}
          </span>
        </div>
        {query.status === "COMPLETED" && (
          <span className="text-xs font-medium text-cyan-400 group-hover:text-cyan-300">
            {query.totalResults} results →
          </span>
        )}
      </div>
    </button>
  );
}

export function Feed() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const loadQueries = async (pageNum: number) => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getQueries(pageNum, 12);

      // Prevent duplicates by filtering out queries that already exist
      setQueries((prev) => {
        const existingIds = new Set(prev.map((q) => q.id));
        const newQueries = response.data.filter((q) => !existingIds.has(q.id));
        return [...prev, ...newQueries];
      });

      setHasMore(response.pagination.hasMore);
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to load queries:", err);
      setError("Failed to load queries. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset state on initial mount
    setQueries([]);
    setPage(0);
    setHasMore(true);
    loadQueries(0);
  }, []);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !loading && hasMore) {
          loadQueries(page + 1);
        }
      },
      { rootMargin: "200px 0px" },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [loading, hasMore, page]);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">Query Feed</h2>
          <p className="text-foreground/60">
            Browse all queries and their results
          </p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 mb-6 text-red-300">
            {error}
          </div>
        )}

        {queries.length === 0 && !loading && (
          <div className="bg-accent/40 border border-border rounded-lg p-12 text-center">
            <p className="text-foreground/60 text-lg mb-4">No queries found</p>
            <p className="text-foreground/40 text-sm">
              Create your first query in the Surf tab
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {queries.map((query) => (
            <QueryCard key={query.id} query={query} />
          ))}
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={`skeleton-${i}`} />
            ))}
        </div>

        {hasMore && (
          <div
            ref={loadMoreRef}
            className="h-12 flex items-center justify-center mt-10"
          >
            <Button
              variant="outline"
              className="border-border hover:bg-accent/60"
              disabled
            >
              {loading ? "Loading more..." : "Scroll to load more"}
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
