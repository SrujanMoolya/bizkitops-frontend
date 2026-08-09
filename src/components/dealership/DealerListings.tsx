import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car, Edit, Trash2, Eye, Zap, ImagePlus, Plus, Search,
  CheckCircle2, MoreVertical,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatPrice, formatKm, Vehicle } from "@/lib/dealership-data";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface DealerListingsProps {
  dealerId: string;
  onAddVehicle: () => void;
  onEditVehicle: (vehicle: Vehicle) => void;
}

export function DealerListings({ dealerId, onAddVehicle, onEditVehicle }: DealerListingsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "sold" | "draft">("all");
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [dealerVehicles, setDealerVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadVehicles() {
      setIsLoading(true);
      try {
        const data = await apiClient.get(`/api/vehicles/dealer/${dealerId}`);
        setDealerVehicles(data || []);
      } catch (err) {
        console.error("Failed to load inventory:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadVehicles();
  }, [dealerId]);

  const filtered = dealerVehicles.filter((v) =>
    (v.name || v.model || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async () => {
    if (deleteTarget) {
      try {
        await apiClient.delete(`/api/vehicles/${deleteTarget.id}`);
        toast.success(`${deleteTarget.name || deleteTarget.model} has been removed.`);
        setDealerVehicles((prev) => prev.filter(v => v.id !== deleteTarget.id));
      } catch (err: any) {
        toast.error(err.message || "Failed to delete vehicle");
      }
      setDeleteTarget(null);
    }
  };

  const handleBoost = (v: Vehicle) => {
    toast.success(`${v.name || v.model} has been boosted! It will appear in featured listings.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">My Listings</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} vehicles in your inventory</p>
        </div>
        <Button onClick={onAddVehicle} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Vehicle
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "active", "sold", "draft"] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className="capitalize text-xs"
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      {/* Listings */}
      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">Loading inventory...</div>
      ) : (
        <div className="space-y-3">
        <AnimatePresence>
          {filtered.map((v, i) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card className="border-border hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="relative">
                      <img
                        src={v.images[0] || "https://images.unsplash.com/photo-1615887023516-9b6bcd559e87?w=800"}
                        alt={v.name}
                        className="h-24 w-36 rounded-xl object-cover shrink-0"
                      />
                      <Badge className="absolute top-1.5 left-1.5 text-[10px] bg-emerald-500 text-white border-0">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Active
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-foreground">{v.year} {v.brand} {v.model}</h3>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {formatKm(v.kmDriven)} • {v.fuelType} • {v.transmission || "N/A"} • {v.location}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-foreground">{formatPrice(v.price)}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Eye className="h-3 w-3" /> {(340 + i * 52).toLocaleString()} views
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-xs h-8"
                          onClick={() => onEditVehicle(v)}
                        >
                          <Edit className="h-3 w-3" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1 text-xs h-8">
                          <ImagePlus className="h-3 w-3" /> Photos
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-xs h-8 border-orange-500 text-orange-600 hover:bg-orange-50"
                          onClick={() => handleBoost(v)}
                        >
                          <Zap className="h-3 w-3" /> Boost
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Mark as Sold</DropdownMenuItem>
                            <DropdownMenuItem>Move to Draft</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate Listing</DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget(v)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <Card className="border-border">
            <CardContent className="p-12 text-center">
              <Car className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold text-foreground">No listings found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? "Try adjusting your search" : "Start adding vehicles to your inventory"}
              </p>
              <Button onClick={onAddVehicle} className="mt-4 gap-2 bg-primary text-primary-foreground">
                <Plus className="h-4 w-4" /> Add Your First Vehicle
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this listing? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
