import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Mail, Phone, Lock, ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Get started — BizkitOps" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
  }>({});

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn("Auth getSession error on register page:", error.message);
          await supabase.auth.signOut().catch(() => {});
          return;
        }
        if (session?.user) {
          const searchParams = new URLSearchParams(window.location.search);
          const redirectTo = searchParams.get("redirect") || "/dashboard";
          const safeRedirect = redirectTo.startsWith("/") ? redirectTo : "/dashboard";
          navigate({ to: safeRedirect as any });
        }
      } catch (e) {
        console.error("checkSession failed:", e);
      }
    };
    checkSession();
  }, [navigate]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // Name validation
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      newErrors.fullName = "Full name is required";
    } else if (trimmedName.length < 2) {
      newErrors.fullName = "Name must be at least 2 characters";
    } else if (!/^[a-zA-Z\s]{2,50}$/.test(trimmedName)) {
      newErrors.fullName = "Name should only contain letters and spaces";
    }

    // Email validation
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation (optional)
    const trimmedPhone = phone.trim();
    if (trimmedPhone) {
      const digitsOnly = trimmedPhone.replace(/\D/g, "");
      if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        newErrors.phone = "Phone number must contain between 10 and 15 digits";
      }
    }

    // Password complexity check
    if (!password) {
      newErrors.password = "Password is required";
    } else {
      if (password.length < 8) {
        newErrors.password = "Password must be at least 8 characters long";
      } else if (!/[A-Z]/.test(password)) {
        newErrors.password = "Password must contain at least one uppercase letter (A-Z)";
      } else if (!/[a-z]/.test(password)) {
        newErrors.password = "Password must contain at least one lowercase letter (a-z)";
      } else if (!/[0-9]/.test(password)) {
        newErrors.password = "Password must contain at least one number (0-9)";
      } else if (!/[^A-Za-z0-9]/.test(password)) {
        newErrors.password = "Password must contain at least one special character (e.g. !@#$%)";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please correct the errors on the form.");
      return;
    }
    setLoading(true);
    const redirectUrl = `${window.location.origin}/dashboard`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName, phone },
      },
    });

    if (error) {
      const isAlreadyExists =
        error.message.toLowerCase().includes("already registered") ||
        error.message.toLowerCase().includes("already exists") ||
        error.status === 422;

      if (isAlreadyExists) {
        // Try logging in directly
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!loginError) {
          setLoading(false);
          toast.success("Welcome back! Logged into your existing account.");
          navigate({ to: "/dashboard" });
          return;
        }
      }
      setLoading(false);
      return toast.error(error.message);
    }

    // Check if user already exists (identities is empty array, meaning sign up is successful but didn't create a new identity)
    if (data?.user && data.user.identities?.length === 0) {
      // Try logging in directly
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!loginError) {
        setLoading(false);
        toast.success("Welcome back! Logged into your existing account.");
        navigate({ to: "/dashboard" });
        return;
      }
      setLoading(false);
      return toast.error("An account with this email already exists. Please log in.");
    }

    setLoading(false);
    toast.success("Account created! Check your email to confirm.");
    navigate({ to: "/dashboard" });
  };

  const handleGoogleSignUp = async () => {
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
    <AuthShell title="Start your 7-day free trial" subtitle="Get access to all premium modules. No card required.">
      {/* Google OAuth Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center justify-center gap-2 py-5 rounded-xl border-border bg-card hover:bg-muted/40 font-semibold text-sm transition"
        onClick={handleGoogleSignUp}
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
        Sign up with Google
      </Button>

      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3.5 text-muted-foreground font-semibold tracking-wider">
            Or register with email
          </span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-3.5">
        {/* Full Name */}
        <div className="space-y-1">
          <Label htmlFor="name" className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            Full Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="name"
              placeholder="Rajesh Kumar"
              required
              className={cn(
                "pl-9 py-5 rounded-xl bg-card border-border",
                errors.fullName && "border-red-500 focus-visible:ring-red-500"
              )}
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
              }}
            />
          </div>
          {errors.fullName && (
            <p className="text-red-500 text-xs mt-1 font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
              {errors.fullName}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <Label htmlFor="email" className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            Work Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="rajesh@store.com"
              required
              className={cn(
                "pl-9 py-5 rounded-xl bg-card border-border",
                errors.email && "border-red-500 focus-visible:ring-red-500"
              )}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
              }}
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-xs mt-1 font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
              {errors.email}
            </p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <Label htmlFor="phone" className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            Mobile Number
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="+91 98765 43210"
              className={cn(
                "pl-9 py-5 rounded-xl bg-card border-border",
                errors.phone && "border-red-500 focus-visible:ring-red-500"
              )}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
              }}
            />
          </div>
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1 font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
              {errors.phone}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1">
          <Label htmlFor="password" className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="•••••••• (Min 8 chars, mixed case, number, symbol)"
              required
              className={cn(
                "pl-9 py-5 rounded-xl bg-card border-border",
                errors.password && "border-red-500 focus-visible:ring-red-500"
              )}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
            />
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1 font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
              {errors.password}
            </p>
          )}
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
              Create Trial Account <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Switch to Login */}
      <p className="text-sm text-muted-foreground text-center mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-primary font-bold hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
