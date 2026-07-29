import { apiClient } from "./api-client";

export const listServices = async () => {
  return apiClient.get("/appointments/services");
};

export const upsertService = async (args: { data: any }) => {
  return apiClient.post("/appointments/services", args.data);
};

export const deleteService = async (args: { data: { id: string } }) => {
  return apiClient.delete("/appointments/services", args.data);
};

export const listAppointments = async () => {
  return apiClient.get("/appointments");
};

export const upsertAppointment = async (args: { data: any }) => {
  return apiClient.post("/appointments", args.data);
};

export const updateAppointmentStatus = async (args: { data: { id: string; status: string } }) => {
  return apiClient.post("/appointments/status", args.data);
};

export const deleteAppointment = async (args: { data: { id: string } }) => {
  return apiClient.delete("/appointments", args.data);
};
