import { useNavigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Menu, X } from "lucide-react";

export function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setMobileMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
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
          Infocollection
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
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
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
                {user && (
                  <div className="flex items-center gap-2">
                    {user.image && (
                      <img
                        src={user.image}
                        alt={user.name || "User"}
                        className="w-8 h-8 rounded-full ring-2 ring-border"
                      />
                    )}
                    <span className="text-sm font-medium hidden lg:inline-block">
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

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-full"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[60px] bottom-0 bg-background/95 backdrop-blur-lg border-t border-border animate-fade-in">
          <nav className="flex flex-col p-4 space-y-2">
            {isAuthenticated ? (
              <>
                {user && (
                  <div className="flex items-center gap-3 p-4 bg-accent/40 rounded-lg mb-4">
                    {user.image && (
                      <img
                        src={user.image}
                        alt={user.name || "User"}
                        className="w-12 h-12 rounded-full ring-2 ring-border"
                      />
                    )}
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-sm text-foreground/60">{user.email}</p>
                    </div>
                  </div>
                )}
                <Button
                  onClick={() => handleNavigation("/feed")}
                  variant={pathname.startsWith("/feed") ? "secondary" : "ghost"}
                  className="w-full justify-start text-lg py-6"
                  size="lg"
                >
                  Feed
                </Button>
                <Button
                  onClick={() => handleNavigation("/surf")}
                  variant={pathname.startsWith("/surf") ? "secondary" : "ghost"}
                  className="w-full justify-start text-lg py-6"
                  size="lg"
                >
                  Surf
                </Button>
                <div className="pt-4 mt-4 border-t border-border">
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full justify-start text-lg py-6"
                    size="lg"
                  >
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <Button
                onClick={() => handleNavigation("/login")}
                variant="default"
                className="w-full text-lg py-6"
                size="lg"
              >
                Sign In
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
