import { useQuery } from "@tanstack/react-query";
import type { Book } from "@/types/book";

export interface BookWithChapters extends Book {
  chapters: Array<{
    id: string;
    title: string;
    content: string;
    order: number;
    level: number;
    parentId: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  coverImage?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useGetBookBySlug(slug: string) {
  return useQuery<BookWithChapters, Error>({
    queryKey: ["book", slug],
    queryFn: async () => {
      const res = await fetch(`/api/books/${slug}`);
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to fetch book");
      }
      const { data } = await res.json();
      if (!data) {
        throw new Error("No book data returned");
      }
      return data;
    },
    enabled: !!slug,
    retry: (failureCount, error) => {
      // Don't retry on 404
      if (error.message.includes("not found")) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
  });
}
