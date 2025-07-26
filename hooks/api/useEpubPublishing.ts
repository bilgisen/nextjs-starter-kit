'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getSession } from '@/actions/auth/get-session';
import { 
  prepareEpubGeneration, 
  generateEpub as generateEpubAction, 
  getEpubGenerationStatus, 
  downloadEpub as downloadEpubAction,
  type EpubBuildStatus,
  type EpubGenerationRequest
} from '@/actions/books/publish/epub-actions';

export function useEpubPublishing(bookSlug: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Query for book data and chapters
  const bookQuery = useQuery({
    queryKey: ['book', bookSlug],
    queryFn: async () => {
      try {
        const session = await getSession();
        if (!session?.user) {
          console.error('No user session found');
          router.push(`/login?callbackUrl=/dashboard/books/${bookSlug}/publish/epub`);
          throw new Error('Unauthorized');
        }
        return prepareEpubGeneration(bookSlug);
      } catch (error) {
        console.error('Error in book query:', error);
        throw error;
      }
    },
    enabled: !!bookSlug,
    retry: 1,
  });

  // Mutation for generating EPUB
  const generateEpub = useMutation({
    mutationFn: async (options: Partial<EpubGenerationRequest['options']> = {}) => {
      try {
        const session = await getSession();
        if (!session?.user) {
          console.error('No user session found during EPUB generation');
          router.push(`/login?callbackUrl=/dashboard/books/${bookSlug}/publish/epub`);
          throw new Error('Unauthorized');
        }
        return generateEpubAction(bookSlug, options);
      } catch (error) {
        console.error('Error in generateEpub mutation:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['epubStatus', bookSlug] });
      toast.success('EPUB generation started');
    },
    onError: (error) => {
      console.error('EPUB generation failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to start EPUB generation');
    },
  });

  // Query for EPUB generation status
  const epubStatusQuery = useQuery({
    queryKey: ['epubStatus', bookSlug],
    queryFn: async () => {
      const session = await getSession();
      if (!session?.user) {
        router.push(`/login?callbackUrl=/dashboard/books/${bookSlug}/publish/epub`);
        throw new Error('Unauthorized');
      }
      // Get the latest generation ID from the book data
      const bookData = queryClient.getQueryData(['book', bookSlug]);
      if (!bookData?.latestEpubGenerationId) {
        return null;
      }
      return getEpubGenerationStatus(bookSlug, bookData.latestEpubGenerationId);
    },
    enabled: !!bookSlug && !!bookQuery.data?.latestEpubGenerationId,
    refetchInterval: (query) => {
      return query.state.data?.status === 'processing' ? 2000 : false;
    },
  });

  // Mutation for downloading EPUB
  const downloadEpub = useMutation({
    mutationFn: async () => {
      const status = epubStatusQuery.data;
      if (!status?.downloadUrl) {
        throw new Error('No download URL available');
      }
      return downloadEpubAction(status.downloadUrl, `${bookSlug}.epub`);
    },
    onSuccess: () => {
      toast.success('EPUB download started');
    },
    onError: (error) => {
      console.error('Download failed:', error);
      toast.error('Failed to download EPUB');
    },
  });

  return {
    book: bookQuery.data,
    isLoading: bookQuery.isLoading,
    isError: bookQuery.isError,
    error: bookQuery.error,
    generateEpub: generateEpub.mutateAsync,
    isGenerating: generateEpub.isPending,
    generationStatus: epubStatusQuery.data,
    isGeneratingStatusLoading: epubStatusQuery.isLoading,
    downloadEpub: downloadEpub.mutateAsync,
    isDownloading: downloadEpub.isPending,
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ['book', bookSlug] });
      queryClient.invalidateQueries({ queryKey: ['epubStatus', bookSlug] });
    },
  };
}
