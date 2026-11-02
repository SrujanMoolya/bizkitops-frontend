import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { Loader2, Package, Pencil, Plus, Search, Trash2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatINR } from "@/lib/format";
import { INDUSTRY_ICONS } from "@/lib/industry-icons";
import type { EntityDef, FieldDef, IndustryModule } from "@/lib/industry-modules";
import {
  createIndustryRecord,
  deleteIndustryRecord,
  listIndustryRecords,
  updateIndustryRecord,
  type IndustryRecord,
} from "@/lib/industry.functions";

const NONE = "__none"; // Select items cannot have an empty value

// ---------------------------------------------------------------- display helpers

function display(field: FieldDef | undefined, v: unknown) {
  if (v === undefined || v === null || v === "") return "—";
  if (!field) return String(v);
  switch (field.type) {
    case "currency":
      return formatINR(Number(v));
    case "percent":
      return `${v}%`;
    case "date":
      return formatDate(String(v));
    default:
      return String(v);
  }
}

const GOOD =
  /^(active|available|completed|paid|delivered|dispensed|checked out|sold|rented|booked|confirmed|served|visited|interested|ready|running|disbursed|approved|closed|otc)$/i;
const BAD =
  /^(cancelled|expired|defaulted|rejected|no-show|returned|sold out|dropped|not interested|left|maintenance|schedule x)$/i;

function StatusBadge({ value }: { value?: unknown }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const s = String(value);
  const cls = GOOD.test(s)
    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
    : BAD.test(s)
      ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20"
      : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
  return (
    <Badge variant="outline" className={`font-medium whitespace-nowrap ${cls}`}>
      {s}
    </Badge>
  );
}

/** Records whose alert date is within the window (or already past), soonest first. */
function alertsFor(entity: EntityDef, records: IndustryRecord[]) {
  const a = entity.alert;
  if (!a) return [];
  const today = new Date();
  return records
    .map((r) => {
      const v = r.data[a.field];
      if (typeof v !== "string" || !v) return null;
      if (a.unlessStatus && r.status && a.unlessStatus.includes(r.status)) return null;
      const days = differenceInCalendarDays(parseISO(v), today);
      return days <= a.withinDays ? { record: r, days } : null;
    })
    .filter((x): x is { record: IndustryRecord; days: number } => x !== null)
    .sort((x, y) => x.days - y.days);
}

