'use server';

import { auth } from "@/lib/auth";
import { cookies, headers } from 'next/headers';
import { NextRequest } from 'next/server';

type User = {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

type Session = {
  user?: User;
  accessToken?: string;
  idToken?: string;
  expires?: string;
} | null;

export async function getSession(request?: Request | NextRequest): Promise<Session> {
  try {
    // Create a new Headers object
    const headersObj = new Headers();
    let hasAuthHeader = false;
    
    // Debug: Log incoming request headers if available
    if (request) {
      console.log('📨 [getSession] Request headers available');
      
      // Create a new Headers object from the request
      const requestHeaders = new Headers();
      request.headers.forEach((value, key) => {
        console.log(`   ${key}: ${key.toLowerCase().includes('auth') ? '[REDACTED]' : value}`);
        requestHeaders.set(key, value);
      });
      
      // Process headers
      for (const [key, value] of requestHeaders.entries()) {
        if (value) {
          headersObj.set(key.toLowerCase(), value);
          if (key.toLowerCase() === 'authorization') {
            hasAuthHeader = true;
          }
        }
      }
      
      // If we have an auth header, ensure it's properly formatted
      if (hasAuthHeader) {
        const authHeader = headersObj.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7); // Remove 'Bearer ' prefix
          // Create a session with the token
          return {
            user: { id: 'temporary-user' }, // This will be replaced by the actual session
            accessToken: token,
            idToken: token, // Use the same token for both for now
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
          };
        }
      }
      
      // Ensure cookies are included if no auth header is present
      if (!hasAuthHeader) {
        const cookie = request.headers.get('cookie');
        if (cookie) {
          console.log('🍪 [getSession] Cookie found in request');
          headersObj.set('cookie', cookie);
        } else {
          console.warn('⚠️ [getSession] No cookie found in request headers');
        }
      }
    } else {
      console.log('🖥️ [getSession] No request object, using server context');
      const [headerList, cookieStore] = await Promise.all([headers(), cookies()]);
      
      // Check for auth header first
      const authHeader = headerList.get('authorization');
      if (authHeader) {
        console.log('🔑 [getSession] Authorization header found in server context');
        headersObj.set('authorization', authHeader);
        hasAuthHeader = true;
      } else {
        console.warn('⚠️ [getSession] No authorization header found in server context');
        
        // Only use cookies if no auth header is present
        const cookie = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
        if (cookie) {
          console.log('🍪 [getSession] Found cookies in server context');
          headersObj.set('cookie', cookie);
        }
      }
    }
    
    // For Bearer token authentication, ensure we have the required headers
    if (hasAuthHeader) {
      console.log('🔐 [getSession] Using Bearer token authentication');
      
      // Ensure we have a user-agent for the auth API
      if (!headersObj.has('user-agent')) {
        headersObj.set('user-agent', 'nextjs-server');
      }
      
      // Ensure we have x-forwarded-for for rate limiting
      if (!headersObj.has('x-forwarded-for')) {
        const forwardedFor = request?.headers?.get('x-forwarded-for');
        console.log(`🌐 [getSession] Setting x-forwarded-for for Bearer auth: ${forwardedFor || '127.0.0.1'}`);
        headersObj.set('x-forwarded-for', forwardedFor || '127.0.0.1');
      }
    } else {
      // For cookie-based authentication
      if (!headersObj.has('user-agent')) {
        console.log('🔄 [getSession] Adding default user-agent');
        headersObj.set('user-agent', 'nextjs');
      }
      
      if (!headersObj.has('x-forwarded-for')) {
        const forwardedFor = request?.headers?.get('x-forwarded-for');
        console.log(`🌐 [getSession] Setting x-forwarded-for: ${forwardedFor || '127.0.0.1'}`);
        headersObj.set('x-forwarded-for', forwardedFor || '127.0.0.1');
      }
    }
    
    // Log the final headers being sent to auth.api.getSession
    console.log('📤 [getSession] Final headers being sent to auth.api.getSession:');
    headersObj.forEach((value, key) => {
      console.log(`   ${key}: ${key.toLowerCase().includes('auth') || key.toLowerCase() === 'cookie' ? '[REDACTED]' : value}`);
    });
    
    // Call the auth API to validate the session
    console.log('🔐 [getSession] Calling auth.api.getSession');
    const session = await auth.api.getSession({
      headers: headersObj,
      query: {
        disableCookieCache: false,
        disableRefresh: false
      }
    });
    
    // Debug: Log the session result
    console.log('🔍 Session result:', session ? 'Valid session' : 'No valid session');
    
    return session;
  } catch (error) {
    console.error('Error in getSession:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}
