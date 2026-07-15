import { useState, useCallback } from "react";
import type { ApiResponse } from "@/types";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApiGet<T>(endpoint: string) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`/api${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Request failed");
      }

      const result: ApiResponse<T> = await response.json();
      setState((prev) => ({ ...prev, data: result.data, loading: false }));
      return result.data;
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Unknown error",
        loading: false,
      }));
      throw err;
    }
  }, [endpoint]);

  return { ...state, fetchData };
}
