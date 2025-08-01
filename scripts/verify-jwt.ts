import { createSigner, createVerifier } from 'fast-jwt';
import { auth } from '@/lib/auth';

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Create JWT signer and verifier
const signJWT = createSigner({
  key: JWT_SECRET,
  expiresIn: 60 * 60 * 1000, // 1 hour
});

const verifyJWT = createVerifier({
  key: JWT_SECRET,
});

// Test user data
const testUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User'
};

/**
 * Test 1: Generate a JWT token
 */
async function testTokenGeneration() {
  console.log('\n=== Testing JWT Token Generation ===');
  
  try {
    const token = await signJWT({
      sub: testUser.id,
      email: testUser.email,
      name: testUser.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    });
    
    if (!token) {
      throw new Error('Failed to generate JWT token');
    }

    console.log('✅ Successfully generated JWT token');
    return token;
  } catch (error) {
    console.error('❌ Error generating JWT token:', error);
    throw error;
  }
}

/**
 * Test 2: Verify the JWT token
 */
async function testTokenVerification(token: string) {
  console.log('\n=== Testing JWT Token Verification ===');
  
  try {
    const payload = await verifyJWT(token);
    console.log('✅ Successfully verified JWT token');
    console.log('Token payload:', JSON.stringify(payload, null, 2));
    return payload;
  } catch (error) {
    console.error('❌ Error verifying JWT token:', error);
    throw error;
  }
}

/**
 * Test 3: Test protected API endpoint
 */
async function testProtectedEndpoint(token: string) {
  console.log('\n=== Testing Protected Endpoint ===');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to access protected endpoint');
    }

    console.log('✅ Successfully accessed protected endpoint');
    console.log('User data:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ Error accessing protected endpoint:', error);
    throw error;
  }
}

// Run all tests
async function runTests() {
  try {
    console.log('Starting JWT tests...');
    
    // Test 1: Generate token
    const token = await testTokenGeneration();
    
    // Test 2: Verify token
    await testTokenVerification(token);
    
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
