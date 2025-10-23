import { useNavigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

export function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={
        "fixed top-0 w-full z-50 border-b border-border/60 backdrop-blur-md transition-all " +
        (scrolled
          ? "bg-background/70 supports-[backdrop-filter]:bg-background/50 shadow-sm"
          : "bg-background/60 supports-[backdrop-filter]:bg-background/40")
      }
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="text-xl font-semibold tracking-tight hover:opacity-80 transition-opacity"
        >
          Logo
        </button>
        <nav className="flex items-center gap-2">
          <Button
            onClick={() => navigate("/feed")}
            variant={pathname.startsWith("/feed") ? "secondary" : "ghost"}
            className="rounded-full"
          >
            Feed
          </Button>
          <Button
            onClick={() => navigate("/surf")}
            variant={pathname.startsWith("/surf") ? "secondary" : "ghost"}
            className="rounded-full"
          >
            Surf
          </Button>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
