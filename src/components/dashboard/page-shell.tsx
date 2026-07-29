import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, AlertTriangle, RefreshCw, type LucideIcon } from "lucide-react";
import { useRouter } from "@tanstack/react-router";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-12 sm:py-16 text-center px-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary-soft text-primary flex items-center justify-center mb-4">
          <Icon className="h-6 w-6" />
        </div>
        <p className="font-display text-lg font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{description}</p>
        {action && (
          <Button onClick={action.onClick} className="mt-4 gap-1">
            <Plus className="h-4 w-4" />
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold truncate">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="shadow-soft">
          <CardHeader className="pb-2">
            <Skeleton className="h-3 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-7 w-24 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-16 hidden sm:block" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function PageSkeleton({ withStats = true, rows = 6 }: { withStats?: boolean; rows?: number }) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {withStats && <StatsSkeleton />}
      <TableSkeleton rows={rows} />
    </div>
  );
}

export function ErrorState({
  error,
  title = "Something went wrong",
  onRetry,
}: {
  error?: Error | { message?: string };
  title?: string;
  onRetry?: () => void;
}) {
  const router = useRouter();
  const message =
    (error && "message" in error && error.message) || "We couldn't load this page. Please try again.";

  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <CardContent className="py-10 sm:py-14 text-center px-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-4">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <p className="font-display text-lg font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto break-words">{message}</p>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          <Button
            onClick={() => {
              router.invalidate();
              onRetry?.();
            }}
            variant="outline"
            className="gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function RouteError({ error }: { error: Error }) {
  return (
    <div className="p-4 md:p-6">
      <ErrorState error={error} />
    </div>
  );
}

export function RoutePending() {
  return (
    <div className="p-4 md:p-6">
      <PageSkeleton />
    </div>
  );
}
