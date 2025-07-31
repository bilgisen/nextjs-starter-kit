// actions/books/publish/epub-actions/generateEpub.ts
'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/actions/auth/get-session';
import { PublishOptions, GenerationResponse } from './types';
import { getApiUrl } from './utils';
import { getJwtToken, validateToken } from '@/lib/jwt';

interface PayloadType {
  options: PublishOptions & {
    output_format: 'epub';
    theme: string;
    generate_toc: boolean;
    include_imprint: boolean;
    embed_metadata: boolean;
    cover: boolean;
  };
}

/**
 * Makes an authenticated request to the EPUB generation API
 */
async function makeRequest(
  url: string,
  payload: PayloadType,
  headers: Record<string, string>
): Promise<GenerationResponse> {
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Request failed:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      body: errorText
    });
    
    // Try to parse error as JSON
    try {
      const errorData = JSON.parse(errorText);
      if (errorData.error) {
        throw new Error(errorData.error);
      }
      if (errorData.details) {
        const errors = [];
        if (errorData.details.options?.output_format?._errors?.[0]) {
          errors.push(`Output format: ${errorData.details.options.output_format._errors[0]}`);
        }
        if (errorData.details._errors?.length) {
          errors.push(...errorData.details._errors);
        }
        if (errors.length) {
          throw new Error(`Validation error: ${errors.join('; ')}`);
        }
      }
      throw new Error(errorText);
    } catch {
      throw new Error(errorText || `Request failed with status ${response.status}`);
    }
  }

  return response.json();
}

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
  // Convert cover to boolean, handling various input types
  const coverValue = options.cover;
  const cover = typeof coverValue === 'string' 
    ? !['false', '0', ''].includes(coverValue.toLowerCase())
    : Boolean(coverValue);
  
  const payload: PayloadType = {
    options: {
      ...options,
      output_format: 'epub',
      theme: 'default',
      generate_toc: options.generate_toc ?? true,
      include_imprint: options.include_imprint ?? true,
      embed_metadata: options.embed_metadata ?? true,
      cover,
    },
  };

  console.log('Sending payload to EPUB API:', JSON.stringify(payload, null, 2));
  const url = getApiUrl(`/api/books/${bookSlug}/publish/epub`);
  
  // Skip session check for GitHub Actions requests
  if (!isGitHubAction) {
    const session = await getSession();
    if (!session?.user) {
      console.error('EPUB generation failed: User not authenticated');
      throw new Error('Not authenticated');
    }
    
    // Get a fresh JWT token
    const token = await getJwtToken();
    if (!token) {
      console.error('EPUB generation failed: Failed to get JWT token');
      throw new Error('Failed to get authentication token');
    }
    
    // Add the token to the request headers
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    console.log('🔑 Using token for authentication:', {
      tokenPrefix: token.substring(0, 5) + '...',
      tokenLength: token.length
    });
    
    // Make the request with the authenticated headers
    const result = await makeRequest(url, payload, headers);
    
    // Revalidate any relevant paths
    revalidatePath(`/dashboard/books/${bookSlug}/publish`);
    
    return result;
  }
  
  console.log('GitHub Action request - bypassing authentication');
  // For GitHub Actions, make the request without authentication
  return makeRequest(url, payload, { 'Content-Type': 'application/json' });
}
