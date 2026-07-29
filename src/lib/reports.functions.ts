import { apiClient } from "./api-client";

export const getFinancialReports = async () => {
  return apiClient.get("/reports");
};
