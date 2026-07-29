import { apiClient } from "./api-client";

export const listExpenses = async () => {
  return apiClient.get("/expenses");
};

export const upsertExpense = async (args: { data: any }) => {
  return apiClient.post("/expenses", args.data);
};

export const deleteExpense = async (args: { data: { id: string } }) => {
  return apiClient.delete("/expenses", args.data);
};
