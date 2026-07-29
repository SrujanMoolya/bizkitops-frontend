import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getFinancialReports } from "@/lib/reports.functions";
import { listInstalledModules } from "@/lib/modules-store.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Legend } from "recharts";
import {
  BarChart3,
  Shield,
  Receipt,
  Wallet,
  TrendingUp,
  DollarSign,
  Download,
  Printer,
  Landmark,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-shell";
import { formatINR, formatINRCompact } from "@/lib/format";
import { startOfMonth, subMonths, format } from "date-fns";
import { RoutePending, RouteError } from "@/components/dashboard/page-shell";

const reportsOptions = (filters: { startDate?: string; endDate?: string }) =>
  queryOptions({
    queryKey: ["financial-reports", filters],
    queryFn: () => getFinancialReports({ data: filters }),
  });

const installedModulesOptions = queryOptions({
  queryKey: ["installed-modules"],
  queryFn: () => listInstalledModules(),
});

export const Route = createFileRoute("/_authenticated/dashboard/reports/")({
  head: () => ({ meta: [{ title: "Reports & Analytics — BizkitOps" }] }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(reportsOptions({})),
      context.queryClient.ensureQueryData(installedModulesOptions),
    ]),
  component: ReportsPage,
  pendingComponent: RoutePending,
  errorComponent: RouteError,
});

function ReportsPage() {
  const { data: installed } = useSuspenseQuery(installedModulesOptions);
  const isModuleActive = installed.some((m) => m.module_key === "reports" && m.is_active);

  const [datePreset, setDatePreset] = useState("last-6-months");

  const dateFilters = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");

    switch (datePreset) {
      case "last-30-days":
        return {
          startDate: format(subMonths(today, 1), "yyyy-MM-dd"),
          endDate: todayStr,
        };
      case "last-6-months":
        return {
          startDate: format(subMonths(today, 6), "yyyy-MM-dd"),
          endDate: todayStr,
        };
      case "this-financial-year": {
        // Indian financial year starts April 1st
        const currentYear = today.getFullYear();
        const startYear = today.getMonth() >= 3 ? currentYear : currentYear - 1;
        return {
          startDate: `${startYear}-04-01`,
          endDate: todayStr,
        };
      }
      case "all-time":
      default:
        return {};
    }
  }, [datePreset]);

  if (!isModuleActive) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Reports & Analytics"
          description="Track financial health, revenue trends, and tax liability."
        />
        <Card className="max-w-md mx-auto text-center p-8 mt-12 shadow-md border-border bg-card">
          <CardHeader className="flex flex-col items-center">
            <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <BarChart3 className="h-8 w-8" />
            </div>
            <CardTitle className="text-xl">Reports & Analytics is Disabled</CardTitle>
            <CardDescription className="mt-2 text-sm text-muted-foreground">
              Activate the Reports & Analytics module to unlock revenue charts, expense breakdown
              reports, GST liability statements, and P&L summaries.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center mt-4">
            <Button asChild>
              <Link to="/dashboard/modules">Go to Module Store</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ReportsDashboardContent
      datePreset={datePreset}
      setDatePreset={setDatePreset}
      dateFilters={dateFilters}
    />
  );
}

