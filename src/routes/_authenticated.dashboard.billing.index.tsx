import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import {
  Crown,
  Check,
  X,
  Sparkles,
  Zap,
  CreditCard,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  HelpCircle,
  Calendar,
  Layers,
  ArrowUpRight,
  FileText,
  Printer,
  Receipt,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-shell";
import { useBusiness, businessQueryOptions } from "@/hooks/use-business";
import { getBillingInfo } from "@/lib/billing.functions";
import { upgradeBusinessPlan } from "@/lib/payment.functions";
import { triggerRazorpayPayment } from "@/lib/razorpay";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { RoutePending, RouteError } from "@/components/dashboard/page-shell";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";


const billingQueryOptions = queryOptions({
  queryKey: ["billing-info"],
  queryFn: () => getBillingInfo(),
});

export const Route = createFileRoute("/_authenticated/dashboard/billing/")({
  head: () => ({ meta: [{ title: "Billing & Subscription — BizkitOps" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(billingQueryOptions),
  component: BillingPage,
  pendingComponent: RoutePending,
  errorComponent: RouteError,
});

const PLAN_DETAILS = {
  trial: {
    label: "Free Trial",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    icon: Clock,
    description: "Full access to all modules during your trial",
    price: "Free",
  },
  basic: {
    label: "Basic Plan",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: Zap,
    description: "For small retail and storefronts",
    price: "₹499/month",
  },
  pro: {
    label: "Pro Plan",
    color: "bg-violet-500/10 text-violet-500 border-violet-500/20",
    icon: Crown,
    description: "Full access — grow your team and business",
    price: "₹1,499/month",
  },
  custom: {
    label: "Custom Plan",
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    icon: Sparkles,
    description: "Enterprise tailored solution",
    price: "Custom",
  },
};

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  plan_upgraded: CheckCircle2,
  payment_failed: AlertCircle,
  trial_expiring: Clock,
  invoice_paid: CreditCard,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  plan_upgraded: "text-emerald-500",
  payment_failed: "text-red-500",
  trial_expiring: "text-amber-500",
  invoice_paid: "text-blue-500",
};

function BillingPage() {
  const qc = useQueryClient();
  const { data: bizData } = useBusiness();
  const { data: billing } = useSuspenseQuery(billingQueryOptions);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const triggerUpgrade = useServerFn(upgradeBusinessPlan);

  const plan = (billing.business?.plan ?? "trial") as keyof typeof PLAN_DETAILS;
  const planDetail = PLAN_DETAILS[plan] ?? PLAN_DETAILS.trial;
  const PlanIcon = planDetail.icon;

  const trialDays =
    plan === "trial" && billing.business?.trial_ends_at
      ? Math.max(0, differenceInDays(parseISO(billing.business.trial_ends_at), new Date()))
      : null;

  const handleUpgrade = async (planKey: "basic" | "pro", priceINR: number) => {
    setIsUpgrading(true);
    try {
      await triggerRazorpayPayment({
        amount: priceINR * 100,
        name: "BizkitOps SaaS",
        description: `Upgrade to ${planKey.toUpperCase()} Plan (${billingCycle})`,
        prefill: {
          name: bizData.profile?.full_name || "",
          email: bizData.profile?.email || "",
          contact: bizData.profile?.phone || "",
        },
        onSuccess: async (paymentId: string) => {
          try {
            await triggerUpgrade({ data: { plan: planKey, billingCycle, paymentId } });
            toast.success(`Upgraded to ${planKey.toUpperCase()} plan!`);
            await qc.invalidateQueries({ queryKey: businessQueryOptions.queryKey });
            await qc.invalidateQueries({ queryKey: billingQueryOptions.queryKey });
            await qc.invalidateQueries({ queryKey: ["installed-modules"] });
          } catch (err) {
            toast.error(`Upgrade recorded, but sync failed: ${(err as Error).message}`);
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
      toast.error(`Payment failed: ${(err as Error).message}`);
      setIsUpgrading(false);
    }
  };

  const handleRenew = async () => {
    if (plan === "trial" || plan === "custom") return;
    const cycle = (billing.business?.billing_cycle ?? "yearly") as "monthly" | "yearly";
    const basePrice = plan === "basic" ? (cycle === "yearly" ? 4730 : 499) : (cycle === "yearly" ? 14210 : 1499);
    setIsUpgrading(true);
    try {
      await triggerRazorpayPayment({
        amount: basePrice * 100,
        name: "BizkitOps SaaS",
        description: `Renew ${plan.toUpperCase()} Plan (${cycle})`,
        prefill: {
          name: bizData.profile?.full_name || "",
          email: bizData.profile?.email || "",
          contact: bizData.profile?.phone || "",
        },
        onSuccess: async (paymentId: string) => {
          try {
            await triggerUpgrade({ data: { plan, billingCycle: cycle, paymentId } });
            toast.success(`Subscription renewed successfully!`);
            await qc.invalidateQueries({ queryKey: businessQueryOptions.queryKey });
            await qc.invalidateQueries({ queryKey: billingQueryOptions.queryKey });
            await qc.invalidateQueries({ queryKey: ["installed-modules"] });
          } catch (err) {
            toast.error(`Renewal recorded, but sync failed: ${(err as Error).message}`);
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
      toast.error(`Payment failed: ${(err as Error).message}`);
      setIsUpgrading(false);
    }
  };


  return (
    <div className="max-w-5xl space-y-10">
      <PageHeader
        title="Billing & Subscription"
        description="Manage your business subscription plans, view renewal schedules, and browse payment history."
      />

      {/* Current Plan status details */}
      <Card className="relative overflow-hidden border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 shadow-md">
        <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full pointer-events-none" />
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                <PlanIcon className="h-7 w-7 text-primary animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl font-bold tracking-tight">{planDetail.label}</CardTitle>
                  {plan === "trial" && (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30 font-semibold px-2 py-0.5">
                      7 Days Free Trial
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                  {planDetail.description}
                </CardDescription>
              </div>
            </div>
            <Badge className={`${planDetail.color} border capitalize font-bold px-3.5 py-1 text-sm shadow-sm`}>
              {plan === "trial" ? "Trial Active" : `${plan} plan`}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl bg-card border border-border/60 p-4 shadow-sm hover:border-primary/20 transition-all duration-300">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Billing Interval</p>
              <p className="text-xl font-bold mt-1.5 text-foreground capitalize">
                {plan === "trial" ? "None" : (billing.business?.billing_cycle ?? "Monthly")}
              </p>
            </div>
            
            <div className="rounded-xl bg-card border border-border/60 p-4 shadow-sm hover:border-primary/20 transition-all duration-300">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Plan Cost</p>
              <p className="text-xl font-bold mt-1.5 text-foreground">
                {plan === "trial" ? "Free" : plan === "basic" ? (billing.business?.billing_cycle === "yearly" ? "₹4,730 / yr" : "₹499 / mo") : (billing.business?.billing_cycle === "yearly" ? "₹14,210 / yr" : "₹1,499 / mo")}
              </p>
            </div>

            <div className="rounded-xl bg-card border border-border/60 p-4 shadow-sm hover:border-primary/20 transition-all duration-300">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Member Since</p>
              <p className="text-xl font-bold mt-1.5 text-foreground">
                {billing.business?.created_at
                  ? format(parseISO(billing.business.created_at), "dd MMM yyyy")
                  : "—"}
              </p>
            </div>

            <div className="rounded-xl bg-card border border-border/60 p-4 shadow-sm hover:border-primary/20 transition-all duration-300">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                {plan === "trial" ? "Trial Ends" : "Next Renewal Date"}
              </p>
              {trialDays !== null ? (
                <p className={`text-xl font-bold mt-1.5 ${trialDays <= 2 ? "text-red-500" : "text-amber-500 animate-pulse"}`}>
                  {trialDays} days left
                </p>
              ) : billing.business?.next_renewal_at ? (
                <p className="text-xl font-bold mt-1.5 text-emerald-500">
                  {format(parseISO(billing.business.next_renewal_at), "dd MMM yyyy")}
                </p>
              ) : (
                <p className="text-xl font-bold mt-1.5 text-emerald-500">Active ✓</p>
              )}
            </div>
          </div>

          {trialDays !== null && (
            <div className="flex items-start gap-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl px-4 py-3 text-sm text-amber-700 font-medium">
              <HelpCircle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-800">7-Day Premium Trial Status</p>
                <p className="text-amber-700/90 text-xs mt-0.5">
                  You are currently enjoying full, unrestricted access to every management module (Billing, CRM, Staff, Inventory, Appointments, and more) completely free. Upgrade below to secure continuous access after the trial ends.
                </p>
              </div>
            </div>
          )}

          {billing.business?.subscription_id && (
            <div className="flex items-center justify-between text-xs text-muted-foreground border border-border/40 rounded-xl px-4 py-2.5 bg-muted/20">
              <span className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground/80" />
                Active Subscription Reference: <code className="font-mono bg-muted px-1.5 py-0.5 rounded text-foreground">{billing.business.subscription_id}</code>
              </span>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                Connected
              </Badge>
            </div>
          )}
        </CardContent>

        {(plan === "basic" || plan === "pro") && (
          <CardFooter className="border-t border-border/40 bg-muted/10 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="text-xs text-muted-foreground">
              Extend your subscription at the current rate of <strong>{plan === "basic" ? (billing.business?.billing_cycle === "yearly" ? "₹4,730/yr" : "₹499/mo") : (billing.business?.billing_cycle === "yearly" ? "₹14,210/yr" : "₹1,499/mo")}</strong>.
            </div>
            <Button
              onClick={handleRenew}
              disabled={isUpgrading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              {isUpgrading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Renew Subscription
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Upgrade / Pricing Toggles & Cards */}
      {plan !== "pro" && plan !== "custom" && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6 text-primary fill-primary/10" /> Simple, Transparent Pricing
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Choose the perfect plan for your business. Switch between monthly and yearly payments anytime.
            </p>
          </div>

          {/* Custom Billing Cycle Selector */}
          <div className="flex justify-center">
            <div className="relative flex items-center p-1 bg-muted/80 border border-border rounded-full shadow-inner max-w-xs w-full">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 relative ${
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
                className={`flex-1 py-1.5 text-xs font-semibold rounded-full transition-all duration-300 relative ${
                  billingCycle === "yearly"
                    ? "bg-card text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Yearly
                <span className="absolute -top-3.5 -right-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-md animate-bounce border border-indigo-400">
                  Save 21% 🔥
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Plan */}
            <Card className={`relative flex flex-col border-2 transition-all duration-300 hover:shadow-lg ${
              plan === "basic" 
                ? "border-primary bg-primary/5 shadow-md shadow-primary/5" 
                : "border-border/80 hover:border-primary/30"
            }`}>
              {plan === "basic" && (
                <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-primary-foreground/20 shadow-sm">
                  Active Subscription
                </div>
              )}
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Zap className="h-5 w-5 text-blue-500" /> Basic Plan
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">Essential tools for retail & small businesses</CardDescription>
                  </div>
                </div>
                
                <div className="pt-4 pb-2">
                  {billingCycle === "monthly" ? (
                    <div>
                      <span className="text-4xl font-bold">₹499</span>
                      <span className="text-muted-foreground text-sm"> / month</span>
                      <p className="text-xs text-muted-foreground mt-1">Billed monthly</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">₹394</span>
                        <span className="text-muted-foreground text-sm"> / month</span>
                      </div>
                      <p className="text-xs text-violet-600 font-semibold mt-1">
                        Billed annually at ₹4,730/yr
                      </p>
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-semibold mt-2.5">
                        Save ₹1,258/yr (21% Off)
                      </Badge>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                <div className="border-t border-border/60 pt-4">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2.5">Features Included:</p>
                  <ul className="space-y-2.5 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span><strong>50 Invoices</strong> per month</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span><strong>100 Inventory Items</strong> tracking</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span><strong>2 Staff Members</strong> profiles</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>GST-Compliant Billing & Invoicing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Expense Tracker & receipt logs</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Public business storefront webpage</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>Financial reports & GST summaries</span>
                    </li>
                  </ul>
                </div>
              </CardContent>

              <CardFooter className="border-t border-border/40 bg-muted/10 pt-4">
                <Button
                  onClick={() => handleUpgrade("basic", billingCycle === "monthly" ? 499 : 4730)}
                  disabled={plan === "basic" || isUpgrading}
                  variant={plan === "basic" ? "outline" : "default"}
                  className="w-full font-semibold shadow-sm"
                >
                  {isUpgrading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                  {plan === "basic" ? "Your Current Plan" : `Upgrade to Basic (${billingCycle})`}
                </Button>
              </CardFooter>
            </Card>

            {/* Pro Plan */}
            <Card className="relative flex flex-col border-2 border-violet-500/40 bg-gradient-to-b from-violet-500/5 to-transparent shadow-md hover:shadow-xl transition-all duration-300">
              <div className="absolute -top-3.5 right-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full border border-violet-400 shadow-md flex items-center gap-1">
                <Crown className="h-3 w-3" /> Most Popular
              </div>
              <CardHeader className="pb-4">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Crown className="h-5 w-5 text-amber-500" /> Pro Plan
                    <Sparkles className="h-4 w-4 text-amber-400 fill-amber-400" />
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">Full access — run and scale your operations</CardDescription>
                </div>
                
                <div className="pt-4 pb-2">
                  {billingCycle === "monthly" ? (
                    <div>
                      <span className="text-4xl font-bold">₹1,499</span>
                      <span className="text-muted-foreground text-sm"> / month</span>
                      <p className="text-xs text-muted-foreground mt-1">Billed monthly</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">₹1,184</span>
                        <span className="text-muted-foreground text-sm"> / month</span>
                      </div>
                      <p className="text-xs text-violet-600 font-semibold mt-1">
                        Billed annually at ₹14,210/yr
                      </p>
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-semibold mt-2.5">
                        Save ₹3,778/yr (21% Off)
                      </Badge>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                <div className="border-t border-border/60 pt-4">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider mb-2.5">Everything in Basic, Plus:</p>
                  <ul className="space-y-2.5 text-xs text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-violet-500 shrink-0" />
                      <span><strong className="text-foreground">Unlimited</strong> Invoices & sales billing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-violet-500 shrink-0" />
                      <span><strong className="text-foreground">Unlimited</strong> Inventory tracking</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-violet-500 shrink-0" />
                      <span><strong>Up to 10 Staff</strong> profiles & permissions</span>
                    </li>
                    <li className="flex items-center gap-2 text-foreground font-medium">
                      <Check className="h-4 w-4 text-violet-500 shrink-0" />
                      <span>CRM & Lead pipelines management</span>
                    </li>
                    <li className="flex items-center gap-2 text-foreground font-medium">
                      <Check className="h-4 w-4 text-violet-500 shrink-0" />
                      <span>Online customer booking calendar</span>
                    </li>
                    <li className="flex items-center gap-2 text-foreground font-medium">
                      <Check className="h-4 w-4 text-violet-500 shrink-0" />
                      <span>Advanced staff permissions & reports</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-violet-500 shrink-0" />
                      <span>Priority 24/7 client support access</span>
                    </li>
                  </ul>
                </div>
              </CardContent>

              <CardFooter className="border-t border-violet-500/20 bg-violet-500/5 pt-4">
                <Button
                  onClick={() => handleUpgrade("pro", billingCycle === "monthly" ? 1499 : 14210)}
                  disabled={isUpgrading}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-md hover:from-violet-700 hover:to-indigo-700"
                >
                  {isUpgrading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}
                  Upgrade to Pro ({billingCycle})
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}

      {/* Pro / Custom status check - manage modules */}
      {(plan === "pro" || plan === "custom") && (
        <Card className="border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 shadow-sm">
          <CardContent className="flex items-center justify-between gap-6 py-5 flex-wrap md:flex-nowrap">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-emerald-800">You have full, unrestricted access! 🎉</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  All management and productivity modules are fully unlocked. Toggle your desired modules on or off in the store.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="bg-card hover:bg-muted font-semibold shrink-0 border-emerald-500/20 text-emerald-700">
              <Link to="/dashboard/modules" className="flex items-center gap-1.5">
                Manage Modules <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plan Details comparison grid */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-xl font-bold tracking-tight">Compare Plans in Detail</h3>
          <p className="text-xs text-muted-foreground">Detailed breakdown of quotas, limits, features, and capabilities across all plans.</p>
        </div>

        <div className="border border-border/80 rounded-xl overflow-hidden shadow-sm bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border/80">
                  <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider">Features & Limits</th>
                  <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider text-center">Trial</th>
                  <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider text-center">Basic</th>
                  <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider text-center">Pro</th>
                  <th className="p-4 text-xs font-bold text-foreground uppercase tracking-wider text-center">Custom</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {/* Quotas */}
                <tr>
                  <td className="p-4 font-semibold text-foreground">Monthly Invoices</td>
                  <td className="p-4 text-center text-muted-foreground">Unlimited (7d)</td>
                  <td className="p-4 text-center text-foreground font-medium">50 / month</td>
                  <td className="p-4 text-center text-foreground font-medium">Unlimited</td>
                  <td className="p-4 text-center text-foreground font-medium">Customizable</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">Inventory Items</td>
                  <td className="p-4 text-center text-muted-foreground">Unlimited (7d)</td>
                  <td className="p-4 text-center text-foreground font-medium">100 items</td>
                  <td className="p-4 text-center text-foreground font-medium">Unlimited</td>
                  <td className="p-4 text-center text-foreground font-medium">Unlimited</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">Staff Accounts</td>
                  <td className="p-4 text-center text-muted-foreground">10 (7d)</td>
                  <td className="p-4 text-center text-foreground font-medium">2 users</td>
                  <td className="p-4 text-center text-foreground font-medium">10 users</td>
                  <td className="p-4 text-center text-foreground font-medium">Unlimited</td>
                </tr>
                {/* Modules */}
                <tr className="bg-muted/10">
                  <td className="p-4 font-bold text-foreground" colSpan={5}>Modules & Tools</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">Invoicing, Expenses, Storefront, Reports</td>
                  <td className="p-4 text-center"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">CRM & Leads management</td>
                  <td className="p-4 text-center"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                  <td className="p-4 text-center"><X className="h-4 w-4 text-muted-foreground/30 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">Online Appointments Calendar</td>
                  <td className="p-4 text-center"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                  <td className="p-4 text-center"><X className="h-4 w-4 text-muted-foreground/30 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">Staff Management & Permissions</td>
                  <td className="p-4 text-center"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                  <td className="p-4 text-center"><X className="h-4 w-4 text-muted-foreground/30 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                  <td className="p-4 text-center"><Check className="h-4 w-4 text-emerald-500 mx-auto" /></td>
                </tr>
                {/* Services */}
                <tr className="bg-muted/10">
                  <td className="p-4 font-bold text-foreground" colSpan={5}>Support & Extras</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">Support Level</td>
                  <td className="p-4 text-center text-muted-foreground">Standard</td>
                  <td className="p-4 text-center text-muted-foreground">Standard</td>
                  <td className="p-4 text-center text-foreground font-semibold">Priority 24/7</td>
                  <td className="p-4 text-center text-emerald-600 font-semibold">Dedicated Manager</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">Custom Integration Help</td>
                  <td className="p-4 text-center"><X className="h-4 w-4 text-muted-foreground/30 mx-auto" /></td>
                  <td className="p-4 text-center"><X className="h-4 w-4 text-muted-foreground/30 mx-auto" /></td>
                  <td className="p-4 text-center text-muted-foreground">Email setup</td>
                  <td className="p-4 text-center text-foreground font-semibold">White-Glove</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment & Activity History */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" /> Billing & Activity History
        </h2>

        <Tabs defaultValue="invoices" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="invoices" className="flex items-center gap-2 cursor-pointer">
              <Receipt className="h-4 w-4" />
              Subscription Invoices
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2 cursor-pointer">
              <Layers className="h-4 w-4" />
              Activity Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="mt-4 space-y-4">
            {(!billing.bills || billing.bills.length === 0) ? (
              <Card className="border border-dashed border-border/80">
                <CardContent className="py-12 flex flex-col items-center gap-2 text-muted-foreground text-sm">
                  <Receipt className="h-10 w-10 opacity-20" />
                  <p className="font-medium">No subscription invoices generated yet.</p>
                  <p className="text-xs text-muted-foreground">Invoice files are generated upon upgrading or renewing plans.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-border/80 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="pl-6">Invoice Number</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Billing Cycle</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Paid Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right pr-6">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {billing.bills.map((bill: any) => (
                          <TableRow key={bill.id} className="hover:bg-muted/10 transition-colors">
                            <TableCell className="pl-6 font-semibold font-mono text-xs">{bill.invoice_number}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize text-[10px] font-semibold">
                                {bill.plan}
                              </Badge>
                            </TableCell>
                            <TableCell className="capitalize text-xs">{bill.billing_cycle}</TableCell>
                            <TableCell className="text-xs font-semibold">₹{bill.amount.toFixed(2)}</TableCell>
                            <TableCell className="text-xs">
                              {format(parseISO(bill.paid_at), "dd MMM yyyy")}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-semibold">
                                Paid
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 cursor-pointer hover:bg-muted font-medium text-xs"
                                onClick={() => setSelectedBill(bill)}
                              >
                                <FileText className="h-3.5 w-3.5" />
                                Open Invoice
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            {(!billing.history || billing.history.length === 0) ? (
              <Card className="border border-dashed border-border/80">
                <CardContent className="py-12 flex flex-col items-center gap-2 text-muted-foreground text-sm">
                  <Layers className="h-10 w-10 opacity-20" />
                  <p className="font-medium">No activity history found.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-border/80 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <ul className="divide-y divide-border">
                    {billing.history.map((item: any) => {
                      const Icon = NOTIFICATION_ICONS[item.type] ?? CreditCard;
                      const iconColor = NOTIFICATION_COLORS[item.type] ?? "text-muted-foreground";
                      return (
                        <li key={item.id} className="flex items-start gap-4 px-5 py-4 hover:bg-muted/10 transition-colors">
                          <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 bg-muted/60 ${iconColor} border border-border/40 shadow-sm`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground leading-snug">{item.title}</p>
                            <p className="text-xs text-muted-foreground mt-1 leading-normal whitespace-pre-line">{item.message}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-semibold text-foreground">
                              {format(parseISO(item.created_at), "dd MMM yyyy")}
                            </p>
                            <p className="text-[10px] text-muted-foreground opacity-70 mt-0.5">
                              {format(parseISO(item.created_at), "hh:mm a")}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Invoice Viewer Modal */}
      <Dialog open={!!selectedBill} onOpenChange={(open) => !open && setSelectedBill(null)}>
        <DialogContent className="max-w-2xl bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
              <FileText className="h-5 w-5 text-primary" />
              Invoice Details
            </DialogTitle>
            <DialogDescription>
              View or print your official subscription payment receipt.
            </DialogDescription>
          </DialogHeader>

          {selectedBill && (
            <div className="space-y-6 pt-2">
              <div id="printable-invoice" className="border border-border/80 rounded-xl p-6 bg-card space-y-6 text-foreground">
                {/* Header: Logo and Title */}
                <div className="flex justify-between items-start gap-4 pb-6 border-b border-border/60">
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-primary">BIZKITOPS</h2>
                    <p className="text-xs text-muted-foreground mt-1">SaaS Subscription Invoice</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-muted-foreground">INVOICE NUMBER</p>
                    <p className="text-sm font-bold font-mono text-foreground">{selectedBill.invoice_number}</p>
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-6 text-xs pb-6 border-b border-border/60">
                  <div>
                    <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">Billed To:</p>
                    <p className="font-bold text-foreground">{bizData.business?.name}</p>
                    {bizData.business?.email && <p className="text-muted-foreground">{bizData.business.email}</p>}
                    {bizData.business?.phone && <p className="text-muted-foreground">{bizData.business.phone}</p>}
                    {bizData.business?.address && (
                      <p className="text-muted-foreground max-w-[200px] mt-1 line-clamp-2">{bizData.business.address}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-1">Payment Reference:</p>
                    <p className="font-semibold text-foreground">Razorpay payment</p>
                    <p className="text-muted-foreground font-mono text-[10px] mt-0.5">{selectedBill.payment_id || "—"}</p>
                    <p className="font-semibold text-muted-foreground uppercase tracking-wider mt-3 mb-1">Billing Period:</p>
                    <p className="text-muted-foreground capitalize">{selectedBill.billing_cycle} billing</p>
                  </div>
                </div>

                {/* Table of items */}
                <Table className="mt-4">
                  <TableHeader>
                    <TableRow className="border-b border-border hover:bg-transparent">
                      <TableHead className="font-semibold">Item Description</TableHead>
                      <TableHead className="text-center font-semibold">Billing Cycle</TableHead>
                      <TableHead className="text-right font-semibold">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-b border-border/40 hover:bg-transparent">
                      <TableCell className="py-4">
                        <div className="font-semibold text-foreground">BizkitOps {selectedBill.plan.toUpperCase()} Plan</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">Full access to business administration and management tools</div>
                      </TableCell>
                      <TableCell className="text-center capitalize">{selectedBill.billing_cycle}</TableCell>
                      <TableCell className="text-right">₹{(selectedBill.amount / 1.18).toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>

                {/* Totals */}
                <div className="flex justify-end pt-4">
                  <div className="w-64 space-y-2 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>₹{(selectedBill.amount / 1.18).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>CGST (9%)</span>
                      <span>₹{(selectedBill.amount * 0.09 / 1.18).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>SGST (9%)</span>
                      <span>₹{(selectedBill.amount * 0.09 / 1.18).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold border-t border-border pt-2 text-primary">
                      <span>Total Paid (incl. tax)</span>
                      <span>₹{Number(selectedBill.amount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer notes */}
                <div className="pt-8 border-t border-border/60 text-[10px] text-muted-foreground flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-foreground">BizkitOps Technologies Private Limited</p>
                    <p className="mt-0.5">Corporate identity registered in India</p>
                  </div>
                  <div className="text-right">
                    <p>This is a computer-generated transaction receipt.</p>
                    <p className="mt-0.5">No physical signature required.</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 border-t border-border pt-4">
                <Button variant="outline" size="sm" onClick={() => setSelectedBill(null)} className="cursor-pointer">
                  Close
                </Button>
                <Button size="sm" className="gap-1.5 cursor-pointer" onClick={() => {
                  const printContents = document.getElementById("printable-invoice")?.innerHTML;
                  if (printContents) {
                    const printWindow = window.open("", "_blank");
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Invoice - ${selectedBill.invoice_number}</title>
                            <style>
                              body {
                                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                                color: #1f2937;
                                padding: 40px;
                              }
                              .border { border: 1px solid #e5e7eb; }
                              .rounded-xl { border-radius: 0.75rem; }
                              .p-6 { padding: 1.5rem; }
                              .bg-card { background-color: #ffffff; }
                              .space-y-6 > * + * { margin-top: 1.5rem; }
                              .flex { display: flex; }
                              .justify-between { justify-content: space-between; }
                              .items-start { align-items: flex-start; }
                              .gap-4 { gap: 1rem; }
                              .pb-6 { padding-bottom: 1.5rem; }
                              .border-b { border-bottom: 1px solid #e5e7eb; }
                              .text-right { text-align: right; }
                              .text-xs { font-size: 0.75rem; }
                              .text-sm { font-size: 0.875rem; }
                              .font-semibold { font-weight: 600; }
                              .font-bold { font-weight: 700; }
                              .font-black { font-weight: 900; }
                              .font-mono { font-family: monospace; }
                              .text-muted-foreground { color: #6b7280; }
                              .text-primary { color: #4f46e5; }
                              .grid { display: grid; }
                              .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                              .gap-6 { gap: 1.5rem; }
                              .w-full { width: 100%; }
                              .text-left { text-align: left; }
                              .border-collapse { border-collapse: collapse; }
                              th, td { padding: 12px 8px; border-bottom: 1px solid #e5e7eb; }
                              .text-center { text-align: center; }
                              .w-64 { width: 16rem; }
                              .space-y-2 > * + * { margin-top: 0.5rem; }
                              .pt-4 { padding-top: 1rem; }
                              .pt-2 { padding-top: 0.5rem; }
                              .border-t { border-top: 1px solid #e5e7eb; }
                              .capitalize { text-transform: capitalize; }
                            </style>
                          </head>
                          <body>
                            ${printContents}
                            <script>
                              window.onload = function() {
                                window.print();
                                window.close();
                              }
                            </script>
                          </body>
                        </html>
                      `);
                      printWindow.document.close();
                    }
                  }
                }}>
                  <Printer className="h-4 w-4" />
                  Print Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* Need help section */}
      <Card className="bg-muted/30 border border-dashed border-border/80 rounded-2xl shadow-sm">
        <CardContent className="py-5 flex items-center justify-between gap-6 flex-wrap md:flex-nowrap">
          <div>
            <p className="font-bold text-sm text-foreground">Need a custom plan, volume discount, or white-label billing?</p>
            <p className="text-xs text-muted-foreground mt-1">
              Contact our sales engineering team. We configure customized invoicing, higher item caps, and enterprise-grade dedicated support.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="shrink-0 bg-card hover:bg-muted font-semibold">
            <a href="mailto:support@bizkit.in">Contact Sales</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
