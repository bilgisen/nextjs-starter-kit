import { useQuery } from "@tanstack/react-query";
import { getChaptersByBookSlug as getChaptersByBookSlugAction } from "@/actions/books/chapters/get-chapters-by-slug";

export function useGetChaptersByBookSlug(bookSlug: string) {
  return useQuery({
    queryKey: ["chapters", bookSlug],
    queryFn: () => getChaptersByBookSlugAction(bookSlug),
    enabled: !!bookSlug,
  });
}
