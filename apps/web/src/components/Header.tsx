import { useNavigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

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
          {isAuthenticated ? (
            <>
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
              <div className="flex items-center gap-2 ml-2 pl-2 border-l">
                {user && (
                  <div className="flex items-center gap-2">
                    {user.image && (
                      <img
                        src={user.image}
                        alt={user.name || "User"}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span className="text-sm font-medium hidden sm:inline-block">
                      {user.name}
                    </span>
                  </div>
                )}
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="rounded-full"
                >
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <Button
              onClick={() => navigate("/login")}
              variant="default"
              className="rounded-full"
            >
              Sign In
            </Button>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
