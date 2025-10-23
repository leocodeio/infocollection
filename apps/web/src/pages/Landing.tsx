import { useNavigate } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "../components/ui/button";
import { Layout } from "../components/Layout";

export function Landing() {
  const navigate = useNavigate();

  return (
    <Layout padTop={false}>
      <section className="min-h-screen flex items-center justify-center px-4 py-20 pt-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-accent/60 backdrop-blur-md border border-border mb-8 animate-fade-in">
            <span className="w-2 h-2 bg-foreground/60 rounded-full mr-2 animate-pulse" />
            Welcome to the Platform
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 animate-fade-in leading-tight">
            Discover and Share
            <span className="block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mt-2">
              Amazing Content
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-foreground/70 max-w-2xl mx-auto mb-12 animate-fade-in leading-relaxed">
            Explore an infinite feed of curated content or search for exactly
            what you're looking for. Your next favorite discovery is just a
            click away.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <Button
              onClick={() => navigate("/feed")}
              size="lg"
              className="rounded-full px-8 py-6 text-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg group cursor-pointer relative overflow-hidden"
            >
              Start Exploring
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button
              onClick={() => navigate("/surf")}
              variant="outline"
              size="lg"
              className="rounded-full px-8 py-6 text-lg font-medium transition-all duration-200 hover:scale-105 group bg-transparent cursor-pointer"
            >
              <Play className="mr-2 h-5 w-5" />
              Search Directly
            </Button>
          </div>

          <div className="mt-20 text-center animate-fade-in opacity-70">
            <p className="text-sm text-foreground/50 mb-6">
              Trusted by creators and explorers worldwide
            </p>
            <div className="flex justify-center gap-8 text-foreground/40 text-sm font-medium flex-wrap">
              <span>TechCorp</span>
              <span>Creative Hub</span>
              <span>InnovateLab</span>
              <span>DataFlow</span>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
