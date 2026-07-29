import { apiClient } from "./api-client";

export const listInstalledModules = async () => {
  return apiClient.get("/modules");
};

export const toggleModule = async (args: { data: { module_key: string; enabled: boolean } }) => {
  return apiClient.post("/modules/toggle", args.data);
};
