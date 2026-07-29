import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, Fragment } from "react";
import { queryOptions, useSuspenseQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCustomers, upsertCustomer, deleteCustomer } from "@/lib/customers.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Users,
  Search,
  ChevronDown,
  ChevronUp,
  Receipt,
  FileText,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { PageHeader, EmptyState } from "@/components/dashboard/page-shell";
import { formatINR, formatDate } from "@/lib/format";
import { toast } from "sonner";
import { RoutePending, RouteError } from "@/components/dashboard/page-shell";

const customersOptions = queryOptions({
  queryKey: ["customers"],
  queryFn: () => listCustomers(),
});

export const Route = createFileRoute("/_authenticated/dashboard/customers/")({
  head: () => ({ meta: [{ title: "Customers — BizkitOps" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(customersOptions),
  component: CustomersPage,
  pendingComponent: RoutePending,
  errorComponent: RouteError,
});

type Customer = Awaited<ReturnType<typeof listCustomers>>[number];

function CustomersPage() {
  const { data } = useSuspenseQuery(customersOptions);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [query, setQuery] = useState("");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filtered = data.filter((c) =>
    [c.name, c.phone, c.email, c.city].join(" ").toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Build a list of repeat buyers, track their outstanding balances, and check invoice histories."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="gap-1 shadow-soft"
          >
            <Plus className="h-4 w-4" /> Add customer
          </Button>
        }
      />

      {data.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Add your first customer to start tracking who buys from you."
          action={{
            label: "Add customer",
            onClick: () => {
              setEditing(null);
              setOpen(true);
            },
          }}
        />
      ) : (
        <Card className="shadow-card border-border">
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, phone, email…"
                  className="pl-9 bg-card"
                />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Paid Amount</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="w-24 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const invoices = (c as any).invoices || [];
                  const totalPaid = invoices.reduce(
                    (acc: number, inv: any) => acc + Number(inv.amount_paid || 0),
                    0
                  );
                  const totalOutstanding = invoices.reduce((acc: number, inv: any) => {
                    if (inv.status === "cancelled") return acc;
                    return acc + Math.max(0, Number(inv.total_amount || 0) - Number(inv.amount_paid || 0));
                  }, 0);

                  const isExpanded = expandedRows[c.id] || false;

                  return (
                    <Fragment key={c.id}>
                      <TableRow key={c.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => toggleExpand(c.id)}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4.5 w-4.5" />
                            ) : (
                              <ChevronDown className="h-4.5 w-4.5" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell className="font-semibold text-foreground">
                          <button
                            onClick={() => toggleExpand(c.id)}
                            className="text-left hover:underline font-semibold focus:outline-none"
                          >
                            {c.name}
                          </button>
                        </TableCell>
                        <TableCell>{c.phone ?? "—"}</TableCell>
                        <TableCell>{c.email ?? "—"}</TableCell>
                        <TableCell>{c.city ?? "—"}</TableCell>
                        <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {formatINR(totalPaid)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-rose-600 dark:text-rose-400">
                          {formatINR(totalOutstanding)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditing(c);
                                setOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </Button>
                            <DeleteButton id={c.id} />
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${c.id}-details`} className="bg-muted/25 dark:bg-muted/5 border-l-4 border-l-primary/60">
                          <TableCell colSpan={8} className="p-6">
                            <div className="space-y-4">
                              {/* Invoice breakdown summary */}
                              <div className="flex flex-wrap gap-4 items-center justify-between">
                                <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                                  <Receipt className="h-4 w-4" /> Client Ledger Account Summary
                                </div>
                                <div className="flex gap-4">
                                  <div className="text-xs bg-emerald-100/60 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200/50 rounded-lg px-3 py-1.5">
                                    Total Cleared: <span className="font-bold">{formatINR(totalPaid)}</span>
                                  </div>
                                  <div className="text-xs bg-rose-100/60 dark:bg-rose-950/20 text-rose-800 dark:text-rose-400 border border-rose-200/50 rounded-lg px-3 py-1.5">
                                    Total Outstanding: <span className="font-bold">{formatINR(totalOutstanding)}</span>
                                  </div>
                                  <div className="text-xs bg-secondary/80 text-secondary-foreground border border-border rounded-lg px-3 py-1.5">
                                    Invoices: <span className="font-bold">{invoices.length}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Customer address & contact info */}
                              {(c.address || c.gst_number || c.notes) && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card p-4 rounded-xl border border-border text-xs">
                                  {c.address && (
                                    <div>
                                      <span className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">Billing Address</span>
                                      <span className="text-muted-foreground">{c.address}</span>
                                    </div>
                                  )}
                                  {c.gst_number && (
                                    <div>
                                      <span className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">GSTIN</span>
                                      <span className="font-mono text-muted-foreground">{c.gst_number}</span>
                                    </div>
                                  )}
                                  {c.notes && (
                                    <div>
                                      <span className="font-bold text-muted-foreground uppercase tracking-wider block mb-1">Internal Notes</span>
                                      <span className="text-muted-foreground">{c.notes}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Nested Invoice list */}
                              {invoices.length === 0 ? (
                                <div className="border border-dashed border-border rounded-xl p-6 text-center text-xs text-muted-foreground space-y-2 bg-card">
                                  <div>No invoices created for this customer yet.</div>
                                  <Link to="/dashboard/invoices" className="inline-flex">
                                    <Button size="sm" className="gap-1 mt-1 text-[11px] h-8">
                                      <Plus className="h-3 w-3" /> Create First Invoice
                                    </Button>
                                  </Link>
                                </div>
                              ) : (
                                <div className="border border-border rounded-xl overflow-hidden bg-card">
                                  <Table>
                                    <TableHeader className="bg-muted/40">
                                      <TableRow className="hover:bg-transparent">
                                        <TableHead className="text-[11px] py-2 h-9">Invoice #</TableHead>
                                        <TableHead className="text-[11px] py-2 h-9">Issue Date</TableHead>
                                        <TableHead className="text-[11px] py-2 h-9">Due Date</TableHead>
                                        <TableHead className="text-[11px] py-2 h-9 text-right">Billed Amount</TableHead>
                                        <TableHead className="text-[11px] py-2 h-9 text-right">Amount Paid</TableHead>
                                        <TableHead className="text-[11px] py-2 h-9 text-right">Outstanding</TableHead>
                                        <TableHead className="text-[11px] py-2 h-9">Status</TableHead>
                                        <TableHead className="text-[11px] py-2 h-9 w-20 text-right">Link</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {invoices.map((inv: any) => {
                                        const outstanding = Math.max(0, Number(inv.total_amount) - Number(inv.amount_paid || 0));
                                        return (
                                          <TableRow key={inv.id} className="hover:bg-muted/10">
                                            <TableCell className="font-mono text-xs py-2 h-9">
                                              <Link
                                                to="/dashboard/invoices/$id"
                                                params={{ id: inv.id }}
                                                className="text-primary hover:underline font-semibold"
                                              >
                                                {inv.invoice_number}
                                              </Link>
                                            </TableCell>
                                            <TableCell className="text-xs py-2 h-9">{formatDate(inv.issue_date)}</TableCell>
                                            <TableCell className="text-xs py-2 h-9">{inv.due_date ? formatDate(inv.due_date) : "—"}</TableCell>
                                            <TableCell className="text-xs py-2 h-9 text-right font-medium">{formatINR(inv.total_amount)}</TableCell>
                                            <TableCell className="text-xs py-2 h-9 text-right text-emerald-600 dark:text-emerald-400 font-medium">{formatINR(inv.amount_paid)}</TableCell>
                                            <TableCell className="text-xs py-2 h-9 text-right text-rose-600 dark:text-rose-400 font-medium">{formatINR(outstanding)}</TableCell>
                                            <TableCell className="text-xs py-2 h-9">
                                              {inv.status === "paid" && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-200/40">
                                                  <CheckCircle className="h-3 w-3" /> Paid
                                                </span>
                                              )}
                                              {inv.status === "pending" && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-200/40">
                                                  <AlertCircle className="h-3 w-3" /> {Number(inv.amount_paid) > 0 ? "Partial" : "Unpaid"}
                                                </span>
                                              )}
                                              {inv.status === "overdue" && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100/50 dark:bg-rose-950/20 px-2 py-0.5 rounded border border-rose-200/40">
                                                  <AlertCircle className="h-3 w-3" /> Overdue
                                                </span>
                                              )}
                                              {inv.status === "cancelled" && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-500 bg-zinc-100/50 px-2 py-0.5 rounded border border-zinc-200/40">
                                                  Cancelled
                                                </span>
                                              )}
                                            </TableCell>
                                            <TableCell className="text-xs py-2 h-9 text-right">
                                              <Link to="/dashboard/invoices/$id" params={{ id: inv.id }}>
                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                  <FileText className="h-3.5 w-3.5" />
                                                </Button>
                                              </Link>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <CustomerDialog open={open} onOpenChange={setOpen} customer={editing} />
    </div>
  );
}

function DeleteButton({ id }: { id: string }) {
  const qc = useQueryClient();
  const del = useServerFn(deleteCustomer);
  const m = useMutation({
    mutationFn: del,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer removed");
    },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <Button
      variant="ghost"
      size="icon"
      disabled={m.isPending}
      onClick={() => {
        if (confirm("Delete this customer?")) m.mutate({ data: { id } });
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

function CustomerDialog({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  customer: Customer | null;
}) {
  const qc = useQueryClient();
  const save = useServerFn(upsertCustomer);
  const m = useMutation({
    mutationFn: save,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success(customer ? "Customer updated" : "Customer added");
      onOpenChange(false);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    m.mutate({
      data: {
        id: customer?.id,
        name: String(f.get("name") ?? ""),
        phone: String(f.get("phone") ?? ""),
        email: String(f.get("email") ?? ""),
        city: String(f.get("city") ?? ""),
        address: String(f.get("address") ?? ""),
        gst_number: String(f.get("gst_number") ?? ""),
        notes: String(f.get("notes") ?? ""),
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{customer ? "Edit customer" : "Add customer"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required defaultValue={customer?.name ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={customer?.phone ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={customer?.email ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" defaultValue={customer?.city ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gst_number">GSTIN</Label>
              <Input id="gst_number" name="gst_number" defaultValue={customer?.gst_number ?? ""} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                rows={2}
                defaultValue={customer?.address ?? ""}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={2} defaultValue={customer?.notes ?? ""} />
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
