import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { queryOptions, useSuspenseQuery, useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listInvoices,
  upsertInvoice,
  deleteInvoice,
  markInvoicePaid,
  getInvoice,
} from "@/lib/invoices.functions";
import { listCustomers, upsertCustomer } from "@/lib/customers.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Trash2, Receipt, Check, FileText, Pencil, Search, X, Eye, Download } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/dashboard/page-shell";
import { formatINR, formatDate } from "@/lib/format";
import { useBusiness } from "@/hooks/use-business";
import { toast } from "sonner";
import { RoutePending, RouteError } from "@/components/dashboard/page-shell";

const invoicesOptions = queryOptions({ queryKey: ["invoices"], queryFn: () => listInvoices() });
const customersOptionsForPicker = queryOptions({
  queryKey: ["customers"],
  queryFn: () => listCustomers(),
});

export const Route = createFileRoute("/_authenticated/dashboard/invoices/")({
  head: () => ({ meta: [{ title: "Invoices — BizkitOps" }] }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(invoicesOptions),
      context.queryClient.ensureQueryData(customersOptionsForPicker),
    ]);
  },
  component: InvoicesPage,
  pendingComponent: RoutePending,
  errorComponent: RouteError,
});

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "paid") return "default";
  if (status === "overdue") return "destructive";
  if (status === "draft") return "outline";
  return "secondary";
}

