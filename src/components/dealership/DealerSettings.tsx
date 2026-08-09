import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, Crown, Save } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface DealerSettingsProps {
  dealerId: string;
  dealerName: string;
}

export function DealerSettings({ dealerId, dealerName }: DealerSettingsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: dealerName,
    location: "Bangalore",
    phone: "+91 98765 43210",
    whatsapp: "919876543210",
    email: "dealer@sk21Moto.com",
    address: "123 Auto Street, Bangalore, Karnataka 560001",
    description: "Trusted dealer with 10+ years experience in pre-owned vehicles.",
  });

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const data = await apiClient.get(`/api/settings/dealer/${dealerId}`);
        if (data?.settings) {
          setForm((prev) => ({
            ...prev,
            phone: data.settings.contact_phone || prev.phone,
            email: data.settings.contact_email || prev.email,
            address: data.settings.address || prev.address,
          }));
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [dealerId]);

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        contactPhone: form.phone,
        contactEmail: form.email,
        address: form.address,
      };
      await apiClient.put(`/api/settings/dealer/${dealerId}`, payload);
      toast.success("Profile settings saved successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = "w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-6">
      {isLoading && <div className="text-sm text-muted-foreground">Loading settings...</div>}
      
      {/* Profile */}
      <Card className="border-border">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-foreground text-sm">Dealer Profile</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Dealership Name</Label>
              <input type="text" value={form.name} onChange={(e) => updateField("name", e.target.value)} className={inputClass + " mt-1"} disabled />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Location</Label>
              <input type="text" value={form.location} onChange={(e) => updateField("location", e.target.value)} className={inputClass + " mt-1"} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Phone</Label>
              <input type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className={inputClass + " mt-1"} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">WhatsApp</Label>
              <input type="tel" value={form.whatsapp} onChange={(e) => updateField("whatsapp", e.target.value)} className={inputClass + " mt-1"} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className={inputClass + " mt-1"} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Address</Label>
              <input type="text" value={form.address} onChange={(e) => updateField("address", e.target.value)} className={inputClass + " mt-1"} />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs text-muted-foreground">About</Label>
              <textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={3}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card className="border-border">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-foreground text-sm">Subscription Plan</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { name: "Starter", price: "Free", features: ["5 listings", "Basic analytics", "Email support"], current: false },
              { name: "Pro", price: "₹2,999/mo", features: ["50 listings", "Advanced analytics", "Boost listings", "Priority support"], current: true },
              { name: "Enterprise", price: "₹9,999/mo", features: ["Unlimited listings", "Premium analytics", "Dedicated manager", "Custom branding"], current: false },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`p-4 rounded-2xl border-2 transition-colors ${
                  plan.current ? "border-primary bg-primary-soft/5" : "border-border hover:border-primary/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {plan.current && <Crown className="h-4 w-4 text-primary" />}
                  <p className="font-semibold text-foreground text-sm">{plan.name}</p>
                  {plan.current && <Badge className="text-[10px] bg-primary/10 text-primary border-0">Current</Badge>}
                </div>
                <p className="text-lg font-bold text-foreground mb-3">{plan.price}</p>
                <ul className="space-y-1.5">
                  {plan.features.map((f) => (
                    <li key={f} className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <BadgeCheck className="h-3 w-3 text-emerald-500 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.current ? "outline" : "default"}
                  size="sm"
                  className="w-full mt-4 text-xs"
                  disabled={plan.current}
                >
                  {plan.current ? "Current Plan" : "Upgrade"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Save className="h-4 w-4" /> {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
