import { useQuery } from "@tanstack/react-query";

export function useGetChapter(bookSlug: string, chapterId: string) {
  return useQuery({
    queryKey: ["chapter", bookSlug, chapterId],
    queryFn: async () => {
      const res = await fetch(`/api/books/${bookSlug}/chapters/${chapterId}`);
      if (!res.ok) throw new Error("Failed to fetch chapter");
      return res.json();
    },
    enabled: !!bookSlug && !!chapterId,
  });
}