function ReportsDashboardContent({
  datePreset,
  setDatePreset,
  dateFilters,
}: {
  datePreset: string;
  setDatePreset: (val: string) => void;
  dateFilters: { startDate?: string; endDate?: string };
}) {
  const { data } = useSuspenseQuery(reportsOptions(dateFilters));
  const { invoices, expenses } = data;

  // Calculators
  const totals = useMemo(() => {
    const totalSales = invoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
    const paidSales = invoices
      .filter((i) => i.status === "paid")
      .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
    const totalExp = expenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0);

    // Tax Liability calculations
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    invoices.forEach((inv) => {
      cgst += Number(inv.cgst_amount || 0);
      sgst += Number(inv.sgst_amount || 0);
      igst += Number(inv.igst_amount || 0);
    });

    return {
      totalSales,
      paidSales,
      totalExpenses: totalExp,
      netProfit: paidSales - totalExp, // Net Profit based on actual cash collected
      cgst,
      sgst,
      igst,
      totalGST: cgst + sgst + igst,
    };
  }, [invoices, expenses]);

  // Chart Data Grouping (Monthly)
  const chartData = useMemo(() => {
    const groups: Record<string, { label: string; revenue: number; expenses: number }> = {};

    // Seed last 6 months to make chart look complete even with empty values
    if (datePreset === "last-6-months") {
      const today = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(today, i);
        const key = format(d, "yyyy-MM");
        groups[key] = {
          label: format(d, "MMM yy"),
          revenue: 0,
          expenses: 0,
        };
      }
    }

    invoices.forEach((inv) => {
      const key = inv.issue_date.slice(0, 7); // "YYYY-MM"
      if (!groups[key]) {
        try {
          const parsed = new Date(inv.issue_date);
          groups[key] = { label: format(parsed, "MMM yy"), revenue: 0, expenses: 0 };
        } catch {
          groups[key] = { label: key, revenue: 0, expenses: 0 };
        }
      }
      groups[key].revenue += Number(inv.total_amount || 0);
    });

    expenses.forEach((exp) => {
      const key = exp.expense_date.slice(0, 7);
      if (!groups[key]) {
        try {
          const parsed = new Date(exp.expense_date);
          groups[key] = { label: format(parsed, "MMM yy"), revenue: 0, expenses: 0 };
        } catch {
          groups[key] = { label: key, revenue: 0, expenses: 0 };
        }
      }
      groups[key].expenses += Number(exp.amount || 0);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, val]) => val);
  }, [invoices, expenses, datePreset]);

  // Expenses categories summary
  const expenseCategories = useMemo(() => {
    const categories: Record<string, number> = {};
    expenses.forEach((exp) => {
      categories[exp.category] = (categories[exp.category] || 0) + Number(exp.amount || 0);
    });
    return Object.entries(categories)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          title="Reports & Analytics"
          description="Detailed overview of business sales, expenses, tax liability, and P&L."
        />
        <div className="flex items-center gap-2">
          <Select value={datePreset} onValueChange={setDatePreset}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-30-days">Last 30 Days</SelectItem>
              <SelectItem value="last-6-months">Last 6 Months</SelectItem>
              <SelectItem value="this-financial-year">Financial Year</SelectItem>
              <SelectItem value="all-time">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handlePrint} title="Print Report">
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Net Profit
              </p>
              <h3
                className={`text-2xl font-bold mt-1 ${totals.netProfit >= 0 ? "text-emerald-600" : "text-destructive"}`}
              >
                {formatINR(totals.netProfit)}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Based on cash collected</p>
            </div>
            <div className="h-10 w-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Total Sales
              </p>
              <h3 className="text-2xl font-bold mt-1 text-primary">
                {formatINR(totals.totalSales)}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {formatINR(totals.paidSales)} paid
              </p>
            </div>
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Receipt className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Total Expenses
              </p>
              <h3 className="text-2xl font-bold mt-1 text-amber-600">
                {formatINR(totals.totalExpenses)}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Logged in expenses module</p>
            </div>
            <div className="h-10 w-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-600">
              <Wallet className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                GST Liability
              </p>
              <h3 className="text-2xl font-bold mt-1 text-purple-600">
                {formatINR(totals.totalGST)}
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">CGST+SGST+IGST collected</p>
            </div>
            <div className="h-10 w-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-600">
              <Landmark className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gst">GST Summary</TabsTrigger>
          <TabsTrigger value="pnl">Profit & Loss (P&L)</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue vs Expenses Chart */}
            <Card className="lg:col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" /> Monthly Revenue vs Expenses
                </CardTitle>
                <CardDescription>Visual comparisons of cash inflows and outflows</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    revenue: { label: "Revenue", color: "var(--primary)" },
                    expenses: { label: "Expenses", color: "#f59e0b" },
                  }}
                  className="h-[300px] w-full"
                >
                  <ResponsiveContainer>
                    <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis
                        tickFormatter={(v) => formatINRCompact(v)}
                        tick={{ fontSize: 11 }}
                        width={60}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Expenses by Category */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Expense breakdown</CardTitle>
                <CardDescription>Top spending categories</CardDescription>
              </CardHeader>
              <CardContent>
                {expenseCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">
                    No expenses logged during this period.
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {expenseCategories.map((c) => {
                      const max = expenseCategories[0].amount || 1;
                      const pct = (c.amount / max) * 100;
                      return (
                        <li key={c.name}>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="font-medium text-sm">{c.name}</span>
                            <span className="text-muted-foreground font-semibold">
                              {formatINR(c.amount)}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-amber-500" style={{ width: `${pct}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gst" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm text-muted-foreground">CGST Collected</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-xl font-bold">{formatINR(totals.cgst)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm text-muted-foreground">SGST Collected</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-xl font-bold">{formatINR(totals.sgst)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-4">
                <CardTitle className="text-sm text-muted-foreground">IGST Collected</CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="text-xl font-bold">{formatINR(totals.igst)}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Landmark className="h-4 w-4 text-purple-600" /> Invoice Tax Breakdown
              </CardTitle>
              <CardDescription>Tax calculation details for GST filing</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">
                  No sales invoices logged.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="text-right">CGST</TableHead>
                      <TableHead className="text-right">SGST</TableHead>
                      <TableHead className="text-right">IGST</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-semibold">{inv.invoice_number}</TableCell>
                        <TableCell>{inv.issue_date}</TableCell>
                        <TableCell>{inv.customer_name}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatINR(inv.subtotal)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatINR(inv.cgst_amount || 0)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatINR(inv.sgst_amount || 0)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatINR(inv.igst_amount || 0)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-primary">
                          {formatINR(inv.total_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={inv.status === "paid" ? "default" : "secondary"}>
                            {inv.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pnl" className="space-y-6">
          <Card className="shadow-sm max-w-2xl mx-auto print:border-none print:shadow-none">
            <CardHeader className="text-center border-b">
              <CardTitle className="text-xl flex items-center justify-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Profit & Loss Statement
              </CardTitle>
              <CardDescription>
                Statement for period:{" "}
                {datePreset === "all-time"
                  ? "All Time"
                  : `${dateFilters.startDate} to ${dateFilters.endDate}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-sm text-muted-foreground uppercase border-b pb-2">
                    Revenue
                  </h4>
                  <div className="flex justify-between py-2 text-sm">
                    <span>Operating Revenue (Sales Invoiced)</span>
                    <span className="font-semibold">{formatINR(totals.totalSales)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-sm text-muted-foreground border-b border-dashed">
                    <span>Less: Uncollected Receivables</span>
                    <span>-{formatINR(totals.totalSales - totals.paidSales)}</span>
                  </div>
                  <div className="flex justify-between py-3 text-base font-bold bg-muted/40 px-2 rounded mt-1">
                    <span>Net Operating Revenue (Cash Inflow)</span>
                    <span>{formatINR(totals.paidSales)}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-muted-foreground uppercase border-b pb-2">
                    Operating Expenses
                  </h4>
                  {expenseCategories.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-3 text-center">
                      No expenses logged.
                    </p>
                  ) : (
                    <div className="divide-y divide-dashed">
                      {expenseCategories.map((c) => (
                        <div key={c.name} className="flex justify-between py-2 text-sm">
                          <span className="capitalize">{c.name} Expenses</span>
                          <span>{formatINR(c.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between py-3 text-base font-bold bg-muted/40 px-2 rounded mt-1">
                    <span>Total Operating Expenses</span>
                    <span>{formatINR(totals.totalExpenses)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t-2">
                  <div
                    className={`flex justify-between py-4 px-3 rounded-lg text-lg font-bold ${totals.netProfit >= 0 ? "bg-emerald-500/10 text-emerald-700" : "bg-destructive/10 text-destructive-foreground"}`}
                  >
                    <span>Net Profit / (Loss)</span>
                    <span>{formatINR(totals.netProfit)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
