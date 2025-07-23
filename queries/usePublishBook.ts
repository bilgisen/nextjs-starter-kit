import { useMutation } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

type PublishFormat = 'pdf' | 'epub' | 'mobi';

export function usePublishBook() {
  const { slug } = useParams();
  
  return useMutation({
    mutationFn: async (format: PublishFormat) => {
      const response = await fetch(`/api/books/${slug}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ format })
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Failed to publish book');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // You can add success handling here
      console.log('Publish successful:', data);
      // Optionally redirect or show success message
    },
    onError: (error: Error) => {
      console.error('Publish error:', error);
      // Error handling is done through the error state in the component
    }
  });
}
