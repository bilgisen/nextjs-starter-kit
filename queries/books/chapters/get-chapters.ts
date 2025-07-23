import { useQuery } from "@tanstack/react-query";

export interface Chapter {
  id: string;
  title: string;
  content?: string;
  order?: number;
  level?: number;
  parent_chapter_id?: string | null;
  book_id?: string;
  created_at?: string;
  updated_at?: string;
  // Add other chapter properties as needed
}

interface GetChaptersOptions {
  enabled?: boolean;
}

export function useGetChapters(bookIdentifier: string, options: GetChaptersOptions = {}) {
  // The API route now handles both slug and ID
  const endpoint = `/api/books/${bookIdentifier}/chapters`;

  return useQuery({
    queryKey: ["chapters", bookIdentifier],
    queryFn: async () => {
      const res = await fetch(endpoint);
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to fetch chapters");
      }
      const response = await res.json();
      
      // Handle the API response format with success and data fields
      if (response.success && Array.isArray(response.data)) {
        return response.data;
      } 
      // Fallback for other formats
      else if (Array.isArray(response)) {
        return response;
      } else if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      
      console.error('Unexpected API response format:', response);
      return [];
    },
    enabled: options.enabled !== undefined ? options.enabled : !!bookIdentifier,
  });
}
