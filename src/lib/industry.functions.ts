import { apiClient } from "./api-client";

export interface IndustryRecord {
  id: string;
  entity: string;
  title: string;
  status: string | null;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export const listIndustryRecords = async (moduleKey: string): Promise<IndustryRecord[]> => {
  return apiClient.get(`/industry/${moduleKey}`);
};

export const createIndustryRecord = async (
  moduleKey: string,
  entity: string,
  data: Record<string, unknown>,
): Promise<IndustryRecord> => {
  return apiClient.post(`/industry/${moduleKey}`, { entity, data });
};

export const updateIndustryRecord = async (
  moduleKey: string,
  id: string,
  data: Record<string, unknown>,
): Promise<IndustryRecord> => {
  return apiClient.put(`/industry/${moduleKey}/${id}`, { data });
};

export const deleteIndustryRecord = async (moduleKey: string, id: string) => {
  return apiClient.delete(`/industry/${moduleKey}/${id}`);
};
