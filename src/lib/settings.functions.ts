import { apiClient } from "./api-client";

export const updateBusinessSettings = async (args: { data: any }) => {
  return apiClient.post("/settings", args.data);
};
