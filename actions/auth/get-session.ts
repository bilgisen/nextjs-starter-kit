'use server';

import { auth } from "@/lib/auth";
import { headers } from 'next/headers';

export async function getSession(request?: Request) {
  try {
    if (request) {
      // For API routes
      return await auth.api.getSession({
        headers: Object.fromEntries(new Headers(request.headers).entries())
      });
    } else {
      // For server components
      const headersList = await headers();
      return await auth.api.getSession({
        headers: Object.fromEntries(headersList.entries())
      });
    }
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}
