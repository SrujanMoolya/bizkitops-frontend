import { apiClient } from "./api-client";

export const getBusinessRolePermissions = async (args: { data: { businessId: string } }) => {
  return apiClient.get("/permissions", { businessId: args.data.businessId });
};

export const saveBusinessRolePermissions = async (args: { data: { businessId: string; role: string; allowedRoutes: string[] } }) => {
  return apiClient.post("/permissions", args.data);
};
