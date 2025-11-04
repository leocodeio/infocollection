import { useNavigate } from "react-router-dom";
import { ArrowRight, Play, Sparkles, Zap, Target } from "lucide-react";
import { Button } from "../components/ui/button";
import { Layout } from "../components/Layout";

export function Landing() {
  const navigate = useNavigate();

  return (
    <Layout padTop={false}>
      <section className="min-h-screen flex items-center justify-center px-4 py-20 pt-24 sm:pt-32 relative overflow-hidden">
        {/* Enhanced gradient backgrounds for both themes */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 dark:bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-2000" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/60 dark:bg-accent/40 backdrop-blur-md border border-border mb-6 sm:mb-8 animate-fade-in shadow-lg">
            <Sparkles className="w-4 h-4 mr-2 text-cyan-500" />
            <span className="text-sm font-medium">Welcome to the Platform</span>
            <span className="w-2 h-2 bg-cyan-500 rounded-full ml-2 animate-pulse" />
          </div>

          {/* Main heading with improved responsive sizing */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 animate-fade-in leading-tight px-4">
            Discover and Share
            <span className="block bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 dark:from-blue-400 dark:via-cyan-400 dark:to-blue-500 bg-clip-text text-transparent mt-2 animate-gradient bg-[length:200%_auto]">
              Amazing Content
            </span>
          </h1>

          {/* Description with better contrast */}
          <p className="text-base sm:text-lg md:text-xl text-foreground/80 dark:text-foreground/70 max-w-2xl mx-auto mb-10 sm:mb-12 animate-fade-in leading-relaxed px-4">
            Explore an infinite feed of curated content or search for exactly
            what you're looking for. Your next favorite discovery is just a
            click away.
          </p>

          {/* CTA buttons with improved mobile layout */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-fade-in px-4 mb-16 sm:mb-20">
            <Button
              onClick={() => navigate("/feed")}
              size="lg"
              className="w-full sm:w-auto rounded-full px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-xl group cursor-pointer relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-500 dark:to-cyan-500"
            >
              Start Exploring
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              onClick={() => navigate("/surf")}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto rounded-full px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg font-medium transition-all duration-200 hover:scale-105 hover:shadow-lg group bg-transparent border-2 cursor-pointer"
            >
              <Play className="mr-2 h-5 w-5" />
              Search Directly
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-3xl mx-auto mb-16 sm:mb-20 px-4 animate-fade-in">
            <div className="flex flex-col items-center text-center p-4 sm:p-6 rounded-2xl bg-accent/30 dark:bg-accent/20 backdrop-blur-sm border border-border/50 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 dark:bg-blue-500/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-500 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">Lightning Fast</h3>
              <p className="text-sm text-foreground/60 dark:text-foreground/50">
                Instant search across multiple platforms
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 sm:p-6 rounded-2xl bg-accent/30 dark:bg-accent/20 backdrop-blur-sm border border-border/50 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg">
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 dark:bg-cyan-500/10 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-cyan-500 dark:text-cyan-400" />
              </div>
              <h3 className="font-semibold mb-2">Precise Results</h3>
              <p className="text-sm text-foreground/60 dark:text-foreground/50">
                Advanced filtering for exact matches
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 sm:p-6 rounded-2xl bg-accent/30 dark:bg-accent/20 backdrop-blur-sm border border-border/50 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 dark:bg-purple-500/10 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-purple-500 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold mb-2">Smart Analytics</h3>
              <p className="text-sm text-foreground/60 dark:text-foreground/50">
                Track and export your discoveries
              </p>
            </div>
          </div>

          {/* Social proof */}
          <div className="text-center animate-fade-in opacity-70 px-4">
            <p className="text-xs sm:text-sm text-foreground/50 dark:text-foreground/40 mb-4 sm:mb-6">
              Trusted by creators and explorers worldwide
            </p>
            <div className="flex justify-center gap-6 sm:gap-8 text-foreground/40 dark:text-foreground/30 text-xs sm:text-sm font-medium flex-wrap">
              <span className="hover:text-foreground/60 transition-colors">
                TechCorp
              </span>
              <span className="hover:text-foreground/60 transition-colors">
                Creative Hub
              </span>
              <span className="hover:text-foreground/60 transition-colors">
                InnovateLab
              </span>
              <span className="hover:text-foreground/60 transition-colors">
                DataFlow
              </span>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
