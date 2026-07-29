import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { queryOptions, useSuspenseQuery, useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getStorefrontSettings,
  saveStorefrontSettings,
  addGalleryItem,
  deleteGalleryItem,
  updateReviewStatus,
  getCoupons,
  createCoupon,
  deleteCoupon,
} from "@/lib/storefront.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus,
  Loader2,
  ExternalLink,
  Copy,
  Image as ImageIcon,
  MessageSquare,
  Star,
  Settings,
  Globe,
  Trash2,
  CheckCircle,
  XCircle,
  Tag,
  Calendar,
  Ticket,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-shell";
import { toast } from "sonner";
import { RoutePending, RouteError } from "@/components/dashboard/page-shell";

const websiteOptions = queryOptions({
  queryKey: ["website-settings"],
  queryFn: () => getStorefrontSettings(),
});

export const Route = createFileRoute("/_authenticated/dashboard/website/")({
  head: () => ({ meta: [{ title: "Website Settings — BizkitOps" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(websiteOptions),
  component: WebsiteDashboard,
  pendingComponent: RoutePending,
  errorComponent: RouteError,
});

function WebsiteDashboard() {
  const { data } = useSuspenseQuery(websiteOptions);
  const { business, page, gallery, reviews } = data;

  const [activeTab, setActiveTab] = useState("branding");
  const [galleryOpen, setGalleryOpen] = useState(false);

  const qc = useQueryClient();

  // Save Settings Mutation
  const saveFn = useServerFn(saveStorefrontSettings);
  const saveMutation = useMutation({
    mutationFn: saveFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["website-settings"] });
      toast.success("Website settings updated");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  // Gallery Item Mutation
  const addGalleryFn = useServerFn(addGalleryItem);
  const addGalleryMutation = useMutation({
    mutationFn: addGalleryFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["website-settings"] });
      toast.success("Gallery image added");
      setGalleryOpen(false);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteGalleryFn = useServerFn(deleteGalleryItem);
  const deleteGalleryMutation = useMutation({
    mutationFn: deleteGalleryFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["website-settings"] });
      toast.success("Gallery image removed");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  // Review Status Mutation
  const reviewFn = useServerFn(updateReviewStatus);
  const reviewMutation = useMutation({
    mutationFn: reviewFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["website-settings"] });
      toast.success("Review status updated");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  // Coupon Query & Mutations
  const [couponOpen, setCouponOpen] = useState(false);

  const { data: coupons = [], refetch: refetchCoupons } = useQuery({
    queryKey: ["website-coupons"],
    queryFn: () => getCoupons(),
  });

  const createCouponFn = useServerFn(createCoupon);
  const createCouponMutation = useMutation({
    mutationFn: createCouponFn,
    onSuccess: () => {
      refetchCoupons();
      toast.success("Coupon created successfully!");
      setCouponOpen(false);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteCouponFn = useServerFn(deleteCoupon);
  const deleteCouponMutation = useMutation({
    mutationFn: deleteCouponFn,
    onSuccess: () => {
      refetchCoupons();
      toast.success("Coupon deleted successfully!");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const handleCreateCoupon = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const code = String(f.get("code") || "");
    const discountType = String(f.get("discountType") || "") as "percentage" | "flat";
    const discountValue = Number(f.get("discountValue") || 0);
    const minBookingAmount = Number(f.get("minBookingAmount") || 0);
    const expiresAt = String(f.get("expiresAt") || "") || null;

    if (!code) {
      toast.error("Please enter a coupon code");
      return;
    }
    if (discountValue <= 0) {
      toast.error("Discount value must be greater than zero");
      return;
    }

    createCouponMutation.mutate({
      data: {
        code,
        discountType,
        discountValue,
        minBookingAmount,
        expiresAt,
      },
    });
  };

  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/store/${business?.slug}`
      : `/store/${business?.slug}`;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success("Public website URL copied to clipboard!");
  };

  const handleSaveBranding = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    saveMutation.mutate({
      data: {
        theme:
          (f.get("theme") as "minimal" | "bold" | "classic" | "dark") ??
          (page.theme as "minimal" | "bold" | "classic" | "dark"),
        tagline: String(f.get("tagline") ?? ""),
        about: String(f.get("about") ?? ""),
        whatsapp_number: String(f.get("whatsapp_number") ?? ""),
        instagram_url: String(f.get("instagram_url") || "") || null,
        facebook_url: String(f.get("facebook_url") || "") || null,
        twitter_url: String(f.get("twitter_url") || "") || null,
        youtube_url: String(f.get("youtube_url") || "") || null,
        is_published: page.is_published, // Toggled separately
        banner_url: String(f.get("banner_url") ?? ""),
      },
    });
  };

  const handlePublishToggle = (published: boolean) => {
    saveMutation.mutate({
      data: {
        theme: page.theme as "minimal" | "bold" | "classic" | "dark",
        tagline: page.tagline ?? "",
        about: page.about ?? "",
        whatsapp_number: page.whatsapp_number ?? "",
        instagram_url: page.instagram_url,
        facebook_url: page.facebook_url,
        twitter_url: page.twitter_url,
        youtube_url: page.youtube_url,
        is_published: published,
        banner_url: page.banner_url ?? "",
      },
    });
  };

  const handleAddGallery = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    addGalleryMutation.mutate({
      data: {
        imageUrl: String(f.get("image_url") ?? ""),
        caption: String(f.get("caption") ?? ""),
      },
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Website Settings"
        description="Configure your public-facing business booking page, moderate reviews, and show off a portfolio."
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyUrl} className="gap-1.5 h-9">
              <Copy className="h-4 w-4" /> Copy Link
            </Button>
            <Button asChild size="sm" className="gap-1.5 h-9">
              <a href={`/store/${business?.slug}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" /> View Site
              </a>
            </Button>
          </div>
        }
      />

      {/* Main Publishing Control panel */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
              <Globe className="h-5 w-5 text-primary" /> Web Page Status:{" "}
              {page.is_published ? "Published" : "Draft"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {page.is_published
                ? "Your business website is live for anyone to browse and book appointments."
                : "Your business website is private. Publish it to start accepting customer bookings."}
            </p>
          </div>
          <div className="flex items-center gap-3 bg-background p-3 rounded-lg border border-border/80 shadow-sm shrink-0">
            <span className="text-xs font-semibold text-muted-foreground">Go Public</span>
            <Switch
              checked={page.is_published}
              onCheckedChange={handlePublishToggle}
              disabled={saveMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="branding" className="gap-1.5">
            <Settings className="h-4 w-4" /> Branding & Theme
          </TabsTrigger>
          <TabsTrigger value="gallery" className="gap-1.5">
            <ImageIcon className="h-4 w-4" /> Photo Gallery
          </TabsTrigger>
          <TabsTrigger value="reviews" className="gap-1.5">
            <MessageSquare className="h-4 w-4" /> Reviews ({reviews.length})
          </TabsTrigger>
          <TabsTrigger value="coupons" className="gap-1.5">
            <Tag className="h-4 w-4" /> Coupons & Discounts
          </TabsTrigger>
        </TabsList>

        {/* BRANDING & THEME TAB */}
        <TabsContent value="branding" className="pt-2">
          <form onSubmit={handleSaveBranding}>
            <Card>
              <CardHeader>
                <CardTitle>Appearance & About</CardTitle>
                <CardDescription>
                  Modify the aesthetics and contact details shown on your public website.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="theme">Aesthetic Theme Preset</Label>
                    <Select defaultValue={page.theme} name="theme">
                      <SelectTrigger id="theme">
                        <SelectValue placeholder="Theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimal">Minimalist (Clean, Light)</SelectItem>
                        <SelectItem value="bold">Bold Teal (Vibrant, Modern)</SelectItem>
                        <SelectItem value="classic">Classic Navy (Corporate, Neat)</SelectItem>
                        <SelectItem value="dark">Sleek Obsidian (Dark Mode Slate)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="tagline">Tagline / Headline</Label>
                    <Input
                      id="tagline"
                      name="tagline"
                      placeholder="e.g. Premium salon services in Bangalore"
                      defaultValue={page.tagline ?? ""}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-1.5">
                    <Label htmlFor="banner_url">Custom Header Banner Image URL</Label>
                    <Input
                      id="banner_url"
                      name="banner_url"
                      placeholder="https://images.unsplash.com/... (optional)"
                      defaultValue={page.banner_url ?? ""}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-1.5">
                    <Label htmlFor="about">About Business Description</Label>
                    <Textarea
                      id="about"
                      name="about"
                      rows={4}
                      placeholder="Describe your services, hours, or values..."
                      defaultValue={page.about ?? ""}
                    />
                  </div>
                </div>

                <div className="border-t pt-4 space-y-4">
                  <h4 className="font-bold text-sm text-foreground">Contact & Social Channels</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="whatsapp_number">
                        WhatsApp Number (For booking enquiries)
                      </Label>
                      <Input
                        id="whatsapp_number"
                        name="whatsapp_number"
                        placeholder="e.g. 919876543210 (include country code)"
                        defaultValue={page.whatsapp_number ?? ""}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="instagram_url">Instagram Link</Label>
                      <Input
                        id="instagram_url"
                        name="instagram_url"
                        placeholder="https://instagram.com/..."
                        defaultValue={page.instagram_url ?? ""}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="facebook_url">Facebook Page Link</Label>
                      <Input
                        id="facebook_url"
                        name="facebook_url"
                        placeholder="https://facebook.com/..."
                        defaultValue={page.facebook_url ?? ""}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="twitter_url">X / Twitter Link</Label>
                      <Input
                        id="twitter_url"
                        name="twitter_url"
                        placeholder="https://twitter.com/..."
                        defaultValue={page.twitter_url ?? ""}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="p-6 border-t flex justify-end">
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />} Save
                  Branding Settings
                </Button>
              </div>
            </Card>
          </form>
        </TabsContent>

        {/* PHOTO GALLERY TAB */}
        <TabsContent value="gallery" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Website Gallery</CardTitle>
                <CardDescription>
                  Display pictures of your shop, products, or previous work.
                </CardDescription>
              </div>
              <Button onClick={() => setGalleryOpen(true)} className="gap-1">
                <Plus className="h-4 w-4" /> Add Photo
              </Button>
            </CardHeader>
            <CardContent>
              {gallery.length === 0 ? (
                <div className="h-40 border border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                  <ImageIcon className="h-10 w-10 text-muted-foreground/60 mb-2" />
                  <span className="text-sm font-semibold">No pictures uploaded</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Add portfolio images to make your site look stunning.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {gallery.map((item) => (
                    <div
                      key={item.id}
                      className="group relative border rounded-xl overflow-hidden shadow-sm bg-muted flex flex-col justify-between"
                    >
                      <div className="aspect-video w-full overflow-hidden bg-slate-900 flex items-center justify-center">
                        <img
                          src={item.image_url}
                          alt={item.caption ?? "Gallery Item"}
                          className="object-cover h-full w-full group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="p-2 bg-background flex items-center justify-between">
                        <span className="text-xs text-muted-foreground line-clamp-1 max-w-[80%]">
                          {item.caption ?? "No caption"}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10 shrink-0"
                          disabled={deleteGalleryMutation.isPending}
                          onClick={() => {
                            if (confirm("Delete this photo?")) {
                              deleteGalleryMutation.mutate({ data: { id: item.id } });
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* REVIEWS MODERATION TAB */}
        <TabsContent value="reviews" className="pt-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer Reviews & Ratings</CardTitle>
              <CardDescription>
                Moderate reviews submitted by customers. Approved reviews appear on your public
                website.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No reviews submitted yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-4 border rounded-xl flex items-start justify-between gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">
                            {rev.reviewer_name ?? "Anonymous Customer"}
                          </span>
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
                          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            "{rev.content}"
                          </p>
                        )}
                        <span className="text-[10px] text-muted-foreground block">
                          Submitted on {new Date(rev.created_at).toLocaleDateString("en-IN")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {rev.is_approved ? (
                          <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                          >
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}

                        <div className="flex gap-1 border-l pl-2">
                          {rev.is_approved ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-rose-500 border-rose-500/20 hover:bg-rose-500/10"
                              onClick={() =>
                                reviewMutation.mutate({ data: { id: rev.id, isApproved: false } })
                              }
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Hide
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10"
                              onClick={() =>
                                reviewMutation.mutate({ data: { id: rev.id, isApproved: true } })
                              }
                            >
                              <CheckCircle className="h-3.5 w-3.5 mr-1" /> Approve
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* COUPONS & DISCOUNTS TAB */}
        <TabsContent value="coupons" className="space-y-4 pt-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Coupons & Discounts</CardTitle>
                <CardDescription>
                  Manage promotional codes that customers can apply at checkout.
                </CardDescription>
              </div>
              <Button onClick={() => setCouponOpen(true)} className="gap-1.5">
                <Plus className="h-4 w-4" /> Create Coupon
              </Button>
            </CardHeader>
            <CardContent>
              {coupons.length === 0 ? (
                <div className="h-48 border border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground p-6 text-center bg-muted/10">
                  <Ticket className="h-10 w-10 text-muted-foreground/60 mb-2" />
                  <span className="text-sm font-semibold">No coupon codes created</span>
                  <span className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Incentivize customers by offering percentage-based or flat rate discount codes during booking.
                  </span>
                  <Button onClick={() => setCouponOpen(true)} size="sm" className="mt-4 gap-1.5">
                    <Plus className="h-4 w-4" /> Create Your First Coupon
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coupons.map((coupon) => {
                    const isExpired = coupon.expires_at
                      ? new Date(coupon.expires_at) <= new Date()
                      : false;
                    return (
                      <div
                        key={coupon.id}
                        className="bg-card border shadow-sm rounded-xl p-4 flex flex-col justify-between hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-1.5">
                            <code className="font-mono text-base font-bold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 uppercase">
                              {coupon.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => {
                                navigator.clipboard.writeText(coupon.code);
                                toast.success("Coupon code copied!");
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                            disabled={deleteCouponMutation.isPending}
                            onClick={() => {
                              if (confirm(`Delete coupon code "${coupon.code}"?`)) {
                                deleteCouponMutation.mutate({ data: { id: coupon.id } });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <Badge
                            className={
                              coupon.discount_type === "percentage"
                                ? "bg-indigo-500 hover:bg-indigo-600"
                                : "bg-violet-500 hover:bg-violet-600"
                            }
                          >
                            {coupon.discount_type === "percentage"
                              ? `${coupon.discount_value}% OFF`
                              : `₹${coupon.discount_value} OFF`}
                          </Badge>
                          {coupon.min_booking_amount > 0 && (
                            <span className="text-xs text-muted-foreground">
                              Min. Booking: <strong>₹{coupon.min_booking_amount}</strong>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/60 text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {coupon.expires_at
                                ? `Expires: ${new Date(coupon.expires_at).toLocaleDateString("en-IN")}`
                                : "Never expires"}
                            </span>
                          </div>
                          {isExpired ? (
                            <Badge
                              variant="outline"
                              className="text-rose-500 bg-rose-500/10 border-rose-500/20"
                            >
                              Expired
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
                            >
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Photo Dialog */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Photo to Gallery</DialogTitle>
            <DialogDescription>
              Submit an image URL to show in your website's portfolio.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddGallery} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  required
                  placeholder="e.g. https://images.unsplash.com/photo-..."
                />
                <span className="text-[10px] text-muted-foreground block">
                  Provide a web link to the image (e.g. from Unsplash or postimg.cc).
                </span>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="caption">Caption</Label>
                <Input
                  id="caption"
                  name="caption"
                  placeholder="e.g. Our Front Lobby, Premium Hair Coloring"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setGalleryOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addGalleryMutation.isPending}>
                {addGalleryMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}{" "}
                Upload
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Coupon Dialog */}
      <Dialog open={couponOpen} onOpenChange={setCouponOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Coupon Code</DialogTitle>
            <DialogDescription>
              Create a custom discount code for your website checkouts.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="code">Coupon Code</Label>
                <Input
                  id="code"
                  name="code"
                  required
                  placeholder="e.g. WELCOME10, SAVE100"
                  className="uppercase font-mono tracking-wider"
                />
                <span className="text-[10px] text-muted-foreground block">
                  Alphanumeric only, will be automatically converted to uppercase.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="discountType">Discount Type</Label>
                  <Select defaultValue="percentage" name="discountType">
                    <SelectTrigger id="discountType">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="discountValue">Discount Value</Label>
                  <Input
                    id="discountValue"
                    name="discountValue"
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    placeholder="e.g. 10 or 150"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="minBookingAmount">Min. Booking Amount (₹)</Label>
                  <Input
                    id="minBookingAmount"
                    name="minBookingAmount"
                    type="number"
                    min="0"
                    step="any"
                    defaultValue="0"
                    placeholder="Optional"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="expiresAt">Expiry Date</Label>
                  <Input
                    id="expiresAt"
                    name="expiresAt"
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    placeholder="Optional"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setCouponOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCouponMutation.isPending}>
                {createCouponMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}{" "}
                Create Coupon
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
