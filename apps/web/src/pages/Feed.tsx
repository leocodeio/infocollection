import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Layout } from "../components/Layout";

const BASE_CARDS = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  title: `Card ${i + 1}`,
  description: `This is a demo card with some interesting content for item ${i + 1}`,
  category: ["Technology", "Design", "Business", "Lifestyle"][i % 4],
}));

function CardSkeleton() {
  return (
    <div className="bg-accent/40 border border-border rounded-lg p-6 animate-pulse">
      <div className="h-4 bg-foreground/10 rounded w-3/4 mb-4" />
      <div className="h-20 bg-foreground/10 rounded w-full mb-4" />
      <div className="h-3 bg-foreground/10 rounded w-1/3" />
    </div>
  );
}

function Card({ id, title, description, category }: (typeof BASE_CARDS)[0]) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/feed/${id}`)}
      className="bg-accent/40 border border-border rounded-lg p-6 hover:bg-accent/60 hover:border-foreground/20 transition-all duration-300 cursor-pointer group text-left"
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold group-hover:text-cyan-400 transition-colors">
          {title}
        </h3>
        <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
          {category}
        </span>
      </div>
      <p className="text-foreground/70 text-sm leading-relaxed mb-4">
        {description}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-foreground/50">2 hours ago</span>
        <span className="text-xs font-medium text-cyan-400 group-hover:text-cyan-300">
          View →
        </span>
      </div>
    </button>
  );
}

export function Feed() {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const cards = useMemo(() => {
    const size = page * 12;
    const repeats = Math.ceil(size / BASE_CARDS.length);
    return Array.from({ length: repeats })
      .flatMap(() => BASE_CARDS)
      .slice(0, size)
      .map((c, idx) => ({ ...c, id: idx }));
  }, [page]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !loading) {
          setLoading(true);
          setTimeout(() => {
            setPage((p) => p + 1);
            setLoading(false);
          }, 600);
        }
      },
      { rootMargin: "200px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading]);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2">Your Feed</h2>
          <p className="text-foreground/60">
            Infinite scroll of curated content
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Card key={card.id} {...card} />
          ))}
          {loading &&
            Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={`skeleton-${i}`} />
            ))}
        </div>

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
      </div>
    </Layout>
  );
}
