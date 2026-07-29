import { apiClient } from "./api-client";

export const listInventory = async () => {
  return apiClient.get("/inventory");
};

export const upsertInventoryItem = async (args: { data: any }) => {
  return apiClient.post("/inventory", args.data);
};

export const deleteInventoryItem = async (args: { data: { id: string } }) => {
  return apiClient.delete("/inventory", args.data);
};
