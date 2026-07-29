import { apiClient } from "./api-client";

export const listInvoices = async () => {
  return apiClient.get("/invoices");
};

export const getInvoice = async (args: { data: { id: string } }) => {
  return apiClient.get(`/invoices/${args.data.id}`);
};

export const upsertInvoice = async (args: { data: any }) => {
  return apiClient.post("/invoices", args.data);
};

export const markInvoicePaid = async (args: { data: { id: string } }) => {
  return apiClient.post("/invoices/mark-paid", args.data);
};

export const deleteInvoice = async (args: { data: { id: string } }) => {
  return apiClient.delete("/invoices", args.data);
};
