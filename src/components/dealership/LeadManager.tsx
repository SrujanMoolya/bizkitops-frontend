import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api-client";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  status: "new" | "contacted" | "qualified" | "lost" | "won";
  budget: number;
  notes?: string;
  targetVehicle?: any;
}

const stageConfig = {
  new: { label: "New Lead", color: "bg-slate-100 text-slate-800" },
  contacted: { label: "Contacted", color: "bg-blue-50 text-blue-700" },
  qualified: { label: "Qualified 🔥", color: "bg-orange-50 text-orange-700" },
  won: { label: "Won ✅", color: "bg-emerald-50 text-emerald-700" },
  lost: { label: "Lost", color: "bg-rose-50 text-rose-700" },
};

export function LeadManager({ dealerId }: { dealerId: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const stages = ["new", "contacted", "qualified", "won", "lost"] as const;

  useEffect(() => {
    async function fetchLeads() {
      setIsLoading(true);
      try {
        const data = await apiClient.get(`/leads/dealer/${dealerId}`);
        setLeads(data || []);
      } catch (err) {
        console.error("Failed to load leads:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeads();
  }, [dealerId]);

  const pipelineValue = leads
    .filter((l) => l.status !== "lost")
    .reduce((sum, l) => sum + (l.budget || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Lead Manager</h2>
          <p className="text-sm text-muted-foreground">Track and manage your sales pipeline</p>
        </div>
        <Card className="border-border">
          <CardContent className="px-4 py-2">
            <p className="text-xs text-muted-foreground">Pipeline Value</p>
            <p className="text-lg font-bold text-foreground">
              ₹{(pipelineValue / 100000).toFixed(1)}L
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Overview */}
      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">Loading leads...</div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {stages.map((stage) => {
              const count = leads.filter((l) => l.status === stage).length;
              const config = stageConfig[stage] || stageConfig.new;
              return (
                <div key={stage} className="flex items-center gap-2">
                  <div className={`px-3 py-1.5 rounded-xl text-xs font-medium ${config.color}`}>
                    {config.label} ({count})
                  </div>
                  {stage !== "lost" && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                </div>
              );
            })}
          </div>

          {/* Lead Cards */}
          <div className="space-y-3">
            {leads.map((lead) => {
              const config = stageConfig[lead.status] || stageConfig.new;
              const vehicleName = lead.targetVehicle ? `${lead.targetVehicle.brand} ${lead.targetVehicle.model}` : "General Enquiry";
              return (
                <Card key={lead.id} className={`border-l-4 border-primary/30`}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-primary">{lead.name?.[0] || "L"}</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold text-foreground text-sm">{lead.name}</p>
                            <Badge className={`text-[10px] h-5 ${config.color} border-0`}>{config.label}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{vehicleName} • ₹{((lead.budget || 0) / 100000).toFixed(1)}L</p>
                          {lead.notes && (
                            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                              <span className="truncate max-w-[200px]">{lead.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <Button variant="outline" size="sm" className="text-xs h-7">Call</Button>
                        <Button variant="outline" size="sm" className="text-xs h-7 border-emerald-500 text-emerald-600 hover:bg-emerald-50">WhatsApp</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
