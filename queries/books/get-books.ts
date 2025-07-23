import { useQuery } from "@tanstack/react-query";

export function useGetBooks() {
  return useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const res = await fetch("/api/books");
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Failed to fetch books:', {
          status: res.status,
          statusText: res.statusText,
          error: errorData
        });
        
        throw new Error(errorData.error || 'Failed to fetch books');
      }
      
      return res.json();
    },
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
