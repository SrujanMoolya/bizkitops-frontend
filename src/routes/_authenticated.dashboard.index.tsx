import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight,
  Receipt,
  Wallet,
  Users,
  Package,
  Plus,
  TrendingUp,
  AlertTriangle,
  TrendingDown,
  ArrowRight,
  Clock,
  CheckCircle,
  Tag,
  CreditCard,
  DollarSign
} from "lucide-react";
import { useBusiness } from "@/hooks/use-business";
import { formatINR, formatINRCompact, formatDate } from "@/lib/format";
import { getDashboardStats } from "@/lib/dashboard.functions";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { RoutePending, RouteError } from "@/components/dashboard/page-shell";

const statsOptions = queryOptions({
  queryKey: ["dashboard-stats"],
  queryFn: () => getDashboardStats(),
  staleTime: 1000 * 30,
});

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — BizkitOps" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(statsOptions),
  component: DashboardHome,
  pendingComponent: RoutePending,
  errorComponent: RouteError,
});

const categoryColors: Record<string, string> = {
  Rent: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/50",
  Salary: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/50",
  Salaries: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/50",
  Marketing: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200/50",
  Advertising: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200/50",
  Utilities: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-400 border-cyan-200/50",
  Supplies: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/50",
  Travel: "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200/50",
  Inventory: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200/50",
  Tax: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/50",
  Taxes: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/50",
  Software: "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-400 border-violet-200/50",
};

const getCategoryBadgeClass = (cat: string) => {
  return categoryColors[cat] || "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200/50";
};

