import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DatabaseBackup, FileArchive, FileJson, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard/page-shell";
import { useBusiness, businessQueryOptions } from "@/hooks/use-business";
import { updateBusinessSettings } from "@/lib/settings.functions";
import { downloadBusinessData, type ExportFormat } from "@/lib/export-data";
import { toast } from "sonner";
import { RoutePending, RouteError } from "@/components/dashboard/page-shell";

export const Route = createFileRoute("/_authenticated/dashboard/settings/")({
  head: () => ({ meta: [{ title: "Settings — BizkitOps" }] }),
  component: SettingsPage,
  pendingComponent: RoutePending,
  errorComponent: RouteError,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { data } = useBusiness();
  const b = data.business!;
  const save = useServerFn(updateBusinessSettings);

  const m = useMutation({
    mutationFn: save,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: businessQueryOptions.queryKey });
      toast.success("Settings saved");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    m.mutate({
      data: {
        name: String(f.get("name") ?? ""),
        category: String(f.get("category") ?? ""),
        phone: String(f.get("phone") ?? ""),
        email: String(f.get("email") ?? ""),
        city: String(f.get("city") ?? ""),
        address: String(f.get("address") ?? ""),
        gst_number: String(f.get("gst_number") ?? ""),
        invoice_prefix: String(f.get("invoice_prefix") ?? ""),
        invoice_footer: String(f.get("invoice_footer") ?? ""),
        default_gst_percent: Number(f.get("default_gst_percent") ?? 18),
        default_payment_terms: String(f.get("default_payment_terms") ?? ""),
        bank_name: String(f.get("bank_name") ?? ""),
        bank_account: String(f.get("bank_account") ?? ""),
        bank_ifsc: String(f.get("bank_ifsc") ?? ""),
        bank_upi: String(f.get("bank_upi") ?? ""),
      },
    });
  };

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Settings"
        description="Manage business profile, invoicing defaults, and bank details."
      />
      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business profile</CardTitle>
            <CardDescription>Used across invoices, storefront, and emails.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field id="name" label="Business name" required defaultValue={b.name} />
            <Field id="category" label="Category" defaultValue={b.category ?? ""} />
            <Field id="phone" label="Phone" defaultValue={b.phone ?? ""} />
            <Field id="email" label="Email" type="email" defaultValue={b.email ?? ""} />
            <Field id="city" label="City" defaultValue={b.city ?? ""} />
            <Field id="gst_number" label="GSTIN" defaultValue={b.gst_number ?? ""} />
            <div className="md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" name="address" rows={2} defaultValue={b.address ?? ""} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoicing defaults</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              id="invoice_prefix"
              label="Invoice prefix"
              defaultValue={b.invoice_prefix ?? "INV"}
            />
            <Field
              id="default_gst_percent"
              label="Default GST %"
              type="number"
              defaultValue={String(b.default_gst_percent ?? 18)}
            />
            <div className="md:col-span-2">
              <Label htmlFor="default_payment_terms">Default payment terms</Label>
              <Input
                id="default_payment_terms"
                name="default_payment_terms"
                defaultValue={b.default_payment_terms ?? ""}
                placeholder="Net 7 days"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="invoice_footer">Invoice footer</Label>
              <Textarea
                id="invoice_footer"
                name="invoice_footer"
                rows={2}
                defaultValue={b.invoice_footer ?? ""}
                placeholder="Thank you for your business."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bank & payment details</CardTitle>
            <CardDescription>Shown on invoices so customers can pay you.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field id="bank_name" label="Bank name" defaultValue={b.bank_name ?? ""} />
            <Field id="bank_account" label="Account number" defaultValue={b.bank_account ?? ""} />
            <Field id="bank_ifsc" label="IFSC" defaultValue={b.bank_ifsc ?? ""} />
            <Field id="bank_upi" label="UPI ID" defaultValue={b.bank_upi ?? ""} />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={m.isPending}>
            {m.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
          </Button>
        </div>
      </form>

      {(data.role === "owner" || data.role === "admin") && <ExportCard />}
    </div>
  );
}

const EXPORT_FORMATS: {
  format: ExportFormat;
  label: string;
  hint: string;
  icon: typeof FileText;
}[] = [
  { format: "xlsx", label: "Excel", hint: ".xlsx, one sheet per section", icon: FileSpreadsheet },
  { format: "csv", label: "CSV", hint: ".zip of CSV files", icon: FileArchive },
  { format: "pdf", label: "PDF", hint: "Print or save as PDF", icon: FileText },
  { format: "json", label: "JSON", hint: "Full backup", icon: FileJson },
];

function ExportCard() {
  const [busy, setBusy] = useState<ExportFormat | null>(null);

  const run = async (format: ExportFormat) => {
    setBusy(format);
    try {
      const n = await downloadBusinessData(format);
      toast.success(format === "pdf" ? `Prepared ${n} records for PDF` : `Downloaded ${n} records`);
    } catch (e) {
      toast.error((e as Error).message || "Export failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <DatabaseBackup className="h-4 w-4" /> Download your data
        </CardTitle>
        <CardDescription>
          Export everything in your business — profile, customers, invoices, expenses, inventory,
          leads, appointments, staff and more.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {EXPORT_FORMATS.map(({ format, label, hint, icon: Icon }) => (
          <Button
            key={format}
            type="button"
            variant="outline"
            className="h-auto flex-col gap-1 py-3"
            disabled={busy !== null}
            onClick={() => run(format)}
          >
            {busy === format ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Icon className="h-5 w-5" />
            )}
            <span className="font-medium">{label}</span>
            <span className="text-xs text-muted-foreground font-normal">{hint}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

function Field({
  id,
  label,
  type = "text",
  defaultValue,
  required,
}: {
  id: string;
  label: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} type={type} required={required} defaultValue={defaultValue} />
    </div>
  );
}
