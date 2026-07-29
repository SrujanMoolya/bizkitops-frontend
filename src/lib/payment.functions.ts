import { apiClient } from "./api-client";

export const upgradeBusinessPlan = async (args: {
  data: { plan: "basic" | "pro" | "custom" | "trial"; billingCycle?: "monthly" | "yearly"; paymentId?: string };
}) => {
  return apiClient.post("/payment/upgrade", args.data);
};
