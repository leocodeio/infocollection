import { Button } from "../components/ui/button";
import { Search, Loader2, CheckCircle } from "lucide-react";
import { useState } from "react";
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Search & Discover
          </h2>
          <p className="text-foreground/60 text-lg">
            Query multiple platforms with powerful filters
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="bg-accent/40 border border-border rounded-lg p-6 mb-6">
            <label className="block text-sm font-medium mb-3">
              Keywords (comma-separated)
            </label>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40 pointer-events-none" />
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g., technology, programming, AI"
                className="w-full bg-background/40 border border-border rounded-lg px-12 py-3 text-foreground placeholder:text-foreground/40 focus:outline-none focus:bg-background/60 focus:border-foreground/30 transition-all duration-200"
                disabled={loading}
              />
            </div>

            <label className="block text-sm font-medium mb-3">
              Select Providers
            </label>
            <div className="flex flex-wrap gap-3">
              {AVAILABLE_PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  type="button"
                  onClick={() => toggleProvider(provider.id)}
                  disabled={!provider.enabled || loading}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 border ${
                    !provider.enabled
                      ? "bg-accent/20 border-border/50 text-foreground/40 cursor-not-allowed"
                      : selectedProviders.includes(provider.id)
                        ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30"
                        : "bg-accent/40 border-border text-foreground hover:bg-accent/60"
                  }`}
                >
                  {provider.name}
                  {!provider.enabled && (
                    <span className="ml-2 text-xs">(Coming Soon)</span>
                  )}
                  {provider.enabled &&
                    selectedProviders.includes(provider.id) && (
                      <CheckCircle className="inline-block w-4 h-4 ml-2" />
                    )}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4 mb-6 text-red-300">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full py-6 text-lg"
            disabled={
              loading || !keywords.trim() || selectedProviders.length === 0
            }
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing Query...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Execute Query
              </>
            )}
          </Button>
        </form>

        {query && (
          <div className="space-y-8">
            <div className="bg-accent/40 border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Query Status</h3>
                <span
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    query.status === "COMPLETED"
                      ? "bg-green-500/20 text-green-300"
                      : query.status === "FAILED"
                        ? "bg-red-500/20 text-red-300"
                        : "bg-blue-500/20 text-blue-300"
                  }`}
                >
                  {query.status}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-foreground/60 text-sm mb-1">Keywords</p>
                  <p className="text-foreground">{query.keywords.join(", ")}</p>
                </div>
                <div>
                  <p className="text-foreground/60 text-sm mb-1">Platforms</p>
                  <p className="text-foreground">
                    {query.platforms.join(", ")}
                  </p>
                </div>
                <div>
                  <p className="text-foreground/60 text-sm mb-1">
                    Total Results
                  </p>
                  <p className="text-foreground text-2xl font-bold">
                    {query.totalResults}
                  </p>
                </div>
              </div>
            </div>

            {query.results && query.results.length > 0 ? (
              query.results.map((result) => {
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
              })
            ) : query.status === "COMPLETED" ? (
              <div className="bg-accent/40 border border-border rounded-lg p-12 text-center">
                <p className="text-foreground/60 text-lg">No results found</p>
              </div>
            ) : query.status === "PROCESSING" ? (
              <div className="bg-accent/40 border border-border rounded-lg p-12 text-center">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
                <p className="text-foreground/60 text-lg">
                  Query is processing...
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Layout>
  );
}
