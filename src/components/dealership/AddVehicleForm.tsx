import { useState } from "react";
import { ArrowLeft, ImagePlus, X, Save } from "lucide-react";
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddPhotoOption, setShowAddPhotoOption] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handleTypeChange = (newType: VehicleType) => {
    setForm((prev) => ({
      ...prev,
      type: newType,
      brand: "", // reset brand when switching types
      bodyType: "", // reset body type
      transmission: newType === "bike" ? "" : prev.transmission,
    }));
    setErrors((prev) => ({
      ...prev,
      brand: "",
      bodyType: "",
    }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.brand) newErrors.brand = "Brand is required";
    if (!form.model.trim()) newErrors.model = "Model name is required";
    if (!form.year) newErrors.year = "Year is required";
    
    if (!form.price) {
      newErrors.price = "Price is required";
    } else if (parseInt(form.price) <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    if (!form.kmDriven) {
      newErrors.kmDriven = "KM Driven is required";
    } else if (parseInt(form.kmDriven) < 0) {
      newErrors.kmDriven = "KM Driven cannot be negative";
    }

    if (!form.fuelType) newErrors.fuelType = "Fuel Type is required";
    if (!form.location) newErrors.location = "Location is required";
    if (images.length === 0) newErrors.images = "At least one image is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type: form.type,
        brand: form.brand,
        model: form.model,
        year: parseInt(form.year) || new Date().getFullYear(),
        price: parseInt(form.price) || 0,
        km_driven: parseInt(form.kmDriven) || 0,
        kmDriven: parseInt(form.kmDriven) || 0,
        fuel_type: form.fuelType,
        fuelType: form.fuelType,
        transmission: form.transmission || null,
        body_type: form.bodyType,
        bodyType: form.bodyType,
        owner_type: form.ownerType,
        ownerType: form.ownerType,
        location: form.location,
        description: form.description,
        specifications: {
          engineCapacity: form.engineCapacity,
          mileage: form.mileage,
          registrationState: form.registrationState,
          insuranceValidity: form.insuranceValidity,
          rcStatus: form.rcStatus,
        },
        features: form.features ? form.features.split(",").map(f => f.trim()).filter(Boolean) : [],
        images,
      };

      if (isEditing && editVehicle) {
        await apiClient.put(`/vehicles/${editVehicle.id}`, payload);
        toast.success(`${form.brand} ${form.model} updated successfully.`);
      } else {
        await apiClient.post(`/vehicles`, payload);
        toast.success(`${form.brand} ${form.model} listed successfully.`);
      }
      onBack();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File is too large! Please upload an image under 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImages((prev) => [...prev, dataUrl]);
      setErrors((prev) => ({ ...prev, images: "" }));
      setShowAddPhotoOption(false);
      toast.success("Image uploaded successfully!");
    };
    reader.readAsDataURL(file);
  };

  const handleAddUrl = () => {
    if (!photoUrl.trim()) {
      toast.error("Please enter a valid image URL.");
      return;
    }
    if (!photoUrl.startsWith("http://") && !photoUrl.startsWith("https://")) {
      toast.error("URL must start with http:// or https://");
      return;
    }
    setImages((prev) => [...prev, photoUrl.trim()]);
    setErrors((prev) => ({ ...prev, images: "" }));
    setPhotoUrl("");
    setShowAddPhotoOption(false);
    toast.success("Image link added successfully!");
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const inputClass = "w-full h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors";
  const errorInputClass = "border-destructive focus:ring-destructive";

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
        <Card className={`border-border ${errors.images ? "border-destructive bg-destructive/5" : ""}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Photos (up to 10) *</span>
              {errors.images && <span className="text-xs text-destructive font-normal">{errors.images}</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} alt={`Vehicle ${i + 1}`} className="h-24 w-32 rounded-xl object-cover border border-border" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < 10 && !showAddPhotoOption && (
                <button
                  type="button"
                  onClick={() => setShowAddPhotoOption(true)}
                  className="h-24 w-32 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-xs">Add Photo</span>
                </button>
              )}
            </div>

            {showAddPhotoOption && (
              <div className="p-4 mt-4 border border-border rounded-xl bg-slate-50/50 dark:bg-slate-900/50 max-w-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground">Add New Photo</h4>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAddPhotoOption(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Upload File */}
                  <div className="space-y-2">
                    <Label className="text-[11px] font-semibold text-muted-foreground">Upload local image</Label>
                    <label className="flex flex-col items-center justify-center border border-dashed border-border rounded-lg bg-background hover:bg-slate-100 cursor-pointer h-24 p-3 transition-colors">
                      <ImagePlus className="h-6 w-6 text-muted-foreground mb-1" />
                      <span className="text-[11px] text-muted-foreground text-center">Click to choose image (Max 2MB)</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>

                  {/* Add URL */}
                  <div className="space-y-2 flex flex-col justify-between">
                    <div>
                      <Label className="text-[11px] font-semibold text-muted-foreground">Or paste image web link</Label>
                      <input
                        type="text"
                        placeholder="https://example.com/car.jpg"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        className={`${inputClass} mt-1 h-9`}
                      />
                    </div>
                    <Button type="button" onClick={handleAddUrl} className="w-full h-9 bg-primary text-primary-foreground text-xs mt-3">
                      Add Link
                    </Button>
                  </div>
                </div>
              </div>
            )}
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
              <Select value={form.type} onValueChange={handleTypeChange}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="bike">Bike</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className={`text-xs ${errors.brand ? "text-destructive" : "text-muted-foreground"}`}>
                Brand * {errors.brand && `(${errors.brand})`}
              </Label>
              <Select value={form.brand || undefined} onValueChange={(v) => updateField("brand", v)}>
                <SelectTrigger className={`mt-1 rounded-xl ${errors.brand ? "border-destructive focus:ring-destructive" : ""}`}>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {(form.type === "car" ? carBrands : bikeBrands).map((b) => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className={`text-xs ${errors.model ? "text-destructive" : "text-muted-foreground"}`}>
                Model * {errors.model && `(${errors.model})`}
              </Label>
              <input 
                type="text" 
                value={form.model} 
                onChange={(e) => updateField("model", e.target.value)} 
                placeholder={form.type === "car" ? "e.g. Creta SX" : "e.g. Hayabusa"} 
                className={`${inputClass} mt-1 ${errors.model ? errorInputClass : ""}`} 
              />
            </div>

            <div>
              <Label className={`text-xs ${errors.year ? "text-destructive" : "text-muted-foreground"}`}>
                Year * {errors.year && `(${errors.year})`}
              </Label>
              <Select value={form.year || undefined} onValueChange={(v) => updateField("year", v)}>
                <SelectTrigger className={`mt-1 rounded-xl ${errors.year ? "border-destructive focus:ring-destructive" : ""}`}>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 16 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className={`text-xs ${errors.price ? "text-destructive" : "text-muted-foreground"}`}>
                Price (₹) * {errors.price && `(${errors.price})`}
              </Label>
              <input 
                type="number" 
                value={form.price} 
                onChange={(e) => updateField("price", e.target.value)} 
                placeholder="e.g. 1080000" 
                className={`${inputClass} mt-1 ${errors.price ? errorInputClass : ""}`} 
              />
            </div>

            <div>
              <Label className={`text-xs ${errors.kmDriven ? "text-destructive" : "text-muted-foreground"}`}>
                KM Driven * {errors.kmDriven && `(${errors.kmDriven})`}
              </Label>
              <input 
                type="number" 
                value={form.kmDriven} 
                onChange={(e) => updateField("kmDriven", e.target.value)} 
                placeholder="e.g. 32000" 
                className={`${inputClass} mt-1 ${errors.kmDriven ? errorInputClass : ""}`} 
              />
            </div>

            <div>
              <Label className={`text-xs ${errors.fuelType ? "text-destructive" : "text-muted-foreground"}`}>
                Fuel Type * {errors.fuelType && `(${errors.fuelType})`}
              </Label>
              <Select value={form.fuelType || undefined} onValueChange={(v) => updateField("fuelType", v)}>
                <SelectTrigger className={`mt-1 rounded-xl ${errors.fuelType ? "border-destructive focus:ring-destructive" : ""}`}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
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
                <Select value={form.transmission || undefined} onValueChange={(v) => updateField("transmission", v)}>
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
              <Select value={form.bodyType || undefined} onValueChange={(v) => updateField("bodyType", v)}>
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
              <Select value={form.ownerType || undefined} onValueChange={(v) => updateField("ownerType", v)}>
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
              <Label className={`text-xs ${errors.location ? "text-destructive" : "text-muted-foreground"}`}>
                Location * {errors.location && `(${errors.location})`}
              </Label>
              <Select value={form.location || undefined} onValueChange={(v) => updateField("location", v)}>
                <SelectTrigger className={`mt-1 rounded-xl ${errors.location ? "border-destructive focus:ring-destructive" : ""}`}>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
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
              <input type="text" value={form.engineCapacity} onChange={(e) => updateField("engineCapacity", e.target.value)} placeholder="e.g. 1497 cc" className={`${inputClass} mt-1`} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Mileage</Label>
              <input type="text" value={form.mileage} onChange={(e) => updateField("mileage", e.target.value)} placeholder="e.g. 17.4 kmpl" className={`${inputClass} mt-1`} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Registration State</Label>
              <input type="text" value={form.registrationState} onChange={(e) => updateField("registrationState", e.target.value)} placeholder="e.g. KA-03" className={`${inputClass} mt-1`} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Insurance Validity</Label>
              <input type="text" value={form.insuranceValidity} onChange={(e) => updateField("insuranceValidity", e.target.value)} placeholder="e.g. March 2025" className={`${inputClass} mt-1`} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">RC Status</Label>
              <Select value={form.rcStatus || undefined} onValueChange={(v) => updateField("rcStatus", v)}>
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
                className="w-full mt-1 px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-colors"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Features (comma-separated)</Label>
              <input
                type="text"
                value={form.features}
                onChange={(e) => updateField("features", e.target.value)}
                placeholder="e.g. Sunroof, Cruise Control, LED Headlamps"
                className={`${inputClass} mt-1`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onBack}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Save className="h-4 w-4" /> {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Publish Listing"}
          </Button>
        </div>
      </form>
    </div>
  );
}
