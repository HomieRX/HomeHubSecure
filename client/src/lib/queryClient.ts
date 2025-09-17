import { QueryClient, QueryFunction } from "@tanstack/react-query";

// CSRF token storage
let csrfToken: string | null = null;

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Fetch CSRF token from server
async function fetchCSRFToken(): Promise<string> {
  if (csrfToken) {
    return csrfToken;
  }
  
  try {
    const res = await fetch("/api/csrf-token", {
      credentials: "include",
    });
    
    if (res.ok) {
      const data = await res.json();
      csrfToken = data.csrfToken;
      return csrfToken || "";
    }
  } catch (error) {
    console.warn("Failed to fetch CSRF token:", error);
  }
  
  return "";
}

// Check if method requires CSRF token
function requiresCSRFToken(method: string): boolean {
  return ["POST", "PUT", "DELETE", "PATCH"].includes(method.toUpperCase());
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | FormData | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};
  
  // Only set Content-Type for JSON data, not for FormData (browser sets it automatically)
  if (data && !(data instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add CSRF token for mutating requests
  if (requiresCSRFToken(method)) {
    try {
      const token = await fetchCSRFToken();
      if (token) {
        headers["X-CSRF-Token"] = token;
      }
    } catch (error) {
      console.warn("Failed to get CSRF token for request:", error);
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
