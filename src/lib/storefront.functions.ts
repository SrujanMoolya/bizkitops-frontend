import { apiClient } from "./api-client";

export const getStorefrontSettings = async () => {
  return apiClient.get("/storefront/settings");
};

export const saveStorefrontSettings = async (args: { data: any }) => {
  return apiClient.post("/storefront/settings", args.data);
};

export const addGalleryItem = async (args: { data: { imageUrl: string; caption?: string } }) => {
  return apiClient.post("/storefront/gallery", args.data);
};

export const deleteGalleryItem = async (args: { data: { id: string } }) => {
  return apiClient.delete("/storefront/gallery", args.data);
};

export const updateReviewStatus = async (args: { data: { id: string; isApproved: boolean } }) => {
  return apiClient.post("/storefront/reviews", args.data);
};

export const getPublicStorefrontBySlug = async (args: { data: { slug: string } }) => {
  return apiClient.get(`/storefront/public/${args.data.slug}`);
};

export const submitPublicReview = async (args: { data: { businessId: string; reviewerName: string; rating: number; content?: string } }) => {
  return apiClient.post("/storefront/public/review", args.data);
};

export const bookPublicAppointment = async (args: { data: any }) => {
  return apiClient.post("/storefront/public/book", args.data);
};

export const getCoupons = async () => {
  return apiClient.get("/storefront/coupons");
};

export const createCoupon = async (args: { data: { code: string; discountType: "percentage" | "flat"; discountValue: number; minBookingAmount?: number; expiresAt?: string | null } }) => {
  return apiClient.post("/storefront/coupons", args.data);
};

export const deleteCoupon = async (args: { data: { id: string } }) => {
  return apiClient.delete("/storefront/coupons", args.data);
};

export const validatePublicCoupon = async (args: { data: { businessId: string; code: string; bookingAmount: number } }) => {
  return apiClient.post("/storefront/public/coupon/validate", args.data);
};
