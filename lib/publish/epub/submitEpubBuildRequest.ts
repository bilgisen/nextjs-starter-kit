import { EpubGenerationRequest, EpubGenerationResponse } from '@/types/epub';

/**
 * Submits an EPUB build request to the server
 * @param request The EPUB generation request data
 * @returns Promise with the generation response
 */
export async function submitEpubBuildRequest(
  request: EpubGenerationRequest
): Promise<EpubGenerationResponse> {
  try {
    const response = await fetch(`/api/books/${request.bookSlug}/publish/epub`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to submit EPUB build request: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting EPUB build request:', error);
    throw error;
  }
}

/**
 * Polls the server for EPUB build status
 * @param bookSlug The book slug
 * @param requestId The build request ID
 * @param interval Polling interval in milliseconds (default: 2000)
 * @param timeout Maximum time to poll in milliseconds (default: 60000)
 * @returns Promise that resolves with the final build status
 */
export async function pollEpubBuildStatus(
  bookSlug: string,
  requestId: string,
  interval = 2000,
  timeout = 60000
): Promise<EpubGenerationResponse> {
  const startTime = Date.now();
  
  return new Promise((resolve, reject) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(
          `/api/books/${bookSlug}/publish/epub/status?requestId=${requestId}`
        );

        if (!response.ok) {
          throw new Error(`Failed to check build status: ${response.statusText}`);
        }

        const status = await response.json();

        if (status.status === 'success' || status.status === 'error') {
          resolve(status);
          return;
        }

        // Continue polling if within timeout
        if (Date.now() - startTime < timeout) {
          setTimeout(checkStatus, interval);
        } else {
          reject(new Error('EPUB build timed out'));
        }
      } catch (error) {
        console.error('Error polling EPUB build status:', error);
        reject(error);
      }
    };

    // Start polling
    checkStatus();
  });
}
