import { supabase } from "@/integrations/supabase/client";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

async function request(path: string, options: RequestOptions = {}) {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (options.params) {
    Object.entries(options.params).forEach(([key, val]) => {
      url.searchParams.append(key, val);
    });
  }

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const refreshToken = data.session?.refresh_token;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    if (refreshToken) {
      headers.set("x-refresh-token", refreshToken);
    }
  } catch (err) {
    console.error("[API Client] Failed to get supabase session:", err);
  }

  const response = await fetch(url.toString(), {
    ...options,
    headers,
  });

  const text = await response.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // Response not JSON
  }

  if (!response.ok) {
    const errorMsg = json?.error || text || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return json;
}

export const apiClient = {
  get: (path: string, params?: Record<string, string>) => request(path, { method: "GET", params }),
  post: (path: string, body?: any) => request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path: string, body?: any) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path: string, body?: any) => request(path, { method: "DELETE", body: body ? JSON.stringify(body) : undefined }),
};
