// Test script for Better Auth JWT functionality
// This script tests the JWT generation and verification flow using Better Auth

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Test user data - this should match a real user in your database
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword123';

// Helper function to make authenticated requests
async function makeAuthRequest(url: string, method: string = 'GET', body?: any, token?: string, cookies?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (cookies) {
    headers['Cookie'] = cookies;
  }
  
  const options: RequestInit = {
    method,
    headers,
    credentials: 'include' as RequestCredentials,
    redirect: 'manual' as const
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }
  
  return { 
    data, 
    headers: Object.fromEntries(response.headers.entries()),
    status: response.status,
    cookies: response.headers.get('set-cookie') || ''
  };
}

/**
 * Test 1: Login and get JWT token
 */
async function testLoginAndGetToken() {
  console.log('\n=== Testing Login and JWT Token Generation ===');
  
  try {
    console.log(`Attempting login with email: ${TEST_EMAIL}`);
    
    // First, login to get a session
    const loginResponse = await makeAuthRequest(
      `${API_URL}/auth/signin/email`,
      'POST',
      {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        callbackUrl: `${BASE_URL}/dashboard`
      }
    );
    
    console.log('Login response status:', loginResponse.status);
    
    // Get the session
    const sessionResponse = await makeAuthRequest(
      `${API_URL}/auth/session`,
      'GET',
      undefined,
      undefined,
      loginResponse.cookies
    );
    
    console.log('Session data:', JSON.stringify(sessionResponse.data, null, 2));
    
    if (!sessionResponse.data?.user) {
      throw new Error('No user in session');
    }
    
    // Get the JWT token
    const tokenResponse = await makeAuthRequest(
      `${API_URL}/auth/session`,
      'GET',
      undefined,
      undefined,
      loginResponse.cookies
    );
    
    // The token might be in the response or in the cookies
    const token = tokenResponse.data?.token || 
                 tokenResponse.cookies.match(/__Secure-next-auth.session-token=([^;]+)/)?.[1];
    
    if (!token) {
      throw new Error('Failed to get JWT token from session');
    }
    
    console.log('✅ Successfully logged in and got JWT token');
    return token;
  } catch (error) {
    console.error('❌ Login and token generation failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Test 2: Verify the JWT token using Better Auth
 */
async function testTokenVerification(token: string) {
  console.log('\n=== Testing JWT Token Verification ===');
  
  try {
    // Verify the token by making an authenticated request to a protected endpoint
    const response = await makeAuthRequest(
      `${API_URL}/auth/session`,
      'GET',
      undefined,
      token
    );
    
    if (!response.data?.user) {
      throw new Error('No user data in session');
    }
    
    console.log('✅ Token verified successfully');
    console.log('User data:', JSON.stringify(response.data.user, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Token verification failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Test 3: Test protected endpoint with JWT
 */
async function testProtectedEndpoint(token: string) {
  console.log('\n=== Testing Protected Endpoint with JWT ===');
  
  try {
    // Test a protected endpoint that requires JWT authentication
    const response = await makeAuthRequest(
      `${API_URL}/books/test-book/publish/epub`,
      'POST',
      {
        workflowId: 'test-workflow-123',
        bookSlug: 'test-book',
        options: {
          generate_toc: true,
          include_imprint: true
        }
      },
      token
    );
    
    console.log('✅ Successfully accessed protected endpoint with JWT');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Protected endpoint test failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    console.log('Starting Better Auth JWT Tests...');
    
    // Test 1: Login and get JWT token
    const token = await testLoginAndGetToken();
    
    if (!token) {
      throw new Error('No token received from login');
    }
    
    console.log('\n🔑 JWT Token:', token);
    
    // Test 2: Verify the JWT token
    await testTokenVerification(token);
    
    // Test 3: Test a protected endpoint with the JWT token
    await testProtectedEndpoint(token);
    
    console.log('\n✅ All Better Auth JWT tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
runTests();
