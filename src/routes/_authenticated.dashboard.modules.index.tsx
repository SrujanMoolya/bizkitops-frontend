import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-shell";
import { MODULES, canAccessModule, type PlanKey } from "@/lib/modules";
import { listInstalledModules, toggleModule } from "@/lib/modules-store.functions";
import { useBusiness, businessQueryOptions } from "@/hooks/use-business";
import { upgradeBusinessPlan } from "@/lib/payment.functions";
import { triggerRazorpayPayment } from "@/lib/razorpay";
import { toast } from "sonner";
import { RoutePending, RouteError } from "@/components/dashboard/page-shell";
import {
  Receipt,
  Wallet,
  Package,
  Users,
  Calendar,
  Globe,
  Shield,
  BarChart3,
  Lock,
  Check,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Car,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Receipt,
  Wallet,
  Package,
  Users,
  Calendar,
  Globe,
  Shield,
  BarChart3,
  Car,
};

const modulesOptions = queryOptions({
  queryKey: ["installed-modules"],
  queryFn: () => listInstalledModules(),
});

export const Route = createFileRoute("/_authenticated/dashboard/modules/")({
  head: () => ({ meta: [{ title: "Module store — BizkitOps" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(modulesOptions),
  component: ModulesPage,
  pendingComponent: RoutePending,
  errorComponent: RouteError,
});

function ModulesPage() {
  const qc = useQueryClient();
  const { data: bizData } = useBusiness();
  const plan = (bizData.business?.plan ?? "trial") as PlanKey;
  const { data: installed } = useSuspenseQuery(modulesOptions);
  const enabledSet = new Map(installed.map((m) => [m.module_key, m.is_active]));

  const [isUpgrading, setIsUpgrading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const triggerUpgrade = useServerFn(upgradeBusinessPlan);

  const handleUpgrade = async (planKey: "basic" | "pro", cycle: "monthly" | "yearly", priceINR: number) => {
    setIsUpgrading(true);
    try {
      await triggerRazorpayPayment({
        amount: priceINR * 100, // in paise
        name: "BizkitOps SaaS",
        description: `Upgrade to ${planKey.toUpperCase()} Plan (${cycle})`,
        prefill: {
          name: bizData.profile?.full_name || "",
          email: bizData.profile?.email || "",
          contact: bizData.profile?.phone || "",
        },
        onSuccess: async (paymentId) => {
          try {
            await triggerUpgrade({ data: { plan: planKey, billingCycle: cycle } });
            toast.success(`Plan successfully upgraded to ${planKey.toUpperCase()}!`);
            // Invalidate queries to update layouts and states
            await qc.invalidateQueries({ queryKey: businessQueryOptions.queryKey });
            await qc.invalidateQueries({ queryKey: ["installed-modules"] });
          } catch (err) {
            toast.error(`Plan updated, but dashboard sync failed: ${(err as Error).message}`);
          } finally {
            setIsUpgrading(false);
          }
        },
        onDismiss: () => {
          setIsUpgrading(false);
          toast.info("Payment cancelled.");
        },
      });
    } catch (err) {
      toast.error(`Payment initiation failed: ${(err as Error).message}`);
      setIsUpgrading(false);
    }
  };

  const tog = useServerFn(toggleModule);
  const m = useMutation({
    mutationFn: tog,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["installed-modules"] }),
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Module store"
        description="Turn modules on or off. Add only what your business needs."
      />

      {plan !== "pro" && plan !== "custom" && (
        <div className="mb-6 border border-border/80 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Upgrade Your Plan</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Unlock advanced tools like CRM, online appointment booking, and staff manager.
              </p>
            </div>
            <Badge variant="secondary" className="px-3 py-1 bg-amber-500/10 text-amber-500 border-amber-500/20 capitalize font-medium">
              Current Plan: {plan}
            </Badge>
          </div>

          {/* Billing Cycle Switch */}
          <div className="flex justify-start mb-6">
            <div className="relative flex items-center p-1 bg-muted border border-border rounded-full shadow-inner max-w-[240px] w-full">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`flex-1 py-1 text-xs font-semibold rounded-full transition-all duration-300 ${
                  billingCycle === "monthly"
                    ? "bg-card text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle("yearly")}
                className={`flex-1 py-1 text-xs font-semibold rounded-full transition-all duration-300 relative ${
                  billingCycle === "yearly"
                    ? "bg-card text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Yearly
                <span className="absolute -top-3 -right-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                  -21%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Card */}
            <Card className="relative overflow-hidden border border-slate-200 shadow-sm flex flex-col justify-between">
              {plan === "basic" && (
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-bl-lg">
                  Current Plan
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold">Basic Plan</CardTitle>
                <CardDescription className="text-xs">For small retail and storefronts.</CardDescription>
                <div className="mt-3">
                  {billingCycle === "monthly" ? (
                    <div>
                      <span className="text-3xl font-bold">₹499</span>
                      <span className="text-muted-foreground text-xs font-normal"> / month</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold">₹394</span>
                      <span className="text-muted-foreground text-xs font-normal"> / month</span>
                      <p className="text-[10px] text-violet-600 font-semibold mt-1">Billed annually at ₹4,730/yr (Save 21%)</p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-6">
                <ul className="text-xs space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-1.5 text-foreground">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" /> GST Invoicing & Expense logs
                  </li>
                  <li className="flex items-center gap-1.5 text-foreground">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" /> Inventory management
                  </li>
                  <li className="flex items-center gap-1.5 text-foreground">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" /> Customizable Storefront
                  </li>
                  <li className="flex items-center gap-1.5 text-foreground">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" /> Financial Reports & Analytics
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pt-0 pb-6">
                <Button
                  onClick={() => handleUpgrade("basic", billingCycle, billingCycle === "monthly" ? 499 : 4730)}
                  disabled={plan === "basic" || isUpgrading}
                  className="w-full font-semibold"
                  variant={plan === "basic" ? "outline" : "default"}
                >
                  {isUpgrading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                  {plan === "basic" ? "Current Plan" : "Upgrade to Basic"}
                </Button>
              </CardFooter>
            </Card>

            {/* Pro Card */}
            <Card className="relative overflow-hidden border border-primary/40 bg-gradient-to-b from-primary/5 via-transparent to-transparent shadow-md flex flex-col justify-between">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-bl-lg">
                Popular
              </div>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-1.5">
                  Pro Plan <Sparkles className="h-4 w-4 text-amber-500 fill-amber-500" />
                </CardTitle>
                <CardDescription className="text-xs">Everything you need to grow your team.</CardDescription>
                <div className="mt-3">
                  {billingCycle === "monthly" ? (
                    <div>
                      <span className="text-3xl font-bold">₹1,499</span>
                      <span className="text-muted-foreground text-xs font-normal"> / month</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-3xl font-bold">₹1,184</span>
                      <span className="text-muted-foreground text-xs font-normal"> / month</span>
                      <p className="text-[10px] text-violet-600 font-semibold mt-1">Billed annually at ₹14,210/yr (Save 21%)</p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pb-6">
                <ul className="text-xs space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-1.5 text-foreground">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" /> Everything in Basic Plan
                  </li>
                  <li className="flex items-center gap-1.5 text-foreground">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" /> CRM & Lead Pipelines
                  </li>
                  <li className="flex items-center gap-1.5 text-foreground">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" /> Online Customer Booking Calendar
                  </li>
                  <li className="flex items-center gap-1.5 text-foreground">
                    <Check className="h-3.5 w-3.5 text-primary shrink-0" /> Staff & Permission management
                  </li>
                </ul>
              </CardContent>
              <CardFooter className="pt-0 pb-6">
                <Button
                  onClick={() => handleUpgrade("pro", billingCycle, billingCycle === "monthly" ? 1499 : 14210)}
                  disabled={isUpgrading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                >
                  {isUpgrading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                  Upgrade to Pro
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-lg font-bold">Available Modules</h3>
          <Button asChild variant="link" size="sm" className="h-auto p-0 font-semibold text-primary">
            <Link to="/dashboard/billing">View plan details table</Link>
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map((mod) => {
            const Icon = ICONS[mod.icon] ?? Package;
            const allowed = canAccessModule(plan, mod.key, bizData.business?.trial_ends_at);
            const enabled = enabledSet.get(mod.key) ?? false;
            return (
              <Card key={mod.key} className={!allowed ? "opacity-75 relative" : ""}>
                <CardHeader className="flex flex-row items-start gap-3 space-y-0 pb-3">
                  <div className="h-10 w-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {mod.name}
                      {!allowed && <Lock className="h-3 w-3 text-muted-foreground shrink-0" />}
                    </CardTitle>
                    <CardDescription className="text-xs">{mod.category}</CardDescription>
                  </div>
                  <Switch
                    checked={enabled}
                    disabled={!allowed || m.isPending}
                    onCheckedChange={(v) => {
                      m.mutate(
                        { data: { module_key: mod.key, enabled: v } },
                        {
                          onSuccess: () =>
                            toast.success(v ? `${mod.name} enabled` : `${mod.name} disabled`),
                        },
                      );
                    }}
                  />
                </CardHeader>
                <CardContent className="pb-4">
                  <p className="text-xs text-muted-foreground leading-normal">{mod.description}</p>
                  {!allowed && (
                    <div className="mt-3 flex items-center justify-between">
                      <Badge variant="outline" className="capitalize text-[10px]">
                        Requires {mod.minPlan}
                      </Badge>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => handleUpgrade(mod.minPlan as "basic" | "pro", billingCycle, billingCycle === "monthly" ? (mod.minPlan === "pro" ? 1499 : 499) : (mod.minPlan === "pro" ? 14210 : 4730))}
                        className="h-auto p-0 text-primary text-xs flex items-center gap-0.5 font-semibold"
                      >
                        Upgrade <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
