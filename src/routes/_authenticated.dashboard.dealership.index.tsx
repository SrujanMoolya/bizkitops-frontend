import { createFileRoute } from "@tanstack/react-router";
import { useBusiness } from "@/hooks/use-business";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/dashboard/page-shell";

import { DashboardOverview } from "@/components/dealership/DashboardOverview";
import { DealerListings } from "@/components/dealership/DealerListings";
import { LeadManager } from "@/components/dealership/LeadManager";
import { DealerEnquiries } from "@/components/dealership/DealerEnquiries";
import { DealerSettings } from "@/components/dealership/DealerSettings";
import { AddVehicleForm } from "@/components/dealership/AddVehicleForm";

export const Route = createFileRoute("/_authenticated/dashboard/dealership/")({
  head: () => ({ meta: [{ title: "Dealership — BizkitOps" }] }),
  component: DealershipPage,
});

function DealershipPage() {
  const { data } = useBusiness();
  const business = data.business!;
  
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editVehicle, setEditVehicle] = useState<any | null>(null);

  const handleAddVehicle = () => {
    setEditVehicle(null);
    setShowAddForm(true);
  };

  const handleEditVehicle = (vehicle: any) => {
    setEditVehicle(vehicle);
    setShowAddForm(true);
  };

  const handleBackFromForm = () => {
    setShowAddForm(false);
    setEditVehicle(null);
  };

  if (showAddForm) {
    return (
      <div>
        <AddVehicleForm onBack={handleBackFromForm} editVehicle={editVehicle} dealerId={business.id} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dealership Module"
        description="Manage your inventory, leads and dealership settings."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="listings">Inventory</TabsTrigger>
          <TabsTrigger value="leads">Lead Manager</TabsTrigger>
          <TabsTrigger value="enquiries">Enquiries</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <DashboardOverview dealerId={business.id} />
        </TabsContent>

        <TabsContent value="listings">
          <DealerListings
            dealerId={business.id}
            onAddVehicle={handleAddVehicle}
            onEditVehicle={handleEditVehicle}
          />
        </TabsContent>

        <TabsContent value="leads">
          <LeadManager dealerId={business.id} />
        </TabsContent>

        <TabsContent value="enquiries">
          <DealerEnquiries dealerId={business.id} />
        </TabsContent>

        <TabsContent value="settings">
          <DealerSettings dealerId={business.id} dealerName={business.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
