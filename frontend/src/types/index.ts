export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ErrorResponse {
  success: boolean;
  error: string;
  message?: string;
}
