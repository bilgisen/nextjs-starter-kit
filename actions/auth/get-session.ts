'use server';

import { auth } from "@/lib/auth";
import { cookies, headers } from 'next/headers';

type Session = {
  user?: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
} | null;

export async function getSession(request?: Request): Promise<Session> {
  try {
    const headersObj = new Headers();
    
    if (request) {
      // For API routes
      request.headers.forEach((value: string, key: string) => {
        if (value) {
          headersObj.set(key, value);
        }
      });
    } else {
      // For server components and server actions
      const [headerList, cookieStore] = await Promise.all([
        headers(),
        cookies()
      ]);
      
      // Get cookies
      const cookie = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');
      if (cookie) headersObj.set('cookie', cookie);
      
      // Get authorization header
      const authHeader = headerList.get('authorization');
      if (authHeader) headersObj.set('authorization', authHeader);
    }
    
    // Ensure we have required headers
    if (!headersObj.has('user-agent')) {
      headersObj.set('user-agent', 'nextjs');
    }
    if (!headersObj.has('x-forwarded-for')) {
      headersObj.set('x-forwarded-for', '127.0.0.1');
    }
    
    return await auth.api.getSession({
      headers: headersObj
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}
