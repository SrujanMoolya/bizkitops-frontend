import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IndustryNoticeBannerProps {
  title: string;
  message: string;
  actionText: string;
  actionHref: string;
  storageKey: string;
  colorTheme?: "amber" | "emerald" | "blue" | "purple";
}

export function IndustryNoticeBanner({
  title,
  message,
  actionText,
  actionHref,
  storageKey,
  colorTheme = "amber",
}: IndustryNoticeBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(`bizkitops_dismiss_notice_${storageKey}`) === "true";
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(`bizkitops_dismiss_notice_${storageKey}`, "true");
    } catch (e) {
      console.error(e);
    }
  };

  const themeClasses = {
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
    blue: "border-blue-500/30 bg-blue-500/10 text-blue-900 dark:text-blue-200",
    purple: "border-purple-500/30 bg-purple-500/10 text-purple-900 dark:text-purple-200",
  }[colorTheme];

  const iconClasses = {
    amber: "text-amber-600 dark:text-amber-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    blue: "text-blue-600 dark:text-blue-400",
    purple: "text-purple-600 dark:text-purple-400",
  }[colorTheme];

  return (
    <div className={`mb-6 p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm transition-all ${themeClasses}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <Sparkles className={`h-4 w-4 shrink-0 ${iconClasses}`} />
        <div className="truncate">
          <span className="font-bold mr-1.5">{title}:</span>
          <span className="opacity-90">{message}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button asChild size="sm" variant="ghost" className="h-7 text-xs font-semibold gap-1 hover:bg-black/5 dark:hover:bg-white/10">
          <Link to={actionHref}>
            {actionText}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-opacity"
          title="Dismiss note"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
