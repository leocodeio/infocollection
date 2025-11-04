import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";
import { getQueries } from "../lib/api";
import type { Query } from "../lib/api";
import { Clock, CheckCircle, XCircle, Loader2, Search } from "lucide-react";

function CardSkeleton() {
  return (
    <div className="bg-accent/40 backdrop-blur-sm border border-border rounded-xl p-6 animate-pulse">
      <div className="h-5 bg-foreground/10 rounded w-3/4 mb-4" />
      <div className="h-16 bg-foreground/10 rounded w-full mb-4" />
      <div className="flex gap-2 mb-4">
        <div className="h-6 w-16 bg-foreground/10 rounded-full" />
        <div className="h-6 w-16 bg-foreground/10 rounded-full" />
      </div>
      <div className="h-3 bg-foreground/10 rounded w-1/2" />
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
      className="relative bg-accent/40 backdrop-blur-sm border border-border rounded-xl p-5 sm:p-6 hover:bg-accent/60 hover:border-foreground/20 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300 cursor-pointer group text-left overflow-hidden"
    >
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3 sm:mb-4 gap-3">
          <h3 className="text-base sm:text-lg font-semibold group-hover:text-cyan-400 transition-colors line-clamp-2 flex-1">
            {query.keywords.join(", ")}
          </h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            {getStatusIcon()}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
          {query.platforms.map((platform) => (
            <span
              key={platform}
              className="text-xs px-2 py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 rounded-full border border-blue-500/20"
            >
              {platform}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-foreground/50">
              {formatDate(query.createdAt)}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor()}`}
            >
              {query.status}
            </span>
          </div>
          {query.status === "COMPLETED" && (
            <span className="text-xs font-medium text-cyan-400 group-hover:text-cyan-300 group-hover:translate-x-1 transition-transform">
              {query.totalResults} results →
            </span>
          )}
        </div>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header Section */}
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-lg">
              <Search className="w-6 h-6 sm:w-7 sm:h-7 text-cyan-400" />
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Query Feed
            </h2>
          </div>
          <p className="text-foreground/60 text-sm sm:text-base ml-0 sm:ml-14">
            Browse all your queries and track their progress in real-time
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/40 rounded-xl p-4 mb-6 text-red-300 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {queries.length === 0 && !loading && (
          <div className="bg-accent/40 backdrop-blur-sm border border-border rounded-2xl p-12 sm:p-16 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-cyan-400" />
              </div>
              <p className="text-foreground/60 text-lg mb-2 font-medium">
                No queries yet
              </p>
              <p className="text-foreground/40 text-sm">
                Create your first query in the Surf tab to get started
              </p>
            </div>
          </div>
        )}

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {queries.map((query, index) => (
            <div
              key={query.id}
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{
                animationDelay: `${index * 50}ms`,
                animationFillMode: "backwards",
              }}
            >
              <QueryCard query={query} />
            </div>
          ))}
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={`skeleton-${i}`} />
            ))}
        </div>

        {/* Load More Indicator */}
        {hasMore && (
          <div
            ref={loadMoreRef}
            className="h-16 flex items-center justify-center mt-10 sm:mt-12"
          >
            <div className="flex items-center gap-2 text-foreground/40 text-sm">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading more queries...</span>
                </>
              ) : (
                <span>Scroll for more</span>
              )}
            </div>
          </div>
        )}

        {/* End of Results */}
        {!hasMore && queries.length > 0 && (
          <div className="text-center mt-12 text-foreground/40 text-sm">
            You've reached the end of your queries
          </div>
        )}
      </div>
    </Layout>
  );
}
