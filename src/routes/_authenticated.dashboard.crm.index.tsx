import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { queryOptions, useSuspenseQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listLeads,
  upsertLead,
  updateLeadStage,
  deleteLead,
  listLeadActivities,
  createLeadActivity,
} from "@/lib/crm.functions";
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
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Loader2,
  Pencil,
  Trash2,
  Users,
  Search,
  Building,
  TrendingUp,
  CircleDollarSign,
  ArrowRight,
  ArrowLeft,
  Calendar,
  MessageSquare,
  Sparkles,
  FileSpreadsheet,
  Save,
  RefreshCw,
  LayoutGrid,
} from "lucide-react";
import { PageHeader, EmptyState } from "@/components/dashboard/page-shell";
import { toast } from "sonner";
import { formatINR, formatDate } from "@/lib/format";
import { RoutePending, RouteError } from "@/components/dashboard/page-shell";

const STAGES = [
  { key: "Lead", label: "New Lead", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  {
    key: "Contacted",
    label: "Contacted",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  {
    key: "Proposal",
    label: "Proposal",
    color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
  {
    key: "Negotiation",
    label: "Negotiation",
    color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  },
  { key: "Won", label: "Won", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  { key: "Lost", label: "Lost", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
];

const PRIORITIES = [
  {
    key: "low",
    label: "Low",
    color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  {
    key: "medium",
    label: "Medium",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  {
    key: "high",
    label: "High",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  },
];

const crmOptions = queryOptions({
  queryKey: ["leads"],
  queryFn: () => listLeads(),
});

export const Route = createFileRoute("/_authenticated/dashboard/crm/")({
  head: () => ({ meta: [{ title: "CRM & Leads — BizkitOps" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(crmOptions),
  component: CRMPage,
  pendingComponent: RoutePending,
  errorComponent: RouteError,
});

type Lead = Awaited<ReturnType<typeof listLeads>>[number];

const WhatsAppIcon = () => (
  <svg
    className="h-3.5 w-3.5 fill-current"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.023-5.116-2.887-6.982C16.58 1.895 14.1 1.87 11.996 1.87c-5.437 0-9.864 4.42-9.868 9.868-.001 1.77.475 3.5 1.378 5.004L2.5 21.5l5.147-1.346zm11.385-6.195c-.3-.15-1.77-.874-2.045-.974-.275-.1-.475-.15-.675.15-.2.3-.77.974-.945 1.174-.175.2-.35.225-.65.075-1.125-.562-1.925-.974-2.675-2.274-.2-.35-.2-.15-.05-.3l.45-.45c.15-.15.2-.25.3-.45.1-.2.05-.375-.025-.525-.075-.15-.675-1.625-.925-2.225-.244-.589-.491-.51-.675-.52-.175-.01-.375-.01-.575-.01-.2 0-.525.075-.8 1.05-.275.975-1.05 2.1-1.425 2.2-.375.1-1.575.475-1.575 1.8 0 1.325.95 2.6 1.075 2.775.125.175 1.85 2.85 4.5 3.9 2.65 1.05 2.65.7 3.125.65.475-.05 1.77-.725 2.02-1.425.25-.7.25-1.3.175-1.425-.075-.125-.275-.2-.575-.35z" />
  </svg>
);

const handleWhatsAppRedirect = (phone: string, message: string) => {
  if (!phone) {
    toast.error("Please provide a phone number first.");
    return;
  }
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  if (!cleanPhone) {
    toast.error("Invalid phone number format.");
    return;
  }
  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message || "")}`;
  window.open(url, "_blank");
};

interface SpreadsheetRow {
  id: string;
  name: string;
  company: string;
  deal_value: number | string;
  phone: string;
  email: string;
  stage: string;
  priority: string;
  source: string;
  address: string;
  website: string;
  message: string;
  isNew: boolean;
  isModified: boolean;
}

function CRMPage() {
  const { data: leads } = useSuspenseQuery(crmOptions);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [detailsLead, setDetailsLead] = useState<Lead | null>(null);

  const [activeTab, setActiveTab] = useState("pipeline");
  const [spreadsheetRows, setSpreadsheetRows] = useState<SpreadsheetRow[]>([]);
  const [hasEdits, setHasEdits] = useState(false);
  const [saving, setSaving] = useState(false);

  const upsertLeadFn = useServerFn(upsertLead);
  const deleteLeadFn = useServerFn(deleteLead);
  const qc = useQueryClient();

  const initializeSpreadsheet = () => {
    const dbRows: SpreadsheetRow[] = leads.map((l) => ({
      id: l.id,
      name: l.name || "",
      company: l.company || "",
      deal_value: l.deal_value || 0,
      phone: l.phone || "",
      email: l.email || "",
      stage: l.stage || "Lead",
      priority: l.priority || "medium",
      source: l.source || "direct",
      address: (l as any).address || "",
      website: (l as any).website || "",
      message: (l as any).message || "",
      isNew: false,
      isModified: false,
    }));

    const blankRows: SpreadsheetRow[] = Array.from({ length: 5 }).map((_, i) => ({
      id: `temp-${Date.now()}-${i}-${Math.random()}`,
      name: "",
      company: "",
      deal_value: "",
      phone: "",
      email: "",
      stage: "Lead",
      priority: "medium",
      source: "direct",
      address: "",
      website: "",
      message: "",
      isNew: true,
      isModified: false,
    }));

    setSpreadsheetRows([...dbRows, ...blankRows]);
    setHasEdits(false);
  };

  useEffect(() => {
    if (!hasEdits) {
      initializeSpreadsheet();
    }
  }, [leads]);

  const handleTabChange = (val: string) => {
    if (hasEdits && val !== "spreadsheet") {
      if (!confirm("You have unsaved changes in the spreadsheet. Discard them?")) {
        return;
      }
    }
    setActiveTab(val);
    if (val === "spreadsheet") {
      initializeSpreadsheet();
    }
  };

  const handleCellChange = (rowId: string, field: keyof SpreadsheetRow, value: any) => {
    setSpreadsheetRows((prev) =>
      prev.map((row) => {
        if (row.id === rowId) {
          const updated = { ...row, [field]: value, isModified: true };
          return updated;
        }
        return row;
      })
    );
    setHasEdits(true);
  };

  const addBlankRows = (count: number) => {
    const newBlankRows: SpreadsheetRow[] = Array.from({ length: count }).map((_, i) => ({
      id: `temp-${Date.now()}-${i}-${Math.random()}`,
      name: "",
      company: "",
      deal_value: "",
      phone: "",
      email: "",
      stage: "Lead",
      priority: "medium",
      source: "direct",
      address: "",
      website: "",
      message: "",
      isNew: true,
      isModified: false,
    }));
    setSpreadsheetRows((prev) => [...prev, ...newBlankRows]);
    setHasEdits(true);
  };

  const deleteRow = async (row: SpreadsheetRow) => {
    if (row.isNew) {
      setSpreadsheetRows((prev) => prev.filter((r) => r.id !== row.id));
      const remainingModified = spreadsheetRows.filter((r) => r.id !== row.id && r.isModified);
      if (remainingModified.length === 0) setHasEdits(false);
      return;
    }

    if (confirm(`Are you sure you want to delete lead "${row.name}"?`)) {
      try {
        await deleteLeadFn({ data: { id: row.id } });
        toast.success(`Deleted lead "${row.name}"`);
        qc.invalidateQueries({ queryKey: ["leads"] });
        setSpreadsheetRows((prev) => prev.filter((r) => r.id !== row.id));
      } catch (e) {
        toast.error(`Failed to delete lead: ${(e as Error).message}`);
      }
    }
  };

  const saveAllChanges = async () => {
    const toSave = spreadsheetRows.filter((row) => {
      if (!row.isModified) return false;
      if (row.isNew && !row.name.trim()) return false;
      return true;
    });

    if (toSave.length === 0) {
      toast.info("No unsaved changes to commit.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const row of toSave) {
      if (!row.name.trim()) {
        toast.error("Contact Name is required for modified leads.");
        return;
      }
      if (row.email && row.email.trim() && !emailRegex.test(row.email.trim())) {
        toast.error(`Invalid email format for lead "${row.name}"`);
        return;
      }
    }

    setSaving(true);
    try {
      await Promise.all(
        toSave.map((row) =>
          upsertLeadFn({
            data: {
              id: row.isNew ? undefined : row.id,
              name: row.name.trim(),
              company: row.company.trim() || null,
              email: row.email.trim() || null,
              phone: row.phone.trim() || null,
              stage: row.stage,
              priority: row.priority,
              source: row.source,
              deal_value: Number(row.deal_value) || 0,
              expected_close_date: null,
              notes: "",
              address: row.address.trim() || null,
              website: row.website.trim() || null,
              message: row.message.trim() || null,
            },
          })
        )
      );

      toast.success(`Successfully saved ${toSave.length} leads!`);
      setHasEdits(false);
      await qc.invalidateQueries({ queryKey: ["leads"] });
    } catch (e) {
      toast.error(`Failed to save changes: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredSpreadsheetRows = useMemo(() => {
    return spreadsheetRows.filter((row) => {
      if (!query.trim()) return true;
      const term = query.toLowerCase();
      const matchesSearch =
        row.name.toLowerCase().includes(term) ||
        row.company.toLowerCase().includes(term) ||
        row.phone.toLowerCase().includes(term) ||
        row.email.toLowerCase().includes(term) ||
        row.stage.toLowerCase().includes(term);

      return matchesSearch || row.isModified;
    });
  }, [spreadsheetRows, query]);

  const getRowNumberClass = (row: SpreadsheetRow) => {
    let base = "w-10 bg-muted/60 text-center font-mono text-[10px] p-0 border-r select-none sticky left-0 z-10 ";
    if (row.isModified) {
      if (row.isNew) {
        return base + "bg-emerald-100 text-emerald-800 border-r-emerald-300 font-bold";
      }
      return base + "bg-amber-100 text-amber-800 border-r-amber-300 font-bold";
    }
    return base + "text-muted-foreground border-r-border/60";
  };

  // Filter leads based on query
  const filtered = leads.filter((l) =>
    [l.name, l.company, l.phone, l.source].join(" ").toLowerCase().includes(query.toLowerCase()),
  );

  // Metrics
  const totalLeads = filtered.length;
  const pipelineValue = filtered.reduce((acc, l) => acc + (l.deal_value || 0), 0);
  const wonLeads = filtered.filter((l) => l.stage === "Won");
  const wonValue = wonLeads.reduce((acc, l) => acc + (l.deal_value || 0), 0);
  const conversionRate = totalLeads > 0 ? (wonLeads.length / totalLeads) * 100 : 0;

  const moveFn = useServerFn(updateLeadStage);
  const moveMutation = useMutation({
    mutationFn: moveFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("leadId");
    if (!id) return;

    // Find current lead stage
    const lead = leads.find((l) => l.id === id);
    if (lead && lead.stage !== targetStage) {
      moveMutation.mutate({ data: { id, stage: targetStage } });
      toast.info(`Moving lead to ${targetStage}`);
    }
  };

  const shiftStage = (leadId: string, direction: "next" | "prev") => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    const currentIndex = STAGES.findIndex((s) => s.key === lead.stage);
    let newIndex = currentIndex;
    if (direction === "next" && currentIndex < STAGES.length - 1) {
      newIndex += 1;
    } else if (direction === "prev" && currentIndex > 0) {
      newIndex -= 1;
    }

    if (newIndex !== currentIndex) {
      const targetStage = STAGES[newIndex].key;
      moveMutation.mutate({ data: { id: leadId, stage: targetStage } });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM & Leads"
        description="Track prospects, prioritize deals, and grow your sales pipeline."
        action={
          <div className="flex items-center gap-2">
            {activeTab === "spreadsheet" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm("Discard unsaved spreadsheet edits and reload from database?")) {
                      initializeSpreadsheet();
                    }
                  }}
                  disabled={!hasEdits}
                  className="gap-1"
                >
                  <RefreshCw className="h-4 w-4" /> Reset
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={saveAllChanges}
                  disabled={saving || !hasEdits}
                  className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-colors"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </Button>
              </>
            )}
            <Button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="gap-1"
            >
              <Plus className="h-4 w-4" /> Add Lead
            </Button>
          </div>
        }
      />

      {/* Analytics KPI banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Total Leads
              </p>
              <h3 className="text-2xl font-bold mt-1">{totalLeads}</h3>
            </div>
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Pipeline Value
              </p>
              <h3 className="text-2xl font-bold mt-1 text-primary">{formatINR(pipelineValue)}</h3>
            </div>
            <div className="h-10 w-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-600">
              <CircleDollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Conversion Rate
              </p>
              <h3 className="text-2xl font-bold mt-1">{conversionRate.toFixed(1)}%</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {wonLeads.length} deals won ({formatINR(wonValue)})
              </p>
            </div>
            <div className="h-10 w-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="pipeline" className="flex items-center gap-2 cursor-pointer">
            <LayoutGrid className="h-4 w-4" /> Pipeline Board
          </TabsTrigger>
          <TabsTrigger value="spreadsheet" className="flex items-center gap-2 cursor-pointer">
            <FileSpreadsheet className="h-4 w-4" /> Lead Sheets (Excel View)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-4 outline-none">
          <div className="flex items-center gap-2 max-w-sm mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search leads name or company..."
                className="pl-9"
              />
            </div>
          </div>

          {leads.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No leads yet"
              description="Log your first customer opportunity and start tracking deals."
              action={{
                label: "Add Lead",
                onClick: () => {
                  setEditing(null);
                  setOpen(true);
                },
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
              {STAGES.map((stage) => {
                const stageLeads = filtered.filter((l) => l.stage === stage.key);
                const stageSum = stageLeads.reduce((acc, l) => acc + (l.deal_value || 0), 0);

                return (
                  <div
                    key={stage.key}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage.key)}
                    className="bg-card border rounded-xl flex flex-col min-w-[200px] h-[600px]"
                  >
                    <div className="p-3 border-b flex flex-col gap-1 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{stage.label}</span>
                        <Badge variant="outline" className={stage.color}>
                          {stageLeads.length}
                        </Badge>
                      </div>
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {formatINR(stageSum)}
                      </span>
                    </div>

                    <div className="flex-1 p-2 overflow-y-auto space-y-2 select-none">
                      {stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData("leadId", lead.id)}
                          onClick={() => setDetailsLead(lead)}
                          className="p-3 bg-background border rounded-lg hover:border-primary shadow-sm cursor-pointer transition-all hover:shadow-md relative group space-y-2"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                              {lead.name}
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-1 py-0 ${PRIORITIES.find((p) => p.key === lead.priority)?.color}`}
                            >
                              {lead.priority}
                            </Badge>
                          </div>

                          {lead.company && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Building className="h-3 w-3 shrink-0" />
                              <span className="truncate">{lead.company}</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center text-xs pt-1 border-t border-border/40">
                            <span className="font-bold text-foreground">
                              {formatINR(lead.deal_value)}
                            </span>
                            {lead.expected_close_date && (
                              <span className="text-[10px] text-muted-foreground">
                                {formatDate(lead.expected_close_date)}
                              </span>
                            )}
                          </div>

                          {/* Mobile friendly fast navigation buttons */}                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
                            {lead.phone && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleWhatsAppRedirect(lead.phone || "", (lead as any).message || "");
                                }}
                                title="Send WhatsApp Message"
                              >
                                <WhatsAppIcon />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                  e.stopPropagation();
                                  shiftStage(lead.id, "prev");
                              }}
                              disabled={stage.key === "Lead"}
                            >
                              <ArrowLeft className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditing(lead);
                                setOpen(true);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                shiftStage(lead.id, "next");
                              }}
                              disabled={stage.key === "Lost"}
                            >
                              <ArrowRight className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {stageLeads.length === 0 && (
                        <div className="h-24 border border-dashed rounded-lg flex items-center justify-center text-[11px] text-muted-foreground p-4 text-center">
                          Drag leads here
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="spreadsheet" className="space-y-4 outline-none">
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-between mb-4">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search spreadsheet rows..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addBlankRows(1)}
                className="gap-1 border-dashed"
              >
                <Plus className="h-3.5 w-3.5" /> Add Row
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addBlankRows(5)}
                className="gap-1 border-dashed"
              >
                <Plus className="h-3.5 w-3.5" /> Add 5 Rows
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto border border-border/80 rounded-lg bg-card shadow-sm max-h-[550px] overflow-y-auto">
            <table className="w-full border-collapse text-left table-fixed">
              <thead className="bg-muted/75 sticky top-0 z-20">
                <tr className="h-7 hover:bg-transparent border-b border-border/70">
                  <th className="w-10 bg-muted/80 text-center font-mono text-[9px] font-bold p-0 border-r border-b border-border/70">#</th>
                  <th className="w-[180px] text-center font-mono text-[9px] font-bold p-0 border-r border-b border-border/70">A</th>
                  <th className="w-[150px] text-center font-mono text-[9px] font-bold p-0 border-r border-b border-border/70">B</th>
                  <th className="w-[120px] text-center font-mono text-[9px] font-bold p-0 border-r border-b border-border/70">C</th>
                  <th className="w-[130px] text-center font-mono text-[9px] font-bold p-0 border-r border-b border-border/70">D</th>
                  <th className="w-[180px] text-center font-mono text-[9px] font-bold p-0 border-r border-b border-border/70">E</th>
                  <th className="w-[130px] text-center font-mono text-[9px] font-bold p-0 border-r border-b border-border/70">F</th>
                  <th className="w-[110px] text-center font-mono text-[9px] font-bold p-0 border-r border-b border-border/70">G</th>
                  <th className="w-[130px] text-center font-mono text-[9px] font-bold p-0 border-r border-b border-border/70">H</th>
                  <th className="w-[180px] text-center font-mono text-[9px] font-bold p-0 border-r border-b border-border/70">I</th>
                  <th className="w-[180px] text-center font-mono text-[9px] font-bold p-0 border-r border-b border-border/70">J</th>
                  <th className="w-[200px] text-center font-mono text-[9px] font-bold p-0 border-r border-b border-border/70">K</th>
                  <th className="w-[100px] text-center font-mono text-[9px] font-bold p-0 border-b border-border/70">L</th>
                </tr>
                <tr className="h-9 hover:bg-transparent border-b border-border/70">
                  <th className="w-10 bg-muted/80 text-center border-r border-border/70 p-0"></th>
                  <th className="w-[180px] border-r border-border/70 font-semibold text-xs text-foreground/80 px-2.5 py-1">Contact Name *</th>
                  <th className="w-[150px] border-r border-border/70 font-semibold text-xs text-foreground/80 px-2.5 py-1">Company</th>
                  <th className="w-[120px] border-r border-border/70 font-semibold text-xs text-foreground/80 px-2.5 py-1">Deal Value (₹)</th>
                  <th className="w-[130px] border-r border-border/70 font-semibold text-xs text-foreground/80 px-2.5 py-1">Phone</th>
                  <th className="w-[180px] border-r border-border/70 font-semibold text-xs text-foreground/80 px-2.5 py-1">Email</th>
                  <th className="w-[130px] border-r border-border/70 font-semibold text-xs text-foreground/80 px-2.5 py-1">Stage</th>
                  <th className="w-[110px] border-r border-border/70 font-semibold text-xs text-foreground/80 px-2.5 py-1">Priority</th>
                  <th className="w-[130px] border-r border-border/70 font-semibold text-xs text-foreground/80 px-2.5 py-1">Source</th>
                  <th className="w-[180px] border-r border-border/70 font-semibold text-xs text-foreground/80 px-2.5 py-1">Address</th>
                  <th className="w-[180px] border-r border-border/70 font-semibold text-xs text-foreground/80 px-2.5 py-1">Website Link</th>
                  <th className="w-[200px] border-r border-border/70 font-semibold text-xs text-foreground/80 px-2.5 py-1">Message Box</th>
                  <th className="w-[100px] font-semibold text-xs text-foreground/80 px-2.5 py-1 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredSpreadsheetRows.map((row, idx) => {
                  const isNameEmpty = row.isModified && !row.name.trim();
                  return (
                    <tr
                      key={row.id}
                      className={`h-9 hover:bg-muted/10 transition-colors ${
                        row.isModified
                          ? row.isNew
                            ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                            : "bg-amber-500/5 hover:bg-amber-500/10"
                          : ""
                      }`}
                    >
                      <td className={getRowNumberClass(row)}>{idx + 1}</td>
                      <td className={`border-r border-border/60 p-0 ${isNameEmpty ? "ring-1 ring-rose-500 bg-rose-50/50" : ""}`}>
                        <input
                          value={row.name}
                          onChange={(e) => handleCellChange(row.id, "name", e.target.value)}
                          className="w-full h-full bg-transparent px-2.5 py-1 text-xs border-0 outline-none focus:ring-1 focus:ring-primary focus:bg-background font-medium"
                          placeholder="Contact Name *"
                        />
                      </td>
                      <td className="border-r border-border/60 p-0">
                        <input
                          value={row.company}
                          onChange={(e) => handleCellChange(row.id, "company", e.target.value)}
                          className="w-full h-full bg-transparent px-2.5 py-1 text-xs border-0 outline-none focus:ring-1 focus:ring-primary focus:bg-background"
                          placeholder="Company"
                        />
                      </td>
                      <td className="border-r border-border/60 p-0">
                        <input
                          type="number"
                          value={row.deal_value}
                          onChange={(e) => handleCellChange(row.id, "deal_value", e.target.value)}
                          className="w-full h-full bg-transparent px-2.5 py-1 text-xs border-0 outline-none focus:ring-1 focus:ring-primary focus:bg-background font-semibold text-right"
                          placeholder="0"
                        />
                      </td>
                      <td className="border-r border-border/60 p-0">
                        <input
                          value={row.phone}
                          onChange={(e) => handleCellChange(row.id, "phone", e.target.value)}
                          className="w-full h-full bg-transparent px-2.5 py-1 text-xs border-0 outline-none focus:ring-1 focus:ring-primary focus:bg-background"
                          placeholder="Phone number"
                        />
                      </td>
                      <td className="border-r border-border/60 p-0">
                        <input
                          value={row.email}
                          onChange={(e) => handleCellChange(row.id, "email", e.target.value)}
                          className="w-full h-full bg-transparent px-2.5 py-1 text-xs border-0 outline-none focus:ring-1 focus:ring-primary focus:bg-background"
                          placeholder="Email address"
                        />
                      </td>
                      <td className="border-r border-border/60 p-0">
                        <select
                          value={row.stage}
                          onChange={(e) => handleCellChange(row.id, "stage", e.target.value)}
                          className="w-full h-full bg-transparent px-2 py-1 text-xs border-0 outline-none focus:ring-1 focus:ring-primary focus:bg-background cursor-pointer"
                        >
                          {STAGES.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border-r border-border/60 p-0">
                        <select
                          value={row.priority}
                          onChange={(e) => handleCellChange(row.id, "priority", e.target.value)}
                          className="w-full h-full bg-transparent px-2 py-1 text-xs border-0 outline-none focus:ring-1 focus:ring-primary focus:bg-background cursor-pointer capitalize"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </td>
                      <td className="border-r border-border/60 p-0">
                        <select
                          value={row.source}
                          onChange={(e) => handleCellChange(row.id, "source", e.target.value)}
                          className="w-full h-full bg-transparent px-2 py-1 text-xs border-0 outline-none focus:ring-1 focus:ring-primary focus:bg-background cursor-pointer"
                        >
                          <option value="direct">Direct</option>
                          <option value="website">Website Storefront</option>
                          <option value="referral">Referral</option>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="social">Social Media</option>
                          <option value="cold_call">Cold Call</option>
                        </select>
                      </td>
                      <td className="border-r border-border/60 p-0">
                        <input
                          value={row.address}
                          onChange={(e) => handleCellChange(row.id, "address", e.target.value)}
                          className="w-full h-full bg-transparent px-2.5 py-1 text-xs border-0 outline-none focus:ring-1 focus:ring-primary focus:bg-background"
                          placeholder="Address"
                        />
                      </td>
                      <td className="border-r border-border/60 p-0">
                        <input
                          value={row.website}
                          onChange={(e) => handleCellChange(row.id, "website", e.target.value)}
                          className="w-full h-full bg-transparent px-2.5 py-1 text-xs border-0 outline-none focus:ring-1 focus:ring-primary focus:bg-background"
                          placeholder="https://..."
                        />
                      </td>
                      <td className="border-r border-border/60 p-0">
                        <input
                          value={row.message}
                          onChange={(e) => handleCellChange(row.id, "message", e.target.value)}
                          className="w-full h-full bg-transparent px-2.5 py-1 text-xs border-0 outline-none focus:ring-1 focus:ring-primary focus:bg-background"
                          placeholder="WhatsApp message..."
                        />
                      </td>
                      <td className="p-0 text-center flex items-center justify-center gap-1 h-9">
                        {row.phone && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                            onClick={() => handleWhatsAppRedirect(row.phone, row.message)}
                            title="Send WhatsApp Message"
                          >
                            <WhatsAppIcon />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteRow(row)}
                          title="Delete row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
            <div>
              Showing {filteredSpreadsheetRows.length} rows (Total: {spreadsheetRows.length})
            </div>
            {hasEdits && (
              <div className="flex items-center gap-1.5 text-amber-600 font-medium animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                You have unsaved changes in your spreadsheet.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create / Edit Dialog */}
      <LeadDialog open={open} onOpenChange={setOpen} lead={editing} />

      {/* Details Timeline Modal */}
      {detailsLead && (
        <LeadDetailsDialog
          open={!!detailsLead}
          onOpenChange={(v) => {
            if (!v) {
              setDetailsLead(null);
            }
          }}
          leadId={detailsLead.id}
          onEdit={() => {
            setEditing(detailsLead);
            setDetailsLead(null);
            setOpen(true);
          }}
        />
      )}
    </div>
  );
}

// Dialog for creation/edit of lead
function LeadDialog({
  open,
  onOpenChange,
  lead,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead: Lead | null;
}) {
  const qc = useQueryClient();
  const save = useServerFn(upsertLead);
  const m = useMutation({
    mutationFn: save,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success(lead ? "Lead updated" : "Lead added");
      onOpenChange(false);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    m.mutate({
      data: {
        id: lead?.id,
        name: String(f.get("name") ?? ""),
        company: String(f.get("company") ?? ""),
        email: String(f.get("email") || "") || null,
        phone: String(f.get("phone") ?? ""),
        stage: String(f.get("stage") ?? "Lead"),
        priority: String(f.get("priority") ?? "medium"),
        source: String(f.get("source") ?? "direct"),
        deal_value: Number(f.get("deal_value") ?? 0),
        expected_close_date: String(f.get("expected_close_date") || "") || null,
        notes: String(f.get("notes") ?? ""),
        address: String(f.get("address") ?? ""),
        website: String(f.get("website") ?? ""),
        message: String(f.get("message") ?? ""),
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{lead ? "Edit Lead" : "Add Lead"}</DialogTitle>
          <DialogDescription>
            Enter prospect information to include them in the sales pipeline.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name">Contact Name</Label>
              <Input id="name" name="name" required defaultValue={lead?.name ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company">Company / Business</Label>
              <Input id="company" name="company" defaultValue={lead?.company ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deal_value">Deal Value (₹)</Label>
              <Input
                id="deal_value"
                name="deal_value"
                type="number"
                defaultValue={lead?.deal_value ?? 0}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" defaultValue={lead?.phone ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={lead?.email ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stage">Stage</Label>
              <Select defaultValue={lead?.stage ?? "Lead"} name="stage">
                <SelectTrigger id="stage">
                  <SelectValue placeholder="Select Stage" />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority</Label>
              <Select defaultValue={lead?.priority ?? "medium"} name="priority">
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="source">Lead Source</Label>
              <Select defaultValue={lead?.source ?? "direct"} name="source">
                <SelectTrigger id="source">
                  <SelectValue placeholder="Select Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct</SelectItem>
                  <SelectItem value="website">Website Storefront</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="cold_call">Cold Call</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expected_close_date">Expected Close Date</Label>
              <Input
                id="expected_close_date"
                name="expected_close_date"
                type="date"
                defaultValue={
                  lead?.expected_close_date ? lead.expected_close_date.split("T")[0] : ""
                }
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" name="address" rows={2} defaultValue={(lead as any)?.address ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">Website Link</Label>
              <Input id="website" name="website" placeholder="https://..." defaultValue={(lead as any)?.website ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">WhatsApp Message Context</Label>
              <Input id="message" name="message" placeholder="Message context..." defaultValue={(lead as any)?.message ?? ""} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={3} defaultValue={lead?.notes ?? ""} />
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

// Dialog for Lead details, delete buttons, and activity logging timeline
function LeadDetailsDialog({
  open,
  onOpenChange,
  leadId,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId: string;
  onEdit: () => void;
}) {
  const qc = useQueryClient();
  const { data: leads } = useSuspenseQuery(crmOptions);
  const lead = leads.find((l) => l.id === leadId);

  const getActivities = useServerFn(listLeadActivities);
  const [activities, setActivities] = useState<Awaited<ReturnType<typeof listLeadActivities>>>([]);
  const [loading, setLoading] = useState(false);
  const [newNote, setNewNote] = useState("");

  const loadActivities = async () => {
    setLoading(true);
    try {
      const res = await getActivities({ data: { leadId } });
      setActivities(res);
    } catch (e) {
      toast.error("Failed to load activity log");
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    loadActivities();
  });

  const addActFn = useServerFn(createLeadActivity);
  const addMutation = useMutation({
    mutationFn: addActFn,
    onSuccess: (newAct) => {
      setActivities((prev) => [newAct, ...prev]);
      setNewNote("");
      toast.success("Timeline note logged");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const delFn = useServerFn(deleteLead);
  const deleteMutation = useMutation({
    mutationFn: delFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead removed");
      onOpenChange(false);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  if (!lead) return null;

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addMutation.mutate({
      data: {
        leadId,
        activityType: "note",
        content: newNote.trim(),
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center justify-between pr-6">
            <span>{lead.name}</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={onEdit} className="h-8">
                <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-destructive hover:bg-destructive/10"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (confirm("Are you sure you want to delete this lead?")) {
                    deleteMutation.mutate({ data: { id: leadId } });
                  }
                }}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                )}{" "}
                Delete
              </Button>
            </div>
          </DialogTitle>
          {lead.company && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-muted-foreground" /> {lead.company}
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-5 gap-6 py-4">
          <div className="md:col-span-2 space-y-4 text-sm border-r pr-4">
            <div>
              <span className="font-semibold text-muted-foreground text-xs uppercase block">
                Deal Value
              </span>
              <span className="text-lg font-bold text-foreground mt-0.5 block">
                {formatINR(lead.deal_value)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-semibold text-muted-foreground text-[10px] uppercase block">
                  Stage
                </span>
                <Badge
                  variant="outline"
                  className={`mt-1 font-semibold ${STAGES.find((s) => s.key === lead.stage)?.color}`}
                >
                  {lead.stage}
                </Badge>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground text-[10px] uppercase block">
                  Priority
                </span>
                <Badge
                  variant="outline"
                  className={`mt-1 font-semibold ${PRIORITIES.find((p) => p.key === lead.priority)?.color}`}
                >
                  {lead.priority}
                </Badge>
              </div>
            </div>

            <div>
              <span className="font-semibold text-muted-foreground text-xs uppercase block">
                Contact Detail
              </span>
              {lead.phone && <p className="mt-1">📞 {lead.phone}</p>}
              {lead.email && <p className="mt-0.5">✉️ {lead.email}</p>}
              {(lead as any).website && (
                <p className="mt-0.5 truncate">
                  🌐{" "}
                  <a
                    href={(lead as any).website.startsWith("http") ? (lead as any).website : `https://${(lead as any).website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline text-xs"
                  >
                    {(lead as any).website}
                  </a>
                </p>
              )}
              {(lead as any).address && (
                <p className="mt-1 text-xs text-muted-foreground bg-muted/40 p-1.5 rounded border border-border/40 whitespace-pre-line leading-relaxed">
                  📍 {(lead as any).address}
                </p>
              )}
              {!lead.phone && !lead.email && !(lead as any).website && !(lead as any).address && (
                <p className="text-muted-foreground mt-1 text-xs">No contact details</p>
              )}
            </div>

            <div>
              <span className="font-semibold text-muted-foreground text-xs uppercase block">
                Lead Source
              </span>
              <Badge variant="secondary" className="mt-1 capitalize">
                {lead.source}
              </Badge>
            </div>

            {lead.expected_close_date && (
              <div>
                <span className="font-semibold text-muted-foreground text-xs uppercase block">
                  Expected Close
                </span>
                <p className="mt-1 flex items-center gap-1 text-xs">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                  {formatDate(lead.expected_close_date)}
                </p>
              </div>
            )}

            {(lead as any).message && (
              <div className="pt-2 border-t border-border/40">
                <span className="font-semibold text-muted-foreground text-xs uppercase block">
                  WhatsApp Message Context
                </span>
                <div className="mt-1.5 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded-lg space-y-2">
                  <p className="text-xs italic text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-24 overflow-y-auto">
                    {(lead as any).message}
                  </p>
                  <Button
                    size="sm"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs gap-1.5"
                    onClick={() => handleWhatsAppRedirect(lead.phone || "", (lead as any).message || "")}
                    disabled={!lead.phone}
                  >
                    <WhatsAppIcon /> Send WhatsApp
                  </Button>
                </div>
              </div>
            )}

            {lead.notes && (
              <div>
                <span className="font-semibold text-muted-foreground text-xs uppercase block">
                  Initial Notes
                </span>
                <p className="mt-1 bg-muted p-2.5 rounded-lg text-xs leading-relaxed max-h-36 overflow-y-auto whitespace-pre-line">
                  {lead.notes}
                </p>
              </div>
            )}
          </div>

          <div className="md:col-span-3 flex flex-col space-y-4">
            <h4 className="font-bold text-sm flex items-center gap-1.5 text-foreground border-b pb-1.5">
              <MessageSquare className="h-4 w-4 text-primary" /> Activity Timeline
            </h4>

            {/* Note submission form */}
            <form onSubmit={handleAddNote} className="space-y-2">
              <Textarea
                placeholder="Log a client conversation, follow-up status, or meeting note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={2}
                className="text-xs"
                required
              />
              <div className="flex justify-end">
                <Button type="submit" size="sm" disabled={addMutation.isPending}>
                  {addMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Plus className="h-3 w-3 mr-1" />
                  )}{" "}
                  Log Note
                </Button>
              </div>
            </form>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[200px] max-h-[300px]">
              {loading ? (
                <div className="flex justify-center items-center h-20 text-muted-foreground text-xs">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading timeline...
                </div>
              ) : activities.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-8">
                  No activities logged yet.
                </p>
              ) : (
                <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1px] before:bg-border/60">
                  {activities.map((act) => (
                    <div key={act.id} className="relative pl-6 flex flex-col gap-1 text-xs">
                      <span
                        className={`absolute left-0.5 top-1.5 h-3 w-3 rounded-full border bg-background flex items-center justify-center ${
                          act.activity_type === "stage_change"
                            ? "border-amber-400"
                            : act.activity_type === "system"
                              ? "border-blue-400"
                              : "border-primary"
                        }`}
                      />
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="font-semibold capitalize text-foreground/80">
                          {act.activity_type === "stage_change"
                            ? "Stage Update"
                            : act.activity_type === "system"
                              ? "System Log"
                              : "User Note"}
                        </span>
                        <span>{formatDate(act.created_at)}</span>
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {act.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
