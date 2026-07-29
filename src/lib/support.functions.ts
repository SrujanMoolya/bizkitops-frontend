import { apiClient } from "./api-client";

export const getSupportTickets = async () => {
  return apiClient.get("/support");
};

export const createSupportTicket = async (args: { data: any }) => {
  return apiClient.post("/support", args.data);
};
