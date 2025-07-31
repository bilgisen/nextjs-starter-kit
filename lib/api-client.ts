import { getSession } from '@/actions/auth/get-session';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  cache?: RequestCache;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<{ data?: T; error?: string }> {
  try {
    // Get session to include auth headers if available
    const session = await getSession();
    const token = session?.user?.id; // Adjust based on your auth token storage

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api${endpoint}`, {
      method: options.method || 'GET',
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      credentials: 'include', // Important for cookies
      cache: options.cache,
      next: options.next,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        error: data.message || `HTTP error! status: ${response.status}`,
      };
    }

    return { data };
  } catch (error) {
    console.error('API Client Error:', error);
    return {
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
}

// Example usage functions
export const api = {
  get: <T = any>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(
    endpoint: string,
    body: any,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ) => apiClient<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T = any>(
    endpoint: string,
    body: any,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ) => apiClient<T>(endpoint, { ...options, method: 'PUT', body }),

  delete: <T = any>(
    endpoint: string,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ) => apiClient<T>(endpoint, { ...options, method: 'DELETE' }),

  patch: <T = any>(
    endpoint: string,
    body: any,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ) => apiClient<T>(endpoint, { ...options, method: 'PATCH', body }),
};
