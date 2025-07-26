'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { generateEpub, getEpubGenerationStatus, downloadEpub } from '@/actions/books/publish';
import type { PublishOptions, GenerationResponse, GenerationStatus, DownloadResult } from '@/actions/books/publish/epub-actions/types';

export function useEpubGeneration(bookSlug: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Generate EPUB mutation
  const generateMutation = useMutation<GenerationResponse, Error, PublishOptions>({
    mutationFn: (options) => generateEpub(bookSlug, options),
    onSuccess: (data) => {
      toast.success('EPUB generation started!', {
        description: 'Your book is being processed. This may take a few minutes.'
      });
      
      // Invalidate and refetch status query
      if (data.workflow_dispatch?.id) {
        queryClient.invalidateQueries({
          queryKey: ['epubStatus', bookSlug, data.workflow_dispatch.id]
        });
      }
    },
    onError: (error) => {
      toast.error('Failed to start EPUB generation', {
        description: error.message
      });
    }
  });

  // Check generation status
  const statusQuery = useQuery<GenerationStatus, Error>({
    queryKey: ['epubStatus', bookSlug],
    queryFn: async () => {
      if (!generateMutation.data?.workflow_dispatch?.id) {
        throw new Error('No workflow ID found');
      }
      return getEpubGenerationStatus(bookSlug, generateMutation.data.workflow_dispatch.id);
    },
    enabled: !!generateMutation.data?.workflow_dispatch?.id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'completed' || status === 'failed' ? false : 5000; // Poll every 5s
    },
    onSuccess: (data) => {
      if (data.status === 'completed') {
        toast.success('EPUB generation completed!', {
          description: 'Your book is ready to download.'
        });
      } else if (data.status === 'failed') {
        toast.error('EPUB generation failed', {
          description: 'There was an error generating your EPUB. Please try again.'
        });
      }
    }
  });

  // Download EPUB
  const downloadMutation = useMutation<DownloadResult, Error, number>({
    mutationFn: (artifactId) => downloadEpub(bookSlug, artifactId),
    onSuccess: (data) => {
      if (data.success && data.downloadUrl) {
        // Trigger download
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = data.filename || 'book.epub';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        URL.revokeObjectURL(data.downloadUrl);
      }
    },
    onError: (error) => {
      toast.error('Download failed', {
        description: error.message
      });
    }
  });

  return {
    generateEpub: generateMutation.mutateAsync,
    isGenerating: generateMutation.isPending,
    status: statusQuery.data,
    isStatusLoading: statusQuery.isLoading,
    downloadEpub: downloadMutation.mutateAsync,
    isDownloading: downloadMutation.isPending,
    error: generateMutation.error || statusQuery.error || downloadMutation.error
  };
}
