import { useQuery } from "@tanstack/react-query";

export function useGetBooks() {
  return useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      // Get the auth token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add the Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch("/api/books", {
        headers
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Failed to fetch books:', {
          status: res.status,
          statusText: res.statusText,
          error: errorData
        });
        
        // If unauthorized, clear the invalid token
        if (res.status === 401 && typeof window !== 'undefined') {
          localStorage.removeItem('bearer_token');
        }
        
        throw new Error(errorData.error || 'Failed to fetch books');
      }
      
      return res.json();
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
