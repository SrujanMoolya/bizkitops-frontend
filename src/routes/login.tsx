import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — BizkitOps" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const searchParams = new URLSearchParams(window.location.search);
        const mobileRedirect = searchParams.get("mobileRedirect");
        
        if (mobileRedirect) {
          const delimiter = mobileRedirect.includes("?") ? "&" : "?";
          const targetMobileUrl = `${mobileRedirect}${delimiter}access_token=${encodeURIComponent(
            session.access_token
          )}&refresh_token=${encodeURIComponent(session.refresh_token)}`;
          
          window.location.href = targetMobileUrl;
          return;
        }

        const redirectTo = searchParams.get("redirect") || "/dashboard";
        const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/dashboard";
        navigate({ to: safeRedirect as any });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const searchParams = new URLSearchParams(window.location.search);
    const mobileRedirect = searchParams.get("mobileRedirect");
    const redirectTo = mobileRedirect
      ? `${window.location.origin}/login?mobileRedirect=${encodeURIComponent(mobileRedirect)}`
      : `${window.location.origin}/dashboard`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });
    setGoogleLoading(false);
    if (error) {
      toast.error(error.message);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to manage your shop and operations.">
      {/* Google OAuth Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center justify-center gap-2 py-5 rounded-xl border-border bg-card hover:bg-muted/40 font-semibold text-sm transition"
        onClick={handleGoogleSignIn}
        disabled={googleLoading || loading}
      >
        {googleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        Continue with Google
      </Button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3.5 text-muted-foreground font-semibold tracking-wider">
            Or continue with email
          </span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            Work Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="name@company.com"
              autoComplete="email"
              required
              className="pl-9 py-5 rounded-xl bg-card border-border"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
              Password
            </Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="pl-9 py-5 rounded-xl bg-card border-border"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full py-5 rounded-xl bg-primary text-primary-foreground font-bold shadow-soft hover:bg-primary/95 flex items-center justify-center gap-1.5 transition"
          disabled={loading || googleLoading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Sign in <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Switch to Register */}
      <p className="text-sm text-muted-foreground text-center mt-6">
        New to BizkitOps?{" "}
        <Link to="/register" className="text-primary font-bold hover:underline">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
