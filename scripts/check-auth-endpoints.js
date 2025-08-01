// Script to check available auth endpoints and test JWT functionality
const https = require('https');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// List of auth endpoints to test
const AUTH_ENDPOINTS = [
  { path: '/api/auth/session', method: 'GET' },
  { path: '/api/auth/token', method: 'GET' },
  { path: '/api/auth/token/verify', method: 'POST' },
  { path: '/api/auth/test', method: 'GET' },
  { path: '/api/auth/test-jwt', method: 'GET' },
  { path: '/api/auth/debug', method: 'GET' },
];

// Helper function to make HTTP requests
async function testEndpoint(url, method = 'GET', body = null) {
  console.log(`\n${method} ${url}`);
  
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  };
  
  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Headers:', JSON.stringify([...response.headers.entries()], null, 2));
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return { response, data };
  } catch (error) {
    console.error('Request failed:', error);
    return { error };
  }
}

// Test token verification with a sample token
async function testTokenVerification() {
  console.log('\n=== Testing JWT Token Verification ===');
  
  // First, get a token from the session
  const { response: sessionRes } = await testEndpoint(`${BASE_URL}/api/auth/session`);
  const jwtToken = sessionRes?.headers?.get('x-auth-jwt');
  
  if (jwtToken) {
    console.log('\nFound JWT token in session response. Verifying...');
    await testEndpoint(
      `${BASE_URL}/api/auth/token/verify`,
      'POST',
      { token: jwtToken }
    );
  } else {
    console.log('\nNo JWT token found in session response.');
  }
}

// Main function to test all endpoints
async function testAllEndpoints() {
  console.log('=== Testing Auth Endpoints ===');
  
  // Test each endpoint
  for (const endpoint of AUTH_ENDPOINTS) {
    await testEndpoint(
      `${BASE_URL}${endpoint.path}`,
      endpoint.method,
      endpoint.method === 'POST' ? {} : null
    );
  }
  
  // Test token verification
  await testTokenVerification();
  
  console.log('\n=== Test Complete ===');
}

// Run the tests
testAllEndpoints().catch(console.error);