function InvoicesPage() {
  const { data } = useSuspenseQuery(invoicesOptions);
  const [open, setOpen] = useState(false);
  const [editInvoiceId, setEditInvoiceId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const totals = useMemo(() => {
    const nonCancelled = data.filter((i) => i.status !== "cancelled");
    const all = nonCancelled.reduce((s, i) => s + Number(i.total_amount), 0);
    const collected = nonCancelled.reduce((s, i) => s + Number(i.amount_paid || 0), 0);
    const outstanding = nonCancelled.reduce(
      (s, i) => s + Math.max(0, Number(i.total_amount) - Number(i.amount_paid || 0)),
      0
    );
    return { all, outstanding, collected };
  }, [data]);

  const filteredInvoices = useMemo(() => {
    return data.filter((inv) => {
      const matchesSearch =
        inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.customer_name && inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesStatus = true;
      if (statusFilter !== "all") {
        if (statusFilter === "partial") {
          matchesStatus =
            inv.status === "pending" &&
            Number(inv.amount_paid || 0) > 0 &&
            Number(inv.amount_paid || 0) < Number(inv.total_amount);
        } else if (statusFilter === "pending") {
          matchesStatus = inv.status === "pending" && Number(inv.amount_paid || 0) === 0;
        } else {
          matchesStatus = inv.status === statusFilter;
        }
      }

      return matchesSearch && matchesStatus;
    });
  }, [data, searchTerm, statusFilter]);

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="GST-compliant invoices in 30 seconds."
        action={
          <Button onClick={() => { setEditInvoiceId(null); setOpen(true); }} className="gap-1">
            <Plus className="h-4 w-4" /> New invoice
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total billed", value: totals.all },
          { label: "Outstanding", value: totals.outstanding },
          { label: "Collected", value: totals.collected },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-display font-bold mt-1">{formatINR(s.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoice or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-8"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1.5 h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchTerm("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending (Unpaid)</SelectItem>
              <SelectItem value="partial">Partially Paid</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {data.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices yet"
          description="Create your first invoice and share it on WhatsApp in seconds."
          action={{ label: "New invoice", onClick: () => setOpen(true) }}
        />
      ) : filteredInvoices.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <p className="text-muted-foreground text-sm">No invoices found matching your criteria.</p>
          {(searchTerm || statusFilter !== "all") && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
            >
              Clear filters
            </Button>
          )}
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((inv) => {
                  const isPartial = inv.status === "pending" && Number(inv.amount_paid) > 0;
                  const isPaid = inv.status === "paid";
                  const isOverdue = inv.status === "overdue";
                  const isCancelled = inv.status === "cancelled";
                  
                  let rowBgClass = "";
                  if (isPaid) {
                    rowBgClass = "bg-emerald-100/50 hover:bg-emerald-100/70 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/40 transition-colors";
                  } else if (isOverdue) {
                    rowBgClass = "bg-rose-100/50 hover:bg-rose-100/70 dark:bg-rose-950/30 dark:hover:bg-rose-950/40 transition-colors";
                  } else if (isPartial) {
                    rowBgClass = "bg-amber-100/40 hover:bg-amber-100/60 dark:bg-amber-950/20 dark:hover:bg-amber-950/30 transition-colors";
                  } else if (isCancelled) {
                    rowBgClass = "opacity-75 bg-zinc-100/40 hover:bg-zinc-100/60 dark:bg-zinc-900/25 dark:hover:bg-zinc-900/35 transition-colors";
                  } else {
                    // Unpaid / Pending
                    rowBgClass = "bg-rose-100/50 hover:bg-rose-100/70 dark:bg-rose-950/30 dark:hover:bg-rose-950/40 transition-colors";
                  }

                  return (
                    <TableRow key={inv.id} className={rowBgClass}>
                      <TableCell>
                        <Link
                          to="/dashboard/invoices/$id"
                          params={{ id: inv.id }}
                          className="font-mono font-semibold text-primary hover:underline"
                        >
                          {inv.invoice_number}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">{inv.customer_name ?? "—"}</TableCell>
                      <TableCell>{formatDate(inv.issue_date)}</TableCell>
                      <TableCell>{inv.due_date ? formatDate(inv.due_date) : "—"}</TableCell>
                      <TableCell>
                        {isPaid ? (
                          <Badge variant="outline" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 font-semibold shadow-soft">
                            Paid
                          </Badge>
                        ) : isOverdue ? (
                          <Badge variant="outline" className="bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 font-semibold shadow-soft">
                            Overdue
                          </Badge>
                        ) : isPartial ? (
                          <Badge variant="outline" className="bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200 font-semibold shadow-soft">
                            Partial ({Math.round((Number(inv.amount_paid) / Number(inv.total_amount)) * 100)}%)
                          </Badge>
                        ) : isCancelled ? (
                          <Badge variant="outline" className="bg-zinc-100 text-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400 border-zinc-200 font-semibold shadow-soft">
                            Cancelled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 font-semibold shadow-soft">
                            Unpaid
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-semibold">{formatINR(inv.total_amount)}</div>
                        {isPartial && (
                          <div className="text-[10px] text-muted-foreground font-semibold">
                            Due: {formatINR(Number(inv.total_amount) - Number(inv.amount_paid))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            title="View / Print Invoice"
                          >
                            <Link to="/dashboard/invoices/$id" params={{ id: inv.id }}>
                              <Eye className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            title="Download PDF"
                          >
                            <Link to="/dashboard/invoices/$id" params={{ id: inv.id }} search={{ download: true }}>
                              <Download className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditInvoiceId(inv.id);
                              setOpen(true);
                            }}
                            title="Edit invoice"
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                          </Button>
                          {inv.status !== "paid" && <MarkPaidButton id={inv.id} />}
                          <DeleteButton id={inv.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <NewInvoiceDialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (!val) setEditInvoiceId(null);
        }}
        invoiceId={editInvoiceId}
      />
    </div>
  );
}

function MarkPaidButton({ id }: { id: string }) {
  const qc = useQueryClient();
  const fn = useServerFn(markInvoicePaid);
  const m = useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Marked as paid");
    },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={m.isPending}
      onClick={() => m.mutate({ data: { id } })}
      title="Mark paid"
    >
      {m.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Check className="h-4 w-4 text-success" />
      )}
    </Button>
  );
}

function DeleteButton({ id }: { id: string }) {
  const qc = useQueryClient();
  const fn = useServerFn(deleteInvoice);
  const m = useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice deleted");
    },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={m.isPending}
      onClick={() => {
        if (confirm("Delete this invoice?")) m.mutate({ data: { id } });
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

interface Line {
  description: string;
  quantity: number;
  rate: number;
  gst_percent: number;
  discount_percent: number;
  unit: string;
}

function NewInvoiceDialog({
  open,
  onOpenChange,
  invoiceId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  invoiceId?: string | null;
}) {
  const qc = useQueryClient();
  const { data: bizData } = useBusiness();
  const business = bizData.business!;
  const { data: customers } = useSuspenseQuery(customersOptionsForPicker);
  const save = useServerFn(upsertInvoice);

  const [customerSearch, setCustomerSearch] = useState("");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustGst, setNewCustGst] = useState("");
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);
  const saveCustomer = useServerFn(upsertCustomer);

  const handleQuickAddCustomer = async () => {
    if (!newCustName.trim()) {
      toast.error("Customer name is required");
      return;
    }
    setIsSavingCustomer(true);
    try {
      const res = await saveCustomer({
        data: {
          name: newCustName,
          phone: newCustPhone,
          email: newCustEmail,
          gst_number: newCustGst,
        },
      });
      toast.success("Customer saved successfully!");
      await qc.invalidateQueries({ queryKey: ["customers"] });
      setCustomerId(res.id);
      setCustomerName(newCustName);
      setNewCustName("");
      setNewCustPhone("");
      setNewCustEmail("");
      setNewCustGst("");
      setQuickAddOpen(false);
    } catch (err) {
      toast.error(`Failed to save customer: ${(err as Error).message}`);
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    return customers.filter((c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.phone && c.phone.includes(customerSearch))
    );
  }, [customers, customerSearch]);

  const today = new Date().toISOString().slice(0, 10);
  const defaultDue = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const defaultGst = Number(business.default_gst_percent ?? 18);

  const [customerId, setCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [issueDate, setIssueDate] = useState(today);
  const [dueDate, setDueDate] = useState(defaultDue);
  const [isInterstate, setIsInterstate] = useState(false);
  const [notes, setNotes] = useState("");
  const [flatDiscount, setFlatDiscount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [lines, setLines] = useState<Line[]>([
    {
      description: "",
      quantity: 1,
      rate: 0,
      gst_percent: defaultGst,
      discount_percent: 0,
      unit: "pcs",
    },
  ]);

  const { data: editData } = useQuery({
    queryKey: ["invoice-edit", invoiceId],
    queryFn: () => getInvoice({ data: { id: invoiceId! } }),
    enabled: !!invoiceId && open,
  });

  useEffect(() => {
    if (invoiceId && editData) {
      const { invoice, items } = editData as any;
      setCustomerId(invoice.customer_id || "");
      setCustomerName(invoice.customer_name || "");
      setIssueDate(invoice.issue_date ? invoice.issue_date.slice(0, 10) : today);
      setDueDate(invoice.due_date ? invoice.due_date.slice(0, 10) : "");
      setIsInterstate(invoice.is_interstate || false);
      setNotes(invoice.notes || "");
      setFlatDiscount(Number(invoice.discount_amount ?? 0));
      setAmountPaid(Number(invoice.amount_paid ?? 0));
      setLines(
        items.map((it: any) => ({
          description: it.description || "",
          quantity: Number(it.quantity ?? 1),
          rate: Number(it.rate ?? 0),
          gst_percent: Number(it.gst_percent ?? defaultGst),
          discount_percent: Number(it.discount_percent ?? 0),
          unit: it.unit || "pcs",
        }))
      );
    } else if (!invoiceId) {
      setCustomerId("");
      setCustomerName("");
      setIssueDate(today);
      setDueDate(defaultDue);
      setIsInterstate(false);
      setNotes("");
      setFlatDiscount(0);
      setAmountPaid(0);
      setLines([
        {
          description: "",
          quantity: 1,
          rate: 0,
          gst_percent: defaultGst,
          discount_percent: 0,
          unit: "pcs",
        },
      ]);
    }
  }, [invoiceId, editData, today, defaultDue, defaultGst]);

  const totals = useMemo(() => {
    let subtotal = 0,
      discount = 0,
      tax = 0;
    for (const l of lines) {
      const gross = l.quantity * l.rate;
      const d = (gross * l.discount_percent) / 100;
      const t = ((gross - d) * l.gst_percent) / 100;
      subtotal += gross;
      discount += d;
      tax += t;
    }
    const total = Math.max(0, subtotal - discount + tax - flatDiscount);
    return {
      subtotal,
      itemDiscount: discount,
      tax,
      cgst: isInterstate ? 0 : tax / 2,
      sgst: isInterstate ? 0 : tax / 2,
      igst: isInterstate ? tax : 0,
      total,
      balance: Math.max(0, total - amountPaid),
    };
  }, [lines, isInterstate, flatDiscount, amountPaid]);

  const updateLine = (idx: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const m = useMutation({
    mutationFn: save,
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast.success(invoiceId ? `Invoice ${r.invoice_number} updated` : `Invoice ${r.invoice_number} created`);
      onOpenChange(false);
      // reset
      setLines([
        {
          description: "",
          quantity: 1,
          rate: 0,
          gst_percent: defaultGst,
          discount_percent: 0,
          unit: "pcs",
        },
      ]);
      setCustomerId("");
      setCustomerName("");
      setNotes("");
      setFlatDiscount(0);
      setAmountPaid(0);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return toast.error("Enter a customer name");
    const valid = lines.every((l) => l.description.trim() && l.quantity > 0 && l.rate >= 0);
    if (!valid) return toast.error("Each line needs a description, quantity, and rate");
    m.mutate({
      data: {
        id: invoiceId || undefined,
        customer_id: customerId || null,
        customer_name: customerName,
        issue_date: issueDate,
        due_date: dueDate,
        is_interstate: isInterstate,
        notes,
        items: lines,
        discount_amount: flatDiscount,
        amount_paid: amountPaid,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{invoiceId ? "Edit invoice" : "New invoice"}</DialogTitle>
          <DialogDescription>
            {invoiceId ? "Modify your line items and details." : "Add line items, GST is auto-calculated based on your settings."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="flex justify-between items-center">
                <span>Customer</span>
                {quickAddOpen ? (
                  <span className="text-xs text-primary font-medium animate-pulse">Adding new...</span>
                ) : (
                  <span className="text-xs text-muted-foreground">Select customer</span>
                )}
              </Label>
              <div className="flex gap-2">
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={popoverOpen}
                      className="flex-1 justify-between font-normal text-left h-10 w-full overflow-hidden text-ellipsis whitespace-nowrap cursor-pointer hover:bg-background"
                    >
                      {customerName || "Walk-in Customer / Select..."}
                      <span className="text-muted-foreground ml-2 text-[10px]">▼</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <div className="flex flex-col">
                      <div className="p-2 border-b border-border/60">
                        <Input
                          placeholder="Search customers..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="h-8 text-xs bg-muted/20"
                          autoFocus
                        />
                      </div>
                      <div className="max-h-[200px] overflow-y-auto p-1 space-y-0.5">
                        <button
                          type="button"
                          className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-muted font-medium text-muted-foreground italic flex items-center justify-between cursor-pointer"
                          onClick={() => {
                            setCustomerId("");
                            setCustomerName("");
                            setPopoverOpen(false);
                          }}
                        >
                          <span>-- Walk-in / Generic Customer --</span>
                        </button>
                        {filteredCustomers.length === 0 ? (
                          <div className="p-3 text-xs text-muted-foreground text-center">
                            No customers found. Click "Add Customer" to create one.
                          </div>
                        ) : (
                          filteredCustomers.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-primary/10 hover:text-primary transition-colors flex flex-col cursor-pointer"
                              onClick={() => {
                                setCustomerId(c.id);
                                setCustomerName(c.name);
                                setPopoverOpen(false);
                              }}
                            >
                              <span className="font-medium">{c.name}</span>
                              {c.phone && <span className="text-[10px] text-muted-foreground">{c.phone}</span>}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setNewCustName(customerSearch || customerName);
                    setQuickAddOpen(true);
                  }}
                  className="gap-1.5 px-3 h-10 cursor-pointer shrink-0 text-xs font-semibold bg-muted/30 hover:bg-muted"
                >
                  <Plus className="h-4 w-4 text-primary" />
                  Add Customer
                </Button>
              </div>

              <Input
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  const match = customers.find(c => c.name.toLowerCase() === e.target.value.toLowerCase());
                  if (match) setCustomerId(match.id);
                  else setCustomerId("");
                }}
                placeholder="Customer name for invoice"
                required
              />

              {quickAddOpen && (
                <div className="border border-primary/20 bg-primary/5 rounded-xl p-3.5 space-y-3 mt-2">
                  <div className="flex justify-between items-center pb-2 border-b border-primary/10">
                    <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                      ✨ Create & Save New Customer
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                      onClick={() => setQuickAddOpen(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Customer Name *</Label>
                      <Input
                        placeholder="e.g. John Doe"
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        className="h-8 text-xs bg-background"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Phone Number</Label>
                      <Input
                        placeholder="e.g. +91 9876543210"
                        value={newCustPhone}
                        onChange={(e) => setNewCustPhone(e.target.value)}
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Email Address</Label>
                      <Input
                        type="email"
                        placeholder="e.g. email@example.com"
                        value={newCustEmail}
                        onChange={(e) => setNewCustEmail(e.target.value)}
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">GST Number</Label>
                      <Input
                        placeholder="e.g. 27AAAAA1111A1Z1"
                        value={newCustGst}
                        onChange={(e) => setNewCustGst(e.target.value)}
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button
                      type="button"
                      size="sm"
                      disabled={isSavingCustomer}
                      onClick={handleQuickAddCustomer}
                      className="h-8 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                    >
                      {isSavingCustomer ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : null}
                      Save Customer
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="issue_date">Issue date</Label>
                <Input
                  id="issue_date"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="due_date">Due date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-3">
            <Switch id="interstate" checked={isInterstate} onCheckedChange={setIsInterstate} />
            <Label htmlFor="interstate" className="cursor-pointer text-sm">
              Inter-state supply (IGST instead of CGST + SGST)
            </Label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Line items</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setLines((p) => [
                    ...p,
                    {
                      description: "",
                      quantity: 1,
                      rate: 0,
                      gst_percent: defaultGst,
                      discount_percent: 0,
                      unit: "pcs",
                    },
                  ])
                }
              >
                <Plus className="h-3 w-3" /> Add line
              </Button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 px-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                <div className="col-span-4">Item Description</div>
                <div className="col-span-1">Qty</div>
                <div className="col-span-2">MRP/Rate</div>
                <div className="col-span-2">Disc %</div>
                <div className="col-span-1">GST %</div>
                <div className="col-span-2">Total</div>
              </div>
              {lines.map((l, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <Input
                    className="col-span-4"
                    placeholder="Description"
                    value={l.description}
                    onChange={(e) => updateLine(idx, { description: e.target.value })}
                  />
                  <Input
                    className="col-span-1"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Qty"
                    value={l.quantity}
                    onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })}
                  />
                  <Input
                    className="col-span-2"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Rate"
                    value={l.rate}
                    onChange={(e) => updateLine(idx, { rate: Number(e.target.value) })}
                  />
                  <Input
                    className="col-span-2"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="Disc %"
                    value={l.discount_percent}
                    onChange={(e) => updateLine(idx, { discount_percent: Number(e.target.value) })}
                  />
                  <Input
                    className="col-span-1"
                    type="number"
                    min="0"
                    max="50"
                    step="0.01"
                    placeholder="GST %"
                    value={l.gst_percent}
                    onChange={(e) => updateLine(idx, { gst_percent: Number(e.target.value) })}
                  />
                  <div className="col-span-2 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {formatINR(
                        l.quantity *
                          l.rate *
                          (1 - l.discount_percent / 100) *
                          (1 + l.gst_percent / 100),
                      )}
                    </span>
                    {lines.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setLines((p) => p.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="flat_discount">Flat Invoice Discount (₹)</Label>
              <Input
                id="flat_discount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={flatDiscount || ""}
                onChange={(e) => setFlatDiscount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount_paid">Advance / Amount Paid (₹)</Label>
              <Input
                id="amount_paid"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amountPaid || ""}
                onChange={(e) => setAmountPaid(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatINR(totals.subtotal)}</span>
            </div>
            {totals.itemDiscount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Item Discounts</span>
                <span>− {formatINR(totals.itemDiscount)}</span>
              </div>
            )}
            {isInterstate ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">IGST</span>
                <span>{formatINR(totals.igst)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CGST</span>
                  <span>{formatINR(totals.cgst)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SGST</span>
                  <span>{formatINR(totals.sgst)}</span>
                </div>
              </>
            )}
            {flatDiscount > 0 && (
              <div className="flex justify-between text-amber-600 font-medium">
                <span>Flat Discount</span>
                <span>− {formatINR(flatDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-border font-display font-bold text-base">
              <span>Total</span>
              <span>{formatINR(totals.total)}</span>
            </div>
            {amountPaid > 0 && (
              <>
                <div className="flex justify-between text-muted-foreground pt-1.5 border-t border-border/40">
                  <span>Less: Advance Paid</span>
                  <span>{formatINR(amountPaid)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-border/80 font-display font-bold text-base text-primary">
                  <span>Balance Due</span>
                  <span>{formatINR(totals.balance)}</span>
                </div>
              </>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes / terms</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Thank you for your business."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={m.isPending} className="gap-1">
              {m.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {invoiceId ? "Save changes" : "Create invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
