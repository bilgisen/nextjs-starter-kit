// Simple script to test the authentication flow with better-auth
const https = require('https');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Helper function to make HTTP requests
async function fetchWithLog(url, options = {}) {
  console.log(`\n${options.method || 'GET'} ${url}`);
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Important for cookies
  });
  
  const data = await response.json().catch(() => ({}));
  
  console.log(`Status: ${response.status} ${response.statusText}`);
  console.log('Headers:', JSON.stringify([...response.headers.entries()], null, 2));
  console.log('Response:', JSON.stringify(data, null, 2));
  
  return { response, data };
}

async function testAuthFlow() {
  console.log('=== Testing Better Auth Flow ===');
  
  try {
    // 1. Check current session
    console.log('\n1. Checking current session...');
    const { response: sessionRes, data: sessionData } = await fetchWithLog(
      `${BASE_URL}/api/auth/session`
    );
    
    // 2. If not authenticated, try to log in with email
    if (sessionRes.status === 200 && !sessionData.user) {
      console.log('\n2. Not authenticated. Attempting email login...');
      const { response: loginRes, data: loginData } = await fetchWithLog(
        `${BASE_URL}/api/auth/signin/email`,
        {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            callbackUrl: `${BASE_URL}/dashboard`,
          }),
        }
      );
      
      if (loginRes.ok) {
        console.log('\n✅ Login email sent. Please check your email to complete the login.');
        return;
      }
    } else if (sessionData.user) {
      console.log('\n✅ Already authenticated as:', sessionData.user.email);
    }
    
    // 3. Check for JWT token in session response
    const jwtToken = sessionRes.headers.get('x-auth-jwt');
    
    if (jwtToken) {
      console.log('\n3. Found JWT token. Verifying...');
      const { response: verifyRes } = await fetchWithLog(
        `${BASE_URL}/api/auth/token/verify`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwtToken}`
          },
          body: JSON.stringify({ token: jwtToken })
        }
      );
      
      if (verifyRes.ok) {
        console.log('\n✅ JWT token is valid!');
      } else {
        console.log('\n❌ JWT token verification failed');
      }
    } else {
      console.log('\nℹ️ No JWT token found in the session response');
    }
    
  } catch (error) {
    console.error('\n❌ Error during auth flow test:', error);
  }
}

// Run the test
testAuthFlow();
