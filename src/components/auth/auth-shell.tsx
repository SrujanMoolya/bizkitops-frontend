import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CheckCircle2, Star, Sparkles, TrendingUp } from "lucide-react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden font-sans">
      {/* Visual Left Panel (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-secondary text-secondary-foreground relative flex-col justify-between p-12 overflow-hidden border-r border-border">
        {/* Soft glowing ambient blobs */}
        <div className="absolute top-[10%] left-[-10%] w-[30rem] h-[30rem] bg-primary/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-[10%] right-[-10%] w-[25rem] h-[25rem] bg-accent/8 rounded-full blur-[90px] pointer-events-none animate-pulse" />

        {/* Top Header */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="BizkitOps Logo" className="h-9 w-9 object-contain rounded-xl shadow-soft" />
            <span className="font-display text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              BizkitOps
            </span>
          </Link>
        </div>

        {/* Middle Branding/Marketing Content */}
        <div className="relative z-10 max-w-lg space-y-8 my-auto">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft/80 px-3.5 py-1 text-xs font-semibold text-primary shadow-soft">
              <Sparkles className="h-3.5 w-3.5" /> MSME Business Suite 2026
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Make money, <br />
              track money 💵
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Join thousands of Indian retail outlets, Kiranas, agencies, and agencies running their business on a secure, single-dashboard system.
            </p>
          </div>

          {/* Core lists */}
          <ul className="space-y-3.5 text-sm">
            <li className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="font-medium text-muted-foreground">GST-ready Invoicing & Stamp seals</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="font-medium text-muted-foreground">Auto Stock Alerts & Product catalogs</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <span className="font-medium text-muted-foreground">Customer booking slots storefronts</span>
            </li>
          </ul>

          {/* Testimonial Glassmorphism Card */}
          <div className="rounded-2xl border border-border bg-card/65 backdrop-blur p-5 shadow-card space-y-3">
            <div className="flex gap-0.5 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <p className="text-xs text-muted-foreground italic leading-relaxed">
              "BizkitOps replaced multiple single-use tools. Daily operations are now automated and cash flow leaks are gone."
            </p>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/60 pt-2.5">
              <span className="font-semibold text-foreground">Ramesh Shetty, MD, Coastal Bites</span>
              <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-green-500" /> +32% Profit</span>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="relative z-10 text-xs text-muted-foreground flex justify-between">
          <span>© 2026 BizkitOps. Made in India.</span>
          <div className="flex gap-3">
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </div>

      {/* Right Column (Form container) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between relative bg-background">
        {/* Decorative Floating Blobs for Mobile View */}
        <div className="lg:hidden absolute top-0 left-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Mobile Header */}
        <header className="lg:hidden px-6 py-5 flex items-center justify-between border-b border-border/50 bg-card/40 backdrop-blur">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="BizkitOps Logo" className="h-7 w-7 object-contain rounded" />
            <span className="font-display text-lg font-bold">BizkitOps</span>
          </Link>
        </header>

        {/* Form panel */}
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-2 text-center lg:text-left">
              <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="space-y-4">
              {children}
            </div>
          </div>
        </main>

        {/* Footer info (Mobile only) */}
        <footer className="lg:hidden p-6 text-center text-xs text-muted-foreground border-t border-border/50">
          <span>© 2026 BizkitOps. Made in India.</span>
        </footer>
      </div>
    </div>
  );
}
