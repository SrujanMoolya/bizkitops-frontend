import { apiClient } from "./api-client";

export const listLeads = async () => {
  return apiClient.get("/crm/leads");
};

export const upsertLead = async (args: { data: any }) => {
  return apiClient.post("/crm/leads", args.data);
};

export const updateLeadStage = async (args: { data: { id: string; stage: string; sort_order?: number } }) => {
  return apiClient.post("/crm/leads/stage", args.data);
};

export const deleteLead = async (args: { data: { id: string } }) => {
  return apiClient.delete("/crm/leads", args.data);
};

export const listLeadActivities = async (args: { data: { leadId: string } }) => {
  return apiClient.get("/crm/activities", { leadId: args.data.leadId });
};

export const createLeadActivity = async (args: { data: { leadId: string; activityType: string; content: string } }) => {
  return apiClient.post("/crm/activities", args.data);
};
