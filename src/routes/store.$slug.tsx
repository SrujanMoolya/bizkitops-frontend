import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { queryOptions, useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getPublicStorefrontBySlug,
  submitPublicReview,
  bookPublicAppointment,
  validatePublicCoupon,
} from "@/lib/storefront.functions";
import { triggerRazorpayPayment } from "@/lib/razorpay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  MessageSquare,
  Star,
  Globe,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  ChevronRight,
  Loader2,
  Sparkles,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/format";

const publicStorefrontOptions = (slug: string) =>
  queryOptions({
    queryKey: ["public-storefront", slug],
    queryFn: () => getPublicStorefrontBySlug({ data: { slug } }),
  });

type StorefrontData = Awaited<ReturnType<typeof getPublicStorefrontBySlug>>;

export const Route = createFileRoute("/store/$slug")({
  head: ({ loaderData }: { loaderData?: StorefrontData }) => {
    const name = loaderData?.business?.name || "Business Storefront";
    const city = loaderData?.business?.city || "";
    const servicesList = loaderData?.services || [];
    const reviewsList = loaderData?.reviews || [];

    const locationText = city ? `in ${city}` : "";
    const servicesText = servicesList.slice(0, 5).map((s) => s.name).join(", ");
    
    const ratingAvg = reviewsList.length
      ? (reviewsList.reduce((acc, r) => acc + r.rating, 0) / reviewsList.length).toFixed(1)
      : null;
    const ratingText = ratingAvg ? `★ Rated ${ratingAvg}/5 by our customers. ` : "";

    const title = loaderData?.business?.name
      ? `${name} ${locationText} | Book Appointments & Services Online`
      : "Book Appointments Online — BizkitOps Storefront";

    const desc = loaderData?.page?.about
      ? loaderData.page.about.substring(0, 155) + "..."
      : `Book appointments online with ${name} ${locationText}. ${ratingText}Check services (${servicesText}), pricing, and verified reviews.`;

    const serviceKeywords = servicesList.map((s) => s.name);
    const locationKeywords = city ? [`${name} ${city}`, `services in ${city}`, `appointment booking ${city}`, `best services in ${city}`] : [];
    const keywords = [
      name,
      "book online",
      "appointment booking",
      "services pricing",
      "customer reviews",
      "BizkitOps Storefront",
      ...serviceKeywords,
      ...locationKeywords,
    ].join(", ");

    const bannerUrl = loaderData?.page?.banner_url || loaderData?.business?.logo_url || "https://bizkitops.app/og-image.png";
    const storeUrl = `https://bizkitops.app/store/${loaderData?.business?.slug || ""}`;

    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "keywords", content: keywords },
        { name: "robots", content: "index, follow" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: storeUrl },
        { property: "og:image", content: bannerUrl },
        { property: "og:site_name", content: "BizkitOps Storefront" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: bannerUrl },
      ],
      links: [
        { rel: "canonical", href: storeUrl }
      ]
    };
  },
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(publicStorefrontOptions(params.slug)),
  component: PublicStorefrontPage,
});

type PublicService = Awaited<ReturnType<typeof getPublicStorefrontBySlug>>["services"][number];

function PublicStorefrontPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(publicStorefrontOptions(slug));
  const { business, page, services, gallery, reviews } = data;

  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<PublicService | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [paymentMethod, setPaymentMethod] = useState<"store" | "online">("store");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const validateCouponFn = useServerFn(validatePublicCoupon);

  useEffect(() => {
    if (!bookingOpen) {
      setCouponCode("");
      setAppliedCoupon(null);
    }
  }, [bookingOpen]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !selectedService) return;
    setIsValidatingCoupon(true);
    try {
      const res = await validateCouponFn({
        data: {
          businessId: business.id,
          code: couponCode.trim(),
          bookingAmount: Number(selectedService.price),
        },
      });

      if (res.valid) {
        setAppliedCoupon(res);
        toast.success("Coupon code applied!");
      } else {
        toast.error(res.message || "Invalid coupon code.");
        setAppliedCoupon(null);
      }
    } catch (err) {
      toast.error("Error validating coupon: " + (err as Error).message);
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const qc = useQueryClient();

  // Booking Mutation
  const bookFn = useServerFn(bookPublicAppointment);
  const bookingMutation = useMutation({
    mutationFn: bookFn,
    onSuccess: () => {
      toast.success("Appointment request submitted successfully! We will contact you to confirm.");
      setBookingOpen(false);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  // Review Mutation
  const reviewFn = useServerFn(submitPublicReview);
  const reviewMutation = useMutation({
    mutationFn: reviewFn,
    onSuccess: () => {
      toast.success("Thank you! Your review has been submitted for moderation.");
      setReviewOpen(false);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  // Theme Styling Mapper
  let themeStyles = {
    bg: "bg-slate-50/50 text-slate-900",
    cardBg: "bg-white border-slate-200",
    primaryText: "text-primary",
    primaryBtn: "bg-primary text-primary-foreground hover:bg-primary/95",
    accentBadge: "bg-primary/10 text-primary border-primary/20",
    headerBg: "bg-white border-slate-100",
    heroBg: "bg-gradient-to-br from-blue-50/60 via-slate-50 to-indigo-50/40",
  };

  if (page.theme === "bold") {
    themeStyles = {
      bg: "bg-teal-50/10 text-slate-900",
      cardBg: "bg-white border-teal-100",
      primaryText: "text-teal-600",
      primaryBtn: "bg-teal-600 text-white hover:bg-teal-700",
      accentBadge: "bg-teal-50 text-teal-700 border-teal-100",
      headerBg: "bg-white border-teal-50",
      heroBg: "bg-gradient-to-br from-teal-50/40 via-white to-emerald-50/30",
    };
  } else if (page.theme === "classic") {
    themeStyles = {
      bg: "bg-slate-50/30 text-slate-800",
      cardBg: "bg-white border-slate-200/80",
      primaryText: "text-blue-900",
      primaryBtn: "bg-blue-900 text-white hover:bg-blue-950",
      accentBadge: "bg-blue-50 text-blue-900 border-blue-100",
      headerBg: "bg-white border-slate-200/50",
      heroBg: "bg-gradient-to-br from-slate-100 to-blue-50/50",
    };
  } else if (page.theme === "dark") {
    themeStyles = {
      bg: "bg-slate-950 text-slate-100 dark",
      cardBg: "bg-slate-900 border-slate-800",
      primaryText: "text-blue-400",
      primaryBtn: "bg-blue-600 text-white hover:bg-blue-500",
      accentBadge: "bg-blue-950/50 text-blue-400 border-blue-900/30",
      headerBg: "bg-slate-900/80 border-slate-800",
      heroBg: "bg-gradient-to-b from-slate-900 to-slate-950",
    };
  }

  const handleBookingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedService) return;
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "");
    const phone = String(f.get("phone") ?? "");
    const email = String(f.get("email") || "") || null;
    const date = String(f.get("date") ?? "");
    const time = String(f.get("time") ?? "");
    const notes = String(f.get("notes") ?? "");

    const finalPrice = appliedCoupon ? appliedCoupon.finalAmount : Number(selectedService.price);

    if (finalPrice > 0 && paymentMethod === "online") {
      try {
        await triggerRazorpayPayment({
          amount: finalPrice * 100, // in paise
          name: business.name,
          description: `Booking deposit for ${selectedService.name}`,
          prefill: {
            name,
            email: email || "",
            contact: phone,
          },
          onSuccess: (paymentId) => {
            bookingMutation.mutate({
              data: {
                businessId: business.id,
                serviceId: selectedService.id,
                customerName: name,
                customerPhone: phone,
                customerEmail: email,
                appointmentDate: date,
                startTime: time,
                notes: notes,
                paymentId: paymentId,
                couponCode: appliedCoupon?.code || undefined,
              },
            });
          },
          onDismiss: () => {
            toast.info("Payment cancelled.");
          },
        });
      } catch (err) {
        toast.error(`Payment failed: ${(err as Error).message}`);
      }
    } else {
      bookingMutation.mutate({
        data: {
          businessId: business.id,
          serviceId: selectedService.id,
          customerName: name,
          customerPhone: phone,
          customerEmail: email,
          appointmentDate: date,
          startTime: time,
          notes: notes,
          couponCode: appliedCoupon?.code || undefined,
        },
      });
    }
  };

  const handleReviewSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    reviewMutation.mutate({
      data: {
        businessId: business.id,
        reviewerName: String(f.get("reviewer_name") ?? ""),
        rating: rating,
        content: String(f.get("content") ?? ""),
      },
    });
  };

  const defaultBanner =
    "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80";

  const averageRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const schemaMarkup = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        "@id": `https://bizkitops.app/store/${business.slug}/#business`,
        "name": business.name,
        "url": `https://bizkitops.app/store/${business.slug}`,
        "telephone": business.phone || undefined,
        "email": business.email || undefined,
        "image": page.banner_url || business.logo_url || defaultBanner,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": business.address || "Business Address",
          "addressLocality": business.city || "India",
          "addressCountry": "IN"
        },
        "description": page.tagline || page.about || `Services listing for ${business.name}`,
        "priceRange": "₹₹",
        ...(averageRating ? {
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": averageRating,
            "reviewCount": reviews.length.toString(),
            "bestRating": "5"
          }
        } : {})
      },
      ...(services.length ? [
        {
          "@type": "OfferCatalog",
          "@id": `https://bizkitops.app/store/${business.slug}/#catalog`,
          "name": `${business.name} Services Catalog`,
          "itemListElement": services.map((s, idx) => ({
            "@type": "OfferCatalogItem",
            "itemListOrder": idx + 1,
            "itemOffered": {
              "@type": "Service",
              "name": s.name,
              "description": s.description || `${s.name} service offered by ${business.name}`,
              "offers": {
                "@type": "Offer",
                "price": s.price.toString(),
                "priceCurrency": "INR"
              }
            }
          }))
        }
      ] : []),
      ...(reviews.length ? reviews.slice(0, 5).map((r, idx) => ({
        "@type": "Review",
        "@id": `https://bizkitops.app/store/${business.slug}/#review-${idx}`,
        "itemReviewed": {
          "@type": "LocalBusiness",
          "name": business.name
        },
        "author": {
          "@type": "Person",
          "name": r.reviewer_name
        },
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": r.rating.toString(),
          "bestRating": "5"
        },
        "reviewBody": r.content || "",
        "datePublished": r.created_at ? r.created_at.split("T")[0] : undefined
      })) : [])
    ]
  };

  return (
    <div
      className={`min-h-screen ${themeStyles.bg} flex flex-col font-sans transition-colors duration-300`}
    >
      {/* Dynamic LocalBusiness, ServiceCatalog and reviews schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
      />

      {/* Public Storefront Header */}
      <header
        className={`border-b ${themeStyles.headerBg} backdrop-blur sticky top-0 z-50 transition-all`}
      >
        <div className="container mx-auto max-w-5xl h-16 flex items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center font-bold text-white text-sm">
                {business.name.charAt(0)}
              </div>
            )}
            <span className="font-bold text-lg">{business.name}</span>
          </div>
          {services.length > 0 && (
            <Button
              className={themeStyles.primaryBtn}
              onClick={() => {
                setSelectedService(services[0]);
                setBookingOpen(true);
              }}
            >
              Book Now
            </Button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className={`relative ${themeStyles.heroBg} py-16 border-b`}>
        {page.banner_url && (
          <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
            <img src={page.banner_url} alt="Banner" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="container mx-auto max-w-5xl px-4 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="md:col-span-2 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold bg-background shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" /> Professional
              Service
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">{business.name}</h1>
            {page.tagline && (
              <p className="text-lg text-muted-foreground font-medium max-w-xl leading-relaxed">
                {page.tagline}
              </p>
            )}
            <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs font-semibold text-muted-foreground pt-2">
              {business.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-primary" /> {business.phone}
                </span>
              )}
              {business.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-primary" /> {business.email}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />{" "}
                {business.address ? `${business.address}, ` : ""}
                {business.city}
              </span>
            </div>
          </div>

          <div className="flex justify-center">
            {business.logo_url ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="h-40 w-40 rounded-2xl object-cover shadow-xl border-4 border-background bg-card"
              />
            ) : (
              <div className="h-40 w-40 bg-gradient-to-br from-primary to-indigo-600 rounded-2xl flex items-center justify-center font-bold text-white text-6xl shadow-xl">
                {business.name.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <main className="container mx-auto max-w-5xl px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column: Services */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Services Catalog</h2>
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground">No services listed at the moment.</p>
            ) : (
              <div className="space-y-3">
                {services.map((ser) => (
                  <Card
                    key={ser.id}
                    className={`${themeStyles.cardBg} shadow-sm hover:shadow transition-shadow`}
                  >
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="font-bold text-base text-foreground">{ser.name}</h4>
                        {ser.description && (
                          <p className="text-xs text-muted-foreground max-w-md">
                            {ser.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 pt-1">
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-semibold">
                            <Clock className="h-3.5 w-3.5" /> {ser.duration_minutes} mins
                          </span>
                          <span className="font-bold text-sm text-foreground">
                            {formatINR(ser.price)}
                          </span>
                        </div>
                      </div>
                      <Button
                        className={themeStyles.primaryBtn}
                        onClick={() => {
                          setSelectedService(ser);
                          setBookingOpen(true);
                        }}
                      >
                        Book
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* About section */}
          {page.about && (
            <div className="space-y-3">
              <h2 className="text-2xl font-bold tracking-tight">About Business</h2>
              <div
                className={`p-5 rounded-2xl border ${themeStyles.cardBg} text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap`}
              >
                {page.about}
              </div>
            </div>
          )}

          {/* Gallery section */}
          {gallery.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">Gallery Portfolio</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {gallery.map((item) => (
                  <div
                    key={item.id}
                    className="relative border rounded-xl overflow-hidden shadow-sm bg-muted group aspect-video"
                  >
                    <img
                      src={item.image_url}
                      alt={item.caption ?? "Gallery Item"}
                      className="object-cover h-full w-full group-hover:scale-105 transition-transform"
                    />
                    {item.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-black/70 p-2 text-center text-white text-[10px] truncate">
                        {item.caption}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Reviews & Contact */}
        <div className="space-y-8">
          {/* Booking Info Box / Contact Info */}
          <Card className={themeStyles.cardBg}>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base font-bold">Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 space-y-3 text-xs leading-relaxed">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-semibold">Address</p>
                  <p className="text-muted-foreground">{business.address ?? "No address listed"}</p>
                  <p className="text-muted-foreground">{business.city}</p>
                </div>
              </div>
              {business.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Phone</p>
                    <p className="text-muted-foreground">{business.phone}</p>
                  </div>
                </div>
              )}
              {business.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Email</p>
                    <p className="text-muted-foreground">{business.email}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reviews list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight">Customer Reviews</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReviewOpen(true)}
                className="h-8"
              >
                Write Review
              </Button>
            </div>

            {reviews.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-6 border border-dashed rounded-xl bg-card">
                No reviews yet. Be the first to rate us!
              </p>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <Card key={rev.id} className={`${themeStyles.cardBg} shadow-sm p-4 space-y-2`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{rev.reviewer_name ?? "Anonymous"}</span>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${i < rev.rating ? "text-yellow-400 fill-yellow-400" : "text-muted"}`}
                          />
                        ))}
                      </div>
                    </div>
                    {rev.content && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        "{rev.content}"
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t py-8 bg-muted/20 text-center text-xs text-muted-foreground">
        <div className="container mx-auto px-4 space-y-2">
          <p>
            © {new Date().getFullYear()} {business.name}. Powered by BizkitOps CRM Platform.
          </p>
          <div className="flex justify-center gap-3">
            {page.instagram_url && (
              <a
                href={page.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                Instagram
              </a>
            )}
            {page.facebook_url && (
              <a
                href={page.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                Facebook
              </a>
            )}
            {page.whatsapp_number && (
              <a
                href={`https://wa.me/${page.whatsapp_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                WhatsApp Enquiries
              </a>
            )}
          </div>
        </div>
      </footer>

      {/* Booking Dialog */}
      {selectedService && (
        <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Book Service Appointment</DialogTitle>
              <DialogDescription>
                Fill in your details to request booking for **{selectedService.name}** (
                {selectedService.duration_minutes} mins).
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Your Full Name</Label>
                  <Input id="name" name="name" required placeholder="Enter your name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      placeholder="10-digit number"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email (Optional)</Label>
                    <Input id="email" name="email" type="email" placeholder="name@domain.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="date">Appointment Date</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      required
                      defaultValue={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="time">Preferred Time</Label>
                    <Input id="time" name="time" type="time" required defaultValue="10:00" />
                  </div>
                </div>
                {selectedService && Number(selectedService.price) > 0 && (
                  <>
                    {/* Promo Code Input */}
                    <div className="space-y-1.5 pt-1">
                      <Label htmlFor="coupon_code" className="text-xs font-semibold text-foreground">
                        Promo Code (Optional)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="coupon_code"
                          placeholder="ENTER CODE (e.g. WELCOME10)"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="uppercase font-mono tracking-wider h-9"
                          disabled={isValidatingCoupon || !!appliedCoupon}
                        />
                        {appliedCoupon ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setAppliedCoupon(null);
                              setCouponCode("");
                            }}
                            className="h-9 text-rose-500 border-rose-500/20 hover:bg-rose-500/10 shrink-0"
                          >
                            Remove
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={handleApplyCoupon}
                            disabled={isValidatingCoupon || !couponCode}
                            className="h-9 shrink-0"
                          >
                            {isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Payment Option Block */}
                    <div className="space-y-2 border border-border/80 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/40">
                      <Label className="text-xs font-semibold">Payment Option</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("store")}
                          className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                            paymentMethod === "store"
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-background text-foreground border-border hover:bg-muted/50"
                          }`}
                        >
                          Pay at Store / Salon
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("online")}
                          className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                            paymentMethod === "online"
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-background text-foreground border-border hover:bg-muted/50"
                          }`}
                        >
                          Prepay Online
                        </button>
                      </div>

                      {/* Dynamic Price Breakdown */}
                      <div className="mt-3 pt-3 border-t border-border/60 space-y-1.5 text-xs">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Service price:</span>
                          <span>₹{selectedService.price}</span>
                        </div>
                        {appliedCoupon && (
                          <div className="flex justify-between text-emerald-600 font-medium">
                            <span className="flex items-center gap-1">
                              <Tag className="h-3.5 w-3.5" /> Discount ({appliedCoupon.code}):
                            </span>
                            <span>-₹{appliedCoupon.discountAmount}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-sm text-foreground pt-1 border-t border-dashed border-border/60">
                          <span>Total Payable:</span>
                          <span>₹{appliedCoupon ? appliedCoupon.finalAmount : Number(selectedService.price)}</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-muted-foreground leading-normal mt-2">
                        {paymentMethod === "online"
                          ? `Prepay ₹${appliedCoupon ? appliedCoupon.finalAmount : Number(selectedService.price)} securely using UPI, Card, or Netbanking.`
                          : `Pay ₹${appliedCoupon ? appliedCoupon.finalAmount : Number(selectedService.price)} in person after your service.`}
                      </p>
                    </div>
                  </>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="notes">Notes / Special Instructions</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    rows={2}
                    placeholder="Any details we should know before you arrive..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setBookingOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className={themeStyles.primaryBtn}
                  disabled={bookingMutation.isPending}
                >
                  {bookingMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}{" "}
                  Request Booking
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>
              Share your experience at **{business.name}** with other customers.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reviewer_name">Your Name</Label>
                <Input
                  id="reviewer_name"
                  name="reviewer_name"
                  required
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Rating</Label>
                <div className="flex gap-1.5 pt-1">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const starVal = i + 1;
                    const isLit = hoverRating !== null ? starVal <= hoverRating : starVal <= rating;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(starVal)}
                        onMouseEnter={() => setHoverRating(starVal)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="transition-transform hover:scale-110 focus:outline-none"
                      >
                        <Star
                          className={`h-7 w-7 ${isLit ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/30"}`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="content">Your Review Comments</Label>
                <Textarea
                  id="content"
                  name="content"
                  required
                  rows={3}
                  placeholder="Describe the quality of service, friendliness, etc..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setReviewOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                className={themeStyles.primaryBtn}
                disabled={reviewMutation.isPending}
              >
                {reviewMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}{" "}
                Submit Review
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
