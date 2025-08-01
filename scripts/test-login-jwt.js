// Script to test login and JWT verification
const https = require('https');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword';

async function testLoginAndJWT() {
  console.log('=== Testing Login and JWT ===');
  
  try {
    // 1. Attempt to log in (adjust the endpoint and payload according to your auth flow)
    console.log('\n1. Attempting to log in...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/signin/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
      credentials: 'include', // Important for cookies
    });
    
    console.log('Login status:', loginRes.status);
    const loginData = await loginRes.json().catch(() => ({}));
    console.log('Login response:', JSON.stringify(loginData, null, 2));
    
    // 2. Check for JWT token in response headers or body
    const jwtToken = loginRes.headers.get('x-auth-jwt') || loginData.token;
    
    if (jwtToken) {
      console.log('\n✅ Login successful! JWT token received');
      console.log('Token:', jwtToken);
      
      // 3. Test token verification
      console.log('\n2. Verifying JWT token...');
      const verifyRes = await fetch(`${BASE_URL}/api/auth/token/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({ token: jwtToken })
      });
      
      const verifyData = await verifyRes.json().catch(() => ({}));
      console.log('Verification status:', verifyRes.status);
      console.log('Verification response:', JSON.stringify(verifyData, null, 2));
      
      if (verifyRes.ok) {
        console.log('\n✅ JWT token is valid!');
      } else {
        console.log('\n❌ JWT token verification failed');
      }
    } else {
      console.log('\n⚠️ No JWT token received after login. Check if the login was successful.');
      console.log('Response headers:', JSON.stringify([...loginRes.headers.entries()], null, 2));
    }
    
  } catch (error) {
    console.error('\n❌ Error during test:', error);
  }
}

// Run the test
testLoginAndJWT();
