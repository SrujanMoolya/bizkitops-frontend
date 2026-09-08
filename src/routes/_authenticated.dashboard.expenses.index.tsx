import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { queryOptions, useSuspenseQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listExpenses, upsertExpense, deleteExpense } from "@/lib/expenses.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Wallet,
  Search,
  X,
  Download,
  TrendingDown,
  CreditCard,
  Tag,
  Camera,
  UploadCloud,
  ImageIcon,
  Eye,
  Paperclip,
  Hash,
} from "lucide-react";
import { PageHeader, EmptyState } from "@/components/dashboard/page-shell";
import { formatINR, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { RoutePending, RouteError } from "@/components/dashboard/page-shell";

const expensesOptions = queryOptions({
  queryKey: ["expenses"],
  queryFn: () => listExpenses(),
});

export const Route = createFileRoute("/_authenticated/dashboard/expenses/")({
  head: () => ({ meta: [{ title: "Expenses — BizkitOps" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(expensesOptions),
  component: ExpensesPage,
  pendingComponent: RoutePending,
  errorComponent: RouteError,
});

type Expense = Awaited<ReturnType<typeof listExpenses>>["expenses"][number];

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

const paymentMethodColors: Record<string, string> = {
  cash: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200/30",
  upi: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200/30",
  card: "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200/30",
  bank_transfer: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200/30",
  cheque: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200/30",
  other: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200/30",
};

const getPaymentMethodBadgeClass = (method: string) => {
  return paymentMethodColors[method.toLowerCase()] || "bg-zinc-100 text-zinc-800 border-zinc-200/30";
};

function ExpensesPage() {
  const { data } = useSuspenseQuery(expensesOptions);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  
  // Search & filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const totals = useMemo(() => {
    const total = data.expenses.reduce((s, e) => s + Number(e.amount), 0);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = data.expenses
      .filter((e) => new Date(e.expense_date) >= monthStart)
      .reduce((s, e) => s + Number(e.amount), 0);
    const avgAmount = data.expenses.length > 0 ? total / data.expenses.length : 0;
    
    // Most expensive category
    const catMap: Record<string, number> = {};
    data.expenses.forEach((e) => {
      catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount);
    });
    let topCat = "—";
    let topCatVal = 0;
    Object.entries(catMap).forEach(([cat, val]) => {
      if (val > topCatVal) {
        topCatVal = val;
        topCat = cat;
      }
    });

    return { total, thisMonth, avgAmount, topCat };
  }, [data.expenses]);

  // Group by category and calculate total per category
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    data.expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount);
    });
    return Object.entries(map)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [data.expenses]);

  // Filtering logic
  const filteredExpenses = useMemo(() => {
    return data.expenses.filter((e) => {
      const matchSearch =
        e.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchCat = categoryFilter === "all" || e.category === categoryFilter;
      const matchPayment = paymentFilter === "all" || e.payment_method === paymentFilter;

      return matchSearch && matchCat && matchPayment;
    });
  }, [data.expenses, searchTerm, categoryFilter, paymentFilter]);

  const handleExportCSV = () => {
    if (data.expenses.length === 0) {
      toast.error("No expenses to export");
      return;
    }
    const headers = ["Date", "Category", "Description", "Payment Method", "Txn ID / Ref", "Amount", "Notes"];
    const rows = data.expenses.map((e) => [
      e.expense_date,
      e.category,
      e.description || "",
      e.payment_method,
      e.reference_number || "",
      e.amount,
      e.notes || "",
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BizkitOps_Expenses_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV file exported successfully!");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses Tracker"
        description="Monitor outgoing operating expenses, view breakdown metrics, and log daily vouchers."
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="gap-1.5 shadow-soft"
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="gap-1.5 shadow-soft"
            >
              <Plus className="h-4 w-4" /> Log expense
            </Button>
          </div>
        }
      />

      {/* Advanced Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "This Month spend", value: formatINR(totals.thisMonth), color: "border-l-4 border-l-amber-500", desc: "Outflows in current cycle" },
          { label: "All-Time spend", value: formatINR(totals.total), color: "border-l-4 border-l-rose-500", desc: "Cumulative operational spend" },
          { label: "Average Voucher Size", value: formatINR(totals.avgAmount), color: "border-l-4 border-l-blue-500", desc: "Average amount per log entry" },
          { label: "Top Category", value: totals.topCat, color: "border-l-4 border-l-purple-500", desc: "Primary expense sink category" },
        ].map((s, idx) => (
          <Card key={idx} className={`${s.color} shadow-card`}>
            <CardHeader className="pb-1 pt-4">
              <CardTitle className="text-xs uppercase font-bold text-muted-foreground tracking-wider">{s.label}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <p className="text-2xl font-display font-black text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.expenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Table List */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-card border-border">
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <TrendingDown className="h-4.5 w-4.5 text-rose-500" /> Operational Outflows Ledger
                </CardTitle>
                <Badge variant="outline" className="font-semibold">{filteredExpenses.length} Records</Badge>
              </CardHeader>

              {/* Filtering Controls */}
              <div className="p-4 bg-muted/20 border-b flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search description, notes, or Txn ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-8 bg-card"
                  />
                  {searchTerm && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1.5 h-7 w-7 text-muted-foreground"
                      onClick={() => setSearchTerm("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[150px] bg-card">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Array.from(new Set(data.expenses.map((e) => e.category))).map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger className="w-[150px] bg-card">
                    <SelectValue placeholder="Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Payments</SelectItem>
                    {["cash", "upi", "card", "bank_transfer", "cheque", "other"].map((method) => (
                      <SelectItem key={method} value={method} className="capitalize">
                        {method.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(searchTerm || categoryFilter !== "all" || paymentFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 h-9 px-2 text-xs"
                    onClick={() => {
                      setSearchTerm("");
                      setCategoryFilter("all");
                      setPaymentFilter("all");
                    }}
                  >
                    Reset
                  </Button>
                )}
              </div>

              <CardContent className="p-0">
                {filteredExpenses.length === 0 ? (
                  <div className="p-12 text-center text-sm text-muted-foreground border-dashed border border-t-0">
                    No expense records match your selected search filters.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-28 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExpenses.map((e) => (
                        <TableRow key={e.id} className="hover:bg-muted/10">
                          <TableCell className="font-mono text-xs">{formatDate(e.expense_date)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`font-semibold capitalize text-[10px] ${getCategoryBadgeClass(e.category)}`}>
                              <Tag className="h-2.5 w-2.5 mr-1" /> {e.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <span className="font-medium text-foreground text-xs block truncate">{e.description || "—"}</span>
                            {e.notes && (
                              <div className="text-[10px] text-muted-foreground truncate">{e.notes}</div>
                            )}
                            {e.receipt_url && (
                              <button
                                type="button"
                                onClick={() => setSelectedReceipt(e.receipt_url!)}
                                className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
                              >
                                <ImageIcon className="h-3 w-3" /> View Receipt Photo
                              </button>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`capitalize font-semibold text-[10px] ${getPaymentMethodBadgeClass(e.payment_method)}`}>
                              <CreditCard className="h-2.5 w-2.5 mr-1" /> {e.payment_method.replace("_", " ")}
                            </Badge>
                            {e.reference_number && (
                              <div className="text-[10px] text-muted-foreground font-mono mt-1 flex items-center gap-1">
                                <Hash className="h-2.5 w-2.5 shrink-0 text-primary" />
                                <span className="truncate max-w-[110px]" title={e.reference_number}>{e.reference_number}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-black text-rose-600 dark:text-rose-400">
                            {formatINR(e.amount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setViewingExpense(e)}
                                title="View expense details"
                              >
                                <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditing(e);
                                  setOpen(true);
                                }}
                                title="Edit expense"
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                              </Button>
                              <DeleteButton id={e.id} />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Category breakdown visual cards */}
          <div className="space-y-4">
            <Card className="shadow-card border-border">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  Category Spend Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {categoryBreakdown.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-6">No data.</div>
                ) : (
                  categoryBreakdown.map((c) => {
                    const percent = totals.total > 0 ? Math.round((c.amount / totals.total) * 100) : 0;
                    return (
                      <div key={c.name} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="capitalize">{c.name}</span>
                          <span className="text-muted-foreground">
                            {formatINR(c.amount)} ({percent}%)
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {data.expenses.length === 0 && (
        <EmptyState
          icon={Wallet}
          title="No expenses logged"
          description="Track every rupee going out of your business. Categorise, attach receipts, and check tax deductions."
          action={{
            label: "Log expense",
            onClick: () => {
              setEditing(null);
              setOpen(true);
            },
          }}
        />
      )}

      <ExpenseDialog
        open={open}
        onOpenChange={setOpen}
        expense={editing}
        categories={data.categories.map((c) => c.name)}
      />

      {/* Expense Voucher Details Viewing Modal */}
      <ExpenseViewDialog
        expense={viewingExpense}
        onClose={() => setViewingExpense(null)}
        onEdit={() => {
          setEditing(viewingExpense);
          setOpen(true);
          setViewingExpense(null);
        }}
        onViewReceipt={(url) => setSelectedReceipt(url)}
      />

      {/* Full Size Receipt Viewer Dialog */}
      <Dialog open={!!selectedReceipt} onOpenChange={() => setSelectedReceipt(null)}>
        <DialogContent className="max-w-lg p-4">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" /> Attached Expense Receipt
            </DialogTitle>
          </DialogHeader>
          {selectedReceipt && (
            <div className="space-y-3 pt-2">
              <div className="rounded-lg border border-border overflow-hidden bg-black/5 dark:bg-black/40 flex justify-center items-center max-h-[70vh] p-2">
                <img src={selectedReceipt} alt="Expense receipt" className="max-h-[65vh] object-contain rounded" />
              </div>
              <div className="flex justify-end gap-2">
                <Button asChild variant="outline" size="sm" className="text-xs">
                  <a href={selectedReceipt} download="Expense_Receipt.png" target="_blank" rel="noreferrer">
                    <Download className="h-3.5 w-3.5 mr-1" /> Download Image
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DeleteButton({ id }: { id: string }) {
  const qc = useQueryClient();
  const del = useServerFn(deleteExpense);
  const m = useMutation({
    mutationFn: del,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense removed");
    },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={m.isPending}
      onClick={() => {
        if (confirm("Delete this expense?")) m.mutate({ data: { id } });
      }}
    >
      {m.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4 text-destructive" />
      )}
    </Button>
  );
}

function ExpenseDialog({
  open,
  onOpenChange,
  expense,
  categories,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  expense: Expense | null;
  categories: string[];
}) {
  const qc = useQueryClient();
  const save = useServerFn(upsertExpense);
  const [category, setCategory] = useState(expense?.category ?? categories[0] ?? "Misc");
  const [paymentMethod, setPaymentMethod] = useState(expense?.payment_method ?? "cash");
  const [referenceNumber, setReferenceNumber] = useState(expense?.reference_number ?? "");
  const [receiptUrl, setReceiptUrl] = useState<string | null>(expense?.receipt_url ?? null);

  const m = useMutation({
    mutationFn: save,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success(expense ? "Expense updated" : "Expense logged");
      onOpenChange(false);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const getRefPlaceholder = (method: string) => {
    switch (method) {
      case "upi":
        return "e.g. UPI/123456789012 or UTR Ref";
      case "card":
        return "e.g. Card TXN ID / Approval Code";
      case "bank_transfer":
        return "e.g. NEFT / RTGS Ref No.";
      case "cheque":
        return "e.g. Cheque No. 000123";
      default:
        return "e.g. Transaction Ref / Slip No.";
    }
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error("File size must be under 3MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptUrl(reader.result as string);
      toast.success("Receipt photo attached!");
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    m.mutate({
      data: {
        id: expense?.id,
        amount: Number(f.get("amount") ?? 0),
        category,
        description: String(f.get("description") ?? ""),
        expense_date: String(f.get("expense_date") ?? new Date().toISOString().slice(0, 10)),
        payment_method: paymentMethod,
        reference_number: referenceNumber.trim(),
        receipt_url: receiptUrl,
        notes: String(f.get("notes") ?? ""),
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{expense ? "Edit expense" : "Log expense"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0"
                step="0.01"
                required
                defaultValue={expense?.amount ?? ""}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expense_date">Date</Label>
              <Input
                id="expense_date"
                name="expense_date"
                type="date"
                required
                defaultValue={expense?.expense_date ?? new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["cash", "upi", "card", "bank_transfer", "cheque", "other"].map((m) => (
                    <SelectItem key={m} value={m} className="capitalize">
                      {m.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic Transaction ID / Reference Number input */}
            {paymentMethod !== "cash" && (
              <div className="col-span-2 space-y-1.5 bg-muted/20 p-2.5 rounded-lg border border-border/60">
                <Label htmlFor="reference_number" className="flex items-center gap-1.5 text-xs font-semibold">
                  <Hash className="h-3.5 w-3.5 text-primary" />
                  <span>Transaction ID / Ref No.</span>
                </Label>
                <Input
                  id="reference_number"
                  name="reference_number"
                  placeholder={getRefPlaceholder(paymentMethod)}
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="bg-card text-xs"
                />
              </div>
            )}

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                defaultValue={expense?.description ?? ""}
              />
            </div>

            {/* Receipt Photo / Screenshot upload */}
            <div className="col-span-2 space-y-1.5">
              <Label className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-primary" />
                  <span>Invoice Photo / Receipt Screenshot</span>
                </span>
                {receiptUrl && (
                  <button
                    type="button"
                    onClick={() => setReceiptUrl(null)}
                    className="text-[11px] text-rose-500 hover:underline flex items-center gap-1"
                  >
                    <X className="h-3 w-3" /> Remove
                  </button>
                )}
              </Label>
              {receiptUrl ? (
                <div className="relative group rounded-lg border border-border overflow-hidden bg-muted/30 p-2 flex items-center gap-3">
                  <img src={receiptUrl} alt="Receipt preview" className="h-14 w-14 object-cover rounded border border-border shrink-0" />
                  <div className="flex-1 text-xs">
                    <p className="font-semibold text-foreground">Attached Receipt Photo</p>
                    <p className="text-[10px] text-muted-foreground">Will be saved with this expense record</p>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border border-dashed border-border rounded-lg p-3 cursor-pointer hover:bg-accent/40 transition-colors">
                  <UploadCloud className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-xs font-medium text-foreground">Attach receipt image or payment screenshot</span>
                  <span className="text-[10px] text-muted-foreground">PNG, JPG, WEBP up to 3MB</span>
                  <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" />
                </label>
              )}
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={2} defaultValue={expense?.notes ?? ""} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={m.isPending}>
              {m.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ExpenseViewDialog({
  expense,
  onClose,
  onEdit,
  onViewReceipt,
}: {
  expense: Expense | null;
  onClose: () => void;
  onEdit: () => void;
  onViewReceipt: (url: string) => void;
}) {
  if (!expense) return null;

  return (
    <Dialog open={!!expense} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 pr-6">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" /> Expense Voucher Details
            </DialogTitle>
            <Badge variant="outline" className={`font-semibold capitalize text-[10px] ${getCategoryBadgeClass(expense.category)}`}>
              <Tag className="h-2.5 w-2.5 mr-1" /> {expense.category}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Big Amount Card */}
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-center">
            <p className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Voucher Amount</p>
            <p className="text-3xl font-display font-black text-rose-600 dark:text-rose-400">{formatINR(expense.amount)}</p>
            <p className="text-xs text-muted-foreground mt-1 font-mono">{formatDate(expense.expense_date)}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1 p-2.5 rounded-lg bg-muted/30 border border-border/60">
              <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider block">Payment Method</span>
              <Badge variant="outline" className={`capitalize font-semibold text-[10px] mt-1 ${getPaymentMethodBadgeClass(expense.payment_method)}`}>
                <CreditCard className="h-2.5 w-2.5 mr-1" /> {expense.payment_method.replace("_", " ")}
              </Badge>
            </div>

            <div className="space-y-1 p-2.5 rounded-lg bg-muted/30 border border-border/60">
              <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider block">Transaction ID / Ref</span>
              {expense.reference_number ? (
                <span className="font-mono font-semibold text-foreground text-xs block truncate mt-1" title={expense.reference_number}>
                  #{expense.reference_number}
                </span>
              ) : (
                <span className="text-muted-foreground italic text-xs mt-1 block">None provided</span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1 p-3 rounded-lg bg-muted/20 border border-border/60 text-xs">
            <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider block">Description</span>
            <p className="font-medium text-foreground text-xs">{expense.description || "No description specified."}</p>
          </div>

          {/* Notes */}
          {expense.notes && (
            <div className="space-y-1 p-3 rounded-lg bg-muted/20 border border-border/60 text-xs">
              <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider block">Notes</span>
              <p className="text-muted-foreground text-xs whitespace-pre-wrap">{expense.notes}</p>
            </div>
          )}

          {/* Attached Receipt Image */}
          {expense.receipt_url && (
            <div className="space-y-1.5 pt-1">
              <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider block">Attached Invoice / Receipt</span>
              <div
                onClick={() => onViewReceipt(expense.receipt_url!)}
                className="group relative cursor-pointer rounded-lg border border-border overflow-hidden bg-muted/40 p-2 flex items-center gap-3 hover:border-primary/50 transition-colors"
              >
                <img src={expense.receipt_url} alt="Receipt thumbnail" className="h-14 w-14 object-cover rounded border border-border shrink-0" />
                <div className="flex-1 text-xs">
                  <p className="font-semibold text-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                    <ImageIcon className="h-3.5 w-3.5" /> View Full Receipt Photo
                  </p>
                  <p className="text-[10px] text-muted-foreground">Click to inspect full resolution image</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5 text-xs">
            <Pencil className="h-3.5 w-3.5" /> Edit Expense
          </Button>
          <Button size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
