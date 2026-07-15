import type { ApiResponse, ErrorResponse } from "@/types";

const API_BASE_URL = "/api";

export async function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.message || error.error);
  }

  return response.json();
}

export async function apiPost<T>(
  endpoint: string,
  body?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.message || error.error);
  }

  return response.json();
}

export async function apiPut<T>(
  endpoint: string,
  body?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.message || error.error);
  }

  return response.json();
}

export async function apiDelete<T>(endpoint: string): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error: ErrorResponse = await response.json();
    throw new Error(error.message || error.error);
  }

  return response.json();
}
