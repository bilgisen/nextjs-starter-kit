// Test script for Better Auth API endpoints
// This script tests the authentication flow by directly calling the API endpoints

// Configuration
const config = {
  BASE_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  get API_URL() { return `${this.BASE_URL}/api`; },
  // Session token from browser (should be replaced with a valid token from browser cookies)
  // Get this from your browser's Application > Storage > Cookies > http://localhost:3000
  SESSION_TOKEN: 'JcrODFZN0cWUFR9tB4DyVpWENpsNGRzD.N5F7f7YHoJLTLTg3XpCio9kwtH%2Bnat4gUQircKpdDBM%3D' // Session token from browser
};

// Store cookies for session persistence
const cookieStore: Record<string, string> = {
  // Initialize with the session cookie if available
  ...(config.SESSION_TOKEN && config.SESSION_TOKEN !== 'YOUR_SESSION_TOKEN_HERE' 
    ? { 'better-auth.session_token': config.SESSION_TOKEN }
    : {})
};

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

  if (includeCookies) {
    const cookies = Object.entries(cookieStore)
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
    if (cookies) {
      headers['Cookie'] = cookies;
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
  const newCookies = parseSetCookies(response.headers);
  Object.assign(cookieStore, newCookies);

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

interface TokenResponse {
  token?: string;
  valid?: boolean;
  error?: string;
}

interface ApiResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
}

/**
 * Test 1: Test the session endpoint
 */
async function testSession(): Promise<Session> {
  console.log('\n=== Testing Session Endpoint ===');
  
  try {
    console.log('\nStep 1: Getting current session...');
    const response = await makeRequest(`${config.API_URL}/auth/session`, {
      method: 'GET',
      includeCookies: true
    });

    const session = response.data as Session;
    console.log('Session:', session);
    
    if (session?.user) {
      console.log(`✅ Active session found for user: ${session.user.email}`);
    } else {
      console.log('ℹ️ No active session found');
    }
    
    return session;
  } catch (error) {
    console.error('❌ Session test failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Test 2: Test JWT token generation and verification
 */
async function testJwtToken() {
  console.log('\n=== Testing JWT Token Endpoints ===\n');

  try {
    // Get the JWT token using the session
    console.log('Step 1: Getting JWT token...');
    const tokenResponse = await makeRequest(`${config.API_URL}/auth/token`, {
      method: 'POST',
      body: {
        expiresIn: '1h',
        claims: {
          test: 'test-claim',
          workflowId: 'test-workflow-123'
        }
      },
      includeCookies: true
    });
    
    if (tokenResponse.status !== 200 || !(tokenResponse.data as TokenResponse).token) {
      throw new Error('Failed to generate JWT token');
    }
    
    const token = (tokenResponse.data as TokenResponse).token;
    console.log('✅ JWT token generated');
    
    // Test token verification
    console.log('\nStep 3: Verifying JWT token...');
    const verifyResponse = await makeRequest(`${config.API_URL}/auth/token/verify`, {
      method: 'POST',
      body: { token },
      includeCookies: true
    });
    
    if (verifyResponse.status !== 200 || !(verifyResponse.data as TokenResponse).valid) {
      throw new Error('Failed to verify JWT token');
    }
    
    console.log('✅ JWT token verified successfully');
    
  } catch (error) {
    console.error('❌ JWT token test failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('Starting Better Auth API Tests...');
  
  try {
    // Test 1: Check session
    const session = await testSession();
    
    if (!session?.user) {
      console.log('\n⚠️ No active session found. Some tests may fail without authentication.');
      console.log('Please log in via the web interface first, then run the tests again.');
      return;
    }
    
    // Test 2: JWT Token endpoints
    await testJwtToken();
    
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
