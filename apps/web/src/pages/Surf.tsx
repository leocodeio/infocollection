import { useState } from "react";
import { Button } from "../components/ui/button";
import {
  Search,
  Loader2,
  CheckCircle,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Layout } from "../components/Layout";
import { createQuery, pollQueryStatus } from "../lib/api";
import type { Platform, Query } from "../lib/api";
import { DataTable } from "../components/DataTable";
import { flattenQueryResults } from "../lib/csv-export";

const AVAILABLE_PROVIDERS: { id: Platform; name: string; enabled: boolean }[] =
  [
    { id: "YOUTUBE", name: "YouTube", enabled: true },
    { id: "INSTAGRAM", name: "Instagram", enabled: false },
    { id: "REDDIT", name: "Reddit", enabled: false },
    { id: "TWITTER", name: "Twitter", enabled: false },
    { id: "TIKTOK", name: "TikTok", enabled: false },
    { id: "LINKEDIN", name: "LinkedIn", enabled: false },
  ];

export function Surf() {
  const [keywords, setKeywords] = useState("");
  const [selectedProviders, setSelectedProviders] = useState<Platform[]>([
    "YOUTUBE",
  ]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState<Query | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleProvider = (providerId: Platform) => {
    const provider = AVAILABLE_PROVIDERS.find((p) => p.id === providerId);
    if (!provider?.enabled) return;

    setSelectedProviders((prev) =>
      prev.includes(providerId)
        ? prev.filter((p) => p !== providerId)
        : [...prev, providerId],
    );
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywords.trim() || selectedProviders.length === 0) {
      setError("Please enter keywords and select at least one provider");
      return;
    }

    setLoading(true);
    setError(null);
    setQuery(null);

    try {
      const keywordArray = keywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      const response = await createQuery({
        keywords: keywordArray,
        platforms: selectedProviders,
      });

      setQuery(response.data);

      // Poll for results
      const completedQuery = await pollQueryStatus(
        response.data.id,
        (updatedQuery) => {
          setQuery(updatedQuery);
        },
      );

      setQuery(completedQuery);
    } catch (err) {
      console.error("Failed to create query:", err);
      setError(err instanceof Error ? err.message : "Failed to execute query");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header Section */}
        <div className="mb-8 sm:mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-4 sm:mb-6">
            <div className="p-2.5 sm:p-3 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-xl">
              <Search className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400" />
            </div>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-foreground via-cyan-400/80 to-foreground bg-clip-text text-transparent">
            Search & Discover
          </h2>
          <p className="text-foreground/60 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto px-4">
            Query multiple platforms with powerful filters and get instant
            insights
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-8 sm:mb-12">
          <div className="bg-accent/40 backdrop-blur-sm border border-border rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 mb-6 relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-cyan-500/5 via-transparent to-transparent pointer-events-none" />

            <div className="relative z-10">
              <label className="block text-sm sm:text-base font-medium mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Keywords (comma-separated)
              </label>
              <div className="relative mb-6 sm:mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40 pointer-events-none" />
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g., technology, programming, AI"
                  className="w-full bg-background/40 border border-border rounded-xl px-12 py-3.5 sm:py-4 text-sm sm:text-base text-foreground placeholder:text-foreground/40 focus:outline-none focus:bg-background/60 focus:border-cyan-500/50 focus:shadow-lg focus:shadow-cyan-500/10 transition-all duration-200"
                  disabled={loading}
                />
              </div>

              <label className="block text-sm sm:text-base font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Select Providers
              </label>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                {AVAILABLE_PROVIDERS.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => toggleProvider(provider.id)}
                    disabled={!provider.enabled || loading}
                    className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-lg sm:rounded-xl font-medium transition-all duration-200 border text-sm sm:text-base ${
                      !provider.enabled
                        ? "bg-accent/20 border-border/50 text-foreground/40 cursor-not-allowed"
                        : selectedProviders.includes(provider.id)
                          ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-300 hover:from-cyan-500/30 hover:to-blue-500/30 shadow-lg shadow-cyan-500/10"
                          : "bg-accent/40 border-border text-foreground hover:bg-accent/60 hover:border-foreground/20"
                    }`}
                  >
                    <span className="flex items-center justify-center gap-1.5 sm:gap-2">
                      {provider.name}
                      {!provider.enabled && (
                        <span className="text-xs opacity-70">(Soon)</span>
                      )}
                      {provider.enabled &&
                        selectedProviders.includes(provider.id) && (
                          <CheckCircle className="inline-block w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/40 rounded-xl p-4 mb-6 text-red-300 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-2">
                <div className="mt-0.5">⚠️</div>
                <span className="text-sm sm:text-base">{error}</span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full py-5 sm:py-6 text-base sm:text-lg font-semibold rounded-xl sm:rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 transition-all duration-300"
            disabled={
              loading || !keywords.trim() || selectedProviders.length === 0
            }
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                <span>Processing Query...</span>
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                <span>Execute Query</span>
              </>
            )}
          </Button>
        </form>

        {query && (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Status Card */}
            <div className="bg-accent/40 backdrop-blur-sm border border-border rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6">
                <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  Query Status
                </h3>
                <span
                  className={`px-4 py-2 rounded-lg text-sm font-medium inline-block text-center ${
                    query.status === "COMPLETED"
                      ? "bg-green-500/20 text-green-300 border border-green-500/30"
                      : query.status === "FAILED"
                        ? "bg-red-500/20 text-red-300 border border-red-500/30"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  }`}
                >
                  {query.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-background/40 rounded-xl p-4 border border-border/50">
                  <p className="text-foreground/60 text-xs sm:text-sm mb-2 font-medium">
                    Keywords
                  </p>
                  <p className="text-foreground text-sm sm:text-base font-semibold">
                    {query.keywords.join(", ")}
                  </p>
                </div>
                <div className="bg-background/40 rounded-xl p-4 border border-border/50">
                  <p className="text-foreground/60 text-xs sm:text-sm mb-2 font-medium">
                    Platforms
                  </p>
                  <p className="text-foreground text-sm sm:text-base font-semibold">
                    {query.platforms.join(", ")}
                  </p>
                </div>
                <div className="bg-background/40 rounded-xl p-4 border border-border/50 sm:col-span-2 lg:col-span-1">
                  <p className="text-foreground/60 text-xs sm:text-sm mb-2 font-medium">
                    Total Results
                  </p>
                  <p className="text-foreground text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    {query.totalResults}
                  </p>
                </div>
              </div>
            </div>

            {/* Results Section */}
            {query.results && query.results.length > 0 ? (
              query.results.map((result, index) => {
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
              })
            ) : query.status === "COMPLETED" ? (
              <div className="bg-accent/40 backdrop-blur-sm border border-border rounded-2xl p-12 sm:p-16 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-full flex items-center justify-center">
                    <Search className="w-8 h-8 text-yellow-400" />
                  </div>
                  <p className="text-foreground/60 text-base sm:text-lg font-medium">
                    No results found
                  </p>
                  <p className="text-foreground/40 text-sm mt-2">
                    Try adjusting your keywords or selecting different platforms
                  </p>
                </div>
              </div>
            ) : query.status === "PROCESSING" ? (
              <div className="bg-accent/40 backdrop-blur-sm border border-border rounded-2xl p-12 sm:p-16 text-center">
                <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 text-cyan-400 animate-spin mx-auto mb-6" />
                <p className="text-foreground/60 text-base sm:text-lg font-medium">
                  Query is processing...
                </p>
                <p className="text-foreground/40 text-sm mt-2">
                  This may take a few moments
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Layout>
  );
}
