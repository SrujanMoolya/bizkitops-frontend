import { useEffect, useState } from "react";
import { Phone, MessageCircle, Clock, CheckCircle2, XCircle, Search, ListFilter, LayoutGrid, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

type EnquiryStatus = "new" | "contacted" | "converted" | "lost";

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  targetVehicle?: any;
  source?: string;
  status: EnquiryStatus;
  createdAt: string;
  notes?: string;
}

const statusConfig: Record<EnquiryStatus, { label: string; color: string; icon: React.ElementType }> = {
  new: { label: "New", color: "bg-amber-500/10 text-amber-500 border border-amber-500/30", icon: Clock },
  contacted: { label: "Contacted", color: "bg-blue-500/10 text-blue-500 border border-blue-500/30", icon: Phone },
  converted: { label: "Converted", color: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30", icon: CheckCircle2 },
  lost: { label: "Lost", color: "bg-rose-500/10 text-rose-500 border border-rose-500/30", icon: XCircle },
};

type CategoryFilter = "all" | "buy" | "sell";

export function DealerEnquiries({ dealerId }: { dealerId: string }) {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeads() {
      setIsLoading(true);
      try {
        const data = await apiClient.get(`/leads/dealer/${dealerId}`);
        setEnquiries(data || []);
      } catch (err) {
        console.error("Failed to fetch enquiries:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeads();
  }, [dealerId]);

  const filtered = enquiries.filter((e) => {
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    const rawMessage = ((e as any).message || e.notes || "").toLowerCase();
    const isSell = rawMessage.includes("sell inquiry") || (e as any).source === "sell_page" || rawMessage.includes("km:") || rawMessage.includes("expected:");
    
    let matchesCategory = true;
    if (categoryFilter === "buy") matchesCategory = !isSell;
    if (categoryFilter === "sell") matchesCategory = isSell;

    const customerName = (e.name || (e as any).customer_name || (e as any).customerName || "").toLowerCase();
    const vehicleName = e.targetVehicle ? `${e.targetVehicle.brand || ""} ${e.targetVehicle.model || ""}`.toLowerCase() : "";
    const search = (searchQuery || "").toLowerCase();
    const matchesSearch = customerName.includes(search) || vehicleName.includes(search) || rawMessage.includes(search);

    return matchesStatus && matchesCategory && matchesSearch;
  });

  const updateStatus = async (id: string, newStatus: EnquiryStatus) => {
    try {
      await apiClient.put(`/leads/${id}`, { status: newStatus });
      setEnquiries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
      );
      toast.success(`Lead status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const updateNotes = async (id: string, notes: string) => {
    setEnquiries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, notes } : e))
    );
    try {
      await apiClient.put(`/leads/${id}`, { notes });
    } catch (err) {
      console.error("Failed to save notes:", err);
    }
  };

  const counts = {
    all: enquiries.length,
    new: enquiries.filter((e) => (e.status || "new") === "new").length,
    contacted: enquiries.filter((e) => e.status === "contacted").length,
    converted: enquiries.filter((e) => e.status === "converted").length,
    lost: enquiries.filter((e) => e.status === "lost").length,
  };

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            Leads & Enquiries
            <Badge variant="outline" className="text-xs font-mono font-normal">
              {enquiries.length} Total
            </Badge>
          </h2>
          <p className="text-sm text-muted-foreground">Manage all incoming customer enquiries, trade-in valuation quotes & sales pipeline</p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted border border-border shrink-0">
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="h-8 text-xs font-bold gap-1.5 rounded-lg"
          >
            <ListFilter className="h-3.5 w-3.5" />
            List View
          </Button>
          <Button
            variant={viewMode === "kanban" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("kanban")}
            className="h-8 text-xs font-bold gap-1.5 rounded-lg"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Kanban Board
          </Button>
        </div>
      </div>

      {/* Category Sub-tabs (Buy Enquiries vs Sell Requests) */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-muted/60 border border-border w-fit">
        <Button
          variant={categoryFilter === "all" ? "default" : "ghost"}
          size="sm"
          onClick={() => setCategoryFilter("all")}
          className="h-8 text-xs font-bold rounded-xl gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" /> All Requests ({enquiries.length})
        </Button>
        <Button
          variant={categoryFilter === "buy" ? "default" : "ghost"}
          size="sm"
          onClick={() => setCategoryFilter("buy")}
          className="h-8 text-xs font-bold rounded-xl gap-1.5 text-blue-500 hover:text-blue-600"
        >
          🛒 Stock Purchase Enquiries ({enquiries.filter(e => !((e as any).message || e.notes || "").toLowerCase().includes("sell inquiry")).length})
        </Button>
        <Button
          variant={categoryFilter === "sell" ? "default" : "ghost"}
          size="sm"
          onClick={() => setCategoryFilter("sell")}
          className="h-8 text-xs font-bold rounded-xl gap-1.5 text-amber-500 hover:text-amber-600"
        >
          💰 Bike Sell / Trade-In Quotes ({enquiries.filter(e => ((e as any).message || e.notes || "").toLowerCase().includes("sell inquiry")).length})
        </Button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">Loading enquiries...</div>
      ) : viewMode === "list" ? (
        /* LIST VIEW */
        <div className="space-y-4">
          {/* Status Filter Tabs & Search */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
            <div className="flex flex-wrap gap-2">
              {(["all", "new", "contacted", "converted", "lost"] as const).map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(s)}
                  className="capitalize gap-1.5 text-xs font-semibold"
                >
                  {s !== "all" && (() => {
                    const Icon = statusConfig[s].icon;
                    return <Icon className="h-3 w-3" />;
                  })()}
                  {s} ({counts[s]})
                </Button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search leads, vehicles, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* List Cards */}
          <div className="space-y-3">
            {filtered.map((enq) => {
              const name = enq.name || (enq as any).customer_name || (enq as any).customerName || "Showroom Customer";
              const statusKey = (enq.status || "new").toLowerCase() as EnquiryStatus;
              const config = statusConfig[statusKey] || statusConfig.new;
              
              const rawMessage = (enq as any).message || enq.notes || "";
              const isSellRequest = rawMessage.toUpperCase().includes("SELL INQUIRY") || (enq as any).source === "sell_page" || rawMessage.toLowerCase().includes("km:") || rawMessage.toLowerCase().includes("expected:");

              let vehicleTitle = "General Showroom Enquiry";
              if (isSellRequest) {
                const match = rawMessage.match(/SELL INQUIRY:\s*([^|]+)/i);
                if (match && match[1]) {
                  vehicleTitle = match[1].trim();
                } else {
                  vehicleTitle = "Customer Selling Vehicle to Showroom";
                }
              } else if (enq.targetVehicle) {
                vehicleTitle = `${enq.targetVehicle.year || ''} ${enq.targetVehicle.brand || ''} ${enq.targetVehicle.model || ''}`.trim();
              } else if (rawMessage.includes("interested in the ")) {
                const match = rawMessage.match(/interested in the ([^.]+)/i);
                if (match && match[1]) {
                  const cleaned = match[1].replace(/\bundefined\b/gi, "").trim();
                  vehicleTitle = cleaned ? cleaned : "Stock Purchase Enquiry";
                }
              }

              const displayTime = (enq as any).created_at ? new Date((enq as any).created_at).toLocaleDateString() : "Recent";
              const cleanPhone = enq.phone ? enq.phone.replace(/[^0-9]/g, "") : "";

              return (
                <Card key={enq.id} className="border-border shadow-sm hover:border-primary/40 transition-all">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-bold text-primary">{name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-bold text-foreground text-sm">{name}</p>
                            <Badge className={`text-[10px] h-5 ${config.color} border-0`}>
                              {config.label}
                            </Badge>
                            {isSellRequest ? (
                              <Badge variant="outline" className="text-[10px] h-5 border-amber-500/40 text-amber-500 bg-amber-500/10 font-bold uppercase">
                                💰 Customer Selling Bike
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] h-5 border-blue-500/40 text-blue-500 bg-blue-500/10 font-bold uppercase">
                                🛒 Buying Showroom Stock
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs font-bold text-primary mb-2">
                            <span>{vehicleTitle}</span>
                          </div>

                          <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1 font-mono font-medium">
                              <Phone className="h-3 w-3 text-primary" />
                              {enq.phone}
                            </span>
                            <span>•</span>
                            <span>{displayTime}</span>
                          </div>

                          {/* Customer Message */}
                          {rawMessage && (
                            <div className="p-3 rounded-xl bg-muted/60 border border-border text-xs leading-relaxed text-foreground font-medium mb-3">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Customer Message / Specifications:</p>
                              <p className="whitespace-pre-line">{rawMessage}</p>
                            </div>
                          )}

                          {/* Staff Notes */}
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Internal Follow-Up Notes:</p>
                            <textarea
                              placeholder="Type internal notes here..."
                              value={enq.notes || ""}
                              onChange={(e) => updateNotes(enq.id, e.target.value)}
                              rows={2}
                              className="w-full text-xs p-2.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none leading-relaxed text-foreground"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap sm:flex-col gap-1.5 shrink-0">
                        {enq.phone && (
                          <div className="flex gap-1.5 mb-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs h-8"
                              onClick={() => window.open(`tel:${cleanPhone}`, "_self")}
                            >
                              Call
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs h-8 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                              onClick={() => window.open(`https://wa.me/${cleanPhone}`, "_blank")}
                            >
                              WhatsApp
                            </Button>
                          </div>
                        )}
                        {enq.status !== "contacted" && (
                          <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => updateStatus(enq.id, "contacted")}>
                            Mark Contacted
                          </Button>
                        )}
                        {enq.status !== "converted" && (
                          <Button variant="outline" size="sm" className="text-xs h-8 border-emerald-500 text-emerald-600 hover:bg-emerald-50" onClick={() => updateStatus(enq.id, "converted")}>
                            Converted
                          </Button>
                        )}
                        {enq.status !== "lost" && (
                          <Button variant="ghost" size="sm" className="text-xs h-8 text-muted-foreground" onClick={() => updateStatus(enq.id, "lost")}>
                            Mark Lost
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filtered.length === 0 && (
              <Card className="border-border">
                <CardContent className="p-8 text-center">
                  <Phone className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">No enquiries found</p>
                  <p className="text-xs text-muted-foreground mt-1">Incoming customer requests will show here.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(["new", "contacted", "converted", "lost"] as const).map((stage) => {
            const stageLeads = enquiries.filter((e) => (e.status || "new") === stage);
            const config = statusConfig[stage];
            const Icon = config.icon;

            return (
              <div key={stage} className="bg-muted/40 rounded-2xl border border-border p-3 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    <span className="font-bold text-xs uppercase tracking-wider text-foreground">{config.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs font-mono">
                    {stageLeads.length}
                  </Badge>
                </div>

                <div className="space-y-3 min-h-[300px]">
                  {stageLeads.map((enq) => {
                    const name = enq.name || (enq as any).customer_name || (enq as any).customerName || "Customer Lead";
                    const cleanPhone = enq.phone ? enq.phone.replace(/[^0-9]/g, "") : "";
                    const rawMessage = (enq as any).message || enq.notes || "";
                    const isSellRequest = rawMessage.toUpperCase().includes("SELL INQUIRY");

                    return (
                      <Card key={enq.id} className="border-border shadow-xs hover:border-primary/40 transition-all">
                        <CardContent className="p-3.5 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-sm text-foreground">{name}</p>
                            {isSellRequest && (
                              <Badge className="text-[9px] px-1.5 bg-amber-500/20 text-amber-500 border-0 uppercase">
                                Sell Request
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs font-mono text-muted-foreground">{enq.phone}</p>

                          {rawMessage && (
                            <p className="text-xs text-muted-foreground line-clamp-2 bg-muted/60 p-2 rounded-lg leading-relaxed">
                              {rawMessage}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-1 gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[10px] px-2 text-emerald-600 hover:bg-emerald-50"
                              onClick={() => window.open(`https://wa.me/${cleanPhone}`, "_blank")}
                            >
                              <MessageCircle className="h-3 w-3 mr-1" /> WhatsApp
                            </Button>

                            {stage === "new" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-2"
                                onClick={() => updateStatus(enq.id, "contacted")}
                              >
                                Move Contacted
                              </Button>
                            )}
                            {stage === "contacted" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-[10px] px-2 border-emerald-500 text-emerald-600"
                                onClick={() => updateStatus(enq.id, "converted")}
                              >
                                Move Converted
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {stageLeads.length === 0 && (
                    <div className="h-32 flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                      Empty column
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
