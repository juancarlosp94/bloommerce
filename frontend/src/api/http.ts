
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080/api"
).replace(/\/+$/, "");

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined
        ? undefined
        : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(0, "Unable to connect to the server.");
  }

  if (!response.ok) {
    let message = "";

    try {
      const data: unknown = await response.json();

      if (data && typeof data === "object") {
        const details = data as Record<string, unknown>;
        if (typeof details.detail === "string") {
          message = details.detail;
        } else if (typeof details.message === "string") {
          message = details.message;
        }
      }
    } catch {
      // The error response might not contain JSON.
    }

    const fallback: Record<number, string> = {
      400: "Please check the information provided.",
      401: "Invalid credentials or expired session.",
      403: "You are not authorized to perform this action.",
      404: "Resource not found.",
      409: "This resource already exists.",
    };

    throw new ApiError(
      response.status,
      message ||
        fallback[response.status] ||
        (response.status >= 500
          ? "The server is temporarily unavailable."
          : "Request failed."),
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function apiGet<T>(
  endpoint: string,
  signal?: AbortSignal,
): Promise<T> {
  return apiRequest<T>(endpoint, { signal });
}
