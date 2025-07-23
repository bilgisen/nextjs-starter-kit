import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

interface Chapter {
  id: string;
  bookId: string;
  title: string;
  content: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export function useBookChapters() {
  const { slug } = useParams();
  return useQuery<Chapter[]>({
    queryKey: ['book', slug, 'chapters'],
    queryFn: async () => {
      const response = await fetch(`/api/books/${slug}/chapters`);
      if (!response.ok) {
        throw new Error('Failed to fetch chapters');
      }
      return response.json();
    },
    enabled: !!slug, // Only run the query if slug exists
  });
}
