"use client";

import { useEffect, useState } from "react";
import { Book } from "@/components/books/book-card";
import { getBookBySlug } from "./get-book-by-slug";

export function useGetBookBySlug(slug: string) {
  const [data, setData] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchBook = async () => {
      if (!slug) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const book = await getBookBySlug(slug);
        setData(book || null);
        setError(null);
      } catch (err) {
        console.error("Error fetching book:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch book"));
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBook();
  }, [slug]);

  return { data, isLoading, error };
}
