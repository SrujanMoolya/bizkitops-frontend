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
        const data = await apiClient.get(`/api/leads/dealer/${dealerId}`);
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
    const vehicleName = e.targetVehicle ? `${e.targetVehicle.brand} ${e.targetVehicle.model}` : "";
    const matchesSearch =
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicleName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const updateStatus = async (id: string, newStatus: EnquiryStatus) => {
    try {
      await apiClient.put(`/api/leads/${id}`, { status: newStatus });
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
      await apiClient.put(`/api/leads/${id}`, { notes });
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
          const config = statusConfig[enq.status] || statusConfig.new;
          const vehicleName = enq.targetVehicle ? `${enq.targetVehicle.brand} ${enq.targetVehicle.model}` : "General Enquiry";
          const displayTime = new Date(enq.createdAt).toLocaleDateString();
          return (
            <Card key={enq.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-primary">{enq.name?.[0] || "E"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground text-sm">{enq.name}</p>
                        <Badge className={`text-[10px] h-5 ${config.color} border-0`}>
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{vehicleName}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {enq.source === "WhatsApp" ? <MessageCircle className="h-3 w-3" /> : <Phone className="h-3 w-3" />}
                          {enq.source || "Website"}
                        </span>
                        <span>{enq.phone}</span>
                        <span>{displayTime}</span>
                      </div>
                      {/* Notes */}
                      <div className="mt-2">
                        <textarea
                          placeholder="Add notes..."
                          value={enq.notes || ""}
                          onChange={(e) => updateNotes(enq.id, e.target.value)}
                          rows={1}
                          className="w-full text-xs px-2 py-1.5 rounded-lg border border-input bg-muted/30 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                        />
                      </div>
                    </div>
                  </div>
                  {/* Status Actions */}
                  <div className="flex sm:flex-col gap-1.5 shrink-0">
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
