// scripts/test-epub-api.ts
import fetch, { RequestInit, Response } from 'node-fetch';

const BASE_URL = 'http://localhost:3001';
const TEST_SLUG = 'test-book';

interface FetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>;
  body?: string;
  method?: string;
}

interface FetchResponse<T = unknown> {
  response: Response;
  data: T;
}

// Helper to make HTTP requests with better error handling
async function fetchWithRetry<T = any>(
  url: string, 
  options: FetchOptions = {}, 
  retries = 3, 
  backoff = 300
): Promise<FetchResponse<T>> {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempt ${i + 1}/${retries}: ${options.method || 'GET'} ${url}`);
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {})
        }
      });
      
      // Log response details
      const data = await response.json().catch(() => ({})) as T;
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log('Response:', JSON.stringify(data, null, 2));
      
      return { response, data } as FetchResponse<T>;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Attempt ${i + 1} failed:`, errorMessage);
      if (i === retries - 1) {
        throw new Error(`Failed after ${retries} attempts: ${errorMessage}`);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, backoff));
      backoff *= 2; // Exponential backoff
    }
  }
  throw new Error('All retry attempts failed');
}

async function testEndpoint() {
  console.log('=== Testing EPUB API Endpoint ===');
  
  // Test GET request
  console.log('\n1. Testing GET /api/books/[slug]/publish/epub');
  try {
    const { response: getResponse, data: getData } = await fetchWithRetry(
      `${BASE_URL}/api/books/${TEST_SLUG}/publish/epub`,
      { method: 'GET' }
    );
    
    console.log('GET Test Results:', {
      success: getResponse.ok,
      status: getResponse.status,
      statusText: getResponse.statusText,
      data: getData
    });
  } catch (error) {
    console.error('GET Test failed:', error);
  }
  
  // Test POST request without authentication
  console.log('\n2. Testing POST /api/books/[slug]/publish/epub (unauthenticated)');
  try {
    const { response: postResponse, data: postData } = await fetchWithRetry(
      `${BASE_URL}/api/books/${TEST_SLUG}/publish/epub`,
      {
        method: 'POST',
        body: JSON.stringify({
          options: {
            output_format: 'epub',
            generate_toc: true,
            include_imprint: true,
            embed_metadata: true,
            cover: true
          }
        })
      }
    );
    
    console.log('POST Test Results (unauthenticated):', {
      success: postResponse.ok,
      status: postResponse.status,
      statusText: postResponse.statusText,
      data: postData
    });
  } catch (error) {
    console.error('POST Test failed:', error);
  }
  
  // Test with authentication (if we have a way to get a token)
  if (process.env.TEST_AUTH_TOKEN) {
    console.log('\n3. Testing POST /api/books/[slug]/publish/epub (authenticated)');
    try {
      const { response: authResponse, data: authData } = await fetchWithRetry(
        `${BASE_URL}/api/books/${TEST_SLUG}/publish/epub`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.TEST_AUTH_TOKEN}`
          },
          body: JSON.stringify({
            options: {
              output_format: 'epub',
              generate_toc: true,
              include_imprint: true,
              embed_metadata: true,
              cover: true
            }
          })
        }
      );
      
      console.log('POST Test Results (authenticated):', {
        success: authResponse.ok,
        status: authResponse.status,
        statusText: authResponse.statusText,
        data: authData
      });
    } catch (error) {
      console.error('Authenticated POST Test failed:', error);
    }
  }
  
  console.log('\nTest completed. Check the server logs for detailed request information.');
}

testEndpoint().catch(console.error);
