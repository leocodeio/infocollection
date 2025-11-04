import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle, Loader2, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { Button } from "../components/ui/button";
import { getQuery } from "../lib/api";
import type { Query } from "../lib/api";
import { DataTable } from "../components/DataTable";
import { flattenQueryResults } from "../lib/csv-export";

export function FeedDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState<Query | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadQuery = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getQuery(id);
        setQuery(response.data);
      } catch (err) {
        console.error("Failed to load query:", err);
        setError("Failed to load query details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadQuery();
  }, [id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      case "FAILED":
        return <XCircle className="w-6 h-6 text-red-400" />;
      case "PROCESSING":
        return <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />;
      default:
        return <Clock className="w-6 h-6 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "FAILED":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "PROCESSING":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      default:
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-cyan-400 animate-spin mx-auto mb-4" />
              <p className="text-foreground/60 text-sm sm:text-base">
                Loading query details...
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !query) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <Button
            onClick={() => navigate("/feed")}
            variant="outline"
            className="mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Feed
          </Button>
          <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/40 rounded-2xl p-12 sm:p-16 text-center">
            <div className="max-w-md mx-auto">
              <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <p className="text-red-300 text-base sm:text-lg font-medium">
                {error || "Query not found"}
              </p>
              <p className="text-red-300/60 text-sm mt-2">
                This query may have been deleted or doesn't exist
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Back Button */}
        <Button
          onClick={() => navigate("/feed")}
          variant="outline"
          className="mb-6 sm:mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Feed
        </Button>

        {/* Query Info Card */}
        <div className="bg-accent/40 backdrop-blur-sm border border-border rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 mb-6 sm:mb-8 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-cyan-500/5 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10">
            {/* Header with Status */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 sm:gap-6 mb-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 break-words">
                  {query.keywords.join(", ")}
                </h1>
                <div className="flex flex-wrap gap-2">
                  {query.platforms.map((platform) => (
                    <span
                      key={platform}
                      className="text-xs sm:text-sm px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-300 rounded-full border border-blue-500/20"
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 self-start">
                {getStatusIcon(query.status)}
                <span
                  className={`px-4 py-2 rounded-xl border font-medium text-sm whitespace-nowrap ${getStatusColor(query.status)}`}
                >
                  {query.status}
                </span>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-6 border-t border-border">
              <div className="bg-background/40 rounded-xl p-4 border border-border/50">
                <p className="text-foreground/60 text-xs sm:text-sm mb-2 font-medium">
                  Created
                </p>
                <p className="text-foreground font-semibold text-sm sm:text-base">
                  {formatDate(query.createdAt)}
                </p>
              </div>
              {query.completedAt && (
                <div className="bg-background/40 rounded-xl p-4 border border-border/50">
                  <p className="text-foreground/60 text-xs sm:text-sm mb-2 font-medium">
                    Completed
                  </p>
                  <p className="text-foreground font-semibold text-sm sm:text-base">
                    {formatDate(query.completedAt)}
                  </p>
                </div>
              )}
              <div className="bg-background/40 rounded-xl p-4 border border-border/50 sm:col-span-2 lg:col-span-1">
                <p className="text-foreground/60 text-xs sm:text-sm mb-2 font-medium">
                  Total Results
                </p>
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {query.totalResults}
                </p>
              </div>
            </div>

            {/* Error Message */}
            {query.errorMessage && (
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/40 rounded-xl p-4 mt-6">
                <div className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-300 text-sm font-medium mb-1">
                      Error occurred
                    </p>
                    <p className="text-red-300/80 text-sm">
                      {query.errorMessage}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {query.results && query.results.length > 0 ? (
          <div className="space-y-6 sm:space-y-8">
            {query.results.map((result, index) => {
              const parsedData = result.data.map((item) => {
                if (typeof item === "string") {
                  try {
                    return JSON.parse(item);
                  } catch {
                    return item;
                  }
                }
                return item;
              });

              const flattenedData = flattenQueryResults(parsedData);

              return (
                <div
                  key={result.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: "backwards",
                  }}
                >
                  <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-8 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full" />
                    {result.platform} Results
                  </h2>
                  <DataTable
                    data={flattenedData}
                    title={`${result.platform} Data`}
                    downloadFilename={`${query.keywords.join("-")}-${result.platform.toLowerCase()}-results`}
                  />
                </div>
              );
            })}
          </div>
        ) : query.status === "COMPLETED" ? (
          <div className="bg-accent/40 backdrop-blur-sm border border-border rounded-2xl p-12 sm:p-16 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-yellow-400" />
              </div>
              <p className="text-foreground/60 text-base sm:text-lg font-medium">
                No results found
              </p>
              <p className="text-foreground/40 text-sm mt-2">
                This query completed but returned no results
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-accent/40 backdrop-blur-sm border border-border rounded-2xl p-12 sm:p-16 text-center">
            <div className="max-w-md mx-auto">
              {query.status === "PROCESSING" ? (
                <>
                  <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-cyan-400 animate-spin mx-auto mb-6" />
                  <p className="text-foreground/60 text-base sm:text-lg font-medium">
                    Query is still processing...
                  </p>
                  <p className="text-foreground/40 text-sm mt-2">
                    This may take a few moments
                  </p>
                </>
              ) : (
                <>
                  <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-400 mx-auto mb-6" />
                  <p className="text-foreground/60 text-base sm:text-lg font-medium">
                    Waiting for results
                  </p>
                  <p className="text-foreground/40 text-sm mt-2">
                    Query results will appear here once completed
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
