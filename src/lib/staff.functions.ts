import { apiClient } from "./api-client";

export const listStaffMembers = async () => {
  return apiClient.get("/staff");
};

export const inviteStaffMember = async (args: { data: { email: string; role: string } }) => {
  return apiClient.post("/staff/invite", args.data);
};

export const updateStaffMemberRole = async (args: { data: { id: string; role: string } }) => {
  return apiClient.post("/staff/role", args.data);
};

export const deleteStaffMember = async (args: { data: { id: string } }) => {
  return apiClient.delete("/staff", args.data);
};
