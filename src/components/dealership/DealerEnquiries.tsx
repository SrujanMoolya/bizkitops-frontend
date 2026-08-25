import { useEffect, useState } from "react";
import { 
  Phone, MessageCircle, Clock, CheckCircle2, XCircle, Search, ListFilter, 
  LayoutGrid, ArrowRight, ExternalLink, Bike, Car, Sparkles, Tag, ShoppingCart, Image as ImageIcon, Eye
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

type EnquiryStatus = "new" | "contacted" | "converted" | "lost";

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  targetVehicle?: any;
  leadType?: "purchase" | "sell";
  vehicleDetails?: {
    type?: string;
    brand?: string;
    model?: string;
    year?: number;
    kmDriven?: number;
    ownerType?: string;
    condition?: string;
    expectedPrice?: number;
    location?: string;
    notes?: string;
    images?: string[];
  };
  source?: string;
  status: EnquiryStatus;
  createdAt: string;
  notes?: string;
  message?: string;
}

const statusConfig: Record<EnquiryStatus, { label: string; color: string; icon: React.ElementType }> = {
  new: { label: "New", color: "bg-amber-500/10 text-amber-500 border border-amber-500/30", icon: Clock },
  contacted: { label: "Contacted", color: "bg-blue-500/10 text-blue-500 border border-blue-500/30", icon: Phone },
  converted: { label: "Converted", color: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30", icon: CheckCircle2 },
  lost: { label: "Lost", color: "bg-rose-500/10 text-rose-500 border border-rose-500/30", icon: XCircle },
};

interface DealerEnquiriesProps {
  dealerId: string;
  onConvertVehicle?: (initialData: any) => void;
}

export function DealerEnquiries({ dealerId, onConvertVehicle }: DealerEnquiriesProps) {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [leadCategory, setLeadCategory] = useState<"purchase" | "sell">("purchase");
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  // Helper to categorize lead
  const isSellLead = (enq: Enquiry) => {
    const rawType = ((enq as any).lead_type || enq.leadType || "").toLowerCase();
    if (rawType === "sell") return true;

    const vehicleDetails = enq.vehicleDetails || (enq as any).vehicle_details;
    if (vehicleDetails && typeof vehicleDetails === "object" && Object.keys(vehicleDetails).length > 0) {
      return true;
    }

    const rawMessage = (enq.message || (enq as any).notes || (enq as any).message || "").toUpperCase();
    const rawEmail = (enq.email || (enq as any).email || "").toLowerCase();

    if (
      rawMessage.includes("SELL INQUIRY") ||
      rawMessage.includes("SELL MY") ||
      rawMessage.includes("VALUATION") ||
      rawMessage.includes("EXPECTED:") ||
      rawMessage.includes("EXPECTED PRICE") ||
      rawMessage.includes("KM DRIVEN") ||
      rawMessage.includes("KM:") ||
      rawEmail.includes("@hyperride.in") ||
      (enq as any).source === "sell_page"
    ) {
      return true;
    }

    // If there is no target vehicle attached and message does NOT say "INTERESTED IN THE"
    if (!enq.targetVehicle && !(enq as any).vehicle_id && !rawMessage.includes("INTERESTED IN THE")) {
      return true;
    }

    return false;
  };

  // Category counts
  const purchaseLeads = enquiries.filter((e) => !isSellLead(e));
  const sellLeads = enquiries.filter((e) => isSellLead(e));

  const activeCategoryLeads = leadCategory === "purchase" ? purchaseLeads : sellLeads;

  const filtered = activeCategoryLeads.filter((e) => {
    const matchesStatus = statusFilter === "all" || (e.status || "new") === statusFilter;
    const customerName = (e.name || (e as any).customer_name || "").toLowerCase();
    const vehicleName = e.targetVehicle ? `${e.targetVehicle.brand || ""} ${e.targetVehicle.model || ""}`.toLowerCase() : "";
    const sellBikeName = e.vehicleDetails ? `${e.vehicleDetails.brand || ""} ${e.vehicleDetails.model || ""}`.toLowerCase() : "";
    const rawMessage = (e.message || e.notes || "").toLowerCase();
    const search = (searchQuery || "").toLowerCase();

    return matchesStatus && (customerName.includes(search) || vehicleName.includes(search) || sellBikeName.includes(search) || rawMessage.includes(search));
  });

  const statusCounts = {
    all: activeCategoryLeads.length,
    new: activeCategoryLeads.filter((e) => (e.status || "new") === "new").length,
    contacted: activeCategoryLeads.filter((e) => e.status === "contacted").length,
    converted: activeCategoryLeads.filter((e) => e.status === "converted").length,
    lost: activeCategoryLeads.filter((e) => e.status === "lost").length,
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            Leads & Enquiries
            <Badge variant="outline" className="text-xs font-mono font-normal">
              {enquiries.length} Total
            </Badge>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage customer purchase inquiries and vehicle sell / trade-in valuation submissions.
          </p>
        </div>

        {/* Purchase vs Sell Category Switch */}
        <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-2xl border border-border shrink-0">
          <Button
            variant={leadCategory === "purchase" ? "default" : "ghost"}
            size="sm"
            onClick={() => setLeadCategory("purchase")}
            className="h-9 px-4 text-xs font-bold gap-2 rounded-xl"
          >
            <ShoppingCart className="h-4 w-4 text-primary" />
            Purchase Leads ({purchaseLeads.length})
          </Button>
          <Button
            variant={leadCategory === "sell" ? "default" : "ghost"}
            size="sm"
            onClick={() => setLeadCategory("sell")}
            className="h-9 px-4 text-xs font-bold gap-2 rounded-xl"
          >
            <Tag className="h-4 w-4 text-amber-500" />
            Sell Leads / Trade-Ins ({sellLeads.length})
          </Button>
        </div>
      </div>

      {/* View & Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="flex flex-wrap gap-2">
          {(["all", "new", "contacted", "converted", "lost"] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className="capitalize gap-1.5 text-xs font-semibold rounded-xl"
            >
              {s !== "all" && (() => {
                const Icon = statusConfig[s].icon;
                return <Icon className="h-3 w-3" />;
              })()}
              {s} ({statusCounts[s]})
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={`Search ${leadCategory === "purchase" ? "purchase" : "sell"} leads...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-muted border border-border shrink-0">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-7 text-[11px] font-bold gap-1 rounded-lg px-2.5"
            >
              <ListFilter className="h-3.5 w-3.5" /> List
            </Button>
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className="h-7 text-[11px] font-bold gap-1 rounded-lg px-2.5"
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Kanban
            </Button>
          </div>
        </div>
      </div>

      {/* MAIN LEADS DISPLAY */}
      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">Loading leads data...</div>
      ) : filtered.length === 0 ? (
        <Card className="border-border">
          <CardContent className="p-12 text-center">
            {leadCategory === "purchase" ? (
              <ShoppingCart className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            ) : (
              <Tag className="h-10 w-10 text-amber-500 mx-auto mb-3" />
            )}
            <p className="text-sm font-bold text-foreground">No {leadCategory} leads found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {leadCategory === "purchase"
                ? "Customer vehicle inquiries submitted from product detail pages will show here."
                : "Customer bike valuation and trade-in submissions will show here with uploaded photos."}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "list" ? (
        <div className="space-y-4">
          {filtered.map((enq) => {
            const name = enq.name || (enq as any).customer_name || "Showroom Customer";
            const statusKey = (enq.status || "new").toLowerCase() as EnquiryStatus;
            const config = statusConfig[statusKey] || statusConfig.new;
            const cleanPhone = enq.phone ? enq.phone.replace(/[^0-9]/g, "") : "";
            const displayTime = (enq as any).created_at ? new Date((enq as any).created_at).toLocaleDateString() : "Recent";
            const target = enq.targetVehicle;
            const sellDetails = enq.vehicleDetails || {};

            // Extract sell details fallback from raw message if needed
            const rawMessage = enq.message || (enq as any).notes || (enq as any).message || "";
            let sellBrand = sellDetails.brand || "";
            let sellModel = sellDetails.model || "";
            let sellYear = sellDetails.year || "";
            let sellKm = sellDetails.kmDriven || "";
            let sellExpected = sellDetails.expectedPrice || "";
            let sellOwner = sellDetails.ownerType || "";
            let sellCondition = sellDetails.condition || "";
            let sellImages = sellDetails.images || [];

            if (!sellBrand && rawMessage.toUpperCase().includes("SELL INQUIRY:")) {
              const parts = rawMessage.split("|");
              if (parts[0]) {
                const titleStr = parts[0].replace(/SELL INQUIRY:/i, "").trim();
                const titleParts = titleStr.split(" ");
                sellYear = titleParts[0] || "";
                sellBrand = titleParts[1] || "";
                sellModel = titleParts.slice(2).join(" ") || "";
              }
              parts.forEach((p) => {
                const str = p.trim();
                if (/^KM:/i.test(str)) sellKm = str.replace(/^KM:/i, "").replace("km", "").trim();
                if (/^Owner:/i.test(str)) sellOwner = str.replace(/^Owner:/i, "").trim();
                if (/^Condition:/i.test(str)) sellCondition = str.replace(/^Condition:/i, "").trim();
                if (/^Expected:/i.test(str)) sellExpected = str.replace(/^Expected:/i, "").replace("₹", "").trim();
              });
            }

            return (
              <Card key={enq.id} className="border-border shadow-sm hover:border-primary/40 transition-all overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
                    
                    {/* LEFT SECTION: Vehicle Preview / Product Link Card */}
                    {leadCategory === "purchase" ? (
                      <div className="w-full lg:w-72 bg-muted/40 border border-border rounded-2xl p-3 shrink-0 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold uppercase text-muted-foreground">
                          <span className="flex items-center gap-1"><ShoppingCart className="w-3.5 h-3.5 text-primary" /> Target Bike</span>
                          <Badge variant="secondary" className="text-[10px]">Inquired</Badge>
                        </div>

                        {target ? (
                          <div className="space-y-2">
                            <div className="h-32 rounded-xl overflow-hidden bg-background border border-border relative group">
                              <img
                                src={target.images?.[0] || "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80"}
                                alt={target.model}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                                ₹{(target.price / 100000).toFixed(2)} Lakh
                              </div>
                            </div>

                            <div>
                              <p className="font-extrabold text-foreground text-sm leading-snug">
                                {target.year} {target.brand} {target.model}
                              </p>
                              <p className="text-xs text-muted-foreground capitalize">
                                {target.type || "Superbike"} • {target.location || "Showroom"}
                              </p>
                            </div>

                            <a
                              href={`http://localhost:3000/vehicle/${target.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="w-full flex items-center justify-center gap-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 h-8 rounded-xl font-bold text-xs transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> View Product on Storefront
                            </a>
                          </div>
                        ) : (
                          <div className="text-center py-6 text-xs text-muted-foreground">
                            <p className="font-semibold text-foreground">General Showroom Query</p>
                            <p className="text-[0.7rem] mt-0.5">No specific vehicle attached</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* SELL LEADS: Vehicle Details & Uploaded Photos Gallery */
                      <div className="w-full lg:w-80 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 shrink-0 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold uppercase text-amber-600">
                          <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Customer Machine</span>
                          <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-600 bg-amber-500/10 font-extrabold">
                            For Sale / Trade-In
                          </Badge>
                        </div>

                        <div>
                          <p className="font-extrabold text-foreground text-base">
                            {sellYear} {sellBrand} {sellModel}
                          </p>
                          {sellExpected && (
                            <p className="text-xs font-bold text-primary mt-0.5">
                              Expected Price: ₹{Number(sellExpected).toLocaleString("en-IN")}
                            </p>
                          )}
                        </div>

                        {/* Submitted Vehicle Specs Grid */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-background/80 p-2.5 rounded-xl border border-border">
                          <div>
                            <span className="text-muted-foreground block text-[9px] uppercase font-bold">KM Driven</span>
                            <span className="font-bold text-foreground">{sellKm ? `${Number(sellKm).toLocaleString()} km` : "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[9px] uppercase font-bold">Ownership</span>
                            <span className="font-bold text-foreground capitalize">{sellOwner ? `${sellOwner} Owner` : "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[9px] uppercase font-bold">Condition</span>
                            <span className="font-bold text-foreground capitalize">{sellCondition || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[9px] uppercase font-bold">Location</span>
                            <span className="font-bold text-foreground">{sellDetails.location || "Bangalore"}</span>
                          </div>
                        </div>

                        {/* Customer Uploaded Images Gallery */}
                        {sellImages.length > 0 ? (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center justify-between">
                              <span>Customer Photos ({sellImages.length})</span>
                              <span className="text-[9px] text-primary">Click to view</span>
                            </p>
                            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                              {sellImages.map((imgUrl, i) => (
                                <div
                                  key={i}
                                  onClick={() => setSelectedImage(imgUrl)}
                                  className="w-16 h-16 rounded-xl border border-border overflow-hidden shrink-0 cursor-pointer relative group bg-background"
                                >
                                  <img src={imgUrl} alt="Vehicle photo" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                    <Eye className="w-3.5 h-3.5" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-[11px] text-muted-foreground italic text-center py-2 bg-background/50 rounded-xl border border-border">
                            No photos attached by customer
                          </div>
                        )}

                        {/* Convert to Showroom Inventory Button */}
                        {onConvertVehicle && (
                          <Button
                            onClick={() =>
                              onConvertVehicle({
                                type: sellDetails.type || "bike",
                                brand: sellBrand,
                                model: sellModel,
                                year: Number(sellYear) || 2022,
                                price: Number(sellExpected) || 500000,
                                kmDriven: Number(sellKm) || 5000,
                                ownerType: sellOwner || "first",
                                location: sellDetails.location || "Bangalore",
                                description: `Pre-owned ${sellYear} ${sellBrand} ${sellModel} acquired directly from seller ${name}.`,
                                images: sellImages,
                              })
                            }
                            className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white font-bold text-xs h-9 rounded-xl shadow-md gap-1.5"
                          >
                            <Sparkles className="w-4 h-4" /> Convert to Showroom Stock
                          </Button>
                        )}
                      </div>
                    )}

                    {/* RIGHT SECTION: Customer Information & Notes */}
                    <div className="flex-1 min-w-0 space-y-4">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-primary">{name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-foreground text-sm">{name}</p>
                              <Badge className={`text-[10px] h-5 ${config.color} border-0`}>
                                {config.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground font-mono">{enq.phone} {enq.email ? `• ${enq.email}` : ""}</p>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground font-medium">
                          Received: <span className="font-bold text-foreground">{displayTime}</span>
                        </div>
                      </div>

                      {/* Customer Message */}
                      {rawMessage && (
                        <div className="p-3.5 rounded-xl bg-muted/60 border border-border text-xs leading-relaxed text-foreground font-medium">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Customer Message / Note:</p>
                          <p className="whitespace-pre-line">{rawMessage}</p>
                        </div>
                      )}

                      {/* Staff Internal Notes */}
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Internal Follow-Up Notes:</p>
                        <textarea
                          placeholder="Type follow-up details, valuation notes or customer preferences..."
                          value={enq.notes || ""}
                          onChange={(e) => updateNotes(enq.id, e.target.value)}
                          rows={2}
                          className="w-full text-xs p-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring resize-none leading-relaxed text-foreground"
                        />
                      </div>

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                        {enq.phone && (
                          <>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs h-8 rounded-xl font-bold"
                              onClick={() => window.open(`tel:${cleanPhone}`, "_self")}
                            >
                              <Phone className="w-3.5 h-3.5 mr-1.5 text-primary" /> Call Customer
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs h-8 rounded-xl font-bold border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                              onClick={() => window.open(`https://wa.me/${cleanPhone}`, "_blank")}
                            >
                              <MessageCircle className="w-3.5 h-3.5 mr-1.5" /> WhatsApp Chat
                            </Button>
                          </>
                        )}

                        <div className="ml-auto flex items-center gap-1.5">
                          {enq.status !== "contacted" && (
                            <Button variant="outline" size="sm" className="text-xs h-8 rounded-xl" onClick={() => updateStatus(enq.id, "contacted")}>
                              Mark Contacted
                            </Button>
                          )}
                          {enq.status !== "converted" && (
                            <Button variant="outline" size="sm" className="text-xs h-8 rounded-xl border-emerald-500 text-emerald-600 hover:bg-emerald-50 font-bold" onClick={() => updateStatus(enq.id, "converted")}>
                              Converted
                            </Button>
                          )}
                          {enq.status !== "lost" && (
                            <Button variant="ghost" size="sm" className="text-xs h-8 text-muted-foreground rounded-xl" onClick={() => updateStatus(enq.id, "lost")}>
                              Mark Lost
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(["new", "contacted", "converted", "lost"] as const).map((stage) => {
            const stageLeads = filtered.filter((e) => (e.status || "new") === stage);
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
                    const name = enq.name || (enq as any).customer_name || "Customer Lead";
                    const cleanPhone = enq.phone ? enq.phone.replace(/[^0-9]/g, "") : "";
                    const rawMessage = enq.message || enq.notes || "";

                    return (
                      <Card key={enq.id} className="border-border shadow-xs hover:border-primary/40 transition-all">
                        <CardContent className="p-3.5 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-bold text-sm text-foreground">{name}</p>
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

      {/* Image Preview Lightbox Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-3xl bg-background border-border p-2">
          {selectedImage && (
            <div className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-[80vh]">
              <img src={selectedImage} alt="Enlarged photo" className="max-h-[80vh] w-auto object-contain" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
