import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Log basic request info
    console.log('🔍 Request method:', request.method);
    console.log('🔗 Request URL:', request.url);
    
    // Get cookies
    const cookies = request.cookies.getAll();
    console.log('🍪 Cookies:', cookies);

    // Get headers
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    console.log('📋 Request headers:', headers);
    
    // Get session
    console.log('🔑 Attempting to get session...');
    const session = await auth.api.getSession({
      headers: request.headers,
      query: {
        disableCookieCache: false,
        disableRefresh: false
      }
    });

    console.log('🔐 Session result:', session ? 'Valid session' : 'No valid session');
    
    return NextResponse.json({ 
      authenticated: !!session, 
      session,
      requestInfo: {
        hasCookies: cookies.length > 0,
        cookieNames: cookies.map(c => c.name),
        headers: Object.keys(headers)
      }
    });
  } catch (error) {
    console.error('❌ Auth test error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
