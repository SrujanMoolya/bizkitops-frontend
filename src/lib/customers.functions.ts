import { apiClient } from "./api-client";

export const listCustomers = async () => {
  return apiClient.get("/customers");
};

export const upsertCustomer = async (args: { data: any }) => {
  return apiClient.post("/customers", args.data);
};

export const deleteCustomer = async (args: { data: { id: string } }) => {
  return apiClient.delete("/customers", args.data);
};
