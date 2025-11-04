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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !query) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            onClick={() => navigate("/feed")}
            variant="outline"
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Feed
          </Button>
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-12 text-center">
            <p className="text-red-300 text-lg">{error || "Query not found"}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          onClick={() => navigate("/feed")}
          variant="outline"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Feed
        </Button>

        <div className="bg-accent/40 border border-border rounded-lg p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-4">
                {query.keywords.join(", ")}
              </h1>
              <div className="flex flex-wrap gap-2 mb-4">
                {query.platforms.map((platform) => (
                  <span
                    key={platform}
                    className="text-sm px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusIcon(query.status)}
              <span
                className={`px-4 py-2 rounded-lg border ${getStatusColor(query.status)}`}
              >
                {query.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 pt-6 border-t border-border">
            <div>
              <p className="text-foreground/60 text-sm mb-1">Created</p>
              <p className="text-foreground font-medium">
                {formatDate(query.createdAt)}
              </p>
            </div>
            {query.completedAt && (
              <div>
                <p className="text-foreground/60 text-sm mb-1">Completed</p>
                <p className="text-foreground font-medium">
                  {formatDate(query.completedAt)}
                </p>
              </div>
            )}
            <div>
              <p className="text-foreground/60 text-sm mb-1">Total Results</p>
              <p className="text-foreground font-medium text-2xl">
                {query.totalResults}
              </p>
            </div>
          </div>

          {query.errorMessage && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
              <p className="text-red-300 text-sm">
                Error: {query.errorMessage}
              </p>
            </div>
          )}
        </div>

        {query.results && query.results.length > 0 ? (
          <div className="space-y-8">
            {query.results.map((result) => {
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
                <div key={result.id}>
                  <h2 className="text-2xl font-bold mb-4">
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
          <div className="bg-accent/40 border border-border rounded-lg p-12 text-center">
            <p className="text-foreground/60 text-lg">No results found</p>
          </div>
        ) : (
          <div className="bg-accent/40 border border-border rounded-lg p-12 text-center">
            <p className="text-foreground/60 text-lg">
              {query.status === "PROCESSING"
                ? "Query is still processing..."
                : "Query results will appear here once completed"}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
