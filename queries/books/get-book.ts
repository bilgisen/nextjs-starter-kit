import { useQuery } from "@tanstack/react-query";

export function useGetBook(identifier: string) {
  // The API now handles both UUID and slug in the same endpoint
  const endpoint = `/api/books/by-id/${identifier}`;
  
  return useQuery({
    queryKey: ["book", identifier],
    queryFn: async () => {
      const res = await fetch(endpoint);
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Book not found");
      }
      return res.json();
    },
    enabled: !!identifier,
  });
}