function dueLabel(days: number) {
  if (days < 0) return `${-days} day${days === -1 ? "" : "s"} overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

// ---------------------------------------------------------------- page

export function IndustryModulePage({ mod }: { mod: IndustryModule }) {
  const Icon = INDUSTRY_ICONS[mod.icon] ?? Package;
  const [tab, setTab] = useState("overview");
  const [editing, setEditing] = useState<{ entity: EntityDef; record?: IndustryRecord } | null>(
    null,
  );

  const {
    data: records = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["industry-records", mod.key],
    queryFn: () => listIndustryRecords(mod.key),
  });

  const byEntity = useMemo(() => {
    const m = new Map<string, IndustryRecord[]>(mod.entities.map((e) => [e.key, []]));
    for (const r of records) m.get(r.entity)?.push(r);
    return m;
  }, [records, mod.entities]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={mod.name}
        description={mod.description}
        action={
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Icon className="h-5 w-5" />
          </div>
        }
      />

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="py-4 text-sm">{(error as Error).message}</CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-12 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading records…
        </div>
      ) : (
        <Tabs value={tab} onValueChange={setTab} className="space-y-4">
          <div className="overflow-x-auto">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              {mod.entities.map((e) => (
                <TabsTrigger key={e.key} value={e.key}>
                  {e.label}
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {byEntity.get(e.key)!.length}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="overview">
            <Overview
              mod={mod}
              byEntity={byEntity}
              onOpen={(entity, record) => setEditing({ entity, record })}
              onAdd={(entity) => setEditing({ entity })}
              onTab={setTab}
            />
          </TabsContent>

          {mod.entities.map((e) => (
            <TabsContent key={e.key} value={e.key}>
              <EntityPanel
                entity={e}
                records={byEntity.get(e.key)!}
                onAdd={() => setEditing({ entity: e })}
                onEdit={(record) => setEditing({ entity: e, record })}
                moduleKey={mod.key}
              />
            </TabsContent>
          ))}
        </Tabs>
      )}

      {editing && (
        <RecordDialog
          moduleKey={mod.key}
          entity={editing.entity}
          record={editing.record}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- overview

function Overview({
  mod,
  byEntity,
  onOpen,
  onAdd,
  onTab,
}: {
  mod: IndustryModule;
  byEntity: Map<string, IndustryRecord[]>;
  onOpen: (e: EntityDef, r: IndustryRecord) => void;
  onAdd: (e: EntityDef) => void;
  onTab: (key: string) => void;
}) {
  const alerts = mod.entities.flatMap((e) =>
    alertsFor(e, byEntity.get(e.key)!).map((a) => ({ ...a, entity: e })),
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {mod.entities.map((e) => {
          const rows = byEntity.get(e.key)!;
          const total = e.amountField
            ? rows.reduce((n, r) => n + (Number(r.data[e.amountField!]) || 0), 0)
            : null;
          const counts = new Map<string, number>();
          for (const r of rows) if (r.status) counts.set(r.status, (counts.get(r.status) ?? 0) + 1);
          return (
            <Card key={e.key} className="hover:border-primary/40 transition-colors">
              <CardHeader className="pb-2">
                <CardDescription>{e.label}</CardDescription>
                <CardTitle className="text-3xl font-display">{rows.length}</CardTitle>
                {total !== null && (
                  <p className="text-sm text-muted-foreground">
                    {e.fields.find((f) => f.key === e.amountField)?.label}:{" "}
                    <span className="font-semibold text-foreground">{formatINR(total)}</span>
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {counts.size > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {[...counts.entries()].map(([s, n]) => (
                      <span key={s} className="flex items-center gap-1 text-xs">
                        <StatusBadge value={s} />
                        <span className="text-muted-foreground">{n}</span>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onTab(e.key)}>
                    View all
                  </Button>
                  <Button size="sm" className="gap-1" onClick={() => onAdd(e)}>
                    <Plus className="h-3.5 w-3.5" /> Add {e.singular.toLowerCase()}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 text-amber-500" /> Needs attention
          </CardTitle>
          <CardDescription>
            {mod.entities
              .filter((e) => e.alert)
              .map((e) => e.alert!.label)
              .join(" · ") || "Nothing to track for this module"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">All clear — nothing due right now.</p>
          ) : (
            <ul className="divide-y">
              {alerts.slice(0, 12).map(({ record, days, entity }) => (
                <li key={record.id}>
                  <button
                    type="button"
                    onClick={() => onOpen(entity, record)}
                    className="w-full flex items-center justify-between gap-3 py-2 text-left hover:bg-muted/50 rounded px-2 -mx-2"
                  >
                    <span className="min-w-0">
                      <span className="font-medium truncate block">{record.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {entity.singular} ·{" "}
                        {entity.fields.find((f) => f.key === entity.alert!.field)?.label}{" "}
                        {display(
                          entity.fields.find((f) => f.key === entity.alert!.field),
                          record.data[entity.alert!.field],
                        )}
                      </span>
                    </span>
                    <span
                      className={`text-xs font-semibold whitespace-nowrap ${days < 0 ? "text-rose-600" : "text-amber-600"}`}
                    >
                      {dueLabel(days)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------- entity table

function EntityPanel({
  entity,
  records,
  onAdd,
  onEdit,
  moduleKey,
}: {
  entity: EntityDef;
  records: IndustryRecord[];
  onAdd: () => void;
  onEdit: (r: IndustryRecord) => void;
  moduleKey: string;
}) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [toDelete, setToDelete] = useState<IndustryRecord | null>(null);

  const statusField = entity.fields.find((f) => f.key === entity.statusField);
  const columns = entity.fields.filter((f) => f.list && f.key !== entity.statusField);
  const alertIds = new Map(alertsFor(entity, records).map((a) => [a.record.id, a.days]));

  const rows = records.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (!q.trim()) return true;
    const needle = q.toLowerCase();
    return [r.title, ...Object.values(r.data)].some((v) =>
      String(v ?? "")
        .toLowerCase()
        .includes(needle),
    );
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteIndustryRecord(moduleKey, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["industry-records", moduleKey] });
      toast.success(`${entity.singular} deleted`);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-3 space-y-0 pb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${entity.label.toLowerCase()}…`}
            className="pl-8"
          />
        </div>
        {statusField && (
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {statusField.label.toLowerCase()}</SelectItem>
              {statusField.options!.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button className="gap-1" onClick={onAdd}>
          <Plus className="h-4 w-4" /> Add {entity.singular.toLowerCase()}
        </Button>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        {rows.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            {records.length === 0
              ? `No ${entity.label.toLowerCase()} yet. Add your first ${entity.singular.toLowerCase()}.`
              : "No records match your search."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((c) => (
                    <TableHead key={c.key} className="whitespace-nowrap">
                      {c.label}
                    </TableHead>
                  ))}
                  {statusField && <TableHead>{statusField.label}</TableHead>}
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const due = alertIds.get(r.id);
                  return (
                    <TableRow key={r.id} className="cursor-pointer" onClick={() => onEdit(r)}>
                      {columns.map((c) => (
                        <TableCell
                          key={c.key}
                          className={`whitespace-nowrap ${c.key === entity.titleField ? "font-medium" : ""} ${
                            c.key === entity.alert?.field && due !== undefined
                              ? due < 0
                                ? "text-rose-600 font-semibold"
                                : "text-amber-600 font-semibold"
                              : ""
                          }`}
                        >
                          {display(c, r.data[c.key])}
                        </TableCell>
                      ))}
                      {statusField && (
                        <TableCell>
                          <StatusBadge value={r.status} />
                        </TableCell>
                      )}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => onEdit(r)}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setToDelete(r)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {entity.singular.toLowerCase()}?</AlertDialogTitle>
            <AlertDialogDescription>
              “{toDelete?.title}” will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => toDelete && del.mutate(toDelete.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// ---------------------------------------------------------------- add / edit form

function initialValues(entity: EntityDef, record?: IndustryRecord) {
  const v: Record<string, string> = {};
  for (const f of entity.fields) {
    const existing = record?.data[f.key];
    if (existing !== undefined && existing !== null) v[f.key] = String(existing);
    else if (!record && f.type === "select" && f.required) v[f.key] = f.options![0];
    else v[f.key] = "";
  }
  return v;
}

function RecordDialog({
  moduleKey,
  entity,
  record,
  onClose,
}: {
  moduleKey: string;
  entity: EntityDef;
  record?: IndustryRecord;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [values, setValues] = useState(() => initialValues(entity, record));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const save = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      record
        ? updateIndustryRecord(moduleKey, record.id, data)
        : createIndustryRecord(moduleKey, entity.key, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["industry-records", moduleKey] });
      toast.success(record ? `${entity.singular} updated` : `${entity.singular} added`);
      onClose();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const data: Record<string, unknown> = {};
    for (const f of entity.fields) {
      const raw = values[f.key]?.trim() ?? "";
      if (!raw) {
        if (f.required) errs[f.key] = `${f.label} is required`;
        continue;
      }
      if (f.type === "number" || f.type === "currency" || f.type === "percent") {
        const n = Number(raw);
        if (!Number.isFinite(n) || n < 0) errs[f.key] = `${f.label} must be a positive number`;
        else data[f.key] = n;
      } else {
        data[f.key] = raw;
      }
    }
    setErrors(errs);
    if (Object.keys(errs).length === 0) save.mutate(data);
  };

  const set = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {record
              ? `Edit ${entity.singular.toLowerCase()}`
              : `Add ${entity.singular.toLowerCase()}`}
          </DialogTitle>
          <DialogDescription>Fields marked * are required.</DialogDescription>
        </DialogHeader>
        <form
          id="industry-record-form"
          onSubmit={submit}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {entity.fields.map((f) => (
            <div
              key={f.key}
              className={`space-y-1.5 ${f.type === "textarea" ? "sm:col-span-2" : ""}`}
            >
              <Label htmlFor={`f-${f.key}`}>
                {f.label}
                {f.required && <span className="text-destructive"> *</span>}
              </Label>
              <FieldInput field={f} value={values[f.key] ?? ""} onChange={(v) => set(f.key, v)} />
              {errors[f.key] && <p className="text-xs text-destructive">{errors[f.key]}</p>}
            </div>
          ))}
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="industry-record-form" disabled={save.isPending}>
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {record ? "Save changes" : `Add ${entity.singular.toLowerCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldInput({
  field: f,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = `f-${f.key}`;
  switch (f.type) {
    case "textarea":
      return (
        <Textarea
          id={id}
          rows={3}
          value={value}
          placeholder={f.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "select":
      return (
        <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
          <SelectTrigger id={id}>
            <SelectValue placeholder={`Select ${f.label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent>
            {!f.required && <SelectItem value={NONE}>—</SelectItem>}
            {f.options!.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "number":
    case "currency":
    case "percent":
      return (
        <div className="relative">
          {f.type === "currency" && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              ₹
            </span>
          )}
          <Input
            id={id}
            type="number"
            inputMode="decimal"
            min={0}
            step={f.type === "number" ? "any" : "0.01"}
            value={value}
            placeholder={f.placeholder}
            className={f.type === "currency" ? "pl-7" : f.type === "percent" ? "pr-8" : ""}
            onChange={(e) => onChange(e.target.value)}
          />
          {f.type === "percent" && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              %
            </span>
          )}
        </div>
      );
    default:
      return (
        <Input
          id={id}
          type={f.type === "phone" ? "tel" : f.type}
          value={value}
          placeholder={f.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
