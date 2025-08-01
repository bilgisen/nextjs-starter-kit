// Test script for Better Auth JWT functionality
// This script tests the authentication flow using Google OAuth

import { authClient } from '../lib/auth-client';
import { getAuthToken } from '../lib/auth-client';

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Store cookies for session persistence
const cookieJar: Record<string, string> = {};

// Helper to parse set-cookie headers
function parseSetCookies(headers: Headers): Record<string, string> {
  const cookies: Record<string, string> = {};
  const setCookie = headers.get('set-cookie');
  
  if (setCookie) {
    // Handle multiple Set-Cookie headers
    const cookieStrings = setCookie.split(/,(?=[^;]+=[^;]+;)/);
    
    for (const cookieStr of cookieStrings) {
      const [keyValue, ...parts] = cookieStr.split(';').map(part => part.trim());
      const [key, value] = keyValue.split('=');
      if (key && value) {
        cookies[key.trim()] = value;
      }
    }
  }
  
  return cookies;
}

// Helper function to make HTTP requests
interface RequestOptions {
  method?: string;
  body?: any;
  queryParams?: Record<string, string>;
  includeCookies?: boolean;
  headers?: Record<string, string>;
}

async function makeRequest(
  url: string,
  options: RequestOptions = {}
) {
  const {
    method = 'GET',
    body,
    queryParams = {},
    includeCookies = false,
    headers: customHeaders = {}
  } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders
  };

  // Add cookies if needed
  if (includeCookies) {
    const cookieString = Object.entries(cookieJar)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
      
    if (cookieString) {
      headers['Cookie'] = cookieString;
    }
  }

  // Add query parameters
  const queryString = new URLSearchParams(queryParams).toString();
  const fullUrl = queryString ? `${url}?${queryString}` : url;

  console.log(`Making ${method} request to: ${fullUrl}`);
  if (Object.keys(headers).length > 0) {
    console.log('Headers:', JSON.stringify(headers, null, 2));
  }
  if (body) {
    console.log('Body:', JSON.stringify(body, null, 2));
  }

  const response = await fetch(fullUrl, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: includeCookies ? 'include' : 'same-origin',
    redirect: 'manual', // Don't follow redirects automatically
  });

  // Update cookies from response
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    const cookies = parseSetCookies(new Headers({ 'set-cookie': setCookie }));
    Object.assign(cookieJar, cookies);
  }

  // Handle redirects
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    if (location) {
      console.log(`Following redirect to: ${location}`);
      return makeRequest(location, {
        method: 'GET',
        includeCookies,
        headers: customHeaders
      });
    }
  }

  let data = {};
  const contentType = response.headers.get('content-type');
  
  try {
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { text: await response.text() };
    }
  } catch (error) {
    console.error('Error parsing response:', error);
  }
  
  console.log('Response status:', response.status, response.statusText);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  console.log('Response data:', JSON.stringify(data, null, 2));
  
  return {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    data,
  };
}

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface Session {
  user: User | null;
  expires: string;
}

/**
 * Test 1: Test the OAuth login flow
 */
async function testOAuthLogin(): Promise<{ user: User; token: string }> {
  console.log('\n=== Testing OAuth Login ===');
  
  try {
    // First, try to get the current session to see if we're already authenticated
    console.log('\nStep 1: Checking current session...');
    const sessionResponse = await authClient.getSession();
    
    if (sessionResponse.data?.user) {
      console.log('✅ Already authenticated as:', sessionResponse.data.user.email);
      return {
        user: sessionResponse.data.user,
        token: getAuthToken() || ''
      };
    }
    
    // Initiate OAuth flow
    console.log('\nStep 2: Initiating Google OAuth flow...');
    try {
      const oauthResponse = await authClient.signIn.social('google', {
        callbackURL: `${BASE_URL}/dashboard`
      });
      
      console.log('OAuth response:', oauthResponse);
      
      if (oauthResponse.redirect) {
        console.log('✅ OAuth flow initiated. Please complete the login in your browser.');
        console.log('After successful login, the test will continue automatically.');
        
        // Poll for session until user is authenticated
        console.log('\nStep 3: Waiting for authentication to complete...');
        let attempts = 0;
        const maxAttempts = 12; // 1 minute max wait (5 seconds * 12 attempts)
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          attempts++;
          
          console.log(`Checking session... (attempt ${attempts}/${maxAttempts})`);
          const sessionCheck = await authClient.getSession();
          
          if (sessionCheck.data?.user) {
            const token = getAuthToken();
            if (!token) {
              throw new Error('No auth token found after successful login');
            }
            
            console.log('✅ Authentication successful!');
            return {
              user: sessionCheck.data.user,
              token
            };
          }
          
          console.log('No active session yet...');
        }
        
        throw new Error('Authentication timed out. Please try again.');
      } else {
        throw new Error('Unexpected response from OAuth flow');
      }
    } catch (error) {
      console.error('Error during OAuth flow:', error);
      throw error;
    }
  } catch (error) {
    console.error('❌ OAuth login test failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}

interface TokenResponse {
  token?: string;
  valid?: boolean;
}

/**
 * Test 2: Test JWT token retrieval
 */
async function testJwtToken(userToken: string): Promise<{ token: string; verified: boolean }> {
  console.log('\n=== Testing JWT Token Generation ===');
  
  try {
    console.log('\nStep 1: Requesting JWT token...');
    const tokenResponse = await makeRequest(`${API_URL}/auth/token`, {
      method: 'POST',
      body: {
        expiresIn: '1h',
        claims: {
          workflowId: 'test-workflow-123',
          bookSlug: 'test-book'
        }
      },
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    const tokenData = tokenResponse.data as TokenResponse;
    
    if (!tokenData?.token) {
      console.error('Token response:', tokenResponse);
      throw new Error('No token received in response');
    }

    console.log('✅ JWT token received');

    // Verify the token
    console.log('\nStep 2: Verifying JWT token...');
    const verifyResponse = await makeRequest(`${API_URL}/auth/token/verify`, {
      method: 'POST',
      body: {
        token: tokenData.token
      },
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    const verifyData = verifyResponse.data as TokenResponse;
    
    if (!verifyData?.valid) {
      console.error('Verification response:', verifyResponse);
      throw new Error('Token verification failed');
    }

    console.log('✅ JWT token verified');

    return {
      token: tokenData.token,
      verified: true
    };
  } catch (error) {
    console.error('❌ JWT token test failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Test 3: Test protected endpoint access with JWT
 */
async function testProtectedEndpoint(token: string): Promise<any> {
  console.log('\n=== Testing Protected Endpoint ===');
  
  try {
    console.log('\nStep 1: Accessing protected endpoint with JWT...');
    const response = await makeRequest(`${API_URL}/protected`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Protected endpoint response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Protected endpoint test failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('Starting Better Auth JWT Tests...');
  
  try {
    // Test 1: OAuth Login
    const { user, token: userToken } = await testOAuthLogin();
    console.log(`✅ Logged in as: ${user.email}`);
    
    // Test 2: JWT Token
    const tokenResult = await testJwtToken(userToken);
    
    if (!tokenResult || !tokenResult.token) {
      throw new Error('Failed to get JWT token');
    }
    
    // Test 3: Protected Endpoint
    await testProtectedEndpoint(tokenResult.token);

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Unhandled error in test script:', error);
  process.exit(1);
});
