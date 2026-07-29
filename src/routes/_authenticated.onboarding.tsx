import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { completeOnboarding } from "@/lib/business.functions";
import { businessQueryOptions, useBusiness } from "@/hooks/use-business";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Set up BizkitOps" }] }),
  loader: async ({ context }) => {
    const b = await context.queryClient.ensureQueryData(businessQueryOptions);
    if (b.business?.onboarding_completed) {
      throw redirect({ to: "/dashboard" });
    }
    return null;
  },
  component: OnboardingPage,
});

const CATEGORIES = [
  "Retail / Shop",
  "Restaurant / Cafe",
  "Salon / Beauty",
  "Healthcare",
  "Professional Services",
  "Manufacturing",
  "Wholesale",
  "Education",
  "Construction",
  "Other",
];

function OnboardingPage() {
  const {
    data: { business, profile },
  } = useBusiness();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const submit = useServerFn(completeOnboarding);

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<{
    name?: string;
    category?: string;
    phone?: string;
    email?: string;
    city?: string;
    address?: string;
    gst_number?: string;
    invoice_prefix?: string;
    default_gst_percent?: string;
  }>({});

  const [form, setForm] = useState({
    name: business?.name ?? "",
    category: business?.category ?? "",
    phone: business?.phone ?? profile?.phone ?? "",
    email: business?.email ?? profile?.email ?? "",
    city: business?.city ?? "Bengaluru",
    address: business?.address ?? "",
    gst_number: business?.gst_number ?? "",
    invoice_prefix: business?.invoice_prefix ?? "INV",
    default_gst_percent: business?.default_gst_percent ?? 18,
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    // Clear error for the key
    if (errors[k as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [k]: undefined }));
    }
  };

  const validateStep = (currentStep: number) => {
    const newErrors: typeof errors = {};

    if (currentStep === 1) {
      const trimmedName = form.name.trim();
      if (!trimmedName) {
        newErrors.name = "Business name is required";
      } else if (trimmedName.length < 2) {
        newErrors.name = "Business name must be at least 2 characters";
      } else if (trimmedName.length > 120) {
        newErrors.name = "Business name must be less than 120 characters";
      }

      if (!form.category) {
        newErrors.category = "Please select an industry";
      }
    }

    if (currentStep === 2) {
      const trimmedPhone = form.phone.trim();
      if (trimmedPhone) {
        const digitsOnly = trimmedPhone.replace(/\D/g, "");
        if (digitsOnly.length < 7 || digitsOnly.length > 20) {
          newErrors.phone = "Phone number must be between 7 and 20 digits";
        }
      }

      const trimmedEmail = form.email.trim();
      if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (currentStep === 3) {
      const trimmedCity = form.city.trim();
      if (trimmedCity && trimmedCity.length > 80) {
        newErrors.city = "City name must be less than 80 characters";
      }

      const trimmedAddress = form.address.trim();
      if (trimmedAddress && trimmedAddress.length > 500) {
        newErrors.address = "Address must be less than 500 characters";
      }
    }

    if (currentStep === 4) {
      const trimmedGst = form.gst_number.trim();
      if (trimmedGst) {
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstRegex.test(trimmedGst)) {
          newErrors.gst_number = "Please enter a valid 15-character GSTIN format (e.g. 29ABCDE1234F1Z5)";
        }
      }

      const trimmedPrefix = form.invoice_prefix.trim();
      if (trimmedPrefix && trimmedPrefix.length > 10) {
        newErrors.invoice_prefix = "Invoice prefix must be less than 10 characters";
      }

      const gstPercent = Number(form.default_gst_percent);
      if (isNaN(gstPercent) || gstPercent < 0 || gstPercent > 50) {
        newErrors.default_gst_percent = "Default GST must be between 0% and 50%";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => s + 1);
    } else {
      toast.error("Please resolve validation errors first.");
    }
  };

  const mut = useMutation({
    mutationFn: () => {
      if (!validateStep(step)) {
        throw new Error("Please resolve validation errors first.");
      }
      return submit({ data: form as never });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["current-business"] });
      toast.success("You're all set!");
      navigate({ to: "/dashboard" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const steps = [
    {
      title: "What's your business called?",
      desc: "This appears on your invoices and website.",
    },
    { title: "Contact details", desc: "How customers reach you." },
    { title: "Where are you based?", desc: "Used for GST and your business address." },
    { title: "Tax & invoicing", desc: "Defaults for new invoices. You can change these later." },
    { title: "All set!", desc: "Review and finish." },
  ];

  const total = steps.length;
  const canNext = step === 1 ? form.name.trim().length > 0 && !!form.category : true;

  return (
    <div className="min-h-screen bg-hero-gradient flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2">
          <img src="/logo.png" alt="BizkitOps Logo" className="h-8 w-8 object-contain rounded" />
          <span className="font-display text-xl font-bold">BizkitOps</span>
        </Link>
        <span className="text-sm text-muted-foreground">
          Step {step} of {total}
        </span>
      </header>

      <main className="flex-1 flex items-start sm:items-center justify-center px-4 pb-12">
        <div className="w-full max-w-xl">
          <Progress value={(step / total) * 100} className="mb-6" />
          <div className="rounded-2xl border border-border bg-card shadow-card p-8">
            <h1 className="font-display text-2xl font-bold">{steps[step - 1].title}</h1>
            <p className="text-sm text-muted-foreground mt-1">{steps[step - 1].desc}</p>

            <div className="mt-6 space-y-4">
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Business name</Label>
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="Acme Traders"
                      className={cn(errors.name && "border-red-500 focus-visible:ring-red-500")}
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                        {errors.name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Industry</Label>
                    <Select value={form.category} onValueChange={(v) => set("category", v)}>
                      <SelectTrigger className={cn(errors.category && "border-red-500 focus-visible:ring-red-500")}>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-red-500 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                        {errors.category}
                      </p>
                    )}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Business phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      className={cn(errors.phone && "border-red-500 focus-visible:ring-red-500")}
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Business email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="hello@business.com"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      className={cn(errors.email && "border-red-500 focus-visible:ring-red-500")}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={form.city}
                      onChange={(e) => set("city", e.target.value)}
                      className={cn(errors.city && "border-red-500 focus-visible:ring-red-500")}
                    />
                    {errors.city && (
                      <p className="text-red-500 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                        {errors.city}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      rows={3}
                      value={form.address}
                      onChange={(e) => set("address", e.target.value)}
                      className={cn(errors.address && "border-red-500 focus-visible:ring-red-500")}
                    />
                    {errors.address && (
                      <p className="text-red-500 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                        {errors.address}
                      </p>
                    )}
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="gst">GSTIN (optional)</Label>
                    <Input
                      id="gst"
                      placeholder="29ABCDE1234F1Z5"
                      value={form.gst_number}
                      onChange={(e) => set("gst_number", e.target.value.toUpperCase())}
                      className={cn(errors.gst_number && "border-red-500 focus-visible:ring-red-500")}
                    />
                    {errors.gst_number && (
                      <p className="text-red-500 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                        {errors.gst_number}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="prefix">Invoice prefix</Label>
                      <Input
                        id="prefix"
                        value={form.invoice_prefix}
                        onChange={(e) => set("invoice_prefix", e.target.value.toUpperCase())}
                        className={cn(errors.invoice_prefix && "border-red-500 focus-visible:ring-red-500")}
                      />
                      {errors.invoice_prefix && (
                        <p className="text-red-500 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                          {errors.invoice_prefix}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gstp">Default GST %</Label>
                      <Input
                        id="gstp"
                        type="number"
                        min={0}
                        max={50}
                        value={form.default_gst_percent}
                        onChange={(e) => set("default_gst_percent", Number(e.target.value))}
                        className={cn(errors.default_gst_percent && "border-red-500 focus-visible:ring-red-500")}
                      />
                      {errors.default_gst_percent && (
                        <p className="text-red-500 text-xs font-semibold animate-in fade-in slide-in-from-top-1 duration-200">
                          {errors.default_gst_percent}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {step === 5 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-lg bg-primary-soft p-4">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">{form.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {form.category} · {form.city}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {form.phone && <p>📞 {form.phone}</p>}
                    {form.email && <p>📧 {form.email}</p>}
                    {form.gst_number && <p>GSTIN: {form.gst_number}</p>}
                    <p>
                      Invoice prefix: {form.invoice_prefix} · Default GST:{" "}
                      {form.default_gst_percent}%
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <Button
                variant="ghost"
                disabled={step === 1 || mut.isPending}
                onClick={() => setStep((s) => s - 1)}
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              {step < total ? (
                <Button onClick={handleNext} disabled={!canNext}>
                  Next <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
                  {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Finish setup
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
