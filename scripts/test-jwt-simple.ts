// Simple script to test JWT functionality with better-auth
const fetch = require('node-fetch');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function testJWT() {
  console.log('=== Testing Better Auth JWT Functionality ===');
  
  try {
    // 1. Make a request to the auth endpoint to get a token
    console.log('\n1. Testing auth endpoint...');
    const response = await fetch(`${BASE_URL}/api/auth/session`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Auth session data:', JSON.stringify(data, null, 2));
      
      // Check if we have a JWT token in the response
      const jwtToken = response.headers.get('x-auth-jwt') || data.token;
      if (jwtToken) {
        console.log('\n✅ JWT Token found in response');
        console.log('JWT Token:', jwtToken);
        
        // 2. Try to verify the token
        console.log('\n2. Verifying JWT token...');
        const verifyResponse = await fetch(`${BASE_URL}/api/auth/token/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`
          },
          body: JSON.stringify({ token: jwtToken })
        });
        
        const verifyData = await verifyResponse.json();
        console.log('Verification response:', JSON.stringify(verifyData, null, 2));
        
        if (verifyResponse.ok) {
          console.log('✅ JWT token is valid');
        } else {
          console.error('❌ JWT token verification failed:', verifyData);
        }
      } else {
        console.log('\n⚠️ No JWT token found in the response. You might need to log in first.');
      }
    } else {
      console.error('❌ Failed to get auth session:', data);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testJWT();
