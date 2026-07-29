import { apiClient } from "./api-client";

export const getBillingInfo = async () => {
  return apiClient.get("/billing");
};
