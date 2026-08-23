import { useEffect, useState } from "react";
import { Phone, MessageCircle, Clock, CheckCircle2, XCircle, Search } from "lucide-react";
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
  new: { label: "New", color: "bg-orange-50 text-orange-700", icon: Clock },
  contacted: { label: "Contacted", color: "bg-blue-50 text-blue-700", icon: Phone },
  converted: { label: "Converted", color: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  lost: { label: "Lost", color: "bg-slate-100 text-slate-700", icon: XCircle },
};

export function DealerEnquiries({ dealerId }: { dealerId: string }) {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
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
    const customerName = (e.name || (e as any).customer_name || (e as any).customerName || "").toLowerCase();
    const vehicleName = e.targetVehicle ? `${e.targetVehicle.brand || ""} ${e.targetVehicle.model || ""}`.toLowerCase() : "";
    const search = (searchQuery || "").toLowerCase();
    const matchesSearch = customerName.includes(search) || vehicleName.includes(search);
    return matchesStatus && matchesSearch;
  });

  const updateStatus = async (id: string, newStatus: EnquiryStatus) => {
    try {
      await apiClient.put(`/leads/${id}`, { status: newStatus });
      setEnquiries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status: newStatus } : e))
      );
      toast.success(`Enquiry status updated to ${newStatus}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const updateNotes = async (id: string, notes: string) => {
    // Optimistic update
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
    new: enquiries.filter((e) => e.status === "new").length,
    contacted: enquiries.filter((e) => e.status === "contacted").length,
    converted: enquiries.filter((e) => e.status === "converted").length,
    lost: enquiries.filter((e) => e.status === "lost").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">Enquiries</h2>
        <p className="text-sm text-muted-foreground">Manage all customer enquiries and leads</p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {(["all", "new", "contacted", "converted", "lost"] as const).map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s)}
            className="capitalize gap-1.5 text-xs"
          >
            {s !== "all" && (() => {
              const Icon = statusConfig[s].icon;
              return <Icon className="h-3 w-3" />;
            })()}
            {s} ({counts[s]})
          </Button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name or vehicle..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-10 pr-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Enquiry Cards */}
      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">Loading enquiries...</div>
      ) : (
      <div className="space-y-3">
        {filtered.map((enq) => {
          const name = enq.name || (enq as any).customer_name || (enq as any).customerName || "Showroom Customer";
          const statusKey = (enq.status || "new").toLowerCase() as EnquiryStatus;
          const config = statusConfig[statusKey] || statusConfig.new;
          const vehicleName = enq.targetVehicle ? `${enq.targetVehicle.brand} ${enq.targetVehicle.model}` : "General Showroom Enquiry";
          const displayTime = (enq as any).created_at ? new Date((enq as any).created_at).toLocaleDateString() : "Recent";
          const cleanPhone = enq.phone ? enq.phone.replace(/[^0-9]/g, "") : "";

          return (
            <Card key={enq.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">{name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-semibold text-foreground text-sm">{name}</p>
                        <Badge className={`text-[10px] h-5 ${config.color} border-0`}>
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{vehicleName}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="h-3 w-3 text-primary" />
                          {enq.phone}
                        </span>
                        <span>{displayTime}</span>
                      </div>
                      {/* Notes / Message */}
                      <div className="mt-2">
                        <textarea
                          placeholder="Add notes..."
                          value={enq.notes || (enq as any).message || ""}
                          onChange={(e) => updateNotes(enq.id, e.target.value)}
                          rows={2}
                          className="w-full text-xs p-2 rounded-lg border border-input bg-muted/30 focus:outline-none focus:ring-1 focus:ring-ring resize-none leading-relaxed text-foreground"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions & WhatsApp */}
                  <div className="flex flex-wrap sm:flex-col gap-1.5 shrink-0">
                    {enq.phone && (
                      <div className="flex gap-1.5 mb-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-7"
                          onClick={() => window.open(`tel:${cleanPhone}`, "_self")}
                        >
                          Call
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs h-7 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                          onClick={() => window.open(`https://wa.me/${cleanPhone}`, "_blank")}
                        >
                          WhatsApp
                        </Button>
                      </div>
                    )}
                    {enq.status !== "contacted" && (
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => updateStatus(enq.id, "contacted")}>
                        Mark Contacted
                      </Button>
                    )}
                    {enq.status !== "converted" && (
                      <Button variant="outline" size="sm" className="text-xs h-7 border-emerald-500 text-emerald-600 hover:bg-emerald-50" onClick={() => updateStatus(enq.id, "converted")}>
                        Converted
                      </Button>
                    )}
                    {enq.status !== "lost" && (
                      <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={() => updateStatus(enq.id, "lost")}>
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
              <p className="text-sm text-muted-foreground">No enquiries found</p>
            </CardContent>
          </Card>
        )}
      </div>
      )}
    </div>
  );
}
