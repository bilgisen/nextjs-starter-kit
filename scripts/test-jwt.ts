import { createRemoteJWKSet, jwtVerify } from 'jose';
import { auth } from '@/lib/auth';
import { verifyWorkflowToken } from '@/lib/jwt/workflow-token';

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const JWKS_URI = `${BASE_URL}/api/auth/jwks`;

// Test user data
const testUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User'
};

// Test workflow data
const testWorkflow = {
  workflowId: 'test-workflow-123',
  bookSlug: 'test-book',
  userId: testUser.id
};

/**
 * Test 1: Generate a JWT token using Better Auth
 */
async function testTokenGeneration() {
  console.log('\n=== Testing JWT Token Generation ===');
  
  try {
    // Simulate getting a token from the auth endpoint
    const response = await fetch(`${BASE_URL}/api/auth/token`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get token: ${response.statusText}`);
    }

    const { token } = await response.json();
    
    if (!token) {
      throw new Error('No token received from auth endpoint');
    }

    console.log('✅ Successfully generated JWT token');
    return token;
  } catch (error) {
    console.error('❌ Token generation failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Test 2: Verify the JWT token using our workflow token verifier
 */
async function testTokenVerification(token: string) {
  console.log('\n=== Testing JWT Token Verification ===');
  
  try {
    const result = await verifyWorkflowToken(token);
    
    if (!result.isValid) {
      throw new Error(result.error || 'Token verification failed');
    }

    console.log('✅ Token verified successfully');
    console.log('Token payload:', JSON.stringify(result.payload, null, 2));
    return result.payload;
  } catch (error) {
    console.error('❌ Token verification failed:', error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Test 3: Test protected API endpoint
 */
async function testProtectedEndpoint(token: string) {
  console.log('\n=== Testing Protected Endpoint ===');
  
  try {
    const response = await fetch(`${BASE_URL}/api/books/${testWorkflow.bookSlug}/publish/epub`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        workflowId: testWorkflow.workflowId,
        bookSlug: testWorkflow.bookSlug,
        options: {
          generate_toc: true,
          include_imprint: true
        }
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Request failed');
    }

    console.log('✅ Successfully accessed protected endpoint');
    console.log('Response:', JSON.stringify(result, null, 2));
    return result;
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
    
    // Test 1: Generate token
    const token = await testTokenGeneration();
    
    // Test 2: Verify token
    const payload = await testTokenVerification(token);
    
    // Test 3: Test protected endpoint
    await testProtectedEndpoint(token);
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the tests
runTests();
