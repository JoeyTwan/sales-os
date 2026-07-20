export interface CustomerOverviewContact {
  id: string;
  name: string;
  position: string | null;
  phone: string | null;
  email: string | null;
  remark: string | null;
}

export interface CustomerOverviewProject {
  id: string;
  name: string;
  description: string | null;
  amount: number | null;
  status: string;
  updated_at: string;
}

export interface CustomerOverviewActivity {
  id: string;
  content: string;
  source: string;
  activity_date: string;
}

export interface CustomerOverviewTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
}

export interface CustomerOverviewStatistics {
  project_count: number;
  contact_count: number;
  task_count: number;
  activity_count: number;
  project_stage_count: Record<string, number>;
}

export interface CustomerOverviewCustomer {
  id: string;
  name: string;
  level: string;
  status: string;
  summary: string;
  next_action: string;
  next_action_date: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerOverview {
  customer: CustomerOverviewCustomer;
  contacts: CustomerOverviewContact[];
  projects: CustomerOverviewProject[];
  tasks: CustomerOverviewTask[];
  activities: CustomerOverviewActivity[];
  statistics: CustomerOverviewStatistics;
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function apiGet<T>(url: string): Promise<T> {
  return apiRequest<T>(url, { method: "GET" });
}

export async function apiPost<T>(url: string, body: unknown): Promise<T> {
  return apiRequest<T>(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiPatch<T>(url: string, body: unknown): Promise<T> {
  return apiRequest<T>(url, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function apiDelete(url: string): Promise<void> {
  await apiRequest(url, { method: "DELETE" });
}
