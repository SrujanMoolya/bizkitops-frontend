import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IndustryModulePage } from "@/components/industry/IndustryModulePage";
import { getIndustryModule } from "@/lib/industry-modules";
import { RoutePending, RouteError } from "@/components/dashboard/page-shell";

export const Route = createFileRoute("/_authenticated/dashboard/industry/$moduleKey")({
  head: ({ params }) => ({
    meta: [
      { title: `${getIndustryModule(params.moduleKey)?.name ?? "Industry module"} — BizkitOps` },
    ],
  }),
  component: IndustryRoute,
  pendingComponent: RoutePending,
  errorComponent: RouteError,
});

function IndustryRoute() {
  const { moduleKey } = Route.useParams();
  const mod = getIndustryModule(moduleKey);

  if (!mod) {
    return (
      <Card className="max-w-lg">
        <CardContent className="py-8 space-y-3">
          <p className="font-semibold">This industry module does not exist.</p>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard/modules">Browse the Module Store</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // key resets the page state when switching between industry modules
  return <IndustryModulePage key={mod.key} mod={mod} />;
}
