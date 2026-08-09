import { useState } from "react";
import { ArrowLeft, ImagePlus, X, Save, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { carBrands, bikeBrands, locations, Vehicle, VehicleType, FuelType, TransmissionType, BodyType, OwnerType } from "@/lib/dealership-data";
import { apiClient } from "@/lib/api-client";

interface AddVehicleFormProps {
  onBack: () => void;
  editVehicle?: Vehicle | null;
  dealerId: string;
}

export function AddVehicleForm({ onBack, editVehicle, dealerId }: AddVehicleFormProps) {
  const isEditing = !!editVehicle;

  const [form, setForm] = useState({
    type: (editVehicle?.type || "car") as VehicleType,
    brand: editVehicle?.brand || "",
    model: editVehicle?.model || "",
    year: editVehicle?.year?.toString() || "",
    price: editVehicle?.price?.toString() || "",
    kmDriven: editVehicle?.kmDriven?.toString() || "",
    fuelType: (editVehicle?.fuelType || "") as FuelType | "",
    transmission: (editVehicle?.transmission || "") as TransmissionType | "",
    bodyType: (editVehicle?.bodyType || "") as BodyType | "",
    ownerType: (editVehicle?.ownerType || "") as OwnerType | "",
    location: editVehicle?.location || "",
    description: editVehicle?.description || "",
    engineCapacity: editVehicle?.specifications?.engineCapacity || "",
    mileage: editVehicle?.specifications?.mileage || "",
    registrationState: editVehicle?.specifications?.registrationState || "",
    insuranceValidity: editVehicle?.specifications?.insuranceValidity || "",
    rcStatus: editVehicle?.specifications?.rcStatus || "",
    features: editVehicle?.features?.join(", ") || "",
  });

  const [images, setImages] = useState<string[]>(editVehicle?.images || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.brand || !form.model || !form.price) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        images,
        price: parseInt(form.price) || 0,
        kmDriven: parseInt(form.kmDriven) || 0,
        year: parseInt(form.year) || new Date().getFullYear(),
        specifications: {
          engineCapacity: form.engineCapacity,
          mileage: form.mileage,
          registrationState: form.registrationState,
          insuranceValidity: form.insuranceValidity,
          rcStatus: form.rcStatus,
        },
        features: form.features ? form.features.split(",").map(f => f.trim()).filter(Boolean) : [],
        // Remove flattened specs fields from root payload
        engineCapacity: undefined,
        mileage: undefined,
        registrationState: undefined,
        insuranceValidity: undefined,
        rcStatus: undefined,
      };

      if (isEditing && editVehicle) {
        await apiClient.put(`/api/vehicles/${editVehicle.id}`, payload);
        toast.success(`${form.brand} ${form.model} updated successfully.`);
      } else {
        await apiClient.post(`/api/vehicles`, payload);
        toast.success(`${form.brand} ${form.model} listed successfully.`);
      }
      onBack();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addDemoImage = () => {
    const demoImages = [
      "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800",
      "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800",
      "https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800",
    ];
    if (images.length < 10) {
      setImages([...images, demoImages[images.length % demoImages.length]]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const inputClass = "w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {isEditing ? "Edit Vehicle" : "Add New Vehicle"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isEditing ? "Update your listing details" : "Fill in the details to list your vehicle"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Images */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Photos (up to 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} alt={`Vehicle ${i + 1}`} className="h-24 w-32 rounded-xl object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 10 && (
                <button
                  type="button"
                  onClick={addDemoImage}
                  className="h-24 w-32 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-xs">Add Photo</span>
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label className="text-xs text-muted-foreground">Vehicle Type *</Label>
              <Select value={form.type} onValueChange={(v) => updateField("type", v)}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="bike">Bike</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Brand *</Label>
              <Select value={form.brand} onValueChange={(v) => updateField("brand", v)}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select brand" /></SelectTrigger>
                <SelectContent>
                  {(form.type === "car" ? carBrands : bikeBrands).map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Model *</Label>
              <input type="text" value={form.model} onChange={(e) => updateField("model", e.target.value)} placeholder="e.g. Creta SX" className={inputClass + " mt-1"} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Year *</Label>
              <Select value={form.year} onValueChange={(v) => updateField("year", v)}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 15 }, (_, i) => 2025 - i).map((y) => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Price (₹) *</Label>
              <input type="number" value={form.price} onChange={(e) => updateField("price", e.target.value)} placeholder="e.g. 1080000" className={inputClass + " mt-1"} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">KM Driven *</Label>
              <input type="number" value={form.kmDriven} onChange={(e) => updateField("kmDriven", e.target.value)} placeholder="e.g. 32000" className={inputClass + " mt-1"} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Fuel Type *</Label>
              <Select value={form.fuelType} onValueChange={(v) => updateField("fuelType", v)}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                  <SelectItem value="cng">CNG</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.type === "car" && (
              <div>
                <Label className="text-xs text-muted-foreground">Transmission</Label>
                <Select value={form.transmission} onValueChange={(v) => updateField("transmission", v)}>
                  <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="automatic">Automatic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-xs text-muted-foreground">Body Type</Label>
              <Select value={form.bodyType} onValueChange={(v) => updateField("bodyType", v)}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {form.type === "car"
                    ? ["suv", "sedan", "hatchback"].map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)
                    : ["sports", "cruiser", "commuter", "adventure"].map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)
                  }
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Owner Type</Label>
              <Select value={form.ownerType} onValueChange={(v) => updateField("ownerType", v)}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="first">1st Owner</SelectItem>
                  <SelectItem value="second">2nd Owner</SelectItem>
                  <SelectItem value="third">3rd Owner</SelectItem>
                  <SelectItem value="fourth+">4th+ Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Location *</Label>
              <Select value={form.location} onValueChange={(v) => updateField("location", v)}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {locations.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Specifications */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Specifications</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label className="text-xs text-muted-foreground">Engine Capacity</Label>
              <input type="text" value={form.engineCapacity} onChange={(e) => updateField("engineCapacity", e.target.value)} placeholder="e.g. 1497 cc" className={inputClass + " mt-1"} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Mileage</Label>
              <input type="text" value={form.mileage} onChange={(e) => updateField("mileage", e.target.value)} placeholder="e.g. 17.4 kmpl" className={inputClass + " mt-1"} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Registration State</Label>
              <input type="text" value={form.registrationState} onChange={(e) => updateField("registrationState", e.target.value)} placeholder="e.g. Karnataka" className={inputClass + " mt-1"} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Insurance Validity</Label>
              <input type="text" value={form.insuranceValidity} onChange={(e) => updateField("insuranceValidity", e.target.value)} placeholder="e.g. March 2025" className={inputClass + " mt-1"} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">RC Status</Label>
              <Select value={form.rcStatus} onValueChange={(v) => updateField("rcStatus", v)}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Available">Available</SelectItem>
                  <SelectItem value="Not Available">Not Available</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Description & Features */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Description & Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Description</Label>
              <textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder="Describe your vehicle..."
                rows={4}
                className="w-full mt-1 px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Features (comma-separated)</Label>
              <input
                type="text"
                value={form.features}
                onChange={(e) => updateField("features", e.target.value)}
                placeholder="e.g. Sunroof, Cruise Control, LED Headlamps"
                className={inputClass + " mt-1"}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onBack}>Cancel</Button>
          <Button type="button" variant="outline" className="gap-2">
            <Eye className="h-4 w-4" /> Preview
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="h-4 w-4" /> {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Publish Listing"}
          </Button>
        </div>
      </form>
    </div>
  );
}
