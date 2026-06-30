// src/utils/apiClient.ts

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (typeof window !== "undefined"
    ? "/api/proxy"
    : "http://dc8wck04cgw8wc4ockg0okc4.89.117.53.152.sslip.io/");

type ApiResponse<T = any> = {
  data?: T;
  error?: string;
};

type RequestOptions = {
  headers?: Record<string, string>;
  timeout?: number;
};

// Helper function to handle fetch requests
async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {},
): Promise<Response> {
  const { timeout = 10000 } = options; // Default timeout of 10 seconds

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw error;
  }
}

// Helper function to extract error message from response
async function getErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data.error || data.message || response.statusText;
  } catch {
    return response.statusText;
  }
}

export const apiClient = {
  get: async <T = any>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<T> => {
    const response = await fetchWithTimeout(`${BASE_URL}${endpoint}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      timeout: options?.timeout,
    });

    if (!response.ok) {
      const errorMessage = await getErrorMessage(response);
      throw new Error(`GET request failed: ${errorMessage}`);
    }

    return response.json();
  },

  post: async <T = any>(
    endpoint: string,
    body: Record<string, any>,
    options?: RequestOptions,
  ): Promise<T> => {
    const response = await fetchWithTimeout(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: JSON.stringify(body),
      timeout: options?.timeout,
    });

    if (!response.ok) {
      const errorMessage = await getErrorMessage(response);
      throw new Error(`POST request failed: ${errorMessage}`);
    }

    return response.json();
  },

  put: async <T = any>(
    endpoint: string,
    body?: Record<string, any>,
    options?: RequestOptions,
  ): Promise<T> => {
    const response = await fetchWithTimeout(`${BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      timeout: options?.timeout,
    });

    if (!response.ok) {
      const errorMessage = await getErrorMessage(response);
      throw new Error(`PUT request failed: ${errorMessage}`);
    }

    return response.json();
  },

  delete: async <T = any>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<T> => {
    const response = await fetchWithTimeout(`${BASE_URL}${endpoint}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      timeout: options?.timeout,
    });

    if (!response.ok) {
      const errorMessage = await getErrorMessage(response);
      throw new Error(`DELETE request failed: ${errorMessage}`);
    }

    return response.json();
  },
};
