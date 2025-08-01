// Simple script to verify JWT functionality with better-auth
import { auth } from '@/lib/auth';

async function testJWT() {
  console.log('=== Testing Better Auth JWT Functionality ===');
  
  try {
    // 1. Test if auth is properly initialized
    console.log('\n1. Checking auth initialization...');
    if (!auth) {
      throw new Error('Auth not properly initialized');
    }
    console.log('✅ Auth is properly initialized');

    // 2. Try to get the current session
    console.log('\n2. Testing session retrieval...');
    const session = await auth.getSession();
    console.log('✅ Session data:', JSON.stringify(session, null, 2));

    // 3. Test JWT verification if a session exists
    if (session?.user) {
      console.log('\n3. Testing JWT verification...');
      try {
        // This will use the built-in JWT verification from better-auth
        const user = await auth.getUser();
        console.log('✅ JWT verification successful');
        console.log('User data:', JSON.stringify(user, null, 2));
      } catch (error) {
        console.error('❌ JWT verification failed:', error);
      }
    } else {
      console.log('\n⚠️ No active session found. Please log in first to test JWT verification.');
      console.log('   Run the following command to log in:');
      console.log('   curl -X POST http://localhost:3000/api/auth/signin/email -H "Content-Type: application/json" -d \'{"email":"your-email@example.com"}\'');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testJWT();
