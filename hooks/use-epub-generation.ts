'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

type Status = 'idle' | 'generating' | 'success' | 'error' | 'downloading';

export interface GenerationStatus {
  status: Status;
  progress: number;
  message: string;
  downloadUrl?: string;
  error?: string;
  epubId?: string;
}

interface UseEpubGenerationProps {
  bookId: string;
  onStatusChange?: (status: Status) => void;
}

export function useEpubGeneration({ bookId, onStatusChange }: UseEpubGenerationProps) {
  const [status, setStatus] = useState<GenerationStatus>({
    status: 'idle',
    progress: 0,
    message: '',
  });
  
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  // Update status and call onStatusChange when status changes
  const updateStatus = useCallback((newStatus: Partial<GenerationStatus>) => {
    setStatus(prev => {
      const updated = { ...prev, ...newStatus };
      onStatusChange?.(updated.status);
      return updated;
    });
  }, [onStatusChange]);

  // Poll the server for generation status
  const pollGenerationStatus = useCallback(async (epubId: string) => {
    if (!session?.user?.id) {
      updateStatus({
        status: 'error',
        progress: 0,
        message: 'Authentication required',
        error: 'You must be logged in to generate EPUBs',
      });
      return;
    }

    const poll = async () => {
      try {
        const response = await fetch(`/api/books/${bookId}/publish/epub/status?epubId=${epubId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to check generation status');
        }

        const data = await response.json();
        
        // Update status based on the server response
        updateStatus({
          status: data.status,
          progress: data.progress || 0,
          message: data.message || '',
          error: data.error,
          downloadUrl: data.downloadUrl,
          epubId: data.epubId,
        });

        // Continue polling if still in progress
        if (data.status === 'generating' && data.progress < 100) {
          setTimeout(poll, 1500); // Poll every 1.5 seconds
        }
      } catch (error) {
        console.error('Error polling generation status:', error);
        updateStatus({
          status: 'error',
          progress: 0,
          message: 'Failed to check generation status',
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    };

    // Start polling
    poll();
  }, [bookId, session?.accessToken, session?.user?.id, updateStatus]);

  // Generate a new EPUB
  const generateEpub = useCallback(async (options?: any) => {
    if (authStatus === 'loading') {
      return;
    }

    if (authStatus === 'unauthenticated') {
      router.push(`/login?callbackUrl=/dashboard/books/${bookId}/publish/epub`);
      return;
    }

    updateStatus({
      status: 'generating',
      progress: 0,
      message: 'Starting EPUB generation...',
    });

    try {
      const response = await fetch(`/api/books/${bookId}/publish/epub`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify({
          ...options,
          bookId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to start EPUB generation');
      }

      const data = await response.json();
      
      if (data.epubId) {
        // Start polling for status updates
        pollGenerationStatus(data.epubId);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error generating EPUB:', error);
      updateStatus({
        status: 'error',
        progress: 0,
        message: 'Failed to start EPUB generation',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    }
  }, [authStatus, bookId, pollGenerationStatus, router, session?.accessToken, updateStatus]);

  // Download the generated EPUB
  const downloadEpub = useCallback(async () => {
    if (!status.downloadUrl || !status.epubId) {
      toast.error('No download URL available');
      return;
    }

    updateStatus({
      status: 'downloading',
      progress: 0,
      message: 'Preparing download...',
    });

    try {
      // Create a temporary anchor element to trigger the download
      const a = document.createElement('a');
      a.href = status.downloadUrl;
      a.download = `book-${bookId}-${new Date().toISOString().split('T')[0]}.epub`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      updateStatus(prev => ({
        ...prev,
        status: 'success',
        progress: 100,
        message: 'Download started successfully',
      }));
    } catch (error) {
      console.error('Error downloading EPUB:', error);
      updateStatus(prev => ({
        ...prev,
        status: 'error',
        message: 'Failed to download EPUB',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }));
      throw error;
    }
  }, [bookId, status.downloadUrl, status.epubId, updateStatus]);

  // Reset the status
  const resetStatus = useCallback(() => {
    updateStatus({
      status: 'idle',
      progress: 0,
      message: '',
      error: undefined,
      downloadUrl: undefined,
      epubId: undefined,
    });
  }, [updateStatus]);

  return {
    generateEpub,
    downloadEpub,
    resetStatus,
    status,
    isLoading: status.status === 'generating' || status.status === 'downloading',
    isSuccess: status.status === 'success',
    isError: status.status === 'error',
  };
}

export default useEpubGeneration;
