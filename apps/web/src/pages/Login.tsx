import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { loginWithGoogle } from "../lib/auth";
import { Loader2, Sparkles, Shield, Zap } from "lucide-react";
import { Button } from "../components/ui/button";

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setSigningIn(true);
      await loginWithGoogle();
    } catch (error) {
      console.error("Failed to sign in with Google:", error);
      setSigningIn(false);
      alert("Failed to sign in with Google. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mx-auto" />
          <p className="mt-4 text-foreground/60">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4 py-8 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 sm:p-10 backdrop-blur-sm">
          {/* Logo/Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 mb-4 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
            <p className="text-foreground/60">
              Sign in to continue your journey
            </p>
          </div>

          {/* Sign in button */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full py-6 text-base font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-accent text-gray-900 dark:text-foreground border-2 border-border hover:border-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            variant="outline"
          >
            {signingIn ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          {/* Features */}
          <div className="mt-8 pt-8 border-t border-border space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">
                  Secure Authentication
                </h3>
                <p className="text-xs text-foreground/60">
                  Your data is protected with industry-standard security
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1">Instant Access</h3>
                <p className="text-xs text-foreground/60">
                  Get started in seconds with your Google account
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-foreground/50 mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