function DashboardHome() {
  const { data: bizData } = useBusiness();
  const business = bizData.business!;
  const { data: stats } = useSuspenseQuery(statsOptions);

  const statCards = [
    {
      label: "Revenue (30d)",
      value: formatINR(stats.revenue),
      icon: Receipt,
      hint: `${stats.trend.filter((d) => d.revenue > 0).length} invoiced days`,
      color: "border-l-4 border-l-emerald-500",
      textClass: "text-emerald-600 dark:text-emerald-400"
    },
    {
      label: "Expenses (30d)",
      value: formatINR(stats.expenses),
      icon: Wallet,
      hint: "Across all categories",
      color: "border-l-4 border-l-rose-500",
      textClass: "text-rose-600 dark:text-rose-400"
    },
    {
      label: "Outstanding Debt",
      value: formatINR(stats.outstanding),
      icon: TrendingUp,
      hint: "Unpaid customer balances",
      color: "border-l-4 border-l-amber-500",
      textClass: "text-amber-600 dark:text-amber-400"
    },
    {
      label: "Net Profit / Margin",
      value: formatINR(stats.profit),
      icon: DollarSign,
      hint: `${stats.customers} active customers list`,
      color: "border-l-4 border-l-blue-500",
      textClass: stats.profit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Welcome back 👋</h1>
          <p className="text-muted-foreground">Here's what's happening at {business.name} today.</p>
        </div>
        <Button asChild className="gap-1 shadow-soft">
          <Link to="/dashboard/invoices">
            <Plus className="h-4 w-4" /> Create invoice
          </Link>
        </Button>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className={`shadow-card ${s.color}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-wider">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-display font-bold ${s.textClass}`}>{s.value}</div>
              <p className="text-[10px] text-muted-foreground mt-1">{s.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts & Breakdown row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              Revenue vs Expenses · Last 30 Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                revenue: { label: "Revenue", color: "var(--primary)" },
                expenses: { label: "Expenses", color: "var(--muted-foreground)" },
              }}
              className="h-[260px] w-full"
            >
              <ResponsiveContainer>
                <AreaChart data={stats.trend} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="g-rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g-exp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-expenses)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--color-expenses)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 11 }} />
                  <YAxis
                    tickFormatter={(v) => formatINRCompact(v)}
                    tick={{ fontSize: 11 }}
                    width={60}
                  />
                  <ChartTooltip content={<ChartTooltipContent labelFormatter={(d) => d} />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-revenue)"
                    fill="url(#g-rev)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="expenses"
                    stroke="var(--color-expenses)"
                    fill="url(#g-exp)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Expenses by Category breakdown */}
        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Top Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.expensesByCategory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-xs text-muted-foreground space-y-2">
                <Wallet className="h-8 w-8 opacity-40" />
                <p>No expenses logged this month.</p>
                <Link to="/dashboard/expenses">
                  <Button size="sm" variant="outline" className="text-[10px] h-7 px-2">Log Expense</Button>
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {stats.expensesByCategory.map((c) => {
                  const max = stats.expensesByCategory[0].amount || 1;
                  const pct = (c.amount / max) * 100;
                  return (
                    <li key={c.category}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="capitalize">{c.category}</span>
                        <span className="text-muted-foreground">{formatINR(c.amount)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Feeds Split Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices Feed */}
        <Card className="shadow-card border-border">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <Clock className="h-4.5 w-4.5 text-primary" /> Recent Invoices
            </CardTitle>
            <Link to="/dashboard/invoices" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {stats.recentInvoices.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                No invoices generated recently.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {stats.recentInvoices.map((inv: any) => {
                  const isPaid = inv.status === "paid";
                  const isOverdue = inv.status === "overdue";
                  const isCancelled = inv.status === "cancelled";

                  return (
                    <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            to="/dashboard/invoices/$id"
                            params={{ id: inv.id }}
                            className="font-mono text-xs font-semibold text-primary hover:underline"
                          >
                            {inv.invoice_number}
                          </Link>
                          {isPaid ? (
                            <Badge variant="outline" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/50 text-[9px] font-bold py-0.5 px-1.5">
                              Paid
                            </Badge>
                          ) : isOverdue ? (
                            <Badge variant="outline" className="bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200/50 text-[9px] font-bold py-0.5 px-1.5">
                              Overdue
                            </Badge>
                          ) : isCancelled ? (
                            <Badge variant="outline" className="bg-zinc-100 text-zinc-800 text-[9px] font-bold py-0.5 px-1.5 border-zinc-200/50">
                              Cancelled
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/50 text-[9px] font-bold py-0.5 px-1.5">
                              {Number(inv.amount_paid) > 0 ? "Partial" : "Unpaid"}
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {inv.customer_name} · {formatDate(inv.issue_date)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{formatINR(inv.total_amount)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses Feed */}
        <Card className="shadow-card border-border">
          <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <TrendingDown className="h-4.5 w-4.5 text-rose-500" /> Recent Expenditures
            </CardTitle>
            <Link to="/dashboard/expenses" className="text-xs text-primary hover:underline flex items-center gap-0.5">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {stats.recentExpenses.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                No expense entries logged recently.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {stats.recentExpenses.map((exp: any) => (
                  <div key={exp.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`font-semibold capitalize text-[9px] py-0.5 px-1.5 ${getCategoryBadgeClass(exp.category)}`}>
                          <Tag className="h-2 w-2 mr-1" /> {exp.category}
                        </Badge>
                        <span className="text-xs font-semibold text-foreground truncate max-w-[150px]">
                          {exp.description || "Operational Outflow"}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {formatDate(exp.expense_date)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-rose-600 dark:text-rose-400">{formatINR(exp.amount)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Buttons */}
      <Card className="shadow-card border-border">
        <CardHeader>
          <CardTitle className="text-sm font-bold">Quick Actions Hub</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: "/dashboard/invoices" as const, label: "New Invoice", icon: Receipt },
            { to: "/dashboard/customers" as const, label: "Add Customer", icon: Users },
            { to: "/dashboard/expenses" as const, label: "Log Expense", icon: Wallet },
            { to: "/dashboard/inventory" as const, label: "Manage Stock", icon: Package },
          ].map((a) => (
            <Button key={a.to} asChild variant="outline" className="h-auto justify-between py-3 bg-card hover:bg-muted/20 border-border shadow-soft transition-all">
              <Link to={a.to}>
                <span className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <a.icon className="h-4.5 w-4.5 text-muted-foreground" /> {a.label}
                </span>
                <ArrowUpRight className="h-4 w-4 opacity-50 text-foreground" />
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Low Stock Banner Alert */}
      {stats.lowStock.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5 shadow-soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4.5 w-4.5 text-destructive" /> Low Stock Alerts Triggered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {stats.lowStock.map((i) => (
                <li
                  key={i.id}
                  className="flex justify-between items-center rounded-xl bg-card px-4 py-3 border border-border/80 shadow-soft"
                >
                  <span className="font-semibold text-foreground">{i.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-destructive font-bold">{i.current_stock} units left</span>
                    <Link to="/dashboard/inventory">
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-muted">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
