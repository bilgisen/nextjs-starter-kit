// Simple script to test JWT verification
const https = require('https');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testJWT() {
  console.log('=== Testing JWT Verification ===');
  
  try {
    // 1. First, try to get a session to see if we're already authenticated
    console.log('\n1. Checking session...');
    const sessionRes = await fetch(`${BASE_URL}/api/auth/session`);
    const sessionData = await sessionRes.json();
    
    console.log('Session status:', sessionRes.status);
    console.log('Session data:', JSON.stringify(sessionData, null, 2));
    
    // 2. Check for JWT token in response headers
    const jwtToken = sessionRes.headers.get('x-auth-jwt');
    
    if (jwtToken) {
      console.log('\n✅ Found JWT token in response headers');
      console.log('Token:', jwtToken);
      
      // 3. Test token verification
      console.log('\n2. Testing token verification...');
      const verifyRes = await fetch(`${BASE_URL}/api/auth/token/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify({ token: jwtToken })
      });
      
      const verifyData = await verifyRes.json();
      console.log('Verification status:', verifyRes.status);
      console.log('Verification response:', JSON.stringify(verifyData, null, 2));
      
      if (verifyRes.ok) {
        console.log('\n✅ JWT token is valid!');
      } else {
        console.log('\n❌ JWT token verification failed');
      }
    } else {
      console.log('\nℹ️ No JWT token found in session. You may need to log in first.');
      console.log('Try logging in at:', `${BASE_URL}/login`);
    }
    
  } catch (error) {
    console.error('\n❌ Error during JWT test:', error);
  }
}

// Run the test
testJWT();
