import { apiClient } from "./api-client";

export const getCurrentBusiness = async () => {
  return apiClient.get("/business");
};

export const completeOnboarding = async (args: { data: any }) => {
  return apiClient.post("/business", args.data);
};
