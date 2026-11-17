
const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8080/api"
).replace(/\/+$/, "");


export class ApiError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);

    this.name = "ApiError";
    this.status = status;
  }
}


export async function apiGet<T>(
  endpoint: string,
  signal?: AbortSignal,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(
      `${API_BASE_URL}${endpoint}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal,
      },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw new ApiError(
      0,
      "Unable to connect to the server. Please try again.",
    );
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new ApiError(404, "Resource not found.");
    }

    if (response.status >= 500) {
      throw new ApiError(
        response.status,
        "The server is temporarily unavailable.",
      );
    }

    throw new ApiError(
      response.status,
      `Request failed with status ${response.status}.`,
    );
  }

  return (await response.json()) as T;
}
