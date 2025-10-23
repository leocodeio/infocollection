import { useNavigate, useParams } from "react-router-dom";
import { Share2, MessageCircle, Heart } from "lucide-react";
import { useState } from "react";
import { Layout } from "../components/Layout";

export function FeedDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isLiked, setIsLiked] = useState(false);

  const cardData = {
    id,
    title: `Card ${id}`,
    description: `This is a detailed view of card ${id}. This content section can be expanded with more information, images, videos, or other interactive elements.`,
    category: ["Technology", "Design", "Business", "Lifestyle"][Number(id) % 4],
    content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

This is where you could add rich content, images, videos, and interactive elements specific to this item.`,
    author: "John Doe",
    timestamp: "2 hours ago",
    views: 1234,
    likes: 567,
    comments: 89,
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="bg-accent/40 border border-border rounded-lg p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                {cardData.category}
              </span>
              <span className="text-sm text-foreground/50">
                {cardData.timestamp}
              </span>
            </div>
            <h1 className="text-4xl font-bold mb-4">{cardData.title}</h1>
            <div className="flex items-center gap-4 text-foreground/70 text-sm">
              <span>By {cardData.author}</span>
              <span>•</span>
              <span>{cardData.views.toLocaleString()} views</span>
            </div>
          </div>

          <div className="prose prose-invert max-w-none mb-8">
            <div className="h-96 bg-gradient-to-br from-blue-900/30 to-cyan-900/30 border border-border rounded-lg mb-8 flex items-center justify-center">
              <span className="text-foreground/40">Featured Image/Media</span>
            </div>

            <div className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
              {cardData.content}
            </div>
          </div>

          <div className="border-t border-border pt-8">
            <div className="flex items-center gap-8 mb-8">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className="flex items-center gap-2 text-foreground/70 hover:text-red-400 transition-colors"
              >
                <Heart
                  className={`w-5 h-5 ${isLiked ? "fill-red-400 text-red-400" : ""}`}
                />
                <span className="text-sm">{cardData.likes}</span>
              </button>
              <button className="flex items-center gap-2 text-foreground/70 hover:text-cyan-400 transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm">{cardData.comments}</span>
              </button>
              <button className="flex items-center gap-2 text-foreground/70 hover:text-cyan-400 transition-colors">
                <Share2 className="w-5 h-5" />
                <span className="text-sm">Share</span>
              </button>
            </div>

            <div className="bg-accent/40 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Comments</h3>
              <p className="text-foreground/60 text-sm">
                Comments section coming soon...
              </p>
            </div>
          </div>
        </article>

        <div className="mt-12">
          <h3 className="text-2xl font-bold mb-6">Related Cards</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <button
                key={i}
                onClick={() => navigate(`/feed/${Number(id) + i + 1}`)}
                className="bg-accent/40 border border-border rounded-lg p-6 hover:bg-accent/60 hover:border-foreground/20 transition-all duration-300 text-left"
              >
                <h4 className="font-semibold mb-2">
                  Related Card {Number(id) + i + 1}
                </h4>
                <p className="text-sm text-foreground/60">
                  Quick preview of related content...
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
