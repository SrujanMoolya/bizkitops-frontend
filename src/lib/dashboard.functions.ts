import { apiClient } from "./api-client";

export const getDashboardStats = async () => {
  return apiClient.get("/dashboard/stats");
};
