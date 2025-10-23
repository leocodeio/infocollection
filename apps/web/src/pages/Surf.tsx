import { useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Search } from "lucide-react";
import { useState } from "react";
import { Layout } from "../components/Layout";

export function Surf() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState(searchParams.get("q") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setSearchParams({ q: input });
    }
  };

  const currentQuery = searchParams.get("q");

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Search & Surf</h2>
          <p className="text-foreground/60 text-lg">
            Find exactly what you're looking for
          </p>
        </div>

        <form onSubmit={handleSearch} className="mb-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40 pointer-events-none" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search for anything..."
              className="w-full bg-accent/40 border border-border rounded-full px-12 py-4 text-foreground placeholder:text-foreground/40 focus:outline-none focus:bg-accent/60 focus:border-foreground/30 transition-all duration-200"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-full font-medium transition-all duration-200 hover:scale-105"
            >
              Search
            </button>
          </div>
        </form>

        {currentQuery ? (
          <div className="text-center">
            <h3 className="text-2xl font-semibold mb-4">
              Results for "<span className="text-cyan-400">{currentQuery}</span>
              "
            </h3>
            <p className="text-foreground/60 mb-8">
              No results yet. Implementation coming soon.
            </p>
            <Button
              onClick={() => setSearchParams({})}
              variant="outline"
              className="border-border hover:bg-accent/60"
            >
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-foreground/60 text-lg">
              Start typing to search for content
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
