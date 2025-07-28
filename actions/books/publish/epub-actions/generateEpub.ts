// actions/books/publish/epub-actions/generateEpub.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/actions/auth/get-session';
import { PublishOptions, GenerationResponse } from './types';
import { getApiUrl } from './utils';

/**
 * Generates an EPUB file for the specified book
 * @param bookSlug - The slug of the book to generate EPUB for
 * @param options - EPUB generation options
 * @param isGitHubAction - Whether this is a GitHub Action request
 */
export async function generateEpub(
  bookSlug: string,
  options: Omit<PublishOptions, 'output_format'>,
  isGitHubAction: boolean = false
): Promise<GenerationResponse> {
  // Skip session check for GitHub Actions requests
  if (!isGitHubAction) {
    const session = await getSession();
    if (!session?.user) {
      console.error('EPUB generation failed: User not authenticated');
      throw new Error('Not authenticated');
    }
  } else {
    console.log('GitHub Action request - bypassing authentication');
  }

  const url = getApiUrl(`/api/books/${bookSlug}/publish/epub`);
  // Structure the payload with required options field
  // Convert cover to boolean, handling various input types
  const coverValue = options.cover;
  const cover = typeof coverValue === 'boolean' 
    ? coverValue 
    : typeof coverValue === 'string'
      ? !['false', '0', ''].includes(coverValue.toLowerCase())
      : coverValue !== undefined && coverValue !== null && coverValue !== 0;
  
  const payload = {
    options: {
      ...options,
      output_format: 'epub' as const,
      theme: 'default',
      // Ensure all required options have defaults if not provided
      generate_toc: options.generate_toc ?? true,
      include_imprint: options.include_imprint ?? true,
      embed_metadata: options.embed_metadata ?? true,
      cover: cover, // Use the converted boolean value
    },
  };
  
  console.log('Sending payload to EPUB API:', JSON.stringify(payload, null, 2));

  try {
    if (!process.env.NEXT_EPUB_SECRET) {
      throw new Error('NEXT_EPUB_SECRET is not configured');
    }

    const token = process.env.NEXT_EPUB_SECRET.trim();
    const authHeader = `Bearer ${token}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(payload),
    });
    
    console.log('Request headers:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.substring(0, 5)}...`
    });

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorText = await response.text();
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          body: errorText
        });
        
        // Try to parse as JSON if possible
        try {
          const errorData = JSON.parse(errorText);
          
          // Handle validation errors
          if (errorData.details) {
            // Format validation errors into a readable message
            const validationErrors: string[] = [];
            
            // Check for output_format validation error
            if (errorData.details.options?.output_format?._errors?.[0]) {
              validationErrors.push(`Output format: ${errorData.details.options.output_format._errors[0]}`);
            }
            
            // Check for other validation errors
            if (errorData.details._errors?.length) {
              validationErrors.push(...errorData.details._errors);
            }
            
            if (validationErrors.length) {
              errorMessage = `Validation error: ${validationErrors.join('; ')}`;
            } else if (errorData.error) {
              errorMessage = errorData.error;
            }
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else {
            errorMessage = errorText;
          }
        } catch (error) {
          // If JSON parsing fails, use the text response
          console.error('Failed to parse error response:', error);
          errorMessage = errorText;
        }
      } catch (error) {
        console.error('Error processing error response:', error);
        errorMessage = `Failed to process error response: ${error instanceof Error ? error.message : String(error)}`;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json() as GenerationResponse;
    
    // Revalidate any relevant paths
    revalidatePath(`/dashboard/books/${bookSlug}/publish`);
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to generate EPUB');
    }
    
    return result;
  } catch (error) {
    console.error('EPUB generation failed:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to generate EPUB. Please try again.'
    );
  }
}
